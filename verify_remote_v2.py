import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('ssh-quickcombo.alwaysdata.net', username='quickcombo', password='Dinesh@061004')
    # Count occurrences
    stdin, stdout, stderr = ssh.exec_command('grep -c "packingCharge" /home/quickcombo/fresh_app/app/checkout/page.tsx')
    print("packingCharge count:", stdout.read().decode().strip())
    
    stdin, stdout, stderr = ssh.exec_command('grep -c "onlyEssentials" /home/quickcombo/fresh_app/app/checkout/page.tsx')
    print("onlyEssentials count:", stdout.read().decode().strip())

    # Check if build artifact exists and its date
    stdin, stdout, stderr = ssh.exec_command('ls -l /home/quickcombo/fresh_app/.next/BUILD_ID')
    print("Build Artifact:", stdout.read().decode().strip())
finally:
    ssh.close()
