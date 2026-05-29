import paramiko

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@06102004"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(host, username=user, password=password)
    
    # 1. Edit ai_views.py to return a test response instantly
    debug_code = """
import json
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['POST'])
def qiqi_chat(request):
    return Response({"debug": "OPENAI_MIGRATION_ACTIVE"})
"""
    cmd = f"echo '{debug_code}' > /home/quickcombo/www/quickcombo_backend/api/ai_views.py"
    ssh.exec_command(cmd)
    
    cmd2 = f"echo '{debug_code}' > /home/quickcombo/quickcombo_app/api/ai_views.py"
    ssh.exec_command(cmd2)

    ssh.exec_command("killall -9 python; killall -9 uwsgi; pkill -9 -f python")
    ssh.exec_command("touch /home/quickcombo/quickcombo_app/passenger_wsgi.py")
    ssh.exec_command("touch /home/quickcombo/www/quickcombo_backend/passenger_wsgi.py")
finally:
    ssh.close()
