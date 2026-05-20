import paramiko
import sys

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@06102004"

local_file = r"c:\Placement project\Quickcombo\api\admin_views.py"
remote_file = "/home/quickcombo/www/quickcombo_backend/api/admin_views.py"

try:
    print("Connecting...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, username=user, password=password, timeout=10)
    print("Connected. Opening SFTP...")
    sftp = ssh.open_sftp()
    
    print(f"Uploading {local_file} to {remote_file}...")
    sftp.put(local_file, remote_file)
    print("Upload complete!")
    sftp.close()
    
    print("Restarting Django passenger...")
    ssh.exec_command("touch /home/quickcombo/www/quickcombo_backend/passenger_wsgi.py")
    print("Done!")
except Exception as e:
    print(f"Failed: {e}")
finally:
    ssh.close()
