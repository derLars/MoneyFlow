import requests
import time
import subprocess
from backend.database import SessionLocal
from backend.repositories.user_repo import create_user, get_user_by_name
from backend.auth import get_password_hash

def test_auth_workflow():
    db = SessionLocal()
    try:
        # 1. Register a test user programmatically
        username = "auth_test_user"
        password = "secure_password"
        
        existing_user = get_user_by_name(db, username)
        if not existing_user:
            create_user(db, name=username, password_hash=get_password_hash(password))
            print(f"Registered user: {username}")
        else:
            print(f"User {username} already exists.")
        
        # 2. Start the server
        proc = subprocess.Popen(
            ["venv/bin/python3", "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8002"],
            env={"PYTHONPATH": "."}
        )
        time.sleep(3) # Wait for server to start
        
        try:
            # 3. Test Login (Success)
            print("Testing login with correct credentials...")
            response = requests.post(
                "http://127.0.0.1:8002/api/auth/token",
                data={"username": username, "password": password}
            )
            assert response.status_code == 200
            token = response.json()["access_token"]
            print("Login successful, token received.")

            # 4. Test Login (Failure)
            print("Testing login with wrong password...")
            response = requests.post(
                "http://127.0.0.1:8002/api/auth/token",
                data={"username": username, "password": "wrong_password"}
            )
            assert response.status_code == 401
            print("Login failure correctly returned 401.")

            # 5. Test Protected Endpoint
            print("Testing protected endpoint /auth/me...")
            response = requests.get(
                "http://127.0.0.1:8002/api/auth/me",
                headers={"Authorization": f"Bearer {token}"}
            )
            assert response.status_code == 200
            user_info = response.json()
            assert user_info["name"] == username
            print(f"Protected endpoint access successful for user: {user_info['name']}")

        finally:
            proc.terminate()
            proc.wait()
            print("Server shut down.")

        return True
    except Exception as e:
        print(f"Error during Auth V&V: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    if test_auth_workflow():
        print("Auth V&V Passed!")
    else:
        print("Auth V&V Failed!")
        exit(1)
