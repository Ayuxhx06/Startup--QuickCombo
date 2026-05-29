import paramiko

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@06102004"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    print("Connecting to AlwaysData...")
    ssh.connect(host, username=user, password=password)
    
    sftp = ssh.open_sftp()
    
    local_path = r"c:\Placement project\Quickcombo\api\ai_views.py"
    remote_paths = [
        "/home/quickcombo/www/quickcombo_backend/api/ai_views.py",
        "/home/quickcombo/quickcombo_app/api/ai_views.py"
    ]
    
    for remote in remote_paths:
        try:
            sftp.put(local_path, remote)
            print(f"OK: {remote}")
        except Exception as ex:
            print(f"FAIL {remote}: {ex}")
            
    sftp.close()

    print("Restarting backend...")
    ssh.exec_command("touch /home/quickcombo/www/quickcombo_backend/passenger_wsgi.py")
    ssh.exec_command("touch /home/quickcombo/quickcombo_app/passenger_wsgi.py")
    print("Done!")
finally:
    ssh.close()
