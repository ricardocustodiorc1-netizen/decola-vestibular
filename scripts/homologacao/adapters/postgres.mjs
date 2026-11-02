import {randomUUID} from 'node:crypto';
import {checkPermit,target,id,scope} from './boundary.mjs';
export class PreparedPostgresAdapter{
 #quarantine=null;
 constructor({pool,permit,context}){this.pool=pool;this.permit=permit;this.context=target(context);}
 gate(){checkPermit(this.permit);}
 async #read(sql,values=[]){
  this.gate();let client;
  try{client=await this.pool.connect();await client.query('BEGIN READ ONLY');await client.query("SET LOCAL statement_timeout='5s'");const result=await client.query({text:sql,values,query_timeout:6000});await client.query('ROLLBACK');client.release();client=null;return result.rows;}
  catch{if(client){try{client.release(true);}catch{}}throw Error('POSTGRES_READ_FAILED');}
 }
 async findFixture(identity){
  this.gate();if(!identity||!['horizonte','estrela'].includes(identity.persona)||identity.email!==`${identity.persona}+${this.context.runId}@decola.example.invalid`)throw Error('INVALID_FIXTURE_REFERENCE');
  const rows=await this.#read("SELECT id, raw_app_meta_data->>'decola_run_id' AS run_id FROM auth.users WHERE lower(email)=lower($1) LIMIT 2",[identity.email]);
  if(rows.length===0)return {outcome:'not-found',definitive:false,scope};
  if(rows.length!==1||rows[0].run_id!==this.context.runId)return {outcome:'preexisting-or-foreign',scope};
  return {outcome:'candidate',userId:id(rows[0].id),definitive:false,scope};
 }
 async link(resources){
  this.gate();if(!Array.isArray(resources)||resources.length!==2||new Set(resources.map(r=>r.id)).size!==2||resources.some(r=>r.kind!=='auth'||r.projectId!==this.context.projectId||r.runId!==this.context.runId))throw Error('UNPROVEN_AUTH_REFERENCE');
  for(const r of resources)id(r.id);
  this.#quarantine=null;let client,commitStarted=false;
  const records=resources.flatMap(r=>[{kind:'account',id:r.id,runId:this.context.runId,projectId:this.context.projectId},{kind:'student',id:randomUUID(),runId:this.context.runId,projectId:this.context.projectId}]);
  try{
   client=await this.pool.connect();await client.query('BEGIN');await client.query("SET LOCAL statement_timeout='5s'");
   for(let i=0;i<resources.length;i++){
    const userId=resources[i].id,studentId=records[i*2+1].id;
    // Trust only confirmed ledger IDs and require the server-owned run marker at insertion.
    const account=await client.query({text:"INSERT INTO decola.accounts(id) SELECT id FROM auth.users WHERE id=$1 AND raw_app_meta_data->>'decola_run_id'=$2 RETURNING id",values:[userId,this.context.runId],query_timeout:6000});
    if(account.rowCount!==1)throw Error();
    const eligibility=`2d:${this.context.runId}:${userId}`;
    await client.query({text:'INSERT INTO decola.students(id,account_id,eligibility_key) VALUES ($1,$2,$3)',values:[studentId,userId,eligibility],query_timeout:6000});
   }
   commitStarted=true;await client.query('COMMIT');client.release();client=null;return {resources:records};
  }catch{
   let discarded=false;
   if(client){try{if(!commitStarted)await client.query('ROLLBACK');}catch{/* No assumption of rollback success. */}try{client.release(true);discarded=true;}catch{}}
   this.#quarantine=discarded?{discarded:true,evidenceRef:randomUUID()}:null;
   throw Error('LINK_OUTCOME_UNKNOWN');
  }
 }
 quarantineEvidence(){if(!this.#quarantine)throw Error('QUARANTINE_UNVERIFIED');return {...this.#quarantine};}
 async inspectLinks(authResources){
  this.gate();if(!Array.isArray(authResources)||authResources.length!==2||authResources.some(r=>r.runId!==this.context.runId||r.projectId!==this.context.projectId||r.kind!=='auth'))throw Error('UNPROVEN_AUTH_REFERENCE');
  const ids=authResources.map(r=>id(r.id));
  const rows=await this.#read("SELECT a.id AS account_id,s.id AS student_id,s.eligibility_key,u.raw_app_meta_data->>'decola_run_id' AS run_id FROM decola.accounts a JOIN decola.students s ON s.account_id=a.id JOIN auth.users u ON u.id=a.id WHERE a.id=ANY($1::uuid[])",[ids]);
  if(rows.length!==2||new Set(rows.map(r=>r.account_id)).size!==2||rows.some(r=>!ids.includes(r.account_id)||r.run_id!==this.context.runId||r.eligibility_key!==`2d:${this.context.runId}:${r.account_id}`))return {outcome:'unresolved',scope};
  return {outcome:'confirmed',resources:rows.flatMap(r=>['account','student'].map(kind=>({kind,id:id(kind==='account'?r.account_id:r.student_id),runId:this.context.runId,projectId:this.context.projectId}))),scope};
 }
 async activeSession(userId,sessionId){
  this.gate();id(userId);id(sessionId);
  const rows=await this.#read("SELECT EXISTS(SELECT 1 FROM decola.accounts a JOIN auth.users u ON u.id=a.id JOIN auth.sessions s ON s.user_id=u.id WHERE a.id=$1 AND s.id=$2 AND NOT a.disabled AND u.email_confirmed_at IS NOT NULL AND u.deleted_at IS NULL AND (u.banned_until IS NULL OR u.banned_until<=clock_timestamp()) AND (s.not_after IS NULL OR s.not_after>clock_timestamp())) AS active",[userId,sessionId]);
  return rows.length===1&&rows[0].active===true;
 }
 async asStudent(userId,{action,studentId}={}){
  this.gate();id(userId);if(studentId)id(studentId);
  const actions={progress:['SELECT question_id,content_version,state,revision FROM decola.lesson_progress WHERE student_id=$1',[studentId]],students:['SELECT id FROM decola.students',[]],canStudy:['SELECT decola.can_study($1) AS allowed',[studentId]],requestTrial:['SELECT decola.request_trial($1) AS trial',[studentId]],cancelTrial:['SELECT decola.cancel_trial($1)',[studentId]]};
  if(!Object.hasOwn(actions,action)||action!=='students'&&!studentId)throw Error('INVALID_RLS_ACTION');
  let client;try{
   client=await this.pool.connect();await client.query('BEGIN');await client.query("SET LOCAL statement_timeout='5s'");await client.query('SET LOCAL ROLE authenticated');
   await client.query({text:"SELECT set_config('request.jwt.claim.sub',$1,true)",values:[userId],query_timeout:6000});
   await client.query("SELECT set_config('request.jwt.claim.role','authenticated',true)");
   const [text,values]=actions[action],result=await client.query({text,values,query_timeout:6000});
   // Even trial RPC tests roll back: no claims persisted by this adapter.
   await client.query('ROLLBACK');client.release();client=null;return {rows:result.rows,scope:'sql-role-contract-not-http-jwt'};
  }catch{if(client){try{client.release(true);}catch{}}throw Error('RLS_QUERY_UNCONFIRMED');}
 }
 executeRemoval(){throw Error('REMOTE_CLEANUP_BLOCKED');}
}
