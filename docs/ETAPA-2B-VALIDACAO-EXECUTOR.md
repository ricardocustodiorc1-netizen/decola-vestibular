# Etapa 2B — validação técnica local do executor

02/11/2026. Repositório `ricardocustodiorc1-netizen/decola-vestibular`, branch exclusiva `dev/navegacao-leo-familias-20261031`. Base recebida: `1d815bf1fbe876aaed397d31471c87801ea73047`.

## Resultado e escopo

Pendências locais de Node, dependências, lockfile, preflight e testes do executor resolvidas. **Não é validação real do Supabase nem conclusão da homologação Auth/RLS remota.** Não foi usado segredo Supabase, criado usuário ou executada consulta/migração nessa plataforma. Não houve dispatch do GitHub Actions, nova despesa contratada, Pages, main, Worker ou Asaas.

Foram testadas as instruções e ramificações do arquivo real `scripts/homologacao/etapa2b-runner.mjs`, importando sua função exportada `runStage2B`, sem reimplementar o executor em outro simulador. SDK e pool são dependências injetadas de teste; a rede é bloqueada durante os testes. O banco do test double NÃO implementa PostgreSQL e não comprova sintaxe SQL, RLS, assinatura JWT ou comportamento do provedor. Essa distinção também aparece nos logs do executor.

## Ambiente e dependências comprovados

| Item | Verificado |
|---|---|
| Runtime isolado | Node **22.22.0**, extraído de tarball do registro npm em diretório temporário, sem substituir Node 24 do ambiente |
| npm utilizado | **11.9.0** executado com Node 22 no PATH |
| Supabase JS | `@supabase/supabase-js` **2.57.0**, versão exata já especificada no manifesto recebido |
| PostgreSQL driver | `pg` **8.13.1**, versão exata já especificada no manifesto recebido |
| Lockfile | Gerado `scripts/homologacao/package-lock.json`, lockfileVersion 3, 30 pacotes |
| Instalação limpa | `npm ci --ignore-scripts --no-audit --no-fund` aprovado |
| Integridade | npm ci verificou SRI; entradas do lock com SHA-512 e HTTPS registry.npmjs.org; tarball Node conferido por SHA-512; `npm cache verify` aprovado |
| Árvore instalada | `npm ls --all` sem dependência ausente/inválida |
| Imports reais | Supabase JS e pg importaram, inclusive com fetch/Socket.connect bloqueados, sem instanciar clientes |

SHA-256 do lockfile: `3d038ad47098a2c58d9324367f2deddcb26ec5f64931aa3df5eac00e33735742`.

Isso confirma reprodução/compatibilidade de importação nesse runtime, não ausência de CVEs. Não foi executado `npm audit`; versões foram mantidas fixas conforme o manifesto recebido. A instalação usou `--ignore-scripts`; não rodou lifecycle de pacotes. O ambiente emitiu avisos de configuração npm `http-proxy` e proxy experimental do Node; não impediram instalação/testes, não foram removidas proteções da rede e nenhum valor de credencial foi impresso.

## Problemas encontrados e corrigidos

1. **Lockfile inexistente:** o workflow tentava cache/npm ci usando arquivo ausente. Lock gerado e validado por instalação limpa.
2. **Node divergente:** ambiente original tinha Node 24.22.1; foi preparado Node 22.22.0 isolado. Preflight agora exige major 22 e workflow fixa patch 22.22.0.
3. **Constante `URL` ocultava o construtor:** o executor falhava ao interpretar a URL Postgres. Renomeada para `API_URL`; o próprio caminho integrado passou pelo parser após a correção.
4. **Host podia ser sobrescrito:** teste com parser real `pg-connection-string` demonstrou que `?host=attacker.invalid` substitui o hostname. Runner rejeita query/fragment, banco diferente de postgres e porta direta inesperada antes de instanciar cliente/pool.
5. **Configuração incompleta podia instanciar dependências cedo:** validações necessárias foram antecipadas; e-mails das duas personas são comparados após normalização para evitar duplicata por caixa/espaços.
6. **CLI podia criar usuários com variáveis YES:** comandos `run` e `create` agora estão bloqueados por código nesta revisão, mesmo com gates herdados. CLI `check` não lê segredo privilegiado. A função completa de teste requer dependências injetadas e modo explícito `injected-test-doubles`; não possui transporte padrão.
7. **Erros externos poderiam vazar detalhes:** mensagens de SDK/driver são suprimidas nos logs; relatório retorna fase, estado e limpeza, sem senha/token/URL de conexão. Testes com sentinelas verificam ausência desses valores.
8. **Fechamento de recursos poderia mascarar falha:** erros de release/end são registrados como falha, sem aprovação indevida. Limpeza incompleta exige reconciliação; não informa sucesso e não tenta novamente cegamente.
9. **Preflight podia passar sem bibliotecas:** passou a importar as dependências reais; foi verificado que falha quando node_modules não está disponível.

