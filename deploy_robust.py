import paramiko
import os
import time

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@061004"

files = [
    (r"c:\Placement project\Quickcombo\frontend\app\rider\[id]\page.tsx", "/home/quickcombo/fresh_app/app/rider/[id]/page.tsx"),
    (r"c:\Placement project\Quickcombo\api\views.py", "/home/quickcombo/www/quickcombo_backend/api/views.py"),
]

def run_deploy():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        print(f"Connecting to {host}...", flush=True)
        ssh.connect(host, username=user, password=password, timeout=60)
        print("Connected.", flush=True)
        
        sftp = ssh.open_sftp()
        for local, remote in files:
            if os.path.exists(local):
                print(f"Uploading {local}...", flush=True)
                sftp.put(local, remote)
            else:
                print(f"Error: {local} not found", flush=True)
        sftp.close()
        
        # Restart Backend
        print("Restarting Backend...", flush=True)
        ssh.exec_command("touch /home/quickcombo/www/quickcombo_backend/passenger_wsgi.py")
        
        # Trigger Build in Background
        print("Triggering Build in Background...", flush=True)
        # We use a unique log file to monitor progress
        log_file = f"/home/quickcombo/build_log_{int(time.time())}.txt"
        build_cmd = f'cd /home/quickcombo/fresh_app && NODE_OPTIONS="--max-old-space-size=448" nohup /home/quickcombo/fresh_app/node_modules/.bin/next build > {log_file} 2>&1 &'
        ssh.exec_command(build_cmd)
        
        print(f"Build started in background. Monitor with: tail -f {log_file} on the server.", flush=True)
        print(f"I will check the log in 30 seconds...", flush=True)
        time.sleep(30)
        
        stdin, stdout, stderr = ssh.exec_command(f"tail -n 20 {log_file}")
        print("--- LATEST BUILD LOGS ---", flush=True)
        print(stdout.read().decode(), flush=True)
        print("-------------------------", flush=True)
        
        print("Deployment triggered. Please wait 3-5 minutes for the build to finish.", flush=True)
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    run_deploy()
