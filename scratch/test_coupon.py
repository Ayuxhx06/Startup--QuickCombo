import requests

url = "https://quickcombo.alwaysdata.net/api/coupons/validate/"
payload = {
    "code": "SNEHA50",
    "email": "test@test.com",
    "cart_value": 220
}

response = requests.post(url, json=payload)
print(response.status_code)
print(response.json())
