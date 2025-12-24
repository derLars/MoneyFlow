from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import database, models, schemas
from ..auth import get_current_user

router = APIRouter(
    prefix="/categories",
    tags=["Categories"],
)

@router.get("/{level}", response_model=List[schemas.CategoryResponse])
def get_categories(level: int, db: Session = Depends(database.get_db), current_user: schemas.User = Depends(get_current_user)):
    if not (1 <= level <= 3):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category level must be between 1 and 3")
    
    categories = database.get_categories_by_user_and_level(db, current_user.user_id, level)
    return categories

@router.post("/", response_model=schemas.CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(category_in: schemas.CategoryCreate, db: Session = Depends(database.get_db), current_user: schemas.User = Depends(get_current_user)):
    # Check if category already exists for the user and level
    existing_category = db.query(models.Category).filter(
        models.Category.user_id == current_user.user_id,
        models.Category.level == category_in.level,
        models.Category.category_name == category_in.category_name
    ).first()

    if existing_category:
        return existing_category # Return existing one if it matches

    # If not, create a new one
    db_category = database.create_category(
        db=db,
        user_id=current_user.user_id,
        category_name=category_in.category_name,
        level=category_in.level
    )
    return db_category
