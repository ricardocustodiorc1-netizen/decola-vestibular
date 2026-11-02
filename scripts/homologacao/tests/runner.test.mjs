import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {randomUUID} from 'node:crypto';
import {spawnSync,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {LocalLedger,PROJECT,ORGANIZATION,STATES,assertTransition} from '../controls/ledger.mjs';
import {ControlledExecutor} from '../controls/executor.mjs';
import {createOfflineAdapter} from '../controls/offline-adapter.mjs';
import {runStage2B} from '../etapa2b-runner.mjs';
const connect=net.Socket.prototype.connect,fetch=globalThis.fetch;
net.Socket.prototype.connect=function(){throw Error('NETWORK_FORBIDDEN');};globalThis.fetch=()=>{throw Error('NETWORK_FORBIDDEN');};
test.after(()=>{net.Socket.prototype.connect=connect;globalThis.fetch=fetch;});
const temporary=[];
function setup({clock,limits,authorized=true}={}){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'decola-controls-'));temporary.push(dir);
 const ledger=new LocalLedger(dir,{clock});const run=ledger.create({limits});const lease=ledger.claim(run);
 if(authorized)ledger.authorize(lease,randomUUID());
 return {dir,ledger,run,lease,executor:new ControlledExecutor(ledger,lease)};
}
test.after(()=>{for(const dir of temporary)fs.rmSync(dir,{recursive:true,force:true});});
const envVars={DECOLA_TEST_PROJECT_ID:PROJECT};
const resource=(f,kind='auth',id=randomUUID())=>({kind,id,runId:f.run,projectId:PROJECT});
async function createOne(f,key='create:horizonte'){
 const r=resource(f);const out=await f.executor.invoke({key,kind:'create',call:()=>({resources:[r]})});assert.equal(out.status,'confirmed');return r;
}
async function ready(){const f=setup();const result=await runStage2B({...f,mode:'run',envVars,adapter:createOfflineAdapter()});assert.equal(result.status,'offline-contracts-ready');return f;}
async function cleanupReady(){const f=await ready();await f.executor.sessionControls(()=>({refreshRevoked:true,accessDenied:true,evidenceRef:randomUUID()}));f.ledger.retain(f.lease,randomUUID());const plan=f.ledger.planCleanup(f.lease);return {...f,plan};}

