import paramiko
import os

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@061004"

# Mapping local files to multiple potential remote paths
sync_map = {
    r"c:\Placement project\Quickcombo\api\views.py": [
        "/home/quickcombo/www/quickcombo_backend/api/views.py",
        "/home/quickcombo/quickcombo_app/api/views.py"
    ],
    r"c:\Placement project\Quickcombo\api\views_payment.py": [
        "/home/quickcombo/www/quickcombo_backend/api/views_payment.py",
        "/home/quickcombo/quickcombo_app/api/views_payment.py"
    ],
    r"c:\Placement project\Quickcombo\frontend\app\checkout\page.tsx": [
        "/home/quickcombo/fresh_app/app/checkout/page.tsx",
        "/home/quickcombo/www/quickcombo_backend/frontend/app/checkout/page.tsx",
        "/home/quickcombo/quickcombo_app/frontend/app/checkout/page.tsx"
    ],
    r"c:\Placement project\Quickcombo\frontend\components\BottomNav.tsx": [
        "/home/quickcombo/fresh_app/components/BottomNav.tsx",
        "/home/quickcombo/www/quickcombo_backend/frontend/components/BottomNav.tsx",
        "/home/quickcombo/quickcombo_app/frontend/components/BottomNav.tsx"
    ],
    r"c:\Placement project\Quickcombo\frontend\app\about\page.tsx": [
        "/home/quickcombo/www/quickcombo_backend/frontend/app/about/page.tsx",
        "/home/quickcombo/quickcombo_app/frontend/app/about/page.tsx"
    ],
    r"c:\Placement project\Quickcombo\frontend\components\CartPanel.tsx": [
        "/home/quickcombo/fresh_app/components/CartPanel.tsx",
        "/home/quickcombo/www/quickcombo_backend/frontend/components/CartPanel.tsx",
        "/home/quickcombo/quickcombo_app/frontend/components/CartPanel.tsx"
    ],
    r"c:\Placement project\Quickcombo\frontend\app\admin\page.tsx": [
        "/home/quickcombo/fresh_app/app/admin/page.tsx",
        "/home/quickcombo/www/quickcombo_backend/frontend/app/admin/page.tsx"
    ],
    r"c:\Placement project\Quickcombo\frontend\app\page.tsx": [
        "/home/quickcombo/fresh_app/app/page.tsx",
        "/home/quickcombo/www/quickcombo_backend/frontend/app/page.tsx",
        "/home/quickcombo/quickcombo_app/frontend/app/page.tsx"
    ],
    r"c:\Placement project\Quickcombo\frontend\components\MenuModal.tsx": [
        "/home/quickcombo/fresh_app/components/MenuModal.tsx",
        "/home/quickcombo/www/quickcombo_backend/frontend/components/MenuModal.tsx",
        "/home/quickcombo/quickcombo_app/frontend/components/MenuModal.tsx"
    ],
    r"c:\Placement project\Quickcombo\frontend\components\FoodCard.tsx": [
        "/home/quickcombo/fresh_app/components/FoodCard.tsx",
        "/home/quickcombo/www/quickcombo_backend/frontend/components/FoodCard.tsx",
        "/home/quickcombo/quickcombo_app/frontend/components/FoodCard.tsx"
    ],
    r"c:\Placement project\Quickcombo\frontend\app\menu\page.tsx": [
        "/home/quickcombo/fresh_app/app/menu/page.tsx",
        "/home/quickcombo/www/quickcombo_backend/frontend/app/menu/page.tsx",
        "/home/quickcombo/quickcombo_app/frontend/app/menu/page.tsx"
    ],
    r"c:\Placement project\Quickcombo\frontend\components\CategoryMenu.tsx": [
        "/home/quickcombo/fresh_app/components/CategoryMenu.tsx",
        "/home/quickcombo/www/quickcombo_backend/frontend/components/CategoryMenu.tsx",
        "/home/quickcombo/quickcombo_app/frontend/components/CategoryMenu.tsx"
    ],
    r"c:\Placement project\Quickcombo\frontend\components\ManualAddBox.tsx": [
        "/home/quickcombo/fresh_app/components/ManualAddBox.tsx",
        "/home/quickcombo/www/quickcombo_backend/frontend/components/ManualAddBox.tsx"
    ],
    r"c:\Placement project\Quickcombo\frontend\context\CartContext.tsx": [
        "/home/quickcombo/fresh_app/context/CartContext.tsx",
        "/home/quickcombo/www/quickcombo_backend/frontend/context/CartContext.tsx"
    ]
}






ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(host, username=user, password=password)
    print("Connected.")
    sftp = ssh.open_sftp()
    
    for local, remotes in sync_map.items():
        if not os.path.exists(local):
            print(f"Local file NOT FOUND: {local}")
            continue
        for remote in remotes:
            try:
                # Ensure directory exists (simplified, assuming parents exist)
                print(f"Uploading to {remote}...")
                sftp.put(local, remote)
            except Exception as e:
                print(f"Failed to upload to {remote}: {e}")
    
    sftp.close()
    
    # Restart Backend
    print("Restarting Backend...")
    ssh.exec_command("touch /home/quickcombo/www/quickcombo_backend/passenger_wsgi.py")
    
    # Trigger builds for both potential frontend locations
    print("Triggering builds...")
    build_cmds = [
        'cd /home/quickcombo/fresh_app && export NODE_OPTIONS="--max-old-space-size=400" && nohup /home/quickcombo/fresh_app/node_modules/.bin/next build > build_log_fresh.txt 2>&1 &',
        'cd /home/quickcombo/www/quickcombo_backend/frontend && export NODE_OPTIONS="--max-old-space-size=400" && nohup /home/quickcombo/fresh_app/node_modules/.bin/next build > build_log_backend.txt 2>&1 &',
        'cd /home/quickcombo/quickcombo_app/frontend && export NODE_OPTIONS="--max-old-space-size=400" && nohup /home/quickcombo/fresh_app/node_modules/.bin/next build > build_log_main.txt 2>&1 &'
    ]






    for cmd in build_cmds:
        print(f"Running: {cmd}")
        ssh.exec_command(cmd)
    
    print("Deployment triggered. Check site in 3-5 mins.")
    
finally:
    ssh.close()
