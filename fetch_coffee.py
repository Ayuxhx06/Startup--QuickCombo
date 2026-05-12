import os
import sys
import django

# Setup Django
sys.path.append('/home/quickcombo/www/quickcombo_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickcombo.settings')
django.setup()

from api.models import MenuItem

items = MenuItem.objects.filter(name__icontains='Coffee') | MenuItem.objects.filter(name__icontains='Shake') | MenuItem.objects.filter(name__icontains='Lassi')
for item in items:
    print(f"{item.id} | {item.name} | {item.image_url}")
