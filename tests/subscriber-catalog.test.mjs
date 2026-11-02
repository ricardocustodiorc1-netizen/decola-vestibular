import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
test('catálogo local de migração corresponde à identidade e respostas da aula existente',()=>{
 const context=vm.createContext({});vm.runInContext(fs.readFileSync(new URL('../percentage-content.js',import.meta.url),'utf8'),context);
 const current=context.DecolaPercentageLesson;
 const catalog=JSON.parse(fs.readFileSync(new URL('../infrastructure/subscribers/percentage-catalog.json',import.meta.url),'utf8'));
 assert.equal(catalog.sourceKey,current.key);
 assert.deepEqual(catalog.questions,JSON.parse(JSON.stringify(current.questions.map(q=>({id:q.id,options:q.opts.length,answer:q.answer})))));
});
