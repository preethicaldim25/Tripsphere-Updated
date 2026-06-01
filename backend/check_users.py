import asyncio
import os
import json
from motor.motor_asyncio import AsyncIOMotorClient
from bson import json_util
from dotenv import load_dotenv

load_dotenv()

async def check():
    uri = os.getenv("MONGO_URI") or "mongodb://localhost:27017"
    print(f"Connecting to: {uri.split('@')[-1] if '@' in uri else uri}")
    
    client = AsyncIOMotorClient(uri)
    db = client.get_database() # Uses the DB name from the URI
    
    users = await db.users.find({}, {"password": 0}).to_list(length=100)
    
    print(f"\n--- FOUND {len(users)} USERS ---")
    for u in users:
        print(f"Email: {u.get('email')} | Verified: {u.get('email_verified')} | Name: {u.get('name')}")
    
    output_file = "users_output.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(users, f, default=json_util.default, indent=2)
    
    print(f"\nFull user data saved to: {output_file}")
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
