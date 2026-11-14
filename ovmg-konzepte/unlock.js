'use strict';
const T_PW = window.OVMG_MODE === 'schueler' ? 2 : 0, T_QR = window.OVMG_MODE === 'schueler' ? 3 : 1, DBN = window.OVMG_MODE === 'schueler' ? 'ovmg-mitreden' : 'ovmg-preview';
const form = document.querySelector('form'), password = document.querySelector('#password'), keep = document.querySelector('#keep'),
  status = document.querySelector('#status'), button = form.querySelector('button'), gate = document.querySelector('#gate'),
  viewer = document.querySelector('#viewer'), frame = document.querySelector('iframe');
let objectURL = null;
/* „Angemeldet bleiben“: gespeichert wird nur der abgeleitete, nicht auslesbare Schlüssel (IndexedDB), nie das Passwort. */
const idb = (mode, fn) => new Promise((res, rej) => { try { const r = indexedDB.open(DBN, 1); r.onupgradeneeded = () => r.result.createObjectStore('k'); r.onerror = () => rej(r.error); r.onsuccess = () => { const t = r.result.transaction('k', mode), q = fn(t.objectStore('k')); t.oncomplete = () => { r.result.close(); res(q && q.result) }; t.onerror = () => rej(t.error) } } catch (e) { rej(e) } });
const keySave = k => idb('readwrite', s => s.put(k, 'key')).catch(() => {});
const keyLoad = () => idb('readonly', s => s.get('key')).catch(() => null);
const keyDrop = () => idb('readwrite', s => s.delete('key')).catch(() => {});
async function load() {
  const chunks = await Promise.all([1, 2, 3, 4, 5].map(async n => { const r = await fetch((window.OVMG_BASE || './') + 'preview-' + String(n).padStart(2, '0') + '.bin', { cache: 'no-store' }); if (!r.ok) throw new Error('network'); return new Uint8Array(await r.arrayBuffer()) }));
  const bytes = new Uint8Array(chunks.reduce((n, b) => n + b.length, 0)); let offset = 0;
  for (const part of chunks) { bytes.set(part, offset); offset += part.length }
  if (new TextDecoder().decode(bytes.slice(0, 8)) !== 'OVMG002!') throw new Error('format');
  return bytes;
}
/* Aufbau: Kennung · Anzahl Schlüssel · je Schlüssel (Art, Salz, IV, verpackter Inhaltsschlüssel) · IV · Inhalt.
   Art 0 = Passwort, Art 1 = QR-Zugang. Beide öffnen denselben Inhaltsschlüssel; der QR-Zugang lässt sich einzeln austauschen. */
