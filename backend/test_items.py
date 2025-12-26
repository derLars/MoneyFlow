from backend.database import SessionLocal
from backend.repositories import user_repo
from backend.repositories.user_repo import create_user
from backend.repositories.purchase_repo import create_purchase
from backend.repositories.item_repo import add_item_to_purchase, add_contributor_to_item
from backend.services import mapping_service
from datetime import date

def test_items_and_mapping():
    db = SessionLocal()
    try:
        # 1. Setup User and Purchase
        username = "item_test_user"
        user = user_repo.get_user_by_name(db, username)
        if not user:
            user = create_user(db, name=username, password_hash="hash")
        
        purchase = create_purchase(db, creator_user_id=user.user_id, payer_user_id=user.user_id, 
                                   purchase_name="Mapping Test", purchase_date=date.today())
        
        # 2. Test Item Creation
        item = add_item_to_purchase(
            db, 
            purchase_id=purchase.purchase_id, 
            original_name="Milk Frsh Alpine",
            price=2.50
        )
        print(f"Created item: {item.original_name}")
        
        # 3. Test Contributor Assignment
        add_contributor_to_item(db, item_id=item.item_id, user_id=user.user_id)
        print("Assigned contributor to item.")

        # 4. Test Friendly Name Mapping Logic
        # Set a mapping for "Milk Frsh Alpine" -> "Milk"
        mapping_service.set_friendly_name(db, original_name="Milk Frsh Alpine", friendly_name="Milk", user_id=user.user_id)
        print("Set friendly name mapping: 'Milk Frsh Alpine' -> 'Milk'")
        
        # Verify exact match
        name = mapping_service.get_friendly_name(db, "Milk Frsh Alpine", user.user_id)
        assert name == "Milk"
        print("Exact match mapping verified.")
        
        # Verify substring match
        name2 = mapping_service.get_friendly_name(db, "Milk Frsh", user.user_id)
        assert name2 == "Milk"
        print("Substring match mapping verified.")
        
        # Verify default to original
        name3 = mapping_service.get_friendly_name(db, "Bread", user.user_id)
        assert name3 == "Bread"
        print("Default mapping verified.")

        return True
    except Exception as e:
        print(f"Error during Items V&V: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    if test_items_and_mapping():
        print("Items & Mapping V&V Passed!")
    else:
        print("Items & Mapping V&V Failed!")
        exit(1)
