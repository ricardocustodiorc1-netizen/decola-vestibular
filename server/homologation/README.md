# Preparação local da homologação

**Somente local e desconectada. Não é login/assinatura real.** Nenhum arquivo desta pasta é incluído no site. O script não lê variáveis secretas, não usa fetch/SDK externo e não abre conexão com provedor.

```sh
npm test
npm run test:infra
npm run dev:homologation
```

Apenas `http://127.0.0.1:8001/health` responde com o estado desconectado. `npm run dev` continua servindo o site em 8000 sem qualquer mudança. O backend novo não serve arquivos da raiz e não expõe `.env`, SQL ou código. Não configurar túnel ou publicar este servidor.

| Contrato HTTP | Comportamento atual |
|---|---|
| GET /health | 200, Auth/pagamentos não conectados |
| /api/auth/signup, /api/auth/login, /api/auth/recover | 503 explícito; não cria contas, sessões ou mensagens |
| GET /api/me | 401 por padrão; testes injetam sessão e principal fictícios |
| POST /api/trial/start, /api/trial/cancel | 401 por padrão; contrato testado com sessão, CSRF e repositório injetados |
| POST /api/subscription/intent | Exige escolha expressa/versionada no teste; sempre 503 sem criar checkout |

O BFF usa token opaco, CSRF por sessão, cookie HttpOnly/SameSite (Secure na configuração de homologação), revalidação de conta e verificação de propriedade via repositório. Só o teste cria sessões fictícias diretamente por API interna; não existe rota para isso. O construtor de checkout gera um objeto `sent:false`, restrito a sandbox e callbacks `.invalid`; não retorna link de pagamento nem aceita API key. Comparação de token de webhook é helper isolado com dados fictícios; não há endpoint de webhook ou reconciliador conectado.

O store de sessões é volátil, limitado e válido para ensaios locais, não para produção/múltiplas instâncias. Antes de homologar: implementar sessão persistente/revogação/rotação/limites, adaptar Supabase Auth e Postgres, validar RLS e integrar inbox/outbox e reconciliação. Configurações JSON são contratos próprios, não arquivos para importar no dashboard ou CLI Supabase.

A migração SQL é **rascunho não executado em Postgres**. O ambiente atual não tem CLI Supabase, Docker ou Postgres disponíveis. Não confundir os testes SQLite com validação SQL/RLS real. Seguir `docs/SPRINT-4-HOMOLOGACAO.md` antes de criar ou conectar qualquer recurso.
