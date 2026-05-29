import paramiko

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@06102004"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(host, username=user, password=password)
    
    # Update the model string in ai_views.py
    cmd = """
sed -i "s/gemini-1.5-flash/gemini-2.5-flash/g" /home/quickcombo/www/quickcombo_backend/api/ai_views.py
"""
    ssh.exec_command(cmd)
    
    # Restart the application
    ssh.exec_command('mkdir -p /home/quickcombo/www/quickcombo_backend/tmp && touch /home/quickcombo/www/quickcombo_backend/tmp/restart.txt')
    print("Successfully updated model to gemini-2.5-flash and restarted uWSGI")
finally:
    ssh.close()
