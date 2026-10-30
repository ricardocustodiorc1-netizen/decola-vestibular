// Atalho para a área de estudos sem alterar o progresso existente.
(function(){
 const start=()=>{const launcher=document.querySelector('.leo-launch');if(launcher)launcher.click();};
 const attach=()=>{
   const nav=document.querySelector('.header nav');
   if(nav&&!nav.querySelector('[data-open-studies]')){
     const link=document.createElement('button');link.type='button';link.className='study-nav-link';link.dataset.openStudies='';link.textContent='📚 Área de estudos';link.addEventListener('click',start);nav.prepend(link);
   }
   const launcher=document.querySelector('.leo-launch');
   if(launcher){launcher.textContent='🎓 Abrir área de estudos';launcher.setAttribute('aria-label','Abrir área de estudos e Professor Leo');}
   const panel=document.querySelector('.leo-panel');
   if(panel){const sync=()=>document.body.classList.toggle('leo-study-open',!panel.hidden);new MutationObserver(sync).observe(panel,{attributes:true,attributeFilter:['hidden']});sync();}
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach);else attach();
})();
