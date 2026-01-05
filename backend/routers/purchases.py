import sys
import os

# Ensure the parent directory is in the path so we can import models/database etc
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import JSONResponse
from typing import List, Optional
from sqlalchemy.orm import Session
import database
import models
import repositories.purchase_repo as purchase_repo
import repositories.item_repo as item_repo
import repositories.category_repo as category_repo
import repositories.project_repo as project_repo
import auth
from pydantic import BaseModel
from datetime import date

router = APIRouter(prefix="/purchases", tags=["purchases"])

class ItemBase(BaseModel):
    original_name: str
    friendly_name: Optional[str] = None
    category_level_1: Optional[str] = None
    category_level_2: Optional[str] = None
    category_level_3: Optional[str] = None
    quantity: int = 1
    price: float = 0.0
    discount: float = 0.0
    tax_rate: float = 0.0
    contributors: List[int] = [] # list of user IDs

class PurchaseCreate(BaseModel):
    purchase_name: str
    purchase_date: date
    payer_user_id: int
    project_id: int
    tax_is_added: bool = False
    discount_is_applied: bool = False
    items: List[ItemBase]

@router.put("/{purchase_id}")
async def update_purchase(
    purchase_id: int,
    purchase_in: PurchaseCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_purchase = purchase_repo.get_purchase_by_id(db, purchase_id)
    if not db_purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
        
    # Permission check (Revised: Participants can edit)
    is_authorized = False
    if current_user.administrator:
        is_authorized = True
    elif db_purchase.project_id:
        # Check if user is participant of the project
        project = db_purchase.project
        if project and any(p.user_id == current_user.user_id for p in project.participants):
            is_authorized = True
    elif db_purchase.creator_user_id == current_user.user_id:
        is_authorized = True
        
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Not authorized to edit this purchase")

    # Verify project membership if changing project (though typically not allowed or rare)
    # Verify project membership and participant validity
    project = project_repo.get_project_by_id(db, purchase_in.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    is_participant = any(p.user_id == current_user.user_id for p in project.participants)
    if not is_participant and not current_user.administrator:
        raise HTTPException(status_code=403, detail="Not authorized for this project")

    # Validate Payer and Contributors are participants
    participant_ids = [p.user_id for p in project.participants]
    if purchase_in.payer_user_id not in participant_ids:
        raise HTTPException(status_code=400, detail="Selected payer is not a participant of this project")
    
    for item in purchase_in.items:
        for contributor_id in item.contributors:
            if contributor_id not in participant_ids:
                raise HTTPException(status_code=400, detail=f"Selected contributor (ID: {contributor_id}) is not a participant of this project")

    if purchase_in.project_id != db_purchase.project_id:
        db_purchase.project_id = purchase_in.project_id

    # 1. Update Metadata
    purchase_repo.update_purchase(
        db,
        purchase_id=purchase_id,
        purchase_name=purchase_in.purchase_name,
        purchase_date=purchase_in.purchase_date,
        payer_user_id=purchase_in.payer_user_id,
        tax_is_added=purchase_in.tax_is_added,
        discount_is_applied=purchase_in.discount_is_applied
    )

    # 2. Update Items
    # Simplified approach: Delete old items and add new ones to ensure sync
    # Better approach for production: Diff and update
    # Following Roadmap style for now
    
    # Remove existing items and contributors
    for old_item in db_purchase.items:
        db.query(models.Contributor).filter(models.Contributor.item_id == old_item.item_id).delete()
        db.delete(old_item)
    
    # Add new items
    for item_in in purchase_in.items:
        from services import mapping_service

        # Auto-fill categories if empty (Logic: Check DB)
        if not item_in.category_level_1 and not item_in.category_level_2 and not item_in.category_level_3:
            fname = item_in.friendly_name or item_in.original_name
            if fname:
                cat_map = mapping_service.get_category_mapping(db, fname, current_user.user_id)
                if cat_map:
                    item_in.category_level_1 = cat_map.get("category_level_1")
                    item_in.category_level_2 = cat_map.get("category_level_2")
                    item_in.category_level_3 = cat_map.get("category_level_3")

        db_item = item_repo.add_item_to_purchase(
            db,
            purchase_id=purchase_id,
            original_name=item_in.original_name,
            friendly_name=item_in.friendly_name,
            quantity=item_in.quantity,
            price=item_in.price,
            discount=item_in.discount,
            tax_rate=item_in.tax_rate,
            category_level_1=item_in.category_level_1,
            category_level_2=item_in.category_level_2,
            category_level_3=item_in.category_level_3
        )
        
        # Add contributors
        for user_id in item_in.contributors:
            item_repo.add_contributor_to_item(db, item_id=db_item.item_id, user_id=user_id)
            
        # Section 9.2: Storing Friendly Name Logic
        if item_in.friendly_name:
            mapping_service.set_friendly_name(db, item_in.original_name, item_in.friendly_name, current_user.user_id)
        
        # Update Category Mapping (Learning Logic)
        if item_in.category_level_1 or item_in.category_level_2 or item_in.category_level_3:
            fname = item_in.friendly_name or item_in.original_name
            if fname:
                categories = {
                    "category_level_1": item_in.category_level_1,
                    "category_level_2": item_in.category_level_2,
                    "category_level_3": item_in.category_level_3
                }
                mapping_service.set_category_mapping(db, fname, categories, current_user.user_id)

    # 3. Log Action
    purchase_repo.create_purchase_log(db, purchase_id, current_user.user_id, "Purchase updated")
    
    db.commit()
    return {"status": "success"}

@router.post("")
async def create_purchase(
    purchase_data: str = Form(...),
    files: List[UploadFile] = File([]),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Parse purchase_data from JSON string
    try:
        data_dict = json.loads(purchase_data)
        # Validate using Pydantic model (manually since it's a string)
        purchase_in = PurchaseCreate(**data_dict)
    except Exception as e:
        print(f"DEBUG: Purchase Data Validation Error: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid purchase data: {str(e)}")

    # Verify project access and participant validity
    project = project_repo.get_project_by_id(db, purchase_in.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    is_participant = any(p.user_id == current_user.user_id for p in project.participants)
    if not is_participant and not current_user.administrator:
        raise HTTPException(status_code=403, detail="Not authorized for this project")

    # Validate Payer and Contributors are participants
    participant_ids = [p.user_id for p in project.participants]
    if purchase_in.payer_user_id not in participant_ids:
        raise HTTPException(status_code=400, detail="Selected payer is not a participant of this project")
    
    for item in purchase_in.items:
        for contributor_id in item.contributors:
            if contributor_id not in participant_ids:
                raise HTTPException(status_code=400, detail=f"Selected contributor (ID: {contributor_id}) is not a participant of this project")

    # 1. Create Purchase Metadata
    db_purchase = purchase_repo.create_purchase(
        db,
        creator_user_id=current_user.user_id,
        payer_user_id=purchase_in.payer_user_id,
        purchase_name=purchase_in.purchase_name,
        purchase_date=purchase_in.purchase_date,
        tax_is_added=purchase_in.tax_is_added,
        discount_is_applied=purchase_in.discount_is_applied,
        project_id=purchase_in.project_id
    )

    # 1b. Handle Images
    if files:
        from storage import get_storage
        store = get_storage()
        for file in files:
            try:
                file_name = f"purchase_{db_purchase.purchase_id}_{file.filename}"
                store.upload_fileobj(file.file, file_name)
                purchase_repo.create_receipt_image(db, db_purchase.purchase_id, file_name, file.filename)
            except Exception as e:
                print(f"DEBUG: Failed to save image {file.filename}: {e}")

    # 2. Add Items and Contributors
    for item_in in purchase_in.items:
        from services import mapping_service
        
        # Auto-fill categories if empty (Logic: Check DB)
        if not item_in.category_level_1 and not item_in.category_level_2 and not item_in.category_level_3:
            fname = item_in.friendly_name or item_in.original_name
            if fname:
                cat_map = mapping_service.get_category_mapping(db, fname, current_user.user_id)
                if cat_map:
                    item_in.category_level_1 = cat_map.get("category_level_1")
                    item_in.category_level_2 = cat_map.get("category_level_2")
                    item_in.category_level_3 = cat_map.get("category_level_3")

        db_item = item_repo.add_item_to_purchase(
            db,
            purchase_id=db_purchase.purchase_id,
            original_name=item_in.original_name,
            friendly_name=item_in.friendly_name,
            quantity=item_in.quantity,
            price=item_in.price,
            discount=item_in.discount,
            tax_rate=item_in.tax_rate,
            category_level_1=item_in.category_level_1,
            category_level_2=item_in.category_level_2,
            category_level_3=item_in.category_level_3
        )
        
        # Add contributors
        for user_id in item_in.contributors:
            item_repo.add_contributor_to_item(db, item_id=db_item.item_id, user_id=user_id)
            
        # Section 9.2: Storing Friendly Name Logic
        if item_in.friendly_name:
            mapping_service.set_friendly_name(db, item_in.original_name, item_in.friendly_name, current_user.user_id)

        # Update Category Mapping (Learning Logic)
        if item_in.category_level_1 or item_in.category_level_2 or item_in.category_level_3:
            fname = item_in.friendly_name or item_in.original_name
            if fname:
                categories = {
                    "category_level_1": item_in.category_level_1,
                    "category_level_2": item_in.category_level_2,
                    "category_level_3": item_in.category_level_3
                }
                mapping_service.set_category_mapping(db, fname, categories, current_user.user_id)

    # 3. Log Action
    purchase_repo.create_purchase_log(db, db_purchase.purchase_id, current_user.user_id, "Purchase created")
    
    # Return purchase data with explicit purchase_id using JSONResponse
    response_data = {
        "purchase_id": db_purchase.purchase_id,
        "purchase_name": db_purchase.purchase_name,
        "purchase_date": str(db_purchase.purchase_date),
        "payer_user_id": db_purchase.payer_user_id,
        "creator_user_id": db_purchase.creator_user_id,
        "tax_is_added": db_purchase.tax_is_added,
        "discount_is_applied": db_purchase.discount_is_applied
    }
    print(f"DEBUG: Returning purchase response: {response_data}")
    return JSONResponse(content=response_data)

@router.get("/stats/analytics")
async def get_analytics(
    time_frame: str = "year",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    search: Optional[str] = None,
    item_search: Optional[str] = None,
    cat1: Optional[str] = None,
    cat2: Optional[str] = None,
    cat3: Optional[str] = None,
    project_ids: Optional[List[int]] = Query(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    purchases = purchase_repo.get_analytics_data(
        db, user_id=current_user.user_id,
        time_frame=time_frame,
        start_date=start_date,
        end_date=end_date,
        search=search,
        item_search=item_search,
        cat1=cat1, cat2=cat2, cat3=cat3,
        project_ids=project_ids
    )
    
    # 1. Calculate Summary
    total_spending = 0
    personal_spending = 0
    num_purchases = len(purchases)
    
    # 2. Prepare Chart & Scatter Data
    # Grouped by date
    daily_stats = {} # Total cost per day
    personal_daily_stats = {} # Personal cost per day
    
    # 3. Prepare Sankey Data
    sankey_links = []
    personal_sankey_links = []
    
    for p in purchases:
        p_date = str(p.purchase_date)
        if p_date not in daily_stats:
            daily_stats[p_date] = {"date": p_date, "cost": 0, "purchases": []}
            personal_daily_stats[p_date] = {"date": p_date, "cost": 0, "purchases": []}
        
        p_total = 0
        p_personal = 0
        for item in p.items:
            # Filter items if item_search or categories are provided
            if item_search and item_search.lower() not in item.friendly_name.lower() and item_search.lower() not in item.original_name.lower():
                continue
            if cat1 and item.category_level_1 != cat1: continue
            if cat2 and item.category_level_2 != cat2: continue
            if cat3 and item.category_level_3 != cat3: continue

            item_cost = (float(item.price) * item.quantity) - float(item.discount)
            
            # Personal share calculation
            item_personal = 0
            is_contributor = any(c.user_id == current_user.user_id for c in item.contributors)
            if is_contributor:
                num_contributors = len(item.contributors)
                if num_contributors > 0:
                    item_personal = item_cost / num_contributors

            p_total += item_cost
            p_personal += item_personal
            
            # Sankey logic
            c1 = item.category_level_1 or "Uncategorized"
            c2 = item.category_level_2 or "General"
            c3 = item.category_level_3 or "Misc"
            iname = item.friendly_name or item.original_name
            
            # Level 1 to Level 2
            sankey_links.append({"source": f"L1: {c1}", "target": f"L2: {c2}", "value": item_cost})
            personal_sankey_links.append({"source": f"L1: {c1}", "target": f"L2: {c2}", "value": item_personal})
            # Level 2 to Level 3
            sankey_links.append({"source": f"L2: {c2}", "target": f"L3: {c3}", "value": item_cost})
            personal_sankey_links.append({"source": f"L2: {c2}", "target": f"L3: {c3}", "value": item_personal})
            # Level 3 to Item
            sankey_links.append({"source": f"L3: {c3}", "target": f"Item: {iname}", "value": item_cost})
            personal_sankey_links.append({"source": f"L3: {c3}", "target": f"Item: {iname}", "value": item_personal})

        total_spending += p_total
        personal_spending += p_personal
        
        daily_stats[p_date]["cost"] += p_total
        daily_stats[p_date]["purchases"].append({"name": p.purchase_name, "cost": p_total})
        
        personal_daily_stats[p_date]["cost"] += p_personal
        personal_daily_stats[p_date]["purchases"].append({"name": p.purchase_name, "cost": p_personal})

    # Aggregate Sankey links
    def aggregate_sankey(links):
        aggregated = {}
        for link in links:
            if link["value"] <= 0: continue
            key = (link["source"], link["target"])
            aggregated[key] = aggregated.get(key, 0) + link["value"]
        return [{"source": k[0], "target": k[1], "value": v} for k, v in aggregated.items()]

    final_sankey = aggregate_sankey(sankey_links)
    final_personal_sankey = aggregate_sankey(personal_sankey_links)
    
    chart_data = sorted(daily_stats.values(), key=lambda x: x["date"])
    personal_chart_data = sorted(personal_daily_stats.values(), key=lambda x: x["date"])
    
    avg_cost = total_spending / num_purchases if num_purchases > 0 else 0
    personal_avg_cost = personal_spending / num_purchases if num_purchases > 0 else 0
    
    return {
        "summary": {
            "total_spending": total_spending,
            "personal_spending": personal_spending,
            "num_purchases": num_purchases,
            "avg_cost": avg_cost,
            "personal_avg_cost": personal_avg_cost
        },
        "chart_data": chart_data,
        "personal_chart_data": personal_chart_data,
        "sankey_data": final_sankey,
        "personal_sankey_data": final_personal_sankey
    }

@router.get("/summary")
async def get_summary_stats(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Fetch all purchases for the current month for this user
    from datetime import datetime
    today = datetime.now()
    first_of_month = date(today.year, today.month, 1)
    
    # We use analytics logic to get purchases where the user is involved (creator, payer, or contributor)
    # Global summary, so no project_id
    purchases = purchase_repo.get_analytics_data(
        db, user_id=current_user.user_id,
        time_frame="custom",
        start_date=str(first_of_month)
    )
    
    personal_spending = 0
    for p in purchases:
        for item in p.items:
            # Check if current user is a contributor to this item
            is_contributor = any(c.user_id == current_user.user_id for c in item.contributors)
            if is_contributor:
                # Divide item total cost by number of contributors
                num_contributors = len(item.contributors)
                if num_contributors > 0:
                    personal_spending += ((float(item.price) * item.quantity) - float(item.discount)) / num_contributors

    return {
        "month_total": personal_spending,
        "num_purchases": len(purchases)
    }

@router.get("/recent")
async def get_recent_purchases(
    project_id: Optional[int] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    purchases = purchase_repo.get_recent_purchases(db, user_id=current_user.user_id, project_id=project_id)
    return [
        {
            "purchase_id": p.purchase_id,
            "purchase_name": p.purchase_name,
            "purchase_date": str(p.purchase_date),
            "payer_user_id": p.payer_user_id,
            "payer_name": p.payer.name if p.payer else "Deleted account",
            "creator_user_id": p.creator_user_id,
            "tax_is_added": p.tax_is_added,
            "discount_is_applied": p.discount_is_applied,
            "project_id": p.project_id,
            "items": [
                {
                    "item_id": item.item_id,
                    "original_name": item.original_name,
                    "friendly_name": item.friendly_name,
                    "quantity": item.quantity,
                    "price": float(item.price),
                    "discount": float(item.discount),
                    "tax_rate": float(item.tax_rate),
                    "category_level_1": item.category_level_1,
                    "category_level_2": item.category_level_2,
                    "category_level_3": item.category_level_3
                }
                for item in p.items
            ]
        }
        for p in purchases
    ]

@router.get("/{purchase_id}")
async def get_purchase(
    purchase_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    purchase = purchase_repo.get_purchase_by_id(db, purchase_id)
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
        
    # Check permissions (Section 7)
    is_contributor = any(
        any(c.user_id == current_user.user_id for c in item.contributors)
        for item in purchase.items
    )
    if not current_user.administrator and \
       purchase.creator_user_id != current_user.user_id and \
       purchase.payer_user_id != current_user.user_id and \
       not is_contributor:
        raise HTTPException(status_code=403, detail="Not authorized to view this purchase")
    
    # Identify involved users (payer, creator, contributors)
    involved_user_ids = {purchase.payer_user_id, purchase.creator_user_id}
    for item in purchase.items:
        for c in item.contributors:
            involved_user_ids.add(c.user_id)
    
    users = db.query(models.User).filter(models.User.user_id.in_(involved_user_ids)).all()
    involved_users = [{"user_id": u.user_id, "name": u.name, "is_dummy": u.is_dummy} for u in users]

    # Serialize purchase with properly formatted images
    from storage import get_storage
    storage_interface = get_storage()
    
    return {
        "purchase_id": purchase.purchase_id,
        "purchase_name": purchase.purchase_name,
        "purchase_date": str(purchase.purchase_date),
        "payer_user_id": purchase.payer_user_id,
        "creator_user_id": purchase.creator_user_id,
        "involved_users": involved_users,
        "tax_is_added": purchase.tax_is_added,
        "discount_is_applied": purchase.discount_is_applied,
        "project_id": purchase.project_id,
        "images": [
            {
                "url": storage_interface.get_file_url(img.file_path),
                "file_path": img.file_path,
                "original_filename": img.original_filename
            }
            for img in purchase.images
        ],
        "items": [
            {
                "item_id": item.item_id,
                "original_name": item.original_name,
                "friendly_name": item.friendly_name,
                "quantity": item.quantity,
                "price": float(item.price),
                "discount": float(item.discount),
                "tax_rate": float(item.tax_rate),
                "category_level_1": item.category_level_1,
                "category_level_2": item.category_level_2,
                "category_level_3": item.category_level_3,
                "contributors": [c.user_id for c in item.contributors]
            }
            for item in purchase.items
        ]
    }

@router.delete("/{purchase_id}")
async def delete_purchase(
    purchase_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    purchase = purchase_repo.get_purchase_by_id(db, purchase_id)
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
        
    # Permission check for deletion (Revised: Participants can delete)
    is_authorized = False
    if current_user.administrator:
        is_authorized = True
    elif purchase.project_id:
        project = purchase.project
        if project and any(p.user_id == current_user.user_id for p in project.participants):
            is_authorized = True
    elif purchase.creator_user_id == current_user.user_id:
        is_authorized = True
        
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Not authorized to delete this purchase")
        
    purchase_repo.delete_purchase(db, purchase_id)
    return {"status": "success"}

@router.post("/{purchase_id}/logs")
async def create_log(
    purchase_id: int,
    data: dict,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return purchase_repo.create_purchase_log(db, purchase_id, current_user.user_id, data.get("message", "Action logged"))

@router.get("/{purchase_id}/logs")
async def get_logs(
    purchase_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return purchase_repo.get_logs_for_purchase(db, purchase_id)

@router.get("")
async def list_purchases(
    search: Optional[str] = None,
    sort_by: str = "date_desc",
    project_id: Optional[int] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    purchases = purchase_repo.get_purchases_for_user(
        db, user_id=current_user.user_id, search=search, sort_by=sort_by, project_id=project_id
    )
    return [
        {
            "purchase_id": p.purchase_id,
            "purchase_name": p.purchase_name,
            "purchase_date": str(p.purchase_date),
            "payer_user_id": p.payer_user_id,
            "payer_name": p.payer.name if p.payer else "Deleted account",
            "creator_user_id": p.creator_user_id,
            "tax_is_added": p.tax_is_added,
            "discount_is_applied": p.discount_is_applied,
            "project_id": p.project_id,
            "items": [
                {
                    "item_id": item.item_id,
                    "original_name": item.original_name,
                    "friendly_name": item.friendly_name,
                    "quantity": item.quantity,
                    "price": float(item.price),
                    "discount": float(item.discount),
                    "tax_rate": float(item.tax_rate),
                    "category_level_1": item.category_level_1,
                    "category_level_2": item.category_level_2,
                    "category_level_3": item.category_level_3
                }
                for item in p.items
            ]
        }
        for p in purchases
    ]

@router.get("/admin/all")
async def list_all_purchases_admin(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not current_user.administrator:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get ALL purchases from DB
    purchases = db.query(models.Purchase).order_by(models.Purchase.purchase_date.desc()).all()
    
    return [
        {
            "purchase_id": p.purchase_id,
            "purchase_name": p.purchase_name,
            "purchase_date": str(p.purchase_date),
            "payer_user_id": p.payer_user_id,
            "payer_name": p.payer.name if p.payer else "Deleted account",
            "creator_user_id": p.creator_user_id,
            "tax_is_added": p.tax_is_added,
            "discount_is_applied": p.discount_is_applied,
            "project_id": p.project_id,
            "items": [
                {
                    "item_id": item.item_id,
                    "original_name": item.original_name,
                    "friendly_name": item.friendly_name,
                    "quantity": item.quantity,
                    "price": float(item.price),
                    "discount": float(item.discount),
                    "tax_rate": float(item.tax_rate),
                    "category_level_1": item.category_level_1,
                    "category_level_2": item.category_level_2,
                    "category_level_3": item.category_level_3
                }
                for item in p.items
            ]
        }
        for p in purchases
    ]
