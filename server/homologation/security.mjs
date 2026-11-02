// Local BFF boundary; no provider, credentials, account creation or network clients.
import { randomBytes, timingSafeEqual } from 'node:crypto';
export const COMMERCIAL_POLICY=Object.freeze({version:'commercial-v1',trialSeconds:604800,amountCents:3990,currency:'BRL',cardRequiredForTrial:false,automaticConversion:false});
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.length>0&&Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
export function createSessions({clock=()=>Date.now(),ttlMs=1800000,maxSessions=1000}={}){
 if(!Number.isSafeInteger(ttlMs)||ttlMs<=0||!Number.isSafeInteger(maxSessions)||maxSessions<1)throw Error('Invalid session configuration');
 const sessions=new Map();
 const prune=()=>{const now=clock();for(const [key,value]of sessions)if(value.expiresAt<=now)sessions.delete(key);};
 return Object.freeze({
  issue(accountId){
   if(typeof accountId!=='string'||!accountId.trim()||accountId.length>128)throw Error('Invalid account');
   prune();if(sessions.size>=maxSessions)throw Error('Session capacity reached');
   const token=randomBytes(32).toString('hex'),csrf=randomBytes(32).toString('hex');
   const session=Object.freeze({accountId,csrf,expiresAt:clock()+ttlMs});sessions.set(token,session);
   return Object.freeze({token,...session});
  },
  resolve(token){prune();return typeof token==='string'?sessions.get(token)||null:null;},
  revoke(token){sessions.delete(token);},
  validCsrf(session,provided){return !!session&&equal(session.csrf,provided);}
 });
}
export function sessionCookie(token,{secure=true,clear=false}={}){
 if(!clear&&!/^[a-f0-9]{64}$/.test(token))throw Error('Invalid session token');
 return `${secure?'__Host-decola_session':'decola_local_session'}=${clear?'':token}; Path=/; HttpOnly; SameSite=Lax${secure?'; Secure':''}${clear?'; Max-Age=0':''}`;
}
export function readSessionCookie(header,{secure=true}={}){
 if(typeof header!=='string'||header.length>4096)return null;
 const name=secure?'__Host-decola_session':'decola_local_session';
 const matches=header.split(';').map(x=>x.trim()).filter(x=>x.startsWith(name+'='));
 if(matches.length!==1)return null;const value=matches[0].slice(name.length+1);
 return /^[a-f0-9]{64}$/.test(value)?value:null;
}
export function validateConfig(config){
 const allowed=['environment','host','port','origin','externalConnectionsEnabled','authProvider','paymentProvider'];
 if(!config||Object.keys(config).some(k=>!allowed.includes(k))||!['local','homologation'].includes(config.environment)||config.host!=='127.0.0.1'||!Number.isSafeInteger(config.port)||config.port<1024||config.port>65535||config.externalConnectionsEnabled!==false||config.authProvider!=='not-connected'||config.paymentProvider!=='asaas-sandbox-not-connected')throw Error('Only isolated disconnected configuration is supported');
 const origin=new URL(config.origin);
 if(origin.origin!==config.origin||origin.username||origin.password||origin.search||origin.hash)throw Error('Exact origin required');
 if(config.environment==='local'&&config.origin!==`http://127.0.0.1:${config.port}`)throw Error('Local origin must match loopback listener');
 if(config.environment==='homologation'&&(origin.protocol!=='https:'||!origin.hostname.endsWith('.invalid')))throw Error('Homologation example must remain a non-routable placeholder');
 return Object.freeze({...config});
}
