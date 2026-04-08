from pathlib import Path
from decouple import config
import os
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-me-in-production')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1,.koyeb.app,.vercel.app,.alwaysdata.net,quickcombo.in,www.quickcombo.in,.quickcombo.in').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'quickcombo.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'quickcombo.wsgi.application'

db_url = config('DATABASE_URL', default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}")

# Robust fix for common connection string typos before parsing
if "slmode=" in db_url:
    db_url = db_url.replace("slmode=", "sslmode=")

try:
    NEON_URL = "postgresql://neondb_owner:npg_6Nl1GfOAtkUv@ep-blue-paper-a58jsw8s-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
    DATABASES = {
        'default': dj_database_url.config(
            default=config('DATABASE_URL', default=NEON_URL),
            conn_max_age=600,
            ssl_require=True
        )
    }
    if not DATABASES['default'].get('ENGINE'):
         raise ValueError("No database engine found")
except Exception as e:
    print(f"⚠️ Neon Connection Error: {e}. Falling back to SQLite.")
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.filebased.FileBasedCache',
        'LOCATION': os.path.join(BASE_DIR, 'django_cache'),
        'TIMEOUT': 600,
        'OPTIONS': {
            'MAX_ENTRIES': 1000
        }
    }
}

AUTH_USER_MODEL = 'api.User'

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-user-email',
    'x-admin-password',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_PERMISSION_CLASSES': [],
}

# Email Configuration (SMTP)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST', default='smtp.titan.email')  # Titan/GoDaddy Default
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_USE_SSL = config('EMAIL_USE_SSL', default=False, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='support@quickcombo.in')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default=f"QuickCombo <{EMAIL_HOST_USER}>")

# Legacy Brevo keys (to be removed once fully migrated)
BREVO_API_KEY = config('BREVO_API_KEY', default='')
BREVO_SENDER_EMAIL = config('BREVO_SENDER_EMAIL', default='support@quickcombo.in')
ADMIN_EMAIL = config('ADMIN_EMAIL', default='support@quickcombo.in')
GEOAPIFY_KEY = config('GEOAPIFY_KEY', default='')
UPI_ID = config('UPI_ID', default='ayushtomar061004-1@okaxis')
UPI_NAME = config('UPI_NAME', default='Ayush Tomar')
ADMIN_PANEL_PASSWORD = config('ADMIN_PANEL_PASSWORD', default='Admin@4098')

# Cashfree Configuration
CASHFREE_APP_ID = config('CASHFREE_APP_ID', default='')
CASHFREE_SECRET_KEY = config('CASHFREE_SECRET_KEY', default='')
CASHFREE_WEBHOOK_SECRET = config('CASHFREE_WEBHOOK_SECRET', default='')
CASHFREE_MODE = config('CASHFREE_MODE', default='production')
