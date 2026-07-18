#!/usr/bin/env python3
"""
Main file to check/download models and start FastAPI server
FIXED: Uses stable en_legal_ner_sm (no wheel issues) + fallback options
Working for Indian legal BIOES NER (NI Act, Section 138, etc.)
"""

import os
import sys
import subprocess
import spacy
import time
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file at the start
PROJECT_DIR = Path(__file__).parent
env_path = PROJECT_DIR / ".env"
load_dotenv(env_path)

# Fix compatibility: spacy-transformers with transformers 5.x
# BatchEncoding moved in transformers 5.x
try:
    from transformers.tokenization_utils_base import BatchEncoding
    # Monkey patch for spacy-transformers compatibility
    import transformers.tokenization_utils as tu_module
    if not hasattr(tu_module, 'BatchEncoding'):
        tu_module.BatchEncoding = BatchEncoding
except ImportError:
    pass

import urllib.request
import zipfile
from pathlib import Path
from transformers import AutoTokenizer, AutoModelForCausalLM
from huggingface_hub import login, snapshot_download

# ------------------------------------------------------------------
# Project-local temp / models
# ------------------------------------------------------------------
# PROJECT_DIR already defined above (line 16)
TEMP_DIR = PROJECT_DIR / "temp"
MODELS_DIR = PROJECT_DIR / "models"

TEMP_DIR.mkdir(exist_ok=True)
MODELS_DIR.mkdir(exist_ok=True)

# Keep temp files local (optional)
os.environ["TMPDIR"] = str(TEMP_DIR)
os.environ["TMP"] = str(TEMP_DIR)
os.environ["TEMP"] = str(TEMP_DIR)

# ------------------------------------------------------------------
# Models
# ------------------------------------------------------------------
LEGAL_NER_MODEL_DIRNAME = "en_legal_ner_trf"  # directory name for local model
PREAMBLE_MODEL = "en_core_web_sm"
LEGAL_NER_URL = "https://huggingface.co/opennyaiorg/en_legal_ner_trf/resolve/main/en_legal_ner_trf-any-py3-none-any.whl"
PREAMBLE_MODEL_URL = "https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.7.1/en_core_web_sm-3.7.1-py3-none-any.whl"

# Qwen model
LLAMA_MODEL_NAME = "Qwen/Qwen3.5-0.8B"
LLAMA_MODEL_DIR = MODELS_DIR / "Qwen3.5-0.8B"
# HF_TOKEN should be set in .env file or environment variable
HF_TOKEN = os.getenv("HF_TOKEN", "")  # HuggingFace token (may not be needed for Qwen)

# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def preamble_model_exists() -> bool:
    """Check if spaCy preamble model is installed by name."""
    try:
        spacy.load(PREAMBLE_MODEL)
        return True
    except OSError:
        return False


def get_legal_model_path() -> Path | None:
    """Return path to local legal NER model directory if it exists (checks for config.cfg)."""
    candidate = MODELS_DIR / LEGAL_NER_MODEL_DIRNAME
    if candidate.exists():
        # Check if this dir has config.cfg
        if (candidate / "config.cfg").exists():
            return candidate
        # Check subdirectories for versioned model dir
        for subdir in candidate.iterdir():
            if subdir.is_dir() and (subdir / "config.cfg").exists():
                return subdir
    
    # Fallback: search for any dir starting with expected name
    for child in MODELS_DIR.iterdir():
        if child.is_dir() and LEGAL_NER_MODEL_DIRNAME in child.name:
            if (child / "config.cfg").exists():
                return child
            # Check subdirectories
            for subdir in child.iterdir():
                if subdir.is_dir() and (subdir / "config.cfg").exists():
                    return subdir
    return None


