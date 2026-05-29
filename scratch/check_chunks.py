import requests
import re

# Get the admin page
r = requests.get('https://www.quickcombo.in/admin', timeout=10)
html = r.text

# Find all JS chunks 
scripts = re.findall(r'<script[^>]*src=[\"\']([^\"\']*?)[\"\']', html)
print(f'Found {len(scripts)} script tags')

# Find the admin-specific chunk - it'll be the largest one or contain admin-specific code
for script_url in scripts:
    full_url = f'https://www.quickcombo.in{script_url}' if script_url.startswith('/') else script_url
    try:
        rs = requests.get(full_url, timeout=10)
        content = rs.text
        if 'subscribe-push' in content or 'subscribeAdminPush' in content or 'AdminPushSubscription' in content:
            print(f'\n=== FOUND ADMIN PUSH CODE IN: {script_url} (size: {len(content)}) ===')
            idx = content.find('subscribe-push')
            if idx == -1:
                idx = content.find('subscribeAdminPush')
            print('Context:', content[max(0,idx-50):idx+100])
            break
        if 'on_trip' in content or 'ONGOING TRIP' in content:
            print(f'\n=== FOUND ONGOING TRIP CODE IN: {script_url} (size: {len(content)}) ===')
    except Exception as e:
        print(f'Error checking {script_url}: {e}')

print('\nDone checking all chunks')
