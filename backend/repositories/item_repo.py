import sys
import os

# Ensure the parent directory is in the path so we can import models/database etc
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
import models

def add_item_to_purchase(db: Session, purchase_id: int, original_name: str, 
                         friendly_name: str = None, quantity: int = 1, price: float = 0.0, 
                         discount: float = 0.0, tax_rate: float = 0.0,
                         category_level_1: str = None, category_level_2: str = None, category_level_3: str = None):
    db_item = models.Item(
        purchase_id=purchase_id,
        original_name=original_name,
        friendly_name=friendly_name,
        quantity=quantity,
        price=price,
        discount=discount,
        tax_rate=tax_rate,
        category_level_1=category_level_1,
        category_level_2=category_level_2,
        category_level_3=category_level_3
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_item(db: Session, item_id: int, **kwargs):
    db_item = db.query(models.Item).filter(models.Item.item_id == item_id).first()
    if db_item:
        for key, value in kwargs.items():
            setattr(db_item, key, value)
        db.commit()
        db.refresh(db_item)
    return db_item

def delete_item(db: Session, item_id: int):
    db_item = db.query(models.Item).filter(models.Item.item_id == item_id).first()
    if db_item:
        db.delete(db_item)
        db.commit()
    return db_item

def add_contributor_to_item(db: Session, item_id: int, user_id: int):
    db_contributor = models.Contributor(item_id=item_id, user_id=user_id)
    db.add(db_contributor)
    db.commit()
    db.refresh(db_contributor)
    return db_contributor
