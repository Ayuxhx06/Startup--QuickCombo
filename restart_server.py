import paramiko

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@06102004"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(host, username=user, password=password)
    
    cmd = "killall node"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    print(stdout.read().decode())
    print(stderr.read().decode())
    print("Node processes killed. AlwaysData will auto-restart them.")
    
finally:
    ssh.close()
