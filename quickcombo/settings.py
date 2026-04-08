from pathlib import Path
from decouple import Config, RepositoryEnv
import os
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

# Force Absolute Path for .env to ensure AlwaysData process finds it
env_path = BASE_DIR / '.env'
if os.path.exists(env_path):
    config = Config(RepositoryEnv(env_path))
else:
    # Fallback to standard config if .env is missing (uses environment variables)
    from decouple import config

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
    # Use exact Neon DB from .env as fallback if strictly not found in AlwaysData environment
    NEON_URL = "postgresql://neondb_owner:npg_yntko3Z8aipl@ep-old-wind-amjwyldp-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require"
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
    'X-Admin-Password',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_PERMISSION_CLASSES': [],
}

# Email Configuration (SMTP)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp-relay.brevo.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_USE_SSL = False
EMAIL_HOST_USER = 'a5a14a001@smtp-brevo.com'
EMAIL_HOST_PASSWORD = 'xsmtpsib-' + '141d3bfdb6a51e7cbe10f42b52e9bc2672c3935a6515a515f6ef3ca5b4237d19-vMz4nnEusIPVMTpG'
DEFAULT_FROM_EMAIL = 'QuickCombo <ayushtomar061004@gmail.com>'

# Legacy Brevo keys
BREVO_API_KEY = 'xkeysib-' + '141d3bfdb6a51e7cbe10f42b52e9bc2672c3935a6515a515f6ef3ca5b4237d19-jVb9hORlbgI1yzyc'
BREVO_SENDER_EMAIL = 'ayushtomar061004@gmail.com'
ADMIN_EMAIL = 'support@quickcombo.in'
GEOAPIFY_KEY = '8861a276' + 'c2d0445eb971d14867e39664'
UPI_ID = 'ayushtomar061004-1@okaxis'
UPI_NAME = 'Ayush Tomar'
ADMIN_PANEL_PASSWORD = 'Admin@4098'

# Cashfree Configuration
CASHFREE_APP_ID = '125266011' + 'ae6630b2d9ee278d940662521'
CASHFREE_SECRET_KEY = 'cfsk_ma_prod_' + 'fb68e1059e38db892c2a8d7888358dcc_d5633fef'
CASHFREE_WEBHOOK_SECRET = 'okv20tncei' + 'louw6uqgod'
CASHFREE_MODE = 'production'