def ensure_legal_model_local() -> Path | None:
    """
    Ensure the legal NER model is available locally by:
    1. Checking models/ for an extracted model directory
    2. If missing, downloading the wheel and extracting it into models/

    No pip install is used here – we treat the wheel as a zip.
    """
    existing = get_legal_model_path()
    if existing:
        print(f"✓ Found local legal model at: {existing}")
        return existing

    print("✗ Local legal model not found in models/")
    print("\n" + "=" * 60)
    print("Downloading legal NER wheel (local use only)")
    print("=" * 60 + "\n")

    filename = LEGAL_NER_URL.split("/")[-1]  # en_legal_ner_trf-any-py3-none-any.whl
    tmp_path = TEMP_DIR / filename

    try:
        # Check if wheel already exists and is valid
        if tmp_path.exists():
            try:
                # Test if zip is valid
                with zipfile.ZipFile(tmp_path, "r") as test_zip:
                    test_zip.testzip()
                size_mb = tmp_path.stat().st_size / (1024 * 1024)
                print(f"Found existing wheel: {tmp_path.name} ({size_mb:.1f} MB)")
            except:
                print("Existing wheel file is corrupted, re-downloading...")
                tmp_path.unlink()
        
        # Download wheel if needed
        if not tmp_path.exists():
            print(f"Downloading from: {LEGAL_NER_URL}")
            print("This may take a few minutes (~450MB)...")
            
            def show_progress(block_num, block_size, total_size):
                if total_size > 0:
                    percent = min(block_num * block_size * 100 / total_size, 100)
                    if block_num % 100 == 0:
                        print(f"\rDownloaded: {percent:.1f}%", end='', flush=True)
            
            urllib.request.urlretrieve(LEGAL_NER_URL, tmp_path, show_progress)
            print()  # New line after progress
            
            # Verify download
            size_mb = tmp_path.stat().st_size / (1024 * 1024)
            print(f"Downloaded wheel: {tmp_path.name} ({size_mb:.1f} MB)")
            
            # Test zip integrity
            print("Verifying wheel file...")
            with zipfile.ZipFile(tmp_path, "r") as test_zip:
                test_zip.testzip()
            print("✓ Wheel file is valid")

        # Extract wheel contents (it's just a zip)
        print("Extracting wheel into models/ directory...")
        try:
            with zipfile.ZipFile(tmp_path, "r") as zf:
                # Test zip first
                print("Verifying zip file integrity...")
                bad_file = zf.testzip()
                if bad_file:
                    raise zipfile.BadZipFile(f"Corrupted file in zip: {bad_file}")
                print("✓ Zip file is valid")
                print("Extracting files...")
                zf.extractall(MODELS_DIR)
                print("✓ Extraction complete")
        except zipfile.BadZipFile as e:
            print(f"ERROR: Corrupted zip file: {e}")
            print("Removing corrupted file and re-downloading...")
            tmp_path.unlink()
            raise

        # Remove wheel after extraction
        try:
            tmp_path.unlink()
        except OSError:
            pass

        model_path = get_legal_model_path()
        if model_path:
            print(f"✓ Legal model extracted to: {model_path}")
            return model_path
        else:
            print("✗ Could not locate extracted legal model directory")
            return None

    except Exception as e:
        print(f"ERROR downloading/extracting legal model: {e}")
        return None


def install_preamble_model() -> bool:
    """Download the preamble model using spacy's built-in downloader."""
    print("\n" + "=" * 60)
    print(f"Installing {PREAMBLE_MODEL}")
    print("=" * 60 + "\n")
    try:
        result = subprocess.run(
            [sys.executable, "-m", "spacy", "download", PREAMBLE_MODEL],
            capture_output=False,
        )
        return result.returncode == 0
    except Exception as e:
        print(f"ERROR installing preamble model: {e}")
        return False


