from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import database, models, schemas
from ..repositories import category_repo
from ..auth import get_current_user

router = APIRouter(
    prefix="/categories",
    tags=["Categories"],
)

@router.get("/{level}", response_model=List[schemas.CategoryResponse])
def get_categories(level: int, db: Session = Depends(database.get_db), current_user: schemas.User = Depends(get_current_user)):
    if not (1 <= level <= 3):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category level must be between 1 and 3")
    
    categories = category_repo.get_categories_by_user_and_level(db, current_user.user_id, level)
    return categories

@router.post("/", response_model=schemas.CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(category_in: schemas.CategoryCreate, db: Session = Depends(database.get_db), current_user: schemas.User = Depends(get_current_user)):
    # Check if category already exists for the user and level
    existing_category = category_repo.get_category_by_details(
        db, 
        user_id=current_user.user_id, 
        level=category_in.level, 
        category_name=category_in.category_name
    )

    if existing_category:
        return existing_category # Return existing one if it matches

    # If not, create a new one
    db_category = category_repo.create_category(
        db=db,
        user_id=current_user.user_id,
        category_name=category_in.category_name,
        level=category_in.level
    )
    return db_category
