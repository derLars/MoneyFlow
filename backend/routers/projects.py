import sys
import os
import json
from typing import List, Optional

# Ensure the parent directory is in the path so we can import models/database etc
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
import database, auth, models, schemas
import repositories.project_repo as project_repo
import repositories.payment_repo as payment_repo
import repositories.purchase_repo as purchase_repo

router = APIRouter(prefix="/projects", tags=["projects"])

@router.get("", response_model=List[schemas.ProjectResponse])
async def list_projects(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    projects = project_repo.get_user_projects(db, current_user.user_id)
    # Convert to response model format (manually handling participants)
    result = []
    for p in projects:
        participants = [
            schemas.ProjectParticipantResponse(
                participant_id=part.participant_id,
                user_id=part.user_id,
                joined_at=part.joined_at,
                user_name=part.user.name,
                is_active=part.is_active
            ) for part in p.participants
        ]
        result.append(schemas.ProjectResponse(
            project_id=p.project_id,
            name=p.name,
            description=p.description,
            image_path=p.image_path,
            created_at=p.created_at,
            created_by_user_id=p.created_by_user_id,
            participants=participants
        ))
    return result

@router.post("")
async def create_project(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    participants: str = Form("[]"), # JSON string of user_ids
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Handle Image Upload
    image_path = None
    if file:
        from storage import get_storage
        store = get_storage()
        try:
            # Use temporary filename first, we don't have project ID yet
            # Better: create project first, then upload.
            # Or use random uuid for filename.
            import uuid
            unique_id = uuid.uuid4().hex
            file_name = f"project_img_{unique_id}_{file.filename}"
            store.upload_fileobj(file.file, file_name)
            image_path = file_name
        except Exception as e:
            print(f"DEBUG: Failed to save project image: {e}")

    # Create Project
    new_project = project_repo.create_project(db, name, description or "", image_path, current_user.user_id)
    
    # Add Participants
    try:
        participant_ids = json.loads(participants)
        for uid in participant_ids:
            if uid != current_user.user_id: # Creator is already added
                project_repo.add_participant(db, new_project.project_id, uid)
    except Exception as e:
        print(f"DEBUG: Error adding participants: {e}")

    # Return response
    db.refresh(new_project)
    
    # Serialize manually or refetch to load participants
    return {
        "project_id": new_project.project_id,
        "name": new_project.name,
        "image_path": new_project.image_path
    }

@router.get("/{project_id}", response_model=schemas.ProjectResponse)
async def get_project(
    project_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    project = project_repo.get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Permission check: User must be participant
    is_participant = any(p.user_id == current_user.user_id for p in project.participants)
    if not is_participant and not current_user.administrator:
        raise HTTPException(status_code=403, detail="Not authorized to view this project")

    from storage import get_storage
    storage = get_storage()
    image_url = storage.get_file_url(project.image_path) if project.image_path else None
    
    # We cheat a bit and overwrite image_path with url for frontend display if needed, 
    # but strictly schemas expects image_path. 
    # Frontend can handle "image_path" as a key but use it as URL if full path, or we return URL in a separate field.
    # Schema says "image_path: Optional[str]".
    
    participants = [
        schemas.ProjectParticipantResponse(
            participant_id=part.participant_id,
            user_id=part.user_id,
            joined_at=part.joined_at,
            user_name=part.user.name,
            is_active=part.is_active
        ) for part in project.participants
    ]
    
    return schemas.ProjectResponse(
        project_id=project.project_id,
        name=project.name,
        description=project.description,
        image_path=image_url or project.image_path, # Return URL if possible, else path
        created_at=project.created_at,
        created_by_user_id=project.created_by_user_id,
        participants=participants
    )

@router.put("/{project_id}")
async def update_project(
    project_id: int,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    project = project_repo.get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Allow any participant to update project info
    is_participant = any(p.user_id == current_user.user_id for p in project.participants)
    if not is_participant and not current_user.administrator:
        raise HTTPException(status_code=403, detail="Not authorized")

    image_path = None
    if file:
        from storage import get_storage
        store = get_storage()
        try:
            # Generate a unique filename to avoid browser caching issues or name collisions
            import uuid
            unique_id = uuid.uuid4().hex[:8]
            file_name = f"project_img_{project_id}_{unique_id}_{file.filename}"
            store.upload_fileobj(file.file, file_name)
            image_path = file_name
        except Exception as e:
            print(f"DEBUG: Image upload failed: {e}")

    updated = project_repo.update_project(
        db, 
        project_id, 
        name=name if name is not None else project.name, 
        description=description if description is not None else project.description, 
        image_path=image_path
    )
    
    from storage import get_storage
    storage = get_storage()
    image_url = storage.get_file_url(updated.image_path) if updated.image_path else None

    return {
        "status": "success", 
        "project": {
            "project_id": updated.project_id,
            "name": updated.name,
            "description": updated.description,
            "image_path": image_url or updated.image_path
        }
    }

@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    project = project_repo.get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Only administrator can manually delete a project.
    # Regular users (including creator) must leave the project, and it auto-deletes when empty.
    if not current_user.administrator:
        raise HTTPException(status_code=403, detail="Only administrator can manually delete project")

    project_repo.delete_project(db, project_id)
    return {"status": "success"}

@router.get("/admin/all", response_model=List[schemas.ProjectResponse])
async def list_all_projects_admin(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not current_user.administrator:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get ALL projects from DB
    projects = db.query(models.Project).order_by(models.Project.created_at.desc()).all()
    
    result = []
    for p in projects:
        participants = [
            schemas.ProjectParticipantResponse(
                participant_id=part.participant_id,
                user_id=part.user_id,
                joined_at=part.joined_at,
                user_name=part.user.name,
                is_active=part.is_active
            ) for part in p.participants
        ]
        result.append(schemas.ProjectResponse(
            project_id=p.project_id,
            name=p.name,
            description=p.description,
            image_path=p.image_path,
            created_at=p.created_at,
            created_by_user_id=p.created_by_user_id,
            participants=participants
        ))
    return result

@router.post("/{project_id}/participants")
async def add_participant(
    project_id: int,
    data: schemas.ProjectParticipantAdd,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    project = project_repo.get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Check permissions (must be participant)
    is_participant = any(p.user_id == current_user.user_id for p in project.participants)
    if not is_participant and not current_user.administrator:
        raise HTTPException(status_code=403, detail="Not authorized")

    project_repo.add_participant(db, project_id, data.user_id)
    return {"status": "success"}

@router.delete("/{project_id}/participants/{user_id}")
async def remove_participant(
    project_id: int,
    user_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    project = project_repo.get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Allow any participant to remove themselves or others
    is_participant = any(p.user_id == current_user.user_id for p in project.participants)
    if not is_participant and not current_user.administrator:
        raise HTTPException(status_code=403, detail="Not authorized to remove participant")
            
    project_repo.remove_participant(db, project_id, user_id)
    
    # Check if project should be deleted (if all real users left)
    # Refetch project to see remaining participants
    db.refresh(project)
    active_users_count = 0
    for p in project.participants:
        if p.is_active:
            active_users_count += 1
            
    if active_users_count == 0:
        # Delete project
        project_repo.delete_project(db, project_id)
        return {"status": "project_deleted"}

    return {"status": "success"}

@router.get("/{project_id}/moneyflow")
async def get_project_moneyflow(
    project_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Verify access
    project = project_repo.get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    is_participant = any(p.user_id == current_user.user_id for p in project.participants)
    if not is_participant and not current_user.administrator:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return payment_repo.get_money_flow_balances(db, project_id=project_id)

@router.get("/{project_id}/stats")
async def get_project_statistics(
    project_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Verify access
    project = project_repo.get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    is_participant = any(p.user_id == current_user.user_id for p in project.participants)
    if not is_participant and not current_user.administrator:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    stats = project_repo.get_project_stats(db, project_id)
    
    # Add per-user spending in this project
    # TODO: Implement granular stats if needed by spec ("who paid how much")
    # Spec: "In the Project view, the user will then see the spending statistics for the particular group. (Global spending, who paid how much, etc.)"
    
    # Simple implementation: Total paid by each user in this project
    # We can query purchases grouped by payer
    from sqlalchemy import func
    payer_stats = db.query(models.Purchase.payer_user_id, func.sum(
        (models.Item.price * models.Item.quantity) - models.Item.discount
    )).join(models.Item).filter(
        models.Purchase.project_id == project_id
    ).group_by(models.Purchase.payer_user_id).all()
    
    user_spending = []
    user_map = {p.user_id: p.user.name for p in project.participants} # Only current participants? Or include dummies?
    # Dummies might be payers, so we should map them too if possible.
    # Better: fetch names from User table for results
    
    for uid, amount in payer_stats:
        u = db.query(models.User).get(uid)
        user_spending.append({
            "user_id": uid,
            "name": u.name if u else "Unknown",
            "amount": float(amount)
        })
        
    stats["user_spending"] = user_spending
    return stats
