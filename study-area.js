// Painel de entrada do aluno: preserva os módulos e o progresso existentes.
(function(){
 const cards=[
  {icon:'📚',title:'Matérias',detail:'Escolha uma área do ENEM e comece a estudar.',terms:['aprender uma matéria']},
  {icon:'✏️',title:'Exercícios',detail:'Treinos, simulados e recuperação guiada.',terms:['fazer exercícios de matemática']},
  {icon:'📈',title:'Minha evolução',detail:'Veja seu desempenho e plano de estudos.',terms:['minha evolução']},
  {icon:'🎓',title:'Professor Leo',detail:'Converse com o tutor em uma tela ampla.',terms:['conversar com o professor leo']}
 ];
 const panel=()=>document.querySelector('.leo-panel');
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
 function showSubjects(dashboard){
  dashboard.replaceChildren();
  const back=document.createElement('button');back.type='button';back.className='study-dashboard-all';back.textContent='← Voltar ao Meu Decola';back.addEventListener('click',()=>{dashboard.remove();showDashboard();});
  const heading=document.createElement('h2');heading.textContent='📚 Escolha sua matéria';
  const intro=document.createElement('p');intro.textContent='Selecione uma área do ENEM para abrir a aula introdutória.';
  const grid=document.createElement('div');grid.className='study-dashboard-grid';
  ['Matemática','Linguagens','Ciências Humanas','Ciências da Natureza','Redação'].forEach((name,index)=>{
   const button=document.createElement('button');button.type='button';button.className='study-dashboard-card';button.textContent=name;
   button.addEventListener('click',()=>{
    const p=panel();const option=[...p.querySelectorAll('.leo-menu-option')].find(b=>b.textContent.includes('Aprender uma matéria'));
    if(!option)return;
    dashboard.hidden=true;option.click();
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