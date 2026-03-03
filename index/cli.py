#!/usr/bin/env python3
"""
CLI tool for indexing legal documents
"""
import argparse
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from index.local_indexer import LocalDocumentIndexer


def main():
    parser = argparse.ArgumentParser(description="Index legal PDF documents")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force reindexing of all documents"
    )
    parser.add_argument(
        "--pdf-dir",
        type=str,
        help="PDF directory path (default: data/pdfs)"
    )
    parser.add_argument(
        "--index-dir",
        type=str,
        help="Index storage directory (default: index/data)"
    )
    parser.add_argument(
        "--stats",
        action="store_true",
        help="Show index statistics"
    )
    
    args = parser.parse_args()
    
    # Initialize local indexer (works without cloud API)
    pdf_dir = Path(args.pdf_dir) if args.pdf_dir else None
    index_dir = Path(args.index_dir) if args.index_dir else None
    
    indexer = LocalDocumentIndexer(pdf_dir=pdf_dir, index_dir=index_dir)
    
    if args.stats:
        # Show statistics
        stats = indexer.get_index_stats()
        print("\n" + "="*60)
        print("INDEX STATISTICS")
        print("="*60)
        print(f"Total PDFs: {stats['total_pdfs']}")
        print(f"Indexed Documents: {stats['indexed_documents']}")
        print(f"Indexed Pages: {stats['indexed_pages']}")
        print(f"PDF Directory: {stats['pdf_dir']}")
        print(f"Index Database: {stats['index_db']}")
        print("="*60 + "\n")
    else:
        # Index documents
        stats = indexer.index_all_documents(force_reindex=args.force)
        
        if not stats.get("success"):
            print(f"ERROR: {stats.get('error', 'Unknown error')}")
            sys.exit(1)
        
        sys.exit(0)


if __name__ == "__main__":
    main()
