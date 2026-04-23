import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickcombo.settings')
django.setup()

def fix():
    with connection.cursor() as cursor:
        print("Checking api_menuitem...")
        try:
            cursor.execute("ALTER TABLE api_menuitem ALTER COLUMN image_url DROP NOT NULL;")
            print("Successfully dropped NOT NULL constraint from api_menuitem.image_url")
        except Exception as e:
            print(f"Error on api_menuitem: {e}")

        print("\nChecking api_restaurant...")
        try:
            cursor.execute("ALTER TABLE api_restaurant ALTER COLUMN image_url DROP NOT NULL;")
            print("Successfully dropped NOT NULL constraint from api_restaurant.image_url")
        except Exception as e:
            print(f"Error on api_restaurant: {e}")

if __name__ == "__main__":
    fix()
