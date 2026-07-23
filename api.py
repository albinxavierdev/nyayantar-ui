"""
FastAPI endpoint for BIOES tagging
"""
from fastapi import FastAPI, HTTPException, Request, Depends, status, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from pydantic import BaseModel, constr
from typing import List, Dict, Optional
import sys
import os
import re
import time
import json
import secrets
import logging
import httpx
import time
import json
import secrets
import logging

# ------------------------------------------------------------------
# Logging (no raw PII / secrets to stdout)
# ------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("nyayantar.api")

# ------------------------------------------------------------------
# Secrets / config
# ------------------------------------------------------------------
import security as sec

API_KEY = os.getenv("API_KEY", "")
if not API_KEY:
    # Fail CLOSED in production: auth must be explicitly disabled via
    # AUTH_DISABLED=true only for local dev. A missing key must not expose the API.
    if os.getenv("AUTH_DISABLED", "false").lower() != "true":
        logger.error(
            "API_KEY not set. Refusing to start with auth disabled. "
            "Set a strong API_KEY (or AUTH_DISABLED=true for local dev only)."
        )
        raise RuntimeError("API_KEY is required. Set API_KEY before deploying.")

ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")
    if o.strip()
]

MAX_QUERY_LENGTH = int(os.getenv("MAX_QUERY_LENGTH", "4000"))

# Max raw request body (bytes). Query length is also capped; this blocks huge payloads.
MAX_BODY_BYTES = int(os.getenv("MAX_BODY_BYTES", str(512 * 1024)))

# Cookie session settings
SESSION_COOKIE_NAME = os.getenv("SESSION_COOKIE_NAME", "ny_session")
# Secure cookies are REQUIRED over HTTPS in production. But on plaintext
# hosts (e.g. http://localhost during local dev) browsers refuse to store a
# Secure cookie at all, which silently breaks login persistence. So we force
# Secure off when the server is bound to a non-TLS host, unless explicitly
# overridden by SECURE_COOKIES.
_insecure_host = os.getenv("HOST", "127.0.0.1").strip().lower() in (
    "localhost", "127.0.0.1", "[::1]",
)
_sec_override = os.getenv("SECURE_COOKIES", "").lower()
SECURE_COOKIES = (
    _sec_override != "false"
    if _sec_override in ("true", "false")
    else (not _insecure_host)
)
SAME_SITE = os.getenv("SAME_SITE", "lax")
# Roles permitted to the admin capability (server-enforced).
ADMIN_ROLES = [r.strip() for r in os.getenv("ADMIN_ROLES", "admin,sudo_admin,super_admin").split(",") if r.strip()]

# Server-side consent requirement (GDPR-style). When true, /query and
# /query/stream require a consent cookie set via POST /consent.
CONSENT_REQUIRED = os.getenv("CONSENT_REQUIRED", "false").lower() == "true"

GENERIC_ERROR = "Internal server error. Please try again later."

# ------------------------------------------------------------------
# Rate limiting
# ------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Legal BIOES Tagger API")
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS: allowlisted origins only, limited methods/headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With", "X-CSRF-Token"],
)

# Request body size limit (defense against oversized payloads / memory abuse)
@app.middleware("http")
async def limit_body_size(request: Request, call_next):
    length = request.headers.get("content-length")
    if length and int(length) > MAX_BODY_BYTES:
        return JSONResponse(
            status_code=413, content={"detail": "Request body too large."}
        )
    return await call_next(request)


# Security headers at the API layer (harmless behind a TLS proxy, required if exposed).
SECURITY_HEADERS = {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=('self' http://localhost:3000 http://127.0.0.1:3000), geolocation=()",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
    # "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
}


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    for k, v in SECURITY_HEADERS.items():
        if k not in response.headers:
            response.headers[k] = v
    return response

# Global handler: never leak internal exception detail to clients
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error: %s", exc)
    return JSONResponse(status_code=500, content={"detail": GENERIC_ERROR})

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

import spacy

import whisper
import tempfile

# Import resolver for routing between ASK / INTERACT / DRAFT
from agents.resolver import resolve_agent, ResolutionResult

# Central application database (users, sessions, queries, audit log)
import db

# Global models (set by main.py)
legal_nlp = None
preamble_nlp = None
llama_tokenizer = None
llama_model = None


# ------------------------------------------------------------------
# Auth
# ------------------------------------------------------------------
def _bearer(auth_header: Optional[str]) -> Optional[str]:
    if auth_header and auth_header.lower().startswith("bearer "):
        return auth_header.split(" ", 1)[1]
    return None


def _read_session_cookie(request: Request) -> Optional[str]:
    return request.cookies.get(SESSION_COOKIE_NAME)


def _session_claims(request: Request) -> Optional[Dict[str, str]]:
    """Return verified {email, role} from the signed session cookie or API key header."""
    token = _read_session_cookie(request)
    if token:
        claims = sec.verify_session_token(token)
        if claims:
            return claims
    # Server-to-server API key (still supported as a static bearer/header).
    provided = request.headers.get("X-API-Key") or _bearer(request.headers.get("Authorization"))
    if API_KEY and provided and secrets.compare_digest(provided, API_KEY):
        return {"email": "api", "role": "admin"}
    return None


def require_auth(request: Request):
    """Reject unauthenticated requests (fail closed)."""
    if sec is None:
        return
    if not _session_claims(request):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing session.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_role(roles: List[str]):
    """Dependency factory enforcing a server-side role from the signed token."""
    async def checker(request: Request) -> None:
        claims = _session_claims(request)
        role = claims.get("role") if claims else None
        if role not in roles:
            sec.audit_event("authz.denied", role=role or "none", required=",".join(roles))
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions.",
            )
    return checker


# CSRF protection: state-changing requests must carry the session cookie AND a
# matching custom header (not sendable cross-site without JS). Safe with SameSite=Lax.
def require_csrf(request: Request):
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return
    if not _read_session_cookie(request):
        return  # no session -> auth dependency will reject
    if request.headers.get("X-Requested-With") != "nyayantar":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cross-site request rejected.",
        )


# Server-side consent enforcement (GDPR-style). Only enforced when CONSENT_REQUIRED.
def require_consent(request: Request):
    if not CONSENT_REQUIRED:
        return
    if not request.cookies.get(CONSENT_COOKIE_NAME):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Consent required before using the service.",
        )


class BIOESTag(BaseModel):
    token: str
    tag: str
    entity_type: Optional[str] = None


