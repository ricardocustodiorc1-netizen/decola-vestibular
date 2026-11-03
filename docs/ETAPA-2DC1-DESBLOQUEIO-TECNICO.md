# Etapa 2D-C.1 — controles implementados, acesso proposto e decisões

02/11/2026. Repositório ricardocustodiorc1-netizen/decola-vestibular, branch exclusiva `dev/navegacao-leo-familias-20261031`, base `f6bf797`. Referência: [preflight bloqueado](ETAPA-2DC-PREFLIGHT-BLOQUEADO.md). Alvo futuro permanece `yxxrfhobhonigwczzpim` / `gfuffaasrxaroosnwujl`.

**Nenhuma operação no Supabase nesta etapa, nem leitura. Nenhuma credencial real usada. Não houve criação de papel, GRANT, usuário, sessão, vínculo, registro ou mudança de configuração. A execução remota continua bloqueada.**

Código: `e2ca6fea70a7b7a26d597f4988dd4d25fd1b34bc` (árvore idêntica ao commit local da evidência).

## Controles entregues

| Controle | Implementação e evidência local |
|---|---|
| Contador persistente até 100 | `LocalLedger.reserveProvider/settleProvider`: intenção gravada atomicamente antes do transporte, run/operação/canal/estado/epoch/deadline; 101ª chamada recusada antes do callback |
| Compartilhamento | `provider-budget.mjs` + `offline-metered.mjs`: fetch do SDK Auth, comandos e aquisição de conexão PG, HTTP usam o mesmo run no AsyncLocalStorage do ControlledExecutor |
| Concorrência e tempo | Reserva exige operação pendente, lease válido e teto concorrente; deadline por operação/call, sinal de cancelamento, orçamento de duração do run; conta não é reiniciada por adapter ou reabertura |
| Falha/crash | Pendente após takeover vira unknown; efeito atrasado não confirma ledger; unknown bloqueia novo transporte e retenção/liberação perigosa; nenhuma escrita repetida automaticamente |
| Reconciliação | `reconcileProvider` exige referência UUID, declaração definitiva e quietude; não devolve orçamento e não reconcilia automaticamente a operação-pai; erro/ausência pontual não são prova |
| Backup | Snapshot online anterior preserva novos campos do ledger; manifesto inclui unknown de transportes; restore e fencing anteriores reutilizados |
| Persistência | Configuração preparada, diretório canônico privado com mesmo proprietário, rejeição de scratch/tmp e tipos conhecidos de filesystem de rede, integrity_check e backup verificado antes de retornar ledger |
| TLS/PG | Host exato do projeto, porta 5432, papel específico, CA obrigatória, rejectUnauthorized=true, checkServerIdentity nativo, TLS>=1.2, certificado válido e hostname; preflight compara session_user/current_user e rejeita privilégios/memberships amplos |
| Credenciais | Contrato de arquivo externo ao Git, proprietário correto, diretório 0700, arquivo 0600, sem symlink, campos exatos e callback sem log de valores; erros do consumidor sanitizados |
| Bloqueio remoto | `enableRemoteExecution`, `activateRemoteExecutor` e CLIs run/create continuam negados. Nenhum cliente conectado é construído por padrão |

A unidade de consumo é uma requisição HTTP de SDK/HTTP, um comando SQL ou uma aquisição PG, não cada pacote TCP/TLS. Aquisição reutilizada pode ser cobrada conservadoramente como chamada adicional. Handshake e fechamento local de conexão não são novas requisições de aplicação. O wiring fixa Auth à origem HTTPS do projeto e HTTP à origem do BFF, sem credencial em URL; alvo divergente não alcança request. Fetch consome o corpo dentro do prazo, nega redirects e interrompe em Auth 5xx incerto; retries internos não podem alcançar o provedor após unknown. Auto-refresh/persistência/detecção de sessão do SDK ficam desabilitados no wiring.

