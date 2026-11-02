import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import net from 'node:net';
import {fileURLToPath} from 'node:url';
import {runStage2B} from '../etapa2b-runner.mjs';

// Never construct SDK/pg transports. Fixture strings are NOT credentials.
const envVars={DECOLA_TEST_PROJECT_ID:'yxxrfhobhonigwczzpim',DECOLA_TEST_CREATE:'YES',DECOLA_TEST_RUN:'YES',
 DECOLA_TEST_DATABASE_URL:'postgresql://fixture:NOT_A_REAL_PASSWORD@db.yxxrfhobhonigwczzpim.supabase.co/postgres',
 SUPABASE_SERVICE_ROLE_KEY:'FIXTURE_NOT_A_KEY',SUPABASE_PUBLISHABLE_KEY:'FIXTURE_NOT_A_KEY',
 DECOLA_HORIZONTE_EMAIL:'horizonte@example.invalid',DECOLA_ESTRELA_EMAIL:'estrela@example.invalid',
 DECOLA_HORIZONTE_PASSWORD:'FIXTURE_NOT_A_REAL_PASSWORD_1',DECOLA_ESTRELA_PASSWORD:'FIXTURE_NOT_A_REAL_PASSWORD_2'};
const SECRET='SENTINEL_PROVIDER_ERROR_MUST_NOT_BE_LOGGED';
const originalConnect=net.Socket.prototype.connect,originalFetch=globalThis.fetch;
net.Socket.prototype.connect=function(){throw Error('NETWORK_FORBIDDEN_IN_TEST');};
globalThis.fetch=()=>{throw Error('NETWORK_FORBIDDEN_IN_TEST');};
test.after(()=>{net.Socket.prototype.connect=originalConnect;globalThis.fetch=originalFetch;});

