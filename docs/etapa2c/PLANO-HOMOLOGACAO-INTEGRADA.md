# Etapa 2C — plano de homologação integrada

Data: 02/11/2026. Preparação exclusivamente offline. Branch `dev/navegacao-leo-familias-20261031`, base local `fb29fa4fb6cb98b4cfc6a9caa532bf461bd9bee7`. Não houve sincronização remota nesta etapa.

## Escopo e estado conhecido

O alvo de uma execução futura é somente o projeto `yxxrfhobhonigwczzpim`, organização `gfuffaasrxaroosnwujl`. O usuário aprovou provisoriamente `us-east-1` para dados sintéticos, sem outro projeto. Nome automático, plano Free e ACTIVE_HEALTHY são observações da inspeção anterior, não consultas repetidas nesta etapa. Renomeação não foi realizada pelas ferramentas disponíveis. A existência/aplicação da migration e o estado remoto atual precisam ser confirmados novamente por inspeção autorizada antes de executar qualquer teste.

Este plano não autoriza: conexão, migração, criação ou remoção de usuário, fixture, mudança de credencial, alteração Auth/RLS, exposição de schema, envio de e-mail, execução de Actions ou contratação. O executor CLI continua bloqueado para criação. Não usar uma string `adapterMode` ou flags YES como autorização para execução real.

## Resultado que a homologação futura deverá provar

1. Autenticação real das duas identidades fictícias, com clientes e sessões separados, usando token assinado pelo serviço.
2. Aluno A acessa seus dados; não acessa dados de B por ID, listagem, atualização, RPC ou rota alternativa. O mesmo no sentido inverso.
3. Trial explícito sem cartão dura 168 horas, não reinicia por repetição, expira/cancela no servidor e preserva progresso. Nenhuma assinatura é criada automaticamente.
4. Estado de conta não confirmada, desativada, banida ou excluída bloqueia acesso conforme política aprovada.
5. Falha parcial produz inventário reconciliável e jamais apaga identidade/registro de outra execução.
6. Encerramento, retenção e limpeza têm evidência verificável e autorização compatível.

Não confundir autenticação com autorização, chave pública com segredo administrativo, teste SQL com validação de JWT ou dados sintéticos com ausência de responsabilidade operacional.

## Separação de camadas

| Camada | O que comprova | O que não comprova |
|---|---|---|
| Test doubles locais | Ramificações, falhas e compensação do executor | Auth, PostgreSQL, RLS, TLS ou API reais |
| SQLite local | Modelo transacional de referência e regras | Semântica Postgres e políticas Supabase |
| Postgres real com SET LOCAL ROLE/JWT sub | Políticas SQL e grants sob papel/claims de teste | Assinatura, validade ou aceitação HTTP do token |
| Auth real + API/BFF com token real | Login, sessão, verificação e autorização integrada | Segurança de rotas não exercitadas ou isolamento global de todo produto |
| Verificação final por inventário | Estado das fixtures autorizadas e resíduos | Que tokens expiraram apenas porque usuário foi removido |

O schema `decola` não deve ser exposto só para facilitar teste. Preferir adaptador BFF autorizado que preserve identidade do usuário e política de mínimo privilégio. Se a Data API precisar ser usada, apresentar exposição/grants/RLS como alteração separada para aprovação. Um backend com chave que ignora RLS precisa verificar propriedade independentemente; não utilizar acesso administrativo como prova de isolamento.

## Fases, condições e permissões

| Fase | Entrada necessária | Saída verificável | Permissão futura |
|---|---|---|---|
| C0 — preparação | Código/hash e plano local | Relatórios, matriz e executor real bloqueado | Etapa atual, somente offline |
| C1 — pré-inspeção | Conexão autorizada somente de leitura | Projeto/plano/região, grants, RLS, migration e configuração Auth confirmados | Revalidar escopo de leitura |
| C2 — prontidão | SQL/infraestrutura existentes e revisados | Condições dos testes atendidas, sem corrigir schema automaticamente | Migração/configuração, se necessárias, têm aprovação própria |
| C3 — provisionamento | Run ID, manifesto aprovado, duas personas e acesso de teste autorizado | IDs confirmados e vinculados em transação | Criar exatamente duas identidades fictícias e fixtures listadas |
| C4 — ensaio integrado | Sessões fictícias e escopo de alterações aprovado | Resultados de Auth/API/RLS/trial/progresso, com fase e protocolo | Login e operações de teste delimitadas |
| C5 — reconciliação | Inventário de tentativa/resultado e acesso autorizado | Diferença entre esperado/observado, decisão humana | Leitura dirigida às fixtures autorizadas |
| C6 — fechamento | Decisão de reter ou limpar | Auditoria de sessões e resíduos, relatório | Limpeza/remoção somente após aprovação específica |

