import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

import os
from dotenv import load_dotenv

load_dotenv()

async def check_db():
    uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(uri)
    db = client.tripsphere
    destinations = db.destinations

    count = await destinations.count_documents({})
    print(f"Total destinations in DB: {count}")
    
    async for doc in destinations.find({}):
        print(f"ID: {doc['_id']} | Name: {doc['name']}")

    client.close()

if __name__ == "__main__":
    asyncio.run(check_db())
