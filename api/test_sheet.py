import os
import django
import sys

# Set up Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickcombo.settings')
django.setup()

from api.utils_sheets import append_order_to_sheet
from api.models import Order

def test_manual_update():
    # Find the latest order to test with
    order = Order.objects.order_by('-id').first()
    if not order:
        print("No orders found in database to test with.")
        return

    print(f"Attempting to add Order #{order.id} to Google Sheet...")
    success = append_order_to_sheet(order)
    
    if success:
        print("✅ Success! Check your Google Sheet.")
    else:
        print("❌ Failed. Check the error messages above.")

if __name__ == "__main__":
    test_manual_update()
