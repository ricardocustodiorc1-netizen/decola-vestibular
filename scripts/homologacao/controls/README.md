# Controles locais de homologação — Etapa 2C.1

Node **22.22.0**, sem dependência nova. `node:sqlite` é experimental nessa versão; SQLite observado 3.50.4. Não é Supabase local/remoto, não contém clientes SDK nem executa SQL no projeto externo.

- `ledger.mjs`: SQLite WAL + synchronous FULL, transações, IDs e histórico persistidos, lock exclusivo por projeto, lease e fencing, reconciliação e planos de limpeza.
- `executor.mjs`: intenção antes do callback, prazo/chamadas/concorrência/tentativas, resultado desconhecido sem retry automático, contrato de descarte de conexão incerta e de sessões.
- `offline-adapter.mjs`: adaptador de memória reconhecido por identidade interna (WeakSet), sem possibilidade de configurar URL/chave/transporte. Só simula referências das duas personas.

Use diretório local dedicado e vazio, por exemplo `.decola-homologacao/`, com acesso exclusivo ao operador. O ledger cria `runs.sqlite` e arquivos WAL/SHM, ignorados pelo Git. Rejeita symlink direto, diretório com arquivos alheios e banco sem application_id próprio. Permissões 0700 no diretório e 0600 no banco, verificadas em Linux.

SQLite serializa mutações com BEGIN IMMEDIATE. Cada operação guarda intenção antes do adapter e confirma apenas no retorno validado. Ao recuperar lease expirado, pendências viram unknown, aprovações/evidência de sessão são invalidadas e o dono antigo perde poder de confirmar. Não remover lock manualmente para contornar execução pendente. Um processo ainda vivo pode receber resposta depois do timeout: a resposta não confirma o ledger automaticamente.

Não repetir create/link com chave pending/unknown/resolved_absent. Reconciliação exige evidência definitiva declarada e referência UUID; simples consulta vazia não prova ausência de efeito remoto. Para vínculo incerto, registrar descarte da conexão antes de resolver. Resume exige decisão própria, estado compatível e ausência de pendências. O cenário completo não reinicia automaticamente: o operador deverá usar as operações explícitas após reconciliação.

Inventário inclui recursos criados e identidades protegidas preexistentes. Plano de limpeza inclui apenas IDs comprovados por operação/run/projeto, tem digest e aprovação separada. Sessões exigem evidência de refresh revogado e acesso negado para aquele inventário. `executeRemoteCleanup()` sempre lança `REMOTE_CLEANUP_BLOCKED`. Verificação de ausência não executa deleções; só registra uma atestação offline e não comprova revogação/remoção reais.

Aprovações UUID, marcadores e flags são contratos/atestados locais, não autenticação de quem aprovou nem prova criptográfica do provedor. O ledger não é inviolável contra um operador com acesso de escrita ao arquivo, não substitui controle do host e não é seguro para disco compartilhado entre máquinas/NFS. SQLite journal não é backup: não copiar só o arquivo principal enquanto houver WAL ativo. Definir backup consistente/restauração e retenção antes da Etapa 2D.

O executor antigo com compensação automática foi substituído pelo coordenador controlado. A função `runStage2B` só aceita adaptador criado pela fábrica offline; objetos reais ou com mera propriedade mode são rejeitados. Os CLIs continuam bloqueando run/create; check não abre ledger nem lê segredos.

```sh
# Node 22 já instalado; nenhum segredo ou instalação necessária
node --test scripts/homologacao/tests/*.test.mjs
```

Testes incluem SQLite real, reabertura, SIGKILL e dois processos concorrentes, mas efeitos de Auth/SQL e sessões são apenas objetos de memória. O callback do coordenador de baixo nível não é sandbox para código arbitrário; não importar dependências reais ou fornecer segredos. Não há interface de transporte remoto fornecida nesta fase.
