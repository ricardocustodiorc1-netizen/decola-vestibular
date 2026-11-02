import fs from 'node:fs';
import path from 'node:path';
import {LocalLedger} from '../controls/ledger.mjs';
import {backupLedger,verifyBackup} from '../controls/storage.mjs';
export function validatePersistentConfig(c){
 if(!c||c.version!==1||c.remoteEnabled!==false||c.storage?.operatorAttestedPersistent!==true||typeof c.storage.operatorApprovalRef!=='string'||! /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(c.storage.operatorApprovalRef)||c.storage.networkFilesystem!==false)throw Error('PERSISTENT_STORAGE_NOT_APPROVED');
 const root=c.storage.root;
 if(typeof root!=='string'||!path.isAbsolute(root)||['/tmp','/var/tmp','/workspace/scratch'].some(p=>root===p||root.startsWith(p+'/')))throw Error('EPHEMERAL_STORAGE_REJECTED');
 const stat=fs.lstatSync(root);if(!stat.isDirectory()||stat.isSymbolicLink()||fs.realpathSync(root)!==root||(stat.mode&0o077)!==0||stat.uid!==process.getuid())throw Error('UNSAFE_STORAGE');
 if(!c.limits||Object.keys(c.limits).sort().join(',')!=='durationMs,maxAttempts,maxCalls,maxConcurrency,maxProviderCalls,timeoutMs'||Object.values(c.limits).some(v=>!Number.isSafeInteger(v)||v<1)||c.limits.maxAttempts>2||c.limits.timeoutMs>c.limits.durationMs)throw Error('INVALID_EXECUTOR_LIMITS');
 if([0x6969,0xff534d42,0x517b,0x01021997,0x00c36400].includes(fs.statfsSync(root).type))throw Error('NETWORK_STORAGE_REJECTED');
 if(c.limits?.maxProviderCalls!==100||c.limits.maxCalls>40||c.limits.durationMs>600000||c.limits.timeoutMs>10000||![1,2].includes(c.limits.maxConcurrency))throw Error('INVALID_EXECUTOR_LIMITS');
 return {root,limits:c.limits};
}
export async function preparePersistentLedger(config){
 const {root,limits}=validatePersistentConfig(config);
 for(const name of ['state','backups']){const dir=path.join(root,name);if(fs.existsSync(dir)&&(fs.lstatSync(dir).isSymbolicLink()||fs.realpathSync(dir)!==dir))throw Error('UNSAFE_STORAGE');}
 const ledger=new LocalLedger(path.join(root,'state'));
 try{
  if(ledger.db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('LEDGER_INTEGRITY_FAILED');
  const snapshot=await backupLedger(ledger,path.join(root,'backups'));verifyBackup(snapshot.manifestPath);
  return {ledger,limits,backupManifest:snapshot.manifestPath,remoteEnabled:false};
 }catch{ledger.close();throw Error('PERSISTENT_PREFLIGHT_FAILED');}
}