class Entity(BaseModel):
    text: str
    label: str
    start: int
    end: int


class TagResponse(BaseModel):
    query: str
    bioes_tags: List[BIOESTag]
    entities: List[Entity]


class TestLocalRequest(BaseModel):
    query: constr(min_length=1, max_length=MAX_QUERY_LENGTH)  # type: ignore[valid-type]
    max_length: int = 512
    temperature: float = 0.7
    top_p: float = 0.9


class TestLocalResponse(BaseModel):
    query: str
    response: str
    model: str = "Qwen3.5-0.8B"


class TestCloudRequest(BaseModel):
    query: constr(min_length=1, max_length=MAX_QUERY_LENGTH)  # type: ignore[valid-type]


class TestCloudResponse(BaseModel):
    query: str
    response: str
    model: str = "Groq (llama-3.3-70b-versatile)"


class QueryRequest(BaseModel):
    query: constr(min_length=1, max_length=MAX_QUERY_LENGTH)  # type: ignore[valid-type]
    file_content: Optional[str] = None
    file_name: Optional[str] = None
    file_id: Optional[str] = None



class PhaseInfo(BaseModel):
    phase: str
    status: str
    output: Optional[Dict] = None
    message: Optional[str] = None


class QueryResponse(BaseModel):
    query: str
    phases: List[PhaseInfo]
    final_response: Optional[str] = None
    routed_agent: Optional[str] = None


def convert_to_bioes(doc, text: str) -> List[Dict]:
    """Convert spaCy doc entities to BIOES format"""
    token_list = []
    token_to_index = {}
    
    for token in doc:
        if not token.is_space and not token.is_punct:
            idx = len(token_list)
            token_list.append({
                'text': token.text,
                'spacy_idx': token.i,
                'start_char': token.idx,
                'end_char': token.idx + len(token.text)
            })
            token_to_index[token.i] = idx
    
    bioes_tags = [{"token": t['text'], "tag": "O", "entity_type": None} for t in token_list]
    
    for ent in doc.ents:
        entity_token_indices = []
        for token in doc:
            if (token.idx < ent.end_char and token.idx + len(token.text) > ent.start_char):
                if not token.is_space and not token.is_punct and token.i in token_to_index:
                    entity_token_indices.append(token_to_index[token.i])
        
        if not entity_token_indices:
            continue
        
        entity_token_indices.sort()
        
        if len(entity_token_indices) == 1:
            idx = entity_token_indices[0]
            bioes_tags[idx] = {
                "token": token_list[idx]['text'],
                "tag": f"S-{ent.label_}",
                "entity_type": ent.label_
            }
        else:
            for list_idx, token_idx in enumerate(entity_token_indices):
                if list_idx == 0:
                    tag = f"B-{ent.label_}"
                elif list_idx == len(entity_token_indices) - 1:
                    tag = f"E-{ent.label_}"
                else:
                    tag = f"I-{ent.label_}"
                bioes_tags[token_idx] = {
                    "token": token_list[token_idx]['text'],
                    "tag": tag,
                    "entity_type": ent.label_
                }
    
    return bioes_tags


@app.get("/")
async def root():
    return {
        "message": "Legal BIOES Tagger API",
        "endpoints": {
            "/tags": "Tag query with BIOES labels only",
            "/test-local": "Test local Qwen model",
            "/test-cloud": "Test cloud Groq model",
            "/query": "Full pipeline: tagging → routing → agent response",
            "/stt": "Transcribe audio to text using Whisper",
        },
    }


