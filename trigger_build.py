import paramiko

def trigger_remote_build():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect('ssh-quickcombo.alwaysdata.net', username='quickcombo', password='Dinesh@061004')
        print("Connected!")
        
        # Build command with memory limit
        # The space-old-size should be smaller than total memory limit (usually 512MB on AlwaysData free)
        cmd = 'cd /home/quickcombo/fresh_app && git pull origin main && NODE_OPTIONS="--max-old-space-size=400" npm run build'
        
        print(f"Executing: {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        
        # Stream output in real-time if possible, but for simplicity:
        out = stdout.read().decode()
        err = stderr.read().decode()
        
        print("STDOUT:", out)
        print("STDERR:", err)
        
        # Also restart Passenger
        print("Restarting Passenger...")
        ssh.exec_command("touch /home/quickcombo/www/quickcombo_backend/passenger_wsgi.py")
        
    finally:
        ssh.close()

if __name__ == "__main__":
    trigger_remote_build()
