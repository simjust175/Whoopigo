import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Game, GameError } from './lib/game.js';
import { fileStorage } from './lib/storage.js';
import { imageStore } from './lib/images.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
export function createApp({ storage, images = imageStore() } = {}) {
  const game = new Game({ storage }), limits = new Map();
  images.prune();
  const timer = setInterval(() => game.tick(), 250); timer.unref();
  const imageCleanup = setInterval(() => images.prune(), 15 * 60 * 1000); imageCleanup.unref();
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
        if (limits.size > 1000) for (const [key, value] of limits) if (value.until < Date.now()) limits.delete(key);
        if (!limit || limit.until < Date.now()) { limit = { count: 0, until: Date.now() + 60000 }; limits.set(ip, limit); }
        if (++limit.count > 600) throw new GameError('Too many requests. Please wait a moment.', 429);
        const maximumBody = url.pathname === '/api/uploads' ? 950000 : 60000;
        const chunks = []; let bytes = 0;
        for await (const chunk of req) { bytes += chunk.length; if (bytes > maximumBody) throw new GameError('That request is too large.', 413); chunks.push(chunk); }
        const body = Buffer.concat(chunks).toString('utf8');
        let data; try { data = JSON.parse(body || '{}'); } catch { throw new GameError('Invalid request.'); }
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw new GameError('Invalid request.');
        if (url.pathname === '/api/uploads') return json({ image: images.put(data.image) }, 201);
        if (url.pathname === '/api/rooms') {
          if (Array.isArray(data.hiding) && data.hiding.some(q => !images.has(q?.image))) throw new GameError('A picture has expired. Upload the saved pack again.');
          const room = game.create(data); return json({ code: room.code, token: room.hostToken }, 201);
        }
        const match = url.pathname.match(/^\/api\/rooms\/(\d{6})\/(join|action|answer|tables|host-answer)$/);
        if (!match) throw new GameError('Not found.', 404);
        const [, code, action] = match;
        if (action === 'join') { const team = game.join(code, data.name); return json({ token: team.id, name: team.name }); }
        if (action === 'action') game.action(code, data.token, data.action, data.difficulty);
        if (action === 'answer') game.answer(code, data.token, data.value);
        if (action === 'tables') game.addTables(code, data.token, data.names ?? [data.name]);
        if (action === 'host-answer') game.hostAnswer(code, data.token, data.teamId, data.value, { index: data.index, phase: data.phase });
        return json({ ok: true });
      }
      const media = url.pathname.match(/^\/media\/([a-f0-9]{48}\.jpg)$/);
      if (media && ['GET', 'HEAD'].includes(req.method)) {
        const content = images.get(media[1]);
        res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=300', 'Content-Length': content.length });
        return res.end(req.method === 'HEAD' ? undefined : content);
      }
      const stream = url.pathname.match(/^\/api\/rooms\/(\d{6})\/events$/);
      if (stream && req.method === 'HEAD') { game.room(stream[1]); res.writeHead(200); return res.end(); }
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
      if (url.pathname === '/api/health') return json({ ok: true, storage: storage ? 'persistent-file' : 'ephemeral' });
      if (req.method !== 'GET' && req.method !== 'HEAD') throw new GameError('Method not allowed.', 405);
      const filename = path.resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
      if (!filename.startsWith(root + path.sep)) throw new GameError('Not found.', 404);
      const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2' };
      let content; try { content = await readFile(filename); } catch { throw new GameError('Not found.', 404); }
      res.writeHead(200, { 'Content-Type': mime[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(req.method === 'HEAD' ? undefined : content);
    } catch (error) {
      if (res.headersSent) return res.end();
      res.writeHead(error.status || 500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error instanceof GameError ? error.message : 'Something went wrong. Please try again.' }));
    }
  });
  server.on('close', () => { clearInterval(timer); clearInterval(imageCleanup); });
  return { server, game };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dataFile = process.env.DATA_FILE || './data/rooms.json';
  const { server } = createApp({ storage: fileStorage(dataFile), images: imageStore(path.join(path.dirname(path.resolve(dataFile)), 'uploads')) });
  server.listen(Number(process.env.PORT) || 3000, '0.0.0.0', () => console.log(`Whoopigo is ready at http://localhost:${server.address().port}`));
}
