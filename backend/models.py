from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, DateTime, Text, Numeric
from sqlalchemy.orm import relationship
from backend.db_base import Base
import datetime

class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(30), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    administrator = Column(Boolean, default=False)

    # Relationships
    created_purchases = relationship("Purchase", back_populates="creator", foreign_keys="[Purchase.creator_user_id]")
    paid_purchases = relationship("Purchase", back_populates="payer", foreign_keys="[Purchase.payer_user_id]")
    contributions = relationship("Contributor", back_populates="user")
    categories = relationship("Category", back_populates="user")
    friendly_names = relationship("FriendlyName", back_populates="user")
    logs = relationship("PurchaseLog", back_populates="user")

class Purchase(Base):
    __tablename__ = "purchases"
    purchase_id = Column(Integer, primary_key=True, index=True)
    creator_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    payer_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    purchase_name = Column(String(255), nullable=False)
    purchase_date = Column(Date, nullable=False)
    tax_is_added = Column(Boolean, default=False)
    discount_is_applied = Column(Boolean, default=False)

    # Relationships
    creator = relationship("User", back_populates="created_purchases", foreign_keys=[creator_user_id])
    payer = relationship("User", back_populates="paid_purchases", foreign_keys=[payer_user_id])
    items = relationship("Item", back_populates="purchase", cascade="all, delete-orphan")
    images = relationship("ReceiptImage", back_populates="purchase", cascade="all, delete-orphan")
    logs = relationship("PurchaseLog", back_populates="purchase", cascade="all, delete-orphan")

class Item(Base):
    __tablename__ = "items"
    item_id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchases.purchase_id"), nullable=False)
    original_name = Column(Text, nullable=False)
    friendly_name = Column(Text)
    category_level_1 = Column(Text)
    category_level_2 = Column(Text)
    category_level_3 = Column(Text)
    quantity = Column(Integer, default=1)
    price = Column(Numeric(10, 2), nullable=False)
    discount = Column(Numeric(10, 2), default=0.00)
    tax_rate = Column(Numeric(5, 2), default=0.00)

    # Relationships
    purchase = relationship("Purchase", back_populates="items")
    contributors = relationship("Contributor", back_populates="item", cascade="all, delete-orphan")

class Contributor(Base):
    __tablename__ = "contributors"
    contributor_id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.item_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)

    # Relationships
    item = relationship("Item", back_populates="contributors")
    user = relationship("User", back_populates="contributions")

class Category(Base):
    __tablename__ = "categories"
    category_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    category_name = Column(String(30), nullable=False)
    level = Column(Integer, nullable=False) # 1, 2, or 3

    # Relationships
    user = relationship("User", back_populates="categories")

class PurchaseLog(Base):
    __tablename__ = "purchase_logs"
    log_id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchases.purchase_id"))
    user_id = Column(Integer, ForeignKey("users.user_id"))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    log_message = Column(Text, nullable=False)

    # Relationships
    purchase = relationship("Purchase", back_populates="logs")
    user = relationship("User", back_populates="logs")

class FriendlyName(Base):
    __tablename__ = "friendly_names"
    friendly_name_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    substring = Column(Text, nullable=False)
    friendly_name = Column(Text, nullable=False)

    # Relationships
    user = relationship("User", back_populates="friendly_names")

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    token_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)

class ReceiptImage(Base):
    __tablename__ = "receipt_images"
    image_id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchases.purchase_id"), nullable=False)
    file_path = Column(Text, nullable=False) # Local or relative path
    original_filename = Column(String(255))
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    purchase = relationship("Purchase", back_populates="images")

class Payment(Base):
    __tablename__ = "payments"
    payment_id = Column(Integer, primary_key=True, index=True)
    creator_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    payer_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    receiver_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_date = Column(Date, nullable=False)
    note = Column(Text)

    # Relationships
    creator = relationship("User", foreign_keys=[creator_user_id])
    payer = relationship("User", foreign_keys=[payer_user_id])
    receiver = relationship("User", foreign_keys=[receiver_user_id])
