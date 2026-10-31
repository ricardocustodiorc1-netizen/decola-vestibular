# Diagnóstico e correção dos erros do Leo — 31/10/2026

Branch exclusiva: `dev/navegacao-leo-familias-20261031`.
Base: `fbff4c489fa9d4f0c04c4da05717eab5d1a4b39e`.
Nenhum ajuste no Cloudflare/Worker, chave, origem autorizada, cobrança ou site publicado.

## Causa reproduzida

O Worker existente recusa POST com `Origin: null`, a origem usada por arquivos locais:
HTTP **403**, JSON `{"error":"Origem não permitida"}`. O frontend anterior descartava
esse motivo e mostrava uma mensagem genérica. Isso reproduz o cenário relatado do
`demonstracao.html` aberto localmente e explica por que abrir a conversa funcionava,
mas obter uma explicação falhava.

A verificação OPTIONS sozinha não basta: para origem null retornou 204 com cabeçalho
`Access-Control-Allow-Origin: null`, mas o POST real foi recusado com 403.

| Requisição real de diagnóstico | Resultado |
| --- | --- |
| OPTIONS, origem null | 204; não comprova autorização do POST |
| POST curto, origem null | 403, Origem não permitida |
| POST com contexto de 747 caracteres, origem null | Mesmo 403 |
| OPTIONS, origem do site GitHub Pages | 204, ACAO corresponde à origem |
| POST com o mesmo contexto de 747 caracteres e origem do site | 200, explicação recebida |
| POST curto com origem do site | 200, explicação recebida |

O limite de 700 caracteres do textarea antigo não é a causa deste erro: o Worker
aceitou o contexto de 747 caracteres quando a origem foi a do site. Não truncamos
enunciado, alternativas, regras pedagógicas ou perguntas para tentar corrigir CORS.
O endpoint respondeu normalmente nos testes autorizados; não há evidência, nesses
casos, de indisponibilidade, ausência de chave ou falha de autenticação.

A implementação interna e a configuração completa do Worker não estão no repositório.
O diagnóstico foi baseado nas respostas reais observáveis, não em acesso ao painel
Cloudflare ou às credenciais.

## O que mudou na branch

- `LeoError` com códigos para origem recusada, autorização, configuração, endpoint,
  limite de solicitações, indisponibilidade, tempo esgotado, conexão/offline e resposta
  inesperada/vazia. Esses códigos também ficam disponíveis no status do painel para QA.
- Mensagens claras e distintas no painel da questão e no chat original. Um corpo de
  erro HTTP 500 que não seja JSON continua sendo falha de serviço. Um HTTP 200 com
  campo de erro não é apresentado como explicação da IA.
- Não exibimos o corpo bruto do backend ao aluno: ele pode conter detalhes internos.
- Falha `fetch` online admite internet/rede OU bloqueio de CORS; o navegador não dá
  informação suficiente para afirmar uma dessas causas. Só apontamos origem recusada
  com precisão quando recebemos o 403 e a mensagem explícita do Worker.
- Arquivo `file://` mostra um aviso de ambiente na explicação, sem bloquear a aula.
  Ele informa que apenas iniciar um servidor local não concede autorização ao Worker.
- Tempo limite sinalizado separadamente de cancelamento manual. Fechar/sair continua
  abortando o pedido e preservando a atividade.
- Endpoint padrão, formato das mensagens, aliases, histórico, modos pedagógicos,
  feedback, tentativas, botão do piloto e navegação foram mantidos. Não há nova chave.
- Cliente aceita uma configuração opcional de endpoint HTTPS para futura homologação
  aprovada. Não foi alterado o endpoint em uso, e URLs inválidas/com credenciais são
  recusadas antes de enviar.
- Demonstração regenerada e versões dos assets atualizadas. Fixture ampliada com
  cenários claramente rotulados como teste: origem recusada, configuração e conexão.

Esta correção melhora o tratamento da integração; **não muda a política de origens
no servidor**. A cópia local continua incapaz de obter IA enquanto essa origem for
recusada. Não foi criado proxy para contornar a proteção, nem liberado `*` ou `null`.

## A IA respondeu de verdade?

**Sim, pelo serviço real existente em testes HTTP sem mock**, usando o mesmo cliente
`DecolaLeoClient` e a origem já autorizada do site no cabeçalho Origin do cliente HTTP.
Não alteramos credenciais ou configuração para esses testes.

