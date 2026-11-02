import { createServer } from 'node:http';
import { readSessionCookie, validateConfig } from './security.mjs';

function reply(res,status,body){
 res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'",'Referrer-Policy':'no-referrer'});
 res.end(JSON.stringify(body));
}
async function readObject(req){
 if(req.headers['content-type']!=='application/json')throw Object.assign(Error('JSON required'),{status:415});
 let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>4096)throw Object.assign(Error('Body too large'),{status:413});chunks.push(chunk);}
 let value;try{value=JSON.parse(Buffer.concat(chunks).toString());}catch{throw Object.assign(Error('Invalid JSON'),{status:400});}
 if(!value||typeof value!=='object'||Array.isArray(value))throw Object.assign(Error('Invalid body'),{status:400});return value;
}
export function createHomologationServer({config,sessions,resolvePrincipal=async()=>null,repository=null,bearerBridge=null}={}){
 config=validateConfig(config);const secure=config.environment!=='local';
 return createServer(async(req,res)=>{
  try{
   // No proxy trust, reflected CORS or cross-origin browser requests.
   if(req.headers.host!==new URL(config.origin).host)return reply(res,400,{error:'invalid_host'});
   const path=req.url;
   if(req.method==='GET'&&path==='/health')return reply(res,200,{mode:'local-disconnected',auth:'not-connected',payments:'not-connected'});
   if(['/api/auth/signup','/api/auth/login','/api/auth/recover'].includes(path))return reply(res,503,{error:'auth_not_configured',message:'Autenticação real não conectada. Nenhuma conta ou mensagem criada.'});
   // Explicitly injected, read-only test port; default server remains disconnected.
   const progressPath=/^\/api\/students\/([a-f0-9-]{36})\/progress$/.exec(path);
   if(bearerBridge&&req.headers.authorization&&req.method==='GET'&&(path==='/api/me'||progressPath)){
    const principal=await bearerBridge.resolve(req.headers.authorization);
    if(!principal)return reply(res,401,{error:'authentication_required'});
    if(path==='/api/me')return reply(res,200,{accountId:principal.accountId,mode:'prepared-readonly-bearer-test'});
    const result=await bearerBridge.progress(principal,progressPath[1]);return reply(res,result.status,result.body);
   }
   const token=readSessionCookie(req.headers.cookie,{secure});const session=sessions?.resolve(token);
   if(!session)return reply(res,401,{error:'authentication_required'});
   // Always reload verified/disabled state; never use request account/student fields.
   const principal=await resolvePrincipal(session.accountId);
   if(!principal||principal.accountId!==session.accountId||principal.verified!==true||principal.disabled!==false)return reply(res,401,{error:'authentication_required'});
   if(req.method==='GET'&&path==='/api/me')return reply(res,200,{accountId:principal.accountId,csrf:session.csrf,mode:'local-contract-test'});
   if(req.method!=='POST'||!['/api/trial/start','/api/trial/cancel','/api/subscription/intent'].includes(path))return reply(res,404,{error:'not_found'});
   if(req.headers.origin!==config.origin||req.headers['sec-fetch-site']==='cross-site'||!sessions.validCsrf(session,req.headers['x-csrf-token']))return reply(res,403,{error:'request_not_authorized'});
   const body=await readObject(req);
   if(Object.keys(body).some(k=>!['studentId','expressChoice','policyVersion'].includes(k))||typeof body.studentId!=='string'||!body.studentId.trim()||body.studentId.length>128)return reply(res,400,{error:'invalid_body'});
   if(!repository)return reply(res,503,{error:'database_not_configured'});
   if(!await repository.ownsStudent(principal.accountId,body.studentId))return reply(res,404,{error:'resource_unavailable'});
   if(path==='/api/subscription/intent'){
    if(body.expressChoice!==true||body.policyVersion!=='commercial-v1')return reply(res,400,{error:'explicit_choice_required'});
    // Deliberately no checkout call, even with test sessions/repository injected.
    return reply(res,503,{error:'sandbox_not_connected',message:'Escolha identificada; nenhuma assinatura ou cobrança criada.'});
   }
   const operation=path.endsWith('/start')?'startTrial':'cancelTrial';
   const result=await repository[operation]({accountId:principal.accountId,studentId:body.studentId});
   return reply(res,200,{mode:'local-contract-test',result});
  }catch(error){reply(res,error.status||503,{error:error.status?'invalid_request':'service_unavailable'});}
 });
}
