# Import all schemas
from .user import User, UserCreate, UserUpdate, UserLogin, Token, TokenData
from .book import Book, BookCreate, BookUpdate, BookList, BookUploadResponse, Author, Tag
from .collection import Collection, CollectionCreate, CollectionUpdate, CollectionWithBooks

__all__ = [
    "User", "UserCreate", "UserUpdate", "UserLogin", "Token", "TokenData",
    "Book", "BookCreate", "BookUpdate", "BookList", "BookUploadResponse", "Author", "Tag",
    "Collection", "CollectionCreate", "CollectionUpdate", "CollectionWithBooks"
] 