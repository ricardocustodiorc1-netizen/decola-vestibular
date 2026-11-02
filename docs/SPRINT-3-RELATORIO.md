# Sprint 3 — resultado e implantação proposta

Data: 02/11/2026. Branch: `dev/navegacao-leo-familias-20261031`. Base: `64473dc`. Entrega de arquitetura e componentes locais; **não é um serviço de assinantes real**.

## Entregas

1. [Arquitetura](SPRINT-3-ARQUITETURA-ASSINANTES.md): alternativas de autenticação, recuperação, banco, sessões, controle de acesso, trial/cancelamento/antifraude, pagamentos, suporte e operação.
2. [Custos e provedores](SPRINT-3-CUSTOS-E-PAGAMENTOS.md): pesquisa em fontes oficiais, comparação Asaas/Stripe/Mercado Pago e cenários de 100/500/1.000 alunos com hipóteses explícitas.
3. [Migração](SPRINT-3-MIGRACAO-PROGRESSO.md): inventário, consentimento, limites, formatos versionados, conflito e preservação do original.
4. [Referência executável local](../infrastructure/subscribers/README.md): SQLite transacional e modelo Python sem dependência externa, credenciais ou conexão. Não está incluída em HTML/bundle nem altera o produto atual.

Recomendação: Supabase Auth/Postgres + BFF na mesma origem da aplicação futura + checkout hospedado Asaas a homologar, com Stripe como alternativa e Mercado Pago dependente de cotação específica. Estimativa inicial de infraestrutura básica: US$ 32/mês para Supabase Pro e um backend mínimo, sem Manychat, SMTP, excedentes, impostos ou câmbio. O custo comercial completo é maior; a planilha em Markdown separa hipóteses e exclusões. Nenhum fornecedor foi contratado.

## Testes executados

| Verificação | Resultado |
|---|---|
| Baseline do site antes de mudanças | 90 testes aprovados |
| `npm test` final | 91 aprovados: 90 anteriores + integridade do catálogo de importação contra a aula atual |
| `npm run test:infra` | 20 testes Python/SQLite aprovados; dados fictícios em memória e arquivo temporário |
| Total das duas suítes | 111 aprovados, zero falhas ou testes ignorados |
| `git diff --check` | Aprovado |
| Integridade do frontend/pedagogia | Nenhuma diferença desde `64473dc` em HTML, navegação, Leo, aula, progresso, memória, demonstração e áudios |

### Segurança e confiabilidade verificadas localmente

- Acesso anônimo, sessão vencida, conta não verificada ou desativada negados.
- Acesso/leitura de direito/importação/cancelamento de aluno de outra conta negados.
- Trial não é criado por visita; limite exato de 604.800 segundos; data futura e instante final sem acesso.
- Pedidos repetidos, inclusive após expiração/cancelamento, não estendem teste; duas conexões simultâneas recebem uma única concessão.
- Exclusão/recriação de estudante com mesma chave de elegibilidade conserva bloqueio de nova concessão. Não prova prevenção de abuso com múltiplos e-mails.
- Período pago existe só como fixture explicitamente sintética; respeita vencimento e revogação. Banco rejeita preço/moeda/duração inválidos. Nenhum pagamento foi gerado.
- Consultas parametrizadas: identificador com tentativa de SQL injection não concede acesso.
- Importação rejeita campos de privilégio, JSON duplicado, esquema/versão desconhecidos, excesso de tamanho, bool como inteiro e respostas incoerentes. Não sobrescreve resposta existente nem concede assinatura.
- Reenvio é idempotente; mesma chave com conteúdo diferente é conflito; falha na segunda escrita reverte todo lote e recibo.
- Chamados locais deduplicam evento; colisão entre contas/conteúdo é rejeitada; reclamação vai para estado humano; falha de banco não retorna protocolo.

Esses testes não são pentest do site público nem validação de Supabase/Auth/JWT/SMTP/CSRF/RLS/webhook real. Tais adaptadores não existem e não foram simulados como serviços operantes. Não houve teste de login com pessoa real, conta paga, WhatsApp, API OpenAI ou cobrança. Não há nova interface; não foi necessária nova rodada visual mobile neste sprint. A revisão mobile anterior continua válida apenas para os layouts já testados, não para futuras telas de cadastro/checkout.

## Sequência concreta, aceite e retorno

