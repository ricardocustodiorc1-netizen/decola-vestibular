# Método Decola — planejamento para aprovação

**Entender, Registrar, Praticar e Recordar.**

Data: 01/11/2026. Repositório: `ricardocustodiorc1-netizen/decola-vestibular`. Branch exclusiva: `dev/navegacao-leo-familias-20261031`. Base analisada: `6dca0b8`. **Somente documentação; nenhuma funcionalidade desta proposta foi implementada.**

## Documentos

1. [Metodologia e princípios pedagógicos](METODOLOGIA.md): objetivos, Caderno físico/digital/combinado, feedback, recuperação ativa, revisões e limites das evidências.
2. [Fluxo do aluno e proposta de interface](FLUXO-E-INTERFACE.md): jornada completa, ações opcionais, celular/computador, estados de erro e retorno.
3. [Arquitetura, implementação e piloto](ARQUITETURA-E-PILOTO.md): análise do código, compatibilidade, dados futuros, etapas com aceite/testes e roteiro de Porcentagem.

## Decisões propostas

- Piloto inicial com anotações físicas ou registro fora da plataforma; editor digital próprio em etapa posterior.
- Desafio com três perguntas curtas, sem nota punitiva, inicialmente sem consulta; aluno pode pedir ajuda, consultar ou adiar sem perder a aula.
- Perguntas e critérios de correção revisados por pessoa responsável pelo conteúdo; IA opcional para explicações, solicitada pelo aluno, com fallback local identificado.
- Revisões de referência em D+1, D+3 e D+7; adaptação transparente, sem sequência de cobranças atrasadas nem bloqueio de progressão.
- Novos dados pedagógicos separados de respostas, simulados, revisão legada e navegação existentes. Sem contas, sincronização ou novos serviços no piloto.
- O método dá identidade ao percurso do Decola, mas não reivindica invenção exclusiva das estratégias de aprendizagem que utiliza nem promete aprovação ou retenção garantida.

## Aprovação necessária antes de código

Aprovar escopo do piloto, rubrica das três perguntas, regra de revisão adaptativa, dados mínimos a registrar e prioridade do editor digital. Aprovar o planejamento não autoriza, por si só, publicação, alteração de Worker ou novas integrações.

## Validação desta entrega

Documentação confrontada com os módulos existentes. A suíte atual será executada como verificação de integridade, sem afirmar que testes aprovados validam recursos ainda não implementados. Resultado: `npm test` — **27 testes passaram, 0 falharam**. `git diff --check` aprovado. Apenas quatro arquivos Markdown novos, sem alterações de código ou dados. Links internos locais e contas dos exemplos conferidos.
