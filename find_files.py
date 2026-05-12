import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('ssh-quickcombo.alwaysdata.net', username='quickcombo', password='Dinesh@061004')
    stdin, stdout, stderr = ssh.exec_command('find /home/quickcombo/ -name "page.tsx" | grep "checkout"')
    print("Checkout results:", stdout.read().decode())
    stdin, stdout, stderr = ssh.exec_command('find /home/quickcombo/ -name "BottomNav.tsx"')
    print("BottomNav results:", stdout.read().decode())
finally:
    ssh.close()
