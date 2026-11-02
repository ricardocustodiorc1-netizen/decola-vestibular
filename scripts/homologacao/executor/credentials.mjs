// Local credential channel contract. Never reads a real secret in this stage.
import fs from 'node:fs';
import path from 'node:path';
export async function withCredentialFile(file,consumer){
 if(!path.isAbsolute(file)||fs.lstatSync(file).isSymbolicLink()||fs.realpathSync(file)!==file)throw Error('UNSAFE_CREDENTIAL_FILE');
 for(let d=path.dirname(file);;d=path.dirname(d)){if(fs.existsSync(path.join(d,'.git')))throw Error('CREDENTIAL_INSIDE_REPOSITORY');if(d===path.dirname(d))break;}
 const stat=fs.statSync(file),dir=fs.statSync(path.dirname(file));
 if(!stat.isFile()||stat.size>16384||stat.uid!==process.getuid()||(stat.mode&0o777)!==0o600||(dir.mode&0o077)!==0||dir.uid!==process.getuid())throw Error('UNSAFE_CREDENTIAL_FILE');
 let secret;
 try{secret=JSON.parse(fs.readFileSync(file,'utf8'));if(!secret||Object.keys(secret).sort().join(',')!=='authAdminKey,authPublishableKey,pgPassword'||Object.values(secret).some(v=>typeof v!=='string'||!v))throw Error();}catch{throw Error('INVALID_CREDENTIAL_FILE');}
 try{return await consumer(Object.freeze(secret));}catch{throw Error('CREDENTIAL_CONSUMER_FAILED');}finally{secret=null;}
}
export function activateRemoteExecutor(){throw Error('REMOTE_EXECUTION_BLOCKED');}
