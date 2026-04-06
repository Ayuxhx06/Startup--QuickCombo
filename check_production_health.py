import paramiko
import os

def check_remote_health():
    host = "ssh-quickcombo.alwaysdata.net"
    user = "quickcombo"
    password = "Dinesh@061004"
    LIVE_ROOT = "/home/quickcombo/quickcombo_app"
    
    print(f"Connecting to {host}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(host, username=user, password=password)
        print("Connected!")
        
        # 1. Check if django is running and its environment variables
        cmd = f"cd {LIVE_ROOT} && python3 manage.py shell -c 'from django.conf import settings; import os; print(\"DB:\", settings.DATABASES[\"default\"][\"ENGINE\"]); print(\"URL:\", os.environ.get(\"DATABASE_URL\", \"NOT_SET\")[:20] + \"...\")'"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print("\n--- REMOTE DB STATUS ---")
        print(stdout.read().decode().strip())
        print(stderr.read().decode().strip())

        # 2. Check if tables are empty in production
        cmd = f"cd {LIVE_ROOT} && python3 manage.py shell -c 'from api.models import Restaurant; print(\"Restaurant Count:\", Restaurant.objects.count())'"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print("\n--- REMOTE DATA STATUS ---")
        print(stdout.read().decode().strip())
        
        ssh.close()
    except Exception as e:
        print(f"❌ SSH Error: {e}")

if __name__ == "__main__":
    check_remote_health()
