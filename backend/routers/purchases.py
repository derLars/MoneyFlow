from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Any
import json
import os
from pydantic import BaseModel, field_validator
from datetime import date
from .. import database, auth, models, storage
from ..repositories import purchase_repo, item_repo, user_repo
from ..services import mapping_service

router = APIRouter(prefix="/purchases", tags=["purchases"])

# Pydantic schemas for request/response
class ItemBase(BaseModel):
    friendly_name: str
    original_name: Optional[str] = ""
    quantity: int = 1
    price: float
    discount: float = 0.0
    tax_rate: float = 0.0
    category_level_1: Optional[str] = ""
    category_level_2: Optional[str] = ""
    category_level_3: Optional[str] = ""
    contributors: List[int] = []

class PurchaseCreate(BaseModel):
    purchase_name: str
    purchase_date: date
    payer_user_id: int
    tax_is_added: bool = False
    discount_is_applied: bool = False
    items: List[ItemBase]

class ItemResponse(BaseModel):
    item_id: int
    purchase_id: int
    friendly_name: Optional[str] = None
    original_name: Optional[str] = ""
    quantity: int
    price: float
    discount: float = 0.0
    tax_rate: float = 0.0
    category_level_1: Optional[str] = ""
    category_level_2: Optional[str] = ""
    category_level_3: Optional[str] = ""
    contributors: List[int] = []

    @field_validator("contributors", mode="before")
    @classmethod
    def transform_contributors(cls, v: Any) -> List[int]:
        if isinstance(v, list) and len(v) > 0 and not isinstance(v[0], int):
            return [c.user_id for c in v]
        return v

    class Config:
        from_attributes = True

class ReceiptImageResponse(BaseModel):
    image_id: int
    file_path: str
    original_filename: Optional[str] = None
    url: Optional[str] = None

    @field_validator("url", mode="before")
    @classmethod
    def generate_url(cls, v: Any, info: Any) -> str:
        # This validator is a bit tricky for 'url' since it's not in the DB
        # We'll populate it in the route
        return v

    class Config:
        from_attributes = True

class PurchaseResponse(BaseModel):
    purchase_id: int
    purchase_name: str
    purchase_date: date
    creator_user_id: int
    payer_user_id: int
    tax_is_added: bool
    discount_is_applied: bool
    items: List[ItemResponse]
    images: List[ReceiptImageResponse] = []
    class Config:
        from_attributes = True

