# Professor Leo 2.0 — preparação segura (não implantado)

O site GitHub Pages já envia POST para `https://professor-leo-api.ricardocustodio-rc1.workers.dev/chat` e espera `{ "answer": "..." }`. Este diretório contém uma proposta de backend compatível, **não publicada**.

## Para implantar com segurança
1. No Cloudflare Workers, configure `OPENAI_API_KEY` como **Secret**. Nunca coloque a chave em arquivos GitHub, no navegador ou no chat.
2. Configure autenticação real de estudantes (sessão verificada no Worker), limite de mensagens por usuário e IP, cotas e alertas de gastos **antes de abrir o endpoint ao público**. CORS não impede requisições feitas fora do navegador.
3. Revise o modelo disponível na sua conta e o custo. O exemplo usa `gpt-5.4-mini`; ajuste se necessário.
4. Implante primeiro em Worker de testes, não substitua o Worker atual sem teste de regressão.
5. Teste respostas, erro de chave, entrada inválida, repetição, limites, histórico e retomada de exercícios.
6. Somente depois, troque a URL do frontend (se necessária) e publique.

## Estado atual
- O frontend existente já usa Worker e exibe resposta. A captura de tela mostra conversa funcional.
- Não há evidência neste repositório de que o Worker publicado use o código aqui proposto.
- Histórico curto vem do navegador; progresso e diagnóstico não são ainda uma conta persistente.
- O arquivo de backend é uma base de desenvolvimento, **não está pronto para produção pública sem autenticação e rate limiting**.
