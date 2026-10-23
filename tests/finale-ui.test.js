import test from 'node:test';
import assert from 'node:assert/strict';
import { rankedTeams, finale } from '../public/finale.js';

test('Final standings share ties and preserve original team data', () => {
  const teams = [{name:'A',score:10},{name:'B',score:30},{name:'C',score:30},{name:'D',score:0}];
  assert.deepEqual(rankedTeams(teams).map(t=>[t.name,t.rank]),[['B',1],['C',1],['A',3],['D',4]]);
  assert.equal(teams[0].name,'A'); assert.equal(teams[0].rank,undefined);
});
test('Finale renders all 50 tied tables without a giant winner heading', () => {
  const teams = Array.from({length:50},(_,i)=>({name:`Table ${i+1}`,score:0}));
  const html = finale({teams,total:15,title:'Our party'}, {escape:String,icon:()=>'',gameArt:()=>''});
  assert.ok(html.includes('50 tables share the crown!'));
  assert.ok(html.includes('Table 50'));
  assert.equal((html.match(/standing-row /g)||[]).length,50);
  assert.ok(!html.includes('undefined'));
});
