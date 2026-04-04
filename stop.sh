#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────
# Nyayantar — Stop Script
# Kills backend and webapp processes
# Usage: ./stop.sh
# ──────────────────────────────────────────────────────────

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[nyayantar]${NC} $1"; }
ok()   { echo -e "${GREEN}[nyayantar]${NC} $1"; }

stop_service() {
  local name=$1
  local pidfile="$ROOT_DIR/.logs/${name}.pid"
  local port=$2

  # Try PID file first
  if [ -f "$pidfile" ]; then
    local pid
    pid=$(cat "$pidfile")
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null
      sleep 1
      # Force kill if still alive
      kill -9 "$pid" 2>/dev/null || true
      ok "$name stopped (PID $pid)"
    else
      ok "$name was not running (stale PID)"
    fi
    rm -f "$pidfile"
  fi

  # Also kill anything on the port
  local pids
  pids=$(lsof -ti:"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "$pids" | xargs kill -9 2>/dev/null || true
    ok "Killed remaining process(es) on port $port"
  fi
}

log "Stopping Nyayantar services..."
stop_service "backend" 8000
stop_service "webapp"  3000

echo ""
ok "All services stopped."
