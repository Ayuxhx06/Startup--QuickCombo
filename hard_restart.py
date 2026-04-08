import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('ssh-quickcombo.alwaysdata.net', username='quickcombo', password='Dinesh@061004')
    print("Connected!")
    
    apps = ['/home/quickcombo/quickcombo_app', '/home/quickcombo/www/quickcombo_backend']
    for app in apps:
        print(f"Deploying to {app}...")
        cmd = f"cd {app} && git fetch origin && git reset --hard origin/main && find . -name '__pycache__' -exec rm -rf {{}} + && touch quickcombo/wsgi.py"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print('STDOUT:', stdout.read().decode())
        print('STDERR:', stderr.read().decode())

    print("Killing uWSGI to force hard restart...")
    stdin, stdout, stderr = ssh.exec_command("pkill -f uwsgi")
    print('STDOUT:', stdout.read().decode())
    print('STDERR:', stderr.read().decode())
finally:
    ssh.close()