Não avançar diante de divergência de projeto, gasto, conta fora do inventário, credencial de produção, schema inesperado ou resultado desconhecido. Não trocar plano, região, projeto ou privilégios para contornar falha.

## Controles obrigatórios antes da execução real

- **Alvo e custo:** Project/Organization IDs fixos; região temporária explicitada; plano e quota confirmados por leitura. Sem Actions ou recursos pagos presumidos gratuitos; interromper caso surja despesa.
- **Autorização:** registrar operação, alvo, quantidade de fixtures, versão/hash, janela de execução, retenção, permissão de criação/mutação/limpeza e autorização de acesso. Aprovação de plano não autoriza uso de segredo.
- **Identidades:** somente Horizonte e Estrela, e-mails de teste únicos sob domínio/controlador autorizado. `.invalid` serve apenas ao offline; entrega de e-mail real requer caixa e autorização separadas. Não usar contatos de alunos.
- **Segredos:** provisionar pelo mecanismo seguro aprovado, sem colagem em chat, argumentos de comando, Git, prints ou artefatos. Auth administrativo e PostgreSQL têm segredos separados, nunca em clientes de aluno. Segredos não constam no manifesto. Não ler ambientes/faturas/contas não autorizados.
- **Mínimo privilégio:** separar provisionamento Auth, papel de fixture no banco e clientes de aluno. Evitar superusuário e papel bypassrls nos testes de leitura do estudante. Se a API administrativa exigir chave ampla, aprovar escopo e confinamento antes; não afirmar que o nome da variável restringe a chave.
- **Rede futura:** allowlist de endpoint/porta, TLS com certificado verificado, redirects controlados, timeout e orçamento de chamadas. Bloquear overrides de host/banco na conexão. Nada de desativar TLS ou abrir egress irrestrito para resolver erro.
- **Concorrência:** um proprietário da execução por projeto; lock/lease com prazo e retomada, ledger persistente de operações e chave de idempotência interna. Checagem de existência isolada não elimina corrida.
- **Dados/SQL:** consultas parametrizadas, filtro por IDs do run, sem varredura/listagem de usuários reais. Migration e adaptadores não são alterados automaticamente pelo executor. Não inserir em auth.users diretamente.
- **Transações:** vínculos em transação, role/JWT locais à transação; rollback confirmado antes de reutilizar conexão. Rollback incerto exige descartar conexão e reconciliar com conexão nova autorizada, não continuar limpando nela.
- **Logs:** códigos sanitizados, fase, run ID e contagens; nunca senha, token, URL com senha, corpo bruto de SDK ou dados pessoais. Inventário privado tem acesso restrito; relatório compartilhável usa referências pseudônimas.
- **Sessões:** logout/revogação de refresh, verificação da política de access token remanescente e negação de acesso pela aplicação. Deleção do usuário, isoladamente, não prova invalidação de JWT já emitido.
- **Limpeza:** apresentação prévia do plano de deleção por run/IDs, conferência de dependências e aprovação específica. Nada de DROP CASCADE, deleção por prefixo global ou compensação remota automática herdada do teste offline.

## Limites operacionais propostos, ainda não aprovados para uso remoto

Uma execução por vez, duas identidades no máximo, concorrência de conexão até dois, orçamento de dez minutos e chamadas com timeout a definir após inspeção do serviço. Retentativas de criação e COMMIT não são automáticas: resposta perdida vai para estado desconhecido. Reads transitórios podem ter retry limitado somente após definição do adaptador. Estourar prazo encerra novas operações e inicia reconciliação, não uma limpeza cega.

Não há cron, campanha, produção, Asaas, novos projetos, publicação ou Worker neste plano. A validação de pagamento fica inteiramente fora da matriz.

## Decisões antes de pedir execução

1. Confirmar estado real da migration e ambiente: não inferir aplicação pelo arquivo existente.
2. Aprovar a forma de acesso seguro, papéis, duas caixas de teste, dados e limites.
3. Aprovar criação/vinculação e mutações necessárias para cada teste, sem supor autorização para exclusão/banimento/reset de senha.
4. Definir retenção e aprovar limpeza por run separadamente.
5. Implementar e testar localmente os bloqueios encontrados na revisão antes de propor desbloqueio remoto. Não basta remover a trava CLI atual.

Consultar [runbook](RUNBOOK-CONTAS-FICTICIAS.md), [matriz de testes](MATRIZ-TESTES.md) e [revisão/evidências](REVISAO-EXECUTOR-E-RESULTADOS.md). Qualquer mudança de schema, dependência ou código executável fica para autorização/escopo próprio; nesta entrega só documentação foi adicionada.
