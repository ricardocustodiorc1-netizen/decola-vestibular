// Professor Leo — demonstração pedagógica local. Não utiliza IA nem envia dados.
const lessons = [
  { area:'Matemática', title:'Porcentagem', explanation:'Porcentagem significa uma parte de cada 100. Para calcular 20% de 150, faça 150 × 20 ÷ 100 = 30.', question:'Quanto é 10% de 80?', choices:['8','10','18'], correct:0, hint:'10% é o mesmo que dividir por 10.', feedback:'80 ÷ 10 = 8. Você também pode fazer 80 × 0,10.' },
  { area:'Linguagens', title:'Interpretação de texto', explanation:'Em questões de interpretação, diferencie o que está escrito do que você supõe. Busque palavras que sustentem a resposta.', question:'No trecho “Apesar da chuva, a turma foi à escola”, a expressão “apesar de” indica:', choices:['Causa','Contraste','Conclusão'], correct:1, hint:'A turma foi à escola mesmo com uma condição contrária.', feedback:'“Apesar de” introduz uma concessão, isto é, uma ideia de contraste.' },
  { area:'Ciências Humanas', title:'Cidadania', explanation:'Cidadania envolve direitos e deveres e a participação das pessoas na vida em sociedade.', question:'Qual atitude é exemplo de participação cidadã?', choices:['Participar de decisões da comunidade','Ignorar problemas coletivos','Impedir o debate'], correct:0, hint:'Pense em uma ação que ajuda nas decisões coletivas.', feedback:'Participar de decisões da comunidade é uma forma de exercer cidadania.' },
  { area:'Ciências da Natureza', title:'Transformações físicas', explanation:'Uma transformação física altera o estado ou a forma de um material sem formar outra substância.', question:'Qual é uma transformação física?', choices:['Queima de papel','Ferrugem no ferro','Gelo derretendo'], correct:2, hint:'Qual mudança pode ocorrer sem criar uma substância diferente?', feedback:'Ao derreter, o gelo continua sendo água: é uma transformação física.' },
  { area:'Redação', title:'Tese argumentativa', explanation:'Na redação dissertativo-argumentativa, a tese é seu posicionamento sobre o tema. Os parágrafos seguintes precisam sustentá-la com argumentos.', question:'Qual frase apresenta uma tese?', choices:['A tecnologia existe.','É necessário ampliar o acesso à internet para reduzir desigualdades.','Qual é o horário?'], correct:1, hint:'Procure uma opinião defendida claramente.', feedback:'A segunda frase apresenta um posicionamento que pode ser defendido com argumentos.' }
];
const root=document.createElement('aside');
root.className='leo-widget';
root.innerHTML=`<button type="button" class="leo-launch" aria-expanded="false" aria-controls="leo-panel">🎓 Conversar com Professor Leo</button>
<section id="leo-panel" class="leo-panel" hidden aria-label="Professor Leo — demonstração">
<header class="leo-top"><div><strong>🎓 Professor Leo</strong><small>Tutor em teste • IA disponível</small></div><button type="button" class="leo-close" aria-label="Fechar Professor Leo">×</button></header>
<div class="leo-body"><p class="leo-message">Olá! Vamos estudar juntos? Escolha uma matéria e faremos uma explicação e um exercício. Você pode praticar com os exercícios demonstrativos ou fazer uma pergunta à IA.</p><p class="leo-recommend" aria-live="polite"></p><label for="leo-area">Escolha uma área de estudo</label><select id="leo-area"></select><div class="leo-lesson" aria-live="polite"></div><div class="leo-chat"><label for="leo-question-input">Pergunte ao Professor Leo (IA em teste)</label><textarea id="leo-question-input" rows="3" maxlength="700" placeholder="Ex.: Pode me explicar porcentagem com um exemplo do ENEM?"></textarea><div class="leo-chat-actions"><button type="button" class="leo-ask">Enviar pergunta</button><button type="button" class="leo-new-question">+ Nova pergunta</button></div><p class="leo-ai-status" role="status" aria-live="polite"></p><p class="leo-ai-answer"></p></div></div>
<footer class="leo-bottom"><small>Não envie dados pessoais. IA em teste: confira informações importantes. WhatsApp ainda não disponível.</small></footer>
</section>`;
document.body.append(root);
const launch=root.querySelector('.leo-launch');
const panel=root.querySelector('.leo-panel');
const selector=root.querySelector('#leo-area');
const lessonBox=root.querySelector('.leo-lesson');
for(let i=0;i<lessons.length;i++){const option=document.createElement('option');option.value=String(i);option.textContent=lessons[i].area;selector.append(option);}
function recommend(){
  try{
    const saved=JSON.parse(localStorage.getItem('decola-vestibular:progress:v1')||'null');
    const results=saved?.result?.results;
    if(!Array.isArray(results))return;
    const weak=results.find(x=>x && x.correct===false);
    if(!weak)return;
    // Correspondência flexível: o formato do diagnóstico pode evoluir.
    const name=String(weak.area||weak.short||'').toLowerCase();
    const index=lessons.findIndex(x=>name && x.area.toLowerCase().includes(name));
    if(index>=0){selector.value=String(index);root.querySelector('.leo-recommend').textContent='Sugestão baseada no seu diagnóstico demonstrativo: comece por '+lessons[index].area+'.';}
  }catch{}
}
function renderLesson(){
  const lesson=lessons[Number(selector.value)];
  lessonBox.replaceChildren();
  const title=document.createElement('h3');title.textContent=lesson.title;
  const explanation=document.createElement('p');explanation.textContent=lesson.explanation;
  const question=document.createElement('p');question.className='leo-question';question.textContent=lesson.question;
  const options=document.createElement('div');options.className='leo-choices';
  const status=document.createElement('p');status.className='leo-status';status.setAttribute('role','status');
  const hint=document.createElement('button');hint.type='button';hint.className='leo-hint';hint.textContent='Preciso de uma dica';
  hint.addEventListener('click',()=>{status.textContent=lesson.hint;});
  lesson.choices.forEach((answer,i)=>{
    const button=document.createElement('button');button.type='button';button.textContent=answer;
    button.addEventListener('click',()=>{
      if(i===lesson.correct){status.textContent='Muito bem! '+lesson.feedback;}
      else{status.textContent='Ainda não. '+lesson.hint+' Tente outra opção.';}
    });
    options.append(button);
  });
  lessonBox.append(title,explanation,question,options,hint,status);
}
// Treino demonstrativo de Matemática: correção e progresso locais, sem chamadas à API.
const leoPracticeQuestions=[
  {topic:'Porcentagem',question:'Quanto é 25% de 200?',choices:['25','50','75'],correct:1,explanation:'25% é um quarto. 200 ÷ 4 = 50.'},
  {topic:'Porcentagem',question:'Um produto de R$ 80 teve desconto de 10%. Qual é o novo preço?',choices:['R$ 72','R$ 70','R$ 78'],correct:0,explanation:'10% de 80 = 8. O novo preço é 80 − 8 = R$ 72.'},
  {topic:'Porcentagem',question:'Em uma turma de 40 alunos, 30% faltaram. Quantos faltaram?',choices:['10','12','14'],correct:1,explanation:'30 ÷ 100 × 40 = 12 alunos.'},
  {topic:'Porcentagem',question:'Uma conta de R$ 150 aumentou 20%. Qual é o valor final?',choices:['R$ 170','R$ 180','R$ 200'],correct:1,explanation:'20% de 150 = 30. Valor final: 150 + 30 = R$ 180.'}
];
// Reforço imediato: uma questão semelhante, sem alterar a pontuação da rodada.
const leoReinforcement=[
 {steps:'25% significa um quarto. Divida o total por 4.',question:'Quanto é 25% de 120?',choices:['20','30','40'],correct:1,explanation:'120 ÷ 4 = 30. Portanto, 25% de 120 é 30.'},
 {steps:'Primeiro calcule 10% do preço dividindo por 10. Depois subtraia o desconto do preço original.',question:'Uma camiseta de R$ 60 teve desconto de 10%. Quanto custa agora?',choices:['R$ 54','R$ 50','R$ 56'],correct:0,explanation:'10% de 60 é 6; 60 − 6 = R$ 54.'},
 {steps:'Para encontrar 30%, calcule 10% dividindo por 10 e multiplique o resultado por 3.',question:'Em uma turma de 50 alunos, 30% faltaram. Quantos faltaram?',choices:['10','15','20'],correct:1,explanation:'10% de 50 é 5. Três vezes 5 = 15 alunos.'},
 {steps:'Aumento é soma, não desconto. Calcule 20% do valor e acrescente ao original.',question:'Uma mensalidade de R$ 100 aumentou 20%. Qual o novo valor?',choices:['R$ 80','R$ 110','R$ 120'],correct:2,explanation:'20% de 100 é 20. Valor final: 100 + 20 = R$ 120.'}
];
// Novos exemplos para retomada adaptativa (não repetem o mesmo exercício).
const leoRecoveryAlternatives=[
 [
  {steps:'Pense em quatro partes iguais: 25% é uma delas.',question:'Uma caixa tem 80 lápis. Quantos são 25%?',choices:['15','20','25'],correct:1,explanation:'80 ÷ 4 = 20 lápis.'},
  {steps:'Uma pizza dividida em quatro partes tem 25% em cada fatia.',question:'Quanto é 25% de 64?',choices:['16','20','24'],correct:0,explanation:'64 ÷ 4 = 16.'}
 ],
 [
  {steps:'Imagine uma etiqueta: primeiro encontre 10% dividindo por dez; depois tire esse valor.',question:'Um livro de R$ 90 tem 10% de desconto. Qual é o preço?',choices:['R$ 81','R$ 80','R$ 89'],correct:0,explanation:'10% de 90 é 9; 90 − 9 = R$ 81.'},
  {steps:'O desconto reduz o preço. Descubra quanto vale um décimo.',question:'Uma mochila de R$ 120 teve 10% de desconto. Quanto custa?',choices:['R$ 112','R$ 108','R$ 110'],correct:1,explanation:'120 ÷ 10 = 12; 120 − 12 = R$ 108.'}
 ],
 [
  {steps:'Imagine dez grupos iguais. Três grupos representam 30%.',question:'Em um clube com 60 pessoas, 30% são crianças. Quantas crianças?',choices:['18','20','30'],correct:0,explanation:'10% de 60 é 6; 30% são 3 × 6 = 18.'},
  {steps:'30% são três partes de dez. Divida por 10 e multiplique por 3.',question:'Em uma escola com 70 alunos, 30% usam ônibus. Quantos?',choices:['14','21','30'],correct:1,explanation:'70 ÷ 10 × 3 = 21.'}
 ],
 [
  {steps:'Pense em uma conta que aumentou: some o acréscimo, não subtraia.',question:'Uma conta de R$ 200 aumentou 20%. Qual é o total?',choices:['R$ 220','R$ 240','R$ 180'],correct:1,explanation:'20% de 200 é 40; 200 + 40 = R$ 240.'},
  {steps:'Um aumento de 20% equivale a acrescentar duas partes de 10%.',question:'Um serviço de R$ 50 aumentou 20%. Quanto custa agora?',choices:['R$ 55','R$ 60','R$ 70'],correct:1,explanation:'10% de 50 é 5; 20% é 10; 50 + 10 = R$ 60.'}
 ]
];
let leoReinforcementAnswers={};
// Desafios progressivos demonstrativos, escolhidos conforme a pontuação da rodada.
const leoChallenges=[
 {level:'Fácil',question:'Quanto é 10% de 90?',choices:['9','19','90'],correct:0,explanation:'10% é um décimo: 90 ÷ 10 = 9.'},
 {level:'Médio',question:'Um tênis de R$ 240 recebeu desconto de 15%. Quanto custa agora?',choices:['R$ 204','R$ 225','R$ 216'],correct:0,explanation:'15% de 240 = 36. Preço final: 240 − 36 = R$ 204.'},
 {level:'Difícil',question:'Um produto aumentou 20% e depois teve desconto de 20%. Em relação ao preço inicial, o valor final:',choices:['Ficou igual','Caiu 4%','Subiu 4%'],correct:1,explanation:'Se custava 100, sobe para 120 e cai 20% de 120 (=24): termina em 96, 4% abaixo do inicial.'}
];
// Painel de evolução: registra apenas desempenho demonstrativo neste navegador.
const leoRecoveryProgressKey='decola-vestibular:leo-recovery-progress:v1';
function leoRoundSignature(){return leoPracticeAnswers.map(x=>x===true?'1':x===false?'0':'-').join('');}
function leoReadRecoveryProgress(){
  try{
    const value=JSON.parse(localStorage.getItem(leoRecoveryProgressKey)||'null');
    if(value&&value.signature===leoRoundSignature()&&Number.isInteger(value.mastered)&&Number.isInteger(value.total)&&value.total>=0&&value.mastered>=0&&value.mastered<=value.total)return value;
  }catch{}
  return null;
}
const leoMathRecoveryTopicsKey='decola-vestibular:leo-math-recovered-topics:v1';
function leoReadMathRecoveryTopics(){
  try{
    const saved=JSON.parse(localStorage.getItem(leoMathRecoveryTopicsKey)||'null');
    if(saved&&saved.signature===leoRoundSignature()&&Array.isArray(saved.indices))return saved.indices.filter(i=>Number.isInteger(i)&&i>=0&&i<leoPracticeQuestions.length&&leoPracticeAnswers[i]===false);
  }catch(_error){}
  return [];
}
function leoMarkMathTopicRecovered(index){
  if(leoPracticeAnswers[index]!==false)return;
  const indices=Array.from(new Set([...leoReadMathRecoveryTopics(),index]));
  try{localStorage.setItem(leoMathRecoveryTopicsKey,JSON.stringify({signature:leoRoundSignature(),indices}));}catch(_error){}
  leoMissionRecoverySucceeded('practice',index);
}
function leoSaveRecoveryProgress(mastered,total){
  const value={signature:leoRoundSignature(),mastered,total,completedAt:new Date().toISOString()};
  try{localStorage.setItem(leoRecoveryProgressKey,JSON.stringify(value));}catch{}
  return value;
}
function leoEvolutionPanel(correct,total,record){
  const box=document.createElement('section');box.className='leo-evolution';
  const title=document.createElement('h4');title.textContent='📈 Minha evolução';
  const metrics=document.createElement('div');metrics.className='leo-evolution-metrics';
  const initial=document.createElement('div');initial.className='leo-evolution-metric';
  const label=document.createElement('small');label.textContent='Treino inicial';
  const value=document.createElement('strong');value.textContent=Math.round(correct/total*100)+'%';
  const detail=document.createElement('small');detail.textContent=correct+' de '+total+' questões';
  initial.append(label,value,detail);
  const recovery=document.createElement('div');recovery.className='leo-evolution-metric';
  const recoveryLabel=document.createElement('small');recoveryLabel.textContent='Recuperação';
  const recoveryValue=document.createElement('strong');
  recoveryValue.textContent=record?record.mastered+' / '+record.total:'Pendente';
  const recoveryDetail=document.createElement('small');
  recoveryDetail.textContent=record?'Tópicos com domínio demonstrado':'Conclua o reforço para acompanhar';
  recovery.append(recoveryLabel,recoveryValue,recoveryDetail);
  metrics.append(initial,recovery);
  const track=document.createElement('div');track.className='leo-score-track';
  track.setAttribute('role','progressbar');track.setAttribute('aria-label','Progresso da recuperação');
  track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax','100');
  const percent=record&&record.total?Math.round(record.mastered/record.total*100):0;
  track.setAttribute('aria-valuenow',String(percent));
  const fill=document.createElement('div');fill.className='leo-score-fill';fill.style.width=percent+'%';track.append(fill);
  const summary=document.createElement('p');summary.textContent=record?(record.mastered===record.total?'Todos os tópicos do reforço foram recuperados nesta atividade.':'Ainda há tópicos que precisam de revisão. Você pode praticar novamente.'):'O treino inicial e a recuperação são avaliações diferentes. Sua nota original não muda.';
  box.append(title,metrics,track,summary);
  return box;
}
let leoChallengeResult=null;
const leoPracticeKey='decola-vestibular:leo-math-practice:v1';
function readLeoPractice(){
  try{
    const data=JSON.parse(localStorage.getItem(leoPracticeKey)||'null');
    if(data&&Array.isArray(data.answers)&&data.answers.length===leoPracticeQuestions.length&&data.answers.every(x=>x===null||x===true||x===false))return data.answers;
  }catch{}
  return Array(leoPracticeQuestions.length).fill(null);
}
const leoHistoryKey='decola-vestibular:leo-math-history:v1';
function readLeoHistory(){
  try{
    const history=JSON.parse(localStorage.getItem(leoHistoryKey)||'[]');
    if(Array.isArray(history))return history.filter(x=>x&&Number.isInteger(x.correct)&&x.correct>=0&&x.correct<=leoPracticeQuestions.length).slice(-20);
  }catch{}
  return [];
}
let leoPracticeHistory=readLeoHistory();
let leoPracticeAnswers=readLeoPractice();
let leoRoundRecorded=false;
function saveLeoHistory(){
  if(leoRoundRecorded||leoPracticeAnswers.some(x=>x===null))return;
  leoRoundRecorded=true;
  leoPracticeHistory.push({correct:leoPracticeAnswers.filter(Boolean).length,total:leoPracticeQuestions.length,date:new Date().toISOString()});
  leoPracticeHistory=leoPracticeHistory.slice(-20);
  try{localStorage.setItem(leoHistoryKey,JSON.stringify(leoPracticeHistory));}catch{}
}
if(leoPracticeAnswers.every(x=>x!==null)){
  // Rodadas anteriores à atualização não são incluídas retroativamente no histórico.
  leoRoundRecorded=true;
}
let leoPracticeIndex=leoPracticeAnswers.findIndex(x=>x===null);
if(leoPracticeIndex<0)leoPracticeIndex=0;
const leoPractice=document.createElement('section');
leoPractice.className='leo-practice';
leoPractice.setAttribute('aria-label','Treino de Matemática');
lessonBox.after(leoPractice);
// Histórico real das rodadas de Matemática, salvo localmente (até 20).
function leoLearningHistoryPanel(){
  const section=document.createElement('section');section.className='leo-learning-history';
  const title=document.createElement('h4');title.textContent='📚 Histórico de aprendizagem · Matemática';
  section.append(title);
  const entries=leoPracticeHistory.filter(x=>x&&Number.isInteger(x.correct)&&Number.isInteger(x.total)&&x.total>0).slice(-20);
  if(!entries.length){
    const empty=document.createElement('p');empty.textContent='Conclua uma rodada para começar a acompanhar seu progresso em Matemática.';
    section.append(empty);return section;
  }
  const latest=entries[entries.length-1];
  const first=entries[0];
  const percentage=x=>Math.round(100*x.correct/x.total);
  const metrics=document.createElement('p');metrics.className='leo-learning-summary';
  metrics.textContent=entries.length+' rodada(s) registrada(s) · Primeira: '+percentage(first)+'% · Última: '+percentage(latest)+'%.';
  section.append(metrics);
  const chart=document.createElement('div');chart.className='leo-learning-chart';
  chart.setAttribute('role','img');
  chart.setAttribute('aria-label','Acertos por rodada: '+entries.map((x,i)=>'rodada '+(i+1)+', '+percentage(x)+'%').join('; '));
  entries.forEach((x,i)=>{
    const col=document.createElement('div');col.className='leo-learning-column';
    const value=document.createElement('span');value.className='leo-learning-value';value.textContent=percentage(x)+'%';
    const track=document.createElement('div');track.className='leo-learning-bar-track';
    const bar=document.createElement('div');bar.className='leo-learning-bar';bar.style.height=percentage(x)+'%';
    track.append(bar);
    const label=document.createElement('small');label.textContent=String(i+1);label.title='Rodada '+(i+1)+' · '+new Date(x.date).toLocaleDateString('pt-BR');
    col.append(value,track,label);chart.append(col);
  });
  section.append(chart);
  const hint=document.createElement('p');hint.className='leo-learning-note';
  hint.textContent='Cada barra representa uma rodada de Matemática. O número abaixo indica a ordem da rodada; a porcentagem mostra os acertos. O histórico é demonstrativo, fica apenas neste navegador e mantém as 20 rodadas mais recentes.';
  section.append(hint);
  const other=document.createElement('p');other.className='leo-learning-note';
  other.textContent='Outras matérias aparecerão aqui quando tiverem exercícios avaliados; não há resultados dessas áreas para mostrar ainda.';
  section.append(other);
  return section;
}
// Treino direcionado independente: não altera a nota da rodada nem o histórico.
let leoFocusedMathIndex=null;
function leoOpenFocusedMath(){
  const missed=leoPracticeAnswers.map((answer,index)=>answer===false?index:-1).filter(index=>index>=0);
  const pending=missed.filter(index=>!leoReadMathRecoveryTopics().includes(index));
  const candidates=pending.length?pending:missed.length?missed:leoPracticeQuestions.map((_,index)=>index);
  leoFocusedMathIndex=candidates[0];
  selector.value='0';
  leoShowView('practice');
  renderLeoPractice();
}
function leoFocusedMathPanel(){
  const box=document.createElement('section');
  box.className='leo-dashboard-next leo-focused-math';
  const title=document.createElement('h4');title.textContent='🎯 Treino personalizado com o Professor Leo';
  const intro=document.createElement('p');
  intro.textContent='Exercício escolhido a partir dos seus erros de Matemática. Este treino extra não altera a pontuação original.';
  const index=leoFocusedMathIndex;
  const original=leoPracticeQuestions[index];
  const exercise=leoReinforcement[index];
  const topic=document.createElement('p');
  topic.textContent='Conteúdo: '+original.topic+' · Revisão da questão '+(index+1);
  const hint=document.createElement('aside');
  hint.className='leo-focused-hint';
  hint.id='leo-focused-hint';
  hint.setAttribute('role','note');
  const hintTitle=document.createElement('strong');
  hintTitle.className='leo-focused-hint-title';
  hintTitle.textContent='💡 Dica do Professor Leo';
  const hintText=document.createElement('p');
  hintText.textContent=exercise.steps;
  const hintPrompt=document.createElement('p');
  hintPrompt.className='leo-focused-hint-prompt';
  hintPrompt.textContent='Agora tente escolher a alternativa correta. Você consegue!';
  hint.append(hintTitle,hintText,hintPrompt);
  hint.hidden=true;
  const hintButton=document.createElement('button');
  hintButton.type='button';
  hintButton.textContent='💡 Preciso de uma dica';
  hintButton.setAttribute('aria-expanded','false');
  hintButton.setAttribute('aria-controls','leo-focused-hint');
  hintButton.addEventListener('click',()=>{
    hint.hidden=false;
    hintButton.hidden=true;
    hintButton.setAttribute('aria-expanded','true');
  });
  const question=document.createElement('p');question.className='leo-question';question.textContent=exercise.question;
  const options=document.createElement('div');options.className='leo-choices';
  const result=document.createElement('p');result.setAttribute('role','status');
  const guidance=document.createElement('div');guidance.className='leo-practice-actions';
  let attempts=0;
  function setFeedback(message,correct){
    result.textContent=message;
    result.className='leo-practice-feedback '+(correct?'leo-feedback-correct':'leo-feedback-wrong');
  }
  function lockOptions(){
    options.querySelectorAll('button').forEach(button=>button.disabled=true);
  }
  function makeAction(label,handler){
    const button=document.createElement('button');button.type='button';button.textContent=label;
    button.addEventListener('click',handler);return button;
  }
  function openLeoConversation(){
    leoInput.value='Professor Leo, estou estudando '+original.topic+'. A questão é: '+exercise.question+
      '. Minhas alternativas são: '+exercise.choices.join(', ')+
      '. Não consegui resolver. Me ajude com uma explicação simples e uma pergunta por vez, sem entregar a resposta de imediato.';
    leoShowView('chat');
    leoInput.focus({preventScroll:true});
  }
  function showHelp(){
    guidance.replaceChildren();
    guidance.append(
      makeAction('💡 Explicar mais simples',()=>{
        setFeedback('Vamos por partes! '+exercise.steps+' Agora escolha novamente a alternativa que parece correta.',false);
        if(attempts<2)options.querySelectorAll('button').forEach(button=>button.disabled=false);
      }),
      makeAction('💬 Falar com Leo',openLeoConversation),
      makeAction('📖 Ver solução completa',()=>{
        setFeedback('Solução comentada: '+exercise.explanation,false);
        lockOptions();
        guidance.replaceChildren(makeAction('💬 Tirar dúvida com Leo',openLeoConversation));
      })
    );
  }
  exercise.choices.forEach((choice,i)=>{
    const button=document.createElement('button');button.type='button';button.textContent=choice;
    button.addEventListener('click',()=>{
      if(button.disabled)return;
      if(i===exercise.correct){
        lockOptions();
        setFeedback('✓ Muito bem! '+exercise.explanation,true);
        guidance.replaceChildren(makeAction('💬 Conversar com Leo',openLeoConversation));
        return;
      }
      attempts+=1;
      if(attempts===1){
        button.disabled=true;
        setFeedback('Boa tentativa! Pense com calma e tente outra alternativa. Se precisar, use o botão de dica.',false);
        showHelp();
      }else{
        lockOptions();
        setFeedback('Você tentou novamente, e isso faz parte do aprendizado! Vamos entender o caminho.',false);
        showHelp();
      }
    });
    options.append(button);
  });
  const actions=document.createElement('div');actions.className='leo-practice-actions';
  const next=makeAction('Outro exercício direcionado',()=>{
    const missed=leoPracticeAnswers.map((answer,i)=>answer===false?i:-1).filter(i=>i>=0);
    const pool=missed.length?missed:leoPracticeQuestions.map((_,i)=>i);
    leoFocusedMathIndex=pool[(pool.indexOf(index)+1)%pool.length];
    renderLeoPractice();
  });
  const regular=makeAction('Voltar ao treino completo',()=>{leoFocusedMathIndex=null;renderLeoPractice();});
  actions.append(next,regular);
  box.append(title,intro,topic,question,hintButton,hint,options,result,guidance,actions);
  return box;
}
function renderLeoPractice(){
  leoPractice.replaceChildren();
  if(selector.value!=='0'){leoPractice.hidden=true;return;}
  leoPractice.hidden=false;
  if(leoFocusedMathIndex!==null){leoPractice.append(leoFocusedMathPanel());return;}
  const heading=document.createElement('h3');heading.textContent='🧮 Treino de Matemática';
  const count=leoPracticeAnswers.filter(x=>x!==null).length;
  const correct=leoPracticeAnswers.filter(x=>x===true).length;
  const progress=document.createElement('p');progress.className='leo-practice-progress';
  progress.textContent='Nesta rodada: '+correct+' acerto(s) em '+count+' questão(ões) respondida(s).';
  saveLeoHistory();
  const finished=count===leoPracticeQuestions.length;
  const item=leoPracticeQuestions[leoPracticeIndex];
  const question=document.createElement('p');question.className='leo-question';
  question.textContent='Questão '+(leoPracticeIndex+1)+' de '+leoPracticeQuestions.length+': '+item.question;
  const choices=document.createElement('div');choices.className='leo-choices';
  const feedback=document.createElement('p');feedback.className='leo-practice-feedback';feedback.setAttribute('role','status');
  const answered=leoPracticeAnswers[leoPracticeIndex]!==null;
  item.choices.forEach((choice,i)=>{
    const btn=document.createElement('button');btn.type='button';btn.textContent=choice;btn.disabled=answered;
    btn.addEventListener('click',()=>{
      if(leoPracticeAnswers[leoPracticeIndex]!==null)return;
      leoPracticeAnswers[leoPracticeIndex]=(i===item.correct);
      try{localStorage.setItem(leoPracticeKey,JSON.stringify({answers:leoPracticeAnswers}));}catch{}
      renderLeoPractice();
    });
    choices.append(btn);
  });
  if(answered){
    const hit=leoPracticeAnswers[leoPracticeIndex];
    feedback.classList.add(hit?'leo-feedback-correct':'leo-feedback-wrong');
    const label=document.createElement('strong');
    label.textContent=hit?'✓ VOCÊ ACERTOU! 🎉':'✗ VOCÊ ERROU! 📚';
    const detail=document.createElement('span');
    detail.textContent=(hit?' Parabéns! Excelente raciocínio. Continue assim, você está avançando rumo à aprovação! ':'Opa! Precisa prestar mais atenção! No vestibular, cada detalhe faz diferença. Vamos entender e aprender com esse erro. ')+item.explanation;
    feedback.append(label,detail);
  }
  // Ações ficam imediatamente após a correção, sem exigir rolagem até o fim do reforço.
  const controls=document.createElement('div');controls.className='leo-practice-actions';
  const next=document.createElement('button');next.type='button';next.textContent='Próxima questão →';
  next.disabled=!answered;
  next.addEventListener('click',()=>{
    leoPracticeIndex=(leoPracticeIndex+1)%leoPracticeQuestions.length;
    renderLeoPractice();
    leoPractice.querySelector('.leo-question')?.scrollIntoView({block:'nearest',behavior:'smooth'});
  });
  const restart=document.createElement('button');restart.type='button';restart.textContent='Recomeçar treino';
  restart.addEventListener('click',()=>{
    leoFocusedMathIndex=null;
    leoPractice.classList.remove('leo-recovery-mode');
    leoPracticeAnswers=Array(leoPracticeQuestions.length).fill(null);
    leoReinforcementAnswers={};
    leoChallengeResult=null;
    leoRoundRecorded=false;
    leoPracticeIndex=0;
    try{localStorage.removeItem(leoPracticeKey);}catch{}
    renderLeoPractice();
  });
  if(answered && leoPracticeAnswers[leoPracticeIndex]===false){
    const practiceMore=document.createElement('button');
    practiceMore.type='button';
    practiceMore.textContent='📘 Quero praticar mais';
    practiceMore.addEventListener('click',()=>{
      const box=leoPractice.querySelector('.leo-reinforcement');
      if(box){
        box.hidden=false;
        practiceMore.disabled=true;
        practiceMore.textContent='📘 Exercício de reforço aberto';
        box.scrollIntoView({block:'nearest',behavior:'smooth'});
      }
    });
    controls.append(practiceMore);
    const askTeacher=document.createElement('button');
    askTeacher.type='button';
    askTeacher.textContent='🎓 Professor Leo, me explique melhor';
    askTeacher.addEventListener('click',()=>{
      const input=root.querySelector('#leo-question-input');
      input.value='Errei esta questão: '+item.question+' Pode explicar passo a passo, com uma dica para eu aprender?';
      root.querySelector('.leo-ai-status').textContent='Sua dúvida está pronta. Clique em Enviar pergunta para conversar com a IA.';
      leoShowView('chat');
      input.scrollIntoView({block:'center',behavior:'smooth'});
      input.focus({preventScroll:true});
    });
    controls.append(askTeacher);
  }
  controls.append(next,restart);
  let reinforcementBox=null;
  if(answered && leoPracticeAnswers[leoPracticeIndex]===false){
    const exercise=leoReinforcement[leoPracticeIndex];
    reinforcementBox=document.createElement('section');reinforcementBox.className='leo-reinforcement';
    reinforcementBox.hidden=true;
    const title=document.createElement('h4');title.textContent='📘 Reforço imediato com o Professor Leo';
    const steps=document.createElement('p');steps.textContent='Vamos revisar juntos: '+exercise.steps;
    const prompt=document.createElement('p');prompt.className='leo-question';prompt.textContent='Agora tente uma parecida: '+exercise.question;
    const options=document.createElement('div');options.className='leo-choices';
    const result=document.createElement('p');result.setAttribute('role','status');
    const current=leoReinforcementAnswers[leoPracticeIndex];
    exercise.choices.forEach((choice,i)=>{
      const button=document.createElement('button');button.type='button';button.textContent=choice;button.disabled=current!==undefined;
      button.addEventListener('click',()=>{
        if(leoReinforcementAnswers[leoPracticeIndex]!==undefined)return;
        leoReinforcementAnswers[leoPracticeIndex]=i===exercise.correct;
        renderLeoPractice();
      });
      options.append(button);
    });
    if(current!==undefined){
      result.className=current?'leo-feedback-correct':'leo-feedback-wrong';
      result.textContent=(current?'✓ VOCÊ ACERTOU O REFORÇO! Parabéns! ':'✗ AINDA NÃO. Não desista: reveja o cálculo e pratique novamente. ')+exercise.explanation;
    }
    const note=document.createElement('small');note.textContent='Questão extra de aprendizagem: não altera a nota do treino.';
    const reinforcementActions=document.createElement('div');reinforcementActions.className='leo-reinforcement-actions';
    const continueButton=document.createElement('button');continueButton.type='button';
    continueButton.textContent='Continuar treino →';
    continueButton.addEventListener('click',()=>next.click());
    reinforcementActions.append(continueButton);
    reinforcementBox.append(title,steps,prompt,options,result,note,reinforcementActions);
    // O reforço só aparece quando o aluno escolhe praticar mais.
  }
  const report=document.createElement('section');
  report.className='leo-practice-report';
  report.setAttribute('aria-live','polite');
  if(finished){
    const title=document.createElement('h4');title.textContent='📊 Relatório desta rodada';
    const score=document.createElement('p');score.textContent=correct+' de '+leoPracticeQuestions.length+' acertos ('+Math.round(correct/leoPracticeQuestions.length*100)+'%).';
    const guidance=document.createElement('p');
    const missedIndices=leoPracticeAnswers.map((answer,index)=>answer===false?index:-1).filter(index=>index>=0);
    const recoveredIndices=leoReadMathRecoveryTopics();
    const allRecovered=missedIndices.length>0&&missedIndices.every(index=>recoveredIndices.includes(index));
    guidance.textContent=correct===leoPracticeQuestions.length?'Parabéns! Você acertou todas. Continue praticando novos desafios.':allRecovered?'🎉 Parabéns! Você recuperou todos os conteúdos desta rodada. Sua nota original permanece '+correct+' de '+leoPracticeQuestions.length+'. Avance para o próximo desafio.':'Revisão recomendada: porcentagem, especialmente cálculos com descontos, aumentos e situações do cotidiano. Releia as explicações e tente outra rodada.';
    const bar=document.createElement('div');
    bar.className='leo-score-track';bar.setAttribute('role','progressbar');
    bar.setAttribute('aria-label','Acertos nesta rodada');
    bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax','100');
    bar.setAttribute('aria-valuenow',String(Math.round(correct/leoPracticeQuestions.length*100)));
    const fill=document.createElement('div');fill.className='leo-score-fill';
    fill.style.width=Math.round(correct/leoPracticeQuestions.length*100)+'%';
    bar.append(fill);
    const missed=leoPracticeQuestions.filter((q,i)=>leoPracticeAnswers[i]===false);
    if(missed.length){
      const heading=document.createElement('strong');heading.textContent='Seu plano de reforço:';
      const list=document.createElement('ol');
      missed.forEach(q=>{const li=document.createElement('li');li.textContent=q.question+' Revise: '+q.explanation;list.append(li);});
      const tip=document.createElement('p');tip.textContent='Leia as explicações com calma e clique em Recomeçar treino para praticar novamente.';
      report.append(leoEvolutionPanel(correct,leoPracticeQuestions.length,leoReadRecoveryProgress()),title,score,bar,guidance,heading,list,tip);
      // Recuperação guiada: apenas os assuntos que o estudante errou.
      const recovery=document.createElement('section');
      recovery.className='leo-recovery';
      const start=document.createElement('button');
      start.type='button';
      start.className='leo-recovery-start';
      start.textContent='📘 Iniciar meu plano de recuperação ('+missed.length+' tópico(s))';
      const content=document.createElement('div');
      content.hidden=true;
      let recoveryStep=0;
      let recoveryCorrect=0;
      const missedIndices=leoPracticeQuestions.map((q,i)=>leoPracticeAnswers[i]===false?i:-1).filter(i=>i>=0);
      let pending=missedIndices.slice();
      let unresolved=[];
      let attempts={};
      let mastered=[];
      let currentIndex=null;
      let recoveryFinished=false;
      function showRecoveryStep(){
        content.replaceChildren();
        if(!pending.length){
          recoveryFinished=true;
          const savedProgress=leoSaveRecoveryProgress(mastered.length,missedIndices.length);
          const evolution=report.querySelector('.leo-evolution');
          if(evolution)evolution.replaceWith(leoEvolutionPanel(correct,leoPracticeQuestions.length,savedProgress));
          leoPractice.classList.remove('leo-recovery-mode');
          const heading=document.createElement('h4');
          heading.textContent=unresolved.length?'📘 Reforço concluído: continue praticando':'🎉 Conteúdos recuperados!';
          const result=document.createElement('p');
          result.textContent='Você demonstrou domínio em '+mastered.length+' de '+missedIndices.length+' tópico(s). '+(unresolved.length?'Ainda precisa revisar '+unresolved.length+' tópico(s).':'Parabéns! Você pode avançar para novos desafios.');
          content.append(heading,result);
          if(unresolved.length){
            const detail=document.createElement('p');
            detail.textContent='Para continuar estudando: '+unresolved.map(i=>leoPracticeQuestions[i].question).join(' • ');
            content.append(detail);
            const again=document.createElement('button');again.type='button';again.textContent='📖 Tentar novos exemplos dos tópicos difíceis';
            again.addEventListener('click',()=>{pending=unresolved.slice();unresolved=[];recoveryFinished=false;leoPractice.classList.add('leo-recovery-mode');showRecoveryStep();});
            content.append(again);
            const talk=document.createElement('button');talk.type='button';talk.textContent='💬 Pedir outra explicação ao Professor Leo';
            talk.addEventListener('click',()=>{leoInput.value='Professor Leo, ainda tenho dificuldade com: '+unresolved.map(i=>leoPracticeQuestions[i].question).join('; ')+'. Explique com um exemplo bem simples, passo a passo.';leoInput.focus({preventScroll:true});leoInput.scrollIntoView({block:'nearest'});});
            content.append(talk);
          }else{
            const next=document.createElement('p');next.textContent='O próximo desafio está liberado logo abaixo.';content.append(next);
          }
          const choose=document.createElement('button');choose.type='button';choose.textContent='Continuar para outros exercícios';
          choose.addEventListener('click',()=>{leoPractice.classList.remove('leo-recovery-mode');const challenge=report.querySelector('.leo-adaptive');if(challenge)challenge.scrollIntoView({block:'nearest',behavior:'smooth'});});
          content.append(choose);
          content.scrollIntoView({block:'nearest',behavior:'smooth'});
          return;
        }
        currentIndex=pending.shift();
        const index=currentIndex;
        const attempt=attempts[index]||0;
        const alternatives=leoRecoveryAlternatives[index];
        const exercise=attempt===0?leoReinforcement[index]:alternatives[(attempt-1)%alternatives.length];
        attempts[index]=attempt+1;
        const stepLabel=document.createElement('p');stepLabel.className='leo-recovery-progress';
        stepLabel.textContent='Tópico '+(mastered.length+unresolved.length+1)+' de '+missedIndices.length+' · '+(attempt?'Nova explicação':'Mini-aula')+' → Exercício → Correção';
        const lesson=document.createElement('h4');lesson.textContent='📖 '+(attempt?'Vamos tentar de outro jeito':'Mini-aula de recuperação');
        const explain=document.createElement('p');explain.textContent=exercise.steps+' Exemplo: '+(attempt?'use a ideia explicada acima para resolver a nova situação.':leoPracticeQuestions[index].explanation);
        const question=document.createElement('p');question.className='leo-question';question.textContent='Agora tente: '+exercise.question;
        const choices=document.createElement('div');choices.className='leo-choices';
        const status=document.createElement('p');status.setAttribute('role','status');
        exercise.choices.forEach((choice,i)=>{
          const btn=document.createElement('button');btn.type='button';btn.textContent=choice;
          btn.addEventListener('click',()=>{
            if(choices.dataset.answered)return;
            choices.dataset.answered='true';
            const hit=i===exercise.correct;
            if(hit){recoveryCorrect++;mastered.push(index);leoMarkMathTopicRecovered(index);}
            status.className=hit?'leo-feedback-correct':'leo-feedback-wrong';
            status.textContent=(hit?'✓ Muito bem! ':'Ainda não; vamos aprender de outro jeito. ')+exercise.explanation;
            choices.querySelectorAll('button').forEach(b=>b.disabled=true);
            if(!hit&&attempts[index]<3){
              pending.unshift(index);
            }else if(!hit){
              unresolved.push(index);
            }
            const next=document.createElement('button');next.type='button';
            next.textContent=!hit&&attempts[index]<3?'📖 Nova explicação e outra questão':pending.length?'Próximo tópico →':'Ver resultado da recuperação';
            next.addEventListener('click',showRecoveryStep);
            content.append(next);
          });
          choices.append(btn);
        });
        content.append(stepLabel,lesson,explain,question,choices,status);
      }
      start.addEventListener('click',()=>{
        content.hidden=false;start.hidden=true;
        leoPractice.classList.add('leo-recovery-mode');
        showRecoveryStep();
        content.scrollIntoView({block:'nearest',behavior:'smooth'});
      });
      recovery.append(start,content);
      report.append(recovery);
    }else{report.append(leoEvolutionPanel(correct,leoPracticeQuestions.length,null),title,score,bar,guidance);}
  }
  if(finished){
    const level=correct<=1?0:correct<=3?1:2;
    const challenge=leoChallenges[level];
    const box=document.createElement('section');box.className='leo-adaptive';
    const title=document.createElement('h4');title.textContent='🎯 Próximo desafio: nível '+challenge.level;
    const intro=document.createElement('p');intro.textContent=level===0?'Vamos fortalecer a base antes de avançar.':level===1?'Você está evoluindo! Agora pratique um problema intermediário.':'Excelente resultado! Que tal um desafio mais elaborado?';
    const prompt=document.createElement('p');prompt.className='leo-question';prompt.textContent=challenge.question;
    const options=document.createElement('div');options.className='leo-choices';
    const status=document.createElement('p');status.setAttribute('role','status');
    challenge.choices.forEach((choice,i)=>{
      const button=document.createElement('button');button.type='button';button.textContent=choice;button.disabled=leoChallengeResult!==null;
      button.addEventListener('click',()=>{if(leoChallengeResult!==null)return;leoChallengeResult=i===challenge.correct;renderLeoPractice();});
      options.append(button);
    });
    if(leoChallengeResult!==null){
      status.className='leo-practice-feedback '+(leoChallengeResult?'leo-feedback-correct':'leo-feedback-wrong');
      status.textContent=(leoChallengeResult?'✓ VOCÊ ACERTOU! Parabéns! ':'✗ VOCÊ ERROU. Vamos revisar com calma. ')+challenge.explanation;
    }
    const note=document.createElement('small');note.textContent='Desafio extra demonstrativo, sem alterar a nota da rodada.';
    box.append(title,intro,prompt,options,status,note);
    report.append(box);
  }
  const history=document.createElement('p');
  history.className='leo-practice-history';
  const totalAttempts=leoPracticeHistory.reduce((sum,x)=>sum+x.total,0);
  const totalCorrect=leoPracticeHistory.reduce((sum,x)=>sum+x.correct,0);
  history.textContent='Histórico geral: '+leoPracticeHistory.length+' rodada(s) concluída(s), '+totalCorrect+' acerto(s) em '+totalAttempts+' respostas. Salvo somente neste navegador.';
  report.append(history);
  report.append(leoLearningHistoryPanel());
  const note=document.createElement('small');note.textContent='Exercícios demonstrativos. O progresso fica salvo apenas neste navegador.';
  leoPractice.append(heading,progress,question,choices,feedback,controls);
  if(reinforcementBox)leoPractice.append(reinforcementBox);
  leoPractice.append(report,note);
}
renderLeoPractice();

