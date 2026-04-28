import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('ssh-quickcombo.alwaysdata.net', username='quickcombo', password='Dinesh@061004')
    print("Connected!")
    
    apps = ['/home/quickcombo/quickcombo_app', '/home/quickcombo/www/quickcombo_backend', '/home/quickcombo/fresh_app']
    for app in apps:
        print(f"Deploying to {app}...")
        cmd = f"cd {app} && git fetch origin && git reset --hard origin/main"
        if app == '/home/quickcombo/fresh_app':
             cmd += ' && NODE_OPTIONS="--max-old-space-size=400" npm run build'
        
        cmd += " && touch quickcombo/wsgi.py || touch passenger_wsgi.py"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print('STDOUT:', stdout.read().decode())
        print('STDERR:', stderr.read().decode())


finally:
    ssh.close()
