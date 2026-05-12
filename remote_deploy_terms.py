import paramiko
import os

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@061004"

files = [
    (r"c:\Placement project\Quickcombo\frontend\app\page.tsx", "/home/quickcombo/fresh_app/app/page.tsx"),
    (r"c:\Placement project\Quickcombo\frontend\app\terms\page.tsx", "/home/quickcombo/fresh_app/app/terms/page.tsx"),
]

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(host, username=user, password=password)
    print("Connected.")
    sftp = ssh.open_sftp()
    
    # Ensure directory exists
    try:
        sftp.mkdir("/home/quickcombo/fresh_app/app/terms")
    except:
        pass

    for local, remote in files:
        print(f"Uploading {local} to {remote}...")
        sftp.put(local, remote)
    
    sftp.close()
    
    # Trigger frontend build
    print("Triggering frontend build (this takes a few mins)...")
    cmd = 'cd /home/quickcombo/fresh_app && NODE_OPTIONS="--max-old-space-size=400" npm run build'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    # Wait for build to finish
    out = stdout.read().decode()
    err = stderr.read().decode()
    print("STDOUT:", out)
    if err:
        print("STDERR:", err)
    
    print("DEPLOYMENT COMPLETE!")
    
finally:
    ssh.close()
