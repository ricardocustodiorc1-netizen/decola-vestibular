import { areas, questions, createPlan } from './plan.js';
const main = document.querySelector('main');
const STORAGE_KEY = 'decola-vestibular:progress:v1';
let profile = null;
let answers = {};
let studyPlan = null;
let result = null;
let completed = [];
let currentRoute = location.hash || '#inicio';
let storageUnavailable = false;
const routes = ['#inicio', '#areas', '#como-funciona', '#perfil', '#diagnostico', '#resultado', '#plano'];
function validProfile(value) {
  return value && ['Estudante Aurora', 'Estudante Horizonte', 'Estudante Estrela'].includes(value.name)
    && ['Medicina', 'Engenharia', 'Direito', 'Pedagogia', 'Ainda estou descobrindo'].includes(value.course)
    && ['3', '4', '5', '6', '7'].includes(value.days) && ['1', '1.5', '2', '3'].includes(value.hours)
    && ['Estou começando do zero', 'Já estudo, mas preciso de organização', 'Estou revisando para a prova'].includes(value.moment);
}
function completeAnswers() {
  return questions.every(q => Number.isInteger(answers[q.area]) && answers[q.area] >= 0 && answers[q.area] < q.options.length);
}
function storageWarning() {
  if (!storageUnavailable || main.querySelector('[data-storage-warning]')) return;
  const message = document.createElement('p');
  message.className = 'notice';
  message.dataset.storageWarning = '';
  message.setAttribute('role', 'status');
  message.textContent = 'Salvamento automático indisponível: o armazenamento deste navegador ou desta prévia está bloqueado, sem espaço ou não confirmou a gravação. As alterações recentes podem se perder ao atualizar ou reabrir. No plano, use “💾 Salvar meu progresso” para guardar uma cópia; ao voltar, use “Recuperar progresso salvo”. O backup manual continua funcionando.';
  main.prepend(message);
}
function snapshot() {
  return { version: 1, route: currentRoute, profile, answers, result, plan: studyPlan, completed };
}
function saveProgress() {
  try {
    const value = JSON.stringify(snapshot());
    localStorage.setItem(STORAGE_KEY, value);
    if (localStorage.getItem(STORAGE_KEY) !== value) throw new Error('Gravação não confirmada');
    storageUnavailable = false;
    main.querySelector('[data-storage-warning]')?.remove();
    return true;
  } catch {
    storageUnavailable = true;
    storageWarning();
    return false;
  }
}
function applyProgress(saved) {
  if (!saved || saved.version !== 1 || !routes.includes(saved.route) || (saved.profile !== null && !validProfile(saved.profile))) {
    throw new Error('Cópia de progresso inválida. Use uma cópia gerada pelo Decola Vestibular.');
  }
  const restoredAnswers = {};
  for (const q of questions) {
    const value = saved.answers?.[q.area];
    if (Number.isInteger(value) && value >= 0 && value < q.options.length) restoredAnswers[q.area] = value;
  }
  profile = saved.profile === null ? null : Object.fromEntries(['name', 'course', 'days', 'hours', 'moment'].map(key => [key, saved.profile[key]]));
  answers = restoredAnswers;
  studyPlan = null; result = null; completed = [];
  if (profile && completeAnswers()) {
    // Os derivados podem ser recuperados mesmo se a cópia antiga não os contiver.
    studyPlan = createPlan(profile, answers);
    result = { score: studyPlan.score, results: studyPlan.results };
    completed = Array.isArray(saved.completed) ? [...new Set(saved.completed.filter(day => Number.isInteger(day) && day >= 1 && day <= studyPlan.sessions.length))] : [];
  }
  currentRoute = saved.route;
}
function restoreProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { applyProgress(JSON.parse(raw)); }
      catch { localStorage.removeItem(STORAGE_KEY); }
    }
    // Confirma leitura e gravação sem criar ou alterar o progresso do estudante.
    const probe = STORAGE_KEY + ':check';
    const previous = localStorage.getItem(probe);
    try {
      localStorage.setItem(probe, 'ok');
      if (localStorage.getItem(probe) !== 'ok') throw new Error('Armazenamento indisponível');
    } finally {
      if (previous === null) localStorage.removeItem(probe);
      else localStorage.setItem(probe, previous);
    }
  } catch { storageUnavailable = true; }
}
function navigate(route, save = true) {
  currentRoute = route;
  // A prévia pode bloquear alterações na URL. A interface não depende delas.
  try { history.replaceState(null, '', route); } catch {}
  if (save) saveProgress();
  render();
}
restoreProgress();
const recovery = document.createElement('details');
recovery.innerHTML = `<summary>Salvar ou recuperar progresso</summary><p>O salvamento automático vale para o mesmo endereço e navegador, quando permitido. Se a prévia bloquear ou trocar o armazenamento, gere uma cópia antes de sair, copie o texto e guarde-o. Ao voltar, cole a cópia abaixo e clique em Recuperar progresso.</p><label>Cópia do progresso<textarea id="progress-copy" rows="5" aria-describedby="recovery-status"></textarea></label><p><button type="button" class="button secondary" id="export-progress">Gerar cópia do progresso</button> <button type="button" class="button secondary" id="import-progress">Recuperar progresso</button></p><p id="recovery-status" role="status"></p>`;
document.querySelector('footer').append(recovery);
recovery.querySelector('#export-progress').addEventListener('click', () => {
  const field = recovery.querySelector('textarea');
  field.value = JSON.stringify(snapshot());
  field.focus(); field.select();
  recovery.querySelector('[role=status]').textContent = 'Cópia gerada. Copie o texto selecionado e guarde fora desta prévia antes de atualizar.';
});
recovery.querySelector('#import-progress').addEventListener('click', () => {
  try {
    applyProgress(JSON.parse(recovery.querySelector('textarea').value));
    navigate(currentRoute);
    recovery.querySelector('[role=status]').textContent = storageUnavailable ? 'Progresso recuperado nesta sessão. Guarde a cópia: esta prévia continua sem armazenamento local.' : 'Progresso recuperado e salvo neste navegador.';
  } catch {
    recovery.querySelector('[role=status]').textContent = 'Cópia inválida. Cole o texto completo gerado pelo Decola Vestibular.';
  }
});
const backupDialog = document.createElement('dialog');
backupDialog.className = 'backup-dialog';
backupDialog.setAttribute('aria-labelledby', 'backup-title');
backupDialog.innerHTML = '<div class="backup-title-row"><h2 id="backup-title">Seu progresso, com você</h2><button type="button" class="button secondary" id="close-backup" aria-label="Fechar cópia de segurança">Fechar ×</button></div><div id="backup-content"></div>';
document.body.append(backupDialog);
function closeBackup() {
  backupDialog.close();
  document.querySelector('footer').append(recovery);
  recovery.open = false;
}
backupDialog.querySelector('#close-backup').addEventListener('click', closeBackup);
backupDialog.addEventListener('cancel', event => { event.preventDefault(); closeBackup(); });
function openBackup(generate) {
  backupDialog.querySelector('#backup-content').append(recovery);
  recovery.open = true;
  backupDialog.showModal();
  if (generate) recovery.querySelector('#export-progress').click();
}
const copyButton = document.createElement('button');
copyButton.type = 'button';
copyButton.className = 'button';
copyButton.textContent = 'Copiar cópia de segurança';
copyButton.id = 'copy-progress';
recovery.querySelector('#export-progress').after(copyButton);
copyButton.addEventListener('click', async () => {
  const field = recovery.querySelector('textarea');
  if (!field.value) field.value = JSON.stringify(snapshot());
  field.focus(); field.select();
  try {
    await navigator.clipboard.writeText(field.value);
    recovery.querySelector('[role=status]').textContent = 'Cópia copiada! Guarde o texto fora da prévia. Para retomar, clique em Recuperar progresso e cole a cópia.';
  } catch {
    recovery.querySelector('[role=status]').textContent = 'A cópia automática foi bloqueada. O texto está selecionado: pressione Ctrl+C (ou Cmd+C) ou use a opção Copiar do seu dispositivo e guarde-o fora da prévia.';
  }
});
document.addEventListener('click', event => {
  const button = event.target.closest('[data-backup]');
  if (button) openBackup(button.dataset.backup === 'save');
});
const recoverButton = document.createElement('button');
recoverButton.type = 'button';
recoverButton.className = 'button secondary';
recoverButton.dataset.backup = 'restore';
recoverButton.textContent = 'Recuperar progresso salvo';
recoverButton.setAttribute('aria-haspopup', 'dialog');
document.querySelector('.header nav').append(recoverButton);
main.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (link) { event.preventDefault(); navigate(link.hasAttribute('data-resume') ? (studyPlan ? '#plano' : profile ? '#diagnostico' : '#perfil') : link.getAttribute('href')); }
});
document.querySelector('.header').addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (link) { event.preventDefault(); navigate(link.hasAttribute('data-resume') ? (studyPlan ? '#plano' : profile ? '#diagnostico' : '#perfil') : link.getAttribute('href')); }
});
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const steps = active => `<div class="steps" aria-label="Etapas do plano">${['Seu perfil', 'Diagnóstico', 'Resultado', 'Seu plano'].map((s, i) => `<span ${i === active ? 'aria-current="step" class="active"' : ''}><b>${i + 1}</b>${s}</span>`).join('')}</div>`;
function home() {
  return `<section class="hero"><div class="hero-copy"><span class="eyebrow"><span class="dot"></span> SEU PRÓXIMO CAPÍTULO COMEÇA AQUI</span><h1>Seu sonho.<br>Seu ritmo.<br><span>Sua aprovação.</span></h1><p>O ENEM é uma jornada. Com um plano que combina com você, cada dia de estudo te leva mais perto de onde quer chegar.</p><a class="button" data-resume href="#perfil">Começar meu Plano de Aprovação <span aria-hidden="true">→</span></a><div class="hero-note"><span>✓ Gratuito para experimentar</span><span>✓ Sem cadastro</span></div></div><div class="hero-art" aria-label="Ilustração de um plano de estudos"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><span class="spark spark-one">✦</span><span class="spark spark-two">✦</span><div class="floating-tag">✦ Um futuro com a sua cara</div><div class="study-card"><div class="card-top"><span class="mini-logo">→</span><span>SEU PLANO DE VOO</span><span>•••</span></div><h2>Pequenos passos.<br>Grandes conquistas.</h2><p>Uma semana de cada vez.</p><div class="week"><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span><span>D</span><b>✓</b><b>✓</b><b>✓</b><b class="today">4</b><b class="future">5</b><b class="future">6</b><b class="future">7</b></div><div class="task"><span class="task-icon">∑</span><div><strong>Matemática</strong><small>Um desafio a menos, um passo a mais.</small></div><span>→</span></div><div class="progress-label"><span>Seu progresso na semana</span><strong>60%</strong></div><div class="progress"><span></span></div><small class="illustration-note">Exemplo ilustrativo</small></div><div class="floating-bottom"><span>★</span><div><strong>Você tem potencial.</strong><small>A gente te ajuda a encontrar o caminho.</small></div></div></div></section><section class="benefits" aria-label="Nossa proposta"><span>◎ <strong>Um plano para você</strong> Respeite seu momento</span><span>◷ <strong>No seu ritmo</strong> Estude com consistência</span><span>→ <strong>Com direção</strong> Saiba por onde começar</span></section><section id="areas" class="section"><div class="section-heading"><div><span class="eyebrow">UM UNIVERSO DE POSSIBILIDADES</span><h2>Cinco áreas. Um grande objetivo.</h2></div><p>Conheça as quatro áreas de conhecimento do ENEM e a redação. Seu plano reserva espaço para todas elas.</p></div><div class="area-grid">${areas.map(a => `<article class="area-card"><span class="area-icon ${a.color}">${a.icon}</span><h3>${a.title}</h3><p>${a.description}</p><span class="card-line ${a.color}"></span></article>`).join('')}</div></section><section id="como-funciona" class="how section"><span class="eyebrow">DO PRIMEIRO PASSO AO SEU PLANO</span><h2>Começar pode ser simples.</h2><div class="how-grid"><article><b>01</b><h3>Conte seu momento</h3><p>Escolha um perfil fictício e indique seu tempo disponível para estudar.</p></article><article><b>02</b><h3>Descubra seu ponto de partida</h3><p>Responda cinco questões rápidas, uma para cada frente de estudo.</p></article><article><b>03</b><h3>Encontre seu ritmo</h3><p>Veja uma semana de estudos que prioriza o que merece mais atenção.</p></article></div><a class="button" href="#perfil">Vamos dar o primeiro passo? →</a></section>`;
}
function profilePage() {
  return `<section class="flow section">${steps(0)}<span class="eyebrow">CADA JORNADA TEM UM COMEÇO</span><h1>Um plano com o seu ritmo.</h1><p class="lead">Use um perfil fictício para explorar a experiência. Não informe dados pessoais.</p><form id="profile-form" class="form-card"><label>Perfil de demonstração<select name="name"><option>Estudante Aurora</option><option>Estudante Horizonte</option><option>Estudante Estrela</option></select></label><label>Curso dos sonhos<select name="course"><option>Medicina</option><option>Engenharia</option><option>Direito</option><option>Pedagogia</option><option>Ainda estou descobrindo</option></select></label><div class="form-row"><label>Dias de estudo por semana<select name="days"><option value="3">3 dias</option><option value="4">4 dias</option><option value="5" selected>5 dias</option><option value="6">6 dias</option><option value="7">7 dias</option></select></label><label>Tempo por dia<select name="hours"><option value="1">1 hora</option><option value="1.5" selected>1 hora e meia</option><option value="2">2 horas</option><option value="3">3 horas</option></select></label></div><label>Como você se sente hoje?<select name="moment"><option>Estou começando do zero</option><option>Já estudo, mas preciso de organização</option><option>Estou revisando para a prova</option></select></label><p class="notice">✦ Esta demonstração não cria conta e não envia seus dados. Seu progresso é salvo automaticamente neste navegador. Use “Recomeçar demonstração” para apagá-lo.</p><button class="button" type="button" id="start-diagnostic">Ir para o diagnóstico <span>→</span></button></form></section>`;
}
function diagnosticPage() {
  return `<section class="flow section">${steps(1)}<span class="eyebrow">UM PONTO DE PARTIDA, SEM PRESSÃO</span><h1>Vamos descobrir por onde começar?</h1><p class="lead">Cinco perguntas simples. Este teste ilustrativo não estima nota, proficiência ou chance de aprovação no ENEM.</p><form id="diagnostic-form">${questions.map((q, i) => `<fieldset class="question"><legend><span class="question-number">0${i + 1}</span> ${areas[i].short}</legend><h2>${q.text}</h2>${q.options.map((o, j) => `<label class="answer"><input type="radio" name="${q.area}" value="${j}" required><span>${o}</span></label>`).join('')}</fieldset>`).join('')}<div class="form-actions"><a href="#perfil">← Voltar ao perfil</a><button type="button" class="button" id="show-result">Ver meu resultado →</button></div></form></section>`;
}
function planPage() {
  const plan = studyPlan;
  return `<section class="section plan-page">${steps(3)}<div class="plan-heading"><div><span class="eyebrow">SEU PLANO DE VOO ESTÁ AQUI</span><h1>Vamos decolar, ${escape(profile.name.replace('Estudante ', ''))}!</h1><p class="lead">Seu próximo passo em direção a ${escape(profile.course)} começa com uma semana possível.</p></div><div class="plan-actions"><button class="button" type="button" data-backup="save" aria-haspopup="dialog">💾 Salvar meu progresso</button><button class="button secondary" id="restart">Recomeçar demonstração ↺</button></div></div><p class="notice">Plano demonstrativo com dados fictícios. Não substitui orientação pedagógica e não garante aprovação. O resultado de apenas cinco questões serve para ilustrar prioridades.</p><div class="stats"><div><strong>${plan.weeklyHours.toLocaleString('pt-BR')}h</strong><span>de estudo por semana</span></div><div><strong>${profile.days} dias</strong><span>no seu ritmo</span></div><div><strong>${plan.score}/5</strong><span>acertos neste exemplo</span></div></div><h2>Sua semana, um passo de cada vez.</h2><p>Começamos pelas áreas com erro no diagnóstico. Separe aproximadamente metade de cada sessão para teoria, um terço para exercícios e o restante para revisão. Nos dias livres, descanse.</p><div class="schedule">${plan.sessions.map(s => `<article class="session"><div class="day">DIA <strong>${s.day}</strong></div><span class="area-icon ${s.area.color}">${s.area.icon}</span><div class="session-content"><h3>${s.area.short}</h3><p>${s.area.topic}</p><small>${s.practice}</small></div><strong class="duration">${s.minutes} min</strong><label class="done"><input type="checkbox" data-day="${s.day}" ${completed.includes(s.day) ? 'checked' : ''}> Concluído</label></article>`).join('')}</div>${Number(profile.days) < 5 ? `<p class="notice">Na próxima semana, comece pelas áreas restantes: ${plan.priority.slice(Number(profile.days)).map(a => a.short).join(' e ')}. Assim, todas as cinco frentes entram no seu ciclo.</p>` : ''}<h2>O que o diagnóstico mostrou</h2><div class="feedback-grid">${questions.map((q, i) => `<article class="feedback"><span class="badge ${plan.results[i].correct ? 'success' : ''}">${plan.results[i].correct ? 'Acertou' : 'Vale revisar'} · ${areas[i].short}</span><h3>${q.text}</h3><p>Sua resposta: ${escape(q.options[answers[q.area]])}</p><p><strong>Resposta: ${q.options[q.answer]}.</strong> ${q.explanation}</p></article>`).join('')}</div><p class="notice">Seu momento: ${escape(profile.moment)}. Esse campo é informativo nesta versão; a distribuição usa seu tempo disponível e as respostas do diagnóstico. As atividades concluídas ficam salvas neste navegador.</p></section>`;
}
function resultPage() {
  const plan = studyPlan;
  return `<section class="flow section">${steps(2)}<span class="eyebrow">SEU PONTO DE PARTIDA</span><h1>Seu resultado demonstrativo</h1><p class="lead">Você acertou ${plan.score} de 5 questões. Esta amostra não estima sua nota no ENEM.</p><div class="feedback-grid">${questions.map((q, i) => `<article class="feedback"><span class="badge ${plan.results[i].correct ? 'success' : ''}">${plan.results[i].correct ? 'Acertou' : 'Vale revisar'} · ${areas[i].short}</span><h3>${q.text}</h3><p>Sua resposta: ${escape(q.options[answers[q.area]])}</p><p><strong>Resposta: ${q.options[q.answer]}.</strong> ${q.explanation}</p></article>`).join('')}</div><a class="button" href="#plano">Ver meu plano de estudos →</a></section>`;
}
// Ações locais não podem depender de submit: iframes sem allow-forms
// bloqueiam esse evento antes mesmo de chamar preventDefault().
function bindFormAction(formSelector, buttonSelector, action) {
  const form = document.querySelector(formSelector);
  if (!form) return;
  const advance = () => {
    if (form.reportValidity()) action(form);
  };
  form.querySelector(buttonSelector).addEventListener('click', advance);
  form.addEventListener('submit', event => { event.preventDefault(); advance(); });
  form.addEventListener('keydown', event => {
    if (event.key === 'Enter' && event.target.tagName !== 'BUTTON') {
      event.preventDefault();
      advance();
    }
  });
}
function render() {
  const route = currentRoute;
  if (route === '#diagnostico' && !profile || ['#resultado', '#plano'].includes(route) && (!profile || !studyPlan || !completeAnswers())) { navigate('#perfil'); return; }
  main.innerHTML = route === '#perfil' ? profilePage() : route === '#diagnostico' ? diagnosticPage() : route === '#resultado' ? resultPage() : route === '#plano' ? planPage() : home();
  const titles = { '#perfil': 'Seu perfil', '#diagnostico': 'Diagnóstico', '#resultado': 'Seu resultado', '#plano': 'Seu plano' };
  document.title = `${titles[route] || 'Seu sonho. Seu ritmo. Sua aprovação.'} | Decola Vestibular`;
  bindFormAction('#profile-form', '#start-diagnostic', form => {
    const next = Object.fromEntries(new FormData(form));
    if (JSON.stringify(profile) !== JSON.stringify(next)) { studyPlan = null; result = null; completed = []; }
    profile = next;
    navigate('#diagnostico');
  });
  bindFormAction('#diagnostic-form', '#show-result', form => {
    answers = Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, Number(value)]));
    studyPlan = createPlan(profile, answers);
    result = { score: studyPlan.score, results: studyPlan.results };
    completed = [];
    navigate('#resultado');
  });
  const profileForm = document.querySelector('#profile-form');
  if (profileForm) {
    if (profile) for (const [name, value] of Object.entries(profile)) profileForm.elements.namedItem(name).value = value;
    profileForm.addEventListener('change', () => {
      profile = Object.fromEntries(new FormData(profileForm));
      studyPlan = null; result = null; completed = [];
      saveProgress();
    });
  }
  const diagnosticForm = document.querySelector('#diagnostic-form');
  if (diagnosticForm) {
    for (const [name, value] of Object.entries(answers)) diagnosticForm.querySelector(`input[name="${name}"][value="${value}"]`).checked = true;
    diagnosticForm.addEventListener('change', () => {
      answers = Object.fromEntries([...new FormData(diagnosticForm)].map(([key, value]) => [key, Number(value)]));
      studyPlan = null; result = null; completed = [];
      saveProgress();
    });
  }
  document.querySelectorAll('.done input').forEach(input => input.addEventListener('change', () => {
    const day = Number(input.dataset.day);
    completed = completed.filter(value => value !== day);
    if (input.checked) completed.push(day);
    saveProgress();
  }));
  document.querySelector('#restart')?.addEventListener('click', () => {
    profile = null; answers = {}; studyPlan = null; result = null; completed = [];
    recovery.querySelector('textarea').value = '';
    recovery.querySelector('[role=status]').textContent = '';
    try { localStorage.removeItem(STORAGE_KEY); } catch { storageUnavailable = true; }
    navigate('#perfil', false);
  });
  storageWarning();
  if (route === '#areas' || route === '#como-funciona') document.querySelector(route)?.scrollIntoView();
  else { window.scrollTo(0, 0); main.focus({ preventScroll: true }); }
}
window.addEventListener('hashchange', () => navigate(location.hash || '#inicio'));
render();
