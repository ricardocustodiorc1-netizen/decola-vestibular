# Piloto de Porcentagem — entrega e validação

Data: 01/11/2026. Branch: `dev/navegacao-leo-familias-20261031`. Base íntegra antes de editar: `a7a297b`. Os 27 testes existentes passaram antes da primeira modificação.

## Implementado, somente em Porcentagem

- Percurso Entender → Registrar → Praticar → Recordar no fluxo da aula.
- Convite opcional para papel, aplicativo pessoal ou uso combinado, com orientações para explicar com palavras próprias, criar exemplo e interpretar fórmulas. Não coleta texto do caderno nem exige confirmação para seguir.
- Prática original preservada com feedback, segunda tentativa e Leo inline.
- Desafio com os três enunciados aprovados (base 100, tênis de R$ 200 com 15% de desconto, aumento de 20% em R$ 100). Fica disponível após concluir a prática, sem abrir conversa ou chamar API automaticamente; pode adiar, retomar e avançar para Frações sem completá-lo.
- Uma pergunta por vez, respostas de até 300 caracteres, consulta autodeclarada, dica editorial e “Não lembro ainda”. Referências e rubricas somente após coletar a rodada inteira.
- Autocorreção guiada explicitamente identificada como sem IA, por objetivo: demonstrou, parcial, apoio ou não observado. Não existe classificador automático de respostas abertas ou nota oficial.
- Reforço editorial por objetivo, liberado para dificuldades/resultado parcial/não observado: variantes de proporção, desconto e aumento. Feedback imediato sem punição; resposta inicial e atividades posteriores são separadas.
- Ajuda real do Leo somente sob pedido, dentro do Desafio; pergunta e resposta do item, objetivo, fase, apoio e histórico próprio. Antes de concluir a rodada, prompt pede apenas dica; depois, resolução. Não usa nem altera a conversa original do Leo.
- Persistência na única chave nova `decola-method-memory:v1`: rascunhos, posição da rodada, respostas iniciais, ajuda declarada, autocorreção e reforços. Leitura validada, aviso de falha de salvamento, cópia manual e exclusão seletiva. Não há migração ou sobrescrita de chaves antigas.

O esquema final é um registro versionado de uma única aula, em vez do envelope ilustrativo de múltiplas aulas do planejamento. Não inclui agenda, reviewPlan, contas ou notas pessoais. Essa redução mantém o escopo do piloto.

## Testes e resultados

### Automatizados

`npm test`: **39 passaram, 0 falharam** — os 27 originais mais 12 novos.

Novos casos: catálogo aprovado, ordem da rodada, prevenção de clique duplicado, adiar/consultar/não lembrar, preservação da resposta inicial no reforço, rascunho/reload em armazenamento isolado, apagar somente a chave nova, quota e gravação silenciosa, dados incompatíveis/corrompidos, contexto sem gabarito antes da rodada, limite de 1.000 caracteres, apoio posterior sem reescrever apoio inicial, limite de registros de reforço e fechamento idempotente da ajuda.

Sintaxe dos novos scripts e do adaptador da aula: aprovada por node --check. `npm run build:preview` aprovado; os 11 scripts incorporados na demonstração foram conferidos sintaticamente. `git diff --check` aprovado.

### Navegador

- Convite de anotação opcional; a prática funciona sem escolher formato ou expandir sugestões.
- Erro na primeira questão mantém segunda tentativa; payload do Leo original continua com regra de dica e sem campo de gabarito.
- Conclusão da prática libera o Desafio. Adiar/retomar funciona; nenhuma referência presente no DOM da rodada inicial.
- Falha de rede na ajuda mantém a resposta; orientação local disponível e marcada sem IA. Escape fecha a ajuda e devolve foco sem fechar a área.
- Complemento na conversa do Desafio envia histórico com duas mensagens; contexto de feedback inclui referência somente após a rodada.
- Persistência real em página normal: rascunho da pergunta 1 recuperado após F5, com prática preservada em 3/3. Após a rodada, três cartões de feedback e autocorreção “parcial” recuperados após novo F5.
- Consulta identificada no item 2; resposta inicial “30” preservada depois de reforço incorreto “16” e correto “144”.
- Exclusão seletiva pelo botão do piloto preservou prática 3/3 e simulado em 1/10, questão 2.
- “Próxima aula: Frações” continua disponível com Desafio incompleto; volta a Porcentagem preservou rascunho.
- Layout do piloto em 360/390/768/1280 px: largura total sem rolagem horizontal; largura interna igual à largura rolável do componente em todas as medidas. Enunciados e controles ajustados para leitura de pelo menos 16 px.

Os testes de falhas/contexto usaram `tests/leo-inline-review.html`, rotulada como respostas controladas sem IA e armazenamento fictício. Testes de F5 e exclusão usaram aplicação normal com armazenamento real do navegador e dados fictícios de teste. Não houve instalação de navegador ou execução dos antigos scripts Playwright nesta sessão.