const leoPtQuestions=[
 {text:'Apesar da chuva, a turma foi à biblioteca.',question:'A expressão "apesar da" indica:',choices:['Contraste','Causa','Conclusão'],correct:0,why:'Apesar de introduz uma concessão: a turma foi mesmo com chuva.'},
 {text:'Ler amplia o vocabulário, estimula a imaginação e permite conhecer outras perspectivas.',question:'Qual é a ideia principal?',choices:['Ler tem diversos benefícios','Ler é apenas memorizar palavras','Imaginação atrapalha a leitura'],correct:0,why:'O trecho apresenta três benefícios da leitura.'},
 {text:'Marina chegou à estação e viu o trem se afastando. Em seguida, consultou o próximo horário.',question:'O que se pode inferir?',choices:['Marina perdeu o trem','Marina estava dentro do trem','Marina não queria viajar'],correct:0,why:'O trem já estava partindo e ela procurou o próximo horário.'},
 {text:'A biblioteca abre às oito horas. Para mim, é o melhor lugar da cidade para estudar.',question:'Qual alternativa expressa opinião?',choices:['A biblioteca abre às oito','É o melhor lugar para estudar','A biblioteca tem horário de abertura'],correct:1,why:'Melhor lugar é uma avaliação pessoal; o horário é um fato verificável.'},
 {text:'Júlia pegou um livro emprestado e prometeu devolvê-lo na sexta-feira.',question:'O pronome em "devolvê-lo" retoma:',choices:['O livro','A sexta-feira','A promessa'],correct:0,why:'O pronome lo substitui livro, evitando repetição.'}
];
const leoPtKey='decola-vestibular:leo-portugues:v1',leoPtHistoryKey='decola-vestibular:leo-portugues-history:v1';
function leoPtRead(key,fallback){try{return JSON.parse(localStorage.getItem(key))||fallback;}catch{return fallback;}}
let leoPtAnswers=leoPtRead(leoPtKey,Array(leoPtQuestions.length).fill(null));
if(!Array.isArray(leoPtAnswers)||leoPtAnswers.length!==leoPtQuestions.length||!leoPtAnswers.every(x=>x===null||typeof x==='boolean'))leoPtAnswers=Array(leoPtQuestions.length).fill(null);
let leoPtHistory=leoPtRead(leoPtHistoryKey,[]);
if(!Array.isArray(leoPtHistory))leoPtHistory=[];
leoPtHistory=leoPtHistory.filter(x=>x&&Number.isInteger(x.correct)&&x.correct>=0&&x.correct<=leoPtQuestions.length).slice(-20);
let leoPtIndex=Math.max(0,leoPtAnswers.findIndex(x=>x===null)),leoPtRecorded=leoPtAnswers.every(x=>x!==null);
const leoPtBox=document.createElement('section');leoPtBox.className='leo-practice leo-portuguese';leoPtBox.setAttribute('aria-label','Treino de Português');leoPractice.after(leoPtBox);

