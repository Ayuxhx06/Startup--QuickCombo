import paramiko

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@06102004"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(host, username=user, password=password)
    # forcefully kill all python processes
    stdin, stdout, stderr = ssh.exec_command("killall -9 python; killall -9 uwsgi; pkill -9 -f python")
    print(stdout.read().decode())
    
    # touch passenger restart file just in case it uses passenger
    ssh.exec_command("mkdir -p /home/quickcombo/www/quickcombo_backend/tmp")
    ssh.exec_command("touch /home/quickcombo/www/quickcombo_backend/tmp/restart.txt")
finally:
    ssh.close()