### Falha encontrada e corrigida durante os testes

O primeiro observador da nova ajuda reatribuía `hidden=true` mesmo quando a caixa já estava oculta. Ao trocar de tela, criava um ciclo de mutações e podia travar a aba. Corrigido com verificação de estado antes de escrever; teste automatizado garante que fechar duas vezes não cria novas mutações. Após a correção, sair do Desafio para Simulados, retornar à aula, avançar para Frações e voltar funcionou sem travamento.

Também se ajustou o foco após a autocorreção e o tamanho dos enunciados/botões após inspeção visual.

### IA real

Três solicitações reais pelo cliente compartilhado e adaptador HTTP curl, com Origin `http://127.0.0.1:8000` já autorizado, receberam respostas reais: dica (~8,4 s), complemento (~7,5 s), resolução (~9,0 s). Na dica e no complemento, a IA não revelou o preço final de R$ 170; após a rodada, explicou o desconto de R$ 30 e o preço de R$ 170 passo a passo. Evidências completas em [piloto-api-evidencias.json](piloto-api-evidencias.json).

Isso valida o contrato/contexto por HTTP. **Não equivale a um teste de IA real de ponta a ponta no navegador**, porque o preview do navegador usa outra origem. Não houve reescrita de origem, alteração de CORS ou Worker. Respostas controladas de navegador não são apresentadas como IA real. Como modelo generativo, o comportamento pedagógico deve continuar sendo observado em novos testes.

## Limitações e limites explícitos

- Sem editor digital, revisões automáticas, agenda nova, notificações, cadastro ou cobrança. As revisões antigas dos simulados permanecem como estavam.
- Autocorreção das respostas abertas é declarada pelo aluno; Leo oferece explicação, não nota automática.
- Dados locais por origem/navegador, sem sincronização. Rascunhos ficam até exclusão do piloto ou limpeza do navegador. Não enviar dados pessoais.
- Até 300 caracteres por resposta; até 20 registros por microatividade de reforço. Ao atingir o limite, a referência continua disponível e a progressão não é bloqueada.
- Conversa do Leo é temporária no painel atual; os rascunhos/respostas do Desafio são persistidos. Complementos de ajuda têm limite calculado para manter a mensagem completa dentro de 1.000 caracteres.
- Dados novos incompatíveis não são substituídos automaticamente; alterações continuam em memória com aviso, até o aluno optar por apagar somente este Desafio. Falha de salvamento exige copiar as respostas antes de sair.
- Sem teste em celular físico ou estudo de eficácia pedagógica com alunos reais. A validação editorial e o piloto assistido continuam necessários antes de ampliar o recurso.

## Como validar localmente

1. Obter esta branch, instalar apenas os pré-requisitos habituais (Node e Python) e executar `npm test`.
2. Executar `npm run dev` e abrir **http://127.0.0.1:8000/** ou **http://127.0.0.1:8000/demonstracao.html**. Evitar file:// e localhost, que são origens diferentes para a API.
3. Meu Decola → Porcentagem. No bloco Registrar, deixar formato em branco, ver sugestões se desejar e seguir à prática.
4. Errar a questão 1, pedir dica ao Leo e conferir a segunda tentativa. Concluir as três questões; não é necessário acertar todas.
5. No bloco Recordar, adiar e retomar. Escrever rascunho, recarregar, abrir a aula e conferir recuperação.
6. Responder os três itens, usando consulta ou “Não lembro ainda” em algum deles. Conferir que as referências só aparecem ao terminar a rodada.
7. Escolher “Demonstrei parcialmente” ou “Preciso de apoio” e abrir reforço. Errar e tentar novamente; conferir que a resposta inicial continua registrada.
8. Pedir ajuda contextual e complemento. Para falha controlada, carregar a página e usar modo Offline das ferramentas do navegador antes de pedir ajuda; restaurar Online depois. Alternativamente usar a fixture explicitamente sem IA.
9. Avançar a Frações sem terminar o Desafio. Retornar e conferir o rascunho. Testar menu móvel, Escape e 360/390/768/1280 px.
10. Se quiser apagar dados de teste, usar **Dados deste Desafio → Apagar somente os dados deste Desafio**, nunca limpar todo o armazenamento para este teste. Conferir que aulas e simulados continuam intactos.

## Preservação e publicação

`leo-client.js`, `leo-inline.js`, `professor-leo.js`, `navigation.js` e `study-session.js` permanecem iguais à base aprovada. Somente a aula de Porcentagem recebe o adaptador novo. A demonstração é regenerada com os módulos novos e a versão de cache é atualizada.

Commits separados: estado/rubricas/testes; interface/integração; correção de regressão da navegação; legibilidade/documentação/evidências. Não houve merge, main, deploy, cobrança, credenciais ou alteração no Worker. Publicação depende de autorização separada.
