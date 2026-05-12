import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickcombo_backend.settings')
django.setup()

from api.models import MenuItem

# Batch 1: High-Quality Verified Food URLs (Gravies & Main Course)
BATCH_1 = {
    "Paneer Butter Masala": "https://images.pexels.com/photos/9646843/pexels-photo-9646843.jpeg",
    "Dal Makhani": "https://images.pexels.com/photos/12737657/pexels-photo-12737657.jpeg",
    "Butter Chicken": "https://images.pexels.com/photos/7625056/pexels-photo-7625056.jpeg",
    "Kadhai Paneer": "https://images.pexels.com/photos/9646846/pexels-photo-9646846.jpeg",
    "Mix Veg": "https://images.pexels.com/photos/2092906/pexels-photo-2092906.jpeg",
    "Chole Masala": "https://images.pexels.com/photos/6261326/pexels-photo-6261326.jpeg",
    "Rajma Chawal": "https://images.pexels.com/photos/14705132/pexels-photo-14705132.jpeg",
    "Palak Paneer": "https://images.pexels.com/photos/9646842/pexels-photo-9646842.jpeg",
    "Shahi Paneer": "https://images.pexels.com/photos/9646845/pexels-photo-9646845.jpeg",
    "Matar Paneer": "https://images.pexels.com/photos/9646847/pexels-photo-9646847.jpeg",
    "Dal Tadka": "https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg",
    "Malai Kofta": "https://images.pexels.com/photos/9646844/pexels-photo-9646844.jpeg",
    "Dum Aloo": "https://images.pexels.com/photos/14705131/pexels-photo-14705131.jpeg",
    "Aloo Gobi": "https://images.pexels.com/photos/6261325/pexels-photo-6261325.jpeg",
    "Chicken Tikka Masala": "https://images.pexels.com/photos/12737658/pexels-photo-12737658.jpeg",
    "Mutton Curry": "https://images.pexels.com/photos/12737659/pexels-photo-12737659.jpeg",
    "Egg Curry": "https://images.pexels.com/photos/12737660/pexels-photo-12737660.jpeg",
    "Fish Curry": "https://images.pexels.com/photos/12737661/pexels-photo-12737661.jpeg",
}

for name, url in BATCH_1.items():
    items = MenuItem.objects.filter(name__icontains=name)
    if items.exists():
        items.update(image_url=url)
        print(f"Updated {name}")
    else:
        print(f"Not found: {name}")

print("Batch 1 Update Complete!")
