import os
import sys
import django

# Setup Django
sys.path.append('/home/quickcombo/www/quickcombo_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickcombo.settings')
django.setup()

from api.models import MenuItem

fixes = [
    ('Choco Milk', 'https://images.unsplash.com/photo-1550507992-eb63ffee0847?auto=format&fit=crop&q=80&w=800'),
    ('Badam Milk', 'https://images.unsplash.com/photo-1599940859674-a7fef639ea82?auto=format&fit=crop&q=80&w=800'),
    ('Lemon Dew', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800'),
]

for name, url in fixes:
    item = MenuItem.objects.filter(name__icontains=name).first()
    if item:
        item.image_url = url
        item.save()
        print(f"Fixed: {item.name}")

# Print items that still have NO image
no_img = MenuItem.objects.filter(image_url='').count()
print(f"Items still without image: {no_img}")
