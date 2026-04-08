import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('ssh-quickcombo.alwaysdata.net', username='quickcombo', password='Dinesh@061004')
# Find where the app is being served from right now by inspecting uwsgi
stdin, stdout, stderr = ssh.exec_command("ps aux | grep uwsgi | grep -v grep")
print("--- UWSGI PROCESSES ---")
print(stdout.read().decode())

# Also search for settings.py containing our fix
stdin, stdout, stderr = ssh.exec_command("find /home/quickcombo -name settings.py -exec grep -l CASHFREE_APP_ID {} +")
print("\n--- SETTINGS FILES WITH FIX ---")
print(stdout.read().decode())
