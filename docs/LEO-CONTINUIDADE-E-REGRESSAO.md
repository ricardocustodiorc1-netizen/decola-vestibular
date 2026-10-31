# Leo: continuidade da aula e regressão — 31/10/2026

Branch: `dev/navegacao-leo-familias-20261031`.
Base remota: `7363784856839775cc8d130612cd20413408b9a2`.
Sem alterações de Worker/infraestrutura, chaves, main, cobrança, merge ou publicação.

## Integração real: estado e limite

O diagnóstico anterior continua válido: o Worker recusa a origem de arquivo local
com 403 (“Origem não permitida”). Esse bloqueio não pode ser removido pelo frontend.
Nesta revisão, repetimos uma solicitação HTTP real com o contexto da questão da
camiseta de R$ 80, primeiro erro, escolha R$ 70, uma tentativa restante. Com a origem
já autorizada do site no cabeçalho do cliente HTTP, o Worker retornou **200** e dicas:
calcular 10% do total e pensar em como subtrair o desconto. Não entregou o preço final.

Registro: `leo-revalidacao-continuidade.json`. Sem mocks nesse teste. A chamada usou o
mesmo formato de contexto produzido pelo cliente da aplicação. Não é um teste ponta
a ponta do novo painel no navegador. Os testes HTTP anteriores de complementar e
resolução após acerto estão em `leo-api-evidencias-2026-10-31.json` e foram preservados.
Nenhuma chave foi lida ou exibida e nenhum serviço foi provisionado.

Para testar o painel real no navegador sem publicar o site, ainda é necessário
**autorizar uma origem de desenvolvimento no Worker**, conforme a proposta já
registrada em `LEO-API-DIAGNOSTICO-2026-10-31.md`. Não há essa autorização nesta tarefa.
A sugestão é permitir apenas `http://127.0.0.1:8000` para testes no notebook do usuário,
sem liberar `null`, `*` ou origens arbitrárias e mantendo as proteções existentes.
O patch exato exige revisar o código atual do Worker. Não tentamos contornar CORS.

## Implementado agora

Nas três questões do piloto de Porcentagem, se a IA falhar, a mensagem mantém a causa
identificada e indica uma orientação disponível na própria questão:

- **“Ver dica local (sem IA)”** após o primeiro erro: reutiliza a dica da aula, acrescenta
  uma pergunta orientadora e não inclui gabarito nem resolução final.
- **“Ver resolução local (sem IA)”** após acerto ou duas tentativas: apresenta a resposta
  de referência e o raciocínio já disponível no conteúdo da aula.

A orientação local só aparece após falha da solicitação e só é expandida por iniciativa
do aluno. Não é inserida no histórico de mensagens da IA e não faz chamadas de rede.
O rótulo e o texto explicam que se trata de conteúdo da aula, não de IA gerada.

Não altera a contagem de tentativas, as respostas ou o progresso. Rascunho da pergunta,
conversa e orientação aberta ficam preservados ao fechar/reabrir no mesmo contexto.
Ao responder novamente, o contexto e a orientação são atualizados para a nova tentativa.
As mesmas limitações de memória da conversa continuam válidas: F5 ou reconstruir a
página da aula não persiste o chat; o progresso da atividade continua nas chaves existentes.

O contrato e o endpoint do cliente real não foram alterados nesta revisão. O arquivo
`professor-leo.js` foi comparado com a base remota e está idêntico. Navegação, exercícios,
simulados e plano não foram removidos ou substituídos.

## Testes executados

`npm test`: **22 testes passaram**. Os três novos testes verificam que a dica local do
primeiro erro não contém resolução/gabarito, não faz rede, não muda a tentativa; que a
resolução é liberada no momento correto; e que pedir orientação local não muda o prompt
ou o contexto destinados à IA. Inclui todos os 19 testes anteriores de contrato,
contexto, erros, cancelamento, histórico e plano. Sintaxe JS/scripts embutidos válida;
`git diff --check` sem erros.

Testes de interface no navegador remoto, com rede simulada em fixture explicitamente
identificada como TESTE (nenhuma resposta de fixture foi chamada de IA real):

| Fluxo | Resultado |
| --- | --- |
| Primeiro erro → falha 403 → dica local | Dica sem resposta final, rótulo “sem IA” visível |
| Abrir dica local | Nenhuma nova requisição |
| Fechar/reabrir explicação | Rascunho e tentativa preservados |
| Segunda tentativa → acerto → falha → resolução local | Referência correta exibida somente após o acerto |
| Falha de conexão | Mensagem amigável e orientação local disponível |
| Posição de leitura, abrir/fechar | 1070 px antes e 1070 px depois |
| Aulas de Matemática | Porcentagem, Frações, Equações, Geometria e Estatística abrem e retornam |
| Linguagens | Aula de interpretação abre |
| Professor Leo original | Envia e recebe resposta controlada na fixture, sem mudar integração ou histórico |
| Exercícios | Treinos de Matemática, Português e Humanas abrem e retornam |
| Simulado | Primeira resposta aceita e avanço para a questão 2 de 10 |
| Responsividade da orientação | Janelas de 360, 390 e 1280 px sem transbordamento horizontal nos estados observados |

A regressão de interface é de fluxos selecionados, não uma auditoria exaustiva de todas
as questões. Não houve teste em celular físico, teclado virtual ou Safari. Não foi
executada a suite antiga de navegador local; usamos a automação remota suportada.
A regra de dicas da IA continua expressa no contexto e foi observada na resposta real
testada; não afirmamos garantia absoluta de comportamento de qualquer resposta futura.

## Demonstração e próximo passo

`demonstracao.html` foi regenerado. Baixe, abra e siga:
Área de estudos → Aulas → Matemática → Porcentagem → responder → Professor Leo, me explica.
Se o Worker recusar o arquivo local, o painel mostra a causa e permite usar o conteúdo
local. **Essa nova demonstração não libera IA real para origens recusadas.**

Para reproduzir a interface sem API: `npm run dev`, depois
`http://127.0.0.1:8000/tests/leo-inline-review.html`; escolha “Origem bloqueada” ou
“Falha de conexão”. A fixture usa armazenamento fictício em memória e não consome IA.
A captura `leo-dica-local.jpg` mostra a orientação local nessa fixture em largura móvel.

A próxima ação externa depende de autorização: revisar o Worker e permitir uma origem
de desenvolvimento específica, depois validar os três modos reais e complementares
dentro do painel. Não é necessário trocar credenciais para corrigir a recusa de origem.
