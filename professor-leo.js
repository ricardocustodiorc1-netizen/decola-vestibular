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
<div class="leo-body"><p class="leo-message">Olá! Vamos estudar juntos? Escolha uma matéria e faremos uma explicação e um exercício. Você pode praticar com os exercícios demonstrativos ou fazer uma pergunta à IA.</p><p class="leo-recommend" aria-live="polite"></p><label for="leo-area">Escolha uma área de estudo</label><select id="leo-area"></select><div class="leo-lesson" aria-live="polite"></div><div class="leo-chat"><label for="leo-question-input">Pergunte ao Professor Leo (IA em teste)</label><textarea id="leo-question-input" rows="3" maxlength="700" placeholder="Ex.: Pode me explicar porcentagem com um exemplo do ENEM?"></textarea><button type="button" class="leo-ask">Enviar pergunta</button><p class="leo-ai-status" role="status" aria-live="polite"></p><p class="leo-ai-answer"></p></div></div>
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
launch.addEventListener('click',()=>{panel.hidden=!panel.hidden;launch.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden){recommend();renderLesson();selector.focus();}});
root.querySelector('.leo-close').addEventListener('click',()=>{panel.hidden=true;launch.setAttribute('aria-expanded','false');launch.focus();});
selector.addEventListener('change',renderLesson);

// Integração segura: a chave da OpenAI permanece somente no Cloudflare Worker.
const leoAsk=root.querySelector('.leo-ask');
const leoInput=root.querySelector('#leo-question-input');
const leoAiStatus=root.querySelector('.leo-ai-status');
const leoAiAnswer=root.querySelector('.leo-ai-answer');
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
