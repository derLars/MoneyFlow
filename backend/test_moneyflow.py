import sys
import os
from datetime import date
from sqlalchemy.orm import Session

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend import database, models, db_base
from backend.repositories import user_repo, purchase_repo, item_repo, payment_repo

def test_money_flow():
    # Setup DB
    db_base.Base.metadata.create_all(bind=database.engine)
    db = next(database.get_db())
    
    # Create test users
    u1 = user_repo.get_user_by_name(db, "Lars")
    if not u1:
        u1 = user_repo.create_user(db, "Lars", "hashed_pwd")
    u2 = user_repo.get_user_by_name(db, "Larry")
    if not u2:
        u2 = user_repo.create_user(db, "Larry", "hashed_pwd")
        
    print(f"Users: {u1.name}({u1.user_id}), {u2.name}({u2.user_id})")
    
    # 1. Lars spends 11.00 for Larry (Lars is payer, Larry is sole contributor)
    # Total 11.00 -> share 11.00 for Larry
    p1 = purchase_repo.create_purchase(db, u1.user_id, u1.user_id, "Lunch", date.today())
    item1 = item_repo.add_item_to_purchase(db, p1.purchase_id, "Burger", price=11.00, quantity=1)
    item_repo.add_contributor_to_item(db, item1.item_id, u2.user_id)
    
    # 2. Larry spends 10.00 for Lars
    p2 = purchase_repo.create_purchase(db, u2.user_id, u2.user_id, "Coffee", date.today())
    item2 = item_repo.add_item_to_purchase(db, p2.purchase_id, "Latte", price=10.00, quantity=1)
    item_repo.add_contributor_to_item(db, item2.item_id, u1.user_id)
    
    # Expect: Lars spent 11 for Larry, Larry spent 10 for Lars. Net: Larry owes Lars 1.00
    balances = payment_repo.get_money_flow_balances(db)
    print("Balances after purchases:", balances)
    
    # 3. Larry pays Lars 5.00
    payment_repo.create_payment(db, u2.user_id, u2.user_id, u1.user_id, 5.00, date.today(), "Partial payback")
    
    # Expect: Larry owed 1.00, paid 5.00. Net: Lars owes Larry 4.00
    balances_after_payment = payment_repo.get_money_flow_balances(db)
    print("Balances after payment:", balances_after_payment)
    
    # Cleanup (Optional)
    purchase_repo.delete_purchase(db, p1.purchase_id)
    purchase_repo.delete_purchase(db, p2.purchase_id)
    # Note: Payment deletion not yet implemented in cleanup script but available in API

if __name__ == "__main__":
    test_money_flow()
