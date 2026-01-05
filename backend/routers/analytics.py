import sys
import os
from typing import List

# Ensure the parent directory is in the path so we can import models/database etc
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import database, auth, models, schemas
import datetime

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/filters", response_model=List[schemas.SavedFilterResponse])
async def list_saved_filters(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.SavedFilter).filter(
        models.SavedFilter.user_id == current_user.user_id
    ).order_by(models.SavedFilter.created_at.desc()).all()

@router.post("/filters", response_model=schemas.SavedFilterResponse)
async def create_saved_filter(
    filter_in: schemas.SavedFilterCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    new_filter = models.SavedFilter(
        user_id=current_user.user_id,
        name=filter_in.name,
        configuration=filter_in.configuration,
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_filter)
    db.commit()
    db.refresh(new_filter)
    return new_filter

@router.delete("/filters/{filter_id}")
async def delete_saved_filter(
    filter_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    saved_filter = db.query(models.SavedFilter).filter(
        models.SavedFilter.filter_id == filter_id
    ).first()
    
    if not saved_filter:
        raise HTTPException(status_code=404, detail="Filter not found")
        
    if saved_filter.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db.delete(saved_filter)
    db.commit()
    return {"status": "success"}