const leoPtRecovery=[
 ['Concessão indica contraste: uma dificuldade não impediu a ação.','Mesmo com a chuva, Bia foi ao parque.','A expressão "mesmo com" indica:',['Contraste','Causa','Conclusão'],0,'A chuva não impediu a ida ao parque.'],
 ['A ideia principal resume todo o texto, não apenas um detalhe.','A leitura melhora o vocabulário e estimula a imaginação.','Qual é a ideia central?',['Ler traz benefícios','Ler serve só para memorizar','Ler impede a imaginação'],0,'O texto apresenta benefícios da leitura.'],
 ['Inferir é concluir a partir de pistas do texto.','João olhou o céu escuro e levou um guarda-chuva.','O que se pode inferir?',['João previu chuva','João perdeu o guarda-chuva','O céu estava ensolarado'],0,'O céu escuro sugere possibilidade de chuva.'],
 ['Fato é verificável; opinião expressa avaliação pessoal.','O museu abre às nove. É o lugar mais bonito da cidade.','Qual trecho é opinião?',['Abre às nove','É o lugar mais bonito','O museu tem horário'],1,'Mais bonito é uma avaliação subjetiva.'],
 ['Um pronome pode retomar um termo já mencionado.','Lia comprou uma caneta e a guardou na mochila.','O pronome "a" retoma:',['A caneta','A mochila','Lia'],0,'O pronome substitui caneta.']
];
// Missão diária: só conclui automaticamente após uma recuperação correta da atividade iniciada.
const leoMissionStorageKey='decola-vestibular:leo:daily-mission:v1';
function leoMissionToday(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
function leoMissionRead(){try{return JSON.parse(localStorage.getItem(leoMissionStorageKey)||'null');}catch(_error){return null;}}
function leoMissionSave(record){try{localStorage.setItem(leoMissionStorageKey,JSON.stringify(record));}catch(_error){}}
// Conquistas locais: uma missão por dia, sem penalidades por pausas.
const leoAchievementKey='decola-vestibular:leo:achievements:v1';
function leoAchievementDates(){
  try{const a=JSON.parse(localStorage.getItem(leoAchievementKey)||'[]');return Array.isArray(a)?Array.from(new Set(a.filter(d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)))).sort():[];}catch(_error){return [];}
}
function leoAchievementMark(date,completed){
  const dates=new Set(leoAchievementDates());
  if(completed)dates.add(date);else dates.delete(date);
  try{localStorage.setItem(leoAchievementKey,JSON.stringify([...dates].sort()));}catch(_error){}
}
function leoAchievementStreak(dates){
  const days=new Set(dates), today=leoMissionToday();
  const cursor=new Date(today+'T12:00:00');
  if(!days.has(today))cursor.setDate(cursor.getDate()-1);
  let streak=0;
  for(let n=0;n<3660;n++){
    const key=[cursor.getFullYear(),String(cursor.getMonth()+1).padStart(2,'0'),String(cursor.getDate()).padStart(2,'0')].join('-');
    if(!days.has(key))break;
    streak++;cursor.setDate(cursor.getDate()-1);
  }
  return streak;
}
function leoAchievementPanel(){
  const dates=leoAchievementDates(),total=dates.length,streak=leoAchievementStreak(dates);
  const box=document.createElement('section');box.className='leo-dashboard-next';
  const title=document.createElement('h4');title.textContent='🏅 Minhas conquistas e sequência de estudos';
  const stats=document.createElement('p');
  stats.textContent='📅 '+total+' dia(s) com missão concluída · 🔥 '+streak+' dia(s) na sequência atual.';
  const note=document.createElement('p');
  note.textContent='Cada dia com missão concluída conta uma vez. Fazer uma pausa não apaga suas conquistas; você pode recomeçar no seu ritmo.';
  note.style.fontSize='12px';
  box.append(title,stats,note);
  const medals=[{days:1,icon:'🌱',name:'Primeiro passo'},{days:3,icon:'🥉',name:'Explorador'},{days:7,icon:'🥈',name:'Persistente'},{days:15,icon:'🥇',name:'Dedicado'},{days:30,icon:'🏆',name:'Decolando'}];
  const grid=document.createElement('div');grid.className='leo-dashboard-grid';
  medals.forEach(m=>{
    const card=document.createElement('div');card.className='leo-dashboard-card';
    const name=document.createElement('strong');name.textContent=m.icon+' '+m.name;
    const detail=document.createElement('p');detail.textContent=total>=m.days?'✓ Conquistada!':m.days+' dia(s) de missão para conquistar';
    card.append(name,detail);grid.append(card);
  });
  box.append(grid);
  const next=medals.find(m=>total<m.days);
  const nextText=document.createElement('p');
  nextText.className='leo-calendar-next';
  nextText.textContent=next?'🎯 Próxima medalha: '+next.icon+' '+next.name+' — faltam '+(next.days-total)+' dia(s) de missão concluída.':'🏆 Todas as medalhas conquistadas! Continue no seu ritmo.';
  box.append(nextText);
  const calendar=document.createElement('div');
  calendar.className='leo-calendar';
  calendar.setAttribute('aria-label','Calendário de missões concluídas');
  const controls=document.createElement('div');controls.className='leo-calendar-controls';
  const prev=document.createElement('button');prev.type='button';prev.textContent='‹';prev.setAttribute('aria-label','Mês anterior');
  const monthLabel=document.createElement('strong');monthLabel.setAttribute('aria-live','polite');
  const following=document.createElement('button');following.type='button';following.textContent='›';following.setAttribute('aria-label','Próximo mês');
  controls.append(prev,monthLabel,following);
  const weekdays=document.createElement('div');weekdays.className='leo-calendar-weekdays';
  ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].forEach(day=>{const label=document.createElement('span');label.textContent=day;weekdays.append(label);});
  const monthlySummary=document.createElement('div');
  monthlySummary.className='leo-calendar-summary';
  monthlySummary.setAttribute('aria-live','polite');
  const daysGrid=document.createElement('div');daysGrid.className='leo-calendar-days';
  const legend=document.createElement('p');legend.className='leo-calendar-legend';legend.textContent='● Missão concluída  ·  Hoje destacado  ·  Sem punição por pausas';
  calendar.append(controls,monthlySummary,weekdays,daysGrid,legend);box.append(calendar);
  const now=new Date();const currentMonth=new Date(now.getFullYear(),now.getMonth(),1);
  let visibleMonth=new Date(currentMonth.getFullYear(),currentMonth.getMonth(),1);
  const completedDays=new Set(dates);
  function drawCalendar(){
    monthLabel.textContent=visibleMonth.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
    following.disabled=visibleMonth.getFullYear()===currentMonth.getFullYear()&&visibleMonth.getMonth()===currentMonth.getMonth();
    daysGrid.replaceChildren();
    const year=visibleMonth.getFullYear(),month=visibleMonth.getMonth();
    const prefix=year+'-'+String(month+1).padStart(2,'0')+'-';
    const monthlyCount=dates.filter(date=>date.startsWith(prefix)).length;
    const isCurrent=year===now.getFullYear()&&month===now.getMonth();
    const elapsed=isCurrent?now.getDate():new Date(year,month+1,0).getDate();
    const rate=elapsed?Math.round(monthlyCount/elapsed*100):0;
    monthlySummary.replaceChildren();
    const values=[
      ['📅 Missões no mês',monthlyCount+' dia(s)'],
      ['📈 Frequência',rate+'% dos '+elapsed+' dia(s) transcorridos'],
      ['🏅 Próxima medalha',next?(next.days-total)+' dia(s) para '+next.name:'Todas conquistadas']
    ];
    values.forEach(([label,value])=>{
      const item=document.createElement('div');item.className='leo-calendar-stat';
      const heading=document.createElement('span');heading.textContent=label;
      const amount=document.createElement('strong');amount.textContent=value;
      item.append(heading,amount);monthlySummary.append(item);
    });
    const offset=new Date(year,month,1).getDay();
    for(let i=0;i<offset;i++){const empty=document.createElement('span');empty.className='leo-calendar-empty';empty.setAttribute('aria-hidden','true');daysGrid.append(empty);}
    const count=new Date(year,month+1,0).getDate();
    for(let day=1;day<=count;day++){
      const dateKey=[year,String(month+1).padStart(2,'0'),String(day).padStart(2,'0')].join('-');
      const cell=document.createElement('span');cell.className='leo-calendar-day';
      cell.textContent=String(day);
      const complete=completedDays.has(dateKey);
      if(complete)cell.classList.add('leo-calendar-done');
      if(dateKey===leoMissionToday())cell.classList.add('leo-calendar-today');
      cell.setAttribute('aria-label',day+' de '+monthLabel.textContent+(complete?', missão concluída':', sem missão registrada'));
      cell.title=dateKey+': '+(complete?'missão concluída':'sem missão registrada');
      daysGrid.append(cell);
    }
  }
  prev.addEventListener('click',()=>{visibleMonth=new Date(visibleMonth.getFullYear(),visibleMonth.getMonth()-1,1);drawCalendar();});
  following.addEventListener('click',()=>{if(!following.disabled){visibleMonth=new Date(visibleMonth.getFullYear(),visibleMonth.getMonth()+1,1);drawCalendar();}});
  drawCalendar();
  return box;
}
function leoMissionRecoverySucceeded(view,index){
  const record=leoMissionRead();
  if(!record||record.date!==leoMissionToday()||!record.started||record.completed||record.view!==view||record.index!==index)return;
  leoMissionSave({...record,completed:true,automatic:true,completedAt:new Date().toISOString()});
  leoAchievementMark(record.date,true);
  const host=view==='portuguese'?leoPtBox:view==='humanas'?leoHuBox:leoPractice;
  const notice=document.createElement('p');
  notice.className='leo-practice-feedback leo-feedback-correct';
  notice.setAttribute('role','status');
  notice.textContent='🎉 Missão do dia concluída! Você superou uma dificuldade e deu mais um passo rumo à sua aprovação!';
  host.prepend(notice);
}

const leoPtRecoveryKey='decola-vestibular:leo-portugues-recovery:v1';
let leoPtRecoveryDone=leoPtRead(leoPtRecoveryKey,{});
if(!leoPtRecoveryDone||typeof leoPtRecoveryDone!=='object'||Array.isArray(leoPtRecoveryDone))leoPtRecoveryDone={};
function leoPtSaveRecovery(){try{localStorage.setItem(leoPtRecoveryKey,JSON.stringify(leoPtRecoveryDone));}catch{}}

// Dicas progressivas e acessíveis, sem antecipar a alternativa correta.
// Dicas vinculadas à questão, sem revelar a alternativa correta.
const leoSpecificHints={
 portuguese:[
  ['Observe a expressão "apesar da chuva": a chuva dificultaria a ida à biblioteca, mas a turma foi mesmo assim. Que relação existe entre as duas ideias?','Compare a ação esperada em um dia chuvoso com o que realmente aconteceu. Uma dificuldade impediu a ação ou foi superada?'],
  ['O trecho cita vocabulário, imaginação e novas perspectivas. Procure a alternativa que reúne todas essas ideias, não apenas uma.','Uma ideia principal abrange o texto inteiro. Qual opção resume os três efeitos positivos apresentados?'],
  ['Marina viu o trem se afastando e consultou o próximo horário. Que situação essas duas pistas sugerem?','Use apenas as pistas da narrativa. Por que alguém procuraria o horário de outro trem?'],
  ['Uma frase informa um horário verificável; a outra faz uma avaliação pessoal. Identifique qual depende do gosto de alguém.','Pergunte: isso pode ser conferido objetivamente ou duas pessoas poderiam discordar sem que uma esteja mentindo?'],
  ['Leia "pegou um livro emprestado e prometeu devolvê-lo". O que Júlia poderia devolver nessa frase?','Substitua "lo" pelo nome de cada alternativa e veja qual mantém o sentido original.']
 ],
 humanas:[
  ['A Constituição de 1988 marcou a redemocratização do Brasil. Pense no que uma constituição voltada à cidadania deve garantir às pessoas.','Compare as alternativas: uma constituição democrática costuma ampliar ou reduzir direitos e participação?'],
  ['Participação direta significa que os cidadãos se manifestam sobre uma decisão política, e não apenas escolhem representantes.','Procure o mecanismo em que a população é consultada diretamente sobre uma questão pública.'],
  ['Pense em grupos organizados que defendem causas coletivas, como moradia, educação ou igualdade. Qual é o papel deles no debate democrático?','Movimentos sociais costumam ampliar a discussão pública e reivindicar mudanças ou impedir a participação?'],
  ['Imagine uma cidade que cresce rapidamente, mas não amplia transporte, saneamento e moradia na mesma velocidade. O que pode acontecer?','Compare o acesso aos serviços entre bairros bem atendidos e periferias. O crescimento garante igualdade automaticamente?'],
  ['A Lei Áurea encerrou juridicamente a escravidão em 1888. Reflita se uma mudança na lei resolve, sozinha, desigualdades acumuladas por séculos.','Diferencie o fim legal da escravidão da garantia concreta de trabalho, terra, educação e inclusão social.']
 ]
};
function leoStudyHint(subject,stage,questionIndex){
 const generic={
  portuguese:['Procure as pistas no trecho e compare as alternativas sem acrescentar informações ao texto.','Leia novamente e identifique a relação entre as ideias antes de escolher.'],
  humanas:['Identifique o tema histórico ou social e compare as alternativas com o conceito estudado.','Descarte as alternativas que contradizem os direitos ou o contexto histórico da questão.']
 };
 const index=Number.isInteger(questionIndex)?questionIndex:-1;
 const specific=leoSpecificHints[subject]&&leoSpecificHints[subject][index];
 const hints=specific||generic[subject]||generic.portuguese;
 const box=document.createElement('div');box.className='leo-study-hint';
 const button=document.createElement('button');button.type='button';button.className='leo-study-hint-button';
 button.textContent=stage===2?'💡 Rever dica do Professor Leo':'💡 Preciso de uma dica';button.setAttribute('aria-expanded','false');
 const panel=document.createElement('aside');panel.className='leo-focused-hint';panel.hidden=true;panel.setAttribute('role','note');
 const title=document.createElement('strong');title.className='leo-focused-hint-title';title.textContent='💡 Dica do Professor Leo';
 const description=document.createElement('p');description.textContent=hints[stage===1?1:0];
 const encouragement=document.createElement('p');encouragement.className='leo-focused-hint-prompt';encouragement.textContent='Pense nas pistas e tente responder com calma. Você consegue!';
 panel.append(title,description,encouragement);
 button.addEventListener('click',()=>{panel.hidden=false;button.hidden=true;button.setAttribute('aria-expanded','true');});
 box.append(button,panel);return box;
}
function leoRecoveryLesson(subject,index){
 const lessons={
  portuguese:[
   'Exemplo: “Embora estivesse chovendo, fomos à escola”. A chuva é um obstáculo, mas a ação aconteceu.',
   'Exemplo: em um texto sobre leitura, procure a mensagem que reúne todas as ideias, não um detalhe isolado.',
   'Exemplo: “João pegou o guarda-chuva porque viu nuvens escuras”. Podemos inferir que ele esperava chuva.',
   'Exemplo: “A escola abriu às 7h” é verificável; “A escola é maravilhosa” expressa opinião.',
   'Exemplo: em “Maria chegou e ela sorriu”, o pronome “ela” retoma Maria.'
  ],
  humanas:[
   'Exemplo: uma constituição cidadã protege a liberdade de expressão, o voto e o acesso a direitos sociais.',
   'Exemplo: no plebiscito, a população vota diretamente sobre uma proposta antes da decisão política.',
   'Exemplo: moradores que se organizam para pedir transporte melhor exercem participação coletiva.',
   'Exemplo: dois bairros com acesso muito diferente a saneamento mostram desigualdade urbana.',
   'Exemplo: abolir uma lei injusta não elimina automaticamente a desigualdade acumulada ao longo da história.'
  ]
 };
 return (lessons[subject]||[])[index]||'Pense em uma situação do cotidiano em que esse conceito aparece.';
}
function leoRecoverySteps(parent,subject,index,reason){
 const step=document.createElement('p');step.textContent='1. Entenda o conceito: '+reason;
 const example=document.createElement('p');example.textContent='2. Veja um exemplo: '+leoRecoveryLesson(subject,index);
 const tryAgain=document.createElement('p');tryAgain.textContent='3. Agora tente uma nova questão. Você pode consultar a dica antes de responder.';
 parent.append(step,example,tryAgain);
}
function leoPtRecoveryPanel(index){
 const [lesson,passage,question,answers,correct,why]=leoPtRecovery[index];
 const box=document.createElement('section');box.className='leo-portuguese-recovery';
 const heading=document.createElement('h4');heading.textContent='📚 Recuperação personalizada';box.append(heading);
 leoRecoverySteps(box,'portuguese',index,lesson);
 const excerpt=document.createElement('blockquote');excerpt.className='leo-portuguese-passage';excerpt.textContent=passage;box.append(excerpt);
 const prompt=document.createElement('p');prompt.textContent='Nova questão: '+question;box.append(prompt);box.append(leoStudyHint('portuguese',1,index));
 const choices=document.createElement('div');choices.className='leo-choices leo-portuguese-choices';box.append(choices);
 const feedback=document.createElement('p');feedback.setAttribute('role','status');box.append(feedback);
 function renderChoices(){
  choices.replaceChildren();
  answers.forEach((answer,i)=>{
   const button=document.createElement('button');button.type='button';button.textContent=String.fromCharCode(65+i)+') '+answer;
   button.disabled=leoPtRecoveryDone[index]===true;
   button.addEventListener('click',()=>{
    if(leoPtRecoveryDone[index])return;
    if(i===correct){leoPtRecoveryDone[index]=true;leoPtSaveRecovery();leoMissionRecoverySucceeded('portuguese',index);feedback.className='leo-practice-feedback leo-feedback-correct';feedback.textContent='🏅 Parabéns! Você recuperou este conteúdo! '+why+' Sua nota original foi preservada.';}
    else{feedback.className='leo-practice-feedback leo-feedback-wrong';feedback.textContent='Ainda não foi dessa vez. Releia o exemplo e tente novamente: '+lesson;}
    renderChoices();
   });choices.append(button);
  });
 }
 if(leoPtRecoveryDone[index]){feedback.className='leo-practice-feedback leo-feedback-correct';feedback.textContent='✓ Conteúdo recuperado! '+why;}
 renderChoices();return box;
}

