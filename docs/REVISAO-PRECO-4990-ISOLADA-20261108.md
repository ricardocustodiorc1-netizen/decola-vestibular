# Revisão isolada do preço — 08/11/2026

**Status:** prévia comercial alinhada a R$ 49,90/mês. Não publicada; sem cobrança real.

## Escopo aplicado

- `index.html`: rodapé comercial passou de R$ 39,90 para R$ 49,90.
- `commercial-preview.js`: `priceCents` passou de 3990 para 4990 e os textos comerciais foram sincronizados.
- Sete dias gratuitos, ausência de cartão e conversão automática, simulação local e botão de assinatura desabilitado: preservados.
- Os documentos históricos foram mantidos sem alteração para rastreabilidade; suas projeções antigas **não são projeções vigentes**.

## Projeção financeira separada — cenário ilustrativo

Hipótese matemática: receita bruta R$ 49,90 por aluno pagante/mês. Taxa ilustrativa de cartão: 2,99% + R$ 0,49 por cobrança; tarifa calculada e arredondada por transação em R$ 1.98. **Não representa cotação vigente ou contrato com Asaas**. Não inclui tributos, estornos, inadimplência, IA, hospedagem, marketing, suporte ou demais custos.

| Alunos pagantes | Receita bruta mensal | Taxa ilustrativa total | Saldo após essa taxa |
|---:|---:|---:|---:|
| 10 | R$ 499.00 | R$ 19.80 | R$ 479.20 |
| 100 | R$ 4990.00 | R$ 198.00 | R$ 4792.00 |
| 500 | R$ 24950.00 | R$ 990.00 | R$ 23960.00 |
| 1000 | R$ 49900.00 | R$ 1980.00 | R$ 47920.00 |

## Pendências antes de publicação

1. Conferir referências de preço em outros arquivos, testes, pacotes externos HOME-V4 e Consolidado V2, que não foram incorporados nesta branch.
2. Validar testes automatizados e aparência no Edge e Chrome Android.
3. Confirmar tarifas atuais do provedor antes de usar projeções comerciais.
4. Não publicar, não integrar ao Asaas e não fazer merge sem aprovação explícita.

**Banco:** a restrição `decola.paid_periods_amount_cents_check` já foi migrada separadamente para 4990 e verificada. Este commit não modifica o banco.
