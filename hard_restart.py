import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('ssh-quickcombo.alwaysdata.net', username='quickcombo', password='Dinesh@061004')
    print("Connected!")
    
    apps = ['/home/quickcombo/quickcombo_app', '/home/quickcombo/www/quickcombo_backend', '/home/quickcombo/fresh_app']
    for app in apps:
        print(f"Deploying to {app}...")
        # Only run migrations in the true backend folder
        migrate_cmd = "&& python3 manage.py migrate " if '/www/quickcombo_backend' in app else ""
        cmd = f"cd {app} && git fetch origin && git reset --hard origin/main {migrate_cmd} && find . -name '__pycache__' -exec rm -rf {{}} + "
        
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print('STDOUT:', stdout.read().decode())
        print('STDERR:', stderr.read().decode())

    print("Restarting Passenger...")
    ssh.exec_command("touch /home/quickcombo/www/quickcombo_backend/passenger_wsgi.py")

    print("Killing uWSGI to force hard restart...")
    stdin, stdout, stderr = ssh.exec_command("pkill -f uwsgi")
    print('STDOUT:', stdout.read().decode())
    print('STDERR:', stderr.read().decode())
finally:
    ssh.close()