function leoPtRender(){
 leoPtBox.replaceChildren();
 const h=document.createElement('h3');h.textContent='📖 Português e Interpretação de Texto';leoPtBox.append(h);
 const count=leoPtAnswers.filter(x=>x!==null).length,score=leoPtAnswers.filter(Boolean).length,q=leoPtQuestions[leoPtIndex],answered=leoPtAnswers[leoPtIndex]!==null;
 const progress=document.createElement('p');progress.className='leo-practice-progress';progress.textContent='Rodada: '+count+' de '+leoPtQuestions.length+' questões respondidas.';leoPtBox.append(progress);
 const passage=document.createElement('blockquote');passage.className='leo-portuguese-passage';passage.textContent=q.text;
 const title=document.createElement('p');title.className='leo-question';title.textContent='Questão '+(leoPtIndex+1)+': '+q.question;
 const options=document.createElement('div');options.className='leo-choices leo-portuguese-choices';
 q.choices.forEach((choice,i)=>{const b=document.createElement('button');b.type='button';b.textContent=String.fromCharCode(65+i)+') '+choice;b.disabled=answered;b.addEventListener('click',()=>{
  if(leoPtAnswers[leoPtIndex]!==null)return;
  leoPtAnswers[leoPtIndex]=i===q.correct;
  try{localStorage.setItem(leoPtKey,JSON.stringify(leoPtAnswers));}catch{}
  if(leoPtAnswers.every(x=>x!==null)&&!leoPtRecorded){leoPtRecorded=true;leoPtHistory.push({correct:leoPtAnswers.filter(Boolean).length,total:leoPtQuestions.length,date:new Date().toISOString()});leoPtHistory=leoPtHistory.slice(-20);try{localStorage.setItem(leoPtHistoryKey,JSON.stringify(leoPtHistory));}catch{}}
  leoPtRender();
 });options.append(b);});
 leoPtBox.append(passage,title);leoPtBox.append(leoStudyHint('portuguese',answered?2:0,leoPtIndex));leoPtBox.append(options);
 if(answered){const feedback=document.createElement('p');feedback.className='leo-practice-feedback '+(leoPtAnswers[leoPtIndex]?'leo-feedback-correct':'leo-feedback-wrong');feedback.setAttribute('role','status');feedback.textContent=(leoPtAnswers[leoPtIndex]?'✓ Você acertou! ':'Vamos revisar. ')+q.why;leoPtBox.append(feedback);}
 if(answered&&!leoPtAnswers[leoPtIndex])leoPtBox.append(leoPtRecoveryPanel(leoPtIndex));
 const actions=document.createElement('div');actions.className='leo-practice-actions';
 if(answered){const next=document.createElement('button');next.type='button';next.textContent='Próxima questão →';next.addEventListener('click',()=>{leoPtIndex=(leoPtIndex+1)%leoPtQuestions.length;leoPtRender();leoBody.scrollTop=0;});actions.append(next);
 const help=document.createElement('button');help.type='button';help.textContent='💬 Peça ajuda ao Leo';help.addEventListener('click',()=>{leoReturnView='portuguese';leoShowView('chat');leoInput.value='Professor Leo, explique esta questão de interpretação: '+q.text+' Pergunta: '+q.question+' Resposta correta: '+q.choices[q.correct]+'.';leoInput.focus({preventScroll:true});});actions.append(help);}
 const restart=document.createElement('button');restart.type='button';restart.textContent='Recomeçar treino';restart.addEventListener('click',()=>{leoPtAnswers=Array(leoPtQuestions.length).fill(null);leoPtIndex=0;leoPtRecorded=false;leoPtRecoveryDone={};try{localStorage.removeItem(leoPtRecoveryKey);localStorage.removeItem(leoPtKey);}catch{}leoPtRender();});actions.append(restart);leoPtBox.append(actions);
 if(count===leoPtQuestions.length){const result=document.createElement('h4');result.textContent='📊 Resultado: '+score+' de '+leoPtQuestions.length+' acertos ('+Math.round(score/leoPtQuestions.length*100)+'%)';leoPtBox.append(result);}
 const history=document.createElement('div');history.className='leo-portuguese-history';const hh=document.createElement('h4');hh.textContent='📈 Histórico de Português';history.append(hh);
 if(!leoPtHistory.length){const p=document.createElement('p');p.textContent='Conclua a rodada para começar seu histórico.';history.append(p);}
 else{const bars=document.createElement('div');bars.className='leo-portuguese-bars';leoPtHistory.forEach((x,i)=>{const item=document.createElement('div');item.className='leo-portuguese-bar-item';const pct=Math.round(x.correct/x.total*100);const top=document.createElement('span');top.textContent=pct+'%';const track=document.createElement('div');track.className='leo-portuguese-bar-track';const fill=document.createElement('div');fill.className='leo-portuguese-bar-fill';fill.style.height=pct+'%';track.append(fill);const bottom=document.createElement('small');bottom.textContent=String(i+1);item.append(top,track,bottom);bars.append(item);});history.append(bars);}
 const note=document.createElement('small');note.textContent='Resultados demonstrativos salvos neste navegador, separados dos resultados de Matemática.';history.append(note);leoPtBox.append(history);
}
leoPtRender();

// Ciências Humanas — exercícios demonstrativos, correção, reforço e histórico local.
const leoHuQuestions=[
 {text:'A Constituição Federal de 1988 é conhecida como Constituição Cidadã porque:',choices:['Ampliou direitos e garantias fundamentais','Eliminou a participação popular','Restringiu o direito ao voto'],correct:0,why:'A Constituição de 1988 consolidou direitos civis, políticos e sociais e fortaleceu a democracia.'},
 {text:'Qual é uma forma de participação direta da população nas decisões políticas?',choices:['Plebiscito','Censura à imprensa','Suspensão de eleições'],correct:0,why:'O plebiscito consulta os cidadãos sobre uma questão política antes de uma decisão.'},
 {text:'Os movimentos sociais contribuem para a democracia principalmente ao:',choices:['Reivindicar direitos e ampliar o debate público','Impedir toda forma de diálogo','Substituir permanentemente as instituições'],correct:0,why:'Movimentos sociais organizam demandas coletivas e pressionam por reconhecimento e políticas públicas.'},
 {text:'A urbanização acelerada, sem infraestrutura suficiente, pode provocar:',choices:['Segregação socioespacial e problemas de mobilidade','Distribuição igualitária automática dos serviços','Desaparecimento das periferias'],correct:0,why:'O crescimento urbano desigual pode concentrar serviços em certas áreas e dificultar acesso a transporte e moradia.'},
 {text:'No Brasil, a abolição da escravidão ocorreu em 1888. Qual afirmação é historicamente adequada?',choices:['A abolição não eliminou imediatamente as desigualdades sociais','Todos os ex-escravizados receberam terras e renda','O racismo deixou de existir com a Lei Áurea'],correct:0,why:'A Lei Áurea extinguiu juridicamente a escravidão, mas não garantiu reparação, terras ou inclusão social.'}
];
// Questões equivalentes, mas diferentes das originais, para verificar a aprendizagem.
const leoHuReview=[
 {text:'Qual característica da Constituição de 1988 fortaleceu a cidadania?',choices:['Proibição da organização social','Proteção de direitos fundamentais','Fim das eleições diretas'],correct:1,why:'A Constituição de 1988 ampliou a proteção dos direitos e a participação democrática.'},
 {text:'Antes de decidir sobre uma proposta importante, o governo consulta os eleitores diretamente. Esse mecanismo é:',choices:['Censura','Intervenção militar','Plebiscito'],correct:2,why:'No plebiscito, a população é consultada antes da decisão política.'},
 {text:'Um grupo de moradores se organiza para reivindicar transporte público melhor. Isso é exemplo de:',choices:['Mobilização social','Proibição de direitos','Isolamento político'],correct:0,why:'A mobilização coletiva reivindica melhorias e participa do debate público.'},
 {text:'Quando bairros periféricos têm pouco transporte e saneamento, isso evidencia:',choices:['Acesso igual a serviços','Desigualdade socioespacial','Fim da urbanização'],correct:1,why:'A distribuição desigual de infraestrutura e serviços caracteriza desigualdade socioespacial.'},
 {text:'Após a Lei Áurea, qual desafio permaneceu para a população negra no Brasil?',choices:['A inclusão social e o enfrentamento do racismo','O retorno legal da escravidão','A distribuição imediata de terras para todos'],correct:0,why:'A abolição legal não assegurou condições iguais de trabalho, renda e acesso à terra.'}
];
const leoHuKey='decola-vestibular:leo-humanas:v1';
const leoHuHistoryKey='decola-vestibular:leo-humanas-history:v1';
let leoHuAnswers=leoPtRead(leoHuKey,Array(leoHuQuestions.length).fill(null));
if(!Array.isArray(leoHuAnswers)||leoHuAnswers.length!==leoHuQuestions.length||!leoHuAnswers.every(x=>x===null||typeof x==='boolean'))leoHuAnswers=Array(leoHuQuestions.length).fill(null);
let leoHuHistory=leoPtRead(leoHuHistoryKey,[]);
if(!Array.isArray(leoHuHistory))leoHuHistory=[];
leoHuHistory=leoHuHistory.filter(x=>x&&Number.isInteger(x.correct)&&x.correct>=0&&x.correct<=leoHuQuestions.length&&x.total===leoHuQuestions.length).slice(-20);
let leoHuIndex=Math.max(0,leoHuAnswers.findIndex(x=>x===null));
let leoHuRecorded=leoHuAnswers.every(x=>x!==null);
const leoHuRecoveryKey='decola-vestibular:leo-humanas-recovery:v1';
let leoHuRecovery=leoPtRead(leoHuRecoveryKey,{});
if(!leoHuRecovery||typeof leoHuRecovery!=='object'||Array.isArray(leoHuRecovery))leoHuRecovery={};
function leoHuSaveRecovery(){try{localStorage.setItem(leoHuRecoveryKey,JSON.stringify(leoHuRecovery));}catch{}}
const leoHuBox=document.createElement('section');
leoHuBox.className='leo-practice leo-humanas';
leoHuBox.setAttribute('aria-label','Treino de Ciências Humanas');
leoPtBox.after(leoHuBox);
function leoHuRender(){
  leoHuBox.replaceChildren();
  const heading=document.createElement('h3');heading.textContent='🌎 Ciências Humanas e suas Tecnologias';
  const count=leoHuAnswers.filter(x=>x!==null).length;
  const score=leoHuAnswers.filter(x=>x===true).length;
  const summary=document.createElement('p');summary.textContent='Rodada: '+count+' de '+leoHuQuestions.length+' questões respondidas · '+score+' acerto(s).';
  leoHuBox.append(heading,summary);
  const q=leoHuQuestions[leoHuIndex];
  const question=document.createElement('p');question.textContent='Questão '+(leoHuIndex+1)+' de '+leoHuQuestions.length+': '+q.text;
  question.style.fontWeight='600';leoHuBox.append(question);leoHuBox.append(leoStudyHint('humanas',leoHuAnswers[leoHuIndex]===null?0:2,leoHuIndex));
  const choices=document.createElement('div');choices.className='leo-choices leo-humanas-choices';
  q.choices.forEach((option,i)=>{
    const button=document.createElement('button');button.type='button';
    button.textContent=String.fromCharCode(65+i)+') '+option;
    button.disabled=leoHuAnswers[leoHuIndex]!==null;
    button.addEventListener('click',()=>{
      if(leoHuAnswers[leoHuIndex]!==null)return;
      leoHuAnswers[leoHuIndex]=i===q.correct;
      try{localStorage.setItem(leoHuKey,JSON.stringify(leoHuAnswers));}catch(_error){}
      if(leoHuAnswers.every(x=>x!==null)&&!leoHuRecorded){
        leoHuHistory.push({correct:leoHuAnswers.filter(Boolean).length,total:leoHuQuestions.length});
        leoHuHistory=leoHuHistory.slice(-20);
        try{localStorage.setItem(leoHuHistoryKey,JSON.stringify(leoHuHistory));}catch(_error){}
        leoHuRecorded=true;
      }
      leoHuRender();
    });choices.append(button);
  });leoHuBox.append(choices);
  const answered=leoHuAnswers[leoHuIndex]!==null;
  if(answered){
    const feedback=document.createElement('div');
    feedback.className='leo-practice-feedback '+(leoHuAnswers[leoHuIndex]?'leo-feedback-correct':'leo-feedback-wrong');
    feedback.textContent=(leoHuAnswers[leoHuIndex]?'✓ Muito bem! ':'Vamos revisar. ')+q.why;
    leoHuBox.append(feedback);
    if(!leoHuAnswers[leoHuIndex]){
      const help=document.createElement('section');help.className='leo-reinforcement';
      const title=document.createElement('h4');title.textContent='📚 Recuperação personalizada';
      const explain=document.createElement('div');leoRecoverySteps(explain,'humanas',leoHuIndex,q.why);
      const review=leoHuReview[leoHuIndex];
      const retry=document.createElement('p');retry.textContent='Agora aplique o que aprendeu em outra situação: '+review.text;
      const opts=document.createElement('div');opts.className='leo-choices leo-humanas-choices';
      review.choices.forEach((option,i)=>{
        const btn=document.createElement('button');btn.type='button';btn.textContent=String.fromCharCode(65+i)+') '+option;
        btn.disabled=leoHuRecovery[leoHuIndex]===true;
        btn.addEventListener('click',()=>{
          if(leoHuRecovery[leoHuIndex])return;
          if(i===review.correct){leoHuRecovery[leoHuIndex]=true;leoHuSaveRecovery();leoHuRender();leoMissionRecoverySucceeded('humanas',leoHuIndex);}
          else{const msg=help.querySelector('.leo-humanas-hint');if(msg)msg.textContent='Ainda não foi dessa vez. Volte ao exemplo e tente outra vez. '+review.why;}
        });opts.append(btn);
      });
      const hint=document.createElement('p');hint.className='leo-humanas-hint';
      if(leoHuRecovery[leoHuIndex])hint.textContent='🏅 Parabéns! Você recuperou este conteúdo! '+review.why+' Sua nota original foi preservada.';
      help.append(title,explain,retry,leoStudyHint('humanas',1),opts,hint);leoHuBox.append(help);
    }
    const actions=document.createElement('div');actions.className='leo-choices leo-humanas-choices';
    const next=document.createElement('button');next.type='button';next.textContent='Próxima questão →';
    next.addEventListener('click',()=>{leoHuIndex=(leoHuIndex+1)%leoHuQuestions.length;leoHuRender();});
    const restart=document.createElement('button');restart.type='button';restart.textContent='Recomeçar treino';
    restart.addEventListener('click',()=>{leoHuAnswers=Array(leoHuQuestions.length).fill(null);leoHuIndex=0;leoHuRecorded=false;leoHuRecovery={};try{localStorage.removeItem(leoHuRecoveryKey);localStorage.setItem(leoHuKey,JSON.stringify(leoHuAnswers));}catch(_error){}leoHuRender();});
    const ask=document.createElement('button');ask.type='button';ask.textContent='💬 Peça ajuda ao Leo';
    ask.addEventListener('click',()=>{leoReturnView='humanas';leoShowView('chat');const input=root.querySelector('#leo-question-input');if(input){input.value='Professor Leo, explique de forma simples esta questão de Ciências Humanas: '+q.text+' '+q.why;input.focus();}});
    actions.append(next,ask,restart);leoHuBox.append(actions);
  }
  if(count===leoHuQuestions.length){
    const result=document.createElement('h4');result.textContent='📊 Resultado: '+score+' de '+leoHuQuestions.length+' acertos ('+Math.round(score/leoHuQuestions.length*100)+'%)';leoHuBox.append(result);
  }
  const history=document.createElement('section');history.className='leo-reinforcement';
  const title=document.createElement('h4');title.textContent='📈 Histórico de Ciências Humanas';history.append(title);
  const detail=document.createElement('p');detail.textContent=leoHuHistory.length?leoHuHistory.length+' rodada(s) registrada(s). Última: '+leoHuHistory[leoHuHistory.length-1].correct+' de '+leoHuQuestions.length+' acertos.':'Conclua a rodada para registrar seu primeiro resultado.';
  history.append(detail);leoHuBox.append(history);
}
leoHuRender();

