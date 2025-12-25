from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
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
    Uses Pixtral (Vision LLM) to analyze receipt images directly.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    try:
        # Pass the files directly to the Vision service
        structured_items = await ocr_service.process_receipts_with_pixtral(files)
        print(f"DEBUG: Structured items from Pixtral: {structured_items}")
        
        if not structured_items:
             # It might return empty list if nothing found or error caught inside service
             # We can optionally raise 400 if strictly nothing found, or just return []
             pass
             
        return structured_items
    except Exception as e:
        print(f"Vision Analysis Error: {e}")
        raise HTTPException(status_code=500, detail=f"AI Analysis failed: {str(e)}")
