import requests
import os

IMAGE_PATH = r"C:\Users\Ayush Tomar\.gemini\antigravity\brain\a7471a0c-c935-4944-8670-bf287fb46e69\milk_packet_1776833071078.png"
BACKEND_URL = "https://quickcombo.alwaysdata.net"
PASSWORD = "Admin@4098"

def upload_and_update():
    print(f"Uploading image to {BACKEND_URL}...")
    with open(IMAGE_PATH, 'rb') as f:
        files = {'file': ('milk.png', f, 'image/png')}
        headers = {'X-Admin-Password': PASSWORD}
        res = requests.post(f"{BACKEND_URL}/api/admin/upload-image/", files=files, headers=headers)
        
    print(f"Status Code: {res.status_code}")
    if res.status_code != 201:
        # Avoid printing full HTML error if it's large
        print(f"Error Preview: {res.text[:200]}")
        return
        
    image_url = res.json()['url']
    print(f"Image uploaded! URL: {image_url}")
    
    # 2. Update Menu Item (ID 5503)
    print("Updating Menu Item 5503...")
    data = {
        "id": 5503,
        "name": "Fresh Milk",
        "price": 50.00,
        "image_url": image_url,
        "is_available": True,
        "category_slug": "essentials"
    }
    res = requests.post(f"{BACKEND_URL}/api/admin/menu/", json=data, headers=headers)
    
    if res.status_code in [200, 201]:
        print("Successfully updated item with photo!")
    else:
        print(f"Update failed: {res.text[:200]}")

if __name__ == "__main__":
    upload_and_update()
