import os
import sys
import django

# Setup Django
sys.path.append('/home/quickcombo/www/quickcombo_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickcombo.settings')
django.setup()

from api.models import MenuItem

drinks_fixes = [
    ('Cold Coffee', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=800'),
    ('Kit Kat Milkshake', 'https://images.unsplash.com/photo-1572490122747-3968b75bb827?auto=format&fit=crop&q=80&w=800'),
    ('Oreo Milk Shake', 'https://images.unsplash.com/photo-1541658016709-82535e94bc71?auto=format&fit=crop&q=80&w=800'),
    ('Strawberry Milkshake', 'https://images.unsplash.com/photo-1579954115545-a95591f28be0?auto=format&fit=crop&q=80&w=800'),
    ('Mango Milkshake', 'https://images.unsplash.com/photo-1590089415225-401ed6f9db8e?auto=format&fit=crop&q=80&w=800'),
    ('Lassi', 'https://images.unsplash.com/photo-1630138241030-9b634898bc9b?auto=format&fit=crop&q=80&w=800'),
    ('Chocolate Shake', 'https://images.unsplash.com/photo-1572490122747-3968b75bb827?auto=format&fit=crop&q=80&w=800'),
    ('Vanilla Shake', 'https://images.unsplash.com/photo-1572490122747-3968b75bb827?auto=format&fit=crop&q=80&w=800'), # Fallback
]

for name, url in drinks_fixes:
    MenuItem.objects.filter(name__icontains=name).update(image_url=url)

print("Verified and updated major Coffee House drinks.")
