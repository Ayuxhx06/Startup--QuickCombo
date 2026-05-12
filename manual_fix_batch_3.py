import os
import sys
import django

# Setup Django
sys.path.append('/home/quickcombo/www/quickcombo_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickcombo.settings')
django.setup()

from api.models import MenuItem

batch_3 = {
    'Veg Roll': 'https://www.vegrecipesofindia.com/wp-content/uploads/2017/01/veg-roll-recipe-1.jpg',
    'Paneer Roll': 'https://www.vegrecipesofindia.com/wp-content/uploads/2016/12/paneer-kathi-roll-recipe-1.jpg',
    'Chicken Roll': 'https://images.unsplash.com/photo-1626700051175-6818013e184f?auto=format&fit=crop&q=80&w=800',
    'Spring Roll': 'https://www.vegrecipesofindia.com/wp-content/uploads/2016/11/spring-rolls-recipe-1.jpg',
    'Veg Wrap': 'https://images.unsplash.com/photo-1626700051175-6818013e184f?auto=format&fit=crop&q=80&w=800', # Fallback to wrap style
    'Chicken Wrap': 'https://images.unsplash.com/photo-1626700051175-6818013e184f?auto=format&fit=crop&q=80&w=800',
    'Pasta': 'https://images.unsplash.com/photo-1546548970-71785318a17b?auto=format&fit=crop&q=80&w=800',
    'Macaroni': 'https://images.unsplash.com/photo-1546548970-71785318a17b?auto=format&fit=crop&q=80&w=800',
}

for name, url in batch_3.items():
    MenuItem.objects.filter(name__icontains=name).update(image_url=url)

print("Batch 3: Rolls, Wraps and Pasta updated.")
