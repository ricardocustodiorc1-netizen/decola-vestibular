// Reusable local question progress; no network, cross-device sync or student data.
(() => {
 const clone=value=>JSON.parse(JSON.stringify(value));
 const fallbackStores=new WeakMap(),unavailableStorage={};
 function validate(value,questions){
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const out={};
  for(const [key,state] of Object.entries(value)){
   if(!/^\d+$/.test(key)||String(Number(key))!==key||!questions[Number(key)])return null;
   const q=questions[Number(key)];
   if(!state||typeof state!=='object'||Array.isArray(state)||![1,2].includes(state.attempts)||typeof state.done!=='boolean')return null;
   const selected=Number.isInteger(state.choice)&&state.choice>=0&&state.choice<q.opts.length;
   if(!selected && !(state.choice===null&&state.attempts===1&&!state.done))return null;
   if(selected&&state.done!==(state.choice===q.answer||state.attempts===2))return null;
   out[key]={choice:state.choice,attempts:state.attempts,done:state.done};
  }
  return out;
 }
 function create({storage,key,questions,migrations=[]}){
  let state={},issue='',blocked=false,lastRaw=null;
  const storageIdentity=storage&&typeof storage==='object'?storage:unavailableStorage;
  if(!fallbackStores.has(storageIdentity))fallbackStores.set(storageIdentity,new Map());
  const fallbacks=fallbackStores.get(storageIdentity);
  const remember=()=>fallbacks.set(key,{state:clone(state),issue,blocked,raw:lastRaw});
  try{
   lastRaw=storage.getItem(key);
   const fallback=fallbacks.get(key);
   if(fallback&&fallback.raw===lastRaw){state=clone(fallback.state);issue=fallback.issue;blocked=fallback.blocked;}
   else if(lastRaw!==null){fallbacks.delete(key);const valid=validate(JSON.parse(lastRaw),questions);if(!valid)throw Error();state=valid;}
   else for(const migration of migrations){
    try{
     const old=JSON.parse(storage.getItem(migration.key)||'{}');
     for(const index of migration.indexes){
      if(state[index]!==undefined)continue;
      const record=migration.legacyAnswers&&old?.[index]===questions[index].answer?{choice:questions[index].answer,attempts:1,done:true}:!migration.legacyAnswers?old?.[index]:undefined;
      if(record!==undefined){const valid=validate({[index]:record},questions);if(valid)state[index]=valid[index];}
     }
    }catch{} // Earlier versions are read only and never repaired or removed here.
   }
  }catch{blocked=true;issue='Não foi possível recuperar com segurança o progresso desta aula. Os dados existentes não serão substituídos automaticamente.';const fallback=fallbacks.get(key);if(fallback){state=clone(fallback.state);issue=fallback.issue;}}
  function write(next,explicitReset=false){
   const valid=validate(next,questions);if(!valid){issue='Este registro de resposta é inválido e não foi salvo.';return false;}state=valid;
   if(blocked&&!explicitReset){remember();return false;}
   try{
    const raw=storage.getItem(key);
    if(!explicitReset&&raw!==lastRaw){blocked=true;issue='O progresso mudou em outra aba. Reabra a aula para recuperar a versão salva; suas alterações atuais estão nesta sessão.';remember();return false;}
    const encoded=JSON.stringify(valid);storage.setItem(key,encoded);
    if(storage.getItem(key)!==encoded)throw Error();lastRaw=encoded;blocked=false;issue='';fallbacks.delete(key);return true;
   }catch{issue='Salvamento desta aula indisponível. Suas respostas estão nesta sessão; mantenha a página aberta para continuar.';remember();return false;}
  }
  return Object.freeze({read:()=>clone(state),issue:()=>issue,save:next=>write(next),reset:()=>write({},true)});
 }
 globalThis.DecolaLessonProgress=Object.freeze({validate,create});
})();
