# Etapa 2D-B — pré-inspeção Supabase somente de leitura

> Atualização posterior: [complemento de leitura no painel](ETAPA-2DB-COMPLEMENTO-PAINEL.md) confirma configurações Auth, decola não exposto e Usage/Billing. As lacunas abaixo descrevem o acesso pelo conector no momento da coleta, não o estado atual de toda a análise.

02/11/2026. Branch exclusiva `dev/navegacao-leo-familias-20261031`, base `d57a291`. Projeto `yxxrfhobhonigwczzpim`, organização `gfuffaasrxaroosnwujl` — Decola Vestibular. [Evidências sanitizadas](evidencias/etapa2db-preinspecao.json).

## Escopo e conclusão

Executadas oito operações de leitura pela conexão Supabase autorizada: projeto, organização/plano, advisor de segurança, histórico de migrations e quatro SELECTs de metadados/tamanho. Não foram lidas linhas de usuários, sessões ou alunos, nem criadas identidades/sessões. Não foram chamadas as funções de aplicação, mesmo as invocadas por SELECT. Sem INSERT/UPDATE/DELETE/DDL, migração, credenciais, mudança de configuração ou ativação de transporte. Apenas este relatório e sua evidência foram adicionados ao repositório.

A estrutura observada é compatível com os campos e funções usados pelos adaptadores da 2D-A. Isso NÃO comprova autenticação, isolamento dinâmico, sessões, entrega de e-mail, conectividade por pg ou permissões de uma futura conexão restrita. Essas camadas não foram testadas.

## Ambiente confirmado

- Projeto ACTIVE_HEALTHY, região us-east-1, PostgreSQL 17.11.0.011.
- Organização confirmada, plano free/tier_free pela ferramenta get_organization.
- Nome atual ainda diverge de `decola-homologacao` e contém identificador pessoal; nome omitido da evidência. Nenhuma renomeação realizada; o alvo dos adaptadores é o ID, não o nome.
- Migration `20261102195940 / subscribers_stage2a_20261102` registrada.
- Sete tabelas decola, todas RLS=true, force_rls=false, proprietário postgres com BYPASSRLS.
- Medida pontual pg_database_size: 11.179.699 bytes, apresentação `11 MB`. Não equivale a consumo faturável, espaço livre, ou saldo de quota.

## RLS e permissões efetivas

| Objeto | authenticated | anon |
|---|---|---|
| Schema decola | USAGE, sem CREATE na ACL observada | Sem USAGE |
| accounts | SELECT, limitado a id=auth.uid() e active_account | Sem SELECT/INSERT/UPDATE/DELETE |
| students | SELECT apenas id/account_id, limitado ao proprietário e active_account | Sem acesso |
| lesson_progress | SELECT, com vínculo a estudante proprietário e active_account | Sem acesso |
| trial_claims, paid_periods, payment_inbox, progress_imports | Sem SELECT/INSERT/UPDATE/DELETE diretos | Sem acesso |

Nenhuma tabela decola concede INSERT/UPDATE/DELETE direto a authenticated. Em students, has_table_privilege(SELECT)=false é esperado: há grants **por coluna** para id/account_id; os catálogos de column_privileges os confirmam. Não ampliar para SELECT de eligibility_key para fazer o adaptador funcionar: `SELECT id FROM decola.students` já corresponde ao contrato atual.

O advisor retornou apenas quatro avisos INFO `rls_enabled_no_policy`, nessas tabelas internas. A ausência de política nega acesso ao papel sujeito a RLS; somada à ausência de grants diretos, é coerente com o backend controlado. Não criar políticas permissivas para silenciar o advisor. Referência: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy . Um advisor sem alertas graves não substitui teste entre duas identidades.

## Revisão das cinco funções SECURITY DEFINER

Todas possuem search_path vazio, objetos qualificados e proprietário postgres/BYPASSRLS. As ACLs e has_function_privilege confirmam que PUBLIC/anon não recebem EXECUTE e authenticated só executa as quatro funções de entrada; assert_student é privada. SECURITY DEFINER é deliberadamente privilegiado, exige revisão a cada mudança e não deve ser copiado para funções arbitrárias.

