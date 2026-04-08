
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickcombo.settings')
django.setup()
from api.models import OrderItem
field = OrderItem._meta.get_field('menu_item')
print(f'Menu Item Nullable: {field.null}')
