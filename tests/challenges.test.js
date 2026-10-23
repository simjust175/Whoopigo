import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../lib/game.js';

for (const kind of ['hiding', 'changes', 'crowd', 'family', 'final', 'playlist']) {
  test(`${kind}: every third round changes the challenge, not scoring`, () => {
    let now = 1000;
    const game = new Game({now: () => now});
    const room = game.create({game:kind, challengeRounds:true, playMode:'projector', tableNames:['Team']});
    game.action(room.code, room.hostToken, 'start');
    assert.equal(game.snapshot(room).challenge, null);
    room.phase='results'; room.index=1;
    assert.ok(game.snapshot(room).nextChallenge);
    game.action(room.code, room.hostToken, 'next');
    assert.ok(game.snapshot(room).challenge);
    assert.equal(room.deadline-now, kind==='changes' ? 10000 : 20000);
    assert.equal(game.multiplier(room), 1);
    if (room.phase==='study') {
      now=room.deadline; game.tick();
      assert.equal(room.phase,'question'); assert.equal(room.deadline-now,25000);
    }
    if (room.phase==='vote') {
      game.action(room.code, room.hostToken,'reveal');
      assert.equal(room.deadline-now,20000);
    }
    now=room.deadline; game.tick();
    assert.equal(room.waitingForHost,true);
    assert.notEqual(room.phase,'results');
    game.action(room.code, room.hostToken,'reveal');
    if (room.index+1<room.questions.length) {
      game.action(room.code,room.hostToken,'next');
      assert.equal(game.snapshot(room).challenge,null);
    }
  });
}
test('Challenges are opt-in for old rooms and follow custom pack length', () => {
  const game=new Game();
  const custom=Array.from({length:7},()=>({prompt:'Who?',options:['A','B','C','D'],correct:0}));
  const room=game.create({game:'family',custom,challengeRounds:true});
  assert.deepEqual(custom.map((_,i)=>Boolean(game.challenge(room,i))),[false,false,true,false,false,true,false]);
  assert.equal(game.challenge(room,7),null);
  assert.equal(game.challenge(game.create({game:'hiding'}),2),null);
});
