// Opt-in browser speech for teacher replies in the percentage pilot only.
(() => {
 function voiceKey(v){return v.voiceURI||v.name+'|'+v.lang;}
 function chooseVoice(voices,key=''){
  const exact=voices.find(v=>voiceKey(v)===key);if(exact)return exact;
  const br=voices.filter(v=>/^pt[-_]br$/i.test(v.lang));
  // Web Speech has no gender metadata: these names are a best-effort preference.
  return br.find(v=>/\b(ricardo|antonio|antônio|felipe|daniel|paulo|thiago|henrique)\b/i.test(v.name))||br.find(v=>v.localService)||br[0]||voices.find(v=>/^pt(?:[-_]|$)/i.test(v.lang))||voices.find(v=>v.default)||voices[0]||null;
 }
 function chunks(text){
  let rest=String(text).replace(/\*\*/g,'').replace(/R\$/g,'reais ').replace(/%/g,' por cento').replace(/×/g,' vezes ').replace(/÷/g,' dividido por ').replace(/−/g,' menos ').replace(/\s+/g,' ').trim();
  const result=[];
  while(rest){let end=Math.min(220,rest.length);if(end<rest.length){const space=rest.lastIndexOf(' ',end);if(space>100)end=space;if(/[\uD800-\uDBFF]/.test(rest[end-1]))end--;}result.push(rest.slice(0,end).trim());rest=rest.slice(end).trim();}
  return result;
 }
 function createController(env){
  const synth=env.speechSynthesis,Utterance=env.SpeechSynthesisUtterance;
  const supported=!!synth&&typeof Utterance==='function'&&['speak','cancel','pause','resume','getVoices'].every(k=>typeof synth[k]==='function');
  let owner=null,current=null,token=0,parts=[],index=0,selected=null,state='idle',timer=null;
  const voices=()=>{try{return supported?[...synth.getVoices()]:[];}catch{return [];}};
  function emit(next,message){state=next;owner?.update(next,message);}
  function stop(message='Áudio interrompido.',error=false){
   token++;if(timer!==null)env.clearTimeout(timer);timer=null;
   const previous=owner;owner=null;current=null;parts=[];index=0;state='idle';
   if(previous){try{synth.cancel();}catch{}previous.update(error?'error':'idle',message);}
  }
  function visible(){if(owner&&!owner.isVisible()){stop('Áudio interrompido ao sair desta explicação.');return false;}return !!owner;}
  function speakNext(){
   if(!visible()||state==='paused')return;
   if(index>=parts.length){const previous=owner;owner=null;current=null;state='idle';previous.update('idle','Leitura concluída.');return;}
   const generation=token,utterance=new Utterance(parts[index]);current=utterance;utterance.lang=selected?.lang||'pt-BR';if(selected)utterance.voice=selected;
   utterance.rate=1;utterance.pitch=1;
   timer=env.setTimeout(()=>{if(generation===token&&owner)stop('O navegador não iniciou a voz. Tente novamente ou escolha outra voz; o texto continua disponível.',true);},10000);
   utterance.onstart=()=>{if(generation!==token||current!==utterance)return;if(timer!==null)env.clearTimeout(timer);timer=null;if(state!=='paused')emit('speaking','Lendo esta explicação.');};
   utterance.onend=()=>{if(generation!==token||current!==utterance)return;if(timer!==null)env.clearTimeout(timer);timer=null;current=null;index++;speakNext();};
   utterance.onerror=()=>{if(generation===token&&owner)stop('Não foi possível reproduzir a voz neste navegador. Tente outra voz; continue pela explicação escrita.',true);};
   try{synth.speak(utterance);}catch{stop('A reprodução de voz falhou. A explicação escrita permanece disponível.',true);}
  }
  return Object.freeze({supported,voices,
   play(nextOwner,text,key=''){
    if(!supported){nextOwner.update('unavailable','Este navegador não oferece síntese de voz. Continue pela explicação escrita.');return;}
    if(!nextOwner.isVisible())return;
    const nextParts=chunks(text);if(!nextParts.length){nextOwner.update('error','Não há texto disponível para ouvir.');return;}
    stop('Outra explicação foi selecionada.');owner=nextOwner;parts=nextParts;index=0;selected=chooseVoice(voices(),key);token++;
    try{synth.cancel();if(synth.paused)synth.resume();}catch{}
    emit('starting','Preparando a voz do navegador…');speakNext();
   },
   pause(target){if(owner!==target||!['speaking','starting'].includes(state))return;try{synth.pause();if(timer!==null)env.clearTimeout(timer);timer=null;emit('paused','Leitura pausada.');}catch{stop('Este navegador não conseguiu pausar. Use Ouvir para reiniciar.',true);}},
   resume(target){if(owner!==target||state!=='paused'||!visible())return;try{emit('speaking','Continuando a leitura.');if(current)synth.resume();else speakNext();}catch{stop('Este navegador não conseguiu continuar. Use Ouvir para reiniciar.',true);}},
   stop,checkVisible:visible,isOwner:target=>owner===target
  });
 }
 let runtime=null;
 function setup(){
  if(runtime)return runtime;
  const engine=createController(globalThis),entries=new Set();
  const refresh=()=>entries.forEach(e=>e.refresh());
  globalThis.speechSynthesis?.addEventListener?.('voiceschanged',refresh);
  const observe=()=>{engine.checkVisible();for(const e of entries)if(!e.host.isConnected)entries.delete(e);};
  new MutationObserver(observe).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')engine.stop('Áudio interrompido ao sair desta página.');});
  globalThis.addEventListener('pagehide',()=>engine.stop());
  runtime={engine,entries};return runtime;
 }
 function attach(host,text){
  const {engine,entries}=setup();
  const group=document.createElement('span');group.className='leo-audio';group.setAttribute('role','group');group.setAttribute('aria-label','Áudio desta explicação');
  const makeButton=label=>{const b=document.createElement('button');b.type='button';b.textContent=label;group.append(b);return b;};
  const play=makeButton('🔊 Ouvir explicação'),pause=makeButton('Pausar áudio'),resume=makeButton('Continuar áudio'),stop=makeButton('Interromper áudio');
  const label=document.createElement('label');label.textContent='Voz para esta explicação: ';const select=document.createElement('select');label.append(select);group.append(label);
  const status=document.createElement('span');status.className='leo-audio-status';status.setAttribute('role','status');group.append(status);
  const note=document.createElement('small');note.textContent='Voz do navegador; timbre e disponibilidade variam. Algumas vozes dependem de internet.';group.append(note);host.append(group);
  let currentState='idle';
  const owner={isVisible:()=>host.isConnected&&!host.closest('[hidden]')&&document.visibilityState!=='hidden',update(next,message){currentState=next;const active=['starting','speaking','paused'].includes(next);play.disabled=!engine.supported||active;pause.disabled=!engine.supported||!['starting','speaking'].includes(next);resume.disabled=!engine.supported||next!=='paused';stop.disabled=!engine.supported||!active;select.disabled=!engine.supported||active;status.textContent=message;}};
  function refresh(){
   const key=select.value;select.replaceChildren();const automatic=document.createElement('option');automatic.value='';automatic.textContent='Automática · priorizar português brasileiro';select.append(automatic);
   for(const v of engine.voices()){const option=document.createElement('option');option.value=voiceKey(v);option.textContent=v.name+' ('+v.lang+')';select.append(option);}
   if([...select.options].some(o=>o.value===key))select.value=key;
   if(currentState==='idle')status.textContent=engine.supported?(engine.voices().length?'Áudio opcional. Escolha Ouvir para iniciar.':'Voz padrão do navegador; a lista de vozes ainda não está disponível.'):'Este navegador não oferece síntese de voz. Continue pela explicação escrita.';
  }
  entries.add({host,refresh});refresh();owner.update(engine.supported?'idle':'unavailable',status.textContent);
  play.addEventListener('click',()=>engine.play(owner,text,select.value));pause.addEventListener('click',()=>engine.pause(owner));resume.addEventListener('click',()=>engine.resume(owner));stop.addEventListener('click',()=>{if(engine.isOwner(owner))engine.stop();});
  return group;
 }
 globalThis.DecolaLeoAudio=Object.freeze({attach,createController,chooseVoice,chunks});
})();