Todos os transportes do **novo wiring medido** passam por essa reserva. Os adaptadores antigos injetados continuam disponíveis para testes offline, não como escape para ativação real. Não injetar cliente real em offlineTestPermit. O wrapper metered-bridge vincula chamadas do backend HTTP ao mesmo ledger/lease em operações de leitura próprias, sem confiar em IDs enviados por cabeçalhos. Essa cadeia HTTP→backend requer concorrência 2 (cliente HTTP aguardando e chamada interna); com 1 deve falhar fechado, sem elevar automaticamente o limite. A futura fábrica remota deverá obrigatoriamente usar os mesmos wrappers e gate completo; não basta habilitar uma flag. JavaScript hostil dentro do processo ou operador que adultera SQLite não é isolado por esse contrato.

Defaults do ledger: 40 operações, 100 chamadas, 10 minutos, timeout 10 s, concorrência até 2. Perfil do executor preparado prefere concorrência 1 e aceita no máximo 2 e tentativas de leitura até 2. Recursos de teste existentes que configuram limites menores continuam funcionando. Campos novos são compatíveis com ledgers anteriores offline, sem DDL no Supabase. Lease deve receber heartbeat durante execução futura; recuperar lease exige reconciliação, não nova execução das mesmas escritas.

## Executor persistente preparado, não provisionado

Exemplo: `scripts/homologacao/executor/persistent.example.json`; permanece remoteEnabled=false e operatorAttestedPersistent=false, recusado até aprovação real do armazenamento. `preparePersistentLedger` exige diretório já existente, privado/canônico, verifica o banco, faz backup online e valida hash/integridade. Não cria máquina, serviço ou volume externo. Retenção e restore continuam sem expurgo automático.

| Opção | Uso recomendado | Custo incremental / limites |
|---|---|---|
| Máquina Linux já disponível, ou Linux/WSL com disco privado persistente | Primeira homologação, operador acompanhando; Node 22.22, não desligar durante execução | Pode ser R$0 em serviços novos; depende de equipamento existente. Permissões POSIX e persistência precisam ser verificadas. Windows nativo não foi validado |
| Servidor Linux já contratado com disco local durável | Se o titular já dispuser de host e acesso mínimo | Sem novo contrato por esta entrega; custo atual não consultado. Requer aprovação do host e instalação/configuração se necessária |
| VPS/volume novo | Somente se as opções existentes forem insuficientes | Não cotado nem contratado; exigiria autorização e preço antes do provisionamento |
| Scratch atual, NFS, CI/Actions efêmeros | **Não usar para efeitos remotos** | Não fornecem o perfil de persistência aprovado; Actions não executadas |

Uma declaração e um path não provam durabilidade física: operador deve comprovar que o disco sobrevive a reinício/substituição e que só há uma cópia ativa. Testes em diretório fixture sob o home demonstram validação/reabertura, não provisionamento de host. Backup SHA-256 não é assinatura ou criptografia; proteger mídia/backup contra outros usuários, definir cópia de recuperação fora do host e aprovar retenção. Não perder ou restaurar cópia antiga para repetir consumo: comparar histórico e reconciliar provedor antes de retomar.

Sequência preparada: validar configuração/ownership/filesystem → abrir ledger/integrity_check → snapshot online e verifyBackup → run/lease → preflight TLS/permissões pela conexão restrita → conferir capacidade e autorização → só futuramente permitir operações aprovadas. Enquanto qualquer condição falhar, não criar Auth users. Acesso direto ao host PG pode depender de IPv6; não contratar IPv4 nem trocar para pooler sem revisar host/SNI/identificação e autorização. Nenhuma conexão PG remota foi testada.

## Proposta SQL exata: alcance real e limites

- [Papel e GRANTs propostos](propostas/ETAPA-2DC1-PAPEL-LEITURA.sql).
- [Reversão proposta](propostas/ETAPA-2DC1-REVERSAO-PAPEL.sql).

Papel `decola_homologacao`: sem superuser, bypassrls, createdb, createrole, replication, herança automática ou ADMIN OPTION; limite de conexões; senha NULL até disponibilização segura separada. Grants de leitura por coluna para os contratos atuais; SET ROLE authenticated explícito para sondas. Não se concedem INSERT/UPDATE/DELETE/TRUNCATE, CREATE, ownership ou privilégios de pagamento. Não há mudança de PUBLIC/default privileges.

