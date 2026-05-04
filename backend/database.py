import json
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, TEXT
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DATABASE_NAME = "tripsphere"

class Database:
    client: AsyncIOMotorClient = None
    db = None

db = Database()

async def connect_to_mongo():
    """Create database connection"""
    print("Connecting to MongoDB...")
    try:
        db.client = AsyncIOMotorClient(MONGODB_URL)
        db.db = db.client[DATABASE_NAME]
        print("Connected to MongoDB")
        return db.db
    except Exception as e:
        print(f"MongoDB connection error: {e}")
        return None

async def close_mongo_connection():
    """Close database connection"""
    print("Closing MongoDB connection...")
    if db.client:
        db.client.close()
        print("MongoDB connection closed")

async def seed_data():
    """Seed initial data if collection is empty"""
    if db.db is None:
        return
    
    destinations_col = db.db.destinations
    count = await destinations_col.count_documents({})
    
    if count == 0:
        print("Seeding initial destinations data...")
        try:
            # Look for destinations.json in backend/data/
            json_path = os.path.join(os.path.dirname(__file__), "data", "destinations.json")
            if os.path.exists(json_path):
                with open(json_path, "r") as f:
                    data = json.load(f)
                    # Remove 'id' field if it exists, MongoDB uses _id
                    for item in data:
                        if "id" in item:
                            item["_id_temp"] = item.pop("id")
                    await destinations_col.insert_many(data)
                print(f"Seeded {len(data)} destinations")
            else:
                print(f"destinations.json not found at {json_path}")
        except Exception as e:
            print(f"Error seeding data: {e}")

async def init_db():
    """Initialize database with indexes and seed data"""
    await connect_to_mongo()
    
    if db.db is None:
        print("Failed to connect to MongoDB")
        return
    
    # Create indexes
    try:
        destinations = db.db.destinations
        
        # Text search index
        await destinations.create_index([
            ("name", TEXT),
            ("description", TEXT),
            ("location", TEXT),
            ("district", TEXT)
        ])
        
        # Regular indexes for filtering
        await destinations.create_index("category")
        await destinations.create_index("district")
        await destinations.create_index("is_featured")
        await destinations.create_index("rating")
        
        print("Database indexes created")
        
        # Seed data
        await seed_data()
        
    except Exception as e:
        print(f"Error initializing database: {e}")

# Function to get database instance
def get_db():
    """Get database instance"""
    if db.db is None:
        raise Exception("Database not initialized. Call init_db() first.")
    return db.db

# Function to get a specific collection
def get_collection(collection_name: str):
    """Get a specific collection"""
    if db.db is None:
        raise Exception("Database not initialized. Call init_db() first.")
    return db.db[collection_name]