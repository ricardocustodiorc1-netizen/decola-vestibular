# Revisão da experiência do aluno — 31/10/2026

Branch: `dev/navegacao-leo-familias-20261031`. Base desta revisão: `66a556a`.
Sem merge na main, sem deploy e sem cobranças. A autorização de envio à branch
concedida na conversa anterior foi mantida.

## Problemas corrigidos

1. O CSS anterior escondia links públicos em telas pequenas sem oferecer alternativa.
   Agora “Mais opções” revela Início, Responsáveis e estudantes, Áreas do ENEM,
   Como funciona e recuperação de progresso. Leo e Área de estudos ficam acessíveis
   sem abrir esse menu. A opção fecha ao navegar por um link.
2. O cabeçalho e os atalhos ocupavam cerca de 260 px na janela de 390 px, antes da
   área rolável. Foram compactados; os quatro destinos permanecem visíveis em uma
   linha, sem ocultar o retorno aos exercícios do tutor. A área rolável cresceu de
   aproximadamente 500 para mais de 600 px no painel inicial de 844 px de altura.
3. A entrada em exercícios dependia de “Mais ferramentas”. O painel agora tem
   “Exercícios”, organizado em Matemática, Português e Ciências Humanas, usando
   os treinos existentes, sem reescrever questões ou apagar progresso.
4. Nem todas as aulas de Matemática tinham a marcação necessária para o retorno
   do cabeçalho. Todas receberam identificação explícita, incluindo Frações,
   Equações, Geometria e Estatística.
5. Ir ao Leo pelo atalho durante uma Aula Inteligente não oferecia retorno à mesma
   aula. Agora “Voltar à aula” restaura o mesmo conteúdo, respostas e posição de
   rolagem. Referências antigas são descartadas ao trocar de conteúdo/painel.
6. Acrescentados tamanhos de toque de pelo menos 44 px nos controles principais,
   fonte de 16 px em entradas, ajustes de quebra de texto e layout de pouca altura.
   Evita reduzir a área útil quando o viewport fica menor; teclado real não emulado.
7. Cache dos assets alterados versionado. Demonstração completa regenerada.

O código de `professor-leo.js` está inalterado em relação à base desta revisão.
A API, histórico, exercícios adaptativos, simulado e desafios existentes foram
preservados. Aulas e rotas antigas continuam acessíveis; não foi removida funcionalidade.

## Testes executados

A revisão de interface usou o navegador remoto suportado, com a aplicação dentro
de um iframe de largura ajustável. Isso ativa os media queries do documento real.
Não é emulação de toque, agente de celular, teclado virtual, iOS ou Android físico.

| Teste | Resultado |
| --- | --- |
| `npm test` | 3 testes passaram: prioridade por erro, carga horária e áreas do diagnóstico |
| Sintaxe JS e scripts do HTML autossuficiente | Válida |
| `git diff --check` | Sem erros |
| Janela 390 px: menu público expandido | Links antes ocultos acessíveis |
| Acesso direto ao Leo pelo cabeçalho | Conversa aberta, saída e atalhos presentes |
| 5 aulas de Matemática | Porcentagem, Frações, Equações, Geometria e Estatística abrem e retornam pelo cabeçalho |
| Frações: resposta correta → Leo → Voltar à aula | Resposta e contagem 1/3 preservadas |
| Linguagens: erro → dica → segunda tentativa → acerto | Fluxo concluído, sem bloqueio |
| Linguagens → Leo → Voltar à aula, após atualização | Aula e progresso 1/3 preservados |
| Demais áreas do ENEM | Humanas, Natureza e Redação abrem a aula existente e permitem sair |
| 3 treinos por matéria | Matemática, Português e Humanas abrem e retornam ao painel |
| Simulado completo em largura de 360 px | 10 questões percorridas; resultado 2/10 com respostas de teste e plano de revisão exibidos |
| Meu progresso | Aulas com progresso e acesso de volta exibidos |
| Geração e importação de backup local | Mensagem “Progresso recuperado e salvo neste navegador” |
| Janela de backup em tela estreita | Largura 337 px, dentro da área útil de 375 px; fechamento funciona |
| Escape e foco | Painel fecha e foco volta ao botão Área de estudos |
| Layout aberto em 360, 390, 768 e 1280 px | Sem rolagem horizontal da página; largura do painel coincide com a janela |

As verificações de largura foram feitas nas aulas e no workspace, não em cada
estado de cada questão. Os testes do navegador foram realizados por interação,
não pela antiga suite Playwright local. Logs de erro consultados continham mensagens
da extensão do ambiente; elas não foram atribuídas ao código do Decola.

## Como visualizar antes de publicar

- Baixe `demonstracao.html` desta branch e abra no Chrome/Edge do notebook. Ele
  contém todos os estilos e módulos; não precisa instalar bibliotecas nem publicar.
- Para comparar larguras, baixe também `revisao.html` para a mesma pasta e abra-o.
  Botões 360, 390, 768 e Desktop mostram a aplicação na janela correspondente.
- Alternativa com todos os arquivos da branch: `npm run dev` e acesse
  `http://127.0.0.1:8000/revisao.html` no mesmo computador.
- Use apenas os perfis fictícios. O progresso fica nesse navegador. A conversa
  real do Leo usa o Worker existente e requer rede e origem autorizada pelo backend;
  abrir por arquivo local não garante que o servidor aceite essa origem.
- `docs/revisao-mobile.jpg` registra o painel em largura de 390 px.

## Limites e próximos passos

Falta teste em aparelho físico com teclado aberto, Safari/iOS e leitor de tela.
Não foi chamada a API real do Leo nem feita auditoria do backend. Cadastro real,
WhatsApp e pagamentos continuam fora desta revisão. A proposta de contas permanece
um protótipo e documento de arquitetura. Validar com a aluna piloto antes de autorizar
merge e publicação. Não há nova URL pública hospedada para esta branch.
