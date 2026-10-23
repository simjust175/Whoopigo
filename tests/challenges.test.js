import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../lib/game.js';

for (const kind of ['hiding', 'changes', 'crowd', 'family', 'final', 'playlist']) {
  test(`${kind}: every fifth round changes the challenge, not scoring`, () => {
    let now = 1000;
    const game = new Game({now: () => now});
    const room = game.create({game:kind, challengeRounds:true, playMode:'projector', tableNames:['Team']});
    while (room.questions.length < 6) room.questions.push(room.questions[0]);
    game.action(room.code, room.hostToken, 'start');
    assert.equal(game.snapshot(room).challenge, null);
    room.phase='results'; room.index=3;
    assert.ok(game.snapshot(room).nextChallenge);
    game.action(room.code, room.hostToken, 'next');
    assert.ok(game.snapshot(room).challenge);
    assert.equal(room.deadline-now, kind==='changes' ? 18000 : 45000);
    assert.equal(game.multiplier(room), 1);
    if (room.phase==='study') {
      now=room.deadline; game.tick();
      assert.equal(room.phase,'question'); assert.equal(room.deadline-now,45000);
    }
    if (room.phase==='vote') {
      game.action(room.code, room.hostToken,'reveal');
      assert.equal(room.deadline-now,45000);
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
  assert.deepEqual(custom.map((_,i)=>Boolean(game.challenge(room,i))),[false,false,false,false,true,false,false]);
  assert.equal(game.challenge(room,7),null);
  assert.equal(game.challenge(game.create({game:'hiding'}),2),null);
});

test('Against the Crowd awards tied positive minorities, excludes zero votes, and leaves regular rounds alone', () => {
  const game = new Game();
  for (const special of [true, false]) {
    const room = game.create({game:'crowd',challengeRounds:special,playMode:'projector',tableNames:['A','B','C','D']});
    room.phase='results'; room.index=3;
    const act = () => game.action(room.code, room.hostToken, 'reveal');
    const record = (i,v) => game.hostAnswer(room.code,room.hostToken,room.teams[i].id,v,{index:room.index,phase:room.phase});
    game.action(room.code,room.hostToken,'next');
    [0,0,1,2].forEach((v,i)=>record(i,v)); act();
    [0,1,2,3].forEach((v,i)=>record(i,v)); act();
    assert.deepEqual(room.result.correct,special ? [1,2] : [0]);
    assert.deepEqual(room.teams.map(t=>t.earned),special ? [0,100,100,0] : [100,0,0,0]);
  }
});

test('Delayed choices reject early answers and preserve the delay across a pause', () => {
  let now=1000;
  const game=new Game({now:()=>now});
  const room=game.create({game:'final',challengeRounds:true,playMode:'projector',tableNames:['A']});
  room.phase='results';room.index=3;game.action(room.code,room.hostToken,'next');
  const record=()=>game.hostAnswer(room.code,room.hostToken,room.teams[0].id,0,{index:4,phase:'question'});
  assert.throws(record,/8 seconds/);
  now+=3000;game.action(room.code,room.hostToken,'pause');now+=10000;
  assert.throws(record,/8 seconds/);
  game.action(room.code,room.hostToken,'resume');now+=5000;record();
  assert.equal(room.answers.size,1);
});
