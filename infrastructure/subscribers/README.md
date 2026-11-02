# Referência local — infraestrutura de assinantes

**Não é um serviço real nem servidor HTTP. Não está carregado pelo site.** Não autentica pessoas, envia mensagens, processa pagamentos ou migra dados do navegador. SQLite e identidades fictícias permitem testar regras antes de contratar infraestrutura. Não usar este diretório como backend de produção.

Executar na raiz, com Python 3 e Node já instalados:

```sh
npm test
npm run test:infra
```

`schema.sql` é executável em SQLite local. `local_model.py` usa consultas parametrizadas, transações e chaves únicas. `Principal` é um contrato interno: futuramente somente o adaptador de autenticação poderá construí-lo após validar sessão, assinatura, emissor, destinatário e expiração. Receber essa estrutura de JSON seria uma vulnerabilidade. `now` é o horário confiável do servidor; nunca aceitar o horário enviado pelo navegador. Instanciar o modelo com conexão dedicada por operação, fora de uma transação já aberta.

A referência cobre: trial sem cartão e sem conversão automática; sete dias de 24 horas; cancelamento imediato do trial sem renovação; direitos pagos apenas como fixtures de teste; importação optativa somente de respostas de Porcentagem; deduplicação de suporte autenticado e retorno do identificador somente após commit. Não há adaptadores de JWT, e-mail, checkout, webhook, WhatsApp ou OpenAI. Não há autorização de responsáveis implementada. Os testes usam armazenamento em memória ou arquivo temporário descartável, sem dados reais.

O catálogo de importação conserva IDs/versão da aula e é confrontado automaticamente com `percentage-content.js`. O envelope de planejamento é:

```json
{"schemaVersion":1,"sourceKey":"decola-smart-percent-v3","contentVersion":"percentage-v3","answers":{"0":{"choice":0,"attempts":1,"done":false}}}
```

Não é o formato completo do backup atual. Um adaptador futuro, após consentimento, montará esse envelope a partir da chave local específica. Nenhuma leitura/escrita de localStorage acontece nesta entrega. Não importar assinaturas, privilégios, conversa ou dados pessoais pelo envelope.

A política de conflitos preserva o registro já existente no servidor e informa `keptExisting`, mesmo que a cópia importada pareça mais recente. Não combina tentativas e não promove resultado importado a avaliação verificada. Uma nova política de conciliação exige decisão explícita e teste.

Antes de produção: portar esquema/transações para Postgres, implementar RLS/grants e integração com Auth, controle de sessões/CSRF, isolamento do papel de banco, ledger de pagamentos e outbox de suporte; testar concorrência e restauração no banco real. O modelo não pode provar o comportamento desses serviços ainda inexistentes.
