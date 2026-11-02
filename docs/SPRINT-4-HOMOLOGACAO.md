# Sprint 4 — preparação da homologação comercial

Data: 02/11/2026. Branch exclusiva `dev/navegacao-leo-familias-20261031`. Base: `19cfd5b`. Direção aprovada: Supabase Auth/Postgres, backend seguro e Asaas como primeira avaliação. **Não houve criação/conexão de ambiente externo.**

## Política aprovada e limites

- Sete dias gratuitos sem cartão, iniciados por solicitação após verificação.
- Nenhuma cobrança/conversão automática no fim. Adesão mensal de R$ 39,90 somente por escolha expressa do aluno adulto ou pagador responsável autorizado.
- Expiração e autorização no servidor; progresso e acesso à conta/exportação preservados após o período gratuito.

As decisões comerciais acima agora estão registradas como aprovadas. Isso não autoriza criar contas, conectar segredos, alterar Worker, implantar, contratar ou cobrar. Não foi feita integração de dados ou telas fictícias que aparentem login/pagamento real.

## O que foi preparado

| Componente | Entrega | Situação |
|---|---|---|
| Isolamento | Exemplos JSON local/homologação; validação que rejeita produção, host público, chaves extras e conexões externas | Código testado, servidor só em loopback |
| Backend | Camada HTTP nativa Node, sessão opaca, CSRF, verificação de Host/origem, corpo limitado, respostas sem cache e erros genéricos | Local; Auth/banco padrão desconectados |
| Autenticação | Contrato de confirmação de e-mail, redirects exatos, MFA da equipe, recuperação genérica e sessão no servidor | Não há adaptador Supabase conectado; endpoints retornam 503 |
| Postgres | Migração versionada com contas/alunos, claims de trial, períodos pagos sandbox, inbox, progresso/importações; RLS e funções de trial/acesso | Rascunho NÃO aplicado; exige ensaio em Postgres/Supabase isolado |
| Trial | Contratos HTTP de início/cancelamento e política imutável; referência SQLite anterior continua testada | HTTP testa dependências fictícias; SQL não validado no banco real |
| Assinatura | Validação de escolha expressa e versão da política; valor canônico 3990 BRL | Nenhuma assinatura ou intenção persistente criada |
| Asaas | Preparação de request para `/v3/checkouts`, cartão recorrente mensal, callbacks `.invalid`, `sent:false`; helper de comparação de token de webhook | Não envia requisição nem usa chave; sem webhook/ledger/reconciliação real |
| Migração | Inventário e plano anterior mantidos; novo esquema prevê revision, origem e recibos idempotentes | Não leu/moveu progresso real nem altera localStorage |

A camada do site, Leo, áudios, Desafio da Memória e simulados não recebem imports desses módulos. Nenhuma aula fica bloqueada por esta entrega.

## Contratos a implementar após autorização

### Auth e banco

Usar SDK oficial com versão fixada na implementação e API Supabase real em homologação. Verificar verificação de e-mail e estado de conta no servidor; não construir principal a partir de JSON do cliente. Trocar senha com Auth, sem registrar senha/token em logs, analytics ou URL de retorno livre. SMTP de produção precisa aprovação própria; o serviço padrão Supabase é limitado e não é promessa de entrega a alunos. Para laboratório, usar e-mails sintéticos e caixa local quando disponível.

Sessões do ensaio são em memória, sem renovação, persistência ou múltiplas instâncias; precisam store persistente, rotação, revogação após redefinição de senha e limites antes de homologação externa. O exemplo de cookie seguro não fornece TLS por si só; ambiente externo exige HTTPS, configuração de proxy confiável e validação equivalente de origem. Não desabilitar TLS/CSRF para resolver integração.

SQL depende de `auth.users`, `auth.uid()` e papéis Supabase. Não executar em banco existente. Funções de trial usam relógio do banco e intervalo de 168 horas, não horário enviado pelo navegador; índices únicos evitam repetição. Conta e chave de elegibilidade são provisionadas exclusivamente pelo futuro backend confiável; nenhum formulário escreve privilégios diretamente. Chaves antifraude devem ser HMAC versionado, com política de retenção aprovada; o esquema não gera identidade nem impede abuso com múltiplos e-mails sozinho.

