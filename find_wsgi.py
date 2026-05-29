import paramiko

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@06102004"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(host, username=user, password=password)
    # find where passenger_wsgi.py is
    stdin, stdout, stderr = ssh.exec_command("find /home/quickcombo -name passenger_wsgi.py")
    print(stdout.read().decode())
finally:
    ssh.close()
