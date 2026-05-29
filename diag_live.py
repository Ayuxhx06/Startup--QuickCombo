import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@06102004"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=password)

checks = [
    # Check if builds are still running
    "ps aux | grep -E '(next|node)' | grep -v grep",
    # Check BUILD_ID for fresh_app
    "stat /home/quickcombo/fresh_app/.next/BUILD_ID 2>/dev/null && cat /home/quickcombo/fresh_app/.next/BUILD_ID || echo 'NO BUILD_ID - build failed or still running'",
    # Check BUILD_ID for quickcombo_app
    "stat /home/quickcombo/quickcombo_app/frontend/.next/BUILD_ID 2>/dev/null && cat /home/quickcombo/quickcombo_app/frontend/.next/BUILD_ID || echo 'NO BUILD_ID'",
    # Last 40 lines of fresh_app build log
    "tail -40 /home/quickcombo/fresh_app/build_log_fresh.txt",
    # Last 40 lines of quickcombo_app build log
    "tail -40 /home/quickcombo/quickcombo_app/frontend/build_log_main.txt",
]

for cmd in checks:
    print(f"\n>>> {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out: print(out[:3000])
    if err: print("ERR:", err[:500])

ssh.close()
