# Auditoria de regressão — Professor Leo 2.0

Data: 01/11/2026. Branch exclusiva: `dev/navegacao-leo-familias-20261031`.
Base: `762c7fea6f0dc23ea957fdd8536e17bfdde54b42`. Main antes da auditoria: `73c5db2aeb591afc52f31ed3227101d271103d42`.

## Falha confirmada e corrigida

A pergunta complementar aceitava 700 caracteres, mas o prompt inclui também regras e contexto. Na questão 1, isso gerou 1.395 caracteres. Uma requisição real ao Worker, Origin http://127.0.0.1:8000, retornou HTTP 400: “Envie uma pergunta de até 1000 caracteres.”

O campo agora reserva espaço para o contexto e as instruções integrais, informa o limite específico e impede envio excessivo sem cortar texto silenciosamente. O cliente compartilhado recusa localmente mensagens acima de 1.000 caracteres. Nenhuma permissão, modelo, chave ou configuração do Worker mudou. Os limites das três questões foram cobertos em modos dica, acerto e tentativas esgotadas. Na questão 1, dica: 305 caracteres; solução: 316. Questão 3, dica: 254; no navegador, uma dúvida de 254 gerou prompt de exatamente 1.000 caracteres, com contexto, regra NÃO revele e histórico preservados.

Também se impediu o cache da demonstração na ferramenta isolada de teste, para não revisar uma versão antiga após rebuild. A demonstração completa foi regenerada.

## Resultados atuais

| Cenário | Evidência | Resultado |
| --- | --- | --- |
| Primeiro erro | Teste automatizado, payload inspecionado no navegador e chamada real | Contexto sem campo gabarito/solução; IA deu dica e pergunta, sem resultado final |
| Acerto | Teste automatizado, interface e chamada real | Resolução 150 × 0,20 = 30, passo a passo |
| Duas tentativas erradas | Teste automatizado e navegador, camiseta: R$ 70 depois R$ 78 | Segunda tentativa preservada; depois libera solução R$ 72, attempts=2, remaining=0 |
| Complemento | Payload do navegador contém histórico com 2 mensagens; chamada real contextual | Regra de dica repetida e explicação sobre dividir por 100 |
| Falha de rede | Fixture explicitamente marcada sem IA e testes automatizados | Mensagem de conexão/CORS sem inventar causa; dica local disponível e sem consumir tentativa |
| HTTP 503 | Fixture controlada | Mensagem de serviço indisponível; resolução local após acerto, identificada sem IA |
| Fechar durante espera | Fixture pending, seguida de segunda tentativa | Cancelamento sem resposta tardia nem bloqueio das alternativas |
| Fechar e reabrir | Navegador | Conversa e rascunho mantidos na mesma questão; nenhuma nova chamada automática depois de uma resposta concluída |
| Persistência no reload | Página normal, localStorage real, sem mocks | Erro recuperado com segunda tentativa disponível; depois acerto e 1/3 concluída recuperados após novo reload |
| Chat original | Fixture: mensagem, resposta e botão Voltar à aula | Chat funciona; retorno preserva respostas e tentativas da aula |
| Layout | Iframe de 360 e 1280 px | scrollWidth=clientWidth, sem rolagem horizontal |
| Limite de mensagem | Novos testes automatizados e payload de 1.000 caracteres no navegador | Sem cortar contexto ou instruções; excesso recusado antes da rede |

`npm test`: **24 passaram / 0 falharam** (22 anteriores + 2 novos casos, um cobrindo 9 combinações).
`node --check leo-client.js`, `node --check leo-inline.js`, `npm run build:preview` e `git diff --check`: aprovados.

Os scripts antigos de Playwright não foram executados nesta sessão; as verificações visuais foram feitas pela automação de navegador disponível. Não houve teste em aparelho físico.

## IA real versus testes controlados

Chamadas reais usaram o código leo-client.js em Node com adaptador curl e Origin explícito já autorizado. HTTP 200: dica 7.149 ms, complemento 6.400 ms, resolução 6.684 ms. Respostas completas em `leo-auditoria-api-2026-11-01.json`. Não são mocks. A dica e o complemento não forneceram o resultado final; essa amostra não garante todas as respostas futuras de um modelo generativo.

A interface foi testada em http://terminal.local:4173 com fixture rotulada “TESTE ISOLADO — respostas controladas, sem IA”, armazenamento fictício em memória e fetch controlado, sem chamadas externas. O teste de reload foi separado na página normal, com armazenamento real do navegador e sem acionar a API. Não se afirma teste completo de IA real no navegador: a origem do preview não é a origem 127.0.0.1 autorizada. Não houve reescrita de origem nem alteração de CORS.

## Persistência: limites observados

As respostas são locais ao navegador/origem; não há sincronização entre dispositivos. A conversa inline e seu rascunho sobrevivem a fechar/reabrir o painel durante a mesma aula, mas não são gravados para sobreviver a um reload. Isso já é o comportamento atual e não foi alterado. A posição exata de leitura após reload e falhas de quota de armazenamento não foram revalidadas nesta auditoria. A recuperação normal das respostas após reload foi confirmada.

## Escopo preservado

Nenhum código de navegação, aula, simulado, credenciais ou Worker foi modificado. professor-leo.js não foi alterado. A única correção funcional é o limite de envio, compartilhado com o cliente original. Sem merge ou publicação. Fase de navegação descrita em `MEU-DECOLA-PLANO-NAVEGACAO.md`, aguardando aprovação, sem implementação.

## Reprodução local

Na branch indicada, executar `npm test`, `npm run build:preview` e `npm run dev`; abrir http://127.0.0.1:8000/demonstracao.html. Para regressão isolada sem IA real, abrir /tests/leo-inline-review.html. O seletor Resposta de teste nunca deve ser confundido com validação de IA real.
