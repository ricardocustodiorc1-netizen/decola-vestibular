# Relatório — preparação do lançamento comercial

Data: 02/11/2026. Branch exclusiva: `dev/navegacao-leo-familias-20261031`. Base técnica: `d1130af`. Esta entrega não publica o produto e não o torna apto a cobrar.

## Entregue

- Auditoria de cadastro, login, perfis familiares, área de estudos, progresso e ausência de backend comercial.
- Prévia explícita dos sete dias e R$ 39,90/mês: início, último dia, expiração e reinício de cenários fictícios. Não ativa acesso, conta ou cobrança; botão de contratação real desabilitado.
- “Ajuda e suporte” na home e no menu da área de estudos, com FAQ e preparação/cópia de rascunho para dúvida, problema, reclamação ou sugestão. Não envia, não persiste e não emite protocolo. Edição invalida o rascunho anterior.
- Painel adaptável, cabeçalho de fechamento fixo durante rolagem, rótulos de formulário, navegação por teclado e retorno do foco ao botão/menu de origem.
- Arquitetura de identidade, trial, assinatura e autorização, mais plano de atendimento persistente com WhatsApp/Manychat/OpenAI e encaminhamento humano. Nenhum serviço conectado.

Arquivos de execução: `commercial-preview.js`, `commercial-preview.css`, `app.js`, `index.html`, `navigation.js`, `scripts/build-preview.py`, `demonstracao.html`. Testes novos: `tests/commercial-preview.test.mjs`. Documentação: este relatório, `LANCAMENTO-COMERCIAL-ARQUITETURA.md` e `SUPORTE-WHATSAPP-MANYCHAT-PLANO.md`.

## Validação executada

| Verificação | Resultado |
|---|---|
| Baseline antes de mudanças | 80 testes aprovados |
| Regressão completa final — `npm test` | 90 aprovados, zero falhas ou ignorados |
| Dez testes comerciais novos | Plano em centavos, não ativação automática, data futura, fronteira exata de sete dias, UTC, datas inválidas, tipos de suporte, validação, texto literal e ausência de rede/armazenamento no modelo |
| Build da demonstração duas vezes | Mesmo SHA-256: `8226c8dc662587260317b19bf2ef283370fadc90a4357330453561f35e985425` |
| Sintaxe e whitespace | `node --check` dos módulos comerciais/navegação e `git diff --check` aprovados |
| Navegador desktop | Abriu por teclado; início/último dia/fim do teste; formulário vazio rejeitado; reclamação e sugestão fictícias; cópia real no clipboard; alteração remove saída antiga |
| Navegador em larguras 360, 390, 768 e desktop | Painel sem transbordamento horizontal; fechamento acessível, botão medido com 49 px de altura |
| Área de estudos desktop e largura 390 | Resposta errada de Porcentagem e primeira tentativa preservadas ao abrir/fechar suporte; segunda tentativa continua disponível; Escape fecha só suporte; foco retorna ao botão desktop/menu mobile |
| Integridade pedagógica | Sem diferenças desde a base nos arquivos de Leo, memória, conteúdo de Porcentagem, progresso e MP3/piloto Elvis |
| Site público | `index.html`, `app.js`, `professor-leo.js` e `study-area.js` obtidos por HTTPS iguais byte a byte à `origin/main`; main permanece `73c5db2aeb591afc52f31ed3227101d271103d42` |

Teste mobile foi de layout em navegador remoto, não em aparelho Android/iOS físico. A fixture de revisão usa IA controlada, não resposta comercial real. Não houve novo teste de API paga/real, envio de WhatsApp, criação de tickets, login ou pagamento — esses serviços não foram implementados/conectados. A suíte cobre regressão automatizada existente; não constitui auditoria integral de segurança nem validação de todas as combinações de aparelhos.

## Como validar localmente

1. Fazer checkout da branch autorizada, atualizar e executar `npm test`.
2. Rodar `npm run dev` e abrir `http://127.0.0.1:8000/`.
3. Usar “7 dias grátis · prévia”; alternar cenários, confirmar avisos de simulação e contratação desabilitada. Explorar a área de estudos pela demonstração.
4. Na home, abrir “Ajuda e suporte”. Usar só texto fictício, escolher reclamação/sugestão, preparar e copiar. Editar e observar invalidação. Fechar e reabrir: rascunho não persiste.
5. Na área do aluno, responder errado a uma questão, abrir suporte pelo menu, fechar com botão/Escape e conferir resposta e tentativa. Em largura estreita, abrir “Menu de estudos”. Confirmar retorno do foco e acesso à segunda tentativa.
6. Exercitar Leo, Desafio da Memória e simulados sem limpar armazenamento existente. `demonstracao.html` também foi atualizado; para IA real, a origem precisa continuar permitida pelo Worker. Nenhuma permissão foi alterada.

A cópia usa API de clipboard em contexto permitido; se indisponível, o painel seleciona texto e orienta copiar manualmente. Navegador sem suporte a dialog recebe aviso claro, sem ativar operação comercial.

## Pendências e prioridades

Primeiro aprovar política comercial e proteção de conteúdo; depois identidade/vínculos e trial de servidor em ambiente isolado. Na sequência, atendimento com banco e equipe; então integração de pagamento exclusivamente em sandbox e homologação. Publicação e qualquer conexão/configuração externa dependem de aprovação separada.

Ainda faltam login/recuperação reais, sincronização protegida de progresso, direitos de acesso, gestão/cancelamento de assinatura, checkout e webhooks, protocolo persistente, número/canal de atendimento, equipe/SLA, políticas e validação em aparelhos reais. As decisões e critérios de aceite estão na arquitetura; o plano de suporte detalha deduplicação, persistência antes de protocolo, limites e encaminhamento humano.

Não houve alteração na main, merge, deploy, Worker, permissões, cobranças ou credenciais. Os cenários comerciais não modificam dados de progresso nem prometem pagamento ou atendimento realizados.
