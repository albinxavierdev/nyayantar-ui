import os
import sys
import time
import signal
import subprocess
import platform
from pathlib import Path

ROOT_DIR = Path(__file__).parent.resolve()
LOG_DIR = ROOT_DIR / ".logs"
BACKEND_PID_FILE = LOG_DIR / "backend.pid"
WEBAPP_PID_FILE = LOG_DIR / "webapp.pid"
BACKEND_PORT = 8000
WEBAPP_PORT = 3000


def log(msg: str) -> None:
    print(f"[nyayantar] {msg}")


def find_pids_on_port(port: int):
    pids = []
    system = platform.system()
    try:
        if system == "Windows":
            result = subprocess.run(
                ["netstat", "-ano"],
                capture_output=True,
                text=True,
                creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0,
            )
            for line in result.stdout.splitlines():
                if f":{port}" in line:
                    parts = line.strip().split()
                    if len(parts) >= 2 and parts[-1].isdigit():
                        pids.append(int(parts[-1]))
        else:
            result = subprocess.run(["lsof", "-ti", str(port)], capture_output=True, text=True)
            for pid in result.stdout.splitlines():
                pid = pid.strip()
                if pid.isdigit():
                    pids.append(int(pid))
    except Exception as e:
        log(f"Warning: could not check port {port}: {e}")
    return pids


def kill_process(pid: int) -> None:
    try:
        if platform.system() == "Windows":
            subprocess.run(
                ["taskkill", "/F", "/PID", str(pid)],
                capture_output=True,
                creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0,
            )
        else:
            os.kill(pid, signal.SIGKILL)
    except ProcessLookupError:
        pass
    except Exception as e:
        log(f"Warning: could not kill PID {pid}: {e}")


def process_alive(pid: int) -> bool:
    system = platform.system()
    if system == "Windows":
        result = subprocess.run(
            ["tasklist", "/FI", f"PID eq {pid}"],
            capture_output=True,
            text=True,
            creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0,
        )
        return str(pid) in result.stdout
    else:
        try:
            os.kill(pid, 0)
            return True
        except ProcessLookupError:
            return False


def stop_service(name: str, port: int, pid_file: Path) -> None:
    if pid_file.exists():
        pid_str = pid_file.read_text(encoding="utf-8").strip()
        if pid_str.isdigit():
            pid = int(pid_str)
            if process_alive(pid):
                kill_process(pid)
                log(f"{name} stopped (PID {pid})")
            else:
                log(f"{name} was not running (stale PID)")
        pid_file.unlink(missing_ok=True)

    pids = find_pids_on_port(port)
    if pids:
        log(f"Killing remaining process(es) on port {port}: {pids}")
        for pid in pids:
            kill_process(pid)


def main() -> None:
    log("Stopping Nyayantar services...")
    stop_service("backend", BACKEND_PORT, BACKEND_PID_FILE)
    stop_service("webapp", WEBAPP_PORT, WEBAPP_PID_FILE)

    print()
    log("All services stopped.")


if __name__ == "__main__":
    main()
