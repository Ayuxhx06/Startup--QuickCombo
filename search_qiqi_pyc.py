import paramiko

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@06102004"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(host, username=user, password=password)
    stdin, stdout, stderr = ssh.exec_command("find /home/quickcombo -name '*.pyc' -exec grep -l 'Qiqi' {} +")
    print("PYC FILES WITH Qiqi:")
    print(stdout.read().decode())
    
    stdin, stdout, stderr = ssh.exec_command("find /home/quickcombo -name '*.py' -exec grep -l 'Qiqi' {} +")
    print("PY FILES WITH Qiqi:")
    print(stdout.read().decode())
finally:
    ssh.close()
