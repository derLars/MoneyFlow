from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime, date

class User(BaseModel):
    user_id: int
    name: str
    administrator: bool
    is_dummy: bool

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

# --- Project Schemas ---

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    image_path: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(ProjectBase):
    pass

class ProjectParticipantResponse(BaseModel):
    participant_id: int
    user_id: int
    joined_at: datetime
    user_name: str
    is_active: bool

class ProjectResponse(ProjectBase):
    project_id: int
    created_at: datetime
    created_by_user_id: Optional[int]
    participants: List[ProjectParticipantResponse] = []

    class Config:
        orm_mode = True

class ProjectParticipantAdd(BaseModel):
    user_id: int

# --- Search Schemas ---

class SearchResultItem(BaseModel):
    type: str  # 'project', 'purchase', 'item'
    id: int
    title: str
    subtitle: Optional[str] = None
    project_id: Optional[int] = None
    project_name: Optional[str] = None
    date: Optional[str] = None

class SearchResponse(BaseModel):
    results: List[SearchResultItem]

# --- Saved Filter Schemas ---

class SavedFilterBase(BaseModel):
    name: str
    configuration: Dict[str, Any]

class SavedFilterCreate(SavedFilterBase):
    pass

class SavedFilterResponse(SavedFilterBase):
    filter_id: int
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True
