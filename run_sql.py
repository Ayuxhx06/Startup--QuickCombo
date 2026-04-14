import paramiko

def run_remote_sql():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect('ssh-quickcombo.alwaysdata.net', username='quickcombo', password='Dinesh@061004')
        print("Connected!")
        
        # Change image_url column types to VARCHAR(1000) or TEXT
        # For Postgres/AlwaysData, VARCHAR(1000) is fine to replace URLField
        cmds = [
            "ALTER TABLE api_restaurant ALTER COLUMN image_url TYPE VARCHAR(1000);",
            "ALTER TABLE api_menuitem ALTER COLUMN image_url TYPE VARCHAR(1000);"
        ]
        
        for sql in cmds:
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
