# Contas, vínculos e acesso — proposta para aprovação

Data: 31/10/2026. Estado: desenho técnico, sem backend, banco, contas ou cobranças criados.
A página `#familias` é uma prévia de UX com personagens fictícios, não uma implementação de autenticação.

## Estrutura encontrada

O GitHub Pages serve HTML/CSS/JS. `app.js` controla perfil, diagnóstico e plano;
`plan.js` contém regras pedagógicas. `professor-leo.js` concentra tutor, treinos,
simulado e evolução. `study-area.js` e `language-smart.js` acrescentam aulas e
painel sobre o mesmo DOM. O progresso é distribuído em várias chaves localStorage.
Não há identidade autenticada, isolamento por estudante nem sincronização.

A main contém uma chamada para um Worker externo no envio ao Leo. O código do
Worker não está neste repositório; não foi auditado, alterado ou chamado nesta tarefa.
Chave não aparecer no frontend não demonstra, por si só, que a API tem autenticação,
autorização, limites de custo ou proteção contra abuso. A integração existente foi preservada nesta branch por solicitação do usuário.
Não foi feita chamada real durante os testes. A demonstração autossuficiente
inclui essa integração e precisa de rede para responder perguntas com IA.

## Limite arquitetural

Manter o Pages para conteúdo estático é possível. Cadastro, identidade, vínculos,
controle de acesso, direitos de assinatura e tutor autenticado exigem backend.
Não guardar senhas, tokens duradouros, regras de cobrança ou prova de consentimento
em localStorage. Não usar um campo `role` vindo do navegador como autorização.

Proposta de implementação após aprovação: identidade gerenciada e banco relacional
com autorização no servidor. Avaliar Supabase Auth/Postgres ou serviço equivalente;
a escolha de fornecedor, região, plano e custos continua pendente. Nenhum serviço
foi provisionado. O navegador nunca recebe credenciais administrativas.

## Entidades propostas

| Entidade | Campos essenciais | Invariantes |
| --- | --- | --- |
| accounts | id, identity_subject, status, verified_contact_at | subject único do provedor; sem senha própria |
| account_roles | account_id, role | responsável e estudante podem coexistir; atribuição validada no servidor |
| student_profiles | id, account_id, age_band, study_goal, created_at | um dono autenticado; faixa etária confirmada no fluxo definitivo |
| guardian_links | id, guardian_account_id, student_id, status, verified_at, revoked_at | par único; vínculo pendente não dá acesso; proibir vínculo consigo mesmo |
| invitations | id, inviter_id, recipient_reference, token_hash, expires_at, consumed_at | token aleatório de uso único; guardar hash, expirar e limitar tentativas |
| permissions | link_id, scope, granted_at, revoked_at, policy_version | resumo de estudo separado de conversa; alterações auditáveis |
| consent_events | id, actor_id, student_id, purpose, version, timestamp, evidence_reference | histórico versionado e prova adequada; nunca apenas checkbox local |
| learning_events | id, student_id, activity_id, attempt, outcome, occurred_at | deduplicação/idempotência; dono e vínculo ativo verificados |
| study_summaries | student_id, period, completed_count, goals | agregado, sem transcrições do tutor |
| subscriptions | id, payer_account_id, provider_reference, status | pagador é papel comercial, sem permissão pedagógica implícita |
| entitlements | student_id, subscription_id, starts_at, ends_at, status | direito de estudar separado da identidade e do vínculo familiar |
| notification_preferences | account_id, destination_channel, purpose, enabled, version | destinatário e finalidade explícitos; opt-out independente |

Dados de contato e evidências devem ter acesso restrito e prazo de retenção definido.
Conversas devem ter armazenamento separado, com retenção mínima aprovada. Não coletar
CPF ou documento por padrão; definir o método de verificação antes de coletar dados.

## Matriz de autorização proposta

