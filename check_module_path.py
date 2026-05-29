import paramiko

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@06102004"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(host, username=user, password=password)
    
    script = """
import sys
sys.path.append('/home/quickcombo/www/quickcombo_backend')
from api import ai_views
print(ai_views.__file__)
"""
    cmd = f"python -c \"{script}\""
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print("MODULE PATH:", stdout.read().decode())
    print("STDERR:", stderr.read().decode())
finally:
    ssh.close()
