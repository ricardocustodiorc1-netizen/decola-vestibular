# Sprint 3 — pagamentos e orçamento estimado

Consulta pública em 02/11/2026. Sem login em fornecedores, uso de credenciais, cotação contratual ou contratação. Valores sujeitos a país, impostos, contrato e mudança. Usar somente para planejamento; confirmar condições antes de autorizar sandbox e produção.

## Comparação para mensalidade de R$ 39,90

| Provedor | Recorrência / integração | Referência de tarifa | Por mensalidade / saldo após tarifa |
|---|---|---|---|
| Asaas | Cartão recorrente mensal; checkout hospedado com `RECURRENT`; acompanhar cobranças e assinatura por webhooks | Padrão de cartão à vista: 2,99% + R$ 0,49; não usar promoção de três meses no orçamento | R$ 1,68 / R$ 38,22 |
| Stripe Payments + Billing | Checkout hospedado, assinatura e gestão; integração por SDK/webhooks | Cartão nacional 3,99% + R$ 0,39, mais Billing 0,7% do volume | R$ 2,26 / R$ 37,64 |
| Mercado Pago Assinaturas | Recorrência mensal, link/API, tentativas automáticas; validar fluxo sem conta no sandbox | Sem mensalidade fixa anunciada; tarifa depende da conta/meio/prazo. Não foi obtida cotação específica verificável de Assinaturas | Não determinado; sensibilidade de planejamento: 5% daria cerca de R$ 2,00, **não é oferta ou taxa confirmada** |

Cálculos arredondam cada transação a centavos: Asaas `39,90 × 0,0299 + 0,49`; Stripe `39,90 × (0,0399 + 0,007) + 0,39`. O arredondamento efetivo e a incidência por produto devem ser conferidos no extrato de teste/contrato. Não inclui antecipação, impostos, estornos/chargebacks, notificações, saque, extras ou inadimplência.

O Asaas anuncia Pix/boleto padrão de R$ 1,99 por recebimento e promoção inicial menor; notificações podem ser cobradas à parte. Não ativar automaticamente notificações ou produtos opcionais. Pix comum/boleto de cobrança recorrente não significam débito automático: geração mensal pode exigir ação do aluno em cada ciclo. Pix Automático é produto/mandato separado a homologar; o primeiro piloto de assinatura automática proposto é cartão, sem parcelar uma anualidade como se fosse mensalidade.

Stripe informa Pix por convite; não pressupor disponibilidade ou uso em assinatura. Mercado Pago cita vários meios, mas não assumir que todos debitam automaticamente em todas as modalidades. Falha de cartão requer política de recuperação e nova tentativa; assinatura criada não prova recebimento.

**Recomendação:** avaliar Asaas primeiro pelo custo estimado e checkout recorrente hospedado, sem coletar cartão no Decola. Manter um adaptador de provedor para eventual troca. Stripe é alternativa se o esforço de portal/gestão e a experiência de cancelamento justificarem a tarifa maior. Mercado Pago requer confirmar taxa específica e comportamento de cancelamento/reembolso antes de comparar economicamente. Não houve escolha contratual.

## Infraestrutura e comunicação

| Item | Referência / hipótese mensal | Observações |
|---|---|---|
| Supabase | Free no laboratório; Pro a partir de US$ 25 | Free tem limites e pausa por inatividade; planejar Pro para primeiro projeto comercial. Compute/excedentes podem aumentar |
| Backend BFF | Referência Render: US$ 7, 512 MB / 0,5 CPU | Orçamento para um serviço pequeno; não prova capacidade. Confirmar plano de workspace, tráfego e limites antes de contratar |
| SMTP | Resend Free: até 3.000/mês e 100/dia | Domínio/verificação e credenciais exigem aprovação; limite diário pode impedir onboarding em lote |
| Manychat | Referência nova tabela Pro: US$ 39 mensal, até 2.500 contatos ativos; anual anunciado US$ 29/mês com pagamento anual | WhatsApp no Pro; país/impostos e contrato legado podem diferir. Usuário já tem conta, mas não consultamos seu plano ou saldo. Não somar custo integral sem verificar incremental |
| WhatsApp/Meta | Depende de mensagens/templates/categoria/destino e condições do canal | Não confirmado na conta; reservar verba e validar tabela efetiva antes de outbound. Não afirmar que Manychat inclui todas as tarifas |
| OpenAI para suporte e tutor | Consumo variável; cenário abaixo usa **tetos hipotéticos de US$ 1 entrada / US$ 4 saída por milhão de tokens** | Não é preço de modelo contratado ou recomendação de modelo específico; selecionar modelo ativo após avaliação e aprovação |

A página atual de GPT-5 mini e a de GPT-4.1 mini exibem indicação de depreciação. Por isso, não baseamos uma integração nova nesses modelos apenas por seus preços antigos; o orçamento é paramétrico e deve ser recalculado com modelo ativo e teste de qualidade. Nenhum modelo do Worker existente foi trocado.

