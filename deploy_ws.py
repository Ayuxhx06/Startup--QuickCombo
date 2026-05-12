import paramiko
import os

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@061004"

def deploy_ws():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(host, username=user, password=password)
        print("Connected to Alwaysdata.")
        
        sftp = ssh.open_sftp()
        
        # Create directory
        remote_dir = "/home/quickcombo/websocket-server"
        try:
            sftp.mkdir(remote_dir)
        except:
            pass
            
        # Upload files
        local_dir = r"c:\Placement project\Quickcombo\websocket-server"
        for f in ['server.js', 'package.json']:
            local_path = os.path.join(local_dir, f)
            remote_path = os.path.join(remote_dir, f)
            print(f"Uploading {f}...")
            sftp.put(local_path, remote_path)
            
        sftp.close()
        
        # Install and Start
        print("Installing dependencies...")
        ssh.exec_command(f"cd {remote_dir} && npm install")
        
        print("Starting WebSocket server...")
        # Kill existing if any
        ssh.exec_command("pkill -f 'node server.js'")
        # Start in background
        ssh.exec_command(f"cd {remote_dir} && nohup npm start > ws_log.txt 2>&1 &")
        
        print("WebSocket deployment triggered!")
    finally:
        ssh.close()

if __name__ == "__main__":
    deploy_ws()
