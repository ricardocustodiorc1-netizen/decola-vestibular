"""Build a self-contained demo from every current source, without remote assets."""
from pathlib import Path
import re
root = Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text()
def inline_css(match):
    path = match.group(1).split('?')[0]
    return '<style>\n' + (root / path).read_text() + '\n</style>'
html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', inline_css, html)
html = re.sub(r'<script[^>]*src="[^"]+"[^>]*></script>', '', html)
logic = (root / 'plan.js').read_text().replace('export const ', 'const ').replace('export function ', 'function ')
family = (root / 'family-demo.js').read_text().replace('export function ', 'function ')
app = (root / 'app.js').read_text()
app = re.sub(r'^import .*?;\n', '', app, flags=re.M)
scripts = [(root / name).read_text() for name in ['leo-client.js','leo-inline.js']]
scripts += [logic + '\n' + family + '\n' + app]
scripts += [(root / name).read_text() for name in ['professor-leo.js', 'study-area.js', 'language-smart.js', 'navigation.js']]
# Isolate lexical declarations, retaining the explicit document events/window API.
bundle = '\n'.join('<script>\n(()=>{\n' + source.replace('</script', '<\\/script') + '\n})();\n</script>' for source in scripts)
html = html.replace('</body>', bundle + '\n</body>')
(root / 'demonstracao.html').write_text('\n'.join(line.rstrip() for line in html.splitlines()) + '\n')
print('Criado: demonstracao.html (todos os módulos, sem dependências externas)')
