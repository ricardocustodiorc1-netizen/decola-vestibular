// Factory-branded in-memory adapter. Cannot load a real transport or credentials.
import {randomUUID} from 'node:crypto';
const instances=new WeakSet();
export const isOfflineAdapter=value=>instances.has(value);
export function createOfflineAdapter({failure='',preexisting=false}={}){
 if(!['','connect','create-first','create-second','link','rollback','commit','session'].includes(failure))throw Error('INVALID_FIXTURE_FAILURE');
 const users=[],resources=[];let creates=0;
 const make=(kind,id,ctx)=>({kind,id,runId:ctx.runId,projectId:ctx.projectId});
 const adapter=Object.freeze({
  inspectIdentity(){if(failure==='connect')throw Error('FIXTURE_CONNECT_FAILURE');return preexisting?{existingId:'00000000-0000-4000-8000-000000000001'}:{};},
  createIdentity(ctx){creates++;if((failure==='create-first'&&creates===1)||(failure==='create-second'&&creates===2))throw Error('FIXTURE_UNKNOWN_RESPONSE');const id=randomUUID();users.push(id);const r=make('auth',id,ctx);resources.push(r);return {resources:[r]};},
  link(ctx){if(['link','rollback','commit'].includes(failure))throw Error('FIXTURE_TRANSACTION_UNKNOWN');const refs=users.flatMap(id=>[make('account',id,ctx),make('student',randomUUID(),ctx)]);resources.push(...refs);return {resources:refs};},
  sessions(){if(failure==='session')throw Error('FIXTURE_REVOCATION_UNKNOWN');return {refreshRevoked:true,accessDenied:true,evidenceRef:randomUUID()};},
  inventory(){return structuredClone(resources);}
 });instances.add(adapter);return adapter;
}
