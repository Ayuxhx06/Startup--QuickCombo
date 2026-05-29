import requests
import re

r = requests.get('https://www.quickcombo.in/admin', timeout=10)
html = r.text
scripts = re.findall(r'<script[^>]*src=[\"\']([^\"\']*?)[\"\']', html)
print('Scripts:', scripts[:5])
print('HTML length:', len(html))

# Check sw.js content has our new code
r2 = requests.get('https://www.quickcombo.in/sw.js', timeout=10)
print('\nsw.js has admin_new_order type:', 'admin_new_order' in r2.text)
print('sw.js has admin routing:', '/admin' in r2.text)

# Check what API URL is baked into admin page 
if 'quickcombo.alwaysdata.net' in html:
    print('\nAdmin page uses correct backend URL: YES')
else:
    print('\nAdmin page uses correct backend URL: NO - checking...')
    idx = html.find('API')
    print(html[idx:idx+100] if idx != -1 else 'not found')
