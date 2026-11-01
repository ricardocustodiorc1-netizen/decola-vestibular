# Professor Leo — áudio opcional no piloto de Porcentagem

Entrega em 01/11/2026. Branch exclusiva: `dev/navegacao-leo-familias-20261031`. Base: `06db493`. Commit de implementação: consultar o commit desta entrega no histórico da branch (o identificador também acompanha o relatório final).

## Implementado

Nas respostas do Leo no painel “Professor Leo, me explica!” das questões de Porcentagem e na ajuda contextual do Desafio da Memória, cada explicação recebe:

- **🔊 Ouvir explicação**, **Pausar áudio**, **Continuar áudio** e **Interromper áudio**.
- Seleção opcional de voz, atualizada quando o navegador carrega a lista de vozes.
- Estado anunciado por região de status e controles nativos acessíveis por teclado.
- Texto integral da explicação mantido visível; apenas a resposta do professor é enviada à síntese, nunca o prompt interno, o gabarito oculto ou a resposta do aluno.

Não há autoplay: criar controles, receber nova resposta ou carregar vozes não inicia leitura. Só uma explicação pode tocar por vez; ouvir outra interrompe a anterior. Textos longos são divididos em trechos para leitura sequencial sem corte silencioso. Na leitura, alguns símbolos são expandidos (% → por cento, × → vezes, ÷ → dividido por); a explicação escrita não é alterada.

Fechar a explicação/ajuda, trocar de tela/aula, remover a resposta, sair da área, ocultar a página ou descarregá-la interrompe a reprodução, inclusive pausada. Eventos tardios de uma leitura cancelada não iniciam novos trechos. Voltar à aula não retoma áudio automaticamente.

A interface informa ausência de suporte, falha da voz ou falta de início da reprodução. Em todos esses casos, texto, respostas, tentativas e navegação continuam disponíveis. O recurso não altera a integração de IA nem cria novas solicitações de explicação.

**Escopo:** respostas dos dois painéis do piloto, inclusive perguntas complementares. O chat livre geral e os textos editoriais de feedback/local não foram expandidos com áudio nesta primeira versão. O áudio lê a resposta já apresentada; não avalia aprendizagem nem acrescenta conteúdo pedagógico.

## Vozes e limitações reais

A seleção automática prioriza pt-BR com nomes masculinos conhecidos (Ricardo, Antonio/Antônio, Felipe, Daniel, Paulo, Thiago, Henrique). Isso é uma heurística: a API não fornece campo de gênero. Se não houver uma dessas vozes, usa outra pt-BR, depois outra voz em português e finalmente uma voz padrão/disponível. O aluno pode escolher manualmente entre as vozes listadas.

Não é uma voz personalizada do Professor Leo, e o timbre masculino não pode ser garantido em todos os sistemas. Vozes, sotaques, qualidade e comportamento de pausa/continuação dependem do navegador, sistema e mecanismo de fala instalado. Algumas vozes podem depender de internet; não se promete síntese sempre offline nem exclusivamente no aparelho. O código não contrata serviço, não adiciona SDK pago e não chama endpoint de TTS.

Em celulares, confirmar pausa e continuação no aparelho real. Se o mecanismo não responder como esperado, Interromper cancela a leitura; Ouvir inicia do começo. Não existe retomada persistente de áudio após reload, controle da tela bloqueada, exportação de arquivo de som ou reprodução em segundo plano. Fórmulas complexas/LaTeX e a prosódia dos símbolos precisam de avaliação humana; este piloto faz apenas normalização simples.

## Arquivos da entrega

| Arquivo | Alteração |
| --- | --- |
| `leo-audio.js` | Controlador compartilhado, vozes, trechos, estados, cancelamento e controles por resposta |
| `leo-audio.css` | Estilo responsivo, rótulos e foco por teclado |
| `leo-inline.js` | Uma chamada para anexar os controles somente à resposta do professor |
| `memory-help.js` | A mesma integração na ajuda do Desafio |
| `index.html` | Carregamento dos novos assets e atualização de cache |
| `scripts/build-preview.py` | Inclusão do módulo na demonstração completa |
| `demonstracao.html` | Versão regenerada com áudio opcional |
| `tests/leo-audio.test.mjs` | Dez novos testes de áudio e interface |
| `tests/leo-inline-review.html` | Modos explicitamente controlados de áudio e ausência de suporte |
| `docs/LEO-AUDIO-OPCIONAL.md` | Este relatório e roteiro local |
| `docs/leo-audio-opcional.jpg` | Evidência visual; áudio e resposta controlados, identificados na imagem |

`leo-client.js`, `professor-leo.js`, `memory-pilot.js`, `memory-pilot-ui.js`, `study-session.js` e a navegação permanecem sem alterações. Nenhuma chave de progresso é criada ou modificada pelo módulo de áudio.

## Testes executados

### Automatizados

Antes de editar: **39 testes passaram**. Após a implementação: `npm test` — **49 passaram, 0 falharam**.

Os 10 novos testes cobrem:

