import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';

// One server process per store. Mount this directory on persistent storage in production.
export function fileStorage(filename) {
  const target = path.resolve(filename);
  return {
    load() {
      if (!existsSync(target)) return [];
      const saved = JSON.parse(readFileSync(target, 'utf8'));
      if (saved.version !== 1 || !Array.isArray(saved.rooms)) throw new Error('Unrecognised room backup; refusing to overwrite it.');
      return saved.rooms;
    },
    save(rooms) {
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target + '.tmp', JSON.stringify({ version: 1, rooms }), { mode: 0o600 });
      renameSync(target + '.tmp', target);
    }
  };
}
