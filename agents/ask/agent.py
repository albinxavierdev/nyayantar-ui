"""
ASK Agent - Research & Retrieval using Groq + Local Document Index
Handles legal research queries with document retrieval pipeline:
1. Search indexed legal documents
2. Retrieve relevant pages/sections
3. Generate response with context using Groq
"""
import os
import time
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from groq import Groq
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(env_path)

# Groq API configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = "llama-3.3-70b-versatile"  # Fast and capable model

# Import document indexer
try:
    from index.query import query_documents, search_by_entities
    HAS_INDEX = True
except ImportError:
    HAS_INDEX = False
    print("⚠ Document index not available. Install index module.")

# Load system prompt from file
PROMPT_FILE = Path(__file__).parent / "prompt.txt"

def load_system_prompt() -> str:
    """Load the system prompt from prompt.txt file"""
    try:
        if PROMPT_FILE.exists():
            with open(PROMPT_FILE, 'r', encoding='utf-8') as f:
                return f.read().strip()
        else:
            # Fallback to default prompt if file doesn't exist
            return "You are Nyayantar, India's first Legal AI Agent, developed by Bizfy Solutions. You specialize in Indian legal matters and provide clear, professional, and precise legal guidance."
    except Exception as e:
        print(f"[ASK Agent] ⚠ Error loading prompt file: {e}")
        return "You are Nyayantar, India's first Legal AI Agent, developed by Bizfy Solutions. You specialize in Indian legal matters and provide clear, professional, and precise legal guidance."


def retrieve_document_context(
    query: str,
    entities: List[Dict],
    top_k: int = 5
) -> Dict:
    """
    Retrieve relevant document context from indexed legal documents.
    
    Args:
        query: User's legal question
        entities: Detected entities from NER
        top_k: Number of document pages to retrieve
    
    Returns:
        Dict with retrieved_context (formatted text), sources (list of citations), and timing info
    """
    retrieval_start = time.time()
    
    if not HAS_INDEX:
        retrieval_time = time.time() - retrieval_start
        return {
            "retrieved_context": None,
            "sources": [],
            "num_results": 0,
            "retrieval_time_seconds": round(retrieval_time, 3)
        }
    
    try:
        print(f"\n[ASK Agent] 📚 DOCUMENT RETRIEVAL")
        print(f"[ASK Agent] {'='*60}")
        print(f"[ASK Agent] Query: {query}")
        print(f"[ASK Agent] Searching indexed documents...")
        
        # Use entity-enhanced search if entities are available
        if entities:
            print(f"[ASK Agent] Using entity-enhanced search ({len(entities)} entities)")
            # Extract relevant entities for search
            search_terms = []
            category_filter = None
            
            for ent in entities:
                if isinstance(ent, dict):
                    text = ent.get("text", "")
                    label = ent.get("label", "")
                else:
                    text = getattr(ent, "text", "")
                    label = getattr(ent, "label", "")
                
                if text:
                    search_terms.append(text)
                    print(f"[ASK Agent]   - Entity: {text} ({label})")
                
                # Use STATUTE/ACT entities to filter by category
                if label in ["STATUTE", "ACT"] and not category_filter:
                    # Could map entity to category, for now use as search term
                    pass
            
            # Build enhanced query
            enhanced_query = f"{query} {' '.join(search_terms[:3])}" if search_terms else query
            print(f"[ASK Agent] Enhanced query: {enhanced_query}")
            results = search_by_entities(entities, query, top_k=top_k)
        else:
            print(f"[ASK Agent] Using simple search (no entities)")
            results = query_documents(query, top_k=top_k)
        
        search_time = time.time() - retrieval_start
        print(f"[ASK Agent] Search completed in {search_time:.3f}s")
        
        if not results:
            retrieval_time = time.time() - retrieval_start
            print(f"[ASK Agent] ⚠ No relevant documents found")
            print(f"[ASK Agent] Total retrieval time: {retrieval_time:.3f}s")
            print(f"[ASK Agent] {'='*60}\n")
            return {
                "retrieved_context": None,
                "sources": [],
                "num_results": 0,
                "retrieval_time_seconds": round(retrieval_time, 3)
            }
        
        print(f"[ASK Agent] ✓ Found {len(results)} relevant document pages")
        print(f"[ASK Agent] Retrieved documents:")
        
        # Format retrieved context
        context_parts = []
        sources = []
        
        for idx, result in enumerate(results, 1):
            filename = result.get("filename", "Unknown")
            page_num = result.get("page_num", 0)
            text = result.get("text", "")
            category = result.get("category", "")
            subcategory = result.get("subcategory", "")
            
            # Format source citation
            source_info = f"{filename}"
            if subcategory:
                source_info = f"{subcategory} - {source_info}"
            if category:
                source_info = f"{category} / {source_info}"
            source_info += f" (Page {page_num})"
            
            sources.append({
                "filename": filename,
                "page": page_num,
                "category": category,
                "subcategory": subcategory,
                "citation": source_info
            })
            
            # Log each retrieved document
            print(f"[ASK Agent]   [{idx}] {source_info}")
            print(f"[ASK Agent]      Text length: {len(text)} chars")
            
            # Add to context (limit text length per page)
            page_text = text[:1000] if len(text) > 1000 else text  # Limit to 1000 chars per page
            context_parts.append(f"[Document {idx}: {source_info}]\n{page_text}\n")
        
        retrieved_context = "\n---\n".join(context_parts)
        retrieval_time = time.time() - retrieval_start
        
        print(f"[ASK Agent] Total context length: {len(retrieved_context)} chars")
        print(f"[ASK Agent] ✓ Document retrieval completed in {retrieval_time:.3f}s")
        print(f"[ASK Agent] {'='*60}\n")
        
        return {
            "retrieved_context": retrieved_context,
            "sources": sources,
            "num_results": len(results),
            "retrieval_time_seconds": round(retrieval_time, 3)
        }
        
    except Exception as e:
        retrieval_time = time.time() - retrieval_start
        print(f"[ASK Agent] ⚠ Error retrieving documents: {e}")
        import traceback
        print(f"[ASK Agent] Traceback: {traceback.format_exc()}")
        print(f"[ASK Agent] Retrieval time before error: {retrieval_time:.3f}s")
        print(f"[ASK Agent] {'='*60}\n")
        return {
            "retrieved_context": None,
            "sources": [],
            "num_results": 0,
            "retrieval_time_seconds": round(retrieval_time, 3)
        }


