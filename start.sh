#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────
# Nyayantar — Startup Script
# Kills existing processes, then starts backend + webapp
# Usage: ./start.sh [restart]
# ──────────────────────────────────────────────────────────
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PORT=8020
WEBAPP_PORT=3000
BACKEND_LOG="$ROOT_DIR/.logs/backend.log"
WEBAPP_LOG="$ROOT_DIR/.logs/webapp.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log()  { echo -e "${CYAN}[nyayantar]${NC} $1"; }
ok()   { echo -e "${GREEN}[nyayantar]${NC} $1"; }
warn() { echo -e "${YELLOW}[nyayantar]${NC} $1"; }
err()  { echo -e "${RED}[nyayantar]${NC} $1"; }

MODE="${1:-start}"

if [ "$MODE" = "restart" ]; then
  log "Restarting Nyayantar services..."
else
  log "Checking for existing processes..."
fi

# ── 1. Kill existing processes ────────────────────────────
kill_port() {
  local port=$1
  local pids
  pids=$(lsof -ti:"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    warn "Killing process(es) on port $port: $pids"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  else
    ok "Port $port is free"
  fi
}

kill_port $BACKEND_PORT
kill_port $WEBAPP_PORT

# ── 2. Create log directory ──────────────────────────────
mkdir -p "$ROOT_DIR/.logs"

# ── 3. Start Backend ────────────────────────────────────
log "Starting backend (FastAPI on :$BACKEND_PORT)..."

if [ ! -d "$ROOT_DIR/venv" ]; then
  err "Python venv not found at $ROOT_DIR/venv"
  err "Run: python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
  exit 1
fi

source "$ROOT_DIR/venv/bin/activate"

cd "$ROOT_DIR"
nohup python3 main.py > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
echo "$BACKEND_PID" > "$ROOT_DIR/.logs/backend.pid"

# Wait for backend to be ready (up to 60s — models take time to load)
log "Waiting for backend to be ready (loading models)..."
TRIES=0
MAX_TRIES=60
while [ $TRIES -lt $MAX_TRIES ]; do
  if curl -s -o /dev/null -w '' "http://127.0.0.1:$BACKEND_PORT/" 2>/dev/null; then
    break
  fi
  # Check if process is still alive
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    err "Backend process died. Check logs: $BACKEND_LOG"
    tail -20 "$BACKEND_LOG"
    exit 1
  fi
  sleep 2
  TRIES=$((TRIES + 1))
  printf "."
done
echo ""

if [ $TRIES -ge $MAX_TRIES ]; then
  warn "Backend did not respond in ${MAX_TRIES}s — it may still be loading models."
  warn "Check logs: $BACKEND_LOG"
else
  ok "Backend is ready (PID $BACKEND_PID)"
fi

# ── 4. Start Webapp ─────────────────────────────────────
log "Starting webapp (Next.js on :$WEBAPP_PORT)..."

cd "$ROOT_DIR/webapp"
nohup npx next dev --port $WEBAPP_PORT > "$WEBAPP_LOG" 2>&1 &
WEBAPP_PID=$!
echo "$WEBAPP_PID" > "$ROOT_DIR/.logs/webapp.pid"

# Wait for webapp to be ready (up to 30s)
TRIES=0
MAX_TRIES=15
while [ $TRIES -lt $MAX_TRIES ]; do
  if curl -s -o /dev/null -w '' "http://localhost:$WEBAPP_PORT/" 2>/dev/null; then
    break
  fi
  sleep 2
  TRIES=$((TRIES + 1))
  printf "."
done
echo ""

if [ $TRIES -ge $MAX_TRIES ]; then
  warn "Webapp did not respond in 30s. Check logs: $WEBAPP_LOG"
else
  ok "Webapp is ready (PID $WEBAPP_PID)"
fi

# ── 5. Summary ──────────────────────────────────────────
echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
if [ "$MODE" = "restart" ]; then
  echo -e "${GREEN}  Nyayantar restarted${NC}"
else
  echo -e "${GREEN}  Nyayantar is running${NC}"
fi
echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
echo -e "  Backend  : http://127.0.0.1:$BACKEND_PORT  (PID $BACKEND_PID)"
echo -e "  Webapp   : http://localhost:$WEBAPP_PORT   (PID $WEBAPP_PID)"
echo -e ""
echo -e "  Logs:"
echo -e "    Backend : $BACKEND_LOG"
echo -e "    Webapp  : $WEBAPP_LOG"
echo -e ""
echo -e "  Stop all : ${YELLOW}./stop.sh${NC}"
echo -e "  Restart  : ${YELLOW}./start.sh restart${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
