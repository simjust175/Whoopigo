export const icons = {
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  sound: '<path d="m11 5-6 4H2v6h3l6 4V5zm5 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  mute: '<path d="m11 5-6 4H2v6h3l6 4V5zm5 4 5 6m0-6-5 6"/>',
  spark: '<path d="m12 2 2.7 7.3L22 12l-7.3 2.7L12 22l-2.7-7.3L2 12l7.3-2.7L12 2z"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-17a3 3 0 0 1 0 6m3 11v-3a6 6 0 0 0-2-4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  home: '<path d="m3 11 9-8 9 8v10h-7v-7h-4v7H3V11z"/>',
  screen: '<rect x="3" y="3" width="18" height="13" rx="2"/><path d="M12 16v5m-5 0h10"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="m8 4 13 8-13 8V4z"/>',
  trophy: '<path d="M7 3h10v7a5 5 0 0 1-10 0V3zm0 2H3v3a5 5 0 0 0 5 5m9-8h4v3a5 5 0 0 1-5 5m-4 2v6m-5 0h10"/>',
  gear: '<path d="m9 3-1 3-3 1-2 5 2 5 3 1 1 3h6l1-3 3-1 2-5-2-5-3-1-1-3H9z"/><circle cx="12" cy="12" r="3"/>'
};
export function icon(name, cls = '') { return `<svg class="icon ${cls}" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.spark}</svg>`; }

export function gameArt(type) {
  const drawings = {
    hiding: `<g class="art-float"><path d="m69 56 69-20 59 34-68 24z" fill="#e9ad4b"/><path d="m69 56 60 38v67l-60-36z" fill="#f9cf77"/><path d="m129 94 68-24v65l-68 26z" fill="#ce8740"/><path d="m97 47 61 36v66m-61-85 70-22" fill="none" stroke="#fff0c8" stroke-width="13"/><path d="M128 41c-42-32-48 1-12 5m14-5c33-44 53-6 12 4" fill="none" stroke="#f2bd65" stroke-width="10" stroke-linecap="round"/></g><g class="sparkle"><path d="m211 37 4 10 11 4-11 4-4 11-4-11-11-4 11-4zM49 115l3 8 9 3-9 3-3 9-3-9-9-3 9-3z" fill="#fff8db"/></g>`,
    crowd: `<g class="art-float"><path d="M59 45h111a18 18 0 0 1 18 18v49a18 18 0 0 1-18 18h-55l-31 24 3-24H59a18 18 0 0 1-18-18V63a18 18 0 0 1 18-18" fill="#f9ebcb"/><circle cx="81" cy="87" r="8" fill="#567c69"/><circle cx="115" cy="87" r="8" fill="#567c69"/><circle cx="149" cy="87" r="8" fill="#567c69"/><path d="M159 105h51a12 12 0 0 1 12 12v30a12 12 0 0 1-12 12h-6l6 19-24-19h-27a12 12 0 0 1-12-12v-30a12 12 0 0 1 12-12" fill="#efb887"/><path d="m170 130 10 10 19-22" fill="none" stroke="#925e3b" stroke-width="7" stroke-linecap="round"/></g>`,
    family: `<g class="art-float"><g transform="rotate(-12 105 100)"><rect x="48" y="30" width="105" height="132" rx="7" fill="#fff7e9"/><rect x="59" y="41" width="83" height="87" rx="3" fill="#d7b7a3"/><circle cx="100" cy="71" r="17" fill="#e9d7c0"/><path d="M70 126v-16a30 30 0 0 1 60 0v16" fill="#628a7c"/></g><circle cx="175" cy="104" r="39" fill="#cce1d7" fill-opacity=".7" stroke="#48675b" stroke-width="10"/><path d="m201 134 26 29" stroke="#c79465" stroke-width="16" stroke-linecap="round"/><path d="m160 92 12-10" stroke="#fff" stroke-width="5" stroke-linecap="round"/></g>`,
    changes: `<g class="art-float"><rect x="34" y="44" width="84" height="108" rx="13" fill="#fff5dc" transform="rotate(-8 76 98)"/><rect x="146" y="44" width="84" height="108" rx="13" fill="#fff5dc" transform="rotate(8 188 98)"/><path d="m77 66 9 22 24 2-19 16 5 23-20-12-21 12 5-23-18-16 24-2z" fill="#e9ad4b"/><path d="m187 66 9 22 24 2-19 16 5 23-20-12-21 12 5-23-18-16 24-2z" fill="#de8b73"/><path d="M119 89h25m-9-8 9 8-9 8" fill="none" stroke="#887443" stroke-width="4" stroke-linecap="round"/></g>`,
    final: `<g class="art-float"><path d="M86 43h94v45a47 47 0 0 1-94 0z" fill="#f3c364"/><path d="M86 53H60v23q0 36 36 36m84-59h26v23q0 36-36 36" fill="none" stroke="#d69c42" stroke-width="12"/><path d="M132 135v29m-31 3h64" stroke="#d69c42" stroke-width="12" stroke-linecap="round"/><path d="m132 58 7 16 18 2-14 12 4 18-15-10-16 10 4-18-14-12 19-2z" fill="#fff5c5"/></g><path class="sparkle" d="m54 124 3 10 10 3-10 3-3 10-3-10-10-3 10-3zm158-95 3 9 9 3-9 3-3 9-3-9-9-3 9-3z" fill="#fff6c9"/>`
  };
  return `<svg class="game-art" viewBox="0 0 266 194" aria-hidden="true"><ellipse cx="133" cy="169" rx="72" ry="9" fill="#183e32" opacity=".08"/>${drawings[type]}</svg>`;
}

