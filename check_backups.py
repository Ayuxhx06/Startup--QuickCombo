import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('ssh-quickcombo.alwaysdata.net', username='quickcombo', password='Dinesh@06102004')
stdin, stdout, stderr = ssh.exec_command('find /home/quickcombo -name "*.sql" -o -name "*.bak" -o -name "*.json" 2>/dev/null')
print(stdout.read().decode())