| Ação | Estudante | Responsável com vínculo ativo | Pagador sem vínculo |
| --- | --- | --- | --- |
| Aulas, exercícios, próprio plano | próprio perfil e direito de acesso válido | não se passar pelo estudante | não |
| Resumo de progresso | próprio perfil | somente escopo concedido e vínculo verificado | não |
| Conversas do Leo | próprias, conforme retenção aprovada | sem acesso por padrão | não |
| Administrar pagamento | assinatura própria | assinaturas das quais é pagador | assinatura própria |
| Receber lembretes | canal e finalidade autorizados | canal e finalidade próprios autorizados | apenas notificações de pagamento autorizadas |
| Editar vínculo/permissões | conforme idade e fluxo aprovado | solicitar e verificar, sem autoaprovação | não |

Política de acesso: negar por padrão. Verificar sujeito autenticado, recurso solicitado,
dono e vínculo/escopo em cada requisição. Nunca inferir parentesco por sobrenome,
telefone compartilhado ou pagamento. Um estudante maior decide sobre compartilhamento.
A política para menores exige decisão de produto e revisão apropriada antes de produção;
a prévia não afirma que um convite sozinho comprova responsabilidade legal.

## Fluxos e contratos de API (ainda não implementados)

1. Responsável autentica e confirma contato. `POST /guardian-invitations` cria convite
   limitado por usuário/destinatário; não revela se um contato já tem conta.
2. Estudante autentica em conta própria. `POST /guardian-invitations/accept` verifica
   hash, validade, destinatário e uso único em transação. Estado permanece pendente
   enquanto faltar verificação necessária. Aceitação não concede acesso automaticamente.
3. Backend confirma o vínculo pelo método aprovado, registra evidência e escopos.
   Máquina de estados: pending → verified → revoked. Convites expiram ou são consumidos.
4. `GET /me` retorna papéis e perfis autorizados. `GET /students/:id/summary` retorna
   somente agregado permitido; outro estudante/vínculo revogado recebe negativa.
5. `POST /learning-events` grava somente para o estudante autenticado. Migração de
   progresso local é opcional, validada e vinculada explicitamente ao perfil correto.
   Não importar silenciosamente dados de um navegador compartilhado por irmãos.
6. `POST /tutor/messages` exige sessão, direito de acesso e limites por estudante,
   tamanho, custo e taxa no servidor. Segredos ficam no backend. Revisar CORS, logs,
   retenção e tratamento de erros antes de reativar o envio existente.
7. `POST /notification-preferences` trata preferências separadas para estudante e
   responsável. Lembretes WhatsApp dependem da integração e dos modelos aprovados.
8. Cobrança futura: webhook autenticado com assinatura do provedor e deduplicação altera
   entitlements. URL de sucesso e campos vindos do cliente nunca liberam acesso pago.
   Estado comercial proposto: trial, active, past_due, canceled, expired. Definir início
   e duração do trial, acesso após cancelamento e número de estudantes por assinatura.

## Critérios antes de cadastro real

- Testes de servidor: estudante A não lê B; convite errado, vencido, reutilizado e
  revogado falha; responsável pendente/revogado não recebe resumo; pagar não dá acesso.
- Revogação de vínculo encerra acesso e futuras notificações; testar contas com dois
  estudantes e mudanças ao atingir maioridade, conforme política aprovada.
- Testes de autenticação, recuperação de acesso e exclusão/retificação de dados.
- Ambiente de homologação isolado, sem dados reais, pagamentos sandbox e custo limitado.
- Aprovar privacidade, verificação de responsáveis, conteúdo compartilhado, fornecedor,
  região, orçamento, retenção e canais antes de abrir cadastro ao público.

## Ordem sugerida

1. Revisar esta proposta e os fluxos fictícios de `#familias`.
2. Escolher infraestrutura e implementar autenticação/vínculos em homologação.
3. Vincular progresso ao estudante e testar isolamento de ponta a ponta.
4. Revisar o Worker existente e habilitar o Leo autenticado em homologação.
5. Validar lembretes e cobrança sandbox; só ativar produção com autorização explícita.

Em paralelo, extrair gradualmente módulos de aula, tutor e simulado do arquivo monolítico,
usando IDs/eventos estáveis. Evitar reescrever todo o conteúdo pedagógico nesta etapa.