export function mysteryArt(object) {
  const art = {
    bicycle: '<circle cx="100" cy="195" r="53" fill="#f7dfae" stroke="#294f47" stroke-width="12"/><circle cx="293" cy="195" r="53" fill="#f7dfae" stroke="#294f47" stroke-width="12"/><path d="m100 195 65-92 62 92H100l46-66h110l37 66-46-123h-26m-56 31-8-24h-27" fill="none" stroke="#e17f64" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>',
    teapot: '<ellipse cx="190" cy="180" rx="83" ry="69" fill="#6b9b83"/><path d="M270 157q77-26 61 33t-63 22" fill="none" stroke="#507963" stroke-width="18"/><path d="m119 174-72-45 23 64 62 26" fill="#6b9b83"/><path d="M126 125q64-36 129 0" fill="#efc46a"/><circle cx="190" cy="99" r="14" fill="#d9aa50"/><path d="M160 158q30-22 62 0" stroke="#a9c3a4" stroke-width="9" fill="none"/>',
    umbrella: '<path d="M51 155a150 135 0 0 1 298 0q-36-33-74 0-37-34-75 0-36-34-75 0-37-33-74 0" fill="#e99578"/><path d="M200 20q-68 60-75 135m75-135q67 60 75 135" fill="none" stroke="#fff0ce" stroke-width="7"/><path d="M200 157v94q0 38 33 24t20-38" fill="none" stroke="#365b4c" stroke-width="12" stroke-linecap="round"/>',
    dreidel: '<path d="m190 65 87 48-87 49-87-49z" fill="#f7d483"/><path d="m103 113 87 49v91l-87-67z" fill="#e2aa4f"/><path d="m190 162 87-49v73l-87 67z" fill="#c68539"/><path d="M190 71V32" stroke="#ba7d35" stroke-width="19" stroke-linecap="round"/><text x="143" y="187" fill="#fff4cc" font-size="53" text-anchor="middle">נ</text><text x="231" y="186" fill="#f9e3ac" font-size="48" text-anchor="middle">ג</text>',
    doughnut: '<ellipse cx="200" cy="170" rx="118" ry="82" fill="#be713a"/><ellipse cx="200" cy="151" rx="118" ry="78" fill="#e9af5c"/><path d="M101 125q93-82 191-4-10 38-42 7-30 41-61 3-40 33-64-1-25 13-24-5" fill="#fff2d4"/><ellipse cx="201" cy="118" rx="22" ry="13" fill="#b84d48"/><path d="m142 101 7 2m94 19 8-1m-79 18 6 1" stroke="#fff" stroke-width="5" stroke-linecap="round"/>',
    jug: '<path d="M176 70h62l-8 61q70 38 48 108-13 41-76 41-65 0-78-41-23-70 59-108z" fill="#c78d56"/><path d="M239 143q93-18 75 46-10 36-40 33" fill="none" stroke="#a46c40" stroke-width="17"/><path d="m176 70-37-16 10 38 33 8" fill="#c78d56"/><ellipse cx="205" cy="70" rx="31" ry="8" fill="#775333"/><path d="M160 190q43-24 87 0m-88 25q43-24 87 0" fill="none" stroke="#eec58c" stroke-width="7"/>'
  };
  return `<svg viewBox="0 0 400 310" class="mystery-art" role="img" aria-label="Mystery picture"><ellipse cx="200" cy="277" rx="130" ry="12" fill="#234e3e" opacity=".1"/>${art[object] || art.teapot}</svg>`;
}

