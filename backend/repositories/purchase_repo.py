from datetime import datetime
from sqlalchemy import or_, extract
from sqlalchemy.orm import joinedload
import sys
import os

# Ensure the parent directory is in the path so we can import models/database etc
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
import models

def create_purchase(db: Session, creator_user_id: int, payer_user_id: int, 
                    purchase_name: str, purchase_date, 
                    tax_is_added: bool = False, discount_is_applied: bool = False,
                    project_id: int = None):
    db_purchase = models.Purchase(
        creator_user_id=creator_user_id,
        payer_user_id=payer_user_id,
        purchase_name=purchase_name,
        purchase_date=purchase_date,
        tax_is_added=tax_is_added,
        discount_is_applied=discount_is_applied,
        project_id=project_id
    )
    db.add(db_purchase)
    db.commit()
    db.refresh(db_purchase)
    return db_purchase

def get_purchase_by_id(db: Session, purchase_id: int):
    return db.query(models.Purchase).filter(models.Purchase.purchase_id == purchase_id).first()

def update_purchase(db: Session, purchase_id: int, purchase_name: str, purchase_date, 
                    payer_user_id: int, tax_is_added: bool, discount_is_applied: bool):
    db_purchase = get_purchase_by_id(db, purchase_id)
    if db_purchase:
        db_purchase.purchase_name = purchase_name
        db_purchase.purchase_date = purchase_date
        db_purchase.payer_user_id = payer_user_id
        db_purchase.tax_is_added = tax_is_added
        db_purchase.discount_is_applied = discount_is_applied
        db.commit()
        db.refresh(db_purchase)
    return db_purchase

def delete_purchase(db: Session, purchase_id: int):
    db_purchase = get_purchase_by_id(db, purchase_id)
    if db_purchase:
        # Cascade delete items (handled by SQLAlchemy if configured, but let's be explicit if needed)
        for item in db_purchase.items:
            # Delete contributors
            db.query(models.Contributor).filter(models.Contributor.item_id == item.item_id).delete()
            db.delete(item)
        # Delete logs
        db.query(models.PurchaseLog).filter(models.PurchaseLog.purchase_id == purchase_id).delete()
        db.delete(db_purchase)
        db.commit()
        return True
    return False

def create_receipt_image(db: Session, purchase_id: int, file_path: str, original_filename: str = None):
    db_image = models.ReceiptImage(
        purchase_id=purchase_id,
        file_path=file_path,
        original_filename=original_filename
    )
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image

def create_purchase_log(db: Session, purchase_id: int, user_id: int, message: str):
    db_log = models.PurchaseLog(
        purchase_id=purchase_id,
        user_id=user_id,
        log_message=message,
        timestamp=datetime.utcnow()
    )
    db.add(db_log)
    db.commit()
    return db_log

def get_logs_for_purchase(db: Session, purchase_id: int):
    return db.query(models.PurchaseLog).filter(models.PurchaseLog.purchase_id == purchase_id).order_by(models.PurchaseLog.timestamp.desc()).all()

def get_recent_purchases(db: Session, user_id: int, limit: int = 5, project_id: int = None):
    """
    Retrieves the most recent purchases for a specific user.
    A purchase is visible only if the user is a current participant of the project.
    """
    query = db.query(models.Purchase).options(joinedload(models.Purchase.items)).join(models.Project)
    
    if project_id:
        query = query.filter(models.Purchase.project_id == project_id)
    
    # Enforcement: Only show purchases from projects where user is an active participant
    query = query.join(models.ProjectParticipant).filter(
        models.ProjectParticipant.user_id == user_id,
        models.ProjectParticipant.is_active == True
    )
        
    return query.order_by(models.Purchase.purchase_date.desc()).limit(limit).all()

