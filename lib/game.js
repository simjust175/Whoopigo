import { randomBytes, randomInt } from 'node:crypto';
import { getQuestions, gameTypes, themes } from './content.js';

export class GameError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
const token = () => randomBytes(24).toString('hex');
export class Game {
  constructor({ now = () => Date.now(), storage } = {}) {
    this.rooms = new Map(); this.now = now; this.storage = storage;
    for (const saved of storage?.load() || []) {
      if (now() - saved.touched > 6 * 60 * 60 * 1000) continue;
      const room = { ...saved, answers: new Map(saved.answers), votes: new Map(saved.votes || []), listeners: new Set() };
      if (room.deadline) {
        // A restarted server must never consume a room's remaining game time.
        room.remaining = Math.max(0, room.deadline - room.touched);
        room.pausedAt = room.touched; room.deadline = null; room.paused = true;
      }
      this.rooms.set(room.code, room);
    }
  }
  persist() {
    this.storage?.save([...this.rooms.values()].map(({ listeners, answers, votes, ...room }) => ({ ...room, answers: [...answers], votes: [...(votes || [])] })));
  }
  create({ game, theme = 'chanukah', title = 'Our family game night', custom = [], hiding = [], practice = false, playMode = 'devices', tableNames = [] }) {
    if (!gameTypes.includes(game) || !themes.includes(theme)) throw new GameError('Choose a valid game and theme.');
    if (this.rooms.size >= 500) throw new GameError('All game rooms are in use. Please try later.', 503);
    if (!Array.isArray(custom) || custom.length > 30) throw new GameError('Use up to 30 family questions.');
    for (const q of custom) if (!q || typeof q.prompt !== 'string' || !q.prompt.trim() || q.prompt.length > 300 || !Array.isArray(q.options) || q.options.length !== 4 || !q.options.every(o => typeof o === 'string' && o.trim() && o.length <= 100) || !Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3 || (q.note !== undefined && (typeof q.note !== 'string' || q.note.length > 500))) throw new GameError('Each family question needs four answers and one correct answer.');
    if (!['devices', 'projector'].includes(playMode)) throw new GameError('Choose a valid way to play.');
    if (!Array.isArray(hiding) || hiding.length > 12) throw new GameError('Use up to 12 custom picture rounds.');
    for (const q of hiding) {
      if (!q || typeof q.prompt !== 'string' || !q.prompt.trim() || q.prompt.length > 300 || !/^\/media\/[a-f0-9]{48}\.jpg$/.test(q.image || '') || !Array.isArray(q.options) || q.options.length !== 4 || !q.options.every(o => typeof o === 'string' && o.trim() && o.length <= 100) || new Set(q.options.map(o => o.trim().toLowerCase())).size !== 4 || !Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3 || (q.note !== undefined && (typeof q.note !== 'string' || q.note.length > 500))) throw new GameError('Each picture round needs an image, four different answers and a correct answer.');
    }
    if (playMode === 'projector' && (!Array.isArray(tableNames) || !tableNames.length || tableNames.length > 50 || !tableNames.every(n => typeof n === 'string' && n.trim() && n.trim().length <= 28) || new Set(tableNames.map(n => n.trim().toLowerCase())).size !== tableNames.length)) throw new GameError('Add 1–50 different table names, up to 28 characters each.');
    let code; do { code = String(randomInt(100000, 1000000)); } while (this.rooms.has(code));
    const room = { code, hostToken: token(), title: String(title).trim().slice(0, 70) || 'Our family game night', game, theme, playMode, practice: Boolean(practice), createdAt: this.now(), touched: this.now(), phase: 'lobby', index: -1, questions: getQuestions(game, theme, custom, hiding), teams: playMode === 'projector' ? tableNames.map(name => ({ id: token(), name: name.trim(), score: 0, joinedAt: this.now() })) : [], answers: new Map(), listeners: new Set(), difficulty: 'easy', deadline: null };
    this.rooms.set(code, room);
    this.persist();
    return room;
  }
  room(code) { const room = this.rooms.get(String(code)); if (!room) throw new GameError('That room could not be found. Check the six-digit code.', 404); return room; }
  host(room, key) { if (key !== room.hostToken) throw new GameError('Only the host can do that.', 403); }
  join(code, name) {
    const room = this.room(code);
    if (room.playMode === 'projector') throw new GameError('This room uses one projector. The host manages all tables.');
    return this.addTeam(room, name);
  }
  addTable(code, key, name) {
    return this.addTables(code, key, [name])[0];
  }
  addTables(code, key, names) {
    const room = this.room(code); this.host(room, key);
    if (room.playMode !== 'projector') throw new GameError('This room uses team controllers.');
    if (!['lobby', 'results'].includes(room.phase)) throw new GameError('Add tables between rounds, when the scoreboard is showing.');
    if (!Array.isArray(names) || !names.length || names.length + room.teams.length > 50) throw new GameError('Add at least one table, up to 50 tables in total.');
    if (!names.every(n => typeof n === 'string' && n.trim() && n.trim().length <= 28)) throw new GameError('Each table needs a name of up to 28 characters.');
    const cleaned = names.map(n => n.trim());
    const allNames = [...room.teams.map(t => t.name), ...cleaned].map(n => n.toLowerCase());
    if (new Set(allNames).size !== allNames.length) throw new GameError('Each table needs a different name. Check for duplicates.');
    // Validate the entire batch before changing the room.
    const added = cleaned.map(name => ({ id: token(), name, score: 0, joinedAt: this.now() }));
    room.teams.push(...added); this.emit(room); return added;
  }
  addTeam(room, name) {
    if (!['lobby', 'results'].includes(room.phase)) throw new GameError('This round has started. Join between rounds when the scoreboard is showing.');
    name = String(name || '').trim().slice(0, 28);
    if (!name) throw new GameError('Give your team a name.');
    if (room.teams.length >= 50) throw new GameError('This room has reached its 50-team limit.');
    if (room.teams.some(t => t.name.toLowerCase() === name.toLowerCase())) throw new GameError('That team name is already in the room. Try another.');
    const team = { id: token(), name, score: 0, joinedAt: this.now() };
    room.teams.push(team); this.emit(room); return team;
  }
  question(room) {
    const q = room.questions[room.index];
    return this.kind(room) === 'final' && room.difficulty === 'hard' ? q?.hard || q : q;
  }
  kind(room) { return room.questions[room.index]?.kind || (room.game === 'playlist' ? 'hiding' : room.game); }
  action(code, key, action, difficulty) {
    const room = this.room(code); this.host(room, key);
    if (action === 'start' || action === 'next') {
      if (action === 'start' && room.phase !== 'lobby') throw new GameError('The game is already running.');
      if (action === 'next' && room.phase !== 'results') throw new GameError('Reveal this round before moving on.');
      if (!room.teams.length) throw new GameError('Let at least one team join first.');
      room.index++;
      if (room.index >= room.questions.length) { room.phase = 'finished'; room.deadline = null; }
      else {
        room.answers = new Map(); room.votes = new Map(); room.paused = false; room.waitingForHost = false; room.difficulty = difficulty === 'hard' ? 'hard' : 'easy';
        const kind = this.kind(room);
        room.phase = kind === 'changes' ? 'study' : kind === 'crowd' ? 'vote' : 'question';
        room.openedAt = this.now(); room.deadline = this.now() + (room.phase === 'study' ? 18000 : kind === 'hiding' ? 45000 : 45000);
      }
    } else if (action === 'reveal') {
      if (!['question', 'predict', 'vote', 'study'].includes(room.phase)) throw new GameError('There is no active question.');
      this.advance(room);
    } else if (action === 'pause') {
      if (!room.deadline) throw new GameError('There is no running timer to pause.');
      room.remaining = Math.max(0, room.deadline - this.now()); room.pausedAt = this.now(); room.deadline = null; room.paused = true;
    } else if (action === 'resume') {
      if (!room.paused) throw new GameError('The game is not paused.');
      room.openedAt += this.now() - room.pausedAt; room.deadline = this.now() + room.remaining; room.paused = false;
    } else throw new GameError('Unknown host action.');
    this.emit(room); return room;
  }
  advance(room) {
    room.paused = false; room.waitingForHost = false;
    if (room.phase === 'study') {
      room.phase = 'question'; room.openedAt = this.now(); room.deadline = this.now() + 45000;
    } else if (room.phase === 'vote') {
      room.votes = new Map(room.answers); room.answers = new Map(); room.phase = 'predict'; room.openedAt = this.now(); room.deadline = this.now() + 30000;
    } else {
      const q = this.question(room), kind = this.kind(room); const counts = [0, 0, 0, 0];
      if (kind === 'crowd') for (const a of room.votes.values()) counts[a.value]++;
      const top = Math.max(...counts); const anyVote = counts.some(Boolean);
      room.result = { counts, correct: kind === 'crowd' ? (anyVote ? counts.map((n, i) => n === top ? i : -1).filter(n => n >= 0) : []) : q.correct, changes: q.changes, note: kind === 'crowd' ? (anyVote ? 'You have spoken! All tied favourites count as correct.' : 'No votes were cast. No points awarded this round.') : q.note };
      const maximum = kind === 'final' && room.difficulty === 'hard' ? 200 : 100;
      for (const team of room.teams) {
        const a = room.answers.get(team.id); let earned = 0;
        if (a && kind === 'changes') earned = Math.round(a.value.filter(v => q.changes.includes(v)).length / 3 * 100);
        else if (a && (kind === 'crowd' ? room.result.correct.includes(a.value) : a.value === q.correct)) earned = maximum;
        team.earned = earned; team.score += earned;
      }
      room.phase = 'results'; room.deadline = null;
    }
  }
  answer(code, key, value) {
    const room = this.room(code), team = room.teams.find(t => t.id === key);
    if (!team) throw new GameError('Join the room before answering.', 403);
    if (!['question', 'vote', 'predict'].includes(room.phase) || room.paused) throw new GameError('Answers are not open right now.');
    if (room.deadline && this.now() >= room.deadline) throw new GameError('Time is up.');
    if (room.answers.has(team.id)) throw new GameError('Your answer is already locked in.');
    this.validateAnswer(room, value);
    room.answers.set(team.id, { value, at: this.now() }); this.emit(room);
  }
  hostAnswer(code, key, teamId, value, expected) {
    const room = this.room(code); this.host(room, key);
    if (room.playMode !== 'projector') throw new GameError('Host recording is only available in projector mode.');
    if (!['question', 'vote', 'predict'].includes(room.phase)) throw new GameError('Answers are not open right now.');
    if (expected?.index !== room.index || expected?.phase !== room.phase) throw new GameError('The round has moved on. Record this table on the current question.');
    const team = room.teams.find(t => t.id === teamId);
    if (!team) throw new GameError('Choose a table in this room.');
    if (value === null) room.answers.delete(teamId);
    else { this.validateAnswer(room, value); room.answers.set(teamId, { value, at: this.now() }); }
    this.emit(room);
  }
  validateAnswer(room, value) {
    if (this.kind(room) === 'changes') {
      const objects = this.question(room).objects || ['balloon', 'gift', 'cup', 'cake', 'plant', 'clock'];
      if (!Array.isArray(value) || value.length !== 3 || new Set(value).size !== 3 || !value.every(v => objects.includes(v))) throw new GameError('Choose three different objects.');
    } else if (!Number.isInteger(value) || value < 0 || value > 3) throw new GameError('Choose one of the four answers.');
  }
  snapshot(room, key) {
    const isHost = key === room.hostToken, team = room.teams.find(t => t.id === key), q = this.question(room);
    const next = room.questions[room.index + 1];
    const publicQuestion = q ? { prompt: q.prompt, options: q.options, object: q.object, title: q.title, image: q.image, objects: q.objects } : null;
    if (q?.before) {
      publicQuestion.image = room.phase === 'study' ? q.before : q.after;
      if (['results', 'finished'].includes(room.phase)) publicQuestion.before = q.before;
    }
    // Compatibility for already-open rooms using the original vector scene.
    if (room.phase === 'question' && this.kind(room) === 'changes' && !q.before) publicQuestion.changed = q.changes;
    return { code: room.code, title: room.title, game: this.kind(room), playlist: room.game === 'playlist', theme: room.theme, playMode: room.playMode || 'devices', practice: room.practice, role: isHost ? 'host' : team ? 'team' : 'screen', phase: room.phase, index: room.index, total: room.questions.length, nextGame: next?.kind || (room.game === 'playlist' ? null : room.game), preload: ['lobby', 'results'].includes(room.phase) ? [next?.image, next?.before, next?.after].filter(Boolean) : [], question: publicQuestion, deadline: room.deadline, now: this.now(), paused: Boolean(room.paused), waitingForHost: Boolean(room.waitingForHost), pausedAt: room.pausedAt, openedAt: room.openedAt, difficulty: room.difficulty, answered: room.answers.size, voted: room.votes?.size || 0, teams: room.teams.map(t => ({ name: t.name, score: t.score, earned: t.earned || 0, answered: room.answers.has(t.id), mine: t === team, ...(isHost && room.playMode === 'projector' ? { id: t.id, recorded: room.answers.get(t.id)?.value } : {}) })), me: team ? { name: team.name, score: team.score, answer: room.answers.get(team.id)?.value } : null, result: ['results', 'finished'].includes(room.phase) ? room.result : null };
  }
  emit(room) { room.touched = this.now(); this.persist(); for (const fn of room.listeners) fn(); }
  tick() {
    for (const [code, room] of this.rooms) {
      if (this.now() - room.touched > 6 * 60 * 60 * 1000 && !room.listeners.size) { this.rooms.delete(code); this.persist(); continue; }
      if (room.deadline && this.now() >= room.deadline) {
        if (room.playMode === 'projector' && room.phase !== 'study') { room.deadline = null; room.waitingForHost = true; }
        else this.advance(room);
        this.emit(room);
      }
    }
  }
}
