import yaml
import os
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, purchases, ocr, payments

# Load configuration
def load_config():
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

app.include_router(auth.router)
app.include_router(purchases.router)
app.include_router(ocr.router)
app.include_router(payments.router)

@app.get("/")
async def health_check():
    return {"status": "ok", "message": "Moneyflow API is running on port 8002"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
