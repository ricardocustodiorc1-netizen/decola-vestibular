# Voz Elvis — inventário e demonstração reutilizável

Data: 2 de novembro de 2026. Base analisada: `53715ed`, exclusivamente na branch `dev/navegacao-leo-familias-20261031`.

## Resultado desta etapa

Foi preparado um inventário rastreável, uma proposta de associação por texto/etapa e uma demonstração local independente. Não houve expansão para todas as aulas, geração de áudio ou publicação.

O piloto `piloto-professor-leo-3-4.html` e o arquivo `audios/leo-explicacao-elvis.mp3` permaneceram intactos. A voz é identificada como Elvis conforme o arquivo e a confirmação do usuário. Não se presume que seja a voz Will da demonstração anterior, nem se criou/clonou voz nesta etapa.

## 1. Estrutura atual e cobertura necessária

| Área | Conteúdo encontrado | Preparação necessária para áudio |
| --- | --- | --- |
| Piloto Leo 3.4 | História, explicação da camiseta de R$ 150 com 20% de desconto, exercício de tênis com 25% de desconto e dicas progressivas | Preservar explicação Elvis existente; história e feedbacks precisam de roteiros/gravações próprios |
| Matemática inteligente (`study-area.js`) | Porcentagem, Frações, Equações, Geometria, Estatística; 3 questões em cada aula | Separar conceito, exemplo, dica inicial, reforço após erro e resolução de cada questão |
| Linguagens inteligente (`language-smart.js`) | Interpretação de Textos, texto de leitura e 3 questões | Separar leitura, estratégia, metáfora, inferência, dicas e resoluções |
| Aulas legadas (`professor-leo.js`) | Porcentagem, Interpretação, Cidadania, Transformações físicas e Tese argumentativa | Evitar duplicar conceitos já gravados; associar apenas textos equivalentes e versões corretas |
| Treinos e recuperação (`professor-leo.js`) | Matemática, Português, Humanas, exemplos, reforços e dicas progressivas | Narrar orientação sem gabarito separadamente da resolução; não transformar rótulos de navegação em áudios |
| Simulado (`professor-leo.js`) | Questões, comentários e recuperação do simulado | Resolução apenas quando liberada pelo fluxo; não antecipar comentários nas questões pendentes |
| Desafio da Memória (`memory-pilot.js`) | 3 perguntas, dicas, referências de resposta, rubricas e reforço de Porcentagem | Separar recuperação inicial de memória e feedback final; rubrica interna não é automaticamente roteiro para aluno |
| Professor Leo e perguntas complementares | Texto dinâmico retornado pela IA | Não cabe em um catálogo finito. Nenhum MP3 genérico deve ser apresentado como leitura dessa resposta |

### Inventário entregue

- `INVENTARIO-AUDIOS-ELVIS.json`: candidatos com ID, texto, hash de revisão e referência de arquivo/linha.
- `INVENTARIO-AUDIOS-ELVIS.csv`: mesma lista para triagem editorial em planilha.
- `scripts/inventory-lesson-audio.py`: regeneração determinística, sem rede nem síntese.

Foram identificadas **422 entradas**: 1 explicação com gravação existente, 1 história sem gravação e 420 candidatos estáticos para revisão. A classificação automática dos 420 candidatos resultou em 21 dicas, 57 trechos de solução/feedback/rubrica e 342 outros textos a revisar. **Não são 422 áudios obrigatórios ou roteiros finais aprovados.** Há instruções, fragmentos concatenados e textos de interface que precisam ser descartados ou reunidos antes de produzir áudio.

Referências por fonte: 92 em `study-area.js`, 24 em `language-smart.js`, 282 em `professor-leo.js`, 24 em `memory-pilot.js` e 2 no piloto 3.4. Uma entrada pode ter mais de uma referência quando o mesmo texto aparece em módulos distintos; somas por fonte não devem ser confundidas com contagem única.