O schema `decola` não deve entrar em lista de schemas expostos sem revisão. Se usado via Data API, aprovar explicitamente exposição e confirmar grants/RLS com testes reais por papel. Tabelas financeiras e de claims não recebem grants de escrita/leitura direta do usuário. Nenhum grant à `service_role` é solução para validar usuário; o repositório BFF terá papel limitado ou contexto autenticado. Faltam provisionamento, guardian_links/permissões familiares e escritor transacional de pagamentos: menor não pode iniciar checkout sem pagador/vínculo validado. A referência HTTP só testa propriedade simples, não representa vínculo familiar concluído.

### Trial e assinatura

Testar novo usuário verificado → solicitação explícita → acesso até instante final aberto → conta/progresso continuam legíveis → adesão opcional. Cancelar trial encerra apenas trial e não remove respostas. Pagamento mensal usa ciclo de calendário do Asaas, sem substituir mês por 30 dias.

Antes de abrir checkout, backend valida pagador/vínculo e preço e grava intenção idempotente. O contrato atual não grava intenção; retorna “sandbox não conectado”. O construtor atual só produz request fictícia não enviada. Após autorização, substituir placeholder de callback por origem HTTPS aprovada e adicionar transporte sandbox com timeout, allowlist exata, política de redirects e segredo apenas no servidor. Não habilitar produção por simples troca de variável.

Criar checkout não confirma pagamento. Redirect não concede acesso. Webhook Asaas valida `asaas-access-token` separado (não usar API key como token), grava/deduplica ID+digest e só então confirma com HTTP 200. Consumidor reconcilia pagamento canônico, conta recebedora, sandbox, cliente, assinatura, valor e moeda. Aplicação de período pago e encerramento do trial remanescente são uma transação. Eventos repetidos/fora de ordem não concedem meses extras nem ressuscitam período revogado. Não há esse consumidor implementado nesta etapa.

Cancelamento da assinatura precisa interromper renovação com confirmação do provedor e preservar período pago conforme política; falha não pode aparecer como cancelado. Reembolso, chargeback e retenção exigem políticas operacionais específicas antes da produção. O endpoint de cancelamento atual é só de trial.

### Migração e suporte

Seguir [plano de migração](SPRINT-3-MIGRACAO-PROGRESSO.md): exportação voluntária na origem antiga, confirmação do aluno de destino, allowlist/versionamento, resumo e lote idempotente; conservar original e registro já existente. A nova origem não lê localStorage de outra origem. Primeiro homologar apenas Porcentagem, depois memória/plano/simulados com adaptadores próprios. Nada é apagado no login/logout ou no fim do teste.

WhatsApp/Manychat/OpenAI continuam no [plano de suporte](SUPORTE-WHATSAPP-MANYCHAT-PLANO.md), sem conexão. Registro persistente/outbox, autenticação do canal, confirmação de titularidade, fila humana e quota de IA são bloqueios antes de atendimento real. Solicitar permissão separada para número, conta, escopos e contatos de teste. Não mudar o Worker pedagógico para acomodar suporte/comercial.

## Roteiro de ensaio — ordem e critérios de aceite

1. **Local com stack real, antes de remoto:** instalar CLI oficial Supabase/runtime Postgres compatível em ambiente autorizado; inicializar configuração oficial do CLI, sem `link`, deploy ou login em conta. Não usar os JSON próprios como config CLI. Aplicar migração somente no banco descartável; registrar versão, erro, rollback e testes RLS. O ambiente desta execução não dispõe de Postgres, Docker ou CLI Supabase; não foram instalados.
2. **Teste de banco:** contas A/B, usuário não confirmado/desativado, anon e authenticated; negar escrita direta em trial/pagamento/progresso; negar funções privadas; testar dono de schema versus usuário real. Validar início único sob concorrência, fronteira temporal, cancelamento e tentativa de recriar aluno. Verificar schema não exposto e ausência de privilégios herdados. Zero falhas é condição para seguir.
3. **Auth integrado:** cadastro/verificação/login/logout, senha errada, recuperação genérica, token usado/expirado, redirects fora da lista e revogação. Conta desativada precisa perder acesso sem esperar expiração do cookie.
4. **Checkout sandbox:** aprovação separada; dados de teste do provedor, nenhum cartão/CPF/contato real. Escolha expressa; intenção com vínculo validado; assinatura 39,90 BRL; pagamento aprovado/recusado; cancelamento e retorno falso.
5. **Webhooks:** token ausente/incorreto, evento duplicado/alterado, fora de ordem, banco indisponível, reconciliação falha, fila retomada, reembolso e período revogado. Não retornar 200 antes de persistir; não registrar cartão/segreto.
6. **Migração e regressão:** reenvio/conflito/queda, primeira resposta errada e segunda tentativa preservadas, memória, simulados e Leo; Android real e Edge. Ainda sem publicação.

