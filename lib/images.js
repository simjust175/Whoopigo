import { randomBytes } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, writeFileSync, statSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { GameError } from './game.js';

const lifetime = 24 * 60 * 60 * 1000;
const maxBytes = 700000;
const maxStoredBytes = 128 * 1024 * 1024;
const validName = /^[a-f0-9]{48}\.jpg$/;

export function decodeUpload(data) {
  if (typeof data !== 'string' || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(data) || data.length > 940000) throw new GameError('Choose a JPEG, PNG or WebP image using the image picker.');
  const buffer = Buffer.from(data.slice(data.indexOf(',') + 1), 'base64');
  if (buffer.length > maxBytes || buffer.length < 20 || buffer[0] !== 255 || buffer[1] !== 216 || buffer[2] !== 255 || buffer.at(-2) !== 255 || buffer.at(-1) !== 217) throw new GameError('That image could not be read. Choose another picture.');
  return buffer;
}

// Opaque image links are shared only with a room. Files expire, and never enter Git.
export function imageStore(directory, now = () => Date.now()) {
  const memory = new Map();
  if (directory) mkdirSync(directory, { recursive: true });
  const records = () => directory
    ? readdirSync(directory).filter(n => validName.test(n)).map(name => { const stat = statSync(path.join(directory, name)); return { name, size: stat.size, at: stat.mtimeMs }; })
    : [...memory].map(([name, value]) => ({ name, size: value.buffer.length, at: value.at }));
  const remove = name => directory ? unlinkSync(path.join(directory, name)) : memory.delete(name);
  return {
    prune() { for (const record of records()) if (now() - record.at > lifetime) remove(record.name); },
    put(data) {
      const buffer = decodeUpload(data); this.prune();
      const existing = records();
      if (existing.length >= 300 || existing.reduce((n, r) => n + r.size, 0) + buffer.length > maxStoredBytes) throw new GameError('Image storage is full. Please try later.', 503);
      const name = randomBytes(24).toString('hex') + '.jpg';
      if (directory) writeFileSync(path.join(directory, name), buffer, { flag: 'wx', mode: 0o600 });
      else memory.set(name, { buffer, at: now() });
      return '/media/' + name;
    },
    get(name) {
      if (!validName.test(name)) throw new GameError('Picture not found.', 404);
      if (directory) {
        try {
          if (now() - statSync(path.join(directory, name)).mtimeMs > lifetime) throw new Error('Expired');
          return readFileSync(path.join(directory, name));
        } catch { throw new GameError('This picture has expired. Create a new game from your saved pack.', 404); }
      }
      const value = memory.get(name);
      if (!value || now() - value.at > lifetime) throw new GameError('Picture not found or expired.', 404);
      return value.buffer;
    },
    has(src) { try { this.get(String(src).replace('/media/', '')); return true; } catch { return false; } }
  };
}
