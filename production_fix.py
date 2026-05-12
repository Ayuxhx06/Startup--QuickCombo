import paramiko
import os

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@061004"

# Files modified in this task
files = [
    (r"c:\Placement project\Quickcombo\frontend\app\terms\page.tsx", "/home/quickcombo/fresh_app/app/terms/page.tsx"),
    (r"c:\Placement project\Quickcombo\frontend\app\privacy\page.tsx", "/home/quickcombo/fresh_app/app/privacy/page.tsx"),
    (r"c:\Placement project\Quickcombo\frontend\app\checkout\page.tsx", "/home/quickcombo/fresh_app/app/checkout/page.tsx"),
    (r"c:\Placement project\Quickcombo\frontend\app\menu\page.tsx", "/home/quickcombo/fresh_app/app/menu/page.tsx"),
    (r"c:\Placement project\Quickcombo\frontend\app\profile\page.tsx", "/home/quickcombo/fresh_app/app/profile/page.tsx"),
    (r"c:\Placement project\Quickcombo\frontend\components\AuthModal.tsx", "/home/quickcombo/fresh_app/components/AuthModal.tsx"),
]

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(host, username=user, password=password)
    print("Connected to production server.")
    sftp = ssh.open_sftp()
    
    # Ensure directories exist
    dirs_to_make = [
        "/home/quickcombo/fresh_app/app/terms",
        "/home/quickcombo/fresh_app/app/privacy",
        "/home/quickcombo/fresh_app/components"
    ]
    
    for d in dirs_to_make:
        try:
            sftp.mkdir(d)
            print(f"Created directory: {d}")
        except:
            pass

    for local, remote in files:
        if os.path.exists(local):
            print(f"Uploading {os.path.basename(local)}...")
            sftp.put(local, remote)
        else:
            print(f"Skipping {local} (not found)")
    
    sftp.close()
    
    # Trigger build
    print("Restarting build process on server (this may take 2-3 mins)...")
    # Using NODE_OPTIONS to avoid memory issues on shared hosting
    cmd = 'cd /home/quickcombo/fresh_app && NODE_OPTIONS="--max-old-space-size=512" npm run build'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    # We'll read the output to ensure it finished
    exit_status = stdout.channel.recv_exit_status()
    print(f"Build process exited with status: {exit_status}")
    
    if exit_status == 0:
        print("Build successful! Refreshing passenger...")
        ssh.exec_command("touch /home/quickcombo/fresh_app/passenger_wsgi.py")
        print("DEPLOYMENT SUCCESSFUL. Please check quickcombo.in/terms and quickcombo.in/privacy")
    else:
        print("BUILD FAILED. Errors:")
        print(stderr.read().decode())
    
finally:
    ssh.close()
