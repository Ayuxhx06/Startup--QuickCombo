import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('ssh-quickcombo.alwaysdata.net', username='quickcombo', password='Dinesh@061004')
    print("Connected!")
    
    commands = [
        "cd /home/quickcombo/fresh_app && git remote -v",
        "cd /home/quickcombo/fresh_app && ls -la .env",
        "cd /home/quickcombo/fresh_app && grep 'VERSION' .env || echo 'No VERSION in .env'",
        "cd /home/quickcombo/fresh_app && cat package.json | grep version"
    ]
    
    for cmd in commands:
        print(f"--- Running: {cmd} ---")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        print("OUT:", stdout.read().decode())
        print("ERR:", stderr.read().decode())

finally:
    ssh.close()
