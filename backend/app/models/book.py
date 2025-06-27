"""
Book Model with User Relationships
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, Index, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from datetime import datetime

Base = declarative_base()

class Book(Base):
    """Book model with user ownership"""
    
    __tablename__ = 'books'
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # User relationship
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Book metadata
    title = Column(String(500), nullable=False, index=True)
    author = Column(String(200), nullable=False, index=True)
    description = Column(Text)
    isbn = Column(String(500), index=True)
    language = Column(String(10))
    publisher = Column(String(500))
    publication_date = Column(DateTime)
    word_count = Column(Integer, default=0)
    tags = Column(Text)
    
    # File information
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    cover_path = Column(String(500))
    
    # Timestamps
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    owner = relationship("User", back_populates="books")
    
    # Create indexes for better performance
    __table_args__ = (
        Index('idx_title_author', 'title', 'author'),
        Index('idx_owner_created', 'owner_id', 'created_at'),
        Index('idx_created_at', 'created_at'),
    )
    
    def __repr__(self):
        return f"<Book(id={self.id}, title='{self.title}', author='{self.author}')>"
    
    def get_file_size_mb(self) -> float:
        """Get file size in MB"""
        return self.file_size / (1024 * 1024)
    
    def get_tags_list(self) -> list:
        """Get tags as a list"""
        if self.tags:
            return [tag.strip() for tag in self.tags.split(',') if tag.strip()]
        return []
    
    def set_tags_list(self, tags: list):
        """Set tags from a list"""
        self.tags = ','.join(tags) if tags else None 