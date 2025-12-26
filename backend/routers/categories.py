import sys
import os

# Ensure the parent directory is in the path so we can import models/database etc
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
import database, auth, models
import repositories.category_repo as category_repo

router = APIRouter(prefix="/categories", tags=["categories"])

@router.get("")
async def get_all_categories(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    categories = category_repo.get_all_categories(db)
    # Convert list of tuples to list of strings
    return [c[0] for c in categories if c[0]]

@router.get("/{level}")
async def get_categories_by_level(
    level: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    categories = category_repo.get_categories_by_user_and_level(db, current_user.user_id, level)
    return categories
