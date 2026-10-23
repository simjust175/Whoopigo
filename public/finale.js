export function rankedTeams(teams) {
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  return sorted.map((team, index) => ({ ...team, rank: sorted.findIndex(t => t.score === team.score) + 1 }));
}

export function finale(s, { escape: esc, icon, gameArt }) {
  const ranked = rankedTeams(s.teams), top = ranked[0]?.score || 0;
  const winners = ranked.filter(t => t.rank === 1);
  const name = winners.length > 2 ? `${winners.length} tables share the crown!` : winners.map(t => t.name).join(' & ');
  const leaders = ranked.slice(0, 3);
  // A shared first place gets the same podium height and medal as every co-winner.
  const podium = leaders.length === 3 ? [leaders[1], leaders[0], leaders[2]] : leaders;
  return `<main class="grand-finale">
    <div class="finale-topline"><p class="eyebrow">THAT'S A GAME NIGHT TO REMEMBER</p><span>${esc(s.title)}</span></div>
    <div class="finale-grid">
      <section class="champion-stage" aria-labelledby="champion-name">
        <div class="champion-spark spark-one" aria-hidden="true">✦</div><div class="champion-spark spark-two" aria-hidden="true">✳</div>
        <div class="champion-heading"><span class="champion-ribbon">${winners.length > 1 ? 'SHARED CHAMPIONS' : 'TONIGHT’S CHAMPIONS'}</span><div class="winner-trophy">${gameArt('final')}</div></div>
        <p class="champion-kicker">${winners.length > 1 ? 'Too good to call it alone.' : 'Give it up for…'}</p>
        <h1 class="winner-name" id="champion-name">${esc(name || 'Everyone at the table')}</h1>
        <div class="champion-total"><strong>${top.toLocaleString()}</strong><span>points<br>worth celebrating</span></div>
        <div class="podium" aria-label="Leading tables">${podium.map(t => `<div class="podium-place ${t.rank === 1 ? 'podium-gold' : ''}" style="--podium-height:${t.rank === 1 ? 112 : t.rank === 2 ? 82 : 58}px"><div class="podium-name">${esc(t.name)}</div><div class="podium-score">${t.score.toLocaleString()} <small>pts</small></div><div class="podium-plinth"><span>${t.rank === 1 ? icon('trophy') : t.rank}</span><small>${ranked.filter(other => other.rank === t.rank).length > 1 ? 'SHARED ' : ''}#${t.rank}</small></div></div>`).join('')}</div>
        <p class="champion-footer">Big guesses. Brilliant teamwork. Everyone brought something.</p>
      </section>
      <section class="finale-standings" aria-labelledby="standings-title"><div class="standings-heading"><div><p class="eyebrow">EVERY TABLE. EVERY POINT.</p><h2 id="standings-title">The final standings</h2></div><span>${ranked.length} ${ranked.length === 1 ? 'table' : 'tables'}</span></div>
        <div class="standings-list" tabindex="0" aria-label="Final scores, scroll for more tables">${ranked.map(t => `<div class="standing-row ${t.rank === 1 ? 'standing-winner' : ''}"><span class="standing-rank">${t.rank === 1 ? icon('trophy') : t.rank}</span><div><strong>${esc(t.name)}</strong>${t.rank === 1 ? '<small>Champion' + (winners.length > 1 ? ' · shared first' : '') + '</small>' : ''}</div><b>${t.score.toLocaleString()}<small>points</small></b></div>`).join('')}</div>
        <div class="finale-recap"><span><strong>${s.total}</strong> rounds played</span><span><strong>${ranked.length}</strong> tables together</span></div>
        <div class="finale-actions"><a href="/" class="button primary full-width">Let’s play another ${icon('arrow')}</a><button class="button subtle full-width" id="celebrate-again">${icon('spark')} One more round of applause</button></div>
      </section>
    </div>
  </main>`;
}
