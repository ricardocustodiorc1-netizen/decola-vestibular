// Prepared wiring ONLY; no live factory, credentials or provider imports.
import {checkPermit,target} from './boundary.mjs';
import {meteredFetch,meteredPool} from '../controls/provider-budget.mjs';
import {PreparedAuthAdapter} from './auth.mjs';
import {PreparedPostgresAdapter} from './postgres.mjs';
import {PreparedHttpAdapter} from './http.mjs';
export function buildOfflineMeteredAdapters({permit,context,makeAuthClient,pool,request,origin}){
 checkPermit(permit);target(context);
 const bounded=allowed=>(url,options)=>{const u=new URL(url);if(u.origin!==allowed||u.username||u.password)throw Error('TRANSPORT_TARGET_REJECTED');return request(url,options);};
 const options={global:{fetch:meteredFetch(bounded(`https://${context.projectId}.supabase.co`),'auth')},auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
 const admin=makeAuthClient(options),publicClient=()=>makeAuthClient(options);
 return {auth:new PreparedAuthAdapter({permit,context,admin,publicClient}),postgres:new PreparedPostgresAdapter({permit,context,pool:meteredPool(pool)}),http:new PreparedHttpAdapter({permit,origin,request:meteredFetch(bounded(origin),'http')})};
}