Foram verificados três fluxos com a questão fictícia “Quanto é 20% de 150?”:

1. Erro na primeira tentativa: retornou explicação do conceito e pergunta orientadora,
   sem revelar 30 como resultado final.
2. Complementar “Por que dividir por 100?”: enviou histórico anterior e recebeu uma
   explicação contextual, novamente sem revelar o resultado final.
3. Acerto: retornou a resolução com 20 ÷ 100 = 0,20 e 0,20 × 150 = 30.

As respostas completas e os resultados do diagnóstico estão em
`leo-api-evidencias-2026-10-31.json`. São resultados reais do Worker, sem respostas de
fixture. Isso confirma os casos observados, não garante toda futura resposta/modelo.

**Não foi concluído um teste ponta a ponta do novo painel no navegador com IA real.**
A origem da prévia não está autorizada, e abrir `file://` é bloqueado pela política do
navegador remoto usado nesta sessão. Não tentamos contornar essa restrição.

Também tentamos o chat da versão pública inalterada. O painel de estudos ficou vazio;
ao acionar o Leo, o cabeçalho mudou, mas o campo de conversa não ficou visível.
Esse comportamento corresponde aos problemas de navegação da main cuja correção já
está na branch de desenvolvimento. Não foi corrigido diretamente no site público.

## Testes e limites

`npm test`: **19 testes passaram**. Inclui os testes anteriores do plano, contexto e
histórico, mais a separação das causas, erro HTTP não JSON, offline/rede, endpoint
inválido, ausência de configuração, não exposição de erro interno, timeout e HTTP 200
com erro. Checagens de sintaxe e `git diff --check` sem erros.

Na interface isolada sem acesso à rede externa, foram conferidos os textos/códigos de
origem 403, configuração ausente, conexão e serviço 503. Após falhas, o aluno fechou o
painel, usou a segunda tentativa e acertou: progresso preservado em 1/3. Complementar
enviou duas mensagens anteriores de histórico; chat original e simulado abriram.
Escape fechou apenas a explicação. Sem transbordamento horizontal nos estados testados
em janelas de 360, 390 e 1280 px. Não houve teste em celular físico, Safari ou teclado
virtual. A suite antiga de navegador local não foi executada.

As respostas das fixtures continuam explicitamente marcadas como TESTE e NÃO IA. Elas
não são a evidência de resposta real descrita acima.

## Próximo passo que exige autorização

Proposta concreta, ainda **não executada**: revisar o código atual do Worker e adicionar
somente `http://127.0.0.1:8000` como origem de desenvolvimento autorizada, preservando
`https://ricardocustodiorc1-netizen.github.io`. Essa origem corresponde a `npm run dev`
no notebook e permite testar sem publicar o site. Confirmar autorização tanto em
OPTIONS quanto em POST, com ACAO compatível e `Vary: Origin` quando aplicável.

Não liberar `null`, `*`, origens arbitrárias ou reduzir autenticação/limites existentes.
O patch exato depende de ler o código atual do Worker; não presumimos sua estrutura.
Alternativamente, aprovar uma origem HTTPS específica de homologação, com os mesmos
limites e acesso controlado. Qualquer configuração externa continua pendente de
aprovação, assim como merge/publicação. Não é necessário trocar a chave para corrigir
este bloqueio de origem.

## Como testar a entrega agora

- Baixe `demonstracao.html` e percorra a aula. O painel mantém os dados e agora explica
  a recusa do serviço. **Não espere IA real em um arquivo local ainda bloqueado.**
- Para testar UI sem rede: `npm run dev` e abra
  `http://127.0.0.1:8000/tests/leo-inline-review.html`; use os botões de falha simulada.
- Rodar a aplicação normal no mesmo localhost também não libera o Worker por si só.
  Depois de autorizar essa origem no servidor, testar
  `http://127.0.0.1:8000/` → Porcentagem → responder → Professor Leo, me explica.
- O relatório antigo do piloto é histórico; a validação HTTP real registrada aqui
  substitui a limitação anterior de não ter feito chamadas reais à API.

Registro visual: `leo-diagnostico-origem.jpg` mostra a mensagem de origem recusada
na fixture controlada em largura de 390 px; não é uma resposta real de IA.
