import paramiko
import os

# Credentials
HOST = "ssh-quickcombo.alwaysdata.net"
USER = "quickcombo"
PASS = "Dinesh@061004"
LIVE_ROOT = "/home/quickcombo/quickcombo_app"
BACKEND_ROOT = "/home/quickcombo/www/quickcombo_backend"

def sync_all():
    print("🚀 STARTING FINAL DOMAIN MIGRATION SYNC...")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(HOST, username=USER, password=PASS)
        print("✅ Connected to AlwaysData.")
        
        sftp = ssh.open_sftp()
        local_settings = r"c:\Placement project\Quickcombo\quickcombo\settings.py"
        
        # Sync settings.py to both directories
        for remote_dir in [LIVE_ROOT, BACKEND_ROOT]:
            remote_path = f"{remote_dir}/quickcombo/settings.py"
            print(f"📤 Uploading settings.py to {remote_dir}...")
            sftp.put(local_settings, remote_path)
        
        sftp.close()
        
        # Hard Restart
        print("🔄 Hard Restarting Services...")
        ssh.exec_command("killall -9 uwsgi || true")
        ssh.exec_command("killall -9 python3 || true")
        ssh.exec_command(f"touch {LIVE_ROOT}/quickcombo/wsgi.py")
        ssh.exec_command(f"touch {BACKEND_ROOT}/quickcombo/wsgi.py")
        
        print("\n✨ DOMAIN MIGRATION COMPLETE!")
        print("Backend is now configured for: quickcombo.in, www.quickcombo.in")
        ssh.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    sync_all()
