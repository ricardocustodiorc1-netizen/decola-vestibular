import {checkPermit,id} from '../adapters/boundary.mjs';
export class ScopedBearerBridge{
 #issued=new WeakSet();
 constructor({auth,postgres,permit}){this.auth=auth;this.postgres=postgres;this.permit=permit;}
 async resolve(header){
  checkPermit(this.permit);if(typeof header!=='string'||!header.startsWith('Bearer '))return null;
  try{const p=await this.auth.verifyBearer(header.slice(7));if(!await this.postgres.activeSession(p.userId,p.sessionId))return null;
   const principal=Object.freeze({accountId:p.userId,sessionId:p.sessionId,verified:true,disabled:false});this.#issued.add(principal);return principal;
  }catch{return null;}
 }
 async progress(principal,studentId){
  checkPermit(this.permit);if(!this.#issued.has(principal))throw Error('UNVERIFIED_PRINCIPAL');id(studentId);
  // Recheck on every protected operation, not only when opening the panel.
  if(!await this.postgres.activeSession(principal.accountId,principal.sessionId))return {status:401,body:{error:'authentication_required'}};
  const options={sessionId:principal.sessionId},own=await this.postgres.asStudent(principal.accountId,{...options,action:'students'});
  if(!own.rows.some(r=>r.id===studentId))return {status:404,body:{error:'resource_unavailable'}};
  const r=await this.postgres.asStudent(principal.accountId,{...options,action:'progress',studentId});return {status:200,body:{progress:r.rows}};
 }
}