@app.post("/tags", response_model=TagResponse)
@limiter.limit(os.getenv("RATE_LIMIT_TAGS", "30/minute"))
async def tag_query(payload: QueryRequest, request: Request, _: None = Depends(require_auth), _csrf: None = Depends(require_csrf)):
    """Tag a query with BIOES labels only (no routing or agent processing)"""
    global legal_nlp, preamble_nlp
    
    if not legal_nlp or not preamble_nlp:
        raise HTTPException(status_code=503, detail="Models not loaded")
    
    try:
        query = payload.query.strip()
        if not query:
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        # Process query sentence by sentence
        preamble_doc = preamble_nlp(query)
        sentences = [sent.text for sent in preamble_doc.sents]
        
        if sentences:
            docs = [legal_nlp(sent) for sent in sentences]
            doc = spacy.tokens.Doc.from_docs(docs)
        else:
            doc = legal_nlp(query)
        
        # Convert to BIOES format
        bioes_tags = convert_to_bioes(doc, query)

        # Extract entities
        entities: List[Entity] = [
            Entity(
                text=ent.text,
                label=ent.label_,
                start=ent.start_char,
                end=ent.end_char,
            )
            for ent in doc.ents
        ]
        
        return TagResponse(
            query=query,
            bioes_tags=[BIOESTag(**tag) for tag in bioes_tags],
            entities=entities,
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("ERROR in tagging: %s", e)
        raise HTTPException(status_code=500, detail=GENERIC_ERROR)


@app.post("/test-local", response_model=TestLocalResponse)
@limiter.limit(os.getenv("RATE_LIMIT_TEST_LOCAL", "20/minute"))
async def test_local_model(payload: TestLocalRequest, request: Request, _: None = Depends(require_auth), _csrf: None = Depends(require_csrf)):
    """Test local Qwen3.5-0.8B model"""
    global llama_tokenizer, llama_model
    
    if not llama_tokenizer or not llama_model:
        raise HTTPException(
            status_code=503, 
            detail="Qwen model not loaded. Please ensure the model is downloaded and initialized."
        )
    
    try:
        query = payload.query.strip()
        if not query:
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        # Tokenize input
        inputs = llama_tokenizer(query, return_tensors="pt")
        
        # Generate response
        with torch.no_grad():
            outputs = llama_model.generate(
                inputs.input_ids,
                max_length=request.max_length,
                temperature=request.temperature,
                top_p=request.top_p,
                do_sample=True,
                pad_token_id=llama_tokenizer.eos_token_id
            )
        
        # Decode response
        response = llama_tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Remove the input query from response if it's included
        if response.startswith(query):
            response = response[len(query):].strip()
        
        return TestLocalResponse(
            query=query,
            response=response,
            model="Qwen3.5-0.8B"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("ERROR in local model test: %s", e)
        raise HTTPException(status_code=500, detail=GENERIC_ERROR)


@app.post("/test-cloud", response_model=TestCloudResponse)
@limiter.limit(os.getenv("RATE_LIMIT_TEST_CLOUD", "20/minute"))
async def test_cloud_model(payload: TestCloudRequest, request: Request, _: None = Depends(require_auth), _csrf: None = Depends(require_csrf)):
    """Test cloud Groq model"""
    try:
        query = payload.query.strip()
        if not query:
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        from agents.ask import generate_response
        
        # Test with empty entities
        response, _ = generate_response(query, entities=[], context=None)
        
        return TestCloudResponse(
            query=query,
            response=response,
            model="Groq (llama-3.3-70b-versatile)"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("ERROR in cloud model test: %s", e)
        raise HTTPException(status_code=500, detail=GENERIC_ERROR)


@app.post("/query", response_model=QueryResponse)
@limiter.limit(os.getenv("RATE_LIMIT_QUERY", "20/minute"))
async def query_full_pipeline(payload: QueryRequest, request: Request, _: None = Depends(require_auth), _csrf: None = Depends(require_csrf)):
    """Full pipeline: tagging → routing → agent response"""
    global legal_nlp, preamble_nlp
    
    if not legal_nlp or not preamble_nlp:
        raise HTTPException(status_code=503, detail="Models not loaded")
    
    phases = []
    pipeline_start = time.time()
    _claims = _session_claims(request)
    _email = _claims.get("email") if _claims else None
    
    try:
        query = payload.query.strip()
        if not query:
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        # ============================================================
        # PHASE 1: BIOES TAGGING
        # ============================================================
        phase1_start = time.time()
        
        preamble_doc = preamble_nlp(query)
        sentences = [sent.text for sent in preamble_doc.sents]
        
        if sentences:
            docs = [legal_nlp(sent) for sent in sentences]
            doc = spacy.tokens.Doc.from_docs(docs)
        else:
            doc = legal_nlp(query)
        
        bioes_tags = convert_to_bioes(doc, query)
        
        entities: List[Entity] = [
            Entity(
                text=ent.text,
                label=ent.label_,
                start=ent.start_char,
                end=ent.end_char,
            )
            for ent in doc.ents
        ]
        
        phase1_time = time.time() - phase1_start
        phases.append(PhaseInfo(
            phase="1. BIOES Tagging",
            status="completed",
            output={
                "entities_count": len(entities),
                "bioes_tags_count": len(bioes_tags),
                "entities": [{"text": e.text, "label": e.label} for e in entities],
                "bioes_tags": [{"token": tag["token"], "tag": tag["tag"], "entity_type": tag.get("entity_type")} for tag in bioes_tags],
                "tokens": [tag["token"] for tag in bioes_tags]  # All tokens
            },
            message=f"Successfully tagged query with {len(entities)} entities and {len(bioes_tags)} BIOES tags",
            duration_seconds=round(phase1_time, 3)
        ))
        
        # ============================================================
        # PHASE 2: AGENT ROUTING
        # ============================================================
        phase2_start = time.time()
        
        resolution: ResolutionResult = resolve_agent(
            query=query,
            entities=entities,
            bioes_tags=bioes_tags,
        )
        
        phase2_time = time.time() - phase2_start
        phases.append(PhaseInfo(
            phase="2. Agent Routing",
            status="completed",
            output={
                "agent": resolution.agent,
                "reason": resolution.reason
            },
            message=f"Query routed to {resolution.agent} agent",
            duration_seconds=round(phase2_time, 3)
        ))
        
        # ============================================================
        # PHASE 3: AGENT PROCESSING
        # ============================================================
        phase3_start = time.time()
        
        final_response = None
        
        if resolution.agent == "ASK":
            from agents.ask import process_ask_query
            entities_dict = [
                {"text": ent.text, "label": ent.label, "entity_type": ent.label}
                for ent in entities
            ]
            
            ask_result = process_ask_query(
                query=query,
                entities=entities_dict,
                bioes_tags=bioes_tags,
                context=None,
                file_content=payload.file_content,
                file_name=payload.file_name,
            )
            final_response = ask_result.get("response")
            
            # Extract document retrieval info
            num_docs = ask_result.get("num_documents_retrieved", 0)
            sources = ask_result.get("sources", [])
            has_context = ask_result.get("has_document_context", False)
            timing = ask_result.get("timing", {})
            
            # Extract web search info
            web_search_performed = ask_result.get("web_search_performed", False)
            web_search_results_count = ask_result.get("web_search_results_count", 0)
            news_search_results_count = ask_result.get("news_search_results_count", 0)
            web_search_time = timing.get("web_search_seconds", 0)
            
            phase3_time = time.time() - phase3_start
            
            # Separate local document sources from web search sources
            local_sources = [s for s in sources if s.get("type") != "web" and s.get("type") != "news"]
            web_sources = [s for s in sources if s.get("type") == "web"]
            news_sources = [s for s in sources if s.get("type") == "news"]
            
            phases.append(PhaseInfo(
                phase="3. Agent Processing (ASK)",
                status="completed",
                output={
                    "model": "Groq (llama-3.3-70b-versatile)",
                    "response_length": len(final_response),
                    "document_retrieval": {
                        "num_documents_retrieved": num_docs,
                        "num_sources": len(local_sources),
                        "has_document_context": has_context,
                        "sources": local_sources[:5],  # Include first 5 local sources
                        "retrieval_time_seconds": timing.get("document_retrieval_seconds", 0),
                        "llm_generation_time_seconds": timing.get("llm_generation_seconds", 0),
                        "total_agent_time_seconds": timing.get("total_agent_seconds", 0)
                    },
                    "web_search": {
                        "performed": web_search_performed,
                        "web_results_count": web_search_results_count,
                        "news_results_count": news_search_results_count,
                        "web_sources": web_sources[:5],  # Include first 5 web sources
                        "news_sources": news_sources[:5],  # Include first 5 news sources
                        "web_search_time_seconds": web_search_time
                    }
                },
                message=f"ASK agent generated response using Groq{' with document context' if has_context else ' (general knowledge)'}{' + web search' if web_search_performed else ''}",
                duration_seconds=round(phase3_time, 3)
            ))
            
        elif resolution.agent == "DRAFT":
            from agents.draft import process_draft_query
            entities_dict = [
                {"text": ent.text, "label": ent.label, "entity_type": ent.label}
                for ent in entities
            ]

            draft_result = process_draft_query(
                query=query,
                entities=entities_dict,
                bioes_tags=bioes_tags,
                context=None,
                file_content=payload.file_content,
                file_name=payload.file_name,
            )
            final_response = draft_result.get("response", "DRAFT agent finished.")

            phase3_time = time.time() - phase3_start
            phases.append(PhaseInfo(
                phase="3. Agent Processing (DRAFT)",
                status="completed",
                output={
                    "agent": "DRAFT",
                    "document_type": draft_result.get("document_type", "Legal Document"),
                    "response_length": len(final_response),
                },
                message=f"DRAFT agent generated a {draft_result.get('document_type', 'legal document')}",
                duration_seconds=round(phase3_time, 3)
            ))

        elif resolution.agent == "INTERACT":
            from agents.interact import process_interact_query
            entities_dict = [
                {"text": ent.text, "label": ent.label, "entity_type": ent.label}
                for ent in entities
            ]

            interact_result = process_interact_query(
                query=query,
                entities=entities_dict,
                bioes_tags=bioes_tags,
                context=None,
                file_content=payload.file_content,
                file_name=payload.file_name,
            )
            final_response = interact_result.get("response", "INTERACT agent finished.")

            phase3_time = time.time() - phase3_start
            phases.append(PhaseInfo(
                phase="3. Agent Processing (INTERACT)",
                status="completed",
                output={
                    "agent": "INTERACT",
                    "response_length": len(final_response),
                },
                message="INTERACT agent processed the document and provided insights",
                duration_seconds=round(phase3_time, 3)
            ))
        
        total_pipeline_time = time.time() - pipeline_start
        
        # Persist every completed query + response to the database.
        _web_search = any(
            p.phase.startswith("3.") and p.output and p.output.get("web_search", {}).get("performed")
            for p in phases
        )
        try:
            db.save_query(
                query=query,
                email=_email,
                routed_agent=resolution.agent,
                final_response=final_response,
                entities=[{"text": e.text, "label": e.label} for e in entities],
                retrieval_time=total_pipeline_time,
                total_time=total_pipeline_time,
                web_search=bool(_web_search),
                error=False,
            )
        except Exception as db_err:  # never break the response path
            logger.error("Failed to persist query: %s", db_err)
        
        return QueryResponse(
            query=query,
            phases=phases,
            final_response=final_response,
            routed_agent=resolution.agent
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("ERROR in full pipeline: %s", e)
        try:
            db.save_query(query=payload.query, email=_email, error=True)
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=GENERIC_ERROR)


@app.post("/query/stream")
@limiter.limit(os.getenv("RATE_LIMIT_QUERY_STREAM", "20/minute"))
async def query_stream_pipeline(payload: QueryRequest, request: Request, _: None = Depends(require_auth), _csrf: None = Depends(require_csrf)):
    """Full pipeline with streaming LLM response via SSE."""
    global legal_nlp, preamble_nlp

    if not legal_nlp or not preamble_nlp:
        raise HTTPException(status_code=503, detail="Models not loaded")

    query = payload.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    def event_stream():
        pipeline_start = time.time()

        try:
            # ── Phase 1: Tagging ──
            preamble_doc = preamble_nlp(query)
            sentences = [sent.text for sent in preamble_doc.sents]
            if sentences:
                docs = [legal_nlp(sent) for sent in sentences]
                doc = spacy.tokens.Doc.from_docs(docs)
            else:
                doc = legal_nlp(query)

            bioes_tags = convert_to_bioes(doc, query)
            entities_list: List[Entity] = [
                Entity(text=ent.text, label=ent.label_, start=ent.start_char, end=ent.end_char)
                for ent in doc.ents
            ]
            entities_dict = [{"text": e.text, "label": e.label, "entity_type": e.label} for e in entities_list]

            # ── Phase 2: Routing ──
            resolution = resolve_agent(query=query, entities=entities_list, bioes_tags=bioes_tags)

            # ── Phase 2.5: Document Retrieval + Web Search ──
            from agents.ask.agent import retrieve_document_context, generate_response_stream
            retrieved_docs = retrieve_document_context(query, entities_dict, top_k=5)

            web_search_results = None
            web_search_time = 0
            try:
                from agents.ask.web_search import search_web_and_news, classify_query_type, should_trigger_web_search
                should_search = should_trigger_web_search(query=query, retrieved_docs=retrieved_docs, entities=entities_dict, bioes_tags=bioes_tags)
                if should_search:
                    qc = classify_query_type(query=query, entities=entities_dict, bioes_tags=bioes_tags)
                    ws_start = time.time()
                    web_search_results = search_web_and_news(query=query, entities=entities_dict, bioes_tags=bioes_tags, search_type=qc["search_type"])
                    web_search_time = time.time() - ws_start
            except Exception as e:
                logger.error("[Stream] Web search error: %s", e)

            # Build citations/meta
            local_sources = retrieved_docs.get("sources", [])
            web_sources = []
            news_sources = []
            if web_search_results:
                web_sources = web_search_results.get("sources", [])
                web_sources = [s for s in web_sources if s.get("type") == "web"]
                news_sources = [s for s in web_search_results.get("sources", []) if s.get("type") == "news"]

            meta = {
                "routed_agent": resolution.agent,
                "entities": [{"text": e.text, "label": e.label} for e in entities_list],
                "documents": local_sources[:5],
                "web_search_results": {
                    "web_count": len(web_search_results.get("web_results", [])) if web_search_results else 0,
                    "news_count": len(web_search_results.get("news_results", [])) if web_search_results else 0,
                    "sources": [s.get("url", s.get("href", "")) for s in web_sources[:5] + news_sources[:5] if s.get("url") or s.get("href")],
                },
                "timing": {
                    "retrieval": retrieved_docs.get("retrieval_time_seconds", 0),
                    "web_search": round(web_search_time, 3),
                },
            }

            # Send meta event first
            yield f"data: {json.dumps({'type': 'meta', 'data': meta})}\n\n"

            # ── Phase 3: Agent Processing (with streaming where applicable) ──
            llm_start = time.time()

            if resolution.agent == "ASK":
                for token in generate_response_stream(
                    query=query,
                    entities=entities_dict,
                    context=None,
                    retrieved_docs=retrieved_docs,
                    web_search_results=web_search_results,
                    file_content=payload.file_content,
                    file_name=payload.file_name,
                ):
                    yield f"data: {json.dumps({'type': 'token', 'data': token})}\n\n"
            else:
                # DRAFT / INTERACT: generate the full response then stream it word-by-word.
                if resolution.agent == "DRAFT":
                    from agents.draft import process_draft_query
                    agent_result = process_draft_query(
                        query=query,
                        entities=entities_dict,
                        bioes_tags=bioes_tags,
                        context=None,
                        file_content=payload.file_content,
                        file_name=payload.file_name,
                    )
                else:  # INTERACT
                    from agents.interact import process_interact_query
                    agent_result = process_interact_query(
                        query=query,
                        entities=entities_dict,
                        bioes_tags=bioes_tags,
                        context=None,
                        file_content=payload.file_content,
                        file_name=payload.file_name,
                    )
                full_response = agent_result.get("response", "")
                words = full_response.split()
                for i, word in enumerate(words):
                    yield f"data: {json.dumps({'type': 'token', 'data': word + (' ' if i < len(words) - 1 else '')})}\n\n"
                    time.sleep(0.02)

            llm_time = time.time() - llm_start
            total_time = time.time() - pipeline_start

            # Send done event with final timing
            meta["timing"]["llm"] = round(llm_time, 3)
            meta["timing"]["total"] = round(total_time, 3)
            yield f"data: {json.dumps({'type': 'done', 'data': meta})}\n\n"

            # Persist the streamed query to the database.
            try:
                _claims = _session_claims(request)
                _email = _claims.get("email") if _claims else None
                db.save_query(
                    query=query,
                    email=_email,
                    routed_agent=resolution.agent,
                    final_response=None,
                    entities=[{"text": e.text, "label": e.label} for e in entities_list],
                    retrieval_time=retrieved_docs.get("retrieval_time_seconds", 0),
                    llm_time=round(llm_time, 3),
                    total_time=round(total_time, 3),
                    web_search=bool(web_search_results),
                    error=False,
                )
            except Exception as db_err:  # never break the stream
                logger.error("Failed to persist streamed query: %s", db_err)
        except Exception as e:
            logger.error("[Stream] Pipeline error: %s", e)
            yield f"data: {json.dumps({'type': 'error', 'data': GENERIC_ERROR})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/health")
async def health_check():
    # Public health check (no model/secret status leaked).
    models_ready = legal_nlp is not None and preamble_nlp is not None
    return {"status": "ok" if models_ready else "starting"}


class STTRequest(BaseModel):
    model: str = "base"


class STTResponse(BaseModel):
    text: str
    model: str
    language: Optional[str] = None


@app.post("/stt", response_model=STTResponse)
@limiter.limit(os.getenv("RATE_LIMIT_STT", "30/minute"))
async def speech_to_text(request: Request, _: None = Depends(require_auth), _csrf: None = Depends(require_csrf)):
    """Transcribe uploaded audio to text using OpenAI Whisper."""
    try:
        content_type = request.headers.get("content-type", "")
        if "multipart/form-data" not in content_type:
            raise HTTPException(status_code=400, detail="Expected multipart/form-data with an audio file.")
        form = await request.form()
        upload = form.get("file")
        if upload is None or not hasattr(upload, "filename") or not upload.filename:
            raise HTTPException(status_code=400, detail="Missing audio file field 'file'.")
        model_name = form.get("model") or "base"
        suffix = os.path.splitext(upload.filename)[1] or ".wav"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            data = await upload.read()
            tmp.write(data)
            tmp_path = tmp.name
        try:
            model = whisper.load_model(model_name)
            result = model.transcribe(tmp_path)
            text = (result.get("text") or "").strip()
            language = result.get("language")
            return STTResponse(text=text, model=model_name, language=language)
        finally:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass
    except HTTPException:
        raise
    except Exception as e:
        logger.error("ERROR in /stt: %s", e)
        raise HTTPException(status_code=500, detail=GENERIC_ERROR)


# ------------------------------------------------------------------
# Bizfylabs RAG API integration
# ------------------------------------------------------------------
RAG_API_KEY = os.getenv("RAG_API_KEY", "")
RAG_BASE_URL = os.getenv("RAG_BASE_URL", "https://rag.bizfylabs.com").rstrip("/")

_rag_client = httpx.Client(timeout=300.0, follow_redirects=True)


def _rag_headers() -> dict:
    if not RAG_API_KEY:
        raise HTTPException(status_code=500, detail="RAG API key is not configured on the server.")
    return {"Authorization": f"Bearer {RAG_API_KEY}"}


def _rag_url(path: str) -> str:
    return f"{RAG_BASE_URL}{path}"


class RAGUploadResponse(BaseModel):
    collection_id: str
    document_id: Optional[str] = None
    job_id: Optional[str] = None
    status: str = "accepted"


class RAGQueryRequest(BaseModel):
    query: str
    collection_id: str
    top_k: int = 5


class RAGQueryResponse(BaseModel):
    answer: str
    citations: List[Dict] = []
    collection_id: str


def _get_or_create_collection(email: str) -> str:
    """Get existing Nyayantar collection for user or create a new one."""
    resp = _rag_client.get(
        _rag_url("/collections"),
        headers=_rag_headers(),
    )
    if resp.status_code == 200:
        for coll in resp.json():
            if coll.get("name") == f"Nyayantar-{email}":
                return coll["id"]
    elif resp.status_code not in (401, 403):
        resp.raise_for_status()

    create_resp = _rag_client.post(
        _rag_url("/collections"),
        headers={**_rag_headers(), "Content-Type": "application/json"},
        json={"name": f"Nyayantar-{email}"},
    )
    create_resp.raise_for_status()
    return create_resp.json()["id"]


@app.post("/rag/upload", response_model=RAGUploadResponse)
async def rag_upload(
    request: Request,
    _: None = Depends(require_auth),
    _csrf: None = Depends(require_csrf),
):
    """Upload a file to Bizfylabs RAG API."""
    claims = _session_claims(request) or {}
    email = claims.get("email", "unknown")

    content_type = request.headers.get("content-type", "")
    if "multipart/form-data" not in content_type:
        raise HTTPException(status_code=400, detail="Expected multipart/form-data.")

    form = await request.form()
    upload = form.get("file")
    collection_id = form.get("collection_id")
    title = form.get("title")

    if upload is None or not hasattr(upload, "filename") or not upload.filename:
        raise HTTPException(status_code=400, detail="Missing file field 'file'.")

    if not collection_id:
        collection_id = _get_or_create_collection(email)

    file_bytes = await upload.read()
    files = {
        "file": (upload.filename, file_bytes, upload.content_type or "application/octet-stream"),
    }
    data = {"collection_id": str(collection_id)}
    if title:
        data["title"] = str(title)

    resp = _rag_client.post(
        _rag_url("/ingest/upload/async"),
        headers=_rag_headers(),
        files=files,
        data=data,
    )
    if resp.status_code not in (200, 202):
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    payload = resp.json()
    print("\n" + "=" * 60)
    print("UPLOAD TO RAG SERVER")
    print("Status Code:", resp.status_code)
    print("Collection ID:", collection_id)
    print("Response:")
    print(payload)
    print("=" * 60 + "\n")

    return RAGUploadResponse(
        collection_id=str(collection_id),
        job_id=payload.get("job_id"),
        status=payload.get("status", "accepted"),
    )


@app.post("/rag/query", response_model=RAGQueryResponse)
async def rag_query(
    
    payload: RAGQueryRequest,
    request: Request,
    _: None = Depends(require_auth),
    _csrf: None = Depends(require_csrf),
    
):
    """Query Bizfylabs RAG API."""
    resp = _rag_client.post(
        _rag_url("/query"),
        headers={**_rag_headers(), "Content-Type": "application/json"},
        json={
            "query": payload.query,
            "collection_id": payload.collection_id,
            "top_k": payload.top_k,
        },
    )
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    data = resp.json()

    return RAGQueryResponse(
        answer=data.get("answer", ""),
        citations=data.get("citations", []),
        collection_id=payload.collection_id,
    )



@app.get("/rag/collections")
async def rag_list_collections(_: None = Depends(require_auth), _csrf: None = Depends(require_csrf)):
    resp = _rag_client.get(_rag_url("/collections"), headers=_rag_headers())
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()


@app.get("/rag/collections/{collection_id}")
async def rag_get_collection(collection_id: str, _: None = Depends(require_auth), _csrf: None = Depends(require_csrf)):
    resp = _rag_client.get(_rag_url(f"/collections/{collection_id}"), headers=_rag_headers())
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()


@app.get("/rag/jobs/{job_id}")
async def rag_get_job(job_id: str, _: None = Depends(require_auth), _csrf: None = Depends(require_csrf)):
    resp = _rag_client.get(_rag_url(f"/jobs/{job_id}"), headers=_rag_headers())
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()


@app.delete("/rag/documents/{document_id}")
async def rag_delete_document(document_id: str, _: None = Depends(require_auth), _csrf: None = Depends(require_csrf)):
    resp = _rag_client.delete(_rag_url(f"/documents/{document_id}"), headers=_rag_headers())
    if resp.status_code not in (200, 204):
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return Response(status_code=204)


@app.delete("/rag/collections/{collection_id}")
async def rag_delete_collection(collection_id: str, _: None = Depends(require_auth), _csrf: None = Depends(require_csrf)):
    resp = _rag_client.delete(_rag_url(f"/collections/{collection_id}"), headers=_rag_headers())
    if resp.status_code not in (200, 204):
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return Response(status_code=204)


# ------------------------------------------------------------------
# Auth: exchange credentials for a signed session cookie.
# ------------------------------------------------------------------
AUTH_USER = os.getenv("AUTH_USER", "")
AUTH_PASSWORD = os.getenv("AUTH_PASSWORD", "")
# Email(s) granted admin role; comma-separated. Empty = only "user" role.
ADMIN_EMAILS = [
    e.strip().lower() for e in os.getenv("ADMIN_EMAILS", "").split(",") if e.strip()
]

COOKIE_PATH = "/"
COOKIE_MAX_AGE = int(os.getenv("SESSION_MAX_AGE", str(60 * 60 * 8)))  # 8h default

# Basic RFC-5322-ish email sanity check for registration.
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# Google OAuth (frontend uses Google Identity Services; sends the ID token JWT).
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

CONSENT_COOKIE_NAME = os.getenv("CONSENT_COOKIE_NAME", "ny_consent")


class LoginRequest(BaseModel):
    email: constr(min_length=1, max_length=320)  # type: ignore[valid-type]
    password: constr(min_length=1, max_length=256)  # type: ignore[valid-type]
    # Optional CAPTCHA token (required after lockout / when HCAPTCHA_SECRET set).
    captcha: Optional[str] = None


class RegisterRequest(BaseModel):
    email: constr(min_length=3, max_length=320)  # type: ignore[valid-type]
    password: constr(min_length=8, max_length=256)  # type: ignore[valid-type]
    name: Optional[constr(min_length=1, max_length=200)] = None  # type: ignore[valid-type]


class GoogleLoginRequest(BaseModel):
    # Google Identity Services "credential" (a signed JWT id_token).
    credential: constr(min_length=1, max_length=8192)  # type: ignore[valid-type]


class ConsentRequest(BaseModel):
    consent: bool


def _issue_session(response: Response, email: str, role: str) -> dict:
    """Set a signed, httpOnly+Secure+SameSite session cookie; return public user info."""
    token = sec.create_session_token(email, role)
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=SECURE_COOKIES,
        samesite=SAME_SITE,
        path=COOKIE_PATH,
        max_age=COOKIE_MAX_AGE,
    )
    # Persist the session to the database so it survives restarts and can be
    # audited / revoked centrally.
    import time as _time
    sec.persist_session(
        token,
        email,
        role,
        expires_at=_time.time() + COOKIE_MAX_AGE,
    )
    profile = db.get_profile(email) or {"email": email, "role": role}
    return {"user": profile}


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@app.post("/auth/login")
@limiter.limit(os.getenv("RATE_LIMIT_LOGIN", "10/minute"))
async def auth_login(payload: LoginRequest, request: Request, response: Response):
    ip = _client_ip(request)
    if sec.is_ip_banned(ip):
        sec.audit_event("login.blocked.ip_banned", ip=ip)
        raise HTTPException(status_code=429, detail="Too many attempts. Try again later.")
    if sec.is_locked(payload.email):
        # Locked account: a CAPTCHA token is mandatory to proceed.
        if not payload.captcha:
            raise HTTPException(
                status_code=429,
                detail="Account temporarily locked. Complete the CAPTCHA to continue.",
            )
        # Verify against hCaptcha only when configured; otherwise accept presence.
        if not sec.verify_captcha(payload.captcha):
            raise HTTPException(
                status_code=429,
                detail="CAPTCHA verification failed. Try again.",
            )

    user = sec.authenticate_user(payload.email, payload.password)
    if not user:
        sec.register_failure(payload.email)
        sec.register_failure(ip)
        sec.maybe_ban_ip(ip)
        sec.audit_event("login.failure", email=payload.email, ip=ip)
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    sec.reset_failures(payload.email)
    sec.reset_failures(ip)
    sec.audit_event("login.success", email=user["email"], role=user["role"], ip=ip)
    return _issue_session(response, user["email"], user["role"])


@app.post("/auth/register")
@limiter.limit(os.getenv("RATE_LIMIT_LOGIN", "10/minute"))
async def auth_register(payload: RegisterRequest, request: Request, response: Response):
    """Create a new local account and start a session (auto-login)."""
    ip = _client_ip(request)
    if sec.is_ip_banned(ip):
        sec.audit_event("register.blocked.ip_banned", ip=ip)
        raise HTTPException(status_code=429, detail="Too many attempts. Try again later.")

    email = payload.email.strip().lower()
    if not EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail="Enter a valid email address.")

    # Reject if the account already exists (avoid leaking which emails are taken
    # beyond a generic message, but do not overwrite an existing account).
    if db.get_user(email):
        sec.audit_event("register.duplicate", email=email, ip=ip)
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists. Try signing in.",
        )

    role = "admin" if email in ADMIN_EMAILS else "user"
    password_hash = sec.hash_password(payload.password)
    db.create_user(email, password_hash, role, provider="local", name=payload.name)

    sec.audit_event("register.success", email=email, role=role, ip=ip)
    return _issue_session(response, email, role)
