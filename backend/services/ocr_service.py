import cv2
import numpy as np
import pytesseract
import os
import json
import re
from typing import List, Dict
from fastapi import UploadFile
from fastapi.concurrency import run_in_threadpool
from mistralai import Mistral

def preprocess_image(image: np.ndarray, threshold1: int, threshold2: int, save_path: str = None) -> np.ndarray:
    """
    Exact code from Section 9.3 of the specification.
    Added save_path for debugging/fine-tuning.
    """
    filtered = image.copy()
    gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray_image = cv2.blur(gray_image, (3, 3))
    contour_thresh = cv2.threshold(gray_image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

    # Invert
    contour_thresh = 255 - contour_thresh

    contours = cv2.findContours(contour_thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = contours[0] if len(contours) == 2 else contours[1]

    for contour in contours:
        if cv2.contourArea(contour) > threshold2:
            cv2.drawContours(filtered, [contour], -1, color=(255, 255, 255), thickness=cv2.FILLED)

    filtered_gray = cv2.cvtColor(filtered, cv2.COLOR_BGR2GRAY)
    filtered_image = cv2.threshold(filtered_gray, threshold1, 255, cv2.THRESH_BINARY)[1]

    if save_path:
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        cv2.imwrite(save_path, filtered_image)
    
    return filtered_image

def extract_information(image: np.ndarray) -> str:
    """
    Extracts text using pytesseract and filters the output.
    - Keeps letters, digits, points, commas, and spaces.
    - Removes all other symbols.
    - Replaces commas with points.
    """
    raw_text = pytesseract.image_to_string(image)
    
    # 1. Filter: Keep a-z, A-Z, 0-9, ., ,, and space
    # The regex [^a-zA-Z0-9., \n] matches anything NOT in our allowed list.
    # We include \n to preserve line breaks which are important for Mistral.
    filtered_text = re.sub(r'[^a-zA-Z0-9., \n]', '', raw_text)
    
    # 2. Replace commas with points
    final_text = filtered_text.replace(',', '.')
    
    return final_text

def analyze_information(extracted_text: str) -> List[Dict]:
    """
    Uses Mistral AI to structure raw OCR text into items and prices.
    Exact system message from Section 9.3 of the specification.
    """
    api_key = os.environ.get("MISTRAL_API_KEY")
    if not api_key:
        print("MISTRAL_API_KEY not found in environment.")
        return []

    #model = "mistral-small-latest"
    model = "mistral-large-2411"
    client = Mistral(api_key=api_key)

    system_message = "You are an expert extraction algorithm. The text is a shopping receipt. Extract the purchased items and their prices. Output a strictly valid JSON object with a key 'items', which is a list of objects. Each object must have 'extracted_name' (string) and 'price' (number). Ignore the total price. If a value is unknown, use null. Do not output any markdown formatting."
    
    messages = [
        {'role': "system", 'content': system_message},
        {'role': "user", 'content': extracted_text}
    ]

    response = client.chat.complete(
        model=model, 
        messages=messages,
        response_format={"type": "json_object"}
    )
    raw_content = response.choices[0].message.content

    items = []
    try:
        data = json.loads(raw_content)
        items_data = data.get("items", [])
        
        for item in items_data:
            name = item.get("extracted_name")
            if name:
                items.append({
                    "extracted_name": str(name).strip(),
                    "price": float(item.get("price") or 0.0)
                })
                
    except Exception as e:
        print(f"Error parsing Mistral response: {e}. Content: {raw_content}")
        # Fallback to regex if JSON fails (legacy support)
        try:
            lines = raw_content.strip().split("\n")
            for line in lines:
                line = line.strip()
                if not line: continue
                match = re.search(r'(\d+(?:\.\d+)?)$', line)
                if match:
                    price = float(match.group(1))
                    name = line[:match.start()].strip()
                    if name: items.append({"extracted_name": name, "price": price})
        except:
            items = [{"extracted_name": raw_content[:100], "price": 0.0}]

    return items

async def process_image_file(file: UploadFile, threshold1: int = 125, threshold2: int = 400) -> str:
    """
    Pipeline Stage 1: Load -> Preprocess -> Extract Text
    """
    # Load image from upload stream
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    opencv_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if opencv_image is None:
        return ""

    # Step 1: Pre-process
    # Force saving the filtered image for development debugging
    debug_save_path = "tests/outputs/filtered.png"
    preprocessed = await run_in_threadpool(
        preprocess_image, opencv_image, threshold1, threshold2, save_path=debug_save_path
    )
    print(f"DEBUG: Preprocessed image saved to {debug_save_path}")
    
    # Step 2: Extract text
    text = await run_in_threadpool(extract_information, preprocessed)
    
    return text
