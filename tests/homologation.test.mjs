import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import {createSessions,sessionCookie,readSessionCookie,validateConfig,COMMERCIAL_POLICY} from '../server/homologation/security.mjs';
import {createHomologationServer} from '../server/homologation/app.mjs';
import {prepareSandboxCheckout,verifySandboxWebhookToken,ASAAS_SANDBOX} from '../server/homologation/asaas-sandbox.mjs';
const config=JSON.parse(fs.readFileSync(new URL('../environments/local.example.json',import.meta.url),'utf8'));
const sample={expressChoice:true,policyVersion:'commercial-v1',intentId:'fixture-intent',customerId:'cus_fixture',callbackOrigin:'https://homologacao.decola.invalid',serverDate:new Date('2026-11-02T12:00:00Z')};

test('configuração só aceita modo desconectado e origem local exata',()=>{
 assert.equal(validateConfig(config).host,'127.0.0.1');
 for(const change of [{host:'0.0.0.0'},{externalConnectionsEnabled:true},{environment:'production'},{origin:'http://localhost:8001'},{apiKey:'forbidden'},{authProvider:'supabase'}])assert.throws(()=>validateConfig({...config,...change}));
});
test('política aprovada não exige cartão e não converte trial automaticamente',()=>{
 assert.equal(COMMERCIAL_POLICY.trialSeconds,604800);assert.equal(COMMERCIAL_POLICY.amountCents,3990);assert.equal(COMMERCIAL_POLICY.cardRequiredForTrial,false);assert.equal(COMMERCIAL_POLICY.automaticConversion,false);
});
test('sessões expiram, revogam e não aceitam identificadores inventados',()=>{
 let now=100;const store=createSessions({clock:()=>now,ttlMs:10});const issued=store.issue('fixture-account');
 assert.equal(issued.token.length,64);assert.notEqual(issued.token,issued.csrf);assert.equal(store.resolve('inventado'),null);
 assert.equal(store.resolve(issued.token).accountId,'fixture-account');now=110;assert.equal(store.resolve(issued.token),null);
 const second=store.issue('fixture-account');store.revoke(second.token);assert.equal(store.resolve(second.token),null);
});
test('CSRF é vinculado à sessão e não aceita tokens ausentes ou de outra sessão',()=>{
 const store=createSessions(),a=store.issue('a'),b=store.issue('b');assert.equal(store.validCsrf(a,a.csrf),true);assert.equal(store.validCsrf(a,b.csrf),false);assert.equal(store.validCsrf(a,undefined),false);
});
test('cookies seguros, sem atributos de domínio e sem ambiguidade por duplicação',()=>{
 const token='a'.repeat(64),cookie=sessionCookie(token);
 assert.match(cookie,/__Host-decola_session=/);assert.match(cookie,/HttpOnly/);assert.match(cookie,/Secure/);assert.match(cookie,/SameSite=Lax/);assert.doesNotMatch(cookie,/Domain=/);
 assert.equal(readSessionCookie(cookie),token);assert.equal(readSessionCookie(cookie+'; __Host-decola_session='+token),null);assert.equal(readSessionCookie('__Host-decola_session=falso'),null);
 assert.match(sessionCookie(null,{clear:true}),/Max-Age=0/);
});
test('capacidade de sessão é limitada e libera registros expirados',()=>{
 let now=1;const store=createSessions({clock:()=>now,ttlMs:10,maxSessions:1});store.issue('a');assert.throws(()=>store.issue('b'));now=11;assert.doesNotThrow(()=>store.issue('b'));
});
test('Asaas prepara somente requisição sandbox, sem envio, preço e ciclo fixos',()=>{
 const request=prepareSandboxCheckout(sample);
 assert.equal(request.sent,false);assert.equal(request.url,ASAAS_SANDBOX+'/checkouts');assert.equal(request.body.items[0].value,39.9);assert.deepEqual(request.body.billingTypes,['CREDIT_CARD']);assert.equal(request.body.subscription.cycle,'MONTHLY');assert.equal(request.body.subscription.nextDueDate,'2026-11-02');assert.equal(request.body.externalReference,'fixture-intent');assert.equal(request.headers,undefined);
});
test('Asaas não prepara adesão sem escolha expressa ou referência válida',()=>{
 for(const change of [{expressChoice:false},{expressChoice:'true'},{policyVersion:'other'},{intentId:undefined},{customerId:'real-card-data'},{serverDate:new Date('invalid')},{callbackOrigin:'https://site-oficial.example'},{callbackOrigin:'https://homologacao.decola.invalid/path'}])assert.throws(()=>prepareSandboxCheckout({...sample,...change}));
});
test('autenticação de webhook rejeita token inválido sem presumir assinatura HMAC',()=>{
 const fixture='FIXTURE_NOT_A_REAL_SECRET_123456789';
 assert.equal(verifySandboxWebhookToken(fixture,fixture),true);assert.equal(verifySandboxWebhookToken('x'.repeat(fixture.length),fixture),false);assert.equal(verifySandboxWebhookToken(undefined,fixture),false);assert.equal(verifySandboxWebhookToken('short','short'),false);
});

