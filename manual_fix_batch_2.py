import os
import sys
import django

# Setup Django
sys.path.append('/home/quickcombo/www/quickcombo_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickcombo.settings')
django.setup()

from api.models import MenuItem

batch_2 = {
    'Paneer Tikka Masala': 'https://www.vegrecipesofindia.com/wp-content/uploads/2014/01/paneer-tikka-masala-recipe-1.jpg',
    'Chicken Masala': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=800',
    'Tandoori Roti': 'https://www.vegrecipesofindia.com/wp-content/uploads/2013/05/tandoori-roti-recipe-1.jpg',
    'Garlic Naan': 'https://www.vegrecipesofindia.com/wp-content/uploads/2013/07/garlic-naan-recipe-1.jpg',
    'Kadhai Paneer': 'https://www.vegrecipesofindia.com/wp-content/uploads/2014/11/kadai-paneer-recipe-1.jpg',
    'Aloo Gobhi': 'https://www.vegrecipesofindia.com/wp-content/uploads/2012/03/aloo-gobi-recipe-1.jpg',
    'Mix Veg': 'https://www.vegrecipesofindia.com/wp-content/uploads/2013/01/mix-veg-recipe-1.jpg',
    'Chana Masala': 'https://www.vegrecipesofindia.com/wp-content/uploads/2013/07/chana-masala-recipe-1.jpg',
    'Malai Kofta': 'https://www.vegrecipesofindia.com/wp-content/uploads/2014/01/malai-kofta-recipe-1.jpg',
    'Butter Chicken': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=800', # Fallback to curry
    'Chicken Tikka': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=800',
    'Tandoori Chicken': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=800',
}

for name, url in batch_2.items():
    MenuItem.objects.filter(name__icontains=name).update(image_url=url)

print("Batch 2: Indian Gravies and Breads updated.")
