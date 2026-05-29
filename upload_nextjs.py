import os
import zipfile
import paramiko

print("Zipping .next directory...")
with zipfile.ZipFile('nextjs_dist.zip', 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('frontend/.next'):
        for file in files:
            zipf.write(os.path.join(root, file), os.path.relpath(os.path.join(root, file), 'frontend'))

print("Connecting to AlwaysData...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("ssh-quickcombo.alwaysdata.net", username="quickcombo", password="Dinesh@06102004")

print("Uploading zip...")
sftp = ssh.open_sftp()
sftp.put('nextjs_dist.zip', '/home/quickcombo/fresh_app/nextjs_dist.zip')

print("Uploading backend files...")
sftp.put('api/ai_views.py', '/home/quickcombo/www/quickcombo_backend/api/ai_views.py')
sftp.put('api/ai_views.py', '/home/quickcombo/quickcombo_app/api/ai_views.py')
sftp.put('api/urls.py', '/home/quickcombo/www/quickcombo_backend/api/urls.py')
sftp.put('api/urls.py', '/home/quickcombo/quickcombo_app/api/urls.py')

sftp.close()

print("Installing dependencies...")
ssh.exec_command("pip install google-generativeai")

print("Extracting zip and restarting Next.js...")
cmd = "cd /home/quickcombo/fresh_app && rm -rf .next_old && mv .next .next_old && unzip -q nextjs_dist.zip && rm nextjs_dist.zip && pkill -f 'next-server' || true"
stdin, stdout, stderr = ssh.exec_command(cmd)
print("Restarting backend...")
ssh.exec_command("touch /home/quickcombo/www/quickcombo_backend/passenger_wsgi.py")
print("Restarting next.js site on AlwaysData...")
print(stdout.read().decode())
print(stderr.read().decode())
print("Done!")
