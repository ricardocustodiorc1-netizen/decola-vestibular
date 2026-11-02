# Etapa 2B — validação offline

Node 22.22.0. Sem segredos, contas ou conexão Supabase.

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run check
npm run verify:dependencies
npm run preflight
npm test
```

Execute nesta pasta, na branch `dev/navegacao-leo-familias-20261031`. O lockfile é obrigatório. Preflight rejeita outro major Node, branch errada e dependências ausentes.

`etapa2b-runner.mjs` exporta o próprio executor para testes com dependências injetadas. O CLI só permite `check`; `run` é bloqueado. `etapa2b-auth.mjs create` também é bloqueado, mesmo com flags YES. Não fornecer credenciais para esses comandos.

Testes de criação/vinculação/limpeza são de fluxo de controle com test doubles e rede bloqueada; não são teste de Auth/Postgres/RLS real. As bibliotecas instaladas são importadas separadamente sem clientes/transporte.

Consulte [relatório completo](../../docs/ETAPA-2B-VALIDACAO-EXECUTOR.md). Workflow apenas manual e não acionado nesta entrega; confirmar gratuidade/autorização antes de qualquer dispatch remoto.
