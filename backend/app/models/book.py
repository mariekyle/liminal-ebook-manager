from sqlalchemy import Column, Integer, String, DateTime, Text, Index
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class BookDB(Base):
    __tablename__ = 'books'
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    author = Column(String(200), nullable=False, index=True)
    description = Column(Text)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    added_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    cover_path = Column(String(500))
    isbn = Column(String(500), index=True)
    language = Column(String(10))
    publisher = Column(String(500))
    publication_date = Column(DateTime)
    word_count = Column(Integer, default=0)
    tags = Column(Text)
    
    # Create indexes for better performance
    __table_args__ = (
        Index('idx_title_author', 'title', 'author'),
        Index('idx_added_date', 'added_date'),
    ) 