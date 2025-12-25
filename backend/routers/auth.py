from datetime import timedelta
from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from .. import auth, database, models
from ..repositories import user_repo

router = APIRouter(prefix="/auth", tags=["auth"])

class UserResponse(BaseModel):
    user_id: int
    name: str
    administrator: bool
    default_tax_rate: float
    common_tax_rates: str

class UserCreate(BaseModel):
    name: str
    password: str

class PasswordOverride(BaseModel):
    new_password: str

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class NameChange(BaseModel):
    new_name: str

class TaxSettingsUpdate(BaseModel):
    default_tax_rate: float
    common_tax_rates: str

@router.post("/token")
async def login_for_access_token(db: Session = Depends(database.get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = user_repo.get_user_by_name(db, name=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not known, not validated, or wrong password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.name}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
async def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return {
        "user_id": current_user.user_id,
        "name": current_user.name,
        "administrator": current_user.administrator,
        "default_tax_rate": float(current_user.default_tax_rate),
        "common_tax_rates": current_user.common_tax_rates
    }

@router.get("/users", response_model=List[UserResponse])
async def list_users(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not current_user.administrator:
        raise HTTPException(status_code=403, detail="Not authorized")
    users = user_repo.get_all_users(db)
    return users

@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    is_admin: bool,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not current_user.administrator:
        raise HTTPException(status_code=403, detail="Not authorized")
    user = user_repo.set_administrator_rights(db, user_id=user_id, is_admin=is_admin)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "success", "administrator": user.administrator}

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not current_user.administrator:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Prevent self-deletion for safety
    if user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
        
    success = user_repo.delete_user(db, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "success"}

@router.post("/change-password")
async def change_password(
    data: PasswordChange,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # 1. Verify current password
    if not auth.verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    # 2. Update to new password
    success = user_repo.update_user_password(
        db, 
        user_id=current_user.user_id, 
        new_password_hash=auth.get_password_hash(data.new_password)
    )
    return {"status": "success"}

@router.post("/update-name")
async def update_name(
    data: NameChange,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Check uniqueness
    existing = user_repo.get_user_by_name(db, name=data.new_name)
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
        
    success = user_repo.update_user_name(db, user_id=current_user.user_id, new_name=data.new_name)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Since the JWT is based on the username, the user will need to re-login 
    # to get a new valid token with the correct 'sub' claim.
    return {"status": "success", "message": "Name updated. please re-login."}

@router.post("/tax-settings")
async def update_tax_settings(
    data: TaxSettingsUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    success = user_repo.update_user_tax_settings(
        db, 
        user_id=current_user.user_id, 
        default_tax_rate=data.default_tax_rate,
        common_tax_rates=data.common_tax_rates
    )
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "success"}

@router.post("/users", response_model=UserResponse)
async def create_user(
    user_in: UserCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not current_user.administrator:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    existing = user_repo.get_user_by_name(db, name=user_in.name)
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    user = user_repo.create_user(
        db, 
        name=user_in.name, 
        password_hash=auth.get_password_hash(user_in.password)
    )
    return user

@router.post("/users/{user_id}/password-override")
async def admin_override_password(
    user_id: int,
    data: PasswordOverride,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not current_user.administrator:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    success = user_repo.update_user_password(
        db, 
        user_id=user_id, 
        new_password_hash=auth.get_password_hash(data.new_password)
    )
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "success"}
