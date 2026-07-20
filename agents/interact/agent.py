"""
INTERact agent for document interaction and file-based queries.
"""
from typing import List, Dict, Any, Optional
import os
from pathlib import Path

class INTERactAgent:
    def __init__(self):
        self.document_content = ""
        self.document_name = ""
    
    def process_file_content(self, content: str, name: str) -> str:
        """Process file content directly (for when we have the file content from frontend)."""
        try:
            # For now, we'll treat all content as text
            # In a real implementation, we might detect file type and process accordingly
            self.document_content = content
            self.document_name = name
            return f"Successfully processed {self.document_name}. You can now ask questions about this document."
        except Exception as e:
            return f"Error processing file: {str(e)}"
    
    def query_document(self, query: str) -> str:
        """Answer a question about the processed document."""
        if not self.document_content:
            return "No document has been processed yet. Please upload a file first."
        
        # For now, we'll do a very simple keyword-based response
        # In a real implementation, we would use the LLM to answer questions about the document
        
        # Simple approach: if the query words are in the document, return a snippet
        query_words = set(query.lower().split())
        doc_words = set(self.document_content.lower().split())
        overlap = query_words.intersection(doc_words)
        
        if overlap:
            # Return a snippet of the document around the first matching word
            # This is just for demonstration
            return f"Based on the document '{self.document_name}', here's what I found:\n\n... {self.document_content[:500]} ..."
        else:
            return f"I couldn't find relevant information in the document '{self.document_name}' for your query. Try rephrasing or asking about different aspects of the document."

# Global instance
interact_agent = INTERactAgent()

def process_interact_query(
    query: str, 
    file_content: Optional[str] = None,
    file_name: Optional[str] = None,
    entities: Optional[List[Dict]] = None, 
    bioes_tags: Optional[List[Dict]] = None,
    context: Optional[Dict] = None,
    retrieved_docs: Optional[Dict] = None,
    web_search_results: Optional[Dict] = None
) -> Dict[str, Any]:
    """
    Process an INTERact query.
    If file_content and file_name are provided, process the file first.
    Then answer the query about the document.
    """
    if file_content is not None and file_name is not None:
        process_result = interact_agent.process_file_content(file_content, file_name)
        # If there was an error processing the file, return that
        if "Error" in process_result:
            return {
                "response": process_result,
                "agent": "INTERact",
                "status": "error"
            }
    
    # Query the document
    response = interact_agent.query_document(query)
    return {
        "response": response,
        "agent": "INTERact",
        "status": "success"
    }