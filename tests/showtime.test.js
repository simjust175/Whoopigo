import test from 'node:test';
import assert from 'node:assert/strict';

test('Choreography does not replay on answer updates or pause; reduced motion skips effects', async () => {
  let reduced = false, plays = 0;
  const node = { animate() { plays++; return { finished: new Promise(() => {}), cancel() {} }; } };
  globalThis.matchMedia = () => ({ matches: reduced, addEventListener() {} });
  globalThis.document = {
    body: { dataset: {}, classList: { toggle() {} } },
    querySelector: () => node, querySelectorAll: () => [], addEventListener() {}
  };
  const { stageMotion } = await import('../public/showtime.js');
  const s = { code: '123456', index: 0, phase: 'question', game: 'hiding' };
  stageMotion(s); const initial = plays; assert.ok(initial > 0);
  stageMotion({ ...s, answered: 4 }); stageMotion({ ...s, paused: true });
  assert.equal(plays, initial);
  stageMotion({ ...s, phase: 'results' }); assert.ok(plays > initial);
  const afterResult = plays; reduced = true;
  stageMotion({ ...s, index: 1 }); assert.equal(plays, afterResult);
  delete globalThis.document; delete globalThis.matchMedia;
});
