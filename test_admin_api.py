import requests
import json

API = "http://127.0.0.1:8000/api"
PASS = "Admin@4098"

def test_endpoints():
    headers = {'X-Admin-Password': PASS}
    endpoints = [
        ('GET', '/admin/stats/'),
        ('GET', '/admin/orders/'),
        ('GET', '/admin/menu/'),
        ('GET', '/admin/categories/'),
        ('GET', '/admin/restaurants/'),
        ('GET', '/admin/users/'),
    ]
    
    print("--- TESTING ADMIN API ---")
    for method, path in endpoints:
        try:
            if method == 'GET':
                r = requests.get(f"{API}{path}", headers=headers)
            print(f"[{method}] {path} -> {r.status_code}")
            if r.status_code != 200:
                print(f"   ❌ Error: {r.text}")
        except Exception as e:
            print(f"❌ Connection FAILED: {e}")

if __name__ == "__main__":
    test_endpoints()
