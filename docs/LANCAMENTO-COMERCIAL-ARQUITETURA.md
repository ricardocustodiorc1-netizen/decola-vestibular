# Preparação comercial do MVP

Branch: `dev/navegacao-leo-familias-20261031`. Data: 02/11/2026.

## Auditoria da situação atual

| Área | Situação verificada | Consequência |
|---|---|---|
| Cadastro e login | Perfis locais em `app.js` e protótipo familiar em `family-demo.js`; não existe autenticação de servidor | Nome e perfil de demonstração não constituem conta |
| Área do assinante | Meu Decola organiza aulas, exercícios e progresso; acesso público | Não há assinatura ou proteção comercial de conteúdo |
| Progresso | Armazenamento local, incluindo `decola-vestibular:progress:v1` | Não sincroniza entre aparelhos; não deve ser sobrescrito por futuro cadastro |
| Professor Leo | Integração pedagógica existente e áudio Elvis preservados | Worker não foi alterado nem usado como backend comercial |
| Cobrança | Nenhum checkout, webhook ou serviço de assinatura conectado | Não é possível cobrar ou confirmar pagamento |
| Atendimento | Não havia canal operacional integrado | Novo painel prepara apenas rascunhos locais, sem protocolo ou envio |

Os arquivos das aulas e o conteúdo compilado são públicos. Esconder botões no navegador não protege uma assinatura. Antes de vender acesso restrito, decidir quais amostras continuarão públicas e servir conteúdo protegido por um backend que valide autorização, inclusive arquivos privados.

## Implementação desta etapa

Home e área do aluno recebem “Ajuda e suporte”, com perguntas frequentes, tipos dúvida/problema/reclamação/sugestão e rascunho copiável. A interface informa que nada foi enviado. Não solicita telefone, senha ou dados de pagamento; orienta usar exemplos fictícios. Não registra tickets nem guarda o texto no armazenamento local. Fechar descarta o rascunho; copiar antes de fechar permite levá-lo ao canal escolhido futuramente.

O painel comercial apresenta sete dias e R$ 39,90 mensais, identificados como proposta e simulação local. Os cenários usam relógio fictício em memória, sem criar conta, conceder acesso ou gerar cobrança. A assinatura real permanece desabilitada. Navegar na demonstração não inicia período gratuito.

## Proposta de jornada real — pendente de implementação e decisões

1. Pessoa adulta cria e verifica conta. Para menor, separar estudante, responsável e pagador, com vínculo verificável e permissões explícitas. Um vínculo não concede automaticamente acesso ao histórico de conversas.
2. Pessoa solicita o período gratuito. Servidor registra uma única concessão elegível por matrícula/identidade validada, com operação idempotente e instante UTC. Definir prevenção de abuso sem coleta excessiva.
3. Servidor calcula expiração em sete períodos de 24 horas. O intervalo é fechado no início e aberto no fim. Relógio do navegador e localStorage nunca concedem acesso.
4. Após o prazo, oferecer adesão explícita de R$ 39,90/mês. Proposta: teste sem cartão e sem conversão automática. Essa política precisa de confirmação comercial antes do backend.
5. Conta permite consultar situação e gerenciar assinatura real por serviço seguro. Recuperação de acesso e cancelamento precisam funcionar antes de vender.

### Arquitetura e dados

Backend separado, ainda não contratado: autenticação, autorização, direitos de acesso, checkout e suporte. Provedor de identidade deve oferecer verificação, recuperação com links de uso único e expiração, proteção contra enumeração e revogação de sessão. Cookies HttpOnly/Secure/SameSite, defesa CSRF conforme arquitetura, validação de origem e limites de requisição; nunca segredos ou privilégios no cliente.

Entidades propostas: `accounts`, `students`, `guardian_links`, `enrollments`, `trials`, `entitlements`, `subscriptions`, `payment_events`, `support_tickets`, `support_messages`, `support_events`. Todas com controle de propriedade e auditoria. Pagador separado do estudante; histórico pedagógico não entra automaticamente no suporte.

Valores canônicos no servidor: BRL, 3990 centavos, mensalidade e duração do teste versionados. Checkout futuro hospedado pelo provedor, sem cartão nos servidores do Decola. Começar em sandbox somente após autorização. Webhooks autenticados por assinatura, deduplicados por evento, com verificação de valor/moeda/cliente e conciliação de eventos fora de ordem. URL de retorno, LLM e navegador não podem ativar assinatura. Definir tratamento de inadimplência, estorno e cancelamento antes da produção.

Migração de progresso deve ser optativa, validada por esquema/versão e associada à conta correta. Não substituir dados existentes ao entrar, sair ou criar perfil; testar conciliação, duplicação, aparelhos compartilhados e possibilidade de exportação. Esta etapa não migra nem altera dados.

## Etapas pequenas e critérios de aceite

| Etapa futura | Aceite mínimo | Testes |
|---|---|---|
| Identidade em ambiente isolado | Login, logout, recuperação e vínculo familiar verificado | Sessão expirada, isolamento entre contas, recuperação, CSRF e limites |
| Trial no backend | Uma concessão explícita; expiração UTC e direitos verificáveis | Limites exatos de sete dias, repetição, concorrência e relógio adulterado |
| Atendimento persistente | Protocolo só após gravação; acesso humano restrito | Duplicação, queda do banco, privacidade e retomada |
| Assinatura em sandbox | Checkout e estado reconciliados pelo servidor | Webhook duplicado/falso/fora de ordem, falha e cancelamento |
| Homologação | Conteúdo e anúncios correspondem ao que foi entregue | Android/iOS reais, acessibilidade, Leo, memória, simulados e progresso |
| Lançamento | Aprovação explícita de publicação e operação | Checklist de rollback, monitoramento e suporte |

## Bloqueios para lançamento comercial

Não está pronto para cobrar: faltam identidade real, backend de acesso, checkout e gestão de assinatura, atendimento operacional e políticas de privacidade/termos/cancelamento revisadas por responsáveis competentes. Não se declara conformidade jurídica automática. Validar catálogo efetivamente disponível, promessas de IA e de áudio e compatibilidade em aparelhos reais antes de anunciar o curso completo.

Decisões do proprietário: política do teste sem cartão; elegibilidade e famílias; fornecedores, limites de custo e credenciais; quais conteúdos proteger; retenção e direitos sobre dados; canal/número e equipe de atendimento; termos comerciais; autorização separada para infraestrutura, sandbox e publicação. Nenhuma dessas operações externas foi executada.
