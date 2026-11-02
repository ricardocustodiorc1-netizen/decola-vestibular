// Shared durable counter. No credentials, client creation, transport or live capability.
import {AsyncLocalStorage} from 'node:async_hooks';
const operations=new AsyncLocalStorage();
export function withProviderOperation(context,fn){return operations.run(context,fn);}
export async function providerCall(channel,write,fn){
 const ctx=operations.getStore();if(!ctx)throw Error('PROVIDER_OPERATION_REQUIRED');
 if(ctx.signal?.aborted)throw Error('PROVIDER_ABORTED');
 const call=ctx.ledger.reserveProvider(ctx.lease,{operationId:ctx.operationId,channel,write});
 const abort=new AbortController();let timer,onAbort;
 try{
  const remaining=Math.max(1,call.deadline-ctx.ledger.clock());
  const cancelled=new Promise((_,reject)=>{
   onAbort=()=>{abort.abort();reject(Error('PROVIDER_DEADLINE'));};
   ctx.signal?.addEventListener('abort',onAbort,{once:true});
   timer=setTimeout(onAbort,remaining);
  });
  const result=await Promise.race([Promise.resolve().then(()=>{if(abort.signal.aborted||ctx.ledger.clock()>=call.deadline)throw Error('PROVIDER_ABORTED');return fn(abort.signal);}),cancelled]);
  const settled=ctx.ledger.settleProvider(ctx.lease,call.id,'confirmed');
  if(settled.status!=='confirmed')throw Error('PROVIDER_DEADLINE');return result;
 }catch{
  // Even a read timeout may leave a connection/transaction running. No automatic retry.
  try{ctx.ledger.settleProvider(ctx.lease,call.id,'unknown');}catch{/* Fenced/expired owner cannot confirm late outcome. */}
  throw Error('PROVIDER_OUTCOME_UNCONFIRMED');
 }finally{clearTimeout(timer);ctx.signal?.removeEventListener('abort',onAbort);}
}
export function meteredFetch(fetchImpl,channel='http'){
 return (url,options={})=>providerCall(channel,Boolean(options.method&&!['GET','HEAD'].includes(options.method.toUpperCase())),async signal=>{
  const response=await fetchImpl(url,{...options,redirect:'error',signal:options.signal?AbortSignal.any([signal,options.signal]):signal});
  // Consume the body inside the deadline; prevent unmetered hung response.json().
  const body=await response.text();
  if(channel==='auth'&&response.status>=500)throw Error('AUTH_RESPONSE_UNCERTAIN');
  return new Response(body,{status:response.status,statusText:response.statusText,headers:response.headers});
 });
}
export function meteredPool(pool){
 return {connect:()=>providerCall('postgres',false,async signal=>{
  const client=await pool.connect();
  if(signal.aborted){client.release(true);throw Error('LATE_CONNECTION_DISCARDED');}
  return {connection:client.connection,query:q=>{const sql=typeof q==='string'?q:q.text;return providerCall('postgres',!/^\s*SELECT\b/i.test(sql)||/\b(request_trial|cancel_trial|set_config)\b/i.test(sql),()=>client.query(q));},release:discard=>client.release(discard)};
 })};
}
