# Meu Decola — proposta para aprovação

Status: cinco etapas aprovadas pelo usuário e implementadas na branch de desenvolvimento. Sem publicação. Resultados em `MEU-DECOLA-NAVEGACAO-ENTREGA.md`.

## Diagnóstico do código atual

- O painel mostra Continuar estudando e cinco atalhos; cabeçalho fixo tem Meu Decola, Aulas, Professor Leo e Simulados. Exercícios e Meu progresso dependem de voltar ao painel.
- O botão Continuar estudando não registra a última aula visitada: escolhe uma aula com questões concluídas e ordena pela quantidade de conclusões (`studyPaths`, `lessonStats`, `showDashboard` em study-area.js). Uma primeira tentativa errada, sem conclusão, não conta para essa seleção. É uma oportunidade de navegação a tratar nesta segunda fase.
- Há retornos no cabeçalho e dentro do conteúdo. O chat original já tem retorno à aula; o Leo inline deve continuar ligado à questão.
- Matérias, exercícios e ferramentas antigas possuem entradas distintas; nenhuma delas deve ser removida durante a reorganização.

## Entregas propostas, em ordem

| Etapa | Mudança concreta | Critério de aceite |
| --- | --- | --- |
| 1 — Retomar atividade | Registrar localmente última aula/questão visitada e posição, separadas dos acertos; usar esse destino em Continuar estudando | Após um erro, sair e retornar leva à mesma aula/questão com tentativa intacta; primeiro acesso tem destino inicial explícito |
| 2 — Menu consistente | Mesmo conjunto de destinos no desktop e celular: Meu Decola, Aulas, Exercícios, Leo, Progresso e Simulados. No celular, menu compacto acessível, com item ativo e fechamento por teclado | Todos os destinos acessíveis em até 2 ações a partir de qualquer tela; nenhum conteúdo coberto pelo menu |
| 3 — Orientação e retorno | Identificação clara de matéria, assunto e etapa; um retorno principal por nível. Preservar o retorno contextual do chat e a explicação inline | Percurso Meu Decola → Aulas → Matemática → Porcentagem → Leo → aula funciona nos dois sentidos, sem reiniciar respostas |
| 4 — Organização dos cartões | Separar Retomar atividade, aulas disponíveis e atalhos. Indicar concluída/em andamento/disponível; manter ferramentas antigas acessíveis | Nenhum recurso atual fica sem caminho; estados correspondem ao progresso armazenado |
| 5 — Validação | Repetir auditoria do Leo, respostas, persistência e navegação em 360/390/768/1280 px; teclado, Escape e foco; aulas, exercícios e simulados | Zero regressões na suíte; sem rolagem horizontal; fechar painel/menu devolve foco e não apaga progresso |

## Preservação dos dados e reversão

Não renomear nem apagar chaves atuais de progresso e históricos. Acrescentar apenas uma chave versionada de navegação com leitura defensiva; registro ausente/inválido volta ao destino inicial. O novo estado não deve conter dados pessoais, redações ou conversas. Separar commits de retomada, menu e organização para permitir reversão individual sem apagar respostas existentes. Não transformar dados locais em uma conta ou sincronização implícita.

## Fora do escopo desta aprovação

Sem implantação, main, merge, cobrança, cadastro real, backend de contas, novas permissões CORS ou mudanças no Worker. Laboratório de Redação continua no plano específico existente; não é implementado por esta proposta.

## Aprovação e execução

As cinco etapas foram aprovadas e executadas na mesma branch de desenvolvimento. A publicação continua dependendo de autorização separada.

## Espaço futuro: Caderno Decola

A organização em seções independentes (retomada, aulas, atalhos) permite acrescentar futuramente um espaço de ferramentas pessoais, sem misturá-lo à lista de matérias ou à conversa do Leo. Proposta futura: Caderno Decola reuniria orientações para anotações em papel ou digitais e atividades de recuperação de memória, com retorno à aula de origem. Essa separação evita exigir digitação de quem prefere caderno físico.

Nesta entrega não há botão ativo, editor, armazenamento de anotações, avaliação de memória, lembretes ou chamadas de IA para o Caderno. Seu modelo pedagógico, persistência, privacidade e eventual integração com o Leo dependerão de um plano e aprovação próprios.
