import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function client(fetch, extra={}){const sandbox={fetch,URL,...extra};vm.runInNewContext(readFileSync(new URL('../leo-client.js',import.meta.url),'utf8'),sandbox);return sandbox.DecolaLeoClient;}
const question={id:'porcentagem-q1',q:'Quanto é 20% de 150?',opts:['20','30','35'],answer:1,why:'150 × 0,20 = 30.'};
test('erro na primeira tentativa envia contexto completo sem gabarito ou resolução',()=>{
 const c=client();const context=c.questionContext(question,{choice:0,attempts:1,done:false});
 assert.equal(context.subject,'Matemática');assert.equal(context.topic,'Porcentagem');assert.equal(context.question,question.q);
 assert.deepEqual([...context.alternatives],question.opts);assert.equal(context.selectedAnswer,'20');assert.equal(context.correct,false);
 assert.equal(context.attempts,1);assert.equal(context.attemptsRemaining,1);assert.equal(context.mode,'hint');
 assert.equal('correctAnswer' in context,false);assert.equal('solution' in context,false);
 const message=c.explanationMessage(context,'Pode dizer a resposta?');assert.match(message,/NÃO revele/);assert.match(message,/Preserve a segunda tentativa/);assert.match(message,/Pode dizer a resposta/);
});
test('acerto na primeira tentativa permite resolução completa',()=>{
 const c=client();const state={choice:1,attempts:1,done:true};const before=JSON.stringify(state);const context=c.questionContext(question,state);
 assert.equal(context.mode,'solution');assert.equal(context.correct,true);assert.equal(context.correctAnswer,'30');assert.equal(context.solution,question.why);assert.equal(JSON.stringify(state),before);
});
test('erro após duas tentativas permite resolução e mantém informação do erro',()=>{
 const c=client();const ctx=c.questionContext(question,{choice:2,attempts:2,done:true});assert.equal(ctx.mode,'solution');assert.equal(ctx.correct,false);assert.equal(ctx.attemptsRemaining,0);assert.match(c.explanationMessage(ctx),/passo a passo/);
});
test('dados sem resposta, tentativa inválida ou escolha fora das alternativas são rejeitados',()=>{
 const c=client();for(const state of [undefined,{choice:null,attempts:1},{choice:20,attempts:1},{choice:0,attempts:0}])assert.throws(()=>c.questionContext(question,state));
});
test('transporte conserva contrato do Worker, aliases, histórico curto e AbortSignal',async()=>{
 const calls=[];const c=client(async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({resposta:'Resposta controlada de TESTE'})};});
 const controller=new AbortController();const history=Array.from({length:12},(_,i)=>({role:i%2?'assistant':'user',content:'item'+i}));
 assert.equal(await c.request({message:'contexto completo',alternateMessage:'alias legado',history,signal:controller.signal}),'Resposta controlada de TESTE');
 const {url,options}=calls[0],body=JSON.parse(options.body);assert.equal(url,'https://professor-leo-api.ricardocustodio-rc1.workers.dev/chat');assert.equal(options.method,'POST');
 assert.equal(body.message,'contexto completo');assert.equal(body.mensagem,'alias legado');assert.deepEqual(body.history,history.slice(-8));assert.deepEqual(body.historico,body.history);assert.equal(options.signal,controller.signal);
});
test('perguntas complementares repetem a regra pedagógica e enviam histórico',async()=>{
 const bodies=[];const c=client(async(_url,options)=>{bodies.push(JSON.parse(options.body));return {ok:true,json:async()=>({answer:'TESTE, não IA'})};});
 const context=c.questionContext(question,{choice:0,attempts:1});const first=c.explanationMessage(context);const reply=await c.request({message:first});
 await c.request({message:c.explanationMessage(context,'Por que dividir por 100?'),history:[{role:'user',content:first},{role:'assistant',content:reply}]});
 assert.match(bodies[1].message,/NÃO revele/);assert.match(bodies[1].message,/Por que dividir por 100/);assert.equal(bodies[1].history.length,2);assert.equal(bodies[1].mensagem,bodies[1].message);
});
test('resposta vazia, erro HTTP e falha de rede não viram resposta simulada',async()=>{
 for(const fetch of [async()=>({ok:true,json:async()=>({})}),async()=>({ok:false,json:async()=>({error:'internal'})}),async()=>{throw new Error('network');}])await assert.rejects(()=>client(fetch).request({message:'teste'}));
});
test('cancelamento é propagado ao chamador',async()=>{
 const controller=new AbortController();const c=client(async(_url,{signal})=>{if(signal.aborted)throw new DOMException('aborted','AbortError');});controller.abort();await assert.rejects(()=>c.request({message:'teste',signal:controller.signal}),{name:'AbortError'});
});
test('negação explícita de origem é diferente de autenticação e indisponibilidade',async()=>{
 const cases=[
  [403,{error:'Origem não permitida'},'origin_denied'],[401,{error:'Unauthorized'},'authorization'],
  [403,{error:'Unauthorized'},'authorization'],[404,{},'endpoint'],[429,{},'rate_limit'],
  [500,{error:'internal'},'service'],[504,{},'timeout'],[400,{},'invalid_request'],
  [500,{code:'missing_api_key',error:'configuration'},'configuration']
 ];
 for(const [status,data,code] of cases){
  const c=client(async()=>({status,ok:false,json:async()=>data}));
  await assert.rejects(()=>c.request({message:'teste'}),error=>error.code===code&&error.status===status);
 }
});
test('resposta não JSON em HTTP 500 continua identificada como falha do serviço',async()=>{
 const c=client(async()=>({status:500,ok:false,json:async()=>{throw new Error('HTML');}}));
 await assert.rejects(()=>c.request({message:'teste'}),error=>error.code==='service');
});
test('offline é explícito; falha fetch online admite conexão ou CORS sem inventar causa',async()=>{
 const fetch=async()=>{throw new TypeError('Failed to fetch');};
 await assert.rejects(()=>client(fetch,{navigator:{onLine:false}}).request({message:'teste'}),e=>e.code==='offline');
 await assert.rejects(()=>client(fetch,{navigator:{onLine:true}}).request({message:'teste'}),e=>e.code==='connection'&&e.message.includes('não é possível distinguir'));
});
test('endpoint inválido ou contendo credenciais é recusado antes de usar a rede',async()=>{
 let count=0;
 for(const endpoint of ['', 'http://example.test/chat','https://user:pass@example.test/chat']){
  await assert.rejects(()=>client(async()=>{count++;},{DecolaLeoConfig:{endpoint}}).request({message:'teste'}),e=>e.code==='configuration');
 }
 assert.equal(count,0);
});
test('não revela corpo ou mensagem interna arbitrária do backend',async()=>{
 const c=client(async()=>({status:500,ok:false,json:async()=>({error:'sensitive_internal_detail'})}));
 await assert.rejects(()=>c.request({message:'teste'}),e=>!c.errorMessage(e).includes('sensitive_internal_detail'));
});
test('aviso de arquivo local não afirma que apenas usar localhost resolve autorização',()=>{
 const local=client(undefined,{location:{protocol:'file:'}});assert.match(local.environmentNotice(),/não concede essa autorização/);
 assert.equal(client(undefined,{location:{protocol:'https:'}}).environmentNotice(),'');
});
test('tempo limite explícito é diferenciado de cancelamento',async()=>{
 const c=client(async()=>{throw new DOMException('tempo','TimeoutError');});
 await assert.rejects(()=>c.request({message:'teste'}),e=>e.code==='timeout');
});
test('HTTP 200 contendo erro não é apresentado como uma resposta da IA',async()=>{
 const c=client(async()=>({status:200,ok:true,json:async()=>({error:'upstream failure',message:'não é explicação'})}));
 await assert.rejects(()=>c.request({message:'teste'}),e=>e.code==='api_error');
});
test('dica local do primeiro erro usa orientação sem gabarito, sem rede e sem alterar tentativa',()=>{
 const c=client(()=>{throw new Error('Não deve chamar rede');});
 const q={...question,hints:['Transforme 20% em decimal antes de multiplicar.','Dobre 10% do total.']};
 const state={choice:0,attempts:1,done:false},before=JSON.stringify(state);
 const help=c.localGuidance(q,state);
 assert.equal(help.mode,'hint');assert.match(help.title,/sem IA/);assert.match(help.text,/primeiro passo/);
 assert.equal(help.text.includes(q.why),false);assert.equal(help.text.includes('Resposta de referência'),false);assert.equal(JSON.stringify(state),before);
});
test('resolução local só é liberada após acerto ou esgotamento de tentativas',()=>{
 const c=client();for(const state of [{choice:1,attempts:1,done:true},{choice:0,attempts:2,done:true}]){
  const help=c.localGuidance(question,state);assert.equal(help.mode,'solution');assert.match(help.title,/sem IA/);assert.match(help.text,/Resposta de referência: 30/);assert.ok(help.text.includes(question.why));
 }
});
test('orientação local não altera contexto ou instruções enviados à IA',()=>{
 const c=client(),state={choice:0,attempts:1},before=c.explanationMessage(c.questionContext(question,state));
 c.localGuidance(question,state);assert.equal(c.explanationMessage(c.questionContext(question,state)),before);
});
