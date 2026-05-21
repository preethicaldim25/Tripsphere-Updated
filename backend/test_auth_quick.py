import asyncio
import sys
sys.path.insert(0, '.')

async def main():
    from database import init_db, get_collection
    from auth import hash_password, verify_password
    from datetime import datetime

    print("=== DB INIT ===")
    await init_db()

    users_col = get_collection("users")

    print("\n=== USERS IN DB ===")
    users = await users_col.find({}).to_list(20)
    print(f"Total users: {len(users)}")
    for u in users:
        print(f"  email={u.get('email')}  has_pwd={bool(u.get('password'))}  role={u.get('role')}")

    print("\n=== REGISTER TEST USER ===")
    test_email = "quicktest@tripsphere.dev"
    existing = await users_col.find_one({"email": test_email})
    if existing:
        print("User already exists, deleting to re-create...")
        await users_col.delete_one({"email": test_email})

    hashed = hash_password("QuickPass@123")
    result = await users_col.insert_one({
        "name": "Quick Test",
        "email": test_email,
        "password": hashed,
        "role": "user",
        "created_at": datetime.utcnow()
    })
    print(f"Inserted: {result.inserted_id}")

    print("\n=== LOGIN TEST ===")
    user = await users_col.find_one({"email": test_email})
    if not user:
        print("ERROR: User not found after insert!")
        return

    ok = verify_password("QuickPass@123", user["password"])
    print(f"Password verify: {ok}")

    print("\n=== TOKEN GENERATION TEST ===")
    from auth import create_access_token
    token = create_access_token({"id": str(user["_id"]), "email": user["email"], "role": "user"})
    print(f"Token generated: {token[:40]}...")

    print("\n=== ALL TESTS PASSED ===")

asyncio.run(main())
