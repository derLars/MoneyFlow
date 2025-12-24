import os
import yaml
from datetime import datetime
from sqlalchemy import create_engine, or_, extract
from sqlalchemy.orm import sessionmaker, Session
from . import models
from .db_base import Base

# Load configuration
def load_config():
    config_path = os.path.join(os.path.dirname(__file__), "..", "config.yaml")
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

config = load_config()
db_config = config.get("database", {})

if db_config.get("type") == "postgresql":
    SQLALCHEMY_DATABASE_URL = db_config.get("url")
else:
    # Default to SQLite
    sqlite_path = db_config.get("path", "./database.db")
    # Ensure directory exists for sqlite path
    os.makedirs(os.path.dirname(sqlite_path), exist_ok=True)
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{sqlite_path}"

# For SQLite, we need to allow multithreaded access
connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 9.4.1 User Management Functions
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

# 9.4.2 Purchase Management Functions
def create_purchase(db: Session, creator_user_id: int, payer_user_id: int, 
                    purchase_name: str, purchase_date, 
                    tax_is_added: bool = False, discount_is_applied: bool = False):
    db_purchase = models.Purchase(
        creator_user_id=creator_user_id,
        payer_user_id=payer_user_id,
        purchase_name=purchase_name,
        purchase_date=purchase_date,
        tax_is_added=tax_is_added,
        discount_is_applied=discount_is_applied
    )
    db.add(db_purchase)
    db.commit()
    db.refresh(db_purchase)
    return db_purchase

def get_purchase_by_id(db: Session, purchase_id: int):
    return db.query(models.Purchase).filter(models.Purchase.purchase_id == purchase_id).first()

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

def get_recent_purchases(db: Session, user_id: int, limit: int = 5):
    """
    Section 9.4.2: Retrieves the most recent purchases for a specific user.
    A user is related if they are the creator, the payer or a contributor.
    """
    return db.query(models.Purchase).filter(
        (models.Purchase.creator_user_id == user_id) |
        (models.Purchase.payer_user_id == user_id) |
        (models.Purchase.purchase_id.in_(
            db.query(models.Item.purchase_id).join(models.Contributor).filter(models.Contributor.user_id == user_id)
        ))
    ).order_by(models.Purchase.purchase_date.desc()).limit(limit).all()

def get_purchases_for_user(db: Session, user_id: int, search: str = None, sort_by: str = "date_desc"):
    """
    Section 9.4.2: Fetches all purchases where the user is either the creator, the payer or a contributor, 
    with optional filtering and sorting. 
    Enhanced Search: Includes items and categories.
    """
    # Use distinct to avoid duplicate purchases when multiple items match
    query = db.query(models.Purchase).distinct().join(models.Item, isouter=True)
    
    # Base authorization filter
    query = query.filter(
        (models.Purchase.creator_user_id == user_id) |
        (models.Purchase.payer_user_id == user_id) |
        (models.Purchase.purchase_id.in_(
            db.query(models.Item.purchase_id).join(models.Contributor).filter(models.Contributor.user_id == user_id)
        ))
    )

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

# 9.4.3 Item and Contributor Functions
def add_item_to_purchase(db: Session, purchase_id: int, original_name: str, 
                         friendly_name: str = None, quantity: int = 1, price: float = 0.0,
                         category_level_1: str = None, category_level_2: str = None, category_level_3: str = None):
    db_item = models.Item(
        purchase_id=purchase_id,
        original_name=original_name,
        friendly_name=friendly_name,
        quantity=quantity,
        price=price,
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

# 9.4.4 Category Functions
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

def get_analytics_data(db: Session, user_id: int, 
                       time_frame: str = "year", 
                       start_date: str = None,
                       end_date: str = None,
                       search: str = None,
                       item_search: str = None,
                       cat1: str = None, cat2: str = None, cat3: str = None):
    """
    Section 5.8 Refinement: Retrieves analytics data based on various filters.
    Supports Period, Month, Year, and All modes.
    """
    # 1. Base query: Distinct purchases authorized for the user
    query = db.query(models.Purchase).distinct().join(models.Item, isouter=True)
    
    query = query.filter(
        (models.Purchase.creator_user_id == user_id) |
        (models.Purchase.payer_user_id == user_id) |
        (models.Purchase.purchase_id.in_(
            db.query(models.Item.purchase_id).join(models.Contributor).filter(models.Contributor.user_id == user_id)
        ))
    )

    # 2. Time Filtering
    from datetime import datetime
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

# 9.4.5 Payment and Money Flow Functions
def create_payment(db: Session, creator_user_id: int, payer_user_id: int, receiver_user_id: int, 
                   amount: float, payment_date, note: str = None):
    db_payment = models.Payment(
        creator_user_id=creator_user_id,
        payer_user_id=payer_user_id,
        receiver_user_id=receiver_user_id,
        amount=amount,
        payment_date=payment_date,
        note=note
    )
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment

def get_payments_for_user(db: Session, user_id: int):
    return db.query(models.Payment).filter(
        (models.Payment.payer_user_id == user_id) |
        (models.Payment.receiver_user_id == user_id)
    ).order_by(models.Payment.payment_date.desc()).all()

def delete_payment(db: Session, payment_id: int):
    db_payment = db.query(models.Payment).filter(models.Payment.payment_id == payment_id).first()
    if db_payment:
        db.delete(db_payment)
        db.commit()
        return True
    return False

def get_money_flow_balances(db: Session, user_id: int = None):
    """
    Calculates the net balance between all users.
    1. Sum contributions from purchases (Items -> Contributors)
    2. Sum payments made/received
    """
    users = get_all_users(db)
    balances = {} # (user_id_a, user_id_b) -> amount (positive means a owes b)

    def get_key(id1, id2):
        return tuple(sorted((id1, id2)))

    # Step 1: Contribution from purchases
    # We iterate over all items and their contributors
    items = db.query(models.Item).all()
    for item in items:
        purchase = item.purchase
        payer_id = purchase.payer_user_id
        contributors = item.contributors
        if not contributors:
            continue
        
        # Section 10.1: Equal distribution
        share = float(item.price * item.quantity) / len(contributors)
        
        for cont in contributors:
            if cont.user_id != payer_id:
                # Contributor owes Payer
                key = get_key(cont.user_id, payer_id)
                if key not in balances: balances[key] = 0.0
                
                # If cont.user_id is the first in key, it's positive debt
                if cont.user_id == key[0]:
                    balances[key] += share
                else:
                    balances[key] -= share

    # Step 2: Offsetting with payments
    payments = db.query(models.Payment).all()
    for p in payments:
        key = get_key(p.payer_user_id, p.receiver_user_id)
        if key not in balances: balances[key] = 0.0
        
        # If p.payer_user_id is the first in key, it reduces his debt (negative change)
        if p.payer_user_id == key[0]:
            balances[key] -= float(p.amount)
        else:
            balances[key] += float(p.amount)

    # Format result for frontend
    result = []
    user_map = {u.user_id: u.name for u in users}
    for (id1, id2), amount in balances.items():
        if abs(amount) < 0.01: continue
        
        # Rule 2: Filter by user_id if provided
        if user_id is not None and user_id not in [id1, id2]:
            continue

        if amount > 0:
            debtor_id, creditor_id = id1, id2
        else:
            debtor_id, creditor_id = id2, id1
            amount = abs(amount)
            
        result.append({
            "user_a_id": debtor_id,
            "user_a_name": user_map.get(debtor_id),
            "user_b_id": creditor_id,
            "user_b_name": user_map.get(creditor_id),
            "amount": round(amount, 2)
        })
        
    return result
