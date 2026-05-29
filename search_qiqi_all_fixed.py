import paramiko

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@06102004"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(host, username=user, password=password)
    stdin, stdout, stderr = ssh.exec_command("grep -rl 'Qiqi' /home/quickcombo/www /home/quickcombo/quickcombo_app")
    
    with open('search_results.txt', 'wb') as f:
        f.write(stdout.read())
finally:
    ssh.close()
