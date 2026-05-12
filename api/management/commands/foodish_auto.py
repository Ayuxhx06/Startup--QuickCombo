from django.core.management.base import BaseCommand
from api.models import MenuItem
import requests
import time
import random

class Command(BaseCommand):
    help = 'Automatically assign food images using Foodish API'

    def handle(self, *args, **options):
        # Foodish API supported categories
        FOODISH_MAPPING = {
            'biryani': ['biryani', 'pulao', 'rice'],
            'burger': ['burger', 'slider'],
            'butter-chicken': ['chicken', 'gravy', 'curry', 'non-veg'],
            'dessert': ['dessert', 'sweet', 'cake', 'ice cream', 'shake', 'beverage'],
            'dosa': ['dosa', 'uttapam'],
            'idli': ['idli', 'vada'],
            'pasta': ['pasta', 'spaghetti', 'macaroni'],
            'pizza': ['pizza', 'garlic bread'],
            'rice': ['rice', 'fried rice', 'biryani'],
            'samosa': ['samosa', 'snack', 'pakoda']
        }

        items = MenuItem.objects.all()
        total = items.count()
        self.stdout.write(f"Starting Foodish Auto-Image for {total} items...")

        # Cache to store fetched images per category to avoid redundant API calls
        image_cache = {cat: [] for cat in FOODISH_MAPPING.keys()}

        for i, item in enumerate(items):
            name_lower = item.name.lower()
            detected_cat = 'biryani' # Default fallback

            # Detect Category
            for cat, keywords in FOODISH_MAPPING.items():
                if any(kw in name_lower for kw in keywords):
                    detected_cat = cat
                    break
            
            try:
                # Use cache if we have images, else fetch new one
                if len(image_cache[detected_cat]) < 3: # Keep a small pool per category
                    response = requests.get(f'https://foodish-api.com/api/images/{detected_cat}', timeout=5)
                    if response.status_code == 200:
                        img_url = response.json().get('image')
                        if img_url:
                            image_cache[detected_cat].append(img_url)
                
                # Pick a random image from the category pool
                final_image = random.choice(image_cache[detected_cat]) if image_cache[detected_cat] else f"https://via.placeholder.com/300?text={detected_cat}"
                
                item.image_url = final_image
                item.save()
                
                self.stdout.write(self.style.SUCCESS(f"[{i+1}/{total}] Assigned {detected_cat} image to {item.name}"))
                
                # Tiny sleep to be polite to the API
                time.sleep(0.1)

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error for {item.name}: {str(e)}"))
                item.image_url = f"https://via.placeholder.com/300?text=Food"
                item.save()

        self.stdout.write(self.style.SUCCESS("Foodish Auto-Image complete!"))
