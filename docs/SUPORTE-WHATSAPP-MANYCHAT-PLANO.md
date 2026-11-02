# Plano de atendimento — WhatsApp, Manychat e OpenAI

Proposta técnica, sem conexão ou contratação. Não há canal, automação, ticket real ou credencial configurado nesta entrega. O painel atual é uma preparação de rascunho local e nunca confirma envio.

## Fluxo proposto

WhatsApp recebe mensagem; Manychat identifica intenção; um novo backend autorizado valida a origem, deduplica o evento e grava ticket e mensagem. Somente depois devolve protocolo. Uma fila poderá solicitar à OpenAI triagem e resposta baseada em FAQ aprovada. Reclamações e casos sensíveis seguem para pessoa responsável. Esse backend é separado do Worker pedagógico existente.

Separar ajuda acadêmica (encaminhar ao Professor Leo na aula) de acesso, assinatura, problemas técnicos, reclamações e sugestões. Não transportar automaticamente histórico de estudo ou de IA para o atendimento.

## Registro e confiabilidade

Ticket: UUID interno, identificador público opaco, criação e atualização pelo servidor, tipo, assunto, canal, conta opcional, contato restrito, responsável, estado e versão do aviso de privacidade. Mensagens: texto mínimo necessário, identificador do evento de origem, horário, direção e estado de entrega. Eventos de auditoria separados de conteúdo sensível.

Estados sugeridos: novo, triado, aguardando aluno, aguardando equipe, resolvido e encerrado. Reclamação não pode ser encerrada apenas porque a IA respondeu; sugestões entram em fila humana de avaliação. Não inventar prazo, reembolso ou ação concluída.

Persistir identificador único do evento antes de chamar IA. Retentativa deve devolver o mesmo protocolo e não criar mensagens nem consumo duplicados. Banco indisponível: informar que o registro não foi concluído; nunca exibir protocolo fictício. Repetição de webhook, concorrência e eventos fora de ordem precisam de teste.

Autenticar webhooks segundo as capacidades efetivamente verificadas dos fornecedores: assinatura, timestamp e proteção contra repetição quando suportados. Não presumir que Manychat oferece um mecanismo específico. Caso não ofereça assinatura verificável, aprovar gateway autenticado e proteções equivalentes antes da conexão. Restringir acesso, aplicar limites e não confiar em campos vindos do usuário para autorizar operações.

## Automação e atendimento humano

Campos propostos no Manychat, ainda não criados: `support.kind`, `support.topic`, `support.ticket_id`, `support.state`, `support.handoff` e consentimento/opt-out. Ao assumir atendimento humano, interromper respostas automáticas para evitar disputa entre bot e equipe. Aprovar horários e capacidade antes de prometer SLA; não anunciar atendimento 24 horas.

A IA sugere classificação e resposta; não altera assinatura, concede acesso, cancela cobrança ou confirma reembolso. Usar FAQ versionada, limitar entrada (inicialmente 1.200 caracteres), retirar dados desnecessários, estabelecer orçamento e limites de fila/retentativas. Falha da IA mantém FAQ e encaminhamento humano; não fabricar resposta da IA nem confirmação de registro.

Telefone recebido pelo WhatsApp não substitui autenticação da conta. Operações de conta/pagamento exigem verificação independente. Não pedir senha, cartão ou documentos no chat. Definir retenção, exclusão, exportação, acesso da equipe e revisão dos contratos antes de enviar dados a terceiros. Logs não devem conter tokens ou histórico completo indiscriminadamente.

## Regras do canal a verificar na implantação

A documentação oficial consultada informa janela de mensagens do WhatsApp de 24 horas após interação do usuário; mensagens automatizadas fora dela dependem de templates apropriados. Não confundir essa janela com os sete dias do teste do produto. Verificar regras atuais, consentimento, templates, preços e limites da conta antes de ativar. Não assumir gratuidade ou disponibilidade de recursos de um plano específico.

Fonte primária consultada em 02/11/2026: [Manychat — Understanding messaging windows](https://help.manychat.com/en/articles/17742014-understanding-messaging-windows). Recomendações de revisão humana e limites: [OpenAI — Safety best practices](https://developers.openai.com/api/docs/guides/safety-best-practices). O plano de autorização e armazenamento acima é proposta do Decola, não configuração existente desses fornecedores.

## Testes e autorizações necessários

Antes de conectar: aprovar número, conta e permissões, provedores, limites financeiros, retenção, equipe humana e canal de contingência. Começar com ambiente e contatos de teste autorizados.

Testar webhook inválido/repetido, indisponibilidade do banco, protocolo após persistência, bloqueio entre contas, dados removidos, quota/429 sem repetição paga ilimitada, janela de 24 horas/template, opt-out, encaminhamento humano e tentativa de induzir a IA a conceder acesso. Produção exige aprovação separada. Nada foi conectado nesta etapa.
