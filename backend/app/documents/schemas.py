from pydantic import BaseModel
from datetime import datetime

class DocumentResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_type: str
    chunk_count: int
    upload_timestamp: datetime

    model_config = {"from_attributes": True}

class QueryRequest(BaseModel):
    question: str

class Source(BaseModel):
    document_id: int
    filename: str
    chunk_index: int

class QueryResponse(BaseModel):
    answer: str
    sources: list[Source]
