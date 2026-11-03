# Etapa 2D-C.2 — acesso restrito preparado e testado localmente

02/11/2026 (data do cliente). Branch exclusiva `dev/navegacao-leo-familias-20261031`, base `1d50e59`. Referência: [2D-C.1](ETAPA-2DC1-DESBLOQUEIO-TECNICO.md). Nenhuma operação no Supabase, credencial real, instalação, provisionamento, publicação, pagamento ou Action nesta etapa. Commits locais; envio ao GitHub depende da autorização posterior solicitada para alterações externas.

## Implementação

- `scripts/homologacao/scoped/plan.mjs`: plano imutável com projeto/organização/run, dois Auth IDs e dois student IDs distintos, janela máxima de 10 minutos. Gera SQL de aprovação sanitizado, sem executar.
- `scoped/auth.mjs`: broker com SDK privado, sem acesso público ao cliente administrativo. Solicita IDs preplanejados suportados pelo SDK instalado, exige manifesto aprovado no banco e operação create da persona no controlador. Ledger registra a tentativa ANTES do despacho; reconstruir o broker não libera repetição. Resultado desconhecido não gera conta substituta.
- `controls/ledger.mjs` e `provider-budget.mjs`: reserva durável do despacho Auth por persona/run/operação, mantendo contador de 100 chamadas, fencing, deadlines e demais controles anteriores.
- `scoped/postgres.mjs`: somente chamadas parametrizadas a funções privadas, sem SELECT em Auth, DML direto ou SET ROLE. Vínculo transacional, resultado exato conferido antes de COMMIT, descarte físico diante de incerteza e reconciliação separada.
- `scoped/bridge.mjs`: Auth verifica o token; função privada confirma sessão/conta/run; principal fica vinculado à instância e sessão. Acesso protegido revalida sessão, nega estudante alheio e não aceita objeto de principal reconstruído pelo chamador.
- `scoped/wiring.mjs`: prepara SDK com fetch limitado ao projeto, auto-refresh/persistência desativados, Postgres medido e bridge com operações próprias no MESMO ledger. Apenas capacidade offline; nenhum desbloqueio remoto.
- `scoped/preflight.mjs`: rejeita o perfil antigo, acesso direto a tabelas, membership privilegiada/authenticated, login disfarçado com SET ROLE, CREATE, funções ausentes ou EXECUTEs privados adicionais; reutiliza TLS/certificado/hostname da 2D-C.1.
- `scoped/platform.mjs`: avaliação pura Linux/WSL e filesystem, sem instalar ou consultar o computador do titular, sem afirmar durabilidade real.

Não há alteração no frontend, Professor Leo, progresso, simulados, Worker ou servidor padrão desconectado. O adaptador antigo permanece somente para regressões offline; a nova arquitetura substitui sua proposta de acesso para futura ativação.

## SQL exato, não aplicado

[Aplicação proposta](propostas/ETAPA-2DC2-ACESSO.sql), [contenção reversível](propostas/ETAPA-2DC2-REVERSAO.sql) e [restauro estrutural apenas vazio](propostas/ETAPA-2DC2-RESTAURO-VAZIO.sql). Não são migrations executadas. As propostas antigas de 2D-C.1 foram substituídas por erro explícito: não podem conceder por acidente SELECT Auth e SET ROLE ao login. O conteúdo histórico continua no Git.

| Papel | Acesso proposto |
|---|---|
| decola_homologacao | Login sem senha configurada, NOINHERIT/NOBYPASSRLS, conexão limitada, USAGE privado e EXECUTE em cinco entradas. Sem tabela, Auth ou membership authenticated |
| decola_guard_owner | NOLOGIN/NOBYPASSRLS; dono do manifesto e funções de controle; SELECT/INSERT por coluna em accounts/students, submetidos a quatro políticas novas que limitam as tuplas ao manifesto |
| decola_probe_owner | NOLOGIN/NOBYPASSRLS; apenas este dono de função herda authenticated, sem ADMIN e sem SET. Exercita as políticas/RPCs existentes após sessão válida e escopo fixo |
| Instalador postgres | Somente aplicação futura autorizada. Proprietário dos dois helpers booleanos e da função active_account existente; não é conexão do executor nem uma simulação de estudante |

Cinco entradas do executor: approved_scope, provision_pair, inspect_pair, active_session e student_action. Manifesto e helpers internos não são acessíveis ao login. O schema privado não deve ser exposto. Authenticated nem sequer recebe USAGE em decola_guard; o caminho público existente usa active_account por sua ACL atual.

