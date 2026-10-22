import { icon, gameArt, mysteryArt, memoryScene } from './art.js';
import { mosaic, sceneImage } from './stage.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const games = [
  { id: 'hiding', name: 'What’s Hiding?', label: 'THE BIG REVEAL', description: 'A little mystery. A table full of guesses.', time: '5–8 min', color: 'peach', instruction: 'A picture is hiding behind the tiles. As the tiles disappear, discuss what you see and lock in one answer. Every correct answer earns 100 points.' },
  { id: 'crowd', name: 'Guess the Crowd', label: 'GREAT MINDS THINK…', description: 'Forget the right answer. Think like the room.', time: '6–10 min', color: 'sage', instruction: 'First, vote for your table’s favourite. Then predict which answer the whole room picked most. A correct prediction earns 100 points. Tied favourites both count!' },
  { id: 'family', name: 'Family Detectives', label: 'YOU KNOW THESE PEOPLE', description: 'Big personalities. Little family secrets.', time: '5–10 min', color: 'rose', instruction: 'Put your heads together and uncover the stories behind your own family. Correct answers earn 100 points. Add your family facts in the setup, or try the clearly labelled sample questions.' },
  { id: 'changes', name: 'Something Changed!', label: 'BLINK AND YOU’LL MISS IT', description: 'Sharp eyes have no age limit.', time: '5–8 min', color: 'butter', instruction: 'Study a beautifully detailed scene for 18 seconds. Then three details change. Find all three together: objects may disappear, change shape, or gain a new detail. Partial answers earn partial credit.' },
  { id: 'final', name: 'The Final Table', label: 'A LITTLE FRIENDLY RIVALRY', description: 'One last challenge. One big celebration.', time: '5–8 min', color: 'lilac', instruction: 'A quick-fire knowledge round with a choice of difficulty. Before each question, the host chooses a 100-point classic or a 200-point challenge for the whole room.' }
];
const themeInfo = { chanukah: { name: 'Chanukah glow', short: 'Chanukah', icon: '✦', description: 'A little light. A lot of togetherness.' }, everyday: { name: 'Everyday celebration', short: 'Everyday', icon: '✳', description: 'No occasion needed. Just good company.' }, birthday: { name: 'Birthday party', short: 'Birthday', icon: '✧', description: 'Make their day a little more wonderful.' } };
let theme = localStorage.getItem('whoopigo-theme') || 'chanukah';
if (!themeInfo[theme]) theme = 'chanukah';
let sound = localStorage.getItem('whoopigo-sound') === 'on';
let stream, current, selected = [], lastRound = '', offset = 0, busy = false, audio;
const warmedImages = new Set();
let custom = [];
try { const saved = JSON.parse(localStorage.getItem('whoopigo-family') || '[]'); if (Array.isArray(saved)) custom = saved.filter(q => q && typeof q.prompt === 'string' && Array.isArray(q.options) && q.options.length === 4 && q.options.every(o => typeof o === 'string') && Number.isInteger(q.correct) && q.correct >= 0 && q.correct < 4).slice(0, 30); } catch { /* A damaged local template must not prevent the game from opening. */ }
let toastTimer;
function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 4500); }
function note(type = 'tap') {
  if (!sound) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)(); audio.resume();
    const frequencies = type === 'win' ? [523, 659, 784, 1047] : type === 'reveal' ? [392, 523, 659] : [659];
    frequencies.forEach((f, i) => { const osc = audio.createOscillator(), gain = audio.createGain(), t = audio.currentTime + i * .13; osc.type = 'sine'; osc.frequency.value = f; gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(.09, t + .015); gain.gain.exponentialRampToValueAtTime(.001, t + .3); osc.connect(gain).connect(audio.destination); osc.start(t); osc.stop(t + .31); });
  } catch { /* Sound is optional on browsers that disallow audio. */ }
}
function celebrate() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  $('#confetti').innerHTML = Array.from({ length: 60 }, (_, i) => `<i style="--x:${Math.random() * 100}vw;--r:${Math.random() * 720}deg;--d:${Math.random() * 1.2}s;--c:${['#ff9bc9', '#ffdc55', '#bff476', '#ae84f5'][i % 4]}"></i>`).join('');
  setTimeout(() => $('#confetti').replaceChildren(), 5500);
}
async function api(path, data) {
  const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Please try again.'); return result;
}
function logo() { return '<a class="logo" href="/" aria-label="Whoopigo home">whoopigo<span>!</span><i></i></a>'; }
function soundButton() { return `<button class="icon-button sound-toggle" aria-label="${sound ? 'Mute' : 'Enable'} sound effects" title="${sound ? 'Mute' : 'Enable'} sound effects">${icon(sound ? 'sound' : 'mute')}</button>`; }
function footer() { return `<footer><span>${logo()} <small>Everyone’s in.</small></span><p>Made for the moments you’ll talk about tomorrow.</p><small>Playable preview · v0.1</small></footer>`; }
function header() { return `<header class="site-header">${logo()}<nav aria-label="Main navigation"><a href="#games">The games</a><button class="text-button" data-how>How to play</button><button class="join-button" data-join>Join a game ${icon('arrow')}</button>${soundButton()}</nav></header>`; }
function renderHome() {
  stream?.close(); current = null; document.body.dataset.theme = theme; delete document.body.dataset.room;
  $('#app').innerHTML = `${header()}
    <main class="home-main">
      <section class="hero">
        <div class="hero-art" aria-hidden="true"><img src="/assets/game-night.svg" alt="" fetchpriority="high"><div class="hero-sticker"><span>8 → 80</span><small>every generation.<br>game on.</small></div></div>
        <div class="hero-copy"><p class="eyebrow"><span class="tiny-star">✳</span> THE WHOLE ROOM. IN ON THE FUN.</p><h1>Big laughs.<br>Wild guesses.<br><em>Everyone’s in.</em></h1><p class="hero-description">Five games. All your favourite people.<br class="desktop"> No spectators. Just <i>one more round.</i></p><div class="hero-actions"><button class="button primary" data-setup="playlist">Let’s make a night of it ${icon('arrow')}</button><button class="text-button try-button" data-demo>Take a little peek ${icon('play')}</button></div><div class="hero-meta"><span>${icon('users')} Ages 8 to 80</span><span>${icon('screen')} One big screen</span><span>${icon('spark')} Everyone plays</span></div></div>
      </section>
      <section class="game-section" id="games"><div class="section-heading"><div><p class="eyebrow">PICK YOUR KIND OF FUN</p><h2>What shall we play?</h2></div><div class="theme-control"><span>Set the mood</span><button class="theme-button" data-themes>${themeInfo[theme].icon} ${themeInfo[theme].short} <span>⌄</span></button></div></div>
      <div class="game-grid">${games.map((g, i) => `<button class="game-card ${g.color}" data-setup="${g.id}"><div class="card-art"><span class="game-number">0${i + 1}</span>${gameArt(g.id)}<span class="card-play">${icon('arrow')}</span></div><div class="card-copy"><p class="card-label">${g.label}</p><h3>${g.name}</h3><p>${g.description}</p><div class="card-meta">${icon('clock')} ${g.time}<span>Team play</span></div></div></button>`).join('')}</div></section>
      <section class="together-banner"><div class="banner-mark">✳</div><div><h2>The best part? Everyone’s in.</h2><p>No downloads. No sitting out. Just pick a team, pull up a chair, and play.</p></div><button class="button cream" data-how>A wonderfully simple setup ${icon('arrow')}</button></section>
      <section class="steps"><div><span>01</span><h3>Gather your people</h3><p>One team per table. Children, grandparents, and everyone in between.</p></div><div><span>02</span><h3>Put it on the big screen</h3><p>Your host runs the show. Each team joins with one phone or browser.</p></div><div><span>03</span><h3>Let the stories begin</h3><p>Guess, debate, cheer, and discover who’s been quietly competitive all along.</p></div></section>
    </main>${footer()}`;
  bindGlobal();
}
function modal(content, wide = false) {
  $('#modal')?.remove(); const el = document.createElement('div'); el.id = 'modal'; el.className = 'modal-backdrop';
  el.innerHTML = `<section class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button class="icon-button modal-close" aria-label="Close dialog">${icon('close')}</button>${content}</section>`;
  const previous = document.activeElement; document.body.append(el);
  const close = () => { el.remove(); document.removeEventListener('keydown', onKey); previous?.focus(); };
  const onKey = e => {
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') { const focusable = [...el.querySelectorAll('button,input,select,textarea,a[href]')].filter(x => !x.disabled); const first = focusable[0], last = focusable.at(-1); if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
  };
  el.querySelector('.modal-close').onclick = close; el.addEventListener('click', e => { if (e.target === el) close(); }); document.addEventListener('keydown', onKey);
  el.querySelector('input,select,button')?.focus(); return { el, close };
}
function how() {
  const m = modal(`<p class="eyebrow">A PLACE FOR EVERYONE</p><h2 id="modal-title">Good fun. Simple setup.</h2><ol class="how-list"><li><strong>Host on a computer.</strong><p>Connect to your TV or projector. Pick one game or play all five.</p></li><li><strong>Make mixed-age teams.</strong><p>One phone or browser per table. Enter the six-digit room code to join.</p></li><li><strong>Talk it out. Lock it in.</strong><p>Discuss each answer together. Your host can pause whenever the room needs a moment.</p></li></ol><p class="quiet-note">This preview uses browser controllers. Dial-in and physical clickers are not supported yet.</p><button class="button primary" id="how-done">Sounds like our kind of evening ${icon('arrow')}</button>`);
  $('#how-done').onclick = m.close;
}
function chooseTheme() {
  const m = modal(`<p class="eyebrow">SAME PEOPLE. A DIFFERENT MOOD.</p><h2 id="modal-title">Make it your occasion.</h2><div class="theme-options">${Object.entries(themeInfo).map(([id, t]) => `<button data-theme-choice="${id}" class="theme-option ${id === theme ? 'active' : ''}"><span class="theme-symbol ${id}">${t.icon}</span><span><strong>${t.name}</strong><small>${t.description}</small>${id !== 'chanukah' ? '<small class="quiet-note">Starter theme · shared party artwork</small>' : ''}</span>${id === theme ? icon('check') : icon('arrow')}</button>`).join('')}</div><p class="quiet-note">Chanukah has its own question pack. Birthday and Everyday currently share the general game pack.</p>`);
  m.el.querySelectorAll('[data-theme-choice]').forEach(b => b.onclick = () => { theme = b.dataset.themeChoice; localStorage.setItem('whoopigo-theme', theme); m.close(); renderHome(); note(); });
}
function setup(id) {
  const g = games.find(g => g.id === id), family = ['family', 'playlist'].includes(id);
  const m = modal(`<div class="setup-art ${g?.color || 'sage'}">${gameArt(g?.id || 'final')}</div><p class="eyebrow">${id === 'playlist' ? 'THE WHOLE EVENING, SORTED' : 'PULL UP A CHAIR'}</p><h2 id="modal-title">${g?.name || 'Make a night of it.'}</h2><p class="modal-description">${g?.instruction || 'All five games, one shared scoreboard, and a big finish. Three rounds per game, with one shared scoreboard.'}</p><form id="setup-form"><label>Your evening’s name<input name="title" maxlength="70" value="${esc(localStorage.getItem('whoopigo-title') || 'Our family game night')}" required></label><label>Choose your theme<select name="theme">${Object.entries(themeInfo).map(([id, t]) => `<option value="${id}" ${id === theme ? 'selected' : ''}>${t.name}</option>`).join('')}</select></label>${family ? `<div class="family-callout"><strong>${custom.length ? `${custom.length} personal questions ready` : 'Make Family Detectives your own'}</strong><p>${custom.length ? 'Your saved family questions will be used.' : 'Sample questions are fictional. Add your own facts for a real family event.'}</p><button type="button" class="text-button" id="edit-family">${custom.length ? 'Edit family questions' : '+ Add family questions'}</button></div>` : ''}<button type="submit" class="button primary full-width">Create our game room ${icon('arrow')}</button><p class="quiet-note">Up to 50 teams in this preview. No accounts or downloads.</p></form>`, false);
  if (family) $('#edit-family').onclick = () => { m.close(); familyEditor(() => setup(id)); };
  $('#setup-form').onsubmit = async e => {
    e.preventDefault(); const form = new FormData(e.target), btn = e.target.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = 'Setting the table…';
    try { theme = form.get('theme'); localStorage.setItem('whoopigo-title', form.get('title')); localStorage.setItem('whoopigo-theme', theme); const result = await api('/api/rooms', { game: id, theme, title: form.get('title'), custom: family ? custom : [] }); localStorage.setItem(`whoopigo-host-${result.code}`, result.token); m.close(); location.href = `/?room=${result.code}`; }
    catch (e) { toast(e.message); btn.disabled = false; btn.innerHTML = `Create our game room ${icon('arrow')}`; }
  };
}
function familyEditor(back) {
  const m = modal(`<p class="eyebrow">ONLY YOUR FAMILY KNOWS</p><h2 id="modal-title">A story worth sharing.</h2><p>Add a real family question with four choices. Choose the correct answer below.</p><form id="family-form"><label>Your question<input name="prompt" placeholder="Who once took the wrong suitcase home?" maxlength="300" required></label><div class="family-answer-inputs">${['A', 'B', 'C', 'D'].map((l, i) => `<label>${l}<input name="option${i}" placeholder="A person, a place, a story…" maxlength="100" required></label>`).join('')}</div><label>The correct answer<select name="correct">${['A', 'B', 'C', 'D'].map((l, i) => `<option value="${i}">${l}</option>`).join('')}</select></label><label>The story behind it (optional)<textarea name="note" maxlength="500" placeholder="Tell us what happened…"></textarea></label><button class="button primary" type="submit">Save this question ${icon('check')}</button></form><div id="saved-questions"></div><button class="text-button" id="family-back">Back to game setup ${icon('arrow')}</button>`);
  const showSaved = () => { $('#saved-questions').innerHTML = custom.length ? `<h3>${custom.length} saved question${custom.length === 1 ? '' : 's'}</h3>${custom.map((q, i) => `<div class="saved-question"><span>${esc(q.prompt)}</span><button class="icon-button" data-remove="${i}" aria-label="Remove question ${i + 1}">${icon('close')}</button></div>`).join('')}` : ''; m.el.querySelectorAll('[data-remove]').forEach(b => b.onclick = () => { custom.splice(Number(b.dataset.remove), 1); localStorage.setItem('whoopigo-family', JSON.stringify(custom)); showSaved(); }); };
  showSaved();
  $('#family-form').onsubmit = e => { e.preventDefault(); if (custom.length >= 30) return toast('You can save up to 30 questions.'); const f = new FormData(e.target); custom.push({ prompt: f.get('prompt').trim(), options: [0, 1, 2, 3].map(i => f.get(`option${i}`).trim()), correct: Number(f.get('correct')), note: f.get('note').trim() }); localStorage.setItem('whoopigo-family', JSON.stringify(custom)); e.target.reset(); showSaved(); toast('Your family question is saved.'); };
  $('#family-back').onclick = () => { m.close(); back(); };
}
function joinDialog(code = '') {
  const m = modal(`<p class="eyebrow">THERE’S A PLACE FOR YOU</p><h2 id="modal-title">Join the fun.</h2><p>Look for the six-digit code on the big screen.</p><form id="join-form"><label>Room code<input class="code-input" name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="123456" value="${esc(code)}" required></label><label>Team name<input name="name" maxlength="28" placeholder="The Latke Legends" required></label><button type="submit" class="button primary full-width">We’re in! ${icon('arrow')}</button></form>`);
  $('#join-form').onsubmit = async e => { e.preventDefault(); const f = new FormData(e.target), code = f.get('code').trim(); const b = e.target.querySelector('[type=submit]'); b.disabled = true; try { const r = await api(`/api/rooms/${code}/join`, { name: f.get('name') }); localStorage.setItem(`whoopigo-team-${code}`, r.token); m.close(); location.href = `/?join=${code}`; } catch (e) { toast(e.message); b.disabled = false; } };
}
async function demo() {
  try {
    const r = await api('/api/rooms', { game: 'hiding', theme, title: 'Your first little peek', practice: true });
    localStorage.setItem(`whoopigo-host-${r.code}`, r.token);
    const team = await api(`/api/rooms/${r.code}/join`, { name: 'Your table' }); localStorage.setItem(`whoopigo-team-${r.code}`, team.token);
    location.href = `/?room=${r.code}&practice=1`;
  } catch (e) { toast(e.message); }
}
function bindGlobal() {
  document.querySelectorAll('.sound-toggle').forEach(b => b.onclick = () => { sound = !sound; localStorage.setItem('whoopigo-sound', sound ? 'on' : 'off'); b.innerHTML = icon(sound ? 'sound' : 'mute'); b.setAttribute('aria-label', `${sound ? 'Mute' : 'Enable'} sound effects`); note(); });
  document.querySelectorAll('[data-setup]').forEach(b => b.onclick = () => { note(); setup(b.dataset.setup); });
  document.querySelectorAll('[data-how]').forEach(b => b.onclick = how);
  document.querySelectorAll('[data-join]').forEach(b => b.onclick = () => joinDialog());
  document.querySelectorAll('[data-themes]').forEach(b => b.onclick = chooseTheme);
  document.querySelectorAll('[data-demo]').forEach(b => b.onclick = demo);
}
function roomKey(code) {
  const params = new URLSearchParams(location.search);
  if (params.get('view') === 'screen') return '';
  return localStorage.getItem(`whoopigo-${params.has('join') ? 'team' : 'host'}-${code}`) || '';
}
function connect(code) {
  $('#app').innerHTML = `<div class="loading-page">${logo()}<div class="loading-flower">✳</div><h2>Pulling up a chair…</h2></div>`;
  stream = new EventSource(`/api/rooms/${code}/events?token=${encodeURIComponent(roomKey(code))}`);
  let initial = true;
  stream.onmessage = e => {
    const data = JSON.parse(e.data); offset = data.now - Date.now();
    for (const src of data.preload || []) {
      if (!warmedImages.has(src)) { warmedImages.add(src); const img = new Image(); img.src = src; }
    }
    const round = `${data.index}/${data.phase}`;
    if (round !== lastRound) { selected = []; if (data.phase === 'results') { note('reveal'); if (data.teams.some(t => t.earned)) celebrate(); } if (data.phase === 'finished') { note('win'); celebrate(); } lastRound = round; }
    const old = current;
    const steady = old && old.phase === data.phase && old.index === data.index && old.paused === data.paused && !['lobby', 'results', 'finished'].includes(data.phase) && JSON.stringify(old.me?.answer) === JSON.stringify(data.me?.answer) && (!data.practice || old.teams.find(t => t.name === 'Your table')?.answered === data.teams.find(t => t.name === 'Your table')?.answered);
    current = data; initial = false;
    if (steady) {
      const connection = $('#connection-state'); if (connection) { connection.textContent = 'Live'; connection.classList.remove('offline'); }
      const count = $('.host-count'); if (count) count.textContent = `${data.answered}/${data.teams.length} ${data.phase === 'vote' ? 'votes' : 'answers'} in`;
      if (data.role !== 'team' && !data.practice && $('.answer-status')) $('.answer-status').textContent = `${data.answered} of ${data.teams.length} teams ${data.phase === 'vote' ? 'have voted' : 'have answered'}`;
      updateClock();
    } else renderRoom();
  };
  stream.onerror = async () => {
    if (initial) {
      try { const response = await fetch(`/api/rooms/${code}/events?token=${encodeURIComponent(roomKey(code))}`, { method: 'HEAD' }); if (response.status === 404) { stream.close(); $('#app').innerHTML = `<div class="loading-page">${logo()}<h2>We can’t find that room.</h2><p>Check the code, or ask the host to create a new game.</p><a class="button primary" href="/">Back to the games ${icon('arrow')}</a></div>`; } } catch { toast('Can’t reach the game server. Please check your connection.'); }
    } else { $('#connection-state')?.classList.add('offline'); if ($('#connection-state')) $('#connection-state').textContent = 'Reconnecting…'; }
  };
}
function joinUrl(code) { return `${location.origin}/?join=${code}`; }
function teamList(s, compact = false) {
  const teams = [...s.teams].sort((a, b) => b.score - a.score);
  return `<div class="team-list ${compact ? 'compact' : ''}">${teams.length ? teams.map((t, i) => `<div class="team-row ${t.mine ? 'mine' : ''}" style="--i:${i}"><span class="team-place">${s.phase === 'lobby' ? '✳' : i + 1}</span><span class="team-name">${esc(t.name)}${t.mine ? '<small>Your team</small>' : ''}</span><span class="team-points">${s.phase === 'lobby' ? '<span class="ready-dot"></span> Ready' : `${t.score}<small>points</small>`}</span>${s.phase === 'results' && t.earned ? `<span class="earned">+${t.earned}</span>` : ''}</div>`).join('') : '<div class="empty-teams"><span>✳</span><h3>A place for every team.</h3><p>Share the room code and watch the room fill up.</p></div>'}</div>`;
}
function renderRoom() {
  const s = current, g = games.find(g => g.id === s.game), host = s.role === 'host', team = s.role === 'team', practice = s.practice && host;
  document.body.dataset.theme = s.theme;
  document.body.dataset.room = s.game;
  const top = `<header class="room-header">${logo()}<span class="room-title">${esc(s.title)}</span><div class="room-tools"><span class="connection-state" id="connection-state">Live</span>${soundButton()}<button class="icon-button" id="fullscreen" aria-label="Toggle fullscreen">${icon('screen')}</button><a class="icon-button" href="/" aria-label="Back to game menu">${icon('home')}</a></div></header>`;
  const bottom = `<div class="room-bottom"><span>${themeInfo[s.theme].icon} ${themeInfo[s.theme].name}</span><span>${s.practice ? 'Solo practice · try the controls' : 'One room. Every generation.'}</span><span>Room <strong>${s.code}</strong></span></div>`;
  let body;
  if (s.phase === 'lobby') {
    body = `<main class="lobby-layout"><section class="lobby-invite"><p class="eyebrow">${s.playlist ? 'YOUR WHOLE EVENING STARTS HERE' : g.label}</p><h1>${team ? 'You’re in.<br><em>Make yourselves<br>at home.</em>' : 'Good company.<br><em>Incoming.</em>'}</h1><p>${team ? `Welcome, ${esc(s.me.name)}. Keep this screen open. Your host will start the game shortly.` : 'Gather your teams. One controller per table.<br>We’ll take care of the friendly competition.'}</p>${!team ? `<div class="room-code-box"><span>YOUR ROOM CODE</span><strong>${s.code.slice(0, 3)} ${s.code.slice(3)}</strong><button class="text-button" id="copy-link">Copy joining link ${icon('arrow')}</button><small>${esc(joinUrl(s.code))}</small></div>${location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? '<p class="quiet-note">Local preview: other devices need this computer’s network address or a hosted preview link.</p>' : ''}` : `<div class="welcome-art">${gameArt(s.game)}</div>`}<p class="quiet-note">${s.playlist ? 'Five games · shared scoreboard' : `${g.name} · ${g.time}`}</p></section><section class="lobby-teams"><div class="panel-heading"><h2>At the table</h2><span>${s.teams.length} ${s.teams.length === 1 ? 'team' : 'teams'}</span></div>${teamList(s)}${host ? `<div class="host-start">${s.game === 'final' ? '<label>Opening question<select id="difficulty"><option value="easy">Classic · 100 points</option><option value="hard">Challenge · 200 points</option></select></label>' : ''}<button class="button primary full-width" id="host-start" ${!s.teams.length ? 'disabled' : ''}>${practice ? 'Start my practice round' : 'Everyone’s here. Let’s play!'} ${icon('play')}</button>${practice ? '<p class="quiet-note">Answer on this screen. No second device needed.</p>' : '<button class="text-button full-width" id="open-screen">Open a separate projector screen ↗</button>'}</div>` : '<p class="waiting-note"><span class="pulse-dot"></span> Waiting for your host to start…</p>'}</section></main>`;
  } else if (s.phase === 'finished') {
    const sorted = [...s.teams].sort((a, b) => b.score - a.score), winners = sorted.filter(t => t.score === sorted[0]?.score);
    body = `<main class="finish-layout"><p class="eyebrow">A LITTLE COMPETITION. A LOT OF MEMORIES.</p><div class="winner-trophy">${gameArt('final')}</div><h1>${winners.length > 1 ? 'A shared victory!' : 'A round of applause for…'}</h1><h2 class="winner-name">${winners.map(t => esc(t.name)).join(' & ')}</h2><p>${sorted[0]?.score || 0} points · Every generation brought something to the table.</p><div class="final-scoreboard">${teamList(s)}</div><a href="/" class="button primary">Another little adventure? ${icon('arrow')}</a></main>`;
  } else {
    body = `<main class="play-layout"><div class="round-heading"><span class="round-tag">${g.name}</span><span>ROUND ${s.index + 1} <span class="muted">/ ${s.total}</span></span><div class="timer" id="timer">${icon('clock')}<span>${s.paused ? 'Paused' : '—'}</span></div></div>${s.phase === 'results' ? renderResults(s) : renderQuestion(s, team || practice)}${host ? hostControls(s) : ''}</main>`;
  }
  $('#app').innerHTML = top + body + bottom;
  bindGlobal();
  $('#fullscreen')?.addEventListener('click', async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { toast('Fullscreen is not available in this browser panel.'); } });
  $('#copy-link')?.addEventListener('click', async () => { try { await navigator.clipboard.writeText(joinUrl(s.code)); toast('Joining link copied. Send it to your table captains.'); } catch { toast(joinUrl(s.code)); } });
  $('#open-screen')?.addEventListener('click', () => window.open(`/?room=${s.code}&view=screen`, '_blank', 'noopener'));
  $('#host-start')?.addEventListener('click', () => act('start'));
  document.querySelectorAll('[data-action]').forEach(b => b.onclick = () => act(b.dataset.action));
  document.querySelectorAll('[data-answer]').forEach(b => b.onclick = () => answer(Number(b.dataset.answer)));
  const selectObject = key => { if (selected.includes(key)) selected = selected.filter(k => k !== key); else if (selected.length < 3) selected.push(key); else return toast('Choose three objects. Tap one again to change it.'); document.querySelectorAll('.object-option[data-object]').forEach(b => { const active = selected.includes(b.dataset.object); b.classList.toggle('selected', active); b.setAttribute('aria-pressed', String(active)); b.innerHTML = esc(b.dataset.object) + (active ? icon('check') : ''); }); document.querySelectorAll('.selection-dots i').forEach((dot, i) => { dot.classList.toggle('filled', selected.length > i); dot.textContent = selected.length > i ? '✓' : i + 1; }); $('.selection-dots')?.setAttribute('aria-label', selected.length + ' of 3 selected'); if ($('#lock-changes')) $('#lock-changes').disabled = selected.length !== 3; };
  document.querySelectorAll('[data-object]').forEach(b => { b.onclick = () => selectObject(b.dataset.object); b.onkeydown = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); selectObject(b.dataset.object); } }; });
  $('#lock-changes')?.addEventListener('click', () => answer(selected));
  document.querySelectorAll('[data-compare]').forEach(b => b.onclick = () => {
    const before = b.dataset.compare === 'before';
    const image = $('#comparison-picture');
    if (image) image.innerHTML = sceneImage(before ? s.question.before : s.question.image, before ? 'Original scene' : 'Changed scene');
    document.querySelectorAll('[data-compare]').forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', String(x === b)); });
  });
  updateClock();
}
function renderQuestion(s, interactive) {
  const q = s.question, practice = s.practice && s.role === 'host';
  const myAnswer = practice ? s.teams.find(t => t.name === 'Your table')?.answered : s.me?.answer !== undefined;
  const locked = myAnswer || busy || s.paused;
  const eyebrow = s.game === 'crowd' ? s.phase === 'vote' ? '01 / YOUR TABLE’S CHOICE' : '02 / THINK LIKE THE ROOM' : s.phase === 'study' ? 'LOOK CLOSELY. COLLECT THE LITTLE DETAILS.' : s.game === 'changes' ? 'THREE DETAILS HAVE CHANGED. WHICH ONES?' : s.game === 'hiding' ? '384 LITTLE WINDOWS. ONE BIG DISCOVERY.' : s.game === 'family' ? 'EVERY FAMILY HAS A STORY' : 'THE FINAL TABLE · MAKE IT COUNT';
  const title = s.game === 'changes' && s.phase !== 'study' ? 'Trust those sharp eyes.' : q.prompt;
  let visual = '';
  if (s.game === 'hiding') visual = `<div class="picture-column"><div class="mystery-board cinematic-board">${q.image ? sceneImage(q.image) : mysteryArt(q.object)}${mosaic(`${s.code}/${s.index}`)}<div class="mosaic-seal" aria-hidden="true">${icon('spark')}<span>LOOK A LITTLE CLOSER</span></div></div><div class="reveal-caption"><span id="reveal-caption">First impressions…</span><span><b id="reveal-percent">0</b>% uncovered</span></div><div class="reveal-progress"><i id="reveal-progress"></i></div></div>`;
  if (s.game === 'changes') visual = `<div class="scene-frame cinematic-board">${q.image ? sceneImage(q.image, s.phase === 'study' ? 'Study this scene carefully' : 'Find the three changed details') : memoryScene(q.changed || [], selected, interactive && s.phase === 'question' && !locked)}<span class="scene-badge">${s.phase === 'study' ? 'BEFORE · REMEMBER THIS' : 'AFTER · FIND THREE CHANGES'}</span></div>`;
  const objects = q.objects || ['balloon', 'gift', 'cup', 'cake', 'plant', 'clock'];
  const choices = s.phase === 'study' ? '<div class="study-message"><span class="study-orbit">✳</span><h2>A little attention.<br> A big advantage.</h2><p>Share the scene between your teammates.<br>One watches the left. One watches the right.</p><span class="points-badge">18 seconds to take it all in</span></div>' : s.game === 'changes' ? `<div class="memory-choices"><p class="stage-hint">${interactive ? 'Choose the three details that changed.' : 'Your teams are looking for three changed details.'}</p>${interactive ? `<div class="selection-dots" aria-label="${selected.length} of 3 selected">${[0,1,2].map(i => `<i class="${selected.length > i ? 'filled' : ''}">${selected.length > i ? '✓' : i + 1}</i>`).join('')}</div><div class="object-options">${objects.map(key => `<button class="object-option ${selected.includes(key) ? 'selected' : ''}" data-object="${esc(key)}" aria-pressed="${selected.includes(key)}" ${locked ? 'disabled' : ''}>${esc(key)}${selected.includes(key) ? icon('check') : ''}</button>`).join('')}</div><button class="button primary" id="lock-changes" ${selected.length !== 3 || locked ? 'disabled' : ''}>${myAnswer ? 'Answer locked in' : 'Lock in our three'} ${icon('check')}</button>` : '<div class="study-orbit">✳</div><p class="stage-hint">Look for differences in shape, quantity and detail.</p>'}</div>` : `<div class="answer-grid">${q.options.map((o, i) => `<${interactive ? 'button' : 'div'} class="answer-option answer-${i} ${s.me?.answer === i ? 'selected' : ''}" style="--answer-index:${i}" ${interactive ? `data-answer="${i}" ${locked ? 'disabled' : ''}` : ''}><span class="answer-letter">${'ABCD'[i]}</span><span>${esc(o)}</span>${s.me?.answer === i ? icon('check') : ''}</${interactive ? 'button' : 'div'}>`).join('')}</div>`;
  const emblem = !visual ? `<div class="game-emblem ${s.game}" aria-hidden="true">${icon(s.game === 'crowd' ? 'users' : s.game === 'family' ? 'spark' : 'trophy')}<i></i><i></i><i></i></div>` : '';
  return `<section class="question-stage ${s.game} ${visual ? 'illustrated-stage' : 'quiz-stage'}"><p class="eyebrow">${eyebrow}</p>${emblem}<h1>${esc(title)}</h1>${s.game === 'final' ? `<span class="points-badge">${s.difficulty === 'hard' ? 'The challenge · 200' : 'The classic · 100'} points</span>` : ''}<div class="stage-body">${visual}<div class="stage-response">${s.game === 'hiding' ? '<p class="choice-intro">Follow the clues.<br><em>Trust your table.</em></p>' : ''}${choices}<p class="answer-status" aria-live="polite">${s.paused ? 'Paused. A little breathing room for everyone.' : myAnswer ? `${icon('check')} ${s.phase === 'vote' ? 'Vote saved. Next, predict the room.' : 'Locked in. Your table has spoken.'}` : interactive ? 'Talk it over. One answer, together.' : `${s.answered} of ${s.teams.length} teams ${s.phase === 'vote' ? 'have voted' : 'have answered'}`}</p></div></div>${s.paused ? '<div class="pause-ribbon">Ⅱ &nbsp; THE HOST HAS PAUSED THE CLOCK</div>' : ''}</section>`;

}
function renderResults(s) {
  const result = s.result, correct = Array.isArray(result.correct) ? result.correct : [result.correct];
  return `<section class="results-stage"><div class="result-main"><p class="eyebrow">THE MOMENT OF TRUTH</p><h1>${s.game === 'crowd' ? 'The room has spoken.' : 'And there it is!'}</h1>${s.game === 'hiding' ? `<div class="result-picture">${s.question.image ? sceneImage(s.question.image, "The revealed scene") : mysteryArt(s.question.object)}</div>` : ''}${s.game === 'changes' ? `<div class="scene-frame">${s.question.image ? `<div id="comparison-picture">${sceneImage(s.question.image, "Changed scene")}</div>` : memoryScene(result.changes, result.changes)}</div>${s.question.before ? `<div class="comparison-tabs" role="group" aria-label="Compare the scenes"><button data-compare="before" aria-pressed="false">Before</button><button data-compare="after" class="active" aria-pressed="true">After</button></div>` : ''}<div class="change-labels">${result.changes.map(c => `<span>${icon('check')} ${c}</span>`).join('')}</div>` : s.game === 'crowd' ? `<div class="vote-bars">${s.question.options.map((o, i) => `<div class="vote-row ${correct.includes(i) ? 'winner' : ''}"><div><span>${esc(o)}</span><strong>${result.counts[i]} ${result.counts[i] === 1 ? 'vote' : 'votes'}</strong></div><div class="vote-track"><i style="width:${result.counts[i] / Math.max(1, s.voted) * 100}%"></i></div></div>`).join('')}</div>` : `<div class="correct-answer">${icon('check')} ${esc(s.question.options[result.correct])}</div>`}<p class="result-note">${esc(result.note)}</p>${s.me ? `<p class="my-result">${s.teams.find(t => t.mine)?.earned ? `Lovely teamwork! +${s.teams.find(t => t.mine).earned} points` : 'Another chance is coming. Stay in the game!'}</p>` : ''}</div><aside class="score-panel"><div class="panel-heading"><h2>The friendly rivalry</h2>${icon('trophy')}</div>${teamList(s, true)}</aside></section>`;
}
function hostControls(s) {
  const final = s.index === s.total - 1;
  return `<section class="host-controls"><span class="host-label">${icon('gear')} HOST CONTROLS</span><span class="host-count">${s.answered}/${s.teams.length} ${s.phase === 'vote' ? 'votes' : 'answers'} in</span>${s.phase === 'results' ? `${!final && (s.nextGame || s.game) === 'final' ? '<label class="difficulty-label">Next question<select id="difficulty"><option value="easy">Classic · 100 pts</option><option value="hard">Challenge · 200 pts</option></select></label>' : ''}<button class="button primary" data-action="next">${final ? 'The big finish' : 'Next question'} ${icon('arrow')}</button>` : `<button class="button subtle" data-action="${s.paused ? 'resume' : 'pause'}">${icon(s.paused ? 'play' : 'pause')} ${s.paused ? 'Resume' : 'Pause'}</button><button class="button primary" data-action="reveal">${s.phase === 'study' ? 'Show the changes' : s.phase === 'vote' ? 'Start predictions' : 'Reveal the answers'} ${icon('arrow')}</button>`}</section>`;
}
async function act(action) {
  if (busy) return; busy = true;
  try { note(); await api(`/api/rooms/${current.code}/action`, { token: roomKey(current.code), action, difficulty: $('#difficulty')?.value || 'easy' }); }
  catch (e) { toast(e.message); }
  finally { busy = false; if (current) renderRoom(); }
}
async function answer(value) {
  if (busy) return; busy = true;
  const key = current.practice && current.role === 'host' ? localStorage.getItem(`whoopigo-team-${current.code}`) : roomKey(current.code);
  try { await api(`/api/rooms/${current.code}/answer`, { token: key, value }); note(); }
  catch (e) { toast(e.message); }
  finally { busy = false; renderRoom(); }
}
function updateClock() {
  if (!current) return;
  const s = current, time = Date.now() + offset;
  const seconds = Math.max(0, Math.ceil((s.deadline - time) / 1000));
  const timer = $('#timer span'); if (timer) { timer.textContent = s.paused ? 'Paused' : s.deadline ? `${seconds}s` : 'Results'; timer.parentElement.classList.toggle('urgent', !s.paused && s.deadline && seconds <= 5); }
  if (s.game === 'hiding' && s.phase === 'question') {
    const elapsed = ((s.paused ? s.pausedAt : time) - s.openedAt) / 1000;
    const fraction = Math.max(0, Math.min(1, (elapsed - 2) / 36));
    document.querySelectorAll('[data-rank]').forEach(t => t.classList.toggle('revealed', Number(t.dataset.rank) < fraction * 384));
    const seal = $('.mosaic-seal'); if (seal) seal.classList.toggle('gone', elapsed > 2);
    if ($('#reveal-percent')) $('#reveal-percent').textContent = Math.round(fraction * 100);
    if ($('#reveal-progress')) $('#reveal-progress').style.width = Math.round(fraction * 100) + '%';
    if ($('#reveal-caption')) $('#reveal-caption').textContent = fraction < .28 ? 'First impressions…' : fraction < .7 ? 'Connect the little clues…' : fraction < 1 ? 'The whole picture is coming together.' : 'One final look. Make your choice.';
  }
}
setInterval(updateClock, 150);
const params = new URLSearchParams(location.search);
const code = params.get('room') || params.get('join');
if (code && /^\d{6}$/.test(code)) {
  if (params.has('join') && !roomKey(code)) { renderHome(); joinDialog(code); }
  else connect(code);
} else renderHome();
