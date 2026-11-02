import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {LocalLedger} from '../controls/ledger.mjs';
import {backupLedger,verifyBackup,restoreBackup,retentionPlan,executeRetention} from '../controls/storage.mjs';
function fixture(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'decola-backup-'));const ledger=new LocalLedger(path.join(root,'state'));t.after(()=>{ledger.close();fs.rmSync(root,{force:true,recursive:true});});return {root,ledger,backups:path.join(root,'backups')};}
test('online backup includes committed WAL and validates private manifest/hash',async t=>{
 const f=fixture(t),runId=f.ledger.create(),lease=f.ledger.claim(runId);f.ledger.authorize(lease,randomUUID());
 assert.ok(fs.statSync(f.ledger.file+'-wal').size>0);
 const result=await backupLedger(f.ledger,f.backups),verified=verifyBackup(result.manifestPath);
 assert.equal(verified.runs[0].id,runId);assert.equal(verified.runs[0].state,'authorized');
 assert.equal(fs.statSync(verified.file).mode&0o777,0o600);assert.equal(fs.statSync(f.backups).mode&0o777,0o700);
 const restored=restoreBackup(result.manifestPath,path.join(f.root,'restore'),{sourceQuiesced:true});assert.equal(restored.reconciliationRequired,true);
 const ledger=new LocalLedger(path.dirname(restored.file));try{assert.equal(ledger.inspect(runId).revision,f.ledger.inspect(runId).revision);assert.throws(()=>ledger.checkLease(lease),/STALE_LEASE/);}finally{ledger.close();}
});
test('pending intent survives backup; restored takeover requires reconciliation and fences old owner',async t=>{
 const f=fixture(t),runId=f.ledger.create(),lease=f.ledger.claim(runId);f.ledger.authorize(lease,randomUUID());f.ledger.begin(lease,{key:'create:horizonte',kind:'create'});
 const b=await backupLedger(f.ledger,f.backups);const r=restoreBackup(b.manifestPath,path.join(f.root,'restored'),{sourceQuiesced:true});
 const ledger=new LocalLedger(path.dirname(r.file));try{const newLease=ledger.claim(runId);assert.equal(ledger.inspect(runId).state,'auth_unknown');assert.equal(ledger.inspect(runId).operations[0].status,'unknown');assert.throws(()=>ledger.begin(newLease,{key:'create:horizonte',kind:'create'}),/NOT_RETRYABLE/);}finally{ledger.close();}
});
test('restore requires stopped source and empty destination; never overwrites live ledger',async t=>{
 const f=fixture(t);f.ledger.create();const b=await backupLedger(f.ledger,f.backups);
 assert.throws(()=>restoreBackup(b.manifestPath,path.join(f.root,'new')),/QUIESCENCE_REQUIRED/);
 assert.throws(()=>restoreBackup(b.manifestPath,path.join(f.root,'state'),{sourceQuiesced:true}),/NOT_EMPTY/);
});
test('tampered backup or manifest cannot be restored',async t=>{
 const f=fixture(t);f.ledger.create();const b=await backupLedger(f.ledger,f.backups);
 const manifest=JSON.parse(fs.readFileSync(b.manifestPath));manifest.runs[0].state='cleaned';fs.writeFileSync(b.manifestPath,JSON.stringify(manifest));
 assert.throws(()=>verifyBackup(b.manifestPath),/METADATA_MISMATCH/);
 fs.appendFileSync(path.join(f.backups,b.file),'corrupt');assert.throws(()=>verifyBackup(b.manifestPath),/HASH_MISMATCH/);
});
test('unsafe manifest filenames and symlink backup directories rejected',async t=>{
 const f=fixture(t);f.ledger.create();const b=await backupLedger(f.ledger,f.backups);const m=JSON.parse(fs.readFileSync(b.manifestPath));m.file='../state/runs.sqlite';fs.writeFileSync(b.manifestPath,JSON.stringify(m));assert.throws(()=>verifyBackup(b.manifestPath),/INVALID_MANIFEST/);
 const link=path.join(f.root,'link');fs.symlinkSync(f.backups,link);await assert.rejects(backupLedger(f.ledger,link),/SYMLINK_FORBIDDEN/);
});
test('retention never proposes deletion of open/unknown runs; deletion execution blocked',async t=>{
 const f=fixture(t);f.ledger.create();const b=await backupLedger(f.ledger,f.backups);const [plan]=retentionPlan([b.manifestPath],{now:Date.now()+366*86400000});
 assert.equal(plan.eligibleForSeparateApproval,false);assert.equal(plan.deleteExecuted,false);assert.throws(executeRetention,/DELETION_BLOCKED/);
 assert.throws(()=>retentionPlan([],{days:0}),/INVALID_RETENTION/);
});
test('concurrent ledger open waits for existing writer before header/schema initialization',async t=>{
 const {spawn}=await import('node:child_process');const f=fixture(t);f.ledger.create();f.ledger.db.exec('BEGIN IMMEDIATE');
 const code=`import {LocalLedger} from ${JSON.stringify(new URL('../controls/ledger.mjs',import.meta.url).href)};console.log('ready');const l=new LocalLedger(${JSON.stringify(path.join(f.root,'state'))});l.db.exec('BEGIN IMMEDIATE; ROLLBACK;');l.close();console.log('opened');`;
 const child=spawn(process.execPath,['--input-type=module','-e',code],{stdio:['ignore','pipe','pipe']});let output='',errors='',released=false;
 child.stderr.on('data',c=>errors+=c);child.stdout.on('data',c=>{output+=c;if(output.includes('ready')&&!released){released=true;setTimeout(()=>f.ledger.db.exec('ROLLBACK'),100);}});
 const exit=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',resolve);});assert.equal(exit,0,errors);assert.ok(output.includes('opened'));
});
