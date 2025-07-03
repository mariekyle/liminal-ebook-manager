from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..db.base import Base
import uuid


class Author(Base):
    __tablename__ = "authors"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    books = relationship("BookAuthor", back_populates="author")

    def __repr__(self):
        return f"<Author(id={self.id}, name='{self.name}')>" 