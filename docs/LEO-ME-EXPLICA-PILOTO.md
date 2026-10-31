# Professor Leo, me explica! — piloto de Porcentagem

31/10/2026. Branch exclusiva: `dev/navegacao-leo-familias-20261031`.
Base: `2230ddc01bccf6863b06afc913610dfbe500c16f`.
Sem alteração da main, merge, deploy, credenciais, cobranças ou dados reais.

## Implementado

Nas três questões da Aula Inteligente de Porcentagem, após cada resposta, aparece
**🎓 Professor Leo, me explica!**, tanto no acerto quanto no erro. O feedback e as
regras de segunda tentativa existentes foram preservados.

O botão abre uma conversa na própria questão. Não troca de rota, não abre outra tela
e não modifica as respostas ou tentativas. Fechar ou pressionar Escape fecha somente
a explicação, devolve foco ao botão e restaura a posição de rolagem da aula. Pedidos
pendentes são cancelados ao fechar ou sair da aula. Respostas tardias não são inseridas
em outra questão/tela. Reabrir uma conversa já respondida não faz outra chamada.

O contexto inclui matéria, assunto, ID e enunciado da questão, todas as alternativas,
resposta selecionada, acerto/erro e número de tentativas. Ele é serializado dentro de
`message` e `mensagem`, para manter compatibilidade com o Worker atual. O aluno não
precisa copiar nada. Perguntas complementares incluem novamente as regras pedagógicas
e o contexto, além de até oito mensagens recentes da conversa daquela questão.

Cada questão/tentativa tem contexto próprio. Ao usar “Tentar novamente”, a conversa
anterior é descartada; após nova resposta, o contexto usa a nova escolha e o número
atualizado de tentativas. Conversas ficam em memória, não são adicionadas ao backup
ou localStorage; progresso continua salvo nas chaves existentes.

## Pedagogia e seus limites

- Erro na primeira tentativa: prompt pede dicas/perguntas sem revelar a alternativa
  ou o resultado final. Não envia gabarito nem resolução no contexto.
- Acerto ou duas tentativas esgotadas: contexto inclui a resposta e a resolução de
  referência, e pede explicação completa, passo a passo.
- Nenhum pedido novo ocorre ao carregar a aula ou apenas responder. O primeiro
  envio ocorre somente quando o aluno clica no botão do Leo. Complementares exigem
  o botão “Enviar pergunta”. Há espera mínima de 15 segundos entre pedidos da conversa.
- As explicações automáticas do feedback anterior continuam presentes, conforme o
  requisito de preservação. Elas não são novas respostas de IA.

A regra de não revelar o gabarito é uma instrução ao modelo, não uma garantia técnica.
A aceitação do novo contexto, a qualidade pedagógica e o cumprimento dessa instrução
pelo Worker/modelo reais ainda precisam ser validados em homologação. O backend não
está neste repositório e não foi alterado. Para uma política forte, ele deve aplicar
regras de contexto e limites de consumo no servidor, sem confiar apenas no navegador.

## Integração preservada

`leo-client.js` centraliza o mesmo POST ao endpoint já usado pelo Professor Leo 2.0.
Preserva os campos `message`, `mensagem`, `history` e `historico` e reconhece as mesmas
respostas `answer`, `resposta`, `reply` e `message`. Não contém segredos ou SDK pago.
O chat original usa esse cliente, mantendo sua UI, histórico, temporizador, intervalo,
tratamento de erro e desafios. Nenhuma credencial foi lida ou modificada.

`leo-inline.js` gerencia a UI do piloto. Só a função da aula de Porcentagem foi
conectada ao novo componente. Outras aulas, simulados e plano não foram convertidos.
A demonstração completa foi regenerada com os novos scripts e estilos.

## Testes executados

`npm test`: **11 testes passaram** (8 novos de contexto/transporte e 3 do plano).

Os novos testes verificam contexto após erro, acerto e esgotamento, validação de
estado, ausência de gabarito no modo de dicas, repetição da regra nas complementares,
alias do Worker, histórico limitado, propagação de sinal de cancelamento e falhas
HTTP/rede/resposta vazia. Os testes substituem o transporte; não chamam IA real.

