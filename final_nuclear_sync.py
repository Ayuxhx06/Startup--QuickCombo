import paramiko
import os

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@06102004"

roots = [
    "/home/quickcombo/www/quickcombo_backend",
    "/home/quickcombo/quickcombo_app"
]

local_file = r"c:\Placement project\Quickcombo\api\admin_views.py"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(host, username=user, password=password)
    print("Connected to SSH.")
    sftp = ssh.open_sftp()
    
    for root in roots:
        remote_file = f"{root}/api/admin_views.py"
        print(f"Uploading to {remote_file}...")
        try:
            sftp.put(local_file, remote_file)
            print(f"Success: {remote_file}")
            # Trigger restart in this root
            ssh.exec_command(f"touch {root}/passenger_wsgi.py")
            ssh.exec_command(f"touch {root}/quickcombo/wsgi.py")
        except Exception as e:
            print(f"Failed to upload to {remote_file}: {e}")
            
    sftp.close()
    
    print("Nuclear Restart: Killing all workers...")
    ssh.exec_command("pkill -9 -u quickcombo python; pkill -9 -u quickcombo uwsgi")
    print("DONE. Checking one file content as proof...")
    
    cmd = "cat /home/quickcombo/quickcombo_app/api/admin_views.py | grep -A 5 'update_fields ='"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode())
    
finally:
    ssh.close()
