// Validation only. NO SDK, privileged credentials or real provisioning transport.
import {pathToFileURL} from 'node:url';
import {PROJECT} from './controls/ledger.mjs';
import {ControlledExecutor} from './controls/executor.mjs';
import {isOfflineAdapter} from './controls/offline-adapter.mjs';
export async function runStage2B({mode='check',envVars={},ledger,lease,adapter}={}){
 if(envVars.DECOLA_TEST_PROJECT_ID!==PROJECT||envVars.SUPABASE_URL&&envVars.SUPABASE_URL!==`https://${PROJECT}.supabase.co`)throw Error('WRONG_TARGET');
 if(mode==='check')return {status:'checked',network:false,created:0};
 if(mode!=='run'||!ledger||!lease||!isOfflineAdapter(adapter))throw Error('CONTROLLED_OFFLINE_RUN_REQUIRED');
 ledger.checkLease(lease);const state=ledger.inspect(lease.runId);if(state.state!=='authorized'||state.operations.length)throw Error('RUN_NOT_FRESH');const executor=new ControlledExecutor(ledger,lease);
 for(const persona of ['horizonte','estrela']){
  let existing;
  const inspected=await executor.invoke({key:'inspect:'+persona,kind:'read',call:()=>{existing=adapter.inspectIdentity(persona);return {};}});
  if(inspected.status!=='confirmed')return {status:'reconcile-required',runId:lease.runId};
  if(existing.existingId){ledger.protectPreexisting(lease,{kind:'auth',id:existing.existingId});return {status:'reconcile-required',runId:lease.runId};}
  const created=await executor.invoke({key:'create:'+persona,kind:'create',call:context=>adapter.createIdentity({...context,persona})});
  if(created.status!=='confirmed')return {status:'reconcile-required',runId:lease.runId};
 }
 const linked=await executor.invoke({key:'link:personas',kind:'link',call:context=>adapter.link(context)});
 if(linked.status!=='confirmed')return {status:'reconcile-required',runId:lease.runId};
 ledger.startTesting(lease);
 return {status:'offline-contracts-ready',runId:lease.runId,network:false,remoteUsersCreated:0};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if((process.argv[2]??'check')!=='check'){console.error('BLOCKED: validation-only; no Supabase provisioning allowed');process.exitCode=2;}
 else try{await runStage2B({envVars:{DECOLA_TEST_PROJECT_ID:process.env.DECOLA_TEST_PROJECT_ID,SUPABASE_URL:process.env.SUPABASE_URL}});console.log('PASS: target checked; no network or writes');}catch{console.error('BLOCKED: invalid validation target');process.exitCode=2;}
}