Limites da extração: literais curtos, tabelas montadas em execução e mensagens concatenadas precisam de leitura editorial. O levantamento não é um parser completo de JavaScript nem um exportador dos textos finais de todas as telas. O JSON registra essas limitações. A classificação de fase dos candidatos não os libera para reprodução; apenas o catálogo curado da demonstração é executável.

### Ativos existentes

| Identidade | Situação | Arquivo |
| --- | --- | --- |
| `leo34.porcentagem.explicacao` | Disponível, voz confirmada pelo usuário; MP3 mono 44,1 kHz, 27,794 s | `audios/leo-explicacao-elvis.mp3` |
| `leo34.porcentagem.historia` | Pendente; o piloto aponta para um arquivo que não está no repositório | Futuro `audios/leo-historia-elvis.mp3`; não foi criado |
| Outras explicações/dicas/resoluções | Aguardam triagem, roteiro e MP3 específico | Sem URL inventada ou geração automática |

Foi conferido o SHA-256 do MP3 existente, registrado no inventário, e mantido o conteúdo binário. O texto associado foi extraído de `explanationText` no piloto 3.4. A transcrição auditiva integral da gravação não foi validada nesta sessão; a adequação da voz já havia sido confirmada pelo usuário.

## 2. Estrutura reutilizável proposta e demonstrada

`lesson-audio-catalog.js` contém a lista curada; `lesson-audio.js` resolve a associação e monta os controles. O inventário editorial é separado desse catálogo para não liberar automaticamente centenas de candidatos.

Cada entrada executável tem:

| Campo | Finalidade |
| --- | --- |
| `id` | Identidade estável da explicação, sem depender da posição de um parágrafo na tela |
| `lessonId` | Aula/versão à qual o conteúdo pertence |
| `phase` | `lesson`, `hint` ou `solution`; fases não são intercambiáveis |
| `revision` e `text` | Versão e texto aprovado; alteração do texto invalida a associação até revisão |
| `voice` | Elvis, conforme o ativo aprovado |
| `src` | Caminho local em `audios/`, sem tokens ou URL de serviço externo |
| `status` | `ready` somente com gravação correspondente; `pending` não reproduz |

O resolvedor compara aula, fase e texto, tolerando apenas diferenças de espaços/quebras de linha. Não faz aproximação semântica, não reutiliza a gravação da camiseta para uma questão diferente e não troca silenciosamente para a voz do navegador.

Para resolução de exercício, o contexto deve informar acerto ou pelo menos duas tentativas. O chamador é responsável por fornecer o estado real da atividade, nunca um booleano fixo para contornar a regra. Na integração futura, `getContext` deve ler o estado já existente; chamar `refresh` ao mudar texto/contexto e `destroy` ao desmontar o componente. O observador também interrompe se o host for removido, ocultado ou deixar de corresponder ao catálogo. O catálogo de demonstração tem somente uma gravação pronta de aula e uma pendência de história; não há gravações de solução ou dica promovidas.

O controlador compartilhado admite uma gravação por vez, iniciar somente por clique, pausar, continuar da mesma posição e interromper. Para sair/repetir, interromper zera a posição. Encerramento natural, erro de arquivo, rejeição de reprodução e eventos antigos são tratados sem mexer no texto ou no progresso. Sair da página/aba ou ocultar a área interrompe.

**Limite desta demonstração:** o compartilhamento é entre os novos componentes MP3. Antes de montar nas aulas reais, deve-se coordená-lo também com `leo-audio.js` e com players antigos, para impedir sobreposição entre sistemas. Nenhum deles foi alterado aqui.

## 3. Demonstração funcional isolada

Abrir `piloto-audios-elvis.html`. A página tem:

1. Explicação do piloto 3.4, com o mesmo MP3 Elvis e os quatro controles.
2. História pendente, com mensagem clara e botões indisponíveis.
3. Texto de uma questão diferente, cuja associação é recusada.
4. Rascunho de teste apenas na memória da página, preservado ao fechar/reabrir a explicação. Não é editor do Caderno Decola, nem grava dados persistentes.
5. Retornos ao piloto 3.4 e ao Meu Decola.