| Função | Verificação observada no corpo | Risco/limite |
|---|---|---|
| active_account() | auth.uid(), conta não desabilitada, e-mail confirmado, usuário não excluído/banido | Não consulta session_id/auth.sessions; sozinha não impõe revogação imediata de JWT |
| assert_student(uuid) | Estudante pertence à conta do chamador e active_account=true; erro 42501 sem detalhe de outra pessoa | Não exposta diretamente a authenticated; sem SQL dinâmico |
| request_trial(uuid) | Chama assert_student; bloqueia estudante; chave de elegibilidade vem do servidor; ON CONFLICT; intervalo 168 horas | É ESCRITA apesar de SELECT na chamada; não executada. Antiabuso entre contas depende do provisionamento da eligibility_key |
| cancel_trial(uuid) | Chama assert_student; bloqueia estudante; cancelamento usa coalesce | É ESCRITA; não executada. Idempotência e concorrência ainda precisam de teste integrado |
| can_study(uuid) | Chama assert_student; confere intervalos, cancelamento e revogação | Lógica revisada estaticamente; não prova expiração ou acesso real ao conteúdo |

As constraints consultadas confirmam unicidade de eligibility_key, produto/estudante, período de teste de 168 horas, vínculos FK e preservação do histórico de teste com student_id NULL após exclusão. paid_periods exige sandbox, BRL e 3990 centavos. Isso não ativa nem comprova integração de pagamentos. Não há trigger não interno em auth.users: criar usuário Auth não provisiona automaticamente decola.accounts/students; o vínculo explícito do adaptador permanece necessário.

## Compatibilidade da 2D-A

| Camada | Resultado da comparação | O que falta para executar |
|---|---|---|
| Auth | auth.users contém id, email, raw_app_meta_data, email_confirmed_at, banned_until e deleted_at | Configurações do serviço e permissões administrativas não verificadas; nenhum login/getUser real |
| Sessões | auth.sessions contém id, user_id, not_after com tipos esperados | Revogação, refresh e limpeza do provedor não testados; não se leu nenhuma sessão |
| Vínculo | Contas, estudantes, eligibility_key e FKs correspondem ao SQL preparado | Conexão mínima autorizada para leitura dirigida e inserts futuros; ainda bloqueados |
| Sondas RLS | Funções, grants e colunas consultadas correspondem aos SELECTs do adaptador | Papel de conexão com SET ROLE e privilégio estritamente necessário ainda não definido/validado |
| Progresso | Campos question_id/content_version/state/revision presentes | Nenhuma gravação ou migração de progresso autorizada |
| Backend HTTP | Código local exige Auth válido e sessão ativa antes de consultar progresso | Backend real não implantado/conectado; não foi feito teste HTTP autenticado |
| Data API | Não confirmada exposição do schema decola; GUC pgrst.db_schemas/extra_search_path ausentes nos registros de configuração consultados | Ausência do GUC NÃO comprova schema privado. Conferir painel/API de configuração sem ler segredos |

O cabeçalho do arquivo local de migration ainda o descreve como candidato não aplicado. O registro remoto comprova aplicação de uma migration com esse nome, e a estrutura inspecionada corresponde aos requisitos analisados; o cabeçalho não é evidência do estado remoto. Não alterado e não reaplicado. Não se afirma identidade byte a byte do SQL aplicado.

## Riscos e correções propostas, sem executar

1. **Sessão revogada e acesso direto:** active_account e as políticas não verificam a existência da sessão. Se decola estiver exposto na Data API, um JWT ainda válido pode conservar acesso permitido por RLS até expirar. O bridge preparado faz consulta de sessão no backend, mas não protege automaticamente outra rota. Antes de homologar revogação imediata, decidir entre backend como único caminho ou política/helper que cheque sessão. Qualquer alteração exige proposta SQL/configuração e aprovação; não afirmar exploração testada.
2. **Auth não inspecionável por estas ferramentas:** não há ferramenta disponível para GET de configurações Auth. Não foram confirmados Site URL/redirects, confirmação de e-mail, senha mínima, CAPTCHA, cadastro anônimo, JWT expiry, SMTP/rate limits, hooks ou políticas de sessão. Colunas no banco não provam essas configurações. Não tentar login para descobri-las.
3. **Privilégios da execução futura:** leitura de catálogos nesta conexão não comprova grants do futuro papel backend. Não usar postgres/service_role como atalho. O caminho administrativo de createUser/global signOut requer autorização específica e tratamento seguro de credencial; continua indisponível.
4. **Antiabuso do teste gratuito:** a função impede reutilização da mesma eligibility_key/produto. Não prova que várias contas da mesma pessoa receberão a mesma chave. Definir política de identidade/privacidade no provisionamento; não usar CPF real nesta homologação.
5. **Custo/saldo e metadados de exposição incompletos:** confirmar Usage/Billing e Auth/API em visualização autorizada antes da execução integrada. Não presumir ausência de configuração a partir de catálogo sem GUC.

