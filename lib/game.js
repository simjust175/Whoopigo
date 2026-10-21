import { randomBytes, randomInt } from 'node:crypto';
import { getQuestions, gameTypes, themes } from './content.js';

export class GameError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
const token = () => randomBytes(24).toString('hex');
export class Game {
  constructor({ now = () => Date.now() } = {}) { this.rooms = new Map(); this.now = now; }
  create({ game, theme = 'chanukah', title = 'Our family game night', custom = [], practice = false }) {
    if (!gameTypes.includes(game) || !themes.includes(theme)) throw new GameError('Choose a valid game and theme.');
    if (this.rooms.size >= 500) throw new GameError('All game rooms are in use. Please try later.', 503);
    if (!Array.isArray(custom) || custom.length > 30) throw new GameError('Use up to 30 family questions.');
    for (const q of custom) if (!q || typeof q.prompt !== 'string' || !q.prompt.trim() || q.prompt.length > 300 || !Array.isArray(q.options) || q.options.length !== 4 || !q.options.every(o => typeof o === 'string' && o.trim() && o.length <= 100) || !Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3 || (q.note !== undefined && (typeof q.note !== 'string' || q.note.length > 500))) throw new GameError('Each family question needs four answers and one correct answer.');
    let code; do { code = String(randomInt(100000, 1000000)); } while (this.rooms.has(code));
    const room = { code, hostToken: token(), title: String(title).trim().slice(0, 70) || 'Our family game night', game, theme, practice: Boolean(practice), createdAt: this.now(), touched: this.now(), phase: 'lobby', index: -1, questions: getQuestions(game, theme, custom), teams: [], answers: new Map(), listeners: new Set(), difficulty: 'easy', deadline: null };
    this.rooms.set(code, room);
    return room;
  }
  room(code) { const room = this.rooms.get(String(code)); if (!room) throw new GameError('That room could not be found. Check the six-digit code.', 404); return room; }
  host(room, key) { if (key !== room.hostToken) throw new GameError('Only the host can do that.', 403); }
  join(code, name) {
    const room = this.room(code);
    if (room.phase !== 'lobby') throw new GameError('This game has started. Ask the host to open a new room.');
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
        room.answers = new Map(); room.difficulty = difficulty === 'hard' ? 'hard' : 'easy';
        const kind = this.kind(room);
        room.phase = kind === 'changes' ? 'study' : kind === 'crowd' ? 'vote' : 'question';
        room.openedAt = this.now(); room.deadline = this.now() + (room.phase === 'study' ? 12000 : kind === 'hiding' ? 30000 : 45000);
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
    room.paused = false;
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
    if (this.kind(room) === 'changes') {
      if (!Array.isArray(value) || value.length !== 3 || new Set(value).size !== 3 || !value.every(v => ['balloon', 'gift', 'cup', 'cake', 'plant', 'clock'].includes(v))) throw new GameError('Choose three different objects.');
    } else if (!Number.isInteger(value) || value < 0 || value > 3) throw new GameError('Choose one of the four answers.');
    room.answers.set(team.id, { value, at: this.now() }); this.emit(room);
  }
  snapshot(room, key) {
    const isHost = key === room.hostToken, team = room.teams.find(t => t.id === key), q = this.question(room);
    const publicQuestion = q ? { prompt: q.prompt, options: q.options, object: q.object, title: q.title } : null;
    if (room.phase === 'question' && this.kind(room) === 'changes') publicQuestion.changed = q.changes;
    return { code: room.code, title: room.title, game: this.kind(room), playlist: room.game === 'playlist', theme: room.theme, practice: room.practice, role: isHost ? 'host' : team ? 'team' : 'screen', phase: room.phase, index: room.index, total: room.questions.length, question: publicQuestion, deadline: room.deadline, now: this.now(), paused: Boolean(room.paused), pausedAt: room.pausedAt, openedAt: room.openedAt, difficulty: room.difficulty, answered: room.answers.size, voted: room.votes?.size || 0, teams: room.teams.map(t => ({ name: t.name, score: t.score, earned: t.earned || 0, answered: room.answers.has(t.id), mine: t === team })), me: team ? { name: team.name, score: team.score, answer: room.answers.get(team.id)?.value } : null, result: ['results', 'finished'].includes(room.phase) ? room.result : null };
  }
  emit(room) { room.touched = this.now(); for (const fn of room.listeners) fn(); }
  tick() {
    for (const [code, room] of this.rooms) {
      if (this.now() - room.touched > 6 * 60 * 60 * 1000 && !room.listeners.size) { this.rooms.delete(code); continue; }
      if (room.deadline && this.now() >= room.deadline) { this.advance(room); this.emit(room); }
    }
  }
}
