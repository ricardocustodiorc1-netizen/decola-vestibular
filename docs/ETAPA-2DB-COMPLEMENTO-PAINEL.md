# Etapa 2D-B — complemento pelo painel Supabase

Inspeção em 02/11/2026, somente leitura. Projeto `yxxrfhobhonigwczzpim`, organização `gfuffaasrxaroosnwujl`, branch de código exclusiva `dev/navegacao-leo-familias-20261031`. Complementa a [pré-inspeção por conector](ETAPA-2DB-PREINSPECAO-SOMENTE-LEITURA.md) e resolve as lacunas de acesso a Auth, Data API e Usage/Billing. [Registro estruturado sanitizado](evidencias/etapa2db-painel.json).

## Como foi verificado

Painel autenticado com participação do titular pelo fluxo seguro do navegador. Credenciais e códigos não foram lidos, copiados ou registrados. Esse login é uma sessão **administrativa do painel**, não uma sessão criada no Supabase Auth do projeto. Não foram abertas as listas de usuários, tabelas, chaves, Vault, logs pessoais ou meios de pagamento. Não houve SQL, criação de conta/sessão de aluno, alteração ou gravação de configuração.

Somente navegação, abertura/fechamento de painéis e leitura. Não se clicou em Save, Add URL, Harden Data API, Upgrade, Change spend cap, Change subscription plan, Enable Explorer ou ações equivalentes. O rótulo `main / Production` visto no painel refere-se à branch do projeto Supabase; não é a branch main do GitHub nem foi modificado.

## Authentication confirmado

| Configuração | Valor observado |
|---|---|
| Permitir novos cadastros | Ativado |
| Confirmação de e-mail | Obrigatória |
| Login anônimo | Desativado |
| Vinculação manual de identidades | Desativada |
| Provedor e-mail | Ativado |
| Provedores externos/telefone mostrados | Desativados |
| Secure email change | Ativado |
| Secure password change | Desativado |
| Exigir senha atual para troca | Desativado |
| Bloqueio de senhas vazadas | Desativado; painel informa Pro ou superior |
| Senha mínima / requisitos | Valor mínimo redigido pela superfície segura; requisitos sem opção explícita legível. Não inferidos nem extraídos por outro meio |
| Validade do OTP/link de e-mail | 3600 segundos |
| Tamanho do OTP | 8 dígitos |
| Site URL | `http://localhost:3000` |
| Redirect URLs | Nenhuma URL cadastrada |
| SMTP personalizado | Desativado; templates padrão |
| CAPTCHA | Desativado |
| Auth Hooks | Lista vazia, painel oferece criação de primeiro hook |

A autenticação administrativa via ChatGPT/Google foi a escolha do titular para entrar no painel; isso NÃO significa que Google ou ChatGPT estejam habilitados como provedores dos alunos no projeto.

### Sessões e limites

- Access token expiry: **3600 s**.
- Detecção/revogação de refresh potencialmente comprometido: **ativada**; reutilização tolerada por **10 s**.
- Sessão única: desativada. Limite de duração e inatividade: ambos 0/never. Controles desabilitados na interface, indicados como exclusivos de Pro ou superior. Não se recomenda upgrade para a homologação limitada.
- Refresh: 150 requisições/5 min/IP; verificação OTP/magic link: 30/5 min/IP; cadastros/logins: 30/5 min/IP.
- Limite de envio de e-mails: campo redigido pela superfície segura, não confirmado. Não confundir com os limites públicos ou deduzir valor padrão.
- Encaminhamento de IP: desativado.

Não se tentou enviar e-mail, recuperar senha, criar conta, fazer login de aluno, renovar ou revogar token. Nenhum desses comportamentos está homologado por leitura de configuração.

## Data API: decola não está exposto

Tela: https://supabase.com/dashboard/project/yxxrfhobhonigwczzpim/integrations/data_api/settings .

- Schemas expostos: **public** e **graphql_public**.
- **decola não marcado**. O menu destaca a primeira opção com foco/aria-selected; isso não é a marcação persistida. A verificação visual mostrou checkmarks apenas em public e graphql_public, coerentes com `2 of 3 schemas exposed`.
- Interface indica **0/7 tabelas** e **0/5 funções** expostas.
- `Automatically expose new tables`: **ativado**.
- Extra search path: public e extensions; limite máximo de linhas: 1000; pool automático.
- Nenhuma seleção foi alterada e nenhum Save foi acionado.

Conclusão: a rota direta Data API para os objetos decola **não está habilitada na configuração observada**. Não é necessário expor decola para o desenho de backend com acesso Postgres preparado na 2D-A. Uma tentativa futura de acessar decola diretamente por supabase-js REST deverá considerar essa restrição, em vez de ampliar grants para contorná-la.

O risco anteriormente condicionado à exposição de decola não é uma exposição atual demonstrada. Porém active_account continua sem checar session_id; o backend deve manter verificação da sessão e toda nova rota/exposição precisa ser revisada. O switch de exposição automática pode conceder privilégios a tabelas futuras: propor seu desligamento em mudança separada, se desejado; não foi alterado e não é necessário criar tabelas novas no piloto.

## Usage e Billing confirmados

