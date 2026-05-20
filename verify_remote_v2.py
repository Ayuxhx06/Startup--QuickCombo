import requests
import json

url = "https://quickcombo.alwaysdata.net/api/admin/orders/"
headers = {"X-Admin-Password": "Admin@4098", "Content-Type": "application/json"}
data = {"order_id": 403, "total": 310.00}

print("Sending PATCH request...")
res = requests.patch(url, headers=headers, json=data)
print(f"Status: {res.status_code}")
print(f"Response: {res.text}")

res_get = requests.get(url, headers=headers)
orders = res_get.json()
for o in orders:
    if o['id'] == 403:
        print(f"Verified Total in DB: {o['total']}")
        break
