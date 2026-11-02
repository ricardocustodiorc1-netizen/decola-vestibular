// Local MP3 association only. No synthesis, API request, credentials or storage.
export const normalizeAudioText = text => typeof text === 'string' ? text.replace(/\s+/gu,' ').trim() : '';
export function resolveLessonAudio(catalog, id, context) {
  if(catalog?.schemaVersion!==1 || !Array.isArray(catalog.entries)) return null;
  const matches=catalog.entries.filter(entry=>entry.id===id);
  if(matches.length!==1) return null;
  const entry=matches[0];
  if(entry.status!=='ready' || entry.voice!=='Elvis' || !Number.isInteger(entry.revision) || entry.revision<1) return null;
  if(!/^audios\/[a-zA-Z0-9_/-]+\.mp3$/.test(entry.src) || entry.src.split('/').includes('..')) return null;
  if(!context || entry.lessonId!==context.lessonId || entry.phase!==context.phase || !['lesson','hint','solution'].includes(entry.phase)) return null;
  if(!normalizeAudioText(context.text) || normalizeAudioText(entry.text)!==normalizeAudioText(context.text)) return null;
  if(entry.phase==='solution' && !(context.correct===true || (Number.isInteger(context.attempts) && context.attempts>=2))) return null;
  return Object.freeze({...entry});
}

export function createLessonAudioController(env={createAudio:()=>new Audio()}) {
  let current=null,generation=0,timer=null;
  const clearTimer=()=>{if(timer!==null)(env.clearTimeout||globalThis.clearTimeout)(timer);timer=null;};
  const startTimer=token=>{clearTimer();timer=(env.setTimeout||globalThis.setTimeout)(()=>fail(token,'O MP3 Elvis demorou para iniciar. Verifique a conexão e tente novamente; o texto continua disponível.'),15000);};
  const update=(owner,state,message)=>owner.update(state,message);
  function stop(message='Áudio interrompido.') {
    clearTimer();
    if(!current) return;
    const old=current;current=null;generation++;
    old.audio.pause();try{old.audio.currentTime=0;}catch{}
    old.audio.removeAttribute?.('src');old.audio.load?.();
    update(old.owner,'idle',message);
  }
  function fail(token,message){if(current?.token!==token)return;const owner=current.owner;stop();update(owner,'error',message);}
  function checkVisible(){if(current && !current.owner.isVisible())stop('Áudio interrompido ao sair desta explicação.');}
  async function play(owner,entry){
    stop('Outra explicação foi selecionada.');
    if(!owner.isVisible())return;
    const token=++generation;
    let audio;
    try{
      audio=env.createAudio();current={owner,audio,token,entry,state:'loading'};
      audio.preload='none';audio.src=new URL(entry.src,import.meta.url).href;
      audio.addEventListener('ended',()=>{if(current?.token===token)stop('Explicação concluída.');});
      audio.addEventListener('error',()=>fail(token,'Não foi possível carregar o MP3 Elvis. Verifique a conexão. A explicação escrita foi mantida.'));
      update(owner,'loading','Carregando a gravação Elvis…');
      startTimer(token);
      await audio.play();
      if(current?.token!==token){audio.pause();return;}
      clearTimer();
      if(!owner.isVisible()){stop();return;}
      current.state='playing';update(owner,'playing','Reproduzindo gravação Elvis.');
    }catch{const message='Não foi possível reproduzir o MP3 Elvis. Toque novamente em Ouvir. A explicação escrita foi mantida.';if(current?.token===token)fail(token,message);else if(generation===token)update(owner,'error',message);}
  }
  function pause(owner){if(current?.owner!==owner || current.state!=='playing')return;current.audio.pause();current.state='paused';update(owner,'paused','Áudio pausado.');}
  async function resume(owner){
    if(current?.owner!==owner || current.state!=='paused')return;
    const token=current.token;current.state='loading';update(owner,'loading','Continuando áudio…');
    try{startTimer(token);await current.audio.play();if(current?.token!==token)return;clearTimer();if(!owner.isVisible()){stop();return;}current.state='playing';update(owner,'playing','Reproduzindo gravação Elvis.');}
    catch{fail(token,'Não foi possível continuar o MP3 Elvis. A explicação escrita foi mantida.');}
  }
  return Object.freeze({play,pause,resume,stop,checkVisible,isOwner:owner=>current?.owner===owner});
}

let shared;
function runtime(){
  if(shared)return shared;
  shared=createLessonAudioController();
  globalThis.addEventListener('decola:audio-start',event=>{if(event.detail?.source!=='mp3')shared.stop('Outro áudio foi selecionado.');});
  new MutationObserver(()=>shared.checkVisible()).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class','open']});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)shared.stop('Áudio interrompido ao sair da página.');});
  window.addEventListener('pagehide',()=>shared.stop());
  return shared;
}
export function mountLessonAudio({host,catalog,id,getContext,controller}) {
  const engine=controller||runtime(),group=document.createElement('div');group.className='lesson-mp3-controls';
  group.setAttribute('role','group');group.setAttribute('aria-label','Gravação Elvis desta explicação');
  const buttons=['🔊 Ouvir explicação','Pausar','Continuar','Interromper'].map(label=>{const b=document.createElement('button');b.type='button';b.textContent=label;group.append(b);return b;});
  const status=document.createElement('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');group.append(status);host.append(group);
  const [play,pause,resume,stop]=buttons;
  const available=()=>resolveLessonAudio(catalog,id,getContext());
  const owner={isVisible:()=>host.isConnected&&!host.closest('[hidden],.hidden,details:not([open])')&&document.visibilityState!=='hidden'&&!!available(),update(state,message){
    play.disabled=!available()||['loading','playing','paused'].includes(state);pause.disabled=state!=='playing';resume.disabled=state!=='paused';stop.disabled=!['loading','playing','paused'].includes(state);status.textContent=message;
  }};
  const refresh=()=>{
    if(engine.isOwner(owner))engine.stop();
    owner.update('idle',available()?'Voz Elvis disponível. Toque em Ouvir; nada começa automaticamente.':'Ainda não há gravação Elvis correspondente a este texto e etapa. Continue pela explicação escrita.');
  };
  play.addEventListener('click',()=>{const entry=available();if(!entry){refresh();return;}if(typeof globalThis.dispatchEvent==='function'&&typeof globalThis.CustomEvent==='function')globalThis.dispatchEvent(new CustomEvent('decola:audio-start',{detail:{source:'mp3'}}));engine.play(owner,entry);});
  pause.addEventListener('click',()=>engine.pause(owner));resume.addEventListener('click',()=>engine.resume(owner));stop.addEventListener('click',()=>{if(engine.isOwner(owner))engine.stop();});
  refresh();return Object.freeze({refresh,destroy(){if(engine.isOwner(owner))engine.stop();group.remove();}});
}
