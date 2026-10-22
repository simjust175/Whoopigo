const recordingQueues = new Map();

export function tableStrip(s, esc) {
  if (s.playMode !== 'projector') return '';
  return `<section class="table-score-strip" aria-label="Table scores">${s.teams.map(t => `<div class="table-score-chip ${t.answered ? 'has-answer' : ''}"><span>${esc(t.name)}</span><strong>${t.score}<small> pts</small></strong>${t.answered ? '<i aria-label="Answer recorded">✓</i>' : ''}</div>`).join('')}</section>`;
}

export function projectorPanel(s, icon, esc) {
  if (s.role !== 'host' || s.playMode !== 'projector' || !['question', 'vote', 'predict'].includes(s.phase)) return '';
  return `<details class="projector-record" ${s.teams.length <= 8 ? 'open' : ''}><summary>${icon('users')} Record table ${s.phase === 'vote' ? 'votes' : 'answers'} <span>${s.answered}/${s.teams.length} recorded</span></summary><p>Ask every table to commit together before recording. You can correct an entry until you reveal the answers.</p><div class="table-record-grid">${s.teams.map(t => `<div class="table-record-row"><strong>${esc(t.name)}</strong>${s.game === 'changes' ? `<button class="button subtle" data-memory-record="${t.id}">${Array.isArray(t.recorded) ? 'Edit three choices' : 'Choose three details'}</button>` : `<div class="table-record-options" role="group" aria-label="Answer for ${esc(t.name)}">${['A', 'B', 'C', 'D'].map((l, i) => `<button data-table-answer="${t.id}" data-value="${i}" aria-pressed="${t.recorded === i}" class="${t.recorded === i ? 'chosen' : ''}">${l}</button>`).join('')}</div>`}<span class="record-state">${t.answered ? '✓ Recorded' : 'Waiting'}</span>${t.answered ? `<button class="text-button" data-clear-table="${t.id}" aria-label="Clear answer for ${esc(t.name)}">Clear</button>` : ''}</div>`).join('')}</div></details>`;
}

export function bindProjector(s, { api, key, modal, toast, icon, escape: esc }) {
  if (s.playMode !== 'projector') return;
  const capture = async (teamId, value) => {
    // Keep rapid corrections for one table in the order the host clicked them.
    const operation = (recordingQueues.get(teamId) || Promise.resolve()).catch(() => {}).then(() => api(`/api/rooms/${s.code}/host-answer`, { token: key, teamId, value, index: s.index, phase: s.phase }));
    recordingQueues.set(teamId, operation);
    try { await operation; }
    catch (error) { toast(error.message); }
    finally { if (recordingQueues.get(teamId) === operation) recordingQueues.delete(teamId); }
  };
  document.querySelectorAll('[data-table-answer]').forEach(b => b.onclick = () => capture(b.dataset.tableAnswer, Number(b.dataset.value)));
  document.querySelectorAll('[data-clear-table]').forEach(b => b.onclick = () => capture(b.dataset.clearTable, null));
  document.querySelectorAll('[data-memory-record]').forEach(b => b.onclick = () => {
    const team = s.teams.find(t => t.id === b.dataset.memoryRecord);
    const chosen = new Set(team.recorded || []), objects = s.question.objects;
    const m = modal(`<p class="eyebrow">RECORD THIS TABLE’S THREE CHOICES</p><h2 id="modal-title">${esc(team.name)}</h2><p>The table chooses three details. The game checks and scores them at the reveal.</p><div class="memory-record-choices">${objects.map((o, i) => `<label><input type="checkbox" value="${i}" ${chosen.has(o) ? 'checked' : ''}><span>${esc(o)}</span></label>`).join('')}</div><p id="record-selection-count" aria-live="polite">${chosen.size}/3 selected</p><button class="button primary full-width" id="save-table-memory" ${chosen.size !== 3 ? 'disabled' : ''}>Record choices ${icon('check')}</button>`);
    m.el.querySelectorAll('input[type=checkbox]').forEach(input => input.onchange = () => {
      const value = objects[Number(input.value)];
      if (input.checked && chosen.size >= 3) { input.checked = false; return toast('Choose exactly three details.'); }
      if (input.checked) chosen.add(value); else chosen.delete(value);
      m.el.querySelector('#record-selection-count').textContent = `${chosen.size}/3 selected`;
      m.el.querySelector('#save-table-memory').disabled = chosen.size !== 3;
    });
    m.el.querySelector('#save-table-memory').onclick = async e => {
      const button = e.currentTarget; button.disabled = true;
      try { await api(`/api/rooms/${s.code}/host-answer`, { token: key, teamId: team.id, value: [...chosen], index: s.index, phase: s.phase }); m.close(); }
      catch (error) { toast(error.message); button.disabled = false; }
    };
  });
  const addTable = document.querySelector('#add-projector-table');
  if (addTable) addTable.onclick = () => {
    const remaining = 50 - s.teams.length;
    const m = modal(`<p class="eyebrow">EVERYONE GETS A PLACE</p><h2 id="modal-title">Make room for more.</h2><p>You have ${s.teams.length} tables. Add one name per line; new tables start with zero points.</p><form id="add-table-form"><label>New table names<textarea name="names" maxlength="1450" rows="4" required placeholder="The Bright Sparks&#10;The Grand Guessers"></textarea></label><p class="table-form-status" aria-live="polite">Space for ${remaining} more tables.</p><p class="form-error" role="alert" hidden></p><button class="button primary full-width" ${remaining ? '' : 'disabled'}>Add tables ${icon('arrow')}</button></form>`);
    const form = m.el.querySelector('form'), field = form.elements.names, button = form.querySelector('button'), errorBox = form.querySelector('.form-error');
    field.oninput = () => {
      const count = field.value.split(/\r?\n/).filter(n => n.trim()).length;
      form.querySelector('.table-form-status').textContent = count ? `${count} new table${count === 1 ? '' : 's'} · ${s.teams.length + count}/50 total` : `Space for ${remaining} more tables.`;
      button.disabled = !count || count > remaining;
      errorBox.hidden = true;
    };
    form.onsubmit = async e => {
      e.preventDefault(); button.disabled = true; errorBox.hidden = true;
      const names = field.value.split(/\r?\n/).map(n => n.trim()).filter(Boolean);
      try { await api(`/api/rooms/${s.code}/tables`, { token: key, names }); m.close(); toast(`${names.length} table${names.length === 1 ? '' : 's'} added. Everyone's in!`); }
      catch (error) { errorBox.textContent = error.message; errorBox.hidden = false; button.disabled = false; }
    };
  };
  const showTables = document.querySelector('#show-tables');
  if (showTables) showTables.onclick = () => {
    modal(`<p class="eyebrow">ONE ROOM. EVERY TABLE.</p><h2 id="modal-title">The friendly rivalry</h2><div class="projector-scoreboard ${s.teams.length > 12 ? 'many-tables' : ''}">${[...s.teams].sort((a, b) => b.score - a.score).map((t, i) => `<div><span>${i + 1}</span><strong>${esc(t.name)}</strong><b>${t.score}<small>points</small></b></div>`).join('')}</div>`, true);
  };
}
