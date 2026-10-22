// Original, procedural game-show cues: felt mallet, bass and a small room tail.
// No downloads or music loop; silence between moments leaves room for the family.
let context, master, dry, wet, enabled = false;
function setup() {
  if (context) return;
  context = new (window.AudioContext || window.webkitAudioContext)();
  master = context.createGain(); master.gain.value = .55;
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -16; compressor.ratio.value = 4;
  master.connect(compressor).connect(context.destination);
  dry = context.createGain(); dry.gain.value = .8; dry.connect(master);
  const reverb = context.createConvolver();
  const impulse = context.createBuffer(2, Math.floor(context.sampleRate * .65), context.sampleRate);
  for (let c = 0; c < 2; c++) { const data = impulse.getChannelData(c); for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3) * .35; }
  reverb.buffer = impulse; wet = context.createGain(); wet.gain.value = .16; wet.connect(reverb).connect(master);
}
export function setSound(value) {
  enabled = value;
  if (!value && master) master.gain.setTargetAtTime(0, context.currentTime, .015);
  if (value) { try { setup(); context.resume().catch(() => {}); master.gain.setTargetAtTime(.55, context.currentTime, .015); } catch { /* Audio remains optional. */ } }
}
function tone(frequency, at, duration = .5, volume = .18, bass = false) {
  for (const [ratio, level] of bass ? [[1, 1]] : [[1, 1], [2, .18], [3, .045]]) {
    const osc = context.createOscillator(), gain = context.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(frequency * ratio, at);
    gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(volume * level, at + .009);
    gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
    osc.connect(gain); gain.connect(dry); gain.connect(wet);
    osc.start(at); osc.stop(at + duration + .02); osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }
}
export function cue(type = 'tap') {
  if (!enabled || document.hidden) return;
  try {
    setup(); if (context.state !== 'running') return;
    const t = context.currentTime + .015;
    const patterns = {
      tap: [[784, 0, .16, .10]],
      lock: [[659, 0, .22, .16], [988, .075, .38, .13]],
      start: [[392, 0, .3, .15], [523, .10, .35, .16], [784, .22, .65, .18]],
      reveal: [[392, 0, .6, .15], [494, .07, .6, .13], [587, .14, .65, .13], [784, .24, .85, .17]],
      win: [[523, 0, .45, .16], [659, .13, .45, .15], [784, .26, .55, .17], [1047, .48, 1.1, .19]],
      tick: [[880, 0, .09, .045]]
    };
    for (const [f, delay, duration, volume] of patterns[type] || patterns.tap) tone(f, t + delay, duration, volume);
    if (['start', 'reveal', 'win'].includes(type)) tone(type === 'win' ? 131 : 196, t, .75, .13, true);
  } catch { /* Unsupported audio must never interrupt play. */ }
}
// Browsers require a gesture even when the preference was saved previously.
document.addEventListener('pointerdown', () => { if (enabled) setSound(true); }, { passive: true });
document.addEventListener('keydown', () => { if (enabled && context?.state !== 'running') setSound(true); });
export function restoreSound(value) { enabled = value; }
