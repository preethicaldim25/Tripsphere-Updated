import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['tripsphere']
    collection = db.destinations
    docs = await collection.find({}).to_list(None)
    for d in docs:
        print(f"{d.get('name')}: {d.get('image')}")
    client.close()

if __name__ == '__main__':
    asyncio.run(check())