def generate_response(
    query: str,
    entities: List[Dict],
    context: Optional[str] = None,
    retrieved_docs: Optional[Dict] = None
) -> Tuple[str, float]:
    """
    Generate a response using Groq API with retrieved document context.
    
    Args:
        query: User's legal question
        entities: Detected entities from NER
        context: Optional context (matter history, etc.)
        retrieved_docs: Optional retrieved document context from index
    
    Returns:
        Generated response string
    """
    if not GROQ_API_KEY:
        return ("ERROR: GROQ_API_KEY not set. Please create a .env file in the project root with GROQ_API_KEY=your-key-here (see .env.example)", 0.0)
    
    generation_start = time.time()
    
    try:
        print(f"[ASK Agent] 🤖 LLM GENERATION")
        print(f"[ASK Agent] {'='*60}")
        
        client = Groq(api_key=GROQ_API_KEY)
        
        # Build prompt with context
        prompt_parts = []
        
        # Add retrieved document context (RAG)
        if retrieved_docs and retrieved_docs.get("retrieved_context"):
            print(f"[ASK Agent] Including {retrieved_docs.get('num_results', 0)} document pages in context")
            prompt_parts.append("="*60)
            prompt_parts.append("RELEVANT LEGAL DOCUMENTS:")
            prompt_parts.append("="*60)
            prompt_parts.append(retrieved_docs["retrieved_context"])
            prompt_parts.append("="*60)
            prompt_parts.append("")
        else:
            print(f"[ASK Agent] No document context (using general knowledge)")
        
        # Add additional context if provided
        if context:
            prompt_parts.append(f"Additional Context: {context}\n")
        
        # Add detected entities for better context
        if entities:
            entity_info = []
            for ent in entities:
                if isinstance(ent, dict):
                    label = ent.get("label", ent.get("entity_type", "UNKNOWN"))
                    text = ent.get("text", "")
                else:
                    label = getattr(ent, "label", "UNKNOWN")
                    text = getattr(ent, "text", "")
                entity_info.append(f"{label}: {text}")
            
            if entity_info:
                prompt_parts.append(f"Detected legal entities: {', '.join(entity_info)}\n")
        
        # Add the query
        prompt_parts.append(f"Question: {query}\n\n")
        
        # Add instructions (minimal - system prompt handles most guidance)
        instructions = "Please provide a clear, accurate answer focusing on Indian legal context."
        prompt_parts.append(instructions)
        
        full_prompt = "\n".join(prompt_parts)
        
        print(f"[ASK Agent] Calling Groq API (model: {GROQ_MODEL})...")
        print(f"[ASK Agent] Prompt length: {len(full_prompt)} chars")
        
        # Load system prompt from file
        system_prompt = load_system_prompt()
        
        # Call Groq API
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": full_prompt
                }
            ],
            model=GROQ_MODEL,
            temperature=0.7,
            max_tokens=2048,  # Increased for longer responses with citations
        )
        
        response = chat_completion.choices[0].message.content
        generation_time = time.time() - generation_start
        print(f"[ASK Agent] ✓ Response generated ({len(response)} chars)")
        print(f"[ASK Agent] LLM generation time: {generation_time:.3f}s")
        print(f"[ASK Agent] {'='*60}\n")
        
        return response.strip(), generation_time
        
    except Exception as e:
        generation_time = time.time() - generation_start
        print(f"[ASK Agent] ✗ Error generating response: {e}")
        import traceback
        print(f"[ASK Agent] Traceback: {traceback.format_exc()}")
        print(f"[ASK Agent] Generation time before error: {generation_time:.3f}s")
        print(f"[ASK Agent] {'='*60}\n")
        return f"ERROR: Failed to generate response with Groq: {str(e)}", generation_time


