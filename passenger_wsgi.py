import os
import sys

# Path to your project directory
sys.path.append('/home/quickcombo/www/quickcombo_backend')

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quickcombo.settings')

application = get_wsgi_application()
