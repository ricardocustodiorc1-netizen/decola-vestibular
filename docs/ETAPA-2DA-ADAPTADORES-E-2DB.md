# Etapa 2D-A — preparação executável e autorização da 2D-B

02/11/2026. Base: `40ae3931da8856eaba742d2ba01497fc1e795643`, branch exclusiva `dev/navegacao-leo-familias-20261031`. Revisados o relatório da 2C.1, os quatro documentos da 2C e os controles/evidências locais. Alvo futuro: projeto `yxxrfhobhonigwczzpim`, organização `gfuffaasrxaroosnwujl`.

**Nenhuma operação Supabase executada, inclusive leitura. Auth, RLS e sessões reais NÃO estão homologados.** Sem credenciais, migrations, contas, Actions, novos serviços ou despesas. O frontend, Professor Leo, progresso, Worker e publicação não foram modificados.

Código: `ac6116e23e4493374379ec9a68b94f18cda3222a` (mesma árvore do commit local indicado na evidência).

## Código entregue

| Arquivo / grupo | Comportamento implementado e testado |
|---|---|
| `scripts/homologacao/adapters/boundary.mjs` | Alvo exato, contexto copiado/congelado, capacidade de teste por identidade interna; ativação remota sempre rejeitada |
| `adapters/auth.mjs` | Chamadas no formato do SDK instalado: criação administrativa, consulta por ID, login, getUser, logout e prova de refresh rejeitado; duas personas por run; tokens apenas em memória, referências opacas; erros sem resposta/segredo do provedor |
| `adapters/postgres.mjs` | SQL parametrizado e dirigido; lookup por e-mail exato, vínculo transacional, COMMIT incerto sem retry; descarte da conexão; reconciliação exige run e eligibility_key; sondas RLS em SET LOCAL ROLE/claims com ROLLBACK; checagem de sessão/conta ativa |
| `adapters/http.mjs` | GET com Bearer, origem HTTPS exata, timeout, redirects rejeitados; identidade própria, negação de recurso alheio e negação pós-logout são verificações distintas |
| `adapters/bearer-bridge.mjs`, `server/homologation/app.mjs` | Porta opcional de leitura para testes: Auth valida o token antes de ler claims, Postgres verifica sessão/conta, RLS restringe progresso; por padrão desconectada; Bearer não libera POST, cadastro ou login |
| `adapters/preinspection.mjs` | Plano de metadados e configurações; execução sempre bloqueada; não solicita chaves nem dados de alunos |
| `controls/storage.mjs`, `ledger-storage.example.json` | Backup online SQLite incluindo WAL, integrity_check, manifesto SHA-256, permissões privadas, restauração em destino vazio com fencing; retenção só propõe, exclusão bloqueada |
| `controls/ledger.mjs` | Corrige falha confirmada de concorrência: busy_timeout antes de qualquer escrita; evita regravar application_id a cada abertura |
| `tests/adapters.test.mjs`, `tests/storage.test.mjs`, `tests/bearer-integration.test.mjs` | 31 novos testes, incluindo falhas injetadas, controle anterior reutilizado, backup real e HTTP real em loopback |

Os adaptadores implementam os contratos reais das bibliotecas fixadas (`@supabase/supabase-js` 2.57.0 / `pg` 8.13.1). Seus clientes são injetados: nesta entrega só recebem doubles, sem fábrica de conexão real ou carregador de credenciais. A capacidade `offlineTestPermit` **não é sandbox** contra JavaScript hostil com acesso ao processo: não se deve injetar cliente conectado usando essa capacidade. Não há flag de ambiente para liberar remoto; os CLIs antigos continuam aceitando apenas a fábrica offline reconhecida. A futura ativação exige revisão de código/capacidade própria e autorização, sem transformar a capacidade de teste em permissão real.

## Identidades, vínculo e reconciliação

1. Criar run UUID no ledger persistente e obter lease exclusivo; registrar autorização específica antes das operações.
2. Planejar exatamente `horizonte+<run>@decola.example.invalid` e `estrela+<run>@decola.example.invalid`. São endereços sintéticos de teste, **não caixas de entrega**. O domínio reservado é obrigatório nesta implementação. Envio/confirmacão de e-mail pelo aluno não foi implementado nem validado.
3. Antes de criar, consultar apenas essas identidades e os IDs já registrados. Identidade preexistente/estranha fica protegida. Ausência pontual não é prova definitiva; consulta dirigida pode gerar candidato, nunca adoção automática.
4. Futuramente, a criação administrativa enviará `decola_stage=2d_fixture`, run e persona em `app_metadata` do servidor. Validar resposta, e-mail, UUID e marcadores antes de confirmar o ledger. O adapter não enumera usuários nem repete criação de resultado desconhecido.
5. Com dois Auth IDs confirmados: inserir contas e estudantes em uma transação; conta deve corresponder a Auth com marcador do run; eligibility_key sintética `2d:<run>:<auth-id>`. Não grava progresso de aluno ou trial na vinculação. As sondas SQL de trial fazem rollback, nunca são prova de expiração em ambiente real.
6. Em timeout/crash/erro/COMMIT incerto: estado desconhecido, interromper escritas. Descartar conexão, obter evidência de descarte e aguardar quietude antes de nova leitura dirigida. Descarte não prova rollback. Confirmar Auth por ID + marcadores e vínculos por dois Auth IDs + eligibility_key; resultado parcial/vazio permanece inconclusivo. Sem repetição automática.
7. Remoção: inventário do run → plano/hash → aprovação específica por IDs → futuro executor próprio → verificação de ausência. Nesta entrega `executeRemoval`, limpeza remota e exclusão de backups permanecem bloqueados. Nunca remover identidade preexistente ou sem proveniência demonstrada.

