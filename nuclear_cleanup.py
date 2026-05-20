import re
import os

path = r'c:\Placement project\Quickcombo\frontend\app\admin\page.tsx'
content = open(path, 'r', encoding='utf-8').read()

# Allowed non-ascii characters
allowed = '₹⚠️✅❌—✓'

def clean_char(c):
    if ord(c) < 128 or c in allowed:
        return c
    return ' '

cleaned = ''.join(clean_char(c) for c in content)

# Fix common mangled sequences if they were replaced by spaces
cleaned = re.sub(r'\s{2,}', ' ', cleaned) # Collapse multiple spaces

open(path, 'w', encoding='utf-8').write(cleaned)
print('Sanitized file successfully.')
