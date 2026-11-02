# Etapa 2C — revisão do executor e resultados offline

02/11/2026. Base local `fb29fa4fb6cb98b4cfc6a9caa532bf461bd9bee7`. Branch exclusiva `dev/navegacao-leo-familias-20261031`. Nenhuma conexão externa nesta etapa; código executável, migration, dependências e workflow não foram alterados.

## O que foi revisado

Executor real `scripts/homologacao/etapa2b-runner.mjs`, entrada Auth, manifesto/lock, preflight, testes e workflow. O CLI continua permitindo somente check; run/create permanecem bloqueados. A função exportada permite testes por injeção e não fornece transporte padrão. Isso é adequado à validação offline atual, mas NÃO é um controle suficiente para liberar a mesma função remotamente.

## Constatações e condições de liberação futura

| ID / gravidade | Constatação por leitura do código | Cobertura atual | Exigência antes de uso remoto |
|---|---|---|---|
| B01 / bloqueador | IDs criados e estado ficam no array `created` em memória | Falhas dentro do processo cobertas; crash/retomada não | Ledger durável, run ID e reconciliação após crash |
| B02 / bloqueador | Erro de criação sem ID não entra em created; cleanup fica not-needed embora efeito remoto possa ser desconhecido | Testa segunda criação falhando de forma inequívoca | Estado auth_unknown e verificação dirigida antes de retry/cleanup |
| B03 / bloqueador | Compensação automática de DELETE pode ser acionada após falha quando a função é usada com adapters | Funciona com doubles e IDs retornados no run | Separar planejamento da deleção e exigir aprovação por run antes de limpeza remota |
| B04 / bloqueador | Marcador `2b_synthetic` é genérico; não há lease nem identificador de execução durável | Evita algumas colisões, não prova retomada ou exclusão mútua | Inventário/lease e correspondência de run/projeto/IDs, sem adotar preexistentes |
| B05 / bloqueador | listUsers percorre todo Auth para detectar duas identidades | Test double sem pessoas reais | Método dirigido suportado ou escopo explícito; não enumerar dados reais por conveniência |
| B06 / bloqueador | Não revoga sessões/refresh na compensação; Auth delete não prova revogação de access token | Limpeza de IDs fake, não tokens reais | Política e teste de revogação/negação no backend e encerramento aprovado |
| B07 / bloqueador | RLS é exercitada por SQL com role/claims locais, sem requisições HTTP com tokens assinados | Contratos de controle de fluxo, não token validation | Ensaios SQL e Auth/API separados, com evidência da assinatura/validade e propriedade |
| B08 / bloqueador | Rollback falho pode ser ignorado na entrada da limpeza; COMMIT com resposta perdida não tem estado específico | Casos básicos SQL cleanup, não todas as ambiguidades | Descartar conexão incerta, nova inspeção e plano de reconciliação |
| B09 / bloqueador | Não há deadline global/operação ou orçamento persistente de chamadas | Conexão fake retorna de imediato | Timeouts, teto e estado desconhecido sem retry de writes |
| B10 / atenção | Falha em release/end muda status, mas não faz inventário persistente dos registros já criados | Falha de pool close testada | Relatório de resíduos/lease independente do finally do processo |
| B11 / atenção | Fixture de progresso usa source server-attempt e questão com prefixo de teste; não existe run registry de dados | Dados apenas em memória no ensaio atual | Manter namespace/inventário restritos e não usar fixture como desempenho verdadeiro |
| B12 / bloqueador de autorização | `adapterMode='injected-test-doubles'` é apenas marcador; um importador poderia fornecer dependências reais | Rede bloqueada no teste, CLIs bloqueados | Não remover guardas nem passar adapters reais sem novo projeto de controles/autorização |

Constatações não foram corrigidas nesta entrega porque o usuário restringiu a Etapa 2C a planejamento, revisão, documentação e testes. Não são vulnerabilidades demonstradas em um serviço publicado: a rotina real não está habilitada. São impedimentos para transformar um executor offline em rotina operacional segura. Não acrescentar testes que aprovem um ledger/revogação ainda inexistentes.

