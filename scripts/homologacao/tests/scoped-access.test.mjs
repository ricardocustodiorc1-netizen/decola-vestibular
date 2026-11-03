import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {Socket} from 'node:net';
import {LocalLedger,PROJECT,ORGANIZATION} from '../controls/ledger.mjs';
import {ControlledExecutor} from '../controls/executor.mjs';
import {offlineTestPermit,enableRemoteExecution} from '../adapters/boundary.mjs';
import {ScopedAuthBroker} from '../scoped/auth.mjs';
import {ScopedPostgresAdapter} from '../scoped/postgres.mjs';
import {ScopedBearerBridge} from '../scoped/bridge.mjs';
import {approvalSql,validateScope} from '../scoped/plan.mjs';
import {validateScopedPg} from '../scoped/preflight.mjs';
import {restrictedPgConfig} from '../executor/postgres-security.mjs';
const connect=Socket.prototype.connect,fetchOriginal=globalThis.fetch;Socket.prototype.connect=function(){throw Error('NETWORK_FORBIDDEN');};globalThis.fetch=()=>{throw Error('NETWORK_FORBIDDEN');};test.after(()=>{Socket.prototype.connect=connect;globalThis.fetch=fetchOriginal;});
const permit=offlineTestPermit();
function fixture(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'decola-scoped-')),ledger=new LocalLedger(dir),run=ledger.create(),lease=ledger.claim(run);ledger.authorize(lease,randomUUID());t.after(()=>{ledger.close();fs.rmSync(dir,{force:true,recursive:true});});const plan={runId:run,projectId:PROJECT,organizationId:ORGANIZATION,authH:randomUUID(),authE:randomUUID(),studentH:randomUUID(),studentE:randomUUID(),startsAt:Date.now()-100,expiresAt:Date.now()+599000};return {ledger,lease,plan,exec:new ControlledExecutor(ledger,lease)};}
function auth(f,{lost=false}={}){const requests=[];const admin={auth:{admin:{createUser:async q=>{requests.push(q);if(lost)throw Error('private-secret');return {data:{user:{id:q.id,email:q.email,app_metadata:q.app_metadata}}};},getUserById:async()=>({error:{}}),signOut:async()=>({error:null})}}};return {requests,broker:new ScopedAuthBroker({...f,admin,permit,publicClient:()=>({}),approveScope:async()=>true})};}
function pg(f,{fail,rows}={}){const queries=[],released=[];const pool={connect:async()=>({query:async q=>{const sql=typeof q==='string'?q:q.text;queries.push(q);if(sql===fail)throw Error('private DSN');return {rows:rows??[{account_id:f.plan.authH,student_id:f.plan.studentH},{account_id:f.plan.authE,student_id:f.plan.studentE}]};},release:x=>released.push(x===true)})};return {adapter:new ScopedPostgresAdapter({pool,permit,plan:f.plan}),queries,released};}
test('manifest SQL only fixed UUIDs/timestamps; exact two distinct identities and ten minute ceiling',t=>{
 const f=fixture(t),sql=approvalSql(f.plan);assert.match(sql,/INSERT INTO decola_guard.run_scope/);assert.ok(!sql.includes('auth.users'));assert.ok(sql.includes(f.plan.authH));
 assert.throws(()=>validateScope({...f.plan,authE:f.plan.authH}),/INVALID_SCOPE/);assert.throws(()=>approvalSql({...f.plan,authH:"';DROP TABLE x;--"}),/INVALID_REFERENCE/);assert.throws(()=>validateScope({...f.plan,expiresAt:f.plan.startsAt+600001}),/INVALID_SCOPE/);assert.throws(enableRemoteExecution,/REMOTE_EXECUTION_BLOCKED/);
});
test('broker creates only planned IDs, no SDK passthrough and no third persona',async t=>{
 const f=fixture(t),a=auth(f);for(const persona of ['horizonte','estrela'])assert.equal((await f.exec.invoke({key:'create:'+persona,kind:'create',call:()=>a.broker.createIdentity(persona,'fixture-password-over-20')})).status,'confirmed');
 assert.deepEqual(a.requests.map(x=>x.id),[f.plan.authH,f.plan.authE]);assert.ok(a.requests.every(x=>x.email_confirm===true));assert.equal(a.broker.admin,undefined);
 await assert.rejects(a.broker.createIdentity('third','fixture-password-over-20'));assert.equal(a.requests.length,2);assert.equal(f.ledger.inspect(f.plan.runId).authDispatches.length,2);
});
test('duplicate dispatch in same pending operation is durably blocked even with new broker instance',async t=>{
 const f=fixture(t),a=auth(f);await f.exec.invoke({key:'create:horizonte',kind:'create',call:async()=>{await a.broker.createIdentity('horizonte','fixture-password-over-20');const another=auth(f);await assert.rejects(another.broker.createIdentity('horizonte','fixture-password-over-20'));assert.equal(another.requests.length,0);throw Error('interrupted');}});
 assert.equal(a.requests.length,1);assert.equal(f.ledger.inspect(f.plan.runId).state,'auth_unknown');
});
test('lost Auth result cannot automatically create replacement identity',async t=>{
 const f=fixture(t),a=auth(f,{lost:true});await f.exec.invoke({key:'create:horizonte',kind:'create',call:()=>a.broker.createIdentity('horizonte','fixture-password-over-20')});
 await assert.rejects(f.exec.invoke({key:'create:horizonte',kind:'create',call:()=>a.broker.createIdentity('horizonte','fixture-password-over-20')}),/NOT_RETRYABLE/);assert.equal(a.requests.length,1);
});
test('broker rejects other run, arbitrary login UID and call outside authorized operation',async t=>{
 const f=fixture(t),a=auth(f);await assert.rejects(a.broker.createIdentity('horizonte','fixture-password-over-20'));assert.equal(a.requests.length,0);assert.throws(()=>a.broker.login('horizonte','fixture',randomUUID()),/FOREIGN_ID/);
 assert.throws(()=>auth({...f,plan:{...f.plan,runId:randomUUID()}}),/RUN_MISMATCH/);
});
test('link uses only private parameterized function with exact proven IDs',async t=>{
 const f=fixture(t),p=pg(f),refs=[f.plan.authH,f.plan.authE].map(id=>({kind:'auth',id,runId:f.plan.runId,projectId:PROJECT}));
 const result=await p.adapter.link(refs);assert.equal(result.resources.length,4);assert.equal(p.queries[0],'BEGIN');assert.match(p.queries[1].text,/decola_guard.provision_pair/);assert.deepEqual(p.queries[1].values,[f.plan.runId]);assert.equal(p.queries.at(-1),'COMMIT');assert.deepEqual(p.released,[false]);
 await assert.rejects(p.adapter.link([{...refs[0],id:randomUUID()},refs[1]]),/UNPROVEN/);assert.ok(!JSON.stringify(p.queries).includes('SET LOCAL ROLE'));
});
test('uncertain COMMIT discards connection and returns no fabricated resources',async t=>{
 const f=fixture(t),p=pg(f,{fail:'COMMIT'}),refs=[f.plan.authH,f.plan.authE].map(id=>({kind:'auth',id,runId:f.plan.runId,projectId:PROJECT}));await assert.rejects(p.adapter.link(refs),/^Error: SCOPED_WRITE_UNKNOWN$/);assert.deepEqual(p.released,[true]);assert.equal(p.adapter.quarantineEvidence().discarded,true);
});
test('wrong function result rolls back and is not adopted; read reconciliation can remain unresolved',async t=>{
 const f=fixture(t),p=pg(f,{rows:[]}),refs=[f.plan.authH,f.plan.authE].map(id=>({kind:'auth',id,runId:f.plan.runId,projectId:PROJECT}));await assert.rejects(p.adapter.link(refs),/UNKNOWN/);assert.ok(p.queries.includes('ROLLBACK'));assert.equal((await p.adapter.inspectLinks()).outcome,'unresolved');
});
test('scope calls carry session ID and safe action; foreign user denied before SQL',async t=>{
 const f=fixture(t),p=pg(f,{rows:[{result:[{id:f.plan.studentH}]}]}),sessionId=randomUUID();await p.adapter.asStudent(f.plan.authH,{sessionId,action:'students'});assert.deepEqual(p.queries[1].values,[f.plan.runId,f.plan.authH,sessionId,'students',null]);assert.ok(p.queries.includes('BEGIN READ ONLY'));
 await assert.rejects(p.adapter.asStudent(randomUUID(),{sessionId,action:'students'}),/DENIED/);await assert.rejects(p.adapter.asStudent(f.plan.authH,{sessionId,action:'DROP x'}),/DENIED/);
});
test('trial action uses explicit write transaction; session without configuration fails closed',async t=>{
 const f=fixture(t),p=pg(f,{rows:[{result:{startsAt:'fixture',endsAt:'fixture'}}]});await p.adapter.asStudent(f.plan.authH,{sessionId:randomUUID(),studentId:f.plan.studentH,action:'requestTrial'});assert.equal(p.queries[0],'BEGIN');assert.equal(p.queries.at(-1),'COMMIT');await assert.rejects(p.adapter.asStudent(f.plan.authH,{action:'students'}),/INVALID_REFERENCE/);
});
test('bridge preserves verified identity/session, denies foreign resource and revocation after resolve',async()=>{
 const accountId=randomUUID(),studentId=randomUUID(),sessionId=randomUUID();let active=true,progressCalls=0;
 const bridge=new ScopedBearerBridge({permit,auth:{verifyBearer:async()=>({userId:accountId,sessionId})},postgres:{activeSession:async()=>active,asStudent:async(uid,{action,sessionId:sid})=>{assert.equal(uid,accountId);assert.equal(sid,sessionId);if(action==='progress')progressCalls++;return {rows:action==='students'?[{id:studentId}]:[{revision:1}]};}}});
 const p=await bridge.resolve('Bearer fixture');assert.equal((await bridge.progress(p,studentId)).status,200);assert.equal((await bridge.progress(p,randomUUID())).status,404);assert.equal(progressCalls,1);
 active=false;assert.equal((await bridge.progress(p,studentId)).status,401);assert.equal(await bridge.resolve('Bearer fixture'),null);await assert.rejects(bridge.progress({...p},studentId),/UNVERIFIED/);
});
test('SQL proposal keeps login table-blind, role isolation and session protection shared with RPCs',()=>{
 const sql=fs.readFileSync(new URL('../../../docs/propostas/ETAPA-2DC2-ACESSO.sql',import.meta.url),'utf8');
 assert.match(sql,/CREATE OR REPLACE FUNCTION decola.active_account/);assert.match(sql,/SELECT decola_guard.current_session\(\) AND EXISTS/);assert.match(sql,/CREATE POLICY guard_account_insert/);assert.ok(!/GRANT authenticated TO decola_homologacao/.test(sql));assert.ok(!/GRANT SELECT[^;]*TO decola_homologacao/.test(sql));assert.ok(!/BYPASSRLS;/.test(sql.replaceAll('NOBYPASSRLS','')));assert.match(sql,/singleton boolean PRIMARY KEY/);assert.match(sql,/scope.*|Scope unavailable/);assert.ok(!sql.includes('INSERT INTO auth.users'));
});
test('function-only preflight rejects previous broad profile, hidden admin login and missing entrypoints',async()=>{
 const host=`db.${PROJECT}.supabase.co`,config=restrictedPgConfig({host,user:'decola_homologacao',password:'fixture',ca:'-----BEGIN CERTIFICATE-----fixture'});
 const connection={stream:{encrypted:true,authorized:true,servername:host,getProtocol:()=>'TLSv1.3',getPeerCertificate:()=>({subjectaltname:'DNS:'+host,valid_from:'Jan 1 2025 GMT',valid_to:'Jan 1 2030 GMT'})}};
 const good={role:'decola_homologacao',login_role:'decola_homologacao',forbidden_membership:false,direct_table_access:false,can_create:false,extra_execute:false,guard_usage:true,functions_present:true};
 assert.equal((await validateScopedPg({connection,query:async()=>({rows:[good]})},config)).scope,'private-function-only');
 for(const change of [{forbidden_membership:true},{direct_table_access:true},{login_role:'postgres'},{can_create:true},{extra_execute:true},{functions_present:false}])await assert.rejects(validateScopedPg({connection,query:async()=>({rows:[{...good,...change}]})},config),/PREFLIGHT_FAILED/);
});
test('WSL assessment accepts Linux disk candidate but never asserts actual durability or installation',async()=>{
 const {assessExecutorPlatform:assess}=await import('../scoped/platform.mjs');
 const p={platform:'linux',release:'microsoft-standard-WSL2',root:'/home/student/.local/state/decola',filesystemType:0xef53};
 assert.equal(assess(p).candidate,true);assert.equal(assess(p).durabilityVerified,false);assert.equal(assess({...p,platform:'win32'}).candidate,false);assert.equal(assess({...p,root:'/mnt/c/decola'}).candidate,false);assert.equal(assess({...p,filesystemType:0x01021997}).candidate,false);
});
test('scoped wiring uses installed SDK and shared durable transport budget for exactly two planned creations and link',async t=>{
 const {createClient}=await import('@supabase/supabase-js'),{buildOfflineScoped}=await import('../scoped/wiring.mjs'),f=fixture(t);let requests=0;
 const pair=[{account_id:f.plan.authH,student_id:f.plan.studentH},{account_id:f.plan.authE,student_id:f.plan.studentE}];
 const wired=buildOfflineScoped({...f,permit,makeAuthClient:opts=>createClient(`https://${PROJECT}.supabase.co`,'FIXTURE_NOT_A_KEY',opts),request:async(url,opts)=>{requests++;const body=JSON.parse(opts.body);return new Response(JSON.stringify({id:body.id,email:body.email,app_metadata:body.app_metadata}),{status:200});},pool:{connect:async()=>({query:async q=>({rows:typeof q==='object'&&q.text.includes('approved_scope')?[{approved:true}]:pair}),release:()=>{}})}});
 for(const persona of ['horizonte','estrela'])assert.equal((await f.exec.invoke({key:'create:'+persona,kind:'create',call:()=>wired.auth.createIdentity(persona,'fixture-password-over-20')})).status,'confirmed');
 const refs=f.ledger.inspect(f.plan.runId).resources.map(({id,kind,runId,projectId})=>({id,kind,runId,projectId}));
 assert.equal((await f.exec.invoke({key:'link:scoped',kind:'link',call:()=>wired.postgres.link(refs)})).status,'confirmed');
 const doc=f.ledger.inspect(f.plan.runId);assert.equal(doc.authDispatches.length,2);assert.equal(doc.providerCalls.length,14);assert.equal(requests,2);assert.ok(!JSON.stringify(doc).includes('fixture-password-over-20'));
});
test('missing approved manifest refuses Auth before dispatch and never assumes truthy unknown response',async t=>{
 const f=fixture(t);let requests=0;
 const broker=new ScopedAuthBroker({...f,permit,approveScope:async()=>false,admin:{auth:{admin:{createUser:async()=>requests++}}},publicClient:()=>({})});
 await f.exec.invoke({key:'create:horizonte',kind:'create',call:()=>broker.createIdentity('horizonte','fixture-password-over-20')});assert.equal(requests,0);assert.equal((f.ledger.inspect(f.plan.runId).authDispatches||[]).length,0);
});
