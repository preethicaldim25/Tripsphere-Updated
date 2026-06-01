import requests
import json

def test_trip_creation():
    url = "http://localhost:8000/api/trips/"
    # This will fail with 401 but should NOT be 405
    try:
        response = requests.post(url, json={})
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_trip_creation()