Nenhum teste de limpeza apagou dados do Supabase: create/delete e SQL foram métodos dos test doubles em memória. As listas de IDs usadas na compensação são limitadas aos IDs retornados durante a execução de teste; o usuário fictício preexistente permaneceu intacto. O caso de falha da limpeza SQL não tenta apagar identidades Auth depois; falha de limpeza Auth é sinalizada, sem ser tratada como sucesso.

## Testes e evidências

| Grupo | Resultado |
|---|---|
| Executor e dependências reais | **16 testes aprovados**, zero falhas/ignorados |
| Regressão Node existente em Node 22 | **109 aprovados** |
| Regressão Python/SQLite existente | **20 aprovados** |
| Total | **145 aprovados** |
| Sintaxe dos arquivos reais | `node --check` dos dois executores aprovado |
| Preflight real | Aprovado com Node 22 e bibliotecas instaladas |
| Negativos adicionais | Preflight rejeita Node 24; sem node_modules falha com módulo ausente |
| Whitespace/integridade de diff | `git diff --check` aprovado |

Cenários do executor: alvo/modo/gates errados; configuração incompleta; host sobrescrito; senha curta/e-mails duplicados; check sem instanciar clientes; fluxo completo com doubles; falha ao conectar; falha de preflight Auth/identidade existente; segunda criação falha; falha na segunda vinculação e rollback; falha no login; limpeza SQL falha; limpeza Auth falha; encerramento falha; logs sem sentinelas; CLI bloqueada mesmo com gates YES. Os testes de falhas invocam o executor real, não uma cópia do seu algoritmo.

[Evidência estruturada com hashes dos arquivos testados](evidencias/etapa2b-local-20261102.json). Hash não substitui a repetição dos comandos, mas identifica o código exato deste ensaio. Os caminhos de logs integrais temporários não são publicados; resultados e dados reproduzíveis estão no repositório.

## Como repetir sem segredos

Na branch autorizada, com Node 22.22.0 disponível:

```sh
cd scripts/homologacao
node --version
npm --version
npm ci --ignore-scripts --no-audit --no-fund
npm ls --all
npm run check
npm run verify:dependencies
npm run preflight
npm test
cd ../..
npm test
npm run test:infra
```

Não configurar nenhuma variável de segredo. Não definir credenciais Supabase para esses comandos. Testes usam textos `FIXTURE_*` e e-mails `.invalid`, não chaves/contas reais. Para outro runtime, o preflight deve parar; não relaxar o requisito para contornar erro. O Node instalado temporariamente nesta sessão não é artefato do repositório.

## GitHub Actions

Workflow `.github/workflows/decola-2b-validation.yml` continua **manual-only**, com guarda da branch exclusiva, `contents: read`, sem secrets, sem environments privilegiados, sem persistência de credenciais do checkout, sem deploy e timeout de dez minutos. Actions checkout/setup-node foram fixadas por SHA conferido nas tags oficiais. Inclui install limpo, imports, preflight, testes do executor e regressão existente.

**Não foi acionado.** Não se declara execução verde no GitHub nem consumo gratuito confirmado. Como as verificações foram concluídas localmente, não houve necessidade de assumir minutos/custos de Actions. Qualquer execução remota dependerá de confirmação da disponibilidade sem custo ou autorização específica para eventual despesa. O workflow não busca segredos nem possui etapa de criação de usuários; mesmo gates YES não habilitam os CLIs.

## Pendências que continuam fora desta autorização

- Validar Auth/Postgres/RLS reais, criação/vinculação e limpeza efetivas exige autorização separada para identidades, dados, acesso privilegiado e procedimento de reconciliação. Não executar o runner remoto nesta revisão: ele está desativado por CLI.
- Uma chamada de criação que falhe após o provedor efetivar o usuário, sem devolver ID, exige reconciliação autorizada; o teste offline não pode provar esse estado remoto nem justificar retry automático.
- Não foram executados testes de e-mail, rede/TLS do Supabase, concorrência real em Postgres, callbacks ou autenticação HTTP/Data API. Resultados SQL do test double não validam RLS real.
- Não foi realizada atualização/auditoria de vulnerabilidades de toda a cadeia; integridade e versões estão verificadas. Qualquer mudança futura de versões requer novo lock e repetição dos testes.

Nenhuma dessas pendências autoriza contratação, criação de projeto/conta, uso de service_role, publicação, merge, Worker ou Asaas. A versão atual apenas elimina as pendências técnicas de execução **offline** indicadas no comando do usuário.
