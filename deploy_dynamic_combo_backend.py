import paramiko

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@06102004"
local_path = "c:\\Placement project\\Quickcombo\\api\\ai_views.py"
remote_path = "/home/quickcombo/www/quickcombo_backend/api/ai_views.py"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(host, username=user, password=password)
    
    # Update the code
    sftp = ssh.open_sftp()
    sftp.put(local_path, remote_path)
    sftp.close()
    
    # Restart the application
    ssh.exec_command('mkdir -p /home/quickcombo/www/quickcombo_backend/tmp && touch /home/quickcombo/www/quickcombo_backend/tmp/restart.txt')
    print("Successfully uploaded ai_views.py and restarted uWSGI")
finally:
    ssh.close()
