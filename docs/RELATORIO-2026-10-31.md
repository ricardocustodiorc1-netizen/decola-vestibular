# Relatório de desenvolvimento — Decola Vestibular

31/10/2026. Branch: `dev/navegacao-leo-familias-20261031`.
Base examinada: `73c5db2aeb591afc52f31ed3227101d271103d42`.

## Diagnóstico

Site estático sem cadastro real. Fluxos do plano separados de aulas/tutor;
o Professor Leo agrega diversos módulos num arquivo de aproximadamente 164 KB.
Camadas posteriores manipulam o mesmo painel e localStorage não separa usuários.
A chamada a um Worker externo contradizia trechos da documentação sobre operação local.
O Worker não faz parte do repositório e sua segurança não foi verificada.

Erros identificados: ausência de estatísticas no caminho inicial sem progresso
podia interromper o dashboard; retorno do topo podia acionar “Mais ferramentas”
no painel inicial; abrir conversa pelo cabeçalho podia manter o dashboard por cima;
o gerador de demonstracao.html não acompanhava os scripts/CSS atuais com query string.

## Implementado

- Navegação persistente dentro dos estudos: Meu Decola, Aulas, Professor Leo e Simulados.
- Botão direto ao tutor no cabeçalho da página pública.
- Correção da entrada sem progresso, de retorno e de sobreposição de telas.
- Botões de retorno identificados por atributo explícito nas novas aulas.
- Localização do painel sincronizada com a tela atual.
- Painel com semântica de diálogo, fundo inerte enquanto aberto, ciclo de Tab,
  Escape e retorno do foco ao controle que abriu o painel.
- Navegação pública usa histórico por clique, permitindo voltar/avançar no navegador.
- Prévia `#familias`: responsável, estudante menor e estudante adulto, sem dados reais.
- Arquitetura proposta em `ARQUITETURA-CONTAS.md`: entidades, permissões, convites,
  API, separação de pagador e estudante, homologação e critérios de aceite.
- Integração externa do Professor Leo preservada, com o mesmo endpoint, histórico,
  tratamento de resposta/erro, limite de intervalo e desafios da main. O bloqueio
  temporário utilizado nos primeiros testes foi removido a pedido do usuário.
  Nenhum segredo novo, credencial ou chamada real foi criado nesta tarefa.
- Gerador de demonstração autossuficiente corrigido e artefato regenerado com todos
  os módulos atuais. Script dev compatível com a prévia de desenvolvimento.
- Seletores do CTA nos testes antigos ajustados ao texto atual. Esses testes não
  foram executados nesta sessão (ver limites abaixo).

## Verificado

| Verificação | Resultado |
| --- | --- |
| `npm test` | 3 testes passaram: prioridade por erro, carga/tempo nas combinações e cobertura das áreas |
| `node --check` em arquivos JS e testes | Sintaxe válida |
| Build da demonstração | Gerado; sem links CSS/scripts externos ou import residual |
| Sintaxe dos scripts embutidos | Válida |
| `git diff --check` | Sem erros |
| Navegador, desktop: painel sem progresso anterior | Abre com 0/3, sem interrupção |
| Aula de porcentagem, resposta e troca para tutor | Funciona; tutor não fica oculto |
| Enviar pergunta fictícia com IA bloqueada | Aviso de nenhuma mensagem enviada; chamada bloqueada pelo código |
| Retorno ao painel e F5 | Progresso da aula 1/3 preservado |
| Diagnóstico incompleto | Impede avanço e foca resposta obrigatória |
| Perfil → diagnóstico completo → resultado → plano | Resultado 5/5 e plano semanal exibidos |
| Marcação de atividade do plano e F5 | Marcação preservada |
| Acesso ao simulado | Primeira questão e controles exibidos |
| Escape e devolução do foco | Retorna ao botão Área de estudos |
| Prévia de responsável, menor e adulto | Conteúdo distinto exibido; acesso ao plano preservado |
| Demonstração completa via HTTP | Página familiar e perfil exibidos; Voltar do navegador retorna à família |

