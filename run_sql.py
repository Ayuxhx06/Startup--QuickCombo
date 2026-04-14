import paramiko

def run_remote_sql():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect('ssh-quickcombo.alwaysdata.net', username='quickcombo', password='Dinesh@061004')
        print("Connected!")
        
        # Add column via Django shell
        sql = "ALTER TABLE api_coupon ADD COLUMN is_public BOOLEAN DEFAULT TRUE;"
        cmd = f"cd /home/quickcombo/www/quickcombo_backend && python3 manage.py shell -c \"from django.db import connection; cursor = connection.cursor(); cursor.execute('{sql}')\""
        
        print(f"Executing: {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        
        print("STDOUT:", stdout.read().decode())
        print("STDERR:", stderr.read().decode())
        
    finally:
        ssh.close()

if __name__ == "__main__":
    run_remote_sql()