Criação administrativa e revogação global exigiriam permissão Auth administrativa, ainda **não autorizada**. Não foi usada service_role, chave secreta, senha ou conexão real. Essa permissão é um bloqueador explícito para esse caminho futuro; não será obtida implicitamente com a autorização de leitura. Caso não seja aprovada, será necessário escolher o fluxo público de cadastro/confirmacão antes da criação. A marcação administrativa e a confirmação forçada não equivalem a validar o cadastro público.

## Persistência, backup e retenção

Configuração preparada: `scripts/homologacao/ledger-storage.example.json`. Executar em um host confiável, disco local persistente, usuário dedicado; não usar scratch efêmero, NFS ou múltiplas cópias ativas. Diretório do ledger exclusivo (`0700`), arquivos `0600`; backups em diretório separado. Não configurar credenciais em JSON/Git/Actions. O exemplo não provisiona disco nem serviço.

Antes e depois de cada execução futura, chamar `backupLedger(ledger,backupDirectory)` e conferir `verifyBackup(manifestPath)`. A API online SQLite lê páginas WAL consistentes; não copiar apenas runs.sqlite aberto. Arquivo único, flush, integrity_check e hash precedem o manifesto. Arquivo parcial sem manifesto válido nunca será selecionado; permanece para inspeção, sem exclusão automática. Testes restauram o estado/revisão e a intenção pendente de um banco aberto com WAL.

Restauração: parar TODOS os processos que usam o ledger original; conferir integridade/hash; chamar `restoreBackup(manifest,destinoVazio,{sourceQuiesced:true})`; reabrir LocalLedger e obter novo lease. Leases restaurados expiram e recebem nova geração; pendências viram unknown, sem repetir escritas. A declaração de quietude não desliga outro host: o operador deve comprová-la. Backup antigo pode omitir efeitos posteriores: reconciliar o provedor antes de retomar qualquer escrita, mesmo se a cópia parecer sem pendências.

Retenção proposta: 30 dias, configurável 7–365, sujeita à aprovação operacional. `retentionPlan` só sinaliza cópias antigas com TODOS os runs cleaned e sem ambiguidades; runs retained/abertos/unknown ficam preservados. `executeRetention` sempre bloqueado. Não há expurgo automático ou autorização implícita para excluir trilha histórica. Hash detecta corrupção, não substitui assinatura, criptografia em repouso ou proteção contra operador malicioso. Backup fora do host/criptografia depende da definição do armazenamento autorizado.

## Resultado verificável

Node 22.22.0, npm 11.9.0, SQLite 3.50.4. Nenhuma dependência nova. [Evidência e hashes](evidencias/etapa2da-local.json).

| Suíte final | Aprovados | Reprovados | Ignorados |
|---|---:|---:|---:|
| `node --test scripts/homologacao/tests/*.test.mjs` | 82 | 0 | 0 |
| `node --test tests/*.test.mjs` | 109 | 0 | 0 |
| `python3 -m unittest discover -s infrastructure/subscribers -p 'test_*.py'` | 20 | 0 | 0 |
| **Total** | **211** | **0** | **0** |

Preflight correto: `npm --prefix scripts/homologacao --offline run preflight`. Imports reais sem construir clientes, syntax checks, alvo e ambos os comandos de criação bloqueados passaram. `git diff --check` e `bash -n` passaram. Uma tentativa inicial de rodar preflight na raiz falhou por inexistência desse script; comando corrigido para o manifesto aninhado, sem alteração de código para mascarar o erro.

Durante a regressão, um teste anterior de dois processos falhou com `database is locked` na escrita de application_id. A correção acima foi aplicada; teste adicional mantém escritor aberto em outro processo e verifica abertura/espera. Um primeiro rascunho desse novo teste deixou timer após fechamento; corrigido para aguardar o término da transação concorrente. Resultado final sem falhas/atividade assíncrona residual.

Testes de adaptadores negam fetch e Socket.connect; testes HTTP integram código do BFF/Auth/Postgres via transporte exclusivamente loopback, SDK/SQL com doubles. Testes anteriores cobrem SIGKILL, fencing, limites e identidades protegidas. Respostas HTTP reais locais não são respostas Supabase; JWT fixture não é assinatura validada criptograficamente nesses testes. Nenhuma sessão real foi revogada. As sondas SQL role/claims não equivalem a autenticação JWT pelo gateway Supabase.

