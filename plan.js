export const areas = [
  { id: 'linguagens', title: 'Linguagens e suas Tecnologias', short: 'Linguagens', icon: 'Aa', description: 'Interpretação, literatura, língua estrangeira e as diferentes formas de se expressar.', topic: 'Interpretação de textos e funções da linguagem', color: 'purple' },
  { id: 'humanas', title: 'Ciências Humanas e suas Tecnologias', short: 'Humanas', icon: '◎', description: 'História, geografia, filosofia e sociologia para compreender o mundo.', topic: 'Cidadania, movimentos sociais e geografia urbana', color: 'orange' },
  { id: 'natureza', title: 'Ciências da Natureza e suas Tecnologias', short: 'Natureza', icon: '⚗', description: 'Biologia, física e química conectadas aos desafios do dia a dia.', topic: 'Ecologia, energia e transformações químicas', color: 'green' },
  { id: 'matematica', title: 'Matemática e suas Tecnologias', short: 'Matemática', icon: '∑', description: 'Raciocínio lógico, números e resolução de problemas na prática.', topic: 'Porcentagem, proporção e leitura de gráficos', color: 'blue' },
  { id: 'redacao', title: 'Redação', short: 'Redação', icon: '✎', description: 'Organize suas ideias e construa uma argumentação com a sua voz.', topic: 'Tese, repertório e proposta de intervenção', color: 'yellow' }
];
export const questions = [
  { area: 'linguagens', text: 'Em “Doe sangue. Salve vidas.”, qual é o principal objetivo da mensagem?', options: ['Narrar uma história', 'Convencer o leitor a agir', 'Descrever uma paisagem'], answer: 1, explanation: 'O uso de verbos no imperativo busca persuadir o leitor a agir.' },
  { area: 'humanas', text: 'Qual atitude é um exemplo de participação democrática?', options: ['Impedir opiniões diferentes', 'Ignorar decisões coletivas', 'Participar de um conselho comunitário'], answer: 2, explanation: 'Conselhos comunitários permitem participar de decisões de interesse coletivo.' },
  { area: 'natureza', text: 'Em uma cadeia alimentar, qual organismo produz seu próprio alimento por fotossíntese?', options: ['Uma planta', 'Um fungo', 'Um gafanhoto'], answer: 0, explanation: 'Plantas são produtoras: transformam energia luminosa em energia química.' },
  { area: 'matematica', text: 'Um livro de R$ 80 recebeu 25% de desconto. Qual é o novo preço?', options: ['R$ 55', 'R$ 60', 'R$ 65'], answer: 1, explanation: '25% de 80 são 20. Portanto, 80 − 20 = R$ 60.' },
  { area: 'redacao', text: 'Qual elemento fortalece uma argumentação em um texto dissertativo?', options: ['Uma lista de palavras sem conexão', 'Somente repetir o tema', 'Uma evidência relacionada à tese'], answer: 2, explanation: 'Evidências pertinentes sustentam a tese e dão consistência aos argumentos.' }
];
export function createPlan(profile, answers) {
  const results = questions.map(q => ({ ...areas.find(a => a.id === q.area), correct: answers[q.area] === q.answer }));
  const priority = [...results].sort((a, b) => Number(a.correct) - Number(b.correct));
  const minutes = Number(profile.hours) * 60;
  const sessions = Array.from({ length: Number(profile.days) }, (_, i) => ({ day: i + 1, area: priority[i % priority.length], minutes, practice: i === Number(profile.days) - 1 ? 'Revisão da semana + exercícios comentados' : 'Conceitos essenciais + exercícios + revisão dos erros' }));
  return { results, priority, sessions, score: results.filter(r => r.correct).length, weeklyHours: Number(profile.hours) * Number(profile.days) };
}
