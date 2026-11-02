// Decola Vestibular / Etapa 2B — isolated Node.js 20+ integration harness.
// Dependencies: npm install --no-save @supabase/supabase-js pg
// Never run in a browser, GitHub Pages, or with production credentials.
// Required env: DECOLA_TEST_PROJECT_ID, SUPABASE_SERVICE_ROLE_KEY,
// SUPABASE_PUBLISHABLE_KEY, DECOLA_TEST_DATABASE_URL,
// DECOLA_HORIZONTE_EMAIL/PASSWORD, DECOLA_ESTRELA_EMAIL/PASSWORD.
// Optional execution gates: DECOLA_TEST_CREATE=YES, DECOLA_TEST_RUN=YES.
// The database URL must be a privileged direct/pooled Postgres connection;
// use SSL and a dedicated trusted runner. Never commit secrets.
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import { randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';

const PROJECT='yxxrfhobhonigwczzpim';
const URL=`https://${PROJECT}.supabase.co`;
const env=(name)=>{const v=process.env[name];if(!v)throw Error(`Missing ${name}`);return v;};
const mode=process.argv[2]??'check';
assert(['check','run'].includes(mode),'Use check or run');
assert.equal(env('DECOLA_TEST_PROJECT_ID'),PROJECT,'Wrong Supabase project');
if(process.env.SUPABASE_URL)assert.equal(process.env.SUPABASE_URL,URL);
if(mode==='check'){console.log('PASS: expected project; no network or writes');process.exit(0);}
assert.equal(env('DECOLA_TEST_CREATE'),'YES','Explicit creation gate required');
assert.equal(env('DECOLA_TEST_RUN'),'YES','Explicit test gate required');
const databaseUrl=env('DECOLA_TEST_DATABASE_URL');
const parsed=new URL(databaseUrl);
assert(['postgres:','postgresql:'].includes(parsed.protocol),'Postgres URL required');
assert(!['localhost','127.0.0.1'].includes(parsed.hostname),'Remote homologation database required');
const admin=createClient(URL,env('SUPABASE_SERVICE_ROLE_KEY'),{auth:{autoRefreshToken:false,persistSession:false}});
const pub=env('SUPABASE_PUBLISHABLE_KEY');
const pool=new pg.Pool({connectionString:databaseUrl,ssl:{rejectUnauthorized:true},max:2});
const people=['horizonte','estrela'].map(label=>({
 label,email:env(`DECOLA_${label.toUpperCase()}_EMAIL`),
 password:env(`DECOLA_${label.toUpperCase()}_PASSWORD`)
}));
for(const p of people)assert(p.password.length>=20,'Passwords must be >=20 characters');
assert.notEqual(people[0].email,people[1].email,'Emails must differ');
const created=[];
let db;
try{
 db=await pool.connect();
 const identity=await db.query('select current_database() as db, current_setting(\'is_superuser\') as superuser');
 console.log('Connected to homologation database:',identity.rows[0].db);
 const existing=await db.query("select count(*)::int as n from decola.accounts");
 console.log('Existing account count:',existing.rows[0].n);
 // Auth identities are created via the supported Admin API, not by inserting into auth.users.
 for(const p of people){
   const {data,error}=await admin.auth.admin.createUser({
     email:p.email,password:p.password,email_confirm:true,
     app_metadata:{decola_stage:'2b_synthetic',persona:p.label}
   });
   if(error)throw Error(`Auth create failed for ${p.label}: ${error.message}`);
   p.userId=data.user.id;created.push(p.userId);
   console.log('Created Auth user for',p.label,'id:',p.userId);
 }
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
 // Sign in separately using the public key; do not log tokens.
 for(const p of people){
   p.client=createClient(URL,pub,{auth:{autoRefreshToken:false,persistSession:false}});
   const {data,error}=await p.client.auth.signInWithPassword({email:p.email,password:p.password});
   if(error)throw Error(`Login failed for ${p.label}: ${error.message}`);
   assert.equal(data.user.id,p.userId);
   assert(data.session?.access_token);
   console.log('PASS: real Supabase Auth login',p.label);
 }
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
   console.log('PASS: RLS ownership / foreign student denied / no client INSERT:',p.label);
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
   console.log('PASS: trial 168h / repeat idempotent / can_study:',p.label);
 }
 // Progress is inserted by the trusted test runner, then verified under RLS.
 const a=people[0],b=people[1];
 await db.query("insert into decola.lesson_progress(student_id,question_id,content_version,state,source) values($1,'2b-synthetic-q1','2b-v1',$2,'server-attempt')",[a.studentId,JSON.stringify({test:true,correct:true})]);
 await asStudent(a,async()=>{const r=await db.query("select * from decola.lesson_progress where question_id='2b-synthetic-q1'");assert.equal(r.rowCount,1);});
 await asStudent(b,async()=>{const r=await db.query("select * from decola.lesson_progress where question_id='2b-synthetic-q1'");assert.equal(r.rowCount,0);});
 console.log('PASS: progress readable by owner only');
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
 console.log('PASS: cancellation blocks study and preserves progress');
 console.log('COMPLETE: synthetic records retained for audit; no automatic deletion');
}catch(e){
 console.error('FAILED:',e.message);
 if(created.length)console.error('Partial Auth user IDs retained for manual reconciliation:',created.join(','));
 process.exitCode=1;
}finally{
 if(db)db.release();
 await pool.end();
}
