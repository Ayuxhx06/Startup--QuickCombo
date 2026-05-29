import paramiko

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@06102004"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(host, username=user, password=password)
    ssh.exec_command("touch /home/quickcombo/quickcombo_app/passenger_wsgi.py")
    ssh.exec_command("touch /home/quickcombo/quickcombo_app/tmp/restart.txt")
    ssh.exec_command("touch /home/quickcombo/www/quickcombo_backend/passenger_wsgi.py")
    ssh.exec_command("touch /home/quickcombo/www/quickcombo_backend/tmp/restart.txt")
    print("Touched all wsgi files")
finally:
    ssh.close()