test('commit 2C está presente no histórico local',()=>{
 const r=spawnSync('git',['cat-file','-t','46f096bf2717ee95ea89064f74fd2d3d9971d51a'],{encoding:'utf8'});assert.equal(r.status,0);assert.equal(r.stdout.trim(),'commit');
});
test('13 estados definidos e transições perigosas rejeitadas',()=>{
 assert.equal(STATES.length,13);for(const from of STATES)assert.throws(()=>assertTransition(from,from));
 assert.doesNotThrow(()=>assertTransition('planned','authorized'));assert.throws(()=>assertTransition('planned','cleaned'));assert.throws(()=>assertTransition('auth_unknown','create_pending'));assert.throws(()=>assertTransition('cleaned','authorized'));
});
test('alvo errado e limites inválidos são rejeitados',()=>{
 const f=setup();assert.throws(()=>f.ledger.create({projectId:'wrong'}));assert.throws(()=>f.ledger.create({organizationId:'wrong'}));
 for(const limits of [{maxCalls:0},{maxConcurrency:3},{maxAttempts:6},{durationMs:0},{timeoutMs:60001},{secret:'not-allowed'}])assert.throws(()=>f.ledger.create({limits}));f.ledger.close();
});
test('ledger persiste após fechar/reabrir e usa permissões privadas',async()=>{
 const f=setup();const r=await createOne(f);f.ledger.close();const reopened=new LocalLedger(f.dir);const d=reopened.inspect(f.run);
 assert.equal(d.resources[0].id,r.id);assert.equal(d.operations[0].status,'confirmed');assert.equal(fs.statSync(reopened.file).mode&0o777,0o600);assert.equal(fs.statSync(f.dir).mode&0o777,0o700);reopened.close();
});
test('novo run ID é exclusivo',()=>{const f=setup();assert.notEqual(f.ledger.create(),f.run);f.ledger.close();});
test('não executa antes de autorização e não aceita referência falsa',()=>{const f=setup({authorized:false});assert.throws(()=>f.ledger.authorize(f.lease,'YES'));assert.throws(()=>f.ledger.begin(f.lease,{key:'create:horizonte',kind:'create'}));f.ledger.close();});
test('lock de projeto impede segundo proprietário e outro run',()=>{const f=setup();const second=f.ledger.create();assert.throws(()=>f.ledger.claim(f.run),/PROJECT_BUSY/);assert.throws(()=>f.ledger.claim(second),/PROJECT_BUSY/);f.ledger.close();});
test('heartbeat estende lease e owner antigo é cercado após takeover',()=>{
 let now=1000;const f=setup({clock:()=>now});f.ledger.heartbeat(f.lease,50);now+=49;assert.doesNotThrow(()=>f.ledger.checkLease(f.lease));now+=2;
 const next=f.ledger.claim(f.run);assert.throws(()=>f.ledger.checkLease(f.lease),/STALE_LEASE/);assert.equal(f.ledger.inspect(f.run).state,'reconcile_required');f.ledger.checkLease(next);f.ledger.close();
});
test('lease expirado não permite iniciar run diferente ainda não reconciliado',()=>{let now=1000;const f=setup({clock:()=>now});const other=f.ledger.create();now+=31000;assert.throws(()=>f.ledger.claim(other),/PREVIOUS_RUN_UNRECONCILED/);f.ledger.close();});
test('interrupção deixa intenção durável e takeover a transforma em auth_unknown',()=>{
 let now=1000;const f=setup({clock:()=>now});f.ledger.begin(f.lease,{key:'create:horizonte',kind:'create'});f.ledger.close();now+=31000;
 const ledger=new LocalLedger(f.dir,{clock:()=>now});const lease=ledger.claim(f.run);const d=ledger.inspect(f.run);assert.equal(d.state,'auth_unknown');assert.equal(d.operations[0].status,'unknown');assert.throws(()=>ledger.begin(lease,{key:'create:horizonte',kind:'create'}),/NOT_RETRYABLE/);ledger.close();
});
test('processo morto por SIGKILL preserva intenção gravada antes da chamada',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'decola-crash-'));temporary.push(dir);
 const moduleUrl=new URL('../controls/ledger.mjs',import.meta.url).href;
 const code=`import {LocalLedger} from ${JSON.stringify(moduleUrl)};import {randomUUID} from 'node:crypto';const l=new LocalLedger(${JSON.stringify(dir)},{clock:()=>1000});const id=l.create();const lease=l.claim(id,{leaseMs:1});l.authorize(lease,randomUUID());l.begin(lease,{key:'create:horizonte',kind:'create'});process.stdout.write(id);process.kill(process.pid,'SIGKILL');`;
 const child=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8'});assert.equal(child.signal,'SIGKILL');const id=child.stdout.trim();const l=new LocalLedger(dir,{clock:()=>1002});l.claim(id);assert.equal(l.inspect(id).state,'auth_unknown');l.close();
});
test('dois processos concorrentes não adquirem o mesmo projeto',async()=>{
 const f=setup({authorized:false});f.ledger.release(f.lease);f.ledger.close();
 const moduleUrl=new URL('../controls/ledger.mjs',import.meta.url).href;
 const code=`import {LocalLedger} from ${JSON.stringify(moduleUrl)};const l=new LocalLedger(${JSON.stringify(f.dir)});try{l.claim(${JSON.stringify(f.run)});console.log('won');}catch{console.log('blocked');}finally{l.close();}`;
 const run=promisify(execFile);const results=await Promise.all([run(process.execPath,['--input-type=module','-e',code]),run(process.execPath,['--input-type=module','-e',code])]);assert.deepEqual(results.map(r=>r.stdout.trim()).sort(),['blocked','won']);
});
test('executor integra controles com adapter offline conhecido e não cria usuário remoto',async()=>{const f=await ready();assert.equal(f.ledger.inspect(f.run).state,'testing');assert.equal(f.ledger.inspect(f.run).resources.length,6);f.ledger.close();});
test('SDK/pool reais ou objeto que apenas diz offline não são aceitos pelo runner',async()=>{const f=setup();await assert.rejects(runStage2B({...f,mode:'run',envVars,adapter:{mode:'offline'}}),/CONTROLLED_OFFLINE/);f.ledger.close();});
test('tentativa de executar o mesmo cenário novamente é bloqueada',async()=>{const f=await ready();await assert.rejects(runStage2B({...f,mode:'run',envVars,adapter:createOfflineAdapter()}),/RUN_NOT_FRESH/);f.ledger.close();});
test('resposta desconhecida de criação bloqueia escrita e repetição automática',async()=>{
 const f=setup();let calls=0;const r=await f.executor.invoke({key:'create:horizonte',kind:'create',call:()=>{calls++;throw Error('SECRET_PROVIDER_RESPONSE');}});
 assert.equal(r.status,'reconcile-required');assert.equal(f.ledger.inspect(f.run).state,'auth_unknown');assert.throws(()=>f.ledger.begin(f.lease,{key:'create:estrela',kind:'create'}),/RECONCILIATION/);await assert.rejects(f.executor.invoke({key:'create:horizonte',kind:'create',call:()=>{calls++;}}));assert.equal(calls,1);assert.equal(JSON.stringify(f.ledger.inspect(f.run)).includes('SECRET_PROVIDER_RESPONSE'),false);f.ledger.close();
});
test('timeout e confirmação tardia não transformam unknown em sucesso',async()=>{
 const f=setup({limits:{timeoutMs:5}});let effect=false;
 const r=await f.executor.invoke({key:'create:horizonte',kind:'create',call:async()=>{await new Promise(resolve=>setTimeout(resolve,25));effect=true;return {resources:[resource(f)]};}});
 assert.equal(r.status,'reconcile-required');await new Promise(resolve=>setTimeout(resolve,30));assert.equal(effect,true);assert.equal(f.ledger.inspect(f.run).operations[0].status,'unknown');assert.equal(f.ledger.inspect(f.run).resources.length,0);f.ledger.close();
});
test('criação parcial fica inventariada, sem exclusão automática',async()=>{
 const f=setup();const r=await runStage2B({...f,mode:'run',envVars,adapter:createOfflineAdapter({failure:'create-second'})});assert.equal(r.status,'reconcile-required');const d=f.ledger.inspect(f.run);assert.equal(d.resources.length,1);assert.equal(d.state,'auth_unknown');assert.throws(()=>f.ledger.planCleanup(f.lease));f.ledger.close();
});
test('falhas de vínculo, COMMIT e ROLLBACK permanecem link_unknown sem limpeza',async()=>{
 for(const failure of ['link','commit','rollback']){const f=setup();await runStage2B({...f,mode:'run',envVars,adapter:createOfflineAdapter({failure})});const d=f.ledger.inspect(f.run);assert.equal(d.state,'link_unknown');assert.equal(d.resources.length,2);assert.throws(()=>f.ledger.planCleanup(f.lease));f.ledger.close();}
});
test('falha de conexão fica registrada como read failed, sem criação',async()=>{const f=setup();const r=await runStage2B({...f,mode:'run',envVars,adapter:createOfflineAdapter({failure:'connect'})});assert.equal(r.status,'reconcile-required');assert.equal(f.ledger.inspect(f.run).operations[0].status,'failed');assert.equal(f.ledger.inspect(f.run).resources.length,0);f.ledger.close();});
test('identidade preexistente é protegida e nunca incluída em limpeza',async()=>{
 const f=setup();await runStage2B({...f,mode:'run',envVars,adapter:createOfflineAdapter({preexisting:true})});assert.equal(f.ledger.inspect(f.run).resources[0].origin,'preexisting');assert.throws(()=>f.ledger.planCleanup(f.lease),/NO_OWNED/);f.ledger.close();
});
test('reconciliação exige referência e prova de run/projeto antes de adotar ID',async()=>{
 const f=setup();const r=await f.executor.invoke({key:'create:horizonte',kind:'create',call:()=>{throw Error();}});
 assert.throws(()=>f.ledger.reconcile(f.lease,{operationId:r.operationId,outcome:'confirmed',definitive:true,evidenceRef:'YES',resources:[resource(f)]}));
 assert.throws(()=>f.ledger.reconcile(f.lease,{operationId:r.operationId,outcome:'confirmed',definitive:true,evidenceRef:randomUUID(),resources:[{...resource(f),runId:randomUUID()}]}));
 f.ledger.reconcile(f.lease,{operationId:r.operationId,outcome:'confirmed',definitive:true,evidenceRef:randomUUID(),resources:[resource(f)]});assert.equal(f.ledger.inspect(f.run).state,'reconcile_required');f.ledger.resume(f.lease,{state:'auth_confirmed',approvalRef:randomUUID()});assert.equal(f.ledger.inspect(f.run).state,'auth_confirmed');f.ledger.close();
});
test('ausência reconciliada não reexecuta a operação de escrita',async()=>{
 const f=setup();const r=await f.executor.invoke({key:'create:horizonte',kind:'create',call:()=>{throw Error();}});f.ledger.reconcile(f.lease,{operationId:r.operationId,outcome:'absent',definitive:true,evidenceRef:randomUUID()});f.ledger.resume(f.lease,{state:'authorized',approvalRef:randomUUID()});assert.throws(()=>f.ledger.begin(f.lease,{key:'create:horizonte',kind:'create'}),/NOT_RETRYABLE/);f.ledger.close();
});
test('reconciliação inconclusiva impede retomada e limpeza',async()=>{const f=setup();const r=await f.executor.invoke({key:'create:horizonte',kind:'create',call:()=>{throw Error();}});f.ledger.reconcile(f.lease,{operationId:r.operationId,outcome:'unresolved',evidenceRef:randomUUID()});assert.throws(()=>f.ledger.resume(f.lease,{state:'authorized',approvalRef:randomUUID()}));assert.throws(()=>f.ledger.planCleanup(f.lease));f.ledger.close();});
test('resultado inválido não registra recurso nem vaza campos sensíveis',async()=>{const f=setup();const r=await f.executor.invoke({key:'create:horizonte',kind:'create',call:()=>({resources:[{...resource(f),token:'SECRET'}]})});assert.equal(r.status,'reconcile-required');assert.equal(f.ledger.inspect(f.run).resources.length,0);assert.equal(JSON.stringify(f.ledger.inspect(f.run)).includes('SECRET'),false);f.ledger.close();});
test('duas personas não podem adotar o mesmo Auth ID',async()=>{const f=setup(),r=await createOne(f);const out=await f.executor.invoke({key:'create:estrela',kind:'create',call:()=>({resources:[r]})});assert.equal(out.status,'reconcile-required');assert.equal(f.ledger.inspect(f.run).resources.length,1);f.ledger.close();});
test('limites de duração e chamadas são persistentes',async()=>{
 let now=1000;const f=setup({clock:()=>now,limits:{durationMs:100,timeoutMs:50,maxCalls:1}});const op=f.ledger.begin(f.lease,{key:'inspect:a',kind:'read'});f.ledger.complete(f.lease,op.operation.id);assert.throws(()=>f.ledger.begin(f.lease,{key:'inspect:b',kind:'read'}),/BUDGET/);f.ledger.close();
 const g=setup({clock:()=>now,limits:{durationMs:100,timeoutMs:50}});now=1100;assert.throws(()=>g.ledger.begin(g.lease,{key:'inspect:a',kind:'read'}),/BUDGET/);g.ledger.close();
});
test('concorrência de chamadas e tentativas de leitura têm limites',()=>{const f=setup({limits:{maxConcurrency:1,maxAttempts:2}});const a=f.ledger.begin(f.lease,{key:'inspect:a',kind:'read'});assert.throws(()=>f.ledger.begin(f.lease,{key:'inspect:b',kind:'read'}),/CONCURRENCY/);f.ledger.fail(f.lease,a.operation.id);const b=f.ledger.begin(f.lease,{key:'inspect:a',kind:'read'});f.ledger.fail(f.lease,b.operation.id);assert.throws(()=>f.ledger.begin(f.lease,{key:'inspect:a',kind:'read'}),/NOT_RETRYABLE/);f.ledger.close();});
test('operação confirmada não chama adaptador novamente',async()=>{const f=setup();await createOne(f);let calls=0;const r=await f.executor.invoke({key:'create:horizonte',kind:'create',call:()=>{calls++;}});assert.equal(r.status,'already-confirmed');assert.equal(calls,0);f.ledger.close();});
test('sessões exigem negação/revogação explícitas e recusam tokens no ledger',async()=>{const f=await ready();const r=await f.executor.sessionControls(()=>({refreshRevoked:true,accessDenied:false,evidenceRef:randomUUID(),token:'DO_NOT_STORE'}));assert.equal(r.status,'reconcile-required');assert.equal(f.ledger.inspect(f.run).sessionEvidence,null);f.ledger.close();});
test('inventário, plano e aprovação são etapas distintas',async()=>{const f=await cleanupReady();assert.equal(f.ledger.inspect(f.run).state,'retained');assert.equal(f.plan.approval,null);assert.throws(()=>f.ledger.approveCleanup(f.lease,{planId:f.plan.id,digest:'changed',approvalRef:randomUUID()}));assert.throws(()=>f.ledger.verifyCleanup(f.lease,{planId:f.plan.id,evidenceRef:randomUUID(),observations:[]}));f.ledger.close();});
test('aprovação de limpeza não desbloqueia execução remota',async()=>{const f=await cleanupReady();f.ledger.approveCleanup(f.lease,{planId:f.plan.id,digest:f.plan.digest,approvalRef:randomUUID()});assert.equal(f.ledger.inspect(f.run).state,'cleanup_approved');assert.throws(()=>f.ledger.executeRemoteCleanup(),/REMOTE_CLEANUP_BLOCKED/);f.ledger.close();});
test('ausência de contrato de sessões impede aprovação de limpeza',async()=>{const f=await ready();f.ledger.retain(f.lease,randomUUID());const p=f.ledger.planCleanup(f.lease);assert.throws(()=>f.ledger.approveCleanup(f.lease,{planId:p.id,digest:p.digest,approvalRef:randomUUID()}),/SESSION_EVIDENCE/);f.ledger.close();});
test('limpeza incompleta perde aprovação e exige reconciliação',async()=>{const f=await cleanupReady();f.ledger.approveCleanup(f.lease,{planId:f.plan.id,digest:f.plan.digest,approvalRef:randomUUID()});const r=f.ledger.verifyCleanup(f.lease,{planId:f.plan.id,evidenceRef:randomUUID(),observations:[]});assert.equal(r.cleaned,false);assert.equal(f.ledger.inspect(f.run).state,'reconcile_required');assert.equal(f.ledger.inspect(f.run).plans[0].approval,null);f.ledger.close();});
test('verificação completa marca cleaned apenas como contrato offline',async()=>{const f=await cleanupReady();f.ledger.approveCleanup(f.lease,{planId:f.plan.id,digest:f.plan.digest,approvalRef:randomUUID()});const r=f.ledger.verifyCleanup(f.lease,{planId:f.plan.id,evidenceRef:randomUUID(),observations:f.plan.resources.map(({kind,id})=>({kind,id,present:false}))});assert.equal(r.cleaned,true);assert.equal(r.scope,'offline-contract-only');assert.equal(f.ledger.inspect(f.run).state,'cleaned');assert.throws(()=>f.ledger.claim(f.run),/RUN_CLOSED/);f.ledger.close();});
test('liberar lock com operação pendente é bloqueado',()=>{const f=setup();f.ledger.begin(f.lease,{key:'create:horizonte',kind:'create'});assert.throws(()=>f.ledger.release(f.lease),/PENDING_OPERATIONS/);f.ledger.close();});
test('CLIs de criação continuam bloqueadas mesmo com flags YES',()=>{for(const [file,mode]of [['etapa2b-runner.mjs','run'],['etapa2b-auth.mjs','create']]){const r=spawnSync(process.execPath,[fileURLToPath(new URL('../'+file,import.meta.url)),mode],{encoding:'utf8',env:{PATH:process.env.PATH,DECOLA_TEST_PROJECT_ID:PROJECT,DECOLA_TEST_CREATE:'YES',DECOLA_TEST_RUN:'YES'}});assert.equal(r.status,2);assert.match(r.stderr,/BLOCKED/);}});