## Cenários reprodutíveis: 100, 500 e 1.000 pagantes

Hipóteses do orçamento (não previsão de faturamento):

- Todos pagam uma única mensalidade aprovada de R$ 39,90 no cartão Asaas, com taxa por operação arredondada para R$ 1,68. Não há trialists, atrasos ou estornos nessa receita.
- Câmbio de planejamento **R$ 6,00/US$**, não cotação financeira consultada. Supabase 25 + BFF 7 + Manychat 39 = US$ 71, ou R$ 426/mês.
- Reserva arbitrária adicional de R$ 50/mês para e-mail/contingência: fixo estimado R$ 476. Não representa capacidade contratada, domínio ou limite máximo de consumo.
- Por aluno/mês, tutor: 100 chamadas, cada uma com total médio de 1.500 tokens de entrada (já incluindo contexto) e 400 de saída. Suporte: 20 chamadas com 2.000 de entrada e 300 de saída. Sem ferramentas, áudio gerado, cache ou desconto.
- Consumo por aluno: 190.000 tokens de entrada e 46.000 de saída; aos tetos hipotéticos acima, US$ 0,374 ou R$ 2,244. O tutor existente pode custar diferente: não acessamos conta/modelo/fatura para medir. Isso é uma provisão para o produto completo, não medição do Worker.

| Pagantes | Receita bruta | Taxas Asaas | Provisão IA | Fixo estimado | Subtotal de custos considerados |
|---:|---:|---:|---:|---:|---:|
| 100 | R$ 3.990,00 | R$ 168,00 | R$ 224,40 | R$ 476,00 | R$ 868,40 |
| 500 | R$ 19.950,00 | R$ 840,00 | R$ 1.122,00 | R$ 476,00 | R$ 2.438,00 |
| 1.000 | R$ 39.900,00 | R$ 1.680,00 | R$ 2.244,00 | R$ 476,00 | R$ 4.400,00 |

Fórmula: `custos = 476 + N × 1,68 + N × 6 × (190000 × 1/1000000 + 46000 × 4/1000000)`.

Com Stripe, substituir R$ 1,68 por aproximadamente R$ 2,26: diferença de R$ 58 / R$ 290 / R$ 580 por mês nesses volumes. Não há comparação fechada de Mercado Pago sem cotação de Assinaturas.

**Não são custos totais nem lucro líquido.** Excluem alunos gratuitos e leads (que também consomem IA/Manychat), mensagens Meta/templates, salários de suporte, marketing, tributos, câmbio/IOF, domínio, contabilidade, armazenamento/transferência/backup adicionais, estornos, desenvolvimento e ampliação de capacidade. Exemplo: para `T` alunos em trial com mesmo ritmo diário, adicionar aproximadamente `T × 7/30 × 2,244` reais de IA; leads também contam conforme regras do plano de contatos. Não prometer que 1.000 alunos cabem no compute mínimo sem carga real.

Para controle: quota diária e mensal por aluno, teto por resposta, orçamento global aplicado no backend, alerta em 50/80/100%, interrupção de IA opcional ao atingir teto com fallback local/fila humana. Painel de fornecedor nem sempre é limite rígido; não depender apenas dele. Recalcular após 20–30 usuários de teste, medindo tokens, latência, falhas e contatos ativos. Não gerar áudio pago para atendimento nesta etapa.

## Fontes oficiais

- [Asaas preços](https://www.asaas.com/precos-e-taxas) — separar taxas de Tap das de cobrança online e promoção do padrão.
- [Asaas custos de assinatura](https://central.ajuda.asaas.com/hc/pt-br/articles/31997100041371-Quais-s%C3%A3o-as-taxas-para-criar-cobran%C3%A7as-por-assinatura-recorrentes).
- [Asaas checkout recorrente](https://docs.asaas.com/docs/checkout-with-subscription-recurring).
- [Stripe Brasil](https://stripe.com/br/pricing).
- [Mercado Pago Assinaturas](https://www.mercadopago.com.br/developers/pt/docs/subscriptions/overview) e [informação de tarifa variável](https://www.mercadopago.com.br/blog/criar-plano-assinatura-mercado-pago).
- [Supabase preços](https://supabase.com/pricing), [Firebase preços](https://firebase.google.com/pricing), [Render preços](https://render.com/pricing), [Render compute](https://render.com/docs/compute-plans), [Resend](https://resend.com/pricing).
- [Manychat preços](https://manychat.com/pricing), [Pro mensal versus anual](https://help.manychat.com/hc/en-us/articles/25800228332572-Pro-plan).
- [OpenAI catálogo/preços](https://developers.openai.com/api/docs/pricing), [GPT-5 mini](https://developers.openai.com/api/docs/models/gpt-5-mini), [GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini). Orçamento de IA acima é hipótese própria, não tarifa desses modelos.
