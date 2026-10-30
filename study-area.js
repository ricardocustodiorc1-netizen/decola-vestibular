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
   const p=panel();if(!p)return;
   dashboard.hidden=true;
   const chatOption=[...p.querySelectorAll('.leo-menu-option')].find(b=>b.textContent.includes('Conversar com o Professor Leo'));
   if(chatOption)chatOption.click();
   else p.querySelector('.leo-talk')?.click();
   const input=p.querySelector('#leo-question-input');
   if(input){
    input.value='Professor Leo, estou estudando Matemática, assunto '+topic.title+'. '+topic.explanation+' Exemplo da aula: '+topic.example+' Minha questão é: '+topic.question+' Alternativas: '+topic.choices.join(', ')+'. Pode me ajudar a entender o raciocínio passo a passo, sem entregar a resposta imediatamente?';
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.focus();
   }
   const chat=p.querySelector('.leo-chat');
   if(chat&&!chat.querySelector('.study-return-lesson')){
    const returnButton=document.createElement('button');returnButton.type='button';returnButton.className='study-dashboard-all study-return-lesson';returnButton.textContent='← Voltar à aula';
    chat.prepend(returnButton);
   }
   const returnButton=chat?.querySelector('.study-return-lesson');
   if(returnButton){returnButton.onclick=()=>{showMathLesson(dashboard,topic);p.querySelector('.leo-resume')?.setAttribute('hidden','');};returnButton.hidden=false;}\n   const resume=[...p.querySelectorAll('button')].find(b=>b.textContent.includes('Voltar aos exercícios'));\n   if(resume)resume.hidden=true;
   const status=p.querySelector('.leo-ai-status');
   if(status)status.textContent='Sua dúvida sobre '+topic.title+' está pronta. Revise e clique em Enviar pergunta.';
  });
  dashboard.append(back,title,intro,example,question,answers,result,help);dashboard.hidden=false;panel()?.querySelector('.leo-body')?.scrollTo(0,0);
 }
 function showMathTopics(dashboard){
  dashboard.replaceChildren();
  const back=document.createElement('button');back.type='button';back.className='study-dashboard-all';back.textContent='← Voltar às matérias';back.addEventListener('click',()=>showSubjects(dashboard));
  const heading=document.createElement('h2');heading.textContent='∑ Matemática';
  const intro=document.createElement('p');intro.textContent='Escolha um assunto. Cada aula tem explicação, exemplo e exercício de fixação.';
  const grid=document.createElement('div');grid.className='study-dashboard-grid';
  mathTopics.forEach((topic,i)=>{const b=document.createElement('button');b.type='button';b.className='study-dashboard-card study-topic-card';const name=document.createElement('strong');name.textContent=(i+1)+'. '+topic.title;const detail=document.createElement('small');detail.textContent=topic.summary;const action=document.createElement('span');action.className='study-subject-action';action.textContent='Estudar agora →';b.append(name,detail,action);b.addEventListener('click',()=>showMathLesson(dashboard,topic));grid.append(b);});
  dashboard.append(back,heading,intro,grid);dashboard.hidden=false;panel()?.querySelector('.leo-body')?.scrollTo(0,0);
 }
 function showSubjects(dashboard){
  hideLegacyViews(panel());
  dashboard.replaceChildren();
  const back=document.createElement('button');back.type='button';back.className='study-dashboard-all';back.textContent='← Voltar ao Meu Decola';back.addEventListener('click',()=>{dashboard.remove();showDashboard();});
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
    dashboard.hidden=true;selectingLegacySubject=true;try{option.click();}finally{selectingLegacySubject=false;}
    const select=p.querySelector('#leo-area');if(select){select.value=String(index);select.dispatchEvent(new Event('change',{bubbles:true}));}
   });grid.append(button);
  });dashboard.append(back,heading,intro,grid);dashboard.hidden=false;
 }
 function showDashboard(){
  const p=openPanel();if(!p)return;
  let dashboard=p.querySelector('.study-dashboard');
  if(!dashboard){
   dashboard=document.createElement('section');dashboard.className='study-dashboard';
   dashboard.setAttribute('aria-label','Meu Decola — início dos estudos');
   const heading=document.createElement('h2');heading.textContent='🚀 Meu Decola';
   const intro=document.createElement('p');intro.textContent='O que você quer fazer hoje? Escolha uma opção para começar.';
   const grid=document.createElement('div');grid.className='study-dashboard-grid';
   cards.forEach(card=>{
    const button=document.createElement('button');button.type='button';button.className='study-dashboard-card';
    const icon=document.createElement('span');icon.className='study-dashboard-icon';icon.textContent=card.icon;
    const title=document.createElement('strong');title.textContent=card.title;
    const description=document.createElement('small');description.textContent=card.detail;
    button.append(icon,title,description);button.addEventListener('click',()=>{if(card.title==='Matérias'){showSubjects(dashboard);return;}dashboard.hidden=true;openModule(card);});
    grid.append(button);
   });
   const all=document.createElement('button');all.type='button';all.className='study-dashboard-all';all.textContent='Ver todas as ferramentas de estudo →';
   all.addEventListener('click',()=>{dashboard.hidden=true;const back=p.querySelector('.leo-back');if(back)back.click();});
   dashboard.append(heading,intro,grid,all);
   p.querySelector('.leo-body')?.prepend(dashboard);
  }
  dashboard.hidden=false;
  p.querySelector('.leo-body')?.scrollTo({top:0,behavior:'instant'});
 }
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
   // A entrada "Aprender uma matéria" abre a escolha visual de áreas,
   // preservando o módulo antigo apenas para aulas de outras disciplinas.
   p.addEventListener('click',event=>{
    const option=event.target.closest?.('.leo-menu-option');
    if(!option||selectingLegacySubject||!option.textContent.includes('Aprender uma matéria'))return;
    event.preventDefault();event.stopImmediatePropagation();
    let dashboard=p.querySelector('.study-dashboard');
    if(!dashboard){showDashboard();dashboard=p.querySelector('.study-dashboard');}
    if(dashboard)showSubjects(dashboard);
    p.querySelector('.leo-body')?.scrollTo(0,0);
   },true);
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