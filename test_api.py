import requests
import json

url = 'https://ayuxhx06.alwaysdata.net/api/qiqi/chat/'
headers = {'Content-Type': 'application/json'}
data = {'message': 'happy', 'history': []}

try:
    response = requests.post(url, headers=headers, json=data)
    print("STATUS:", response.status_code)
    print("BODY:", response.text)
except Exception as e:
    print("ERROR:", e)
