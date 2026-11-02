// Read-only BFF integration port. Never registers an account or creates a session.
import {checkPermit,id} from './boundary.mjs';
export class PreparedBearerBridge{
 constructor({auth,postgres,permit}){this.auth=auth;this.postgres=postgres;this.permit=permit;}
 async resolve(authorization){
  checkPermit(this.permit);if(typeof authorization!=='string'||!authorization.startsWith('Bearer '))return null;
  try{
   const identity=await this.auth.verifyBearer(authorization.slice(7));
   if(!await this.postgres.activeSession(identity.userId,identity.sessionId))return null;
   return {accountId:identity.userId,verified:true,disabled:false};
  }catch{return null;}
 }
 async progress(principal,studentId){
  checkPermit(this.permit);id(principal.accountId);id(studentId);
  const students=await this.postgres.asStudent(principal.accountId,{action:'students'});
  if(!students.rows.some(s=>s.id===studentId))return {status:404,body:{error:'resource_unavailable'}};
  const result=await this.postgres.asStudent(principal.accountId,{action:'progress',studentId});
  return {status:200,body:{progress:result.rows,mode:'prepared-adapter-test'}};
 }
}