test('estado de conexão falha exige reconciliação explícita',async()=>{const f=setup();await runStage2B({...f,mode:'run',envVars,adapter:createOfflineAdapter({failure:'connect'})});assert.equal(f.ledger.inspect(f.run).state,'reconcile_required');f.ledger.close();});
test('confirmação de proprietário antigo não é aceita após recuperação de lease',()=>{
 let now=1000;const f=setup({clock:()=>now});const op=f.ledger.begin(f.lease,{key:'create:horizonte',kind:'create'});now+=31000;f.ledger.claim(f.run);assert.throws(()=>f.ledger.complete(f.lease,op.operation.id,{resources:[resource(f)]}),/STALE_LEASE/);assert.equal(f.ledger.inspect(f.run).resources.length,0);f.ledger.close();
});
test('takeover invalida aprovação de limpeza e evidência de sessão anterior',async()=>{
 let now=Date.now();const f=setup({clock:()=>now});await runStage2B({...f,mode:'run',envVars,adapter:createOfflineAdapter()});await f.executor.sessionControls(()=>({refreshRevoked:true,accessDenied:true,evidenceRef:randomUUID()}));f.ledger.retain(f.lease,randomUUID());const p=f.ledger.planCleanup(f.lease);f.ledger.approveCleanup(f.lease,{planId:p.id,digest:p.digest,approvalRef:randomUUID()});now+=31000;f.ledger.claim(f.run);const d=f.ledger.inspect(f.run);assert.equal(d.state,'reconcile_required');assert.equal(d.plans[0].approval,null);assert.equal(d.sessionEvidence,null);f.ledger.close();
});
test('diretório com arquivos alheios e symlink não é usado como ledger',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'decola-path-'));temporary.push(dir);fs.writeFileSync(path.join(dir,'user-file'),'keep');assert.throws(()=>new LocalLedger(dir),/DIRECTORY_NOT_ISOLATED/);assert.equal(fs.readFileSync(path.join(dir,'user-file'),'utf8'),'keep');
 const target=fs.mkdtempSync(path.join(os.tmpdir(),'decola-link-'));temporary.push(target);const link=path.join(target,'link');fs.symlinkSync(dir,link);assert.throws(()=>new LocalLedger(link),/SYMLINK/);
});
test('recursos de outro run não podem ser adotados na reconciliação',async()=>{
 const f=setup(),r=await createOne(f);f.ledger.retain(f.lease,randomUUID());f.ledger.release(f.lease);const other=f.ledger.create(),lease=f.ledger.claim(other);f.ledger.authorize(lease,randomUUID());const ex=new ControlledExecutor(f.ledger,lease);const op=await ex.invoke({key:'create:horizonte',kind:'create',call:()=>{throw Error();}});
 assert.throws(()=>f.ledger.reconcile(lease,{operationId:op.operationId,outcome:'confirmed',definitive:true,evidenceRef:randomUUID(),resources:[{...r,runId:other}]}),/UNPROVEN_RESOURCE/);assert.equal(f.ledger.inspect(other).resources.length,0);assert.equal(f.ledger.inspect(f.run).resources[0].id,r.id);f.ledger.close();
});

