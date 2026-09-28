import re

files = ['js/projects.js', 'js/team.js', 'js/leadership.js']

escape_code = """
const escapeHTML = (str) => {
    return (str || '').toString().replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
};
"""

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'escapeHTML' not in content:
        # inject escapeHTML after imports or at top
        if 'import ' in content:
            parts = content.split('\n\n', 1)
            content = parts[0] + '\n\n' + escape_code + '\n' + parts[1]
        else:
            content = escape_code + '\n' + content
            
        # VERY basic regex to find typical data attributes injected and wrap them
        content = re.sub(r'\$\{data\.title\}', '${escapeHTML(data.title)}', content)
        content = re.sub(r'\$\{data\.name\}', '${escapeHTML(data.name)}', content)
        content = re.sub(r'\$\{data\.role\}', '${escapeHTML(data.role)}', content)
        content = re.sub(r'\$\{data\.description\}', '${escapeHTML(data.description)}', content)
        
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Injected escapeHTML to {file}')
