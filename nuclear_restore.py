import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('ssh-quickcombo.alwaysdata.net', username='quickcombo', password='Dinesh@061004')
    print("Connected!")
    
    # Python script to fix the DB directly via SQL
    fix_script = """
import os
import django
from django.db import connection
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickcombo.settings')
django.setup()

def run_sql(sql):
    with connection.cursor() as cursor:
        try:
            cursor.execute(sql)
            print(f'✅ Success: {sql[:50]}...')
        except Exception as e:
            print(f'⚠️ Note: {sql[:50]}... -> {str(e)}')

# 1. Add missing columns to Restaurant
run_sql('ALTER TABLE api_restaurant ADD COLUMN is_active BOOLEAN DEFAULT 1')

# 2. Add missing columns to Order
run_sql('ALTER TABLE api_order ADD COLUMN discount_amount DECIMAL DEFAULT 0')
run_sql('ALTER TABLE api_order ADD COLUMN applied_coupon VARCHAR(50) DEFAULT ""')

# 3. Create Coupon tables if they don't exist
run_sql('''
CREATE TABLE IF NOT EXISTS api_coupon (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) NOT NULL,
    discount_value DECIMAL NOT NULL,
    min_order_value DECIMAL DEFAULT 0,
    max_discount_amount DECIMAL,
    expiry_date DATETIME NOT NULL,
    total_max_uses INTEGER,
    max_uses_per_user INTEGER DEFAULT 1,
    times_used INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
''')

run_sql('''
CREATE TABLE IF NOT EXISTS api_couponusage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email VARCHAR(255) NOT NULL,
    used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    coupon_id INTEGER NOT NULL REFERENCES api_coupon(id),
    order_id INTEGER NOT NULL REFERENCES api_order(id)
)
''')

# 4. Ensure all restaurants are active to show on site
from api.models import Restaurant
Restaurant.objects.all().update(is_active=True)
print(f'🚀 Set {Restaurant.objects.count()} restaurants to ACTIVE')

# 5. Fake migrations so Django thinks we are updated
from django.core.management import call_command
try:
    call_command('migrate', 'api', fake=True)
    print('✅ Migrations faked successfully')
except Exception as e:
    print(f'❌ Migration fake error: {e}')
"""
    
    cmd = f"cd /home/quickcombo/www/quickcombo_backend && echo \"{fix_script}\" > restore_db.py && python3 restore_db.py"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print("STDOUT:", stdout.read().decode())
    print("STDERR:", stderr.read().decode())

finally:
    ssh.close()
