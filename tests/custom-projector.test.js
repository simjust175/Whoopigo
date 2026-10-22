import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, readdirSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Game } from '../lib/game.js';
import { imageStore } from '../lib/images.js';
import { createApp } from '../server.js';
import { fileStorage } from '../lib/storage.js';

const jpeg = readFileSync(new URL('../public/assets/puzzles/memory-01-a.jpg', import.meta.url));
const imageData = 'data:image/jpeg;base64,' + jpeg.toString('base64');
const imageLink = '/media/' + 'a'.repeat(48) + '.jpg';
const custom = { prompt: 'Where did our adventure begin?', image: imageLink, options: ['Bakery', 'Station', 'Garden', 'Library'], correct: 1, note: 'Our first family train journey.' };
function projector(type = 'hiding', extra = {}) {
  let now = 100000;
  const game = new Game({ now: () => now });
  const room = game.create({ game: type, playMode: 'projector', tableNames: ['Table One', 'Table Two'], ...extra });
  const act = action => game.action(room.code, room.hostToken, action);
  const record = (i, value) => game.hostAnswer(room.code, room.hostToken, room.teams[i].id, value, { index: room.index, phase: room.phase });
  return { game, room, act, record, tick: ms => { now += ms; game.tick(); } };
}

test('Custom pictures replace the built-in hiding pack and remain part of the full evening', () => {
  const { game, room, act, record } = projector('hiding', { hiding: [custom] });
  act('start'); const snapshot = game.snapshot(room, '');
  assert.equal(snapshot.question.image, imageLink); assert.equal(snapshot.total, 1);
  assert.equal(snapshot.question.correct, undefined); record(0, 1); record(1, 0); act('reveal');
  assert.equal(room.teams[0].score, 100); assert.equal(room.teams[1].score, 0);
  const evening = game.create({ game: 'playlist', hiding: Array.from({ length: 4 }, (_, i) => ({ ...custom, prompt: 'Picture ' + i })) });
  assert.equal(evening.questions.filter(q => q.kind === 'hiding').length, 4);
});

test('Custom rounds reject missing images, remote URLs, duplicate answers, and invalid correct answers', () => {
  const game = new Game();
  for (const bad of [{ image: undefined }, { image: 'https://example.com/photo.jpg' }, { options: ['Same', 'same', 'C', 'D'] }, { correct: 4 }]) {
    assert.throws(() => game.create({ game: 'hiding', hiding: [{ ...custom, ...bad }] }), /picture round/);
  }
});

test('Projector rounds wait for the host after time runs out and allow correcting entries before scoring', () => {
  const { game, room, act, record, tick } = projector(); act('start'); tick(60000);
  assert.equal(room.phase, 'question'); assert.equal(room.waitingForHost, true); assert.equal(room.deadline, null);
  record(0, 3); record(0, 0); record(1, 0); record(1, null);
  assert.equal(room.answers.size, 1); act('reveal');
  assert.equal(room.teams[0].score, 100); assert.equal(room.teams[1].score, 0);
  assert.throws(() => record(0, 0), /not open/); assert.equal(room.teams[0].score, 100);
});

test('Only a projector host can record, and a delayed answer cannot land on another round', () => {
  const { game, room, act, record } = projector(); act('start');
  assert.throws(() => game.hostAnswer(room.code, 'wrong', room.teams[0].id, 0, { index: 0, phase: 'question' }), /Only the host/);
  assert.throws(() => game.hostAnswer(room.code, room.hostToken, 'not-a-table', 0, { index: 0, phase: 'question' }), /Choose a table/);
  record(0, 0); act('reveal'); act('next');
  assert.throws(() => game.hostAnswer(room.code, room.hostToken, room.teams[0].id, 0, { index: 0, phase: 'question' }), /moved on/);
  const device = game.create({ game: 'hiding' }); game.join(device.code, 'Team'); game.action(device.code, device.hostToken, 'start');
  assert.throws(() => game.hostAnswer(device.code, device.hostToken, device.teams[0].id, 0, { index: 0, phase: 'question' }), /only available/);
});

test('Projected state shows every table score but never their private recording tokens or selections', () => {
  const { game, room, act, record } = projector(); act('start'); record(0, 2);
  const publicState = game.snapshot(room, ''), privateState = game.snapshot(room, room.hostToken);
  assert.equal(publicState.teams.length, 2); assert.equal(publicState.teams[0].answered, true);
  assert.equal(publicState.teams[0].recorded, undefined); assert.equal(publicState.teams[0].id, undefined);
  assert.ok(!JSON.stringify(publicState).includes(room.teams[0].id));
  assert.equal(privateState.teams[0].recorded, 2); assert.equal(privateState.teams[0].id, room.teams[0].id);
});

test('Projector memory rounds advance from study, accept three details, and keep partial scoring', () => {
  const { room, act, record, tick } = projector('changes'); act('start'); tick(18000);
  assert.equal(room.phase, 'question'); tick(45000); assert.equal(room.waitingForHost, true);
  record(0, ['Cushion', 'Top book', 'Wall picture']); record(1, ['Cushion', 'Cups', 'Clock']); act('reveal');
  assert.equal(room.teams[0].score, 100); assert.equal(room.teams[1].score, 33);
});

