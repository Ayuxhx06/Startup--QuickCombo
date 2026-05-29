import requests

urls = [
    'https://quickcombo.alwaysdata.net/api/qiqi/chat/',
    'https://ayuxhx06.alwaysdata.net/api/qiqi/chat/',
    'https://api.quickcombo.in/api/qiqi/chat/',
    'https://quickcombo.in/api/qiqi/chat/'
]

headers = {'Content-Type': 'application/json'}
data = {'message': 'happy', 'history': []}

for url in urls:
    print(f"\n--- Testing {url} ---")
    try:
        response = requests.post(url, headers=headers, json=data, timeout=5)
        print("STATUS:", response.status_code)
        print("BODY:", response.text[:200])
    except Exception as e:
        print("ERROR:", str(e)[:200])