A aplicação cria três papéis, um schema privado, uma tabela de manifesto vazia, funções privadas, quatro políticas para accounts/students e substitui o corpo de active_account. NÃO altera policies/tabelas gerenciadas de Auth, NÃO desativa RLS e NÃO expõe decola na Data API. Colisão de nomes aborta, sem adotar papel/schema preexistente. O instalador precisa de ownership/ADMIN adequados; não tentar escalar permissões se o Supabase recusar.

### Manifesto e criação

Uma linha singleton guarda run, dois Auth IDs preplanejados, dois student IDs e início/fim. O gerador só produz UUIDs/timestamps tipados. Sua inserção será outra operação expressamente aprovada pelo titular, antes do teste; o executor não tem permissão de modificá-la. Não há INSERT de manifesto no SQL de instalação, nem credenciais.

Antes de cada criação Auth, o broker consulta approved_scope e compara TODOS os campos e o relógio servidor. Ausência/expiração/divergência impede despacho. A API receberá exatamente IDs/e-mails sintéticos planejados para Horizonte/Estrela, com email_confirm=true e app_metadata do servidor. Não envia mensagens a terceiros. A chave Auth não possui escopo nativo de duas contas: essa restrição vem do broker/ledger isolados, não de uma promessa sobre o fornecedor. Não disponibilizar a chave a código não confiável ou navegador. Se o provedor recusar IDs customizados/domínio reservado, parar sem mudar o plano ou criar substituto.

provision_pair trava o manifesto, confere os dois Auth IDs, e-mails exatos, persona/run/stage, confirmação, janela de criação e inexistência de vínculos preexistentes; insere apenas as duas tuplas. Não utiliza upsert para adotar dados existentes. Chamada concluída repetida retorna os mesmos vínculos, mas o runner NÃO repete escrita incerta. inspect_pair permite reconciliação posterior sem criar outro registro. O manifesto não pode ser substituído automaticamente por outro run para liberar mais contas.

### Revogação e Data API

O controle de revogação não depende só do BFF. O SQL proposto faz active_account exigir current_session: JWT com sub/session_id válido, sessão existente pertencente ao usuário e prazo válido. As políticas de leitura e as funções request_trial/cancel_trial/can_study já dependem de active_account/assert_student. Assim, esses caminhos também negam JWT revogado caso decola venha a ser exposto — sem alterar a configuração da Data API nesta entrega. Não se afirma cobertura de futuras views/rotas arbitrárias que ignorem esse controle.

Dois helpers booleanos SECURITY DEFINER ficam sob o mesmo dono privilegiado de active_account (postgres): current_session lê somente o necessário em auth.sessions; fixture_auth_valid verifica somente os IDs/e-mails do manifesto. Têm search_path vazio, SQL fixo e EXECUTE restrito. Não retornam registros pessoais e não dão SELECT Auth ao executor. Essa é uma fronteira privilegiada explícita, indispensável para consultar metadados gerenciados sem distribuir acesso amplo; **não é PostgreSQL sem privilégios em todas as camadas**. Nenhuma conexão postgres/BYPASSRLS foi usada para testar isolamento.

A verificação servidor seta e restaura claims locais, inclusive a variante singular do GUC, e só aceita o par/run aprovado. student_action checa sessão e estudante planejado antes de chamar as políticas/RPCs no contexto do dono NOLOGIN que herda authenticated. Restaura claims em sucesso e erro. As operações requestTrial/cancelTrial são ESCRITAS, mesmo chamadas por SELECT; nenhuma foi executada no Supabase.

## Riscos e reversão

- Funções privilegiadas precisam de revisão/nativo PostgreSQL antes de aplicação. Sem SQL dinâmico, sem search_path controlável pelo usuário, nenhum grant público de provisionamento, nenhuma senha no SQL.
- O instalador conserva ADMIN dos papéis que cria para seu ciclo de vida, com INHERIT e SET desativados ao terminar; CREATE temporário no schema é revogado. Não confundir essas autorizações administrativas com o login executor. Não aplicar se ownership/ADMIN do instalador divergirem do esperado.
- A chave administrativa Auth continua ampla por natureza. Broker/host devem ser confiáveis; código hostil com acesso ao segredo pode ignorar o wrapper. Canal seguro/host continuam não provisionados.
- current_session implica mudança de comportamento: conexões SQL que antes inventavam só auth.uid, sem sessão real, deixarão de passar. Não tratar isso como regressão a contornar; é necessário teste de sessão real futuro.
- Se decola for exposto no futuro, revisar views, RPCs, ACLs e JWT novamente. RLS não protege superusuário/serviço privilegiado; o executor novo não recebe esse acesso.
- Contenção proposta: parar executor/obter quietude, NOLOGIN e revogar EXECUTE/USAGE. Preserva contas, sessões, manifesto e o controle reforçado de sessão. Não encerra nem remove sessões automaticamente.
- Restauro total é separado: somente manifesto vazio, inventário sem recursos, executor parado e Data API decola não exposta. Reverte active_account e remove apenas objetos/policies novos; sem CASCADE/DROP OWNED. Retirar a checagem de sessão enfraquece o comportamento atual proposto, exigindo aprovação explícita. Se houver manifesto/fixtures, o script aborta e aguarda retenção/limpeza específica.

