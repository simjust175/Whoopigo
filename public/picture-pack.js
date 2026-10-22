const maxPictures = 12;
let database;
function openStore() {
  database ||= new Promise((resolve, reject) => {
    const request = indexedDB.open('whoopigo-picture-packs', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('packs');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('This browser could not open saved picture packs.'));
  });
  return database;
}
export function validPictureRound(q) {
  return q && typeof q.prompt === 'string' && q.prompt.trim() && q.prompt.length <= 300 && typeof q.image === 'string' && q.image.length < 940000 && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(q.image) && Array.isArray(q.options) && q.options.length === 4 && q.options.every(o => typeof o === 'string' && o.trim() && o.length <= 100) && new Set(q.options.map(o => o.trim().toLowerCase())).size === 4 && Number.isInteger(q.correct) && q.correct >= 0 && q.correct <= 3 && typeof q.note === 'string' && q.note.length <= 500;
}
export async function readPictures() {
  const db = await openStore();
  return new Promise((resolve, reject) => {
    const request = db.transaction('packs').objectStore('packs').get('hiding');
    request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result.filter(validPictureRound).slice(0, maxPictures) : []);
    request.onerror = () => reject(new Error('Your saved picture pack could not be loaded.'));
  });
}
export async function savePictures(pictures) {
  if (pictures.length > maxPictures || !pictures.every(validPictureRound)) throw new Error('Check the picture, four different answers and correct answer.');
  const db = await openStore();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('packs', 'readwrite');
    transaction.objectStore('packs').put(pictures, 'hiding');
    transaction.oncomplete = resolve;
    transaction.onabort = transaction.onerror = () => reject(new Error('The browser could not save this pack. Free some storage and try again.'));
  });
}
export async function preparePicture(file) {
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPEG, PNG or WebP picture.');
  if (file.size > 15 * 1024 * 1024) throw new Error('Choose a picture smaller than 15 MB.');
  let bitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { throw new Error('That picture could not be opened. Try a different image.'); }
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    // Re-encoding removes camera metadata and keeps room downloads practical.
    for (const quality of [.87, .74, .61, .48]) {
      const result = canvas.toDataURL('image/jpeg', quality);
      if (result.length <= 900000) return result;
    }
    throw new Error('That picture is too detailed to share efficiently. Try a smaller image.');
  } finally { bitmap.close(); }
}

