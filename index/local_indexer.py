"""
Local Document Indexer for Legal PDFs
Extracts text from PDFs and creates a local searchable index
Maintains page-level structure without cloud dependency
"""
import os
from pathlib import Path
from typing import List, Dict, Optional
import json
import time
import sqlite3
from dataclasses import dataclass, asdict

# Try to import PDF libraries
try:
    import PyPDF2
    HAS_PYPDF2 = True
except ImportError:
    HAS_PYPDF2 = False

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)


@dataclass
class DocumentPage:
    """Represents a single page from a document"""
    doc_id: str
    page_num: int
    text: str
    category: Optional[str] = None
    subcategory: Optional[str] = None
    filename: Optional[str] = None


class LocalDocumentIndexer:
    """
    Local PDF indexer that extracts text and creates a searchable SQLite database.
    Maintains page-level structure for legal documents.
    """
    
    def __init__(self, pdf_dir: Optional[Path] = None, index_dir: Optional[Path] = None):
        """
        Initialize the local indexer.
        
        Args:
            pdf_dir: Directory containing PDFs (default: data/pdfs)
            index_dir: Directory to store index files (default: index/data)
        """
        self.project_root = Path(__file__).parent.parent
        
        # Set PDF directory
        if pdf_dir is None:
            self.pdf_dir = self.project_root / "data" / "pdfs"
        else:
            self.pdf_dir = Path(pdf_dir)
        
        # Set index directory
        if index_dir is None:
            self.index_dir = self.project_root / "index" / "data"
        else:
            self.index_dir = Path(index_dir)
        
        self.index_dir.mkdir(parents=True, exist_ok=True)
        
        # SQLite database for indexed pages
        self.db_path = self.index_dir / "document_index.db"
        self._init_database()
        
        # Metadata file
        self.metadata_file = self.index_dir / "document_metadata.json"
        self.metadata = self._load_metadata()
        
        # Check PDF libraries
        if not HAS_PYPDF2 and not HAS_PDFPLUMBER:
            print("⚠ WARNING: No PDF library installed")
            print("  Install with: pip install PyPDF2 pdfplumber")
        else:
            if HAS_PDFPLUMBER:
                print("✓ Using pdfplumber for PDF extraction")
            elif HAS_PYPDF2:
                print("✓ Using PyPDF2 for PDF extraction")
    
    def _init_database(self):
        """Initialize SQLite database for page indexing"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create documents table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                doc_id TEXT PRIMARY KEY,
                filepath TEXT NOT NULL,
                filename TEXT NOT NULL,
                category TEXT,
                subcategory TEXT,
                total_pages INTEGER,
                indexed_at REAL
            )
        """)
        
        # Create pages table with full-text search
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS pages (
                page_id INTEGER PRIMARY KEY AUTOINCREMENT,
                doc_id TEXT NOT NULL,
                page_num INTEGER NOT NULL,
                text TEXT NOT NULL,
                FOREIGN KEY (doc_id) REFERENCES documents(doc_id)
            )
        """)
        
        # Create full-text search index
        cursor.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS pages_fts USING fts5(
                doc_id,
                page_num,
                text,
                content='pages',
                content_rowid='page_id'
            )
        """)
        
        # Create regular indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_doc_id ON pages(doc_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_page_num ON pages(doc_id, page_num)")
        
        conn.commit()
        conn.close()
    
    def _load_metadata(self) -> Dict:
        """Load document metadata from file"""
        if self.metadata_file.exists():
            try:
                with open(self.metadata_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"⚠ Error loading metadata: {e}")
                return {}
        return {}
    
    def _save_metadata(self):
        """Save document metadata to file"""
        try:
            with open(self.metadata_file, 'w', encoding='utf-8') as f:
                json.dump(self.metadata, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"⚠ Error saving metadata: {e}")
    
    def _get_document_metadata(self, pdf_path: Path) -> Dict:
        """Extract metadata from PDF path structure"""
        try:
            rel_path = pdf_path.relative_to(self.pdf_dir)
            parts = rel_path.parts
            
            metadata = {
                "filepath": str(pdf_path),
                "filename": pdf_path.name,
                "category": None,
                "subcategory": None,
            }
            
            if len(parts) >= 2:
                metadata["category"] = parts[0]
            if len(parts) >= 3:
                metadata["subcategory"] = parts[1]
            
            return metadata
        except Exception as e:
            print(f"⚠ Error extracting metadata: {e}")
            return {
                "filepath": str(pdf_path),
                "filename": pdf_path.name,
                "category": None,
                "subcategory": None,
            }
    
    def _extract_text_from_pdf(self, pdf_path: Path) -> List[str]:
        """
        Extract text from PDF, returning list of page texts.
        Tries pdfplumber first (better), falls back to PyPDF2.
        """
        pages_text = []
        
        if HAS_PDFPLUMBER:
            try:
                with pdfplumber.open(pdf_path) as pdf:
                    for page in pdf.pages:
                        text = page.extract_text() or ""
                        pages_text.append(text)
                return pages_text
            except Exception as e:
                print(f"  ⚠ pdfplumber failed: {e}, trying PyPDF2...")
        
        if HAS_PYPDF2:
            try:
                with open(pdf_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    for page in pdf_reader.pages:
                        text = page.extract_text() or ""
                        pages_text.append(text)
                return pages_text
            except Exception as e:
                print(f"  ✗ PyPDF2 failed: {e}")
        
        return []
    
    def find_all_pdfs(self) -> List[Path]:
        """Find all PDF files in the PDF directory"""
        pdfs = []
        if not self.pdf_dir.exists():
            print(f"⚠ PDF directory not found: {self.pdf_dir}")
            return pdfs
        
        for pdf_file in self.pdf_dir.rglob("*.pdf"):
            pdfs.append(pdf_file)
        
        return sorted(pdfs)
    
    def index_all_documents(self, force_reindex: bool = False) -> Dict:
        """
        Index all PDF documents locally.
        
        Args:
            force_reindex: If True, reindex even if already indexed
        
        Returns:
            Dict with indexing statistics
        """
        if not HAS_PYPDF2 and not HAS_PDFPLUMBER:
            return {
                "success": False,
                "error": "No PDF library installed. Install PyPDF2 or pdfplumber",
                "indexed": 0,
                "skipped": 0,
                "failed": 0
            }
        
        print("\n" + "="*60)
        print("LOCAL INDEXING OF LEGAL DOCUMENTS")
        print("="*60)
        print(f"PDF Directory: {self.pdf_dir}")
        print(f"Index Database: {self.db_path}")
        print()
        
        pdfs = self.find_all_pdfs()
        total = len(pdfs)
        
        if total == 0:
            print("⚠ No PDF files found!")
            return {
                "success": False,
                "error": "No PDF files found",
                "indexed": 0,
                "skipped": 0,
                "failed": 0
            }
        
        print(f"Found {total} PDF files to index\n")
        
        indexed_count = 0
        skipped_count = 0
        failed_count = 0
        
        start_time = time.time()
        conn = sqlite3.connect(self.db_path)
        
        for idx, pdf_path in enumerate(pdfs, 1):
            try:
                doc_id = str(pdf_path)
                
                # Check if already indexed
                if not force_reindex:
                    cursor = conn.cursor()
                    cursor.execute("SELECT doc_id FROM documents WHERE doc_id = ?", (doc_id,))
                    if cursor.fetchone():
                        print(f"[{idx}/{total}] ⏭ Skipping (already indexed): {pdf_path.name}")
                        skipped_count += 1
                        continue
                
                print(f"[{idx}/{total}] Indexing: {pdf_path.name}")
                
                # Extract metadata
                metadata = self._get_document_metadata(pdf_path)
                
                # Extract text from PDF
                print(f"  Extracting text from PDF...")
                pages_text = self._extract_text_from_pdf(pdf_path)
                
                if not pages_text:
                    print(f"  ✗ No text extracted")
                    failed_count += 1
                    continue
                
                print(f"  ✓ Extracted {len(pages_text)} pages")
                
                # Store in database
                cursor = conn.cursor()
                
                # Insert document record
                cursor.execute("""
                    INSERT OR REPLACE INTO documents 
                    (doc_id, filepath, filename, category, subcategory, total_pages, indexed_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    doc_id,
                    metadata["filepath"],
                    metadata["filename"],
                    metadata["category"],
                    metadata["subcategory"],
                    len(pages_text),
                    time.time()
                ))
                
                # Delete old pages if reindexing
                if force_reindex:
                    cursor.execute("DELETE FROM pages WHERE doc_id = ?", (doc_id,))
                    cursor.execute("DELETE FROM pages_fts WHERE doc_id = ?", (doc_id,))
                
                # Insert pages
                for page_num, text in enumerate(pages_text, 1):
                    cursor.execute("""
                        INSERT INTO pages (doc_id, page_num, text)
                        VALUES (?, ?, ?)
                    """, (doc_id, page_num, text))
                    
                    # Get the page_id for FTS
                    page_id = cursor.lastrowid
                    
                    # Insert into FTS index
                    cursor.execute("""
                        INSERT INTO pages_fts (rowid, doc_id, page_num, text)
                        VALUES (?, ?, ?, ?)
                    """, (page_id, doc_id, page_num, text))
                
                conn.commit()
                
                # Update metadata
                self.metadata[doc_id] = {
                    **metadata,
                    "indexed_at": time.time(),
                    "indexed": True,
                    "total_pages": len(pages_text)
                }
                
                indexed_count += 1
                print(f"  ✓ Indexed successfully ({len(pages_text)} pages)")
                
            except Exception as e:
                print(f"  ✗ Error: {e}")
                import traceback
                traceback.print_exc()
                failed_count += 1
        
        conn.close()
        self._save_metadata()
        
        elapsed = time.time() - start_time
        
        print("\n" + "="*60)
        print("INDEXING SUMMARY")
        print("="*60)
        print(f"Total PDFs: {total}")
        print(f"Indexed: {indexed_count}")
        print(f"Skipped: {skipped_count}")
        print(f"Failed: {failed_count}")
        print(f"Time: {elapsed:.2f}s")
        print("="*60 + "\n")
        
        return {
            "success": True,
            "total": total,
            "indexed": indexed_count,
            "skipped": skipped_count,
            "failed": failed_count,
            "time_seconds": elapsed
        }
    
    def _sanitize_fts5_query(self, query: str) -> str:
        """
        Sanitize query string for FTS5 to avoid syntax errors.
        Removes or escapes special characters that cause FTS5 syntax errors.
        
        Args:
            query: Raw search query
        
        Returns:
            Sanitized query safe for FTS5
        """
        import re
        # FTS5 special characters that cause syntax errors: ? " ' ( ) [ ] { } | \ ^
        # Remove problematic punctuation that breaks FTS5 syntax
        # Replace with spaces
        sanitized = re.sub(r'[?!"\'()\[\]{}|\\^]', ' ', query)
        
        # Split into words and filter empty
        words = [w.strip() for w in sanitized.split() if w.strip() and len(w.strip()) > 1]
        
        if not words:
            # If all words were removed, try a simpler approach - just remove special chars
            sanitized = re.sub(r'[?!"\'()\[\]{}|\\^]', '', query).strip()
            words = [w for w in sanitized.split() if w.strip()]
        
        if not words:
            return query  # Return original if sanitization removed everything
        
        # Join with AND operator for better precision
        if len(words) <= 3:
            return ' AND '.join(words)
        else:
            # For longer queries, use OR for broader matching (limit to first 10 terms)
            return ' OR '.join(words[:10])
    
    def search(self, query: str, top_k: int = 5, category: Optional[str] = None) -> List[Dict]:
        """
        Search indexed documents using full-text search.
        
        Args:
            query: Search query
            top_k: Number of results to return
            category: Optional category filter
        
        Returns:
            List of search results with document info and page content
        """
        # Sanitize query to avoid FTS5 syntax errors
        sanitized_query = self._sanitize_fts5_query(query)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Build query with category filter
            if category:
                sql = """
                    SELECT p.doc_id, p.page_num, p.text, d.filename, d.category, d.subcategory
                    FROM pages_fts p
                    JOIN documents d ON p.doc_id = d.doc_id
                    WHERE pages_fts MATCH ? AND d.category = ?
                    ORDER BY rank
                    LIMIT ?
                """
                params = (sanitized_query, category, top_k)
            else:
                sql = """
                    SELECT p.doc_id, p.page_num, p.text, d.filename, d.category, d.subcategory
                    FROM pages_fts p
                    JOIN documents d ON p.doc_id = d.doc_id
                    WHERE pages_fts MATCH ?
                    ORDER BY rank
                    LIMIT ?
                """
                params = (sanitized_query, top_k)
            
            cursor.execute(sql, params)
            results = []
            
            for row in cursor.fetchall():
                doc_id, page_num, text, filename, cat, subcat = row
                results.append({
                    "doc_id": doc_id,
                    "page_num": page_num,
                    "text": text,
                    "filename": filename,
                    "category": cat,
                    "subcategory": subcat,
                    "metadata": self.metadata.get(doc_id, {})
                })
            
            return results
            
        except Exception as e:
            print(f"⚠ Search error: {e}")
            return []
        finally:
            conn.close()
    
    def get_index_stats(self) -> Dict:
        """Get statistics about the index"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM documents")
        total_docs = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM pages")
        total_pages = cursor.fetchone()[0]
        
        conn.close()
        
        pdfs = self.find_all_pdfs()
        
        return {
            "total_pdfs": len(pdfs),
            "indexed_documents": total_docs,
            "indexed_pages": total_pages,
            "index_db": str(self.db_path),
            "pdf_dir": str(self.pdf_dir)
        }
