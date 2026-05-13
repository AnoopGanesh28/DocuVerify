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
