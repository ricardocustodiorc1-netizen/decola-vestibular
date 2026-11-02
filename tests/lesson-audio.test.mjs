import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {resolveLessonAudio,createLessonAudioController,mountLessonAudio} from '../lesson-audio.js';
import {lessonAudioCatalog,elvisExplanation} from '../lesson-audio-catalog.js';
const id='leo34.porcentagem.explicacao';
const context={lessonId:'leo34.porcentagem',phase:'lesson',text:elvisExplanation};
const ready=()=>resolveLessonAudio(lessonAudioCatalog,id,context);
test('catálogo associa somente o texto e a aula exatos à gravação existente',()=>{
 assert.equal(ready().voice,'Elvis');
 assert.equal(resolveLessonAudio(lessonAudioCatalog,id,{...context,text:' '+elvisExplanation.replaceAll(' ', '\n')+' '}).src,ready().src);
 for(const changes of [{text:'20% de 150 = 30'},{lessonId:'outra-aula'},{phase:'hint'},{text:''}])assert.equal(resolveLessonAudio(lessonAudioCatalog,id,{...context,...changes}),null);
});
test('pendências, IDs desconhecidos, duplicados e versão inválida não reproduzem',()=>{
 assert.equal(resolveLessonAudio(lessonAudioCatalog,'leo34.porcentagem.historia',context),null);
 assert.equal(resolveLessonAudio(lessonAudioCatalog,'desconhecido',context),null);
 assert.equal(resolveLessonAudio({schemaVersion:2,entries:[ready()]},id,context),null);
 assert.equal(resolveLessonAudio({schemaVersion:1,entries:[ready(),ready()]},id,context),null);
 for(const change of [{status:'pending'},{voice:'outra'},{revision:0}])assert.equal(resolveLessonAudio({schemaVersion:1,entries:[{...ready(),...change}]},id,context),null);
});
test('catálogo recusa URLs externas, travessia e esquemas inseguros',()=>{
 for(const src of ['https://exemplo.invalid/voz.mp3','//exemplo.invalid/voz.mp3','audios/../voz.mp3','audios/%2e%2e/voz.mp3','javascript:alert(1)','audios/a.mp3?token=abc'])assert.equal(resolveLessonAudio({schemaVersion:1,entries:[{...ready(),src}]},id,context),null);
});
test('resolução não é liberada durante a tentativa restante; dica tem identidade própria',()=>{
 const catalog={schemaVersion:1,entries:[{...ready(),phase:'solution'}]};
 for(const attempts of [undefined,0,1,'2',NaN])assert.equal(resolveLessonAudio(catalog,id,{...context,phase:'solution',attempts,correct:false}),null);
 assert.ok(resolveLessonAudio(catalog,id,{...context,phase:'solution',attempts:1,correct:true}));
 assert.ok(resolveLessonAudio(catalog,id,{...context,phase:'solution',attempts:2,correct:false}));
 assert.equal(resolveLessonAudio(catalog,id,{...context,phase:'hint',attempts:1}),null);
});
function harness(){
 const audios=[];let visible=true;const updates=[];
 const controller=createLessonAudioController({createAudio(){const a={handlers:{},paused:true,currentTime:0,plays:0,addEventListener(n,f){this.handlers[n]=f;},play(){this.plays++;this.paused=false;return this.promise||Promise.resolve();},pause(){this.paused=true;},removeAttribute(){this.src='';},load(){},emit(n){this.handlers[n]?.();}};audios.push(a);return a;}});
 const owner={isVisible:()=>visible,update:(...a)=>updates.push(a)};
 return {controller,owner,audios,updates,hide:()=>visible=false};
}
test('MP3 é opt-in: nenhum player nem reprodução é criado antes do clique',()=>{const h=harness();assert.equal(h.audios.length,0);assert.equal(h.updates.length,0);});
test('ouvir, pausar, continuar, interromper e repetir preservam entrada/contexto',async()=>{
 const h=harness(),entry=ready(),before=JSON.stringify(entry);await h.controller.play(h.owner,entry);const a=h.audios[0];a.currentTime=9;h.controller.pause(h.owner);assert.equal(a.currentTime,9);assert.equal(h.updates.at(-1)[0],'paused');await h.controller.resume(h.owner);assert.equal(a.currentTime,9);assert.equal(a.plays,2);h.controller.stop();assert.equal(a.currentTime,0);assert.equal(h.updates.at(-1)[0],'idle');await h.controller.play(h.owner,entry);assert.equal(h.audios.length,2);assert.equal(JSON.stringify(entry),before);
});
test('uma explicação por vez; evento tardio de outra gravação é ignorado',async()=>{
 const h=harness();await h.controller.play(h.owner,ready());const old=h.audios[0],other={isVisible:()=>true,update(){}};await h.controller.play(other,ready());assert.equal(old.paused,true);old.emit('error');old.emit('ended');assert.equal(h.controller.isOwner(other),true);
});
test('fechar a área interrompe inclusive áudio pausado de forma idempotente',async()=>{
 for(const paused of [true,false]){const h=harness();await h.controller.play(h.owner,ready());if(paused)h.controller.pause(h.owner);h.hide();h.controller.checkVisible();const count=h.updates.length;h.controller.checkVisible();assert.equal(h.updates.length,count);assert.equal(h.audios[0].paused,true);assert.equal(h.controller.isOwner(h.owner),false);}
});
test('arquivo ausente, erro de decodificação e rejeição de play são explícitos',async()=>{
 const h=harness();await h.controller.play(h.owner,ready());h.audios[0].emit('error');assert.equal(h.updates.at(-1)[0],'error');assert.match(h.updates.at(-1)[1],/MP3 Elvis/);
 const updates=[];const c=createLessonAudioController({createAudio:()=>({addEventListener(){},play:()=>Promise.reject(Error()),pause(){}})});await c.play({isVisible:()=>true,update:(...a)=>updates.push(a)},ready());assert.equal(updates.at(-1)[0],'error');assert.match(updates.at(-1)[1],/escrita foi mantida/);
});
test('sair durante carregamento e resolver play antigo não reinicia o áudio',async()=>{
 let release;const a={addEventListener(){},play:()=>new Promise(r=>release=r),pause(){this.paused=true;}};const c=createLessonAudioController({createAudio:()=>a}),updates=[];const owner={isVisible:()=>true,update:(...x)=>updates.push(x)};const pending=c.play(owner,ready());c.stop();release();await pending;assert.equal(a.paused,true);assert.equal(c.isOwner(owner),false);assert.equal(updates.at(-1)[0],'idle');
});
test('fim natural e saída antes do clique não modificam nenhum progresso',async()=>{
 const h=harness();await h.controller.play(h.owner,ready());h.audios[0].emit('ended');assert.equal(h.controller.isOwner(h.owner),false);assert.match(h.updates.at(-1)[1],/concluída/);h.hide();await h.controller.play(h.owner,ready());assert.equal(h.audios.length,1);
});
test('inventário conserva o texto e hash do MP3 do piloto 3.4',()=>{
 const inventory=JSON.parse(fs.readFileSync(new URL('../docs/INVENTARIO-AUDIOS-ELVIS.json',import.meta.url)));const entry=inventory.entries.find(e=>e.id===id);assert.equal(entry.text,elvisExplanation);const bytes=fs.readFileSync(new URL('../'+entry.audio.src,import.meta.url));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.audio.sha256);assert.equal(inventory.entries.filter(e=>e.audio).length,1);assert.equal(new Set(inventory.entries.map(e=>e.id)).size,inventory.entries.length);
});
test('demonstração não conecta módulos de produção nem usa APIs ou armazenamento',()=>{
 const js=fs.readFileSync(new URL('../lesson-audio-demo.js',import.meta.url),'utf8')+fs.readFileSync(new URL('../lesson-audio.js',import.meta.url),'utf8');assert.doesNotMatch(js,/\bfetch\s*\(|localStorage|sessionStorage|speechSynthesis|workers\.dev/);const html=fs.readFileSync(new URL('../piloto-audios-elvis.html',import.meta.url),'utf8');assert.doesNotMatch(html,/autoplay|professor-leo\.js|app\.js/);assert.match(html,/piloto-professor-leo-3-4\.html/);
});
test('controles DOM mantêm texto, declaram indisponibilidade e revalidam contexto no clique',async()=>{
 class Node{constructor(tag){this.tag=tag;this.children=[];this.handlers={};this.isConnected=true;this.hidden=false;}append(...n){this.children.push(...n);}setAttribute(){}addEventListener(n,f){this.handlers[n]=f;}closest(){return this.hidden?this:null;}remove(){}click(){if(!this.disabled)this.handlers.click?.();}}
 const old=globalThis.document;globalThis.document={createElement:t=>new Node(t)};
 try{const h=harness(),host=new Node('div');host.textContent='Explicação visível';let ctx={...context};const handle=mountLessonAudio({host,catalog:lessonAudioCatalog,id,getContext:()=>ctx,controller:h.controller});const [play,pause,resume,stop,status]=host.children[0].children;assert.equal(h.audios.length,0);assert.equal(play.disabled,false);assert.equal(pause.disabled,true);assert.equal(resume.disabled,true);assert.equal(stop.disabled,true);assert.equal(host.textContent,'Explicação visível');ctx={...ctx,text:'Texto alterado'};play.click();assert.equal(h.audios.length,0);assert.equal(play.disabled,true);assert.match(status.textContent,/não há gravação/);ctx={...context};handle.refresh();play.click();await Promise.resolve();pause.click();assert.equal(resume.disabled,false);ctx={...ctx,phase:'hint'};h.controller.checkVisible();assert.equal(h.controller.isOwner(h.owner),false);assert.equal(h.audios[0].paused,true);handle.destroy();}finally{globalThis.document=old;}
});
