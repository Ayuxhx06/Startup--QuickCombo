import paramiko

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@06102004"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(host, username=user, password=password)
    stdin, stdout, stderr = ssh.exec_command("find /home/quickcombo/fresh_app -name *chat*.ts")
    print(stdout.read().decode())
    
    stdin, stdout, stderr = ssh.exec_command("find /home/quickcombo/fresh_app -name route.ts")
    print(stdout.read().decode())
    
    stdin, stdout, stderr = ssh.exec_command("find /home/quickcombo/fresh_app -name *.ts -exec grep -l 'google.generativeai' {} +")
    print(stdout.read().decode())
finally:
    ssh.close()
