import paramiko
import os

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@061004"

files = [
    (r"c:\Placement project\Quickcombo\api\views.py", "/home/quickcombo/www/quickcombo_backend/api/views.py"),
    (r"c:\Placement project\Quickcombo\api\views_payment.py", "/home/quickcombo/www/quickcombo_backend/api/views_payment.py"),
    (r"c:\Placement project\Quickcombo\frontend\app\checkout\page.tsx", "/home/quickcombo/fresh_app/app/checkout/page.tsx"),
]

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(host, username=user, password=password)
    print("Connected.")
    sftp = ssh.open_sftp()
    
    for local, remote in files:
        print(f"Uploading {local} to {remote}...")
        sftp.put(local, remote)
    
    sftp.close()
    
    # Restart backend
    print("Restarting backend...")
    ssh.exec_command("touch /home/quickcombo/www/quickcombo_backend/passenger_wsgi.py")
    
    # Trigger frontend build
    print("Triggering frontend build...")
    cmd = 'cd /home/quickcombo/fresh_app && NODE_OPTIONS="--max-old-space-size=400" npm run build'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    # Wait for build to finish
    print("Build started, waiting...")
    out = stdout.read().decode()
    err = stderr.read().decode()
    print("STDOUT:", out)
    print("STDERR:", err)
    
    print("DEPLOYMENT COMPLETE!")
    
finally:
    ssh.close()
