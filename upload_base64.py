import paramiko
import base64

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@06102004"

local_file = r"c:\Placement project\Quickcombo\api\admin_views.py"
remote_file = "/home/quickcombo/www/quickcombo_backend/api/admin_views.py"

with open(local_file, "rb") as f:
    data = base64.b64encode(f.read()).decode("utf-8")

print("Connecting...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=password, timeout=10)
print("Connected. Executing base64 write...")

# We split the command into smaller chunks if necessary, but 33KB base64 is ~45KB, which usually fits in one command.
# If it fails, we will write it to a file.
cmd = f"echo {data} | base64 -d > {remote_file} && touch /home/quickcombo/www/quickcombo_backend/passenger_wsgi.py"
stdin, stdout, stderr = ssh.exec_command(cmd)

print("STDOUT:", stdout.read().decode())
print("STDERR:", stderr.read().decode())
print("Upload via base64 complete!")
ssh.close()
