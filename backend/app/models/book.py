from sqlalchemy import Column, String, Integer, Date, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.orm import relationship
from ..db.base import Base
import uuid


class Book(Base):
    __tablename__ = "books"

    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    file_path = Column(String(500), nullable=False)
    file_hash = Column(String(64), unique=True, nullable=False, index=True)
    title = Column(String(500), nullable=False, index=True)
    word_count = Column(Integer)
    publish_date = Column(Date)
    series = Column(String(255), index=True)
    publisher = Column(String(255))
    isbn = Column(String(20), index=True)
    cover_path = Column(String(500))
    estimated_read_time = Column(Integer)  # in minutes
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    authors = relationship("BookAuthor", back_populates="book")
    tags = relationship("BookTag", back_populates="book")
    user_statuses = relationship("UserBookStatus", back_populates="book")
    collection_books = relationship("CollectionBook", back_populates="book")

    def __repr__(self):
        return f"<Book(id={self.id}, title='{self.title}')>" 