import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';
function api(storage){const box={localStorage:storage};vm.runInNewContext(fs.readFileSync(new URL('../study-session.js',import.meta.url),'utf8'),box);return box.DecolaStudySession;}
const record={lessonKey:'decola-smart-percent-v2',question:0,scrollTop:864};
test('retoma questão e leitura sem tocar respostas ou históricos',()=>{
 const data=new Map([['decola-smart-percent-v2','respostas existentes'],['historico','preservado']]);const storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 assert.equal(api(storage).session.save(record),true);const reopened=api(storage).session.read();assert.equal(reopened.question,0);assert.equal(reopened.scrollTop,864);assert.equal(data.get('decola-smart-percent-v2'),'respostas existentes');assert.equal(data.get('historico'),'preservado');assert.equal(data.size,3);
});
test('registro inválido ou versão desconhecida tem fallback seguro',()=>{
 for(const value of ['{','null','[]',JSON.stringify({version:2,...record}),JSON.stringify({version:1,...record,lessonKey:'externa'}),JSON.stringify({version:1,...record,question:9}),JSON.stringify({version:1,...record,scrollTop:-1})])assert.equal(api({getItem:()=>value}).session.read(),null);
});
test('falha no armazenamento mantém navegação em memória sem gravar dados pessoais',()=>{
 const session=api({getItem(){throw Error();},setItem(){throw Error();}}).session;
 assert.equal(session.save({...record,name:'não guardar',conversation:'não guardar'}),true);const saved=session.read();assert.deepEqual(Object.keys(saved).sort(),['lessonKey','question','scrollTop','version']);assert.equal(saved.question,0);
});
