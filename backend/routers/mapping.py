from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import database, auth
from ..services import mapping_service
from pydantic import BaseModel

router = APIRouter(prefix="/mapping", tags=["mapping"])

class MappingRequest(BaseModel):
    original_name: str
    friendly_name: str

class LookupRequest(BaseModel):
    name: str

@router.post("/set")
async def set_mapping(req: MappingRequest, db: Session = Depends(database.get_db), current_user = Depends(auth.get_current_user)):
    mapping_service.set_friendly_name(db, req.original_name, req.friendly_name, current_user.user_id)
    return {"status": "success"}

@router.post("/get")
async def get_mapping(req: LookupRequest, db: Session = Depends(database.get_db), current_user = Depends(auth.get_current_user)):
    name = mapping_service.get_friendly_name(db, req.name, current_user.user_id)
    return {"friendly_name": name}
