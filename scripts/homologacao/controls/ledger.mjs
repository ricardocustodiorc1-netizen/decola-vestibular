// Durable LOCAL control plane. No provider imports, credentials, HTTP or remote cleanup.
import {DatabaseSync} from 'node:sqlite';
import {randomUUID,createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
export const PROJECT='yxxrfhobhonigwczzpim',ORGANIZATION='gfuffaasrxaroosnwujl';
export const STATES=Object.freeze(['planned','authorized','create_pending','auth_confirmed','auth_unknown','link_pending','linked','link_unknown','testing','reconcile_required','retained','cleanup_approved','cleaned']);
const edges={planned:['authorized'],authorized:['create_pending','reconcile_required'],create_pending:['auth_confirmed','auth_unknown','reconcile_required'],auth_confirmed:['create_pending','link_pending','reconcile_required','retained'],auth_unknown:['reconcile_required'],link_pending:['linked','link_unknown','reconcile_required'],linked:['testing','reconcile_required','retained'],link_unknown:['reconcile_required'],testing:['retained','reconcile_required'],reconcile_required:['authorized','auth_confirmed','linked','retained','cleanup_approved'],retained:['cleanup_approved','reconcile_required'],cleanup_approved:['cleaned','reconcile_required'],cleaned:[]};
export function assertTransition(from,to){if(!edges[from]?.includes(to))throw Error('INVALID_TRANSITION');}
const clone=x=>structuredClone(x),uuid=x=>typeof x==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(x);
function requireId(x){if(!uuid(x))throw Error('INVALID_REFERENCE');return x;}
const kinds=['auth','account','student','progress'];
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const unresolved=d=>d.operations.some(o=>['pending','unknown'].includes(o.status));
const inventory=d=>d.resources.filter(r=>r.origin==='created').map(r=>({kind:r.kind,id:r.id,operationId:r.operationId})).sort((a,b)=>(a.kind+a.id).localeCompare(b.kind+b.id));
export class LocalLedger{
 constructor(directory,{clock=()=>Date.now()}={}){
  this.clock=clock;fs.mkdirSync(directory,{recursive:true,mode:0o700});
  if(fs.lstatSync(directory).isSymbolicLink())throw Error('SYMLINK_FORBIDDEN');
  if(fs.readdirSync(directory).some(name=>!['runs.sqlite','runs.sqlite-wal','runs.sqlite-shm'].includes(name)))throw Error('LEDGER_DIRECTORY_NOT_ISOLATED');
  this.file=path.join(directory,'runs.sqlite');const existed=fs.existsSync(this.file);
  if(fs.existsSync(this.file)&&fs.lstatSync(this.file).isSymbolicLink())throw Error('SYMLINK_FORBIDDEN');
  fs.chmodSync(directory,0o700);this.db=new DatabaseSync(this.file);fs.chmodSync(this.file,0o600);
  if(existed&&this.db.prepare('PRAGMA application_id').get().application_id!==0x4445434f){this.db.close();throw Error('UNRECOGNIZED_LEDGER');}
  this.db.exec('PRAGMA application_id=1145389903');
  this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=2000;
   CREATE TABLE IF NOT EXISTS runs(id TEXT PRIMARY KEY,project TEXT NOT NULL,revision INTEGER NOT NULL,doc TEXT NOT NULL CHECK(json_valid(doc)));
   CREATE TABLE IF NOT EXISTS leases(project TEXT PRIMARY KEY,run_id TEXT NOT NULL,owner TEXT NOT NULL,epoch INTEGER NOT NULL,expires INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS resource_owners(project TEXT NOT NULL,kind TEXT NOT NULL,id TEXT NOT NULL,run_id TEXT NOT NULL,origin TEXT NOT NULL,PRIMARY KEY(project,kind,id));`);
 }
 close(){this.db.close();}
 // Preserve controlled error codes; never expose SQLite/provider error text.
 atomic(fn){let result,error;this.db.exec('BEGIN IMMEDIATE');try{result=fn();this.db.exec('COMMIT');}catch(e){this.db.exec('ROLLBACK');error=e;}if(error)throw Error(/^[A-Z_]+$/.test(error.message)?error.message:'LEDGER_WRITE_FAILED');return result;}
 inspect(id){requireId(id);const row=this.db.prepare('SELECT doc FROM runs WHERE id=?').get(id);if(!row)throw Error('RUN_NOT_FOUND');return JSON.parse(row.doc);}
 save(d){if(!STATES.includes(d.state))throw Error('INVALID_STATE');if(this.clock()<d.lastClockAt)throw Error('CLOCK_ROLLBACK');d.lastClockAt=this.clock();d.revision++;this.db.prepare('UPDATE runs SET revision=?,doc=? WHERE id=?').run(d.revision,JSON.stringify(d),d.id);}
 event(d,type,extra={}){d.events.push({at:this.clock(),type,state:d.state,...extra});}
 move(d,state){assertTransition(d.state,state);d.state=state;this.event(d,'state');}
 create({projectId=PROJECT,organizationId=ORGANIZATION,limits={}}={}){
  if(projectId!==PROJECT||organizationId!==ORGANIZATION)throw Error('WRONG_TARGET');
  const defaults={durationMs:600000,timeoutMs:10000,maxCalls:40,maxConcurrency:2,maxAttempts:2};
  if(Object.keys(limits).some(k=>!(k in defaults)))throw Error('INVALID_LIMIT');
  const l={...defaults,...limits};for(const v of Object.values(l))if(!Number.isSafeInteger(v)||v<1)throw Error('INVALID_LIMIT');
  if(l.maxConcurrency>2||l.maxCalls>1000||l.maxAttempts>5||l.durationMs>3600000||l.timeoutMs>60000||l.timeoutMs>l.durationMs)throw Error('INVALID_LIMIT');
  const now=this.clock(),d={id:randomUUID(),projectId,organizationId,state:'planned',revision:0,lastClockAt:now,startedAt:now,deadline:now+l.durationMs,limits:l,calls:0,operations:[],resources:[],events:[],plans:[],sessionEvidence:null};
  this.atomic(()=>{this.db.prepare('INSERT INTO runs VALUES (?,?,?,?)').run(d.id,PROJECT,0,JSON.stringify(d));});return d.id;
 }
 claim(id,{owner=randomUUID(),leaseMs=30000}={}){
  requireId(owner);if(!Number.isSafeInteger(leaseMs)||leaseMs<1)throw Error('INVALID_LEASE');
  return this.atomic(()=>{
   const d=this.inspect(id);if(d.state==='cleaned')throw Error('RUN_CLOSED');
   const now=this.clock();if(now<d.lastClockAt)throw Error('CLOCK_ROLLBACK');const old=this.db.prepare('SELECT * FROM leases WHERE project=?').get(PROJECT);
   if(old&&old.expires>now)throw Error('PROJECT_BUSY');
   if(old&&old.run_id!==id){const previous=this.inspect(old.run_id);if(!['retained','cleaned'].includes(previous.state)||unresolved(previous))throw Error('PREVIOUS_RUN_UNRECONCILED');}
   if(old&&old.run_id===id){
    for(const o of d.operations)if(o.status==='pending')o.status='unknown';
    if(!['planned','cleaned'].includes(d.state)){
     const unknown=d.operations.find(o=>o.status==='unknown');
     if(d.state==='create_pending'&&unknown?.kind==='create')this.move(d,'auth_unknown');
     else if(d.state==='link_pending'&&unknown?.kind==='link')this.move(d,'link_unknown');
     else if(d.state!=='reconcile_required')this.move(d,'reconcile_required');
    }
    for(const p of d.plans)p.approval=null;d.sessionEvidence=null;
    this.event(d,'lease_recovered');this.save(d);
   }
   const lease={runId:id,owner,epoch:(old?.epoch||0)+1};
   this.db.prepare('INSERT INTO leases VALUES (?,?,?,?,?) ON CONFLICT(project) DO UPDATE SET run_id=excluded.run_id,owner=excluded.owner,epoch=excluded.epoch,expires=excluded.expires').run(PROJECT,id,owner,lease.epoch,now+leaseMs);
   return lease;
  });
 }
 checkLease(lease){
  const row=this.db.prepare('SELECT * FROM leases WHERE project=?').get(PROJECT);
  if(!row||row.run_id!==lease?.runId||row.owner!==lease?.owner||row.epoch!==lease?.epoch||row.expires<=this.clock())throw Error('STALE_LEASE');
 }
 mutate(lease,fn){return this.atomic(()=>{this.checkLease(lease);const d=this.inspect(lease.runId),r=fn(d);this.save(d);return clone(r??d);});}
 heartbeat(lease,leaseMs=30000){if(!Number.isSafeInteger(leaseMs)||leaseMs<1)throw Error('INVALID_LEASE');return this.atomic(()=>{this.checkLease(lease);this.db.prepare('UPDATE leases SET expires=? WHERE project=?').run(this.clock()+leaseMs,PROJECT);});}
 release(lease){return this.atomic(()=>{this.checkLease(lease);const d=this.inspect(lease.runId);if(unresolved(d))throw Error('PENDING_OPERATIONS');this.db.prepare('UPDATE leases SET expires=0 WHERE project=?').run(PROJECT);});}
 authorize(lease,approvalRef){requireId(approvalRef);return this.mutate(lease,d=>{this.move(d,'authorized');d.authorizationRef=approvalRef;});}
 begin(lease,{key,kind}){
  if(typeof key!=='string'||! /^(inspect|create|link|session|test):[a-z0-9_-]{1,32}$/.test(key)||!['read','create','link','session','test'].includes(kind))throw Error('INVALID_OPERATION');
  return this.mutate(lease,d=>{
   const old=d.operations.find(o=>o.key===key);
   if(old?.status==='confirmed')return {alreadyDone:true,operation:old};
   if(old&&!(kind==='read'&&old.status==='failed'&&old.attempts<d.limits.maxAttempts))throw Error('OPERATION_NOT_RETRYABLE');
   if(d.calls>=d.limits.maxCalls||this.clock()>=d.deadline)throw Error('BUDGET_EXHAUSTED');
   if(d.operations.filter(o=>o.status==='pending').length>=d.limits.maxConcurrency)throw Error('CONCURRENCY_LIMIT');
   if(kind!=='read'&&unresolved(d))throw Error('RECONCILIATION_REQUIRED');
   if(['planned','retained','cleanup_approved','cleaned'].includes(d.state))throw Error('EXECUTION_NOT_AUTHORIZED');
   if(kind==='create'){if(!['create:horizonte','create:estrela'].includes(key)||d.operations.filter(o=>o.kind==='create').length>=2)throw Error('AUTH_LIMIT');this.move(d,'create_pending');}
   if(kind==='link'){if(!d.resources.some(r=>r.kind==='auth'&&r.origin==='created'))throw Error('AUTH_REFERENCE_REQUIRED');this.move(d,'link_pending');}
   if(old&&old.kind!==kind)throw Error('OPERATION_KIND_MISMATCH');
   const op=old||{id:randomUUID(),key,kind,attempts:0};op.status='pending';op.attempts++;op.epoch=lease.epoch;
   if(!old)d.operations.push(op);d.calls++;this.event(d,'operation_pending',{operationId:op.id});return {alreadyDone:false,operation:op};
  });
 }
 addResources(d,operation,resources){
  if(!Array.isArray(resources)||resources.length>8)throw Error('INVALID_RESOURCE');
  for(const r of resources){
   if(!r||Object.keys(r).some(k=>!['kind','id','runId','projectId'].includes(k))||!kinds.includes(r.kind)||!uuid(r.id)||r.runId!==d.id||r.projectId!==PROJECT)throw Error('UNPROVEN_RESOURCE');
   const old=this.db.prepare('SELECT * FROM resource_owners WHERE project=? AND kind=? AND id=?').get(PROJECT,r.kind,r.id);
   if(old&&(old.run_id!==d.id||old.origin!=='created'))throw Error('UNPROVEN_RESOURCE');
   if(r.kind==='auth'&&!d.resources.some(x=>x.kind==='auth'&&x.id===r.id)&&d.resources.filter(x=>x.kind==='auth'&&x.origin==='created').length>=2)throw Error('AUTH_LIMIT');
   const prior=d.resources.find(x=>x.id===r.id&&x.kind===r.kind);if(prior&&prior.operationId!==operation.id)throw Error('UNPROVEN_RESOURCE');
   this.db.prepare('INSERT OR IGNORE INTO resource_owners VALUES (?,?,?,?,?)').run(PROJECT,r.kind,r.id,d.id,'created');
   if(!d.resources.some(x=>x.id===r.id&&x.kind===r.kind))d.resources.push({...r,origin:'created',operationId:operation.id});
  }
 }
 validateLink(d,resources){
  const auth=d.resources.filter(r=>r.origin==='created'&&r.kind==='auth').map(r=>r.id);
  if(auth.length!==2||resources.length!==4||resources.filter(r=>r.kind==='student').length!==2||resources.filter(r=>r.kind==='account').length!==2||!auth.every(id=>resources.some(r=>r.kind==='account'&&r.id===id))||new Set(resources.map(r=>r.kind+r.id)).size!==4)throw Error('INVALID_LINK_RESULT');
 }
 complete(lease,opId,{resources=[],sessionEvidence}={}){
  return this.mutate(lease,d=>{
   const o=d.operations.find(o=>o.id===opId);if(!o||o.status!=='pending'||o.epoch!==lease.epoch)throw Error('INVALID_COMPLETION');
   if(o.kind==='create'&&(resources.length!==1||resources[0].kind!=='auth'))throw Error('INVALID_AUTH_RESULT');
   if(o.kind==='link')this.validateLink(d,resources);
   if(['read','session'].includes(o.kind)&&resources.length)throw Error('READ_CANNOT_OWN_RESOURCE');
   if(o.kind==='test'&&(d.state!=='testing'||resources.some(r=>r.kind!=='progress')))throw Error('INVALID_TEST_RESOURCE');
   if(o.kind==='session'){
    if(!sessionEvidence||Object.keys(sessionEvidence).some(k=>!['refreshRevoked','accessDenied','evidenceRef'].includes(k))||sessionEvidence.refreshRevoked!==true||sessionEvidence.accessDenied!==true||!uuid(sessionEvidence.evidenceRef))throw Error('SESSION_EVIDENCE_REQUIRED');
    d.sessionEvidence={...sessionEvidence,inventoryHash:hash(inventory(d)),scope:'offline-contract-only'};
   }
   if(o.kind==='link')this.validateLink(d,resources);
    this.addResources(d,o,resources);o.status='confirmed';o.resourceRefs=resources.map(r=>({kind:r.kind,id:r.id}));
   if(o.kind==='create')this.move(d,'auth_confirmed');if(o.kind==='link')this.move(d,'linked');this.event(d,'operation_confirmed',{operationId:o.id});
  });
 }
 fail(lease,opId){return this.mutate(lease,d=>{
  const o=d.operations.find(o=>o.id===opId);if(!o||o.status!=='pending')throw Error('INVALID_COMPLETION');o.status=o.kind==='read'?'failed':'unknown';
  if(o.kind==='create')this.move(d,'auth_unknown');else if(o.kind==='link')this.move(d,'link_unknown');else if(d.state!=='reconcile_required')this.move(d,'reconcile_required');
  this.event(d,'operation_unconfirmed',{operationId:o.id});
 });}
 protectPreexisting(lease,{kind,id}){
  if(!kinds.includes(kind))throw Error('INVALID_RESOURCE');requireId(id);
  return this.mutate(lease,d=>{const old=this.db.prepare('SELECT * FROM resource_owners WHERE project=? AND kind=? AND id=?').get(PROJECT,kind,id);if(old)throw Error('RESOURCE_ALREADY_TRACKED');this.db.prepare('INSERT INTO resource_owners VALUES (?,?,?,?,?)').run(PROJECT,kind,id,d.id,'preexisting');d.resources.push({kind,id,origin:'preexisting'});if(d.state!=='reconcile_required')this.move(d,'reconcile_required');});
 }
 quarantine(lease,operationId,{discarded,evidenceRef}={}){
  requireId(evidenceRef);if(discarded!==true)throw Error('QUARANTINE_REQUIRED');
  return this.mutate(lease,d=>{const o=d.operations.find(o=>o.id===operationId);if(!o||o.kind!=='link'||o.status!=='unknown')throw Error('INVALID_QUARANTINE');o.quarantined=true;o.quarantineRef=evidenceRef;this.event(d,'connection_quarantined',{operationId});});
 }
 reconcile(lease,{operationId,outcome,evidenceRef,resources=[],definitive=false}){
  requireId(evidenceRef);if(!['confirmed','absent','unresolved'].includes(outcome))throw Error('INVALID_RECONCILIATION');
  if(outcome!=='unresolved'&&definitive!==true)throw Error('DEFINITIVE_EVIDENCE_REQUIRED');
  return this.mutate(lease,d=>{
   const o=d.operations.find(o=>o.id===operationId);if(!o||o.status!=='unknown')throw Error('INVALID_RECONCILIATION');
   if(d.state!=='reconcile_required')this.move(d,'reconcile_required');
   if(o.kind==='link'&&outcome!=='unresolved'&&!o.quarantined)throw Error('QUARANTINE_REQUIRED');
   if(outcome==='confirmed'){
    if(['read','session'].includes(o.kind)&&resources.length)throw Error('READ_CANNOT_OWN_RESOURCE');
    if(o.kind==='test'&&resources.some(r=>r.kind!=='progress'))throw Error('INVALID_TEST_RESOURCE');
    if(o.kind==='create'&&(resources.length!==1||resources[0].kind!=='auth'))throw Error('INVALID_AUTH_RESULT');
    if(o.kind==='link')this.validateLink(d,resources);
    this.addResources(d,o,resources);o.status='confirmed';o.resourceRefs=resources.map(r=>({kind:r.kind,id:r.id}));
   }else if(outcome==='absent'){if(resources.length)throw Error('INVALID_RECONCILIATION');o.status='resolved_absent';}
   o.reconciliationRef=evidenceRef;this.event(d,'reconciliation_recorded',{operationId:o.id});
  });
 }
 resume(lease,{state,approvalRef}){
  requireId(approvalRef);return this.mutate(lease,d=>{
   if(d.state!=='reconcile_required'||unresolved(d))throw Error('RECONCILIATION_REQUIRED');
   const expected=d.operations.some(o=>o.kind==='link'&&o.status==='confirmed')?'linked':d.resources.some(r=>r.kind==='auth'&&r.origin==='created')?'auth_confirmed':'authorized';
   if(state!==expected)throw Error('UNSAFE_RESUME');this.move(d,state);this.event(d,'resume_approved',{approvalRef});
  });
 }
 startTesting(lease){return this.mutate(lease,d=>{this.move(d,'testing');});}
 retain(lease,decisionRef){requireId(decisionRef);return this.mutate(lease,d=>{if(unresolved(d))throw Error('RECONCILIATION_REQUIRED');this.move(d,'retained');d.retentionRef=decisionRef;});}
 planCleanup(lease){return this.mutate(lease,d=>{
  if(unresolved(d)||!['retained','reconcile_required'].includes(d.state))throw Error('RECONCILIATION_REQUIRED');
  const resources=inventory(d);if(!resources.length)throw Error('NO_OWNED_RESOURCES');
  const p={id:randomUUID(),runId:d.id,projectId:PROJECT,resources,inventoryHash:hash(resources),approval:null};p.digest=hash({id:p.id,runId:p.runId,projectId:p.projectId,resources:p.resources});d.plans.push(p);this.event(d,'cleanup_planned');return p;
 });}
 approveCleanup(lease,{planId,digest,approvalRef}){requireId(approvalRef);return this.mutate(lease,d=>{
  const p=d.plans.find(p=>p.id===planId);if(!p||p.digest!==digest||p.inventoryHash!==hash(inventory(d)))throw Error('STALE_CLEANUP_PLAN');
  if(unresolved(d)||!d.sessionEvidence?.accessDenied||!d.sessionEvidence.refreshRevoked||d.sessionEvidence.inventoryHash!==hash(inventory(d)))throw Error('SESSION_EVIDENCE_REQUIRED');
  this.move(d,'cleanup_approved');p.approval=approvalRef;this.event(d,'cleanup_approved');
 });}
 executeRemoteCleanup(){throw Error('REMOTE_CLEANUP_BLOCKED');}
 verifyCleanup(lease,{planId,evidenceRef,observations}){
  requireId(evidenceRef);return this.mutate(lease,d=>{
   const p=d.plans.find(p=>p.id===planId);if(d.state!=='cleanup_approved'||!p?.approval||p.inventoryHash!==hash(inventory(d)))throw Error('CLEANUP_NOT_APPROVED');
   const exact=Array.isArray(observations)&&observations.every(o=>o&&Object.keys(o).every(k=>['kind','id','present'].includes(k)))&&observations.length===p.resources.length&&new Set(observations.map(o=>o.kind+o.id)).size===p.resources.length&&p.resources.every(r=>observations.some(o=>o.kind===r.kind&&o.id===r.id&&o.present===false));
   if(!exact){this.move(d,'reconcile_required');p.approval=null;this.event(d,'cleanup_incomplete');return {cleaned:false};}
   this.move(d,'cleaned');p.verificationRef=evidenceRef;this.event(d,'cleanup_verified_offline');return {cleaned:true,scope:'offline-contract-only'};
  });
 }
}
