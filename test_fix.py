import os
import django
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickcombo.settings')
django.setup()

from api.models import MenuItem, Category

def test_create():
    # Try to create a menu item with image_url=None
    try:
        cat = Category.objects.get(slug='essentials')
        item = MenuItem.objects.create(
            name="Test Coke",
            price=40.00,
            category=cat,
            image_url=None
        )
        print(f"Successfully created item: {item.name}")
        item.delete()
        print("Deleted test item.")
    except Exception as e:
        print(f"Failed to create item: {e}")

if __name__ == "__main__":
    test_create()
