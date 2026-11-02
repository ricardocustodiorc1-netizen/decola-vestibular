# Porcentagem — ajustes condicionantes para validação editorial

Data: 02/11/2026. Base editorial: commit `bfdcb96`. **Proposta de alteração, sem integração, geração de áudio ou publicação.**

## Decisão recebida
Os lotes A e B estão aprovados **condicionalmente** a: (1) evitar que o exemplo gravado E01 antecipe a resposta da questão 1; (2) garantir transcrição visível idêntica ao texto falado em cada áudio. Esta aprovação não autoriza gerar MP3s, gastar créditos, integrar arquivos, alterar produção, main ou Worker.

## Ajuste 1 — primeira questão da prática

O MP3 E01 existente explica 20% de R$ 150 = R$ 30. A questão 1 atual em `study-area.js` pergunta exatamente `Quanto é 20% de 150?`, com alternativas `20, 30, 35`. Assim, o exemplo entrega a resposta antes da prática.

**Proposta editorial a validar (ainda não aplicada ao código):**
- Enunciado Q1: **Quanto é 20% de 180?**
- Alternativas: **30 | 36 | 40** (correta: 36, posição 2).
- Resolução escrita: **20 ÷ 100 = 0,20; 180 × 0,20 = 36.**
- Dica escrita 1: **20% significa 20 de cada 100. Transforme 20% em decimal antes de multiplicar.**
- Dica escrita 2: **Calcule 10% de 180 e depois dobre esse valor.**
- Roteiro D01 substituto: **Vamos por partes. A pergunta pede vinte por cento de cento e oitenta. Primeiro, transforme a taxa em uma divisão por cem. Depois, multiplique pelo total. Outra estratégia é descobrir dez por cento e pensar em como chegar a vinte por cento. Qual dessas maneiras você consegue começar?**
- Roteiro S01 substituto: **Vinte por cento de cento e oitenta é trinta e seis. Primeiro, vinte dividido por cem é zero vírgula vinte. Depois, cento e oitenta vezes zero vírgula vinte é trinta e seis. Você também pode calcular dez por cento: cento e oitenta dividido por dez é dezoito. O dobro de dezoito é trinta e seis. Os dois caminhos chegam ao mesmo resultado.**

**Atenção antes de qualquer implementação futura:** `study-area.js` guarda progresso na chave `decola-smart-percent-v2` e importa acertos de `decola-smart-percent-v1` por índice/posição da alternativa. Trocar a questão e a posição da resposta correta sem versionar/migrar o progresso pode reaproveitar respostas antigas indevidamente. Uma implementação futura deverá definir versão de questão e política de migração segura, preservar os registros anteriores, atualizar testes e verificar outras referências ao enunciado. O piloto 3.4 do tênis, o exemplo E01 e o Desafio da Memória não mudam.

## Ajuste 2 — correspondência entre áudio e transcrição

**Regra de aceitação por ID:** o texto integral visível ao aluno deve ser exatamente o texto efetivamente falado no MP3 correspondente, com conferência humana da gravação (palavras, números, ordem e omissões), não apenas o roteiro planejado. A identificação da aula, da etapa, do estado de liberação e do áudio deve ser inequívoca. Se a gravação diferir do roteiro, **não tocar como se correspondesse**: registrar divergência e submeter transcrição/roteiro à revisão. Não afrouxar a correspondência estrita do catálogo para forçar encaixe.

- **E01 existente:** preservar `audios/leo-explicacao-elvis.mp3` sem recodificar ou sobrescrever. Conferir auditivamente sua transcrição antes de reaproveitar na aula principal; o roteiro atual não prova identidade literal do áudio.
- **H01, C01, N01, D01–D03, S01–S03, M00, MD01–MD03, MR01–MR03:** até existir MP3 gravado e validado, mostrar somente roteiro/transcrição **proposta**, sem botão que prometa áudio pronto. D01 e S01 usarão os textos substitutos acima se a alteração da questão for aprovada.
- **Dicas e resoluções:** só disponibilizar a transcrição e seu áudio quando a regra pedagógica de liberação correspondente estiver satisfeita; a transcrição não pode revelar a resolução na primeira tentativa errada.
- **Acessibilidade:** transcrição em texto legível, disponível quando o áudio correspondente estiver liberado, controles acionados pelo usuário, sem reprodução automática.

## Checklist de validação antes de integrar
- [ ] Aprovar novo enunciado, alternativas, D01 e S01.
- [ ] Conferir que a primeira questão não é resolvida por E01 e que as contas estão corretas.
- [ ] Decidir como versionar/migrar progresso local da Q1 sem apagar histórico.
- [ ] Conferir transcrição de E01 contra o MP3 real, com escuta humana.
- [ ] Após geração **separadamente autorizada**, conferir individualmente os 16 MP3s contra as respectivas transcrições.
- [ ] Validar regras de acesso a dica/resolução e teste em Android físico.
- [ ] Obter autorização independente para integrar e outra para publicar.

**Escopo desta entrega:** apenas este documento editorial na branch `dev/navegacao-leo-familias-20261031`. Nenhum código executável, catálogo operacional, áudio, Worker, main, cobrança ou site oficial é alterado.
