"""
Local Document Indexing for Legal PDFs
"""
from .local_indexer import LocalDocumentIndexer
from .query import query_documents

__all__ = ['LocalDocumentIndexer', 'query_documents']
