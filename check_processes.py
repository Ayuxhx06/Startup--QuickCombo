import paramiko

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@06102004"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(host, username=user, password=password)
    stdin, stdout, stderr = ssh.exec_command("ps aux | grep python")
    print("PS AUX PYTHON:")
    print(stdout.read().decode())
    
    stdin, stdout, stderr = ssh.exec_command("ps aux | grep gunicorn")
    print("PS AUX GUNICORN:")
    print(stdout.read().decode())
finally:
    ssh.close()