**Não é um papel globalmente read-only:** SET ROLE authenticated dá acesso às quatro funções existentes, inclusive request_trial/cancel_trial, que escrevem. Também permite atribuir claims locais em sondas: a credencial deve ser exclusiva do executor confiável; não entregar ao aluno. Os grants Auth por coluna podem permitir leitura dessas colunas de identidades além das duas fixtures conforme RLS do schema Auth; GRANT não é filtro por run. Queries do executor devem permanecer dirigidas aos IDs/e-mails planejados. Não aplicar este papel isoladamente como solução completa de isolamento entre alunos ou limitação do executor a duas identidades.

O preflight verifica todas as colunas necessárias, privilégios diretos de DML (inclusive por coluna), CREATE em schema, possibilidade de SET ROLE, ADMIN OPTION e ausência de membros amplos; recusa postgres disfarçado por SET ROLE por comparar também session_user. Isso valida o perfil de leitura e metadados, **não** concede/atesta provisionamento ou acesso útil do join de sessão. Se PUBLIC conceder CREATE herdado, o preflight recusará; não revogar privilégios globais automaticamente para fazê-lo passar.

### Bloqueio estrutural identificado na análise

As políticas decola atuais não incluem INSERT. Um papel sem BYPASSRLS não poderá provisionar accounts/students só com GRANT INSERT. Além disso, `activeSession()` do adapter usa join em decola.accounts sob o papel backend: sem política aplicável/auth.uid nesse contexto, pode retornar vazio. Mudar para SET ROLE authenticated perde os grants Auth privados do papel base. Logo **não existe uma correção honesta por GRANTs simples que resolva esses dois caminhos sem revisar o acesso sob RLS**.

Não foi alterada política, função, migration ou adapter de sessão para contornar isso. Recomenda-se desenhar uma entrada privada de provisionamento/verificação com escopo de fixture/run e execução mínima, ou políticas específicas equivalentes, com SQL definitivo e reversão próprios antes da autorização de aplicação. Uma função privilegiada nova exige threat model, allowlist das duas identidades e testes, não SECURITY DEFINER genérico para remover erro de permissão. Essa decisão extrapola a restrição atual de não alterar políticas/funções e precisa de aprovação separada. O papel desta proposta é base de leitura/sondas, **não recomendação para aplicação imediata antes dessa decisão**.

Reversão: conferir origem do papel, parar o executor e obter quietude; revogar membership e grants específicos; DROP ROLE apenas sem dependências. Arquivo transacional, sem DROP OWNED/CASCADE ou encerramento automático de sessões. Dependência aborta a transação e pode reverter também os REVOKEs: investigar antes de nova tentativa. Nem aplicação nem reversão foram executadas.

Sintaxe e opções de membership verificadas na documentação oficial PostgreSQL 17: https://www.postgresql.org/docs/17/sql-grant.html e https://www.postgresql.org/docs/17/functions-info.html . A proposta não foi executada em Postgres local ou remoto; testes de permissões usam respostas injetadas, não atestam grants reais. Não chamar isso de papel homologado.

## Canal seguro para Auth/Postgres

Preferência: titular entrega segredos ao executor via secret manager já existente ou arquivo privado montado localmente fora do checkout, com um ponteiro como DECOLA_CREDENTIAL_FILE contendo **somente o path**, nunca valores em argumentos/URLs/comandos/commits/Actions/chat. Usar filesystem privado, arquivo 0600, pai 0700, proprietário do processo. `withCredentialFile` valida isso e disponibiliza valores apenas ao callback local; não é uma nova interface para coletar segredos no ChatGPT. Nesta etapa somente fixtures FIXTURE_ONLY foram lidas.

Campos do contrato: authAdminKey, authPublishableKey e pgPassword. URL/host/projeto são fixados separadamente pelo perfil autorizado; não aceitar DSN arbitrário com sslmode que enfraqueça TLS. Obter CA válida do provedor por canal confiável e verificá-la; não desabilitar checagem de certificado. Guardar a chave privada de Auth exclusivamente no executor de confiança, nunca frontend/SDK do navegador.

