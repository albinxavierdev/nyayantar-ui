"""
Security tests for the Nyayantar API.

Run with:  pytest tests/test_security.py
Env (set by CI / conftest): API_KEY, SECRET_KEY, USERS_FILE, ADMIN_EMAILS
"""
import os
import json
import importlib

import bcrypt
import pytest
from fastapi.testclient import TestClient

import security
import api


@pytest.fixture(scope="session", autouse=True)
def _env(tmp_path_factory):
    users = tmp_path_factory.mktemp("u") / "users.json"
    users.write_text(
        json.dumps(
            {
                "users": [
                    {
                        "email": "user@firm.com",
                        "password_hash": bcrypt.hashpw(b"pw123", bcrypt.gensalt()).decode(),
                        "role": "user",
                    },
                    {
                        "email": "admin@firm.com",
                        "password_hash": bcrypt.hashpw(b"adminpw", bcrypt.gensalt()).decode(),
                        "role": "admin",
                    },
                ]
            }
        )
    )
    os.environ["API_KEY"] = "test-api-key"
    os.environ["SECRET_KEY"] = "test-secret-key-for-tests-only"
    os.environ["USERS_FILE"] = str(users)
    os.environ["ADMIN_EMAILS"] = "admin@firm.com"
    os.environ["MAX_FAILED_LOGINS"] = "2"
    # Reload security first (loads users), then api (imports security).
    importlib.reload(security)
    importlib.reload(api)
    yield


@pytest.fixture
def client():
    return TestClient(api.app)


def _login(client, email, password, captcha=None):
    body = {"email": email, "password": password}
    if captcha is not None:
        body["captcha"] = captcha
    return client.post("/auth/login", json=body)


def _auth_cookies(client, email, password, captcha="x"):
    r = _login(client, email, password, captcha)
    assert r.status_code == 200, r.text
    c = TestClient(api.app)
    c.cookies.set("ny_session", r.cookies.get("ny_session"))
    return c


# ── Auth ────────────────────────────────────────────────────────────────
def test_missing_auth_rejected(client):
    assert client.post("/query", json={"query": "x"}).status_code == 401


def test_wrong_password_rejected(client):
    assert _login(client, "user@firm.com", "wrong").status_code == 401


def test_correct_login_sets_signed_cookie(client):
    r = _login(client, "user@firm.com", "pw123", captcha="x")
    assert r.status_code == 200
    assert "ny_session" in r.cookies
    sc = r.headers.get("set-cookie", "")
    assert "httponly" in sc.lower()
    assert "samesite" in sc.lower()


def test_signed_session_accesses_protected_route(client):
    c = _auth_cookies(client, "user@firm.com", "pw123")
    # No CSRF header -> 403
    assert c.post("/query", json={"query": "x"}).status_code == 403
    # With CSRF header -> auth passes (503 = models not loaded, expected)
    assert (
        c.post("/query", json={"query": "x"}, headers={"X-Requested-With": "nyayantar"}).status_code
        == 503
    )


def test_tampered_session_rejected(client):
    c = TestClient(api.app)
    c.cookies.set("ny_session", "tampered.sig")
    res = c.post(
        "/query", json={"query": "x"}, headers={"X-Requested-With": "nyayantar"}
    )
    assert res.status_code == 401


# ── Account lockout + CAPTCHA ───────────────────────────────────────────
def test_account_lockout_then_captcha_required(client):
    assert _login(client, "user@firm.com", "wrong").status_code == 401
    assert _login(client, "user@firm.com", "wrong").status_code == 401
    assert _login(client, "user@firm.com", "pw123").status_code == 429
    assert _login(client, "user@firm.com", "pw123", captcha="x").status_code == 200


# ── Role enforcement ────────────────────────────────────────────────────
def test_user_cannot_access_admin(client):
    c = _auth_cookies(client, "user@firm.com", "pw123")
    res = c.get("/admin/stats", headers={"X-Requested-With": "nyayantar"})
    assert res.status_code == 403


def test_admin_can_access_admin(client):
    c = _auth_cookies(client, "admin@firm.com", "adminpw")
    res = c.get("/admin/stats", headers={"X-Requested-With": "nyayantar"})
    assert res.status_code == 200


# ── Input limits ───────────────────────────────────────────────────────
def test_oversized_query_rejected(client):
    c = _auth_cookies(client, "user@firm.com", "pw123")
    res = c.post(
        "/query", json={"query": "x" * 5000}, headers={"X-Requested-With": "nyayantar"}
    )
    assert res.status_code == 422


def test_oversized_body_rejected(client):
    big = " " * 600000
    res = client.post(
        "/query",
        content=big,
        headers={"Content-Type": "application/json", "X-Requested-With": "nyayantar"},
    )
    assert res.status_code in (401, 413)


# ── Security headers at API layer ───────────────────────────────────────
def test_security_headers_present(client):
    h = client.get("/health").headers
    assert h.get("x-frame-options", "").upper() == "DENY"
    assert "strict-transport-security" in h
    assert "nosniff" in h.get("x-content-type-options", "").lower()


# ── Error masking ───────────────────────────────────────────────────────
def test_root_does_not_leak_secrets(client):
    data = client.get("/").json()
    assert "groq_configured" not in data
    assert "qwen_loaded" not in data
