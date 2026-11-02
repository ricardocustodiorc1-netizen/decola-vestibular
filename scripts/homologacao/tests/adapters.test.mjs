import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {Socket} from 'node:net';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {offlineTestPermit,enableRemoteExecution} from '../adapters/boundary.mjs';
import {PreparedAuthAdapter,identityPlan} from '../adapters/auth.mjs';
import {PreparedPostgresAdapter} from '../adapters/postgres.mjs';
import {PreparedHttpAdapter} from '../adapters/http.mjs';
import {PreparedBearerBridge} from '../adapters/bearer-bridge.mjs';
import {preinspectionPlan,executePreinspection} from '../adapters/preinspection.mjs';
import {LocalLedger,PROJECT,ORGANIZATION} from '../controls/ledger.mjs';
import {ControlledExecutor} from '../controls/executor.mjs';
// No network is available to these tests, including accidental SDK/default fetch use.
const socketConnect=Socket.prototype.connect,fetchOriginal=globalThis.fetch;
Socket.prototype.connect=function(){throw Error('NETWORK_FORBIDDEN');};globalThis.fetch=()=>{throw Error('NETWORK_FORBIDDEN');};
test.after(()=>{Socket.prototype.connect=socketConnect;globalThis.fetch=fetchOriginal;});
const permit=offlineTestPermit(),context={runId:randomUUID(),projectId:PROJECT,organizationId:ORGANIZATION},uid=randomUUID(),other=randomUUID(),sid=randomUUID();
const token='fixture.'+Buffer.from(JSON.stringify({sub:uid,session_id:sid})).toString('base64url')+'.not-a-signature';
function authFixture(ctx=context){
 const calls=[];let fail='',userId=uid;const user=()=>({id:userId,email:identityPlan(ctx.runId)[0].email,email_confirmed_at:'2026-01-01',app_metadata:{decola_stage:'2d_fixture',decola_run_id:ctx.runId,persona:'horizonte'}});
 const admin={auth:{admin:{createUser:async input=>{calls.push(input);if(fail==='create')throw Error('provider private detail');return {data:{user:{...user(),email:input.email,app_metadata:input.app_metadata}},error:null};},getUserById:async()=>fail==='get'?{error:{secret:'hidden'}}:{data:{user:user()}},signOut:async(...args)=>{calls.push(args);return {error:fail==='signout'?{}:null};}}}};
 const publicClient=()=>({auth:{signInWithPassword:async()=>({data:{user:user(),session:{access_token:token,refresh_token:'fixture-refresh-not-real'}}}),refreshSession:async()=>fail==='refresh-transport'?{error:{name:'AuthRetryableFetchError',status:0}}:{error:{name:'AuthApiError',status:400,code:'refresh_token_not_found'}},getUser:async()=>fail==='verify'?{error:{}}:{data:{user:user()}}}});
 return {adapter:new PreparedAuthAdapter({admin,publicClient,context:ctx,permit}),calls,admin,publicClient,setFail:v=>fail=v,setUser:v=>userId=v};
}
function poolFixture({failAt,rows=[],failRelease=false}={}){
 const calls=[],releases=[];const pool={connect:async()=>{
  if(failAt==='connect')throw Error('private connection string');
  return {query:async q=>{const text=typeof q==='string'?q:q.text;calls.push(q);if(text.includes(failAt||'__never__'))throw Error('private sql detail');return {rows:typeof rows==='function'?rows(text,q):rows,rowCount:1};},release:discard=>{releases.push(discard===true);if(failRelease)throw Error('discard failed');}};
 }};return {pool,calls,releases,adapter:new PreparedPostgresAdapter({pool,context,permit})};
}
const refs=()=>[uid,other].map(id=>({kind:'auth',id,runId:context.runId,projectId:PROJECT}));
test('no live gate, forged permit, wrong target or preinspection execution',async()=>{
 assert.throws(enableRemoteExecution,/REMOTE_EXECUTION_BLOCKED/);assert.throws(executePreinspection,/NOT_AUTHORIZED/);
 assert.throws(()=>new PreparedPostgresAdapter({context:{...context,projectId:'wrong'}}),/INVALID_TARGET/);
 const a=new PreparedAuthAdapter({context,permit:{scope:'offline-transport-test'}});
 await assert.rejects(a.createIdentity('horizonte','a'.repeat(24)),/REMOTE_EXECUTION_BLOCKED/);
 const pg=new PreparedPostgresAdapter({context});await assert.rejects(pg.link(refs()),/REMOTE_EXECUTION_BLOCKED/);
 const http=new PreparedHttpAdapter({origin:'https://bff.example.invalid'});await assert.rejects(http.ownIdentity(token,uid),/REMOTE_EXECUTION_BLOCKED/);
 assert.equal(preinspectionPlan().writes,false);assert.equal(preinspectionPlan().personalData,false);
});
test('two deterministic synthetic personas, no arbitrary mail destination',()=>{
 const plan=identityPlan(context.runId);assert.equal(plan.length,2);assert.notEqual(plan[0].email,plan[1].email);assert.deepEqual(identityPlan(context.runId),plan);
 assert.throws(()=>identityPlan(context.runId,'gmail.com'),/CONTROLLED_TEST_DOMAIN/);
});
test('Auth create returns only proven references and server marker',async()=>{
 const f=authFixture();const result=await f.adapter.createIdentity('horizonte','fixture-password-long-enough');
 assert.equal(result.resources[0].id,uid);assert.equal(f.calls[0].app_metadata.decola_run_id,context.runId);
 assert.ok(!JSON.stringify(result).includes('password'));assert.ok(!JSON.stringify(result).includes(token));
 await assert.rejects(f.adapter.createIdentity('unknown','a'.repeat(24)),/INVALID_FIXTURE/);
});
test('Auth lost response is unknown, not retryable absence',async()=>{
 const f=authFixture();f.setFail('create');await assert.rejects(f.adapter.createIdentity('horizonte','a'.repeat(24)),/^Error: AUTH_CREATE_UNKNOWN$/);
 f.setFail('get');assert.equal((await f.adapter.inspectConfirmedId(uid)).outcome,'unresolved');
});
test('Auth reconciliation protects a foreign identity and confirms exact ID only',async()=>{
 const f=authFixture();assert.equal((await f.adapter.inspectConfirmedId(uid)).outcome,'confirmed');
 assert.equal((await f.adapter.inspectConfirmedId(other)).outcome,'preexisting-or-foreign');
});
test('opaque session references, server verification, no claim of revocation on dispose',async()=>{
 const f=authFixture(),s=await f.adapter.login('horizonte','fixture',uid);assert.ok(!JSON.stringify(s).includes(token));
 assert.equal((await f.adapter.validateSession(s.sessionRef)).verified,true);
 assert.deepEqual(await f.adapter.verifyBearer(token),{userId:uid,sessionId:sid});
 f.setFail('verify');await assert.rejects(f.adapter.verifyBearer(token),/SESSION_INVALID/);
 assert.deepEqual(f.adapter.dispose(),{remoteSessionsRevoked:false});await assert.rejects(f.adapter.validateSession(s.sessionRef),/SESSION_UNAVAILABLE/);
});
test('signed-in identity and session claim must agree even after getUser succeeds',async()=>{
 const f=authFixture();const wrong='x.'+Buffer.from(JSON.stringify({sub:other,session_id:sid})).toString('base64url')+'.x';
 await assert.rejects(f.adapter.verifyBearer(wrong),/SESSION_INVALID/);await assert.rejects(f.adapter.verifyBearer('opaque'),/SESSION_INVALID/);
});
test('logout alone never proves HTTP denial; successful evidence contains no tokens',async()=>{
 const f=authFixture(),s=await f.adapter.login('horizonte','fixture',uid);
 await assert.rejects(f.adapter.sessionEvidence(s.sessionRef,async()=>false),/REVOCATION_UNVERIFIED/);
 const evidence=await f.adapter.sessionEvidence(s.sessionRef,async t=>t===token);assert.equal(evidence.accessDenied,true);assert.equal(evidence.refreshRevoked,true);assert.ok(!JSON.stringify(evidence).includes(token));
 assert.throws(()=>f.adapter.executeRemoval(),/REMOTE_CLEANUP_BLOCKED/);
});
test('refresh transport failure is not evidence of revocation',async()=>{
 const f=authFixture(),s=await f.adapter.login('horizonte','fixture',uid);f.setFail('refresh-transport');
 await assert.rejects(f.adapter.sessionEvidence(s.sessionRef,async()=>true),/REVOCATION_UNVERIFIED/);
});
test('Postgres directed lookup never declares definitive absence or adopts preexisting',async()=>{
 const f=poolFixture();assert.equal((await f.adapter.findFixture(identityPlan(context.runId)[0])).definitive,false);
 assert.match(f.calls.find(c=>c.text)?.text,/WHERE lower\(email\)=lower\(\$1\) LIMIT 2/);
 const g=poolFixture({rows:[{id:uid,run_id:randomUUID()}]});assert.equal((await g.adapter.findFixture(identityPlan(context.runId)[0])).outcome,'preexisting-or-foreign');
 assert.deepEqual(f.releases,[false]);
});
test('link transaction binds exact two proven Auth IDs and run marker',async()=>{
 const f=poolFixture(),result=await f.adapter.link(refs());assert.equal(result.resources.length,4);
 assert.equal(f.calls.at(-1),'COMMIT');assert.deepEqual(f.releases,[false]);
 const inserts=f.calls.filter(x=>x.text?.startsWith('INSERT INTO decola.accounts'));assert.deepEqual(inserts.map(x=>x.values),[[uid,context.runId],[other,context.runId]]);
 await assert.rejects(f.adapter.link([{...refs()[0],runId:randomUUID()},refs()[1]]),/UNPROVEN_AUTH_REFERENCE/);
});
for(const failure of ['connect','INSERT INTO decola.students','COMMIT','ROLLBACK'])test(`transaction failure ${failure}: conservative outcome and discard`,async()=>{
 const f=poolFixture({failAt:failure==='ROLLBACK'?'INSERT INTO decola.students':failure});
 if(failure==='ROLLBACK'){const base=f.pool.connect;f.pool.connect=async()=>{const c=await base();const q=c.query;c.query=async text=>{if(text==='ROLLBACK')throw Error('rollback uncertain');return q(text);};return c;};}
 await assert.rejects(f.adapter.link(refs()),/^Error: LINK_OUTCOME_UNKNOWN$/);
 if(failure==='connect')assert.throws(()=>f.adapter.quarantineEvidence(),/UNVERIFIED/);
 else{assert.deepEqual(f.releases,[true]);assert.equal(f.adapter.quarantineEvidence().discarded,true);}
 assert.equal(f.calls.filter(x=>x==='COMMIT').length,failure==='COMMIT'?1:0);
});
test('failed physical discard cannot furnish quarantine evidence',async()=>{
 const f=poolFixture({failAt:'COMMIT',failRelease:true});await assert.rejects(f.adapter.link(refs()),/UNKNOWN/);assert.throws(()=>f.adapter.quarantineEvidence(),/UNVERIFIED/);
});
test('reconcile links refuses partial rows, proves matching two references',async()=>{
 const partial=poolFixture({rows:[{account_id:uid,student_id:randomUUID(),run_id:context.runId}]});assert.equal((await partial.adapter.inspectLinks(refs())).outcome,'unresolved');
 const full=poolFixture({rows:[uid,other].map(account_id=>({account_id,student_id:randomUUID(),run_id:context.runId,eligibility_key:`2d:${context.runId}:${account_id}`}))});assert.equal((await full.adapter.inspectLinks(refs())).resources.length,4);
 const foreign=poolFixture({rows:[uid,other].map(account_id=>({account_id,student_id:randomUUID(),run_id:context.runId,eligibility_key:'unrelated'}))});assert.equal((await foreign.adapter.inspectLinks(refs())).outcome,'unresolved');
});
test('SQL role probe uses transaction-local identity and always rolls back',async()=>{
 const f=poolFixture();const r=await f.adapter.asStudent(uid,{action:'requestTrial',studentId:other});
 assert.equal(r.scope,'sql-role-contract-not-http-jwt');assert.ok(f.calls.includes('SET LOCAL ROLE authenticated'));assert.equal(f.calls.at(-1),'ROLLBACK');
 assert.equal(f.calls.find(c=>c.text?.includes('request.jwt.claim.sub')).values[0],uid);
 await assert.rejects(f.adapter.asStudent(uid,{action:'arbitrary SQL'}),/INVALID_RLS_ACTION/);
 const bad=poolFixture({failAt:'request_trial'});await assert.rejects(bad.adapter.asStudent(uid,{action:'requestTrial',studentId:other}),/UNCONFIRMED/);assert.deepEqual(bad.releases,[true]);
});
test('active session requires positive server result for exact user/session',async()=>{
 const f=poolFixture({rows:[{active:true}]});assert.equal(await f.adapter.activeSession(uid,sid),true);assert.deepEqual(f.calls.find(c=>c.text?.includes('JOIN auth.sessions')).values,[uid,sid]);
 assert.equal(await poolFixture().adapter.activeSession(uid,sid),false);
});
test('HTTP asserts identity, rejects redirects, errors, wrong identities and misleading denial',async()=>{
 let status=200,accountId=uid,redirected=false;
 const f=new PreparedHttpAdapter({origin:'https://bff.example.invalid',permit,request:async(url,options)=>{assert.equal(options.redirect,'error');assert.ok(options.signal);return {status,redirected,json:async()=>({accountId})};}});
 assert.equal((await f.ownIdentity(token,uid)).status,200);accountId=other;await assert.rejects(f.ownIdentity(token,uid),/MISMATCH/);
 accountId=uid;redirected=true;await assert.rejects(f.ownIdentity(token,uid),/UNEXPECTED/);redirected=false;
 status=401;await assert.rejects(f.foreignProgress(token,other),/UNEXPECTED/);assert.equal(await f.accessDenied(token),true);
 status=404;await f.foreignProgress(token,other);await assert.rejects(f.accessDenied(token),/UNEXPECTED/);
 status=503;await assert.rejects(f.ownIdentity(token,uid),/UNEXPECTED/);
 await assert.rejects(f.ownIdentity('header\r\ninjection',uid),/INVALID_HTTP_PROBE/);
});
test('Bearer bridge checks Auth before session/SQL; foreign resource is never fetched',async()=>{
 let verified=false,active=true,progressRead=false;
 const bridge=new PreparedBearerBridge({permit,auth:{verifyBearer:async()=>{if(!verified)throw Error();return {userId:uid,sessionId:sid};}},postgres:{activeSession:async()=>active,asStudent:async(id,{action})=>{if(action==='progress')progressRead=true;return {rows:[{id:other}]};}}});
 assert.equal(await bridge.resolve('Bearer fixture'),null);verified=true;assert.equal((await bridge.resolve('Bearer fixture')).accountId,uid);
 active=false;assert.equal(await bridge.resolve('Bearer fixture'),null);
 assert.equal((await bridge.progress({accountId:uid},randomUUID())).status,404);assert.equal(progressRead,false);
});
test('real adapter methods use existing ledger/executor: uncertain COMMIT durable, no duplicate write',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'decola-ports-'));const ledger=new LocalLedger(dir);
 try{
  const runId=ledger.create(),lease=ledger.claim(runId);ledger.authorize(lease,randomUUID());const exec=new ControlledExecutor(ledger,lease),ctx={...context,runId};
  const auth=authFixture(ctx);await exec.invoke({key:'create:horizonte',kind:'create',call:()=>auth.adapter.createIdentity('horizonte','a'.repeat(24))});
  auth.setUser(other);await exec.invoke({key:'create:estrela',kind:'create',call:()=>auth.adapter.createIdentity('estrela','a'.repeat(24))});
  const f=poolFixture({failAt:'COMMIT'}),pg=new PreparedPostgresAdapter({pool:f.pool,permit,context:ctx});
  const resources=ledger.inspect(runId).resources.filter(r=>r.kind==='auth').map(({kind,id,runId,projectId})=>({kind,id,runId,projectId}));
  const call=()=>pg.link(resources),result=await exec.invoke({key:'link:personas',kind:'link',call,onUncertain:()=>pg.quarantineEvidence()});
  assert.equal(result.status,'reconcile-required');assert.equal(ledger.inspect(runId).state,'link_unknown');
  const count=f.calls.length;await assert.rejects(exec.invoke({key:'link:personas',kind:'link',call}),/NOT_RETRYABLE/);assert.equal(f.calls.length,count);
 }finally{ledger.close();fs.rmSync(dir,{recursive:true,force:true});}
});