function slots(bytes) {
  const n = bytes[8], out = []; let p = 9;
  for (let i = 0; i < n; i++) { out.push({ type: bytes[p], salt: bytes.slice(p + 1, p + 17), iv: bytes.slice(p + 17, p + 29), wrapped: bytes.slice(p + 29, p + 77) }); p += 77; }
  return { list: out, iv: bytes.slice(p, p + 12), body: bytes.slice(p + 12) };
}
async function openKey(secret, bytes, type) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveKey']);
  for (const s of slots(bytes).list.filter(x => x.type === type)) {
    const kek = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: s.salt, iterations: 600000, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    try { const raw = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: s.iv }, kek, s.wrapped); return await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['decrypt']); } catch (e) { /* nächster Schlüssel */ }
  }
  throw new Error('password');
}
async function show(bytes, key) {
  const S = slots(bytes);
  let plain; try { plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: S.iv }, key, S.body) } catch { throw new Error('password') }
  const stream = new Blob([plain]).stream().pipeThrough(new DecompressionStream('gzip'));
  const html = await new Response(stream).blob();
  objectURL = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  if (window.OVMG_MODE) frame.addEventListener('load', () => { try { frame.contentWindow.postMessage({ type: 'ovmg-mode', mode: window.OVMG_MODE }, '*'); } catch (e) { } }, { once: true });
  if (window.OVMG_ADMIN) frame.addEventListener('load', () => { try { frame.contentWindow.postMessage({ type: 'ovmg-admin' }, '*'); } catch (e) { } }, { once: true });
  frame.src = objectURL; gate.hidden = true; viewer.hidden = false; document.querySelector('#lock').focus(); status.textContent = '';
}
form.addEventListener('submit', async e => {
  e.preventDefault(); button.disabled = true; status.textContent = 'Die Vorschau wird geöffnet …'; let secret = password.value; password.value = '';
  try {
    if (!crypto.subtle || !window.DecompressionStream) throw new Error('browser');
    const bytes = await load(), key = await openKey(secret, bytes, T_PW); secret = '';
    await show(bytes, key);
    if (keep.checked) await keySave(key); else await keyDrop();
  } catch (err) {
    status.textContent = err.message === 'password' ? (window.OVMG_MODE === 'schueler' ? 'Das Passwort stimmt nicht. Probier es noch einmal.' : 'Das Passwort ist nicht richtig. Bitte erneut versuchen.') : err.message === 'browser' ? 'Bitte die Seite über HTTPS in einem aktuellen Safari, Chrome, Firefox oder Edge öffnen.' : 'Die Vorschau konnte nicht geladen werden. Bitte Verbindung prüfen und erneut versuchen.'; password.focus();
  } finally { secret = ''; button.disabled = false }
});
document.querySelector('#lock').addEventListener('click', async () => {
  await keyDrop(); frame.src = 'about:blank'; if (objectURL) URL.revokeObjectURL(objectURL); objectURL = null; viewer.hidden = true; gate.hidden = false; password.focus();
});
/* QR-Zugang: Schlüssel steht hinter „#zugang=“ (wird nie an den Server geschickt) und wird sofort aus der Adresse entfernt */
const qrToken = (() => { const m = location.hash.match(/^#zugang=([A-Za-z0-9_-]{16,})$/); if (m) history.replaceState(null, '', location.pathname + location.search); return m ? m[1] : null; })();
/* gemerkte Anmeldung beim Öffnen der Seite */
(async () => {
  if (qrToken) {
    try {
      if (!crypto.subtle || !window.DecompressionStream) throw new Error('browser');
      status.textContent = 'QR-Zugang wird geprüft …'; button.disabled = true;
      const bytes = await load(), key = await openKey(qrToken, bytes, T_QR);
      await show(bytes, key); await keySave(key); return;
    } catch (e) { status.textContent = e.message === 'password' ? (window.OVMG_MODE === 'schueler' ? 'Dieser QR-Code ist nicht mehr gültig. Nimm das Passwort.' : 'Dieser QR-Code ist nicht mehr gültig. Bitte das Passwort verwenden.') : 'Die Vorschau konnte nicht geladen werden.'; }
    finally { button.disabled = false }
  }
  try {
    if (!crypto.subtle || !window.DecompressionStream) return;
    const key = await keyLoad(); if (!key) return;
    status.textContent = 'Gemerkte Anmeldung wird geprüft …'; button.disabled = true;
    const bytes = await load(); await show(bytes, key); keep.checked = true;
  } catch (e) { await keyDrop(); status.textContent = ''; } finally { button.disabled = false }
})();

/* Am Handy: Ist ein Entwurf geöffnet, entfällt diese Leiste – der Entwurf hat seine eigene mit „Zur Übersicht“. */
frame.addEventListener('load', () => {
  try {
    const body = frame.contentDocument && frame.contentDocument.body; if (!body) return;
    const sync = () => viewer.classList.toggle('is-concept', body.classList.contains('is-viewing'));
    new MutationObserver(sync).observe(body, { attributes: true, attributeFilter: ['class'] }); sync();
  } catch (e) { /* andere Herkunft: Leiste bleibt */ }
});

/* Web-App vom Home-Bildschirm: angemeldet bleiben, Leiste weglassen, Abstände für Notch und Home-Indikator an die Vorschau weitergeben */
const isApp = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true || /[?&]app=1\b/.test(location.search);
if (isApp) { document.documentElement.classList.add('is-app'); keep.checked = true; }
const passInsets = () => { try { const cs = getComputedStyle(document.querySelector('#sa')), r = frame.contentDocument && frame.contentDocument.documentElement; if (r) { r.style.setProperty('--sat', cs.paddingTop); r.style.setProperty('--sab', cs.paddingBottom); } } catch (e) { } };
frame.addEventListener('load', passInsets); addEventListener('resize', passInsets);