// Painel consolidado: lê somente os resultados locais já existentes, sem alterar notas.
const leoDashboard=document.createElement('section');
leoDashboard.className='leo-dashboard';
leoDashboard.setAttribute('aria-label','Meu painel de evolução');
leoPtBox.after(leoDashboard);
// Plano inteligente: recomendações calculadas a partir dos dados locais já existentes.
function leoRenderSmartPlan(parent){
 const section=document.createElement('section');
 section.className='leo-dashboard-next leo-smart-plan';
 const title=document.createElement('h4');title.textContent='🧭 Meu plano de estudos inteligente';
 const intro=document.createElement('p');intro.textContent='Uma sequência sugerida com base nos erros, nas revisões e no desempenho. Estude no seu ritmo: as atividades não alteram suas notas anteriores.';
 section.append(title,intro);
 const tasks=[];
 if(leoMockState.finished){
  leoMockQuestions.forEach((q,i)=>{
   if(leoMockState.answers[i]===q.correct)return;
   const done=leoMasteryStage(i);
   if(done<3)tasks.push({priority:1,subject:q.area,heading:'Recuperar '+q.topic,detail:'Domínio progressivo: '+done+' de 3 desafios concluídos.',action:'Continuar recuperação',run:()=>{leoMockRecoveryOpen=i;leoShowView('simulado');const target=leoMockBox.querySelector('[data-leo-recovery-target="'+i+'"]');if(target){target.scrollIntoView({block:'start',behavior:'auto'});target.focus({preventScroll:true});}}});
   else{
    const record=leoSpacedRecord(i);
    const attempts=record.attempts.filter(a=>a&&a.correct===true).length;
    if(attempts>=3)return;
    const due=record.masteredAt+[1,3,7][attempts]*86400000;
    tasks.push({priority:Date.now()>=due?0:4,subject:q.area,heading:'Revisar '+q.topic,detail:Date.now()>=due?'Revisão espaçada disponível agora.':'Próxima revisão: '+leoSpacedDate(due)+'.',action:Date.now()>=due?'Fazer revisão':'Ver revisão',run:()=>leoShowView('dashboard')});
   }
  });
 }
 const subjects=[
  {name:'Matemática',view:'practice',history:leoPracticeHistory},
  {name:'Português',view:'portuguese',history:leoPtHistory},
  {name:'Ciências Humanas',view:'humanas',history:leoHuHistory}
 ];
 subjects.forEach(area=>{
  const last=area.history.length?area.history[area.history.length-1]:null;
  const pct=last&&last.total>0?Math.round(last.correct/last.total*100):null;
  tasks.push({priority:pct===null?3:pct<70?2:5,subject:area.name,heading:pct===null?'Iniciar treino de '+area.name:pct<70?'Reforçar '+area.name:'Manter prática de '+area.name,detail:pct===null?'Ainda não há uma rodada concluída.':'Última rodada: '+pct+'% de acertos. Referência de estudo: 70%.',action:'Estudar agora',run:()=>leoShowView(area.view)});
 });
 if(!leoMockState.finished)tasks.push({priority:2,subject:'ENEM',heading:'Fazer simulado diagnóstico',detail:'Descubra quais conteúdos precisam de atenção.',action:'Começar simulado',run:()=>leoShowView('simulado')});
 tasks.sort((a,b)=>a.priority-b.priority);
 // Celebra a recuperação integral do simulado sem alterar a pontuação original.
 if(leoMockState.finished){
  const missed=leoMockQuestions.map((q,i)=>({q,i})).filter(item=>leoMockState.answers[item.i]!==item.q.correct);
  const mastered=missed.filter(item=>leoMasteryStage(item.i)>=3);
  if(missed.length>0&&mastered.length===missed.length){
   const celebration=document.createElement('section');
   celebration.className='leo-dashboard-card leo-mastery-celebration';
   celebration.setAttribute('aria-label','Parabéns pelas recuperações concluídas');
   const headline=document.createElement('h4');headline.textContent='🏆 Parabéns! Todas as recuperações concluídas!';
   const summary=document.createElement('p');
   summary.textContent='Você transformou '+mastered.length+' erro(s) do simulado em '+mastered.length+' conteúdo(s) dominado(s), concluindo os três desafios de cada um. Seu esforço está fazendo diferença!';
   const topics=document.createElement('p');topics.textContent='Suas conquistas: '+mastered.map(item=>item.q.topic).join(' · ')+'.';
   const reassurance=document.createElement('p');reassurance.textContent='A pontuação original do simulado não mudou. As revisões espaçadas continuam disponíveis para fortalecer o aprendizado.';
   celebration.append(headline,summary,topics,reassurance);
   const nextTask=tasks.find(task=>task.priority<=3)||tasks[0];
   if(nextTask){
    const next=document.createElement('p');next.textContent='🎯 Sua próxima meta: '+nextTask.heading+'. Reserve de 15 a 25 minutos no seu ritmo.';
    const action=document.createElement('button');action.type='button';action.textContent='🚀 '+nextTask.action;action.addEventListener('click',nextTask.run);
    celebration.append(next,action);
   }
   section.append(celebration);
  }
 }
 const top=tasks.slice(0,4);
 const list=document.createElement('div');list.className='leo-dashboard-grid';
 top.forEach((task,i)=>{
  const card=document.createElement('article');card.className='leo-dashboard-card';
  const h=document.createElement('h4');h.textContent=(i===0?'🎯 Próximo passo: ':'')+task.heading;
  const subject=document.createElement('p');subject.textContent=task.subject+' · Sugestão de 15 a 25 minutos';
  const detail=document.createElement('p');detail.textContent=task.detail;
  const button=document.createElement('button');button.type='button';button.textContent=task.action;button.addEventListener('click',task.run);
  card.append(h,subject,detail,button);list.append(card);
 });
 section.append(list);
 const note=document.createElement('p');note.textContent='As sugestões são recalculadas ao abrir este painel, usando somente os dados guardados neste navegador. Não são uma previsão de nota no ENEM.';
 section.append(note);parent.append(section);
}
let leoDashboardActiveTab='plano';
function leoRenderDashboard(){
  leoDashboard.replaceChildren();
  const heading=document.createElement('h3');heading.textContent='📊 Meu painel de evolução';
  const intro=document.createElement('p');intro.textContent='Acompanhe Matemática, Português e Ciências Humanas no mesmo lugar. Dados demonstrativos guardados somente neste navegador.';
  leoDashboard.append(heading,intro);
  leoRenderSmartPlan(leoDashboard);
  leoRenderMasteryPanel(leoDashboard);
  const cards=document.createElement('div');cards.className='leo-dashboard-grid';
  const areas=[
    {name:'Matemática',history:leoPracticeHistory,answers:leoPracticeAnswers,questions:leoPracticeQuestions,recovered:leoReadRecoveryProgress()},
    {name:'Português',history:leoPtHistory,answers:leoPtAnswers,questions:leoPtQuestions,recovered:null},
    {name:'Humanas',history:leoHuHistory,answers:leoHuAnswers,questions:leoHuQuestions,recovered:null}
  ];
  let recommended=null;
  areas.forEach(area=>{
    const completed=area.answers.filter(x=>x!==null).length;
    const correct=area.answers.filter(x=>x===true).length;
    const total=area.questions.length;
    const latest=area.history.length?area.history[area.history.length-1]:null;
    const card=document.createElement('article');card.className='leo-dashboard-card';
    const title=document.createElement('h4');title.textContent=area.name;
    const score=document.createElement('strong');score.textContent=latest?Math.round(latest.correct/latest.total*100)+'%':'Sem rodada concluída';
    const detail=document.createElement('p');detail.textContent=latest?'Última rodada: '+latest.correct+' de '+latest.total+' acertos · '+area.history.length+' rodada(s) registrada(s)':'Rodada atual: '+correct+' de '+completed+' respondidas';
    const track=document.createElement('div');track.className='leo-dashboard-track';track.setAttribute('role','progressbar');track.setAttribute('aria-label','Acertos na última rodada de '+area.name);track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax','100');
    const pct=latest?Math.round(latest.correct/latest.total*100):completed?Math.round(correct/completed*100):0;
    track.setAttribute('aria-valuenow',String(pct));
    const fill=document.createElement('span');fill.style.width=pct+'%';track.append(fill);
    const recovery=document.createElement('p');
    if(area.name==='Humanas'){
      const wrong=area.answers.map((x,i)=>x===false?i:-1).filter(i=>i>=0);
      recovery.textContent=wrong.length?'Recuperação nesta sessão: '+wrong.filter(i=>leoHuRecovery[i]).length+' de '+wrong.length+' erro(s) revisado(s).':'Recuperação: sem erros na rodada atual.';
    }else if(area.name==='Matemática'){
      const missed=area.answers.map((x,i)=>x===false?i:-1).filter(i=>i>=0);
      const mastered=missed.filter(i=>leoReadMathRecoveryTopics().includes(i)).length;
      recovery.textContent=missed.length?'Recuperação nesta rodada: '+mastered+' de '+missed.length+' questão(ões) recuperada(s).':'Recuperação: sem erros na rodada atual.';
    }else{
      const missed=area.answers.map((x,i)=>x===false?i:-1).filter(i=>i>=0);
      const mastered=missed.filter(i=>leoPtRecoveryDone[i]).length;
      recovery.textContent=missed.length?'Recuperação nesta sessão: '+mastered+' de '+missed.length+' questão(ões) com erro.':'Recuperação: sem erros na rodada atual.';
    }
    const button=document.createElement('button');button.type='button';button.textContent='Estudar '+area.name;button.addEventListener('click',()=>leoShowView(area.name==='Matemática'?'practice':area.name==='Humanas'?'humanas':'portuguese'));
    card.append(title,score,detail,track,recovery,button);cards.append(card);
    const missed=area.answers.map((x,i)=>x===false?i:-1).filter(i=>i>=0);
    const pending=area.name==='Matemática'?missed.filter(i=>!leoReadMathRecoveryTopics().includes(i)):area.name==='Humanas'?missed.filter(i=>!leoHuRecovery[i]):missed.filter(i=>!leoPtRecoveryDone[i]);
    if(pending.length&&!recommended)recommended={area:area.name,topic:area.name==='Matemática'?'Porcentagem e resolução de problemas':area.name==='Humanas'?'Cidadania e sociedade':'Interpretação de texto',view:area.name==='Matemática'?'practice':area.name==='Humanas'?'humanas':'portuguese'};
  });
  leoDashboard.append(cards);
  // Gráficos acessíveis por disciplina: apenas rodadas efetivamente registradas.
  const performance=document.createElement('section');
  performance.className='leo-dashboard-next leo-performance-panel';
  const performanceTitle=document.createElement('h4');
  performanceTitle.textContent='📈 Desempenho por matéria';
  const performanceIntro=document.createElement('p');
  performanceIntro.textContent='Cada barra mostra a nota original de uma rodada concluída (até 8 por matéria). A linha pontilhada indica a referência de estudo de 70%; recuperar erros depois não modifica essas notas.';
  performance.append(performanceTitle,performanceIntro);
  const performanceGrid=document.createElement('div');
  performanceGrid.className='leo-performance-grid';
  [
    {name:'Matemática',history:leoPracticeHistory,view:'practice',answers:leoPracticeAnswers},
    {name:'Português',history:leoPtHistory,view:'portuguese',answers:leoPtAnswers},
    {name:'Ciências Humanas',history:leoHuHistory,view:'humanas',answers:leoHuAnswers}
  ].forEach(area=>{
    const card=document.createElement('div');
    card.className='leo-performance-card';
    const label=document.createElement('strong');
    label.textContent=area.name;
    card.append(label);
    const entries=area.history.filter(item=>item&&Number.isFinite(item.correct)&&Number.isFinite(item.total)&&item.total>0).slice(-8);
    if(!entries.length){
      const empty=document.createElement('p');
      empty.textContent='Sem rodadas concluídas. Faça um treino para começar o gráfico.';
      card.append(empty);
    }else{
      const first=Math.round(entries[0].correct/entries[0].total*100);
      const last=Math.round(entries[entries.length-1].correct/entries[entries.length-1].total*100);
      const average=Math.round(entries.reduce((sum,item)=>sum+item.correct/item.total*100,0)/entries.length);
      const metrics=document.createElement('p');
      metrics.textContent='Última: '+last+'% · Média: '+average+'% · '+entries.length+' rodada(s)';
      card.append(metrics);
      const graph=document.createElement('div');
      graph.className='leo-performance-bars';
      graph.setAttribute('role','img');
      graph.setAttribute('aria-label',area.name+': '+entries.map((item,i)=>'rodada '+(i+1)+', '+Math.round(item.correct/item.total*100)+'%').join('; '));
      entries.forEach((item,i)=>{
        const percent=Math.max(0,Math.min(100,Math.round(item.correct/item.total*100)));
        const column=document.createElement('div');
        column.className='leo-performance-column';
        const value=document.createElement('span');
        value.textContent=percent+'%';
        const track=document.createElement('div');
        track.className='leo-performance-track';
        const fill=document.createElement('div');
        fill.className='leo-performance-fill';
        fill.style.height=percent+'%';
        if(percent>=70)fill.classList.add('leo-performance-good');
        track.append(fill);
        const number=document.createElement('small');
        number.textContent=String(i+1);
        column.append(value,track,number);
        graph.append(column);
      });
      card.append(graph);
      const chartNote=document.createElement('p');chartNote.className='leo-performance-caption';chartNote.textContent='Rodadas 1 a '+entries.length+' (da mais antiga à mais recente). Verde: 70% ou mais; azul: abaixo da referência.';card.append(chartNote);
      const trend=document.createElement('p');
      const previous=entries.length>1?Math.round(entries[entries.length-2].correct/entries[entries.length-2].total*100):null;
      const recent=entries.slice(-3);
      const recentAverage=Math.round(recent.reduce((sum,item)=>sum+item.correct/item.total*100,0)/recent.length);
      let status='Em acompanhamento';
      if(previous===null){
        trend.textContent='📊 Primeira rodada registrada. Faça outra para medir sua evolução.';
      }else{
        const change=last-previous;
        status=change>0?'Melhorando':change<0?'Precisa de reforço':'Estável';
        trend.textContent=(change>0?'📈 ':change<0?'📚 ':'📊 ')+status+': '+(change>0?'+':'')+change+' pontos percentuais em relação à rodada anterior ('+previous+'% → '+last+'%).';
      }
      card.append(trend);
      const guidance=document.createElement('p');
      if(last<70){
        guidance.textContent='🎯 Próximo passo: revisar os erros e fazer uma nova rodada. Média das últimas '+recent.length+' rodada(s): '+recentAverage+'%.';
      }else if(previous!==null&&last<previous){
        guidance.textContent='🎯 Você está acima de 70%, mas caiu na última rodada. Revise os erros antes de avançar.';
      }else{
        guidance.textContent='🎯 Próximo passo: praticar para consolidar o desempenho'+(last>=70?' acima da referência de 70%':'')+'.';
      }
      card.append(guidance);
      const action=document.createElement('button');
      action.type='button';
      action.className='leo-performance-action';
      const recoveredIndices=area.view==='practice'?leoReadMathRecoveryTopics():null;
      const isRecovered=index=>area.view==='practice'?recoveredIndices.includes(index):area.view==='portuguese'?leoPtRecoveryDone[index]===true:leoHuRecovery[index]===true;
      const wrongIndex=area.answers.findIndex((answer,index)=>answer===false&&!isRecovered(index));
      const recoveredErrors=area.answers.filter((answer,index)=>answer===false&&isRecovered(index)).length;
      const pendingErrors=area.answers.filter((answer,index)=>answer===false&&!isRecovered(index)).length;
      const recoveryInfo=document.createElement('p');
      recoveryInfo.className='leo-performance-recovery-status';
      recoveryInfo.textContent='Recuperação nesta rodada: '+recoveredErrors+' conteúdo(s) recuperado(s) · '+pendingErrors+' erro(s) aguardando reforço. A nota original é preservada.';
      card.append(recoveryInfo);
      action.textContent=wrongIndex>=0?'📚 Iniciar recuperação guiada':'Praticar '+area.name;
      action.addEventListener('click',()=>wrongIndex>=0?leoOpenTopic(area.view,wrongIndex):leoShowView(area.view));
      card.append(action);
    }
    performanceGrid.append(card);
  });
  performance.append(performanceGrid);
  const performanceNote=document.createElement('small');
  performanceNote.textContent='Gráficos demonstrativos com histórico local de até 8 rodadas por matéria. Não representam previsão de nota no ENEM.';
  performance.append(performanceNote);
  leoDashboard.append(performance);
  // Mapa de domínio por conteúdo, independente da nota da rodada.
  const mastery=document.createElement('section');
  mastery.className='leo-dashboard-next';
  const masteryTitle=document.createElement('h4');masteryTitle.textContent='🧭 Meu mapa de domínio por conteúdo';
  const masteryIntro=document.createElement('p');
  masteryIntro.textContent='Acompanhamento da rodada atual: dominado = acerto direto; recuperado = acerto após reforço; revisar = erro ainda não recuperado. Os resultados ficam neste navegador.';
  mastery.append(masteryTitle,masteryIntro);
  const topics=[
    {area:'Matemática',view:'practice',items:leoPracticeQuestions.map((q,i)=>({name:q.topic||'Questão '+(i+1),index:i,answer:leoPracticeAnswers[i],recovered:leoReadMathRecoveryTopics().includes(i)}))},
    {area:'Português',view:'portuguese',items:leoPtQuestions.map((q,i)=>({name:['Concessão e contraste','Ideia principal','Inferência textual','Fato e opinião','Referência pronominal'][i],index:i,answer:leoPtAnswers[i],recovered:leoPtRecoveryDone[i]===true}))},
    {area:'Ciências Humanas',view:'humanas',items:leoHuQuestions.map((q,i)=>({name:['Constituição e cidadania','Participação política','Movimentos sociais','Urbanização e desigualdade','Abolição e inclusão social'][i],index:i,answer:leoHuAnswers[i],recovered:leoHuRecovery[i]===true}))}
  ];
  let pendingTopic=null,masteredCount=0,recoveredCount=0,pendingCount=0;
  topics.forEach(group=>{
    const section=document.createElement('div');section.style.marginTop='12px';
    const label=document.createElement('strong');label.textContent=group.area;section.append(label);
    const grouped=new Map();
    group.items.forEach(item=>{if(!grouped.has(item.name))grouped.set(item.name,[]);grouped.get(item.name).push(item);});
    grouped.forEach((items,name)=>{
      const evaluated=items.filter(item=>item.answer!==null);
      const correct=items.filter(item=>item.answer===true).length;
      const recovered=items.filter(item=>item.answer===false&&item.recovered).length;
      const pending=items.filter(item=>item.answer===false&&!item.recovered);
      const rate=evaluated.length?Math.round(100*(correct+recovered)/evaluated.length):null;
      if(pending.length){pendingCount++;if(!pendingTopic)pendingTopic={area:group.area,name,view:group.view,index:pending[0].index};}
      else if(recovered){recoveredCount++;}
      else if(evaluated.length&&correct===evaluated.length){masteredCount++;}
      const line=document.createElement('div');line.style.margin='8px 0';
      const status=document.createElement('span');
      status.textContent=name+' — '+(rate===null?'○ Não avaliado':rate+'% de domínio ('+(correct+recovered)+' de '+evaluated.length+')')+(pending.length?' · Precisa revisar':recovered?' · Recuperado':rate===100?' · Dominado':'');
      if(pending.length)status.style.color='#b42318';
      else if(rate===100)status.style.color='#176b43';
      line.append(status);
      if(pending.length){
        const button=document.createElement('button');button.type='button';
        button.textContent='Revisar '+name;
        button.style.display='block';button.style.marginTop='5px';
        button.addEventListener('click',()=>leoOpenTopic(group.view,pending[0].index));
        line.append(button);
      }
      section.append(line);
    });
    mastery.append(section);
  });
  const totals=document.createElement('p');totals.style.fontWeight='700';
  totals.textContent='Competências: '+masteredCount+' dominada(s) · '+recoveredCount+' recuperada(s) · '+pendingCount+' para revisar.';
  mastery.insertBefore(totals,mastery.children[2]||null);
  leoDashboard.append(mastery);
  const summary=document.createElement('section');summary.className='leo-dashboard-next';
  const h=document.createElement('h4');h.textContent='🎯 Próximo estudo recomendado';
  const p=document.createElement('p');
  // Prioriza lacunas reais; não modifica o plano original nem as notas armazenadas.
  const currentMathMissed=leoPracticeAnswers.map((answer,index)=>answer===false?index:-1).filter(index=>index>=0);
  const mathAllRecovered=currentMathMissed.length>0&&currentMathMissed.every(index=>leoReadMathRecoveryTopics().includes(index));
  const adaptiveTarget=pendingTopic||recommended;
  p.textContent=pendingTopic?'Prioridade: '+pendingTopic.name+' em '+pendingTopic.area+'. Revise este conteúdo e faça a recuperação.':recommended?'Reforce '+recommended.topic+' em '+recommended.area+'. Revise os erros e tente novamente.':mathAllRecovered?'🎉 Você recuperou todos os conteúdos de Matemática desta rodada! Avance para um novo desafio ou siga seu plano semanal.':'Continue praticando para identificar os próximos conteúdos de reforço.';
  const go=document.createElement('button');go.type='button';
  go.textContent=pendingTopic?'Revisar '+pendingTopic.name:recommended?'Ir para '+recommended.area:mathAllRecovered?'Avançar em Matemática':'Começar por Matemática';
  go.addEventListener('click',()=>pendingTopic?leoOpenTopic(pendingTopic.view,pendingTopic.index):leoShowView(recommended?recommended.view:'practice'));
  summary.append(h,p,go);leoDashboard.append(summary);
  // Missão diária opcional, independente das notas e da conclusão oficial do plano.
  const mission=document.createElement('section');
  mission.className='leo-dashboard-next';
  mission.setAttribute('aria-label','Minha missão do dia');
  const missionTitle=document.createElement('h4');
  missionTitle.textContent='🚀 Minha missão do dia';
  mission.append(missionTitle);
  const missionDate=new Date();
  const localDate=[missionDate.getFullYear(),String(missionDate.getMonth()+1).padStart(2,'0'),String(missionDate.getDate()).padStart(2,'0')].join('-');
  const missionKey='decola-vestibular:leo:daily-mission:v1';
  const existingMission=leoMissionRead();
  const missionTarget=adaptiveTarget;
  const missionId=missionTarget?(missionTarget.view+':'+(missionTarget.name||missionTarget.topic||missionTarget.index)):'practice:explorar';
  let missionCompleted=false;
  try{
    const record=JSON.parse(localStorage.getItem(missionKey)||'null');
    missionCompleted=!!(record&&record.date===localDate&&record.completed===true&&(record.started||record.id===missionId));
    if(missionCompleted)leoAchievementMark(localDate,true);
  }catch(_error){}
  const missionText=document.createElement('p');
  missionText.textContent=missionTarget?'Missão: revisar '+(missionTarget.name||missionTarget.topic)+' em '+missionTarget.area+'. Reserve 15 minutos para estudar e resolver uma questão.':'Missão: pratique Matemática por 15 minutos e identifique um conteúdo para reforçar.';
  mission.append(missionText);
  const missionStatus=document.createElement('p');
  missionStatus.setAttribute('aria-live','polite');
  missionStatus.textContent=missionCompleted?(existingMission&&existingMission.automatic?'🎉 Missão do dia concluída automaticamente! Parabéns!':'✅ Missão marcada como concluída hoje. Parabéns!'):(existingMission&&existingMission.started?'📖 Missão iniciada. Conclua a recuperação para finalizar automaticamente.':'⏳ Missão de hoje ainda não concluída.');
  mission.append(missionStatus);
  const missionActions=document.createElement('div');
  missionActions.className='leo-dashboard-actions';
  const missionStart=document.createElement('button');
  missionStart.type='button';
  missionStart.textContent='Começar missão';
  missionStart.addEventListener('click',()=>{
    const target=missionTarget||{view:'practice'};
    leoMissionSave({date:localDate,id:missionId,view:target.view,index:target.index===undefined?null:target.index,started:true,completed:false});
    if(target.index!==undefined)leoOpenTopic(target.view,target.index);else leoShowView(target.view);
  });
  missionActions.append(missionStart);
  const missionFinish=document.createElement('button');
  missionFinish.type='button';
  missionFinish.textContent=missionCompleted?'Desmarcar conclusão':'Marcar como concluída';
  missionFinish.addEventListener('click',()=>{
    missionCompleted=!missionCompleted;
    leoMissionSave({date:localDate,id:missionId,view:missionTarget?missionTarget.view:'practice',index:missionTarget&&missionTarget.index!==undefined?missionTarget.index:null,started:false,completed:missionCompleted,automatic:false});
    leoAchievementMark(localDate,missionCompleted);
    missionStatus.textContent=missionCompleted?'✅ Missão marcada como concluída hoje. Parabéns!':'⏳ Missão de hoje ainda não concluída.';
    missionFinish.textContent=missionCompleted?'Desmarcar conclusão':'Marcar como concluída';
  });
  missionActions.append(missionFinish);
  mission.append(missionActions);
  const missionNote=document.createElement('p');
  missionNote.textContent='Ao começar, a missão é concluída automaticamente após acertar a recuperação da questão indicada. Você também pode marcar manualmente. Tudo fica neste navegador, sem alterar notas ou dias do plano semanal.';
  missionNote.style.fontSize='12px';
  mission.append(missionNote);
  leoDashboard.append(mission);
  // Metas semanais: usa somente datas de missões registradas, sem mexer nas notas.
  const weeklyGoals=document.createElement('section');
  weeklyGoals.className='leo-dashboard-next';
  weeklyGoals.setAttribute('aria-label','Painel de metas semanais');
  const goalHeading=document.createElement('h4');
  goalHeading.textContent='🎯 Minhas metas semanais';
  weeklyGoals.append(goalHeading);
  const today=new Date();
  const monday=new Date(today.getFullYear(),today.getMonth(),today.getDate());
  monday.setDate(monday.getDate()-(monday.getDay()+6)%7);
  const dateKey=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  const achievementDays=new Set(leoAchievementDates());
  const weekDays=Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(monday.getDate()+i);return d;});
  const doneDays=weekDays.filter(d=>achievementDays.has(dateKey(d))).length;
  const weeklyTarget=5;
  const remaining=Math.max(0,weeklyTarget-doneDays);
  const goalProgress=document.createElement('p');
  goalProgress.textContent=doneDays+' de '+weeklyTarget+' missões concluídas nesta semana ('+Math.min(100,Math.round(doneDays/weeklyTarget*100))+'% da meta).';
  const goalBar=document.createElement('progress');
  goalBar.max=weeklyTarget;goalBar.value=Math.min(doneDays,weeklyTarget);
  goalBar.style.width='100%';
  goalBar.setAttribute('aria-label','Progresso da meta semanal de cinco missões');
  weeklyGoals.append(goalProgress,goalBar);
  const dayLabels=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  const daysLine=document.createElement('div');
  daysLine.className='leo-dashboard-actions';
  daysLine.setAttribute('aria-label','Missões desta semana');
  weekDays.forEach((d,i)=>{
    const item=document.createElement('span');
    const done=achievementDays.has(dateKey(d));
    const current=dateKey(d)===dateKey(today);
    item.textContent=dayLabels[i]+' '+(done?'✓':current?'•':'–');
    item.title=done?'Missão concluída':current?'Hoje, missão pendente':'Sem missão registrada';
    item.style.cssText='display:inline-block;padding:6px 9px;border:1px solid #c5d4ff;border-radius:8px;font-size:12px;'+(done?'background:#dcfce7;color:#166534;':current?'background:#e8efff;color:#1745c5;':'');
    daysLine.append(item);
  });
  weeklyGoals.append(daysLine);
  const goalMessage=document.createElement('p');
  goalMessage.textContent=remaining===0?'🎉 Meta semanal alcançada! Você pode descansar ou continuar estudando no seu ritmo.':remaining===1?'Falta apenas 1 missão para sua meta. Um passo de cada vez!':'Faltam '+remaining+' missões para a meta desta semana. Pausas fazem parte do aprendizado, sem punições.';
  weeklyGoals.append(goalMessage);
  if(adaptiveTarget){
    const focus=document.createElement('p');
    focus.textContent='📚 Matéria que merece atenção: '+(adaptiveTarget.name||adaptiveTarget.topic)+' — '+adaptiveTarget.area+'.';
    weeklyGoals.append(focus);
    const focusButton=document.createElement('button');
    focusButton.type='button';
    focusButton.textContent='Revisar conteúdo prioritário';
    focusButton.addEventListener('click',()=>adaptiveTarget.index!==undefined?leoOpenTopic(adaptiveTarget.view,adaptiveTarget.index):leoShowView(adaptiveTarget.view));
    weeklyGoals.append(focusButton);
  }
  const missionButton=document.createElement('button');
  missionButton.type='button';
  missionButton.textContent='Ver minha missão do dia';
  missionButton.addEventListener('click',()=>{mission.scrollIntoView({block:'start',behavior:'smooth'});});
  weeklyGoals.append(missionButton);
  const goalNote=document.createElement('small');
  goalNote.textContent='Semana de segunda a domingo. Cada dia com missão concluída conta uma vez. Dados salvos somente neste navegador; não altera notas nem o plano de estudos.';
  weeklyGoals.append(goalNote);
  leoDashboard.append(weeklyGoals);
  leoDashboard.append(leoAchievementPanel());
  // Integração somente de leitura com o plano semanal gerado pelo Decola.
  const weekly=document.createElement('section');weekly.className='leo-dashboard-next';
  const weeklyTitle=document.createElement('h4');weeklyTitle.textContent='📅 Meu plano semanal de estudos';
  weekly.append(weeklyTitle);
  let savedPlan=null;
  try{
    const saved=JSON.parse(localStorage.getItem('decola-vestibular:progress:v1')||'null');
    if(saved&&saved.profile&&saved.plan&&Array.isArray(saved.plan.sessions)&&saved.plan.sessions.length){
      savedPlan={sessions:saved.plan.sessions,completed:Array.isArray(saved.completed)?saved.completed:[]};
    }
  }catch(_error){}
  if(savedPlan){
    const sessions=savedPlan.sessions;
    const completed=savedPlan.completed;
    const count=sessions.filter(session=>completed.includes(session.day)).length;
    const progress=document.createElement('p');
    progress.textContent=count+' de '+sessions.length+' dia(s) de estudo concluído(s) nesta semana.';
    weekly.append(progress);
    // Sugestão adaptativa adicional: a agenda original permanece intacta.
    if(adaptiveTarget){
      const adaptive=document.createElement('p');
      adaptive.textContent='🎯 Reforço adaptativo sugerido: '+(adaptiveTarget.name||adaptiveTarget.topic)+' — '+adaptiveTarget.area+'. Faça uma revisão curta antes de continuar o cronograma.';
      weekly.append(adaptive);
      const review=document.createElement('button');review.type='button';
      review.textContent='Revisar agora';
      review.addEventListener('click',()=>adaptiveTarget.index!==undefined?leoOpenTopic(adaptiveTarget.view,adaptiveTarget.index):leoShowView(adaptiveTarget.view));
      weekly.append(review);
    }else if(mathAllRecovered){
      const achieved=document.createElement('p');
      achieved.textContent='🎉 Reforço de Matemática concluído nesta rodada. Siga a próxima atividade planejada.';
      weekly.append(achieved);
    }
    const next=sessions.find(session=>!completed.includes(session.day));
    if(next){
      const detail=document.createElement('p');
      const area=next.area||{};
      detail.textContent='Próxima atividade — Dia '+next.day+': '+(area.short||area.title||'Estudo')+' · '+(area.topic||'Revisão')+' · '+next.minutes+' minutos.';
      weekly.append(detail);
      const actions=document.createElement('div');actions.className='leo-dashboard-actions';
      const id=area.id;
      if(id==='matematica'||id==='linguagens'||id==='humanas'){
        const start=document.createElement('button');start.type='button';
        start.textContent=id==='matematica'?'Praticar Matemática':id==='humanas'?'Estudar Humanas':'Praticar Português';
        start.addEventListener('click',()=>leoShowView(id==='matematica'?'practice':id==='humanas'?'humanas':'portuguese'));
        actions.append(start);
      }else{
        const info=document.createElement('p');
        info.textContent='Esta área ainda não possui treino específico no Professor Leo. Consulte o plano para seguir a atividade.';
        weekly.append(info);
      }
      const open=document.createElement('button');open.type='button';
      open.textContent='Abrir meu plano completo';
      open.addEventListener('click',()=>{
        panel.hidden=true;launch.hidden=false;launch.setAttribute('aria-expanded','false');
        location.hash='#plano';
      });
      actions.append(open);weekly.append(actions);
    }else{
      const done=document.createElement('p');done.textContent='Parabéns! Você concluiu todas as sessões previstas no plano desta semana.';weekly.append(done);
      const open=document.createElement('button');open.type='button';open.textContent='Rever meu plano';
      open.addEventListener('click',()=>{panel.hidden=true;launch.hidden=false;launch.setAttribute('aria-expanded','false');location.hash='#plano';});
      weekly.append(open);
    }
  }else{
    const empty=document.createElement('p');empty.textContent='Monte seu plano de estudos no Decola para ver aqui a próxima atividade da semana.';weekly.append(empty);
    const open=document.createElement('button');open.type='button';open.textContent='Montar meu plano';
    open.addEventListener('click',()=>{panel.hidden=true;launch.hidden=false;launch.setAttribute('aria-expanded','false');location.hash='#perfil';});
    weekly.append(open);
  }
  leoDashboard.append(weekly);
  const note=document.createElement('small');note.textContent='As notas das rodadas e os reforços são indicadores separados. O painel não altera resultados anteriores nem envia dados.';leoDashboard.append(note);
  // Organiza o painel existente em abas sem recriar ou alterar seus dados.
  const sections=Array.from(leoDashboard.children);
  const tabs=[
    {id:'plano',label:'🗓️ Meu plano',indices:[2,8,9,11]},
    {id:'desempenho',label:'📊 Desempenho',indices:[3,4,5,6]},
    {id:'conquistas',label:'🏅 Conquistas',indices:[7,10]}
  ];
  const nav=document.createElement('div');nav.className='leo-dashboard-tabs';
  nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Seções do painel do aluno');
  const panes=document.createElement('div');panes.className='leo-dashboard-panes';
  const tabButtons=[];
  const tabPanes=[];
  const selected=leoDashboardActiveTab;
  tabs.forEach((tab,i)=>{
    const button=document.createElement('button');button.type='button';
    button.id='leo-dashboard-tab-'+tab.id;button.textContent=tab.label;
    button.setAttribute('role','tab');button.setAttribute('aria-controls','leo-dashboard-pane-'+tab.id);
    const pane=document.createElement('section');pane.id='leo-dashboard-pane-'+tab.id;
    pane.className='leo-dashboard-pane';pane.setAttribute('role','tabpanel');
    pane.setAttribute('aria-labelledby',button.id);
    tab.indices.forEach(index=>{if(sections[index])pane.append(sections[index]);});
    if(tab.id==='desempenho'){
      const overview=document.createElement('section');
      overview.className='leo-dashboard-next leo-performance-summary';
      overview.setAttribute('aria-label','Resumo do Professor Leo');
      const title=document.createElement('h4');title.textContent='🎓 Professor Leo · Seu resumo de evolução';
      const recentAreas=[
        {name:'Matemática',history:leoPracticeHistory,view:'practice'},
        {name:'Português',history:leoPtHistory,view:'portuguese'},
        {name:'Ciências Humanas',history:leoHuHistory,view:'humanas'}
      ].map(area=>{
        const valid=area.history.filter(item=>item&&Number.isFinite(item.correct)&&Number.isFinite(item.total)&&item.total>0);
        return {...area,score:valid.length?Math.round(valid[valid.length-1].correct/valid[valid.length-1].total*100):null};
      });
      const measured=recentAreas.filter(area=>area.score!==null);
      const positive=measured.filter(area=>area.score>=70);
      const attention=measured.filter(area=>area.score<70).sort((a,b)=>a.score-b.score);
      const message=document.createElement('p');
      message.textContent=measured.length?'Você já tem resultados em '+measured.length+' matéria(s). '+(positive.length?'Boa conquista: '+positive.map(area=>area.name).join(' e ')+' atingiu a referência de 70%. ':'')+(attention.length?'Seu próximo foco pode ser '+attention[0].name+' ('+attention[0].score+'% na última rodada). Vamos revisar os erros e praticar no seu ritmo.':'Continue praticando para manter a evolução!'):'Comece um treino para receber orientações personalizadas com base nos seus acertos.';
      const explanation=document.createElement('p');
      explanation.textContent='📊 Acertos das rodadas são notas originais; recuperação dos erros e domínio progressivo são acompanhamentos separados. Revisar não altera a nota já registrada.';
      overview.append(title,message,explanation);
      if(attention.length){
        const action=document.createElement('button');action.type='button';action.textContent='🎯 Praticar '+attention[0].name;
        action.addEventListener('click',()=>{if(attention[0].view==='practice')leoOpenFocusedMath();else leoShowView(attention[0].view);});overview.append(action);
      }
      pane.prepend(overview);
    }
    button.addEventListener('click',()=>{leoDashboardActiveTab=tab.id;activate(tab.id);});
    button.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();
      const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(i+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
      tabButtons[next].click();tabButtons[next].focus();
    });
    tabButtons.push(button);tabPanes.push(pane);nav.append(button);panes.append(pane);
  });
  function activate(id){
    tabButtons.forEach((button,i)=>{
      const active=tabs[i].id===id;
      button.setAttribute('aria-selected',String(active));
      button.tabIndex=active?0:-1;
      tabPanes[i].hidden=!active;
    });
  }
  leoDashboard.replaceChildren(sections[0],sections[1],nav,panes,sections[12]);
  activate(tabs.some(t=>t.id===selected)?selected:'plano');

}

