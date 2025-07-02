from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
import uuid


class AuthorBase(BaseModel):
    name: str


class AuthorCreate(AuthorBase):
    pass


class Author(AuthorBase):
    id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


class TagBase(BaseModel):
    name: str


class TagCreate(TagBase):
    pass


class Tag(TagBase):
    id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


class BookBase(BaseModel):
    title: str
    word_count: Optional[int] = None
    publish_date: Optional[date] = None
    series: Optional[str] = None
    publisher: Optional[str] = None
    isbn: Optional[str] = None
    estimated_read_time: Optional[int] = None


class BookCreate(BookBase):
    file_path: str
    file_hash: str
    authors: List[str] = []
    tags: List[str] = []


class BookUpdate(BaseModel):
    title: Optional[str] = None
    word_count: Optional[int] = None
    publish_date: Optional[date] = None
    series: Optional[str] = None
    publisher: Optional[str] = None
    isbn: Optional[str] = None
    cover_path: Optional[str] = None
    estimated_read_time: Optional[int] = None
    authors: Optional[List[str]] = None
    tags: Optional[List[str]] = None


class BookInDB(BookBase):
    id: uuid.UUID
    file_path: str
    file_hash: str
    cover_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Book(BookInDB):
    authors: List[Author] = []
    tags: List[Tag] = []


class BookList(BaseModel):
    id: uuid.UUID
    title: str
    cover_path: Optional[str] = None
    authors: List[Author] = []
    tags: List[Tag] = []
    created_at: datetime

    class Config:
        from_attributes = True


class BookUploadResponse(BaseModel):
    id: uuid.UUID
    title: str
    message: str 