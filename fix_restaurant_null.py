import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickcombo.settings')
django.setup()

def fix():
    with connection.cursor() as cursor:
        print("Dropping NOT NULL constraint on api_restaurant.image_url...")
        cursor.execute("ALTER TABLE api_restaurant ALTER COLUMN image_url DROP NOT NULL;")
        print("Done!")

if __name__ == "__main__":
    fix()
