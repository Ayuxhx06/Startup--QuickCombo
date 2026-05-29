import paramiko
import os
import sys
import glob
sys.stdout.reconfigure(encoding='utf-8')

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@06102004"

# All files to upload including new global-error.tsx
sync_map = {
    r"c:\Placement project\Quickcombo\api\models.py": [
        "/home/quickcombo/www/quickcombo_backend/api/models.py",
        "/home/quickcombo/quickcombo_app/api/models.py"
    ],
    r"c:\Placement project\Quickcombo\api\serializers.py": [
        "/home/quickcombo/www/quickcombo_backend/api/serializers.py",
        "/home/quickcombo/quickcombo_app/api/serializers.py"
    ],
    r"c:\Placement project\Quickcombo\api\admin_views.py": [
        "/home/quickcombo/www/quickcombo_backend/api/admin_views.py",
        "/home/quickcombo/quickcombo_app/api/admin_views.py"
    ],
    r"c:\Placement project\Quickcombo\api\rider_views.py": [
        "/home/quickcombo/www/quickcombo_backend/api/rider_views.py",
        "/home/quickcombo/quickcombo_app/api/rider_views.py"
    ],
    r"c:\Placement project\Quickcombo\api\utils_push.py": [
        "/home/quickcombo/www/quickcombo_backend/api/utils_push.py",
        "/home/quickcombo/quickcombo_app/api/utils_push.py"
    ],
    r"c:\Placement project\Quickcombo\frontend\app\rider\[id]\page.tsx": [
        "/home/quickcombo/fresh_app/app/rider/[id]/page.tsx",
        "/home/quickcombo/www/quickcombo_backend/frontend/app/rider/[id]/page.tsx",
        "/home/quickcombo/quickcombo_app/frontend/app/rider/[id]/page.tsx"
    ],
    r"c:\Placement project\Quickcombo\frontend\app\admin\page.tsx": [
        "/home/quickcombo/fresh_app/app/admin/page.tsx",
        "/home/quickcombo/www/quickcombo_backend/frontend/app/admin/page.tsx",
        "/home/quickcombo/quickcombo_app/frontend/app/admin/page.tsx"
    ],
    r"c:\Placement project\Quickcombo\frontend\app\delivery\dashboard\page.tsx": [
        "/home/quickcombo/fresh_app/app/delivery/dashboard/page.tsx",
        "/home/quickcombo/www/quickcombo_backend/frontend/app/delivery/dashboard/page.tsx",
        "/home/quickcombo/quickcombo_app/frontend/app/delivery/dashboard/page.tsx"
    ],
    r"c:\Placement project\Quickcombo\frontend\app\global-error.tsx": [
        "/home/quickcombo/fresh_app/app/global-error.tsx",
        "/home/quickcombo/www/quickcombo_backend/frontend/app/global-error.tsx",
        "/home/quickcombo/quickcombo_app/frontend/app/global-error.tsx"
    ],
    r"c:\Placement project\Quickcombo\frontend\next.config.ts": [
        "/home/quickcombo/fresh_app/next.config.ts",
        "/home/quickcombo/www/quickcombo_backend/frontend/next.config.ts",
        "/home/quickcombo/quickcombo_app/frontend/next.config.ts"
    ]
}

# Add all migrations
migrations_dir = r"c:\Placement project\Quickcombo\api\migrations"
migration_files = glob.glob(os.path.join(migrations_dir, "00*.py"))
for local_mig in migration_files:
    mig_basename = os.path.basename(local_mig)
    sync_map[local_mig] = [
        f"/home/quickcombo/www/quickcombo_backend/api/migrations/{mig_basename}",
        f"/home/quickcombo/quickcombo_app/api/migrations/{mig_basename}"
    ]

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    print("Connecting to AlwaysData...")
    ssh.connect(host, username=user, password=password)
    print("Connected.")

    # Check build error files first
    print("\n=== fresh_app build_error.txt ===")
    stdin, stdout, stderr = ssh.exec_command("cat /home/quickcombo/fresh_app/build_error.txt 2>/dev/null | tail -20")
    print(stdout.read().decode('utf-8', errors='replace'))

    # Kill any stuck build processes
    print("\n=== Killing any stuck build processes ===")
    stdin, stdout, stderr = ssh.exec_command("pkill -f 'next build' 2>/dev/null; echo 'done'")
    print(stdout.read().decode('utf-8', errors='replace'))

    # Ensure dirs exist
    dirs_to_create = [
        "/home/quickcombo/quickcombo_app/api/migrations",
        "/home/quickcombo/fresh_app/app/delivery/dashboard",
        "/home/quickcombo/www/quickcombo_backend/frontend/app/delivery/dashboard",
        "/home/quickcombo/quickcombo_app/frontend/app/delivery/dashboard",
        "/home/quickcombo/fresh_app/app/rider/[id]",
        "/home/quickcombo/www/quickcombo_backend/frontend/app/rider/[id]",
        "/home/quickcombo/quickcombo_app/frontend/app/rider/[id]",
    ]
    ssh.exec_command("mkdir -p " + " ".join([f'"{d}"' for d in dirs_to_create]))
    import time; time.sleep(2)

    print("\n=== Uploading files ===")
    sftp = ssh.open_sftp()
    for local, remotes in sync_map.items():
        if not os.path.exists(local):
            print(f"Local NOT FOUND: {local}")
            continue
        for remote in remotes:
            try:
                sftp.put(local, remote)
                print(f"OK: {remote}")
            except Exception as ex:
                print(f"FAIL {remote}: {ex}")
    sftp.close()

    # Install new dependencies
    print("\n=== Installing Dependencies ===")
    ssh.exec_command("pip install openpyxl google-generativeai")
    import time; time.sleep(5)

    # Run migrations
    print("\n=== Running Migrations ===")
    for path in ["/home/quickcombo/www/quickcombo_backend", "/home/quickcombo/quickcombo_app"]:
        stdin, stdout, stderr = ssh.exec_command(f"cd {path} && python manage.py migrate --run-syncdb 2>&1")
        out = stdout.read().decode('utf-8', errors='replace')
        print(f"{path}: {out[:500]}")

    # Restart backend
    print("\n=== Restarting Backend ===")
    ssh.exec_command("touch /home/quickcombo/www/quickcombo_backend/passenger_wsgi.py")
    ssh.exec_command("touch /home/quickcombo/quickcombo_app/passenger_wsgi.py")

    # Trigger builds - one at a time to avoid memory exhaustion
    print("\n=== Triggering fresh_app build (primary) ===")
    build_cmd = 'cd /home/quickcombo/fresh_app && export NODE_OPTIONS="--max-old-space-size=448" && nohup /home/quickcombo/fresh_app/node_modules/.bin/next build > build_log_fresh.txt 2>&1 &'
    ssh.exec_command(build_cmd)
    print("Build triggered for fresh_app.")

    print("\n=== Also triggering quickcombo_app build ===")
    build_cmd2 = 'cd /home/quickcombo/quickcombo_app/frontend && export NODE_OPTIONS="--max-old-space-size=448" && nohup /home/quickcombo/fresh_app/node_modules/.bin/next build > build_log_main.txt 2>&1 &'
    ssh.exec_command(build_cmd2)

    print("\nAll done. Check in 4-5 minutes.")

finally:
    ssh.close()
