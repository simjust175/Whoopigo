import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, readFileSync, unlinkSync, rmdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Game } from '../lib/game.js';
import { fileStorage } from '../lib/storage.js';
import { getQuestions, gameTypes, themes } from '../lib/content.js';
import { tileOrder } from '../public/stage.js';
import { createApp } from '../server.js';

test('A restarted game restores credentials, answers and scores, and pauses active timers', t => {
  const dir = mkdtempSync(path.join(tmpdir(), 'whoopigo-test-'));
  const filename = path.join(dir, 'rooms.json');
  t.after(() => { if (existsSync(filename)) unlinkSync(filename); rmdirSync(dir); });
  let time = 100000;
  const storage = fileStorage(filename);
  let game = new Game({ now: () => time, storage });
  let room = game.create({ game: 'hiding' });
  const team = game.join(room.code, 'The Test Table');
  const hostToken = room.hostToken, code = room.code;
  game.action(code, hostToken, 'start');
  time += 10000; game.answer(code, team.id, 0);
  time += 20000;
  game = new Game({ now: () => time, storage }); room = game.room(code);
  assert.equal(room.paused, true); assert.equal(room.deadline, null);
  assert.equal(game.snapshot(room, team.id).me.answer, 0);
  assert.equal(game.snapshot(room, hostToken).role, 'host');
  game.action(code, hostToken, 'resume');
  assert.equal(room.deadline - time, 35000);
  assert.equal(time - room.openedAt, 10000);
  game.action(code, hostToken, 'reveal');
  game = new Game({ now: () => time, storage });
  assert.equal(game.snapshot(game.room(code), team.id).me.score, 100);
  assert.throws(() => game.action(code, hostToken, 'reveal'), /no active/);
});

test('A damaged saved game is never silently replaced with an empty backup', t => {
  const dir = mkdtempSync(path.join(tmpdir(), 'whoopigo-test-'));
  const filename = path.join(dir, 'rooms.json');
  t.after(() => { unlinkSync(filename); rmdirSync(dir); });
  writeFileSync(filename, 'broken backup');
  assert.throws(() => new Game({ storage: fileStorage(filename) }));
  assert.equal(readFileSync(filename, 'utf8'), 'broken backup');
});

test('Memory snapshots show the right scene without sending the answer list', () => {
  const game = new Game(); const room = game.create({ game: 'changes' });
  const team = game.join(room.code, 'Sharp Eyes');
  game.action(room.code, room.hostToken, 'start');
  assert.match(game.snapshot(room, team.id).question.image, /-a\.jpg$/);
  game.action(room.code, room.hostToken, 'reveal');
  const state = game.snapshot(room, team.id);
  assert.match(state.question.image, /-b\.jpg$/);
  assert.equal(state.question.changed, undefined);
  assert.equal(state.question.changes, undefined);
  assert.equal(state.question.before, undefined);
  game.answer(room.code, team.id, room.questions[0].changes);
  game.action(room.code, room.hostToken, 'reveal');
  assert.match(game.snapshot(room, team.id).question.before, /-a\.jpg$/);
  assert.equal(team.score, 100);
});

test('Late teams can join between rounds and start with zero points', () => {
  const game = new Game(); const room = game.create({ game: 'crowd' });
  game.join(room.code, 'Early table'); game.action(room.code, room.hostToken, 'start');
  assert.throws(() => game.join(room.code, 'Late table'), /between rounds/);
  game.action(room.code, room.hostToken, 'reveal');
  game.action(room.code, room.hostToken, 'reveal');
  const late = game.join(room.code, 'Late table'); assert.equal(late.score, 0);
  game.action(room.code, room.hostToken, 'next');
  assert.equal(game.snapshot(room, late.id).voted, 0);
  game.answer(room.code, late.id, 1);
  assert.equal(room.answers.size, 1);
});

test('Every scene and answer in every theme pack is valid and available locally', () => {
  for (const theme of themes) for (const type of gameTypes) {
    const questions = getQuestions(type, theme);
    assert.ok(questions.length >= 3);
    for (const q of questions) {
      for (const src of [q.image, q.before, q.after].filter(Boolean)) {
        assert.ok(existsSync(new URL('../public' + src, import.meta.url)), src);
      }
      if (q.before) {
        assert.equal(q.changes.length, 3);
        assert.equal(new Set(q.changes).size, 3);
        assert.ok(q.changes.every(c => q.objects.includes(c)));
      } else for (const variant of [q, q.hard].filter(Boolean)) {
        assert.equal(variant.options.length, 4);
        assert.equal(new Set(variant.options).size, 4);
        if ((q.kind || type) !== 'crowd') assert.ok(variant.correct >= 0 && variant.correct < 4);
      }
      assert.ok(!/[a-z]\?[a-z]/i.test(q.prompt), 'Broken typography: ' + q.prompt);
    }
  }
});

test('384-tile reveals agree across screens and vary between rounds', () => {
  const a = tileOrder('123456/0');
  assert.equal(a.length, 384); assert.equal(new Set(a).size, 384);
  assert.equal(Math.min(...a), 0); assert.equal(Math.max(...a), 383);
  assert.deepEqual(a, tileOrder('123456/0'));
  assert.notDeepEqual(a, tileOrder('123456/1'));
});

test('The reconnect probe distinguishes a valid room from an expired one; JPEGs have an image MIME type', async t => {
  const { server, game } = createApp();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const room = game.create({ game: 'hiding' });
  assert.equal((await fetch(`${base}/api/rooms/${room.code}/events`, { method: 'HEAD' })).status, 200);
  assert.equal((await fetch(`${base}/api/rooms/000000/events`, { method: 'HEAD' })).status, 404);
  const response = await fetch(base + '/assets/puzzles/scene-01.jpg');
  assert.equal(response.headers.get('content-type'), 'image/jpeg');
  assert.ok((await response.arrayBuffer()).byteLength > 100000);
});
