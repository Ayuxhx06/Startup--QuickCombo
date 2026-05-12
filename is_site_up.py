import requests

def check_site():
    url = "https://quickcombo.alwaysdata.net/api/debug-db/"
    try:
        r = requests.get(url, timeout=10)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text}")
    except Exception as e:
        print(f"Site is down or error: {e}")

if __name__ == "__main__":
    check_site()