@router.post("/", response_model=PurchaseResponse)
async def create_purchase(
    purchase_data: str = Form(...),
    files: List[UploadFile] = File(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    print(f"DEBUG: Received purchase_data: {purchase_data}")
    try:
        data_dict = json.loads(purchase_data)
        purchase_in = PurchaseCreate(**data_dict)
    except Exception as e:
        print(f"DEBUG: JSON Parsing Error: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid purchase data format: {str(e)}")

    try:
        # 1. Create the purchase record
        db_purchase = purchase_repo.create_purchase(
            db,
            creator_user_id=current_user.user_id,
            payer_user_id=purchase_in.payer_user_id,
            purchase_name=purchase_in.purchase_name,
            purchase_date=purchase_in.purchase_date,
            tax_is_added=purchase_in.tax_is_added,
            discount_is_applied=purchase_in.discount_is_applied
        )

        # 2. Handle files
        if files:
            print(f"DEBUG: Handling {len(files)} uploaded files")
            store = storage.get_storage()
            import uuid
            for file in files:
                if not file.filename:
                    continue
                ext = os.path.splitext(file.filename)[1]
                unique_filename = f"{uuid.uuid4()}{ext}"
                store.upload_fileobj(file.file, unique_filename)
                purchase_repo.create_receipt_image(
                    db, 
                    purchase_id=db_purchase.purchase_id,
                    file_path=unique_filename,
                original_filename=file.filename
            )
            print(f"DEBUG: Created ReceiptImage record for {unique_filename}")

        # 3. Add items to the purchase
        print(f"DEBUG: Starting to add {len(purchase_in.items)} items to purchase {db_purchase.purchase_id}")
        for item_in in purchase_in.items:
            db_item = item_repo.add_item_to_purchase(
                db,
                purchase_id=db_purchase.purchase_id,
                original_name=item_in.original_name or item_in.friendly_name,
                friendly_name=item_in.friendly_name,
                quantity=item_in.quantity,
                price=item_in.price,
                discount=item_in.discount,
                tax_rate=item_in.tax_rate,
                category_level_1=item_in.category_level_1,
                category_level_2=item_in.category_level_2,
                category_level_3=item_in.category_level_3
            )
            print(f"DEBUG: Added item {db_item.item_id} ({db_item.friendly_name}) to purchase")

        # Assign contributors
        for user_id in item_in.contributors:
            item_repo.add_contributor_to_item(db, item_id=db_item.item_id, user_id=user_id)

        # Update Friendly Name Mapping logic (Section 6.11)
        if item_in.friendly_name:
            mapping_service.set_friendly_name(
                db, 
                original_name=item_in.original_name or item_in.friendly_name,
                friendly_name=item_in.friendly_name,
                user_id=current_user.user_id
            )
            print(f"DEBUG: Updated friendly name mapping for {item_in.friendly_name}")
            
    except Exception as e:
        print(f"DEBUG: Database Error during creation or item/mapping processing: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create purchase: {str(e)}")

    print(f"DEBUG: Refreshing purchase {db_purchase.purchase_id} to load relationships")
    # Refresh to get items, contributors and images
    db.refresh(db_purchase)
    
    print(f"DEBUG: Populating URLs for {len(db_purchase.images)} images")
    
    # Populate URLs
    store = storage.get_storage()
    for img in db_purchase.images:
        img.url = store.get_file_url(img.file_path)
        
    return db_purchase


@router.put("/{purchase_id}", response_model=PurchaseResponse)
async def update_purchase(
    purchase_id: int,
    purchase_in: PurchaseCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # 1. Verify existence and permissions
    db_purchase = purchase_repo.get_purchase_by_id(db, purchase_id)
    if not db_purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    
    is_authorized = (
        current_user.administrator or
        db_purchase.creator_user_id == current_user.user_id
    )
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Not authorized to update this purchase")

    # 2. Extract existing state for diff-logging
    # Create a complete snapshot of old items BEFORE any deletion to avoid lazy-load issues
    old_items_snapshot = []
    for item in db_purchase.items:
        old_items_snapshot.append({
            "friendly_name": item.friendly_name,
            "original_name": item.original_name,
            "price": float(item.price),
            "quantity": item.quantity,
            "category_level_1": item.category_level_1,
            "category_level_2": item.category_level_2,
            "category_level_3": item.category_level_3,
            "contributors": sorted([int(c.user_id) for c in item.contributors])
        })

    # 3. Update metadata
    purchase_repo.update_purchase(
        db,
        purchase_id=purchase_id,
        purchase_name=purchase_in.purchase_name,
        purchase_date=purchase_in.purchase_date,
        payer_user_id=purchase_in.payer_user_id,
        tax_is_added=purchase_in.tax_is_added,
        discount_is_applied=purchase_in.discount_is_applied
    )

    # 4. Handle Items: Delete existing items and recreate
    # We MUST clear the relationship first to avoid constraint issues during deletion
    for item in db_purchase.items:
        db.query(models.Contributor).filter(models.Contributor.item_id == item.item_id).delete()
        db.delete(item)
    
    db.commit()

    # 5. Re-add items and generate detailed logs
    for idx, item_in in enumerate(purchase_in.items):
        # Match by index using our pure Python snapshot
        old_snapshot = old_items_snapshot[idx] if idx < len(old_items_snapshot) else None
        
        if old_snapshot:
            item_name_for_log = old_snapshot["friendly_name"] or old_snapshot["original_name"]
            
            # 1. Categories
            if old_snapshot["category_level_1"] != item_in.category_level_1:
                purchase_repo.create_purchase_log(db, purchase_id, current_user.user_id, f"Category 1 for item {item_name_for_log} was changed from {old_snapshot['category_level_1'] or 'None'} to {item_in.category_level_1 or 'None'}")
            if old_snapshot["category_level_2"] != item_in.category_level_2:
                purchase_repo.create_purchase_log(db, purchase_id, current_user.user_id, f"Category 2 for item {item_name_for_log} was changed from {old_snapshot['category_level_2'] or 'None'} to {item_in.category_level_2 or 'None'}")
            if old_snapshot["category_level_3"] != item_in.category_level_3:
                purchase_repo.create_purchase_log(db, purchase_id, current_user.user_id, f"Category 3 for item {item_name_for_log} was changed from {old_snapshot['category_level_3'] or 'None'} to {item_in.category_level_3 or 'None'}")
            
            # 2. Quantity
            if old_snapshot["quantity"] != item_in.quantity:
                purchase_repo.create_purchase_log(db, purchase_id, current_user.user_id, f"Quantity for item {item_name_for_log} was changed from {old_snapshot['quantity']} to {item_in.quantity}")

            # 3. Price
            if old_snapshot["price"] != float(item_in.price):
                purchase_repo.create_purchase_log(db, purchase_id, current_user.user_id, f"Price for item {item_name_for_log} was changed from {old_snapshot['price']} to {item_in.price}")
            
            # 4. Contributors - Now comparing pure integer lists
            new_contributors = sorted([int(c) for c in item_in.contributors])
            
            if old_snapshot["contributors"] != new_contributors:
                purchase_repo.create_purchase_log(db, purchase_id, current_user.user_id, f"Contributors for item {item_name_for_log} were updated")
            
            # 4. Name
            if old_snapshot["friendly_name"] != item_in.friendly_name:
                purchase_repo.create_purchase_log(db, purchase_id, current_user.user_id, f"Item name {old_snapshot['friendly_name'] or old_snapshot['original_name']} was renamed to {item_in.friendly_name}")
        db_item = item_repo.add_item_to_purchase(
            db,
            purchase_id=purchase_id,
            original_name=item_in.original_name or item_in.friendly_name,
            friendly_name=item_in.friendly_name,
            quantity=item_in.quantity,
            price=item_in.price,
            discount=item_in.discount,
            tax_rate=item_in.tax_rate,
            category_level_1=item_in.category_level_1,
            category_level_2=item_in.category_level_2,
            category_level_3=item_in.category_level_3
        )
        for user_id in item_in.contributors:
            item_repo.add_contributor_to_item(db, item_id=db_item.item_id, user_id=user_id)
        
        # Update Mapping logic
        if item_in.friendly_name:
            mapping_service.set_friendly_name(
                db, 
                original_name=item_in.original_name or item_in.friendly_name,
                friendly_name=item_in.friendly_name,
                user_id=current_user.user_id
            )

    db.refresh(db_purchase)
    return db_purchase

@router.get("/recent", response_model=List[PurchaseResponse])
async def get_recent_purchases(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    purchases = purchase_repo.get_recent_purchases(db, user_id=current_user.user_id)
    
    # Populate URLs for images in each purchase
    store = storage.get_storage()
    for purchase in purchases:
        for img in purchase.images:
            img.url = store.get_file_url(img.file_path)
    
    return purchases

@router.delete("/{purchase_id}")
async def delete_purchase(
    purchase_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_purchase = purchase_repo.get_purchase_by_id(db, purchase_id)
    if not db_purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    
    # Permission check (Section 7)
    is_authorized = (
        current_user.administrator or
        db_purchase.creator_user_id == current_user.user_id
    )
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Not authorized to delete this purchase")
    
    purchase_repo.delete_purchase(db, purchase_id)
    return {"status": "success"}

class LogCreate(BaseModel):
    message: str

@router.get("/{purchase_id}/logs", response_model=List[dict])
async def get_purchase_logs(
    purchase_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_purchase = purchase_repo.get_purchase_by_id(db, purchase_id)
    if not db_purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    
    # Simple check: anyone who can view can see logs
    logs = purchase_repo.get_logs_for_purchase(db, purchase_id)
    return [{"id": l.log_id, "user_id": l.user_id, "message": l.log_message, "timestamp": l.timestamp} for l in logs]

@router.post("/{purchase_id}/logs")
async def add_purchase_log(
    purchase_id: int,
    log_in: LogCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    purchase_repo.create_purchase_log(db, purchase_id=purchase_id, user_id=current_user.user_id, message=log_in.message)
    return {"status": "success"}

@router.get("/{purchase_id}", response_model=PurchaseResponse)
async def get_purchase(
    purchase_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_purchase = purchase_repo.get_purchase_by_id(db, purchase_id=purchase_id)
    if not db_purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    
    # Permission check (Section 7)
    is_authorized = (
        current_user.administrator or
        db_purchase.creator_user_id == current_user.user_id or
        db_purchase.payer_user_id == current_user.user_id or
        any(
            any(c.user_id == current_user.user_id for c in item.contributors)
            for item in db_purchase.items
        )
    )
    
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Not authorized to view this purchase")
    
    # Populate URLs for images
    store = storage.get_storage()
    for img in db_purchase.images:
        img.url = store.get_file_url(img.file_path)
        
    return db_purchase

@router.get("/users/all")
async def get_all_users(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    users = user_repo.get_all_users(db)
    return [{"user_id": u.user_id, "name": u.name} for u in users]

@router.get("/", response_model=List[PurchaseResponse])
async def list_purchases(
    search: Optional[str] = None,
    sort_by: str = "date_desc",
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    purchases = purchase_repo.get_purchases_for_user(
        db, 
        user_id=current_user.user_id, 
        search=search, 
        sort_by=sort_by
    )
    
    # Populate URLs for images in each purchase
    store = storage.get_storage()
    for purchase in purchases:
        for img in purchase.images:
            img.url = store.get_file_url(img.file_path)
    
    return purchases

@router.get("/stats/analytics")
async def get_stats(
    time_frame: str = "year",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    search: Optional[str] = None,
    item_search: Optional[str] = None,
    cat1: Optional[str] = None,
    cat2: Optional[str] = None,
    cat3: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    purchases = purchase_repo.get_analytics_data(
        db, 
        user_id=current_user.user_id,
        time_frame=time_frame,
        start_date=start_date,
        end_date=end_date,
        search=search,
        item_search=item_search,
        cat1=cat1,
        cat2=cat2,
        cat3=cat3
    )

    total_spending = 0
    num_purchases = len(purchases)
    
    chart_data_map = {} # Aggregate by date
    scatter_data = [] # Individual points
    
    for p in purchases:
        # Calculate cost for this specific purchase based on user's contribution
        p_filtered_cost = 0
        for item in p.items:
            # Check if user is a contributor
            is_contributor = any(c.user_id == current_user.user_id for c in item.contributors)
            if not is_contributor:
                continue

            # If item_search is active, only count matching items
            match_item = True
            if item_search:
                term = item_search.lower()
                match_item = (term in (item.friendly_name or "").lower()) or (term in (item.original_name or "").lower())
            
            if match_item:
                # Distribution is always equal (Section 10.1)
                share = (item.price * item.quantity) / max(len(item.contributors), 1)
                p_filtered_cost += share

        total_spending += p_filtered_cost
        
        # Aggregate for Area chart
        date_str = str(p.purchase_date)
        if date_str not in chart_data_map:
            chart_data_map[date_str] = {"date": date_str, "cost": 0, "purchases": []}
        chart_data_map[date_str]["cost"] += p_filtered_cost
        chart_data_map[date_str]["purchases"].append({
            "name": p.purchase_name,
            "cost": round(p_filtered_cost, 2)
        })

        # Individual points for Scatter plot
        if p_filtered_cost > 0:
            scatter_data.append({
                "date": p.purchase_date,
                "cost": round(p_filtered_cost, 2),
                "name": p.purchase_name,
                "id": p.purchase_id
            })
    
    # Sort chart data by date
    chart_data = sorted(chart_data_map.values(), key=lambda x: x["date"])
    
    avg_cost = total_spending / num_purchases if num_purchases > 0 else 0

    # Build Sankey data (Section 15.3)
    sankey_links = []
    # Using a dict to aggregate links between nodes
    # Keys: (source, target), Value: cost
    links_agg = {}

    for p in purchases:
        for item in p.items:
            # Check if user is a contributor
            is_contributor = any(c.user_id == current_user.user_id for c in item.contributors)
            if not is_contributor:
                continue
            
            # If item_search is active, only count matching items
            match_item = True
            if item_search:
                term = item_search.lower()
                match_item = (term in (item.friendly_name or "").lower()) or (term in (item.original_name or "").lower())
            
            if not match_item:
                continue

            share = (item.price * item.quantity) / max(len(item.contributors), 1)
            
            c1 = item.category_level_1 or "Uncategorized"
            c2 = item.category_level_2 or "General"
            c3 = item.category_level_3 or "Other"
            friendly = item.friendly_name or item.original_name or "Unknown Item"

            # Create hierarchical path to ensure uniqueness if needed, 
            # but usually Sankey just needs source/target.
            # We prefix levels to keep nodes distinct.
            l1 = f"L1: {c1}"
            l2 = f"L2: {c2}"
            l3 = f"L3: {c3}"
            l4 = f"Item: {friendly}"

            path = [(l1, l2), (l2, l3), (l3, l4)]
            for source, target in path:
                if (source, target) not in links_agg:
                    links_agg[(source, target)] = 0
                links_agg[(source, target)] += share

    # Convert aggregated links to list format
    for (source, target), value in links_agg.items():
        sankey_links.append({
            "source": source,
            "target": target,
            "value": round(value, 2)
        })

    return {
        "summary": {
            "total_spending": round(total_spending, 2),
            "num_purchases": num_purchases,
            "avg_cost": round(avg_cost, 2)
        },
        "chart_data": chart_data,
        "scatter_data": scatter_data,
        "sankey_data": sankey_links
    }
