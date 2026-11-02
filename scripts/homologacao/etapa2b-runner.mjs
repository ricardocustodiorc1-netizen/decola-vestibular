// Offline validation of the ORIGINAL runner control flow, using injected test doubles.
// CLI real provisioning is disabled in this revision, regardless of environment gates.
// No Supabase credentials are read by the CLI. No transport is constructed by default.
import { randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
export async function runStage2B({mode='check',envVars={},createClient,Pool,adapterMode,logger=console}={}){
const PROJECT='yxxrfhobhonigwczzpim';
const API_URL=`https://${PROJECT}.supabase.co`;
const env=(name)=>{const v=envVars[name];if(!v)throw Error(`Missing ${name}`);return v;};
assert(['check','run'].includes(mode),'Use check or run');
assert.equal(env('DECOLA_TEST_PROJECT_ID'),PROJECT,'Wrong Supabase project');
if(envVars.SUPABASE_URL)assert.equal(envVars.SUPABASE_URL,API_URL);
if(mode==='check'){logger.log('PASS: expected project; no network or writes');return {status:'checked',network:false,created:0};}
assert.equal(adapterMode,'injected-test-doubles','Real execution is disabled in validation');
const sink=logger;logger={log:(...args)=>sink.log('[OFFLINE TEST DOUBLES]',...args),error:(...args)=>sink.error('[OFFLINE TEST DOUBLES]',...args)};
assert.equal(typeof createClient,'function');assert.equal(typeof Pool,'function');
assert.equal(env('DECOLA_TEST_CREATE'),'YES','Explicit creation gate required');
assert.equal(env('DECOLA_TEST_RUN'),'YES','Explicit test gate required');
const databaseUrl=env('DECOLA_TEST_DATABASE_URL');
const parsed=new URL(databaseUrl);
assert(['postgres:','postgresql:'].includes(parsed.protocol),'Postgres URL required');
assert.equal(parsed.hostname,`db.${PROJECT}.supabase.co`,'Database host does not match approved project');
assert(parsed.username && parsed.password,'Database credentials required');
assert(!parsed.search&&!parsed.hash,'Connection URL overrides are forbidden');
assert.equal(parsed.pathname,'/postgres','Unexpected database');
assert(!parsed.port||parsed.port==='5432','Unexpected direct database port');
const people=['horizonte','estrela'].map(label=>({
 label,email:env(`DECOLA_${label.toUpperCase()}_EMAIL`),
 password:env(`DECOLA_${label.toUpperCase()}_PASSWORD`)
}));
for(const p of people)assert(p.password.length>=20,'Passwords must be >=20 characters');
assert.notEqual(people[0].email.trim().toLowerCase(),people[1].email.trim().toLowerCase(),'Emails must differ');
const serviceRole=env('SUPABASE_SERVICE_ROLE_KEY'),pub=env('SUPABASE_PUBLISHABLE_KEY');
const admin=createClient(API_URL,serviceRole,{auth:{autoRefreshToken:false,persistSession:false}});
const pool=new Pool({connectionString:databaseUrl,ssl:{rejectUnauthorized:true},max:2});
const created=[];
// Never retry blindly after partial provisioning: preflight all Auth users first.
// A failed run requires reconciliation of its synthetic accounts before a retry.
let db;let phase='connect';const outcome={status:'passed',created:0,cleanup:'not-needed'};
try{
 db=await pool.connect();
 const identity=await db.query("select current_database() as db, current_setting('is_superuser') as superuser, current_user as role");
 logger.log('Injected database connection; fixture role:',identity.rows[0].role);
 const existing=await db.query("select count(*)::int as n from decola.accounts");
 logger.log('Existing account count:',existing.rows[0].n);
 phase='auth-preflight';
 // Verify both synthetic emails are unused BEFORE the first Auth write.
 let page=1, more=true;
 while(more){
   const {data,error}=await admin.auth.admin.listUsers({page,perPage:1000});
   if(error)throw Error('Auth preflight failed: '+error.message);
   const users=data.users??[];
   for(const u of users){
     if(people.some(p=>p.email.toLowerCase()===u.email?.toLowerCase()))
       throw Error('Test identity already exists. Reconcile manually; no writes performed.');
   }
   more=users.length===1000;
   page++;
   if(page>1000)throw Error('Auth preflight pagination exceeded safe bound');
 }
 // Abort if any synthetic rows already exist, to avoid cross-run contamination.
 const fixture=await db.query("select count(*)::int as n from decola.accounts a join auth.users u on u.id=a.id where u.raw_app_meta_data->>'decola_stage'='2b_synthetic'");
 if(fixture.rows[0].n)throw Error('Existing stage 2B fixtures require manual reconciliation');
 phase='auth-create';
 // Auth identities are created via the supported Admin API, not by inserting into auth.users.
 for(const p of people){
   const {data,error}=await admin.auth.admin.createUser({
     email:p.email,password:p.password,email_confirm:true,
     app_metadata:{decola_stage:'2b_synthetic',persona:p.label}
   });
   if(error)throw Error(`Auth create failed for ${p.label}: ${error.message}`);
   p.userId=data.user.id;created.push(p.userId);
   logger.log('Mock createUser accepted for',p.label);
 }
 phase='fixture-link';
 // One transaction for fixture provisioning. No privileged credentials enter client sessions.
 await db.query('BEGIN');
 try{
   for(const p of people){
     p.studentId=randomBytes(16).toString('hex').replace(/^(........)(....)(....)(....)(............)$/,'$1-$2-$3-$4-$5');
     p.eligibility=randomBytes(32).toString('hex');
     await db.query('insert into decola.accounts(id) values($1)',[p.userId]);
     await db.query('insert into decola.students(id,account_id,eligibility_key) values($1,$2,$3)',[p.studentId,p.userId,p.eligibility]);
   }
   await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e;}
 phase='login';
 // Sign in separately using the public key; do not log tokens.
 for(const p of people){
   p.client=createClient(API_URL,pub,{auth:{autoRefreshToken:false,persistSession:false}});
   const {data,error}=await p.client.auth.signInWithPassword({email:p.email,password:p.password});
   if(error)throw Error(`Login failed for ${p.label}: ${error.message}`);
   assert.equal(data.user.id,p.userId);
   assert(data.session?.access_token);
   logger.log('PASS: Auth login contract (test double)',p.label);
 }
 phase='sql-contracts';
 // Simulate authenticated Postgres role + JWT sub, always within rollback-only transactions.
 // This tests SQL RLS, not the HTTP Data API / token-signature verification.
 async function asStudent(p,callback){
   await db.query('BEGIN');
   try{
     await db.query('SET LOCAL ROLE authenticated');
     await db.query("select set_config('request.jwt.claim.sub',$1,true)",[p.userId]);
     await db.query("select set_config('request.jwt.claim.role','authenticated',true)");
     await callback();
   }finally{await db.query('ROLLBACK');}
 }
 for(const p of people){
   const other=people.find(x=>x!==p);
   await asStudent(p,async()=>{
     const own=await db.query('select id from decola.students');
     assert.deepEqual(own.rows.map(x=>x.id),[p.studentId]);
     const foreign=await db.query('select id from decola.students where id=$1',[other.studentId]);
     assert.equal(foreign.rowCount,0);
     const denied=await db.query('select has_table_privilege(current_user,\'decola.students\',\'INSERT\') as allowed');
     assert.equal(denied.rows[0].allowed,false);
   });
   logger.log('PASS: RLS ownership / foreign student denied / no client INSERT:',p.label);
 }
 for(const p of people){
   // request_trial writes persist in a dedicated transaction to verify idempotency.
   await db.query('BEGIN');
   try{
     await db.query('SET LOCAL ROLE authenticated');
     await db.query("select set_config('request.jwt.claim.sub',$1,true)",[p.userId]);
     const one=await db.query('select decola.request_trial($1) as trial',[p.studentId]);
     const two=await db.query('select decola.request_trial($1) as trial',[p.studentId]);
     assert.equal(one.rows[0].trial.startsAt,two.rows[0].trial.startsAt);
     const dates=one.rows[0].trial;
     assert.equal(new Date(dates.endsAt)-new Date(dates.startsAt),168*3600000);
     const active=await db.query('select decola.can_study($1) as allowed',[p.studentId]);
     assert.equal(active.rows[0].allowed,true);
     await db.query('COMMIT');
   }catch(e){await db.query('ROLLBACK');throw e;}
   logger.log('PASS: trial 168h / repeat idempotent / can_study:',p.label);
 }
 // Simulate expiry WITHOUT changing the clock or persisting altered trial dates.
 // The transaction rolls back the temporary date adjustment.
 await db.query('BEGIN');
 try{
   await db.query("update decola.trial_claims set starts_at=now()-interval '169 hours', ends_at=now()-interval '1 hour' where student_id=$1",[people[1].studentId]);
   await db.query('SET LOCAL ROLE authenticated');
   await db.query("select set_config('request.jwt.claim.sub',$1,true)",[people[1].userId]);
   const expired=await db.query('select decola.can_study($1) as allowed',[people[1].studentId]);
   assert.equal(expired.rows[0].allowed,false);
 }finally{await db.query('ROLLBACK');}
 logger.log('PASS: natural trial expiry simulated in rollback-only transaction');
 // Progress is inserted by the trusted test runner, then verified under RLS.
 const a=people[0],b=people[1];
 await db.query("insert into decola.lesson_progress(student_id,question_id,content_version,state,source) values($1,'2b-synthetic-q1','2b-v1',$2,'server-attempt')",[a.studentId,JSON.stringify({test:true,correct:true})]);
 await asStudent(a,async()=>{const r=await db.query("select * from decola.lesson_progress where question_id='2b-synthetic-q1'");assert.equal(r.rowCount,1);});
 await asStudent(b,async()=>{const r=await db.query("select * from decola.lesson_progress where question_id='2b-synthetic-q1'");assert.equal(r.rowCount,0);});
 logger.log('PASS: progress readable by owner only');
 await db.query('BEGIN');
 try{
   await db.query('SET LOCAL ROLE authenticated');
   await db.query("select set_config('request.jwt.claim.sub',$1,true)",[a.userId]);
   await db.query('select decola.cancel_trial($1)',[a.studentId]);
   const after=await db.query('select decola.can_study($1) as allowed',[a.studentId]);
   assert.equal(after.rows[0].allowed,false);
   await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e;}
 await asStudent(a,async()=>{const r=await db.query("select * from decola.lesson_progress where question_id='2b-synthetic-q1'");assert.equal(r.rowCount,1);});
 logger.log('PASS: cancellation blocks study and preserves progress');
 logger.log('COMPLETE: offline fixture state retained only inside the injected adapter');
}catch(e){
 outcome.status='failed';outcome.failurePhase=phase;logger.error('FAILED:',phase,'(provider details suppressed)');
 // Compensating cleanup: only IDs created by this process; never touch existing users.
 if(created.length){
   logger.error('Attempting compensating cleanup of this run only');
   try{
     if(db){
       await db.query('ROLLBACK').catch(()=>{});
       await db.query('BEGIN');
       try{
         await db.query('delete from decola.lesson_progress where student_id in (select id from decola.students where account_id=any($1::uuid[]))',[created]);
         await db.query('delete from decola.trial_claims where student_id in (select id from decola.students where account_id=any($1::uuid[]))',[created]);
         await db.query('delete from decola.progress_imports where student_id in (select id from decola.students where account_id=any($1::uuid[]))',[created]);
         await db.query('delete from decola.paid_periods where student_id in (select id from decola.students where account_id=any($1::uuid[]))',[created]);
         await db.query('delete from decola.students where account_id=any($1::uuid[])',[created]);
         await db.query('delete from decola.accounts where id=any($1::uuid[])',[created]);
         await db.query('COMMIT');
       }catch(cleanupError){await db.query('ROLLBACK');throw cleanupError;}
     }
     for(const id of created){
       const {error}=await admin.auth.admin.deleteUser(id);
       if(error)throw error;
     }
     outcome.cleanup='completed';logger.error('Compensating cleanup completed');
   }catch(cleanupError){outcome.cleanup='incomplete';logger.error('CLEANUP INCOMPLETE: stop and reconcile this run manually (details suppressed)');}
 }

}finally{
 try{if(db)db.release();}catch{outcome.status='failed';outcome.resourceClose='failed';logger.error('Resource release failed (details suppressed)');}
 try{await pool.end();}catch{outcome.status='failed';outcome.resourceClose='failed';logger.error('Pool close failed (details suppressed)');}
}
outcome.created=created.length;
return outcome;

}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const mode=process.argv[2]??'check';
 if(mode!=='check'){console.error('BLOCKED: validation-only; no Supabase provisioning allowed');process.exitCode=2;}
 else try{await runStage2B({mode,envVars:{DECOLA_TEST_PROJECT_ID:process.env.DECOLA_TEST_PROJECT_ID,SUPABASE_URL:process.env.SUPABASE_URL}});}catch{console.error('BLOCKED: invalid validation target');process.exitCode=2;}
}
