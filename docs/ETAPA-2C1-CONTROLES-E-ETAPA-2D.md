# Etapa 2C.1 — controles implementados e preparação da Etapa 2D

02/11/2026. Branch exclusiva `dev/navegacao-leo-familias-20261031`. O commit **local** `46f096bf2717ee95ea89064f74fd2d3d9971d51a` foi confirmado e os quatro documentos `docs/etapa2c/` foram lidos. Não se presumiu publicação desse commit. Base de implementação: esse commit local.

## Entregue

| Controle | Implementação / evidência |
|---|---|
| Ledger durável | SQLite nativo Node 22, WAL/FULL, transação por mutação, run ID UUID, alvo, revisão, operações, recursos e eventos; confirmação após gravação |
| Estados | Treze estados exigidos, transições permitidas, autorização, retenção e encerramento; salto/repetição perigosa rejeitados |
| Concorrência | Lease exclusivo por projeto no banco local, owner/epoch, heartbeat e fencing; dois processos disputam a mesma trava sem dois vencedores |
| Interrupção | Intenção permanece após SIGKILL; takeover converte pending em auth_unknown/link_unknown/reconcile_required, sem reexecutar escrita |
| Resultado desconhecido | Falha/timeout/retorno inválido classificado conservadoramente; callbacks tardios não confirmam ledger |
| Reconciliação | Referência e evidência definitiva declaradas, alvo/run/IDs conferidos; confirmação/ausência/inconclusão separadas; retomada explícita |
| Conexão incerta | Vínculo desconhecido exige evidência de descarte/quarentena antes de reconciliação definitiva; falha de descarte continua bloqueada |
| Identidade preexistente | Origem protegida, sem adoção/limpeza; registro global local impede adotar recurso de outro run |
| Limpeza | Inventário → plano com hash → aprovação específica → execução remota BLOQUEADA → verificação posterior; incompletude revoga aprovação |
| Sessões | Contrato de refresh revogado + acesso negado e referência de evidência, vinculado ao inventário; rejeita token/campos extras |
| Orçamento | Duração, timeout por chamada, chamadas, concorrência e tentativas; limites persistidos, sem retry automático de writes; relógio retrocedendo bloqueia mutações |
| Executor | `runStage2B` passa pelo controlador/ledger e aceita somente fábrica offline conhecida; fluxo antigo de cleanup automático removido |
| Restrições | run/create CLI continuam negados, SDK/segredos/transportes reais não são aceitos pelo cenário offline; nenhuma chamada ao Supabase |

A operação `retained` registra decisão, não retenção ilimitada. Um run diferente não assume projeto com execução antiga desconhecida. O ledger guarda tombstones de propriedade para evitar adoção de ID de outro run. Recriar duas personas só é permitido por operações explícitas e aprovadas: nenhuma escrita desconhecida é repetida pela rotina.

## Estados e reconciliação

- planned → authorized antes de qualquer operação.
- create_pending → auth_confirmed ou auth_unknown.
- auth_confirmed pode iniciar a segunda criação ou link_pending; IDs de Auth devem ser distintos.
- link_pending → linked ou link_unknown; linked → testing.
- unknown/recuperação/falha levam a reconcile_required, sem nova escrita automática.
- Confirmação/ausência só podem ser atestadas com `definitive:true` e referência. Isso é um contrato, não verificação remota. Read vazio ou erro não equivale a inexistência.
- Retomada exige autorização registrada, sem pending/unknown e estado compatível com recursos confirmados. Ausência reconciliada não torna a mesma escrita repetível.
- retained registra decisão após resolver ambiguidades. cleanup_approved exige plano atual, aprovação própria e evidência de sessão. cleaned exige observações de ausência exatas de todos os IDs do plano.
- Lease recuperado invalida aprovação/evidência anterior; owner antigo não pode confirmar retorno atrasado. Falhas de limpeza voltam para reconciliação.

## Bloqueadores da Etapa 2C

