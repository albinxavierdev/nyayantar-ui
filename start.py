import os
import sys
import time
import signal
import subprocess
import platform
from pathlib import Path

ROOT_DIR = Path(__file__).parent.resolve()
BACKEND_PORT = 8000
WEBAPP_PORT = 3000
LOG_DIR = ROOT_DIR / ".logs"
BACKEND_LOG = LOG_DIR / "backend.log"
WEBAPP_LOG = LOG_DIR / "webapp.log"
BACKEND_PID_FILE = LOG_DIR / "backend.pid"
WEBAPP_PID_FILE = LOG_DIR / "webapp.pid"


def parse_args() -> bool:
    restart = "--restart" in sys.argv or "restart" in sys.argv[1:]
    return restart


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


def kill_port(port: int) -> None:
    pids = find_pids_on_port(port)
    if pids:
        log(f"Killing process(es) on port {port}: {pids}")
        for pid in pids:
            kill_process(pid)
        time.sleep(1)
    else:
        log(f"Port {port} is free")


def wait_for_url(url: str, timeout: int = 60) -> bool:
    import urllib.request

    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=2) as resp:
                if resp.status < 500:
                    return True
        except Exception:
            pass
        time.sleep(2)
    return False


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


def find_python311() -> Path:
    candidates = []

    py_launcher = subprocess.run(
        ["py", "-3.11", "-c", "import sys; print(sys.executable)"],
        capture_output=True,
        text=True,
    )
    if py_launcher.returncode == 0:
        candidates.append(Path(py_launcher.stdout.strip()))

    common_paths = [
        Path("C:/Python311/python.exe"),
        Path("C:/Program Files/Python311/python.exe"),
        Path("C:/Program Files (x86)/Python311/python.exe"),
        Path.home() / "AppData/Local/Programs/Python/Python311/python.exe",
        Path.home() / "AppData/Local/Microsoft/WindowsApps/python3.11.exe",
    ]
    candidates.extend(common_paths)

    for path in candidates:
        if path.exists():
            verify = subprocess.run(
                [str(path), "--version"],
                capture_output=True,
                text=True,
            )
            if verify.returncode == 0 and "3.11" in verify.stdout:
                return path

    log("Python 3.11 not found. Install it or ensure `py -3.11` works.")
    sys.exit(1)


def find_npx() -> str:
    candidates = []

    if platform.system() == "Windows":
        node_dirs = [
            Path("C:/Program Files/nodejs"),
            Path("C:/Program Files (x86)/nodejs"),
            Path.home() / "AppData/Local/Programs/nodejs",
        ]
        for node_dir in node_dirs:
            npx_cmd = node_dir / "npx.cmd"
            npx_exe = node_dir / "npx.exe"
            npx_ps1 = node_dir / "npx.ps1"
            if npx_cmd.exists():
                candidates.append(npx_cmd)
            if npx_exe.exists():
                candidates.append(npx_exe)
            if npx_ps1.exists():
                candidates.append(npx_ps1)

    result = subprocess.run(["where", "npx"], capture_output=True, text=True)
    if result.returncode == 0:
        for line in result.stdout.splitlines():
            line = line.strip()
            if line and Path(line).exists():
                candidates.append(Path(line))

    for path in candidates:
        if path.exists():
            return str(path)

    log("npx not found. Install Node.js or ensure it is in PATH.")
    sys.exit(1)


def clean_env(venv_dir: Path) -> dict:
    env = os.environ.copy()
    env.pop("PYTHONHOME", None)
    env.pop("PYTHONPATH", None)
    env["VIRTUAL_ENV"] = str(venv_dir)
    if platform.system() == "Windows":
        scripts = str(venv_dir / "Scripts")
        env["PATH"] = scripts + os.pathsep + env.get("PATH", "")
    else:
        bin_path = str(venv_dir / "bin")
        env["PATH"] = bin_path + os.pathsep + env.get("PATH", "")
    return env


