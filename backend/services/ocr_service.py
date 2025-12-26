import base64
import json
import os
from typing import List, Dict
from fastapi import UploadFile
from fastapi.concurrency import run_in_threadpool
from mistralai import Mistral

async def process_receipts_with_pixtral(files: List[UploadFile]) -> List[Dict]:
    """
    Uses Pixtral (Vision LLM) to extract structured data directly from receipt images.
    Replaces the old OpenCV -> Tesseract -> Text LLM pipeline.
    """
    # 1. Read files (Async I/O)
    images_content = []
    for file in files:
        content = await file.read()
        b64 = base64.b64encode(content).decode('utf-8')
        mime = file.content_type or "image/jpeg"
        images_content.append(f"data:{mime};base64,{b64}")
        await file.seek(0)

    # 2. Call Mistral (Blocking I/O) -> Offload to thread pool
    return await run_in_threadpool(_call_pixtral, images_content)

def _call_pixtral(images_content: List[str]) -> List[Dict]:
    api_key = os.environ.get("MISTRAL_API_KEY")
    if not api_key:
        print("MISTRAL_API_KEY not found in environment.")
        return []

    client = Mistral(api_key=api_key)
    model = "pixtral-12b-2409"

    # Prepare message content
    content = [
        {
            "type": "text", 
            "text": "You are an expert receipt scanner. Look at the attached receipt images. Extract all purchased items. Return ONLY a valid JSON object with a key 'items' containing a list of objects. Each object must have: 'extracted_name' (string), 'quantity' (integer, default 1), 'price' (number, representing the FINAL price or the UNIT price if quantity is greater than 1), 'total_price' (number), and 'discount' (number, positive value, default 0). Do NOT extract the base price (e.g., price per kilo). If a line says '2 x 3.50', the quantity is 2 and the price is 3.50. If a discount is explicitly listed for an item, extract it. Ignore the receipt total. If a value is unknown, use null. Do not include any markdown formatting."
        }
    ]

    for image_url in images_content:
        content.append({
            "type": "image_url",
            "image_url": image_url
        })

    messages = [
        {
            "role": "user",
            "content": content
        }
    ]

    try:
        response = client.chat.complete(
            model=model,
            messages=messages,
            response_format={"type": "json_object"}
        )
        
        raw_content = response.choices[0].message.content
        print(f"DEBUG: Pixtral Raw Response: {raw_content}")
        
        data = json.loads(raw_content)
        items_data = data.get("items", [])
        
        items = []
        for item in items_data:
            name = item.get("extracted_name")
            if name:
                items.append({
                    "extracted_name": str(name).strip(),
                    "price": float(item.get("price") or 0.0),
                    "quantity": int(item.get("quantity") or 1),
                    "discount": float(item.get("discount") or 0.0)
                })
        
        return items

    except Exception as e:
        print(f"Pixtral Analysis Error: {e}")
        # Return empty list or handle error appropriately
        return []
