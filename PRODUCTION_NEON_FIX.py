import paramiko
import os
import time

NEON_URL = "postgresql://neondb_owner:npg_6Nl1GfOAtkUv@ep-blue-paper-a58jsw8s-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
HOST = "ssh-quickcombo.alwaysdata.net"
USER = "quickcombo"
PASS = "Dinesh@061004"
LIVE_ROOT = "/home/quickcombo/quickcombo_app"

def restore_production():
    print("🚀 RESTORING PRODUCTION CONNECTIVITY (NEON FIX)...")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(HOST, username=USER, password=PASS)
        print("✅ Connected to AlwaysData.")
        
        # 1. Create/Update .env file on remote
        print("📝 Writing .env with Neon URL...")
        env_content = f"DATABASE_URL={NEON_URL}\nDEBUG=False\nALLOWED_HOSTS=*.alwaysdata.net,.quickcombo.in,quickcombo.in\n"
        sftp = ssh.open_sftp()
        with sftp.file(f"{LIVE_ROOT}/.env", "w") as f:
            f.write(env_content)
        sftp.close()
        
        # 2. Verify Database Engine
        print("🔍 Verifying Connection...")
        verify_cmd = f"cd {LIVE_ROOT} && python3 manage.py shell -c 'import os; from django.conf import settings; print(\"ENGINE:\", settings.DATABASES[\"default\"][\"ENGINE\"])'"
        stdin, stdout, stderr = ssh.exec_command(verify_cmd)
        result = stdout.read().decode().strip()
        print(f"  [RESULT] {result}")
        
        if "postgresql" not in result.lower():
            print("❌ FAILED: Still using SQLite. Check your settings.py logic.")
            return

        # 3. Running Migrations on Neon
        print("🔄 Running Migrations on Neon PostgreSQL...")
        migrate_cmd = f"cd {LIVE_ROOT} && python3 manage.py migrate --run-syncdb"
        stdin, stdout, stderr = ssh.exec_command(migrate_cmd)
        print(stdout.read().decode())

        # 4. Seeding Data
        print("🌱 Seeding Restaurants & Menu...")
        seed_cmd = f"cd {LIVE_ROOT} && python3 seed_restaurants.py"
        stdin, stdout, stderr = ssh.exec_command(seed_cmd)
        print(stdout.read().decode())

        # 5. Restarting Server
        print("🔄 Restarting uWSGI...")
        ssh.exec_command(f"touch {LIVE_ROOT}/quickcombo/wsgi.py")
        ssh.exec_command("killall -9 uwsgi || true")
        ssh.exec_command("killall -9 python3 || true")
        
        print("\n✨ PRODUCTION RESTORED! Wait 10 seconds for reload...")
        ssh.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    restore_production()
