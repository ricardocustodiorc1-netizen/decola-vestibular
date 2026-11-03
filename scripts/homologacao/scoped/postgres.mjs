import {checkPermit,id} from '../adapters/boundary.mjs';
import {validateScope,expectedResources} from './plan.mjs';
import {randomUUID} from 'node:crypto';
export class ScopedPostgresAdapter{
 #pool;#permit;#plan;#quarantine;
 constructor({pool,permit,plan}){this.#pool=pool;this.#permit=permit;this.#plan=validateScope(plan);}
 async #call(name,values,{write=false,validate=()=>true}={}){
  checkPermit(this.#permit);let c,committing=false;this.#quarantine=null;
  const queries={approval:'SELECT decola_guard.approved_scope($1::uuid,$2::uuid,$3::uuid,$4::uuid,$5::uuid,$6::timestamptz,$7::timestamptz) AS approved',provision:'SELECT * FROM decola_guard.provision_pair($1::uuid)',inspect:'SELECT * FROM decola_guard.inspect_pair($1::uuid)',session:'SELECT decola_guard.active_session($1::uuid,$2::uuid,$3::uuid) AS active',action:'SELECT decola_guard.student_action($1::uuid,$2::uuid,$3::uuid,$4::text,$5::uuid) AS result'};
  try{c=await this.#pool.connect();await c.query(write?'BEGIN':'BEGIN READ ONLY');const result=await c.query({text:queries[name],values,query_timeout:5000});if(!validate(result.rows))throw Error('UNCONFIRMED_RESULT');committing=write;await c.query(write?'COMMIT':'ROLLBACK');c.release();c=null;return result.rows;}
  catch{if(c){if(!committing){try{await c.query('ROLLBACK');}catch{}}try{c.release(true);this.#quarantine={discarded:true,evidenceRef:randomUUID()};}catch{}}throw Error(write?'SCOPED_WRITE_UNKNOWN':'SCOPED_READ_FAILED');}
 }
 #rows(rows){const p=this.#plan;return rows.length===2&&rows.some(r=>r.account_id===p.authH&&r.student_id===p.studentH)&&rows.some(r=>r.account_id===p.authE&&r.student_id===p.studentE);}
 async approvedScope(){const p=this.#plan,r=await this.#call('approval',[p.runId,p.authH,p.authE,p.studentH,p.studentE,new Date(p.startsAt).toISOString(),new Date(p.expiresAt).toISOString()]);return r.length===1&&r[0].approved===true;}
 async link(refs){
  const p=this.#plan;if(!Array.isArray(refs)||refs.length!==2||new Set(refs.map(r=>r.id)).size!==2||refs.some(r=>r.kind!=='auth'||r.runId!==p.runId||r.projectId!==p.projectId||![p.authH,p.authE].includes(r.id)))throw Error('UNPROVEN_AUTH_REFERENCE');
  const rows=await this.#call('provision',[p.runId],{write:true,validate:rows=>this.#rows(rows)});return {resources:expectedResources(p)};
 }
 async inspectLinks(){const rows=await this.#call('inspect',[this.#plan.runId]);return this.#rows(rows)?{outcome:'confirmed',resources:expectedResources(this.#plan)}:{outcome:'unresolved'};}
 async activeSession(uid,sid){id(uid);id(sid);if(![this.#plan.authH,this.#plan.authE].includes(uid))return false;const r=await this.#call('session',[this.#plan.runId,uid,sid]);return r.length===1&&r[0].active===true;}
 async asStudent(uid,{action,studentId=null,sessionId}={}){
  id(uid);id(sessionId);if(studentId!==null)id(studentId);
  if(![this.#plan.authH,this.#plan.authE].includes(uid)||!['students','progress','canStudy','requestTrial','cancelTrial'].includes(action))throw Error('SCOPED_ACTION_DENIED');
  const write=['requestTrial','cancelTrial'].includes(action),rows=await this.#call('action',[this.#plan.runId,uid,sessionId,action,studentId],{write});
  if(rows.length!==1||rows[0].result===null)throw Error('SCOPED_RESULT_UNCONFIRMED');const value=rows[0].result;
  return {rows:Array.isArray(value)?value:[value],scope:'prepared-private-sql-not-live-proof'};
 }
 quarantineEvidence(){if(!this.#quarantine)throw Error('QUARANTINE_UNVERIFIED');return {...this.#quarantine};}
 executeRemoval(){throw Error('REMOTE_CLEANUP_BLOCKED');}
}
