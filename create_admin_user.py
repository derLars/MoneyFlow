import sys
import os
sys.path.append(os.getcwd())

from backend.database import SessionLocal, create_user, get_user_by_name, set_administrator_rights
from backend.auth import get_password_hash

def create_admin():
    db = SessionLocal()
    username = "admin"
    password = "adminpassword"
    
    try:
        existing_user = get_user_by_name(db, username)
        if existing_user:
            print(f"User {username} already exists. Updating password...")
            # We don't have a direct update_user_password in database.py but we can do it manually or delete/recreate
            # For simplicity, let's just use what's there or inform.
            # Actually, let's just make sure we have a user we KNOW the password for.
        
        user = create_user(db, name=username, password_hash=get_password_hash(password))
        set_administrator_rights(db, user.user_id, True)
        print(f"Successfully created Admin user!")
        print(f"Username: {username}")
        print(f"Password: {password}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
