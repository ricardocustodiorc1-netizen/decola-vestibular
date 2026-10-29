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
let leoReinforcementAnswers={};
// Desafios progressivos demonstrativos, escolhidos conforme a pontuação da rodada.
const leoChallenges=[
 {level:'Fácil',question:'Quanto é 10% de 90?',choices:['9','19','90'],correct:0,explanation:'10% é um décimo: 90 ÷ 10 = 9.'},
 {level:'Médio',question:'Um tênis de R$ 240 recebeu desconto de 15%. Quanto custa agora?',choices:['R$ 204','R$ 225','R$ 216'],correct:0,explanation:'15% de 240 = 36. Preço final: 240 − 36 = R$ 204.'},
 {level:'Difícil',question:'Um produto aumentou 20% e depois teve desconto de 20%. Em relação ao preço inicial, o valor final:',choices:['Ficou igual','Caiu 4%','Subiu 4%'],correct:1,explanation:'Se custava 100, sobe para 120 e cai 20% de 120 (=24): termina em 96, 4% abaixo do inicial.'}
];
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
    leoPracticeAnswers=Array(leoPracticeQuestions.length).fill(null);
    leoReinforcementAnswers={};
    leoChallengeResult=null;
    leoRoundRecorded=false;
    leoPracticeIndex=0;
    try{localStorage.removeItem(leoPracticeKey);}catch{}
    renderLeoPractice();
  });
  if(answered && leoPracticeAnswers[leoPracticeIndex]===false){
    const askTeacher=document.createElement('button');
    askTeacher.type='button';
    askTeacher.textContent='🎓 Professor Leo, me explique melhor';
    askTeacher.addEventListener('click',()=>{
      const input=root.querySelector('#leo-question-input');
      input.value='Errei esta questão: '+item.question+' Pode explicar passo a passo, com uma dica para eu aprender?';
      root.querySelector('.leo-ai-status').textContent='Sua dúvida está pronta. Clique em Enviar pergunta para conversar com a IA.';
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
      report.append(title,score,bar,guidance,heading,list,tip);
    }else{report.append(title,score,bar,guidance);}
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
  const note=document.createElement('small');note.textContent='Exercícios demonstrativos. O progresso fica salvo apenas neste navegador.';
  leoPractice.append(heading,progress,question,choices,feedback,controls);
  if(reinforcementBox)leoPractice.append(reinforcementBox);
  leoPractice.append(report,note);
}
renderLeoPractice();
selector.addEventListener('change',renderLeoPractice);
launch.addEventListener('click',()=>{panel.hidden=false;launch.hidden=true;launch.setAttribute('aria-expanded','true');recommend();renderLesson();root.querySelector('.leo-close').focus();});
root.querySelector('.leo-close').addEventListener('click',()=>{panel.hidden=true;launch.hidden=false;launch.setAttribute('aria-expanded','false');launch.focus();});
selector.addEventListener('change',renderLesson);

// Integração segura: a chave da OpenAI permanece somente no Cloudflare Worker.
const leoAsk=root.querySelector('.leo-ask');
const leoInput=root.querySelector('#leo-question-input');
const leoAiStatus=root.querySelector('.leo-ai-status');
const leoAiAnswer=root.querySelector('.leo-ai-answer');
root.querySelector('.leo-new-question').addEventListener('click',()=>{
  leoInput.value='';
  leoAiStatus.textContent='Digite sua próxima dúvida. A resposta anterior continua disponível abaixo.';
  leoInput.focus();
});
let leoBusy=false;
let leoLastRequest=0;
leoAsk.addEventListener('click',async()=>{
  const question=leoInput.value.trim();
  if(!question){leoAiStatus.textContent='Escreva sua dúvida antes de enviar.';return;}
  if(leoBusy)return;
  if(Date.now()-leoLastRequest<15000){leoAiStatus.textContent='Aguarde alguns segundos antes de enviar outra pergunta.';return;}
  leoBusy=true;leoLastRequest=Date.now();leoAsk.disabled=true;
  leoAiAnswer.textContent='';leoAiStatus.textContent='Professor Leo está preparando a explicação…';
  try{
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),25000);
    let response;
    try{response=await fetch('https://professor-leo-api.ricardocustodio-rc1.workers.dev/chat',{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:question,mensagem:question}),signal:controller.signal
    });}finally{clearTimeout(timer);}
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||'Não foi possível obter uma resposta.');
    const answer=data.answer||data.resposta||data.reply||data.message;
    if(typeof answer!=='string'||!answer.trim())throw new Error('A resposta veio vazia.');
    leoAiAnswer.textContent=answer;leoAiStatus.textContent='Resposta do Professor Leo:';
  }catch(error){leoAiStatus.textContent='A IA ainda não conseguiu responder: '+(error.name==='AbortError'?'tempo de espera esgotado':error.message)+'. Você pode continuar usando os exercícios acima.';}
  finally{leoBusy=false;leoAsk.disabled=false;}
});
