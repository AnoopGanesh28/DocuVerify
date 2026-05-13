import os
import shutil
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from db.database import get_db
from db.vector_store import get_collection
from core.security import get_current_user
from models.user import User
from models.document import Document
from documents.schemas import DocumentResponse
from services.ingestion import (
    get_text_from_file,
    chunk_document,
    embed_chunks,
    store_chunks,
)

router = APIRouter()

TEMP_UPLOAD_DIR = "temp_uploads"
os.makedirs(TEMP_UPLOAD_DIR, exist_ok=True)


@router.post(
    "/upload",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and ingest a document",
)
def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    file_extension = file.filename.split('.')[-1].lower()
    if file_extension not in ["pdf", "txt"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Please upload a PDF or TXT file."
        )

    # 1. Save file temporarily
    temp_filename = f"{uuid.uuid4()}_{file.filename}"
    temp_file_path = os.path.join(TEMP_UPLOAD_DIR, temp_filename)
    
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # 2. Extract text
        text = get_text_from_file(temp_file_path, file_extension)
        
        # 3. Chunk document
        chunks = chunk_document(text)
        if not chunks:
            raise HTTPException(status_code=400, detail="No readable text found in document")

        # 4. Generate embeddings
        embeddings = embed_chunks(chunks)

        # 5. Save document record in DB
        new_doc = Document(
            filename=temp_filename,
            original_filename=file.filename,
            file_type=file_extension,
            chunk_count=len(chunks),
            user_id=current_user.id
        )
        db.add(new_doc)
        db.commit()
        db.refresh(new_doc)

        # 6. Store in ChromaDB with metadata
        collection = get_collection()
        store_chunks(
            document_id=new_doc.id,
            filename=new_doc.original_filename,
            user_id=current_user.id,
            chunks=chunks,
            embeddings=embeddings,
            collection=collection,
        )

        return new_doc

    finally:
        # Clean up temp file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
