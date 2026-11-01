// Separate conversation per memory item; reuses Leo's real transport, never the original chat state.
(() => {
 function mount({host,index,getState,markSupport}){
  const model=globalThis.DecolaMemory,api=globalThis.DecolaLeoClient;
  const make=(tag,text)=>{const el=document.createElement(tag);if(text)el.textContent=text;return el;};
  const trigger=make('button','🎓 Perguntar ao Leo sobre este item');trigger.type='button';trigger.setAttribute('aria-expanded','false');
  const box=make('section');box.className='memory-leo';box.hidden=true;box.setAttribute('aria-label','Ajuda do Leo no Desafio · '+(index+1));
  const close=make('button','Fechar ajuda do Desafio');close.type='button';
  const log=make('div');log.className='leo-inline-log';log.setAttribute('role','log');log.setAttribute('aria-live','polite');
  const label=make('label','Pergunta complementar ao Leo');const input=make('textarea');input.rows=2;input.maxLength=model.helpLimit(getState(),index);label.append(input);
  const send=make('button','Enviar pergunta ao Leo');send.type='button';const retry=make('button','Tentar ajuda novamente');retry.type='button';retry.hidden=true;
  const status=make('p');status.setAttribute('role','status');
  const fallback=make('details');fallback.hidden=true;fallback.append(make('summary','Orientação local (sem IA)'),make('p',getState().status==='review'?model.items[index].reference:model.items[index].hint));
  box.append(close,make('p','Somente sua solicitação envia este item e sua resposta à API do Leo. Não envie dados pessoais.'),log,label,send,retry,status,fallback);host.append(trigger,box);
  let controller=null,history=[],busy=false,lastStart=0,lastQuestion='',origin=0;
  const scroll=host.closest('.leo-panel')?.querySelector('.leo-body');
  function abort(){controller?.abort();controller=null;busy=false;send.disabled=false;retry.disabled=false;}
  function hide(){box.hidden=true;trigger.setAttribute('aria-expanded','false');abort();scroll?.scrollTo(0,origin);trigger.focus({preventScroll:true});}
  function bubble(who,text){const p=make('p');p.className='leo-inline-bubble';p.append(make('strong',who+': '),document.createTextNode(text));log.append(p);}
  async function ask(question=''){
   if(busy)return;
   if(question.length>model.helpLimit(getState(),index)){status.textContent='Encurte a pergunta para manter o contexto completo.';return;}
   if(lastStart&&Date.now()-lastStart<15000){status.textContent='Aguarde alguns segundos e tente novamente.';return;}
   markSupport('aiRequested');lastQuestion=question;lastStart=Date.now();busy=true;send.disabled=true;retry.disabled=true;retry.hidden=true;
   const active=new AbortController();controller=active;const timer=setTimeout(()=>active.abort(new DOMException('Tempo limite','TimeoutError')),25000);
   const message=model.helpMessage(getState(),index,question);status.textContent='O Professor Leo está preparando a orientação…';
   try{
    const answer=await api.request({message,history,signal:active.signal});
    if(controller!==active||active.signal.aborted||!host.isConnected||box.hidden)return;
    bubble('Você',question||'Professor Leo, me ajude com este item.');bubble('Professor Leo',answer);history.push({role:'user',content:message},{role:'assistant',content:answer});history=history.slice(-8);markSupport('aiReceived');input.value='';status.textContent='Você pode fazer outra pergunta sobre este item.';fallback.hidden=true;
   }catch(error){
    if(controller!==active||box.hidden||!host.isConnected)return;
    status.textContent=api.errorMessage(error)+' Sua resposta foi mantida; a orientação local está disponível abaixo.';fallback.hidden=false;retry.hidden=false;
   }finally{clearTimeout(timer);if(controller===active){controller=null;busy=false;send.disabled=false;retry.disabled=false;}}
  }
  trigger.addEventListener('click',()=>{origin=scroll?.scrollTop||0;box.hidden=false;trigger.setAttribute('aria-expanded','true');box.scrollIntoView({block:'nearest'});close.focus({preventScroll:true});if(!history.length)ask();});
  close.addEventListener('click',hide);box.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();hide();}});
  send.addEventListener('click',()=>{const text=input.value.trim();if(!text){status.textContent='Escreva sua pergunta complementar.';input.focus();return;}ask(text);});retry.addEventListener('click',()=>ask(lastQuestion));
  const panel=host.closest('.leo-panel'),dashboard=host.closest('.study-dashboard');
  const observer=new MutationObserver(()=>{if(!host.isConnected){abort();observer.disconnect();}else if(panel.hidden||dashboard.hidden){abort();if(!box.hidden)box.hidden=true;trigger.setAttribute('aria-expanded','false');}});
  observer.observe(panel,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
 }
 globalThis.DecolaMemoryHelp=Object.freeze({mount});
})();
