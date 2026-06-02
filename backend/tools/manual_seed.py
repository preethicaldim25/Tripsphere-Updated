import asyncio
import json
import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "tripsphere"

async def seed():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    destinations_col = db.destinations
    
    # Clear current collection to update with new fields
    print("Clearing collection...")
    await destinations_col.delete_many({})
    
    json_path = os.path.join(os.path.dirname(__file__), "data", "destinations.json")
    print(f"Loading from: {json_path}")
    if os.path.exists(json_path):
        with open(json_path, "r") as f:
            data = json.load(f)
            for item in data:
                if "id" in item:
                    item["_id_temp"] = item.pop("id")
            await destinations_col.insert_many(data)
        print(f"Seeded {len(data)} documents")
    else:
        print("File not found")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
