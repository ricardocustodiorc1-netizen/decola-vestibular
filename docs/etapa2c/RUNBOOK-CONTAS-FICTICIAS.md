# Etapa 2C — criação, vinculação, reconciliação e limpeza

Procedimento proposto, NÃO executado. Não é script operacional nem autorização de escrita. Escopo futuro: duas identidades fictícias no projeto `yxxrfhobhonigwczzpim`, depois de aprovação específica.

## Inventário e estados

Criar registro persistente protegido antes da primeira tentativa de escrita. O registro contém run ID imprevisível, Project/Organization IDs, commit/hash, autorização, personas, referências de identidade, IDs confirmados, student IDs, chave da operação, tentativas, timestamps, estado e motivo sanitizado. Nenhuma senha/chave/token. Guardar referências a segredos em mecanismo aprovado, não seus valores; evitar publicar até mesmo essas referências em artefatos públicos.

| Estado | Significado | Próximo passo permitido |
|---|---|---|
| planned | Manifesto preparado, nenhuma escrita | Inspecionar/aprovar |
| authorized | Alvo/escopo explicitamente aprovados | Pré-checagem dirigida |
| create_pending | Intenção registrada antes da chamada | Uma chamada de criação |
| auth_confirmed | Provedor retornou ID válido e associação conferida | Registrar vínculo |
| auth_unknown | Timeout/erro/queda sem confirmação inequívoca | Parar e reconciliar; não repetir criação |
| link_pending | IDs conhecidos, intenção de vínculo registrada | Uma transação de vínculo |
| linked | COMMIT confirmado e estado conferido | Iniciar testes autorizados |
| link_unknown | COMMIT pode ter ocorrido, resposta perdida | Nova leitura dirigida; sem novo INSERT/DELETE cego |
| testing | Sessões de teste e operações autorizadas | Registrar resultado por caso |
| reconcile_required | Estado diverge/lease venceu/limpeza falhou | Leitura e decisão humana |
| retained | Fixtures mantidas com prazo aprovado | Sem deleção automática |
| cleanup_approved | Plano por IDs revisado e autorizado | Limpar somente escopo aprovado |
| cleaned | Remoção e sessões/resíduos verificados | Encerrar evidência |

O modelo é conceitual: não foi criada tabela, registry ou state machine nesta etapa. O manifesto de exemplo contém campos vazios e nenhuma autorização operacional.

## 1. Pré-checagem

- Confirmar projeto/organização/plano/schema e hash de código; parar se houver qualquer divergência.
- Confirmar que não existe outra execução ativa e que o ledger de tentativas anteriores foi reconciliado. Não confiar só em estado da memória do processo.
- Conferir apenas as duas identidades de teste autorizadas por consulta dirigida/procedimento suportado a validar. O listUsers global do executor offline não deve ser usado para varrer pessoas reais.
- Existência prévia não autoriza adoção nem exclusão da identidade. Não redefinir senha, marcar e-mail confirmado, alterar metadata ou remover conta já existente para facilitar o teste.
- Verificar permissão para criar exatamente duas identidades e fixtures, acesso a segredos e procedimento de encerramento; ausência de um item bloqueia a fase.

## 2. Criação fictícia

Registrar intenção durável → chamar API administrativa suportada no alvo autorizado → conferir ID/estado e marcador de run → persistir confirmação. Usar marcador administrativo não editável pelo estudante; user_metadata nunca prova autorização/propriedade. Marcador sozinho não basta para limpeza: exigir correspondência com ledger, projeto e IDs.

Não presumir idempotência nativa da chamada createUser. Idempotência interna controla tentativas e reconciliação; não enviar um header inventado como se o provedor o suportasse. Se a API responder erro com possibilidade de efeito remoto, ficar em auth_unknown. Se retornar ID, validar formato e propriedade antes de registrá-lo como confirmado. SDK rejeitar a Promise não prova que o usuário não foi criado.

Provisão com `email_confirm:true` só testa login de conta já confirmada; NÃO valida entrega/verificação de e-mail. Fluxo real de confirmação/recuperação exige caixa controlada e aprovação própria; não habilitar SMTP pago nem usar contatos pessoais.

## 3. Vinculação no banco

Usar somente IDs de Auth confirmados deste run. Transação restrita a accounts/students e fixtures autorizadas, com constraints e ownership. Commit confirmado → leitura dirigida para confirmar o vínculo. Não vincular a aluno já existente ou atualizar owner em caso de conflito. Não usar UPSERT irrestrito para transformar colisão em sucesso.

