import paramiko
import os

def sync_next_folder():
    host = 'ssh-quickcombo.alwaysdata.net'
    user = 'quickcombo'
    pas = 'Dinesh@061004'
    
    local_next = r'c:\Placement project\Quickcombo\frontend\.next'
    remote_path = '/home/quickcombo/fresh_app/.next'

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(host, username=user, password=pas)
        print("Connected!")
        sftp = ssh.open_sftp()

        def ensure_remote_dir(remote_dir):
            parts = remote_dir.split('/')
            for i in range(2, len(parts) + 1):
                p = '/'.join(parts[:i])
                try:
                    sftp.mkdir(p)
                except:
                    pass

        def upload_item(local_item, remote_item):
            if os.path.isfile(local_item):
                print(f"Uploading {item_name}")
                sftp.put(local_item, remote_item)
            else:
                ensure_remote_dir(remote_item)
                for sub in os.listdir(local_item):
                    upload_item(os.path.join(local_item, sub), remote_item + '/' + sub)

        # Essential production files/folders
        to_sync = ['server', 'static', 'BUILD_ID', 'build-manifest.json', 'routes-manifest.json', 'required-server-files.json']
        
        ensure_remote_dir(remote_path)
        for item_name in to_sync:
            local_item = os.path.join(local_next, item_name)
            remote_item = remote_path + '/' + item_name
            if os.path.exists(local_item):
                upload_item(local_item, remote_item)
        
        print("Sync complete.")
        print("Restarting Passenger...")
        ssh.exec_command("touch /home/quickcombo/www/fresh_app/tmp/restart.txt") # Standard Node restart
        ssh.exec_command("touch /home/quickcombo/www/quickcombo_backend/passenger_wsgi.py")
        
    finally:
        ssh.close()

if __name__ == "__main__":
    sync_next_folder()
