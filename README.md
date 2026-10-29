# Decola Vestibular

**Seu sonho. Seu ritmo. Sua aprovação.**

Protótipo responsivo em HTML, CSS e JavaScript nativo, sem dependências de aplicação, cadastro, banco de dados, fontes remotas ou integrações externas.

## Executar

Requer Python 3 para servir os arquivos. No terminal:

```sh
cd /workspace/decola-vestibular
python3 -m http.server 8000 --bind 0.0.0.0
```

Se estiver em outro computador, entre na pasta onde clonou o projeto. Abra `http://localhost:8000` no navegador **do computador que está executando o servidor**. Com Node/npm disponíveis, `npm start` executa o mesmo comando. Encerre com Ctrl+C.

A prévia remota pode não estar disponível neste ambiente. Como alternativa, baixe ou clone os arquivos para seu computador, execute o comando acima e acesse pelo navegador local. Não abra `index.html` diretamente por `file://`: os módulos JavaScript precisam do servidor HTTP. O servidor de desenvolvimento não publica o site; não exponha sua porta à internet.

## Experimentar

1. Na página inicial, conheça as quatro áreas de conhecimento do ENEM e Redação, tratadas como cinco frentes de estudo.
2. Clique em **Começar meu Plano de Aprovação**.
3. Escolha um dos perfis fictícios, curso, dias por semana, tempo diário e momento de preparação.
4. Responda às cinco questões obrigatórias e gere o plano.
5. Confira o resultado e as explicações. Clique em **Ver meu plano de estudos** para abrir sua semana personalizada, marcar sessões ou recomeçar.

O plano prioriza áreas com erro, distribui uma sessão por dia e respeita o tempo escolhido. Com menos de cinco dias, indica as áreas restantes para a próxima semana. O curso aparece na apresentação; o momento de preparação é informativo. Não há estimativa de nota nem promessa de aprovação. O diagnóstico de cinco questões é apenas demonstrativo.

O progresso é salvo automaticamente no `localStorage` deste navegador, na chave `decola-vestibular:progress:v1`: perfil, respostas parciais, resultado, plano, etapa atual e atividades concluídas. F5 restaura a experiência, inclusive marcações; fechar e reabrir a aba no mesmo endereço também recupera o progresso. “Recomeçar demonstração” apaga somente essa chave e abre um perfil novo, sem limpar dados de outros sites ou aplicações. Nada é enviado a serviços externos. Use somente os perfis fictícios fornecidos.

O armazenamento depende da origem e das permissões do navegador. Uma prévia com origem isolada pode bloquear `localStorage`; nesse caso, aparece um aviso e a experiência continua sem persistência. Limpar os dados do navegador remove o progresso. Arquivos locais podem ter políticas de armazenamento diferentes entre navegadores; mantenha o mesmo arquivo e endereço para retomar.

## Testar

Com Node.js 20 ou superior:

```sh
npm test
```

Os testes verificam a priorização de áreas, carga horária, cobertura das cinco frentes e combinações de tempo disponíveis. Não é necessário executar `npm install`, nem há etapa de build. Para revisão manual, percorra o fluxo completo em telas de celular e desktop e tente enviar o diagnóstico incompleto: o navegador deve impedir o envio.

## Abrir sem instalar nada

Baixe `demonstracao.html` e abra esse arquivo diretamente no navegador. Essa versão reúne HTML, CSS e JavaScript em um único arquivo e funciona sem servidor ou conexão. Para atualizar o arquivo após alterações nos fontes, execute `python3 scripts/build-preview.py`.

No Codex na nuvem, `localhost:8000` não é um endereço acessível a partir do navegador do seu computador. Esta sessão não disponibiliza prévia privada ou encaminhamento de porta. O arquivo autossuficiente é uma alternativa sem instalação e sem publicação.

## Teste de navegação no navegador

`node tests/browser.cjs` requer Playwright e Chromium já disponíveis no ambiente de testes, além do servidor na porta 8000. Use `CHROMIUM_PATH` para indicar outro executável Chromium. Esses programas são necessários apenas para o teste automatizado; a demonstração não requer instalação.

O teste percorre perfil → diagnóstico → resultado → plano → reinício em desktop e celular, por HTTP, em iframe com origem isolada e em iframe sem permissão `allow-forms`. Verifica perguntas obrigatórias, acertos, personalização, marcação de sessões e erros JavaScript. A navegação atualiza a interface diretamente por clique, sem depender de submissão de formulário nem de mudanças de URL. A validação dos campos continua ativa. Em iframes sem `allow-forms`, o navegador bloqueia eventos de submissão antes de executar o handler; por isso os botões das etapas usam `type="button"`.

