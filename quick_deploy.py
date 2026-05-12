import paramiko
import os
import sys

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@061004"

files = [
    (r"c:\Placement project\Quickcombo\frontend\app\page.tsx", "/home/quickcombo/fresh_app/app/page.tsx"),
    (r"c:\Placement project\Quickcombo\frontend\next.config.ts", "/home/quickcombo/fresh_app/next.config.ts"),
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
    
    # Trigger frontend build synchronously so we can see output
    print("Triggering frontend build...")
    build_cmd = 'cd /home/quickcombo/fresh_app && NODE_OPTIONS="--max-old-space-size=400" /home/quickcombo/fresh_app/node_modules/.bin/next build'
    stdin, stdout, stderr = ssh.exec_command(build_cmd)
    
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    print("STDOUT:", out[-1000:])
    print("STDERR:", err[-1000:])
    
    # Restart Node.js app
    print("Restarting app...")
    ssh.exec_command("mkdir -p /home/quickcombo/fresh_app/tmp && touch /home/quickcombo/fresh_app/tmp/restart.txt")
    print("Deployment complete!")
finally:
    ssh.close()
