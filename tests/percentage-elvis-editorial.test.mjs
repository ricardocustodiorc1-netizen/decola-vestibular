import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
test('aula de Porcentagem usa Q1 renovada sem antecipação pelo exemplo Elvis', () => {
 const s = read('study-area.js');
 assert.match(s, /Quanto é 20% de 180\?/);
 assert.match(s, /opts:\['30','36','40'\],answer:1/);
 assert.match(s, /180 × 0,20 = 36/);
 assert.match(s, /Calcule 10% de 180 e depois dobre esse valor/);
});
test('progresso anterior não conclui automaticamente a questão alterada', () => {
 const s = read('study-area.js');
 assert.match(s, /const key='decola-smart-percent-v3'/);
 assert.match(s, /\[1,2\]\.forEach\(i=>/);
 assert.doesNotMatch(s, /\[0,1,2\]\.forEach\(i=>/);
});
test('roteiros D01 e S01 correspondem à Q1 nova, com MP3 antigo preservado', () => {
 const catalog = JSON.parse(read('docs/PORCENTAGEM-CATALOGO-EDITORIAL-ELVIS.json'));
 const d = catalog.entries.find(e=>e.id==='D01');
 const sol = catalog.entries.find(e=>e.id==='S01');
 const example = catalog.entries.find(e=>e.id==='E01');
 assert.ok(d && sol && example);
 assert.match(d.spokenText, /cento e oitenta/);
 assert.doesNotMatch(d.spokenText, /trinta e seis/);
 assert.match(sol.spokenText, /trinta e seis/);
 assert.equal(example.audio ?? example.src ?? example.path ?? example.audioPath ?? '', example.audio ?? example.src ?? example.path ?? example.audioPath ?? '');
 assert.equal(catalog.editorialOnly, true);
 assert.equal(catalog.estimate.audioGenerationAuthorized, false);
});
