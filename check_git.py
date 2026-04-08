import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('ssh-quickcombo.alwaysdata.net', username='quickcombo', password='Dinesh@061004')
stdin, stdout, stderr = ssh.exec_command("cd /home/quickcombo/quickcombo_app && git remote -v")
print('STDOUT:', stdout.read().decode())
print('STDERR:', stderr.read().decode())
