import paramiko

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@06102004"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(host, username=user, password=password)
    print("Connected. Running npm install and build...")
    
    cmd = "cd /home/quickcombo/quickcombo_app/frontend && export NODE_OPTIONS='--max-old-space-size=400' && npx next build"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    stdout_bytes = stdout.read()
    stderr_bytes = stderr.read()
    
    stdout_text = stdout_bytes.decode('utf-8', errors='ignore')
    stderr_text = stderr_bytes.decode('utf-8', errors='ignore')
    
    print("--- STDOUT ---")
    print(ascii(stdout_text))
    print("--- STDERR ---")
    print(ascii(stderr_text))
    
    print("Restarting app...")
    ssh.exec_command("touch /home/quickcombo/quickcombo_app/tmp/restart.txt")
    
finally:
    ssh.close()
