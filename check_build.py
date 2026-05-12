import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@061004"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=password)

print("Running build remotely...")
stdin, stdout, stderr = ssh.exec_command('cd /home/quickcombo/fresh_app && NODE_OPTIONS="--max-old-space-size=400" /home/quickcombo/fresh_app/node_modules/.bin/next build')
out = stdout.read().decode('utf-8', errors='ignore')
err = stderr.read().decode('utf-8', errors='ignore')

print("OUT:", out)
print("ERR:", err)

ssh.close()
