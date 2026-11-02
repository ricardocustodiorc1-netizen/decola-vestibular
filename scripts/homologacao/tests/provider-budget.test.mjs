import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {Socket} from 'node:net';
import {createClient} from '@supabase/supabase-js';
import {LocalLedger,PROJECT,ORGANIZATION} from '../controls/ledger.mjs';
import {ControlledExecutor} from '../controls/executor.mjs';
import {providerCall,withProviderOperation,meteredFetch,meteredPool} from '../controls/provider-budget.mjs';
import {buildOfflineMeteredAdapters} from '../adapters/offline-metered.mjs';
import {offlineTestPermit} from '../adapters/boundary.mjs';
import {backupLedger,restoreBackup} from '../controls/storage.mjs';
const connect=Socket.prototype.connect;Socket.prototype.connect=function(){throw Error('NETWORK_FORBIDDEN');};test.after(()=>Socket.prototype.connect=connect);
function fixture(t,limits={}){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'decola-count-'));const f={dir,ledger:new LocalLedger(path.join(dir,'state'))};f.run=f.ledger.create({limits});f.lease=f.ledger.claim(f.run);f.ledger.authorize(f.lease,randomUUID());f.exec=new ControlledExecutor(f.ledger,f.lease);t.after(()=>{if(!f.closed)f.ledger.close();fs.rmSync(dir,{force:true,recursive:true});});return f;}
const read=(f,key,call)=>f.exec.invoke({key:'inspect:'+key,kind:'read',call});
test('100 calls shared across channels; 101st never reaches transport; restart does not reset budget',async t=>{
 const f=fixture(t);let effects=0;
 // Isolate call-count behavior from filesystem latency; timeout tests use real clocks.
 const countClock=Date.now();f.ledger.clock=()=>countClock;
 const result=await read(f,'budget',async()=>{for(let i=0;i<101;i++)await providerCall(['auth','postgres','http'][i%3],false,async()=>++effects);});
 assert.equal(result.status,'reconcile-required');assert.equal(effects,100);assert.equal(f.ledger.inspect(f.run).providerCalls.length,100);
 f.ledger.release(f.lease);f.ledger.close();f.closed=true;const l=new LocalLedger(path.join(f.dir,'state'));try{const lease=l.claim(f.run),e=new ControlledExecutor(l,lease);await e.invoke({key:'inspect:restart',kind:'read',call:()=>providerCall('http',false,()=>++effects)});assert.equal(effects,100);}finally{l.close();}
});
test('call reservation without a pending controller operation is refused',async t=>{
 const f=fixture(t);await assert.rejects(providerCall('http',false,async()=>{}),/OPERATION_REQUIRED/);
 await assert.rejects(withProviderOperation({ledger:f.ledger,lease:f.lease,operationId:randomUUID()},()=>providerCall('auth',true,async()=>{})),/OPERATION_REQUIRED/);
});
test('reservation persisted before callback; two ledger handles share concurrency ceiling',async t=>{
 const f=fixture(t,{maxConcurrency:1}),begin=f.ledger.begin(f.lease,{key:'inspect:concurrent',kind:'read'}),other=new LocalLedger(path.join(f.dir,'state'));
 try{const c=f.ledger.reserveProvider(f.lease,{operationId:begin.operation.id,channel:'auth'});assert.equal(other.inspect(f.run).providerCalls[0].status,'pending');assert.throws(()=>other.reserveProvider(f.lease,{operationId:begin.operation.id,channel:'http'}),/CONCURRENCY/);f.ledger.settleProvider(f.lease,c.id,'confirmed');}finally{other.close();}
});
test('unknown write/late callback cannot be repeated or release project',async t=>{
 const f=fixture(t,{timeoutMs:20});let effects=0;
 const result=await f.exec.invoke({key:'create:horizonte',kind:'create',call:()=>providerCall('auth',true,()=>new Promise(resolve=>setTimeout(()=>{effects++;resolve({});},50)))});
 assert.equal(result.status,'reconcile-required');await new Promise(r=>setTimeout(r,70));
 assert.equal(effects,1);assert.equal(f.ledger.inspect(f.run).providerCalls[0].status,'unknown');assert.equal(f.ledger.inspect(f.run).state,'auth_unknown');
 const n=f.ledger.inspect(f.run).providerCalls.length;await read(f,'no_retry',()=>providerCall('auth',true,async()=>++effects));assert.equal(f.ledger.inspect(f.run).providerCalls.length,n);assert.equal(effects,1);assert.throws(()=>f.ledger.release(f.lease),/PENDING/);
});
test('SDK requests, every SQL command and HTTP use one durable budget in prepared wiring',async t=>{
 const f=fixture(t),ids=[randomUUID(),randomUUID()];let created=0,network=0;const permit=offlineTestPermit();
 const a=buildOfflineMeteredAdapters({permit,context:{runId:f.run,projectId:PROJECT,organizationId:ORGANIZATION},origin:'https://bff.example.invalid',makeAuthClient:options=>createClient(`https://${PROJECT}.supabase.co`,'fixture-not-a-key',options),request:async(url,options)=>{
  network++;if(url.includes('/admin/users')){const input=JSON.parse(options.body);return new Response(JSON.stringify({id:ids[created++],email:input.email,app_metadata:input.app_metadata}),{status:200});}
  return new Response(JSON.stringify({accountId:ids[0]}),{status:200});
 },pool:{connect:async()=>({query:async()=>({rowCount:1,rows:[]}),release:()=>{}})}});
 for(const persona of ['horizonte','estrela'])assert.equal((await f.exec.invoke({key:'create:'+persona,kind:'create',call:()=>a.auth.createIdentity(persona,'fixture-long-password-only')})).status,'confirmed');
 const refs=f.ledger.inspect(f.run).resources.map(({kind,id,runId,projectId})=>({kind,id,runId,projectId}));
 assert.equal((await f.exec.invoke({key:'link:personas',kind:'link',call:()=>a.postgres.link(refs)})).status,'confirmed');
 assert.equal((await read(f,'http',()=>a.http.ownIdentity('fixture-not-token',ids[0]))).status,'confirmed');
 const calls=f.ledger.inspect(f.run).providerCalls;assert.equal(calls.filter(c=>c.channel==='auth').length,2);assert.equal(calls.filter(c=>c.channel==='postgres').length,8);assert.equal(calls.filter(c=>c.channel==='http').length,1);assert.equal(network,3);assert.ok(!JSON.stringify(f.ledger.inspect(f.run)).includes('fixture-long-password-only'));assert.ok(!JSON.stringify(f.ledger.inspect(f.run)).includes('fixture-not-a-key'));assert.ok(calls.every(c=>c.status==='confirmed'));
});
test('network error and Auth 5xx stop subsequent request, no SDK retry reaching provider',async t=>{
 const f=fixture(t);let hits=0;const fetch=meteredFetch(async()=>{hits++;return new Response('{}',{status:503});},'auth');
 await read(f,'failure',()=>fetch('https://fixture.invalid',{method:'POST'}));await read(f,'again',()=>fetch('https://fixture.invalid',{method:'POST'}));assert.equal(hits,1);assert.equal(f.ledger.inspect(f.run).providerCalls[0].status,'unknown');
});
test('HTTP body is consumed within operation timeout, not after confirmed reservation',async t=>{
 const f=fixture(t,{timeoutMs:20});const fetch=meteredFetch(async()=>({status:200,text:()=>new Promise(()=>{})}));await read(f,'body',()=>fetch('https://fixture.invalid'));
 assert.equal(f.ledger.inspect(f.run).providerCalls[0].status,'unknown');
});
test('late Postgres connection is physically discarded after timeout',async t=>{
 const f=fixture(t,{timeoutMs:20});let discarded=false;const pool=meteredPool({connect:()=>new Promise(resolve=>setTimeout(()=>resolve({release:d=>discarded=d,query:async()=>{}}),50))});
 await read(f,'connect',()=>pool.connect());await new Promise(r=>setTimeout(r,70));assert.equal(discarded,true);assert.equal(f.ledger.inspect(f.run).providerCalls[0].status,'unknown');
});
test('backup restores call count and pending call becomes unknown on takeover',async t=>{
 const f=fixture(t),op=f.ledger.begin(f.lease,{key:'inspect:backup',kind:'read'});f.ledger.reserveProvider(f.lease,{operationId:op.operation.id,channel:'postgres'});
 const b=await backupLedger(f.ledger,path.join(f.dir,'backups')),r=restoreBackup(b.manifestPath,path.join(f.dir,'restore'),{sourceQuiesced:true});const l=new LocalLedger(path.dirname(r.file));try{l.claim(f.run);assert.equal(l.inspect(f.run).providerCalls.length,1);assert.equal(l.inspect(f.run).providerCalls[0].status,'unknown');assert.throws(()=>l.settleProvider(f.lease,l.inspect(f.run).providerCalls[0].id,'confirmed'),/STALE_LEASE/);}finally{l.close();}
});
test('unknown call requires explicit definitive quietude; reconciliation never refunds budget or repeats parent write',async t=>{
 const f=fixture(t);await f.exec.invoke({key:'create:horizonte',kind:'create',call:()=>providerCall('auth',true,async()=>{throw Error('lost');})});
 const c=f.ledger.inspect(f.run).providerCalls[0];assert.throws(()=>f.ledger.reconcileProvider(f.lease,{callId:c.id,outcome:'absent',evidenceRef:randomUUID()}),/QUIESCENCE/);
 f.ledger.reconcileProvider(f.lease,{callId:c.id,outcome:'absent',evidenceRef:randomUUID(),definitive:true,quiesced:true});assert.equal(f.ledger.inspect(f.run).providerCalls.length,1);assert.equal(f.ledger.inspect(f.run).operations[0].status,'unknown');
 await assert.rejects(f.exec.invoke({key:'create:horizonte',kind:'create',call:async()=>{}}),/NOT_RETRYABLE/);
});
test('SIGKILL after durable reservation recovers unknown without invoking provider again',async t=>{
 const {spawn}=await import('node:child_process');const f=fixture(t),op=f.ledger.begin(f.lease,{key:'inspect:crash',kind:'read'});
 const code=`import {LocalLedger} from ${JSON.stringify(new URL('../controls/ledger.mjs',import.meta.url).href)};const l=new LocalLedger(${JSON.stringify(path.join(f.dir,'state'))});l.reserveProvider(${JSON.stringify(f.lease)},{operationId:${JSON.stringify(op.operation.id)},channel:'postgres'});console.log('reserved');setInterval(()=>{},1000);`;
 const child=spawn(process.execPath,['--input-type=module','-e',code],{stdio:['ignore','pipe','pipe']});let output='';const exited=new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',resolve);});
 child.stdout.on('data',c=>{output+=c;if(output.includes('reserved'))child.kill('SIGKILL');});await exited;assert.ok(output.includes('reserved'));
 f.ledger.clock=()=>Date.now()+40000;f.ledger.claim(f.run);assert.equal(f.ledger.inspect(f.run).providerCalls[0].status,'unknown');assert.equal(f.ledger.inspect(f.run).providerCalls.length,1);
});
test('prepared Auth transport rejects another project before any request reaches provider',async t=>{
 const f=fixture(t);let fetch,hits=0;
 buildOfflineMeteredAdapters({permit:offlineTestPermit(),context:{runId:f.run,projectId:PROJECT,organizationId:ORGANIZATION},origin:'https://bff.example.invalid',makeAuthClient:o=>{fetch=o.global.fetch;return {auth:{admin:{}}};},pool:{},request:async()=>{hits++;return new Response('{}');}});
 await read(f,'wrong_target',()=>fetch('https://other-project.supabase.co/auth/v1/admin/users',{method:'POST'}));assert.equal(hits,0);assert.equal(f.ledger.inspect(f.run).providerCalls[0].status,'unknown');
});
