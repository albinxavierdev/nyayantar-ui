"""
Security primitives for the Nyayantar API.

- Signed session tokens (HMAC-SHA256, stdlib only — no extra dependency).
- Password hashing (bcrypt).
- In-memory user store seeded from env / users.json (multi-user).
- Failed-login tracking with account lockout and per-IP brute-force banning.
- Structured audit logging of auth/access events.
"""
from __future__ import annotations

import os
import json
import time
import hmac
import hashlib
import logging
import ipaddress
from pathlib import Path
from typing import Optional, Dict, List

import bcrypt

logger = logging.getLogger("nyayantar.security")

SESSION_TTL_SECONDS = int(os.getenv("SESSION_MAX_AGE", str(60 * 60 * 8)))
SECRET_KEY = os.getenv("SECRET_KEY", "")
if not SECRET_KEY:
    if os.getenv("AUTH_DISABLED", "false").lower() != "true":
        logger.error("SECRET_KEY not set. Refusing to start (signed sessions require it).")
        raise RuntimeError("SECRET_KEY is required. Set SECRET_KEY before deploying.")

# ---------------------------------------------------------------------------
# Signed session tokens (HMAC, not encrypted — payload is email+role only).
# ---------------------------------------------------------------------------
def _b64encode(data: bytes) -> str:
    import base64

    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64decode(data: str) -> bytes:
    import base64

    pad = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + pad)


_SEP = "\x1f"  # unit separator — never appears in emails/roles


def create_session_token(email: str, role: str) -> str:
    """Return a signed, timestamped session token: payload.signature."""
    payload = _b64encode(f"{int(time.time())}{_SEP}{email}{_SEP}{role}".encode())
    sig = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}.{sig}"


def verify_session_token(token: Optional[str]) -> Optional[Dict[str, str]]:
    """Validate signature + TTL. Returns {'email','role'} or None."""
    if not token or not SECRET_KEY:
        return None
    try:
        payload, sig = token.rsplit(".", 1)
    except ValueError:
        return None
    expected = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, sig):
        return None
    try:
        raw = _b64decode(payload).decode()
        ts_str, email, role = raw.split(_SEP, 2)
        ts = int(ts_str)
    except Exception:
        return None
    if time.time() - ts > SESSION_TTL_SECONDS:
        return None
    return {"email": email, "role": role}


# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except (ValueError, TypeError):
        return False


# ---------------------------------------------------------------------------
# User store (multi-user). Seeded from users.json or AUTH_USER/AUTH_PASSWORD.
# ---------------------------------------------------------------------------
USERS_FILE = Path(os.getenv("USERS_FILE", "users.json"))


def _load_users() -> Dict[str, Dict]:
    users: Dict[str, Dict] = {}
    # Legacy single-credential fallback.
    au, ap = os.getenv("AUTH_USER", ""), os.getenv("AUTH_PASSWORD", "")
    if au and ap:
        users[au.strip().lower()] = {
            "email": au.strip().lower(),
            "password_hash": hash_password(ap),
            "role": "admin" if au.strip().lower() in ADMIN_EMAIL_SET else "user",
        }
    if USERS_FILE.exists():
        try:
            data = json.loads(USERS_FILE.read_text())
            for u in data.get("users", []):
                users[u["email"].strip().lower()] = {
                    "email": u["email"].strip().lower(),
                    "password_hash": u["password_hash"],
                    "role": u.get("role", "user"),
                }
        except Exception as e:  # pragma: no cover - defensive
            logger.error("Failed to load users.json: %s", e)
    return users


ADMIN_EMAIL_SET = {
    e.strip().lower() for e in os.getenv("ADMIN_EMAILS", "").split(",") if e.strip()
}


def _load_users() -> Dict[str, Dict]:  # noqa: F811 - redefined below if DB available
    return {}


# ---------------------------------------------------------------------------
# Database-backed user store. Falls back to the legacy in-memory/file store
# only if the db module cannot be imported (e.g. extremely early boot).
# ---------------------------------------------------------------------------
try:
    import db as _db

    _DB_AVAILABLE = True
except Exception:  # pragma: no cover - defensive
    _DB_AVAILABLE = False

USERS: Dict[str, Dict] = _load_users()
if _DB_AVAILABLE:
    # Ensure the schema exists and seed from users.json / env once at import.
    _db.init_db()
    _db.seed_users_from_env_and_file()


def get_user_record(email: str) -> Optional[Dict]:
    """Return a user record from the DB, or None."""
    if not _DB_AVAILABLE:
        return USERS.get(email.strip().lower())
    return _db.get_user(email)


