import requests
import json

url = "https://quickcombo.alwaysdata.net/api/admin/orders/"
headers = {"X-Admin-Password": "Admin@4098"}

res = requests.get(url, headers=headers)
orders = res.json()

for o in orders:
    if o['id'] == 403:
        print(f"Order #403 Total: {o['total']}")
        break
