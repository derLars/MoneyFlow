import requests
import time
import subprocess
import os
from backend.database import SessionLocal, get_user_by_name
from backend.auth import get_password_hash

def test_mistral_analysis():
    # 1. Ensure test user exists
    db = SessionLocal()
    username = "mistral_test_user"
    password = "password"
    user = get_user_by_name(db, username)
    if not user:
        from backend.database import create_user
        create_user(db, name=username, password_hash=get_password_hash(password))
    db.close()

    try:
        # 2. Start the server
        print("Starting server...")
        proc = subprocess.Popen(
            ["venv/bin/python3", "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8001"],
            env={"PYTHONPATH": ".", "MISTRAL_API_KEY": os.environ.get("MISTRAL_API_KEY", "")}
        )
        time.sleep(3) # Wait for server to start
        
        try:
            # 3. Login to get token
            print("Logging in...")
            login_resp = requests.post(
                "http://127.0.0.1:8001/auth/token",
                data={"username": username, "password": password}
            )
            token = login_resp.json()["access_token"]

            # 4. Upload test image
            file_path = "tests/fixtures/test_receipt.png"
            print(f"Uploading {file_path} to /ocr/upload...")
            with open(file_path, "rb") as f:
                files = {"files": ("test_receipt.png", f, "image/png")}
                response = requests.post(
                    "http://127.0.0.1:8001/ocr/upload", 
                    files=files,
                    headers={"Authorization": f"Bearer {token}"}
                )
            
            # 5. Verify response
            if response.status_code == 200:
                result = response.json()
                print(f"Success! Mistral AI returned {len(result)} structured items:")
                for item in result:
                    print(f" - {item.get('friendly_name')}: {item.get('price')}")
                
                if len(result) > 0:
                    print("Mistral integration V&V passed!")
                    return True
                else:
                    print("Mistral AI returned an empty list.")
                    return False
            else:
                print(f"Mistral request failed with status {response.status_code}: {response.text}")
                return False

        finally:
            proc.terminate()
            proc.wait()
            print("Server shut down.")

    except Exception as e:
        print(f"Error during Mistral V&V: {e}")
        return False

if __name__ == "__main__":
    if "MISTRAL_API_KEY" not in os.environ:
        print("SKIP: MISTRAL_API_KEY not set in environment.")
        exit(0)
        
    if test_mistral_analysis():
        print("Mistral V&V Passed!")
    else:
        print("Mistral V&V Failed!")
        exit(1)