Se um INSERT falhar antes do COMMIT, confirmar rollback e registrar estado. Se o COMMIT ou o rollback tiver resultado desconhecido, descartar conexão e reconciliar; não reaproveitar a conexão com papel/transação incertos. Não usar compensação como substituto de confirmação.

## 4. Sessões e testes

Login separado por persona, armazenamento de tokens somente em memória/processo autorizado, sem persistência em browser compartilhado. Verificar identidade retornada e usar o token assinado em HTTP para o teste integrado. Requisições e consultas como aluno nunca usam service_role ou conexão administrativa. Controle de propriedade deve resistir a ID de outro aluno e claims editáveis.

O ensaio SQL com SET LOCAL ROLE e claims conhecidos é um teste separado. Executar em transação rollback-only, conferir papel/claims e reset; não apresentá-lo como validação da assinatura JWT ou da Data API. Não editar relógio do servidor: para expiração sintética, alteração de datas de fixtures em transação requer autorização de teste, com rollback confirmado.

## 5. Reconciliação

Parar novas escritas e travar a execução para revisão. Com acesso somente de leitura autorizado, comparar os IDs/referências exatos do ledger com o que existe em Auth e no banco. Evitar buscar/listar usuários reais ou copiar responses integrais.

| Divergência | Ação proposta |
|---|---|
| Criação possivelmente efetivada sem ID confirmado | Investigar somente a identidade fictícia e marcador autorizados; não criar outra nem presumir ausência |
| Auth existe, vínculo não existe | Apresentar opção de vincular ou limpar; pedir autorização compatível |
| Vínculo existe após resposta perdida do COMMIT | Marcar confirmação após prova; não inserir novamente |
| Registro existe sem prova de pertencer ao run | Não adotar nem apagar; decisão humana |
| Uma das duas contas concluiu e outra falhou | Reportar estado individual; sem repetir todo o run automaticamente |
| Limpeza SQL ou Auth parcial | Inventariar resíduos e sessões; retomar somente operações faltantes e aprovadas |
| Falha no fechamento/queda do processo | Não presumir rollback/limpeza pelo resultado do processo; reconciliar desde o ledger |

Guardar evidência mínima e sanitizada. Nenhuma ação corretiva remota é autorizada por esta documentação.

## 6. Retenção ou limpeza

Sucesso não implica retenção ilimitada; falha não implica autorização de deletar. Apresentar quantidade, IDs/referências protegidos, projeto, dependências, impacto, prazo e o que ficará retido. Obter decisão explícita: reter para auditoria por prazo definido ou limpar. Deleções irreversíveis exigem aprovação específica; não executar automaticamente.

Ordem de um plano futuro, sujeito à conferência de FKs e relações reais:

1. Parar o ensaio, impedir novos writes e invalidar/revogar sessões/refresh das fixtures por método suportado e autorizado. Verificar política para access tokens já emitidos; desativação/negação no backend deve ser tratada explicitamente.
2. Inventariar dependências por IDs, incluindo progresso, imports, períodos/claims, alunos, accounts e eventuais storage/support/objetos criados no run. Qualquer dependência não prevista faz parar; não usar CASCADE.
3. Com aprovação, remover somente registros inequivocamente pertencentes ao run, em transação controlada quando possível. Respeitar retenção de auditoria e claims antifraude; testar não significa autorizar apagar evidência de elegibilidade de pessoas reais.
4. Confirmar o resultado antes de remover Auth via API suportada. API Auth e transação Postgres não são uma transação distribuída atômica; registrar cada efeito separadamente.
5. Verificar ausência dos recursos autorizados, preservação das sentinelas/preexistentes e acesso negado aos tokens remanescentes. Registrar resíduo como pendente, nunca como limpeza concluída.
6. Fechar ledger sem segredos, definir retenção/exclusão das evidências e revogar credenciais temporárias somente com autorização correspondente.

Não apagar por nome, prefixo de e-mail, etiqueta genérica `2b_synthetic` ou todos os alunos do projeto. Não usar `DROP SCHEMA`, `TRUNCATE`, reset do projeto ou limpeza de Auth global.

## Resposta a incidentes do ensaio

Se aparecer dado real, alvo inesperado, segredo em log ou custo não previsto: interromper novas operações, restringir divulgação, preservar evidência mínima e avisar o proprietário. Não copiar o segredo para relatório, rotacionar credenciais sem autorização ou apagar logs para ocultar exposição. Plano de contenção/revogação e custo precisa ser apresentado conforme o incidente.