## Proteções já existentes preservadas

- Alvo fixo, host direto validado, rejeição de parâmetros que alterem host/banco e porta inesperada.
- Gates e configuração validados antes de instanciar pool; TLS verificado no contrato de conexão.
- Importação das bibliotecas reais sem rede; doubles para criação/login/SQL/cleanup.
- Logs identificados como OFFLINE TEST DOUBLES e erros externos suprimidos.
- Limpeza de IDs retornados somente no run em memória; teste de usuário preexistente preservado.
- Workflow manual-only, branch guard, conteúdo somente leitura, Actions pinadas por SHA e checkout sem persistir credenciais. Não foi acionado.

O futuro controle de ledger/identidade não substitui propriedade no banco, grants mínimos e RLS. Um ensaio feito como owner/service_role não demonstra isolamento. Os schemas/papéis reais não foram consultados na Etapa 2C.

## Testes repetidos nesta etapa

Runtime local já disponível: Node 22.22.0; sem instalar Node, npm ou bibliotecas. Comandos usados:

```sh
node --check scripts/homologacao/etapa2b-runner.mjs
node --check scripts/homologacao/etapa2b-auth.mjs
node --test scripts/homologacao/tests/*.test.mjs
python3 -m unittest discover -s infrastructure/subscribers -p 'test_*.py'
```

Aqui `node` representa o binário 22.22.0 previamente instalado no diretório temporário da sessão. Os comandos foram executados com caminho absoluto para esse binário, sem alterar o runtime global.

| Verificação | Resultado nesta etapa |
|---|---|
| Sintaxe dos executores reais | Aprovada |
| Executor/dependências | **16 aprovados**, zero falhas/ignorados |
| Python/SQLite local | **20 aprovados** |
| Total novamente executado | **36 aprovados** |
| Regressão Node geral, 109 casos | Não repetida: inclui servidores HTTP de loopback; mantida fora do ensaio sem rede |
| Auth/Postgres/RLS/HTTP Supabase reais | Não executados |
| npm ci/cache/audit/registro | Não acessados |
| GitHub fetch/push/Actions | Não executados |

Os 145 testes do relatório anterior são resultado histórico da Etapa 2B, NÃO 145 casos repetidos na 2C. Não houve inclusão de casos novos nem modificação dos testes para forçar aprovação. Testes locais criam objetos de teste em memória/SQLite temporário; nenhum usuário foi criado em Auth.

Os testes Node do executor bloqueiam fetch e Socket.connect; os imports reais têm guarda de rede, não instanciam SDK/Pool reais. Os testes SQLite não abrem servidor nem usam credenciais. Não foram executados preflight/npm scripts que consultassem o registro. Nenhum pacote foi instalado/atualizado.

## Identificação dos arquivos preservados

SHA-256 executor: `a316518cd8905226b4c1c2e364b9bfd936c7d0221ed9bd8f4360b949de97ebe3`.
SHA-256 lockfile: `3d038ad47098a2c58d9324367f2deddcb26ec5f64931aa3df5eac00e33735742`.

[Evidência estruturada local](evidencias-offline.json) registra escopo, contagens e hashes. Não contém IDs pessoais, chaves ou outputs de Auth.

## Decisão e próximos passos

O planejamento da Etapa 2C está preparado. A homologação integrada permanece NÃO EXECUTADA e bloqueada pelos itens acima e pelas autorizações específicas. Próximo escopo técnico proposto: implementar ledger/estados ambíguos, execução idempotente e plano de limpeza aprovado; ampliar testes offline para crash, COMMIT perdido, rollback falho e sessões; só depois apresentar pedido de execução real delimitada.

A criação de usuários, credenciais, mutações de Auth/DB, eventual migração, limpeza e execução de Actions não recebem autorização por este plano. Não houve recurso externo contratado ou despesa de infraestrutura nova. Não se mediu custo da conta Work ou de outros serviços existentes.

Main, frontend, áudios, Professor Leo, simulados, progresso, Worker e configurações de pagamento não foram modificados. Somente documentação local foi adicionada; não houve publicação nem envio remoto nesta etapa.
