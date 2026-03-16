import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

updates = {
    "Kodaikanal": "https://images.unsplash.com/photo-1593457904321-dfa4fa27bf31?q=80&w=1080&auto=format&fit=crop",
    "Ooty": "https://images.unsplash.com/photo-1571216332002-282dce467b32?q=80&w=1080&auto=format&fit=crop",
    "Meenakshi": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=1080&auto=format&fit=crop",
    "Marina": "https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=1080&auto=format&fit=crop",
    "Rameswaram": "https://images.unsplash.com/photo-1596710699500-22ebc8167fe4?q=80&w=1080&auto=format&fit=crop",
    "Yercaud": "https://images.unsplash.com/photo-1623945958807-6bb4556a3eab?q=80&w=1080&auto=format&fit=crop",
    "Hogenakkal": "https://images.unsplash.com/photo-1592927946945-c98511f87bcc?q=80&w=1080&auto=format&fit=crop"
}

async def update_db():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.tripsphere
    destinations = db.destinations

    for key, url in updates.items():
        result = await destinations.update_many(
            {"name": {"$regex": key, "$options": "i"}},
            {"$set": {"image": url}}
        )
        print(f"Updated {key}: {result.modified_count} documents")

    client.close()

if __name__ == "__main__":
    asyncio.run(update_db())
