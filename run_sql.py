import paramiko

def run_remote_sql():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect('ssh-quickcombo.alwaysdata.net', username='quickcombo', password='Dinesh@061004')
        print("Connected!")
        
        # Add is_free_delivery to api_coupon
        sql = "ALTER TABLE api_coupon ADD COLUMN is_free_delivery BOOLEAN DEFAULT FALSE;"
        
        cmd = f"cd /home/quickcombo/www/quickcombo_backend && python3 manage.py shell -c \"from django.db import connection; cursor = connection.cursor(); cursor.execute('{sql}')\""
        print(f"Executing SQL: {sql}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        stdout_str = stdout.read().decode()
        stderr_str = stderr.read().decode()
        if stdout_str: print("STDOUT:", stdout_str.strip())
        if stderr_str: print("STDERR:", stderr_str.strip())
        
        print("Schema update complete.")
        
    finally:
        ssh.close()

if __name__ == "__main__":
    run_remote_sql()
