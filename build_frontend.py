import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('ssh-quickcombo.alwaysdata.net', username='quickcombo', password='Dinesh@061004')
    print("Connected!")
    
    # Build the frontend in quickcombo_app
    cmd = 'cd /home/quickcombo/quickcombo_app && NODE_OPTIONS="--max-old-space-size=400" npm run build'
    
    print(f"Executing: {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    print("STDOUT:", stdout.read().decode())
    print("STDERR:", stderr.read().decode())
    
    # Restart Passenger just in case
    print("Restarting Passenger...")
    ssh.exec_command("touch /home/quickcombo/www/quickcombo_backend/passenger_wsgi.py")
    
finally:
    ssh.close()
