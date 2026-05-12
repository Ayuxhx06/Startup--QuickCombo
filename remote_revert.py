import paramiko
import sys

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@061004"

def remote_revert():
    print(f"Connecting to {host}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(host, username=user, password=password)
        print("Connected.")
        
        # Command to clear image_url and cache
        # Using python3 as it's standard on linux servers
        cmd = 'cd /home/quickcombo/www/quickcombo_backend && python3 manage.py shell -c "from api.models import MenuItem; MenuItem.objects.all().update(image_url=\'\'); from django.core.cache import cache; cache.clear(); print(\'REMOTE REVERT COMPLETE\')"'
        
        print("Executing remote revert command...")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        
        out = stdout.read().decode()
        err = stderr.read().decode()
        
        print("STDOUT:", out)
        if err:
            print("STDERR:", err)
            
        print("Restaring app to reflect changes...")
        ssh.exec_command("touch /home/quickcombo/www/quickcombo_backend/passenger_wsgi.py")
        
        print("DONE! Production food item images should be gone.")
        
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        ssh.close()

if __name__ == "__main__":
    remote_revert()
