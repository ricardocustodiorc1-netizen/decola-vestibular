// Only navigation metadata. Never owns or changes answers, histories or conversations.
(() => {
 const key='decola-navigation:v1';
 const lessonKeys=['decola-smart-percent-v2','decola-smart-fractions-v1','decola-smart-equations-v1','decola-smart-geometry-v1','decola-smart-statistics-v1','decola-smart-language-interpretation-v1'];
 function validate(value){
  if(!value||value.version!==1||!lessonKeys.includes(value.lessonKey))return null;
  if(!Number.isFinite(value.scrollTop)||value.scrollTop<0||value.scrollTop>10000000)return null;
  if(value.question!==null&&(!Number.isInteger(value.question)||value.question<0||value.question>2))return null;
  return {version:1,lessonKey:value.lessonKey,question:value.question,scrollTop:value.scrollTop};
 }
 function create(storage){
  let memory=null;
  try{memory=validate(JSON.parse(storage.getItem(key)||'null'));}catch{}
  return Object.freeze({
   read:()=>memory?{...memory}:null,
   save(value){const next=validate({version:1,...value});if(!next)return false;memory=next;try{storage.setItem(key,JSON.stringify(next));}catch{}return true;}
  });
 }
 let storage;try{storage=globalThis.localStorage;}catch{}
 globalThis.DecolaStudySession=Object.freeze({create,validate,key,session:create(storage)});
})();
