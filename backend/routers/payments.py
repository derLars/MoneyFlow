from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import date
from .. import database, models, auth
from ..repositories import payment_repo

router = APIRouter(prefix="/payments", tags=["payments"])

class PaymentCreate(BaseModel):
    payer_user_id: int
    receiver_user_id: int
    amount: float
    payment_date: date
    note: Optional[str] = None

class PaymentResponse(BaseModel):
    payment_id: int
    creator_user_id: int
    payer_user_id: int
    receiver_user_id: int
    amount: float
    payment_date: date
    note: Optional[str] = None

    class Config:
        from_attributes = True

class BalanceResponse(BaseModel):
    user_a_id: int
    user_a_name: str
    user_b_id: int
    user_b_name: str
    amount: float

@router.post("/", response_model=PaymentResponse)
def create_payment(payment: PaymentCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Rule 1: Record can be created by someone who is either the sender or the receiver
    if current_user.user_id not in [payment.payer_user_id, payment.receiver_user_id]:
        raise HTTPException(status_code=403, detail="You must be either the sender or the receiver of the payment")
        
    return payment_repo.create_payment(
        db, 
        creator_user_id=current_user.user_id,
        payer_user_id=payment.payer_user_id,
        receiver_user_id=payment.receiver_user_id,
        amount=payment.amount,
        payment_date=payment.payment_date,
        note=payment.note
    )

@router.get("/", response_model=List[PaymentResponse])
def get_payments(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return payment_repo.get_payments_for_user(db, current_user.user_id)

@router.delete("/{payment_id}")
def delete_payment(payment_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Refined auth: sender, receiver or admin can delete
    db_payment = payment_repo.get_payment_by_id(db, payment_id)
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    is_authorized = (
        current_user.administrator or
        db_payment.payer_user_id == current_user.user_id or
        db_payment.receiver_user_id == current_user.user_id
    )

    if not is_authorized:
        raise HTTPException(status_code=403, detail="Not authorized to delete this payment")
        
    payment_repo.delete_payment(db, payment_id)
    return {"message": "Payment deleted"}

@router.get("/balances", response_model=List[BalanceResponse])
def get_balances(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Rule 2: User shall only be able to see the Balances that imply himself
    return payment_repo.get_money_flow_balances(db, user_id=current_user.user_id)
