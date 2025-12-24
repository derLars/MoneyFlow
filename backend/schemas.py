from pydantic import BaseModel
from typing import Optional

class User(BaseModel):
    user_id: int
    name: str
    administrator: bool

    class Config:
        orm_mode = True

class CategoryCreate(BaseModel):
    category_name: str
    level: int

class CategoryResponse(BaseModel):
    category_id: int
    user_id: int
    category_name: str
    level: int

    class Config:
        orm_mode = True
