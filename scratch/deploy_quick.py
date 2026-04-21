import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('ssh-quickcombo.alwaysdata.net', username='quickcombo', password='Dinesh@061004')

commands = [
    "cd /home/quickcombo/www/quickcombo_backend && git fetch origin && git reset --hard origin/main",
    "touch /home/quickcombo/www/quickcombo_backend/passenger_wsgi.py",
    "pkill -u quickcombo -f uwsgi || true",
    "pkill -u quickcombo -f python || true"
]

for cmd in commands:
    print(f"Running: {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print("STDOUT:", stdout.read().decode())
    print("STDERR:", stderr.read().decode())
