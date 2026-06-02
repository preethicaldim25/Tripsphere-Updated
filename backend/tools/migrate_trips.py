import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DATABASE_NAME = "tripsphere"

async def migrate_trips():
    print("Starting migration: Trip destination string -> destination_id")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    trips_col = db.trips
    dests_col = db.destinations
    
    # 1. Fetch all trips
    cursor = trips_col.find({})
    trips = await cursor.to_list(length=None)
    print(f"Found {len(trips)} trips to check.")
    
    updated_count = 0
    failed_count = 0
    
    for trip in trips:
        trip_id = trip["_id"]
        
        # Check if it needs migration
        needs_migration = False
        dest_name = None
        
        if "destination_id" not in trip or not trip["destination_id"]:
            needs_migration = True
            dest_name = trip.get("destination") or trip.get("location") or trip.get("destination_name")
            
            if not dest_name and "name" in trip:
                if "Trip to " in trip["name"]:
                    dest_name = trip["name"].replace("Trip to ", "").strip()
        
        if needs_migration and dest_name:
            print(f"Checking trip '{trip.get('name', 'Untitled')}' with destination name: '{dest_name}'")
            
            dest = await dests_col.find_one({"name": {"$regex": f"^{dest_name}$", "$options": "i"}})
            
            if not dest:
                dest = await dests_col.find_one({"name": {"$regex": dest_name, "$options": "i"}})
            
            if dest:
                dest_id = str(dest["_id"])
                print(f"Found destination: {dest['name']} (ID: {dest_id})")
                
                await trips_col.update_one(
                    {"_id": trip_id},
                    {"$set": {"destination_id": dest_id}}
                )
                updated_count += 1
            else:
                print(f"Could not find destination matching: '{dest_name}'")
                failed_count += 1
        elif needs_migration:
            print(f"Trip '{trip.get('name', 'Untitled')}' needs migration but no destination name found.")
            failed_count += 1

    print("\nMigration complete!")
    print(f"Updated: {updated_count}")
    print(f"Failed: {failed_count}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(migrate_trips())