@limiter.limit(os.getenv("RATE_LIMIT_LOGIN", "10/minute"))
async def auth_google(payload: GoogleLoginRequest, request: Request, response: Response):
    """Verify a Google ID token (from Google Identity Services) and start a session."""
    ip = _client_ip(request)
    if sec.is_ip_banned(ip):
        raise HTTPException(status_code=429, detail="Too many attempts. Try again later.")
    if not GOOGLE_CLIENT_ID:
        logger.warning("Google login attempted but GOOGLE_CLIENT_ID is not configured.")
        raise HTTPException(status_code=503, detail="Google sign-in is not configured.")
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests

        # Verifies signature, expiry, and audience against Google's public certs.
        idinfo = id_token.verify_oauth2_token(
            payload.credential, google_requests.Request(), GOOGLE_CLIENT_ID
        )
        if idinfo.get("email_verified") is not True:
            raise HTTPException(status_code=401, detail="Google email is not verified.")
        email = idinfo.get("email", "")
        if not email:
            raise HTTPException(status_code=401, detail="Google account has no email.")
        # Optional domain restriction (set GOOGLE_ALLOWED_DOMAIN to limit to one org).
        allowed_domain = os.getenv("GOOGLE_ALLOWED_DOMAIN", "").strip()
        if allowed_domain and not email.lower().endswith(f"@{allowed_domain.lower()}"):
            raise HTTPException(status_code=403, detail="Email domain not allowed.")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Google token verification failed: %s", e)
        raise HTTPException(status_code=401, detail="Invalid Google sign-in.")

    role = "admin" if email.strip().lower() in ADMIN_EMAILS else "user"
    sec.audit_event("login.google.success", email=email, role=role, ip=ip)
    return _issue_session(response, email, role)