A validação visual é da prévia interna, sem implantação. Não houve teste com aluno real,
integração WhatsApp, login, pagamento ou resposta real da API do Leo. Não se pode
concluir que esses recursos funcionam em produção a partir destes testes.

## Limites e trabalho restante

- Backend, login, vínculo familiar e isolamento entre contas ainda não implementados.
- `#familias` demonstra o fluxo; não cria convites nem registra consentimento.
- Persistência continua local e compartilhada por quem usa o mesmo navegador.
- O histórico Voltar/Avançar foi implementado; confirmar todos os cenários em homologação.
- Suite automatizada antiga de navegador/iframes/storage-failures não executada:
  este ambiente usa o navegador remoto suportado pela prévia; não há Chromium local
  no caminho dos testes. Fluxos principais foram verificados por interação no navegador.
- Responsividade possui regras para celular, mas não foi validada em dispositivo móvel.
- Ciclo de Tab implementado; revisão completa com leitor de tela ainda pendente.
- O texto e as respostas de todas as aulas e o simulado completo não foram auditados.
- Conteúdo e progresso do monólito precisam de modularização gradual e testes adicionais.

## Decisões que dependem do Ricardo

1. Aprovar a experiência desta branch antes de merge/publicação na main.
2. Escolher fornecedor, orçamento, região e método de login do backend.
3. Aprovar verificação de responsáveis, escopos de resumos, privacidade e retenção;
   definir cadastro de menores e transição para maioridade.
4. Definir estudantes por assinatura, responsável pagador e condições dos 7 dias gratuitos.
5. Autorizar a revisão/reativação da API de IA com limites de consumo e regras de dados.
6. Aprovar destinatários e frequência dos lembretes de WhatsApp e integrações reais.
7. Aprovar separadamente cobranças reais e a publicação, depois dos testes de homologação.

Nenhum desses itens foi ativado nesta entrega. Nenhuma alteração foi enviada à main,
nenhum merge/deploy foi solicitado e nenhuma cobrança foi configurada.

## Estado da entrega no GitHub

A branch de desenvolvimento foi criada remotamente na base original. As melhorias
estão commitadas apenas no checkout local. A primeira tentativa de push foi rejeitada pela
revisão automática: interpretou “não publique mudanças” como vedação também ao envio
para branch de desenvolvimento. Nenhum meio alternativo foi tentado.
A leitura remota confirmou que a branch ainda aponta para a base `73c5db2`.
Para disponibilizar o código alterado no GitHub, falta autorização explícita para
push exclusivamente nesta branch, sem merge na main e sem deploy.

## Autorização complementar e preservação do Professor Leo 2.0

O usuário autorizou expressamente enviar commits exclusivamente à branch de
desenvolvimento, sem merge e sem deploy. Pediu preservar as funcionalidades existentes.
A lógica inteira a partir de `// Integração segura:` e a função de desafios foram
comparadas com a main e estão idênticas; apenas IDs/eventos de navegação foram
acrescentados no restante do módulo. O envio real à API não foi testado.
Os 3 testes automatizados foram executados novamente e passaram.

## Entrega confirmada após autorização

As alterações foram enviadas exclusivamente à branch de desenvolvimento pela conexão GitHub,
em commit consolidado `c6896e3`. A main permanece em `73c5db2`.
Após o envio foram baixados novamente os 10 arquivos principais do site público:
index.html, app.js, professor-leo.js, study-area.js, language-smart.js, plan.js,
styles.css, launch.css, professor-leo.css e study-area.css. Os hashes SHA-256
permanecem iguais aos de antes do envio; todos também correspondem à main.
Não foi executado merge, deploy ou configuração de cobrança.
Esta confirmação substitui o estado anterior de entrega apenas local.

O Professor Leo está com sua integração original preservada. Não foi testada uma
resposta real da IA, nem é possível garantir ausência de toda regressão sem a
suite completa e validação em homologação. Não foi criada prévia pública da branch.
