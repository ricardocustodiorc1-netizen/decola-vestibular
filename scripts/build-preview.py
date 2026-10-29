"""Gera uma demonstração que abre diretamente no navegador, sem servidor."""
from pathlib import Path
root = Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text()
css = (root / 'styles.css').read_text()
logic = (root / 'plan.js').read_text().replace('export const ', 'const ').replace('export function ', 'function ')
app = (root / 'app.js').read_text().replace("import { areas, questions, createPlan } from './plan.js';", '')
html = html.replace('<link rel="stylesheet" href="styles.css">', f'<style>{css}</style>')
html = html.replace('<script type="module" src="app.js"></script>', '')
html = html.replace('</body>', f'<script>\n{logic}\n{app}\n</script>\n</body>')
(root / 'demonstracao.html').write_text(html)
print('Criado: demonstracao.html (sem dependências externas)')
