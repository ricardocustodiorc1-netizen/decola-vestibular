// Linguagens 2.1: módulo independente para preservar as aulas existentes.
(() => {
 const key='decola-smart-language-interpretation-v1';
 const questions=[
  {q:'Qual é a ideia principal do texto?',opts:['A leitura pode ampliar a compreensão do mundo.','Os livros substituem todas as experiências.','Ler é útil apenas para provas.'],answer:0,hint:'Procure a mensagem que resume o texto inteiro, não apenas um detalhe.',why:'O texto afirma que ler ajuda a compreender perspectivas e o mundo.',reinforce:'Ideia central: identifique a mensagem que reúne todas as frases.'},
  {q:'Na expressão “abrir janelas”, o autor emprega uma linguagem...',opts:['literal, sobre construir casas.','figurada, para representar novas perspectivas.','técnica, sobre arquitetura.'],answer:1,hint:'Pense se o autor fala de janelas reais ou usa uma imagem simbólica.',why:'“Abrir janelas” é uma metáfora para conhecer outras ideias e perspectivas.',reinforce:'Linguagem figurada: interprete o sentido da expressão no contexto.'},
  {q:'Segundo o texto, compreender uma opinião diferente significa...',opts:['concordar obrigatoriamente com ela.','abandonar as próprias ideias.','considerá-la com atenção, mesmo sem concordar.'],answer:2,hint:'Releia a última frase: compreender e concordar são a mesma coisa?',why:'O texto diferencia compreender uma perspectiva de concordar com ela.',reinforce:'Inferência: distinga o que o texto afirma daquilo que ele não diz.'}
 ];
 const passage='Ler é abrir janelas para mundos que ainda não conhecemos. Em cada história, encontramos pessoas, lugares e ideias diferentes dos nossos. A leitura não exige que concordemos com tudo: ela nos convida a compreender outras perspectivas antes de formar uma opinião.';
 const make=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;};
 function show(d){
  d.replaceChildren();d.hidden=false;
  const panel=d.closest('.leo-panel');
  panel?.querySelectorAll('.leo-menu,.leo-practice,.leo-portuguese,.leo-humanas,.leo-chat,.leo-simulado').forEach(e=>e.hidden=true);
  const back=make('button','study-dashboard-all','← Voltar às matérias');back.type='button';back.dataset.studyBack='';
  back.addEventListener('click',()=>{const btn=panel?.querySelector('.study-top-back');if(btn){const evt=new CustomEvent('decola:choose-subject');document.dispatchEvent(evt);} });
  const title=make('h2','','📘 Interpretação de Textos — Aula Inteligente 2.1');
  const intro=make('p','','Linguagens • ENEM • Leia, interprete e aprenda com suas respostas.');
  const lesson=make('section','study-smart-card');
  lesson.append(make('h3','','1. Aprender: como interpretar um texto?'),make('p','','Leia o texto completo, identifique o assunto e procure a ideia central. Observe as palavras no contexto e diferencie informações explícitas de conclusões possíveis.'));
  lesson.append(make('div','study-topic-example','Texto para leitura: “'+passage+'”'));
  lesson.append(make('p','','Dica: ideia central é a mensagem principal; metáfora é uma expressão em sentido figurado; inferência é uma conclusão sustentada pelo texto.'));
  const practice=make('section','study-smart-card');practice.append(make('h3','','2. Praticar: responda às questões'));
  let progress={};try{progress=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch{}
  const save=()=>{try{localStorage.setItem(key,JSON.stringify(progress));}catch{}};
  const score=make('p','study-smart-score');score.setAttribute('aria-live','polite');practice.append(score);
  const report=make('section','study-smart-card study-smart-report');report.setAttribute('aria-live','polite');
  const update=()=>{
   const done=questions.filter((q,i)=>progress[i]?.done).length;
   const correct=questions.filter((q,i)=>progress[i]?.done&&progress[i]?.choice===q.answer).length;
   score.textContent='Seu progresso: '+done+' de 3 questões concluídas • '+correct+' acerto(s). Salvo neste navegador.';
   report.replaceChildren();report.hidden=done!==3;if(done!==3)return;
   const first=questions.filter((q,i)=>progress[i]?.attempts===1&&progress[i]?.choice===q.answer).length;
   const reinforce=questions.map((q,i)=>({q,i,p:progress[i]})).filter(x=>x.p.attempts>1||x.p.choice!==x.q.answer);
   report.append(make('h3','','🎓 Aula concluída! Seu relatório com o Professor Leo'),make('p','study-smart-report-stats','Questões concluídas: 3 de 3 • Acertos finais: '+correct+' de 3 • Acertos na primeira tentativa: '+first+' de 3 • Questões que exigiram reforço: '+reinforce.length+'.'));
   const guidance=make('div','study-smart-guidance');guidance.append(make('h4','','Seu reforço personalizado'));
   if(!reinforce.length)guidance.append(make('p','','Excelente! Você acertou todas na primeira tentativa. Continue lendo textos variados.'));
   reinforce.forEach(x=>guidance.append(make('p','','Questão '+(x.i+1)+': '+x.q.reinforce)));
   report.append(guidance);
   const actions=make('div','study-smart-report-actions');
   const review=make('button','study-dashboard-all','🔁 Revisar esta aula');review.type='button';review.onclick=()=>lesson.scrollIntoView({behavior:'smooth'});
   const subjects=make('button','study-dashboard-all','➡️ Voltar às matérias');subjects.type='button';subjects.onclick=()=>back.click();
   actions.append(review,subjects);report.append(actions);
  };
  questions.forEach((q,i)=>{
   const card=make('div','study-smart-question');card.append(make('strong','','Questão '+(i+1)+' de 3: '+q.q));
   const options=make('div','study-topic-answers');
   const feedback=make('div','study-smart-feedback');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
   const retry=make('button','study-smart-retry','Tentar novamente');retry.type='button';
   const buttons=q.opts.map((option,j)=>{
    const b=make('button','',option);b.type='button';b.onclick=()=>{
     const p=progress[i];if(p?.done||(p?.attempts===1&&Number.isInteger(p.choice)))return;
     const attempts=(p?.attempts||0)+1;progress[i]={choice:j,attempts,done:j===q.answer||attempts>=2};save();render();update();
    };options.append(b);return b;
   });
   retry.onclick=()=>{const p=progress[i];if(!p||p.done)return;progress[i]={...p,choice:null};save();render();buttons[0].focus();};
   function render(){
    const p=progress[i],selected=Number.isInteger(p?.choice),right=selected&&p.choice===q.answer;
    buttons.forEach((b,j)=>{b.classList.toggle('study-smart-selected',selected&&p.choice===j);b.disabled=!!p?.done||(p?.attempts===1&&selected);b.setAttribute('aria-pressed',String(selected&&p.choice===j));});
    feedback.replaceChildren();feedback.classList.toggle('study-smart-correct',right);feedback.classList.toggle('study-smart-wrong',selected&&!right);retry.hidden=true;
    if(!selected)return;
    if(right)feedback.append(make('strong','','✅ Muito bem! Resposta correta.'),make('p','',q.why));
    else if(!p.done){feedback.append(make('strong','','🔎 Ainda não. Você tem mais uma tentativa!'),make('p','',q.hint));retry.hidden=false;}
    else feedback.append(make('strong','','📘 Vamos aprender com esse erro.'),make('p','','Resposta correta: '+q.opts[q.answer]+'. '+q.why));
   }
   card.append(options,feedback,retry);practice.append(card);render();
  });
  const help=make('section','study-smart-card');help.append(make('h3','','3. Precisa de ajuda?'),make('p','','O Professor Leo pode ajudar você a interpretar o texto passo a passo.'));
  const helpBtn=make('button','study-dashboard-all','🎓 Pedir ajuda ao Professor Leo');helpBtn.type='button';
  helpBtn.onclick=()=>{
   d.hidden=true;const option=[...panel.querySelectorAll('.leo-menu-option')].find(b=>b.textContent.includes('Conversar com o Professor Leo'));
   if(option)option.click();else panel.querySelector('.leo-talk')?.click();
   const input=panel.querySelector('#leo-question-input');
   if(input){input.value='Professor Leo, estou estudando interpretação de textos. Ajude-me a encontrar a ideia central, compreender metáforas e fazer inferências, sem entregar respostas de imediato.';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();}
   const chat=panel.querySelector('.leo-chat');if(chat){let ret=chat.querySelector('.study-return-lesson');if(!ret){ret=make('button','study-dashboard-all study-return-lesson','← Voltar à aula');chat.prepend(ret);}ret.hidden=false;ret.onclick=()=>show(d);}
  };
  help.append(helpBtn);
  const evolve=make('section','study-smart-card');evolve.append(make('h3','','4. Evoluir'),make('p','','Você tem duas tentativas por questão. Os resultados são guardados apenas neste navegador.'));
  const reset=make('button','study-dashboard-all','Recomeçar exercícios');reset.type='button';reset.onclick=()=>{try{localStorage.removeItem(key);}catch{}show(d);};evolve.append(reset);
  d.append(back,title,intro,lesson,practice,report,help,evolve);save();update();panel?.querySelector('.leo-body')?.scrollTo(0,0);
 }
 window.decolaOpenLanguageSmart=show;
 // Intercepta somente o cartão Linguagens, sem alterar os outros módulos.
 document.addEventListener('click',event=>{
  const card=event.target.closest('.study-subject-language');
  if(!card)return;
  const d=card.closest('.study-dashboard');if(!d)return;
  event.preventDefault();event.stopImmediatePropagation();show(d);
 },true);
})();
