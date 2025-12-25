from sqlalchemy.orm import Session
from .. import models

def create_category(db: Session, user_id: int, category_name: str, level: int):
    db_category = models.Category(user_id=user_id, category_name=category_name, level=level)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def get_all_categories(db: Session):
    return db.query(models.Category.category_name).distinct().all()

def get_categories_by_user_and_level(db: Session, user_id: int, level: int):
    return db.query(models.Category).filter(models.Category.user_id == user_id, models.Category.level == level).all()

def get_category_by_details(db: Session, user_id: int, level: int, category_name: str):
    return db.query(models.Category).filter(
        models.Category.user_id == user_id,
        models.Category.level == level,
        models.Category.category_name == category_name
    ).first()
