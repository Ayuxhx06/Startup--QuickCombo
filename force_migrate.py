import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('ssh-quickcombo.alwaysdata.net', username='quickcombo', password='Dinesh@061004')
    print("Connected!")
    
    # Manually run migrate specifically in the backend folder
    cmd = "cd /home/quickcombo/www/quickcombo_backend && python3 manage.py migrate api"
    print(f"Running: {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print("STDOUT:", stdout.read().decode())
    print("STDERR:", stderr.read().decode())

finally:
    ssh.close()
