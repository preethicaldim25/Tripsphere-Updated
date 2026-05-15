import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys
import os
import certifi

# Adjust paths if needed
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import connect_to_mongo, get_collection
from auth import hash_password, verify_password

async def test_auth():
    print("Testing auth flow...")
    db = await connect_to_mongo()
    if db is None:
        print("Failed to connect to mongo")
        return
        
    users = get_collection("users")
    
    test_email = "testauth@example.com"
    test_password = "password123"
    
    # 1. Clean up
    await users.delete_one({"email": test_email})
    
    # 2. Hash and Register
    hashed = hash_password(test_password)
    user_doc = {
        "name": "Test Auth",
        "email": test_email,
        "password": hashed
    }
    
    result = await users.insert_one(user_doc)
    print(f"Registered user. Hashed password: {hashed}")
    
    # 3. Retrieve
    retrieved_user = await users.find_one({"email": test_email})
    if not retrieved_user:
        print("Failed to retrieve user!")
        return
        
    retrieved_hash = retrieved_user.get("password")
    print(f"Retrieved hash: {retrieved_hash}")
    
    # 4. Verify
    is_valid = verify_password(test_password, retrieved_hash)
    print(f"Password verification result: {is_valid}")
    
    # 5. Clean up again
    await users.delete_one({"email": test_email})
    print("Done")

if __name__ == "__main__":
    asyncio.run(test_auth())
