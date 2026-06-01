import json
import os
from motor.motor_asyncio import AsyncIOMotorClient
from odmantic import AIOEngine
from pymongo import TEXT
from dotenv import load_dotenv

load_dotenv()

# Configuration
MONGODB_URL = os.getenv("MONGODB_URL") or os.getenv("MONGO_URI") or "mongodb://localhost:27017"
DATABASE_NAME = os.getenv("DB_NAME", "tripsphere")

class Database:
    client: AsyncIOMotorClient = None
    db = None
    engine: AIOEngine = None

db_instance = Database()

async def init_db():
    """Initialize database connection and ODM engine"""
    if db_instance.client is not None:
        return db_instance.db

    print(f"Connecting to MongoDB at {MONGODB_URL}...")
    try:
        # Set a 5-second timeout for server selection
        db_instance.client = AsyncIOMotorClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
        db_instance.db = db_instance.client[DATABASE_NAME]
        db_instance.engine = AIOEngine(client=db_instance.client, database=DATABASE_NAME)
        
        # Verify connection
        await db_instance.client.admin.command('ping')
        print(f"Successfully connected to MongoDB database: {DATABASE_NAME}")
        
        # Create indexes
        await create_indexes()
        
        # Seed data
        await seed_data()
        
        return db_instance.db
    except Exception as e:
        print(f"CRITICAL: MongoDB connection error: {e}")
        return None

async def create_indexes():
    """Create necessary database indexes"""
    try:
        destinations = db_instance.db.destinations
        
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
        
        print("Database indexes created successfully")
    except Exception as e:
        print(f"Error creating indexes: {e}")

async def seed_data():
    """Seed initial data if collection is empty"""
    try:
        destinations_col = db_instance.db.destinations
        count = await destinations_col.count_documents({})
        
        if count == 0:
            print("Seeding initial destinations data...")
            # Look for destinations.json in backend/data/
            json_path = os.path.join(os.path.dirname(__file__), "data", "destinations.json")
            if os.path.exists(json_path):
                with open(json_path, "r", encoding='utf-8') as f:
                    data = json.load(f)
                    # Prepare data for MongoDB
                    for item in data:
                        if "id" in item:
                            # Store original ID if needed, but let MongoDB handle _id
                            item["original_id"] = item.pop("id")
                    if data:
                        await destinations_col.insert_many(data)
                        print(f"Seeded {len(data)} destinations")
            else:
                print(f"Warning: destinations.json not found at {json_path}")
    except Exception as e:
        print(f"Error seeding data: {e}")

def get_db():
    """Get raw motor database instance"""
    if db_instance.db is None:
        raise Exception("Database not initialized. Call await init_db() first.")
    return db_instance.db

def get_engine():
    """Get ODMantic engine instance"""
    if db_instance.engine is None:
        raise Exception("Engine not initialized. Call await init_db() first.")
    return db_instance.engine

def get_collection(collection_name: str):
    """Get a specific collection"""
    if db_instance.db is None:
        raise Exception("Database not initialized. Call await init_db() first.")
    return db_instance.db[collection_name]

async def close_db():
    """Close database connection"""
    if db_instance.client:
        db_instance.client.close()
        print("MongoDB connection closed")
