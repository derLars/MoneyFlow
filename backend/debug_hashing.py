import sys
import os
sys.path.append(os.getcwd())

from backend.database import SessionLocal, create_user, get_user_by_name, delete_user
from backend.auth import get_password_hash, verify_password

def test_user_creation_logic():
    db = SessionLocal()
    username = "debug_user"
    password = "debugpassword"
    
    try:
        # Clean up
        existing = get_user_by_name(db, username)
        if existing:
            delete_user(db, existing.user_id)
            print("Cleaned up existing debug user.")
            
        # 1. Hash the password
        hashed = get_password_hash(password)
        print(f"Generated Hash: {hashed}")
        
        # 2. Create user
        user = create_user(db, name=username, password_hash=hashed)
        print(f"Created user: {user.name}")
        
        # 3. Verify immediately
        is_valid = verify_password(password, user.password_hash)
        print(f"Immediate verification (Same scheme): {is_valid}")
        
        if not is_valid:
            print("CRITICAL: Hashing mismatch detected!")
        else:
            print("Hashing logic is consistent.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_user_creation_logic()
