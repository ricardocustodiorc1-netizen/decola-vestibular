# Etapa 2C — matriz de homologação futura

Plano, não execução. Toda chamada remota e toda criação/mutação/limpeza precisa do escopo de autorização correspondente. Dois alunos fictícios: A/Horizonte e B/Estrela. Não criar identidades adicionais para ampliar cobertura sem nova autorização; estados podem ser testados sequencialmente nas mesmas fixtures apenas com permissão de mutação e restauração.

| ID | Caso / estímulo | Prova exigida | Camada / permissão futura |
|---|---|---|---|
| P01 | Projeto, organização, região ou schema divergente | Abort antes de cliente de escrita | Preflight; leitura dirigida |
| P02 | Segredo ausente, incorreto, papel excessivo ou URL com override | Bloqueio, nenhuma identidade criada, log sanitizado | Config/local; inspeção autorizada |
| P03 | Outra execução ativa / lease vencido | Exclusão mútua e reconciliação antes de retomar | Ledger/controle concorrente |
| A01 | Criar A/B com referências únicas aprovadas | IDs confirmados, marcador administrativo e ledger correspondentes | Auth Admin; criação de duas fixtures |
| A02 | Identidade preexistente / e-mail duplicado | Nenhuma adoção, reset, reatribuição ou exclusão | Pré-checagem; leitura restrita |
| A03 | Timeout após possível criação | Estado auth_unknown, sem retry cego | Injeção local; remoto apenas se autorizado |
| A04 | Primeira criação aceita e segunda falha | Estado individual e plano de reconciliação; sem deleção automática | Local + ensaio controlado |
| A05 | Login A/B e senha errada | Sessões separadas; negativa sem segredo/enumeração | Auth real; contas fictícias |
| A06 | Token ausente, adulterado, expirado, issuer/audience errado | HTTP nega antes de operação; não depender de sub informado | API/BFF, tokens de teste |
| A07 | Conta não confirmada/banida/excluída/desativada | Negação consistente nas rotas/RPC/dados protegidos | Mutação de estado exige aprovação |
| A08 | Confirmação/recuperação de e-mail | Link único/expirado, redirect exato, resposta genérica | Caixa e entrega autorizadas, escopo separado |
| L01 | Falha na segunda vinculação | Rollback confirmado, sem vínculo parcial | Transação fixture aprovada |
| L02 | COMMIT/ROLLBACK com resposta perdida | Estado link_unknown, conexão descartada, nova inspeção | Injeção local e reconciliação |
| R01 | SELECT sem filtro como aluno A/B | Só linhas próprias, na direção A→B e B→A | SQL sob papel real e HTTP com token real, separados |
| R02 | ID de outro aluno em leitura/escrita/RPC | Zero exposição e nenhuma alteração em B | Grants/RLS/BFF |
| R03 | INSERT/UPDATE/DELETE direto de aluno, trial ou pagamento | Permissão negada; preço/dono/prazo imutáveis ao cliente | Escritas negativas controladas |
| R04 | user_metadata com privilégios/ID de outra conta | Nenhuma concessão de acesso | Claims editáveis são não confiáveis |
| R05 | Cliente anônimo e usuário Auth anônimo | Nenhuma autorização pelo mero papel authenticated | Verificar configuração e identidade |
| R06 | Schema não exposto e helper privado | API não acessível indevidamente; assert_student sem EXECUTE cliente | Metadados + HTTP autorizado |
| R07 | Role/JWT em conexão reutilizada | Sem herança entre A/B após rollback; falha descarta conexão | Pool/SQL real |
| T01 | Visita sem pedir teste | Não cria claim, assinatura ou cobrança | Backend/SQL fixture |
| T02 | Início explícito e repetição concorrente | Uma concessão, 168h, mesmos limites | Transação/locks reais |
| T03 | Instante inicial, imediatamente antes do fim e fim exato | Acesso conforme intervalo fechado/aberto | Modelo offline + ensaio determinístico futuro |
| T04 | Cancelar e tentar reiniciar | Direito encerrado, mesmo claim e progresso intacto | Mutação aprovada |
| T05 | Expiração simulada sem alterar relógio global | Estudo negado, progresso próprio legível; rollback confirmado | Datas de fixture só com aprovação |
| T06 | Início e cancelamento simultâneos | Sem cancelamento perdido de trial já existente | Sessões/locks Postgres |
| T07 | Recriar aluno com mesma elegibilidade | Sem nova concessão | Exclusão/recriação tem autorização própria |
| G01 | Progresso A/B e primeira tentativa errada | Isolamento, tentativas preservadas, sem perder respostas | Fixtures + jornada local/futura UI |
| G02 | Import repetido, conflito e lote interrompido | Idempotência, sem overwrite e rollback do lote | Futuro adaptador separado |
| C01 | Revogar sessão e remover fixture autorizada | Refresh bloqueado; política de access token provada | Não concluir apenas pela remoção Auth |
| C02 | Limpeza SQL falha | Interromper antes de Auth delete e inventariar resíduos | Teste local; remoto com permissão |
| C03 | Limpeza Auth falha após banco | Estado parcial, reconciliação restrita e nenhum sucesso falso | Teste local + escopo de remoção |
| C04 | Dado fora do run/dependência desconhecida | Bloqueio de limpeza e decisão humana | Ledger + inventário dirigido |
| C05 | Release/end falha ou processo cai | Estado reconciliável e recursos/sessões tratados | Injeção local / novo executor futuro |
| S01 | Falha contendo segredo, token ou corpo pessoal | Nada sensível em stdout/stderr/artefato | Sentinelas locais e redaction futura |
| S02 | Limite de duração/chamadas/custo | Interromper novas operações e pedir decisão | Não fazer upgrade/retry ilimitado |

## Critério de encerramento por camada

Cada evidência identifica run, commit/hash, alvo, papel, método (test double / SQL / HTTP real), pré-condição, resultado esperado, observado e resíduos. Nenhum caso vira PASS por não ter sido executado. Usar estados PASS, FAIL, BLOCKED ou NOT_RUN e justificar bloqueios.

Uma execução só pode ser considerada homologação integrada aprovada se os casos obrigatórios de Auth HTTP, grants/RLS, propriedade, trial e reconciliação previstos para aquele escopo forem comprovados, não houver vazamento de dados ou resíduos sem decisão, e o estado de encerramento estiver reconciliado. Casos de e-mail/limpeza sem autorização ficam NOT_RUN e limitam a conclusão; não os omitir do relatório.

Não exige teste de pagamento, assinatura financeira, Asaas, Worker, dados reais ou publicação. Não afirmar que checklist, código revisado ou teste SQLite aprovam o serviço comercial.

## Resultado desta Etapa 2C

Somente os testes offline já existentes foram repetidos. Os casos remotos da tabela permanecem NOT_RUN. A relação de execuções locais e riscos não cobertos está no relatório de revisão.