@app.post("/auth/logout")
@limiter.limit(os.getenv("RATE_LIMIT_LOGIN", "10/minute"))
async def auth_logout(request: Request, response: Response):
    claims = _session_claims(request)
    token = _read_session_cookie(request)
    if claims:
        sec.audit_event("logout", email=claims.get("email", "unknown"))
    if token:
        sec.revoke_session_token(token)
    for name in (SESSION_COOKIE_NAME, "ny_role", CONSENT_COOKIE_NAME):
        response.delete_cookie(key=name, path=COOKIE_PATH)
    return {"status": "ok"}


@app.get("/auth/me")
async def auth_me(request: Request):
    claims = _session_claims(request)
    if not claims:
        return {"authenticated": False}
    # Return the full persisted profile (name, email, role, plan, purchased),
    # not just the signed-token claims, so the UI shows up-to-date data.
    profile = db.get_profile(claims.get("email", ""))
    if not profile:
        return {"authenticated": True, "user": claims}
    return {"authenticated": True, "user": profile}


class ProfileUpdateRequest(BaseModel):
    name: Optional[constr(min_length=1, max_length=200)] = None  # type: ignore[valid-type]


@app.put("/auth/me")
@limiter.limit(os.getenv("RATE_LIMIT_LOGIN", "20/minute"))
async def auth_update_me(payload: ProfileUpdateRequest, request: Request, _csrf: None = Depends(require_csrf)):
    """Update the signed-in user's profile (currently: display name)."""
    claims = _session_claims(request)
    if not claims:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    email = claims.get("email", "")
    updated = db.update_user(email, name=payload.name)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found.")
    sec.audit_event("profile.update", email=email)
    return {"user": updated}


