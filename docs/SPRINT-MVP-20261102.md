# Sprint MVP — auditoria, Porcentagem e preparação Elvis

Data: 2 de novembro de 2026. Branch exclusiva: `dev/navegacao-leo-familias-20261031`. Base incorporada: `2298794`, incluindo a revisão aprovada da questão 1 para 20% de 180. Trabalho dividido nas três frentes previstas para o sprint; a execução técnica ocorreu nesta sessão, sem afirmar três dias decorridos ou trabalho agendado em segundo plano.

## Entregas por frente

| Frente do sprint | Entrega | Situação |
| --- | --- | --- |
| Dia 1 — Auditoria e base | 66 testes iniciais; identificação de leitura de progresso v2 após migração para v3; acesso ao Desafio só no bundle; risco de sobrescrever JSON inválido; reinício que reimportava respostas antigas | Corrigido em desenvolvimento |
| Dia 2 — Jornada de Porcentagem | Conteúdo centralizado, persistência validada, retomada/painel alinhados, quatro atalhos acessíveis e acesso direto ao Desafio no código-fonte | Implementado e testado |
| Dia 3 — Voz, reutilização e regressão | Exclusividade MP3/voz nativa, fechamento de detalhes, tempo limite, caminho de áudio reutilizável, contrato para novas aulas, regressão e documentação | Preparação técnica concluída; áudio novo/publicação dependem de aprovação |

## Problemas confirmados e correções

1. **Versões de progresso divergentes:** a prática salvava `decola-smart-percent-v3`, mas Meu Decola, Meu progresso e a retomada usavam v2. Agora o painel usa a definição central; metadados antigos de navegação são normalizados para v3. A Q1 antiga não é importada. Somente Q2/Q3 inalteradas migram, mantendo v1/v2 intactas.
2. **Reinício incompleto:** apagar v3 fazia a abertura seguinte importar Q2/Q3 de novo. O botão agora grava uma versão atual vazia; dados antigos e Desafio permanecem preservados.
3. **Storage frágil:** JSON inválido, arrays, escolhas impossíveis e estados inconsistentes não são regravados automaticamente. Falha de quota, escrita silenciosa ou alteração em outra aba é informada. As respostas válidas ficam em memória durante a sessão, inclusive ao voltar pelo menu.
4. **Navegação longa:** atalhos Entender/Registrar/Praticar/Recordar rolam e movem foco, sem esconder a aula. O relatório ganhou no fonte o acesso direto ao Desafio que antes existia apenas em alteração manual do bundle. O gerador agora preserva essa funcionalidade.
5. **Áudio futuro poderia sobrepor motores:** os componentes de MP3 e speechSynthesis agora coordenam exclusividade. Recolher detalhes também interrompe; MP3 travado tem tempo limite de 15 segundos.
6. **MP3 quebrava em subpastas:** falha observada na fixture real e corrigida resolvendo a URL a partir de `lesson-audio.js`. O mesmo arquivo toca sem depender do endereço da página chamadora.
7. **Teste editorial sem efeito:** substituída uma comparação tautológica por conferência real do caminho e SHA-256 do MP3. Os testes de Q1 passaram a verificar a definição de conteúdo e a migração real, em vez da formatação do fonte.

## Conteúdo e condições pedagógicas

Q1: 20% de 180 = 36; Q2: camiseta de R$ 80 com desconto de 10% = R$ 72; Q3: R$ 120 com aumento de 25% = R$ 150. IDs e regras do Leo permanecem preservados. Dica após primeiro erro não inclui gabarito; resolução só após acerto ou duas tentativas. Perguntas complementares continuam no painel da questão. O convite geral ao tutor não preenche uma resposta pronta de questão.

O Desafio conserva três perguntas, rascunhos, adiamento, “Não lembro ainda”, autocorreção e reforço sem punição. A próxima aula continua acessível independentemente de acertar todos os itens do Desafio. O MP3 Elvis do piloto 3.4 não foi associado às respostas da nova Q1.

## Arquivos principais

- `percentage-content.js`: identidade e conteúdo de Porcentagem, chave e política de migração.
- `lesson-progress.js`: persistência reutilizável, validação, proteção de dados antigos e memória de sessão.
- `lesson-navigation.js`: atalhos reutilizáveis de etapa.
- `study-area.js`, `study-session.js`, `study-area.css`: montagem, painel, retomada, relatório e controles para celular.
- `index.html`, `scripts/build-preview.py`, `demonstracao.html`: dependências e demonstração atualizada a partir do fonte.
- `leo-audio.js`, `lesson-audio.js`: ciclo de áudio e exclusividade; sem novo provedor ou arquivo de voz.
- `tests/sprint-regression.test.mjs`, testes editoriais e de áudio: regressão ampliada.
- `tests/audio-focus-review.html`, `tests/leo-inline-review.html`: fixtures explícitas, sem IA real; a segunda permite simular falha de salvamento.
- `docs/AULAS-CONTRATO-REUTILIZAVEL.md`: contrato de expansão e preparação HeyGen.
- Catálogo/roteiros editoriais: fornecedor atualizado para HeyGen conforme instrução do usuário; voice ID/motor/tarifa permanecem pendentes. Textos aprovados não foram reescritos.

