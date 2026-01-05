import sys
import os
from collections import defaultdict

# Ensure the parent directory is in the path so we can import models/database etc
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
import models
import repositories.user_repo as user_repo

def create_payment(db: Session, creator_user_id: int, payer_user_id: int, receiver_user_id: int, 
                   amount: float, payment_date, note: str = None, project_id: int = None):
    db_payment = models.Payment(
        creator_user_id=creator_user_id,
        payer_user_id=payer_user_id,
        receiver_user_id=receiver_user_id,
        amount=amount,
        payment_date=payment_date,
        note=note,
        project_id=project_id
    )
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment

def get_payment_by_id(db: Session, payment_id: int):
    return db.query(models.Payment).filter(models.Payment.payment_id == payment_id).first()

def get_payments_for_user(db: Session, user_id: int, project_id: int = None):
    if project_id:
        # For projects, return ALL payments to all participants
        query = db.query(models.Payment).filter(models.Payment.project_id == project_id)
    else:
        # Global view: only payments where user is involved
        query = db.query(models.Payment).filter(
            (models.Payment.payer_user_id == user_id) |
            (models.Payment.receiver_user_id == user_id)
        )
        
    return query.order_by(models.Payment.payment_date.desc()).all()

def delete_payment(db: Session, payment_id: int):
    db_payment = db.query(models.Payment).filter(models.Payment.payment_id == payment_id).first()
    if db_payment:
        db.delete(db_payment)
        db.commit()
        return True
    return False

def get_money_flow_balances(db: Session, user_id: int = None, project_id: int = None):
    """
    Calculates optimized net balances and settlement plan.
    Enforcement: Only include projects where user is an ACTIVE participant.
    However, the calculation within the project includes all historical participants.
    """
    users = user_repo.get_all_users(db)
    user_map = {u.user_id: u.name for u in users}
    
    # Net Balance: Positive = Creditor (Owed money), Negative = Debtor (Owes money)
    net_balances = defaultdict(float)

    # Security Check: If project_id provided, ensure user_id is an active participant
    if project_id and user_id:
        is_active = db.query(models.ProjectParticipant).filter(
            models.ProjectParticipant.project_id == project_id,
            models.ProjectParticipant.user_id == user_id,
            models.ProjectParticipant.is_active == True
        ).first()
        if not is_active:
            return []

    # 1. Process Purchases (Items)
    # If calculating for a specific project, we don't filter items by user participation record
    # because we want to see debts of removed users too.
    item_query = db.query(models.Item).join(models.Purchase)
    
    if project_id:
        item_query = item_query.filter(models.Purchase.project_id == project_id)
    else:
        # Global view: only projects where user is an active participant
        item_query = item_query.join(models.Project).join(models.ProjectParticipant).filter(
            models.ProjectParticipant.user_id == user_id,
            models.ProjectParticipant.is_active == True
        )
    items = item_query.all()
    
    for item in items:
        purchase = item.purchase
        payer_id = purchase.payer_user_id
        contributors = item.contributors
        if not contributors:
            continue
            
        item_total = (float(item.price) * item.quantity) - float(item.discount)
        share = item_total / len(contributors)
        
        # Payer paid the full amount -> Credit
        net_balances[payer_id] += item_total
        
        # Each contributor consumed a share -> Debit
        for cont in contributors:
            net_balances[cont.user_id] -= share

    # 2. Process Direct Payments
    # Direct payments are also project-scoped.
    payment_query = db.query(models.Payment)
    
    if project_id:
        payment_query = payment_query.filter(models.Payment.project_id == project_id)
    else:
        # Global view: only projects where user is an active participant
        payment_query = payment_query.join(models.Project).join(models.ProjectParticipant).filter(
            models.ProjectParticipant.user_id == user_id,
            models.ProjectParticipant.is_active == True
        )
    payments = payment_query.all()
    
    for p in payments:
        # Payer gave money -> Credit (reduced debt or increased credit)
        net_balances[p.payer_user_id] += float(p.amount)
        # Receiver got money -> Debit (reduced credit or increased debt)
        net_balances[p.receiver_user_id] -= float(p.amount)

    # 3. Separate Debtors and Creditors
    debtors = []
    creditors = []
    
    for uid, balance in net_balances.items():
        if balance < -0.01:
            debtors.append({'id': uid, 'amount': abs(balance)})
        elif balance > 0.01:
            creditors.append({'id': uid, 'amount': balance})
            
    # Sort by magnitude to minimize transactions (Greedy approach)
    debtors.sort(key=lambda x: x['amount'], reverse=True)
    creditors.sort(key=lambda x: x['amount'], reverse=True)
    
    result = []
    i = 0
    j = 0
    
    while i < len(debtors) and j < len(creditors):
        debtor = debtors[i]
        creditor = creditors[j]
        
        amount = min(debtor['amount'], creditor['amount'])
        
        # Record settlement
        # Filter by user_id if provided (for My Balances view)
        if user_id is None or user_id == debtor['id'] or user_id == creditor['id']:
            result.append({
                "user_a_id": debtor['id'],
                "user_a_name": user_map.get(debtor['id'], "Unknown"),
                "user_b_id": creditor['id'],
                "user_b_name": user_map.get(creditor['id'], "Unknown"),
                "amount": round(amount, 2)
            })
        
        # Update remaining amounts
        debtor['amount'] -= amount
        creditor['amount'] -= amount
        
        if debtor['amount'] < 0.01:
            i += 1
        if creditor['amount'] < 0.01:
            j += 1
            
    return result
