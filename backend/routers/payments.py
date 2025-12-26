import sys
import os

# Ensure the parent directory is in the path so we can import models/database etc
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import database, auth, models
import repositories.payment_repo as payment_repo
from pydantic import BaseModel
from datetime import date

router = APIRouter(prefix="/payments", tags=["payments"])

class PaymentCreate(BaseModel):
    payer_user_id: int
    receiver_user_id: int
    amount: float
    payment_date: date
    note: str = None

@router.post("")
async def create_payment(
    payment_in: PaymentCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return payment_repo.create_payment(
        db,
        creator_user_id=current_user.user_id,
        payer_user_id=payment_in.payer_user_id,
        receiver_user_id=payment_in.receiver_user_id,
        amount=payment_in.amount,
        payment_date=payment_in.payment_date,
        note=payment_in.note
    )

@router.get("")
async def list_payments(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return payment_repo.get_payments_for_user(db, user_id=current_user.user_id)

@router.delete("/{payment_id}")
async def delete_payment(
    payment_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    payment = payment_repo.get_payment_by_id(db, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
        
    if not current_user.administrator and \
       payment.creator_user_id != current_user.user_id and \
       payment.payer_user_id != current_user.user_id and \
       payment.receiver_user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this payment")
        
    payment_repo.delete_payment(db, payment_id)
    return {"status": "success"}

@router.get("/balances")
async def get_balances(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return payment_repo.get_money_flow_balances(db, user_id=current_user.user_id)