## Testes

**80 testes automatizados aprovados, 0 falhas**; base inicial com 66, acréscimo de 14. Cobertura nova: migração Q2/Q3 e proteção da Q1, versão atual/segunda tentativa, reinício sem reimportação, dados incompatíveis, quota e conflito, preservação de sessão ao navegar, retomada v2→v3, regras pedagógicas da Q1 nova, MP3 pendente/erro/caminho relativo e navegação de etapas. O teste de foco de voz confirma que MP3 interrompe leitura nativa. As suítes anteriores continuam cobrindo transporte do Leo, histórico/contexto, falhas, Desafio e plano.

Build da demonstração executado; scripts embutidos conferidos com `node --check`; `git diff --check` sem problemas. O gerador da demonstração foi conferido por repetição determinística.

### Navegador remoto

| Cenário | Resultado |
| --- | --- |
| Q1 errada, Leo contextual e pergunta complementar | Contexto de 180, tentativa restante, sem campo de gabarito; resposta controlada explicitamente marcada como teste |
| Segunda tentativa correta e segunda tentativa errada | Correção e conclusão apropriadas; resolução disponível ao esgotar |
| Q2/Q3 corretas | Relatório, reforço e Desafio liberados |
| Quatro atalhos e acesso direto ao Desafio | Foco e rolagem funcionando sem perda de respostas |
| Desafio: rascunho, adiar/retomar, responder e “Não lembro” | Rascunho preservado; referências após as três respostas |
| Reinício da prática | Não apagou rodada do Desafio; rodada reapareceu ao concluir a prática novamente |
| API 503 e falha de conexão simuladas | Resolução local ou dica local conforme tentativas; aviso explícito de conteúdo sem IA |
| Falha de salvamento simulada | Aviso sem prometer persistência; resposta preservada ao ir ao menu e reabrir |
| Meu Decola e retomada | Exibiu 3/3 da versão atual; resposta/foco mantidos ao retornar |
| Próxima aula, simulado e chat original | Frações acessível; uma resposta do simulado registrada e avanço à questão 2; chat aberto sem chamada externa |
| 360, 390, 768 e 1280 px | Painel sem transbordamento horizontal; botões dos novos atalhos com 48 px de altura |
| MP3 Elvis real em subpasta | Carregamento e pausa aceitos após correção da URL |
| Exclusividade de áudio | MP3 real interrompeu voz nativa controlada; voz controlada interrompeu MP3 pausado; fechar details cancelou leitura |

Não confundir as respostas controladas de teste com IA real ou a voz nativa controlada com áudio natural ouvido. A integração real da API não foi retestada nesta sessão. O MP3 foi o arquivo real existente; não houve nova avaliação auditiva humana do timbre/transcrição nem teste em Android físico. Largura de iframe não emula sistema de voz do Android.

## Validação local

```sh
git switch dev/navegacao-leo-familias-20261031
npm test
npm run dev
```

- `http://127.0.0.1:8000/`: Meu Decola → Porcentagem, fluxo real da aplicação. Solicitar Leo aqui faz chamada ao Worker existente; este relatório não afirma disponibilidade atual da API.
- `http://127.0.0.1:8000/demonstracao.html`: bundle atualizado. Conteúdo é independente de build; o Leo ainda depende de rede/origem autorizada.
- `http://127.0.0.1:8000/tests/leo-inline-review.html?audio=mock`: interface, erro, intervalo, armazenamento e larguras controlados, sem resposta real da IA.
- `http://127.0.0.1:8000/tests/audio-focus-review.html`: MP3 Elvis real e voz nativa controlada para testar exclusividade.
- `http://127.0.0.1:8000/piloto-professor-leo-3-4.html`: piloto original preservado.

## Limitações e próximas prioridades

1. Escuta humana de E01 versus transcrição integral. Preservar MP3 e resolver eventual divergência no texto com aprovação, antes de reutilizá-lo na aula principal.
2. Confirmar voice ID, motor/cota e limite de custo do HeyGen Elvis. Nenhum segredo foi solicitado ou exposto; não substituir por Will. Geração paga e novos arquivos exigem aprovação.
3. Validar a versão final no Edge e no Chrome de um Android físico. Atualizar a prévia HTTPS depende de autorização de publicação separada; nenhuma hospedagem foi atualizada aqui.
4. Validar IA real na origem local já autorizada, com os casos de dica, solução e complemento. O Worker permanece intacto.
5. Migrar uma aula por vez para os componentes reutilizáveis. As demais aulas ainda têm persistência legada; não presumir que a proteção de Porcentagem já cobre todas elas.
6. Para lançamento comercial ainda faltam decisões e implementação autorizada de cadastro/autenticação, sincronização de progresso, assinaturas e WhatsApp. Isso não foi criado neste sprint.

Não houve alteração de main, merge, deploy, GitHub Pages, Worker, cobranças ou credenciais. Nenhum áudio pago foi gerado e nenhum novo MP3 foi integrado. Piloto 3.4, MP3 existente, cliente do Leo, perguntas/rubricas do Desafio e simulados permaneceram intactos em seus arquivos originais.