def ensure_venv(python_executable: Path) -> Path:
    venv_dir = ROOT_DIR / "venv"
    venv_created = False

    if not venv_dir.exists():
        log(f"Virtual environment not found at {venv_dir}")
        log(f"Creating virtual environment with {python_executable}...")
        subprocess.run([str(python_executable), "-m", "venv", str(venv_dir)], check=True)
        log("Virtual environment created.")
        venv_created = True
    else:
        log(f"Using existing virtual environment at {venv_dir}")

    if platform.system() == "Windows":
        venv_python = venv_dir / "Scripts" / "python.exe"
    else:
        venv_python = venv_dir / "bin" / "python"

    if not venv_python.exists():
        log(f"Venv Python not found at {venv_python}")
        sys.exit(1)

    log(f"Using Python interpreter: {venv_python}")

    prefix_check = subprocess.run(
        [str(venv_python), "-c", "import sys; print(sys.prefix)"],
        capture_output=True,
        text=True,
        env=clean_env(venv_dir),
    )
    actual_prefix = prefix_check.stdout.strip()
    expected_prefix = str(venv_dir)
    if actual_prefix != expected_prefix:
        log(f"WARNING: venv Python prefix mismatch: {actual_prefix} != {expected_prefix}")
        log("The selected Python may not be using the intended virtual environment.")

    if venv_created:
        try:
            subprocess.run(
                [str(venv_python), "-m", "pip", "install", "--upgrade", "pip", "setuptools", "wheel"],
                check=False,
                env=clean_env(venv_dir),
            )
        except Exception:
            pass

    critical_packages = [
        ("fastapi", "fastapi"),
        ("uvicorn", "uvicorn[standard]"),
        ("pydantic", "pydantic"),
        ("spacy", "spacy[transformers]"),
        ("transformers", "transformers"),
        ("torch", "torch"),
        ("groq", "groq"),
        ("dotenv", "python-dotenv"),
        ("requests", "requests"),
        ("bs4", "beautifulsoup4"),
        ("lxml", "lxml"),
        ("nltk", "nltk"),
        ("sentencepiece", "sentencepiece"),
        ("accelerate", "accelerate"),
        ("duckduckgo_search", "duckduckgo-search"),
    ]

    missing = []
    for import_name, package_name in critical_packages:
        check_script = f"import {import_name}"
        result = subprocess.run(
            [str(venv_python), "-c", check_script],
            capture_output=True,
            text=True,
            env=clean_env(venv_dir),
        )
        if result.returncode != 0:
            missing.append((import_name, package_name))

    if missing:
        log(f"Missing packages in venv: {[p[1] for p in missing]}")
        for import_name, package_name in missing:
            log(f"Installing {package_name}...")
            try:
                subprocess.run(
                    [str(venv_python), "-m", "pip", "install", package_name],
                    check=False,
                    env=clean_env(venv_dir),
                )
            except Exception as e:
                log(f"Failed to install {package_name}: {e}")

    return venv_python


