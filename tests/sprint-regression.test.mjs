import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {createLessonAudioController} from '../lesson-audio.js';
const source=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
function load(){const box={};for(const file of ['percentage-content.js','lesson-progress.js','study-session.js','leo-client.js'])vm.runInNewContext(source(file),box);return box;}
function storage(entries=[]){const data=new Map(entries);return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};}
const correct=(choice)=>({choice,attempts:1,done:true});
test('migra apenas Q2 e Q3 sem alterar v1/v2 nem importar acerto antigo da Q1',()=>{
 const b=load(),d=b.DecolaPercentageLesson,old={'0':correct(1),'1':correct(0),'2':{choice:0,attempts:1,done:false}},raw=JSON.stringify(old),s=storage([['decola-smart-percent-v2',raw]]);
 const store=b.DecolaLessonProgress.create({storage:s,...d});assert.equal(store.read()[0],undefined);assert.equal(store.read()[1].choice,0);assert.equal(store.read()[2].attempts,1);assert.equal(s.data.size,1);store.save(store.read());assert.equal(s.getItem('decola-smart-percent-v2'),raw);assert.equal(s.data.size,2);
});
test('retoma respostas, segunda tentativa pendente e acerto da versão atual',()=>{
 const b=load(),d=b.DecolaPercentageLesson,s=storage();let store=b.DecolaLessonProgress.create({storage:s,...d});store.save({0:{choice:null,attempts:1,done:false},1:correct(0)});store=b.DecolaLessonProgress.create({storage:s,...d});assert.equal(store.read()[0].choice,null);assert.equal(store.read()[0].attempts,1);assert.equal(store.read()[1].done,true);
});
test('reiniciar grava vazio na versão atual e não reimporta exercícios antigos',()=>{
 const b=load(),d=b.DecolaPercentageLesson,raw=JSON.stringify({1:correct(0),2:correct(2)}),s=storage([['decola-smart-percent-v2',raw]]);const store=b.DecolaLessonProgress.create({storage:s,...d});assert.equal(store.reset(),true);assert.equal(Object.keys(b.DecolaLessonProgress.create({storage:s,...d}).read()).length,0);assert.equal(s.getItem('decola-smart-percent-v2'),raw);
});
test('registros inválidos, arrays e JSON quebrado ficam preservados, com sessão funcional',()=>{
 for(const raw of ['{','[]','null',JSON.stringify({0:{choice:8,attempts:1,done:true}}),JSON.stringify({0:{choice:0,attempts:1,done:true}})]){
  const b=load(),d=b.DecolaPercentageLesson,s=storage([[d.key,raw]]),store=b.DecolaLessonProgress.create({storage:s,...d});assert.ok(store.issue());assert.equal(store.save({0:correct(1)}),false);assert.equal(store.read()[0].choice,1);assert.equal(s.getItem(d.key),raw);
 }
});
test('quota, escrita silenciosa e conflito entre abas não afirmam salvamento',()=>{
 const b=load(),d=b.DecolaPercentageLesson;
 for(const mode of ['quota','silent','conflict']){const s=storage([[d.key,'{}']]);if(mode==='quota')s.setItem=()=>{throw Error();};if(mode==='silent')s.setItem=()=>{};const store=b.DecolaLessonProgress.create({storage:s,...d});if(mode==='conflict')s.setItem(d.key,JSON.stringify({1:correct(0)}));const before=s.getItem(d.key);assert.equal(store.save({0:correct(1)}),false);assert.ok(store.issue());assert.equal(s.getItem(d.key),before);assert.equal(store.read()[0].choice,1);}
});
test('falha de armazenamento conserva respostas ao sair e reabrir aula na mesma sessão',()=>{for(const mode of ['quota','unavailable','corrupt']){const b=load(),d=b.DecolaPercentageLesson,s=storage([[d.key,mode==='corrupt'?'{' : '{}']]);if(mode==='quota')s.setItem=()=>{throw Error();};if(mode==='unavailable')s.getItem=()=>{throw Error();};const first=b.DecolaLessonProgress.create({storage:s,...d});first.save({0:correct(1)});const reopened=b.DecolaLessonProgress.create({storage:s,...d});assert.equal(reopened.read()[0].choice,1);assert.ok(reopened.issue());}});
test('migracao v1 recupera somente acertos válidos das duas questões inalteradas',()=>{
 const b=load(),d=b.DecolaPercentageLesson,s=storage([['decola-smart-percent-v1',JSON.stringify({0:1,1:0,2:2})]]);const state=b.DecolaLessonProgress.create({storage:s,...d}).read();assert.equal(state[0],undefined);assert.equal(state[1].done,true);assert.equal(state[2].done,true);
});
test('retomada antiga navega para v3 sem reinterpretar respostas',()=>{
 const b=load();for(const key of ['decola-smart-percent-v2','decola-smart-percent-v3']){const value=b.DecolaStudySession.validate({version:1,lessonKey:key,question:0,scrollTop:300});assert.equal(value.lessonKey,'decola-smart-percent-v3');assert.equal(value.question,0);assert.equal(value.scrollTop,300);}
});
test('Q1 nova e Q2/Q3 mantêm dica antes de esgotar e resolução após acerto ou duas tentativas',()=>{
 const b=load();for(const q of b.DecolaPercentageLesson.questions){const wrong=(q.answer+1)%q.opts.length;const hint=b.DecolaLeoClient.questionContext(q,{choice:wrong,attempts:1});assert.equal(hint.mode,'hint');assert.equal(hint.correctAnswer,undefined);assert.equal(hint.solution,undefined);for(const state of [{choice:q.answer,attempts:1},{choice:wrong,attempts:2}]){const solution=b.DecolaLeoClient.questionContext(q,state);assert.equal(solution.mode,'solution');assert.equal(solution.correctAnswer,q.opts[q.answer]);}}
});
test('tempo limite do MP3 libera controles e ignora resolução tardia de play',async()=>{
 let callback,release;const updates=[];const a={paused:false,addEventListener(){},play:()=>new Promise(r=>release=r),pause(){this.paused=true;}};const c=createLessonAudioController({createAudio:()=>a,setTimeout:fn=>{callback=fn;return 1;},clearTimeout(){}});const owner={isVisible:()=>true,update:(...x)=>updates.push(x)};const pending=c.play(owner,{src:'audios/a.mp3'});callback();assert.equal(updates.at(-1)[0],'error');assert.match(updates.at(-1)[1],/demorou/);release();await pending;assert.equal(c.isOwner(owner),false);assert.equal(a.paused,true);
});
test('falha ao criar player é informada sem remover a explicação escrita',async()=>{const updates=[];const c=createLessonAudioController({createAudio(){throw Error();}});await c.play({isVisible:()=>true,update:(...a)=>updates.push(a)},{src:'audios/a.mp3'});assert.equal(updates.at(-1)[0],'error');assert.match(updates.at(-1)[1],/escrita foi mantida/);});
test('MP3 resolve pelo módulo, sem depender da subpasta da página chamadora',async()=>{const audio={addEventListener(){},play:()=>Promise.resolve(),pause(){}};const c=createLessonAudioController({createAudio:()=>audio});await c.play({isVisible:()=>true,update(){}},{src:'audios/leo-explicacao-elvis.mp3'});assert.equal(audio.src,new URL('../audios/leo-explicacao-elvis.mp3',import.meta.url).href);c.stop();});
test('passos da aula movem foco sem ocultar conteúdo nem tocar armazenamento',()=>{
 const old=globalThis.document;const calls=[];class Node{constructor(){this.children=[];this.handlers={};this.isConnected=true;}append(n){this.children.push(n);}setAttribute(){}addEventListener(n,f){this.handlers[n]=f;}scrollIntoView(){calls.push('scroll');}focus(){calls.push('focus');}}
 const box={document:{createElement:()=>new Node()}};vm.runInNewContext(source('lesson-navigation.js'),box);const host=new Node(),target=new Node();const nav=box.DecolaLessonNavigation.mount({host,steps:[{id:'recordar',label:'4. Recordar',target}]});assert.equal(calls.length,0);host.children[0].children[0].handlers.click();assert.deepEqual(calls,['scroll','focus']);assert.equal(target.hidden,undefined);assert.equal(nav.go('inexistente'),false);globalThis.document=old;
});
