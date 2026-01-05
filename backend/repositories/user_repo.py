import sys
import os

# Ensure the parent directory is in the path so we can import models/database etc
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
import models

def create_user(db: Session, name: str, password_hash: str):
    db_user = models.User(name=name, password_hash=password_hash)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_name(db: Session, name: str):
    return db.query(models.User).filter(models.User.name == name).first()

def get_user_by_id(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.user_id == user_id).first()

def get_all_users(db: Session):
    return db.query(models.User).all()

def set_administrator_rights(db: Session, user_id: int, is_admin: bool):
    user = get_user_by_id(db, user_id)
    if user:
        user.administrator = is_admin
        db.commit()
        db.refresh(user)
    return user

def update_user_password(db: Session, user_id: int, new_password_hash: str):
    user = get_user_by_id(db, user_id)
    if user:
        user.password_hash = new_password_hash
        db.commit()
        db.refresh(user)
        return True
    return False

def update_user_name(db: Session, user_id: int, new_name: str):
    user = get_user_by_id(db, user_id)
    if user:
        user.name = new_name
        db.commit()
        db.refresh(user)
        return True
    return False

def update_user_tax_settings(db: Session, user_id: int, default_tax_rate: float, common_tax_rates: str):
    user = get_user_by_id(db, user_id)
    if user:
        user.default_tax_rate = default_tax_rate
        user.common_tax_rates = common_tax_rates
        db.commit()
        db.refresh(user)
        return True
    return False

def _has_dependencies(db: Session, user_id: int) -> bool:
    # Check if user has historical financial data (payer, creator, or contributor)
    has_purchases = db.query(models.Purchase).filter(
        (models.Purchase.creator_user_id == user_id) | 
        (models.Purchase.payer_user_id == user_id)
    ).first() is not None
    
    if has_purchases: return True

    has_contributions = db.query(models.Contributor).filter(
        models.Contributor.user_id == user_id
    ).first() is not None

    if has_contributions: return True

    has_payments = db.query(models.Payment).filter(
        (models.Payment.creator_user_id == user_id) |
        (models.Payment.payer_user_id == user_id) |
        (models.Payment.receiver_user_id == user_id)
    ).first() is not None

    return has_payments

def delete_user(db: Session, user_id: int):
    user = get_user_by_id(db, user_id)
    if not user:
        return None
        
    if _has_dependencies(db, user_id):
        # Anonymize instead of hard delete to preserve historical integrity
        user.name = f"Deleted User {user.user_id}"
        user.password_hash = "DELETED"
        user.is_dummy = True
        user.administrator = False
        
        # Cascades in models.py will handle:
        # - Categories, FriendlyNames, CategoryMappings, PurchaseLogs, ProjectParticipants, SavedFilters
        
        db.commit()
        db.refresh(user)
        return user
    else:
        # Truly no shared data, safe to hard delete
        db.delete(user)
        db.commit()
        return None

def cleanup_unreferenced_dummy_users(db: Session) -> int:
    """
    Finds all dummy users and deletes them if they are no longer referenced in any data.
    Returns the number of deleted users.
    """
    dummy_users = db.query(models.User).filter(models.User.is_dummy == True).all()
    deleted_count = 0
    
    for user in dummy_users:
        if not _has_dependencies(db, user.user_id):
            db.delete(user)
            deleted_count += 1
            
    if deleted_count > 0:
        db.commit()
        
    return deleted_count
