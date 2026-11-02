# Etapa 2 — SQL revisado para aprovação específica

02/11/2026. Branch: `dev/navegacao-leo-familias-20261031`.

## Alvo e autorização vigente

Projeto único `yxxrfhobhonigwczzpim`, organização `gfuffaasrxaroosnwujl` (Decola Vestibular), Free, `us-east-1`. Permanência nessa região aprovada temporariamente para homologação sintética. Não criar outro projeto. O nome automático baseado no e-mail ainda está presente na consulta de metadados. Renomeação para `decola-homologacao` foi autorizada, mas a integração não oferece operação de update/rename; não foi executada nem se recorreu a credenciais ou endpoints fora da integração.

Não há autorização para aplicar este SQL, criar tabelas ou inserir usuários. A preparação no repositório não equivale a execução no banco.

## Arquivo exato proposto

[SQL integral](../database/migrations/202611020001_subscribers.sql).
SHA-256: `ed77611058415326fc07f258e5b1c724aef7d06f308f59f71d3d8d5b4ecf6045`.

Esta é a versão final desta proposta para aprovação; não significa SQL validado em Postgres nem implantação concluída. Se houver necessidade de alterar escopo/SQL, apresentar novo hash e diferença antes de executar. O nome de arquivo é o rascunho preexistente do Sprint 4; não se gerou migration pelo CLI, indisponível no ambiente.

A aplicação futura deve selecionar explicitamente o Project ID acima na integração, conferir organização e estado imediatamente antes e parar se houver divergência. O SQL cria `decola` sem `IF NOT EXISTS`: schema preexistente causa falha, impedindo mescla automática com dados/objetos desconhecidos. Não aplicar em produção ou outro projeto.

## Operações propostas

| Objeto | Criação prevista |
|---|---|
| Schema | `decola`, separado de `public` e dos schemas gerenciados |
| Tabelas | `accounts`, `students`, `trial_claims`, `paid_periods`, `payment_inbox`, `lesson_progress`, `progress_imports` |
| Índices adicionais | Aluno/período pago, aluno/conta, estado/data da inbox |
| Políticas SELECT | `own_account`, `own_student`, `own_progress` |
| Funções | `active_account()`, `assert_student(uuid)`, `request_trial(uuid)`, `cancel_trial(uuid)`, `can_study(uuid)` |

As duas tabelas financeiras são estruturas vazias restritas a sandbox; não há integração Asaas, criação de assinatura, cobrança ou escritor de períodos pagos. Não há seeds, INSERT em auth.users, criação de papéis, alteração de configuração Auth ou exposição do schema pela Data API.

## Permissões mínimas e revisão

RLS habilitada nas sete tabelas. `anon`/PUBLIC sem acesso ao schema e sem privilégios nas tabelas/funções. `authenticated` recebe USAGE e somente SELECT de sua conta, dos campos id/account_id de seus alunos e de seu progresso; sem escrita direta. A chave antifraude não é exposta pelas colunas concedidas. Não há escrita de claims, pagamentos ou progresso por campos enviados pelo navegador.

`active_account` retorna apenas booleano da identidade autenticada, consultando verificação de e-mail, desativação local, exclusão e banimento. Esse helper não aceita ID arbitrário. As colunas de estado foram confirmadas por consulta de metadados de `auth.users`; nenhum registro de usuário foi consultado. RLS e funções de trial exigem essa condição; expiração comercial, por si só, não bloqueia leitura do progresso de conta ativa.

O helper `assert_student` permanece sem EXECUTE para clientes; as três funções comerciais e `active_account` têm concessão explícita somente a authenticated. As funções privilegiadas têm `search_path` vazio e nomes qualificados, identidade/propriedade verificadas e resultados limitados. Não permitem provisionar contas, reatribuir alunos ou editar valor/currency. `SECURITY DEFINER` é restrito a esses casos de acesso a dados internos; não é solução genérica para erro de permissão. Devem ser avaliadas com os papéis reais na homologação, não apenas com postgres/service_role.

A consulta anterior identificou grants automáticos amplos em `public`. A proposta não altera esse schema nem privilégios de projetos/serviços existentes: restringe objetos novos em `decola` e revoga privilégios explícitos ao final. O schema não será adicionado aos schemas expostos nesta fase.

Trial: duração exata de 168 horas, relógio do banco, concessão única por elegibilidade/produto e nenhuma assinatura criada no fim. Início e cancelamento travam a mesma linha de aluno para serializar requisições; relógio do início é obtido após adquirir lock. Cancelamento não altera respostas; reenvio não reinicia período. Rotina de criação de chaves HMAC, vínculo responsável/pagador e conciliação paga continuam fora desta migration.

