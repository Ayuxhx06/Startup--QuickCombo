"""
Force-sync production AlwaysData backend to latest GitHub commit.
Uses git fetch + reset --hard to override local server changes.
"""
import paramiko

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@06102004"

print("Connecting to AlwaysData SSH...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(host, username=user, password=password, timeout=30)
    print("Connected!")

    app_dir = "/home/quickcombo/www/quickcombo_backend"

    def run(cmd, timeout=120):
        print(f"\n> {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
        out = stdout.read().decode("utf-8", errors="ignore").strip()
        err = stderr.read().decode("utf-8", errors="ignore").strip()
        if out:
            print("OUT:", out)
        if err and "error" in err.lower():
            print("ERR:", err)
        return out, err

    # 1. Fetch latest from GitHub (no merge yet)
    run(f"cd {app_dir} && git fetch origin main")

    # 2. Hard reset to origin/main (discards local server changes)
    run(f"cd {app_dir} && git reset --hard origin/main")

    # 3. Clean untracked files that block the merge
    run(f"cd {app_dir} && git clean -fd")

    # 4. Verify we're on the right commit
    run(f"cd {app_dir} && git log --oneline -3")

    # 5. Run the new migration
    run(f"cd {app_dir} && source venv/bin/activate && python manage.py migrate api --no-input", timeout=120)

    # 6. Restart server
    run(f"touch {app_dir}/passenger_wsgi.py")

    print("\nSUCCESS: Backend force-synced, migrated, and restarted!")

except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()
finally:
    ssh.close()
