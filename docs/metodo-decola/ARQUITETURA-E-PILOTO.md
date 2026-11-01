# Estrutura existente, implementação incremental e piloto

**Planejamento apenas. Nenhum código, tela, dado ou serviço externo foi modificado.**

## 1. Inventário pedagógico e técnico

Análise feita no código da branch em `6dca0b8`, não apenas por nomes de telas.

| Componente | O que já existe | Integração proposta, sem alteração nesta entrega |
| --- | --- | --- |
| `study-area.js`, Porcentagem 1.1 | Conceito, exemplo, 3 questões, feedback, 2 tentativas, relatório e próxima aula | Inserir futuramente convites de registro e Desafio após conclusão; manter exercício atual como prática |
| `language-smart.js` e demais aulas de Matemática | Aulas com prática e relatórios | Somente expandir após validar Porcentagem; rubricas por objetivo e matéria |
| `leo-client.js` / `leo-inline.js` | Contexto por questão, dicas/resolução, histórico curto, cancelamento, falhas e fallback local | Reutilizar transporte e padrões de ajuda; contrato próprio para contexto do Desafio |
| `professor-leo.js`, `leoLearningChallenge` | Após respostas do chat sobre porcentagem, pode inserir exercício numérico de fixação, níveis 1–3, feedback e ajuda | Não chamar isso retroativamente de Desafio de fim de aula. Prevenir oferta duplicada quando nova atividade contextual for projetada |
| Simulado e recuperação progressiva | Questões, resultados e etapas de recuperação preservadas | Ler apenas referências úteis futuramente; jamais sobrescrever notas do simulado com treino de memória |
| `leoSpacedRenderCard` | Revisões de 1/3/7 dias após domínio de questão do simulado; agenda local por índice, registro de etapas bem resolvidas | É recurso existente, não o novo agendamento por aula. Não reutilizar a mesma chave nem apagar seu histórico |
| `study-session.js` | Última aula, questão e posição na chave `decola-navigation:v1` | Manter metadados de navegação separados de textos e desempenho |
| `navigation.js` / Meu Decola | Seis destinos, menu móvel, retorno contextual e progresso por aula | Seções de revisões/caderno dentro da organização atual; sem novos destinos principais desnecessários |
| `scripts/build-preview.py` | Demonstração completa gerada das fontes | Futuras alterações devem atualizar index e demonstração; agora não regenerar porque não há código novo |
| `tests/*.test.mjs` e fixture do Leo | Suíte de 27 testes e respostas controladas para falhas/UX | Preservar regressão e acrescentar testes do método por etapa; fixture não é IA real |

### Chaves atuais que devem permanecer intactas

- `decola-smart-percent-v2` e leitura legada `decola-smart-percent-v1`; demais chaves `decola-smart-*` de aulas.
- `decola-vestibular:progress:v1` (diagnóstico/plano), chaves de treinos e históricos de Matemática, Português e Humanas.
- `decola-vestibular:simulado-enem-v1`, `decola-vestibular:simulado-recuperacao-v1`, `decola-vestibular:simulado-dominio-progressivo-v1`.
- `decola-vestibular:revisao-espacada-v1`, `decola-leo-practice-v1` e `decola-navigation:v1`.

A revisão legada usa `masteredAt` mais os deslocamentos de 1/3/7 dias e registra etapas corretas em `attempts`. Não tratar ausência de erro gravado como ausência de dificuldade. O novo registro deve distinguir todas as tentativas relevantes e o tipo de ajuda. Isso é uma decisão de novo modelo, não autorização para corrigir ou migrar o recurso legado.

### Lacunas para o novo método

Não existe editor pessoal de Caderno integrado nem uma rodada de 2–3 perguntas por aula com registro de consulta, rubrica e agenda adaptativa desse ciclo. O progresso atual mede atividades concluídas e acertos; não mede diretamente retenção. A persistência é local ao navegador e à origem, sem contas/sincronização. O código atual não deve ser apresentado como se já entregasse esses novos requisitos.

## 2. Arquitetura proposta

### Separação de responsabilidades

