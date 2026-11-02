// In-page steps: scroll and focus only; never own answers or hide lesson content.
(() => {
 function mount({host,steps}){
  const nav=document.createElement('nav');nav.className='lesson-step-navigation';nav.setAttribute('aria-label','Etapas desta aula');
  const go=id=>{
   const step=steps.find(s=>s.id===id);if(!step||!step.target.isConnected)return false;
   step.target.tabIndex=-1;step.target.scrollIntoView({block:'start'});step.target.focus({preventScroll:true});return true;
  };
  for(const step of steps){const button=document.createElement('button');button.type='button';button.textContent=step.label;button.addEventListener('click',()=>go(step.id));nav.append(button);}
  host.append(nav);return Object.freeze({go});
 }
 globalThis.DecolaLessonNavigation=Object.freeze({mount});
})();
