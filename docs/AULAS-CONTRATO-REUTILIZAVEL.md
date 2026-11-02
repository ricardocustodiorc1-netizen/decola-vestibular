# Contrato de aula reutilizável e preparação Elvis

## Separação adotada

`percentage-content.js` é a definição imutável de Porcentagem: identidade, chave de progresso, questões, alternativas, gabaritos, resoluções, dicas e migrações permitidas. `lesson-progress.js` guarda respostas locais; `lesson-navigation.js` apenas rola e move foco; `leo-client.js` continua sendo o transporte textual existente; `lesson-audio.js` reproduz apenas gravações catalogadas; `leo-audio.js` continua com a voz do navegador nas respostas dinâmicas.

Porcentagem usa esses novos componentes; as outras aulas não foram migradas em massa. Isso permite validar o contrato antes de uma mudança ampla nos dados já existentes.

## Definição para próximas aulas

Cada questão deve ter `id` estável, `q`, `opts`, `answer`, `why` e `hints`. Não mudar o significado de uma questão mantendo a mesma versão de progresso. Ao alterar uma questão, criar uma chave versionada e declarar explicitamente quais índices antigos continuam semanticamente idênticos. Nunca importar pelo simples fato de a posição da alternativa correta ser a mesma.

```js
const progress = DecolaLessonProgress.create({
  storage: localStorage,
  key: 'decola-smart-nova-aula-v1',
  questions,
  migrations: []
});
// read() devolve uma cópia; save() valida e devolve o resultado de persistência.
// Mostrar issue() ao aluno. reset() depende do botão explícito de reinício.
```

O formato mantém os índices usados pelas aulas existentes: `{0:{choice,attempts,done}}`. Há no máximo duas tentativas por questão. A escolha pode ser `null` somente entre a primeira tentativa errada e a segunda. Registros incompatíveis são mantidos no storage; a sessão pode continuar sem sobrescrevê-los. A chave só será reiniciada por ação explícita do aluno. Registros antigos de outras versões, simulados e Desafio não são apagados.

Em falha de gravação, uma cópia em memória permite ir ao menu e voltar durante a mesma sessão. Fechar/recarregar a página ainda perde o que não foi persistido; o aviso não promete recuperação entre sessões. Alterações concorrentes em outra aba não são sobrescritas: reabrir a aula lê a versão que estiver no armazenamento. Não há sincronização entre dispositivos.

## Navegação

`DecolaLessonNavigation.mount({host,steps})` recebe `{id,label,target}`. O retorno `go(id)` usa rolagem e foco, sem esconder partes da aula ou alterar respostas. Não usar a navegação como uma nova máquina de progresso. Etapas opcionais não devem bloquear a próxima aula.

## Áudio editorial e áudio dinâmico

- Texto editorial: catálogo por identidade de aula, fase, revisão e transcrição conferida. Um arquivo de dica nunca contém resolução escondida no final.
- Resposta dinâmica da IA: não substituir por um MP3 fixo de assunto parecido. A leitura atual do navegador continua identificada como voz do dispositivo.
- Os dois componentes novos de áudio compartilham `decola:audio-start`, com `source: 'browser'` ou `'mp3'`. Iniciar um cancela o outro, inclusive pausado. A coordenação não monta áudios novos nas aulas.
- Ocultar/remover a área, recolher um `details` ou sair da aba interrompe a reprodução. MP3 que não inicia em 15 segundos libera os controles com mensagem de erro.
- O caminho do MP3 é resolvido em relação ao módulo, não à página que monta o componente. Assim, o mesmo componente funciona em páginas de teste dentro de subpastas.

O piloto 3.4 antigo permanece isolado, com seu player original intacto. O evento compartilhado cobre `leo-audio.js` e `lesson-audio.js`; não foi aplicado retroativamente a todos os players legados.

## Preparação HeyGen Elvis — sem chamada de geração

Fornecedor informado pelo usuário: **HeyGen**. A decisão não identifica automaticamente o voice ID ou o motor compatível. O catálogo editorial registra fornecedor conhecido e deixa `voiceId` e motor pendentes. Não usar a voz Will nem outra voz como substituição silenciosa.

O MP3 existente tem SHA-256 `2b10401eaf19166e7e0a9bc26aa8c673c11efb59702f3c1dd9a427d13298fb58`. Ele e o piloto 3.4 não foram alterados. Sua transcrição integral ainda precisa de escuta humana, conforme a aprovação editorial condicionante. Não se atribuiu automaticamente a ele outro texto na aula principal.

Para futura produção autorizada:

1. Confirmar no HeyGen a identidade Elvis, o motor permitido e o custo/cota da conta; não clonar voz nem criar credenciais nesta etapa.
2. Autorizar por lote/ID o texto, a voz e um limite de gasto. Aprovação editorial não equivale a aprovação de cobrança.
3. Gerar fora do navegador do aluno. Manter chaves apenas no serviço autorizado; nunca no catálogo ou HTML. Esta entrega não cria esse serviço nem altera o Worker.
4. Conservar o original, medir duração, conferir fala versus transcrição (incluindo números, omissões e repetições), registrar hash, revisão e aprovação.
5. Só promover uma entrada para reprodução depois dessas conferências e da autorização de integração. A aula deve exibir a transcrição efetivamente falada; não afrouxar o resolvedor para encaixar um roteiro diferente.
6. Testar primeiro uma gravação adicional em desenvolvimento. Não expandir todas as aulas nem publicar como parte dessa autorização.

O pacote editorial de 16 roteiros continua separado do catálogo executável. Nenhum áudio novo foi gerado, importado ou integrado neste sprint. A criação de cadastro, limites pagos de API, editor de caderno e revisões automáticas continua fora do escopo.