1. **Catálogo editorial:** IDs estáveis de aula/objetivo/item, versão, pergunta, critérios de aceitação, referência, dicas graduais e variantes. Conteúdo revisado antes do piloto; não gerar a avaliação inteira em tempo real.
2. **Sessão de aprendizagem:** estado da rodada e apoio usado. Distinguir primeira resposta, revisão após ajuda e autocorreção; fluxo não depende da IA.
3. **Agenda:** função independente com relógio/fuso injetáveis, datas nominais e datas reagendadas, sem apagar eventos anteriores. Regras da metodologia testáveis sem navegador.
4. **Interface:** componentes no fluxo da aula, com retorno/foco/persistência e menu existentes. Mudança de navegação não altera rubrica nem agenda.
5. **Adaptador do Leo:** explicação solicitada pelo aluno, contexto reduzido ao item atual e histórico da atividade, com cancelamento e fallback editorial. Não misturar com histórico de outra questão.

Não há necessidade de novo serviço externo para um piloto local com perguntas revisadas e autocorreção transparente. Avaliação automática de texto livre por IA é etapa distinta, sujeita a validação de contrato e qualidade.

### Limite real da API

A correção `f8a564a` preserva o limite de 1.000 caracteres para a mensagem, incluindo contexto e instruções, e limita a pergunta complementar ao espaço restante. Novo contexto não pode ser anexado cegamente ao prompt atual. Propor mensagem de um item por vez com assunto, objetivo, enunciado, resposta, estágio de apoio e política pedagógica. Calcular o espaço antes do envio; testar todas as variantes.

Se o contexto essencial não couber, manter ajuda local e explicar a limitação. Não cortar instruções de não revelar, não retirar informação que muda a correção, não alterar endpoint/Worker ou contornar CORS para fazer caber. Ampliação de contrato depende de proposta e aprovação separadas.

### Esquema conceitual futuro, não criado

Proposta de chave isolada: `decola-method-memory:v1`. Exemplo **ilustrativo**, com dados fictícios, sem implementação:

```json
{
  "schemaVersion": 1,
  "lessons": {
    "matematica.porcentagem": {
      "contentVersion": "pilot-1",
      "notePreference": "physical",
      "lessonCompletedAt": "2026-11-01T15:00:00Z",
      "challengeStatus": "deferred",
      "sessions": [],
      "reviewPlan": []
    }
  }
}
```

Para uma sessão futura: `sessionId`, `kind` (initial/review/reinforcement/extra), `itemId`, `objectiveId`, instante, resposta mínima necessária, tipo de apoio, modo de correção (editorial/autodeclarada/IA), resultado e versão da rubrica. Manter o resultado inicial ao registrar revisão posterior; operações idempotentes evitam duplicar tentativa por clique ou retorno.

Rascunhos e respostas abertas precisam de limite, exclusão e explicação de armazenamento antes de serem coletados. No primeiro piloto, preferir resposta estruturada e autocorreção, evitando guardar texto livre desnecessário. Preferência de caderno é opcional e não prova que houve anotação. Não enviar texto de notas à API automaticamente.

Editor digital futuro teria modelo e chave próprios, retenção/exportação/exclusão definidos e nenhuma sincronização implícita. Não usar `decola-navigation:v1` como banco pedagógico. Não há migração automática de acertos antigos para suposto desempenho de memória.

### Convivência com recursos existentes

A princípio, duas origens de revisão identificadas: “Revisão da aula” e “Revisão do simulado”. Não mesclar índices/chaves. Antes de um painel combinado, definir identidade de objetivo e política de agrupamento para evitar duas cobranças equivalentes no mesmo dia. Reagendar uma revisão de aula não altera a nota ou a agenda legada do simulado.

A nova rodada deve ser marcada como contexto próprio. Investigar, em fase de código aprovada, como impedir um exercício de fixação redundante do chat nessa rodada sem prejudicar o comportamento do chat livre. Não alterar agora `leoLearningChallenge` nem seu histórico.

## 3. Etapas pequenas, cada uma com revisão

