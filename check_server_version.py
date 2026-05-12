import paramiko

def check_server():
    host = "ssh-quickcombo.alwaysdata.net"
    user = "quickcombo"
    password = "Dinesh@061004"
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, username=user, password=password)
    
    # Search for the string
    stdin, stdout, stderr = ssh.exec_command('grep -r "RIDER_FIX_V2" /home/quickcombo')
    print("Search results:")
    print(stdout.read().decode())
    
    # Check current process
    stdin, stdout, stderr = ssh.exec_command('ps aux | grep python')
    print("Processes:")
    print(stdout.read().decode())
    
    ssh.close()

if __name__ == "__main__":
    check_server()
