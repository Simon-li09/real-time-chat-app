import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_flow():
    # 1. Register Users
    print("Registering user1...")
    r1 = requests.post(f"{BASE_URL}/auth/register/", json={
        "username": "tester1",
        "email": "tester1@example.com",
        "password": "password123"
    })
    print(f"Status: {r1.status_code}, Response: {r1.text}")

    # 2. Login
    print("\nLogging in user1...")
    l1 = requests.post(f"{BASE_URL}/auth/login/", json={
        "username": "tester1",
        "password": "password123"
    })
    token = l1.json().get('access')
    print(f"Token acquired: {token[:20]}...")

    # 3. List Users
    print("\nListing users...")
    u = requests.get(f"{BASE_URL}/users/", headers={"Authorization": f"Bearer {token}"})
    print(f"Users found: {len(u.json())}")

if __name__ == "__main__":
    try:
        test_flow()
    except Exception as e:
        print(f"Error: {e}")
