import paramiko

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@06102004"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(host, username=user, password=password)
    
    # Upgrade google-generativeai
    cmd = "/home/quickcombo/www/quickcombo_backend/venv/bin/pip install --upgrade google-generativeai"
    print("Upgrading google-generativeai...")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode())
    print("ERR:", stderr.read().decode())

    print("Restarting backend...")
    ssh.exec_command("touch /home/quickcombo/www/quickcombo_backend/passenger_wsgi.py")
    ssh.exec_command("touch /home/quickcombo/quickcombo_app/passenger_wsgi.py")
    print("Done!")
finally:
    ssh.close()
