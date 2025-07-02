from pydantic import BaseModel
from typing import Optional, List, Dict, Any, TYPE_CHECKING
from datetime import datetime
import uuid

if TYPE_CHECKING:
    from .book import BookList


class CollectionBase(BaseModel):
    name: str
    type: str  # manual, filtered


class CollectionCreate(CollectionBase):
    filter_query: Optional[Dict[str, Any]] = None


class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    filter_query: Optional[Dict[str, Any]] = None


class CollectionInDB(CollectionBase):
    id: uuid.UUID
    user_id: uuid.UUID
    filter_query: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class Collection(CollectionInDB):
    book_count: int = 0


class CollectionWithBooks(Collection):
    books: List["BookList"] = []


class CollectionBookAdd(BaseModel):
    book_ids: List[uuid.UUID]


class CollectionBookRemove(BaseModel):
    book_ids: List[uuid.UUID] 