import requests

url = "https://quickcombo.alwaysdata.net/api/qiqi/chat/"
r = requests.post(url, json={"message": "happy", "history": []})
print(r.status_code)
print(r.text)
