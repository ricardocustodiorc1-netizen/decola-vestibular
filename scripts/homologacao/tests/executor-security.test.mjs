import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import tls from 'node:tls';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {restrictedPgConfig,validatePgTls,validateRestrictedPg} from '../executor/postgres-security.mjs';
import {preparePersistentLedger,validatePersistentConfig} from '../executor/persistent.mjs';
import {withCredentialFile,activateRemoteExecutor} from '../executor/credentials.mjs';
import {PROJECT} from '../controls/ledger.mjs';
const host=`db.${PROJECT}.supabase.co`,settings={host,user:'decola_homologacao',password:'fixture-not-password',ca:'-----BEGIN CERTIFICATE----- fixture'};
const config=()=>restrictedPgConfig(settings);
function socket(){return {encrypted:true,authorized:true,servername:host,getProtocol:()=>'TLSv1.3',getPeerCertificate:()=>({subject:{CN:host},subjectaltname:'DNS:'+host,valid_from:'Jan 1 00:00:00 2025 GMT',valid_to:'Jan 1 00:00:00 2030 GMT'})};}
function client(row={}){return {connection:{stream:socket()},query:async()=>({rows:[{role:'decola_homologacao',login_role:'decola_homologacao',inherits:false,admin_option:false,elevated:false,elevated_membership:false,can_set_authenticated:true,schema_usage:true,read_columns:true,can_create:false,table_writes:false,...row}]})};}
test('PG config rejects broad role, wrong host, IP, missing CA and insecure variants',()=>{
 assert.equal(config().ssl.rejectUnauthorized,true);assert.equal(config().ssl.checkServerIdentity,tls.checkServerIdentity);
 for(const delta of [{user:'postgres'},{user:'service_role'},{host:'evil.invalid'},{host:'127.0.0.1'},{ca:''},{port:6543}])assert.throws(()=>restrictedPgConfig({...settings,...delta}),/REJECTED/);
});
test('certificate trusted chain, hostname and validity are all mandatory',()=>{
 assert.equal(validatePgTls(client(),config()).tlsVerified,true);
 for(const delta of [{authorized:false},{encrypted:false},{servername:'evil.invalid'},{getPeerCertificate:()=>({subjectaltname:'DNS:evil.invalid'})}])assert.throws(()=>validatePgTls({connection:{stream:{...socket(),...delta}}},config()),/REJECTED/);
 assert.throws(()=>validatePgTls(client(),config(),{now:Date.parse('2031-01-01')}),/CERTIFICATE_REJECTED/);
 assert.throws(()=>validatePgTls(client(),{...config(),ssl:{...config().ssl,rejectUnauthorized:false}}),/REJECTED/);
});
for(const [name,row] of Object.entries({adminOption:{admin_option:true},inherit:{inherits:true},bypass:{elevated:true},inheritedAdmin:{elevated_membership:true},setRoleDisguise:{login_role:'postgres'},dml:{table_writes:true},ddl:{can_create:true},missingGrant:{read_columns:false},cannotSetRole:{can_set_authenticated:false}}))test('permissions refuse '+name,async()=>{
 const c=client(row);let discarded=false;c.release=d=>discarded=d;await assert.rejects(validateRestrictedPg(c,config()),/PREFLIGHT_FAILED/);assert.equal(discarded,true);
});
test('successful read-role preflight does not claim provisioning or session-join permission',async()=>{
 const r=await validateRestrictedPg(client(),config());assert.equal(r.roleVerified,true);assert.equal(r.provisioningAuthorized,false);assert.equal(r.sessionJoinAuthorized,false);
});
test('real local TLS handshake: trusted CA passes, wrong hostname/untrusted CA fail',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'decola-tls-'));t.after(()=>fs.rmSync(dir,{force:true,recursive:true}));const key=path.join(dir,'key.pem'),cert=path.join(dir,'cert.pem');
 execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-days','1','-keyout',key,'-out',cert,'-subj','/CN='+host,'-addext','subjectAltName=DNS:'+host],{stdio:'ignore'});
 const pem=fs.readFileSync(cert,'utf8'),server=tls.createServer({key:fs.readFileSync(key),cert:pem},s=>s.end());server.on('tlsClientError',()=>{});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const connect=options=>new Promise((resolve,reject)=>{const s=tls.connect({host:'127.0.0.1',port:server.address().port,servername:host,rejectUnauthorized:true,...options});s.on('error',reject);s.once('secureConnect',()=>{try{resolve(validatePgTls({connection:{stream:s}},restrictedPgConfig({...settings,ca:pem})));}catch(e){reject(e);}finally{s.end();}});});
 assert.equal((await connect({ca:pem})).hostnameVerified,true);await assert.rejects(connect({ca:pem,servername:'evil.invalid'}));await assert.rejects(connect({}));
});
function persistent(t){const root=fs.mkdtempSync(path.join(os.homedir(),'decola-persistent-fixture-'));t.after(()=>fs.rmSync(root,{force:true,recursive:true}));return {version:1,remoteEnabled:false,storage:{root,operatorAttestedPersistent:true,operatorApprovalRef:randomUUID(),networkFilesystem:false},limits:{durationMs:600000,timeoutMs:10000,maxCalls:40,maxConcurrency:1,maxAttempts:2,maxProviderCalls:100}};}
test('persistent config refuses unapproved, temporary, broad limits and shared directories',t=>{
 const c=persistent(t);assert.throws(()=>validatePersistentConfig({...c,storage:{...c.storage,operatorAttestedPersistent:false}}),/NOT_APPROVED/);
 assert.throws(()=>validatePersistentConfig({...c,storage:{...c.storage,root:'/tmp'}}),/EPHEMERAL/);
 assert.throws(()=>validatePersistentConfig({...c,limits:{...c.limits,maxCalls:41}}),/INVALID_EXECUTOR/);
 fs.chmodSync(c.storage.root,0o755);assert.throws(()=>validatePersistentConfig(c),/UNSAFE/);
});
test('persistent preparation checks integrity, backs up, reopens existing run without enabling remote',async t=>{
 const c=persistent(t),prepared=await preparePersistentLedger(c),id=prepared.ledger.create({limits:prepared.limits});prepared.ledger.close();
 const reopened=await preparePersistentLedger(c);try{assert.equal(reopened.ledger.inspect(id).id,id);assert.equal(reopened.remoteEnabled,false);assert.ok(fs.existsSync(reopened.backupManifest));}finally{reopened.ledger.close();}
});
test('persistent preparation rejects symlink state path before opening ledger',async t=>{
 const c=persistent(t);fs.symlinkSync(c.storage.root,path.join(c.storage.root,'state'));await assert.rejects(preparePersistentLedger(c),/UNSAFE/);
});
test('credential file private local callback; invalid modes, symlink and repository refused; exceptions sanitized',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'decola-channel-'));t.after(()=>fs.rmSync(dir,{force:true,recursive:true}));const file=path.join(dir,'secrets.json'),data={authAdminKey:'FIXTURE_ONLY',authPublishableKey:'FIXTURE_ONLY',pgPassword:'FIXTURE_ONLY'};fs.writeFileSync(file,JSON.stringify(data),{mode:0o600});
 assert.equal(await withCredentialFile(file,async x=>x.pgPassword==='FIXTURE_ONLY'),true);
 await assert.rejects(withCredentialFile(file,async()=>{throw Error('FIXTURE_ONLY');}),/^Error: CREDENTIAL_CONSUMER_FAILED$/);
 fs.chmodSync(file,0o644);await assert.rejects(withCredentialFile(file,()=>{}),/UNSAFE/);fs.chmodSync(file,0o600);
 const sym=path.join(dir,'symlink');fs.symlinkSync(file,sym);await assert.rejects(withCredentialFile(sym,()=>{}),/UNSAFE/);
 fs.mkdirSync(path.join(dir,'.git'));await assert.rejects(withCredentialFile(file,()=>{}),/INSIDE_REPOSITORY/);assert.throws(activateRemoteExecutor,/REMOTE_EXECUTION_BLOCKED/);
});
