import paramiko

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@06102004"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(host, username=user, password=password)
    stdin, stdout, stderr = ssh.exec_command("find /home/quickcombo/fresh_app -name ai_views.py")
    print("FRESH APP AI VIEWS:", stdout.read().decode())
    
    stdin, stdout, stderr = ssh.exec_command("cat /home/quickcombo/fresh_app/api/ai_views.py | grep openai")
    print("FRESH APP OPENAI:", stdout.read().decode())
    
    stdin, stdout, stderr = ssh.exec_command("cat /home/quickcombo/fresh_app/api/ai_views.py | grep generativeai")
    print("FRESH APP GEMINI:", stdout.read().decode())
finally:
    ssh.close()
