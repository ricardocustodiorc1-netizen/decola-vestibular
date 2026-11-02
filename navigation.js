// Small adapter around the existing study modules. Does not own study state.
const openStudy = view => document.dispatchEvent(new CustomEvent('decola:open-study', { detail: { view } }));
function initialize() {
  const panel = document.querySelector('.leo-panel');
  if (!panel) return;
  const close = panel.querySelector('.leo-close');
  const main = document.querySelector('main');
  const background = [...document.body.children].filter(el => el !== panel.closest('.leo-widget') && el.tagName !== 'SCRIPT');
  let returnFocus = null;
  let wasOpen = false;
  const inertBefore = new Map();
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', 'Área de estudos Decola Vestibular');
  close.textContent = 'Sair dos estudos';
  close.setAttribute('aria-label', 'Sair da área de estudos');
  const shortcuts = document.createElement('nav');
  shortcuts.className = 'study-shortcuts';
  shortcuts.setAttribute('aria-label', 'Navegação dos estudos');
  const destinations=document.createElement('div');destinations.className='study-destinations';destinations.id='study-destinations';
  const toggle=document.createElement('button');toggle.type='button';toggle.className='study-menu-toggle';toggle.textContent='Menu de estudos';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls',destinations.id);
  const collapse=(focus=false)=>{shortcuts.classList.remove('is-expanded');toggle.setAttribute('aria-expanded','false');if(focus)toggle.focus();};
  toggle.addEventListener('click',()=>{const expanded=shortcuts.classList.toggle('is-expanded');toggle.setAttribute('aria-expanded',String(expanded));});
  shortcuts.addEventListener('keydown',event=>{if(event.key==='Escape'&&shortcuts.classList.contains('is-expanded')){event.preventDefault();event.stopPropagation();collapse(true);}});
  [['dashboard','Meu Decola'],['subjects','Aulas'],['exercises','Exercícios'],['chat','Professor Leo'],['progress','Progresso'],['simulado','Simulados']].forEach(([view,label]) => {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = label; button.dataset.studyView = view;
    button.addEventListener('click', () => { collapse();openStudy(view);requestAnimationFrame(()=>{const target=panel.querySelector('.study-dashboard:not([hidden]) h2')||panel.querySelector('.leo-chat:not([hidden]) textarea')||panel.querySelector('.leo-back');if(target){if(target.tagName==='H2')target.tabIndex=-1;target.focus({preventScroll:true});}}); });
    destinations.append(button);
  });
  const support=document.createElement('button');support.type='button';support.textContent='Ajuda e suporte';support.dataset.decolaSupport='';support.addEventListener('click',()=>collapse());destinations.append(support);
  const setActive=view=>{
   destinations.querySelectorAll('[data-study-view]').forEach(b=>{if(b.dataset.studyView===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
   const name=destinations.querySelector('[aria-current]')?.textContent||'Estudos';toggle.textContent='Menu de estudos · '+name;
  };
  shortcuts.append(toggle,destinations);
  panel.querySelector('.leo-top').after(shortcuts);
  const direct = document.createElement('button');
  direct.type = 'button'; direct.className = 'study-nav-link'; direct.textContent = 'Professor Leo';
  direct.addEventListener('click', () => openStudy('chat'));
  const publicNav = document.querySelector('.header nav');
  publicNav.prepend(direct);
  publicNav.id = 'public-navigation';
  const menu = document.createElement('button');
  menu.type = 'button'; menu.className = 'mobile-menu-button';
  menu.textContent = 'Mais opções'; menu.setAttribute('aria-expanded','false');
  menu.setAttribute('aria-controls', publicNav.id);
  menu.addEventListener('click',()=>{
    const expanded = publicNav.classList.toggle('is-expanded');
    menu.setAttribute('aria-expanded',String(expanded));
    menu.textContent = expanded ? 'Fechar opções' : 'Mais opções';
  });
  publicNav.append(menu);
  publicNav.addEventListener('click',event=>{
    if(event.target.closest('a')){
      publicNav.classList.remove('is-expanded');menu.setAttribute('aria-expanded','false');menu.textContent='Mais opções';
    }
  });
  // Capture the initiating control before the legacy opening code moves focus.
  document.addEventListener('click', event => {
    if (event.isTrusted && panel.hidden && event.target instanceof Element) returnFocus = event.target.closest('button,a,input,select,textarea');
  }, true);
  const sync = () => {
    const open = !panel.hidden;
    if (open === wasOpen) return;
    wasOpen = open;
    if (open) {
      collapse();
      background.forEach(el => { inertBefore.set(el, el.inert); el.inert = true; });
      close.focus({ preventScroll: true });
    } else {
      background.forEach(el => { el.inert = inertBefore.get(el) || false; });
      inertBefore.clear();
      (returnFocus?.isConnected ? returnFocus : main).focus({ preventScroll: true });
    }
  };
  new MutationObserver(sync).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); collapse();close.click(); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...panel.querySelectorAll('a[href],button,input,select,textarea,[tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length);
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  });
  // Show the true destination even when an older module switches views.
  document.addEventListener('decola:leo-view', event => {
    if(event.detail.view==='chat')queueMicrotask(()=>{if(!panel.querySelector('.study-return-context')?.hidden)panel.querySelector('.leo-back').hidden=true;});
    const view=event.detail.view;setActive(['practice','portuguese','humanas'].includes(view)?'exercises':view==='lesson'?'subjects':view==='menu'?'dashboard':view==='dashboard'?'progress':view);

  });
  const syncDashboard = () => {
    const dashboard = panel.querySelector('.study-dashboard');
    if (!dashboard || dashboard.hidden || panel.hidden) return;
    const heading = dashboard.querySelector('h2')?.textContent || 'Meu Decola';
    const topic=heading.match(/(?:📘\s*)?(.+?) — Aula Inteligente/);
    const subject=topic?(heading.includes('Interpretação')?'Linguagens':'Matemática'):null;
    panel.querySelector('.leo-current-location').textContent = '📍 '+(topic?'Aulas › '+subject+' › '+topic[1]:heading);
    panel.querySelector('.leo-back').hidden = true;
    panel.querySelector('[aria-label="Retomar os exercícios sem perder o progresso"]').hidden = true;
    panel.querySelector('.leo-top strong').textContent = '🚀 Decola Vestibular — Área de estudos';
    setActive(heading.includes('Meu Decola')?'dashboard':heading.includes('progresso')?'progress':heading.includes('Exercícios')?'exercises':'subjects');
  };
  new MutationObserver(syncDashboard).observe(panel.querySelector('.leo-body'), {childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
  sync();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
else initialize();
