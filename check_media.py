import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickcombo.settings')
django.setup()

def check():
    print(f"DEBUG: {settings.DEBUG}")
    print(f"MEDIA_URL: {settings.MEDIA_URL}")
    print(f"MEDIA_ROOT: {settings.MEDIA_ROOT}")
    print(f"MEDIA_ROOT exists: {os.path.exists(settings.MEDIA_ROOT)}")
    if os.path.exists(settings.MEDIA_ROOT):
        print(f"Uploads dir exists: {os.path.exists(os.path.join(settings.MEDIA_ROOT, 'uploads'))}")
        # Try to list files
        try:
            files = os.listdir(os.path.join(settings.MEDIA_ROOT, 'uploads'))
            print(f"Files in uploads: {len(files)}")
        except Exception as e:
            print(f"Error listing files: {e}")

if __name__ == "__main__":
    check()