class PurchaseRequest(BaseModel):
    plan: constr(min_length=1, max_length=50) = "pro"  # type: ignore[valid-type]


@app.post("/auth/purchase")
@limiter.limit(os.getenv("RATE_LIMIT_LOGIN", "10/minute"))
async def auth_purchase(payload: PurchaseRequest, request: Request, _csrf: None = Depends(require_csrf)):
    """Mark the signed-in user's account as purchased for the given plan.

    NOTE: this is a local stub that records the purchase flag server-side.
    Wire it to a real payment provider (Stripe/etc.) when billing is added;
    the returned profile already reflects the updated state.
    """
    claims = _session_claims(request)
    if not claims:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    email = claims.get("email", "")
    updated = db.update_user(email, plan=payload.plan, purchased=True)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found.")
    sec.audit_event("account.purchased", email=email, detail=payload.plan)
    return {"user": updated}


class AccountTypeRequest(BaseModel):
    account_type: constr(min_length=1, max_length=30)  # type: ignore[valid-type]


@app.post("/auth/account-type")
@limiter.limit(os.getenv("RATE_LIMIT_LOGIN", "10/minute"))
async def auth_account_type(payload: AccountTypeRequest, request: Request, _csrf: None = Depends(require_csrf)):
    """Record whether the account is Individual or Organization during free trial."""
    claims = _session_claims(request)
    if not claims:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    email = claims.get("email", "")
    account_type = payload.account_type.strip().lower()
    if account_type not in ("individual", "organization"):
        raise HTTPException(status_code=400, detail="account_type must be 'individual' or 'organization'.")
    updated = db.update_user(email, account_type=account_type)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found.")
    sec.audit_event("account.type_set", email=email, detail=account_type)
    return {"user": updated}