export function memoryScene(changed = [], selected = [], interactive = false) {
  const changedColor = (key, a, b) => changed.includes(key) ? b : a;
  const wrap = (key, content) => `<g class="scene-object ${selected.includes(key) ? 'selected' : ''}" ${interactive ? `data-object="${key}" role="button" tabindex="0" aria-label="${key}" aria-pressed="${selected.includes(key)}"` : ''}><title>${key}</title>${content}</g>`;
  return `<svg class="memory-scene" viewBox="0 0 800 430" role="group" aria-label="A party table with six objects"><rect width="800" height="430" rx="22" fill="#f3e5ca"/><path d="M0 300h800v130H0z" fill="#d8c0a2"/><path d="M80 300h640l-34 44H114z" fill="#af7855"/><path d="M120 344v72m560-72v72" stroke="#865b45" stroke-width="16"/>
    ${wrap('balloon', `<ellipse cx="105" cy="105" rx="43" ry="54" fill="${changedColor('balloon', '#e7987d', '#6f99bb')}"/><path d="m104 159-5 12h12z" fill="#ba725a"/><path d="M105 173q-29 31 0 56t-7 61" fill="none" stroke="#7d725e" stroke-width="2"/>`)}
    ${wrap('clock', '<circle cx="395" cy="80" r="44" fill="#fff9e8" stroke="#b9905f" stroke-width="8"/><path d="M395 52v28l19 12" stroke="#37594d" stroke-width="5" stroke-linecap="round"/>')}
    ${wrap('gift', `<rect x="174" y="227" width="107" height="73" rx="5" fill="#e9be67"/><path d="M228 227v73m-54-48h107" stroke="${changedColor('gift', '#688c79', '#d67e70')}" stroke-width="14"/><path d="M227 229c-62-45-55-66-16-32l16 29c58-52 75-33 5 3" fill="none" stroke="${changedColor('gift', '#688c79', '#d67e70')}" stroke-width="8"/>`)}
    ${wrap('cake', `<path d="M330 250h147v47H330z" fill="${changedColor('cake', '#de977d', '#a69abd')}"/><ellipse cx="403" cy="250" rx="73" ry="19" fill="#fff4d8"/><path d="M341 254v15m23-10v18m24-17v12m25-13v19m24-23v15m25-17v14" stroke="#fff4d8" stroke-width="10" stroke-linecap="round"/><path d="M383 209v27m39-27v27" stroke="#e5b45b" stroke-width="7"/><path d="M383 191q-11 15 0 17 10-3 0-17m39 0q-11 15 0 17 10-3 0-17" fill="#d88742"/>`)}
    ${wrap('cup', `<path d="M523 249h48l-6 47h-36z" fill="${changedColor('cup', '#688c79', '#e5af56')}"/><path d="M570 255q28-2 22 19t-24 5" fill="none" stroke="${changedColor('cup', '#688c79', '#e5af56')}" stroke-width="8"/>`)}
    ${wrap('plant', `<path d="m633 251 8 48h48l8-48z" fill="${changedColor('plant', '#bd825f', '#6d8aa2')}"/><path d="M665 255v-78m0 35q-49 9-42-35 42-2 42 35m0 11q46 0 41-38-40-4-41 38" fill="#66856a" stroke="#54765d" stroke-width="4"/>`)}
  </svg>`;
}

