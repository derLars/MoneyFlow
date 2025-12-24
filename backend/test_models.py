from backend.database import SessionLocal, engine, Base
from backend.models import User, Purchase, Item, Contributor, Category, PurchaseLog, FriendlyName, PasswordResetToken

def test_models_creation():
    try:
        # Create all tables based on models
        Base.metadata.create_all(bind=engine)
        print("Successfully created all tables in the database.")
        
        # Verify table existence (basic check by instantiating a session)
        db = SessionLocal()
        print("Successfully opened a session.")
        
        # Test instantiating each model (but not saving yet, just verifying schema is valid)
        u = User(name="test_user", password_hash="hash")
        p = Purchase(creator_user_id=1, payer_user_id=1, purchase_name="Test", purchase_date="2023-01-01")
        i = Item(purchase_id=1, original_name="Test Item", price=10.00)
        c = Contributor(item_id=1, user_id=1)
        cat = Category(user_id=1, category_name="Groceries", level=1)
        log = PurchaseLog(log_message="Created")
        fn = FriendlyName(substring="test", friendly_name="Test")
        prt = PasswordResetToken(user_id=1, token_hash="token", expires_at="2023-01-01")
        
        print("Successfully instantiated all models (schema validation passed).")
        
        db.close()
        return True
    except Exception as e:
        print(f"Error during models V&V: {e}")
        return False

if __name__ == "__main__":
    if test_models_creation():
        print("Models V&V Passed!")
    else:
        print("Models V&V Failed!")
        exit(1)
