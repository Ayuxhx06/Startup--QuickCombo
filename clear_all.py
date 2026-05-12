import os
import sys
import django

# Setup Django
sys.path.append('/home/quickcombo/www/quickcombo_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickcombo.settings')
django.setup()

from api.models import MenuItem

# STOP the auto_image process if it's running
os.system("pkill -f auto_image")

# Clear ALL images
updated = MenuItem.objects.all().update(image_url='')
print(f"Successfully cleared {updated} images.")
