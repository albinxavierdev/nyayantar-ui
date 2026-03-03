"""
Query interface for indexed legal documents
"""
from pathlib import Path
from typing import List, Dict, Optional
from .local_indexer import LocalDocumentIndexer

# Global indexer instance
_indexer: Optional[LocalDocumentIndexer] = None


def get_indexer() -> LocalDocumentIndexer:
    """Get or create the global indexer instance."""
    global _indexer
    if _indexer is None:
        _indexer = LocalDocumentIndexer()
    return _indexer


def query_documents(
    query: str,
    top_k: int = 5,
    category: Optional[str] = None,
    subcategory: Optional[str] = None
) -> List[Dict]:
    """
    Query indexed legal documents.
    
    Args:
        query: Search query string
        top_k: Number of results to return
        category: Optional category filter (e.g., "Criminal Law - Substantive")
        subcategory: Optional subcategory filter (e.g., "IPC 1860")
    
    Returns:
        List of search results with document info and content
    """
    indexer = get_indexer()
    results = indexer.search(query, top_k=top_k, category=category)
    
    # Filter by subcategory if specified
    if subcategory:
        filtered_results = []
        for result in results:
            metadata = result.get("metadata", {})
            if metadata.get("subcategory") == subcategory:
                filtered_results.append(result)
        return filtered_results[:top_k]
    
    return results


def get_document_context(
    document_path: str,
    page_number: Optional[int] = None,
    section: Optional[str] = None
) -> str:
    """
    Get specific context from a document.
    
    Args:
        document_path: Path to the document
        page_number: Optional page number
        section: Optional section identifier
    
    Returns:
        Document content/context
    """
    indexer = get_indexer()
    # Implementation depends on PageIndex API
    # This is a placeholder
    return ""


def search_by_entities(
    entities: List[Dict],
    query: str,
    top_k: int = 5
) -> List[Dict]:
    """
    Search documents using detected entities to improve results.
    
    Args:
        entities: List of detected entities (from NER)
        query: Original query
        top_k: Number of results
    
    Returns:
        Search results
    """
    # Build enhanced query from entities
    entity_terms = []
    for ent in entities:
        if isinstance(ent, dict):
            text = ent.get("text", "")
            label = ent.get("label", "")
        else:
            text = getattr(ent, "text", "")
            label = getattr(ent, "label", "")
        
        # Add entity text to search terms
        if text:
            entity_terms.append(text)
        
        # Use label to filter by category if it's a STATUTE or ACT
        if label in ["STATUTE", "ACT", "PROVISION"]:
            # Could map to category/subcategory
            pass
    
    # Combine query with entity terms
    enhanced_query = query
    if entity_terms:
        enhanced_query = f"{query} {' '.join(entity_terms)}"
    
    return query_documents(enhanced_query, top_k=top_k)
