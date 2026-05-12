import os
import sys
import django

# Setup Django
sys.path.append('/home/quickcombo/www/quickcombo_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickcombo.settings')
django.setup()

from api.models import MenuItem

pasta_fixes = {
    'Pasta': 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&q=80&w=800',
    'Veg Pasta': 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&q=80&w=800',
    'Chicken Pasta': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=800',
    'White Sauce Pasta': 'https://images.unsplash.com/photo-1645112481338-331499700a4d?auto=format&fit=crop&q=80&w=800',
}

for name, url in pasta_fixes.items():
    MenuItem.objects.filter(name__icontains=name).update(image_url=url)

print("Pasta photos corrected. No more fruit!")
