import paramiko

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@06102004"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(host, username=user, password=password)
    stdin, stdout, stderr = ssh.exec_command("cat /home/quickcombo/www/quickcombo_backend/api/ai_views.py | grep openai")
    print("AI VIEWS GREP:", stdout.read().decode())
    
    stdin, stdout, stderr = ssh.exec_command("cat /home/quickcombo/www/quickcombo_backend/.env | grep OPENAI")
    print("ENV GREP:", stdout.read().decode())
finally:
    ssh.close()
