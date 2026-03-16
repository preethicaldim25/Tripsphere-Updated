import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    dbs = await client.list_database_names()
    print("Databases:", dbs)
    for db_name in dbs:
        db = client[db_name]
        colls = await db.list_collection_names()
        print(f"[{db_name}] Collections: {colls}")
        for c in colls:
            count = await db[c].count_documents({})
            if count > 0:
                print(f"  - {c}: {count} records")

    client.close()

if __name__ == "__main__":
    asyncio.run(check())