test('relógio local retrocedendo bloqueia novas mutações',()=>{let now=1000;const f=setup({clock:()=>now});now=999;assert.throws(()=>f.ledger.begin(f.lease,{key:'inspect:a',kind:'read'}),/CLOCK_ROLLBACK/);f.ledger.close();});
test('terceira identidade é bloqueada antes de chamar qualquer adapter',async()=>{const f=setup();await createOne(f);await createOne(f,'create:estrela');let calls=0;await assert.rejects(f.executor.invoke({key:'create:third',kind:'create',call:()=>{calls++;}}),/AUTH_LIMIT/);assert.equal(calls,0);f.ledger.close();});

test('simples consulta de ausência não resolve escrita desconhecida',async()=>{const f=setup();const r=await f.executor.invoke({key:'create:horizonte',kind:'create',call:()=>{throw Error();}});assert.throws(()=>f.ledger.reconcile(f.lease,{operationId:r.operationId,outcome:'absent',evidenceRef:randomUUID()}),/DEFINITIVE_EVIDENCE/);assert.equal(f.ledger.inspect(f.run).state,'auth_unknown');f.ledger.close();});
test('leitura interrompida nunca pode adotar recurso na reconciliação',()=>{let now=1000;const f=setup({clock:()=>now});const op=f.ledger.begin(f.lease,{key:'inspect:a',kind:'read'});now+=31000;const lease=f.ledger.claim(f.run);assert.throws(()=>f.ledger.reconcile(lease,{operationId:op.operation.id,outcome:'confirmed',definitive:true,evidenceRef:randomUUID(),resources:[resource(f)]}),/READ_CANNOT/);assert.equal(f.ledger.inspect(f.run).resources.length,0);f.ledger.close();});

