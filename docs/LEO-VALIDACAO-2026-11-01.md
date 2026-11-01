# Validação após ajuste CORS — 01/11/2026

Branch: `dev/navegacao-leo-familias-20261031`.
Versão do Worker informada pelo usuário: `6b7e89ca` (não verificada pelo painel).
Nenhuma alteração ao Worker, main, cobrança ou publicação foi realizada nesta validação.

## Resultados

- 22 testes automatizados passaram (`npm test`): contexto, regras pedagógicas, histórico, cancelamento, falhas de API/rede/configuração, fallback sem IA e plano.
- Servidor Python respondeu HTTP 200 em http://127.0.0.1:8000 com o conteúdo Decola. Processo encerrado após a verificação local.
- OPTIONS para essa origem retornou 204 com Access-Control-Allow-Origin exato.
- POST real usando o cliente de produção leo-client.js, via adaptador HTTP curl com Origin explícito: três respostas reais recebidas. Não foi usado mock nessas chamadas. Isso valida serviço/contrato, não equivale a um teste de navegador.
- Primeiro erro: dica com conversão 20/100 e pergunta orientadora, sem resultado final 30.
- Complemento: explicou por que dividir por 100, mantendo histórico e sem entregar resultado final.
- Acerto: resolução passo a passo com 150 × 0,20 = 30.
- POST com corpo vazio retornou 400 nas origens autorizadas (127.0.0.1:8000 e GitHub Pages), confirmando passagem pelo controle de origem antes da validação do corpo.
- POST com origens http://127.0.0.1:8001, http://localhost:8000, https://example.org, null e * retornou 403 Origem não permitida.

## Limitações e ajuste recomendado

O navegador remoto abriu http://127.0.0.1:8000 mas recebeu “Missing or invalid bearer token.” em vez do site. O loopback desse navegador não corresponde ao servidor deste executor. Não houve tentativa de contornar autenticação ou reescrever a origem. Portanto os cliques, fechamento, preservação de scroll e experiência móvel não foram revalidados de ponta a ponta com IA real nesta rodada.

Worker ainda responde Access-Control-Allow-Origin: null para origens rejeitadas, inclusive OPTIONS 204. O POST foi efetivamente bloqueado, mas recomenda-se rejeitar origens não autorizadas também no preflight e omitir ACAO nesses casos. Incluir Vary: Origin quando a resposta variar por origem. Mudança externa depende de autorização específica e inspeção do código vigente; não foi aplicada.

Os testes de falha são controlados no cliente e não provocam indisponibilidade de produção. O fallback é identificado como sem IA e não usa rede nem altera tentativas.

## Como concluir o teste visual no computador do usuário

1. Obter a branch indicada e executar `python -m http.server 8000 --bind 127.0.0.1` dentro da pasta do projeto.
2. Abrir http://127.0.0.1:8000/demonstracao.html (não file:// e não localhost).
3. Na aula Matemática / Porcentagem, responder 20 à questão 20% de 150. Abrir Professor Leo, me explica; verificar dica sem 30. Perguntar por que dividir por 100.
4. Fechar, usar a segunda tentativa e responder 30. Abrir Leo; verificar resolução completa. Conferir tentativas/progresso/posição ao fechar.
5. Para falha controlada: após carregar a página, usar DevTools > Network > Offline e solicitar uma nova explicação. Conferir mensagem de erro e Ver dica local (sem IA) ou Ver resolução local (sem IA), conforme tentativa. Restaurar Online.
6. Repetir com visualização responsiva de 390 px. O teste automatizado pode ser repetido com npm test.

Evidências completas e respostas reais: leo-validacao-cors-2026-11-01.json.