A API administrativa de Auth exige autoridade ampla no projeto; não se cria uma chave nativamente limitada a duas contas só por adicionar GRANTs ao Postgres. Seu uso, se aprovado, deve ser por broker/execução controlada, inventário e teto de duas identidades; não obter service_role como improviso diante de falha de permissões. Ainda não foi disponibilizado um canal concreto de secret injection no host, nem autorizado seu provisionamento. A capacidade browserAuth autentica o painel; não serve para transferir API keys/DSN ao Node. JavaScript não garante zerar strings do heap; não há promessa de apagamento criptográfico da memória. Descarte/rotação de credenciais terá procedimento autorizado, sem expor valores.

## Testes e evidências

[Registro estruturado, hashes e resumo](evidencias/etapa2dc1-local.json). Node 22.22.0/npm 11.9.0. Sem dependência nova ou instalação.

| Grupo final | Aprovados | Reprovados / ignorados |
|---|---:|---:|
| Homologação local, execução serial | 113 | 0 / 0 |
| Regressão Node | 109 | 0 / 0 |
| Python/SQLite | 20 | 0 / 0 |
| **Total** | **242** | **0 / 0** |

31 testes novos: SDK Supabase instalado usando fetch fake medido; 100/101 chamadas e reabertura; concorrência em dois handles; timeout/late result e conexão tardia descartada; corpo HTTP travado; Auth 5xx sem retry alcançar transporte; reserva seguida de SIGKILL; restore com unknown; reconciliação sem reembolso; SSL/hostname/certificado; handshake TLS real APENAS loopback com CA/certificado efêmeros de teste; rejeição de CA não confiável/hostname errado; permissões amplas/incompletas; storage privado/reabertura/symlink; canal de credencial fixture/modes/redação de erro. Nenhum segredo ou chave de teste TLS foi commitado.

Uma execução paralela sofreu congestionamento do ambiente/disco e atingiu os timeouts de produção em dois testes (HTTP loopback e contagem de chamadas). Não foram ampliados limites de produção. O teste isolado de contagem usa clock injetado para separar limite de chamadas de latência do disco; testes de timeout usam relógio/timers reais. A suíte final serial passou. Houve também interrupção transitória do executor de comandos, recuperada sem operação externa. Preflight, checks de sintaxe e whitespace passaram; run/create continuam bloqueados. Não foram disparados Actions.

Reprodução: Node 22.22 no PATH; `node --test --test-concurrency=1 scripts/homologacao/tests/*.test.mjs`; `node --test tests/*.test.mjs`; `python3 -m unittest discover -s infrastructure/subscribers -p 'test_*.py'`; `npm --prefix scripts/homologacao --offline run preflight`. OpenSSL local é necessário ao teste de handshake. O script npm test do manifesto aninhado foi ajustado para execução serial, sem aumentar timeouts de produção. Dois testes HTTP adicionais comprovam contagem compartilhada no servidor e recusa com limite concorrente 1.

## Próxima autorização objetiva

Os controles locais essenciais estão implementados. Não criar usuários agora. Antes da futura execução:

1. Escolher máquina existente/disco persistente e canal de segredo; autorizar provisionamento/configuração exatos se necessários. Sem cotação/contratação ou recursos externos criados nesta entrega; opção em equipamento existente pode ter custo incremental de serviço R$0, sem garantir custo total do equipamento/fornecedor.
2. Decidir o acesso de provisionamento e join de sessão sob RLS. Não aprovar só GRANT INSERT ou uso de postgres/BYPASSRLS. Preparar/aprovar SQL adicional exato se mudar função/política.
3. Após decisão, aprovar especificamente papel/GRANTs revisados, riscos e reversão; somente então aplicar por conexão administrativa autorizada e conferir permissões reais. O próprio executor não terá poder para concedê-las.
4. Validar host/TLS/permissões/backup, broker Auth e wiring medido no ambiente escolhido antes de ativar transporte; manter duas personas, 10 min/40 operações/100 chamadas, sem retry de escrita incerta. Autorização anterior para homologar não substitui essas permissões adicionais.

Nenhuma conta, sessão, registro ou papel remoto foi criado ou removido. Main, produto, progresso, site oficial e Worker não foram alterados/publicados. Auth, RLS, sessões e homologação integrada real continuam não aprovados.