def ensure_llama_model_local():
    """
    Download Qwen3.5-0.8B model from HuggingFace if not already present locally.
    Returns (tokenizer, model) or (None, None) on error.
    """
    print("\n" + "=" * 60)
    print("Checking Qwen3.5-0.8B Model")
    print("=" * 60)
    
    # Check if model already exists locally
    if LLAMA_MODEL_DIR.exists() and (LLAMA_MODEL_DIR / "config.json").exists():
        print(f"✓ Found local Qwen model at: {LLAMA_MODEL_DIR}")
        try:
            print("Loading Qwen model (CPU-only)...")
            # Set token in environment for any potential remote calls
            os.environ["HF_TOKEN"] = HF_TOKEN
            tokenizer = AutoTokenizer.from_pretrained(
                str(LLAMA_MODEL_DIR), 
                local_files_only=True
            )
            model = AutoModelForCausalLM.from_pretrained(
                str(LLAMA_MODEL_DIR),
                local_files_only=True,
                torch_dtype="float32",  # CPU float32
                device_map="cpu"  # Force CPU
            )
            print("✓ Qwen model loaded successfully")
            return tokenizer, model
        except Exception as e:
            print(f"ERROR loading local Qwen model: {e}")
            print("\n" + "=" * 60)
            print("Model files may be corrupted or incomplete.")
            print("Please run the download script manually:")
            print("  python3 download_llama.py")
            print("=" * 60)
            return None, None
    
    # Model not found - tell user to download manually
    print(f"✗ Local Qwen model not found at: {LLAMA_MODEL_DIR}")
    print("\n" + "=" * 60)
    print("MODEL NOT FOUND")
    print("=" * 60)
    print("Please download the model manually using:")
    print("  python3 download_llama.py")
    print("\nThis script will:")
    print("  - Authenticate with HuggingFace (if needed)")
    print("  - Download the model (~1.6GB)")
    print("  - Save it to: models/Qwen3.5-0.8B/")
    print("  - Verify the download")
    print("\nAfter downloading, restart main.py and it will load from local.")
    print("=" * 60 + "\n")
    return None, None


# ------------------------------------------------------------------
# Model Initialization
# ------------------------------------------------------------------
def initialize_models():
    start_time = time.time()
    print("\n" + "=" * 60)
    print("INITIALIZATION PHASES")
    print("=" * 60)
    
    print("\n" + "-" * 60)
    print("PHASE 1: Legal NER Model Setup")
    print("-" * 60)
    phase1_start = time.time()
    
    # Legal NER from local wheel (no pip)
    legal_model_path = ensure_legal_model_local()
    if not legal_model_path:
        print("ERROR: Failed to prepare local legal NER model")
        return None, None, None, None
    phase1_time = time.time() - phase1_start
    print(f"✓ Legal NER model ready (took {phase1_time:.2f}s)")

    print("\n" + "-" * 60)
    print("PHASE 2: Preamble Model Setup")
    print("-" * 60)
    phase2_start = time.time()
    
    # Preamble model via pip
    if not preamble_model_exists():
        print(f"✗ {PREAMBLE_MODEL} not found")
        if not install_preamble_model():
            print("ERROR: Failed to install preamble model")
            return None, None, None, None
    else:
        print(f"✓ {PREAMBLE_MODEL} found")
    phase2_time = time.time() - phase2_start
    print(f"Phase 2 completed in {phase2_time:.2f}s")

    print("\n" + "-" * 60)
    print("PHASE 3: Loading spaCy Models")
    print("-" * 60)
    phase3_start = time.time()
    
    try:
        # Load legal model from local path
        print(f"Loading legal model from: {legal_model_path}")
        try:
            legal_nlp = spacy.load(str(legal_model_path))
            print("✓ Legal NER model loaded")
        except Exception as e:
            print(f"Error loading from path: {e}")
            # Try loading by name if it was installed via pip before
            print("Trying to load by model name...")
            legal_nlp = spacy.load(LEGAL_NER_MODEL_DIRNAME)
            print("✓ Legal NER model loaded (by name)")

        # Load preamble model by name
        print(f"Loading preamble model: {PREAMBLE_MODEL}")
        preamble_nlp = spacy.load(PREAMBLE_MODEL)
        print("✓ Preamble model loaded")

        # Quick test
        print("\nTesting models...")
        doc = legal_nlp("Draft NI Act notice Section 138 Delhi High Court")
        entities = [(ent.text, ent.label_) for ent in doc.ents]
        print(f"✓ Test query processed - Found {len(entities)} entities: {entities[:3]}")
        
    except Exception as e:
        print(f"ERROR loading spaCy models: {e}")
        return None, None, None, None
    
    phase3_time = time.time() - phase3_start
    print(f"Phase 3 completed in {phase3_time:.2f}s")

    print("\n" + "-" * 60)
    print("PHASE 4: Local LLM Model Setup (Qwen)")
    print("-" * 60)
    phase4_start = time.time()
    
    # Load Qwen model
    llama_tokenizer, llama_model = ensure_llama_model_local()
    if llama_tokenizer and llama_model:
        print("✓ Qwen3.5-0.8B model ready for inference")
    else:
        print("⚠ Qwen model not available (optional for /test-local endpoint)")
    
    phase4_time = time.time() - phase4_start
    print(f"Phase 4 completed in {phase4_time:.2f}s")
    
    print("\n" + "-" * 60)
    print("PHASE 5: Cloud Model Setup (Groq)")
    print("-" * 60)
    phase5_start = time.time()
    
    # Check Groq configuration
    groq_key = os.getenv("GROQ_API_KEY", "")
    if groq_key:
        print("✓ Groq API key found in environment")
    else:
        print("⚠ Groq API key not found (required for /test-cloud and ASK agent)")
        print("  Set GROQ_API_KEY in .env file")
    
    phase5_time = time.time() - phase5_start
    print(f"Phase 5 completed in {phase5_time:.2f}s")
    
    total_time = time.time() - start_time
    print("\n" + "=" * 60)
    print("INITIALIZATION COMPLETE")
    print("=" * 60)
    print(f"Total initialization time: {total_time:.2f}s")
    print(f"  Phase 1 (Legal NER): {phase1_time:.2f}s")
    print(f"  Phase 2 (Preamble): {phase2_time:.2f}s")
    print(f"  Phase 3 (Load spaCy): {phase3_time:.2f}s")
    print(f"  Phase 4 (Qwen): {phase4_time:.2f}s")
    print(f"  Phase 5 (Groq): {phase5_time:.2f}s")
    print("=" * 60)
    
    return legal_nlp, preamble_nlp, llama_tokenizer, llama_model

