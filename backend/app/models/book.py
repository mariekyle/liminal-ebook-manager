"""
Book model for the database.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, BigInteger
from sqlalchemy.sql import func
from app.config.database import Base

class Book(Base):
    """Book model representing an ebook in the library."""
    
    __tablename__ = "books"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    author = Column(String(500), nullable=True, index=True)
    description = Column(Text, nullable=True)
    file_path = Column(String(1000), nullable=False, unique=True)
    file_size = Column(BigInteger, nullable=False)  # File size in bytes
    added_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<Book(id={self.id}, title='{self.title}', author='{self.author}')>" 