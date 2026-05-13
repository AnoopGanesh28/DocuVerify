import chromadb
from chromadb.config import Settings as ChromaSettings

from core.config import settings

# Persistent ChromaDB client – data survives restarts
_client = chromadb.PersistentClient(
    path=settings.CHROMA_PERSIST_DIR,
)


def get_collection(name: str = "documents"):
    """Return (or create) a ChromaDB collection using cosine similarity."""
    return _client.get_or_create_collection(
        name=name,
        metadata={"hnsw:space": "cosine"},
    )
