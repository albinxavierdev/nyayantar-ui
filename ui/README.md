# Nyayantar UI

A ChatGPT-like interface for the Legal AI Assistant.

## Features

- 🎨 Clean, modern ChatGPT-like interface
- 📚 Real-time legal document retrieval
- ⚡ Fast response generation with Groq
- 📊 Phase-wise processing visualization
- 📖 Document citations and sources
- ⏱️ Timing information for each phase

## Running the UI

### Option 1: Using the Python Server (Recommended)

```bash
cd /mnt/work/legalai/ui
python3 server.py
```

Then open your browser to: `http://localhost:3000`

### Option 2: Using Python's Built-in Server

```bash
cd /mnt/work/legalai/ui
python3 -m http.server 3000
```

Then open your browser to: `http://localhost:3000`

## Prerequisites

1. **FastAPI Server Must Be Running**:
   ```bash
   cd /mnt/work/legalai
   python3 main.py
   ```
   The FastAPI server should be running on `http://localhost:8000`

2. **CORS Configuration**:
   The UI makes direct API calls to FastAPI. If you encounter CORS issues, 
   you may need to add CORS middleware to FastAPI (already included in api.py).

## Usage

1. Start the FastAPI server (in one terminal):
   ```bash
   cd /mnt/work/legalai
   python3 main.py
   ```

2. Start the UI server (in another terminal):
   ```bash
   cd /mnt/work/legalai/ui
   python3 server.py
   ```

3. Open your browser to `http://localhost:3000`

4. Ask legal questions like:
   - "What is Section 138 of NI Act?"
   - "Explain the Constitution of India"
   - "What are the penalties for cheque bouncing?"

## API Endpoints Used

- `POST /query` - Main query endpoint that:
  - Performs BIOES tagging
  - Routes to appropriate agent (ASK/INTERACT/DRAFT)
  - Retrieves documents from local index
  - Generates response with Groq LLM

## File Structure

```
ui/
├── index.html      # Main HTML structure
├── styles.css      # ChatGPT-like styling
├── app.js          # Frontend logic and API calls
├── server.py       # Python HTTP server
└── README.md       # This file
```

## Customization

- **API URL**: Change `API_BASE_URL` in `app.js` if FastAPI runs on a different port
- **Port**: Change `PORT` in `server.py` if port 3000 is in use
- **Styling**: Modify `styles.css` for custom colors/themes
