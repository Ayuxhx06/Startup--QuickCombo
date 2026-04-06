import os
import django
import sys

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickcombo.settings')
try:
    django.setup()
    from django.contrib.auth import get_user_model
    from api.models import Restaurant, Order, MenuItem
    from django.conf import settings
    from django.db import connection
except ImportError:
    print("❌ Error: Could not setup Django. Make sure you are in the project root and requirements are installed.")
    sys.exit(1)

def print_header(text):
    print("\n" + "="*50)
    print(f" {text}")
    print("="*50)

def check_health():
    print_header("SYSTEM HEALTH CHECK")
    
    # 1. Database Connection
    try:
        connection.ensure_connection()
        print("✅ Database: CONNECTED (Neon/Postgres)")
        print(f"📊 Stats: {Restaurant.objects.count()} Restaurants, {MenuItem.objects.count()} Items, {Order.objects.count()} Orders")
    except Exception as e:
        print(f"❌ Database: FAILED - {e}")

    # 2. API Keys
    keys = {
        "BREVO_API_KEY": bool(getattr(settings, 'BREVO_API_KEY', '')),
        "GEOAPIFY_KEY": bool(getattr(settings, 'GEOAPIFY_KEY', '')),
        "EMAIL_HOST_PASSWORD": bool(getattr(settings, 'EMAIL_HOST_PASSWORD', '')),
    }
    for key, status in keys.items():
        print(f"{'✅' if status else '⚠️'} {key}: {'CONFIGURED' if status else 'MISSING'}")

def reset_admin(email, new_password):
    print_header(f"RESETTING ADMIN: {email}")
    User = get_user_model()
    try:
        user = User.objects.get(email=email)
        user.set_password(new_password)
        user.is_staff = True
        user.is_superuser = True
        user.save()
        print(f"✅ Success: Password for {email} has been updated.")
        print(f"🔑 New Password: {new_password}")
        print("🚀 You can now login at /admin or the new Premium Dashboard.")
    except User.DoesNotExist:
        print(f"⚠️ User {email} not found. Creating new superuser...")
        User.objects.create_superuser(email=email, password=new_password)
        print(f"✅ Success: Superuser {email} created.")

def fix_master_password(new_pass):
    print_header("FIXING MASTER DASHBOARD PASSWORD")
    print(f"Current ADMIN_PANEL_PASSWORD in settings: {getattr(settings, 'ADMIN_PANEL_PASSWORD', 'Admin@4098')}")
    print(f"Instruction: Ensure your .env file has 'ADMIN_PANEL_PASSWORD={new_pass}'")
    print(f"If running on AlwaysData, set this in the Web Dashboard or .env file.")

if __name__ == "__main__":
    check_health()
    
    print("\n--- RECOVERY ACTIONS ---")
    print("1. Reset Superuser Password")
    print("2. Exit")
    
    choice = input("\nSelect action (1-2): ")
    
    if choice == '1':
        email = input("Enter admin email (default: shreshtha0311@gmail.com): ") or "shreshtha0311@gmail.com"
        password = input("Enter new password (default: Admin@4098): ") or "Admin@4098"
        reset_admin(email, password)
    else:
        print("Exiting...")