Não foi identificada incompatibilidade estrutural que justifique alterar código, permissões ou schema nesta inspeção. Os riscos acima exigem decisão e testes, não concessões automáticas. A leitura do próprio progresso após término do teste é coerente com preservação de progresso; não confundir com liberação de conteúdo pago, cujo caminho servidor ainda precisa ser validado.

## Plano e custo

O **Free foi confirmado na organização real**, sem upgrade ou novo recurso. A página pública de preços consultada em 02/11/2026 informa US$0/mês, 500 MB de banco, 50 mil MAU, 5 GB egress, 5 GB cached egress e 1 GB Storage; informa pausa por inatividade e até dois projetos ativos. São limites públicos de referência, NÃO cotas remanescentes medidas desta conta. Fonte: https://supabase.com/pricing .

A conexão disponível não expõe consumo de MAU/egress/Storage, extrato/faturas, add-ons ou configurações de faturamento. Não foi calculado saldo por subtração de pg_database_size. Nenhuma compra foi realizada; não há evidência de mudança de plano por esta atividade. Não é possível certificar ausência absoluta de cobrança na conta, nem custo final de testes futuros, apenas com esses retornos. Interromper qualquer ação que indique despesa. Recurso de timeout de sessão e outros controles podem depender de plano; não habilitar nem recomendar upgrade implicitamente.

Referência técnica para JWT/sessões e revogação: https://supabase.com/docs/guides/auth/sessions . O changelog em Markdown foi solicitado, mas a ferramenta pública rejeitou o content-type; nenhuma implementação foi realizada dependendo de informação de versão não verificada.

## Próximas autorizações: lista delimitada

- [ ] **Complemento somente de leitura:** acesso autorizado à tela/API de configurações Auth, Data API e Usage/Billing. Obter apenas campos permitidos, sem segredos, sessão de aluno, conteúdo pessoal ou alteração. O conector atual não possui essas operações; uso de outro acesso não foi presumido. Não é necessário contratar plano para continuar a análise.
- [ ] **Decisão de acesso/sessão:** escolher backend exclusivo versus checagem na política, após confirmar exposição da Data API. Se houver mudança, aprovar separadamente SQL/configuração exatos, riscos e reversão antes de qualquer aplicação.
- [ ] **Homologação integrada com escrita:** aprovar commit/hash dos adaptadores e escopo, host persistente/backup, run ID, duas personas, domínio sintético aceito e permissões/credenciais estritamente necessárias. Só então permitir duas criações Auth (marcadores de run), dois logins, validação, inserção transacional de duas accounts e dois students, sondas próprias/alheias, request_trial/cancel_trial autorizados e verificação de expiração/revogação. Essas chamadas são escritas mesmo que feitas por SELECT; rollback não as torna autorizadas nesta etapa.
- [ ] **Sessões na homologação futura:** aprovar signOut global, tentativa de refresh posterior e testes HTTP de negação; limitar tudo às duas contas do run. Nenhuma sessão existente poderá ser afetada.
- [ ] **Progress fixtures, se necessários:** aprovar separadamente campos/IDs de registros sintéticos para demonstrar isolamento com dados não vazios; consultas vazias não bastam. Não migrar dados de alunos.
- [ ] **Limpeza:** inventário/hash e autorização específica de remoção das referências comprovadamente criadas pelo run, com verificação posterior. Não está incluída na autorização de criar/testar; cleanup remoto continua bloqueado.

Proposta de limite: até duas contas, duração 10 minutos, 40 operações do controlador, concorrência preferencial 1 (máximo 2), timeout 10 s/operação. Não repetir escrita com resultado desconhecido. Orçamento por transporte, egress/TLS e armazenamento persistente devem estar preparados antes da ativação remota. Sem Asaas/SMTP pago, Actions, novo projeto ou publicação.

## Validação desta entrega

Somente documentação e evidência sanitizada; nenhum arquivo de produto/adaptador/migration/workflow foi modificado. Os 211 testes aprovados são resultado da 2D-A, não testes reais Supabase desta inspeção. Nesta entrega são verificados JSON, ausência de identificador pessoal no material salvo, escopo do diff e integridade de whitespace; não há necessidade de repetir testes funcionais para dois documentos.

A pré-inspeção está concluída **para as informações acessíveis pela conexão atual**, com lacunas explicitadas. Não declarar Auth, RLS dinâmico, sessões, trial ou homologação integrada aprovados. Aguardar aprovação específica; não criar contas.
