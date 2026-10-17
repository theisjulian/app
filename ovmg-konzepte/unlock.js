'use strict';
const form = document.querySelector('form'), password = document.querySelector('#password'), keep = document.querySelector('#keep'),
  status = document.querySelector('#status'), button = form.querySelector('button'), gate = document.querySelector('#gate'),
  viewer = document.querySelector('#viewer'), frame = document.querySelector('iframe');
let objectURL = null;
/* „Angemeldet bleiben“: gespeichert wird nur der abgeleitete, nicht auslesbare Schlüssel (IndexedDB), nie das Passwort. */
const idb = (mode, fn) => new Promise((res, rej) => { try { const r = indexedDB.open('ovmg-preview', 1); r.onupgradeneeded = () => r.result.createObjectStore('k'); r.onerror = () => rej(r.error); r.onsuccess = () => { const t = r.result.transaction('k', mode), q = fn(t.objectStore('k')); t.oncomplete = () => { r.result.close(); res(q && q.result) }; t.onerror = () => rej(t.error) } } catch (e) { rej(e) } });
const keySave = k => idb('readwrite', s => s.put(k, 'key')).catch(() => {});
const keyLoad = () => idb('readonly', s => s.get('key')).catch(() => null);
const keyDrop = () => idb('readwrite', s => s.delete('key')).catch(() => {});
async function load() {
  const chunks = await Promise.all([1, 2, 3, 4, 5].map(async n => { const r = await fetch('./preview-' + String(n).padStart(2, '0') + '.bin', { cache: 'no-store' }); if (!r.ok) throw new Error('network'); return new Uint8Array(await r.arrayBuffer()) }));
  const bytes = new Uint8Array(chunks.reduce((n, b) => n + b.length, 0)); let offset = 0;
  for (const part of chunks) { bytes.set(part, offset); offset += part.length }
  if (new TextDecoder().decode(bytes.slice(0, 8)) !== 'OVMG001!') throw new Error('format');
  return bytes;
}
async function deriveKey(secret, bytes) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: bytes.slice(8, 24), iterations: 600000, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
}
async function show(bytes, key) {
  let plain; try { plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(24, 36) }, key, bytes.slice(36)) } catch { throw new Error('password') }
  const stream = new Blob([plain]).stream().pipeThrough(new DecompressionStream('gzip'));
  const html = await new Response(stream).blob();
  objectURL = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  frame.src = objectURL; gate.hidden = true; viewer.hidden = false; document.querySelector('#lock').focus(); status.textContent = '';
}
form.addEventListener('submit', async e => {
  e.preventDefault(); button.disabled = true; status.textContent = 'Die Vorschau wird geöffnet …'; let secret = password.value; password.value = '';
  try {
    if (!crypto.subtle || !window.DecompressionStream) throw new Error('browser');
    const bytes = await load(), key = await deriveKey(secret, bytes); secret = '';
    await show(bytes, key);
    if (keep.checked) await keySave(key); else await keyDrop();
  } catch (err) {
    status.textContent = err.message === 'password' ? 'Das Passwort ist nicht richtig. Bitte erneut versuchen.' : err.message === 'browser' ? 'Bitte die Seite über HTTPS in einem aktuellen Safari, Chrome, Firefox oder Edge öffnen.' : 'Die Vorschau konnte nicht geladen werden. Bitte Verbindung prüfen und erneut versuchen.'; password.focus();
  } finally { secret = ''; button.disabled = false }
});
document.querySelector('#lock').addEventListener('click', async () => {
  await keyDrop(); frame.src = 'about:blank'; if (objectURL) URL.revokeObjectURL(objectURL); objectURL = null; viewer.hidden = true; gate.hidden = false; password.focus();
});
/* gemerkte Anmeldung beim Öffnen der Seite */
(async () => {
  try {
    if (!crypto.subtle || !window.DecompressionStream) return;
    const key = await keyLoad(); if (!key) return;
    status.textContent = 'Gemerkte Anmeldung wird geprüft …'; button.disabled = true;
    const bytes = await load(); await show(bytes, key); keep.checked = true;
  } catch (e) { await keyDrop(); status.textContent = ''; } finally { button.disabled = false }
})();
