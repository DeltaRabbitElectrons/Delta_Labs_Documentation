import requests
import json

url = "http://localhost:8000/auth/login"
payload = {
    "email": "admin@delta-labs.xyz",
    "password": "password"
}
headers = {
    "Content-Type": "application/json"
}

try:
    print(f"Testing login for {payload['email']}...")
    response = requests.post(url, json=payload, headers=headers, timeout=10)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