// Menu principal: cada modo ocupa uma tela própria, sem misturar aulas, treino e IA.
const leoBody=root.querySelector('.leo-body');
const leoMessage=root.querySelector('.leo-message');
const leoRecommendation=root.querySelector('.leo-recommend');
const leoAreaLabel=root.querySelector('label[for="leo-area"]');
const leoChat=root.querySelector('.leo-chat');

/* Simulado demonstrativo independente das rodadas e do diagnóstico. */
const leoMockQuestions=[
 {area:'Matemática',topic:'Porcentagem',q:'Um livro de R$ 120 está com 25% de desconto. Qual é o preço final?',choices:['R$ 90','R$ 95','R$ 100','R$ 80'],correct:0,why:'25% de 120 é 30; 120 − 30 = R$ 90.'},
 {area:'Português',topic:'Interpretação',q:'Na frase “Embora estivesse cansada, Ana terminou a redação”, “embora” indica:',choices:['Causa','Concessão','Finalidade','Consequência'],correct:1,why:'“Embora” introduz uma dificuldade que não impediu a ação: concessão.'},
 {area:'Ciências Humanas',topic:'Cidadania',q:'Qual ação é exemplo de participação democrática?',choices:['Impedir debates','Censurar opiniões','Participar de conselhos comunitários','Suspender eleições'],correct:2,why:'Conselhos comunitários permitem participação nas decisões coletivas.'},
 {area:'Ciências da Natureza',topic:'Transformações',q:'Qual alternativa apresenta uma transformação física?',choices:['Papel queimando','Ferro enferrujando','Leite azedando','Gelo derretendo'],correct:3,why:'O gelo muda de estado físico, mas continua sendo água.'},
 {area:'Matemática',topic:'Proporção',q:'Se 3 cadernos custam R$ 24, quanto custam 5 cadernos iguais?',choices:['R$ 32','R$ 40','R$ 48','R$ 36'],correct:1,why:'Cada caderno custa R$ 8; cinco custam 5 × 8 = R$ 40.'},
 {area:'Português',topic:'Coesão textual',q:'Em “Estudou bastante, portanto foi bem na prova”, “portanto” expressa:',choices:['Conclusão','Oposição','Dúvida','Tempo'],correct:0,why:'“Portanto” conecta uma ideia à conclusão decorrente dela.'},
 {area:'Ciências da Natureza',topic:'Ecologia',q:'Qual prática contribui para reduzir o descarte de resíduos?',choices:['Queimar plástico','Descartar pilhas no solo','Reutilizar embalagens','Misturar lixo reciclável e orgânico'],correct:2,why:'Reutilizar embalagens diminui o consumo de recursos e a geração de resíduos.'},
 {area:'Ciências Humanas',topic:'Urbanização',q:'A falta de saneamento e transporte em bairros periféricos indica:',choices:['Distribuição igualitária','Desigualdade socioespacial','Fim da urbanização','Ausência de população'],correct:1,why:'O acesso desigual à infraestrutura revela desigualdade socioespacial.'},
 {area:'Matemática',topic:'Média aritmética',q:'Qual é a média das notas 6, 8 e 10?',choices:['7','9','8','10'],correct:2,why:'(6 + 8 + 10) ÷ 3 = 24 ÷ 3 = 8.'},
 {area:'Português',topic:'Argumentação',q:'Qual frase apresenta uma tese que pode ser defendida em uma redação?',choices:['Que horas são?','Ontem choveu.','O livro está na mesa.','É necessário ampliar o acesso à leitura nas escolas.'],correct:3,why:'Uma tese apresenta um posicionamento que pode ser sustentado com argumentos.'}
];
const leoMockRecoveryQuestions=[
 {q:'Um produto de R$ 80 teve desconto de 25%. Qual é o novo preço?',choices:['R$ 60','R$ 65','R$ 70'],correct:0,why:'25% de 80 é 20. Portanto, 80 − 20 = R$ 60.'},
 {q:'Na frase “Embora estivesse chovendo, saímos”, a palavra “embora” expressa:',choices:['Causa','Concessão','Tempo'],correct:1,why:'A chuva não impediu a saída: isso é concessão.'},
 {q:'Qual atitude favorece a participação democrática?',choices:['Proibir assembleias','Ignorar debates públicos','Participar de reuniões comunitárias'],correct:2,why:'Reuniões comunitárias permitem que as pessoas participem das decisões.'},
 {q:'Qual exemplo é uma mudança física?',choices:['Água congelando','Madeira queimando','Ferro enferrujando'],correct:0,why:'Congelar muda o estado físico da água, sem formar outra substância.'},
 {q:'Se 4 lápis custam R$ 12, quanto custam 7 lápis iguais?',choices:['R$ 18','R$ 21','R$ 24'],correct:1,why:'Cada lápis custa R$ 3. Então, 7 × 3 = R$ 21.'},
 {q:'Em “Ele treinou, portanto melhorou”, “portanto” indica:',choices:['Oposição','Dúvida','Conclusão'],correct:2,why:'“Portanto” apresenta a conclusão da ideia anterior.'},
 {q:'Qual ação ajuda a reduzir a quantidade de lixo?',choices:['Usar garrafas reutilizáveis','Jogar pilhas no lixo comum','Queimar resíduos'],correct:0,why:'Reutilizar garrafas reduz a geração de resíduos.'},
 {q:'Bairros sem acesso adequado a transporte e saúde revelam:',choices:['Igualdade de serviços','Desigualdade socioespacial','Ausência de cidades'],correct:1,why:'A distribuição desigual dos serviços evidencia desigualdade socioespacial.'},
 {q:'Qual é a média de 4, 6 e 8?',choices:['5','7','6'],correct:2,why:'Somamos 4 + 6 + 8 = 18 e dividimos por 3: média 6.'},
 {q:'Qual frase apresenta uma tese argumentativa?',choices:['A escola deve incentivar a leitura diária.','O livro está na mesa.','Hoje é sexta-feira.'],correct:0,why:'A primeira frase apresenta um posicionamento que pode ser defendido com argumentos.'}
];
const leoMockRecoveryKey='decola-vestibular:simulado-recuperacao-v1';
let leoMockRecovery={};
try{const saved=JSON.parse(localStorage.getItem(leoMockRecoveryKey)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))leoMockRecovery=saved;}catch(_error){}
function leoMockRecoverySave(){try{localStorage.setItem(leoMockRecoveryKey,JSON.stringify(leoMockRecovery));}catch(_error){}}
const leoMockProgressiveQuestions=[[{"q":"Um tênis de R$ 200 tem desconto de 10%. Qual o preço final?","choices":["R$ 180","R$ 190","R$ 210"],"correct":0,"why":"10% de 200 = 20; 200 − 20 = R$ 180."},{"q":"Um ingresso de R$ 50 teve aumento de 20%. Quanto custa agora?","choices":["R$ 55","R$ 60","R$ 70"],"correct":1,"why":"20% de 50 = 10; 50 + 10 = R$ 60."}],[{"q":"“Mesmo cansado, estudou.” A expressão indica:","choices":["Concessão","Causa","Conclusão"],"correct":0,"why":"Mesmo cansado expressa uma dificuldade superada."},{"q":"“Ainda que chova, haverá prova.” O sentido é:","choices":["Tempo","Concessão","Finalidade"],"correct":1,"why":"Ainda que apresenta uma condição que não impede a ação."}],[{"q":"Qual instrumento permite decidir diretamente uma questão em votação popular?","choices":["Plebiscito","Censura","Intervenção"],"correct":0,"why":"O plebiscito consulta diretamente a população."},{"q":"Moradores discutem prioridades do bairro em uma assembleia. Isso é:","choices":["Participação cidadã","Proibição política","Censura"],"correct":0,"why":"Assembleias são espaços de participação coletiva."}],[{"q":"Qual processo é uma mudança física?","choices":["Papel queimando","Água evaporando","Ferro oxidando"],"correct":1,"why":"Evaporar muda apenas o estado físico da água."},{"q":"Ao derreter chocolate e resfriá-lo, ocorre principalmente:","choices":["Mudança física","Combustão","Oxidação"],"correct":0,"why":"Derreter e solidificar não formam outra substância."}],[{"q":"Se 3 garrafas custam R$ 15, quanto custam 8?","choices":["R$ 35","R$ 40","R$ 45"],"correct":1,"why":"Cada garrafa custa R$ 5; 8 × 5 = R$ 40."},{"q":"Uma receita para 4 pessoas usa 300 g de arroz. Para 10 pessoas, quanto usar?","choices":["600 g","750 g","900 g"],"correct":1,"why":"300 ÷ 4 = 75 g por pessoa; 75 × 10 = 750 g."}],[{"q":"“Choveu muito; por isso, a rua alagou.” A expressão indica:","choices":["Conclusão/consequência","Oposição","Dúvida"],"correct":0,"why":"Por isso liga o fato à consequência."},{"q":"“Estudou com dedicação; logo, melhorou.” A palavra “logo” indica:","choices":["Comparação","Conclusão","Concessão"],"correct":1,"why":"Logo introduz uma conclusão."}],[{"q":"Qual ação diminui o consumo de recursos?","choices":["Descartar copos sempre","Usar copo reutilizável","Queimar papel"],"correct":1,"why":"Reutilizar reduz a necessidade de novos materiais."},{"q":"Uma escola instala coleta seletiva. O principal benefício é:","choices":["Misturar resíduos","Facilitar a reciclagem","Aumentar descartes"],"correct":1,"why":"Separar materiais facilita a reciclagem."}],[{"q":"A ausência de transporte público em periferias é exemplo de:","choices":["Igualdade territorial","Desigualdade socioespacial","Fim das cidades"],"correct":1,"why":"O acesso desigual a serviços caracteriza desigualdade socioespacial."},{"q":"Duas regiões recebem investimentos muito diferentes em saneamento. Isso revela:","choices":["Desigualdade urbana","Distribuição equilibrada","Ausência de infraestrutura em ambas"],"correct":0,"why":"A distribuição desigual de saneamento revela desigualdade urbana."}],[{"q":"Qual a média de 5, 7 e 9?","choices":["6","7","8"],"correct":1,"why":"5 + 7 + 9 = 21; 21 ÷ 3 = 7."},{"q":"Um aluno tirou 6, 8, 8 e 10. Qual a média?","choices":["7","8","9"],"correct":1,"why":"6 + 8 + 8 + 10 = 32; 32 ÷ 4 = 8."}],[{"q":"Qual frase expressa uma tese?","choices":["A leitura deve ser incentivada nas escolas.","Hoje é terça-feira.","A porta está aberta."],"correct":0,"why":"A primeira defende um ponto de vista."},{"q":"Para uma redação sobre mobilidade urbana, qual tese é defensável?","choices":["Há ônibus na rua.","É necessário ampliar o transporte público acessível.","O ônibus chegou às 8h."],"correct":1,"why":"A segunda é um posicionamento argumentável."}]];
const leoMockProgressiveKey='decola-vestibular:simulado-dominio-progressivo-v1';
let leoMockProgressive={};
try{const data=JSON.parse(localStorage.getItem(leoMockProgressiveKey)||'{}');if(data&&typeof data==='object'&&!Array.isArray(data))leoMockProgressive=data;}catch(_error){}
function leoMockProgressiveSave(){try{localStorage.setItem(leoMockProgressiveKey,JSON.stringify(leoMockProgressive));}catch(_error){}}
function leoMockRecoveryRender(parent,index){
 const original=leoMockQuestions[index];
 const section=document.createElement('section');section.className='leo-dashboard-next';section.style.marginTop='10px';
 const heading=document.createElement('h4');heading.textContent='📚 Domínio progressivo · '+original.topic;section.append(heading);
 const explanation=document.createElement('p');explanation.textContent='Professor Leo explica: '+original.why;section.append(explanation);
 const basic=leoMockRecovery[index];
 const record=leoMockProgressive[index]&&typeof leoMockProgressive[index]==='object'?leoMockProgressive[index]:{};
 const stages=[leoMockRecoveryQuestions[index],...leoMockProgressiveQuestions[index]];
 const stageNames=['Básico','Intermediário','Aplicado ao ENEM'];
 let completed=0;
 if(Number.isInteger(basic)&&basic===stages[0].correct)completed=1;
 if(completed===1&&record['1']===stages[1].correct)completed=2;
 if(completed===2&&record['2']===stages[2].correct)completed=3;
 const progress=document.createElement('p');progress.textContent='Etapas concluídas: '+completed+' de 3 · '+(completed===3?'Conteúdo dominado!':'Avance uma etapa por vez.');section.append(progress);
 const bar=document.createElement('progress');bar.max=3;bar.value=completed;bar.style.width='100%';bar.setAttribute('aria-label','Progresso do domínio progressivo');section.append(bar);
 if(completed===3){
  const success=document.createElement('p');success.className='leo-practice-feedback leo-feedback-correct';success.textContent='🏅 Parabéns! Você dominou '+original.topic+' ao concluir os três desafios. O Professor Leo está orgulhoso do seu progresso! Sua nota original do simulado permanece inalterada.';section.append(success);
  const remaining=leoMockQuestions.map((q,i)=>({q,i})).filter(item=>item.i!==index&&leoMockState.answers[item.i]!==item.q.correct&&leoMasteryStage(item.i)<3);
  const next=document.createElement('button');next.type='button';next.textContent=remaining.length?'🚀 Ir para meu próximo desafio · '+remaining[0].q.topic:'🚀 Ir para meu próximo desafio';
  next.addEventListener('click',()=>{
   if(remaining.length){
    leoMockRecoveryOpen=remaining[0].i;
    leoShowView('simulado');
    const target=leoMockBox.querySelector('[data-leo-recovery-target="'+remaining[0].i+'"]');
    if(target){target.scrollIntoView({block:'center',behavior:'auto'});target.focus({preventScroll:true});}
   }else{
    leoShowView('dashboard');
    const smart=leoDashboard.querySelector('.leo-smart-plan');
    if(smart)smart.scrollIntoView({block:'start',behavior:'auto'});
   }
  });section.append(next);
  const hint=document.createElement('p');hint.textContent=remaining.length?'Próxima prioridade: '+remaining[0].q.topic+' · '+remaining[0].q.area+'.':'Você concluiu as recuperações pendentes! O plano inteligente indicará o próximo treino ou revisão.';section.append(hint);
 }else{
  const stage=completed,exercise=stages[stage];
  const label=document.createElement('h4');label.textContent='Desafio '+(stage+1)+' de 3 · '+stageNames[stage];section.append(label);
  const prompt=document.createElement('p');prompt.textContent=exercise.q;section.append(prompt);
  const choices=document.createElement('div');choices.className='leo-choices leo-humanas-choices';
  const selected=stage===0?basic:record[String(stage)];
  exercise.choices.forEach((option,i)=>{
   const button=document.createElement('button');button.type='button';button.textContent=String.fromCharCode(65+i)+') '+option;button.disabled=Number.isInteger(selected);button.setAttribute('aria-pressed',String(selected===i));
   button.addEventListener('click',()=>{
    if(stage===0){if(Number.isInteger(leoMockRecovery[index]))return;leoMockRecovery[index]=i;leoMockRecoverySave();}
    else{if(Number.isInteger((leoMockProgressive[index]||{})[String(stage)]))return;leoMockProgressive[index]={...(leoMockProgressive[index]||{}),[String(stage)]:i};leoMockProgressiveSave();}
    leoMockRender();
   });choices.append(button);
  });section.append(choices);
  if(Number.isInteger(selected)){
   const hit=selected===exercise.correct;
   const feedback=document.createElement('p');feedback.className='leo-practice-feedback '+(hit?'leo-feedback-correct':'leo-feedback-wrong');
   feedback.textContent=(hit?'✓ Muito bem! ':'Vamos revisar juntos. ')+exercise.why+' A nota original permanece a mesma.';section.append(feedback);
   if(!hit){const retry=document.createElement('button');retry.type='button';retry.textContent='Tentar novamente';retry.addEventListener('click',()=>{if(stage===0){delete leoMockRecovery[index];leoMockRecoverySave();}else{delete leoMockProgressive[index][String(stage)];leoMockProgressiveSave();}leoMockRender();});section.append(retry);}
  }
 }
 parent.append(section);
}
const leoMockKey='decola-vestibular:simulado-enem-v1';
let leoMockState={answers:Array(leoMockQuestions.length).fill(null),index:0,finished:false};
try{const saved=JSON.parse(localStorage.getItem(leoMockKey)||'null');if(saved&&Array.isArray(saved.answers)&&saved.answers.length===leoMockQuestions.length){leoMockState={answers:saved.answers.map((v,i)=>Number.isInteger(v)&&v>=0&&v<leoMockQuestions[i].choices.length?v:null),index:Number.isInteger(saved.index)?Math.max(0,Math.min(saved.index,leoMockQuestions.length-1)):0,finished:saved.finished===true};}}catch(_error){}
function leoMockSave(){try{localStorage.setItem(leoMockKey,JSON.stringify(leoMockState));}catch(_error){}}
const leoMockBox=document.createElement('section');leoMockBox.className='leo-practice leo-simulado';leoMockBox.setAttribute('aria-label','Simulado inteligente do ENEM');leoDashboard.after(leoMockBox);
let leoMockRecoveryOpen=null;
function leoMasteryStage(index){
 const basic=leoMockRecovery[index];
 const record=leoMockProgressive[index]&&typeof leoMockProgressive[index]==='object'?leoMockProgressive[index]:{};
 const stages=[leoMockRecoveryQuestions[index],...leoMockProgressiveQuestions[index]];
 let done=0;
 if(basic===stages[0].correct)done=1;
 if(done===1&&record['1']===stages[1].correct)done=2;
 if(done===2&&record['2']===stages[2].correct)done=3;
 return done;
}
const leoSpacedKey='decola-vestibular:revisao-espacada-v1';
let leoSpaced={};
try{const saved=JSON.parse(localStorage.getItem(leoSpacedKey)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))leoSpaced=saved;}catch(_error){}
function leoSpacedSave(){try{localStorage.setItem(leoSpacedKey,JSON.stringify(leoSpaced));}catch(_error){}}
function leoSpacedDate(ms){return new Date(ms).toLocaleDateString('pt-BR');}
function leoSpacedRecord(index){
 if(leoMasteryStage(index)!==3)return null;
 const key=String(index),existing=leoSpaced[key];
 if(existing&&typeof existing==='object'&&Number.isFinite(existing.masteredAt)&&Array.isArray(existing.attempts))return existing;
 const record={masteredAt:Date.now(),attempts:[]};leoSpaced[key]=record;leoSpacedSave();return record;
}
function leoSpacedRenderCard(card,index){
 const record=leoSpacedRecord(index);if(!record)return;
 const intervals=[1,3,7],attempts=record.attempts.filter(a=>a&&Number.isFinite(a.at)&&typeof a.correct==='boolean');
 const done=attempts.length;
 const due=done<intervals.length?record.masteredAt+intervals[done]*86400000:null;
 const now=Date.now();
 const label=document.createElement('p');
 label.textContent=done>=3?'🏅 Revisões programadas concluídas. Continue praticando regularmente.':(now>=due?'🔔 Revisão disponível agora · etapa '+(done+1)+'/3':'🗓️ Próxima revisão: '+leoSpacedDate(due)+' · etapa '+(done+1)+'/3');
 card.append(label);
 if(done>=3)return;
 const trigger=document.createElement('button');trigger.type='button';trigger.textContent=now>=due?'Fazer revisão inteligente':'Revisar antecipadamente';card.append(trigger);
 const host=document.createElement('div');host.className='leo-spaced-exercise';card.append(host);
 trigger.addEventListener('click',()=>{
  host.replaceChildren();
  const questions=[leoMockProgressiveQuestions[index][0],leoMockProgressiveQuestions[index][1],leoMockRecoveryQuestions[index]];
  const exercise=questions[done%questions.length];
  const heading=document.createElement('h4');heading.textContent='🧠 Revisão de memória · '+(done+1)+'/3';host.append(heading);
  const prompt=document.createElement('p');prompt.textContent=exercise.q;host.append(prompt);
  const options=document.createElement('div');options.className='leo-choices leo-humanas-choices';
  exercise.choices.forEach((choice,i)=>{
   const b=document.createElement('button');b.type='button';b.textContent=String.fromCharCode(65+i)+') '+choice;
   b.addEventListener('click',()=>{
    options.querySelectorAll('button').forEach(btn=>btn.disabled=true);
    const correct=i===exercise.correct;
    const feedback=document.createElement('p');feedback.className='leo-practice-feedback '+(correct?'leo-feedback-correct':'leo-feedback-wrong');
    feedback.textContent=(correct?'✓ Muito bem! ':'Vamos revisar: ')+exercise.why;host.append(feedback);
    if(correct){
     record.attempts.push({at:Date.now(),correct:true});leoSpacedSave();
     const next=document.createElement('button');next.type='button';next.textContent='Atualizar meu painel';next.addEventListener('click',()=>leoShowView('dashboard'));host.append(next);
    }else{
     const retry=document.createElement('button');retry.type='button';retry.textContent='Tentar novamente';retry.addEventListener('click',()=>{host.replaceChildren();trigger.click();});host.append(retry);
    }
   });options.append(b);
  });host.append(options);
 });
}
function leoRenderMasteryPanel(parent){
 const section=document.createElement('section');section.className='leo-dashboard-next leo-mastery-panel';section.setAttribute('aria-label','Painel de domínio do aluno');
 const title=document.createElement('h4');title.textContent='🏅 Meu domínio por conteúdo';section.append(title);
 const intro=document.createElement('p');intro.textContent='Acompanhe a recuperação dos erros do simulado. Cada conteúdo avança por 3 desafios; os resultados originais não mudam.';section.append(intro);
 if(!leoMockState.finished){const p=document.createElement('p');p.textContent='Conclua o Simulado Inteligente do ENEM para descobrir quais conteúdos precisam de reforço.';section.append(p);const b=document.createElement('button');b.type='button';b.textContent='Ir para o simulado';b.addEventListener('click',()=>leoShowView('simulado'));section.append(b);parent.append(section);return;}
 const errors=leoMockQuestions.map((q,i)=>({q,i})).filter(({q,i})=>leoMockState.answers[i]!==q.correct);
 const counts=[0,0,0];
 const grid=document.createElement('div');grid.className='leo-dashboard-grid';
 errors.forEach(({q,i})=>{
  const done=leoMasteryStage(i),bucket=done===3?2:done>0?1:0;counts[bucket]++;
  const card=document.createElement('article');card.className='leo-dashboard-card';
  const heading=document.createElement('h4');heading.textContent=q.topic+' · '+q.area;card.append(heading);
  const status=document.createElement('p');status.textContent=['📖 Em aprendizagem','📈 Em evolução','🏅 Dominado'][bucket]+' · '+done+'/3 desafios';card.append(status);
  const bar=document.createElement('progress');bar.max=3;bar.value=done;bar.style.width='100%';bar.setAttribute('aria-label','Etapas concluídas em '+q.topic);card.append(bar);
  if(done<3){const b=document.createElement('button');b.type='button';b.textContent=done?'Continuar desafios':'Começar recuperação';b.addEventListener('click',()=>{leoMockRecoveryOpen=i;leoShowView('simulado');leoMockRender();const target=leoMockBox.querySelector('.leo-dashboard-next');if(target)target.scrollIntoView({block:'start'});});card.append(b);}
  else{leoSpacedRenderCard(card,i);}
  grid.append(card);
 });
 const summary=document.createElement('p');summary.textContent='📖 Em aprendizagem: '+counts[0]+' · 📈 Em evolução: '+counts[1]+' · 🏅 Dominados: '+counts[2];section.append(summary);
 if(errors.length){const priority=errors.find(({i})=>leoMasteryStage(i)<3);if(priority){const p=document.createElement('p');p.textContent='🎯 Próximo conteúdo sugerido: '+priority.q.topic+' ('+priority.q.area+').';section.append(p);}}
 else{const p=document.createElement('p');p.textContent='🎉 Nenhum erro neste simulado! Continue praticando para ampliar seu domínio.';section.append(p);}
 section.append(grid);parent.append(section);
}
function leoMockRender(){
 leoMockBox.replaceChildren();
 const heading=document.createElement('h3');heading.textContent='📝 Simulado Inteligente do ENEM';leoMockBox.append(heading);
 const note=document.createElement('p');note.textContent='Simulado demonstrativo com 10 questões autorais, sem tempo limite. Suas respostas ficam apenas neste navegador e não alteram o diagnóstico nem as notas dos treinos.';leoMockBox.append(note);
 const answered=leoMockState.answers.filter(x=>x!==null).length;
 const progress=document.createElement('p');progress.textContent='Progresso: '+answered+' de 10 questões respondidas.';leoMockBox.append(progress);
 const bar=document.createElement('progress');bar.max=10;bar.value=answered;bar.style.width='100%';leoMockBox.append(bar);
 if(leoMockState.finished){
  const score=leoMockQuestions.filter((q,i)=>leoMockState.answers[i]===q.correct).length;
  const title=document.createElement('h4');title.textContent='Resultado: '+score+' de 10 acertos ('+(score*10)+'%)';leoMockBox.append(title);
  const areas=[...new Set(leoMockQuestions.map(q=>q.area))];
  areas.forEach(area=>{
   const items=leoMockQuestions.map((q,i)=>({q,i})).filter(x=>x.q.area===area);
   const hits=items.filter(x=>leoMockState.answers[x.i]===x.q.correct).length;
   const p=document.createElement('p');p.textContent=area+': '+hits+' de '+items.length+' acertos.';leoMockBox.append(p);
  });
  const errors=leoMockQuestions.map((q,i)=>({q,i})).filter(x=>leoMockState.answers[x.i]!==x.q.correct);
  const recommendation=document.createElement('section');recommendation.className='leo-dashboard-next';
  const h=document.createElement('h4');h.textContent=errors.length?'🎯 Seu plano de revisão':'🎉 Parabéns!';recommendation.append(h);
  const summary=document.createElement('p');summary.textContent=errors.length?'Revise primeiro os conteúdos abaixo. As explicações são comentadas pelo Professor Leo e não alteram sua pontuação.':'Você acertou todas as questões! Continue praticando com outros exercícios.';recommendation.append(summary);
  errors.forEach(({q,i})=>{const p=document.createElement('p');p.textContent=(i+1)+'. '+q.area+' — '+q.topic+': '+q.why;recommendation.append(p);const button=document.createElement('button');button.type='button';button.textContent='📖 Aprender com meu erro · Questão '+(i+1);button.dataset.leoRecoveryTarget=String(i);button.style.margin='4px 8px 8px 0';button.addEventListener('click',()=>{leoMockRecoveryOpen=leoMockRecoveryOpen===i?null:i;leoMockRender();});recommendation.append(button);if(leoMockRecoveryOpen===i)leoMockRecoveryRender(recommendation,i);});
  leoMockBox.append(recommendation);
  leoRenderMasteryPanel(leoMockBox);
  const review=document.createElement('h4');review.textContent='📖 Gabarito comentado';leoMockBox.append(review);
  leoMockQuestions.forEach((q,i)=>{const p=document.createElement('p');p.textContent=(i+1)+'. '+(leoMockState.answers[i]===q.correct?'✓ Acertou':'✗ Revise')+' — '+q.q+' Resposta: '+q.choices[q.correct]+'. '+q.why;leoMockBox.append(p);});
  const restart=document.createElement('button');restart.type='button';restart.textContent='🔄 Refazer simulado';restart.addEventListener('click',()=>{leoMockState={answers:Array(10).fill(null),index:0,finished:false};leoMockRecovery={};leoMockProgressive={};leoSpaced={};leoSpacedSave();leoMockRecoveryOpen=null;leoMockRecoverySave();leoMockProgressiveSave();leoMockSave();leoMockRender();});leoMockBox.append(restart);return;
 }
 const index=leoMockState.index,q=leoMockQuestions[index];
 const subtitle=document.createElement('h4');subtitle.textContent='Questão '+(index+1)+' de 10 · '+q.area;leoMockBox.append(subtitle);
 const question=document.createElement('p');question.textContent=q.q;question.style.fontWeight='600';leoMockBox.append(question);
 const options=document.createElement('div');options.className='leo-choices leo-humanas-choices';
 q.choices.forEach((choice,i)=>{const button=document.createElement('button');button.type='button';button.textContent=String.fromCharCode(65+i)+') '+choice;button.disabled=leoMockState.answers[index]!==null;button.setAttribute('aria-pressed',String(leoMockState.answers[index]===i));button.addEventListener('click',()=>{if(leoMockState.answers[index]!==null)return;leoMockState.answers[index]=i;leoMockSave();leoMockRender();});options.append(button);});leoMockBox.append(options);
 if(leoMockState.answers[index]!==null){const feedback=document.createElement('p');const hit=leoMockState.answers[index]===q.correct;feedback.className='leo-practice-feedback '+(hit?'leo-feedback-correct':'leo-feedback-wrong');feedback.textContent=(hit?'✓ Muito bem! ':'Vamos revisar juntos. ')+q.why;leoMockBox.append(feedback);}
 const nav=document.createElement('div');nav.className='leo-choices';
 const prev=document.createElement('button');prev.type='button';prev.textContent='← Anterior';prev.disabled=index===0;prev.addEventListener('click',()=>{leoMockState.index--;leoMockSave();leoMockRender();});nav.append(prev);
 const next=document.createElement('button');next.type='button';next.textContent=index===9?'Ver resultado →':'Próxima questão →';next.disabled=leoMockState.answers[index]===null;next.addEventListener('click',()=>{if(index===9){if(leoMockState.answers.some(a=>a===null)){const first=leoMockState.answers.findIndex(a=>a===null);leoMockState.index=first;}else leoMockState.finished=true;}else leoMockState.index++;leoMockSave();leoMockRender();});nav.append(next);leoMockBox.append(nav);
}
leoMockRender();

