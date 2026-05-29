import requests
import json

url = 'https://quickcombo.alwaysdata.net/api/qiqi/chat/'
payload = {
    'message': 'I am feeling very stressed and tired today, need comfort food',
    'history': []
}

print("Sending request...")
resp = requests.post(url, json=payload, timeout=40)
print('Status:', resp.status_code)

try:
    data = resp.json()
    print('Reply:', data.get('reply', 'N/A'))
    combos = data.get('suggested_combos', [])
    print('Combos count:', len(combos))
    for c in combos:
        name = c.get('name', 'N/A')
        price = c.get('price', 'N/A')
        items = c.get('items', [])
        is_dynamic = c.get('is_dynamic', False)
        print(f'  Combo: {name} | Price: Rs{price} | Items: {len(items)} | Dynamic: {is_dynamic}')
        for item in items:
            print(f'    * {item.get("name")} - Rs{item.get("price")}')
except Exception as e:
    print('Error parsing:', e)
    print('Raw:', resp.text[:1000])