Registrar evidências com identidades sintéticas. Os testes HTTP deste sprint usam o loopback e repositório de teste, não são teste end-to-end Supabase→Asaas. Não contar contratos/SQL lidos como integrações reais aprovadas.

## Custos e despesas

**Incremento externo gerado neste sprint: R$ 0,00 por novas contratações/conexões**, pois nenhuma foi feita. Não consultamos contas/faturas; portanto não há medição de custos reais já existentes do usuário. Não declarar o custo geral do projeto como zero.

Referências públicas consultadas no Sprint 3 continuam no [orçamento documentado](SPRINT-3-CUSTOS-E-PAGAMENTOS.md): Supabase Free para laboratório (sujeito a limites/vagas e pausa), Pro a partir de US$ 25/mês; backend mínimo de referência US$ 7/mês, sem extras; Asaas padrão de cartão à vista 2,99% + R$ 0,49 (aproximadamente R$ 1,68 em 39,90). São preços públicos estimados, não contrato ou fatura do usuário. Não há aprovação de Pro, hospedagem, SMTP, Manychat adicional ou volume de API. Homologação externa em organização já paga pode ter custo incremental mesmo se o objetivo for teste: conferir antes de criar e parar caso haja cobrança.

## Proposta concreta de autorização externa — não executada

Depois de validar SQL/stack local, apresentar para aprovação:

1. Criar **um projeto Supabase de homologação**, nome proposto `decola-homologacao`, em organização/conta indicada pelo proprietário, região proposta São Paulo `sa-east-1`, somente se houver plano/vaga sem nova cobrança. Sem upgrade, add-on ou cartão. Não alterar projetos existentes.
2. Aplicar somente a migration previamente validada nesse projeto vazio; configurar e-mail confirmado, redirects exatos e usuários de teste. Credenciais em secret store autorizado, não chat, Git ou frontend. Autorizar separadamente uso/conexão das credenciais e eventual SMTP.
3. Criar ou selecionar **ambiente Asaas sandbox** indicado pelo proprietário, sem conta de produção, cobranças reais ou contratação; autorizar credencial sandbox e token de webhook distintos. Não inferir autorização para criar conta/aceitar termos em nome do usuário.
4. Apresentar endereço HTTPS, provedor de hospedagem, visibilidade, custos e rollback antes de publicar o backend de homologação. Sem domínio oficial e sem Worker. A presente aprovação de direção técnica não autoriza essa publicação.

Reversão inicial: desligar somente aplicação/integrações de teste, revogar segredos de homologação quando autorizado e conservar evidências. Não deletar recursos/dados irreversivelmente sem autorização; não fazer downgrade destrutivo de banco. Para rollback de código, reverter commit na branch de desenvolvimento, preservando dados e eventos.

Fontes oficiais para contratos consultadas em 02/11/2026: [Asaas checkout](https://docs.asaas.com/reference/create-new-checkout), [recorrência](https://docs.asaas.com/docs/checkout-with-subscription-recurring), [webhooks](https://docs.asaas.com/docs/faq-de-webhooks), [Supabase migrations](https://supabase.com/docs/guides/local-development/database-migrations), [Auth](https://supabase.com/docs/guides/auth/passwords), [regiões](https://supabase.com/docs/guides/platform/regions).