| Etapa futura | Entrega limitada | Critérios de aceite | Testes e evidências |
| --- | --- | --- | --- |
| 0 — Aprovação editorial | Objetivos, 3 itens, rubricas e variantes de Porcentagem | Sem ambiguidade de enunciado; revisado por responsável pelo conteúdo; distinguir cálculo, conceito e apoio | Conferência independente de contas; respostas equivalentes, parciais e incorretas; nenhuma colisão com questão atual pendente |
| 1 — Convite de registro | Bloco opcional de sugestões e escolha papel/digital pessoal/combinado; sem editor | Continuar sem preencher; sem requisição automática; não muda acertos/tentativas | Teclado, foco, 360/390/768/1280 px; regressão do Leo e leitura ao expandir/fechar |
| 2 — Desafio local | 3 perguntas revisadas, rodada inicial, autocorreção/feedback e reforço editorial | Sem nota punitiva; sem gabarito antecipado; sair/adiar não invalida aula; resultado autodeclarado identificado | Respostas certas/parciais/erradas; “não lembro”; consulta; interrupção; offline; pendentes sem vazamento de solução |
| 3 — Persistência mínima | Novo esquema versionado, rascunho limitado e histórico por objetivo | Reload restaura rodada; não modifica chaves atuais; falha de gravação avisa; exclusão seletiva | Armazenamento bloqueado/cheio/corrompido, ida/volta, duplicidade de clique, conteúdo versionado, cópia/exclusão sem apagar progresso antigo |
| 4 — Agenda local | Datas 1/3/7, adaptação e seção Revisões no Meu Decola | Uma próxima atividade por objetivo; atrasos não acumulam cobranças; extras não antecipam domínio; sem notificações externas | Relógio simulado, virada de data/fuso, atraso, repetição, acerto com ajuda, adiamento e coexistência com agenda legada |
| 5 — Leo contextual | Ajuda real sob pedido e perguntas complementares, com fallback | Respeita limite/contrato; não revela itens pendentes; cancelamento seguro; erro não apaga rodada | API controlada e real em origem autorizada; timeout/400/403/429/500/offline; 1.000 caracteres; histórico isolado; sem alegar IA real quando for fixture |
| 6 — Piloto e ajuste | Sessões assistidas e revisões D+1/D+3/D+7; relatório | Sem perda de dados ou bloqueios; clareza de propósito; ajustes aprovados antes de expansão | Roteiro abaixo, comparação de variantes e registro de dificuldades; distinguir teste de usabilidade de evidência de eficácia |
| 7 — Editor próprio | Somente após validação das etapas anteriores e aprovação específica | Papel permanece opção equivalente; salvar/exportar/excluir compreensíveis; políticas de texto definidas | Rascunho/reload/falha/limites; acessibilidade; nenhum envio automático de notas; nenhuma cobrança ou conta implícita |

A ordem é proposta. Etapas 2 e 3 podem ser desenvolvidas em sequência curta, mas o piloto que prometa retomada não começa sem persistência validada. Não exibir “Salvar e sair” antes de esse comportamento existir. Commits separados por etapa; publicação sempre separada da aprovação para desenvolver.

## 4. Piloto recomendado — Matemática / Porcentagem

### Objetivos

- O1: explicar porcentagem como razão de base 100.
- O2: calcular uma parte e usá-la para encontrar o preço após desconto.
- O3: distinguir aumento de desconto e justificar a operação final.

Preservar as três questões atuais como prática. As novas perguntas de memória usam outros valores/situações para não medir somente repetição do gabarito. Duração-alvo inicial do Desafio: 3–6 minutos, sem cronômetro obrigatório e a validar com usuários.

### Registro opcional sugerido

“Anote o que o símbolo % significa, invente um exemplo e escreva uma frase diferenciando desconto e aumento.” Papel, notas pessoais digitais e combinação são aceitos. Não exigir fotografia nem quantidade de linhas.

### Rodada inicial proposta e rubrica

**Item 1 — conceito:** “Explique com suas palavras o que significa 20%. O que o número 100 representa nessa ideia?”

- Demonstrou O1: expressa 20 a cada 100 ou razão equivalente e associa 100 à base de comparação. Não exigir a expressão exata “razão”.
- Parcial: apenas 0,2 ou 20/100, sem explicar o significado.
- Apoio: confunde 20% com 20 unidades de qualquer total; feedback pede pensar em grupos de 100, depois conferir um exemplo.
- Resposta aberta: piloto pode usar referência para autocorreção; não atribuir avaliação automática sem implementação e validação próprias.

**Item 2 — aplicação:** “Um tênis custa R$ 200 e recebe 15% de desconto. Qual será o preço final? Mostre o raciocínio.”

- Referência: 15/100 × 200 = 30 de desconto; 200 − 30 = **R$ 170**.
- Demonstrou O2: preço final correto e distinção entre abatimento e preço. Aceitar decomposição 10% + 5% ou outra estratégia válida.
- Parcial: acha 30 mas responde esse valor como preço final; reforço sobre o significado de cada grandeza.
- Apoio: cálculo sem base correta ou soma do desconto; exemplo menor seguido de variante equivalente.

