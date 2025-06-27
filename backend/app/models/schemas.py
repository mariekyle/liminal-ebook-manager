from pydantic import BaseModel, validator
from datetime import datetime
from typing import Optional

class BookCreate(BaseModel):
    title: str
    author: str
    description: Optional[str] = None
    isbn: Optional[str] = None
    language: Optional[str] = None
    publisher: Optional[str] = None
    
    @validator('title', 'author')
    def validate_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Field cannot be empty')
        return v.strip()

class BookResponse(BaseModel):
    id: int
    title: str
    author: str
    description: Optional[str]
    file_path: Optional[str]
    file_size: Optional[int]
    added_date: datetime
    cover_path: Optional[str]
    isbn: Optional[str]
    language: Optional[str]
    publisher: Optional[str]
    publication_date: Optional[datetime]
    word_count: Optional[int]
    tags: Optional[str]
    
    class Config:
        from_attributes = True 