function dependencies(failure=''){
 let state={users:[{id:'unrelated-existing-user',email:'unrelated@example.invalid'}],accounts:[],students:[],trials:[],progress:[]};
 const calls=[],logs=[];let snapshot=null,sub=null,createCount=0,linkCount=0;
 const logger={log:(...x)=>logs.push(x.join(' ')),error:(...x)=>logs.push(x.join(' '))};
 const fail=()=>{throw Error(SECRET);};
 const rows=value=>({rows:value,rowCount:value.length});
 const db={async query(sql,params=[]){
  calls.push({sql,params:structuredClone(params)});const q=sql.toLowerCase();
  if(q==='begin'){snapshot=structuredClone(state);return rows([]);}
  if(q==='commit'){snapshot=null;sub=null;return rows([]);}
  if(q==='rollback'){if(snapshot){state=snapshot;snapshot=null;}sub=null;return rows([]);}
  if(q.startsWith('set local role'))return rows([]);
  if(q.includes("set_config('request.jwt.claim.sub'")){sub=params[0];return rows([]);}
  if(q.includes('set_config('))return rows([]);
  if(q.includes('current_database()'))return rows([{db:'fixture-db',role:'fixture-role'}]);
  if(q==='select count(*)::int as n from decola.accounts')return rows([{n:state.accounts.length}]);
  if(q.startsWith('select count(*)'))return rows([{n:0}]);
  if(q.startsWith('insert into decola.accounts')){state.accounts.push(params[0]);return rows([]);}
  if(q.startsWith('insert into decola.students')){linkCount++;if(failure==='link'&&linkCount===2)fail();state.students.push({id:params[0],account:params[1]});return rows([]);}
  if(q.startsWith('delete from')){
   if(failure==='cleanup-db')fail();
   const owned=state.students.filter(s=>params[0].includes(s.account)).map(s=>s.id);
   if(q.startsWith('delete from decola.lesson_progress'))state.progress=state.progress.filter(p=>!owned.includes(p.student));
   if(q.startsWith('delete from decola.trial_claims'))state.trials=state.trials.filter(t=>!owned.includes(t.student));
   if(q.startsWith('delete from decola.students'))state.students=state.students.filter(s=>!params[0].includes(s.account));
   if(q.startsWith('delete from decola.accounts'))state.accounts=state.accounts.filter(id=>!params[0].includes(id));
   return rows([]);
  }
  if(q.includes('has_table_privilege'))return rows([{allowed:false}]);
  if(q.startsWith('select id from decola.students'))return rows(state.students.filter(s=>s.account===sub&&(!params.length||s.id===params[0])).map(s=>({id:s.id})));
  if(q.includes('decola.request_trial')){
   let trial=state.trials.find(t=>t.student===params[0]);if(!trial){trial={student:params[0],startsAt:'2026-11-02T12:00:00Z',endsAt:'2026-11-09T12:00:00Z'};state.trials.push(trial);}return rows([{trial:{startsAt:trial.startsAt,endsAt:trial.endsAt}}]);
  }
  if(q.includes('decola.can_study')){const trial=state.trials.find(t=>t.student===params[0]);return rows([{allowed:!!trial&&!trial.expired&&!trial.canceled}]);}
  if(q.startsWith('update decola.trial_claims')){state.trials.find(t=>t.student===params[0]).expired=true;return rows([]);}
  if(q.startsWith('insert into decola.lesson_progress')){state.progress.push({student:params[0]});return rows([]);}
  if(q.startsWith('select * from decola.lesson_progress')){const own=state.students.filter(s=>s.account===sub).map(s=>s.id);return rows(state.progress.filter(p=>own.includes(p.student)));}
  if(q.includes('decola.cancel_trial')){state.trials.find(t=>t.student===params[0]).canceled=true;return rows([]);}
  throw Error('UNSUPPORTED_TEST_QUERY');
 },release(){calls.push({release:true});}};
 class Pool{constructor(){calls.push({poolConstructed:true});}async connect(){if(failure==='connect')fail();return db;}async end(){calls.push({poolEnded:true});if(failure==='pool-close')fail();}}
 function createClient(){calls.push({clientConstructed:true});return {auth:{admin:{
  async listUsers(){if(failure==='preflight')fail();return {data:{users:failure==='existing'?[{id:'already-there',email:envVars.DECOLA_HORIZONTE_EMAIL}]:state.users}};},
  async createUser(input){createCount++;calls.push({create:input.email});if(['create','cleanup-db','cleanup-auth'].includes(failure)&&createCount===2)return {data:null,error:{message:SECRET}};const user={id:`fixture-user-${createCount}`,email:input.email};state.users.push(user);return {data:{user}};},
  async deleteUser(id){calls.push({deleteUser:id});if(failure==='cleanup-auth')return {error:{message:SECRET}};state.users=state.users.filter(u=>u.id!==id);return {};}
 },async signInWithPassword({email}){if(failure==='login')return {error:{message:SECRET}};return {data:{user:state.users.find(u=>u.email===email),session:{access_token:'FIXTURE_TOKEN'}}};}}};}
 return {options:{mode:'run',adapterMode:'injected-test-doubles',envVars,createClient,Pool,logger},calls,logs,state:()=>structuredClone(state)};
}

