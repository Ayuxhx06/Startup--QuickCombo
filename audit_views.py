import paramiko

def check_all_views():
    host = "ssh-quickcombo.alwaysdata.net"
    user = "quickcombo"
    password = "Dinesh@061004"
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, username=user, password=password)
    
    # List all views.py with details
    cmd = 'find /home/quickcombo -name views.py -ls'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print("All views.py files:")
    print(stdout.read().decode())
    
    # Check if any views.py has "MAPBOX_FIX"
    cmd = 'find /home/quickcombo -name views.py -exec grep -l "MAPBOX_FIX" {} +'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print("Files containing 'MAPBOX_FIX':")
    print(stdout.read().decode())
    
    ssh.close()

if __name__ == "__main__":
    check_all_views()
