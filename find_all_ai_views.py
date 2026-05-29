import paramiko

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@06102004"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(host, username=user, password=password)
    stdin, stdout, stderr = ssh.exec_command("find /home/quickcombo -name ai_views.py")
    print("ALL AI VIEWS FILES:")
    for line in stdout:
        file_path = line.strip()
        print(file_path)
        stdin2, stdout2, stderr2 = ssh.exec_command(f"cat {file_path} | grep -c google.generativeai")
        count = stdout2.read().decode().strip()
        print(f"  Gemini count: {count}")
finally:
    ssh.close()