const leoMenu=document.createElement('section');
leoMenu.className='leo-menu';
leoMenu.innerHTML='<h3>O que vamos estudar hoje?</h3><p>Escolha como deseja aprender com o Professor Leo.</p>';
const leoViews=[
  ['lesson','📖 Aprender uma matéria','Aulas explicadas com exemplos e dicas.'],
  ['practice','🧮 Fazer exercícios de Matemática','Treino de Matemática com correção e reforço.'],
   ['portuguese','📖 Exercícios de Português','Interpretação de texto, correção e histórico de acertos.'],
  ['humanas','🌎 Exercícios de Ciências Humanas','Cidadania, história, geografia e movimentos sociais.'],
  ['simulado','📝 Simulado Inteligente do ENEM','10 questões de diferentes matérias, correção e plano de revisão.'],
  ['chat','💬 Conversar com o Professor Leo','Tire suas dúvidas com a IA em teste.'],
  ['dashboard','📊 Minha evolução','Veja seu desempenho em Matemática e Português e recomendações de estudo.']
];
leoViews.forEach(([view,label,description])=>{
  const button=document.createElement('button');
  button.type='button';button.className='leo-menu-option';
  const title=document.createElement('strong');title.textContent=label;
  const detail=document.createElement('small');detail.textContent=description;
  button.append(title,detail);
  button.addEventListener('click',()=>leoShowView(view));
  leoMenu.append(button);
});
leoBody.prepend(leoMenu);
const leoBack=document.createElement('button');
leoBack.type='button';leoBack.className='leo-back';
leoBack.textContent='← Voltar ao menu';
root.querySelector('.leo-top').insertBefore(leoBack,root.querySelector('.leo-close'));
const leoTalk=document.createElement('button');
leoTalk.type='button';
leoTalk.className='leo-talk';
leoTalk.textContent='💬 Falar com Leo';
leoTalk.setAttribute('aria-label','Conversar com o Professor Leo');
root.querySelector('.leo-top').insertBefore(leoTalk,root.querySelector('.leo-close'));
const leoLocation=document.createElement('span');
leoLocation.className='leo-current-location';
leoLocation.setAttribute('role','status');
leoLocation.setAttribute('aria-live','polite');
root.querySelector('.leo-top > div').append(leoLocation);
let leoReturnView='practice';
let leoCurrentView='menu';
const leoResume=document.createElement('button');
leoResume.type='button';
leoResume.className='leo-talk';
leoResume.textContent='🧮 Voltar aos exercícios';
leoResume.setAttribute('aria-label','Retomar os exercícios sem perder o progresso');
root.querySelector('.leo-top').insertBefore(leoResume,root.querySelector('.leo-close'));
leoResume.addEventListener('click',()=>leoShowView(leoReturnView));
leoTalk.addEventListener('click',()=>{if(leoCurrentView==='practice'||leoCurrentView==='lesson'||leoCurrentView==='portuguese'||leoCurrentView==='humanas')leoReturnView=leoCurrentView;leoShowView('chat')});
leoBack.addEventListener('click',()=>leoShowView('menu'));
function leoOpenTopic(view,index){
  if(view==='practice'){leoPracticeIndex=index;renderLeoPractice();}
  else if(view==='portuguese'){leoPtIndex=index;leoPtRender();}
  else if(view==='humanas'){leoHuIndex=index;leoHuRender();}
  leoShowView(view);
}
function leoShowView(view){
  const previousView=leoCurrentView;
  leoCurrentView=view;
  const locationLabels={menu:'Menu de estudos',lesson:'Aula de '+(lessons[Number(selector.value)]?.area||'uma matéria'),practice:'Exercícios de Matemática',portuguese:'Exercícios de Português',humanas:'Exercícios de Ciências Humanas',simulado:'Simulado Inteligente do ENEM',chat:'Conversa com o Professor Leo',dashboard:'Minha evolução'};
  leoLocation.textContent='📍 Você está em: '+(locationLabels[view]||'Área de estudos');
  const menu=view==='menu';
  leoMenu.hidden=!menu;
  leoBack.hidden=menu;
  leoTalk.hidden=view==='chat';
  leoResume.hidden=view!=='chat';
  const isLesson=view==='lesson',isPractice=view==='practice',isChat=view==='chat',isPortuguese=view==='portuguese',isHumanas=view==='humanas',isDashboard=view==='dashboard',isSimulado=view==='simulado';
   if(isSimulado)leoMockRender();
   leoMockBox.hidden=!isSimulado;
   if(isDashboard)leoRenderDashboard();
   leoDashboard.hidden=!isDashboard;
  leoMessage.hidden=true;
  leoRecommendation.hidden=!isLesson;
  leoAreaLabel.hidden=!isLesson;
  selector.hidden=!isLesson;
  lessonBox.hidden=!isLesson;
  leoPractice.hidden=!isPractice;
   leoPtBox.hidden=!isPortuguese;
  leoHuBox.hidden=!isHumanas;
  leoChat.hidden=!isChat;
  if(isPractice && previousView!=='chat'){
    selector.value='0';
    renderLeoPractice();
  }
  leoBody.scrollTop=0;
  if(!menu)leoBack.focus({preventScroll:true});
}
leoShowView('menu');
selector.addEventListener('change',renderLeoPractice);
launch.addEventListener('click',()=>{panel.hidden=false;launch.hidden=true;launch.setAttribute('aria-expanded','true');recommend();renderLesson();leoShowView('menu');root.querySelector('.leo-close').focus();});
root.querySelector('.leo-close').addEventListener('click',()=>{panel.hidden=true;launch.hidden=false;launch.setAttribute('aria-expanded','false');launch.focus();});
selector.addEventListener('change',()=>{renderLesson();if(leoCurrentView==='lesson')leoLocation.textContent='📍 Você está em: Aula de '+(lessons[Number(selector.value)]?.area||'uma matéria');});

