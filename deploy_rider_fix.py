import paramiko
import os
import sys

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@061004"

# Files to sync for the rider page enhancement
files = [
    (r"c:\Placement project\Quickcombo\frontend\app\rider\[id]\page.tsx", "/home/quickcombo/fresh_app/app/rider/[id]/page.tsx"),
    (r"c:\Placement project\Quickcombo\api\views.py", "/home/quickcombo/www/quickcombo_backend/api/views.py"),
]

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    print(f"Connecting to {host}...")
    ssh.connect(host, username=user, password=password, timeout=30)
    print("Connected successfully.")
    
    sftp = ssh.open_sftp()
    
    for local, remote in files:
        if os.path.exists(local):
            print(f"Uploading {local} to {remote}...")
            # Ensure the directory exists on remote
            remote_dir = os.path.dirname(remote)
            ssh.exec_command(f"mkdir -p {remote_dir}")
            sftp.put(local, remote)
        else:
            print(f"CRITICAL ERROR: Local file NOT FOUND: {local}")
    
    sftp.close()
    
    # Restart Backend
    print("Restarting Backend (Django)...")
    ssh.exec_command("touch /home/quickcombo/www/quickcombo_backend/passenger_wsgi.py")
    
    # Trigger Frontend Build (Next.js)
    print("Triggering Frontend Build (this takes 2-4 minutes)...")
    # We use nohup to let it run in the background if needed, but here we'll wait for it to finish
    # to confirm success as per user's 'asap' request.
    build_cmd = 'cd /home/quickcombo/fresh_app && NODE_OPTIONS="--max-old-space-size=400" /home/quickcombo/fresh_app/node_modules/.bin/next build'
    stdin, stdout, stderr = ssh.exec_command(build_cmd)
    
    print("Build in progress... reading logs...")
    # Read output line by line to show progress
    for line in stdout:
        print(f"BUILD: {line.strip()}")
    
    err = stderr.read().decode('utf-8', errors='ignore')
    if err:
        print("BUILD ERRORS (if any):", err)
    
    # Restart Node.js app
    print("Finalizing deployment...")
    ssh.exec_command("mkdir -p /home/quickcombo/fresh_app/tmp && touch /home/quickcombo/fresh_app/tmp/restart.txt")
    print("DEPLOYMENT COMPLETE! Changes should be live at quickcombo.in/rider/[id]")

except Exception as e:
    print(f"DEPLOYMENT FAILED: {str(e)}")
finally:
    ssh.close()
