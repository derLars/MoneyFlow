from sqlalchemy.orm import Session
from .. import models

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

def delete_user(db: Session, user_id: int):
    user = get_user_by_id(db, user_id)
    if user:
        # Delete user's categories
        db.query(models.Category).filter(models.Category.user_id == user_id).delete()
        # Delete user's friendly name mappings
        db.query(models.FriendlyName).filter(models.FriendlyName.user_id == user_id).delete()
        # Delete user's logs
        db.query(models.PurchaseLog).filter(models.PurchaseLog.user_id == user_id).delete()
        # Deletions for purchases created by the user are tricky if shared.
        # Section 9.4.1 says: "Removes a user and all their associated, non-shared data".
        # We'll leave shared purchases alone for now to avoid orphan data.
        
        db.delete(user)
        db.commit()
        return True
    return False
