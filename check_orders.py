import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@06102004"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=password)

check_script = """
import os
import sys
import django

sys.path.append('/home/quickcombo/www/quickcombo_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickcombo.settings')
django.setup()

from api.models import Order
all_orders = Order.objects.all().order_by('id')
print(f"Total orders in DB: {all_orders.count()}")
if all_orders.exists():
    first_order = all_orders.first()
    last_order = all_orders.last()
    print(f"Earliest order ID: {first_order.id}, created_at: {first_order.created_at}")
    print(f"Latest order ID: {last_order.id}, created_at: {last_order.created_at}")
    
    print("\\nRecent 10 orders:")
    for o in Order.objects.all().order_by('-id')[:10]:
        print(f"  ID {o.id} - Status {o.status}")
        
    print("\\nEarliest 10 orders:")
    for o in Order.objects.all().order_by('id')[:10]:
        print(f"  ID {o.id} - Status {o.status}")
else:
    print("NO ORDERS FOUND!")
"""

sftp = ssh.open_sftp()
with sftp.file('/home/quickcombo/www/quickcombo_backend/check_orders.py', 'w') as f:
    f.write(check_script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("python /home/quickcombo/www/quickcombo_backend/check_orders.py")
print("OUT:", stdout.read().decode())
print("ERR:", stderr.read().decode())

ssh.close()
