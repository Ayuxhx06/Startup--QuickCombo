import paramiko
import os

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@061004"

files = [
    (r"c:\Placement project\Quickcombo\api\views.py", "/home/quickcombo/www/quickcombo_backend/api/views.py"),
    (r"c:\Placement project\Quickcombo\api\views_payment.py", "/home/quickcombo/www/quickcombo_backend/api/views_payment.py"),
    (r"c:\Placement project\Quickcombo\api\views.py", "/home/quickcombo/quickcombo_app/api/views.py"),
    (r"c:\Placement project\Quickcombo\api\views_payment.py", "/home/quickcombo/quickcombo_app/api/views_payment.py"),
]

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(host, username=user, password=password)
    sftp = ssh.open_sftp()
    for local, remote in files:
        if os.path.exists(local):
            print(f"Uploading {local} to {remote}...")
            sftp.put(local, remote)
    sftp.close()
    
    print("Restarting backend apps...")
    ssh.exec_command("touch /home/quickcombo/www/quickcombo_backend/passenger_wsgi.py")
    ssh.exec_command("touch /home/quickcombo/quickcombo_app/passenger_wsgi.py")
    print("Done!")
finally:
    ssh.close()
