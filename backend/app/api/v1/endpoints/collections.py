from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ....db.base import get_db
from ....models.collection import Collection
from ....schemas.collection import Collection as CollectionSchema
from ....api.deps import get_current_user
from ....core.logging import logger

router = APIRouter()


@router.get("/", response_model=List[CollectionSchema])
async def get_collections(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's collections"""
    collections = db.query(Collection).filter(
        Collection.user_id == current_user.id
    ).all()
    return collections


@router.get("/{collection_id}", response_model=CollectionSchema)
async def get_collection(
    collection_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get collection by ID"""
    collection = db.query(Collection).filter(
        Collection.id == collection_id,
        Collection.user_id == current_user.id
    ).first()
    
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found"
        )
    return collection 