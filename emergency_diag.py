import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('ssh-quickcombo.alwaysdata.net', username='quickcombo', password='Dinesh@061004')
    print("Connected!")
    
    # Check Restaurant, Menu, and Coupon counts
    script = """
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickcombo.settings')
django.setup()
from api.models import Restaurant, Coupon, MenuItem
print('--- Counts ---')
print(f'Total Restaurants: {Restaurant.objects.count()}')
print(f'Active Restaurants: {Restaurant.objects.filter(is_active=True).count()}')
print(f'Total MenuItems: {MenuItem.objects.count()}')
print(f'Active Items (Restaurant Active): {MenuItem.objects.filter(restaurant__is_active=True).count()}')
print(f'Total Coupons: {Coupon.objects.count()}')
print(f'Active Coupons: {Coupon.objects.filter(is_active=True).count()}')
"""
    # Write the script on the server and run it
    cmd = f"cd /home/quickcombo/www/quickcombo_backend && echo \"{script}\" > emergency_check.py && python3 emergency_check.py"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print("STDOUT:", stdout.read().decode())
    print("STDERR:", stderr.read().decode())

finally:
    ssh.close()
