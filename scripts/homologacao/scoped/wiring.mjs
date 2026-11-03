import {checkPermit} from '../adapters/boundary.mjs';
import {validateScope} from './plan.mjs';
import {ScopedAuthBroker} from './auth.mjs';
import {ScopedPostgresAdapter} from './postgres.mjs';
import {ScopedBearerBridge} from './bridge.mjs';
import {meteredFetch,meteredPool} from '../controls/provider-budget.mjs';
import {meteredBridge} from '../adapters/metered-bridge.mjs';
export function buildOfflineScoped({plan,ledger,lease,permit,makeAuthClient,pool,request}){
 checkPermit(permit);const p=validateScope(plan);if(lease.runId!==p.runId||ledger.inspect(lease.runId).projectId!==p.projectId)throw Error('RUN_MISMATCH');
 const bound=(url,options)=>{const u=new URL(url);if(u.origin!==`https://${p.projectId}.supabase.co`||u.username||u.password)throw Error('INVALID_TARGET');return request(url,options);};
 const options={global:{fetch:meteredFetch(bound,'auth')},auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
 const postgres=new ScopedPostgresAdapter({plan:p,permit,pool:meteredPool(pool)});
 const auth=new ScopedAuthBroker({plan:p,ledger,lease,permit,admin:makeAuthClient(options),publicClient:()=>makeAuthClient(options),approveScope:()=>postgres.approvedScope()});
 return {auth,postgres,bridge:meteredBridge({ledger,lease,bridge:new ScopedBearerBridge({auth,postgres,permit})})};
}
