content = open(r'c:\Placement project\Quickcombo\frontend\app\admin\page.tsx', 'r', encoding='utf-8').read()
stack = []
for i, char in enumerate(content):
    if char == '{':
        stack.append(('{', i))
    elif char == '}':
        if not stack:
            print(f"Extra closing brace at {i}")
        else:
            stack.pop()
if stack:
    for char, pos in stack:
        print(f"Unclosed {char} at {pos}")
else:
    print("Brackets are balanced.")
