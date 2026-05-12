import os
import sys
import django

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickcombo.settings')
django.setup()

from django.core.cache import cache
from api.models import MenuItem

# Clear Cache
cache.clear()
print("Global cache cleared.")

# Clear DB again just in case
MenuItem.objects.all().update(image_url='')
print("Database images cleared.")
