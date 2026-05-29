import requests

url = "https://quickcombo.alwaysdata.net/api/qiqi/chat/"
r = requests.post(url, json={"message": "happy", "history": []})
print("STATUS:", r.status_code)
print("HEADERS:", r.headers)
print("BODY:", r.text)

url2 = "https://api.quickcombo.in/api/qiqi/chat/"
r2 = requests.post(url2, json={"message": "happy", "history": []})
print("\nSTATUS 2:", r2.status_code)
print("HEADERS 2:", r2.headers)
print("BODY 2:", r2.text)
