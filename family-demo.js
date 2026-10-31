// UX prototype: no real accounts, personal information, storage or authorization.
export function familyPage() {
  return `<section class="flow section"><span class="eyebrow">RESPONSÁVEIS E ESTUDANTES</span><h1>Quem acompanha sua jornada?</h1><p class="lead">Explore como serão os acessos da família. Esta prévia usa personagens fictícios, não cria contas e não inicia os 7 dias gratuitos.</p><div class="form-card"><label>Quero conhecer o acesso de<select id="family-role"><option value="guardian">Responsável</option><option value="student-minor">Estudante menor de idade</option><option value="student-adult">Estudante maior de idade</option></select></label><div id="family-preview" aria-live="polite"></div><p class="notice">Login, confirmação do vínculo familiar e pagamentos ainda não estão disponíveis. Não informe nomes, telefone, e-mail ou outros dados pessoais.</p><a class="button" href="#perfil">Experimentar o plano de estudos →</a></div></section>`;
}
const previews = {
  guardian: ['Responsável Horizonte', 'Uma conta para acompanhar os estudantes vinculados.', ['Criar sua conta e confirmar o contato.', 'Convidar um estudante. O convite fica pendente até a verificação do vínculo.', 'Após confirmação, acompanhar o resumo de estudos permitido e administrar a futura assinatura.'], 'O responsável terá acesso a resumos autorizados. Conversas privadas com o tutor não fazem parte deste painel.'],
  'student-minor': ['Estudante Estrela', 'Seu espaço para aprender, com um responsável vinculado.', ['Aceitar um convite verificado do responsável.', 'Configurar objetivo e rotina de estudos.', 'Acessar aulas, exercícios e Professor Leo no seu próprio perfil.'], 'O cadastro definitivo de menores dependerá do fluxo de verificação e das regras de privacidade aprovadas.'],
  'student-adult': ['Estudante Aurora', 'Você poderá administrar sua própria conta.', ['Criar sua conta e confirmar o contato.', 'Escolher ENEM, vestibular e rotina de estudos.', 'Gerenciar sua futura assinatura. Compartilhar um resumo com outra pessoa será opcional.'], 'Uma pessoa pagar a assinatura não dará acesso automático aos seus dados ou conversas.']
};
export function bindFamilyDemo(main) {
  const select = main.querySelector('#family-role');
  if (!select) return;
  const preview = main.querySelector('#family-preview');
  const render = () => {
    const [name, intro, steps, note] = previews[select.value];
    preview.replaceChildren();
    const title = document.createElement('h2'); title.textContent = name;
    const description = document.createElement('p'); description.textContent = intro;
    const list = document.createElement('ol');
    steps.forEach(text => { const item = document.createElement('li'); item.textContent = text; list.append(item); });
    const privacy = document.createElement('p'); privacy.textContent = note;
    preview.append(title, description, list, privacy);
  };
  select.addEventListener('change', render); render();
}
