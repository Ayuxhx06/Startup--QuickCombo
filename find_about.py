import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('ssh-quickcombo.alwaysdata.net', username='quickcombo', password='Dinesh@061004')
    stdin, stdout, stderr = ssh.exec_command('find /home/quickcombo/ -name "page.tsx" | grep "about"')
    print("Find results:", stdout.read().decode())
finally:
    ssh.close()
