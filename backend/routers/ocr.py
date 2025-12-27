import sys
import os

# Ensure the parent directory is in the path so we can import models/database etc
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import database, auth, models
import services.ocr_service as ocr_service

router = APIRouter(prefix="/ocr", tags=["ocr"])

@router.post("/upload")
async def scan_receipt(
    files: List[UploadFile] = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if len(files) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 images allowed")

    try:
        # Step 1-3: Preprocess, Extract, Analyze (now using process_receipts_with_pixtral)
        items = await ocr_service.process_receipts_with_pixtral(files)
        print(f"DEBUG: Extracted items from Pixtral: {items}")
        
        # Step 4: Apply Friendly Name Mapping (Logic from Section 9.1)
        if items and isinstance(items, list):
            # Local import to avoid circular dependencies
            from services import mapping_service
            
            for item in items:
                original_name = item.get("extracted_name")
                if original_name:
                    try:
                        friendly_name = mapping_service.get_friendly_name(db, original_name, current_user.user_id)
                        item["friendly_name"] = friendly_name
                    except Exception as me:
                        print(f"DEBUG: Mapping service error for {original_name}: {me}")
                        item["friendly_name"] = original_name
        
        return {"items": items}
    except Exception as e:
        print(f"OCR Scan Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
