import os
import django
import csv
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickcombo.settings')
django.setup()

from api.models import MenuItem

def export_items_csv():
    file_path = 'all_items_export.csv'
    print(f"Exporting items to {file_path}...")
    
    items = MenuItem.objects.select_related('category', 'restaurant').all()
    
    with open(file_path, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        # Header
        writer.writerow(['ID', 'Name', 'Price', 'Category', 'Restaurant', 'Is Veg', 'Description', 'Rating', 'Prep Time'])
        
        for item in items:
            writer.writerow([
                item.id,
                item.name,
                item.price,
                item.category.name if item.category else 'N/A',
                item.restaurant.name if item.restaurant else 'N/A',
                'Yes' if item.is_veg else 'No',
                item.description,
                item.rating,
                item.prep_time
            ])
            
    print(f"Successfully exported {items.count()} items to {file_path}")

if __name__ == "__main__":
    export_items_csv()
