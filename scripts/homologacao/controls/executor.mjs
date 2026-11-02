import {withProviderOperation} from './provider-budget.mjs';
// LOCAL control plane; no default transport, SDK, credentials, SQL or deletion.
export class ControlledExecutor{
 constructor(ledger,lease){this.ledger=ledger;this.lease=lease;}
 async invoke({key,kind,call,onUncertain}){
  const start=this.ledger.begin(this.lease,{key,kind});
  if(start.alreadyDone)return {status:'already-confirmed',operationId:start.operation.id};
  const opId=start.operation.id,d=this.ledger.inspect(this.lease.runId),abort=new AbortController();
  const timeout=Math.min(d.limits.timeoutMs,Math.max(1,d.deadline-this.ledger.clock()));let timer;
  try{
   const result=await Promise.race([Promise.resolve().then(()=>withProviderOperation({ledger:this.ledger,lease:this.lease,operationId:opId,signal:abort.signal},()=>call({signal:abort.signal,runId:d.id,projectId:d.projectId,operationId:opId}))),new Promise((_,reject)=>{timer=setTimeout(()=>{abort.abort();reject(Error('DEADLINE'));},timeout);})]);
   // Only the controller confirms; a late adapter result cannot mutate the ledger.
   this.ledger.complete(this.lease,opId,result||{});return {status:'confirmed',operationId:opId};
  }catch{
   try{this.ledger.fail(this.lease,opId);}catch{/* Expired/fenced owner cannot write: takeover recovers pending intent. */}
   if(kind==='link'&&onUncertain){
    clearTimeout(timer);let quarantineTimer;
    try{const proof=await Promise.race([Promise.resolve().then(()=>onUncertain()),new Promise((_,reject)=>{quarantineTimer=setTimeout(()=>reject(Error('QUARANTINE_TIMEOUT')),Math.min(d.limits.timeoutMs,Math.max(1,d.deadline-this.ledger.clock())));})]);this.ledger.quarantine(this.lease,opId,proof);}catch{/* Still unknown: no reuse, cleanup or automatic retry. */}finally{clearTimeout(quarantineTimer);}
   }
   return {status:'reconcile-required',operationId:opId,quarantineRequired:kind==='link'};
  }finally{clearTimeout(timer);}
 }
 async sessionControls(adapter){
  return this.invoke({key:'session:revocation',kind:'session',call:async context=>{
   // Contract only: return no access/refresh token and no provider response body.
   const evidence=await adapter(context);
   return {sessionEvidence:evidence};
  }});
 }
}
