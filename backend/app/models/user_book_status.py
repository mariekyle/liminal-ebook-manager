from sqlalchemy import Column, String, Date, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.orm import relationship
from ..db.base import Base
import uuid


class UserBookStatus(Base):
    __tablename__ = "user_book_status"

    user_id = Column(PostgresUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    book_id = Column(PostgresUUID(as_uuid=True), ForeignKey("books.id", ondelete="CASCADE"), primary_key=True)
    status = Column(String(50), nullable=False)  # read, unread, dnf, in_progress
    read_date = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User")
    book = relationship("Book", back_populates="user_statuses")

    def __repr__(self):
        return f"<UserBookStatus(user_id={self.user_id}, book_id={self.book_id}, status='{self.status}')>" 