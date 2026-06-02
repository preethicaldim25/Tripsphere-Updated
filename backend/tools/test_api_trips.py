import asyncio
import httpx

async def test_trips():
    base_url = "http://localhost:8000"
    
    # Use existing user from previous tests or create new
    test_email = f"trips_test_{asyncio.get_event_loop().time()}@example.com"
    test_password = "password123"
    
    async with httpx.AsyncClient() as client:
        # Register or Login
        print("Logging in...")
        login_res = await client.post(
            f"{base_url}/api/auth/login",
            json={"email": test_email, "password": test_password}
        )
        
        if login_res.status_code != 200:
            print("Registering first...")
            login_res = await client.post(
                f"{base_url}/api/auth/register",
                json={"name": "Test User", "email": test_email, "password": test_password}
            )
            
        if login_res.status_code != 200:
            print(f"Auth failed: {login_res.text}")
            return
            
        data = login_res.json()
        token = data["access_token"]
        print(f"Got token: {token[:20]}...")
        
        # Fetch trips
        print("\nFetching trips...")
        headers = {"Authorization": f"Bearer {token}"}
        try:
            trips_res = await client.get(f"{base_url}/api/trips", headers=headers, timeout=15.0)
            print(f"Trips status: {trips_res.status_code}")
            print(f"Trips response length: {len(trips_res.text)}")
            if trips_res.status_code != 200:
                print(f"Trips error body: {trips_res.text}")
        except Exception as e:
            print(f"Fetch trips exception: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_trips())
