"""
DocuVerify – FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from db.database import Base, engine

# Import all models so SQLAlchemy's metadata knows about them before create_all()
import models.base  # noqa: F401

# ── Create database tables ────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="DocuVerify",
    description="Enterprise RAG Knowledge Base – upload documents and query them with an LLM",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173", 
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
from auth.router import router as auth_router
from documents.router import router as docs_router

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(docs_router, tags=["documents"])


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["health"])
def health_check():
    return {"status": "healthy", "service": "DocuVerify"}


# ── Root ──────────────────────────────────────────────────────────────────────
@app.get("/", tags=["root"])
def root():
    return {"message": "Welcome to DocuVerify. Visit /docs for the API reference."}
