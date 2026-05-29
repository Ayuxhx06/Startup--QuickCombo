import paramiko

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@06102004"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(host, username=user, password=password)
    stdin, stdout, stderr = ssh.exec_command("tail -n 50 /home/quickcombo/admin/logs/apache/error.log || tail -n 50 /home/quickcombo/admin/logs/uwsgi/uwsgi.log || ls -la /home/quickcombo/admin/logs/")
    print("LOGS:")
    print(stdout.read().decode())
    print("ERR:", stderr.read().decode())
finally:
    ssh.close()
