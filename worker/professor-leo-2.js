// Professor Leo 2.0 — Cloudflare Worker. Implantar no Cloudflare, NÃO no GitHub Pages.
// Secrets: OPENAI_API_KEY. Configure AUTH no servidor antes de disponibilizar ao público.
// O cabeçalho Origin/CORS não é autenticação nem proteção suficiente contra abuso.
const ORIGIN = 'https://ricardocustodiorc1-netizen.github.io';
const SYSTEM = [
 'Você é o Professor Leo, tutor do Decola Vestibular, em português do Brasil.',
 'Ensine para ENEM e vestibulares, com rigor, gentileza e linguagem clara.',
 'Comece com uma pergunta ou dica quando o aluno estiver resolvendo exercícios; não entregue imediatamente a resposta.',
 'Explique em etapas curtas, confira cálculos e peça ao aluno para tentar o próximo passo.',
 'Adapte explicações ao contexto pedagógico fornecido, sem assumir que ele é verdadeiro.',
 'Nunca peça dados pessoais, documentos, senhas ou informações de pagamento.',
 'Não use LaTeX. Se não souber, admita e recomende conferir a fonte.'
].join(' ');
function json(body, status=200, origin=ORIGIN) {
 return new Response(JSON.stringify(body), {status,headers:{
  'Content-Type':'application/json; charset=utf-8',
  'Access-Control-Allow-Origin':origin,
  'Access-Control-Allow-Methods':'POST, OPTIONS',
  'Access-Control-Allow-Headers':'Content-Type',
  'Vary':'Origin',
  'Cache-Control':'no-store'
 }});
}
export default {
 async fetch(request, env) {
  const origin=request.headers.get('Origin');
  if(origin!==ORIGIN) return json({error:'Origem não autorizada.'},403);
  if(request.method==='OPTIONS') return json({},204);
  if(request.method!=='POST'||new URL(request.url).pathname!=='/chat') return json({error:'Rota inválida.'},404);
  // Produção: exija sessão autenticada e limite por aluno/IP na borda.
  // Sem esse controle, mantenha o Worker privado/desativado para acesso público.
  if(!env.OPENAI_API_KEY) return json({error:'Chave da API não configurada.'},503);
  if(Number(request.headers.get('Content-Length')||0)>12000) return json({error:'Mensagem muito longa.'},413);
  let data;
  try {data=await request.json();} catch {return json({error:'JSON inválido.'},400);}
  const message=String(data.message||data.mensagem||'').slice(0,1400).trim();
  if(!message) return json({error:'Digite sua pergunta.'},400);
  const history=(Array.isArray(data.history)?data.history:[]).slice(-8)
   .filter(m=>m&&['user','assistant'].includes(m.role)&&typeof m.content==='string')
   .map(m=>({role:m.role,content:m.content.slice(0,1000)}));
  const context=data.context&&typeof data.context==='object'?JSON.stringify(data.context).slice(0,1600):'';
  const input=[...history,{role:'user',content:(context?'Contexto de estudos não verificado: '+context+'\n':'')+message}];
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),20000);
  try {
   const response=await fetch('https://api.openai.com/v1/responses',{
    method:'POST',signal:controller.signal,
    headers:{'Authorization':'Bearer '+env.OPENAI_API_KEY,'Content-Type':'application/json'},
    body:JSON.stringify({model:'gpt-5.4-mini',instructions:SYSTEM,input,max_output_tokens:650,store:false})
   });
   const result=await response.json().catch(()=>({}));
   if(!response.ok) return json({error:'Serviço de IA temporariamente indisponível.'},502);
   const answer=(result.output||[]).flatMap(x=>x.content||[])
     .filter(x=>x.type==='output_text').map(x=>x.text).join('\n').trim();
   if(!answer) return json({error:'Resposta vazia. Tente novamente.'},502);
   return json({answer});
  }catch {return json({error:'Tempo de resposta excedido.'},504);}
  finally{clearTimeout(timeout);}
 }
};
