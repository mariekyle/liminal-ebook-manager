from sqlalchemy import Column, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.orm import relationship
from ..db.base import Base
import uuid


class BookTag(Base):
    __tablename__ = "book_tags"

    book_id = Column(PostgresUUID(as_uuid=True), ForeignKey("books.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(PostgresUUID(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    book = relationship("Book", back_populates="tags")
    tag = relationship("Tag", back_populates="books")

    def __repr__(self):
        return f"<BookTag(book_id={self.book_id}, tag_id={self.tag_id})>" 