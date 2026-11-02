# Etapa 2D-C — execução interrompida antes de escritas

02/11/2026. Base `dda96b3`. Branch exclusiva `dev/navegacao-leo-familias-20261031`. Projeto `yxxrfhobhonigwczzpim`, organização `gfuffaasrxaroosnwujl`.

A autorização para duas personas e testes delimitados foi recebida e permanece válida. O preflight encontrou condições de interrupção previstas pelo usuário. Nenhuma conta foi criada e a homologação integrada NÃO foi iniciada/aprovada.

## Verificações efetivamente executadas

1. Árvore limpa e branch autorizada confirmadas antes do trabalho.
2. Node 22.22.0, 82 testes de homologação LOCAL aprovados, zero falhas/ignorados. Incluem SQLite real, backup online, restauração, lease/fencing, falhas injetadas e adaptadores com doubles. Não são logins/Auth/RLS reais.
3. `npm --prefix scripts/homologacao --offline run preflight` aprovado: imports sem construção de clientes, alvo conferido, modos run/create ainda bloqueados. O texto do preflight se refere às suas próprias rotinas locais, não à consulta de metadados separada descrita abaixo.
4. Única operação remota desta tentativa: SELECT de metadados da identidade da conexão. Sem dados de alunos ou credenciais:

```sql
SELECT current_user AS connection_role, r.rolsuper AS superuser,
       r.rolbypassrls AS bypassrls
FROM pg_catalog.pg_roles r WHERE r.rolname=current_user;
```

Resultado: connection_role=postgres; superuser=false; bypassrls=true. Nenhuma função de aplicação foi invocada.

## Bloqueadores confirmados

| Condição exigida | Situação real | Consequência |
|---|---|---|
| Conexão de mínimo privilégio | Conector SQL disponível usa postgres/BYPASSRLS | Não usar essa conexão para vinculação ou como prova de isolamento RLS; nenhuma escrita realizada |
| Auth por transporte seguro aprovado | Ferramentas disponíveis não oferecem createUser/login/refresh/signOut; não foi disponibilizado cliente/credencial por canal seguro ao executor | Não obter chaves no painel, copiar segredos, inserir usuários por SQL ou improvisar cliente administrativo amplo |
| Capacidade remota separada | boundary.mjs continua aceitando apenas offlineTestPermit; enableRemoteExecution sempre rejeita | Não transformar capacidade de teste em permissão real nem liberar CLI só por flag |
| Até 100 chamadas ao provedor | Ledger contabiliza operações do controlador, não todos os comandos/requisições internos | Limite persistente compartilhado por transporte ainda precisa ser implementado e testado antes da ativação; não estava pronto na 2D-A |
| Ledger/backup persistentes | Backup e recuperação funcionam nos testes locais; exemplo continua offline-only; host/diretório duráveis da execução não definidos | Não usar scratch efêmero como evidência de retenção durável para efeitos remotos |
| TLS e permissões do cliente pg | Não há conexão pg restrita disponibilizada | TLS/CA/hostname e grants dessa futura conexão não validados; HTTPS do conector não comprova TLS do adaptador |

Não foram ampliados privilégios, criados papéis, alterados grants ou configurações. A conexão ampla foi usada apenas para identificar seu próprio papel em leitura. As permissões efetivas do futuro executor continuam pendentes; não podem ser presumidas a partir dos grants de authenticated anteriormente inspecionados.

## Resultado e inventário

| Item | Resultado nesta tentativa |
|---|---|
| Contas Auth criadas | **0** |
| Vínculos accounts/students criados | **0 / 0** |
| Registros trial/progresso/pagamento criados | **0** |
| Sessões de aluno criadas/renovadas/revogadas | **0 / 0 / 0** |
| Login, isolamento entre personas, trial e negação pós-revogação | **NÃO EXECUTADOS** |
| Auth IDs, student IDs ou run remoto iniciado | Nenhum |
| Operações remotas | 1 SELECT de metadados pelo conector; 0 chamadas Auth e 0 escritas |
| Exclusões/limpeza | Nenhuma |

Inventário acima descreve somente o que esta execução criou; não afirma que o projeto inteiro esteja vazio, pois não foram enumerados usuários/dados existentes. Ledgers de testes locais não representam inventário de recursos Supabase.

## Consumo e custos

Nenhum serviço, plano, compra, recurso ou Action foi ativado. A última inspeção do painel registrou Free e spend cap habilitado. Usage/Billing não foram consultados novamente nesta tentativa; não há medição atual de incremento de consumo nem valor de fatura atribuível ao SELECT. Uma consulta de catálogo foi feita; não declarar consumo zero exato ou custo futuro garantido.

## Retomada objetiva

A autorização funcional não precisa ser repetida genericamente. Para retomá-la é necessário:

- Disponibilizar um executor/ambiente com conexão de backend restrita, TLS verificável e acesso Auth pelo canal seguro aprovado, sem enviar senha/token pelo chat. Não foi oferecido nesta sessão um canal de ingestão de segredos para o executor. O formulário browserAuth serve para login no painel, não para abastecer chaves/DSN de Node.
- Se não existir papel restrito adequado, apresentar primeiro os grants/papel propostos, risco e reversão; obter autorização específica antes de criá-lo ou ampliar privilégios. Não usar postgres/service_role como atalho para falhas.
- Definir host/diretório persistente e responsável por backup/retencão; validar backup antes de qualquer efeito remoto.
- Implementar e testar localmente a capacidade de execução delimitada e o orçamento persistente de 100 chamadas ao provedor, reaproveitando o ledger de 40 operações/10 minutos e sem retry de escrita incerta. A autorização cobre preparar esses controles, mas sua mera existência em documentação não basta para operar.
- Depois desses bloqueadores resolvidos, executar uma única homologação com duas personas, inventário e evidências por camada. Não trocar domínio sintético nem confirmar novas despesas sem decisão. Não limpar recursos; eventual remoção depende de autorização própria.

A execução remota foi interrompida conforme as condições do usuário. Não foram iniciados testes parciais pela UI, nem usado SQL para contornar Auth. Apenas este documento foi adicionado; produto, migrations, políticas, funções, Worker, main e site oficial não foram modificados/publicados. Os 211 testes da 2D-A são históricos; nesta tentativa foram repetidos somente os 82 pertinentes e o preflight.
