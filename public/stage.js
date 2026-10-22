// The reveal sequence is deterministic, so every screen sees the same clues.
export function tileOrder(seed, count = 384) {
  let state = 2166136261;
  for (const ch of String(seed)) state = Math.imul(state ^ ch.charCodeAt(0), 16777619) >>> 0;
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    const j = (state >>> 0) % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  const ranks = []; order.forEach((tile, rank) => { ranks[tile] = rank; });
  return ranks;
}
export function mosaic(seed) {
  return `<div class="reveal-tiles fine-mosaic" aria-hidden="true">${tileOrder(seed).map((rank, i) => `<div class="reveal-tile" data-rank="${rank}" style="--tile:${i}"></div>`).join('')}</div>`;
}
export function sceneImage(src, label = 'Puzzle scene') {
  if (!/^\/assets\/puzzles\/[a-z0-9-]+\.(jpg|png|webp)$/.test(src || '')) return '';
  return `<img class="puzzle-image" src="${src}" alt="${label}" draggable="false" decoding="async">`;
}
