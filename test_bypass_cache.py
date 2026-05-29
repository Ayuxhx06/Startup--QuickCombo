import requests
import time

url = "https://quickcombo.alwaysdata.net/api/qiqi/chat/"
payload = {
    "message": f"I am very stressed and angry right now. Please give me some custom items, it's {time.time()}",
    "history": []
}

response = requests.post(url, json=payload, timeout=10)
print(f"STATUS: {response.status_code}")
with open('django_error.html', 'w', encoding='utf-8') as f:
    f.write(response.text)
print("Wrote to django_error.html")
