import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('ssh-quickcombo.alwaysdata.net', username='quickcombo', password='Dinesh@061004')
    print("Connected!")
    
    # Search for files containing "1.2.6" in any admin_views.py
    cmd = "find /home/quickcombo -name 'admin_views.py' -exec grep -l '1.2.6' {} +"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print("FOUND 1.2.6 IN:", stdout.read().decode())
    
    # Also check the running process tree for ANY path clues
    cmd = "ps aux | grep -v grep | grep python"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print("ACTIVE PYTHON PROCESSES:", stdout.read().decode())

finally:
    ssh.close()
