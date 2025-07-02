from sqlalchemy import Column, String, ForeignKey, DateTime, JSON
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID, JSONB
from sqlalchemy.orm import relationship
from ..db.base import Base
import uuid


class Collection(Base):
    __tablename__ = "collections"

    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PostgresUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)  # manual, filtered
    filter_query = Column(JSONB)  # for filtered collections
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User")
    books = relationship("CollectionBook", back_populates="collection")

    def __repr__(self):
        return f"<Collection(id={self.id}, name='{self.name}', type='{self.type}')>" 