| Passo | Escopo após autorização correspondente | Aceite / validação | Retorno seguro |
|---|---|---|---|
| 0. Decisões | Escolher stack, política sem cartão, preço, famílias, conteúdo protegido, retenção e orçamento | Decisões registradas, responsáveis e limites aprovados | Nenhuma alteração externa |
| 1. Homologação de identidade | Criar ambiente isolado e SMTP autorizado, Auth/BFF e banco com migrations versionadas | Cadastro, verificação, login/logout, recuperação, MFA equipe, CSRF e isolamento de contas testados | Desligar ambiente novo; frontend oficial intacto |
| 2. Trial e direitos | Implementar Postgres/RLS/grants e endpoints protegidos; proteger conteúdo fora de bundles públicos | Concorrência, expiração, revogação, acesso próprio ao progresso mesmo vencido e não exposição de conteúdo | Feature flag desativada no ambiente de teste; preservar banco e histórico |
| 3. Migração piloto | Exportação voluntária da origem antiga e importação Porcentagem | Consentimento, resumo, reenvio, queda e conflito; nenhum original apagado | Desativar importação; auditar lote e restaurar registros novos se necessário, sem apagar progresso posterior |
| 4. Suporte persistente | Backend, inbox/outbox, conta Manychat/número autorizados e equipe humana | Protocolo após commit, contato não autenticado sem acesso a conta, deduplicação, handoff e falhas | Parar automações; manter tickets e atendimento humano |
| 5. Pagamento sandbox | Autorizar especificamente credenciais sandbox e conta/provedor | Checkout real de teste, callbacks falsos, webhook inválido/duplicado/fora de ordem, reconciliação, cancelamento e reembolso | Desativar adaptador sandbox; não tocar produção |
| 6. Homologação final | Android Chrome/Edge e outros aparelhos aprovados; carga e restauração | Jornada completa, Leo/memória/simulados/progresso preservados, backup restaurável, fila/custos/alertas | Reverter versão da aplicação com esquema compatível e dados preservados |
| 7. Produção | Apenas mediante autorização separada para infraestrutura, cobranças e publicação | Checklist assinado pelo responsável, limites e canal de suporte ativos | Plano específico de rollback sem desfazer cobranças nem perder eventos |

Não executar downgrade destrutivo de banco para reverter código. Usar alterações expansivas compatíveis, backup e migração corretiva. Credenciais de homologação/produção e eventos ficam separados; publicar backend não ativa assinatura automaticamente.

## Decisões pendentes do proprietário

- Aprovar ou ajustar stack e limites: projeto Supabase, backend, SMTP/domínio, plano de Manychat e uso de OpenAI para suporte. Conta existente não equivale a aprovação para ampliar permissões.
- Confirmar teste de sete dias sem cartão e sem renovação automática; cancelamento do teste imediato e assinatura paga até o fim do período confirmado; política de inadimplência, reembolso e contestação.
- Definir aluno/responsável/pagador e verificação de vínculo, conteúdo público versus pago, retenção e revisão de privacidade/termos. HMAC antifraude não substitui decisão de retenção nem garante unicidade de pessoa.
- Escolher Asaas/Stripe/Mercado Pago após cotação aplicável e autorizar sandbox; aprovar separadamente eventual produção.
- Aprovar número/canal, escopo das permissões, horário de equipe humana, contingência e orçamento máximo de IA/mensagens.
- Aprovar implementação futura da migração e exportação voluntária. Nada será transferido silenciosamente.

## Preservação e execução local

Main permanece `73c5db2aeb591afc52f31ed3227101d271103d42`. Na conferência pública via HTTPS, `index.html`, `app.js`, `professor-leo.js` e `study-area.js` permaneceram iguais byte a byte à main. Nenhum merge/deploy/alteração de Worker foi executado. Nenhuma credencial de Auth, cobrança, WhatsApp ou OpenAI foi lida/utilizada; nenhuma base ou mensagem de aluno real foi acessada. Commit de código e de documentação são separados, somente na branch autorizada.

Para repetir: `npm test` e `npm run test:infra`. Python 3 com SQLite e Node são suficientes; sem instalação de pacote ou variável secreta. O script `test:infra` não abre servidor, não solicita conta nem acessa rede. Para visualizar o site existente, usar `npm run dev` e `http://127.0.0.1:8000/`; este sprint não acrescenta telas de login/cobrança fictícias.