def authenticate_user(email: str, password: str) -> Optional[Dict]:
    if _DB_AVAILABLE:
        rec = _db.get_user(email)
    else:
        rec = USERS.get(email.strip().lower())
    if not rec:
        return None
    if not verify_password(password, rec["password_hash"]):
        return None
    return {"email": rec["email"], "role": rec.get("role", "user")}


# ---------------------------------------------------------------------------
# Failed-login tracking: account lockout + per-IP brute-force ban.
# ---------------------------------------------------------------------------
MAX_FAILED = int(os.getenv("MAX_FAILED_LOGINS", "5"))
LOCKOUT_SECONDS = int(os.getenv("LOCKOUT_SECONDS", "300"))
IP_BAN_THRESHOLD = int(os.getenv("IP_BAN_THRESHOLD", "50"))

_failed: Dict[str, List[float]] = {}      # key: email|ip
_banned_ip: Dict[str, float] = {}         # ip -> ban expiry


def _client_ip(request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _clean(window: List[float]) -> List[float]:
    cutoff = time.time() - LOCKOUT_SECONDS
    return [t for t in window if t > cutoff]


def register_failure(key: str) -> None:
    _failed.setdefault(key, [])
    _failed[key] = _clean(_failed[key])
    _failed[key].append(time.time())


def failure_count(key: str) -> int:
    _failed[key] = _clean(_failed.get(key, []))
    return len(_failed[key])


def is_locked(key: str) -> bool:
    return failure_count(key) >= MAX_FAILED


def is_ip_banned(ip: str) -> bool:
    exp = _banned_ip.get(ip)
    if exp and exp > time.time():
        return True
    if exp:
        del _banned_ip[ip]
    return False


def maybe_ban_ip(ip: str) -> None:
    if failure_count(ip) >= IP_BAN_THRESHOLD:
        _banned_ip[ip] = time.time() + LOCKOUT_SECONDS * 2
        logger.warning("IP banned for brute force: %s", ip)


def reset_failures(key: str) -> None:
    _failed.pop(key, None)


# ---------------------------------------------------------------------------
# CAPTCHA (hCaptcha) verification
# ---------------------------------------------------------------------------
def verify_captcha(token: Optional[str]) -> bool:
    secret = os.getenv("HCAPTCHA_SECRET", "")
    if not secret:
        # No CAPTCHA configured -> treat as not required.
        return True
    if not token:
        return False
    try:
        import urllib.request

        data = urllib.parse.urlencode({"secret": secret, "response": token}).encode()
        req = urllib.request.Request(
            "https://hcaptcha.com/siteverify", data=data, method="POST"
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            result = json.loads(resp.read().decode())
        return bool(result.get("success"))
    except Exception as e:
        logger.error("CAPTCHA verify error: %s", e)
        return False


# ---------------------------------------------------------------------------
# Audit logging
# ---------------------------------------------------------------------------
audit = logging.getLogger("nyayantar.audit")
if not audit.handlers:
    _ah = logging.StreamHandler()
    _ah.setFormatter(logging.Formatter("%(asctime)s AUDIT %(message)s"))
    audit.addHandler(_ah)
    audit.setLevel(logging.INFO)
    audit.propagate = False


def audit_event(event: str, **fields) -> None:
    parts = " ".join(f"{k}={v}" for k, v in fields.items())
    audit.info("%s %s", event, parts)
    # Persist to the application database so audit events survive restarts.
    if _DB_AVAILABLE:
        try:
            email = fields.get("email")
            ip = fields.get("ip")
            _db.save_audit(event, email=email, ip=ip, detail=parts or None)
        except Exception as e:  # pragma: no cover - never break the request path
            logger.error("audit_event DB write failed: %s", e)


def persist_session(token: str, email: str, role: str, expires_at: float,
                    ip: Optional[str] = None) -> None:
    """Persist a newly issued session to the database."""
    if not _DB_AVAILABLE:
        return
    try:
        _db.save_session(token, email, role, expires_at, ip=ip)
    except Exception as e:  # pragma: no cover - never break the request path
        logger.error("persist_session DB write failed: %s", e)


def revoke_session_token(token: str) -> None:
    """Mark a session revoked in the database."""
    if not _DB_AVAILABLE:
        return
    try:
        _db.revoke_session(token)
    except Exception as e:  # pragma: no cover
        logger.error("revoke_session_token DB write failed: %s", e)
