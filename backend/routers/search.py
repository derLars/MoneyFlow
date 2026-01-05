import sys
import os
from typing import List, Optional

# Ensure the parent directory is in the path so we can import models/database etc
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
import database, auth, models, schemas

router = APIRouter(prefix="/search", tags=["search"])

@router.get("", response_model=schemas.SearchResponse)
async def search_all(
    q: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not q or len(q) < 2:
        return {"results": []}
        
    search_term = f"%{q}%"
    results = []
    
    # 1. Search Projects (User is participant)
    projects = db.query(models.Project).join(
        models.ProjectParticipant
    ).filter(
        models.ProjectParticipant.user_id == current_user.user_id,
        or_(
            models.Project.name.ilike(search_term),
            models.Project.description.ilike(search_term)
        )
    ).all()
    
    for p in projects:
        results.append(schemas.SearchResultItem(
            type="project",
            id=p.project_id,
            title=p.name,
            subtitle=p.description or "Project"
        ))
        
    # 2. Search Purchases (User is involved)
    # We use get_purchases_for_user logic logic logic but streamlined
    # Or just query directly with access check
    purchases = db.query(models.Purchase).filter(
        or_(
            models.Purchase.purchase_name.ilike(search_term)
        )
    ).filter(
        (models.Purchase.creator_user_id == current_user.user_id) |
        (models.Purchase.payer_user_id == current_user.user_id) |
        (models.Purchase.purchase_id.in_(
            db.query(models.Item.purchase_id).join(models.Contributor).filter(models.Contributor.user_id == current_user.user_id)
        ))
    ).all()
    
    for p in purchases:
        results.append(schemas.SearchResultItem(
            type="purchase",
            id=p.purchase_id,
            title=p.purchase_name,
            subtitle=f"Date: {p.purchase_date}",
            project_id=p.project_id,
            project_name=p.project.name if p.project else None,
            date=str(p.purchase_date)
        ))
        
    # 3. Search Items
    # Need access check: item -> purchase -> user check
    items = db.query(models.Item).join(models.Purchase).filter(
        or_(
            models.Item.original_name.ilike(search_term),
            models.Item.friendly_name.ilike(search_term)
        )
    ).filter(
        (models.Purchase.creator_user_id == current_user.user_id) |
        (models.Purchase.payer_user_id == current_user.user_id) |
        (models.Purchase.purchase_id.in_(
            db.query(models.Item.purchase_id).join(models.Contributor).filter(models.Contributor.user_id == current_user.user_id)
        ))
    ).all()
    
    for item in items:
        # Avoid duplicates if multiple items in same purchase match? 
        # Spec implies searching for "particular item".
        results.append(schemas.SearchResultItem(
            type="item",
            id=item.item_id,
            title=item.friendly_name or item.original_name,
            subtitle=f"In: {item.purchase.purchase_name}",
            project_id=item.purchase.project_id,
            project_name=item.purchase.project.name if item.purchase.project else None,
            date=str(item.purchase.purchase_date)
        ))
        
    return {"results": results}
