import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.tripsphere
    users = await db.users.find({}, {"password": 0}).to_list(length=100)
    with open("users.json", "w", encoding="utf-8") as f:
        import json
        from bson import json_util
        json.dump(users, f, default=json_util.default, indent=2)
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