## Etapa 2D-B — procedimento curto e autorizações

### Aprovação 1: pré-inspeção, somente leitura

- [ ] Autorizar especificamente projeto/organização acima e acesso por conexão autorizada, sem fornecer segredos no chat.
- [ ] Confirmar Free/ausência de cobrança, nome, região temporária us-east-1, status, schema aplicado, Auth e limites. São informações anteriores, NÃO reconfirmadas remotamente nesta etapa.
- [ ] Aprovar `preinspectionPlan()`: metadados de schemas/tabelas/RLS/colunas/funções/grants; configurações Auth (confirmação, redirects, SMTP/limites/sessões). Sem SELECT de linhas de auth.users/sessions, dados pessoais ou leitura de chaves. Conferir também grants de rotinas e schema pelo painel/metadados; não assumir que a existência de RLS basta.
- [ ] Permissão mínima: visualizar configurações e catálogos, sem DDL/DML, gestão de usuários, troca de plano ou segredos. A conta/conexão disponível deve permitir esse escopo; não escalar permissão automaticamente.

Executar apenas após aprovação: verificar alvo/custo → coletar metadados → comparar dependências exatas dos adaptadores (inclusive auth.sessions.not_after, campos Auth, funções e grants) → emitir diferenças. Encerrar sem alterações. `executePreinspection()` permanece bloqueado nesta versão: uma liberação futura deverá limitar as consultas aprovadas, não abrir um console SQL genérico.

### Aprovação 2: homologação integrada delimitada

Após a inspeção, aprovar em conjunto commit/hash, run, duas identidades, permissões, operações, host persistente/backup e decisão de retenção. Nenhuma conta será criada antes disso. Migrations ou alterações de Auth/configuração terão aprovação própria se a inspeção indicar necessidade.

Permissões previstas: cliente público apenas sign-in/getUser; operações Auth administrativas somente se autorizadas separadamente; papel backend temporário de mínimo escopo, sem superuser/BYPASSRLS, consultas dirigidas aos campos necessários de Auth/sessão, SELECT/INSERT específicos nas tabelas de fixture e SET ROLE authenticated para sondas com rollback. O suporte exato de grants será confirmado pela pré-inspeção. Não reutilizar credenciais de produção; não expor senha/token/DSN em saída, ledger ou Actions. SDK futuro com persistSession/autoRefreshToken/detectSessionInUrl desabilitados, pool limitado, TLS com verificação e nenhuma repetição automática de writes.

Sequência única: backup → confirmar alvo/escopo → duas criações controladas → dois logins e validação → vínculo transacional → RLS própria/alheia e HTTP próprio/alheio → revogação e prova de negação pelo backend → inventário/reconciliação → backup e relatório. Sem limpeza automática. `/api/me` exige Auth válido e sessão ativa no banco; 401 de token inválido não conta como prova de isolamento entre alunos. Negação alheia só conta depois de identidade própria confirmada. Revogação global sem negação HTTP não conta como sessão revogada. Cadastro público, envio real de e-mail e expiração de sete dias exigem testes próprios e não devem ser declarados homologados por esse roteiro.

Limites iniciais: 10 minutos, 10 s/operação, 40 operações no ledger, concorrência até 2 (preferir 1), até 2 tentativas SOMENTE de leitura comprovadamente sem efeito; duas criações no máximo. O contador atual registra operações do controlador, não chamadas internas múltiplas de um método (link/SQL/logins). A ativação futura deverá aplicar orçamento também ao transporte: até 100 requisições/comandos de provedor, conexão 5 s, statement_timeout 5 s; excedente interrompe e reconcilia. Não declarar orçamento remoto implementado pelo contador local. Timeout pode deixar efeito tardio: sem ausência presumida ou retry.

Parar imediatamente em: alvo divergente, custo/plano inesperado, usuário/dado não sintético, schema/grant incompatível, identidade existente, token/sessão inválida, timeout, resultado incerto, descarte não confirmado, lease perdido ou orçamento excedido. Preservar ledger e pedir decisão sobre ambiguidades; não resolver concedendo privilégios ou criando novo projeto.

Custo incremental esperado da execução curta: **R$ 0**, condicionado à confirmação do Free e uso dentro das cotas existentes, execução local sem Actions, sem SMTP/hosting/serviço novo. Não é orçamento confirmado da conta: plano/consumo não foram consultados. Se houver cobrança, upgrade ou recurso adicional, interromper e solicitar autorização.

## Bloqueadores remanescentes

A preparação local está entregue. Para executar remotamente faltam: autorização de pré-inspeção/conexão e confirmação de schema/Free; autorização explícita das duas contas e permissões Auth/SQL; host/backup persistente definido; capacidade remota separada e transporte com orçamento/TLS/timeouts; testes do comportamento real de Auth, logout, RLS e HTTP. Limpeza remota continua fora do escopo. SQLite nativo permanece experimental; energia/disco físico, failover e exclusão remota não foram validados. Esses itens são critérios concretos de liberação da execução, não aprovação de homologação integrada.
