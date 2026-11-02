// Content identity is independent of display order and local progress.
(() => {
 const questions=[
  {id:'porcentagem-q1',q:'Quanto é 20% de 180?',opts:['30','36','40'],answer:1,why:'20 ÷ 100 = 0,20; 180 × 0,20 = 36.',hints:['20% significa 20 de cada 100. Transforme 20% em decimal antes de multiplicar.','Calcule 10% de 180 e depois dobre esse valor.']},
  {id:'porcentagem-q2',q:'Uma camiseta de R$ 80 tem 10% de desconto. Qual o preço final?',opts:['R$ 72','R$ 70','R$ 78'],answer:0,why:'10% de 80 = 8. Preço final: 80 − 8 = R$ 72.',hints:['Desconto diminui o preço, não aumenta. Descubra primeiro 10% de 80.','10% de 80 é 8. Subtraia esse desconto do preço original.']},
  {id:'porcentagem-q3',q:'Um produto de R$ 120 aumentou 25%. Qual é o novo preço?',opts:['R$ 125','R$ 145','R$ 150'],answer:2,why:'25% de 120 = 30. Novo preço: 120 + 30 = R$ 150.',hints:['Aumento significa somar ao valor inicial. Primeiro descubra 25% de 120.','25% é um quarto: divida 120 por 4 e some o resultado a 120.']}
 ];
 for(const q of questions){Object.freeze(q.opts);Object.freeze(q.hints);Object.freeze(q);}
 const migrations=Object.freeze([
  Object.freeze({key:'decola-smart-percent-v2',indexes:Object.freeze([1,2])}),
  Object.freeze({key:'decola-smart-percent-v1',indexes:Object.freeze([1,2]),legacyAnswers:true})
 ]);
 globalThis.DecolaPercentageLesson=Object.freeze({id:'matematica.porcentagem',key:'decola-smart-percent-v3',questions:Object.freeze(questions),migrations});
})();
