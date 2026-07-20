"""
DRAFT agent for generating legal documents.
"""
from typing import Dict, Any, Optional

class DRAFTAgent:
    def __init__(self):
        # Simple templates for demonstration
        self.templates = {
            "legal notice": """
LEGAL NOTICE

[Your Name]
[Your Address]
[City, State, ZIP Code]
[Email Address]
[Phone Number]
[Date]

[Recipient's Name]
[Recipient's Address]
[City, State, ZIP Code]

Subject: Legal Notice Regarding [Subject Matter]

Dear [Recipient's Name],

This letter serves as a formal legal notice regarding [brief description of the issue]. 

[Detailed explanation of the facts, legal basis, and specific demands]

Please govern yourself accordingly.

Sincerely,

[Your Name]
[Your Title, if applicable]
""",
            "affidavit": """
AFFIDAVIT

I, [Your Full Name], residing at [Your Address], do hereby solemnly affirm and declare as follows:

1. That I am a citizen of India and currently residing at the address mentioned above.
2. That the facts stated herein are true and correct to the best of my knowledge and belief.
3. [Additional paragraphs as needed]

DEPONENT

VERIFICATION

I, the above named deponent, do hereby verify that the contents of this affidavit are true and correct to the best of my knowledge and belief, no part of it is false and nothing material has been concealed therefrom.

Verified at [City] on this [Date] day of [Month], [Year].

DEPONENT
""",
            "plaint": """
IN THE COURT OF [Court Name]
[City, State]

SUIT NO. ______ OF ______

BETWEEN

[Plaintiff's Full Name]  
[Plaintiff's Address]  
..... Plaintiff

VERSUS

[Defendant's Full Name]  
[Defendant's Address]  
..... Defendant

PLAINT

[Detailed plaint contents including cause of action, jurisdiction, relief sought, etc.]

VERIFICATION

I, [Plaintiff's Name], the plaintiff named above, do hereby verify that the contents of paragraphs 1 to [last paragraph number] are true to my personal knowledge and that I have not concealed anything material therein.

VERIFIED AT [PLACE] ON THIS [DAY] DAY OF [MONTH], [YEAR].

[PLAINTIFF'S SIGNATURE]
"""
        }
    
    def generate_document(self, doc_type: str, details: Dict[str, str]) -> str:
        """Generate a document based on type and details."""
        doc_type_lower = doc_type.lower().strip()
        
        # Find the closest matching template
        template = None
        for key in self.templates:
            if key in doc_type_lower or doc_type_lower in key:
                template = self.templates[key]
                break
        
        if not template:
            # Default to a generic legal document
            template = """
LEGAL DOCUMENT

[Document Type: {doc_type}]
[Date: {date}]

This document has been generated based on the provided requirements.

[Content would be generated here based on the specific details provided]

Prepared by: [Your Name/Organization]
"""
            # Replace placeholders
            return template.format(
                doc_type=doc_type,
                details=str(details),
                date="[Date]"
            )
        
        # Replace placeholders in the template
        # For simplicity, we'll just return the template with a note
        # In a real implementation, we would replace specific placeholders
        return f"Generated {doc_type} document:\n\n{template}\n\nNote: Please fill in the bracketed details with your specific information."

# Global instance
draft_agent = DRAFTAgent()

def process_draft_query(
    query: str, 
    entities: Optional[List[Dict]] = None, 
    bioes_tags: Optional[List[Dict]] = None,
    context: Optional[Dict] = None,
    retrieved_docs: Optional[Dict] = None,
    web_search_results: Optional[Dict] = None,
    details: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Process a DRAFT query to generate a legal document.
    """
    if details is None:
        details = {}
    
    # Determine document type from query
    doc_type = "Legal Document"
    # Simple extraction: look for common document types in the query
    query_lower = query.lower()
    if "notice" in query_lower:
        doc_type = "Legal Notice"
    elif "affidavit" in query_lower:
        doc_type = "Affidavit"
    elif "plaint" in query_lower or "complaint" in query_lower:
        doc_type = "Plaint"
    elif "agreement" in query_lower:
        doc_type = "Agreement"
    elif "petition" in query_lower:
        doc_type = "Petition"
    elif "will" in query_lower:
        doc_type = "Will"
    
    # Generate the document
    document = draft_agent.generate_document(doc_type, details)
    
    return {
        "response": document,
        "agent": "DRAFT",
        "document_type": doc_type,
        "status": "success"
    }