import paramiko
import json
import urllib.request
import urllib.error

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@06102004"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(host, username=user, password=password)
    
    cmd = """cd /home/quickcombo/www/quickcombo_backend && export DJANGO_SETTINGS_MODULE=quickcombo.settings && venv/bin/python3 -c "import django; django.setup(); from api.admin_views import *; from api.models import Order; from django.http import JsonResponse; o = Order.objects.filter(pk=406).first(); from api.serializers import OrderSerializer; print(OrderSerializer(o).data)" """
    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    print("--- API response check ---")
    out = stdout.read().decode()
    err = stderr.read().decode()
    print("Stdout:", out)
    print("Stderr:", err)
    
finally:
    ssh.close()
