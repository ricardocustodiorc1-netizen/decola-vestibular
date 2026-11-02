// Bind server-side requests to the same durable run, never to client-supplied headers.
import {randomUUID} from 'node:crypto';
import {ControlledExecutor} from '../controls/executor.mjs';
export function meteredBridge({ledger,lease,bridge}){
 async function read(fn){
  let value;const result=await new ControlledExecutor(ledger,lease).invoke({key:'inspect:bff_'+randomUUID().replaceAll('-','').slice(0,20),kind:'read',call:async()=>{value=await fn();return {};}});
  if(result.status!=='confirmed')throw Error('BFF_PROVIDER_UNCONFIRMED');return value;
 }
 return {resolve:header=>read(()=>bridge.resolve(header)),progress:(principal,studentId)=>read(()=>bridge.progress(principal,studentId))};
}