@app.post("/consent")
@limiter.limit(os.getenv("RATE_LIMIT_LOGIN", "10/minute"))
async def set_consent(payload: ConsentRequest, request: Request, response: Response):
    """Record privacy/terms consent server-side (httpOnly cookie)."""
    if not payload.consent:
        response.delete_cookie(key=CONSENT_COOKIE_NAME, path=COOKIE_PATH)
        return {"consent": False}
    response.set_cookie(
        key=CONSENT_COOKIE_NAME,
        value="1",
        httponly=True,
        secure=SECURE_COOKIES,
        samesite=SAME_SITE,
        path=COOKIE_PATH,
        max_age=COOKIE_MAX_AGE,
    )
    claims = _session_claims(request)
    if claims:
        sec.audit_event("consent.granted", email=claims.get("email", "unknown"))
    return {"consent": True}


@app.get("/consent/status")
async def consent_status(request: Request):
    return {"required": CONSENT_REQUIRED, "granted": bool(request.cookies.get(CONSENT_COOKIE_NAME))}


# ------------------------------------------------------------------
# Chat history (CRUD over threads + messages)
# ------------------------------------------------------------------
class ThreadCreate(BaseModel):
    title: constr(min_length=1, max_length=200)  # type: ignore[valid-type]
    mode: Optional[constr(min_length=1, max_length=20)] = "ask"  # type: ignore[valid-type]


