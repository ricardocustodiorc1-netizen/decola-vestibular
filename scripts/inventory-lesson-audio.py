"""Inventory static narration candidates; never generates speech or modifies lessons.

Literal extraction is deliberately conservative: assembled/dynamic messages and
short fragments require editorial review. IDs depend on text and phase, not line.
"""
from pathlib import Path
import ast
import csv
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ['study-area.js', 'language-smart.js', 'professor-leo.js', 'memory-pilot.js']
TOKENS = re.compile(r'''//[^\n]*|/\*[\s\S]*?\*/|'(?:\\[\s\S]|[^'\\])*'|"(?:\\[\s\S]|[^"\\])*"''')

def normalize(text):
    return ' '.join(text.split())

def digest(text):
    return hashlib.sha256(normalize(text).encode()).hexdigest()

def build():
    entries = {}
    for source in SOURCES:
        code = (ROOT / source).read_text()
        for token in TOKENS.finditer(code):
            raw = token.group()
            if raw.startswith(('/', '/*')):
                continue
            try:
                text = ast.literal_eval(raw)
            except (SyntaxError, ValueError):
                continue
            if not isinstance(text, str) or len(text) < 45 or len(text.split()) < 6:
                continue
            if text.startswith(('http', '.', '#')) or '<' in text or '{' in text:
                continue
            prefix = code[max(0, token.start()-70):token.start()]
            field = re.search(r'(explanation|feedback|why|hint|steps|reference|rubric|reinforce)\s*:\s*$', prefix)
            kind = field.group(1) if field else 'literal-review'
            phase = 'hint' if kind in ('hint', 'steps') else 'solution' if kind in ('why', 'feedback', 'reference', 'rubric') else 'review'
            identity = digest(phase + ':' + normalize(text))
            entry = entries.setdefault(identity, {'id':'texto.'+identity[:20], 'phase':phase, 'text':text,
                'textRevision':digest(text), 'status':'pending-editorial-review', 'audio':None, 'sources':[]})
            entry['sources'].append({'file':source, 'line':code.count('\n',0,token.start())+1, 'field':kind})
    pilot = (ROOT / 'piloto-professor-leo-3-4.html').read_text()
    text = ast.literal_eval(re.search(r"const explanationText=('(?:\\.|[^'\\])*');", pilot).group(1))
    audio = ROOT / 'audios/leo-explicacao-elvis.mp3'
    items = [{ 'id':'leo34.porcentagem.explicacao', 'lessonId':'leo34.porcentagem', 'phase':'lesson',
        'text':text, 'textRevision':digest(text), 'status':'available-existing',
        'audio':{'src':'audios/leo-explicacao-elvis.mp3', 'voice':'Elvis', 'sha256':hashlib.sha256(audio.read_bytes()).hexdigest()},
        'sources':[{'file':'piloto-professor-leo-3-4.html','field':'explanationText'}],
        'review':'Arquivo e voz confirmados pelo usuário no piloto; transcrição auditiva integral não realizada nesta etapa.'},
        {'id':'leo34.porcentagem.historia','lessonId':'leo34.porcentagem','phase':'lesson','status':'missing-recording',
         'text':None,'textRevision':None,'audio':None,'sources':[{'file':'piloto-professor-leo-3-4.html','field':'stage1'}],
         'review':'Roteiro está nos parágrafos de stage1; leo-historia-elvis.mp3 não existe no repositório.'}]
    items.extend(sorted(entries.values(),key=lambda x:x['id']))
    return {'schemaVersion':1,'scope':SOURCES+['piloto-professor-leo-3-4.html'],
        'limitations':['Candidatos literais, não roteiros finais: trechos curtos e mensagens concatenadas exigem revisão manual.',
         'Não duplicar versões históricas 3.0–3.3 nem o bundle demonstracao.html.',
         'Respostas reais da IA e perguntas complementares não são um conjunto finito de MP3s.',
         'Rótulos, instruções e rubricas encontrados precisam de triagem antes de narrar; review não é conteúdo liberado.'],
        'entries':items}

if __name__ == '__main__':
    result = build()
    path = ROOT / 'docs/INVENTARIO-AUDIOS-ELVIS.json'
    path.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    with path.with_suffix('.csv').open('w',newline='',encoding='utf-8-sig') as file:
        writer=csv.writer(file)
        writer.writerow(['id','fase_provisoria','status','texto','audio','referencias'])
        for entry in result['entries']:
            references='; '.join(ref['file']+(':'+str(ref['line']) if 'line' in ref else '') for ref in entry['sources'])
            writer.writerow([entry['id'],entry['phase'],entry['status'],entry.get('text'),(entry.get('audio') or {}).get('src',''),references])
    print(f'{len(result["entries"])} entradas; 1 gravação existente; demais dependem de revisão/gravação.')