test('check original não instancia clientes nem pool',async()=>{
 const d=dependencies();const result=await runStage2B({...d.options,mode:'check'});assert.equal(result.status,'checked');assert.equal(d.calls.length,0);
});
test('guardas de projeto, URL, modo, gates e dependências bloqueiam antes de conexão',async()=>{
 for(const change of [{mode:'unknown'},{adapterMode:'real'},{envVars:{...envVars,DECOLA_TEST_PROJECT_ID:'wrong'}},{envVars:{...envVars,SUPABASE_URL:'https://wrong.invalid'}},{envVars:{...envVars,DECOLA_TEST_CREATE:'NO'}},{envVars:{...envVars,DECOLA_TEST_RUN:'NO'}},{envVars:{...envVars,DECOLA_TEST_DATABASE_URL:'postgresql://x:y@wrong.invalid/db'}},{envVars:{...envVars,DECOLA_ESTRELA_PASSWORD:'short'}},{envVars:{...envVars,SUPABASE_PUBLISHABLE_KEY:''}},{envVars:{...envVars,DECOLA_TEST_DATABASE_URL:envVars.DECOLA_TEST_DATABASE_URL+'?host=attacker.invalid'}},{envVars:{...envVars,DECOLA_ESTRELA_EMAIL:envVars.DECOLA_HORIZONTE_EMAIL.toUpperCase()}}]){
  const d=dependencies();await assert.rejects(runStage2B({...d.options,...change}));assert.equal(d.calls.length,0);
 }
});
test('executor original completa todos os contratos offline sem rede',async()=>{
 const d=dependencies();const result=await runStage2B(d.options);assert.equal(result.status,'passed');assert.equal(result.created,2);assert.equal(d.state().students.length,2);assert.equal(d.state().users.length,3);assert.equal(d.calls.filter(c=>c.deleteUser).length,0);assert.equal(d.calls.at(-1).poolEnded,true);
});
test('falha ao conectar não cria usuários e sempre fecha pool',async()=>{
 const d=dependencies('connect'),result=await runStage2B(d.options);assert.equal(result.failurePhase,'connect');assert.equal(d.calls.filter(c=>c.create).length,0);assert.equal(d.calls.at(-1).poolEnded,true);
});
test('falha no preflight e identidade existente abortam antes da primeira criação',async()=>{
 for(const failure of ['preflight','existing']){const d=dependencies(failure),result=await runStage2B(d.options);assert.equal(result.status,'failed');assert.equal(d.calls.filter(c=>c.create).length,0);assert.equal(d.state().users.length,1);}
});
test('segunda criação falha: remove somente o ID criado nesta execução',async()=>{
 const d=dependencies('create'),result=await runStage2B(d.options);assert.equal(result.failurePhase,'auth-create');assert.equal(result.cleanup,'completed');assert.deepEqual(d.calls.filter(c=>c.deleteUser).map(c=>c.deleteUser),['fixture-user-1']);assert.equal(d.state().users[0].id,'unrelated-existing-user');
});
test('falha na vinculação reverte transação e compensa os dois usuários criados',async()=>{
 const d=dependencies('link'),result=await runStage2B(d.options);assert.equal(result.failurePhase,'fixture-link');assert.equal(result.cleanup,'completed');assert.deepEqual(d.state().accounts,[]);assert.deepEqual(d.state().students,[]);assert.deepEqual(d.calls.filter(c=>c.deleteUser).map(c=>c.deleteUser),['fixture-user-1','fixture-user-2']);
});
test('falha no login remove fixtures vinculadas sem tocar usuário preexistente',async()=>{
 const d=dependencies('login'),result=await runStage2B(d.options);assert.equal(result.failurePhase,'login');assert.equal(result.cleanup,'completed');assert.equal(d.state().users.length,1);assert.equal(d.state().students.length,0);
});
test('falha de limpeza SQL não apaga identidades Auth nem relata sucesso',async()=>{
 const d=dependencies('cleanup-db'),result=await runStage2B(d.options);assert.equal(result.status,'failed');assert.equal(result.cleanup,'incomplete');assert.equal(d.calls.filter(c=>c.deleteUser).length,0);assert.match(d.logs.join('\n'),/CLEANUP INCOMPLETE/);
});
test('falha de limpeza Auth é registrada e exige reconciliação manual',async()=>{
 const d=dependencies('cleanup-auth'),result=await runStage2B(d.options);assert.equal(result.cleanup,'incomplete');assert.equal(d.state().users.length,2);assert.match(d.logs.join('\n'),/CLEANUP INCOMPLETE/);
});
test('falha no encerramento não é apresentada como validação completa',async()=>{
 const d=dependencies('pool-close'),result=await runStage2B(d.options);assert.equal(result.status,'failed');assert.equal(result.resourceClose,'failed');
});
test('erros externos não vazam mensagens, credenciais ou tokens nos logs',async()=>{
 for(const failure of ['create','link','login','cleanup-db','cleanup-auth','pool-close']){const d=dependencies(failure);await runStage2B(d.options);const logs=d.logs.join('\n');for(const value of [SECRET,envVars.SUPABASE_SERVICE_ROLE_KEY,envVars.DECOLA_TEST_DATABASE_URL,envVars.DECOLA_HORIZONTE_PASSWORD,'FIXTURE_TOKEN'])assert.equal(logs.includes(value),false);}
});
test('ambos os CLIs rejeitam criação mesmo com gates ambientais habilitados',()=>{
 for(const [file,mode]of [['etapa2b-runner.mjs','run'],['etapa2b-auth.mjs','create']]){
  const result=spawnSync(process.execPath,[fileURLToPath(new URL('../'+file,import.meta.url)),mode],{encoding:'utf8',env:{PATH:process.env.PATH,DECOLA_TEST_PROJECT_ID:envVars.DECOLA_TEST_PROJECT_ID,DECOLA_TEST_CREATE:'YES',DECOLA_TEST_RUN:'YES'}});
  assert.equal(result.status,2);assert.match(result.stderr,/BLOCKED/);
 }
});
