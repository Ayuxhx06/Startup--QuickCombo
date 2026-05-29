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

from api.models import User
riders = User.objects.filter(is_rider=True)
print("Total riders:", riders.count())
for r in riders:
    print("Rider ID:", r.id, "Name:", r.name, "Phone:", r.phone, "Verified:", r.rider_verified)
"""

sftp = ssh.open_sftp()
with sftp.file('/home/quickcombo/www/quickcombo_backend/check_riders.py', 'w') as f:
    f.write(check_script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("python /home/quickcombo/www/quickcombo_backend/check_riders.py")
print("OUT:", stdout.read().decode())
print("ERR:", stderr.read().decode())

ssh.close()
