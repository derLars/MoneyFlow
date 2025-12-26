from backend.database import SessionLocal, engine
from backend.db_base import Base

def test_db_connection():
    try:
        # Create a session
        db = SessionLocal()
        print("Successfully created a SessionLocal")
        
        # Optionally create tables (though Base is empty now)
        Base.metadata.create_all(bind=engine)
        print("Successfully called create_all (verified engine works)")
        
        db.close()
        print("Successfully closed session")
        return True
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return False

if __name__ == "__main__":
    if test_db_connection():
        print("Database V&V Passed!")
    else:
        print("Database V&V Failed!")
        exit(1)
