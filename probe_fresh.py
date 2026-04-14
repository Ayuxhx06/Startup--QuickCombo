import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('ssh-quickcombo.alwaysdata.net', username='quickcombo', password='Dinesh@061004')
    print("Connected!")
    
    cmd = "grep 'version' /home/quickcombo/fresh_app/api/admin_views.py"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print("FRESH_APP VERSION:", stdout.read().decode())
    print("STDERR:", stderr.read().decode())

finally:
    ssh.close()
