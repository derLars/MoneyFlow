from backend.database import engine
from backend.db_base import Base
from backend import models

print("Creating all tables in database...")
Base.metadata.create_all(bind=engine)
print("Tables created successfully!")
