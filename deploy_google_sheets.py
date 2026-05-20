import paramiko
import os

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@061004"

# Files for Google Sheets update
sync_map = {
    # Backend logic
    r"c:\Placement project\Quickcombo\api\views.py": [
        "/home/quickcombo/www/quickcombo_backend/api/views.py",
        "/home/quickcombo/quickcombo_app/api/views.py"
    ],
    r"c:\Placement project\Quickcombo\api\utils_sheets.py": [
        "/home/quickcombo/www/quickcombo_backend/api/utils_sheets.py",
        "/home/quickcombo/quickcombo_app/api/utils_sheets.py"
    ],
    r"c:\Placement project\Quickcombo\api\admin_views.py": [
        "/home/quickcombo/www/quickcombo_backend/api/admin_views.py",
        "/home/quickcombo/quickcombo_app/api/admin_views.py"
    ],
    # Credentials
    r"c:\Placement project\Quickcombo\api\service_account.json": [
        "/home/quickcombo/www/quickcombo_backend/api/service_account.json",
        "/home/quickcombo/quickcombo_app/api/service_account.json"
    ],
    # Config
    r"c:\Placement project\Quickcombo\.env": [
        "/home/quickcombo/www/quickcombo_backend/.env",
        "/home/quickcombo/quickcombo_app/.env"
    ],
    r"c:\Placement project\Quickcombo\frontend\app\admin\page.tsx": [
        "/home/quickcombo/quickcombo_app/frontend/app/admin/page.tsx",
        "/home/quickcombo/fresh_app/app/admin/page.tsx",
        "/home/quickcombo/www/quickcombo_backend/frontend/app/admin/page.tsx"
    ],
    r"c:\Placement project\Quickcombo\frontend\app\orders\[id]\page.tsx": [
        "/home/quickcombo/quickcombo_app/frontend/app/orders/[id]/page.tsx",
        "/home/quickcombo/fresh_app/app/orders/[id]/page.tsx",
        "/home/quickcombo/www/quickcombo_backend/frontend/app/orders/[id]/page.tsx"
    ],
    r"c:\Placement project\Quickcombo\frontend\app\rider\[id]\page.tsx": [
        "/home/quickcombo/quickcombo_app/frontend/app/rider/[id]/page.tsx",
        "/home/quickcombo/fresh_app/app/rider/[id]/page.tsx",
        "/home/quickcombo/www/quickcombo_backend/frontend/app/rider/[id]/page.tsx"
    ],
    r"c:\Placement project\Quickcombo\build_frontend.py": [
        "/home/quickcombo/quickcombo_app/build_frontend.py",
        "/home/quickcombo/fresh_app/build_frontend.py",
        "/home/quickcombo/www/quickcombo_backend/frontend/build_frontend.py"
    ],
}

def trigger_frontend_build(ssh):
    print("Triggering frontend build in WWW folder (this may take a few minutes)...")
    # Using absolute path to next to be safe. We'll try to build in the www folder.
    # We'll use very low RAM limit to avoid being killed.
    cmd = 'cd /home/quickcombo/www/quickcombo_backend/frontend && NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS="--max-old-space-size=250" ./node_modules/.bin/next build --no-lint'
    ssh.exec_command(cmd)
    
    # Also trigger in fresh_app just in case
    cmd2 = 'cd /home/quickcombo/fresh_app && NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS="--max-old-space-size=250" ./node_modules/.bin/next build --no-lint'
    ssh.exec_command(cmd2)
    
    print("Builds triggered in both WWW and fresh_app. Check site in 5-10 minutes.")

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
        
        for remote in remotes:
            try:
                print(f"Uploading {os.path.basename(local)} -> {remote}...")
                sftp.put(local, remote)
            except Exception as e:
                print(f"Failed to upload to {remote}: {e}")
    
    sftp.close()
    
    # Install dependencies on server
    print("Installing backend dependencies on server...")
    ssh.exec_command("cd /home/quickcombo/www/quickcombo_backend && /home/quickcombo/www/quickcombo_backend/venv/bin/pip install gspread google-auth")

    # Restart Backend
    print("Restarting Backend...")
    ssh.exec_command("touch /home/quickcombo/www/quickcombo_backend/passenger_wsgi.py")
    ssh.exec_command("touch /home/quickcombo/quickcombo_app/passenger_wsgi.py")
    
    trigger_frontend_build(ssh)

    print("Deployment complete! The Google Sheet should now update on the live site.")
    
finally:
    ssh.close()
