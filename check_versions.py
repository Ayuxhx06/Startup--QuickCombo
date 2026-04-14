import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('ssh-quickcombo.alwaysdata.net', username='quickcombo', password='Dinesh@061004')
    print("Connected!")
    
    paths = [
        '/home/quickcombo/quickcombo_app/api/admin_views.py',
        '/home/quickcombo/www/quickcombo_backend/api/admin_views.py'
    ]
    
    for path in paths:
        print(f"--- Checking: {path} ---")
        cmd = f"grep 'version' {path}"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print("OUT:", stdout.read().decode())
        print("ERR:", stderr.read().decode())

finally:
    ssh.close()
