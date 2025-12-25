from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.concurrency import run_in_threadpool
from typing import List, Dict
from ..services import ocr_service
from .. import auth

router = APIRouter(prefix="/ocr", tags=["ocr"])

@router.post("/upload", response_model=List[Dict])
async def upload_receipt_images(
    files: List[UploadFile] = File(...),
    current_user = Depends(auth.get_current_user)
):
    """
    Step 15: Accepts images, runs OCR pipeline, and then uses Mistral AI
    to extract structured items and prices.
    """
    combined_text = ""
    for file in files:
        text = await ocr_service.process_image_file(file)
        combined_text += text + "\n"
    
    if not combined_text.strip():
        raise HTTPException(status_code=400, detail="No text could be extracted from the images.")

    # Call Mistral AI to structure the data
    try:
        print(f"DEBUG: Combined text for analysis:\n{combined_text}")
        structured_items = await run_in_threadpool(ocr_service.analyze_information, combined_text)
        print(f"DEBUG: Structured items from Mistral: {structured_items}")
        return structured_items
    except Exception as e:
        print(f"Mistral Analysis Error: {e}")
        raise HTTPException(status_code=500, detail=f"AI Analysis failed: {str(e)}")