export async function pictureEditor({ pictures, modal, escape: esc, icon, toast, back, change }) {
  let draftImage = '', editing = -1, processing = false;
  const m = modal(`<p class="eyebrow">YOUR PICTURES. THEIR BEST GUESSES.</p><h2 id="modal-title">Make your own mystery.</h2><p>Family photos, familiar places, a surprising close-up. Add four possible answers and choose the right one.</p><form id="picture-form"><label class="picture-upload">Upload your picture<input id="picture-file" type="file" accept="image/jpeg,image/png,image/webp"><span>JPEG, PNG or WebP · up to 15 MB</span></label><div id="picture-preview" class="picture-preview"><span>✦</span><p>Your picture will hide behind the mosaic.</p></div><label>Your question<input name="prompt" maxlength="300" placeholder="Where was this family adventure?" required></label><div class="family-answer-inputs">${['A', 'B', 'C', 'D'].map((letter, i) => `<label>${letter}<input name="option${i}" maxlength="100" placeholder="Possible answer" required></label>`).join('')}</div><label>Correct answer<select name="correct">${['A', 'B', 'C', 'D'].map((l, i) => `<option value="${i}">${l}</option>`).join('')}</select></label><label>The story after the reveal (optional)<textarea name="note" maxlength="500" placeholder="Tell everyone the story behind this picture…"></textarea></label><div class="picture-editor-actions"><button class="button primary" type="submit" id="save-picture">Add this round ${icon('check')}</button><button class="text-button" type="button" id="cancel-picture-edit" hidden>Cancel edit</button></div></form><div id="picture-rounds"></div><p class="quiet-note">Up to 12 rounds. Saved in this browser. Pictures are shared with the game server only when you create a room; server copies expire after 24 hours. Portrait and landscape pictures are both supported.</p><button class="button subtle full-width" id="picture-back">Back to game setup ${icon('arrow')}</button>`, true);
  const $ = selector => m.el.querySelector(selector);
  const form = $('#picture-form');
  const reset = () => { form.reset(); draftImage = ''; editing = -1; $('#save-picture').innerHTML = `Add this round ${icon('check')}`; $('#cancel-picture-edit').hidden = true; showPreview(); };
  const showPreview = () => { $('#picture-preview').innerHTML = draftImage ? `<img src="${draftImage}" alt="Your selected puzzle picture">` : '<span>✦</span><p>Your picture will hide behind the mosaic.</p>'; };
  const commit = async next => { await savePictures(next); pictures = next; change(next); showRounds(); };
  const showRounds = () => {
    $('#picture-rounds').innerHTML = `<h3>${pictures.length} picture round${pictures.length === 1 ? '' : 's'}</h3>${pictures.map((q, i) => `<div class="picture-saved-round"><img src="${q.image}" alt="Round ${i + 1} thumbnail"><div><strong>${i + 1}. ${esc(q.prompt)}</strong><small>Answer ${'ABCD'[q.correct]} · ${esc(q.options[q.correct])}</small></div><button class="text-button" data-picture-edit="${i}">Edit</button><button class="icon-button" data-picture-remove="${i}" aria-label="Remove picture round ${i + 1}">${icon('close')}</button></div>`).join('')}`;
    m.el.querySelectorAll('[data-picture-edit]').forEach(b => b.onclick = () => {
      editing = Number(b.dataset.pictureEdit); const q = pictures[editing]; draftImage = q.image;
      form.elements.prompt.value = q.prompt; form.elements.correct.value = String(q.correct); form.elements.note.value = q.note;
      q.options.forEach((o, i) => { form.elements[`option${i}`].value = o; });
      $('#picture-file').value = ''; showPreview(); $('#save-picture').innerHTML = `Save changes ${icon('check')}`; $('#cancel-picture-edit').hidden = false;
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    m.el.querySelectorAll('[data-picture-remove]').forEach(b => b.onclick = async () => {
      try { await commit(pictures.filter((_, i) => i !== Number(b.dataset.pictureRemove))); reset(); }
      catch (e) { toast(e.message); }
    });
  };
  $('#picture-file').onchange = async e => {
    if (!e.target.files[0]) return; processing = true; $('#save-picture').disabled = true;
    try { draftImage = await preparePicture(e.target.files[0]); showPreview(); }
    catch (error) { toast(error.message); e.target.value = ''; }
    finally { processing = false; $('#save-picture').disabled = false; }
  };
  form.onsubmit = async e => {
    e.preventDefault(); if (processing) return;
    if (!draftImage) return toast('Choose a picture for this round first.');
    if (editing < 0 && pictures.length >= maxPictures) return toast('You can save up to 12 picture rounds.');
    const data = new FormData(form);
    const q = { image: draftImage, prompt: String(data.get('prompt')).trim(), options: [0, 1, 2, 3].map(i => String(data.get(`option${i}`)).trim()), correct: Number(data.get('correct')), note: String(data.get('note')).trim() };
    if (!validPictureRound(q)) return toast('Use four different answers, and choose the correct one.');
    const next = [...pictures]; if (editing < 0) next.push(q); else next[editing] = q;
    $('#save-picture').disabled = true;
    try { await commit(next); reset(); toast('Picture round saved in this browser.'); }
    catch (error) { toast(error.message); }
    finally { $('#save-picture').disabled = false; }
  };
  $('#cancel-picture-edit').onclick = reset;
  $('#picture-back').onclick = () => { m.close(); back(); };
  showRounds();
}
