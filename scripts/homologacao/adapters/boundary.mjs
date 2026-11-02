// No live capability can be created in 2D-A. Explicit test permits only.
import {PROJECT,ORGANIZATION} from '../controls/ledger.mjs';
const permits=new WeakSet();
export function offlineTestPermit(){const p=Object.freeze({scope:'offline-transport-test'});permits.add(p);return p;}
export function checkPermit(p){if(!permits.has(p))throw Error('REMOTE_EXECUTION_BLOCKED');}
export function enableRemoteExecution(){throw Error('REMOTE_EXECUTION_BLOCKED');}
export function target(context){
 if(!context||context.projectId!==PROJECT||context.organizationId!==ORGANIZATION||!isId(context.runId))throw Error('INVALID_TARGET');
 return Object.freeze({...context});
}
export const isId=x=>typeof x==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(x);
export function id(x){if(!isId(x))throw Error('INVALID_REFERENCE');return x;}
export const scope='offline-transport-validation';
