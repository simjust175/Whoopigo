import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Game, GameError } from './lib/game.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
export function createApp() {
  const game = new Game(), limits = new Map();
  const timer = setInterval(() => game.tick(), 250); timer.unref();
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; font-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'");
    try {
      const url = new URL(req.url, 'http://localhost');
      const json = (value, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); };
      if (req.method === 'POST' && url.pathname.startsWith('/api/')) {
        if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) throw new GameError('This request must come from the game website.', 403);
        const ip = req.socket.remoteAddress; let limit = limits.get(ip);
        if (!limit || limit.until < Date.now()) { limit = { count: 0, until: Date.now() + 60000 }; limits.set(ip, limit); }
        if (++limit.count > 600) throw new GameError('Too many requests. Please wait a moment.', 429);
        let body = ''; for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 50000) throw new GameError('That request is too large.', 413); }
        let data; try { data = JSON.parse(body || '{}'); } catch { throw new GameError('Invalid request.'); }
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw new GameError('Invalid request.');
        if (url.pathname === '/api/rooms') {
          const room = game.create(data); return json({ code: room.code, token: room.hostToken }, 201);
        }
        const match = url.pathname.match(/^\/api\/rooms\/(\d{6})\/(join|action|answer)$/);
        if (!match) throw new GameError('Not found.', 404);
        const [, code, action] = match;
        if (action === 'join') { const team = game.join(code, data.name); return json({ token: team.id, name: team.name }); }
        if (action === 'action') game.action(code, data.token, data.action, data.difficulty);
        if (action === 'answer') game.answer(code, data.token, data.value);
        return json({ ok: true });
      }
      const stream = url.pathname.match(/^\/api\/rooms\/(\d{6})\/events$/);
      if (stream && req.method === 'GET') {
        const room = game.room(stream[1]);
        if (room.listeners.size >= 120) throw new GameError('This room has reached its connection limit.', 429);
        const key = url.searchParams.get('token');
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' });
        const send = () => res.write(`data: ${JSON.stringify(game.snapshot(room, key))}\n\n`);
        room.listeners.add(send); send();
        const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 20000);
        res.on('close', () => { clearInterval(heartbeat); room.listeners.delete(send); }); return;
      }
      if (url.pathname === '/api/health') return json({ ok: true, storage: 'ephemeral' });
      if (req.method !== 'GET' && req.method !== 'HEAD') throw new GameError('Method not allowed.', 405);
      const filename = path.resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
      if (!filename.startsWith(root + path.sep)) throw new GameError('Not found.', 404);
      const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };
      let content; try { content = await readFile(filename); } catch { throw new GameError('Not found.', 404); }
      res.writeHead(200, { 'Content-Type': mime[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(req.method === 'HEAD' ? undefined : content);
    } catch (error) {
      if (res.headersSent) return res.end();
      res.writeHead(error.status || 500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error instanceof GameError ? error.message : 'Something went wrong. Please try again.' }));
    }
  });
  server.on('close', () => clearInterval(timer));
  return { server, game };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { server } = createApp();
  server.listen(Number(process.env.PORT) || 3000, '0.0.0.0', () => console.log(`Whoopigo is ready at http://localhost:${server.address().port}`));
}
