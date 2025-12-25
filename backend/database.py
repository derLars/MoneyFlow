import os
import yaml
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Load configuration
def load_config():
    config_path = os.path.join(os.path.dirname(__file__), "..", "config.yaml")
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

config = load_config()
db_config = config.get("database", {})

if db_config.get("type") == "postgresql":
    SQLALCHEMY_DATABASE_URL = db_config.get("url")
else:
    # Default to SQLite
    sqlite_path = db_config.get("path", "./database.db")
    # Ensure directory exists for sqlite path
    os.makedirs(os.path.dirname(sqlite_path), exist_ok=True)
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{sqlite_path}"

# For SQLite, we need to allow multithreaded access
connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
