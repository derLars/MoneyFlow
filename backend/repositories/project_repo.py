from sqlalchemy.orm import Session
from sqlalchemy import func
import models
import datetime
import uuid

def create_project(db: Session, name: str, description: str, image_path: str, creator_id: int):
    new_project = models.Project(
        name=name,
        description=description,
        image_path=image_path,
        created_by_user_id=creator_id
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    
    # Auto-add creator as participant
    add_participant(db, new_project.project_id, creator_id)
    
    return new_project

def get_user_projects(db: Session, user_id: int):
    return db.query(models.Project).join(
        models.ProjectParticipant
    ).filter(
        models.ProjectParticipant.user_id == user_id,
        models.ProjectParticipant.is_active == True
    ).order_by(models.Project.created_at.desc()).all()

def get_project_by_id(db: Session, project_id: int):
    return db.query(models.Project).filter(models.Project.project_id == project_id).first()

def update_project(db: Session, project_id: int, name: str, description: str, image_path: str):
    project = get_project_by_id(db, project_id)
    if project:
        project.name = name
        if description is not None:
            project.description = description
        if image_path is not None:
            project.image_path = image_path
        db.commit()
        db.refresh(project)
    return project

def add_participant(db: Session, project_id: int, user_id: int):
    # Check if already exists
    exists = db.query(models.ProjectParticipant).filter(
        models.ProjectParticipant.project_id == project_id,
        models.ProjectParticipant.user_id == user_id
    ).first()
    
    if not exists:
        participant = models.ProjectParticipant(
            project_id=project_id,
            user_id=user_id
        )
        db.add(participant)
        db.commit()
    elif not exists.is_active:
        exists.is_active = True
        db.commit()
    return exists

def remove_participant(db: Session, project_id: int, user_id: int):
    # Soft removal: Set is_active = False.
    # Users remain selectable for historical reasons but lose visibility.
    participant = db.query(models.ProjectParticipant).filter(
        models.ProjectParticipant.project_id == project_id,
        models.ProjectParticipant.user_id == user_id
    ).first()
    if participant:
        participant.is_active = False
        db.commit()

def delete_project(db: Session, project_id: int):
    # Use object-based deletion to trigger SQLAlchemy cascades
    project = get_project_by_id(db, project_id)
    if project:
        db.delete(project)
        db.commit()

def get_project_stats(db: Session, project_id: int):
    # Calculate total spending
    total = db.query(func.sum(
        (models.Item.price * models.Item.quantity) - models.Item.discount
    )).join(models.Purchase).filter(
        models.Purchase.project_id == project_id
    ).scalar() or 0.0
    
    return {"total_spending": float(total)}