| Item anterior | Resultado desta entrega | Limite remanescente |
|---|---|---|
| B01/B04 — memória, crash e execução duplicada | Resolvido no controle local: ledger e lease/fencing | Backup, retenção, host confiável e operação em máquina única |
| B02 — API com resultado ambíguo | Estado desconhecido persistido, sem retry; reconciliação explícita | Adaptador remoto deverá obter prova definitiva/quietude do provedor; não basta consulta instantânea vazia |
| B03 — cleanup automático | Removido do executor; plano/aprovação/verificação separados, remoto bloqueado | Implementar executor real de limpeza apenas em escopo futuro aprovado |
| B05 — enumeração global de Auth | Removida do cenário; inspeção dirigida à persona no adapter offline | Método remoto dirigido e autorizado ainda não implementado/validado |
| B06 — sessões | Contratos/evidência local e bloqueio de aprovação sem revogação/negação declaradas | Nenhuma sessão real foi revogada; validar serviço e tokens reais na 2D |
| B07 — SQL não prova Auth HTTP | Camadas explicitadas e nenhum PASS remoto emitido | Adaptadores Auth/API/RLS reais e testes integrados são parte da 2D |
| B08 — COMMIT/ROLLBACK incerto | Estado link_unknown, bloqueio até quarentena e reconciliação | Descarte físico de conexão e leitura canônica precisam do adapter real |
| B09 — limites | Implementados no ledger/coordenador, inclusive callbacks que ignoram abort | Abort não desfaz efeito de provedor; efeito tardio permanece desconhecido |
| B10 — encerramento | Inventário durável independe do finally/processo | Monitoramento externo e restauração de disco não foram implementados |
| B11 — fixtures confundidas com desempenho | Recursos exclusivamente de memória e inventariados por run; não insere progresso no produto | Futuro schema/adaptador deve preservar marcação de fixture |
| B12 — simples flag offline | Fábrica reconhecida por identidade interna, sem transporte configurável; CLIs bloqueados | Código hostil dentro do processo não é isolado pelo controlador; usar ambiente aprovado e mínimo privilégio |

Não declarar os adaptadores de provedor concluídos ou a homologação integrada aprovada. O avanço técnico entregue é o plano de controle local testado, não a liberação de credenciais/escritas remotas.

## Arquivos

- `scripts/homologacao/controls/ledger.mjs`: armazenamento, estados, limites, ownership, reconciliação e limpeza.
- `scripts/homologacao/controls/executor.mjs`: intenção/chamada/timeout/confirmação e contrato de sessão/quarentena.
- `scripts/homologacao/controls/offline-adapter.mjs`: referências sintéticas de memória e falhas controladas.
- `scripts/homologacao/etapa2b-runner.mjs`: coordenador integrado; CLI bloqueado.
- `scripts/homologacao/tests/runner.test.mjs`: testes do código real e falhas injetadas. Os antigos casos de compensação automática foram substituídos porque esse comportamento foi removido, não porque se deseja ocultar falhas.
- `scripts/homologacao/controls/README.md`, README principal, este relatório, evidência JSON e `.gitignore`.

Não houve dependência nova: Node 22.22.0/SQLite 3.50.4 já disponíveis. `node:sqlite` é experimental nesse runtime; essa dependência precisa ser reavaliada antes de uma mudança de versão.

## Testes executados

| Grupo | Aprovados | Reprovados / ignorados |
|---|---:|---:|
| Controles, runner e imports/integridade das dependências | 51 | 0 / 0 |
| Regressão Node existente | 109 | 0 / 0 |
| Regressão Python/SQLite existente | 20 | 0 / 0 |
| **Total** | **180** | **0 / 0** |

Evidências: reabertura do banco após fechar processo, subprocesso morto por SIGKILL após gravar intenção, dois subprocessos concorrentes com um vencedor, fencing de confirmação antiga, timeout com efeito tardio sem confirmação, criação parcial, vínculo/COMMIT/ROLLBACK desconhecidos, quarentena obrigatória, ausência não definitiva recusada, identidade preexistente preservada, recurso de outro run recusado, limites, sessões sem token, aprovação invalidada e execução remota sempre negada.