Telas:
- https://supabase.com/dashboard/org/gfuffaasrxaroosnwujl/usage
- https://supabase.com/dashboard/org/gfuffaasrxaroosnwujl/billing

Plano **Free**, ciclo exibido **02/11/2026–02/12/2026**, filtro All projects. Na organização foi exibido somente o projeto autorizado. O painel afirma que nenhuma quota Free foi excedida no ciclo e que excedentes não são atualmente faturados nesse plano; pode ocorrer restrição/read-only/indisponibilidade ao exceder limites.

| Métrica | Uso exibido | Incluído |
|---|---:|---:|
| Banco, resumo | 0,026 GB (~5%) | 0,5 GB/projeto |
| Banco, detalhamento do projeto | 25,23 MB | 0,5 GB/projeto |
| Egress | 0,00 GB | 5 GB |
| Cached egress | 0,00 GB | 5 GB |
| MAU | 0 | 50.000 |
| Storage | 0,00 GB | 1 GB |
| Edge Functions | 0 | 500.000 invocações |
| Realtime mensagens | 0 | 2.000.000 |
| Realtime pico | 0 | 200 conexões |

Valores arredondados e sujeitos ao atraso informado no painel: algumas métricas até uma hora, MAU até 24 horas. Não representam consumo zero exato nem reserva de capacidade para uma execução futura. A medida anterior via pg_database_size (~11 MB) e a apresentação do painel não devem ser tratadas como a mesma coleta/instante; nenhum dado foi corrigido para fazê-los coincidir. O painel é a referência observada para quota.

Billing informa **Spend cap enabled** e que não haverá cobrança extra de uso, com risco de limitação do serviço se exceder a quota. A tabela de faturas exibe estado vazio. Não foram abertos cartões, endereços, identificadores fiscais, detalhes de pagamento, compra de créditos ou propostas de upgrade.

Não foi identificada necessidade de recurso pago para o teste curto com duas contas no ambiente atual. Isso não autoriza futuras compras, mudança de plano ou extrapolação. Não foi emitida garantia de cobrança zero para qualquer operação futura; interromper diante de proposta de custo ou plano divergente.

## Há bloqueio para homologar duas contas?

**Não apareceu bloqueio de infraestrutura/plano ou incompatibilidade estrutural que exija compra ou exposição de decola.** Ainda existem pré-condições operacionais e autorizações:

1. Aprovar especificamente as duas identidades sintéticas por run, criação, vínculo, sessões de teste, revogação e eventuais registros de progresso; nada disso foi executado ou está liberado por esta inspeção.
2. Autorizar acesso/credenciais mínimas e a ativação delimitada dos transportes. A porta de criação administrativa da 2D-A exige permissão administrativa Auth; o papel SQL precisa de privilégios mínimos exatos. Nenhuma credencial foi obtida nesta etapa e os CLIs permanecem bloqueados.
3. Definir host/diretório persistente, backup, run/lease, orçamento por transporte, TLS, limites, critérios de interrupção e reconciliação. Reutilizar plano/controles 2D-A; não pedir autorização a cada chamada já incluída num escopo aprovado.
4. Escolher o escopo: **Admin createUser com e-mail confirmado explicitamente**, já previsto no adapter, permite testar Auth/backend/RLS sem depender de redirect/entrega SMTP, mas não valida onboarding público nem prova aceitação do domínio `.invalid` pelo provedor (ainda não testada). Essa confirmação administrativa deve constar da aprovação. Se recusado pelo provedor, parar; não trocar domínio ou afrouxar regras sem decisão.
5. Para **cadastro público, confirmação ou recuperação por e-mail**, o Site URL padrão/redirects vazios são uma incompatibilidade com o ambiente Decola. Aprovar os callbacks exatos e o caminho de entrega antes desses testes. SMTP desativado não prova entrega a endereços arbitrários; não contratar fornecedor como solução implícita.
6. Validar negação HTTP após logout/refresh pelo backend; o JWT vale uma hora e a leitura da configuração não prova revogação imediata. Não é preciso contratar os controles Pro para testar o bridge preparado.
7. Limpeza remota continua com plano/inventário e autorização própria, sem exclusão automática. Sem pagamentos/Asaas, Worker, site oficial, Actions ou publicação.

CAPTCHA e controles de troca de senha desativados merecem avaliação antes de lançamento público, mas não exigem mudança automática ou contratação para um piloto pequeno e autorizado. O nome do projeto continua diferente do nome de homologação pretendido; o ID foi usado como alvo. O painel também exibiu banner de investigação de incidente técnico: reavaliar disponibilidade antes da execução, sem inferir indisponibilidade deste projeto só pelo aviso geral.

## Evidências e preservação

Registro baseado exclusivamente em páginas visíveis, sem endpoints ocultos, extração de cookies/storage, cópia de tokens ou leitura de credenciais. Não se salvaram screenshots brutos com nome pessoal ou detalhes de cobrança no repositório. JSON e este relatório contêm somente configurações e totais sanitizados.

Esta entrega modifica documentação, não produto/adaptadores/migrations/workflows. Validação local: JSON válido, conferência de campos, escopo do diff e whitespace. Os 211 testes da 2D-A permanecem evidência histórica; não foram reapresentados como testes novos ou integrados. Nenhum teste real com escrita está aprovado ou executado.