## Windows/WSL: viável, não provisionado

Preferência de baixo custo: WSL2/Linux já disponível no computador do titular, com Node 22.22.x e disco Linux privado, por exemplo `/home/<usuario>/.local/state/decola`. Diretório 0700, segredos externos ao Git 0600 e banco/backup no filesystem Linux persistente. Não usar /mnt/c, /tmp, rede, OneDrive ou cópia de SQLite aberto. Manter notebook ligado, sem suspensão durante teste; testar reinício/restore e guardar backup consistente fora da única cópia do disco.

A orientação de armazenamento no filesystem Linux acompanha a documentação Microsoft: https://learn.microsoft.com/en-us/windows/wsl/filesystems . O assessor pode marcar um candidato, mas sempre retorna durabilityVerified=false. Não confirma que WSL esteja instalado, hardware compatível ou que o disco sobreviva à remoção da distribuição. Não instalamos WSL, Node, Docker, PostgreSQL, máquinas ou serviços. Equipamento existente pode evitar nova mensalidade; qualquer instalação/provisionamento e eventual custo precisa de decisão separada.

## Validação executada e limites

[Registro sanitizado](evidencias/etapa2dc2-local.json). Runtime disponível nesta retomada: **Node 24.22.1**. O Node 22 isolado anterior não está disponível. Não alteramos engines nem instalamos outro runtime para encobrir isso.

| Testes locais | Aprovados | Reprovados/ignorados |
|---|---:|---:|
| Homologação e novos controles | 129 | 0 / 0 |
| Regressão Node existente | 109 | 0 / 0 |
| Python/SQLite | 20 | 0 / 0 |
| Total no Node disponível | **258** | **0 / 0** |

16 testes novos cobrem plano/SQL sanitizado, SDK real com fetch falso medido, dois IDs fixos, manifesto ausente, repetição bloqueada mesmo reconstruindo broker, resposta perdida, run errado, chamada fora do controlador, transação/COMMIT incerto, resultado inválido, sessão contextual, tentativa alheia, revogação entre abertura e consulta, principal forjado, perfil de privilégios e candidato WSL. O orçamento de 2D-C.1 permanece compartilhado: duas criações + consultas de aprovação e vínculo consomem 14 chamadas no teste integrado local.

**Preflight padrão bloqueou corretamente com “Node.js 22 required”.** Portanto a validação do runtime homologável Node 22 permanece pendente; testes em Node 24 não a substituem. Não houve falha funcional na suíte, mas esse check operacional não está aprovado.

Não há PostgreSQL/psql/Docker local disponíveis. O SQL foi revisado e verificado como contrato/artefato pelos testes, mas NÃO executado nem submetido a um parser PostgreSQL. Doubles de SQL não comprovam policies, ownership, semântica de SET ROLE ou isolamento RLS real. Antes de aplicar: teste nativo PostgreSQL 17 isolado e repetição em Node 22, após autorização de instalação/ambiente se necessária. Auth, RLS e sessões reais continuam NÃO homologados.

## Próxima decisão e autorizações

A solução de código/proposta está preparada, sem execução remota. Próximos passos concretos:

1. Aprovar o envio destes commits locais à branch exclusiva, conforme a cláusula de autorização posterior para alterações externas.
2. Escolher ambiente existente para Node 22/PostgreSQL 17 local e disco persistente; autorizar instalações se faltarem. Nenhuma contratação é necessária por esta proposta, e nenhuma cotação/despesa foi assumida.
3. Após validação nativa, aprovar separadamente o SQL exato de aplicação, alteração de active_account/policies, papéis/grants, riscos e reversão. Não executar a proposta antiga de 2D-C.1.
4. Aprovar manifesto exato com UUIDs/timestamps, canal de credencial e execução real delimitada. A antiga autorização funcional de duas personas não autoriza automaticamente as alterações de infraestrutura/permissão novas.

Main, Worker, site oficial, progresso e pagamentos preservados. Nenhum usuário, sessão, vínculo, registro ou papel foi criado no Supabase; nenhum recurso foi removido. Não declarar a homologação integrada aprovada.
