# Sprint 3 — migração do progresso local

Planejamento, sem coleta ou alteração dos dados atuais. A referência executável só aceita envelope de Porcentagem fornecido pelo teste. Não há exportador, upload, sincronização automática ou importação de dados reais implementados.

## Inventário e ordem proposta

| Origem existente | Conteúdo | Estratégia futura |
|---|---|---|
| `decola-vestibular:progress:v1` | Perfil, diagnóstico, plano derivado, rota e dias concluídos | Adaptador v1 separado; importar apenas campos aprovados, recalcular derivados; nome não verifica identidade |
| `decola-smart-percent-v3` | Respostas/tentativas/estado por índice 0–2 | Primeiro piloto: converter índice para `porcentagem-q1/q2/q3`, versão `percentage-v3` |
| `decola-smart-percent-v1/v2` | Formatos antigos de Porcentagem | Manter cópia original; usar migrações existentes após validação, sem misturar automaticamente com estado v3 |
| `decola-method-memory:v1` | Preferência de anotação, respostas, autoavaliação e reforço | Adaptador próprio com rubricas `pilot-1`; texto livre precisa consentimento e privacidade; fora da referência local |
| `decola-smart-fractions-v1`, `equations`, `geometry`, `statistics`, `language-interpretation` (prefixo `decola-smart-`) | Aulas adicionais e respostas | Catalogar IDs/versões antes de importar; não aplicar esquema de Porcentagem |
| `decola-vestibular:simulado-enem-v1`, `simulado-recuperacao-v1`, `simulado-dominio-progressivo-v1` | Simulados, recuperação e domínio | Preservar rodada, itens e ordem, resposta parcial/final; novo adaptador e testes |
| Chaves `leo-math-*`, `leo-portugues*`, `leo-humanas*`, `leo:daily-mission:v1`, `leo:achievements:v1`, `revisao-espacada-v1`, `decola-leo-practice-v1` | Treinos, histórico, calendário e revisões | Inventariar esquema por chave, importar em lotes próprios; não despejar todo localStorage |

Inventário verificado por leitura de `app.js`, `percentage-content.js`, `memory-pilot.js`, `professor-leo.js` e `study-area.js`; não foi lido armazenamento de aluno real. Históricos de conversa e dados familiares não entram automaticamente em migração pedagógica. Chaves desconhecidas são ignoradas no exportador futuro e não apagadas.

## Jornada de migração

1. Antes de trocar origem/aparelho, oferecer exportação validada e download voluntário da cópia. LocalStorage é isolado por origem/navegador; a nova área não consegue ler diretamente dados do GitHub Pages ou de `127.0.0.1`. No celular, não prometer transferência automática.
2. Autenticar e identificar explicitamente estudante de destino; em aparelho compartilhado, mostrar nome de destino e resumo do que será importado. Perfil local não autentica titularidade. Não associar tudo ao primeiro login silenciosamente.
3. Selecionar os dados, consentir e visualizar resumo. Não incluir conversa/senha/pagamento/estado de assinatura. Manter original intacto e permitir desistir.
4. Backend limita tamanho, aceita versão conhecida e campos de allowlist, converte IDs pelo catálogo e rejeita tentativas/alternativas incoerentes. O piloto local exige envelope exato, rejeita campos extras, JSON com chaves duplicadas, bool como inteiro e versão desconhecida.
5. Transação registra importação por `(student_id, request_id)` e digest normalizado, escreve registros ausentes e devolve resultado após commit. Mesma chave/conteúdo é idempotente; mesma chave com conteúdo diferente é conflito.
6. Se já há resposta na nuvem, mantê-la e listar conflito; não somar tentativas nem substituir silenciosamente. A referência usa `keptExisting`. Resolver conflito depois com UI e decisão explícita; continuar estudando não depende da migração.
7. Confirmar quantidade e origem importada. Uma resposta importada não prova avaliação supervisionada, pagamento ou domínio real. Manter origem `local-import` e não usá-la para conceder assinatura, certificados ou acesso.
8. Não limpar cópia local após sucesso; oferecer exclusão somente por ação separada e revisável. Logout não apaga original nem transfere progresso para outra conta. Dados de nuvem usam namespace da conta e cache local precisa limpar apenas sessão correspondente.

## Limitações e critérios de aceite

Não é possível recuperar dados já removidos do navegador sem backup anterior. Para mover origens, exportar na origem antiga antes; publicação não recupera localStorage perdido. Na ausência de conta, a experiência local atual continua funcionando.

Primeira homologação: backup e importação de Porcentagem com consentimento, conta A/B isoladas, primeira resposta errada e segunda tentativa intactas, acerto na primeira, esgotamento, reset prévio, arquivo inválido/grande, queda no meio, reenvio, duas abas e conflito. Revisão/posição de leitura são estado de UI e não migram automaticamente; a origem atual deve manter funcionamento. Em versões desconhecidas, conservar arquivo e explicar incompatibilidade.

Modelo local testa alguns desses contratos com dados sintéticos, sem migração real. Desafio da Memória, plano e simulados só serão elegíveis após adaptadores específicos e regressão. Ainda faltam exportação/importação de UI, autenticação, Postgres/RLS, controle de versão otimista, retomada de lotes e teste real entre dispositivos. Não há promessa de sincronização pronta.
