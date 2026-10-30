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
function renderLeoPractice(){
  leoPractice.replaceChildren();
  if(selector.value!=='0'){leoPractice.hidden=true;return;}
  leoPractice.hidden=false;
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
    guidance.textContent=correct===leoPracticeQuestions.length?'Parabéns! Você acertou todas. Continue praticando novos desafios.':'Revisão recomendada: porcentagem, especialmente cálculos com descontos, aumentos e situações do cotidiano. Releia as explicações e tente outra rodada.';
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
            if(hit){recoveryCorrect++;mastered.push(index);}
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
let leoPtRecoveryDone={};
function leoPtRecoveryPanel(index){
 const [lesson,passage,question,answers,correct,why]=leoPtRecovery[index];
 const box=document.createElement('section');box.className='leo-portuguese-recovery';
 const heading=document.createElement('h4');heading.textContent='📚 Recuperação personalizada';box.append(heading);
 const explanation=document.createElement('p');explanation.textContent='1. Entenda: '+lesson;box.append(explanation);
 const excerpt=document.createElement('blockquote');excerpt.className='leo-portuguese-passage';excerpt.textContent=passage;box.append(excerpt);
 const prompt=document.createElement('p');prompt.textContent='2. Tente outra questão: '+question;box.append(prompt);
 const choices=document.createElement('div');choices.className='leo-choices leo-portuguese-choices';box.append(choices);
 const feedback=document.createElement('p');feedback.setAttribute('role','status');box.append(feedback);
 function renderChoices(){
  choices.replaceChildren();
  answers.forEach((answer,i)=>{
   const button=document.createElement('button');button.type='button';button.textContent=String.fromCharCode(65+i)+') '+answer;
   button.disabled=leoPtRecoveryDone[index]===true;
   button.addEventListener('click',()=>{
    if(leoPtRecoveryDone[index])return;
    if(i===correct){leoPtRecoveryDone[index]=true;feedback.className='leo-practice-feedback leo-feedback-correct';feedback.textContent='✓ Conteúdo recuperado! '+why;}
    else{feedback.className='leo-practice-feedback leo-feedback-wrong';feedback.textContent='Vamos tentar de novo. '+lesson;}
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
 leoPtBox.append(passage,title,options);
 if(answered){const feedback=document.createElement('p');feedback.className='leo-practice-feedback '+(leoPtAnswers[leoPtIndex]?'leo-feedback-correct':'leo-feedback-wrong');feedback.setAttribute('role','status');feedback.textContent=(leoPtAnswers[leoPtIndex]?'✓ Você acertou! ':'Vamos revisar. ')+q.why;leoPtBox.append(feedback);}
 if(answered&&!leoPtAnswers[leoPtIndex])leoPtBox.append(leoPtRecoveryPanel(leoPtIndex));
 const actions=document.createElement('div');actions.className='leo-practice-actions';
 if(answered){const next=document.createElement('button');next.type='button';next.textContent='Próxima questão →';next.addEventListener('click',()=>{leoPtIndex=(leoPtIndex+1)%leoPtQuestions.length;leoPtRender();leoBody.scrollTop=0;});actions.append(next);
 const help=document.createElement('button');help.type='button';help.textContent='💬 Peça ajuda ao Leo';help.addEventListener('click',()=>{leoReturnView='portuguese';leoShowView('chat');leoInput.value='Professor Leo, explique esta questão de interpretação: '+q.text+' Pergunta: '+q.question+' Resposta correta: '+q.choices[q.correct]+'.';leoInput.focus({preventScroll:true});});actions.append(help);}
 const restart=document.createElement('button');restart.type='button';restart.textContent='Recomeçar treino';restart.addEventListener('click',()=>{leoPtAnswers=Array(leoPtQuestions.length).fill(null);leoPtIndex=0;leoPtRecorded=false;leoPtRecoveryDone={};try{localStorage.removeItem(leoPtKey);}catch{}leoPtRender();});actions.append(restart);leoPtBox.append(actions);
 if(count===leoPtQuestions.length){const result=document.createElement('h4');result.textContent='📊 Resultado: '+score+' de '+leoPtQuestions.length+' acertos ('+Math.round(score/leoPtQuestions.length*100)+'%)';leoPtBox.append(result);}
 const history=document.createElement('div');history.className='leo-portuguese-history';const hh=document.createElement('h4');hh.textContent='📈 Histórico de Português';history.append(hh);
 if(!leoPtHistory.length){const p=document.createElement('p');p.textContent='Conclua a rodada para começar seu histórico.';history.append(p);}
 else{const bars=document.createElement('div');bars.className='leo-portuguese-bars';leoPtHistory.forEach((x,i)=>{const item=document.createElement('div');item.className='leo-portuguese-bar-item';const pct=Math.round(x.correct/x.total*100);const top=document.createElement('span');top.textContent=pct+'%';const track=document.createElement('div');track.className='leo-portuguese-bar-track';const fill=document.createElement('div');fill.className='leo-portuguese-bar-fill';fill.style.height=pct+'%';track.append(fill);const bottom=document.createElement('small');bottom.textContent=String(i+1);item.append(top,track,bottom);bars.append(item);});history.append(bars);}
 const note=document.createElement('small');note.textContent='Resultados demonstrativos salvos neste navegador, separados dos resultados de Matemática.';history.append(note);leoPtBox.append(history);
}
leoPtRender();

// Menu principal: cada modo ocupa uma tela própria, sem misturar aulas, treino e IA.
const leoBody=root.querySelector('.leo-body');
const leoMessage=root.querySelector('.leo-message');
const leoRecommendation=root.querySelector('.leo-recommend');
const leoAreaLabel=root.querySelector('label[for="leo-area"]');
const leoChat=root.querySelector('.leo-chat');
const leoMenu=document.createElement('section');
leoMenu.className='leo-menu';
leoMenu.innerHTML='<h3>O que vamos estudar hoje?</h3><p>Escolha como deseja aprender com o Professor Leo.</p>';
const leoViews=[
  ['lesson','📖 Aprender uma matéria','Aulas explicadas com exemplos e dicas.'],
  ['practice','🧮 Fazer exercícios de Matemática','Treino de Matemática com correção e reforço.'],
   ['portuguese','📖 Exercícios de Português','Interpretação de texto, correção e histórico de acertos.'],
  ['chat','💬 Conversar com o Professor Leo','Tire suas dúvidas com a IA em teste.']
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
let leoReturnView='practice';
let leoCurrentView='menu';
const leoResume=document.createElement('button');
leoResume.type='button';
leoResume.className='leo-talk';
leoResume.textContent='🧮 Voltar aos exercícios';
leoResume.setAttribute('aria-label','Retomar os exercícios sem perder o progresso');
root.querySelector('.leo-top').insertBefore(leoResume,root.querySelector('.leo-close'));
leoResume.addEventListener('click',()=>leoShowView(leoReturnView));
leoTalk.addEventListener('click',()=>{if(leoCurrentView==='practice'||leoCurrentView==='lesson'||leoCurrentView==='portuguese')leoReturnView=leoCurrentView;leoShowView('chat')});
leoBack.addEventListener('click',()=>leoShowView('menu'));
function leoShowView(view){
  const previousView=leoCurrentView;
  leoCurrentView=view;
  const menu=view==='menu';
  leoMenu.hidden=!menu;
  leoBack.hidden=menu;
  leoTalk.hidden=view==='chat';
  leoResume.hidden=view!=='chat';
  const isLesson=view==='lesson',isPractice=view==='practice',isChat=view==='chat',isPortuguese=view==='portuguese';
  leoMessage.hidden=true;
  leoRecommendation.hidden=!isLesson;
  leoAreaLabel.hidden=!isLesson;
  selector.hidden=!isLesson;
  lessonBox.hidden=!isLesson;
  leoPractice.hidden=!isPractice;
   leoPtBox.hidden=!isPortuguese;
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
selector.addEventListener('change',renderLesson);

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
  if(!/porcent|\\d+\\s*%/i.test(question+' '+answer))return;
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
