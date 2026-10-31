// Painel de entrada do aluno: preserva os módulos e o progresso existentes.
(function(){
 const cards=[
  {icon:'📚',title:'Matérias',detail:'Escolha uma área do ENEM e comece a estudar.',terms:['aprender uma matéria']},
  {icon:'✏️',title:'Exercícios',detail:'Treinos, simulados e recuperação guiada.',terms:['fazer exercícios de matemática']},
  {icon:'📈',title:'Minha evolução',detail:'Veja seu desempenho e plano de estudos.',terms:['minha evolução']},
  {icon:'🎓',title:'Professor Leo',detail:'Converse com o tutor em uma tela ampla.',terms:['conversar com o professor leo']}
 ];
 let selectingLegacySubject=false;
 const panel=()=>document.querySelector('.leo-panel');
 function hideLegacyViews(p){
  p?.querySelectorAll('.leo-menu,.leo-practice,.leo-portuguese,.leo-humanas,.leo-chat,.leo-dashboard,.leo-simulado').forEach(el=>{if(!el.classList.contains('study-dashboard'))el.hidden=true;});
 }
 const launcher=()=>document.querySelector('.leo-launch');
 function openPanel(){const p=panel();if(p&&p.hidden)launcher()?.click();return p;}
 function findOption(terms){
  const options=[...document.querySelectorAll('.leo-menu-option')];
  return options.find(b=>terms.some(t=>b.textContent.toLocaleLowerCase('pt-BR').includes(t)));
 }
 function openModule(card){
  const p=openPanel();if(!p)return;
  const option=findOption(card.terms);
  if(option){option.click();return;}
  const menuBack=p.querySelector('.leo-back');
  if(menuBack)menuBack.click();
  // Fallback: mantém o menu de módulos disponível, sem perder o acesso.
 }
 const mathTopics=[
  {title:'Porcentagem',summary:'Descontos, aumentos e proporções.',explanation:'Porcentagem é uma razão com base 100. Para calcular 25% de um valor, multiplique por 25 e divida por 100.',example:'25% de 200 = 200 × 25 ÷ 100 = 50.',question:'Quanto é 20% de 150?',choices:['20','30','35'],correct:1,feedback:'20% de 150 = 150 × 0,20 = 30.'},
  {title:'Frações',summary:'Partes de um todo e operações.',explanation:'Uma fração representa partes iguais de um todo. O numerador indica quantas partes consideramos; o denominador, em quantas partes o todo foi dividido.',example:'3/4 de 20 = 20 ÷ 4 × 3 = 15.',question:'Quanto é 1/2 de 36?',choices:['12','18','24'],correct:1,feedback:'Metade de 36 é 36 ÷ 2 = 18.'},
  {title:'Equações',summary:'Descubra o valor da incógnita.',explanation:'Resolver uma equação significa encontrar o valor que torna a igualdade verdadeira. Faça a mesma operação nos dois lados para isolar a incógnita.',example:'2x + 6 = 16 → 2x = 10 → x = 5.',question:'Se 3x + 2 = 17, quanto vale x?',choices:['3','5','7'],correct:1,feedback:'3x = 15, portanto x = 5.'},
  {title:'Geometria',summary:'Áreas, perímetros e formas.',explanation:'O perímetro é a soma dos lados de uma figura. A área mede sua superfície. Para um retângulo, área = base × altura.',example:'Retângulo de 8 m por 3 m: área = 24 m².',question:'Qual a área de um retângulo de 6 m por 4 m?',choices:['10 m²','20 m²','24 m²'],correct:2,feedback:'Área = 6 × 4 = 24 m².'},
  {title:'Estatística',summary:'Média e interpretação de dados.',explanation:'A média aritmética simples é a soma dos valores dividida pela quantidade de valores. Ela ajuda a resumir conjuntos de dados.',example:'Média de 4, 6 e 8 = (4 + 6 + 8) ÷ 3 = 6.',question:'Qual a média de 5, 7 e 9?',choices:['6','7','8'],correct:1,feedback:'(5 + 7 + 9) ÷ 3 = 7.'}
 ];
 function showMathLesson(dashboard,topic){
  if(topic.title==='Frações')return showFractionsSmartLesson(dashboard,topic);
  if(topic.title==='Equações')return showEquationsSmartLesson(dashboard,topic);
  if(topic.title==='Geometria')return showGeometrySmartLesson(dashboard,topic);
  if(topic.title==='Estatística')return showStatisticsSmartLesson(dashboard,topic);
  if(topic.title!=='Porcentagem')return showBasicMathLesson(dashboard,topic);
  hideLegacyViews(panel());dashboard.replaceChildren();
  const make=(tag,cls,txt)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(txt)el.textContent=txt;return el;};
  const back=make('button','study-dashboard-all','← Voltar aos assuntos');back.type='button';back.addEventListener('click',()=>showMathTopics(dashboard));
  const title=make('h2','','📘 Porcentagem — Aula Inteligente 1.1');
  const intro=make('p','','Aprenda no seu ritmo: entenda, pratique, peça ajuda e acompanhe sua evolução.');
  const steps=make('div','study-smart-steps');
  const lesson=make('section','study-smart-card');
  lesson.append(make('h3','','1. Aprender: o que é porcentagem?'),make('p','','Porcentagem significa uma parte de cada 100. Por exemplo, 15% = 15 ÷ 100 = 0,15. Para encontrar 15% de 80, multiplicamos 80 × 0,15 = 12.'));
  const example=make('div','study-topic-example','Exemplo do cotidiano: uma mochila de R$ 200 com 25% de desconto tem abatimento de R$ 50 (200 × 0,25). O preço final é R$ 150.');
  lesson.append(example,make('p','','Dica: 10% é dividir por 10; 20% é o dobro de 10%.'));
  const practice=make('section','study-smart-card');practice.append(make('h3','','2. Praticar: resolva as questões'));
  const questions=[
   {q:'Quanto é 20% de 150?',opts:['20','30','35'],answer:1,why:'20 ÷ 100 = 0,20; 150 × 0,20 = 30.'},
   {q:'Uma camiseta de R$ 80 tem 10% de desconto. Qual o preço final?',opts:['R$ 72','R$ 70','R$ 78'],answer:0,why:'10% de 80 = 8. Preço final: 80 − 8 = R$ 72.'},
   {q:'Um produto de R$ 120 aumentou 25%. Qual é o novo preço?',opts:['R$ 125','R$ 145','R$ 150'],answer:2,why:'25% de 120 = 30. Novo preço: 120 + 30 = R$ 150.'}
  ];
  const key='decola-smart-percent-v2';let progress={};
  try{progress=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch(e){progress={};}
  // Recupera acertos anteriores sem apagar o histórico da versão 1.0.
  try{const old=JSON.parse(localStorage.getItem('decola-smart-percent-v1')||'{}')||{};questions.forEach((q,i)=>{if(progress[i]===undefined&&old[i]===q.answer)progress[i]={choice:q.answer,attempts:1,done:true};});}catch(e){}
  const save=()=>{try{localStorage.setItem(key,JSON.stringify(progress));}catch(e){}};
  const score=make('p','study-smart-score');score.setAttribute('aria-live','polite');
  const updateScore=()=>{const done=questions.filter((q,i)=>progress[i]?.done).length;const correct=questions.filter((q,i)=>progress[i]?.done&&progress[i]?.choice===q.answer).length;score.textContent='Seu progresso: '+done+' de '+questions.length+' questões concluídas • '+correct+' acerto(s). Salvo neste navegador.';};
  practice.append(score);
  const hints=[
   ['20% significa 20 de cada 100. Transforme 20% em decimal antes de multiplicar.','Calcule 10% de 150 e depois dobre esse valor.'],
   ['Desconto diminui o preço, não aumenta. Descubra primeiro 10% de 80.','10% de 80 é 8. Subtraia esse desconto do preço original.'],
   ['Aumento significa somar ao valor inicial. Primeiro descubra 25% de 120.','25% é um quarto: divida 120 por 4 e some o resultado a 120.']
  ];
  questions.forEach((q,i)=>{
   const card=make('div','study-smart-question');card.append(make('strong','',('Questão '+(i+1)+' de '+questions.length+': ')+q.q));
   const options=make('div','study-topic-answers');
   const feedback=make('div','study-smart-feedback');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
   const retry=make('button','study-smart-retry','Tentar novamente');retry.type='button';
   const buttons=q.opts.map((opt,j)=>{const btn=make('button','',opt);btn.type='button';btn.addEventListener('click',()=>{
    const previous=progress[i];if(previous?.done||(previous?.attempts===1&&previous?.choice!==null&&previous?.choice!==undefined))return;
    const attempts=(previous?.attempts||0)+1;
    progress[i]={choice:j,attempts,done:j===q.answer||attempts>=2};
    save();render();updateScore();updateReport();
   });options.append(btn);return btn;});
   retry.addEventListener('click',()=>{const p=progress[i];if(!p||p.done)return;progress[i]={...p,choice:null};save();render();buttons[0]?.focus();});
   const render=()=>{
    const p=progress[i];const selected=Number.isInteger(p?.choice);const right=selected&&p.choice===q.answer;
    buttons.forEach((btn,j)=>{btn.classList.toggle('study-smart-selected',selected&&p.choice===j);btn.setAttribute('aria-pressed',String(selected&&p.choice===j));btn.disabled=!!p?.done||(p?.attempts===1&&selected&&!p?.done);});
    feedback.replaceChildren();retry.hidden=true;
    if(!selected)return;
    if(right){feedback.classList.add('study-smart-correct');feedback.classList.remove('study-smart-wrong');feedback.append(make('strong','','✅ Muito bem! Resposta correta.'),make('p','',q.why));}
    else if(!p.done){feedback.classList.add('study-smart-wrong');feedback.classList.remove('study-smart-correct');feedback.append(make('strong','','🔎 Ainda não. Você tem mais uma tentativa!'),make('p','',hints[i][0]));retry.hidden=false;}
    else{feedback.classList.add('study-smart-wrong');feedback.classList.remove('study-smart-correct');feedback.append(make('strong','','📘 Vamos aprender com esse erro.'),make('p','','Dica: '+hints[i][1]),make('p','','Resposta correta: '+q.opts[q.answer]+'. '+q.why));}
   };
   card.append(options,feedback,retry);practice.append(card);render();
  });save();updateScore();
  // Relatório de conclusão: não altera a correção nem as chaves de progresso anteriores.
  const report=make('section','study-smart-card study-smart-report');
  report.setAttribute('aria-live','polite');
  function updateReport(){
   const completed=questions.every((q,i)=>progress[i]?.done);
   report.replaceChildren();report.hidden=!completed;
   if(!completed)return;
   const firstTry=questions.filter((q,i)=>progress[i]?.choice===q.answer&&progress[i]?.attempts===1).length;
   const eventual=questions.filter((q,i)=>progress[i]?.choice===q.answer).length;
   const reinforced=questions.map((q,i)=>({q,i,p:progress[i]})).filter(x=>x.p?.attempts>1||x.p?.choice!==x.q.answer);
   report.append(make('h3','','🎓 Aula concluída! Seu relatório com o Professor Leo'));
   report.append(make('p','study-smart-report-stats',
    'Questões concluídas: 3 de 3 • Acertos finais: '+eventual+' de 3 • Acertos na primeira tentativa: '+firstTry+' de 3 • Questões que exigiram reforço: '+reinforced.length+'.'));
   report.append(make('p','','Parabéns por concluir a prática! Acertar depois de uma dica também é aprender. Vamos revisar os pontos que exigiram mais atenção.'));
   const guidance=make('div','study-smart-guidance');
   guidance.append(make('h4','','Seu reforço personalizado'));
   if(!reinforced.length)guidance.append(make('p','','Você acertou tudo na primeira tentativa. Continue praticando para consolidar porcentagens.'));
   reinforced.forEach(({i})=>{
    const messages=[
     'Porcentagem de um valor: transforme a taxa em decimal (20% = 0,20) e multiplique pelo total.',
     'Desconto: calcule a porcentagem e subtraia do preço original.',
     'Aumento: calcule a porcentagem e some ao preço original.'
    ];
    guidance.append(make('p','','Questão '+(i+1)+': '+messages[i]));
   });
   report.append(guidance);
   const actions=make('div','study-smart-report-actions');
   const review=make('button','study-dashboard-all','🔁 Revisar esta aula');review.type='button';
   review.addEventListener('click',()=>{lesson.scrollIntoView({behavior:'smooth',block:'start'});});
   const next=make('button','study-dashboard-all','➡️ Próxima aula: Frações');next.type='button';
   next.addEventListener('click',()=>showMathLesson(dashboard,mathTopics[1]));
   actions.append(review,next);report.append(actions);
  }
  updateReport();
  const help=make('section','study-smart-card');help.append(make('h3','','3. Precisa de ajuda?'));
  const helpText=make('p','','O Professor Leo pode orientar seu raciocínio sem entregar a resposta de imediato.');help.append(helpText);
  const helpBtn=make('button','study-dashboard-all','🎓 Pedir ajuda ao Professor Leo');helpBtn.type='button';helpBtn.addEventListener('click',()=>{
   const p=panel();if(!p)return;dashboard.hidden=true;
   const chatOption=[...p.querySelectorAll('.leo-menu-option')].find(b=>b.textContent.includes('Conversar com o Professor Leo'));
   if(chatOption)chatOption.click();else p.querySelector('.leo-talk')?.click();
   const input=p.querySelector('#leo-question-input');if(input){input.value='Professor Leo, estou na Aula Inteligente de Porcentagem. Aprendi que 20% = 0,20 e que 20% de 150 = 30. Pode me ajudar a compreender porcentagens passo a passo, com perguntas e dicas, sem entregar a resposta imediatamente?';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();}
   const chat=p.querySelector('.leo-chat');if(chat){let ret=chat.querySelector('.study-return-lesson');if(!ret){ret=make('button','study-dashboard-all study-return-lesson','← Voltar à aula');ret.type='button';chat.prepend(ret);}ret.hidden=false;ret.onclick=()=>showMathLesson(dashboard,topic);}
  });help.append(helpBtn);
  const evolution=make('section','study-smart-card');evolution.append(make('h3','','4. Evoluir'),make('p','','Se errar, receba dicas e faça uma segunda tentativa antes de ver a resolução. Seus resultados desta aula ficam salvos somente neste navegador.'));
  const reset=make('button','study-dashboard-all','Recomeçar exercícios');reset.type='button';reset.addEventListener('click',()=>{try{localStorage.removeItem(key);}catch(e){}showMathLesson(dashboard,topic);});evolution.append(reset);
  steps.append(lesson,practice,report,help,evolution);dashboard.append(back,title,intro,steps);dashboard.hidden=false;panel()?.querySelector('.leo-body')?.scrollTo(0,0);
 }
 function showFractionsSmartLesson(dashboard,topic){
  hideLegacyViews(panel());dashboard.replaceChildren();
  const make=(tag,cls,txt)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(txt)el.textContent=txt;return el;};
  const back=make('button','study-dashboard-all','← Voltar aos assuntos');back.type='button';back.addEventListener('click',()=>showMathTopics(dashboard));
  const title=make('h2','','📘 Frações — Aula Inteligente 1.2');
  const intro=make('p','','Aprenda no seu ritmo: entenda, pratique, peça ajuda e acompanhe sua evolução.');
  const steps=make('div','study-smart-steps');
  const lesson=make('section','study-smart-card');
  lesson.append(make('h3','','1. Aprender: o que são frações?'),make('p','','Uma fração representa partes iguais de um todo. O numerador mostra quantas partes usamos; o denominador mostra em quantas partes o todo foi dividido. Para calcular 3/4 de 20, dividimos 20 por 4 e multiplicamos por 3: 15.'));
  const example=make('div','study-topic-example','Exemplo do cotidiano: uma pizza dividida em 8 fatias iguais. Comer 3 fatias significa comer 3/8 da pizza.');
  lesson.append(example,make('p','','Dica: para encontrar uma fração de uma quantidade, divida pelo denominador e multiplique pelo numerador.'));
  const practice=make('section','study-smart-card');practice.append(make('h3','','2. Praticar: resolva as questões'));
  const questions=[
   {q:'Quanto é 1/2 de 36?',opts:['12','18','24'],answer:1,why:'Divida 36 em 2 partes iguais: 36 ÷ 2 = 18.'},
   {q:'Quanto é 3/4 de 20?',opts:['12','15','16'],answer:1,why:'Divida 20 por 4 e multiplique por 3: 20 ÷ 4 × 3 = 15.'},
   {q:'Uma pizza tem 12 fatias. Ana comeu 2/3 delas. Quantas fatias ela comeu?',opts:['6','8','9'],answer:1,why:'12 ÷ 3 = 4; 4 × 2 = 8 fatias.'}
  ];
  const key='decola-smart-fractions-v1';let progress={};
  try{progress=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch(e){progress={};}
  const save=()=>{try{localStorage.setItem(key,JSON.stringify(progress));}catch(e){}};
  const score=make('p','study-smart-score');score.setAttribute('aria-live','polite');
  const updateScore=()=>{const done=questions.filter((q,i)=>progress[i]?.done).length;const correct=questions.filter((q,i)=>progress[i]?.done&&progress[i]?.choice===q.answer).length;score.textContent='Seu progresso: '+done+' de '+questions.length+' questões concluídas • '+correct+' acerto(s). Salvo neste navegador.';};
  practice.append(score);
  const hints=[
   ['O denominador 2 indica duas partes iguais. Divida 36 por 2.','Metade é dividir por 2.'],
   ['Primeiro divida 20 pelo denominador 4.','Depois multiplique o resultado pelo numerador 3.'],
   ['Divida as 12 fatias em 3 grupos iguais.','Agora conte 2 desses grupos: multiplique por 2.']
  ];
  questions.forEach((q,i)=>{
   const card=make('div','study-smart-question');card.append(make('strong','',('Questão '+(i+1)+' de '+questions.length+': ')+q.q));
   const options=make('div','study-topic-answers');
   const feedback=make('div','study-smart-feedback');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
   const retry=make('button','study-smart-retry','Tentar novamente');retry.type='button';
   const buttons=q.opts.map((opt,j)=>{const btn=make('button','',opt);btn.type='button';btn.addEventListener('click',()=>{
    const previous=progress[i];if(previous?.done||(previous?.attempts===1&&previous?.choice!==null&&previous?.choice!==undefined))return;
    const attempts=(previous?.attempts||0)+1;
    progress[i]={choice:j,attempts,done:j===q.answer||attempts>=2};
    save();render();updateScore();updateReport();
   });options.append(btn);return btn;});
   retry.addEventListener('click',()=>{const p=progress[i];if(!p||p.done)return;progress[i]={...p,choice:null};save();render();buttons[0]?.focus();});
   const render=()=>{
    const p=progress[i];const selected=Number.isInteger(p?.choice);const right=selected&&p.choice===q.answer;
    buttons.forEach((btn,j)=>{btn.classList.toggle('study-smart-selected',selected&&p.choice===j);btn.setAttribute('aria-pressed',String(selected&&p.choice===j));btn.disabled=!!p?.done||(p?.attempts===1&&selected&&!p?.done);});
    feedback.replaceChildren();retry.hidden=true;
    if(!selected)return;
    if(right){feedback.classList.add('study-smart-correct');feedback.classList.remove('study-smart-wrong');feedback.append(make('strong','','✅ Muito bem! Resposta correta.'),make('p','',q.why));}
    else if(!p.done){feedback.classList.add('study-smart-wrong');feedback.classList.remove('study-smart-correct');feedback.append(make('strong','','🔎 Ainda não. Você tem mais uma tentativa!'),make('p','',hints[i][0]));retry.hidden=false;}
    else{feedback.classList.add('study-smart-wrong');feedback.classList.remove('study-smart-correct');feedback.append(make('strong','','📘 Vamos aprender com esse erro.'),make('p','','Dica: '+hints[i][1]),make('p','','Resposta correta: '+q.opts[q.answer]+'. '+q.why));}
   };
   card.append(options,feedback,retry);practice.append(card);render();
  });save();updateScore();
  // Relatório de conclusão: não altera a correção nem as chaves de progresso anteriores.
  const report=make('section','study-smart-card study-smart-report');
  report.setAttribute('aria-live','polite');
  function updateReport(){
   const completed=questions.every((q,i)=>progress[i]?.done);
   report.replaceChildren();report.hidden=!completed;
   if(!completed)return;
   const firstTry=questions.filter((q,i)=>progress[i]?.choice===q.answer&&progress[i]?.attempts===1).length;
   const eventual=questions.filter((q,i)=>progress[i]?.choice===q.answer).length;
   const reinforced=questions.map((q,i)=>({q,i,p:progress[i]})).filter(x=>x.p?.attempts>1||x.p?.choice!==x.q.answer);
   report.append(make('h3','','🎓 Aula concluída! Seu relatório com o Professor Leo'));
   report.append(make('p','study-smart-report-stats',
    'Questões concluídas: 3 de 3 • Acertos finais: '+eventual+' de 3 • Acertos na primeira tentativa: '+firstTry+' de 3 • Questões que exigiram reforço: '+reinforced.length+'.'));
   report.append(make('p','','Parabéns por concluir a prática! Acertar depois de uma dica também é aprender. Vamos revisar os pontos que exigiram mais atenção.'));
   const guidance=make('div','study-smart-guidance');
   guidance.append(make('h4','','Seu reforço personalizado'));
   if(!reinforced.length)guidance.append(make('p','','Você acertou tudo na primeira tentativa. Continue praticando para consolidar frações.'));
   reinforced.forEach(({i})=>{
    const messages=[
     'Metade de um número: divida o total em 2 partes iguais.',
     'Fração de uma quantidade: divida pelo denominador e multiplique pelo numerador.',
     'Problema com frações: identifique o total, divida pelo denominador e multiplique pelo numerador.'
    ];
    guidance.append(make('p','','Questão '+(i+1)+': '+messages[i]));
   });
   report.append(guidance);
   const actions=make('div','study-smart-report-actions');
   const review=make('button','study-dashboard-all','🔁 Revisar esta aula');review.type='button';
   review.addEventListener('click',()=>{lesson.scrollIntoView({behavior:'smooth',block:'start'});});
   const next=make('button','study-dashboard-all','➡️ Próxima aula: Equações');next.type='button';
   next.addEventListener('click',()=>showMathLesson(dashboard,mathTopics[2]));
   actions.append(review,next);report.append(actions);
  }
  updateReport();
  const help=make('section','study-smart-card');help.append(make('h3','','3. Precisa de ajuda?'));
  const helpText=make('p','','O Professor Leo pode orientar seu raciocínio sem entregar a resposta de imediato.');help.append(helpText);
  const helpBtn=make('button','study-dashboard-all','🎓 Pedir ajuda ao Professor Leo');helpBtn.type='button';helpBtn.addEventListener('click',()=>{
   const p=panel();if(!p)return;dashboard.hidden=true;
   const chatOption=[...p.querySelectorAll('.leo-menu-option')].find(b=>b.textContent.includes('Conversar com o Professor Leo'));
   if(chatOption)chatOption.click();else p.querySelector('.leo-talk')?.click();
   const input=p.querySelector('#leo-question-input');if(input){input.value='Professor Leo, estou na Aula Inteligente de Frações. Aprendi que 3/4 de 20 é 15. Pode me ajudar a compreender frações passo a passo, com perguntas e dicas, sem entregar a resposta imediatamente?';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();}
   const chat=p.querySelector('.leo-chat');if(chat){let ret=chat.querySelector('.study-return-lesson');if(!ret){ret=make('button','study-dashboard-all study-return-lesson','← Voltar à aula');ret.type='button';chat.prepend(ret);}ret.hidden=false;ret.onclick=()=>showFractionsSmartLesson(dashboard,topic);}
  });help.append(helpBtn);
  const evolution=make('section','study-smart-card');evolution.append(make('h3','','4. Evoluir'),make('p','','Se errar, receba dicas e faça uma segunda tentativa antes de ver a resolução. Seus resultados desta aula ficam salvos somente neste navegador.'));
  const reset=make('button','study-dashboard-all','Recomeçar exercícios');reset.type='button';reset.addEventListener('click',()=>{try{localStorage.removeItem(key);}catch(e){}showMathLesson(dashboard,topic);});evolution.append(reset);
  steps.append(lesson,practice,report,help,evolution);dashboard.append(back,title,intro,steps);dashboard.hidden=false;panel()?.querySelector('.leo-body')?.scrollTo(0,0);
 }
 function showEquationsSmartLesson(dashboard,topic){
  hideLegacyViews(panel());dashboard.replaceChildren();
  const make=(tag,cls,txt)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(txt)el.textContent=txt;return el;};
  const back=make('button','study-dashboard-all','← Voltar aos assuntos');back.type='button';back.addEventListener('click',()=>showMathTopics(dashboard));
  const title=make('h2','','📘 Equações — Aula Inteligente 1.3');
  const intro=make('p','','Aprenda no seu ritmo: entenda, pratique, peça ajuda e acompanhe sua evolução.');
  const steps=make('div','study-smart-steps');
  const lesson=make('section','study-smart-card');
  lesson.append(make('h3','','1. Aprender: como resolver equações?'),make('p','','Uma equação é uma igualdade com um valor desconhecido, chamado incógnita (x). Para descobrir x, faça a mesma operação nos dois lados da igualdade. Exemplo: x + 7 = 12. Subtraindo 7 dos dois lados, x = 5.'));
  const example=make('div','study-topic-example','Exemplo do cotidiano: você comprou 3 cadernos iguais e pagou R$ 24. Se cada caderno custa x, então 3x = 24 e x = R$ 8.');
  lesson.append(example,make('p','','Dica: primeiro desfaça somas e subtrações; depois, multiplicações e divisões. Confira substituindo o valor de x na equação original.'));
  const practice=make('section','study-smart-card');practice.append(make('h3','','2. Praticar: resolva as questões'));
  const questions=[
   {q:'Se x + 7 = 12, quanto vale x?',opts:['4','5','19'],answer:1,why:'Subtraia 7 dos dois lados: x = 12 − 7 = 5. Conferindo: 5 + 7 = 12.'},
   {q:'Se 3x = 24, quanto vale x?',opts:['6','8','21'],answer:1,why:'Divida os dois lados por 3: x = 24 ÷ 3 = 8. Conferindo: 3 × 8 = 24.'},
   {q:'Se 2x + 6 = 20, quanto vale x?',opts:['5','7','13'],answer:1,why:'Subtraia 6: 2x = 14. Divida por 2: x = 7. Conferindo: 2 × 7 + 6 = 20.'}
  ];
  const key='decola-smart-equations-v1';let progress={};
  try{progress=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch(e){progress={};}
  const save=()=>{try{localStorage.setItem(key,JSON.stringify(progress));}catch(e){}};
  const score=make('p','study-smart-score');score.setAttribute('aria-live','polite');
  const updateScore=()=>{const done=questions.filter((q,i)=>progress[i]?.done).length;const correct=questions.filter((q,i)=>progress[i]?.done&&progress[i]?.choice===q.answer).length;score.textContent='Seu progresso: '+done+' de '+questions.length+' questões concluídas • '+correct+' acerto(s). Salvo neste navegador.';};
  practice.append(score);
  const hints=[
   ['Para deixar x sozinho, subtraia 7 dos dois lados.','Calcule 12 − 7 e confira a igualdade.'],
   ['3x significa 3 vezes x. Divida os dois lados por 3.','Calcule 24 ÷ 3 e substitua em 3x = 24.'],
   ['Primeiro subtraia 6 dos dois lados: 2x = 14.','Depois divida 14 por 2 e confira em 2x + 6 = 20.']
  ];
  questions.forEach((q,i)=>{
   const card=make('div','study-smart-question');card.append(make('strong','',('Questão '+(i+1)+' de '+questions.length+': ')+q.q));
   const options=make('div','study-topic-answers');
   const feedback=make('div','study-smart-feedback');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
   const retry=make('button','study-smart-retry','Tentar novamente');retry.type='button';
   const buttons=q.opts.map((opt,j)=>{const btn=make('button','',opt);btn.type='button';btn.addEventListener('click',()=>{
    const previous=progress[i];if(previous?.done||(previous?.attempts===1&&previous?.choice!==null&&previous?.choice!==undefined))return;
    const attempts=(previous?.attempts||0)+1;
    progress[i]={choice:j,attempts,done:j===q.answer||attempts>=2};
    save();render();updateScore();updateReport();
   });options.append(btn);return btn;});
   retry.addEventListener('click',()=>{const p=progress[i];if(!p||p.done)return;progress[i]={...p,choice:null};save();render();buttons[0]?.focus();});
   const render=()=>{
    const p=progress[i];const selected=Number.isInteger(p?.choice);const right=selected&&p.choice===q.answer;
    buttons.forEach((btn,j)=>{btn.classList.toggle('study-smart-selected',selected&&p.choice===j);btn.setAttribute('aria-pressed',String(selected&&p.choice===j));btn.disabled=!!p?.done||(p?.attempts===1&&selected&&!p?.done);});
    feedback.replaceChildren();retry.hidden=true;
    if(!selected)return;
    if(right){feedback.classList.add('study-smart-correct');feedback.classList.remove('study-smart-wrong');feedback.append(make('strong','','✅ Muito bem! Resposta correta.'),make('p','',q.why));}
    else if(!p.done){feedback.classList.add('study-smart-wrong');feedback.classList.remove('study-smart-correct');feedback.append(make('strong','','🔎 Ainda não. Você tem mais uma tentativa!'),make('p','',hints[i][0]));retry.hidden=false;}
    else{feedback.classList.add('study-smart-wrong');feedback.classList.remove('study-smart-correct');feedback.append(make('strong','','📘 Vamos aprender com esse erro.'),make('p','','Dica: '+hints[i][1]),make('p','','Resposta correta: '+q.opts[q.answer]+'. '+q.why));}
   };
   card.append(options,feedback,retry);practice.append(card);render();
  });save();updateScore();
  // Relatório de conclusão: não altera a correção nem as chaves de progresso anteriores.
  const report=make('section','study-smart-card study-smart-report');
  report.setAttribute('aria-live','polite');
  function updateReport(){
   const completed=questions.every((q,i)=>progress[i]?.done);
   report.replaceChildren();report.hidden=!completed;
   if(!completed)return;
   const firstTry=questions.filter((q,i)=>progress[i]?.choice===q.answer&&progress[i]?.attempts===1).length;
   const eventual=questions.filter((q,i)=>progress[i]?.choice===q.answer).length;
   const reinforced=questions.map((q,i)=>({q,i,p:progress[i]})).filter(x=>x.p?.attempts>1||x.p?.choice!==x.q.answer);
   report.append(make('h3','','🎓 Aula concluída! Seu relatório com o Professor Leo'));
   report.append(make('p','study-smart-report-stats',
    'Questões concluídas: 3 de 3 • Acertos finais: '+eventual+' de 3 • Acertos na primeira tentativa: '+firstTry+' de 3 • Questões que exigiram reforço: '+reinforced.length+'.'));
   report.append(make('p','','Parabéns por concluir a prática! Acertar depois de uma dica também é aprender. Vamos revisar os pontos que exigiram mais atenção.'));
   const guidance=make('div','study-smart-guidance');
   guidance.append(make('h4','','Seu reforço personalizado'));
   if(!reinforced.length)guidance.append(make('p','','Você acertou tudo na primeira tentativa. Continue praticando para consolidar equações.'));
   reinforced.forEach(({i})=>{
    const messages=[
     'Isolando x: subtraia 7 dos dois lados de x + 7 = 12.',
     'Quando há 3x, divida os dois lados por 3 para encontrar x.',
     'Em 2x + 6 = 20, primeiro subtraia 6 e depois divida por 2.'
    ];
    guidance.append(make('p','','Questão '+(i+1)+': '+messages[i]));
   });
   report.append(guidance);
   const actions=make('div','study-smart-report-actions');
   const review=make('button','study-dashboard-all','🔁 Revisar esta aula');review.type='button';
   review.addEventListener('click',()=>{lesson.scrollIntoView({behavior:'smooth',block:'start'});});
   const next=make('button','study-dashboard-all','➡️ Próxima aula: Geometria');next.type='button';
   next.addEventListener('click',()=>showMathLesson(dashboard,mathTopics[3]));
   actions.append(review,next);report.append(actions);
  }
  updateReport();
  const help=make('section','study-smart-card');help.append(make('h3','','3. Precisa de ajuda?'));
  const helpText=make('p','','O Professor Leo pode orientar seu raciocínio sem entregar a resposta de imediato.');help.append(helpText);
  const helpBtn=make('button','study-dashboard-all','🎓 Pedir ajuda ao Professor Leo');helpBtn.type='button';helpBtn.addEventListener('click',()=>{
   const p=panel();if(!p)return;dashboard.hidden=true;
   const chatOption=[...p.querySelectorAll('.leo-menu-option')].find(b=>b.textContent.includes('Conversar com o Professor Leo'));
   if(chatOption)chatOption.click();else p.querySelector('.leo-talk')?.click();
   const input=p.querySelector('#leo-question-input');if(input){input.value='Professor Leo, estou na Aula Inteligente de Equações. Aprendi que x + 7 = 12 tem solução x = 5. Pode me ajudar a resolver equações passo a passo, com perguntas e dicas, sem entregar a resposta imediatamente?';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();}
   const chat=p.querySelector('.leo-chat');if(chat){let ret=chat.querySelector('.study-return-lesson');if(!ret){ret=make('button','study-dashboard-all study-return-lesson','← Voltar à aula');ret.type='button';chat.prepend(ret);}ret.hidden=false;ret.onclick=()=>showEquationsSmartLesson(dashboard,topic);}
  });help.append(helpBtn);
  const evolution=make('section','study-smart-card');evolution.append(make('h3','','4. Evoluir'),make('p','','Se errar, receba dicas e faça uma segunda tentativa antes de ver a resolução. Seus resultados desta aula ficam salvos somente neste navegador.'));
  const reset=make('button','study-dashboard-all','Recomeçar exercícios');reset.type='button';reset.addEventListener('click',()=>{try{localStorage.removeItem(key);}catch(e){}showMathLesson(dashboard,topic);});evolution.append(reset);
  steps.append(lesson,practice,report,help,evolution);dashboard.append(back,title,intro,steps);dashboard.hidden=false;panel()?.querySelector('.leo-body')?.scrollTo(0,0);
 }
 function showGeometrySmartLesson(dashboard,topic){
  hideLegacyViews(panel());dashboard.replaceChildren();
  const make=(tag,cls,txt)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(txt)el.textContent=txt;return el;};
  const back=make('button','study-dashboard-all','← Voltar aos assuntos');back.type='button';back.addEventListener('click',()=>showMathTopics(dashboard));
  const title=make('h2','','📘 Geometria — Aula Inteligente 1.4');
  const intro=make('p','','Aprenda no seu ritmo: entenda, pratique, peça ajuda e acompanhe sua evolução.');
  const steps=make('div','study-smart-steps');
  const lesson=make('section','study-smart-card');
  lesson.append(make('h3','','1. Aprender: área e perímetro'),make('p','','Geometria estuda formas e medidas. Perímetro é a soma dos comprimentos dos lados de uma figura. Área é a medida da superfície interna. Em um retângulo de 6 m por 4 m, o perímetro é 6 + 4 + 6 + 4 = 20 m e a área é 6 × 4 = 24 m².'));
  const example=make('div','study-topic-example','Exemplo do cotidiano: um jardim retangular de 5 m por 3 m precisa de 16 m de cerca (perímetro) e ocupa 15 m² de terreno (área).');
  lesson.append(example,make('p','','Dica: para calcular o perímetro, some os lados. Para calcular a área de um retângulo, multiplique base pela altura. Para um quadrado, multiplique lado por lado.'));
  const practice=make('section','study-smart-card');practice.append(make('h3','','2. Praticar: resolva as questões'));
  const questions=[
   {q:'Um retângulo mede 6 m por 4 m. Qual é seu perímetro?',opts:['10 m','20 m','24 m'],answer:1,why:'Some os quatro lados: 6 + 4 + 6 + 4 = 20 m.'},
   {q:'Qual é a área de um retângulo de 5 m por 3 m?',opts:['8 m²','15 m²','16 m²'],answer:1,why:'Área do retângulo = base × altura = 5 × 3 = 15 m².'},
   {q:'Um quadrado tem lados de 7 cm. Qual é sua área?',opts:['14 cm²','49 cm²','28 cm²'],answer:1,why:'Área do quadrado = lado × lado = 7 × 7 = 49 cm².'}
  ];
  const key='decola-smart-geometry-v1';let progress={};
  try{progress=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch(e){progress={};}
  const save=()=>{try{localStorage.setItem(key,JSON.stringify(progress));}catch(e){}};
  const score=make('p','study-smart-score');score.setAttribute('aria-live','polite');
  const updateScore=()=>{const done=questions.filter((q,i)=>progress[i]?.done).length;const correct=questions.filter((q,i)=>progress[i]?.done&&progress[i]?.choice===q.answer).length;score.textContent='Seu progresso: '+done+' de '+questions.length+' questões concluídas • '+correct+' acerto(s). Salvo neste navegador.';};
  practice.append(score);
  const hints=[
   ['Perímetro é a soma de todos os lados do retângulo.','Some 6 + 4 + 6 + 4. A unidade é metro (m).'],
   ['Área do retângulo é base multiplicada pela altura.','Multiplique 5 por 3. A unidade é metro quadrado (m²).'],
   ['Todos os lados do quadrado são iguais. Para a área, multiplique lado por lado.','Calcule 7 × 7 e use cm².']
  ];
  questions.forEach((q,i)=>{
   const card=make('div','study-smart-question');card.append(make('strong','',('Questão '+(i+1)+' de '+questions.length+': ')+q.q));
   const options=make('div','study-topic-answers');
   const feedback=make('div','study-smart-feedback');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
   const retry=make('button','study-smart-retry','Tentar novamente');retry.type='button';
   const buttons=q.opts.map((opt,j)=>{const btn=make('button','',opt);btn.type='button';btn.addEventListener('click',()=>{
    const previous=progress[i];if(previous?.done||(previous?.attempts===1&&previous?.choice!==null&&previous?.choice!==undefined))return;
    const attempts=(previous?.attempts||0)+1;
    progress[i]={choice:j,attempts,done:j===q.answer||attempts>=2};
    save();render();updateScore();updateReport();
   });options.append(btn);return btn;});
   retry.addEventListener('click',()=>{const p=progress[i];if(!p||p.done)return;progress[i]={...p,choice:null};save();render();buttons[0]?.focus();});
   const render=()=>{
    const p=progress[i];const selected=Number.isInteger(p?.choice);const right=selected&&p.choice===q.answer;
    buttons.forEach((btn,j)=>{btn.classList.toggle('study-smart-selected',selected&&p.choice===j);btn.setAttribute('aria-pressed',String(selected&&p.choice===j));btn.disabled=!!p?.done||(p?.attempts===1&&selected&&!p?.done);});
    feedback.replaceChildren();retry.hidden=true;
    if(!selected)return;
    if(right){feedback.classList.add('study-smart-correct');feedback.classList.remove('study-smart-wrong');feedback.append(make('strong','','✅ Muito bem! Resposta correta.'),make('p','',q.why));}
    else if(!p.done){feedback.classList.add('study-smart-wrong');feedback.classList.remove('study-smart-correct');feedback.append(make('strong','','🔎 Ainda não. Você tem mais uma tentativa!'),make('p','',hints[i][0]));retry.hidden=false;}
    else{feedback.classList.add('study-smart-wrong');feedback.classList.remove('study-smart-correct');feedback.append(make('strong','','📘 Vamos aprender com esse erro.'),make('p','','Dica: '+hints[i][1]),make('p','','Resposta correta: '+q.opts[q.answer]+'. '+q.why));}
   };
   card.append(options,feedback,retry);practice.append(card);render();
  });save();updateScore();
  // Relatório de conclusão: não altera a correção nem as chaves de progresso anteriores.
  const report=make('section','study-smart-card study-smart-report');
  report.setAttribute('aria-live','polite');
  function updateReport(){
   const completed=questions.every((q,i)=>progress[i]?.done);
   report.replaceChildren();report.hidden=!completed;
   if(!completed)return;
   const firstTry=questions.filter((q,i)=>progress[i]?.choice===q.answer&&progress[i]?.attempts===1).length;
   const eventual=questions.filter((q,i)=>progress[i]?.choice===q.answer).length;
   const reinforced=questions.map((q,i)=>({q,i,p:progress[i]})).filter(x=>x.p?.attempts>1||x.p?.choice!==x.q.answer);
   report.append(make('h3','','🎓 Aula concluída! Seu relatório com o Professor Leo'));
   report.append(make('p','study-smart-report-stats',
    'Questões concluídas: 3 de 3 • Acertos finais: '+eventual+' de 3 • Acertos na primeira tentativa: '+firstTry+' de 3 • Questões que exigiram reforço: '+reinforced.length+'.'));
   report.append(make('p','','Parabéns por concluir a prática! Acertar depois de uma dica também é aprender. Vamos revisar os pontos que exigiram mais atenção.'));
   const guidance=make('div','study-smart-guidance');
   guidance.append(make('h4','','Seu reforço personalizado'));
   if(!reinforced.length)guidance.append(make('p','','Você acertou tudo na primeira tentativa. Continue praticando para consolidar geometria.'));
   reinforced.forEach(({i})=>{
    const messages=[
     'Perímetro do retângulo: some os quatro lados, sem confundir com a área.',
     'Área do retângulo: multiplique a base pela altura e use unidades quadradas.',
     'Área do quadrado: multiplique a medida do lado por ela mesma.'
    ];
    guidance.append(make('p','','Questão '+(i+1)+': '+messages[i]));
   });
   report.append(guidance);
   const actions=make('div','study-smart-report-actions');
   const review=make('button','study-dashboard-all','🔁 Revisar esta aula');review.type='button';
   review.addEventListener('click',()=>{lesson.scrollIntoView({behavior:'smooth',block:'start'});});
   const next=make('button','study-dashboard-all','➡️ Próxima aula: Estatística');next.type='button';
   next.addEventListener('click',()=>showMathLesson(dashboard,mathTopics[4]));
   actions.append(review,next);report.append(actions);
  }
  updateReport();
  const help=make('section','study-smart-card');help.append(make('h3','','3. Precisa de ajuda?'));
  const helpText=make('p','','O Professor Leo pode orientar seu raciocínio sem entregar a resposta de imediato.');help.append(helpText);
  const helpBtn=make('button','study-dashboard-all','🎓 Pedir ajuda ao Professor Leo');helpBtn.type='button';helpBtn.addEventListener('click',()=>{
   const p=panel();if(!p)return;dashboard.hidden=true;
   const chatOption=[...p.querySelectorAll('.leo-menu-option')].find(b=>b.textContent.includes('Conversar com o Professor Leo'));
   if(chatOption)chatOption.click();else p.querySelector('.leo-talk')?.click();
   const input=p.querySelector('#leo-question-input');if(input){input.value='Professor Leo, estou na Aula Inteligente de Geometria. Aprendi a calcular perímetro e área de retângulos e quadrados. Pode me ajudar passo a passo, com perguntas e dicas, sem entregar a resposta imediatamente?';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();}
   const chat=p.querySelector('.leo-chat');if(chat){let ret=chat.querySelector('.study-return-lesson');if(!ret){ret=make('button','study-dashboard-all study-return-lesson','← Voltar à aula');ret.type='button';chat.prepend(ret);}ret.hidden=false;ret.onclick=()=>showGeometrySmartLesson(dashboard,topic);}
  });help.append(helpBtn);
  const evolution=make('section','study-smart-card');evolution.append(make('h3','','4. Evoluir'),make('p','','Se errar, receba dicas e faça uma segunda tentativa antes de ver a resolução. Seus resultados desta aula ficam salvos somente neste navegador.'));
  const reset=make('button','study-dashboard-all','Recomeçar exercícios');reset.type='button';reset.addEventListener('click',()=>{try{localStorage.removeItem(key);}catch(e){}showMathLesson(dashboard,topic);});evolution.append(reset);
  steps.append(lesson,practice,report,help,evolution);dashboard.append(back,title,intro,steps);dashboard.hidden=false;panel()?.querySelector('.leo-body')?.scrollTo(0,0);
 }
 function showStatisticsSmartLesson(dashboard,topic){
  hideLegacyViews(panel());dashboard.replaceChildren();
  const make=(tag,cls,txt)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(txt)el.textContent=txt;return el;};
  const back=make('button','study-dashboard-all','← Voltar aos assuntos');back.type='button';back.addEventListener('click',()=>showMathTopics(dashboard));
  const title=make('h2','','📘 Estatística — Aula Inteligente 1.5');
  const intro=make('p','','Aprenda no seu ritmo: entenda, pratique, peça ajuda e acompanhe sua evolução.');
  const steps=make('div','study-smart-steps');
  const lesson=make('section','study-smart-card');
  lesson.append(make('h3','','1. Aprender: média, moda e mediana'),make('p','','Média é a soma dos valores dividida pela quantidade. Moda é o valor mais frequente. Mediana é o valor central dos dados ordenados; se houver dois valores centrais, calcule a média deles.'));
  lesson.append(make('div','study-topic-example','Exemplo: notas 6, 7, 7, 8 e 12. Média = 40 ÷ 5 = 8; moda = 7; mediana = 7.'),make('p','','Dica: ordene os dados para achar a mediana e conte as repetições para encontrar a moda.'));
  const practice=make('section','study-smart-card');practice.append(make('h3','','2. Praticar: resolva as questões'));
  const questions=[
   {q:'Qual é a média dos números 6, 8 e 10?',opts:['7','8','9'],answer:1,why:'6 + 8 + 10 = 24; 24 ÷ 3 = 8.'},
   {q:'Qual é a moda de 2, 3, 3, 5 e 7?',opts:['3','4','5'],answer:0,why:'3 aparece duas vezes e os demais apenas uma. A moda é 3.'},
   {q:'Qual é a mediana de 9, 3, 7, 5 e 11?',opts:['5','7','9'],answer:1,why:'Ordenando: 3, 5, 7, 9, 11. O valor central é 7.'}
  ];
  const key='decola-smart-statistics-v1';let progress={};
  try{progress=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch(e){progress={};}
  const save=()=>{try{localStorage.setItem(key,JSON.stringify(progress));}catch(e){}};
  const score=make('p','study-smart-score');score.setAttribute('aria-live','polite');
  const updateScore=()=>{const done=questions.filter((q,i)=>progress[i]?.done).length;const correct=questions.filter((q,i)=>progress[i]?.done&&progress[i]?.choice===q.answer).length;score.textContent='Seu progresso: '+done+' de '+questions.length+' questões concluídas • '+correct+' acerto(s). Salvo neste navegador.';};
  practice.append(score);
  const hints=[
   ['Some os três valores e divida pela quantidade de números.','A soma é 24; divida por 3.'],
   ['Moda é o valor que mais se repete.','Conte a frequência de cada valor.'],
   ['Ordene os cinco números antes de procurar o centro.','Com cinco números, escolha o terceiro da lista ordenada.']
  ];
  questions.forEach((q,i)=>{
   const card=make('div','study-smart-question');card.append(make('strong','',('Questão '+(i+1)+' de '+questions.length+': ')+q.q));
   const options=make('div','study-topic-answers');
   const feedback=make('div','study-smart-feedback');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
   const retry=make('button','study-smart-retry','Tentar novamente');retry.type='button';
   const buttons=q.opts.map((opt,j)=>{const btn=make('button','',opt);btn.type='button';btn.addEventListener('click',()=>{
    const previous=progress[i];if(previous?.done||(previous?.attempts===1&&previous?.choice!==null&&previous?.choice!==undefined))return;
    const attempts=(previous?.attempts||0)+1;
    progress[i]={choice:j,attempts,done:j===q.answer||attempts>=2};
    save();render();updateScore();updateReport();
   });options.append(btn);return btn;});
   retry.addEventListener('click',()=>{const p=progress[i];if(!p||p.done)return;progress[i]={...p,choice:null};save();render();buttons[0]?.focus();});
   const render=()=>{
    const p=progress[i];const selected=Number.isInteger(p?.choice);const right=selected&&p.choice===q.answer;
    buttons.forEach((btn,j)=>{btn.classList.toggle('study-smart-selected',selected&&p.choice===j);btn.setAttribute('aria-pressed',String(selected&&p.choice===j));btn.disabled=!!p?.done||(p?.attempts===1&&selected&&!p?.done);});
    feedback.replaceChildren();retry.hidden=true;
    if(!selected)return;
    if(right){feedback.classList.add('study-smart-correct');feedback.classList.remove('study-smart-wrong');feedback.append(make('strong','','✅ Muito bem! Resposta correta.'),make('p','',q.why));}
    else if(!p.done){feedback.classList.add('study-smart-wrong');feedback.classList.remove('study-smart-correct');feedback.append(make('strong','','🔎 Ainda não. Você tem mais uma tentativa!'),make('p','',hints[i][0]));retry.hidden=false;}
    else{feedback.classList.add('study-smart-wrong');feedback.classList.remove('study-smart-correct');feedback.append(make('strong','','📘 Vamos aprender com esse erro.'),make('p','','Dica: '+hints[i][1]),make('p','','Resposta correta: '+q.opts[q.answer]+'. '+q.why));}
   };
   card.append(options,feedback,retry);practice.append(card);render();
  });save();updateScore();
  // Relatório de conclusão: não altera a correção nem as chaves de progresso anteriores.
  const report=make('section','study-smart-card study-smart-report');
  report.setAttribute('aria-live','polite');
  function updateReport(){
   const completed=questions.every((q,i)=>progress[i]?.done);
   report.replaceChildren();report.hidden=!completed;
   if(!completed)return;
   const firstTry=questions.filter((q,i)=>progress[i]?.choice===q.answer&&progress[i]?.attempts===1).length;
   const eventual=questions.filter((q,i)=>progress[i]?.choice===q.answer).length;
   const reinforced=questions.map((q,i)=>({q,i,p:progress[i]})).filter(x=>x.p?.attempts>1||x.p?.choice!==x.q.answer);
   report.append(make('h3','','🎓 Aula concluída! Seu relatório com o Professor Leo'));
   report.append(make('p','study-smart-report-stats',
    'Questões concluídas: 3 de 3 • Acertos finais: '+eventual+' de 3 • Acertos na primeira tentativa: '+firstTry+' de 3 • Questões que exigiram reforço: '+reinforced.length+'.'));
   report.append(make('p','','Parabéns por concluir a prática! Acertar depois de uma dica também é aprender. Vamos revisar os pontos que exigiram mais atenção.'));
   const guidance=make('div','study-smart-guidance');
   guidance.append(make('h4','','Seu reforço personalizado'));
   if(!reinforced.length)guidance.append(make('p','','Você acertou tudo na primeira tentativa. Continue praticando para consolidar estatística.'));
   reinforced.forEach(({i})=>{
    const messages=['Média: some os valores e divida pela quantidade.','Moda: encontre o valor mais frequente.','Mediana: ordene os valores e encontre o centro.'];
    guidance.append(make('p','','Questão '+(i+1)+': '+messages[i]));
   });
   report.append(guidance);
   const actions=make('div','study-smart-report-actions');
   const review=make('button','study-dashboard-all','🔁 Revisar esta aula');review.type='button';
   review.addEventListener('click',()=>{lesson.scrollIntoView({behavior:'smooth',block:'start'});});
   const next=make('button','study-dashboard-all','➡️ Voltar aos assuntos');next.type='button';
   next.addEventListener('click',()=>showMathTopics(dashboard));
   actions.append(review,next);report.append(actions);
  }
  updateReport();
  const help=make('section','study-smart-card');help.append(make('h3','','3. Precisa de ajuda?'));
  const helpText=make('p','','O Professor Leo pode orientar seu raciocínio sem entregar a resposta de imediato.');help.append(helpText);
  const helpBtn=make('button','study-dashboard-all','🎓 Pedir ajuda ao Professor Leo');helpBtn.type='button';helpBtn.addEventListener('click',()=>{
   const p=panel();if(!p)return;dashboard.hidden=true;
   const chatOption=[...p.querySelectorAll('.leo-menu-option')].find(b=>b.textContent.includes('Conversar com o Professor Leo'));
   if(chatOption)chatOption.click();else p.querySelector('.leo-talk')?.click();
   const input=p.querySelector('#leo-question-input');if(input){input.value='Professor Leo, estou na Aula Inteligente de Estatística. Ajude-me a entender média, moda e mediana com perguntas e dicas, sem entregar a resposta imediatamente?';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();}
   const chat=p.querySelector('.leo-chat');if(chat){let ret=chat.querySelector('.study-return-lesson');if(!ret){ret=make('button','study-dashboard-all study-return-lesson','← Voltar à aula');ret.type='button';chat.prepend(ret);}ret.hidden=false;ret.onclick=()=>showStatisticsSmartLesson(dashboard,topic);}
  });help.append(helpBtn);
  const evolution=make('section','study-smart-card');evolution.append(make('h3','','4. Evoluir'),make('p','','Se errar, receba dicas e faça uma segunda tentativa antes de ver a resolução. Seus resultados desta aula ficam salvos somente neste navegador.'));
  const reset=make('button','study-dashboard-all','Recomeçar exercícios');reset.type='button';reset.addEventListener('click',()=>{try{localStorage.removeItem(key);}catch(e){}showMathLesson(dashboard,topic);});evolution.append(reset);
  steps.append(lesson,practice,report,help,evolution);dashboard.append(back,title,intro,steps);dashboard.hidden=false;panel()?.querySelector('.leo-body')?.scrollTo(0,0);
 }
 function showBasicMathLesson(dashboard,topic){
  dashboard.replaceChildren();
  const back=document.createElement('button');back.className='study-dashboard-all';back.type='button';back.textContent='← Voltar aos assuntos';back.addEventListener('click',()=>showMathTopics(dashboard));
  const title=document.createElement('h2');title.textContent='📘 '+topic.title;
  const intro=document.createElement('p');intro.textContent=topic.explanation;
  const example=document.createElement('div');example.className='study-topic-example';example.textContent='Exemplo resolvido: '+topic.example;
  const question=document.createElement('h3');question.textContent='Agora é sua vez: '+topic.question;
  const answers=document.createElement('div');answers.className='study-topic-answers';
  const result=document.createElement('p');result.setAttribute('role','status');result.setAttribute('aria-live','polite');
  topic.choices.forEach((choice,index)=>{const b=document.createElement('button');b.type='button';b.textContent=choice;b.addEventListener('click',()=>{result.textContent=(index===topic.correct?'✅ Correto! ':'🔎 Vamos revisar. ')+topic.feedback;});answers.append(b);});
  const help=document.createElement('button');help.type='button';help.className='study-dashboard-all';help.textContent='🎓 Pedir ajuda ao Professor Leo';help.addEventListener('click',()=>{
   const p=panel();if(!p)return;dashboard.hidden=true;
   const chatOption=[...p.querySelectorAll('.leo-menu-option')].find(b=>b.textContent.includes('Conversar com o Professor Leo'));
   if(chatOption)chatOption.click();else p.querySelector('.leo-talk')?.click();
   const input=p.querySelector('#leo-question-input');if(input){input.value='Professor Leo, estou estudando '+topic.title+'. '+topic.explanation+' Minha questão: '+topic.question+' Pode ajudar passo a passo sem entregar a resposta?';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();}
   const chat=p.querySelector('.leo-chat');if(chat){let ret=chat.querySelector('.study-return-lesson');if(!ret){ret=document.createElement('button');ret.type='button';ret.className='study-dashboard-all study-return-lesson';ret.textContent='← Voltar à aula';chat.prepend(ret);}ret.hidden=false;ret.onclick=()=>showMathLesson(dashboard,topic);}
  });
  dashboard.append(back,title,intro,example,question,answers,result,help);dashboard.hidden=false;panel()?.querySelector('.leo-body')?.scrollTo(0,0);
 }
 function showMathTopics(dashboard){
  hideLegacyViews(panel());
  dashboard.replaceChildren();
  const back=document.createElement('button');back.type='button';back.dataset.studyBack='';back.className='study-dashboard-all';back.textContent='← Voltar às matérias';back.addEventListener('click',()=>showSubjects(dashboard));
  const heading=document.createElement('h2');heading.textContent='∑ Matemática';
  const intro=document.createElement('p');intro.textContent='Escolha um assunto. Cada aula tem explicação, exemplo e exercício de fixação.';
  const grid=document.createElement('div');grid.className='study-dashboard-grid';
  mathTopics.forEach((topic,i)=>{const b=document.createElement('button');b.type='button';b.className='study-dashboard-card study-topic-card';const name=document.createElement('strong');name.textContent=(i+1)+'. '+topic.title;const detail=document.createElement('small');detail.textContent=topic.summary;const action=document.createElement('span');action.className='study-subject-action';action.textContent='Estudar agora →';b.append(name,detail,action);b.addEventListener('click',()=>showMathLesson(dashboard,topic));grid.append(b);});
  dashboard.append(back,heading,intro,grid);dashboard.hidden=false;panel()?.querySelector('.leo-body')?.scrollTo(0,0);
 }
 function showSubjects(dashboard){
  hideLegacyViews(panel());
  dashboard.replaceChildren();
  const back=document.createElement('button');back.type='button';back.dataset.studyBack='';back.className='study-dashboard-all';back.textContent='← Voltar ao Meu Decola';back.addEventListener('click',()=>{dashboard.remove();showDashboard();});
  const heading=document.createElement('h2');heading.textContent='📚 Escolha sua matéria';
  const intro=document.createElement('p');intro.textContent='Escolha uma área do ENEM para explorar os conteúdos.';
  const grid=document.createElement('div');grid.className='study-dashboard-grid';
  const subjects=[
   {name:'Matemática',icon:'∑',subtitle:'Números, lógica e resolução de problemas',tone:'math'},
   {name:'Linguagens',icon:'📚',subtitle:'Leitura, interpretação e comunicação',tone:'language'},
   {name:'Ciências Humanas',icon:'🌎',subtitle:'História, geografia, filosofia e sociedade',tone:'human'},
   {name:'Ciências da Natureza',icon:'🧬',subtitle:'Biologia, física e química',tone:'nature'},
   {name:'Redação',icon:'✍️',subtitle:'Argumentação, repertório e escrita',tone:'writing'}
  ];
  subjects.forEach((subject,index)=>{
   const button=document.createElement('button');button.type='button';button.className='study-dashboard-card study-subject-card study-subject-'+subject.tone;
   const artwork=document.createElement('span');artwork.className='study-subject-art';artwork.textContent=subject.icon;artwork.setAttribute('aria-hidden','true');
   const title=document.createElement('strong');title.textContent=subject.name;
   const description=document.createElement('small');description.textContent=subject.subtitle;
   const action=document.createElement('span');action.className='study-subject-action';action.textContent='Começar aula →';
   button.append(artwork,title,description,action);
   button.addEventListener('click',()=>{
    if(index===0){showMathTopics(dashboard);return;}
    const p=panel();const option=[...p.querySelectorAll('.leo-menu-option')].find(b=>b.textContent.includes('Aprender uma matéria'));
    if(!option)return;
    dashboard.hidden=true;selectingLegacySubject=true;const widget=p.closest('.leo-widget');if(widget)widget.dataset.decolaLegacyLesson='true';try{option.click();}finally{selectingLegacySubject=false;if(widget)delete widget.dataset.decolaLegacyLesson;}
    const select=p.querySelector('#leo-area');if(select){const target=subject.name==='Ciências Humanas'?'Humanas':subject.name==='Ciências da Natureza'?'Natureza':subject.name;const match=[...select.options].find(o=>o.textContent.toLocaleLowerCase('pt-BR').includes(target.toLocaleLowerCase('pt-BR')));if(match){select.value=match.value;select.dispatchEvent(new Event('change',{bubbles:true}));}}
   });grid.append(button);
  });dashboard.append(back,heading,intro,grid);dashboard.hidden=false;
 }

 const studyPaths=[
  {name:'Porcentagem',key:'decola-smart-percent-v2',subject:'Matemática'},
  {name:'Frações',key:'decola-smart-fractions-v1',subject:'Matemática'},
  {name:'Equações',key:'decola-smart-equations-v1',subject:'Matemática'},
  {name:'Geometria',key:'decola-smart-geometry-v1',subject:'Matemática'},
  {name:'Estatística',key:'decola-smart-statistics-v1',subject:'Matemática'},
  {name:'Interpretação de Textos',key:'decola-smart-language-interpretation-v1',subject:'Linguagens'}
 ];
 function lessonStats(path){
  try{
   const obj=JSON.parse(localStorage.getItem(path.key)||'{}');
   const entries=[0,1,2].map(i=>obj?.[i]);
   return {done:entries.filter(v=>v?.done).length,correct:entries.filter(v=>v?.done).length};
  }catch{return {done:0,correct:0};}
 }
 function launchLesson(path){
  const p=openPanel();if(!p)return;
  let d=p.querySelector('.study-dashboard');if(!d){showDashboard();d=p.querySelector('.study-dashboard');}
  if(path.subject==='Matemática'){
   const topic=mathTopics.find(t=>t.title===path.name);
   if(topic){showMathLesson(d,topic);return;}
  }
  if(path.subject==='Linguagens'&&typeof window.decolaOpenLanguageSmart==='function'){
   window.decolaOpenLanguageSmart(d);return;
  }
  showSubjects(d);
 }
 function showStudyProgress(dashboard){
  hideLegacyViews(panel());dashboard.replaceChildren();
  const back=document.createElement('button');back.type='button';back.dataset.studyBack='';back.className='study-dashboard-all';back.textContent='← Voltar ao Meu Decola';back.onclick=showDashboard;
  const title=document.createElement('h2');title.textContent='📈 Meu progresso';
  const intro=document.createElement('p');intro.textContent='Resultados registrados neste navegador. Sua conta e a sincronização entre dispositivos ainda serão implementadas.';
  const grid=document.createElement('div');grid.className='study-dashboard-grid';
  studyPaths.forEach(path=>{
   const stats=lessonStats(path),b=document.createElement('button');b.type='button';b.className='study-dashboard-card';
   const name=document.createElement('strong');name.textContent=path.name;
   const desc=document.createElement('small');desc.textContent=path.subject+' • '+stats.done+' de 3 questões concluídas';
   const action=document.createElement('span');action.className='study-subject-action';action.textContent='Abrir aula →';
   b.append(name,desc,action);b.onclick=()=>launchLesson(path);grid.append(b);
  });
  dashboard.append(back,title,intro,grid);dashboard.hidden=false;panel()?.querySelector('.leo-body')?.scrollTo(0,0);
 }
 function openDashboardTool(terms){
  const p=openPanel();if(!p)return;
  const d=p.querySelector('.study-dashboard');if(d)d.hidden=true;
  openModule({terms});
 }
 function showDashboard(){
  const p=openPanel();if(!p)return;
  let dashboard=p.querySelector('.study-dashboard');
  if(!dashboard){dashboard=document.createElement('section');dashboard.className='study-dashboard';dashboard.setAttribute('aria-label','Meu Decola — painel do estudante');p.querySelector('.leo-body')?.prepend(dashboard);}
  hideLegacyViews(p);dashboard.replaceChildren();
  const heading=document.createElement('h2');heading.textContent='🚀 Meu Decola';
  const intro=document.createElement('p');intro.textContent='Seu espaço de estudos: escolha um caminho e continue de onde parou.';
  const recent=(()=>{try{return studyPaths.map(path=>({...path,stats:lessonStats(path)})).filter(x=>x.stats.done>0).sort((a,b)=>a.stats.done-b.stats.done)[0]||{...studyPaths[0],stats:lessonStats(studyPaths[0])};}catch{return {...studyPaths[0],stats:{done:0,correct:0}};}})();
  const hero=document.createElement('section');hero.className='study-dashboard-hero';
  const heroTitle=document.createElement('h3');heroTitle.textContent='📘 Continue estudando';
  const heroText=document.createElement('p');heroText.textContent=recent.subject+' • '+recent.name+' — '+recent.stats.done+' de 3 questões concluídas';
  const continueBtn=document.createElement('button');continueBtn.type='button';continueBtn.className='study-dashboard-all study-dashboard-primary';continueBtn.textContent='Continuar estudando →';continueBtn.onclick=()=>launchLesson(recent);
  hero.append(heroTitle,heroText,continueBtn);
  const grid=document.createElement('div');grid.className='study-dashboard-grid';
  const options=[
   ['📚','Minhas aulas','Matérias e trilhas de aprendizagem',()=>showSubjects(dashboard)],
   ['🎓','Professor Leo','Abra o tutor em uma tela ampla',()=>openDashboardTool(['conversar com o professor leo'])],
   ['📈','Meu progresso','Acompanhe aulas e exercícios concluídos',()=>showStudyProgress(dashboard)],
   ['📝','Simulados','Treine com questões para o ENEM',()=>openDashboardTool(['simulado'])]
  ];
  options.forEach(([icon,label,detail,action])=>{
   const b=document.createElement('button');b.type='button';b.className='study-dashboard-card';
   const i=document.createElement('span');i.className='study-dashboard-icon';i.textContent=icon;
   const name=document.createElement('strong');name.textContent=label;
   const desc=document.createElement('small');desc.textContent=detail;
   b.append(i,name,desc);b.onclick=action;grid.append(b);
  });
  const all=document.createElement('button');all.type='button';all.className='study-dashboard-all';all.textContent='Mais ferramentas de estudo →';all.onclick=()=>{dashboard.hidden=true;p.querySelector('.leo-back')?.click();};
  dashboard.append(heading,intro,hero,grid,all);dashboard.hidden=false;
  p.querySelector('.leo-body')?.scrollTo(0,0);
 }
 // Delegação no documento: funciona mesmo se o Professor Leo for criado depois deste script.
 document.addEventListener('decola:choose-subject',()=>{
  const p=openPanel();if(!p)return;
  let d=p.querySelector('.study-dashboard');
  if(!d){showDashboard();d=p.querySelector('.study-dashboard');}
  if(d)showSubjects(d);
 });
 document.addEventListener('decola:open-study',event=>{
  const action=event.detail?.view;
  if(action==='chat'||action==='simulado')openDashboardTool([action==='chat'?'conversar com o professor leo':'simulado']);
  else if(action==='subjects'){showDashboard();showSubjects(panel().querySelector('.study-dashboard'));}
  else showDashboard();
 });
 document.addEventListener('decola:leo-view',()=>{const d=panel()?.querySelector('.study-dashboard');if(d)d.hidden=true;});
 function attach(){
  const nav=document.querySelector('.header nav');
  if(nav&&!nav.querySelector('[data-open-studies]')){
   const button=document.createElement('button');button.type='button';button.className='study-nav-link';button.dataset.openStudies='';
   button.textContent='📚 Área de estudos';button.addEventListener('click',showDashboard);nav.prepend(button);
  }
  const launch=launcher();
  if(launch){launch.textContent='🎓 Abrir área de estudos';launch.setAttribute('aria-label','Abrir painel de estudos');launch.addEventListener('click',()=>{if(!panel()?.hidden)showDashboard();});}
  const p=panel();
  if(p){
   // Voltar no cabeçalho azul: respeita o nível atual da navegação.
   const top=p.querySelector('.leo-top');
   const topBack=document.createElement('button');
   topBack.type='button';topBack.className='study-top-back';topBack.textContent='← Voltar ao menu anterior';
   topBack.setAttribute('aria-label','Voltar ao menu anterior');
   top?.insertBefore(topBack,p.querySelector('.leo-close'));
   const updateTopBack=()=>{
    const d=p.querySelector('.study-dashboard');
    const inner=d&&!d.hidden?d.querySelector('[data-study-back]'):null;
    const active=!!inner;
    topBack.hidden=!active;
   };
   topBack.addEventListener('click',()=>{
    const d=p.querySelector('.study-dashboard');
    const back=d&&!d.hidden?d.querySelector('[data-study-back]'):null;
    if(back)back.click();
    else showDashboard();
    updateTopBack();
   });
   new MutationObserver(updateTopBack).observe(p.querySelector('.leo-body'),{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
   updateTopBack();

   const legacyArea=p.querySelector('#leo-area');
   if(legacyArea)legacyArea.addEventListener('change',()=>{
    if(selectingLegacySubject)return;
    const dashboard=p.querySelector('.study-dashboard');
    if(!dashboard||dashboard.hidden)return;
    if(legacyArea.selectedIndex===0)showMathTopics(dashboard);
   });
   const sync=()=>{document.body.classList.toggle('leo-study-open',!p.hidden);if(p.hidden){const dashboard=p.querySelector('.study-dashboard');if(dashboard)dashboard.hidden=true;}};
   new MutationObserver(sync).observe(p,{attributes:true,attributeFilter:['hidden']});sync();
   const header=p.querySelector('.leo-top strong');
   const location=p.querySelector('.leo-current-location');
   const updateHeader=()=>{if(header)header.textContent=location?.textContent?.includes('Conversa com o Professor Leo')?'🎓 Professor Leo':'🚀 Decola Vestibular — Área de estudos';};
   if(location)new MutationObserver(updateHeader).observe(location,{childList:true,characterData:true,subtree:true});updateHeader();
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach);else attach();
})();