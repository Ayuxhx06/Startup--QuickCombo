import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickcombo.settings')
django.setup()

from api.models import MenuItem

def fix_veg():
    non_veg_keywords = ['chicken', 'mutton', 'egg', 'fish', 'prawn', 'beef', 'meat', 'non-veg', 'non veg', 'kebab', 'tikka']
    # Let's be careful with 'tikka' as there is Paneer Tikka.
    non_veg_keywords = ['chicken', 'mutton', 'egg', 'fish', 'prawn', 'beef', 'meat', 'non veg', 'non-veg']
    
    count = 0
    for keyword in non_veg_keywords:
        items = MenuItem.objects.filter(name__icontains=keyword, is_veg=True)
        # Exclude 'veggie' if it contains 'egg' substring
        for item in items:
            if 'veggie' in item.name.lower():
                continue
            item.is_veg = False
            item.save()
            count += 1
            print(f"Updated non-veg item: {item.name}")
            
    print(f"Total entries updated: {count}")

if __name__ == '__main__':
    fix_veg()
