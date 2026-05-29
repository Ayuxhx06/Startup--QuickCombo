import paramiko

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@06102004"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(host, username=user, password=password)
    stdin, stdout, stderr = ssh.exec_command("grep -rn 'generativelanguage' /home/quickcombo/www/quickcombo_backend")
    print("BACKEND:", stdout.read().decode())
    
    stdin, stdout, stderr = ssh.exec_command("grep -rn 'generativelanguage' /home/quickcombo/quickcombo_app")
    print("APP:", stdout.read().decode())
finally:
    ssh.close()
