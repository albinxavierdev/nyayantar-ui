"""
FastAPI endpoint for BIOES tagging
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import sys
import os
import time

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
import torch

# Add legal_NER to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "legal_NER"))

# Import resolver for routing between ASK / INTERACT / DRAFT
from agents.resolver import resolve_agent, ResolutionResult

app = FastAPI(title="Legal BIOES Tagger API")

# Add CORS middleware to allow UI to make requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global models (set by main.py)
legal_nlp = None
preamble_nlp = None
llama_tokenizer = None
llama_model = None


class QueryRequest(BaseModel):
    query: str


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
    query: str
    max_length: int = 512
    temperature: float = 0.7
    top_p: float = 0.9


class TestLocalResponse(BaseModel):
    query: str
    response: str
    model: str = "Qwen3.5-0.8B"


class TestCloudRequest(BaseModel):
    query: str


class TestCloudResponse(BaseModel):
    query: str
    response: str
    model: str = "Groq (llama-3.3-70b-versatile)"


class QueryRequest(BaseModel):
    query: str


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
            "/query": "Full pipeline: tagging → routing → agent response"
        },
        "models": {
            "qwen_loaded": llama_model is not None,
            "groq_configured": os.getenv("GROQ_API_KEY", "") != ""
        }
    }


@app.post("/tags", response_model=TagResponse)
async def tag_query(request: QueryRequest):
    """Tag a query with BIOES labels only (no routing or agent processing)"""
    global legal_nlp, preamble_nlp
    
    if not legal_nlp or not preamble_nlp:
        raise HTTPException(status_code=503, detail="Models not loaded")
    
    try:
        query = request.query.strip()
        if not query:
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        print("\n" + "="*60)
        print("PHASE 1: BIOES TAGGING")
        print("="*60)
        print(f"Query: {query}\n")
        
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
        
        # Print to server terminal
        if entities:
            print("Detected Entities:")
            for ent in entities:
                print(f"  - {ent.text} → {ent.label} (chars {ent.start}-{ent.end})")
            print()
        
        print("BIOES Tags:")
        print(f"{'Token':<30} {'Tag':<25} {'Entity Type':<20}")
        print("-"*60)
        for tag_info in bioes_tags:
            token = tag_info["token"]
            tag = tag_info["tag"]
            entity_type = tag_info["entity_type"] or "-"
            print(f"{token:<30} {tag:<25} {entity_type:<20}")
        print("="*60 + "\n")
        
        return TagResponse(
            query=query,
            bioes_tags=[BIOESTag(**tag) for tag in bioes_tags],
            entities=entities,
        )
    
    except Exception as e:
        print(f"ERROR in tagging: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/test-local", response_model=TestLocalResponse)
async def test_local_model(request: TestLocalRequest):
    """Test local Qwen3.5-0.8B model"""
    global llama_tokenizer, llama_model
    
    if not llama_tokenizer or not llama_model:
        raise HTTPException(
            status_code=503, 
            detail="Qwen model not loaded. Please ensure the model is downloaded and initialized."
        )
    
    try:
        query = request.query.strip()
        if not query:
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        print("\n" + "="*60)
        print("TEST LOCAL MODEL (Qwen3.5-0.8B)")
        print("="*60)
        print(f"Query: {query}")
        print(f"Max Length: {request.max_length}, Temperature: {request.temperature}, Top-p: {request.top_p}\n")
        
        # Tokenize input
        print("Tokenizing input...")
        inputs = llama_tokenizer(query, return_tensors="pt")
        print(f"Input tokens: {inputs.input_ids.shape[1]}")
        
        # Generate response
        print("Generating response...")
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
        
        print(f"Response: {response[:200]}...")  # Print first 200 chars
        print("="*60 + "\n")
        
        return TestLocalResponse(
            query=query,
            response=response,
            model="Qwen3.5-0.8B"
        )
    
    except Exception as e:
        print(f"ERROR in local model test: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/test-cloud", response_model=TestCloudResponse)
async def test_cloud_model(request: TestCloudRequest):
    """Test cloud Groq model"""
    try:
        query = request.query.strip()
        if not query:
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        print("\n" + "="*60)
        print("TEST CLOUD MODEL (Groq)")
        print("="*60)
        print(f"Query: {query}\n")
        
        from agents.ask import generate_response
        
        # Test with empty entities
        response = generate_response(query, entities=[], context=None)
        
        print(f"Response: {response[:200]}...")  # Print first 200 chars
        print("="*60 + "\n")
        
        return TestCloudResponse(
            query=query,
            response=response,
            model="Groq (llama-3.3-70b-versatile)"
        )
    
    except Exception as e:
        print(f"ERROR in cloud model test: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/query", response_model=QueryResponse)
async def query_full_pipeline(request: QueryRequest):
    """Full pipeline: tagging → routing → agent response"""
    global legal_nlp, preamble_nlp
    
    if not legal_nlp or not preamble_nlp:
        raise HTTPException(status_code=503, detail="Models not loaded")
    
    phases = []
    pipeline_start = time.time()
    
    try:
        query = request.query.strip()
        if not query:
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        # ============================================================
        # PHASE 1: BIOES TAGGING
        # ============================================================
        print("\n" + "="*60)
        print("PHASE 1: BIOES TAGGING")
        print("="*60)
        print(f"Query: {query}\n")
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
        
        print(f"Detected {len(entities)} entities:")
        for ent in entities:
            print(f"  - {ent.text} → {ent.label} (chars {ent.start}-{ent.end})")
        print()
        
        print(f"Generated {len(bioes_tags)} BIOES tags")
        phase1_time = time.time() - phase1_start
        print(f"Phase 1 completed in {phase1_time:.2f}s")
        print("="*60 + "\n")
        
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
        print("="*60)
        print("PHASE 2: AGENT ROUTING")
        print("="*60)
        phase2_start = time.time()
        
        resolution: ResolutionResult = resolve_agent(
            query=query,
            entities=entities,
            bioes_tags=bioes_tags,
        )
        
        print(f"Routed Agent: {resolution.agent}")
        print(f"Reason: {resolution.reason}")
        phase2_time = time.time() - phase2_start
        print(f"Phase 2 completed in {phase2_time:.2f}s")
        print("="*60 + "\n")
        
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
        print("="*60)
        print(f"PHASE 3: AGENT PROCESSING ({resolution.agent})")
        print("="*60)
        phase3_start = time.time()
        
        final_response = None
        
        if resolution.agent == "ASK":
            from agents.ask import process_ask_query
            entities_dict = [
                {"text": ent.text, "label": ent.label, "entity_type": ent.label}
                for ent in entities
            ]
            
            print("Processing with ASK agent (Groq + Document Retrieval)...")
            ask_result = process_ask_query(
                query=query,
                entities=entities_dict,
                bioes_tags=bioes_tags,
                context=None
            )
            final_response = ask_result.get("response")
            
            # Extract document retrieval info
            num_docs = ask_result.get("num_documents_retrieved", 0)
            sources = ask_result.get("sources", [])
            has_context = ask_result.get("has_document_context", False)
            timing = ask_result.get("timing", {})
            
            phase3_time = time.time() - phase3_start
            print(f"Response generated (length: {len(final_response)} chars)")
            if has_context:
                print(f"Documents retrieved: {num_docs} pages from {len(sources)} documents")
            if timing:
                print(f"Timing - Retrieval: {timing.get('document_retrieval_seconds', 0):.3f}s, "
                      f"LLM: {timing.get('llm_generation_seconds', 0):.3f}s, "
                      f"Total: {timing.get('total_agent_seconds', 0):.3f}s")
            print(f"Phase 3 completed in {phase3_time:.2f}s")
            
            phases.append(PhaseInfo(
                phase="3. Agent Processing (ASK)",
                status="completed",
                output={
                    "model": "Groq (llama-3.3-70b-versatile)",
                    "response_length": len(final_response),
                    "document_retrieval": {
                        "num_documents_retrieved": num_docs,
                        "num_sources": len(sources),
                        "has_document_context": has_context,
                        "sources": sources[:5],  # Include first 5 sources in response
                        "retrieval_time_seconds": timing.get("document_retrieval_seconds", 0),
                        "llm_generation_time_seconds": timing.get("llm_generation_seconds", 0),
                        "total_agent_time_seconds": timing.get("total_agent_seconds", 0)
                    }
                },
                message=f"ASK agent generated response using Groq{' with document context' if has_context else ' (general knowledge)'}",
                duration_seconds=round(phase3_time, 3)
            ))
            
        elif resolution.agent == "DRAFT":
            phase3_time = time.time() - phase3_start
            print(f"Phase 3 completed in {phase3_time:.2f}s")
            phases.append(PhaseInfo(
                phase="3. Agent Processing (DRAFT)",
                status="not_implemented",
                output=None,
                message="DRAFT agent not yet implemented",
                duration_seconds=round(phase3_time, 3)
            ))
            final_response = "DRAFT agent is not yet implemented."
            
        elif resolution.agent == "INTERACT":
            phase3_time = time.time() - phase3_start
            print(f"Phase 3 completed in {phase3_time:.2f}s")
            phases.append(PhaseInfo(
                phase="3. Agent Processing (INTERACT)",
                status="not_implemented",
                output=None,
                message="INTERACT agent not yet implemented",
                duration_seconds=round(phase3_time, 3)
            ))
            final_response = "INTERACT agent is not yet implemented."
        
        print("="*60 + "\n")
        
        # ============================================================
        # FINAL SUMMARY
        # ============================================================
        total_pipeline_time = time.time() - pipeline_start
        print("="*60)
        print("PIPELINE SUMMARY")
        print("="*60)
        print(f"Query: {query}")
        print(f"Routed Agent: {resolution.agent}")
        print(f"Final Response Length: {len(final_response) if final_response else 0} chars")
        print(f"\nTiming Breakdown:")
        print(f"  Phase 1 (Tagging): {phase1_time:.2f}s")
        print(f"  Phase 2 (Routing): {phase2_time:.2f}s")
        print(f"  Phase 3 (Agent): {phase3_time:.2f}s")
        print(f"  Total Pipeline: {total_pipeline_time:.2f}s")
        print("="*60 + "\n")
        
        return QueryResponse(
            query=query,
            phases=phases,
            final_response=final_response,
            routed_agent=resolution.agent
        )
    
    except Exception as e:
        print(f"ERROR in full pipeline: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
