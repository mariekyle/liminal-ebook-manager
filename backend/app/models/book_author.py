from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..db.base import Base
import uuid


class BookAuthor(Base):
    __tablename__ = "book_authors"

    book_id = Column(String, ForeignKey("books.id", ondelete="CASCADE"), primary_key=True)
    author_id = Column(String, ForeignKey("authors.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    book = relationship("Book", back_populates="authors")
    author = relationship("Author", back_populates="books")

    def __repr__(self):
        return f"<BookAuthor(book_id={self.book_id}, author_id={self.author_id})>" 