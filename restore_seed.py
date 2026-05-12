import os
import sys
import django

# Setup Django
sys.path.append('/home/quickcombo/www/quickcombo_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickcombo.settings')
django.setup()

from api.models import MenuItem, Category

# Restore original seed images
seed_images = [
    ('Ultimate Burger Combo', 'https://images.unsplash.com/photo-1594212848116-e8d0337d11ce?auto=format&fit=crop&q=80&w=800'),
    ('Veggie Supreme Pizza', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&q=80&w=800'),
    ('Spicy Chicken Wings', 'https://images.unsplash.com/photo-1569691899455-88464f6d3310?auto=format&fit=crop&q=80&w=800'),
    ('Classic Cold Coffee', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=800'),
    ('Lays Magic Masala', 'https://www.bigbasket.com/media/uploads/p/l/104193_7-lays-potato-chips-magic-masala.jpg'),
    ('Margherita Pizza Combo', 'https://images.unsplash.com/photo-1573821663173-cbcebda47528?auto=format&fit=crop&q=80&w=800'),
    ('Paneer Tikka Roll', 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=800'),
    ('Dark Chocolate Shake', 'https://images.unsplash.com/photo-1572490122747-3968b75bb827?auto=format&fit=crop&q=80&w=800'),
    ('Dragon Juice', 'https://images.unsplash.com/photo-1596131397999-bb0133ad957e?auto=format&fit=crop&q=80&w=800'),
    ('Choco Milk', 'https://images.unsplash.com/photo-1550507992-eb63ffee0847?auto=format&fit=crop&q=80&w=800'),
    ('Badam Milk', 'https://images.unsplash.com/photo-1599940859674-a7fef639ea82?auto=format&fit=crop&q=80&w=800'),
    ('Lemon Dew', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800'),
]

for name, url in seed_images:
    MenuItem.objects.filter(name__icontains=name).update(image_url=url)

print("Restored original 12 items.")
