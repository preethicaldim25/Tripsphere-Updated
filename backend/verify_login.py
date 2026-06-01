import requests
import json

url = "http://localhost:8000/api/auth/login"
payload = {
    "email": "final_test_success@example.com",
    "password": "password123"
}
headers = {
    "Content-Type": "application/json"
}

try:
    print(f"Sending login request to {url}...")
    response = requests.post(url, data=json.dumps(payload), headers=headers, timeout=10)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
