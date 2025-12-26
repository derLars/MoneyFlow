import sys
import os

# Ensure the parent directory is in the path so we can import models/database etc
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
import models
import repositories.user_repo as user_repo

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

def get_payment_by_id(db: Session, payment_id: int):
    return db.query(models.Payment).filter(models.Payment.payment_id == payment_id).first()

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
    users = user_repo.get_all_users(db)
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
