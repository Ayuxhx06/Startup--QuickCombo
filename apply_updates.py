import os
import django
import json
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickcombo.settings')
django.setup()

from api.models import MenuItem

def apply_menu_updates():
    json_path = 'processed_menu.json'
    if not os.path.exists(json_path):
        print(f"File not found: {json_path}")
        return
        
    print(f"Applying updates from {json_path} to database...")
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    updated_count = 0
    for item in data:
        item_id = item.get('id')
        image_url = item.get('image')
        
        if item_id and image_url and 'placeholder' not in image_url:
            try:
                # Update MenuItem
                MenuItem.objects.filter(id=item_id).update(image_url=image_url)
                updated_count += 1
            except Exception as e:
                print(f"Error updating item {item_id}: {str(e)}")
                
    print(f"Successfully updated {updated_count} items with new images.")

if __name__ == "__main__":
    apply_menu_updates()
