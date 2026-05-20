import paramiko
import os

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@061004"

# Full list of files modified for this update
sync_map = {
    # Backend
    r"c:\Placement project\Quickcombo\api\views.py": [
        "/home/quickcombo/www/quickcombo_backend/api/views.py",
        "/home/quickcombo/quickcombo_app/api/views.py"
    ],
    r"c:\Placement project\Quickcombo\api\admin_views.py": [
        "/home/quickcombo/www/quickcombo_backend/api/admin_views.py",
        "/home/quickcombo/quickcombo_app/api/admin_views.py"
    ],
    r"c:\Placement project\Quickcombo\api\urls.py": [
        "/home/quickcombo/www/quickcombo_backend/api/urls.py",
        "/home/quickcombo/quickcombo_app/api/urls.py"
    ],
    
    # Frontend
    r"c:\Placement project\Quickcombo\frontend\app\layout.tsx": [
        "/home/quickcombo/fresh_app/app/layout.tsx",
    ],
    r"c:\Placement project\Quickcombo\frontend\app\checkout\page.tsx": [
        "/home/quickcombo/fresh_app/app/checkout/page.tsx",
    ],
    r"c:\Placement project\Quickcombo\frontend\app\admin\page.tsx": [
        "/home/quickcombo/fresh_app/app/admin/page.tsx",
    ],
    r"c:\Placement project\Quickcombo\frontend\components\AuthModal.tsx": [
        "/home/quickcombo/fresh_app/components/AuthModal.tsx",
    ],
    r"c:\Placement project\Quickcombo\frontend\context\AuthContext.tsx": [
        "/home/quickcombo/fresh_app/context/AuthContext.tsx",
    ],
    r"c:\Placement project\Quickcombo\frontend\components\MaintenanceGuard.tsx": [
        "/home/quickcombo/fresh_app/components/MaintenanceGuard.tsx",
    ],
    r"c:\Placement project\Quickcombo\frontend\components\ManualMap.tsx": [
        "/home/quickcombo/fresh_app/components/ManualMap.tsx",
    ],
    r"c:\Placement project\Quickcombo\frontend\components\TrackingMap.tsx": [
        "/home/quickcombo/fresh_app/components/TrackingMap.tsx",
    ],
    r"c:\Placement project\Quickcombo\frontend\package.json": [
        "/home/quickcombo/fresh_app/package.json",
    ],
    r"c:\Placement project\Quickcombo\frontend\package-lock.json": [
        "/home/quickcombo/fresh_app/package-lock.json",
    ],
}

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    print(f"Connecting to {host}...")
    ssh.connect(host, username=user, password=password)
    print("Connected.")
    sftp = ssh.open_sftp()
    
    for local, remotes in sync_map.items():
        if not os.path.exists(local):
            print(f"Local file NOT FOUND: {local}")
            continue
        
        # Determine remote paths (handle single string or list)
        remote_list = remotes if isinstance(remotes, list) else [remotes]
        
        for remote in remote_list:
            try:
                print(f"Uploading {os.path.basename(local)} -> {remote}...")
                sftp.put(local, remote)
            except Exception as e:
                print(f"Failed to upload to {remote}: {e}")
    
    sftp.close()
    
    # 1. Restart Backend
    print("Restarting Backend (Passenger)...")
    ssh.exec_command("touch /home/quickcombo/www/quickcombo_backend/passenger_wsgi.py")
    ssh.exec_command("touch /home/quickcombo/quickcombo_app/passenger_wsgi.py")
    
    # 2. Trigger Frontend Build
    print("Installing dependencies...")
    ssh.exec_command("cd /home/quickcombo/fresh_app && npm install")
    
    print("Triggering Frontend Build (Next.js)...")
    build_cmd = 'cd /home/quickcombo/fresh_app && export NODE_OPTIONS="--max-old-space-size=400" && /home/quickcombo/fresh_app/node_modules/.bin/next build'
    stdin, stdout, stderr = ssh.exec_command(build_cmd)
    
    # We want to wait for the build to finish to ensure it's live
    exit_status = stdout.channel.recv_exit_status()
    if exit_status == 0:
        print("Build Successful!")
    else:
        print("Build Failed. Check logs.")
        print("STDERR:", stderr.read().decode('utf-8', 'ignore'))

    # 3. Restart Frontend
    print("Restarting Frontend...")
    ssh.exec_command("mkdir -p /home/quickcombo/fresh_app/tmp && touch /home/quickcombo/fresh_app/tmp/restart.txt")
    
    print("Deployment complete! All changes are now live.")
    
finally:
    ssh.close()