**Item 3 — análise:** “Um produto de R$ 100 teve aumento de 20%. Uma pessoa respondeu R$ 80. Explique o erro e indique o preço correto.”

- Referência: subtraiu como se fosse desconto; aumento exige somar 20 ao preço inicial, chegando a **R$ 120**.
- Demonstrou O3: identifica inversão e justifica aumento/soma. Parcial: dá 120 sem explicar a diferença.
- Apoio: aceita 80; comparar verbalmente “ficar mais caro” e “ficar mais barato”, sem julgamento.

Gabaritos ficam nos dados editoriais de correção, nunca na mensagem de dica de uma tentativa pendente. Corrigir a rodada inicial depois de coletá-la evita que a solução do item 2 ensine o item 3 antes de sua primeira resposta. Consulta/explicação antecipada encerram explicitamente o modo independente do item afetado.

### Variantes para revisões, a validar editorialmente

| Sessão | Conceito/recuperação | Aplicação | Discriminação |
| --- | --- | --- | --- |
| D+1 | Explicar 25% sem olhar | R$ 160, desconto de 10% → R$ 144 | R$ 200, aumento de 5% → R$ 210; justificar por que soma |
| D+3 | Relacionar 50%, metade e base 100 | R$ 80, desconto de 25% → R$ 60 | Distinguir “valor do desconto” de “preço final” em exemplo próprio |
| D+7 | Explicar uma porcentagem em situação nova | R$ 300, desconto de 20% → R$ 240 | R$ 120, aumento de 10% → R$ 132; explicar o raciocínio |

A dificuldade dessas formas não é presumida equivalente: validar linguagem e carga de cálculo antes de comparar resultados. Evitar repetir sempre os mesmos números ou oferecer apenas múltipla escolha como evidência de recordação livre.

### Roteiro operacional de avaliação futura

1. Primeiro usar dados fictícios para validar todos os estados e a preservação dos dados atuais.
2. Depois, pequeno grupo voluntário, por exemplo 3–6 participantes, incluindo uso de celular e formatos de caderno diferentes. Esse tamanho é proposta de usabilidade, não amostra para provar eficácia.
3. Explicar que é treino, sem nota oficial. Observar se concluem, pedem ajuda, consultam e conseguem sair/retomar; não vigiar se o caderno ficou fechado.
4. Realizar rodada inicial e oportunidades posteriores. Registrar dificuldades por objetivo e forma de apoio, não apenas satisfação ou quantidade de anotações.
5. Comparar evolução individual em itens novos, com cautela sobre dificuldade das variantes, prática repetida e ajuda recebida. Autoconfiança e tempo são complementares, não provas de retenção.
6. Revisar conteúdo e interface antes de expandir para outras matérias ou editor digital.

### Critérios propostos para liberar expansão

- Zero perda de respostas/históricos e zero bloqueio obrigatório de anotação ou acerto.
- Todos os caminhos essenciais testados nas quatro larguras e por teclado; aluno consegue adiar e retomar.
- Feedback conceitualmente correto e claro em revisão editorial; nenhuma resposta simulada apresentada como IA.
- Relatório descreve quais objetivos apareceram sem ajuda e com apoio em cada data; sem nota universal de memória.
- Dificuldades observadas produzem ajustes concretos. Não anunciar eficácia, superioridade ou garantia de vestibular a partir do pequeno piloto.

## 5. Segurança do escopo e reversão futura

Nesta entrega, somente Markdown em docs/metodo-decola. Não alterar arquivos executáveis, dados de estudantes, main, Worker, cadastro, cobranças ou integrações. Nenhum agendamento externo é criado.

Na implementação futura, rollback deve desativar componentes novos sem apagar progresso existente. Chaves novas ficam isoladas; migração de versão exige leitura defensiva e política explícita de preservação. Respostas antigas permanecem intactas mesmo se o piloto for suspenso.

## 6. Decisões para aprovação

1. Aprovar ou ajustar os quatro movimentos e o convite opcional ao caderno.
2. Aprovar o piloto físico/digital pessoal, com editor integrado adiado.
3. Aprovar as três perguntas/rubricas e o modo inicial de autocorreção transparente.
4. Aprovar ou ajustar a regra de calendário e adaptação, inclusive revisões atrasadas/antecipadas.
5. Aprovar dados mínimos, retenção/exclusão e ordem das etapas; separar futura avaliação aberta por IA.

**Até essa aprovação, nenhuma implementação do método será iniciada.**
