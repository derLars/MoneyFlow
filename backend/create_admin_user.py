import sys
import os
import argparse

# Ensure the app directory is in the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import database
import auth
from repositories import user_repo

def create_admin(username=None, password=None):
    db = database.SessionLocal()
    username = username or "admin"
    password = password or "adminpassword"
    
    try:
        existing_user = user_repo.get_user_by_name(db, username)
        if existing_user:
            print(f"User {username} already exists. Updating password and role...")
            user_repo.update_user_password(db, existing_user.user_id, auth.get_password_hash(password))
            user_repo.set_administrator_rights(db, existing_user.user_id, True)
            user = existing_user
        else:
            user = user_repo.create_user(db, name=username, password_hash=auth.get_password_hash(password))
            user_repo.set_administrator_rights(db, user.user_id, True)
        
        print(f"Successfully configured Admin user!")
        print(f"Username: {username}")
        print(f"Password: {password}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create or update admin user.")
    parser.add_argument("--username", help="Admin username")
    parser.add_argument("--password", help="Admin password")
    args = parser.parse_args()
    
    create_admin(username=args.username, password=args.password)
