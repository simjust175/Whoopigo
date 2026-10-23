// A small choreography layer. Game time and scoring always remain server-owned.
let lastScene = '', lastGame = '', animations = [];
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function animate(element, frames, options = {}) {
  if (!element || reduced()) return;
  const animation = element.animate(frames, { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)', ...options });
  animations.push(animation);
  animation.finished.then(() => { animations = animations.filter(a => a !== animation); }, () => {});
}
export function stageMotion(s) {
  const key = `${s.code}/${s.index}/${s.phase}`;
  const fresh = key !== lastScene; lastScene = key;
  document.body.dataset.game = s.game;
  document.body.dataset.phase = s.phase;
  document.body.classList.toggle('show-paused', Boolean(s.paused));
  if (!fresh || reduced()) return;
  animations.forEach(a => a.cancel()); animations = [];
  if (s.phase !== 'lobby' && s.phase !== 'finished' && lastGame !== s.game) {
    lastGame = s.game;
    const tag = document.querySelector('.round-tag');
    animate(tag, [{ transform: 'translateX(-24px) scale(.85)', opacity: 0 }, { transform: 'translateX(0) scale(1.08)', opacity: 1, offset: .7 }, { transform: 'translateX(0) scale(1)' }], { duration: 850 });
  }
  const find = selector => document.querySelector(selector);
  animate(find('.question-stage h1, .result-main h1, .finish-layout h1'), [
    { opacity: 0, transform: 'translateY(22px)' }, { opacity: 1, transform: 'translateY(0)' }
  ], { duration: 800 });
  animate(find('.cinematic-board'), [
    { opacity: 0, transform: 'perspective(1200px) rotateY(-7deg) translateY(25px) scale(.96)' },
    { opacity: 1, transform: 'perspective(1200px) rotateY(0) translateY(0) scale(1)' }
  ], { duration: 1000 });
  if (s.game === 'changes' && s.phase === 'question') {
    animate(find('.scene-frame'), [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], { duration: 850 });
  }
  if (s.phase === 'results') {
    animate(find('.result-picture, .result-main .scene-frame'), [
      { opacity: 0, transform: 'scale(.94) translateY(18px)' },
      { opacity: 1, transform: 'scale(1) translateY(0)' }
    ], { duration: 1100 });
    animate(find('.correct-answer'), [
      { opacity: 0, transform: 'scale(.8)' }, { opacity: 1, transform: 'scale(1.05)', offset: .65 }, { transform: 'scale(1)' }
    ], { duration: 750, delay: 150, fill: 'backwards' });
    document.querySelectorAll('.vote-track i').forEach((bar, i) => animate(bar,
      [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 1100, delay: i * 110, fill: 'backwards' }));
    document.querySelectorAll('.score-panel .team-row').forEach((row, i) => animate(row,
      [{ opacity: 0, transform: 'translateX(26px)' }, { opacity: 1, transform: 'translateX(0)' }],
      { duration: 650, delay: 250 + Math.min(i, 10) * 65, fill: 'backwards' }));
  }
  if (s.phase === 'finished') {
    document.querySelectorAll('.podium-place').forEach((place, i) => animate(place,
      [{ opacity: 0, transform: 'translateY(45px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 850, delay: 350 + i * 160, fill: 'backwards' }));
    animate(find('.winner-trophy'), [
      { opacity: 0, transform: 'translateY(65px) scale(.45) rotate(-18deg)' },
      { opacity: 1, transform: 'translateY(-8px) scale(1.06) rotate(4deg)', offset: .7 },
      { transform: 'translateY(0) scale(1) rotate(0)' }
    ], { duration: 1400 });
    animate(find('.winner-name'), [{ opacity: 0, transform: 'translateY(20px) scale(.93)' }, { opacity: 1, transform: 'none' }], { duration: 900, delay: 450, fill: 'backwards' });
  }
}
export function burst(finale = false) {
  const root = document.querySelector('#confetti');
  if (!root || reduced() || document.hidden) return;
  root.replaceChildren();
  // Two side cannons frame the content; no overlay blocks the controls.
  for (let i = 0; i < (finale ? 84 : 38); i++) {
    const particle = document.createElement('span'), left = i % 2 === 0;
    particle.className = `show-particle ${i % 5 === 0 ? 'show-star' : ''}`;
    particle.style.background = ['#ffdc55', '#bff476', '#ff94ca', '#ab83ff', '#68d9cd'][i % 5];
    particle.style.left = left ? '0' : '100%'; particle.style.top = '70%';
    root.append(particle);
    const x = (left ? 1 : -1) * (70 + Math.random() * innerWidth * .55);
    const rise = 100 + Math.random() * innerHeight * .55;
    const spin = (Math.random() - .5) * 900;
    const a = particle.animate([
      { transform: 'translate(0,0) rotate(0)', opacity: 0 },
      { opacity: 1, offset: .07 },
      { transform: `translate(${x * .65}px,${-rise}px) rotate(${spin * .5}deg)`, opacity: 1, offset: .45 },
      { transform: `translate(${x}px,${innerHeight * .5}px) rotate(${spin}deg)`, opacity: 0 }
    ], { duration: 1900 + Math.random() * 1300, delay: Math.random() * 250, easing: 'linear' });
    a.finished.then(() => particle.remove(), () => particle.remove());
  }
}
document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || button.disabled || !document.body.hasAttribute('data-room')) return;
  animate(button, [{ scale: '1' }, { scale: '.95', offset: .35 }, { scale: '1' }], { duration: 240 });
});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', event => {
  if (event.matches) { animations.forEach(a => a.cancel()); animations = []; document.querySelector('#confetti')?.replaceChildren(); }
});
