// Local commercial rehearsal. No accounts, entitlement, payment, APIs or storage.
(() => {
 const DAY=86400000;
 const plan=Object.freeze({trialDays:7,priceCents:4990,currency:'BRL',billingPeriod:'month'});
 function trialAt(startAt,now){
  if(!Number.isSafeInteger(now)||now<0)throw new Error('Relógio de teste inválido.');
  if(startAt===null)return Object.freeze({status:'not_started',daysRemaining:null,endsAt:null});
  if(!Number.isSafeInteger(startAt)||startAt<0||!Number.isSafeInteger(startAt+plan.trialDays*DAY))throw new Error('Início de teste inválido.');
  const endsAt=startAt+plan.trialDays*DAY;
  return Object.freeze({status:now<startAt?'scheduled':now<endsAt?'trial_active':'trial_expired',daysRemaining:now<startAt?7:Math.max(0,Math.ceil((endsAt-now)/DAY)),endsAt});
 }
 const kinds=Object.freeze({question:'Dúvida',problem:'Problema técnico',complaint:'Reclamação',suggestion:'Sugestão'});
 const topics=Object.freeze({access:'Acesso e conta',lesson:'Aulas e exercícios',leo:'Professor Leo e áudio',plan:'Teste gratuito e assinatura',other:'Outro assunto'});
 function supportDraft({kind,topic,message,context}){
  if(!Object.hasOwn(kinds,kind)||!Object.hasOwn(topics,topic))throw new Error('Escolha um tipo e um assunto válidos.');
  if(typeof message!=='string'||!message.trim()||message.length>1200)throw new Error('Escreva uma mensagem de até 1.200 caracteres.');
  if(!['Página inicial','Área de estudos'].includes(context))throw new Error('Contexto de teste inválido.');
  return 'DECOLA — RASCUNHO LOCAL, NÃO ENVIADO\nTipo: '+kinds[kind]+'\nAssunto: '+topics[topic]+'\nOrigem: '+context+'\nMensagem: '+message.trim();
 }
 globalThis.DecolaCommercialPreview=Object.freeze({plan,trialAt,supportDraft,kinds,topics});
 if(typeof document==='undefined')return;
 function initialize(){
  const dialog=document.createElement('dialog');dialog.className='commercial-dialog';dialog.setAttribute('aria-labelledby','commercial-title');
  const top=document.createElement('div');top.className='commercial-dialog-top';
  const title=document.createElement('h2');title.id='commercial-title';
  const closeButton=document.createElement('button');closeButton.type='button';closeButton.textContent='Fechar';closeButton.setAttribute('aria-label','Fechar painel comercial');
  top.append(title,closeButton);const body=document.createElement('div');body.className='commercial-dialog-body';dialog.append(top,body);document.body.append(dialog);
  let opener=null;
  const close=()=>dialog.close();closeButton.addEventListener('click',close);
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  // Let the native modal own Tab/Escape; do not close the surrounding study area.
  dialog.addEventListener('keydown',event=>{if(['Tab','Escape'].includes(event.key))event.stopPropagation();});
  dialog.addEventListener('close',()=>{document.body.append(dialog);const targets=[opener,opener?.closest('.leo-panel')?.querySelector('.study-menu-toggle'),document.querySelector('.leo-panel:not([hidden]) .leo-close'),document.querySelector('main')];targets.find(node=>node?.isConnected&&!node.inert&&!node.closest('[inert]')&&node.getClientRects().length)?.focus({preventScroll:true});});
  const make=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
  const button=(text,fn)=>{const node=make('button',text);node.type='button';node.addEventListener('click',fn);return node;};
  const notice=text=>{const node=make('p',text);node.className='commercial-notice';return node;};
  function offer(){
   title.textContent='7 dias grátis · prévia do lançamento';body.replaceChildren();
   body.append(notice('SIMULAÇÃO LOCAL — não cria conta, não inicia um teste real e não cobra.'),make('p','Plano planejado: sete dias gratuitos e, se você decidir contratar, R$ 49,90 por mês. A proposta de teste sem cartão e contratação posterior ainda precisa ser confirmada antes do lançamento.'));
   const steps=make('ol');for(const text of ['Criar uma conta e verificar seu contato na versão final. Para menor de idade, seguir o fluxo do responsável.','Pedir o início dos sete dias após a conta estar pronta. O horário e o acesso serão confirmados pelo serviço.','Experimentar aulas, exercícios e Professor Leo conforme os recursos liberados no lançamento.','Ao terminar, decidir se quer contratar por R$ 49,90/mês. Esta prévia não faz conversão nem cobrança automática.'])steps.append(make('li',text));body.append(steps);
   const status=make('p');status.setAttribute('role','status');status.className='commercial-state';
   const base=Date.UTC(2026,10,2,12);let start=null,clock=base;
   const update=()=>{const state=trialAt(start,clock);status.dataset.trialState=state.status;status.textContent=state.status==='not_started'?'Cenário de teste: ainda não iniciado.':state.status==='trial_expired'?'Cenário de teste: sete dias encerrados. Nenhum pagamento foi processado e seu acesso à demonstração não mudou.':'Cenário de teste: '+state.daysRemaining+' dia(s) restante(s), de sete. Nenhum teste real está ativo.';};
   const actions=make('div');actions.className='commercial-actions';
   actions.append(button('Simular início dos 7 dias',()=>{start=base;clock=base;update();}),button('Simular último dia',()=>{start=base;clock=base+6*DAY;update();}),button('Simular fim dos 7 dias',()=>{start=base;clock=base+7*DAY;update();}),button('Reiniciar cenário',()=>{start=null;clock=base;update();}));
   const unavailable=button('Assinatura real indisponível nesta prévia',()=>{});unavailable.disabled=true;
   body.append(make('h3','Explore o fluxo sem cadastrar dados'),status,actions,unavailable,make('p','Login, recuperação de acesso e gerenciamento da assinatura ainda não estão implementados. Não informe e-mail, senha, telefone ou dados de pagamento nesta prévia.'),button('Explorar área de estudos · demonstração',()=>{close();document.dispatchEvent(new CustomEvent('decola:open-study',{detail:{view:'dashboard'}}));}));update();
  }
  function support(context){
   title.textContent='Ajuda e suporte';body.replaceChildren();
   body.append(notice('PRÉVIA DE SUPORTE — não há envio de mensagem, protocolo ou atendimento conectado.'),make('p','Você pode consultar as orientações e preparar um rascunho de teste. Use exemplos fictícios; não inclua senha, CPF, dados de pagamento ou conversas privadas.'));
   const faq=make('section');faq.setAttribute('aria-label','Orientações rápidas');
   for(const [question,answer]of [
    ['Como continuar minha aula?','No Meu Decola, use “Continuar estudando”. O progresso é local ao endereço e navegador; confira os avisos de salvamento e guarde uma cópia quando disponível.'],
    ['O Professor Leo não respondeu.','Confira a conexão e use a dica ou resolução local quando oferecida. Uma falha da IA não deve apagar sua tentativa. Não compartilhe credenciais para pedir ajuda.'],
    ['Por que a voz não é sempre Elvis?','O MP3 Elvis está no piloto específico. As respostas dinâmicas usam a voz disponível no navegador. Gravações novas ainda dependem de validação e autorização.'],
    ['Já existe cobrança ou conta de assinante?','Não. Há uma demonstração com perfis fictícios. Os sete dias e a assinatura de R$ 49,90/mês são planejados; usar a demonstração não ativa uma assinatura.']
   ]){const details=make('details');details.append(make('summary',question),make('p',answer));faq.append(details);}body.append(faq);
   const form=make('form');form.className='commercial-support-form';
   const select=(text,values)=>{const label=make('label',text),node=make('select');node.setAttribute('aria-label',text);for(const [value,name]of Object.entries(values)){const option=make('option',name);option.value=value;node.append(option);}label.append(node);form.append(label);return node;};
   const kind=select('Tipo de contato',kinds),topic=select('Assunto',topics);
   const label=make('label','Mensagem de teste (até 1.200 caracteres)'),message=make('textarea');message.rows=4;message.maxLength=1200;label.append(message);form.append(label);
   const generate=make('button','Preparar rascunho local');generate.type='submit';form.append(generate);
   const status=make('p');status.setAttribute('role','status');
   const outputLabel=make('label','Rascunho preparado — não enviado'),output=make('textarea');output.rows=6;output.readOnly=true;outputLabel.hidden=true;outputLabel.append(output);
   const copy=button('Copiar rascunho',async()=>{if(!output.value)return;const text=output.value;try{await navigator.clipboard.writeText(text);if(output.value===text)status.textContent='Rascunho copiado. Ele não foi enviado nem registrado por uma equipe.';}catch{if(output.value!==text)return;output.focus();output.select();status.textContent='Cópia automática indisponível. Copie o texto selecionado manualmente. Nada foi enviado.';}});copy.hidden=true;
   const clear=button('Limpar rascunho desta prévia',()=>{message.value='';output.value='';outputLabel.hidden=true;copy.hidden=true;status.textContent='Rascunho local limpo. Nenhum chamado externo foi alterado.';});
   const invalidate=()=>{output.value='';outputLabel.hidden=true;copy.hidden=true;status.textContent='Mensagem alterada. Prepare novamente o rascunho antes de copiar.';};
   message.addEventListener('input',invalidate);kind.addEventListener('change',invalidate);topic.addEventListener('change',invalidate);
   form.addEventListener('submit',event=>{event.preventDefault();try{output.value=supportDraft({kind:kind.value,topic:topic.value,message:message.value,context});outputLabel.hidden=false;copy.hidden=false;status.textContent='Rascunho preparado somente nesta página. Não há chamado enviado, protocolo ou confirmação de atendimento.';}catch(error){status.textContent=error.message;message.focus();}});
   body.append(make('h3','Dúvidas, problemas, reclamações e sugestões'),form,status,outputLabel,copy,clear,make('p','WhatsApp e atendimento humano ainda não estão conectados nesta prévia. O rascunho não é salvo após sair ou atualizar; copie antes de fechar o painel.'));
  }
  document.addEventListener('click',event=>{
   const trigger=event.target.closest('[data-decola-support],[data-decola-offer]');if(!trigger)return;event.preventDefault();
   const panel=trigger.closest('.leo-panel');opener=trigger;
   if(trigger.hasAttribute('data-decola-support'))support(panel?'Área de estudos':'Página inicial');else offer();
   (panel||document.body).append(dialog);dialog.inert=false;
   if(typeof dialog.showModal==='function'){dialog.showModal();closeButton.focus({preventScroll:true});}
   else{dialog.remove();const message=make('p','Este navegador não oferece o painel de prévia. Use uma versão atualizada do navegador; nenhuma conta ou cobrança foi criada.');message.setAttribute('role','status');trigger.after(message);}
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize);else initialize();
})();
