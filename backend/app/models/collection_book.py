from sqlalchemy import Column, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.orm import relationship
from ..db.base import Base
import uuid


class CollectionBook(Base):
    __tablename__ = "collection_books"

    collection_id = Column(PostgresUUID(as_uuid=True), ForeignKey("collections.id", ondelete="CASCADE"), primary_key=True)
    book_id = Column(PostgresUUID(as_uuid=True), ForeignKey("books.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    collection = relationship("Collection", back_populates="books")
    book = relationship("Book", back_populates="collection_books")

    def __repr__(self):
        return f"<CollectionBook(collection_id={self.collection_id}, book_id={self.book_id})>" 