# Nyayantar

AI-powered legal research and drafting assistant for Indian law.

## Features

- **Ask**: Natural-language legal research with citation-backed answers
- **Draft**: Generate legal documents from precedents
- **Interact**: Analyze and interact with uploaded documents
- **Voice Input**: Click the mic button in the chat to speak instead of type (uses local Whisper STT)

## Quick Start

### Prerequisites

- Python 3.12
- Node.js 18+ and npm
- Git

### 1. Clone the repository

```bash
git clone <repo-url>
cd nyayantar-ui
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

Generate a `SECRET_KEY` for session signing:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Set at least these in `.env`:

```env
API_KEY=<your-api-key>
SECRET_KEY=<your-secret-key>
GROQ_API_KEY=<your-groq-api-key>
```

### 3. Install Python dependencies

```bash
py start.py
```

This will:
- Create a Python 3.12 virtual environment (`venv/`)
- Install all backend dependencies automatically
- Start the FastAPI backend on `http://127.0.0.1:8000`
- Install webapp dependencies and start Next.js on `http://localhost:3000`

### 4. Open the app

Visit `http://localhost:3000` in your browser.

### 5. Stop the services

Press `Ctrl+C` in the terminal running `start.py`, or run:

```bash
py stop.py
```

## Voice Input

The chat interface includes a microphone button. When clicked:

1. The browser requests microphone permission
2. Audio is recorded via `MediaRecorder`
3. The audio blob is sent to the backend `/stt` endpoint
4. OpenAI Whisper (`openai-whisper`) transcribes the audio locally
5. The transcript is inserted into the chat input

**Note**: First-time transcription may take a few seconds while the Whisper model loads into memory.

## Manual Setup (if needed)

### Backend only

```bash
py -3.12 -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python main.py
```

### Frontend only

```bash
cd webapp
npm install
npm run dev
```

## Environment Variables

See `.env.example` for all available options. Key variables:

| Variable | Description |
|----------|-------------|
| `API_KEY` | Static bearer key for server-to-server calls |
| `SECRET_KEY` | HMAC secret for signed session cookies |
| `GROQ_API_KEY` | Groq API key for LLM responses |
| `HF_TOKEN` | HuggingFace token (for model downloads) |
| `AUTH_DISABLED` | Set `true` to bypass auth in local dev |
| `ALLOWED_ORIGINS` | CORS origins for the frontend |
| `HOST` / `PORT` | Backend bind address and port |

## Tech Stack

- **Backend**: FastAPI, spaCy, Transformers, Whisper
- **Frontend**: Next.js 14, React, Tailwind CSS
- **AI/LLM**: Groq (Llama), local Whisper for STT
- **Database**: SQLite (users, sessions, queries, audit log)

## License

Proprietary