def main() -> None:
    restart = parse_args()
    LOG_DIR.mkdir(exist_ok=True)

    if restart:
        log("Restarting Nyayantar services...")
    else:
        log("Checking for existing processes...")
    kill_port(BACKEND_PORT)
    kill_port(WEBAPP_PORT)

    log("Finding Python 3.11...")
    python311 = find_python311()
    log(f"Found Python 3.11 at: {python311}")

    python_exec = str(ensure_venv(python311))
    venv_dir = ROOT_DIR / "venv"
    env = clean_env(venv_dir)

    log("Verifying critical imports in venv...")
    verify = subprocess.run(
        [python_exec, "-c", "import fastapi, spacy, uvicorn, pydantic; print('OK')"],
        capture_output=True,
        text=True,
        env=env,
    )
    if verify.returncode != 0:
        log("Critical packages missing in venv. Install had errors or environment is incomplete.")
        log(f"Verify output: {verify.stderr}")
        log("Please fix the environment manually, e.g.:")
        log(f"  {python_exec} -m pip install spacy[transformers]")
        sys.exit(1)

    log(f"Starting backend (FastAPI on :{BACKEND_PORT})...")
    backend_proc = subprocess.Popen(
        [python_exec, "main.py"],
        cwd=str(ROOT_DIR),
        stdout=open(BACKEND_LOG, "w", encoding="utf-8"),
        stderr=subprocess.STDOUT,
        env=env,
        creationflags=subprocess.CREATE_NO_WINDOW if platform.system() == "Windows" and hasattr(subprocess, 'CREATE_NO_WINDOW') else 0,
    )
    BACKEND_PID_FILE.write_text(str(backend_proc.pid), encoding="utf-8")
    log(f"Backend started (PID {backend_proc.pid})")

    log("Waiting for backend to be ready (loading models)...")
    backend_ready = False
    for _ in range(60):
        if process_alive(backend_proc.pid):
            if wait_for_url(f"http://127.0.0.1:{BACKEND_PORT}/", timeout=5):
                backend_ready = True
                break
        else:
            log("Backend process died. Check logs:")
            if BACKEND_LOG.exists():
                print(BACKEND_LOG.read_text(encoding="utf-8", errors="replace")[-2000:])
            sys.exit(1)
        sys.stdout.write(".")
        sys.stdout.flush()
    print()

    if backend_ready:
        log(f"Backend is ready (PID {backend_proc.pid})")
    else:
        log("Backend did not respond in 60s — it may still be loading models.")
        log(f"Check logs: {BACKEND_LOG}")

    log(f"Starting webapp (Next.js on :{WEBAPP_PORT})...")
    if platform.system() == "Windows":
        webapp_cmd = ["cmd", "/c", "npx", "next", "dev", "--port", str(WEBAPP_PORT)]
    else:
        webapp_cmd = ["npx", "next", "dev", "--port", str(WEBAPP_PORT)]
    webapp_proc = subprocess.Popen(
        webapp_cmd,
        cwd=str(ROOT_DIR / "webapp"),
        stdout=open(WEBAPP_LOG, "w", encoding="utf-8"),
        stderr=subprocess.STDOUT,
        env=env,
        creationflags=subprocess.CREATE_NO_WINDOW if platform.system() == "Windows" and hasattr(subprocess, 'CREATE_NO_WINDOW') else 0,
    )
    WEBAPP_PID_FILE.write_text(str(webapp_proc.pid), encoding="utf-8")
    log(f"Webapp started (PID {webapp_proc.pid})")

    log("Waiting for webapp to be ready (up to 30s)...")
    webapp_ready = False
    for _ in range(15):
        if process_alive(webapp_proc.pid):
            if wait_for_url(f"http://localhost:{WEBAPP_PORT}/", timeout=5):
                webapp_ready = True
                break
        else:
            log("Webapp process died. Check logs:")
            if WEBAPP_LOG.exists():
                print(WEBAPP_LOG.read_text(encoding="utf-8", errors="replace")[-2000:])
            sys.exit(1)
        sys.stdout.write(".")
        sys.stdout.flush()
    print()

    if webapp_ready:
        log(f"Webapp is ready (PID {webapp_proc.pid})")
    else:
        log("Webapp did not respond in 30s. Check logs:")
        log(f"  {WEBAPP_LOG}")

    print()
    print("=" * 60)
    if restart:
        log("Nyayantar restarted successfully")
    else:
        log("Nyayantar is running")
    print("=" * 60)
    print(f"  Backend  : http://127.0.0.1:{BACKEND_PORT}  (PID {backend_proc.pid})")
    print(f"  Webapp   : http://localhost:{WEBAPP_PORT}   (PID {webapp_proc.pid})")
    print()
    print(f"  Logs:")
    print(f"    Backend : {BACKEND_LOG}")
    print(f"    Webapp  : {WEBAPP_LOG}")
    print()
    print("  Stop all : Ctrl+C or run stop.py / stop.sh")
    print("=" * 60)

    def shutdown_handler(signum, frame):
        print()
        log("Shutting down services...")
        kill_port(BACKEND_PORT)
        kill_port(WEBAPP_PORT)
        BACKEND_PID_FILE.unlink(missing_ok=True)
        WEBAPP_PID_FILE.unlink(missing_ok=True)
        log("All services stopped.")
        sys.exit(0)

    if platform.system() != "Windows":
        signal.signal(signal.SIGINT, shutdown_handler)
        signal.signal(signal.SIGTERM, shutdown_handler)
    else:
        signal.signal(signal.SIGINT, shutdown_handler)

    try:
        while True:
            if not process_alive(backend_proc.pid):
                log("Backend process exited unexpectedly.")
                break
            if not process_alive(webapp_proc.pid):
                log("Webapp process exited unexpectedly.")
                break
            time.sleep(5)
    except KeyboardInterrupt:
        shutdown_handler(None, None)


if __name__ == "__main__":
    main()
