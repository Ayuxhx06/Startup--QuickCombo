import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('ssh-quickcombo.alwaysdata.net', username='quickcombo', password='Dinesh@061004')
    print("Connected!")
    
    app = '/home/quickcombo/www/quickcombo_backend'
    print(f"Running migrate on {app}...")
    cmd = f"cd {app} && source venv/bin/activate && python manage.py migrate api"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print('STDOUT:', stdout.read().decode())
    print('STDERR:', stderr.read().decode())

finally:
    ssh.close()
