import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('ssh-quickcombo.alwaysdata.net', username='quickcombo', password='Dinesh@061004')
    print("Connected!")
    
    commands = [
        "ls -la /home/quickcombo/",
        "ls -la /home/quickcombo/www/",
        "ps aux | grep uwsgi",
        "cd /home/quickcombo/quickcombo_app && git log -1 --oneline",
        "cd /home/quickcombo/www/quickcombo_backend && git log -1 --oneline",
        "cd /home/quickcombo/quickcombo_app && grep 'version' api/admin_views.py",
        "cd /home/quickcombo/www/quickcombo_backend && grep 'version' api/admin_views.py"
    ]
    
    for cmd in commands:
        print(f"--- Running: {cmd} ---")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print('STDOUT:', stdout.read().decode())
        print('STDERR:', stderr.read().decode())

finally:
    ssh.close()
