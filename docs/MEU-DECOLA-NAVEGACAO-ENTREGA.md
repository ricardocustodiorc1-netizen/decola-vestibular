# Meu Decola — implementação das cinco etapas

Data: 01/11/2026. Branch exclusiva: `dev/navegacao-leo-familias-20261031`. Base preservada: `f8a564a`.

## Implementado

1. **Retomada real:** última aula, questão e posição de leitura na nova chave `decola-navigation:v1`. Metadados validados; registro inválido/ausente volta ao primeiro destino. Falha no armazenamento mantém estado em memória. Nenhuma chave anterior é renomeada ou apagada. Não são armazenados nomes, conversas ou respostas nessa chave.
2. **Menu consistente:** Meu Decola, Aulas, Exercícios, Professor Leo, Progresso e Simulados em todas as telas. Em celular, menu compacto em fluxo normal, sem sobrepor conteúdo; item ativo e Escape que fecha o menu e devolve foco sem sair da área.
3. **Orientação e retorno:** caminho matéria/assunto no cabeçalho, etapas de aprender/praticar mantidas nas aulas, um retorno principal no cabeçalho por nível, foco após a navegação. O retorno contextual do chat original e o painel inline continuam funcionando.
4. **Cartões organizados:** retomada, aulas disponíveis e atalhos separados. Estados Disponível, Em andamento (incluindo primeiro erro) e Concluída; ferramentas antigas continuam acessíveis. O design futuro do Caderno Decola está documentado no plano, sem implementação pedagógica nem botão ativo.
5. **Regressão e demonstração:** suíte ampliada, testes de navegação/Leo/persistência/layout realizados e demonstracao.html atualizada. Cache dos assets versionado para carregar o novo helper junto da área de estudos.

## Resultados

- **27 testes automatizados passaram, 0 falharam**: os 24 anteriores do Leo/plano e 3 novos de retomada, armazenamento inválido, preservação de dados e falha de armazenamento.
- Sintaxe: study-session.js, study-area.js, navigation.js e language-smart.js aprovados por node --check; build da demonstração e git diff --check aprovados.
- Comparação com f8a564a: leo-client.js, leo-inline.js e professor-leo.js sem alterações. O limite de 1.000 caracteres e as regras pedagógicas da correção anterior permanecem intactos.
- Navegador, 360/390/768/1280 px: os mesmos seis destinos presentes; scrollWidth igual à largura em todas as quatro medidas (360, 390, 768, 1280).
- Em 390 px, todos os seis destinos acessados em no máximo duas ações; item ativo correto e menu recolhido ao escolher destino.
- Escape com menu aberto: menu recolhido, foco no botão e painel de estudos continua aberto.
- Primeiro erro em Porcentagem: segunda tentativa preservada; Meu Decola mostra Em andamento mesmo com zero concluídas; retomada voltou à questão e leitura (639 px na fixture).
- Persistência real em página normal: erro em Frações, reload, Meu Decola e retomada. Última aula correta, questão 1 focada, mesma posição: **332 px antes e 332 px depois**, alternativa errada e segunda tentativa preservadas.
- Frações concluída: 3/3 e cartão Concluída. Porcentagem anterior continuou 1/3 Em andamento, confirmando preservação entre aulas.
- Leo inline em fixture controlada: payload de dica sem gabarito, regra NÃO revele, complemento com histórico de duas mensagens, após acerto payload com resolução/gabarito. Falha de conexão mostrou dica local sem IA, sem consumir tentativa.
- Chat original aberto pela nova navegação preservou retorno único à aula, com respostas intactas.
- Simulado: respondeu questão 1, avançou à 2, saiu para Meu Decola e retornou; manteve 1/10 e questão 2.
- Exercícios: os três treinos antigos (Matemática, Português, Ciências Humanas) foram abertos pela navegação unificada.

## Limites da validação

Fixture é explicitamente identificada como “TESTE ISOLADO — respostas controladas, sem IA”, com rede e armazenamento fictícios. Os testes de reload foram separados em página normal com armazenamento real. Não se apresentam respostas controladas como IA real. Nesta fase não foram repetidas chamadas reais de IA nem testes em aparelho físico; as três chamadas reais da auditoria anterior constam em leo-auditoria-api-2026-11-01.json. Não houve alteração de Worker ou permissões para viabilizar testes.

A retomada usa pixels da área de leitura; se o tamanho de tela mudar, o navegador limita a posição ao conteúdo e mantém o foco na questão registrada. Não existe sincronização entre dispositivos. O painel inline mantém sua conversa durante a mesma aula, mas não passa a gravá-la após reload.

## Revisão e reversão

Commits separados para retomada, menu, retornos, cartões e validação. Para reverter a interface, reverter commits na ordem inversa. A chave de navegação pode ficar sem uso; não apagar respostas/históricos para fazer rollback. O Caderno Decola não requer reversão porque não foi implementado.

## Como testar antes da publicação

Obter a branch indicada e executar `npm test`, depois `npm run dev`. Abrir http://127.0.0.1:8000/ ou /demonstracao.html. A integração real só funciona em origens autorizadas; /tests/leo-inline-review.html permite testar falhas/fluxos com respostas explicitamente controladas. Para celular, usar emulação responsiva no navegador ou um dispositivo com ambiente autorizado; não alterar CORS para isso sem aprovação.

A main, o site público, cobranças e Worker não foram alterados por esta entrega. Não houve merge nem publicação.