RLS não é forçada para superusuário/owner: funções privilegiadas e testes devem considerar esse bypass. Não se afirma isolamento validado apenas porque `relrowsecurity=true`.

## Testes previstos depois da autorização correspondente

### Etapa 2A — estrutura vazia, sem usuários sintéticos

1. Pré-checagem somente de metadados: projeto/organização corretos, schema decola ausente, tabelas públicas preservadas, dependências auth presentes. Se mudar algo, parar e revisar.
2. Aplicação única do SQL aprovado em transação; nenhuma criação de usuário, conta de aplicação ou dado de teste.
3. Executar o [roteiro de verificação somente de leitura](../database/verification/stage2-readonly.sql): sete tabelas com RLS, três políticas, cinco funções; grants e EXECUTE conforme matriz acima.
4. Verificar que `assert_student` é inacessível por anon/authenticated, anon não executa funções e clientes não possuem INSERT/UPDATE/DELETE direto. Confirmar que apenas as colunas aprovadas de students têm SELECT, não eligibility_key (usar has_column_privilege no ensaio de privilégios).
5. Reexecutar advisor de segurança e comparar com o estado anterior, sem corrigir automaticamente configuração/objetos de plataforma.

### Etapa 2B — depende de nova autorização para usuários/fixtures e testes de escrita

| Cenário | Resultado exigido |
|---|---|
| Anônimo ou identidade inexistente | Sem leitura/escrita/execução comercial |
| Aluno A tentando dados de B | Zero linhas/negação; nenhuma alteração em B |
| Conta sem confirmação, desativada, banida ou excluída | Sem acesso às funções e dados protegidos |
| Tentativa de alterar dono, preço, prazo ou estado pago diretamente | Permissão negada |
| Primeiro pedido de trial e repetição | Uma concessão, mesmo prazo |
| Dois pedidos simultâneos; início/cancelamento concorrentes | Uma concessão; cancelamento não perdido de trial já criado |
| Expiração e cancelamento | Sem direito de estudo; progresso da conta ativa preservado |
| Recriação de aluno com mesma elegibilidade | Sem novo período gratuito |
| Período pago sintético revogado/fora de intervalo | Sem acesso pelo período pago; nenhuma API financeira chamada |
| Leitura por owner/service_role versus usuário normal | Teste evidencia bypass administrativo; não usar isso como prova de RLS |
| Falha durante migration em banco descartável | Nenhum schema parcial após rollback |

Esses cenários ainda NÃO foram executados em Postgres. Na 2B, usar dados sintéticos com autorização para criação e destinação/limpeza; não inserir em auth.users diretamente sem definir o procedimento aprovado. Não usar identidades reais ou afirmar login validado por manipulação de JWT em teste SQL. Provisionamento Auth e testes de e-mail têm escopo separado.

## Plano de reversão

- Antes do COMMIT, erro deve abortar a transação; confirmar ausência de objetos parciais por metadados. Não prosseguir com tentativas de correção de DDL não aprovadas.
- Após COMMIT, preservar estado e evidências e suspender qualquer uso novo. Não há frontend conectado para retirar do ar. Apresentar correção/reversão específica conforme objetos realmente criados.
- Não executar DROP SCHEMA CASCADE, apagar projeto, remover usuários ou dados por conta própria. Reversão destrutiva exige autorização específica e confirmação de dependências/dados; uma migration gravada no histórico não deve ser removida silenciosamente.
- Se dados forem criados em fase posterior, não reverter schema antes de exportação/backup autorizado e plano que preserve progresso. Não prometer desfazer cobrança: esta fase não faz cobrança.

## Verificações realizadas nesta preparação

`npm test`: 109 aprovados. `npm run test:infra`: 20 aprovados. Total 129 sem falhas. `git diff --check` aprovado. Não foram acrescentados testes que simplesmente procuram palavras no SQL como se validassem RLS.

Esses testes protegem a regressão existente e os contratos locais. Não validam sintaxe/execução da migration revisada no PostgreSQL. Nenhuma migration remota ou local foi executada nesta tarefa. Não há users/fixtures inseridos, chaves consultadas, Asaas, alteração de plano, publicação, merge, main ou Worker.

## Aprovação solicitada

Solicitar autorização exclusivamente para a **Etapa 2A**, aplicação do SQL com o hash acima em `yxxrfhobhonigwczzpim` e verificações de metadados/advisor, sem usuários ou fixtures. A Etapa 2B exige autorização posterior própria. Renomeação continua pendente da disponibilidade de uma operação autorizada; não bloqueia o uso técnico do Project ID correto, mas não será apresentada como concluída.
