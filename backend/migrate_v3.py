import sys
import os
from sqlalchemy import text, inspect

# Ensure the app directory is in the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine

def run_migration():
    print("Starting Migration V3 (Soft Removal)...")
    
    inspector = inspect(engine)
    
    with engine.connect() as connection:
        # 1. Add 'is_active' to 'project_participants' if missing
        columns_participants = [c['name'] for c in inspector.get_columns('project_participants')]
        if 'is_active' not in columns_participants:
            print("Adding 'is_active' column to project_participants table...")
            try:
                if engine.dialect.name == 'sqlite':
                    connection.execute(text("ALTER TABLE project_participants ADD COLUMN is_active BOOLEAN DEFAULT 1 NOT NULL"))
                else:
                    connection.execute(text("ALTER TABLE project_participants ADD COLUMN is_active BOOLEAN DEFAULT TRUE NOT NULL"))
                connection.commit()
                print("Successfully added 'is_active' column.")
            except Exception as e:
                print(f"Error adding is_active: {e}")
        else:
            print("'is_active' column already exists.")

    print("Migration V3 completed successfully!")

if __name__ == "__main__":
    run_migration()
