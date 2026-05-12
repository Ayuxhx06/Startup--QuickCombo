import os
import sys
import django

# Setup Django
sys.path.append('/home/quickcombo/www/quickcombo_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickcombo.settings')
django.setup()

from api.models import MenuItem

# Fix Dragon Juice
dragon_juice = MenuItem.objects.filter(name__icontains='Dragon Juice').first()
if dragon_juice:
    # Use a nice red dragon fruit juice photo
    dragon_juice.image_url = "https://images.unsplash.com/photo-1596131397999-bb0133ad957e?auto=format&fit=crop&q=80&w=800"
    dragon_juice.save()
    print(f"Fixed: {dragon_juice.name}")
else:
    print("Dragon Juice not found")

# Also check why items are not updating - print total with image
total = MenuItem.objects.count()
with_img = MenuItem.objects.exclude(image_url='').count()
print(f"Stats: {with_img}/{total} items have images.")