`node --check`, `bash -n` do preflight, `npm --offline run preflight` e `git diff --check` aprovados. A suíte de regressão geral usa HTTP somente em loopback; não houve acesso a Supabase ou outro serviço por essas rotinas. Não houve instalação de dependência ou execução GitHub Actions. SQLite e processos locais são reais; Auth, SQL de provedor, revogação e limpeza são contratos/doubles locais, não operações remotas.

A [evidência estruturada](evidencias/etapa2c1-local.json) identifica versões, contagens e hashes. Arquivos de ledger temporários foram usados pelos testes e removidos ao encerrar; não foram publicados/commitados. Os testes de CLI comprovam exit code 2 para run/create mesmo com flags YES.

## Riscos residuais e limites

- LocalLedger usa um diretório dedicado, permissões Linux privadas e application_id próprio. Não é trilha criptograficamente inviolável nem armazenamento distribuído/NFS; operador com acesso ao arquivo pode adulterar dados. Backup consistente precisa incluir WAL ou usar mecanismo próprio de backup SQLite, não cópia parcial do arquivo aberto.
- Aprovação/evidência com UUID é registro local de uma decisão declarada, não autenticação do aprovador nem prova do Supabase. A futura camada de aprovação e os adaptadores devem vincular autorização ao alvo/hash/escopo/operador.
- Callback cancelado pode ter efeito tardio. Após timeout não assumir inexistência e nunca repetir escrita automaticamente. Quarentena declarada não comprova fechamento de uma conexão real ainda não implementada.
- Sigkill/concorrência foram testados em Linux; falha física de energia/disco, restauração de backup, cluster e comportamento Windows não foram validados.
- Um coordenador não é sandbox de JavaScript arbitrário. Ambiente futuro deve restringir rede e não fornecer segredos além do escopo aprovado.
- Nenhuma conta, sessão, Postgres remoto, RLS ou API real foi homologada. O schema/migration remoto não foi consultado nem alterado nesta etapa.

## Checklist objetivo para autorizar a Etapa 2D

- [ ] Aprovar commit/hash dos controles e escopo exato de adaptação/integrados; não remover travas por flags.
- [ ] Autorizar nova pré-inspeção somente de leitura de `yxxrfhobhonigwczzpim` / `gfuffaasrxaroosnwujl`; conferir Free, região temporária, estado de migration/RLS/Auth e custo zero antes de recursos/execução.
- [ ] Definir máquina/diretório persistentes, responsável, backup consistente e retenção do ledger; ambiente e egress limitados.
- [ ] Autorizar separadamente acesso seguro/credenciais e papéis mínimos; sem segredos no chat/Git/Actions/clientes.
- [ ] Aprovar duas identidades fictícias e referências controladas, sem dados de alunos, lista de fixtures e mutações; nenhuma terceira identidade ou SMTP pago implícitos.
- [ ] Implementar/validar adaptadores reais de leitura dirigida, Auth, vínculo transacional, descarte de conexão e verificação HTTP/token, sem permitir que o adaptador de memória seja apresentado como real.
- [ ] Aprovar execução limitada de criação/vinculação/testes e prova de sessão/isolamento por camada. Qualquer migration/configuração necessária recebe autorização própria.
- [ ] Definir retenção versus plano de limpeza; aprovar remoção separadamente por run/IDs. Nesta versão limpeza remota continua impossível.
- [ ] Se houver Actions ou outro recurso com possível custo, confirmar gratuidade ou obter autorização específica antes de disparar.
- [ ] Parar diante de alvo/custo/dado inesperado, resultado desconhecido ou resíduo sem decisão; sem retry automático de escrita, upgrade, produção, Asaas ou Worker.

Nenhum desses itens está implicitamente autorizado pela Etapa 2C.1. O objetivo é uma aprovação operacional única e delimitada para a próxima fase, reaproveitando os controles, sem pedir novamente autorização para cada operação já abrangida pelo escopo aprovado.
