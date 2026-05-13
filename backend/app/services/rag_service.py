import logging
import requests
from typing import List, Dict, Any, Tuple

from core.config import settings
from db.vector_store import get_collection
from services.ingestion import embed_query

logger = logging.getLogger(__name__)

def retrieve_context(query: str, user_id: int, top_k: int = 5) -> Tuple[List[str], List[Dict[str, Any]]]:
    """
    Embed the query and retrieve the top_k most similar chunks for the given user.
    Returns (list_of_chunks, list_of_metadata).
    """
    collection = get_collection()
    query_embedding = embed_query(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where={"user_id": user_id}
    )

    if not results or not results.get("documents") or not results["documents"][0]:
        return [], []

    documents = results["documents"][0]
    metadatas = results["metadatas"][0]
    
    return documents, metadatas

def call_ollama(context: str, question: str) -> str:
    """
    Send the context and question to the local Ollama LLM.
    """
    prompt = f"Based ONLY on the following context, answer the question.\n\nContext:\n{context}\n\nQuestion:\n{question}"
    
    payload = {
        "model": settings.OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False
    }
    
    try:
        response = requests.post(
            f"{settings.OLLAMA_BASE_URL}/api/generate",
            json=payload,
            timeout=60
        )
        response.raise_for_status()
        data = response.json()
        return data.get("response", "Error: No response generated.")
    except requests.exceptions.RequestException as e:
        logger.error("Ollama connection error: %s", str(e))
        return f"Error communicating with LLM: {str(e)}"

def format_response(answer: str, metadatas: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Format the final response with source citations.
    """
    sources = []
    # Use a set to track unique sources
    seen = set()
    
    for meta in metadatas:
        doc_id = meta.get("document_id")
        filename = meta.get("filename", "Unknown")
        chunk_idx = meta.get("chunk_index", "N/A")
        
        # Simple uniqueness by filename + chunk (could just be filename depending on UX)
        source_key = f"{filename}_{chunk_idx}"
        if source_key not in seen:
            seen.add(source_key)
            sources.append({
                "document_id": doc_id,
                "filename": filename,
                "chunk_index": chunk_idx
            })
            
    return {
        "answer": answer,
        "sources": sources
    }
