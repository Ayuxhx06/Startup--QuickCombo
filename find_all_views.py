import paramiko

def find_views():
    host = "ssh-quickcombo.alwaysdata.net"
    user = "quickcombo"
    password = "Dinesh@061004"
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, username=user, password=password)
    
    cmd = 'find /home/quickcombo -name views.py -exec grep -H "version_timestamp" {} +'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print("Found views.py with version_timestamp:")
    print(stdout.read().decode())
    
    ssh.close()

if __name__ == "__main__":
    find_views()
