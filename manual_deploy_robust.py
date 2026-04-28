import paramiko
import os
import sys

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@061004"

files = [
    (r"c:\Placement project\Quickcombo\api\views.py", "/home/quickcombo/www/quickcombo_backend/api/views.py"),
    (r"c:\Placement project\Quickcombo\api\views_payment.py", "/home/quickcombo/www/quickcombo_backend/api/views_payment.py"),
    (r"c:\Placement project\Quickcombo\frontend\app\checkout\page.tsx", "/home/quickcombo/fresh_app/app/checkout/page.tsx"),
    (r"c:\Placement project\Quickcombo\frontend\components\CartPanel.tsx", "/home/quickcombo/fresh_app/components/CartPanel.tsx"),
]

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(host, username=user, password=password)
    print("Connected.")
    sftp = ssh.open_sftp()
    
    for local, remote in files:
        if os.path.exists(local):
            print(f"Uploading {local} to {remote}...")
            sftp.put(local, remote)
        else:
            print(f"SKIPPING {local} (not found)")
    
    sftp.close()
    
    # Restart backend
    print("Restarting backend...")
    ssh.exec_command("touch /home/quickcombo/www/quickcombo_backend/passenger_wsgi.py")
    ssh.exec_command("touch /home/quickcombo/www/quickcombo_backend/quickcombo/wsgi.py")
    
    # Trigger frontend build
    print("Triggering frontend build (this takes 2-3 mins)...")
    # Redirect to file and don't wait in this thread to avoid timeout/encode issues
    build_cmd = 'cd /home/quickcombo/fresh_app && NODE_OPTIONS="--max-old-space-size=400" npm run build > build_log.txt 2>&1'
    ssh.exec_command(build_cmd)
    
    print("Build triggered. It will run in the background on the server.")
    print("Check https://quickcombo.in in a few minutes.")
    
finally:
    ssh.close()
