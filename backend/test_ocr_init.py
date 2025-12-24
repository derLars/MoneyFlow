import requests
import time
import subprocess
import os

def test_ocr_endpoint():
    try:
        # 1. Start the server
        print("Starting server...")
        proc = subprocess.Popen(
            ["venv/bin/python3", "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8001"],
            env={"PYTHONPATH": "."}
        )
        time.sleep(3) # Wait for server to start
        
        try:
            # 2. Prepare the test image
            file_path = "tests/fixtures/test_receipt.png"
            if not os.path.exists(file_path):
                print(f"Error: {file_path} not found.")
                return False

            # 3. Send POST request to /ocr/upload
            print(f"Uploading {file_path} to /ocr/upload...")
            with open(file_path, "rb") as f:
                files = {"files": ("test_receipt.png", f, "image/png")}
                response = requests.post("http://127.0.0.1:8001/ocr/upload", files=files)
            
            # 4. Verify response
            if response.status_code == 200:
                result = response.json()
                text = result.get("extracted_text", "")
                print(f"Success! Extracted text:\n{text}")
                if "Milk" in text or "Bread" in text:
                    print("OCR verification passed!")
                    return True
                else:
                    print("OCR produced unexpected text.")
                    return False
            else:
                print(f"OCR request failed with status {response.status_code}: {response.text}")
                return False

        finally:
            proc.terminate()
            proc.wait()
            print("Server shut down.")

    except Exception as e:
        print(f"Error during OCR V&V: {e}")
        return False

if __name__ == "__main__":
    if test_ocr_endpoint():
        print("OCR V&V Passed!")
    else:
        print("OCR V&V Failed!")
        exit(1)
