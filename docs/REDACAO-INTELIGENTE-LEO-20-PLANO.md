# Decola Vestibular — Redação Inteligente do Professor Leo 2.0

Status: especificação inicial aprovada para planejamento. NÃO implementado nem publicado.
Branch de trabalho: dev/navegacao-leo-familias-20261031.

## Objetivo
Ensinar o estudante a escrever redações melhores e buscar notas altas no ENEM, com correção pedagógica, feedback claro e evolução ao longo do tempo. Não prometer nota oficial nem aprovação.

## Dois modos
### 1. Treinamento Livre
- Escolher ou receber tema.
- Digitar ou colar texto, inclusive textos de referência.
- Solicitar análise por cinco competências ENEM, com nota **estimada** (0–200 por competência, total 0–1000), justificativas e sugestões.
- Identificar avaliações como treino, sem presumir autoria.

### 2. Simulado ENEM
- Tema e textos motivadores, editor próprio, cronômetro opcional e salvamento de rascunho.
- Informar previamente as regras e registrar versões e duração apenas com transparência e proteção de dados.
- Possível limitação de colagem como fricção pedagógica, nunca como prova de autoria.
- Avaliação estimada com critérios ENEM, feedback e plano de melhoria.

## Defesa da Redação
Após entrega, Leo formula perguntas personalizadas sobre tese, repertório, argumentos e proposta de intervenção. O aluno explica suas escolhas e recebe orientação. As respostas ajudam a avaliar compreensão, não comprovam autoria.

## Relatório de correção
- Competência 1: modalidade escrita formal.
- Competência 2: compreensão do tema e repertório.
- Competência 3: seleção, organização e interpretação de argumentos.
- Competência 4: mecanismos linguísticos de coesão.
- Competência 5: proposta de intervenção respeitando direitos humanos.
- Nota estimada e justificativa por competência; trechos comentados; próximos passos; comparação de versões.
- Regras explícitas para situações de nota zero e impossibilidade de avaliar, sem afirmar equivalência com correção oficial.

## Integridade e privacidade
- Nunca acusar automaticamente plágio ou uso de IA.
- Detectores de IA e indicadores de digitação não são provas confiáveis de autoria.
- Explicar coleta, finalidade, retenção e exclusão de redações e metadados; considerar LGPD e estudantes menores.
- Não enviar redações a serviços externos sem revisar política de dados e autorização apropriada.
- Não incluir segredos ou chaves no cliente.
- Calibrar avaliações com redações já corrigidas por humanos, medir divergências e revisar rubricas.

## Plano incremental
1. Prototipar navegação do laboratório, editor, seleção de modo e relatório demonstrativo **sem atribuir notas fictícias a textos reais**.
2. Implementar persistência segura e histórico; decidir infraestrutura e controles de acesso.
3. Definir contrato da API do Leo para correção; validar segurança, custos, limites de uso e compatibilidade com o Worker existente.
4. Integrar avaliação real e Defesa da Redação, com tratamento de falhas.
5. Testar com redações de referência e usuários piloto; revisar UX e acessibilidade.
6. Somente após autorização explícita considerar merge, deploy ou alterações no Worker.

## Restrições atuais
- Não modificar main nem publicar.
- Não alterar Cloudflare Worker nem allowlist de origens sem aprovação específica do ajuste.
- Preservar funcionalidades atuais de Matemática, Linguagens e Professor Leo.
