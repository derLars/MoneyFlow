import yaml
import os
from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers import auth as auth_router, purchases, ocr, payments, categories, mapping # RENAMED to avoid conflict
import storage
import database, models, auth # FIXED missing import
from sqlalchemy.orm import Session

# Load environment variables
load_dotenv()

# Load configuration
def load_config():
    # If running in Docker, config.yaml is in /app (same as main.py)
    # If running locally from root, it's in ..
    config_path = "config.yaml"
    if not os.path.exists(config_path):
        config_path = os.path.join(os.path.dirname(__file__), "..", "config.yaml")
        
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

config = load_config()

app = FastAPI(title="Moneyflow API")

# Configure CORS - Use a middleware function for more control if needed,
# but CORSMiddleware is usually sufficient if configured correctly.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Manual OPTIONS handler as a fallback for some browsers
@app.options("/{rest_of_path:path}")
async def preflight_handler(request: Request, rest_of_path: str):
    response = Response()
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

app.include_router(auth_router.router, prefix="/api")
app.include_router(purchases.router, prefix="/api")
app.include_router(ocr.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(mapping.router, prefix="/api")

@app.get("/api/purchases/users/all")
async def get_all_users_for_purchases(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    from repositories import user_repo
    return user_repo.get_all_users(db)

# Mount static files directory for receipt images
# This needs to be done after routers, but before the catch-all for OPTIONS if that exists
image_storage = storage.get_storage()
app.mount("/api/purchases/images", StaticFiles(directory=image_storage.base_path), name="purchase_images")

@app.get("/")
async def health_check():
    return {"status": "ok", "message": "Moneyflow API is running on port 8002"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
