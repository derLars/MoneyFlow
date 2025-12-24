import requests
import time
import subprocess
import os
import json
from backend.database import SessionLocal, get_user_by_name
from backend.auth import get_password_hash

def test_ocr_and_mistral_receipt2():
    # 1. Ensure test user exists
    db = SessionLocal()
    username = "ocr_test_user_2"
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
            file_path = "tests/fixtures/test_receipt2.png"
            if not os.path.exists(file_path):
                print(f"Error: {file_path} not found.")
                return False

            print(f"Processing {file_path}...")
            
            # Since I want to see both OCR and Mistral, I'll temporarily 
            # use a modified endpoint or just log on the backend.
            # For now, I'll just run the request and look at the final output.
            
            with open(file_path, "rb") as f:
                files = {"files": ("test_receipt2.png", f, "image/png")}
                response = requests.post(
                    "http://127.0.0.1:8001/ocr/upload", 
                    files=files,
                    headers={"Authorization": f"Bearer {token}"}
                )
            
            # 5. Output results
            if response.status_code == 200:
                result = response.json()
                print("\n=== MISTRAL ANALYSIS OUTPUT ===")
                print(json.dumps(result, indent=2))
                print("===============================\n")
                return True
            else:
                print(f"Request failed with status {response.status_code}: {response.text}")
                return False

        finally:
            proc.terminate()
            proc.wait()
            print("Server shut down.")

    except Exception as e:
        print(f"Error during test: {e}")
        return False

if __name__ == "__main__":
    if "MISTRAL_API_KEY" not in os.environ:
        print("ERROR: MISTRAL_API_KEY not set in environment.")
        exit(1)
        
    test_ocr_and_mistral_receipt2()
