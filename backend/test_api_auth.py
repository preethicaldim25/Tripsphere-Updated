import asyncio
import httpx
import time

async def test_api():
    base_url = "http://localhost:8000"
    
    test_email = f"api_test_{int(time.time())}@example.com"
    test_password = "password123"
    
    async with httpx.AsyncClient() as client:
        # Register
        print("Registering...")
        register_res = await client.post(
            f"{base_url}/api/auth/register",
            json={
                "name": "API Test User",
                "email": test_email,
                "password": test_password
            }
        )
        print(f"Register status: {register_res.status_code}")
        print(f"Register body: {register_res.text}")
        
        # Login
        print("\nLogging in...")
        login_res = await client.post(
            f"{base_url}/api/auth/login",
            json={
                "email": test_email,
                "password": test_password
            }
        )
        print(f"Login status: {login_res.status_code}")
        print(f"Login body: {login_res.text}")

if __name__ == "__main__":
    asyncio.run(test_api())
