import sys
import os
import getpass

# Ensure the app directory is in the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import database
import auth
from repositories import user_repo

def create_admin():
    username = "admin"
    
    print(f"--- Moneyflow Admin Configuration ---")
    password = getpass.getpass(f"Enter new password for '{username}': ")
    
    if not password:
        print("Error: Password cannot be empty.")
        return

    db = database.SessionLocal()
    try:
        existing_user = user_repo.get_user_by_name(db, username)
        if existing_user:
            print(f"User '{username}' already exists. Updating password and ensuring admin role...")
            user_repo.update_user_password(db, existing_user.user_id, auth.get_password_hash(password))
            user_repo.set_administrator_rights(db, existing_user.user_id, True)
        else:
            print(f"Creating new '{username}' account...")
            user = user_repo.create_user(db, name=username, password_hash=auth.get_password_hash(password))
            user_repo.set_administrator_rights(db, user.user_id, True)
        
        print(f"Successfully configured '{username}' user!")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
