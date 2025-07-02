# Import all models here for Alembic to detect them
from .user import User
from .book import Book
from .author import Author
from .book_author import BookAuthor
from .tag import Tag
from .book_tag import BookTag
from .user_book_status import UserBookStatus
from .collection import Collection
from .collection_book import CollectionBook

# This ensures all models are imported when the models module is imported
__all__ = [
    "User",
    "Book", 
    "Author",
    "BookAuthor",
    "Tag",
    "BookTag",
    "UserBookStatus",
    "Collection",
    "CollectionBook"
] 