import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
test('aula de Porcentagem usa Q1 renovada sem antecipação pelo exemplo Elvis', () => {
 const box={};vm.runInNewContext(read('percentage-content.js'),box);const q=box.DecolaPercentageLesson.questions[0];
 assert.equal(q.q,'Quanto é 20% de 180?');
 assert.deepEqual([...q.opts],['30','36','40']);assert.equal(q.answer,1);
 assert.match(q.why, /180 × 0,20 = 36/);
 assert.match(q.hints[1], /Calcule 10% de 180 e depois dobre esse valor/);
});
test('progresso anterior não conclui automaticamente a questão alterada', () => {
 const box={};vm.runInNewContext(read('percentage-content.js'),box);
 assert.equal(box.DecolaPercentageLesson.key,'decola-smart-percent-v3');
 for(const migration of box.DecolaPercentageLesson.migrations)assert.deepEqual([...migration.indexes],[1,2]);
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
 assert.equal(example.audio.src,'audios/leo-explicacao-elvis.mp3');
 assert.equal(crypto.createHash('sha256').update(readFileSync(new URL('../'+example.audio.src,import.meta.url))).digest('hex'),example.audio.sha256);
 assert.equal(catalog.editorialOnly, true);
 assert.equal(catalog.estimate.audioGenerationAuthorized, false);
});
