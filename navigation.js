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
  [['dashboard','Meu Decola'],['subjects','Aulas'],['chat','Professor Leo'],['simulado','Simulados']].forEach(([view,label]) => {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = label; button.dataset.studyView = view;
    button.addEventListener('click', () => {
      openStudy(view);
      shortcuts.querySelectorAll('button').forEach(b => b.removeAttribute('aria-current'));
      button.setAttribute('aria-current', 'page');
    });
    shortcuts.append(button);
  });
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
      shortcuts.querySelectorAll('button').forEach(b => b.removeAttribute('aria-current'));
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
    if (event.key === 'Escape') { event.preventDefault(); close.click(); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...panel.querySelectorAll('a[href],button,input,select,textarea,[tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length);
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  });
  // Show the true destination even when an older module switches views.
  document.addEventListener('decola:leo-view', event => {
    shortcuts.querySelectorAll('button').forEach(b => {
      if (b.dataset.studyView === event.detail.view) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
  });
  const syncDashboard = () => {
    const dashboard = panel.querySelector('.study-dashboard');
    if (!dashboard || dashboard.hidden || panel.hidden) return;
    const heading = dashboard.querySelector('h2')?.textContent || 'Meu Decola';
    panel.querySelector('.leo-current-location').textContent = '📍 Você está em: ' + heading;
    panel.querySelector('.leo-back').hidden = true;
    panel.querySelector('[aria-label="Retomar os exercícios sem perder o progresso"]').hidden = true;
    panel.querySelector('.leo-top strong').textContent = '🚀 Decola Vestibular — Área de estudos';
    shortcuts.querySelectorAll('button').forEach(b => {
      const active = b.dataset.studyView === (heading.includes('Meu Decola') || heading.includes('progresso') ? 'dashboard' : 'subjects');
      if (active) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
  };
  new MutationObserver(syncDashboard).observe(panel.querySelector('.leo-body'), {childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
  sync();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
else initialize();
