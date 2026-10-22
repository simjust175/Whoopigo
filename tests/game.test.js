import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../lib/game.js';
import { createApp } from '../server.js';

function fixture(type = 'hiding', extra = {}) {
  let time = 100000;
  const game = new Game({ now: () => time });
  const room = game.create({ game: type, theme: 'chanukah', ...extra });
  const a = game.join(room.code, 'The Latke Legends'), b = game.join(room.code, 'The Bright Sparks');
  const act = (action, difficulty) => game.action(room.code, room.hostToken, action, difficulty);
  return { game, room, a, b, act, advance: ms => { time += ms; game.tick(); } };
}
test('Host and player credentials never appear in public state', () => {
  const { game, room, a, act } = fixture(); act('start');
  const state = game.snapshot(room, '');
  assert.equal(state.role, 'screen'); assert.equal(state.question.correct, undefined);
  const wire = JSON.stringify(state); assert.ok(!wire.includes(room.hostToken)); assert.ok(!wire.includes(a.id));
});
test('Only the host can advance a game', () => {
  const { game, room, a } = fixture();
  assert.throws(() => game.action(room.code, a.id, 'start'), /Only the host/);
});
test('Each team answers once; revealing or retrying cannot award extra points', () => {
  const { game, room, a, b, act } = fixture(); act('start');
  game.answer(room.code, a.id, 0); game.answer(room.code, b.id, 1);
  assert.throws(() => game.answer(room.code, a.id, 0), /already locked/);
  act('reveal'); assert.equal(a.score, 100); assert.equal(b.score, 0);
  assert.throws(() => act('reveal'), /no active/); assert.equal(a.score, 100);
});
test('Timers close questions and reject answers after the deadline', () => {
  const { game, room, a, act, advance } = fixture(); act('start'); advance(45001);
  assert.equal(room.phase, 'results'); assert.throws(() => game.answer(room.code, a.id, 0), /not open/);
});
test('Pausing freezes deadlines and reveals, resuming preserves the remaining time', () => {
  const { game, room, a, act, advance } = fixture(); act('start'); advance(7000); act('pause');
  assert.throws(() => game.answer(room.code, a.id, 0), /not open/);
  advance(60000); assert.equal(room.phase, 'question'); act('resume');
  assert.equal(room.deadline - game.now(), 38000); assert.equal(game.now() - room.openedAt, 7000);
  advance(38001); assert.equal(room.phase, 'results');
});
test('Crowd votes remain secret, and tied favourites both earn points', () => {
  const { game, room, a, b, act } = fixture('crowd'); act('start');
  game.answer(room.code, a.id, 0); game.answer(room.code, b.id, 1); act('reveal');
  assert.equal(room.phase, 'predict'); assert.equal(game.snapshot(room, a.id).result, null);
  game.answer(room.code, a.id, 1); game.answer(room.code, b.id, 0); act('reveal');
  assert.deepEqual(room.result.correct, [0, 1]); assert.equal(a.score, 100); assert.equal(b.score, 100);
});
test('An empty crowd vote awards no points', () => {
  const { game, room, a, act } = fixture('crowd'); act('start'); act('reveal'); game.answer(room.code, a.id, 0); act('reveal');
  assert.deepEqual(room.result.correct, []); assert.equal(a.score, 0);
});
test('Memory scene hides changes during study, requires three unique choices, and gives partial credit', () => {
  const { game, room, a, b, act, advance } = fixture('changes'); act('start');
  assert.equal(game.snapshot(room, a.id).question.changed, undefined);
  assert.throws(() => game.answer(room.code, a.id, ['Cushion', 'Top book', 'Wall picture']), /not open/);
  advance(18000); assert.equal(room.phase, 'question');
  assert.throws(() => game.answer(room.code, a.id, ['Cushion', 'Cushion', 'Top book']), /three different/);
  game.answer(room.code, a.id, ['Cushion', 'Top book', 'Wall picture']); game.answer(room.code, b.id, ['Cushion', 'Teapot', 'Clock']); act('reveal');
  assert.equal(a.score, 100); assert.equal(b.score, 33);
});
test('Custom family questions replace fictional samples and are validated', () => {
  const custom = [{ prompt: 'Who brought the cake?', options: ['A', 'B', 'C', 'D'], correct: 2 }];
  const { game, room, a, act } = fixture('family', { custom }); act('start');
  assert.equal(game.snapshot(room, a.id).question.prompt, custom[0].prompt); game.answer(room.code, a.id, 2); act('reveal');
  assert.equal(a.score, 100); act('next'); assert.equal(room.phase, 'finished');
  assert.throws(() => game.create({ game: 'family', custom: [{ ...custom[0], correct: 9 }] }), /correct answer/);
});
test('Final Table challenge uses a distinct question and awards 200 points', () => {
  const { game, room, a, act } = fixture('final'); act('start', 'hard');
  assert.match(game.snapshot(room, a.id).question.prompt, /all eight nights/);
  game.answer(room.code, a.id, 1); act('reveal'); assert.equal(a.score, 200);
});
test('The full evening transitions through every game and finishes on one scoreboard', () => {
  const { game, room, a, act } = fixture('playlist'); act('start');
  const kinds = new Set(); let safety = 0;
  while (room.phase !== 'finished' && ++safety < 100) {
    const kind = game.kind(room); kinds.add(kind);
    if (room.phase === 'study' || room.phase === 'vote') act('reveal');
    else if (room.phase === 'question' || room.phase === 'predict') {
      if (kind === 'changes') game.answer(room.code, a.id, game.question(room).changes);
      else game.answer(room.code, a.id, game.question(room).correct ?? 0);
      act('reveal');
    } else act('next');
  }
  assert.equal(room.phase, 'finished'); assert.equal(kinds.size, 5); assert.equal(room.questions.length, 15); assert.ok(a.score >= 1200);
});
test('Duplicate team names, unknown rooms, and late joining are rejected', () => {
  const { game, room, act } = fixture();
  assert.throws(() => game.join(room.code, 'the latke legends'), /already/);
  assert.throws(() => game.room('000000'), /not be found/);
  act('start'); assert.throws(() => game.join(room.code, 'Latecomers'), /started/);
});
test('Fifty teams can submit a round; reconnect snapshots preserve their answers and scores', () => {
  const { game, room, a, act } = fixture();
  for (let i = 2; i < 50; i++) game.join(room.code, `Table ${i + 1}`);
  assert.throws(() => game.join(room.code, 'Too many'), /50-team/);
  act('start'); for (const t of room.teams) game.answer(room.code, t.id, 0);
  assert.equal(game.snapshot(room, a.id).me.answer, 0); act('reveal');
  assert.equal(game.snapshot(room, a.id).me.score, 100); assert.equal(room.teams.length, 50);
});
test('The HTTP app serves assets and validates room creation, origin, and host access', async t => {
  const { server } = createApp(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (url, body, headers = {}) => fetch(base + url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  assert.equal((await fetch(base)).status, 200);
  assert.match((await fetch(base + '/app.js')).headers.get('content-type'), /javascript/);
  assert.equal((await post('/api/rooms', { game: 'unknown' })).status, 400);
  assert.equal((await post('/api/rooms', { game: 'hiding' }, { Origin: 'https://another.example' })).status, 403);
  const response = await post('/api/rooms', { game: 'hiding' }); assert.equal(response.status, 201);
  const room = await response.json(); assert.match(room.code, /^\d{6}$/);
  assert.equal((await post(`/api/rooms/${room.code}/action`, { token: 'wrong', action: 'start' })).status, 403);
  assert.equal((await fetch(base + '/missing-file')).status, 404);
});