test('COMMIT desconhecido exige quarentena antes de reconciliar vínculo já efetivado',async()=>{
 const f=setup();const a=await createOne(f),b=await createOne(f,'create:estrela');const refs=[resource(f,'account',a.id),resource(f,'account',b.id),resource(f,'student'),resource(f,'student')];let effect=false;
 const result=await f.executor.invoke({key:'link:personas',kind:'link',call:()=>{effect=true;throw Error('COMMIT_RESPONSE_LOST');}});assert.equal(effect,true);assert.equal(result.quarantineRequired,true);assert.equal(f.ledger.inspect(f.run).state,'link_unknown');
 assert.throws(()=>f.ledger.reconcile(f.lease,{operationId:result.operationId,outcome:'confirmed',definitive:true,evidenceRef:randomUUID(),resources:refs}),/QUARANTINE_REQUIRED/);
 f.ledger.quarantine(f.lease,result.operationId,{discarded:true,evidenceRef:randomUUID()});f.ledger.reconcile(f.lease,{operationId:result.operationId,outcome:'confirmed',definitive:true,evidenceRef:randomUUID(),resources:refs});f.ledger.resume(f.lease,{state:'linked',approvalRef:randomUUID()});assert.equal(f.ledger.inspect(f.run).resources.length,6);f.ledger.close();
});
test('falha de rollback/descartar conexão não libera operação nem limpeza',async()=>{
 const f=setup();await createOne(f);await createOne(f,'create:estrela');const result=await f.executor.invoke({key:'link:personas',kind:'link',call:()=>{throw Error();},onUncertain:()=>{throw Error();}});assert.equal(result.status,'reconcile-required');assert.equal(f.ledger.inspect(f.run).operations.at(-1).quarantined,undefined);assert.throws(()=>f.ledger.planCleanup(f.lease));f.ledger.close();
});
