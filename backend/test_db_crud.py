from backend.database import SessionLocal, create_user, get_user_by_name, create_purchase, get_purchase_by_id
from datetime import date

def test_db_crud():
    db = SessionLocal()
    try:
        # 1. Test User CRUD
        username = "test_admin"
        password_hash = "hashed_password"
        
        # Clean up if exists
        existing_user = get_user_by_name(db, username)
        if not existing_user:
            user = create_user(db, name=username, password_hash=password_hash)
            print(f"Successfully created user: {user.name}")
        else:
            user = existing_user
            print(f"User {username} already exists.")
        
        retrieved_user = get_user_by_name(db, username)
        assert retrieved_user is not None
        assert retrieved_user.name == username
        print("User retrieval V&V passed.")

        # 2. Test Purchase CRUD
        purchase_name = "Test Purchase"
        p_date = date(2023, 1, 1)
        
        purchase = create_purchase(
            db, 
            creator_user_id=user.user_id, 
            payer_user_id=user.user_id, 
            purchase_name=purchase_name, 
            purchase_date=p_date
        )
        print(f"Successfully created purchase: {purchase.purchase_name}")
        
        retrieved_purchase = get_purchase_by_id(db, purchase.purchase_id)
        assert retrieved_purchase is not None
        assert retrieved_purchase.purchase_name == purchase_name
        assert retrieved_purchase.purchase_date == p_date
        print("Purchase retrieval V&V passed.")
        
        return True
    except Exception as e:
        print(f"Error during CRUD V&V: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    if test_db_crud():
        print("CRUD V&V Passed!")
    else:
        print("CRUD V&V Failed!")
        exit(1)
