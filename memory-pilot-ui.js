// Optional Caderno invitation and three-item memory round, only in the percentage lesson.
(() => {
 const api=globalThis.DecolaMemory;
 let storage;try{storage=globalThis.localStorage;}catch{}
 const store=api.create(storage);
 const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text)el.textContent=text;return el;};
 const button=(text,fn)=>{const el=make('button','study-dashboard-all',text);el.type='button';el.addEventListener('click',fn);return el;};
 function mount({registerHost,challengeHost,practice,available}){
  let isAvailable=available;
  registerHost.className='study-smart-card memory-register';
  registerHost.append(make('h3','','2. Registrar do seu jeito'),make('p','','Em uma frase, explique o que você entendeu. Use caderno físico, aplicativo pessoal ou os dois. Anotar é opcional e não impede continuar.'));
  const details=make('details'),summary=make('summary','','Ver sugestões de registro');
  details.append(summary);const list=make('ul');for(const text of ['Explique a ideia principal com suas palavras, em vez de só copiar.','Invente um exemplo e conte como pensou.','Se anotar uma fórmula, explique suas partes e quando usar.','Registre uma dúvida ou um erro que quer evitar.'])list.append(make('li','',text));details.append(list);
  details.addEventListener('keydown',event=>{if(event.key==='Escape'&&details.open){event.preventDefault();event.stopPropagation();details.open=false;summary.focus();}});
  const label=make('label','','Hoje vou usar (opcional): '),select=make('select');select.setAttribute('aria-label','Formato de anotação opcional');
  for(const [value,text]of [['none','Prefiro não escolher agora'],['physical','Caderno físico'],['personal-digital','Aplicativo pessoal'],['combined','Papel e aplicativo']]){const opt=make('option','',text);opt.value=value;select.append(opt);}select.value=store.read().notePreference;
  select.addEventListener('change',()=>{store.dispatch({type:'preference',value:select.value});updateIssue();});label.append(select);
  registerHost.append(details,label,button('Continuar para a prática',()=>{practice.scrollIntoView({block:'start'});practice.tabIndex=-1;practice.focus({preventScroll:true});}));
  challengeHost.className='study-smart-card memory-pilot';challengeHost.dataset.memoryPilot='';
  const title=make('h3','','4. Recordar · Desafio da Memória — Porcentagem'),intro=make('p','','Três perguntas para lembrar e aplicar. Tente primeiro sem consultar. Você pode pedir ajuda, consultar ou deixar para depois, sem perder a aula.'),privacy=make('p','memory-privacy','Respostas curtas e rascunhos ficam somente neste navegador, até você apagá-los. Não envie dados pessoais. Nenhuma nota é atribuída automaticamente.'),issue=make('p','notice');issue.setAttribute('role','status');
  const content=make('div','memory-content');
  const tools=make('details','memory-data-tools');tools.append(make('summary','','Dados deste Desafio'));
  const backup=make('textarea');backup.readOnly=true;backup.rows=4;backup.hidden=true;backup.setAttribute('aria-label','Cópia dos dados somente deste desafio');
  tools.append(make('p','','Copiar ou apagar aqui afeta somente o Desafio de Porcentagem e sua preferência de caderno. Suas aulas e simulados permanecem intactos.'),button('Mostrar cópia das minhas respostas',()=>{backup.value=JSON.stringify(store.read(),null,2);backup.hidden=false;backup.focus();backup.select();}),backup,button('Apagar somente os dados deste Desafio',()=>{store.clear();select.value=store.read().notePreference;render();}));
  challengeHost.append(title,intro,privacy,issue,content,tools);
  function updateIssue(){issue.textContent=store.issue();issue.hidden=!issue.textContent;}
  function change(action){store.dispatch(action);updateIssue();}
  function focusContent(){if(content.isConnected&&!challengeHost.closest('.study-dashboard')?.hidden){const target=content.querySelector('h4')||content;target.tabIndex=-1;target.focus({preventScroll:true});target.scrollIntoView({block:'nearest'});}}
  function start(){change({type:'start'});render();focusContent();}
  function defer(){change({type:'defer'});render();focusContent();}
  function supportedText(r){const s=r.support;return s.consulted?'Consulta declarada':s.aiReceived?'Ajuda da IA recebida':s.hint?'Dica local utilizada':s.aiRequested?'Ajuda de IA solicitada, sem confirmação de resposta':'Sem ajuda registrada (autodeclarado)';}
  function help(host,index){globalThis.DecolaMemoryHelp.mount({host,index,getState:()=>store.read(),markSupport:kind=>change({type:'support',index,kind})});}
  function render(){
   content.replaceChildren();updateIssue();const state=store.read();
   if(!isAvailable){content.append(make('p','','O Desafio fica disponível ao concluir as três questões da prática. Você pode seguir estudando e voltar depois.'));return;}
   if(state.status==='idle'||state.status==='deferred'){
    content.append(make('h4','',state.status==='deferred'?'Desafio adiado · sua aula continua preservada':'O que ficou na memória?'),button(state.status==='deferred'?'Retomar Desafio da Memória':'Começar Desafio da Memória',start));
    if(state.status==='idle')content.append(button('Deixar o Desafio para depois',defer));return;
   }
   if(state.status==='active'){
    const index=state.index,item=api.items[index];
    const heading=make('h4','','Porcentagem · Recordar · Pergunta '+(index+1)+' de 3');
    const label=make('label','',item.question),input=make('textarea');input.rows=3;input.maxLength=300;input.value=state.drafts[index];input.setAttribute('aria-label','Sua resposta ao Desafio '+(index+1));label.append(input);
    const status=make('p');status.setAttribute('role','status');
    const submit=notRemembered=>{if(!notRemembered&&!input.value.trim()){status.textContent='Escreva sua ideia ou escolha “Não lembro ainda”.';input.focus();return;}change({type:'submit',index,notRemembered});render();focusContent();};
    input.addEventListener('input',()=>change({type:'draft',index,value:input.value}));
    const local=make('details','memory-local-hint');local.append(make('summary','','Pedir uma dica local (sem IA)'),make('p','',item.hint));local.open=state.support[index].hint;local.addEventListener('toggle',()=>{if(local.open)change({type:'support',index,kind:'hint'});});
    const consult=make('p','',state.support[index].consulted?'Consulta declarada. Tudo bem precisar de apoio.':'');consult.setAttribute('role','status');
    content.append(heading,label,make('small','','Até 300 caracteres. A referência só aparece depois das três perguntas.'),button('Registrar resposta e seguir',()=>submit(false)),button('Não lembro ainda',()=>submit(true)),local,button('Consultar minhas anotações',()=>{change({type:'support',index,kind:'consulted'});consult.textContent='Pode consultar. Esta resposta ficará identificada como consulta declarada.';}),consult,status);
    help(content,index);content.append(button('Salvar e deixar o Desafio para depois',defer));return;
   }
   content.append(make('h4','','Rodada registrada · confira e aprenda'),make('p','','Autocorreção guiada pela referência da aula, sem IA. Seus registros não são notas oficiais nem prova de domínio. Pode continuar para outra aula sem acertar tudo.'));
   state.responses.forEach((response,index)=>{
    const item=api.items[index],card=make('section','memory-feedback');card.setAttribute('aria-label','Feedback do Desafio '+(index+1));
    card.append(make('h4','',item.objective),make('p','',item.question),make('p','memory-student','Sua resposta inicial: '+(response.notRemembered?'Não lembro ainda. '+response.answer:response.answer)),make('small','',supportedText(response)),make('p','memory-reference','Referência da aula (sem IA): '+item.reference),make('p','',item.rubric));
    const label=make('label','','Comparando com a referência, como você avalia sua explicação? '),select=make('select');select.setAttribute('aria-label','Autocorreção do item '+(index+1));
    for(const [value,text]of [['','Escolher depois'],['demonstrated','Demonstrei o objetivo'],['partial','Demonstrei parcialmente'],['support','Preciso de apoio'],['unobserved','Ainda não observei / não respondi']]){const opt=make('option','',text);opt.value=value;select.append(opt);}select.value=state.assessments[index]||'';
    select.addEventListener('change',()=>{if(select.value)change({type:'assess',index,value:select.value});else change({type:'assess',index,value:'unobserved'});render();content.querySelectorAll('select')[index]?.focus({preventScroll:true});});label.append(select);card.append(label);
    if(['partial','support','unobserved'].includes(state.assessments[index])||response.notRemembered){
     const reinforce=make('details','memory-reinforce');reinforce.append(make('summary','','Praticar este ponto · reforço sem punição'),make('p','',item.reinforce.question));
     const feedback=make('p');feedback.setAttribute('role','status');
     const submit=value=>{if(!value.trim()||(!item.reinforce.choices&&!Number.isFinite(Number(value.replace(',','.'))))){feedback.textContent='Digite um número válido.';return;}change({type:'reinforce',index,value});const result=store.read().reinforcement[index].at(-1);feedback.textContent=(result?.correct?'✓ Você aplicou a ideia. ':'Vamos revisar juntos. ')+item.reinforce.why+' Sua resposta inicial continua preservada.';};
     if(item.reinforce.choices)item.reinforce.choices.forEach((text,i)=>reinforce.append(button(text,()=>submit(String(i)))));
     else{const answerLabel=make('label','','Resposta ao reforço: '),answer=make('input');answer.type='text';answer.inputMode='decimal';answer.maxLength=40;answerLabel.append(answer);reinforce.append(answerLabel,button('Conferir reforço',()=>submit(answer.value)));}
     const attempts=state.reinforcement[index];if(attempts.length)feedback.textContent='Última atividade: '+(attempts.at(-1).correct?'ideia aplicada. ':'vamos revisar. ')+item.reinforce.why;
     reinforce.append(feedback);card.append(reinforce);
    }
    content.append(card);help(card,index);
   });
   content.append(make('p','','Você pode retomar a aula ou usar “Próxima aula: Frações” no relatório. O Desafio não bloqueia sua progressão.'));
  }
  render();return {setAvailable(value){if(isAvailable!==value){isAvailable=value;render();}}};
 }
 globalThis.DecolaMemoryPilot=Object.freeze({mount});
})();
