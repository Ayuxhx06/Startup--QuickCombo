import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickcombo.settings')
django.setup()

from api.models import MenuItem, PredefinedCombo, Restaurant

def clear_item_photos():
    print("Starting PERMANENT removal of Food Item photos...")
    
    try:
        # 1. Clear MenuItem photos
        menu_items_count = MenuItem.objects.exclude(image_url='').exclude(image_url__isnull=True).count()
        MenuItem.objects.all().update(image_url='')
        print(f"Cleared images for all MenuItems (Updated {menu_items_count} items)")

        # 2. Clear PredefinedCombo photos
        combos_count = PredefinedCombo.objects.exclude(image_url='').exclude(image_url__isnull=True).count()
        PredefinedCombo.objects.all().update(image_url='')
        print(f"Cleared images for all PredefinedCombos (Updated {combos_count} combos)")

        # 3. Verify Restaurants are NOT touched
        restaurants_count = Restaurant.objects.exclude(image_url='').exclude(image_url__isnull=True).count()
        print(f"Restaurant images preserved: {restaurants_count} restaurants still have images.")

        print("\nAll food item photos have been permanently removed!")
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    clear_item_photos()