Limitação: os testes de iframe simulam restrições de uma prévia. Não representam teste na prévia integrada do Codex, cujo console e interface não estão acessíveis pelas ferramentas desta sessão.

## Teste de persistência

Com o mesmo servidor, Playwright e Chromium dos testes de navegação, execute `node tests/persistence.cjs`. Cobre a aplicação e o HTML autossuficiente via HTTP, em desktop e celular: F5 no perfil, diagnóstico parcial, resultado e plano; marcação e desmarcação de atividades; reabertura de aba; reinício sem apagar outras chaves e recuperação de dados corrompidos. Os testes de iframe verificam também o aviso de armazenamento indisponível.

## Recuperação quando a prévia não mantém armazenamento

A prévia integrada do Codex não está acessível às ferramentas desta sessão. Não há confirmação das permissões ou da origem usada por essa interface. Em um iframe com origem opaca (`sandbox` sem `allow-same-origin`), o Chromium lança `SecurityError` ao acessar `localStorage`. Uma origem diferente ou uma sessão de armazenamento descartada também não compartilha os dados da abertura anterior. O código da aplicação não pode conceder essas permissões nem recuperar dados já apagados/inacessíveis.

A demonstração verifica leitura e gravação e avisa quando o acesso está bloqueado. O botão inicial retoma o plano existente, em vez de enviar um estudante com plano ao perfil. Resultado e plano também são reconstruídos a partir do perfil e das respostas válidas ao recuperar cópias antigas.

Alternativa que não precisa de armazenamento, instalação ou publicação:

1. Antes de atualizar ou sair, abra **Salvar ou recuperar progresso**, no rodapé.
2. Clique em **Gerar cópia do progresso**. Copie e guarde o texto selecionado fora da prévia.
3. Após reabrir a demonstração, abra a mesma opção, cole o texto e clique em **Recuperar progresso**.
4. O perfil, as respostas, o resultado, o plano, a etapa e as atividades concluídas são recuperados. Gere uma nova cópia após novas alterações se o armazenamento permanecer bloqueado.

A cópia é texto JSON, apenas com o perfil fictício. Não é enviada a nenhum serviço. “Recomeçar demonstração” limpa o armazenamento do aplicativo e o campo de cópia desta sessão; cópias guardadas fora do site precisam ser descartadas pelo usuário.

`node tests/recovery.cjs` reproduz o `SecurityError`, recria o iframe e testa a recuperação pela cópia, retomada pelo botão inicial, rejeição de cópias inválidas e reconstrução de derivados ausentes. Esse teste simula uma prévia restrita, não a prévia integrada do Codex.

## Botão de cópia no plano

No topo do plano, **💾 Salvar meu progresso** abre uma janela com a cópia já gerada. Clique em **Copiar cópia de segurança** e guarde o texto. Se a área de transferência estiver bloqueada, o texto fica selecionado para cópia manual. Ao voltar à demonstração, use **Recuperar progresso salvo** no cabeçalho, cole a cópia e clique em **Recuperar progresso**. O botão **Fechar** (ou Escape) fecha a janela. A opção anterior do rodapé continua disponível. Nenhuma cópia é enviada para serviços externos.

## Verificar salvamento automático

1. Use a demonstração no mesmo endereço e navegador. Complete perfil, diagnóstico e abra o plano.
2. Marque uma atividade, atualize com F5 e confirme que o plano e a marcação reaparecem automaticamente.
3. Desmarque essa atividade, atualize novamente e confirme a desmarcação.
4. Feche a aba e reabra o mesmo endereço: a etapa, o perfil, as respostas, o resultado e o plano devem ser recuperados sem colar textos.
5. Se aparecer **Salvamento automático indisponível**, o armazenamento foi bloqueado, ficou sem espaço ou a gravação não pôde ser confirmada. Antes de sair, use **💾 Salvar meu progresso** e guarde a cópia manual. Uma origem diferente ou armazenamento descartado pela plataforma não pode ser recuperado automaticamente pela aplicação.

A gravação ocorre a cada marcação/desmarcação, alteração de perfil ou resposta e navegação. O código confere a gravação por leitura e preserva a experiência em memória em caso de falha; o aviso é removido após uma nova gravação confirmada. Não é usado banco de dados ou serviço externo. Visual, perguntas e etapas permanecem iguais.

`node tests/storage-failures.cjs` testa falta de espaço e gravações que falham sem lançar erro, preservação do backup e recuperação após o armazenamento voltar a funcionar. Requer o servidor local e o mesmo Playwright/Chromium dos demais testes. A prévia integrada do Codex não está acessível às ferramentas desta sessão; os testes de iframe são simulações com restrições reais do navegador.
