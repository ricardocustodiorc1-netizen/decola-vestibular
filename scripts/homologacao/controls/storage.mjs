// LOCAL only. Online SQLite backup includes committed WAL pages; no live-file copy.
import {DatabaseSync,backup} from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
const APP=0x4445434f;
const digest=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function directory(dir){
 fs.mkdirSync(dir,{recursive:true,mode:0o700});
 if(fs.lstatSync(dir).isSymbolicLink()||fs.realpathSync(dir)!==path.resolve(dir))throw Error('SYMLINK_FORBIDDEN');
 fs.chmodSync(dir,0o700);return path.resolve(dir);
}
function flush(file){const fd=fs.openSync(file,'r');try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
function inspect(file){
 const db=new DatabaseSync(file,{readOnly:true});
 try{
  if(db.prepare('PRAGMA application_id').get().application_id!==APP||db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('INVALID_BACKUP');
  const runs=db.prepare('SELECT id,revision,doc FROM runs ORDER BY id').all();
  return runs.map(r=>{const d=JSON.parse(r.doc);if(d.id!==r.id||d.revision!==r.revision)throw Error('INVALID_BACKUP');return {id:r.id,revision:r.revision,state:d.state,unresolved:d.operations.some(o=>['pending','unknown'].includes(o.status))};});
 }finally{db.close();}
}
export async function backupLedger(ledger,backupDirectory){
 const dir=directory(backupDirectory),name=`backup-${randomUUID()}.sqlite`,file=path.join(dir,name),pending=file+'.pending';
 // No concurrent retention/restore writer is authorized. Unique filenames prevent overwrite.
 fs.writeFileSync(pending,'',{flag:'wx',mode:0o600});
 try{
  await backup(ledger.db,pending);fs.chmodSync(pending,0o600);const runs=inspect(pending);flush(pending);fs.renameSync(pending,file);flush(dir);
  const manifest={version:1,file:name,sha256:digest(file),createdAt:Date.now(),runs};
  const manifestPath=file+'.json';fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n',{flag:'wx',mode:0o600});flush(manifestPath);flush(dir);
  return {manifestPath,...manifest};
 }catch{throw Error('BACKUP_FAILED');} // Incomplete files are retained for inspection, never auto-deleted.
}
export function verifyBackup(manifestPath){
 const dir=directory(path.dirname(manifestPath));
 if(fs.lstatSync(manifestPath).isSymbolicLink())throw Error('SYMLINK_FORBIDDEN');
 const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
 if(manifest.version!==1||!/^backup-[a-f0-9-]{36}\.sqlite$/.test(manifest.file)||!Number.isSafeInteger(manifest.createdAt))throw Error('INVALID_MANIFEST');
 const file=path.join(dir,manifest.file);if(fs.lstatSync(file).isSymbolicLink())throw Error('SYMLINK_FORBIDDEN');
 if(digest(file)!==manifest.sha256)throw Error('BACKUP_HASH_MISMATCH');
 const runs=inspect(file);if(JSON.stringify(runs)!==JSON.stringify(manifest.runs))throw Error('BACKUP_METADATA_MISMATCH');
 return {...manifest,file};
}
export function restoreBackup(manifestPath,destination,{sourceQuiesced=false}={}){
 if(sourceQuiesced!==true)throw Error('SOURCE_QUIESCENCE_REQUIRED');
 const manifest=verifyBackup(manifestPath),dir=directory(destination);
 if(fs.readdirSync(dir).length)throw Error('RESTORE_DESTINATION_NOT_EMPTY');
 const file=path.join(dir,'runs.sqlite');fs.copyFileSync(manifest.file,file,fs.constants.COPYFILE_EXCL);fs.chmodSync(file,0o600);
 const db=new DatabaseSync(file);
 try{db.exec('BEGIN IMMEDIATE; UPDATE leases SET expires=0,epoch=epoch+1; COMMIT;');}finally{db.close();}
 flush(file);flush(dir);return {file,scope:'local-restore',reconciliationRequired:true};
}
export function retentionPlan(manifestPaths,{days=30,now=Date.now()}={}){
 if(!Number.isInteger(days)||days<7||days>365)throw Error('INVALID_RETENTION');
 return manifestPaths.map(manifestPath=>{const m=verifyBackup(manifestPath),closed=m.runs.every(r=>r.state==='cleaned'&&!r.unresolved);
  return {manifestPath,eligibleForSeparateApproval:closed&&now-m.createdAt>=days*86400000,reason:!closed?'open-or-unresolved-run':'retention-window',deleteExecuted:false};});
}
export function executeRetention(){throw Error('RETENTION_DELETION_BLOCKED');}
