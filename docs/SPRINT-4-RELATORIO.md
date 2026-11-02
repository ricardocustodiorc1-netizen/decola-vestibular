# Sprint 4 — relatório de preparação

02/11/2026. Branch exclusiva `dev/navegacao-leo-familias-20261031`, base `19cfd5b`. Política comercial aprovada registrada: sete dias sem cartão, sem conversão automática, R$ 39,90 por adesão expressa, expiração no servidor e progresso preservado.

## Pronto para revisão local

- Exemplos isolados local/homologação e contrato Auth, sem segredos, endpoint externo ativo ou configuração de produção.
- Backend local em loopback 8001 com sessão opaca/expiração/revogação, CSRF, Host/origem, limites de corpo e erros sem detalhe sensível. Nenhuma rota cria sessão fictícia pelo navegador.
- Contratos HTTP para trial e escolha de assinatura. Dependências de identidade e repositório são injetadas apenas nos testes; defaults negam acesso/desconectados.
- Construtor de requisição Asaas **não enviada**, fixo em sandbox, preço/ciclo e callbacks não roteáveis; comparação segura de token de webhook isolada. Sem chave, transporte ou alteração de direitos por retorno de checkout.
- Rascunho de migração Postgres/Supabase com RLS, grants mínimos, funções autorizadas de trial/acesso e tabelas de progresso, importação e inbox financeiro. Não foi aplicado, não é SQL certificado para produção.
- Plano de homologação, migração, custo e autorizações em [SPRINT-4-HOMOLOGACAO.md](SPRINT-4-HOMOLOGACAO.md).

Arquivos de código/config: `server/homologation/{security,app,start,asaas-sandbox}.mjs`, README, `environments/*.example.json`, `database/migrations/202611020001_subscribers.sql`, `tests/homologation.test.mjs` e script em `package.json`. Nenhuma mudança em frontend, Leo, aulas, simulados, memória, áudios ou armazenamento local existente.

## Resultados

| Verificação | Resultado |
|---|---|
| Baseline | 91 Node + 20 Python/SQLite = 111 aprovados |
| Final `npm test` | 109 aprovados, zero falhas/ignorados; 18 testes novos de homologação |
| Final `npm run test:infra` | 20 aprovados, zero falhas |
| Total final | **129 aprovados** |
| Sintaxe Node e `git diff --check` | Aprovados |
| Inicialização real do script local + HTTP | `/health` 200; `/api/auth/login` 503 explícito, sem criar conta/mensagem |
| Integridade | Frontend, navegação, Leo, memória, progresso, demonstração e áudios sem diferença desde a base |

Novos testes: isolamento da configuração, política comercial, expiração/revogação/capacidade de sessões, CSRF por sessão, cookies seguros e duplicados, request Asaas restrito, ausência de escolha/referências inválidas, token de webhook inválido, HTTP desconectado, Host/anonimato/CORS, conta não verificada, revogação, origem/CSRF/campos privilegiados, propriedade A/B via repositório de teste, tamanho/JSON/falha de banco e adesão expressa sem criar cobrança, além de ausência de autenticação no backend padrão mesmo com token interno de teste.

Testes HTTP usam cliente e servidor reais em loopback, sessões locais e principal/repositório fictícios explícitos. Não são teste real de Auth, e-mail, Postgres/RLS ou API Asaas. A suíte Python continua validando transações de trial/migração/suporte em SQLite. Não confundir aprovação SQLite com aprovação da migration Postgres.

Na primeira tentativa de smoke test entre comandos separados, o processo local não ficou acessível (conexão recusada). O smoke foi repetido com servidor e cliente no mesmo ciclo de processo, com sucesso nos estados 200/503. Não foi encontrado problema de produto nessa ocorrência; não houve ajuste de rede/infraestrutura.

## Limitações e bloqueios

Postgres, Docker e CLI Supabase não estão disponíveis no ambiente atual. A migração/grants/RLS precisa ser aplicada e testada em banco local descartável antes de recurso remoto. Não foram instaladas ferramentas nem conectadas credenciais. Ainda faltam SDK/adaptador Auth, provisionamento de conta/aluno, vínculo responsável/pagador, sessões persistentes, SMTP, Postgres repository, intenção persistente, transporte Asaas, inbox/outbox/reconciliador, cancelamento pago e UI de conta/checkout.

O helper de token não é um endpoint de webhook e não valida pagamento canônico. As rotas de Auth e assinatura desconectadas não devem ser anunciadas como serviço real. O backend só executa offline e não pode ser publicado como está. Não houve nova interface mobile; sua homologação com login/checkout reais permanece pendente, assim como regressão em aparelho Android real.

A política de migração preserva originais e conflitos, mas o exportador/importador de UI e a sincronização entre dispositivos ainda não existem. Não houve acesso a dados reais de estudantes.

## Custos e aprovações

Nenhuma nova conta, contratação, conexão de API ou recurso remoto: **R$ 0,00 de despesa externa nova gerada por esta entrega**. Não consultamos faturas existentes. Preços públicos e hipóteses estão no Sprint 3 e na seção de custos da homologação; valores não são despesas efetivamente contratadas.

Próxima fase proposta: validar stack local/SQL → aprovar um projeto Supabase isolado sem nova cobrança (São Paulo, nome proposto `decola-homologacao`, organização a indicar) → autorizar conexão de segredos de teste e e-mails permitidos → autorizar Asaas sandbox e credencial específica → apresentar HTTPS/hospedagem/visibilidade/custo para aprovação separada. Não há autorização presumida para criar conta, aceitar termos, usar credenciais existentes ou publicar backend de teste.

Aprovações concretas e rollback estão em `SPRINT-4-HOMOLOGACAO.md`; nada externo foi executado. Homologação comercial completa ainda não foi concluída.

## Repetir localmente

```sh
npm test
npm run test:infra
npm run dev:homologation
```

Abrir `http://127.0.0.1:8001/health`. O site atual continua por `npm run dev` em `http://127.0.0.1:8000/`. Não há login habilitado nem link sandbox de pagamento. Não colar senha/chave/contato real nesses contratos de teste.

Main permanece `73c5db2aeb591afc52f31ed3227101d271103d42`. Sem merge, deploy, Worker, cobranças ou alterações no site oficial. Código e documentação seguem em commits separados na branch autorizada.