class ThreadUpdate(BaseModel):
    title: Optional[constr(min_length=1, max_length=200)] = None  # type: ignore[valid-type]
    mode: Optional[constr(min_length=1, max_length=20)] = None  # type: ignore[valid-type]


class MessageCreate(BaseModel):
    role: constr(min_length=1, max_length=20)  # type: ignore[valid-type]
    text: constr(min_length=1, max_length=65535)  # type: ignore[valid-type]
    citations: Optional[List[str]] = None


@app.get("/chat/threads")
@limiter.limit(os.getenv("RATE_LIMIT_QUERY", "20/minute"))
async def chat_threads_list(
    request: Request,
    _: None = Depends(require_auth),
    _csrf: None = Depends(require_csrf),
):
    claims = _session_claims(request)
    email = claims.get("email") if claims else None
    threads = db.get_chat_threads(email)
    return {"threads": threads}


@app.get("/chat/threads/{thread_id}")
@limiter.limit(os.getenv("RATE_LIMIT_QUERY", "20/minute"))
async def chat_thread_detail(
    thread_id: int,
    request: Request,
    _: None = Depends(require_auth),
    _csrf: None = Depends(require_csrf),
):
    claims = _session_claims(request)
    email = claims.get("email") if claims else None
    thread = db.get_chat_thread(thread_id, email)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found.")
    return thread


@app.post("/chat/threads")
@limiter.limit(os.getenv("RATE_LIMIT_QUERY", "20/minute"))
async def chat_thread_create(
    payload: ThreadCreate,
    request: Request,
    _: None = Depends(require_auth),
    _csrf: None = Depends(require_csrf),
):
    claims = _session_claims(request)
    email = claims.get("email") if claims else None
    thread = db.create_chat_thread(email, payload.title, payload.mode or "ask")
    return thread


@app.put("/chat/threads/{thread_id}")
@limiter.limit(os.getenv("RATE_LIMIT_QUERY", "20/minute"))
async def chat_thread_update(
    thread_id: int,
    payload: ThreadUpdate,
    request: Request,
    _: None = Depends(require_auth),
    _csrf: None = Depends(require_csrf),
):
    claims = _session_claims(request)
    email = claims.get("email") if claims else None
    thread = db.get_chat_thread(thread_id, email)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found.")
    updates = {}
    if payload.title is not None:
        updates["title"] = payload.title
    if payload.mode is not None:
        updates["mode"] = payload.mode
    if updates:
        thread = db.update_chat_thread(thread_id, email, **updates)
    else:
        thread = db.get_chat_thread(thread_id, email)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found.")
    return thread


@app.post("/chat/threads/{thread_id}/messages")
@limiter.limit(os.getenv("RATE_LIMIT_QUERY", "20/minute"))
async def chat_message_create(
    thread_id: int,
    payload: MessageCreate,
    request: Request,
    _: None = Depends(require_auth),
    _csrf: None = Depends(require_csrf),
):
    claims = _session_claims(request)
    email = claims.get("email") if claims else None
    thread = db.get_chat_thread(thread_id, email)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found.")
    msg = db.save_chat_message(thread_id, payload.role, payload.text, payload.citations)
    return msg


@app.delete("/chat/threads/{thread_id}")
@limiter.limit(os.getenv("RATE_LIMIT_QUERY", "20/minute"))
async def chat_thread_delete(
    thread_id: int,
    request: Request,
    _: None = Depends(require_auth),
    _csrf: None = Depends(require_csrf),
):
    claims = _session_claims(request)
    email = claims.get("email") if claims else None
    ok = db.delete_chat_thread(thread_id, email)
    if not ok:
        raise HTTPException(status_code=404, detail="Thread not found.")
    return {"status": "deleted"}


# Admin-only endpoint, server-enforced role check.
@app.get("/admin/stats")
@limiter.limit(os.getenv("RATE_LIMIT_QUERY", "20/minute"))
async def admin_stats(
    request: Request,
    _: None = Depends(require_auth),
    _csrf: None = Depends(require_csrf),
    _role: None = Depends(require_role(ADMIN_ROLES)),
):
    claims = _session_claims(request)
    sec.audit_event("admin.access", email=claims.get("email", "unknown") if claims else "unknown")
    try:
        stats = {
            "authenticated": True,
            "admin": True,
            "models_loaded": legal_nlp is not None and preamble_nlp is not None,
            "db": {
                "queries": db.query_count(),
                "audit_events": db.audit_count(),
                "users": len(db.list_users()),
            },
        }
    except Exception as e:
        logger.error("admin stats DB read failed: %s", e)
        stats = {
            "authenticated": True,
            "admin": True,
            "models_loaded": legal_nlp is not None and preamble_nlp is not None,
        }
    return stats
