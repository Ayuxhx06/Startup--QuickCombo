import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickcombo.settings')
django.setup()

from api.models import Restaurant, MenuItem

def backfill():
    restaurants = Restaurant.objects.all()
    count = 0
    for r in restaurants:
        items = MenuItem.objects.filter(restaurant=r).select_related('category')
        categories_to_add = set(item.category for item in items if item.category)
        if categories_to_add:
            r.categories.add(*categories_to_add)
            count += len(categories_to_add)
            print(f"Added {len(categories_to_add)} categories to {r.name}")

    print(f"Total categories linked: {count}")

if __name__ == '__main__':
    backfill()
