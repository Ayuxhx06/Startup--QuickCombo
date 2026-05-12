import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickcombo.settings')
django.setup()

from api.models import MenuItem, Restaurant, PredefinedCombo

def clear_photos():
    print("Starting to remove all photos from the database...")
    
    try:
        # 1. Clear MenuItem photos
        menu_items_count = MenuItem.objects.exclude(image_url='').exclude(image_url__isnull=True).count()
        MenuItem.objects.all().update(image_url='')
        print(f"Cleared images for all MenuItems (Updated {menu_items_count} items)")

        # 2. Clear Restaurant photos
        restaurants_count = Restaurant.objects.exclude(image_url='').exclude(image_url__isnull=True).count()
        Restaurant.objects.all().update(image_url='')
        print(f"Cleared images for all Restaurants (Updated {restaurants_count} restaurants)")

        # 3. Clear PredefinedCombo photos
        combos_count = PredefinedCombo.objects.exclude(image_url='').exclude(image_url__isnull=True).count()
        PredefinedCombo.objects.all().update(image_url='')
        print(f"Cleared images for all PredefinedCombos (Updated {combos_count} combos)")

        print("\nAll photos have been removed from the site!")
        
    except Exception as e:
        print(f"Error clearing photos: {str(e)}")

if __name__ == "__main__":
    clear_photos()
