import paramiko

host = "ssh-quickcombo.alwaysdata.net"
user = "quickcombo"
password = "Dinesh@06102004"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect(host, username=user, password=password)
    
    # Write the correct ai_views.py back
    code = """
from rest_framework.decorators import api_view
from rest_framework.response import Response
from openai import OpenAI
import os

@api_view(['POST'])
def qiqi_chat(request):
    try:
        user_msg = request.data.get('message', '')
        client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": user_msg}]
        )
        reply = response.choices[0].message.content
        return Response({"reply": reply})
    except Exception as e:
        return Response({"error": str(e)}, status=500)
"""
    cmd = f"cat << 'EOF' > /home/quickcombo/www/quickcombo_backend/api/ai_views.py\n{code}\nEOF"
    ssh.exec_command(cmd)
    
    cmd2 = f"cat << 'EOF' > /home/quickcombo/quickcombo_app/api/ai_views.py\n{code}\nEOF"
    ssh.exec_command(cmd2)

    ssh.exec_command("touch /home/quickcombo/quickcombo_app/passenger_wsgi.py")
    ssh.exec_command("touch /home/quickcombo/www/quickcombo_backend/passenger_wsgi.py")
finally:
    ssh.close()
