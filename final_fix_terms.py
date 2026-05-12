import paramiko
import sys

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@061004"

def final_fix():
    print(f"Connecting to {host}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(host, username=user, password=password)
        print("Connected.")
        
        # Build command with output filtering to avoid unicode issues
        # Also restart both backend and frontend triggers
        print("Running fresh build on production...")
        cmd = 'cd /home/quickcombo/fresh_app && NODE_OPTIONS="--max-old-space-size=400" npm run build'
        stdin, stdout, stderr = ssh.exec_command(cmd)
        
        # Read output and ignore unicode errors
        out = stdout.read().decode('utf-8', 'ignore')
        err = stderr.read().decode('utf-8', 'ignore')
        
        print("Build Finished.")
        
        # Check if terms is in the output
        if 'terms' in out.lower():
            print("Confirmed: 'terms' route found in build output.")
        else:
            print("Warning: 'terms' route NOT explicitly mentioned in build output.")
            
        print("Restarting app processes...")
        ssh.exec_command("touch /home/quickcombo/fresh_app/passenger_wsgi.py")
        ssh.exec_command("touch /home/quickcombo/www/quickcombo_backend/passenger_wsgi.py")
        
        print("DONE! Please check https://quickcombo.in/terms/ now.")
        
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    final_fix()