No navegador, usando `tests/leo-inline-review.html`:

| Verificação | Resultado |
| --- | --- |
| Antes de clicar no Leo, após responder | Zero chamadas de explicação |
| Acerto na primeira tentativa, questão 1 | Feedback mantido; botão e painel abrem; contexto correto, tentativa 1 |
| Pergunta complementar | Texto enviado com contexto e duas mensagens anteriores de histórico |
| Fechar e reabrir | Resposta/progresso preservados; sem pedido duplicado |
| Erro inicial, questão 2 | Segunda tentativa mantida; contexto `hint`, escolha R$ 70, sem gabarito |
| Segunda tentativa correta, questão 2 | Contexto atualizado: tentativa 2, acerto, histórico anterior limpo |
| Dois erros, questão 3 | Resultado original preservado; contexto `solution`, erro, zero tentativas restantes |
| Erro HTTP controlado | Aviso explícito, sem resposta inventada; nova solicitação possível |
| Fechar durante pedido pendente | Cancelado; aula continua com 3/3 concluídas e 2 acertos |
| Escape no painel | Fecha só a explicação; área de estudos continua aberta |
| Restauração de leitura | Posição medida antes/depois: 1070 px em ambos os casos |
| Troca de aula com conversa aberta/pendente | Funciona após correção de loop do observador de ocultação |
| Chat original do Leo | Recebe resposta controlada pelo mesmo cliente; conversa antiga continua acessível |
| Simulado e retorno à aula | Abrem normalmente; progresso da aula preservado |
| Larguras 360, 390 e 1280 px | Página e painel sem transbordamento horizontal nos estados observados |

O ambiente de teste identifica em destaque **respostas controladas, sem IA**. Seu
armazenamento é fictício em memória, a rede do iframe é interceptada e os relógios
são avançados apenas pelo controle explícito de teste. Isso valida envio e interface,
mas NÃO demonstra uma resposta real do Professor Leo.

Também foi testada a aplicação modular normal (`index.html`), sem mock: carregamento
dos três componentes do piloto, diagnóstico com resultado 5/5, plano semanal e atividade
concluída preservada após F5. Não foi acionado o envio real ao Leo nessa página.
Verificações de sintaxe e `git diff --check` passaram. A suite antiga de navegador não
foi executada; os testes de interface usaram o navegador remoto suportado.

## Limitações explícitas

- Não foi feita chamada real ao Worker/IA; formato, tamanho aceito do prompt, CORS,
  autenticação e comportamento pedagógico real ainda precisam de homologação.
- Não foi usado celular físico, teclado virtual ou Safari; a responsividade foi
  examinada em janelas de documento de 360/390 px dentro do navegador.
- Não foi auditada toda a aplicação nem garantida ausência de toda regressão.
- Conversas não persistem após F5 ou reconstrução da aula. O progresso persiste.
- Custos/limites do servidor permanecem os existentes; o intervalo do navegador não
  substitui rate limiting no backend. Nenhum serviço novo foi contratado/configurado.
- O piloto se limita à aula de Porcentagem; expansão a outras aulas depende da revisão.

## Como experimentar antes de aprovar publicação

1. Baixe `demonstracao.html` desta branch e abra no Chrome/Edge do notebook.
2. Entre em Área de estudos → Aulas → Matemática → Porcentagem.
3. Responda a uma questão e clique em **🎓 Professor Leo, me explica!**.
4. O arquivo normal usa a API real existente e precisa de rede e de uma origem aceita
   pelo Worker. Uma abertura `file://` pode ser recusada pelo CORS; isso não foi testado.
5. Para testar UI sem API/custo: clone/baixe a branch, execute `npm run dev` e abra
   `http://127.0.0.1:8000/tests/leo-inline-review.html` no mesmo computador. As respostas
   nessa página são explicitamente de teste. Não confundi-las com explicações reais.
6. Para validar a IA em homologação, usar a aplicação servida por uma origem aceita
   pelo Worker e conferir os três modos com questões fictícias, antes de publicar.

A captura `docs/leo-inline-piloto.jpg` mostra o painel em modo de teste. A publicação
continua dependendo de autorização; nenhum link novo de site hospedado foi criado.
