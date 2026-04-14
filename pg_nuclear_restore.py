import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('ssh-quickcombo.alwaysdata.net', username='quickcombo', password='Dinesh@061004')
    print("Connected!")
    
    # Python script to fix the PostgreSQL DB directly
    fix_script = r"""
import os
import django
from django.db import connection
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickcombo.settings')
django.setup()

def run_sql(sql):
    with connection.cursor() as cursor:
        try:
            cursor.execute(sql)
            print(f'✅ Success: {sql[:55]}...')
        except Exception as e:
            msg = str(e).split('\n')[0]
            print(f'⚠️ Note: {sql[:55]}... -> {msg}')

print('--- Starting PostgreSQL Schema Patch (Repair) ---')

# 1. Add missing columns to Restaurant
run_sql('ALTER TABLE api_restaurant ADD COLUMN is_active BOOLEAN DEFAULT TRUE')

# 2. Add missing columns to Order
run_sql('ALTER TABLE api_order ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0')
run_sql('ALTER TABLE api_order ADD COLUMN applied_coupon VARCHAR(50) DEFAULT \'\'')

# 3. Create Coupon tables
run_sql('''
CREATE TABLE IF NOT EXISTS api_coupon (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    min_order_value DECIMAL(10,2) DEFAULT 0,
    max_discount_amount DECIMAL(10,2),
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    total_max_uses INTEGER,
    max_uses_per_user INTEGER DEFAULT 1,
    times_used INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
)
''')

run_sql('''
CREATE TABLE IF NOT EXISTS api_couponusage (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    coupon_id INTEGER NOT NULL REFERENCES api_coupon(id),
    order_id INTEGER NOT NULL REFERENCES api_order(id)
)
''')

# 4. Ensure visibility
from api.models import Restaurant
count = Restaurant.objects.all().update(is_active=True)
print(f'🚀 Set {count} restaurants to ACTIVE')

# 5. Reset Migration State
run_sql("DELETE FROM django_migrations WHERE app='api'")
from django.core.management import call_command
try:
    call_command('migrate', 'api', fake=True, noinput=True)
    print('✅ Migrations faked for api app')
except Exception as e:
    print(f'❌ Migration fake error: {e}')
"""
    
    # Use SFTP to upload the script cleanly
    sftp = ssh.open_sftp()
    with sftp.file('/home/quickcombo/www/quickcombo_backend/pg_restore_db.py', 'w') as f:
        f.write(fix_script)
    sftp.close()
    
    cmd = "cd /home/quickcombo/www/quickcombo_backend && python3 pg_restore_db.py"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print("STDOUT:", stdout.read().decode())
    print("STDERR:", stderr.read().decode())

finally:
    ssh.close()