// Integração segura: a chave da OpenAI permanece somente no Cloudflare Worker.
const leoAsk=root.querySelector('.leo-ask');
const leoInput=root.querySelector('#leo-question-input');
const leoAiStatus=root.querySelector('.leo-ai-status');
const leoAiAnswer=root.querySelector('.leo-ai-answer');
// Conversa em balões; entrada permanece disponível após cada resposta.
const leoThread=document.createElement('div');
leoThread.className='leo-thread';
leoThread.setAttribute('role','log');
leoThread.setAttribute('aria-label','Conversa com o Professor Leo');
leoThread.setAttribute('aria-live','polite');
leoChat.insertBefore(leoThread,leoInput.previousElementSibling);
const leoNewQuestion=root.querySelector('.leo-new-question');
leoNewQuestion.hidden=true;
leoAiAnswer.hidden=true;
leoAiStatus.classList.add('leo-chat-status');
function leoBubble(who,message){
  const bubble=document.createElement('div');
  bubble.className='leo-bubble leo-bubble-'+who;
  const name=document.createElement('strong');
  name.textContent=who==='student'?'Você':'🎓 Professor Leo';
  const body=document.createElement('div');
  body.textContent=message;
  if(who==='teacher'){
    body.style.whiteSpace='pre-line';
    const paragraphs=message.split(/\n\s*\n/);
    if(message.length>950&&paragraphs.length>2){
      body.textContent=paragraphs.slice(0,2).join('\n\n');
      const details=document.createElement('details');
      const summary=document.createElement('summary');
      summary.textContent='Ler o restante da explicação';
      const more=document.createElement('div');
      more.style.whiteSpace='pre-line';
      more.textContent=paragraphs.slice(2).join('\n\n');
      details.append(summary,more);
      body.append(details);
    }
  }
  bubble.append(name,body);
  leoThread.append(bubble);
  bubble.scrollIntoView({block:'nearest'});
}
leoInput.setAttribute('placeholder','Escreva sua dúvida ou continue a conversa…');
leoInput.setAttribute('rows','2');
leoAsk.textContent='Enviar mensagem ➤';
leoInput.addEventListener('keydown',event=>{
  if(event.key==='Enter'&&!event.shiftKey){
    event.preventDefault();
    leoAsk.click();
  }
});
// Histórico curto enviado ao backend para permitir continuidade, se suportado.
const leoHistory=[];
function leoCleanMath(text){
  // Apresenta fórmulas em texto simples, sem expor comandos LaTeX ao aluno.
  return String(text)
    .replace(/\\\\\[|\\\\\]|\\\\\(|\\\\\)/g,'')
    .replace(/\\\\(?:times|cdot)/g,' × ')
    .replace(/\\\\(?:div)/g,' ÷ ')
    .replace(/\\\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g,'($1 ÷ $2)')
    .replace(/\\\\(?:text|mathrm)\s*\{([^{}]+)\}/g,'$1')
    .replace(/\\\\%/g,'%')
    .replace(/\*\*([^*]+)\*\*/g,'$1')
    .replace(/\\\\/g,'');
}
// Acompanhamento demonstrativo local, sem identificação pessoal.
const leoAdaptivePracticeKey='decola-leo-practice-v1';
let leoAdaptivePractice={attempts:0,correct:0,streak:0,level:1};
try{
  const saved=JSON.parse(localStorage.getItem(leoAdaptivePracticeKey)||'null');
  if(saved&&Number.isFinite(saved.attempts)&&Number.isFinite(saved.correct)&&Number.isFinite(saved.level)){
    leoAdaptivePractice={attempts:Math.max(0,saved.attempts),correct:Math.max(0,saved.correct),streak:Math.max(0,saved.streak||0),level:Math.max(1,Math.min(3,saved.level))};
  }
}catch(_error){}
let leoChallengeCount=0;
function leoLearningChallenge(question,answer){
  if(!/porcent|\d+\\s*%/i.test(question+' '+answer))return;
  const sets=[
    [{rate:10,total:80},{rate:25,total:120},{rate:50,total:90},{rate:20,total:150}],
    [{rate:15,total:200},{rate:30,total:240},{rate:12,total:250},{rate:35,total:180}],
    [{rate:18,total:350},{rate:12,total:475},{rate:7,total:860},{rate:22,total:650}]
  ];
  const level=leoAdaptivePractice.level;
  const options=sets[level-1];
  const example=options[leoChallengeCount++%options.length];
  const correct=example.rate*example.total/100;
  const box=document.createElement('div');
  box.className='leo-bubble leo-bubble-teacher leo-learning-check';
  const heading=document.createElement('strong');heading.textContent='🎯 Agora é sua vez! · Nível '+level;
  const progress=document.createElement('p');
  progress.textContent='Seu acompanhamento: '+leoAdaptivePractice.correct+' acerto(s) em '+leoAdaptivePractice.attempts+' tentativa(s).';
  const task=document.createElement('p');task.textContent='Quanto é '+example.rate+'% de '+example.total+'? Tente antes de ver a resposta.';
  const form=document.createElement('div');form.className='leo-check-form';
  const input=document.createElement('input');input.type='number';input.step='any';input.inputMode='decimal';input.placeholder='Digite sua resposta';input.setAttribute('aria-label','Resposta do exercício de fixação');
  const button=document.createElement('button');button.type='button';button.textContent='Conferir resposta';
  const feedback=document.createElement('p');feedback.setAttribute('role','status');
  const actions=document.createElement('div');actions.className='leo-check-actions';actions.hidden=true;
  const help=document.createElement('div');help.className='leo-help-options';help.hidden=true;
  const helpTitle=document.createElement('strong');helpTitle.textContent='Como o Professor Leo pode ajudar?';help.append(helpTitle);
  const helpChoices=[
    ['📖 Explique mais simples','Explique com uma analogia do cotidiano e palavras fáceis.'],
    ['🧮 Passo a passo','Mostre o cálculo passo a passo, sem pular etapas.'],
    ['🎯 Outro exemplo','Mostre outro exemplo parecido para eu tentar, sem dar a resposta primeiro.']
  ];
  helpChoices.forEach(([label,instruction])=>{
    const choice=document.createElement('button');choice.type='button';choice.textContent=label;
    choice.addEventListener('click',()=>{
      leoInput.value='Estou aprendendo porcentagem. Na questão quanto é '+example.rate+'% de '+example.total+', respondi '+input.value+' e o resultado correto é '+correct+'. '+instruction;
      leoInput.focus({preventScroll:true});
      leoAiStatus.textContent='Sua dúvida está pronta. Clique em Enviar mensagem para conversar com o Professor Leo.';
      leoInput.scrollIntoView({block:'nearest',behavior:'smooth'});
    });
    help.append(choice);
  });
  const again=document.createElement('button');again.type='button';again.textContent='🔄 Próximo desafio';
  const converse=document.createElement('button');converse.type='button';converse.textContent='💬 Perguntar ao Professor Leo';
  converse.addEventListener('click',()=>{leoInput.focus({preventScroll:true});leoInput.scrollIntoView({block:'nearest'});});
  again.addEventListener('click',()=>{leoLearningChallenge('porcentagem','porcentagem');});
  actions.append(again,converse);
  button.addEventListener('click',()=>{
    if(!input.value.trim()||!Number.isFinite(Number(input.value.replace(',','.')))){feedback.textContent='Digite um número válido para conferir.';return;}
    const isCorrect=Math.abs(Number(input.value.replace(',','.'))-correct)<0.001;
    leoAdaptivePractice.attempts++;
    if(isCorrect){leoAdaptivePractice.correct++;leoAdaptivePractice.streak++;if(leoAdaptivePractice.streak>=2&&leoAdaptivePractice.level<3){leoAdaptivePractice.level++;leoAdaptivePractice.streak=0;}}
    else{leoAdaptivePractice.streak=0;if(leoAdaptivePractice.level>1)leoAdaptivePractice.level--;}
    try{localStorage.setItem(leoAdaptivePracticeKey,JSON.stringify(leoAdaptivePractice));}catch(_error){}
    feedback.className=isCorrect?'leo-feedback-correct':'leo-feedback-wrong';
    feedback.textContent=isCorrect?'✓ Você acertou! '+example.rate+'% de '+example.total+' = '+correct+'. '+(leoAdaptivePractice.level>level?'Você avançou para o nível '+leoAdaptivePractice.level+'!':'Vamos praticar mais uma?'):'✗ Vamos aprender com essa tentativa. '+example.rate+'% significa '+example.rate+' ÷ 100. Então '+example.total+' × '+example.rate+' ÷ 100 = '+correct+'. O próximo desafio será de reforço.';
    progress.textContent='Seu acompanhamento: '+leoAdaptivePractice.correct+' acerto(s) em '+leoAdaptivePractice.attempts+' tentativa(s). Nível atual: '+leoAdaptivePractice.level+'.';
    button.disabled=true;input.disabled=true;actions.hidden=false;help.hidden=isCorrect;
    actions.scrollIntoView({block:'nearest',behavior:'smooth'});
  });
  form.append(input,button);box.append(heading,progress,task,form,feedback,help,actions);
  leoThread.append(box);box.scrollIntoView({block:'nearest'});
}
let leoBusy=false;
let leoLastRequest=0;
leoAsk.addEventListener('click',async()=>{
  const question=leoInput.value.trim();
  if(!question){leoAiStatus.textContent='Escreva sua dúvida antes de enviar.';return;}
  if(leoBusy)return;
  if(Date.now()-leoLastRequest<15000){leoAiStatus.textContent='Aguarde alguns segundos antes de enviar outra pergunta.';return;}
  leoBusy=true;leoLastRequest=Date.now();leoAsk.disabled=true;leoBubble('student',question);leoInput.value='';
  leoAiStatus.textContent='Professor Leo está preparando a explicação…';
  try{
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),25000);
    let response;
    try{response=await fetch('https://professor-leo-api.ricardocustodio-rc1.workers.dev/chat',{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:question+'\n\nExplique em português simples, em até 3 etapas curtas. Escreva contas em texto comum (ex.: 20 ÷ 100 = 0,2; 0,2 × 50 = 10). Não use LaTeX nem comandos com barras invertidas. Ao final, pergunte se o aluno entendeu.',mensagem:question+'\n\nResponda brevemente, sem LaTeX, com contas em texto simples.',history:leoHistory.slice(-8),historico:leoHistory.slice(-8)}),signal:controller.signal
    });}finally{clearTimeout(timer);}
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||'Não foi possível obter uma resposta.');
    const answer=data.answer||data.resposta||data.reply||data.message;
    if(typeof answer!=='string'||!answer.trim())throw new Error('A resposta veio vazia.');
    leoBubble('teacher',leoCleanMath(answer));leoHistory.push({role:'user',content:question},{role:'assistant',content:answer});if(leoHistory.length>16)leoHistory.splice(0,leoHistory.length-16);leoLearningChallenge(question,answer);leoAiStatus.textContent='Pode continuar perguntando abaixo.';
  }catch(error){leoAiStatus.textContent='Não foi possível responder agora. Tente novamente em instantes.';}
  finally{leoBusy=false;leoAsk.disabled=false;}
});
