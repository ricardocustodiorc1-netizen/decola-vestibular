import test from 'node:test';
import assert from 'node:assert/strict';
import { areas, questions, createPlan } from '../plan.js';
const correct = Object.fromEntries(questions.map(q => [q.area, q.answer]));
test('plano prioriza erros, preserva tempo e inclui as cinco áreas', () => {
  const plan = createPlan({ days: '5', hours: '1.5' }, { ...correct, matematica: 0 });
  assert.equal(plan.priority[0].id, 'matematica');
  assert.equal(plan.score, 4);
  assert.equal(plan.weeklyHours, 7.5);
  assert.equal(plan.sessions.length, 5);
  assert.ok(plan.sessions.every(s => s.minutes === 90));
  assert.equal(new Set(plan.sessions.map(s => s.area.id)).size, 5);
});
test('todas as combinações oferecidas mantêm carga horária e duração', () => {
  for (const days of [3, 4, 5, 6, 7]) for (const hours of [1, 1.5, 2, 3]) {
    const plan = createPlan({ days, hours }, correct);
    assert.equal(plan.sessions.length, days);
    assert.equal(plan.sessions.reduce((total, s) => total + s.minutes, 0), days * hours * 60);
    assert.equal(plan.score, 5);
  }
});
test('diagnóstico tem uma questão válida para cada frente', () => {
  assert.deepEqual(questions.map(q => q.area), areas.map(a => a.id));
  assert.ok(questions.every(q => q.options[q.answer]));
  const plan = createPlan({ days: 3, hours: 1 }, {});
  assert.equal(plan.score, 0);
});