def process_ask_query(
    query: str,
    entities: List[Dict],
    bioes_tags: List[Dict],
    context: Optional[str] = None
) -> Dict:
    """
    Process an ASK query with document retrieval pipeline.
    
    Pipeline:
    1. Retrieve relevant documents from local index
    2. Extract context from retrieved pages
    3. Generate response using Groq with document context (RAG)
    
    Args:
        query: User's query
        entities: Detected entities
        bioes_tags: BIOES tags
        context: Optional context
    
    Returns:
        Dict with response, sources, and metadata
    """
    agent_start = time.time()
    
    print(f"\n{'='*60}")
    print(f"ASK AGENT - QUERY PROCESSING")
    print(f"{'='*60}")
    print(f"Query: {query}")
    print(f"Detected {len(entities)} entities")
    if entities:
        for ent in entities:
            if isinstance(ent, dict):
                print(f"  - {ent.get('text', '')} → {ent.get('label', '')}")
            else:
                print(f"  - {getattr(ent, 'text', '')} → {getattr(ent, 'label', '')}")
    print()
    
    # Step 1: Retrieve relevant documents from index
    retrieved_docs = retrieve_document_context(query, entities, top_k=5)
    retrieval_time = retrieved_docs.get("retrieval_time_seconds", 0)
    
    # Step 2: Generate response with retrieved context
    response, generation_time = generate_response(
        query=query,
        entities=entities,
        context=context,
        retrieved_docs=retrieved_docs
    )
    
    total_time = time.time() - agent_start
    
    print(f"[ASK Agent] ✅ FINAL RESPONSE")
    print(f"[ASK Agent] Response length: {len(response)} chars")
    if retrieved_docs.get("sources"):
        print(f"[ASK Agent] Sources cited: {len(retrieved_docs['sources'])} documents")
        for source in retrieved_docs['sources'][:3]:
            print(f"[ASK Agent]   - {source['citation']}")
    print(f"[ASK Agent] Timing Breakdown:")
    print(f"[ASK Agent]   - Document Retrieval: {retrieval_time:.3f}s")
    print(f"[ASK Agent]   - LLM Generation: {generation_time:.3f}s")
    print(f"[ASK Agent]   - Total ASK Agent: {total_time:.3f}s")
    print(f"{'='*60}\n")
    
    return {
        "agent": "ASK",
        "query": query,
        "response": response,
        "entities": entities,
        "model": "Groq (llama-3.3-70b-versatile)",
        "sources": retrieved_docs.get("sources", []),
        "num_documents_retrieved": retrieved_docs.get("num_results", 0),
        "has_document_context": retrieved_docs.get("num_results", 0) > 0,
        "timing": {
            "document_retrieval_seconds": retrieved_docs.get("retrieval_time_seconds", 0),
            "llm_generation_seconds": round(generation_time, 3),
            "total_agent_seconds": round(total_time, 3)
        }
    }
