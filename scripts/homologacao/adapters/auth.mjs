// SDK-shaped adapter implementation; real connection factory is intentionally absent.
import {randomUUID} from 'node:crypto';
import {checkPermit,target,id,scope} from './boundary.mjs';
export function identityPlan(runId,domain='decola.example.invalid'){
 id(runId);if(typeof domain!=='string'||! /^[a-z0-9.-]+$/.test(domain)||!domain.endsWith('.invalid'))throw Error('CONTROLLED_TEST_DOMAIN_REQUIRED');
 return ['horizonte','estrela'].map(persona=>Object.freeze({persona,email:`${persona}+${runId}@${domain}`}));
}
export class PreparedAuthAdapter{
 #vault=new Map();
 constructor({admin,publicClient,permit,context}){this.admin=admin;this.publicClient=publicClient;this.permit=permit;this.context=target(context);this.identities=identityPlan(this.context.runId);}
 gate(){checkPermit(this.permit);}
 async createIdentity(persona,password){
  this.gate();const identity=this.identities.find(x=>x.persona===persona);
  if(!identity||typeof password!=='string'||password.length<20)throw Error('INVALID_FIXTURE_INPUT');
  try{
   const {data,error}=await this.admin.auth.admin.createUser({email:identity.email,password,email_confirm:true,app_metadata:{decola_stage:'2d_fixture',decola_run_id:this.context.runId,persona}});
   if(error||!data?.user)throw Error();const user=data.user;
   id(user.id);if(user.email?.toLowerCase()!==identity.email||user.app_metadata?.decola_run_id!==this.context.runId||user.app_metadata?.persona!==persona||user.app_metadata?.decola_stage!=='2d_fixture')throw Error();
   return {resources:[{kind:'auth',id:user.id,runId:this.context.runId,projectId:this.context.projectId}]};
  }catch{throw Error('AUTH_CREATE_UNKNOWN');}
 }
 async inspectConfirmedId(userId){
  this.gate();id(userId);
  try{
   const {data,error}=await this.admin.auth.admin.getUserById(userId);
   if(error||!data?.user)return {outcome:'unresolved',scope};
   const u=data.user,identity=this.identities.find(x=>x.email===u.email?.toLowerCase());
   if(u.id!==userId||!identity||u.app_metadata?.decola_run_id!==this.context.runId||u.app_metadata?.persona!==identity.persona||u.app_metadata?.decola_stage!=='2d_fixture')return {outcome:'preexisting-or-foreign',scope};
   return {outcome:'confirmed',resources:[{kind:'auth',id:u.id,runId:this.context.runId,projectId:this.context.projectId}],scope};
  }catch{return {outcome:'unresolved',scope};}
 }
 async login(persona,password,expectedUserId){
  this.gate();id(expectedUserId);const identity=this.identities.find(x=>x.persona===persona);if(!identity)throw Error('INVALID_PERSONA');
  try{
   const client=this.publicClient();const {data,error}=await client.auth.signInWithPassword({email:identity.email,password});
   if(error||data?.user?.id!==expectedUserId||typeof data.session?.access_token!=='string'||!data.session.access_token||typeof data.session.refresh_token!=='string'||!data.session.refresh_token)throw Error();
   const sessionRef=randomUUID();this.#vault.set(sessionRef,{token:data.session.access_token,refreshToken:data.session.refresh_token,client,userId:expectedUserId});
   return {sessionRef,userId:expectedUserId,scope};
  }catch{throw Error('AUTH_LOGIN_FAILED');}
 }
 async validateSession(sessionRef){
  this.gate();const s=this.#vault.get(id(sessionRef));if(!s)throw Error('SESSION_UNAVAILABLE');
  try{const {data,error}=await s.client.auth.getUser(s.token);if(error||data?.user?.id!==s.userId||!data.user.email_confirmed_at)throw Error();return {userId:s.userId,verified:true};}catch{throw Error('SESSION_INVALID');}
 }
 async verifyBearer(token){
  this.gate();if(typeof token!=='string'||token.length>16384)throw Error('SESSION_INVALID');
  try{
   const client=this.publicClient(),{data,error}=await client.auth.getUser(token);
   if(error||!data?.user?.email_confirmed_at)throw Error();id(data.user.id);
   // Claims are used only AFTER Auth validates this exact token; metadata grants no role.
   const parts=token.split('.');if(parts.length!==3)throw Error();
   const claims=JSON.parse(Buffer.from(parts[1],'base64url').toString());
   if(claims.sub!==data.user.id)throw Error();id(claims.session_id);
   return {userId:data.user.id,sessionId:claims.session_id};
  }catch{throw Error('SESSION_INVALID');}
 }
 async sessionEvidence(sessionRef,verifyAccessDenied){
  this.gate();const s=this.#vault.get(id(sessionRef));if(!s)throw Error('SESSION_UNAVAILABLE');
  try{
   const {error}=await this.admin.auth.admin.signOut(s.token,'global');if(error)throw Error();
   // Require an explicit Auth rejection of refresh, not a transport error.
   const refresh=await this.publicClient().auth.refreshSession({refresh_token:s.refreshToken});
   if(!refresh.error||refresh.error.name!=='AuthApiError'||![400,401].includes(refresh.error.status)||!['refresh_token_not_found','refresh_token_already_used','session_not_found','session_expired'].includes(refresh.error.code))throw Error();
   // Auth signOut alone does NOT establish immediate access-token rejection.
   if(await verifyAccessDenied(s.token)!==true)throw Error();
   this.#vault.delete(sessionRef);return {refreshRevoked:true,accessDenied:true,evidenceRef:randomUUID()};
  }catch{throw Error('SESSION_REVOCATION_UNVERIFIED');}
 }
 dispose(){this.#vault.clear();return {remoteSessionsRevoked:false};}
 executeRemoval(){throw Error('REMOTE_CLEANUP_BLOCKED');}
}
