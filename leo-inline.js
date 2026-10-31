// Pilot: in-place, opt-in conversation attached only to percentage question cards.
(() => {
  let serial = 0;
  function mount({host, question, getState, dashboard}) {
    const api = globalThis.DecolaLeoClient;
    const id = 'leo-inline-'+(++serial);
    const trigger = document.createElement('button');
    trigger.type='button';trigger.className='study-smart-retry leo-inline-trigger';
    trigger.textContent='🎓 Professor Leo, me explica!';trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls',id);
    const box=document.createElement('section');box.id=id;box.className='leo-inline';box.hidden=true;
    box.setAttribute('aria-label','Explicação do Professor Leo — '+question.q);
    const top=document.createElement('div');top.className='leo-inline-top';
    const title=document.createElement('h4');title.textContent='🎓 Professor Leo — Porcentagem';
    const close=document.createElement('button');close.type='button';close.textContent='Fechar explicação';
    top.append(title,close);
    const mode=document.createElement('p');mode.className='leo-inline-mode';
    const log=document.createElement('div');log.className='leo-inline-log';log.setAttribute('role','log');log.setAttribute('aria-live','polite');log.setAttribute('aria-label','Conversa desta questão');
    const label=document.createElement('label');label.htmlFor=id+'-input';label.textContent='Sua pergunta complementar';
    const input=document.createElement('textarea');input.id=id+'-input';input.rows=2;input.maxLength=700;input.placeholder='O que você gostaria de entender melhor?';
    const actions=document.createElement('div');actions.className='leo-inline-actions';
    const send=document.createElement('button');send.type='button';send.textContent='Enviar pergunta';
    const retry=document.createElement('button');retry.type='button';retry.textContent='Tentar explicação novamente';retry.hidden=true;
    actions.append(send,retry);
    const status=document.createElement('p');status.setAttribute('role','status');status.className='leo-inline-status';
    const localNotice=document.createElement('p');localNotice.className='notice leo-inline-environment';localNotice.textContent=api.environmentNotice();localNotice.hidden=!localNotice.textContent;
    const note=document.createElement('small');note.textContent='Sua solicitação e o contexto desta questão serão enviados à API do Professor Leo. Não envie dados pessoais. Confira informações importantes.';
    box.append(top,mode,localNotice,log,label,input,actions,status,note);host.append(trigger,box);
    let signature='',context=null,history=[],controller=null,busy=false,initialized=false,lastStart=0,failedMessage=null,originScroll=0;
    function bubble(who,text){const p=document.createElement('p');p.className='leo-inline-bubble '+who;const name=document.createElement('strong');name.textContent=who==='student'?'Você: ':'Professor Leo: ';const body=document.createElement('span');body.textContent=text;p.append(name,body);log.append(p);}
    function abort(){if(busy)status.textContent='Solicitação interrompida. Abra novamente para continuar.';controller?.abort();controller=null;busy=false;send.disabled=false;retry.disabled=false;}
    function sync(){
      const state=getState();trigger.hidden=!Number.isInteger(state?.choice);
      const next=trigger.hidden?'':JSON.stringify([state.choice,state.attempts]);
      if(next===signature)return;
      abort();signature=next;context=null;history=[];initialized=false;lastStart=0;failedMessage=null;
      log.replaceChildren();input.value='';status.textContent='';retry.hidden=true;box.hidden=true;trigger.setAttribute('aria-expanded','false');
      if(next){try{context=api.questionContext(question,state);}catch{trigger.hidden=true;return;}mode.textContent=context.mode==='hint'?'Vamos pensar juntos, sem revelar a resposta: você ainda tem uma tentativa.':'Vamos entender a resolução, passo a passo.';}
    }
    async function ask(followup=''){
      if(busy||!context)return;
      // Client-side courtesy limit; the server must enforce its own rate/cost limits.
      if(lastStart && Date.now()-lastStart<15000){status.textContent='Aguarde alguns segundos antes de pedir outra explicação.';return;}
      busy=true;lastStart=Date.now();send.disabled=true;retry.disabled=true;retry.hidden=true;
      const current=signature, snapshot=context, text=api.explanationMessage(snapshot,followup);
      const requestController=new AbortController();controller=requestController;
      const timer=setTimeout(()=>requestController.abort(new DOMException('Tempo limite','TimeoutError')),25000);
      delete status.dataset.errorCode;status.textContent='O Professor Leo está preparando a explicação…';
      const userText=followup||'Professor Leo, me explica esta questão.';
      try{
        const answer=await api.request({message:text,history,signal:requestController.signal});
        if(current!==signature||!host.isConnected||requestController.signal.aborted)return;
        bubble('student',userText);bubble('teacher',answer);
        history.push({role:'user',content:text},{role:'assistant',content:answer});history=history.slice(-8);
        initialized=true;failedMessage=null;input.value='';status.textContent='Pode fazer outra pergunta sobre esta questão.';
      }catch(error){
        if(current!==signature||!host.isConnected||controller!==requestController)return;
        if(box.hidden){status.textContent='Solicitação interrompida ao fechar. Abra novamente para continuar.';return;}
        failedMessage=followup;retry.hidden=false;
        status.dataset.errorCode=error.code||error.name||'unknown';
        status.textContent=api.errorMessage(error);
      }finally{
        clearTimeout(timer);
        if(controller===requestController){controller=null;busy=false;send.disabled=false;retry.disabled=false;}
      }
    }
    trigger.addEventListener('click',()=>{
      const wasHidden=box.hidden;sync();if(!context)return;
      if(wasHidden)originScroll=dashboard.closest('.leo-panel').querySelector('.leo-body').scrollTop;
      box.hidden=false;trigger.setAttribute('aria-expanded','true');
      box.scrollIntoView({block:'nearest'});close.focus({preventScroll:true});if(!initialized)ask();
    });
    function hide(){box.hidden=true;trigger.setAttribute('aria-expanded','false');abort();dashboard.closest('.leo-panel').querySelector('.leo-body').scrollTo(0,originScroll);trigger.focus({preventScroll:true});}
    close.addEventListener('click',hide);
    box.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();hide();}});
    send.addEventListener('click',()=>{const text=input.value.trim();if(!text){status.textContent='Escreva sua pergunta complementar.';input.focus();return;}ask(text);});
    retry.addEventListener('click',()=>ask(failedMessage||''));
    // Abort when a parent lesson is hidden or removed; no late reply to another screen.
    const panel=dashboard.closest('.leo-panel');
    const observer=new MutationObserver(()=>{
      if(!host.isConnected){abort();observer.disconnect();return;}
      if(dashboard?.hidden||panel?.hidden){abort();if(!box.hidden)box.hidden=true;trigger.setAttribute('aria-expanded','false');}
    });
    observer.observe(panel,{attributes:true,attributeFilter:['hidden'],subtree:true,childList:true});
    sync();return {sync};
  }
  globalThis.DecolaLeoInline=Object.freeze({mount});
})();
