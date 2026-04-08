import json
import urllib.request
url = 'https://quickcombo.alwaysdata.net/api/payment/create-session/'
payload = {
    'items': [{'id': 689, 'price': 160, 'quantity': 1, 'name': 'Test Item'}],
    'email': 'test@quickcombo.in',
    'name': 'Test User',
    'phone': '9999999999',
    'address': 'Test Address',
    'lat': 12.8231,
    'lng': 80.0453
}
req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req) as response:
        print(response.status, response.read().decode())
except Exception as e:
    print(e)
    if hasattr(e, 'read'): print(e.read().decode())
