import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('ssh-quickcombo.alwaysdata.net', username='quickcombo', password='Dinesh@061004')
    stdin, stdout, stderr = ssh.exec_command('grep "packingCharge" /home/quickcombo/fresh_app/app/checkout/page.tsx')
    print("PackingCharge in file:", stdout.read().decode())
    
    stdin, stdout, stderr = ssh.exec_command('grep "onlyEssentials" /home/quickcombo/fresh_app/app/checkout/page.tsx')
    print("onlyEssentials in file:", stdout.read().decode())
finally:
    ssh.close()