1. Nenhum início automático e prioridade de voz pt-BR conhecida.
2. Pausar, continuar, interromper e ouvir novamente.
3. Exclusividade entre explicações e descarte de eventos tardios.
4. Cancelamento ativo/pausado ao ocultar contexto, sem ciclo de mutações.
5. Texto longo integral e pausa entre trechos.
6. Voz manual e fallback por idioma/padrão.
7. API ausente, erro de voz e tempo limite de início.
8. Controles por resposta, texto preservado e lista de vozes tardia sem autoplay.
9. Mensagem de indisponibilidade e controles desabilitados sem suporte.
10. Remoção da resposta, ancestral oculto e saída da página.

`node --check leo-audio.js`, sintaxe dos scripts incorporados na demonstração, build e `git diff --check`: aprovados.

### Navegador — controles e regressão

Na fixture com `?audio=mock`, identificada como **ÁUDIO DE TESTE — reprodução controlada, não é áudio real**:

- Ao receber explicação, a lista de chamadas de áudio ficou vazia.
- Enter no botão Ouvir acionou a leitura; pausa, continuação e interrupção funcionaram.
- `voiceschanged` atualizou o seletor sem iniciar áudio.
- A segunda resposta ganhou controles próprios sem autoplay. Ao ouvi-la, a primeira voltou ao estado inativo.
- Navegar ao Meu Decola com áudio pausado cancelou a leitura e manteve o primeiro erro/segunda tentativa.
- No Desafio, ouvir e fechar a ajuda cancelou a leitura e preservou o rascunho “20 em cada 100.”.
- Sair da área de estudos cancelou a reprodução, preservando o acerto já registrado.
- Layout em 360/390/768/1280 px: sem rolagem horizontal; o componente de áudio também não excedeu sua largura.

Na fixture com `?audio=none`, os quatro controles ficaram desabilitados, o texto continuou presente e apareceu a mensagem de ausência de síntese de voz.

### Tentativa de síntese nativa

Sem simular a API de voz, o navegador remoto disponibilizou speechSynthesis, mas a lista de vozes permaneceu vazia. Ao solicitar leitura, retornou erro de reprodução; a mensagem amigável apareceu e o texto permaneceu disponível.

**Não houve confirmação de som audível, timbre ou qualidade em aparelho físico.** Os testes controlados comprovam o acionamento/estado dos controles, não a qualidade sonora de um navegador real. A confirmação final deve ser feita no notebook e no celular do usuário, com vozes disponíveis. As respostas da IA na fixture também são controladas e identificadas como tal; não se apresenta uma nova validação de IA real nesta entrega.

## Validação local

1. Obter a branch indicada, executar `npm test` e `npm run dev`.
2. Abrir **http://127.0.0.1:8000/** ou **http://127.0.0.1:8000/demonstracao.html**. Para IA real, usar a origem já autorizada; não alterar Worker/CORS para testar o áudio.
3. Meu Decola → Porcentagem. Responder uma questão e solicitar “Professor Leo, me explica!”. Confirmar que o texto aparece e não há áudio automático.
4. Selecionar uma voz disponível e clicar Ouvir. Pausar, continuar e interromper. Usar Tab/Enter/Espaço para conferir teclado. Se não ouvir, verificar volume, voz instalada e disponibilidade do mecanismo de fala do navegador/sistema; o texto continua sendo o caminho de fallback.
5. Solicitar complemento e conferir controles independentes. Ouvir outra explicação enquanto a anterior toca; não deve haver sobreposição.
6. Fechar explicação, trocar de aula e sair da área, inclusive durante pausa. Voltar não deve reiniciar leitura ou apagar respostas.
7. Concluir a prática, abrir o Desafio, escrever um rascunho e pedir ajuda ao Leo. Repetir os controles e conferir que o rascunho e a rodada permanecem intactos.
8. Repetir no Edge/Chrome do notebook e no navegador do celular, com ênfase na pausa/continuação e nas vozes pt-BR. Conferir o texto sem depender de áudio.

Para testes isolados, abrir `/tests/leo-inline-review.html?audio=mock` ou `?audio=none`. O botão “Carregar vozes de teste” simula chegada tardia da lista; “Concluir áudio de teste” e “Falhar áudio de teste” exercitam eventos. Sem parâmetro `audio`, a síntese é nativa e apenas as respostas da IA são controladas. Esses modos não alteram dados reais de alunos.

## Referências técnicas

Consultadas em 01/11/2026:

- [MDN — SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis): fila de fala, getVoices, pause/resume/cancel e voiceschanged.
- [MDN — SpeechSynthesisVoice](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice): idioma, nome, serviço local/remoto e identidade da voz; sem metadado padronizado de gênero.
- [MDN — pause](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/pause): estado de pausa da API; disponibilidade concreta deve ser conferida no mecanismo usado.

## Publicação

Entrega somente na branch de desenvolvimento, em um commit separado. Sem alteração na main, merge, publicação, Worker, credenciais, cobrança ou contratação externa. Publicação permanece dependente de autorização separada.
