"""
Pydantic schemas for API request/response validation.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class BookBase(BaseModel):
    """Base book schema with common fields."""
    title: str = Field(..., min_length=1, max_length=500)
    author: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None

class BookCreate(BookBase):
    """Schema for creating a new book."""
    pass

class BookUpdate(BaseModel):
    """Schema for updating book metadata."""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    author: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None

class BookResponse(BookBase):
    """Schema for book responses."""
    id: int
    file_path: str
    file_size: int
    added_date: datetime
    
    class Config:
        from_attributes = True

class BookUploadResponse(BaseModel):
    """Schema for book upload response."""
    message: str
    book: BookResponse 