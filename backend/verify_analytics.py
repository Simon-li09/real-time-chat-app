import urllib.request
import urllib.parse
import json

BASE_URL = "http://127.0.0.1:8000/api"

def make_request(url, data=None, headers=None, method="GET"):
    if data:
        data = json.dumps(data).encode('utf-8')
    
    req = urllib.request.Request(url, data=data, headers=headers or {}, method=method)
    if data:
        req.add_header('Content-Type', 'application/json')
    
    try:
        with urllib.request.urlopen(req) as f:
            return f.status, json.loads(f.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')
    except Exception as e:
        return 0, str(e)

def test_flow():
    # 1. Register
    print("Registering user...")
    status, res = make_request(f"{BASE_URL}/auth/register/", {
        "username": "admin_verify",
        "email": "admin_v@example.com",
        "password": "password123"
    }, method="POST")
    print(f"Register status: {status}")

    # 2. Login
    print("\nLogging in...")
    status, res = make_request(f"{BASE_URL}/auth/login/", {
        "username": "admin_verify",
        "password": "password123"
    }, method="POST")
    
    if status != 200:
        print(f"Login failed: {res}")
        return

    token = res.get('access')
    print(f"Token acquired: {token[:20]}...")

    # 3. Analytics
    print("\nFetching Admin Stats...")
    status, res = make_request(f"{BASE_URL}/analytics/admin/stats/", headers={
        "Authorization": f"Bearer {token}"
    })
    print(f"Stats status: {status}")
    print(f"Stats: {json.dumps(res, indent=2)}")

if __name__ == "__main__":
    test_flow()
