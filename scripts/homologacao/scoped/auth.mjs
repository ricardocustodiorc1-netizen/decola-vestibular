import {PreparedAuthAdapter,identityPlan} from '../adapters/auth.mjs';
import {claimScopedAuthDispatch} from '../controls/provider-budget.mjs';
import {validateScope} from './plan.mjs';
export class ScopedAuthBroker{
 #adapter;#plan;#approve;
 constructor({admin,publicClient,permit,plan,ledger,lease,approveScope}){
  if(typeof approveScope!=='function')throw Error('SCOPE_APPROVAL_REQUIRED');this.#approve=approveScope;
  const p=this.#plan=validateScope(plan);if(lease.runId!==p.runId||ledger.inspect(lease.runId).projectId!==p.projectId)throw Error('RUN_MISMATCH');
  const identities=identityPlan(p.runId);
  const restricted={auth:{admin:{
   createUser:input=>{
    if(Date.now()<p.startsAt||Date.now()>=p.expiresAt)throw Error('SCOPE_EXPIRED');
    const persona=input.app_metadata?.persona,index=identities.findIndex(x=>x.persona===persona);
    if(index<0||input.email!==identities[index].email||input.app_metadata.decola_run_id!==p.runId)throw Error('INVALID_SCOPE');
    claimScopedAuthDispatch(ledger,lease,persona);
    return admin.auth.admin.createUser({...input,id:index===0?p.authH:p.authE});
   },
   getUserById:uid=>{if(![p.authH,p.authE].includes(uid))throw Error('FOREIGN_ID');return admin.auth.admin.getUserById(uid);},
   signOut:(...args)=>admin.auth.admin.signOut(...args)
  }}};
  this.#adapter=new PreparedAuthAdapter({admin:restricted,publicClient,permit,context:p});
 }
 async createIdentity(persona,password){
  if(await this.#approve()!==true)throw Error('SCOPE_NOT_APPROVED');
  const result=await this.#adapter.createIdentity(persona,password);
  if(result.resources[0].id!==(persona==='horizonte'?this.#plan.authH:this.#plan.authE))throw Error('AUTH_ID_MISMATCH');return result;
 }
 inspectConfirmedId(uid){return this.#adapter.inspectConfirmedId(uid);}
 login(persona,password,uid){if(Date.now()<this.#plan.startsAt||Date.now()>=this.#plan.expiresAt)throw Error('SCOPE_EXPIRED');if(uid!==(persona==='horizonte'?this.#plan.authH:persona==='estrela'?this.#plan.authE:null))throw Error('FOREIGN_ID');return this.#adapter.login(persona,password,uid);}
 async verifyBearer(token){const r=await this.#adapter.verifyBearer(token);if(![this.#plan.authH,this.#plan.authE].includes(r.userId))throw Error('FOREIGN_ID');return r;}
 validateSession(ref){return this.#adapter.validateSession(ref);}
 sessionEvidence(ref,check){return this.#adapter.sessionEvidence(ref,check);}
 dispose(){return this.#adapter.dispose();}
 executeRemoval(){throw Error('REMOTE_CLEANUP_BLOCKED');}
}
