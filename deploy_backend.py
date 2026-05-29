import paramiko
import os
import sys

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@06102004"
remote_base = "/home/quickcombo/www/quickcombo_backend/api"
local_base = "c:\\Placement project\\Quickcombo\\api"

files_to_upload = [
    ("models.py", f"{remote_base}/models.py"),
    ("views.py", f"{remote_base}/views.py"),
    ("admin_views.py", f"{remote_base}/admin_views.py"),
    ("urls.py", f"{remote_base}/urls.py"),
]

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(host, username=user, password=password)
    sftp = ssh.open_sftp()

    for local_name, remote_path in files_to_upload:
        local_path = os.path.join(local_base, local_name)
        sftp.put(local_path, remote_path)
        print(f"[OK] Uploaded {local_name}")

    sftp.close()

    print("\n[...] Running migrations...")
    stdin, stdout, stderr = ssh.exec_command(
        'cd /home/quickcombo/www/quickcombo_backend && '
        'python manage.py makemigrations api --no-input 2>&1 && '
        'python manage.py migrate --no-input 2>&1'
    )
    out = stdout.read().decode()
    err = stderr.read().decode()
    print("STDOUT:", out)
    if err:
        print("STDERR:", err)

    print("\n[...] Restarting uWSGI...")
    ssh.exec_command('mkdir -p /home/quickcombo/www/quickcombo_backend/tmp && touch /home/quickcombo/www/quickcombo_backend/tmp/restart.txt')
    print("[DONE] Backend deployed with migrations.")

finally:
    ssh.close()
