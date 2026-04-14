import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('ssh-quickcombo.alwaysdata.net', username='quickcombo', password='Dinesh@061004')
    print("Connected!")
    
    cmd = "find /home/quickcombo -name 'admin_views.py'"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    paths = stdout.read().decode().splitlines()
    
    for path in paths:
        print(f"--- Checking: {path} ---")
        cmd = f"grep 'version' {path}"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print("OUT:", stdout.read().decode())

finally:
    ssh.close()
