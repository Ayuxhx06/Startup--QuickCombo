import paramiko
import os

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@061004"

files = [
    (r"c:\Placement project\Quickcombo\api\views.py", "/home/quickcombo/www/quickcombo_backend/api/views.py"),
    (r"c:\Placement project\Quickcombo\api\urls.py", "/home/quickcombo/www/quickcombo_backend/api/urls.py"),
    (r"c:\Placement project\Quickcombo\api\views.py", "/home/quickcombo/quickcombo_app/api/views.py"),
    (r"c:\Placement project\Quickcombo\api\urls.py", "/home/quickcombo/quickcombo_app/api/urls.py"),
    (r"c:\Placement project\Quickcombo\frontend\components\ManualMap.tsx", "/home/quickcombo/fresh_app/components/ManualMap.tsx"),
    (r"c:\Placement project\Quickcombo\frontend\components\ManualMap.tsx", "/home/quickcombo/www/quickcombo_backend/frontend/components/ManualMap.tsx"),
    (r"c:\Placement project\Quickcombo\frontend\components\ManualMap.tsx", "/home/quickcombo/quickcombo_app/frontend/components/ManualMap.tsx"),
    (r"c:\Placement project\Quickcombo\frontend\components\TrackingMap.tsx", "/home/quickcombo/fresh_app/components/TrackingMap.tsx"),
    (r"c:\Placement project\Quickcombo\frontend\components\TrackingMap.tsx", "/home/quickcombo/www/quickcombo_backend/frontend/components/TrackingMap.tsx"),
    (r"c:\Placement project\Quickcombo\frontend\components\TrackingMap.tsx", "/home/quickcombo/quickcombo_app/frontend/components/TrackingMap.tsx"),
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
            try:
                sftp.put(local, remote)
            except Exception as e:
                print(f"Failed {remote}: {e}")
                
    sftp.close()
    
    # Restart Backend
    print("Restarting backend...")
    ssh.exec_command("touch /home/quickcombo/www/quickcombo_backend/passenger_wsgi.py")
    ssh.exec_command("touch /home/quickcombo/quickcombo_app/passenger_wsgi.py")
    ssh.exec_command("touch /home/quickcombo/www/quickcombo_backend/quickcombo/wsgi.py")
    
    # Trigger frontend build
    print("Triggering frontend build...")
    ssh.exec_command('cd /home/quickcombo/fresh_app && export NODE_OPTIONS="--max-old-space-size=400" && nohup /home/quickcombo/fresh_app/node_modules/.bin/next build > build_log_fresh.txt 2>&1 &')
    
    print("Deploy triggered successfully!")
finally:
    ssh.close()