async function withServer(fn,{verified=true,repository=null}={}){
 const sessions=createSessions();const session=sessions.issue('fixture-account-a');
 const server=createHomologationServer({config,sessions,resolvePrincipal:async id=>({accountId:id,verified,disabled:false}),repository});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const port=server.address().port;
 const request=({path='/api/me',method='GET',headers={},body}={})=>new Promise((resolve,reject)=>{
  const req=http.request({hostname:'127.0.0.1',port,path,method,headers:{Host:'127.0.0.1:8001',...headers}},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:JSON.parse(Buffer.concat(chunks).toString())}));});
  req.on('error',reject);req.end(body);
 });
 const auth={Cookie:sessionCookie(session.token,{secure:false}),Origin:config.origin,'X-CSRF-Token':session.csrf,'Content-Type':'application/json'};
 try{await fn({request,auth,sessions,session});}finally{await new Promise(resolve=>server.close(resolve));}
}
test('HTTP local informa desconexão e não cria conta, login ou e-mail',async()=>withServer(async({request})=>{
 const health=await request({path:'/health'});assert.equal(health.status,200);assert.equal(health.body.auth,'not-connected');assert.equal(health.headers['cache-control'],'no-store');
 for(const path of ['/api/auth/signup','/api/auth/login','/api/auth/recover']){const response=await request({path,method:'POST'});assert.equal(response.status,503);assert.equal(response.body.error,'auth_not_configured');}
}));
test('HTTP rejeita anonimato, Host estranho e não libera CORS genérico',async()=>withServer(async({request})=>{
 assert.equal((await request()).status,401);const denied=await request({headers:{Host:'attacker.invalid'}});assert.equal(denied.status,400);assert.equal(denied.headers['access-control-allow-origin'],undefined);
}));
test('HTTP não permite conta não verificada nem usa accountId do navegador',async()=>withServer(async({request,auth})=>{
 assert.equal((await request({headers:auth})).status,401);
},{verified:false}));
test('HTTP revalida sessão revogada',async()=>withServer(async({request,auth,sessions,session})=>{
 assert.equal((await request({headers:auth})).status,200);sessions.revoke(session.token);assert.equal((await request({headers:auth})).status,401);
}));
test('HTTP bloqueia CSRF, Origin ausente, origem externa e campos de privilégio',async()=>withServer(async({request,auth})=>{
 for(const headers of [{...auth,'X-CSRF-Token':'wrong'},{...auth,Origin:''},{...auth,Origin:'https://attacker.invalid'}])assert.equal((await request({path:'/api/trial/start',method:'POST',headers,body:'{"studentId":"student-a"}'})).status,403);
 const extra=await request({path:'/api/trial/start',method:'POST',headers:auth,body:'{"studentId":"student-a","isPaid":true}'});assert.equal(extra.status,400);
}));
test('HTTP contrato integrado chama repositório com identidade do servidor e bloqueia outro aluno',async()=>{
 const calls=[];const repository={ownsStudent:async(account,id)=>account==='fixture-account-a'&&id==='student-a',startTrial:async data=>{calls.push(data);return {fixtureOnly:true};},cancelTrial:async()=>({fixtureOnly:true})};
 await withServer(async({request,auth})=>{
  const result=await request({path:'/api/trial/start',method:'POST',headers:auth,body:'{"studentId":"student-a"}'});assert.equal(result.status,200);assert.equal(result.body.mode,'local-contract-test');
  assert.deepEqual(calls,[{accountId:'fixture-account-a',studentId:'student-a'}]);
  assert.equal((await request({path:'/api/trial/start',method:'POST',headers:auth,body:'{"studentId":"student-b"}'})).status,404);
 },{repository});
});
test('HTTP valida JSON/tamanho e não transforma falha do banco em sucesso',async()=>withServer(async({request,auth})=>{
 for(const [body,status]of [['invalid',400],['[]',400],[' '.repeat(4100),413]])assert.equal((await request({path:'/api/trial/start',method:'POST',headers:auth,body})).status,status);
 assert.equal((await request({path:'/api/trial/start',method:'POST',headers:auth,body:'{"studentId":"student-a"}'})).status,503);
}));
test('HTTP adesão exige consentimento e continua sem criar cobrança mesmo com fixture autorizada',async()=>withServer(async({request,auth})=>{
 assert.equal((await request({path:'/api/subscription/intent',method:'POST',headers:auth,body:'{"studentId":"student-a"}'})).status,400);
 const result=await request({path:'/api/subscription/intent',method:'POST',headers:auth,body:'{"studentId":"student-a","expressChoice":true,"policyVersion":"commercial-v1"}'});assert.equal(result.status,503);assert.equal(result.body.error,'sandbox_not_connected');
},{repository:{ownsStudent:async()=>true}}));

test('backend padrão não autentica mesmo quando existe token de sessão interno de teste',async()=>{
 const sessions=createSessions(),session=sessions.issue('fixture-only');const server=createHomologationServer({config,sessions});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const response=await new Promise((resolve,reject)=>{
   const req=http.request({hostname:'127.0.0.1',port:server.address().port,path:'/api/me',headers:{Host:'127.0.0.1:8001',Cookie:sessionCookie(session.token,{secure:false})}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});req.on('error',reject);req.end();
  });assert.equal(response,401);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