def get_purchases_for_user(db: Session, user_id: int, search: str = None, sort_by: str = "date_desc", project_id: int = None):
    """
    Fetches purchases where the user is currently a participant of the project.
    Enhanced Search: Includes items and categories.
    """
    # Use distinct to avoid duplicate purchases when multiple items match
    query = db.query(models.Purchase).options(joinedload(models.Purchase.items)).distinct()
    query = query.join(models.Item, isouter=True).join(models.Project).join(models.ProjectParticipant)
    
    # Enforcement: Only projects where user is an active participant
    query = query.filter(
        models.ProjectParticipant.user_id == user_id,
        models.ProjectParticipant.is_active == True
    )

    # Filter by specific project if provided
    if project_id:
        query = query.filter(models.Purchase.project_id == project_id)

    if search:
        search_filter = or_(
            models.Purchase.purchase_name.ilike(f"%{search}%"),
            models.Item.friendly_name.ilike(f"%{search}%"),
            models.Item.original_name.ilike(f"%{search}%"),
            models.Item.category_level_1.ilike(f"%{search}%"),
            models.Item.category_level_2.ilike(f"%{search}%"),
            models.Item.category_level_3.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)

    # Sorting logic
    if sort_by == "date_asc":
        query = query.order_by(models.Purchase.purchase_date.asc())
    elif sort_by == "total_asc":
        # Note: Sorting by total requires summing items. For SQLite/Simple logic, 
        # we might fetch and sort in memory if DB complex, but let's try basic date for now
        # and improve if needed. Total sorting is tricky with SQLAlchemy across joins.
        query = query.order_by(models.Purchase.purchase_date.desc())
    elif sort_by == "total_desc":
        query = query.order_by(models.Purchase.purchase_date.desc())
    else: # date_desc (default)
        query = query.order_by(models.Purchase.purchase_date.desc())

    return query.all()

def get_analytics_data(db: Session, user_id: int, 
                       time_frame: str = "year", 
                       start_date: str = None,
                       end_date: str = None,
                       search: str = None,
                       item_search: str = None,
                       cat1: str = None, cat2: str = None, cat3: str = None,
                       project_id: int = None):
    """
    Retrieves analytics data. 
    Enforcement: Only show purchases from projects where user is a participant.
    """
    # 1. Base query: Distinct purchases in projects where user is participant
    query = db.query(models.Purchase).distinct().join(models.Item, isouter=True)
    query = query.join(models.Project).join(models.ProjectParticipant)
    
    # Filter by user participation (must be active)
    query = query.filter(
        models.ProjectParticipant.user_id == user_id,
        models.ProjectParticipant.is_active == True
    )
    
    if project_id:
        query = query.filter(models.Purchase.project_id == project_id)

    # 2. Time Filtering
    if time_frame == "period":
        if start_date:
            query = query.filter(models.Purchase.purchase_date >= datetime.strptime(start_date, "%Y-%m-%d").date())
        if end_date:
            query = query.filter(models.Purchase.purchase_date <= datetime.strptime(end_date, "%Y-%m-%d").date())
    elif time_frame == "month":
        # Expecting start_date as YYYY-MM-01
        if start_date:
            dt = datetime.strptime(start_date, "%Y-%m-%d").date()
            query = query.filter(extract('year', models.Purchase.purchase_date) == dt.year)
            query = query.filter(extract('month', models.Purchase.purchase_date) == dt.month)
    elif time_frame == "year":
        if start_date:
            dt = datetime.strptime(start_date, "%Y-%m-%d").date()
            query = query.filter(extract('year', models.Purchase.purchase_date) == dt.year)

    # 3. Categorical/Search Filtering
    if search:
        query = query.filter(models.Purchase.purchase_name.ilike(f"%{search}%"))
    
    if item_search:
        query = query.filter(
            or_(
                models.Item.friendly_name.ilike(f"%{item_search}%"),
                models.Item.original_name.ilike(f"%{item_search}%")
            )
        )

    if cat1:
        query = query.filter(models.Item.category_level_1 == cat1)
    if cat2:
        query = query.filter(models.Item.category_level_2 == cat2)
    if cat3:
        query = query.filter(models.Item.category_level_3 == cat3)

    purchases = query.all()
    return purchases
