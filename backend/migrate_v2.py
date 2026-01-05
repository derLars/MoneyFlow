import sys
import os
from sqlalchemy import text, inspect
from sqlalchemy.orm import Session

# Ensure the app directory is in the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, SessionLocal
from db_base import Base
import models

def run_migration():
    print("Starting Migration V2 (Projects)...")
    
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    with engine.connect() as connection:
        # 1. Add 'is_dummy' to 'users' if missing
        columns_users = [c['name'] for c in inspector.get_columns('users')]
        if 'is_dummy' not in columns_users:
            print("Adding 'is_dummy' column to users table...")
            try:
                # SQLite specific syntax (no BOOLEAN type natively, uses INTEGER/NUMERIC)
                # But SQLAlchemy models use Boolean. 
                # For SQLite, we can just use ADD COLUMN.
                if engine.dialect.name == 'sqlite':
                    connection.execute(text("ALTER TABLE users ADD COLUMN is_dummy BOOLEAN DEFAULT 0 NOT NULL"))
                else:
                    connection.execute(text("ALTER TABLE users ADD COLUMN is_dummy BOOLEAN DEFAULT FALSE NOT NULL"))
            except Exception as e:
                print(f"Warning adding is_dummy: {e}")

        # 2. Create new tables (Projects, Participants, SavedFilters)
        # SQLAlchemy's create_all will skip existing tables and create missing ones
        print("Creating new tables...")
        Base.metadata.create_all(bind=engine)
        
        # 3. Add 'project_id' to 'purchases' and 'payments' if missing
        # This must be done AFTER create_all to ensure we don't conflict, 
        # but create_all won't touch existing tables. So we do it manually.
        
        columns_purchases = [c['name'] for c in inspector.get_columns('purchases')]
        if 'project_id' not in columns_purchases:
            print("Adding 'project_id' to purchases table...")
            try:
                connection.execute(text("ALTER TABLE purchases ADD COLUMN project_id INTEGER REFERENCES projects(project_id)"))
            except Exception as e:
                print(f"Warning adding project_id to purchases: {e}")

        columns_payments = [c['name'] for c in inspector.get_columns('payments')]
        if 'project_id' not in columns_payments:
            print("Adding 'project_id' to payments table...")
            try:
                connection.execute(text("ALTER TABLE payments ADD COLUMN project_id INTEGER REFERENCES projects(project_id)"))
            except Exception as e:
                print(f"Warning adding project_id to payments: {e}")
        
        connection.commit()

    # 4. Data Migration
    print("Migrating Data...")
    db = SessionLocal()
    try:
        # Check if we have any projects
        project_count = db.query(models.Project).count()
        
        if project_count == 0:
            print("No projects found. Creating 'Legacy Project'...")
            
            # Find a creator (admin or first user)
            creator = db.query(models.User).filter(models.User.administrator == True).first()
            if not creator:
                creator = db.query(models.User).first()
            
            if creator:
                legacy_project = models.Project(
                    name="Legacy Project",
                    description="Auto-generated project for existing purchases.",
                    created_by_user_id=creator.user_id
                )
                db.add(legacy_project)
                db.commit()
                db.refresh(legacy_project)
                
                print(f"Created Project: {legacy_project.name} (ID: {legacy_project.project_id})")
                
                # Add ALL users as participants
                all_users = db.query(models.User).all()
                for user in all_users:
                    participant = models.ProjectParticipant(
                        project_id=legacy_project.project_id,
                        user_id=user.user_id
                    )
                    db.add(participant)
                
                print(f"Added {len(all_users)} participants.")
                
                # Update ALL Purchases to this project
                # Using execute for bulk update
                print("Assigning existing purchases to Legacy Project...")
                db.execute(
                    text("UPDATE purchases SET project_id = :pid WHERE project_id IS NULL"),
                    {"pid": legacy_project.project_id}
                )

                # Update ALL Payments to this project
                print("Assigning existing payments to Legacy Project...")
                db.execute(
                    text("UPDATE payments SET project_id = :pid WHERE project_id IS NULL"),
                    {"pid": legacy_project.project_id}
                )
                
                db.commit()
                print("Data migration complete.")
            else:
                print("No users found. Skipping data migration.")
        else:
            print("Projects already exist. Skipping data migration.")
            
    except Exception as e:
        print(f"Error during data migration: {e}")
        db.rollback()
    finally:
        db.close()

    print("Migration V2 completed successfully!")

if __name__ == "__main__":
    run_migration()
