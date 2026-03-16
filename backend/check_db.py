import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_db():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.tripsphere
    destinations = db.destinations

    count = await destinations.count_documents({})
    print(f"Total destinations in DB: {count}")
    
    docs = await destinations.find({}, {"name": 1, "_id": 0}).to_list(length=100)
    for d in docs:
        print(d)

    client.close()

if __name__ == "__main__":
    asyncio.run(check_db())
