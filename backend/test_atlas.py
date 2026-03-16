import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def check():
    uri = os.getenv("MONGO_URI")
    print(f"Connecting to: {uri}")
    client = AsyncIOMotorClient(uri)
    db = client.tripsphere
    users = await db.users.count_documents({})
    print(f"Total atlas users: {users}")
    
    docs = await db.users.find({}, {"password": 0}).to_list(length=100)
    for d in docs:
        print(d)
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