Nenhum script novo é carregado por `index.html`, `demonstracao.html` ou pelo piloto 3.4. Não há nova API, armazenamento ou geração de fala. Nenhum recurso de produção ou progresso existente foi migrado.

### Validação local

```sh
git switch dev/navegacao-leo-familias-20261031
npm test
npm run dev
```

Abrir `http://127.0.0.1:8000/piloto-audios-elvis.html` no computador. Para inspeção de larguras, abrir `http://127.0.0.1:8000/tests/lesson-audio-review.html` e escolher 360, 390, 768 ou 1280 px. Essa página usa o MP3 real, sem áudio simulado. Não confundir largura de iframe com validação física de Android.

Usar Tab/Enter no botão Ouvir; pausar, continuar e interromper; preencher o rascunho e fechar/reabrir; verificar que os dois cartões sem associação não tocam o MP3. Para renovar o inventário: `python3 scripts/inventory-lesson-audio.py`.

## 4. Testes e resultados

- Antes das alterações: **49 testes aprovados**.
- Depois: **63 aprovados**, sendo **14 novos**, sem falhas. Cobrem associação exata, pendências, duplicação de ID, fase/tentativa, URLs indevidas, ciclo de reprodução, exclusividade, eventos tardios, fechamento, erro, hash do ativo, isolamento e controles DOM.
- Navegador remoto: MP3 real carregado e reprodução aceita pelo Chrome, acionamento por Enter, pausa, continuação, fechamento com interrupção e rascunho preservado na reabertura. Isso não equivale a avaliação auditiva humana do timbre.
- Larguras de iframe 360/390/768/1280: sem transbordamento horizontal no conteúdo. Os 15 px de diferença entre largura do iframe e largura do body correspondem à barra de rolagem do ambiente.
- Piloto original 3.4: gravação integrada pronta e reprodução aceita; navegação história → explicação → desafio; primeiro erro com dica, nova tentativa e acerto preservados.
- Comparação de arquivos: piloto 3.4, MP3, índice, bundle, aulas, cliente do Leo e Desafio da Memória permanecem sem alterações. Testes automatizados existentes continuam cobrindo regras do Leo e persistência.
- As falhas de MP3/rejeição foram testadas com um player controlado em testes automatizados, sem bloquear serviços externos. Não houve teste de indisponibilidade real de API, pois a nova página não chama API e o Worker não foi alterado.

A nova demonstração ainda precisa de confirmação auditiva em Android físico. A validação anterior da voz no piloto 3.4 não substitui essa nova rodada de controles. Não houve geração paga nem chamada à IA real nesta etapa.

## 5. Próximas etapas pequenas, antes da expansão

1. **Aprovar demonstração local.** Critério: Elvis somente na explicação correta, texto visível, quatro controles, navegação segura e pendência explícita. Esta etapa foi preparada.
2. **Triar apenas Porcentagem.** Fechar roteiros de conceito, exemplo, dicas sem resposta e resoluções. Registrar texto falado normalizado para números/fórmulas, revisão, direitos de uso e validação humana. Não produzir centenas de arquivos a partir dos candidatos brutos.
3. **Receber/gravar MP3s autorizados.** Cada arquivo passa por conferência de texto, números, voz, duração e hash; só então entra como `ready`. Qualquer geração paga depende de autorização específica.
4. **Montar no piloto da aula principal.** Coordenar os dois motores de áudio, ler contexto real das tentativas e preservar storage/posição. Testar erro, segunda tentativa, resolução, Desafio, reabertura e offline antes de ampliar.
5. **Expandir uma aula por vez.** Frações/Equações/Geometria/Estatística, depois Linguagens e demais áreas. Medir tamanho dos arquivos e carregamento em celular. Não misturar texto de respostas dinâmicas da IA com um MP3 fixo.

Atualizar a prévia HTTPS, publicar ou alterar infraestrutura requer autorização separada. O plano não exige nem autoriza mudar o Cloudflare Worker, faturamento ou `main`.
