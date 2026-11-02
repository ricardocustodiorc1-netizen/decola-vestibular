import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {randomUUID} from 'node:crypto';
import {createHomologationServer} from '../../../server/homologation/app.mjs';
import {PreparedAuthAdapter} from '../adapters/auth.mjs';
import {PreparedPostgresAdapter} from '../adapters/postgres.mjs';
import {PreparedHttpAdapter} from '../adapters/http.mjs';
import {PreparedBearerBridge} from '../adapters/bearer-bridge.mjs';
import {offlineTestPermit} from '../adapters/boundary.mjs';
import {PROJECT,ORGANIZATION} from '../controls/ledger.mjs';
const config={environment:'local',host:'127.0.0.1',port:18643,origin:'http://127.0.0.1:18643',externalConnectionsEnabled:false,authProvider:'not-connected',paymentProvider:'asaas-sandbox-not-connected'};
test('loopback HTTP + real adapter code: identity, ownership, logout denial, default writes remain closed',async t=>{
 const permit=offlineTestPermit(),uid=randomUUID(),student=randomUUID(),foreign=randomUUID(),session=randomUUID();
 const context={projectId:PROJECT,organizationId:ORGANIZATION,runId:randomUUID()};let active=true,authValid=true,progressQueries=0;
 const token='fixture.'+Buffer.from(JSON.stringify({sub:uid,session_id:session})).toString('base64url')+'.not-signed';
 const auth=new PreparedAuthAdapter({permit,context,publicClient:()=>({auth:{getUser:async()=>authValid?{data:{user:{id:uid,email_confirmed_at:'2026-01-01'}}}:{error:{}}}})});
 const postgres=new PreparedPostgresAdapter({permit,context,pool:{connect:async()=>({query:async q=>{
  const text=typeof q==='string'?q:q.text;
  if(text.includes('JOIN auth.sessions'))return {rows:[{active}]};
  if(text==='SELECT id FROM decola.students')return {rows:[{id:student}]};
  if(text.includes('FROM decola.lesson_progress')){progressQueries++;return {rows:[{question_id:'porcentagem-1',revision:1}]};}
  return {rows:[]};
 },release:()=>{}})}});
 const bridge=new PreparedBearerBridge({permit,auth,postgres});
 const server=createHomologationServer({config,bearerBridge:bridge});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const port=server.address().port;
 function request(url,options={}){return new Promise((resolve,reject)=>{
  const req=http.request({host:'127.0.0.1',port,path:new URL(url).pathname,method:options.method||'GET',headers:{...options.headers,Host:'127.0.0.1:18643'},signal:options.signal},res=>{let text='';res.on('data',chunk=>text+=chunk);res.on('end',()=>resolve({status:res.statusCode,redirected:false,json:async()=>JSON.parse(text),text}));});req.on('error',reject);req.end();
 });}
 // Only request implementation remaps to loopback; no external DNS or SDK is constructed.
 const probes=new PreparedHttpAdapter({permit,origin:'https://bff.example.invalid',request});
 await probes.ownIdentity(token,uid);await probes.foreignProgress(token,foreign);assert.equal(progressQueries,0);
 const owned=await request('http://local/api/students/'+student+'/progress',{headers:{Authorization:'Bearer '+token}});assert.equal(owned.status,200);assert.equal(progressQueries,1);assert.ok(!owned.text.includes(token));
 active=false;assert.equal(await probes.accessDenied(token),true);assert.equal(progressQueries,1);
 active=true;authValid=false;assert.equal(await probes.accessDenied(token),true);
 authValid=true;const post=await request('http://local/api/trial/start',{method:'POST',headers:{Authorization:'Bearer '+token}});assert.equal(post.status,401);
 const signup=await request('http://local/api/auth/signup',{method:'POST'});assert.equal(signup.status,503);
});
test('default server never accepts a Bearer without explicit test bridge',async t=>{
 const server=createHomologationServer({config});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const status=await new Promise((resolve,reject)=>{http.get({host:'127.0.0.1',port:server.address().port,path:'/api/me',headers:{Host:'127.0.0.1:18643',Authorization:'Bearer fixture'}},r=>{r.resume();r.on('end',()=>resolve(r.statusCode));}).on('error',reject);});assert.equal(status,401);
});
