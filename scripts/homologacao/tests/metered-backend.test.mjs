import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
import {createHomologationServer} from '../../../server/homologation/app.mjs';
import {meteredBridge} from '../adapters/metered-bridge.mjs';
import {meteredFetch,providerCall} from '../controls/provider-budget.mjs';
import {LocalLedger} from '../controls/ledger.mjs';
import {ControlledExecutor} from '../controls/executor.mjs';
for(const maxConcurrency of [1,2])test(`HTTP and backend share durable budget; concurrency ${maxConcurrency}`,async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'decola-bff-budget-')),ledger=new LocalLedger(dir),run=ledger.create({limits:{maxConcurrency}}),lease=ledger.claim(run);ledger.authorize(lease,randomUUID());
 t.after(()=>{ledger.close();fs.rmSync(dir,{recursive:true,force:true});});const accountId=randomUUID();let upstream=0;
 const bridge=meteredBridge({ledger,lease,bridge:{resolve:()=>providerCall('auth',false,async()=>{upstream++;return {accountId,verified:true,disabled:false};}),progress:()=>providerCall('postgres',false,async()=>({status:200,body:{progress:[]}}))}});
 const config={environment:'local',host:'127.0.0.1',port:18643,origin:'http://127.0.0.1:18643',externalConnectionsEnabled:false,authProvider:'not-connected',paymentProvider:'asaas-sandbox-not-connected'};
 const server=createHomologationServer({config,bearerBridge:bridge});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const fetch=meteredFetch((url,options)=>new Promise((resolve,reject)=>{const req=http.get({host:'127.0.0.1',port:server.address().port,path:'/api/me',headers:{Host:'127.0.0.1:18643',Authorization:'Bearer fixture'},signal:options.signal},res=>{let text='';res.on('data',c=>text+=c);res.on('end',()=>resolve(new Response(text,{status:res.statusCode})));});req.on('error',reject);}));
 let status;await new ControlledExecutor(ledger,lease).invoke({key:'inspect:client',kind:'read',call:async()=>{status=(await fetch('https://bff.example.invalid')).status;}});
 if(maxConcurrency===2){assert.equal(status,200);assert.equal(upstream,1);assert.deepEqual(ledger.inspect(run).providerCalls.map(c=>c.channel),['http','auth']);assert.equal(ledger.inspect(run).calls,2);}else{assert.equal(status,503);assert.equal(upstream,0);}
});
