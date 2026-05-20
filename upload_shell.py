import paramiko
import time

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@06102004"

print("Connecting...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(host, username=user, password=password, timeout=10)
    print("Connected. Invoking shell...")
    shell = ssh.invoke_shell()
    
    # Wait for prompt
    time.sleep(2)
    print(shell.recv(1024).decode())
    
    # Send commands
    print("Sending commands...")
    shell.send("cd www/quickcombo_backend\n")
    time.sleep(1)
    shell.send("git pull origin main\n")
    time.sleep(5)  # wait for git pull to complete
    shell.send("touch passenger_wsgi.py\n")
    time.sleep(1)
    print(shell.recv(4096).decode())
    
    print("Done!")
except Exception as e:
    print("Error:", e)
finally:
    ssh.close()
