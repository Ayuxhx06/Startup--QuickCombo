import paramiko
import os

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@06102004"

sync_files = {
    r"c:\Placement project\Quickcombo\api\models.py": "/home/quickcombo/www/quickcombo_backend/api/models.py",
    r"c:\Placement project\Quickcombo\api\serializers.py": "/home/quickcombo/www/quickcombo_backend/api/serializers.py",
    r"c:\Placement project\Quickcombo\api\rider_views.py": "/home/quickcombo/www/quickcombo_backend/api/rider_views.py",
    r"c:\Placement project\Quickcombo\api\urls.py": "/home/quickcombo/www/quickcombo_backend/api/urls.py",
    r"c:\Placement project\Quickcombo\api\migrations\0014_order_assigned_rider_user_is_rider.py": "/home/quickcombo/www/quickcombo_backend/api/migrations/0014_order_assigned_rider_user_is_rider.py"
}

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=password)
sftp = ssh.open_sftp()

for local_path, remote_path in sync_files.items():
    print(f"Uploading {local_path} -> {remote_path}")
    try:
        sftp.put(local_path, remote_path)
    except Exception as e:
        print(f"Failed to upload: {e}")

print("Running migrate...")
stdin, stdout, stderr = ssh.exec_command("cd /home/quickcombo/www/quickcombo_backend && source venv/bin/activate && python manage.py migrate")
print(stdout.read().decode())
print(stderr.read().decode())

print("Restarting Django server...")
ssh.exec_command("touch /home/quickcombo/www/quickcombo_backend/tmp/restart.txt")

sftp.close()
ssh.close()
print("Backend deployment complete.")
