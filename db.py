"""
Central application database for Nyayantar.

This module owns the single SQLite database used to persist all
runtime-generated application data that previously lived only in memory
or flat files:

  - users      : accounts (seeded from users.json / env)
  - sessions   : active signed-session records
  - queries    : every user query + generated response + routing/metadata
  - audit_log  : structured auth / access / security events

The document search index (index/document_index.db) is a SEPARATE database
and is intentionally untouched here.

Only stdlib (sqlite3) is used so no new dependencies are required.
"""
from __future__ import annotations

import os
import json
import time
import sqlite3
from pathlib import Path
from typing import Optional, Dict, List, Any

# ---------------------------------------------------------------------------
# Connection management
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).parent
DATA_DIR = PROJECT_ROOT / "data"
DB_PATH = Path(os.getenv("APP_DB_PATH", str(DATA_DIR / "app.db")))

_schema_initialized = False


def _connect() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db() -> None:
    """Create tables if they do not exist and seed users. Idempotent."""
    global _schema_initialized
    conn = _connect()
    try:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                email         TEXT UNIQUE NOT NULL,
                password_hash TEXT,
                role          TEXT NOT NULL DEFAULT 'user',
                provider      TEXT NOT NULL DEFAULT 'local',
                name          TEXT,
                plan          TEXT NOT NULL DEFAULT 'free',
                purchased     INTEGER NOT NULL DEFAULT 0,
                created_at    REAL NOT NULL,
                updated_at    REAL NOT NULL
            );

            CREATE TABLE IF NOT EXISTS sessions (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                token        TEXT UNIQUE NOT NULL,
                email        TEXT NOT NULL,
                role         TEXT NOT NULL,
                created_at   REAL NOT NULL,
                expires_at   REAL NOT NULL,
                ip           TEXT,
                revoked      INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS queries (
                id                 INTEGER PRIMARY KEY AUTOINCREMENT,
                email             TEXT,
                query             TEXT NOT NULL,
                routed_agent      TEXT,
                final_response    TEXT,
                entities          TEXT,
                sources           TEXT,
                retrieval_time    REAL,
                llm_time          REAL,
                total_time        REAL,
                web_search        INTEGER NOT NULL DEFAULT 0,
                error             INTEGER NOT NULL DEFAULT 0,
                created_at        REAL NOT NULL
            );

            CREATE TABLE IF NOT EXISTS audit_log (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                event       TEXT NOT NULL,
                email       TEXT,
                ip          TEXT,
                detail      TEXT,
                created_at  REAL NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_sessions_email  ON sessions(email);
            CREATE INDEX IF NOT EXISTS idx_queries_email   ON queries(email);
            CREATE INDEX IF NOT EXISTS idx_queries_created ON queries(created_at);
            CREATE INDEX IF NOT EXISTS idx_audit_event     ON audit_log(event);
            CREATE INDEX IF NOT EXISTS idx_audit_created   ON audit_log(created_at);
            """
        )
        conn.commit()

        # Migrate any pre-existing tables that are missing columns added
        # after their initial creation (CREATE TABLE IF NOT EXISTS cannot
        # alter an existing table).
        _migrate_columns(conn, "users", {
            "name": "TEXT",
            "plan": "TEXT NOT NULL DEFAULT 'free'",
            "purchased": "INTEGER NOT NULL DEFAULT 0",
        })
        conn.commit()
    finally:
        conn.close()
    _schema_initialized = True


def _migrate_columns(conn: sqlite3.Connection, table: str, columns: Dict[str, str]) -> None:
    """Add any missing columns to an existing table."""
    existing = {row[1] for row in conn.execute(f"PRAGMA table_info({table})")}
    for col, definition in columns.items():
        if col not in existing:
            conn.execute(f"ALTER TABLE {table} ADD COLUMN {col} {definition}")


def _ensure() -> None:
    if not _schema_initialized:
        init_db()


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------
def get_user(email: str) -> Optional[Dict[str, Any]]:
    _ensure()
    conn = _connect()
    try:
        row = conn.execute(
            "SELECT email, password_hash, role, provider, name, plan, purchased FROM users WHERE email = ?",
            (email.strip().lower(),),
        ).fetchone()
        if not row:
            return None
        rec = dict(row)
        rec["purchased"] = bool(rec.get("purchased"))
        return rec
    finally:
        conn.close()


def create_user(
    email: str,
    password_hash: Optional[str],
    role: str = "user",
    provider: str = "local",
    name: Optional[str] = None,
) -> Dict[str, Any]:
    _ensure()
    email = email.strip().lower()
    now = time.time()
    conn = _connect()
    try:
        conn.execute(
            """INSERT INTO users (email, password_hash, role, provider, name, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(email) DO UPDATE SET
                    password_hash = excluded.password_hash,
                    role = excluded.role,
                    provider = excluded.provider,
                    name = COALESCE(excluded.name, users.name),
                    updated_at = excluded.updated_at""",
            (email, password_hash, role, provider, name, now, now),
        )
        conn.commit()
    finally:
        conn.close()
    return {"email": email, "password_hash": password_hash, "role": role, "name": name}


def list_users() -> List[Dict[str, Any]]:
    _ensure()
    conn = _connect()
    try:
        rows = conn.execute(
            "SELECT email, role, provider, name, plan, purchased, created_at FROM users ORDER BY created_at"
        ).fetchall()
        return [_row_to_public_user(dict(r)) for r in rows]
    finally:
        conn.close()


def _row_to_public_user(rec: Dict[str, Any]) -> Dict[str, Any]:
    """Return a safe public projection of a user (never includes password_hash)."""
    rec = dict(rec)
    rec.pop("password_hash", None)
    rec["purchased"] = bool(rec.get("purchased"))
    return rec


def get_profile(email: str) -> Optional[Dict[str, Any]]:
    """Public profile projection for the given user (no password_hash)."""
    rec = get_user(email)
    if not rec:
        return None
    return _row_to_public_user(rec)


def update_user(
    email: str,
    name: Optional[str] = None,
    plan: Optional[str] = None,
    purchased: Optional[bool] = None,
) -> Optional[Dict[str, Any]]:
    """Update mutable profile fields for a user. Returns the public profile or None."""
    _ensure()
    email = email.strip().lower()
    existing = get_user(email)
    if not existing:
        return None
    now = time.time()
    conn = _connect()
    try:
        conn.execute(
            """UPDATE users SET
                   name = COALESCE(?, name),
                   plan = COALESCE(?, plan),
                   purchased = COALESCE(?, purchased),
                   updated_at = ?
               WHERE email = ?""",
            (
                name if name is not None else existing.get("name"),
                plan if plan is not None else existing.get("plan"),
                (1 if purchased else 0) if purchased is not None else existing.get("purchased"),
                now,
                email,
            ),
        )
        conn.commit()
    finally:
        conn.close()
    return get_profile(email)


def seed_users_from_env_and_file() -> None:
    """Seed the users table from users.json and AUTH_USER/AUTH_PASSWORD.

    Existing DB rows are preserved; this only adds/updates from the seed
    sources. bcrypt hashing is imported lazily to avoid a hard dependency
    when seeding is not needed.
    """
    import security as _sec  # local import to avoid circular import

    seeded: Dict[str, Dict] = {}

    # Environment single-credential fallback
    au, ap = os.getenv("AUTH_USER", ""), os.getenv("AUTH_PASSWORD", "")
    if au and ap:
        seeded[au.strip().lower()] = {
            "email": au.strip().lower(),
            "password_hash": _sec.hash_password(ap),
            "role": "admin" if au.strip().lower() in _sec.ADMIN_EMAIL_SET else "user",
        }

    # users.json
    users_file = Path(os.getenv("USERS_FILE", "users.json"))
    if users_file.exists():
        try:
            data = json.loads(users_file.read_text())
            for u in data.get("users", []):
                seeded[u["email"].strip().lower()] = {
                    "email": u["email"].strip().lower(),
                    "password_hash": u["password_hash"],
                    "role": u.get("role", "user"),
                }
        except Exception as e:  # pragma: no cover - defensive
            import logging
            logging.getLogger("nyayantar.db").error("Failed to load users.json: %s", e)

    for rec in seeded.values():
        create_user(
            rec["email"],
            rec["password_hash"],
            rec["role"],
            provider="local",
            name=rec.get("name"),
        )


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------
def save_session(
    token: str,
    email: str,
    role: str,
    expires_at: float,
    ip: Optional[str] = None,
) -> None:
    _ensure()
    conn = _connect()
    try:
        conn.execute(
            """INSERT OR IGNORE INTO sessions (token, email, role, created_at, expires_at, ip, revoked)
               VALUES (?, ?, ?, ?, ?, ?, 0)""",
            (token, email.strip().lower(), role, time.time(), expires_at, ip),
        )
        conn.commit()
    finally:
        conn.close()


def revoke_session(token: str) -> None:
    _ensure()
    conn = _connect()
    try:
        conn.execute("UPDATE sessions SET revoked = 1 WHERE token = ?", (token,))
        conn.commit()
    finally:
        conn.close()


def purge_expired_sessions() -> None:
    _ensure()
    conn = _connect()
    try:
        conn.execute("DELETE FROM sessions WHERE expires_at < ? AND revoked = 0",
                     (time.time(),))
        conn.commit()
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Queries
# ---------------------------------------------------------------------------
def save_query(
    query: str,
    email: Optional[str] = None,
    routed_agent: Optional[str] = None,
    final_response: Optional[str] = None,
    entities: Optional[List[Dict]] = None,
    sources: Optional[List[Dict]] = None,
    retrieval_time: Optional[float] = None,
    llm_time: Optional[float] = None,
    total_time: Optional[float] = None,
    web_search: bool = False,
    error: bool = False,
) -> int:
    _ensure()
    conn = _connect()
    try:
        cur = conn.execute(
            """INSERT INTO queries
               (email, query, routed_agent, final_response, entities, sources,
                retrieval_time, llm_time, total_time, web_search, error, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                email.strip().lower() if email else None,
                query,
                routed_agent,
                final_response,
                json.dumps(entities or [], ensure_ascii=False),
                json.dumps(sources or [], ensure_ascii=False),
                retrieval_time,
                llm_time,
                total_time,
                1 if web_search else 0,
                1 if error else 0,
                time.time(),
            ),
        )
        conn.commit()
        return cur.lastrowid
    finally:
        conn.close()


def query_count() -> int:
    _ensure()
    conn = _connect()
    try:
        row = conn.execute("SELECT COUNT(*) AS c FROM queries").fetchone()
        return int(row["c"])
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Audit log
# ---------------------------------------------------------------------------
def save_audit(event: str, email: Optional[str] = None, ip: Optional[str] = None,
               detail: Optional[str] = None) -> None:
    _ensure()
    conn = _connect()
    try:
        conn.execute(
            "INSERT INTO audit_log (event, email, ip, detail, created_at) VALUES (?, ?, ?, ?, ?)",
            (event, email.strip().lower() if email else None, ip, detail, time.time()),
        )
        conn.commit()
    finally:
        conn.close()


def audit_count() -> int:
    _ensure()
    conn = _connect()
    try:
        row = conn.execute("SELECT COUNT(*) AS c FROM audit_log").fetchone()
        return int(row["c"])
    finally:
        conn.close()
