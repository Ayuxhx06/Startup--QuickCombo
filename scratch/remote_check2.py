import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('ssh-quickcombo.alwaysdata.net', username='quickcombo', password='Dinesh@061004')
stdin, stdout, stderr = ssh.exec_command("grep -A 5 'def validate_coupon' /home/quickcombo/www/quickcombo_backend/api/views.py")
print('STDOUT:', stdout.read().decode())
print('STDERR:', stderr.read().decode())
