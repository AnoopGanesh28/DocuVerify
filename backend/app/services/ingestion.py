"""
Document ingestion pipeline:
  1. Extract text from PDF or TXT
  2. Chunk into overlapping token windows
  3. Embed chunks with sentence-transformers (model cached at module level)
  4. Store embeddings + metadata in ChromaDB
"""

import os
import logging
from typing import List

import PyPDF2
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

# ── Embedding model (loaded once, reused for every request) ───────────────────
_MODEL_NAME = "all-MiniLM-L6-v2"
_model: SentenceTransformer | None = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        logger.info("Loading sentence-transformer model '%s'…", _MODEL_NAME)
        _model = SentenceTransformer(_MODEL_NAME)
        logger.info("Model loaded.")
    return _model


# ── Text extraction ───────────────────────────────────────────────────────────

def extract_text_from_pdf(file_path: str) -> str:
    """Return all text from a PDF file."""
    text_parts: List[str] = []
    with open(file_path, "rb") as fh:
        reader = PyPDF2.PdfReader(fh)
        for page in reader.pages:
            page_text = page.extract_text() or ""
            text_parts.append(page_text)
    return "\n".join(text_parts)


def extract_text_from_txt(file_path: str) -> str:
    """Return all text from a plain-text file (UTF-8, fallback latin-1)."""
    try:
        with open(file_path, "r", encoding="utf-8") as fh:
            return fh.read()
    except UnicodeDecodeError:
        with open(file_path, "r", encoding="latin-1") as fh:
            return fh.read()


def get_text_from_file(file_path: str, file_type: str) -> str:
    """Dispatch to the correct extractor based on file_type ('pdf' or 'txt')."""
    if file_type == "pdf":
        return extract_text_from_pdf(file_path)
    elif file_type == "txt":
        return extract_text_from_txt(file_path)
    else:
        raise ValueError(f"Unsupported file type: {file_type!r}")


# ── Chunking ──────────────────────────────────────────────────────────────────

def chunk_document(
    text: str,
    chunk_size: int = 500,
    overlap: float = 0.1,
) -> List[str]:
    """
    Split `text` into overlapping token windows.
    Splits on whitespace, so 'tokens' ≈ words.
    """
    tokens = text.split()
    if not tokens:
        return []

    overlap_size = max(1, int(chunk_size * overlap))
    step = chunk_size - overlap_size

    chunks: List[str] = []
    for i in range(0, len(tokens), step):
        chunk_tokens = tokens[i : i + chunk_size]
        chunks.append(" ".join(chunk_tokens))
        if i + chunk_size >= len(tokens):
            break

    return chunks


# ── Embedding ─────────────────────────────────────────────────────────────────

def embed_chunks(chunks: List[str]) -> List[List[float]]:
    """Embed a list of text chunks; returns a list of float vectors."""
    model = _get_model()
    embeddings = model.encode(chunks, show_progress_bar=False)
    return embeddings.tolist()


def embed_query(query: str) -> List[float]:
    """Embed a single query string."""
    model = _get_model()
    return model.encode([query], show_progress_bar=False)[0].tolist()


# ── ChromaDB storage ──────────────────────────────────────────────────────────

def store_chunks(
    document_id: int,
    filename: str,
    user_id: int,
    chunks: List[str],
    embeddings: List[List[float]],
    collection,
) -> None:
    """
    Persist chunks + embeddings in ChromaDB.
    IDs are namespaced as 'doc{document_id}_chunk{i}' to avoid collisions.
    """
    if not chunks:
        return

    ids = [f"doc{document_id}_chunk{i}" for i in range(len(chunks))]
    metadatas = [
        {"document_id": document_id, "filename": filename, "user_id": user_id, "chunk_index": i}
        for i in range(len(chunks))
    ]

    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=metadatas,
    )


def delete_document_chunks(document_id: int, collection) -> None:
    """Remove all ChromaDB entries belonging to a given document."""
    results = collection.get(where={"document_id": document_id})
    if results and results["ids"]:
        collection.delete(ids=results["ids"])