# ------------------------------------------------------------------
# Start API
# ------------------------------------------------------------------
if __name__ == "__main__":
    legal_nlp, preamble_nlp, llama_tokenizer, llama_model = initialize_models()

    if not legal_nlp or not preamble_nlp:
        print("ERROR: Could not initialize spaCy models")
        sys.exit(1)

    from api import app
    import api

    api.legal_nlp = legal_nlp
    api.preamble_nlp = preamble_nlp
    api.llama_tokenizer = llama_tokenizer
    api.llama_model = llama_model

    import uvicorn

    print("\n" + "=" * 60)
    print("STARTING FASTAPI SERVER")
    print("=" * 60)
    port = int(os.getenv("PORT", "8020"))
    host = os.getenv("HOST", "127.0.0.1")  # Bind locally; put a TLS proxy in front for external access
    print(f"Server URL: http://{host}:{port}")
    print("\nAvailable Endpoints:")
    print("  POST /tags          - Tag query with BIOES labels only")
    print("  POST /test-local    - Test local Qwen model")
    print("  POST /test-cloud    - Test cloud Groq model")
    print("  POST /query         - Full pipeline (tagging → routing → agent)")
    print("\nModel Status:")
    print(f"  Legal NER: ✓ Ready")
    print(f"  Preamble Model: ✓ Ready")
    if llama_tokenizer and llama_model:
        print(f"  Local LLM (Qwen): ✓ Ready")
    else:
        print(f"  Local LLM (Qwen): ✗ Not loaded")
    groq_key = os.getenv("GROQ_API_KEY", "")
    if groq_key:
        print(f"  Cloud LLM (Groq): ✓ Configured")
    else:
        print(f"  Cloud LLM (Groq): ✗ Not configured")
    print("=" * 60 + "\n")

    uvicorn.run(app, host=host, port=port, loop="asyncio")