test('Projector crowd voting and prediction remain separate host-paced phases', () => {
  const { room, act, record, tick } = projector('crowd'); act('start'); record(0, 1); record(1, 1);
  tick(45000); assert.equal(room.phase, 'vote'); act('reveal'); assert.equal(room.phase, 'predict');
  record(0, 1); record(1, 0); act('reveal'); assert.equal(room.teams[0].score, 100); assert.equal(room.teams[1].score, 0);
});

test('Projector tables are validated and managed only by their host', () => {
  const { game, room } = projector();
  assert.throws(() => game.create({ game: 'hiding', playMode: 'projector', tableNames: ['Same', 'same'] }), /different table/);
  assert.throws(() => game.join(room.code, 'Uninvited'), /one projector/);
  assert.throws(() => game.addTable(room.code, 'wrong', 'Third'), /Only the host/);
  game.addTable(room.code, room.hostToken, 'Third'); assert.equal(room.teams.length, 3);
});

test('Image links survive a new file store and become unavailable after their lifetime', t => {
  const dir = mkdtempSync(path.join(tmpdir(), 'whoopigo-images-'));
  t.after(() => { for (const file of readdirSync(dir)) unlinkSync(path.join(dir, file)); rmdirSync(dir); });
  const store = imageStore(dir); const src = store.put(imageData);
  assert.match(src, /^\/media\/[a-f0-9]{48}\.jpg$/);
  assert.deepEqual(imageStore(dir).get(src.slice(7)), jpeg);
  const expired = imageStore(dir, () => Date.now() + 25 * 60 * 60 * 1000);
  assert.throws(() => expired.get(src.slice(7)), /expired/); expired.prune(); assert.equal(readdirSync(dir).length, 0);
  assert.throws(() => store.put('data:image/svg+xml;base64,PHN2Zz4='), /image picker/);
  assert.throws(() => store.get('../rooms.json'), /not found/);
});

test('Disk recovery preserves projector mode, custom image URLs and recorded choices', t => {
  const dir = mkdtempSync(path.join(tmpdir(), 'whoopigo-projector-'));
  t.after(() => { for (const file of readdirSync(dir)) unlinkSync(path.join(dir, file)); rmdirSync(dir); });
  const storage = fileStorage(path.join(dir, 'rooms.json'));
  let game = new Game({ storage }); const room = game.create({ game: 'hiding', hiding: [custom], playMode: 'projector', tableNames: ['One'] });
  game.action(room.code, room.hostToken, 'start'); game.hostAnswer(room.code, room.hostToken, room.teams[0].id, 1, { index: 0, phase: 'question' });
  game = new Game({ storage }); const recovered = game.room(room.code);
  assert.equal(recovered.playMode, 'projector'); assert.equal(recovered.paused, true); assert.equal(recovered.questions[0].image, imageLink);
  assert.equal(game.snapshot(recovered, room.hostToken).teams[0].recorded, 1);
});

test('HTTP image upload, custom game creation, host capture and private media serving work together', async t => {
  const { server, game } = createApp(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (url, body, headers = {}) => fetch(base + url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  assert.equal((await post('/api/uploads', { image: imageData }, { Origin: 'https://wrong.example' })).status, 403);
  const uploaded = await post('/api/uploads', { image: imageData }); assert.equal(uploaded.status, 201); const picture = await uploaded.json();
  const media = await fetch(base + picture.image); assert.equal(media.headers.get('content-type'), 'image/jpeg'); assert.deepEqual(Buffer.from(await media.arrayBuffer()), jpeg);
  const created = await post('/api/rooms', { game: 'hiding', hiding: [{ ...custom, image: picture.image }], playMode: 'projector', tableNames: ['First'] });
  assert.equal(created.status, 201); const credentials = await created.json();
  assert.equal((await post(`/api/rooms/${credentials.code}/tables`, { token: 'wrong', name: 'Second' })).status, 403);
  assert.equal((await post(`/api/rooms/${credentials.code}/tables`, { token: credentials.token, name: 'Second' })).status, 200);
  const room = game.room(credentials.code);
  await post(`/api/rooms/${credentials.code}/action`, { token: credentials.token, action: 'start' });
  const capture = { token: credentials.token, teamId: room.teams[0].id, value: 1, index: 0, phase: 'question' };
  assert.equal((await post(`/api/rooms/${credentials.code}/host-answer`, { ...capture, token: 'wrong' })).status, 403);
  assert.equal((await post(`/api/rooms/${credentials.code}/host-answer`, capture)).status, 200);
  await post(`/api/rooms/${credentials.code}/action`, { token: credentials.token, action: 'reveal' });
  assert.equal(room.teams[0].score, 100); assert.equal(room.teams[1].score, 0);
  assert.equal((await post('/api/rooms', { game: 'hiding', hiding: [custom] })).status, 400);
});
