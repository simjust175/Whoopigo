import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../lib/game.js';

for (const kind of ['hiding', 'family', 'final', 'changes', 'crowd', 'playlist']) {
  test(`Double finale scores correctly in ${kind}, including the full evening`, () => {
    const game = new Game();
    const room = game.create({ game: kind, finaleTwist: true, playMode: 'projector', tableNames: ['Sparks'] });
    const act = action => game.action(room.code, room.hostToken, action, 'hard');
    const answer = value => game.hostAnswer(room.code, room.hostToken, room.teams[0].id, value, { index: room.index, phase: room.phase });
    act('start'); assert.equal(game.multiplier(room), 1);
    act('reveal'); if (room.phase === 'predict' || room.phase === 'question') act('reveal');
    room.index = room.questions.length - 2; act('next');
    const q = game.question(room), actualKind = game.kind(room);
    assert.equal(game.snapshot(room).multiplier, 2);
    if (room.phase === 'study') act('reveal');
    if (room.phase === 'vote') { answer(1); act('reveal'); }
    answer(actualKind === 'changes' ? q.changes : actualKind === 'crowd' ? 1 : q.correct);
    act('reveal');
    assert.equal(room.teams[0].earned, actualKind === 'final' ? 400 : 200);
    const score = room.teams[0].score;
    assert.throws(() => act('reveal')); assert.equal(room.teams[0].score, score);
    act('next'); assert.equal(room.phase, 'finished');
  });
}
test('Twist defaults off, validates input and works with single custom rounds', () => {
  const game = new Game();
  assert.throws(() => game.create({ game: 'hiding', finaleTwist: 'yes' }), /finale setting/);
  const custom = [{ prompt: 'Who?', options: ['A','B','C','D'], correct: 0 }];
  for (const enabled of [false, true]) {
    const room = game.create({ game: 'family', custom, ...(enabled ? { finaleTwist: true } : {}) });
    const team = game.join(room.code, 'Cousins');
    game.action(room.code, room.hostToken, 'start'); game.answer(room.code, team.id, 0);
    game.action(room.code, room.hostToken, 'reveal');
    assert.equal(team.score, enabled ? 200 : 100);
  }
});

test('Finale doubles memory partial credit and never invents crowd votes', () => {
  const game = new Game();
  for (const kind of ['changes', 'crowd']) {
    const room = game.create({ game: kind, finaleTwist: true, playMode: 'projector', tableNames: ['Cousins'] });
    room.phase = 'results'; room.index = room.questions.length - 2;
    game.action(room.code, room.hostToken, 'next');
    game.action(room.code, room.hostToken, 'reveal');
    const q = game.question(room);
    const value = kind === 'changes' ? [q.changes[0], ...q.objects.filter(o => !q.changes.includes(o)).slice(0, 2)] : 0;
    game.hostAnswer(room.code, room.hostToken, room.teams[0].id, value, {index: room.index, phase: room.phase});
    game.action(room.code, room.hostToken, 'reveal');
    assert.equal(room.teams[0].score, kind === 'changes' ? 66 : 0);
  }
});
