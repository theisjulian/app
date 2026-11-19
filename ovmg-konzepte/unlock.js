'use strict';
/* Geschützte Vorschau · Anmeldung
   Art 0 = Vorschau-Passwort, 1 = QR, 2/3 = Schüler, 4 = Admin (Benutzername + Passwort) */
const ADM = !!window.OVMG_ADMIN, STU = window.OVMG_MODE === 'schueler', MODE = window.OVMG_MODE || '';
const T_PW = ADM ? 4 : STU ? 2 : 0, T_QR = ADM ? -1 : STU ? 3 : 1, DBN = ADM ? 'ovmg-adminpage' : STU ? 'ovmg-mitreden' : 'ovmg-preview';
const BASE = window.OVMG_BASE || './', FLAG = 'ovmg-auto-' + DBN;
const $ = s => document.querySelector(s);
const user = $('#user'), form = $('form'), password = $('#password'), keep = $('#keep'), status = $('#status'), button = form.querySelector('button[type=submit]'),
  gate = $('#gate'), card = $('.card'), viewer = $('#viewer'), frame = $('#viewer iframe'), load = $('#load'), bar = $('#load-bar'), ltext = $('#load-t'), lsub = $('#load-s');
let objectURL = null, busy = false;
const T = STU ? { open: 'Wird geöffnet', back: 'Schön, dass du wieder da bist.', check: 'Passwort wird geprüft …', wrong: 'Das Passwort stimmt nicht. Probier es noch einmal.', qr: 'QR-Code wird geprüft …', qrBad: 'Dieser QR-Code gilt nicht mehr. Nimm das Passwort.' }
  : ADM ? { open: 'Admin-Bereich wird geöffnet', back: 'Willkommen zurück.', check: 'Anmeldung wird geprüft …', wrong: 'Benutzername oder Passwort ist nicht richtig.' }
  : { open: 'Die Vorschau wird geöffnet', back: 'Willkommen zurück.', check: 'Passwort wird geprüft …', wrong: 'Das Passwort ist nicht richtig. Bitte noch einmal versuchen.', qr: 'QR-Zugang wird geprüft …', qrBad: 'Dieser QR-Code ist nicht mehr gültig. Bitte das Passwort verwenden.' };
const setFlag = on => { try { on ? localStorage.setItem(FLAG, '1') : localStorage.removeItem(FLAG) } catch (e) { } };
const supported = () => !!(window.crypto && crypto.subtle && window.DecompressionStream);

/* „Angemeldet bleiben“: gespeichert wird nur der abgeleitete, nicht auslesbare Schlüssel (IndexedDB), nie das Passwort. */
const idb = (mode, fn) => new Promise((res, rej) => { try { const r = indexedDB.open(DBN, 1); r.onupgradeneeded = () => r.result.createObjectStore('k'); r.onerror = () => rej(r.error); r.onsuccess = () => { const t = r.result.transaction('k', mode), q = fn(t.objectStore('k')); t.oncomplete = () => { r.result.close(); res(q && q.result) }; t.onerror = () => rej(t.error) } } catch (e) { rej(e) } });
const keySave = k => idb('readwrite', s => s.put(k, 'key')).catch(() => { });
const keyLoad = () => idb('readonly', s => s.get('key')).catch(() => null);
const keyDrop = () => idb('readwrite', s => s.delete('key')).catch(() => { });

/* ---------- Laden: Version, Zwischenspeicher, Fortschritt ---------- */
let VER = null, MAIN = null, ADMP = null, got = 0, total = 0;
const verLoad = () => VER || (VER = fetch(BASE + 'version.json?t=' + Date.now(), { cache: 'no-store' }).then(r => { if (!r.ok) throw 0; return r.json() }).catch(() => { VER = null; throw new Error('network') }));
const openCache = async () => { try { return await caches.open('ovmg-dl') } catch (e) { return null } };
function tick(n) { got += n; progress() }
function progress() {
  if (!total) return; const p = Math.min(1, got / total);
  bar.style.transform = `scaleX(${(.04 + p * .86).toFixed(3)})`;
  if (load.dataset.phase === 'dl') { ltext.textContent = T.open + ' … ' + Math.round(p * 100) + ' %'; lsub.textContent = p < 1 ? Math.round(got / 1e6) + ' von ' + Math.round(total / 1e6) + ' MB' + (got < total * .98 && !load.dataset.cached ? ' · beim nächsten Mal geht es schneller' : '') : '' }
}
async function part(name, v) {
  const url = new URL(BASE + name + '?v=' + v, location.href).href, cache = await openCache();
  if (cache) { const hit = await cache.match(url).catch(() => null); if (hit) { const b = new Uint8Array(await hit.arrayBuffer()); tick(b.length); return b } }
  const r = await fetch(url, { cache: 'no-cache' }); if (!r.ok) throw new Error('network');
  let b;
  if (r.body && r.body.getReader) {
    const rd = r.body.getReader(), chunks = []; let n = 0;
    for (; ;) { const { done, value } = await rd.read(); if (done) break; chunks.push(value); n += value.length; tick(value.length) }
    b = new Uint8Array(n); let o = 0; for (const c of chunks) { b.set(c, o); o += c.length }
  } else { b = new Uint8Array(await r.arrayBuffer()); tick(b.length) }
  if (cache) cache.put(url, new Response(b, { headers: { 'content-type': 'application/octet-stream' } })).catch(() => { });
  return b;
}
const names = (pre, sizes) => sizes.map((_, i) => pre + '-' + String(i + 1).padStart(2, '0') + '.bin');
function startMain() {
  if (MAIN) return MAIN;
  MAIN = verLoad().then(V => { total += V.p.reduce((a, b) => a + b, 0); progress(); return { V, ps: names('preview', V.p).map(n => part(n, V.v)) } });
  MAIN.catch(() => { MAIN = null; VER = null; got = 0; total = 0 });
  if (ADM) startAdmin();
  return MAIN;
}
function startAdmin() {
  if (ADMP) return ADMP;
  ADMP = verLoad().then(V => { total += V.a.reduce((a, b) => a + b, 0); progress(); return Promise.all(names('admin', V.a).map(n => part(n, V.v))) });
  ADMP.catch(() => { ADMP = null });
  return ADMP;
}
async function isCached() { try { const V = await verLoad(), c = await openCache(); return !!(c && await c.match(new URL(BASE + 'preview-01.bin?v=' + V.v, location.href).href)) } catch (e) { return false } }
async function tidyCache() { try { const V = await verLoad(), c = await openCache(); if (!c) return; for (const r of await c.keys()) if (!r.url.endsWith('?v=' + V.v)) c.delete(r) } catch (e) { } }
const concat = arr => { const out = new Uint8Array(arr.reduce((n, b) => n + b.length, 0)); let o = 0; for (const b of arr) { out.set(b, o); o += b.length } return out };

/* Aufbau: Kennung · Anzahl Schlüssel · je Schlüssel (Art, Salz, IV, verpackter Inhaltsschlüssel) · IV · Inhalt */
function slots(bytes) {
  if (new TextDecoder().decode(bytes.slice(0, 8)) !== 'OVMG002!') throw new Error('format');
  const n = bytes[8], out = []; let p = 9;
  for (let i = 0; i < n; i++) { out.push({ type: bytes[p], salt: bytes.slice(p + 1, p + 17), iv: bytes.slice(p + 17, p + 29), wrapped: bytes.slice(p + 29, p + 77) }); p += 77; }
  return { list: out, iv: bytes.slice(p, p + 12), off: p + 12 };
}
async function openKey(secret, head, type) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveKey']);
  for (const s of slots(head).list.filter(x => x.type === type)) {
    const kek = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: s.salt, iterations: 600000, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    try { const raw = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: s.iv }, kek, s.wrapped); return await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['decrypt']); } catch (e) { /* nächster Schlüssel */ }
  }
  throw new Error('password');
}

/* ---------- Anzeige: Ladekarte, Fehler, Übergang ---------- */
function phase(p, text) { load.dataset.phase = p; if (text) { ltext.textContent = text; lsub.textContent = '' } if (p !== 'dl') bar.style.transform = 'scaleX(1)'; }
function busyOn(text) { busy = true; document.documentElement.classList.add('is-loading'); load.hidden = false; form.setAttribute('aria-hidden', 'true'); phase('dl', text || T.open + ' …'); progress(); }
function busyOff() { busy = false; document.documentElement.classList.remove('is-loading', 'auto'); load.hidden = true; form.removeAttribute('aria-hidden'); }
function fail(msg) {
  busyOff(); status.textContent = msg; card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
  setTimeout(() => (ADM && !user.value ? user : password).focus(), 30);
}
const errText = err => err.message === 'password' ? T.wrong : err.message === 'browser' ? 'Bitte die Seite in einem aktuellen Safari, Chrome, Firefox oder Edge öffnen.' : 'Die Vorschau konnte nicht geladen werden. Bitte Verbindung prüfen und noch einmal versuchen.';
function waitMsg(type, ms) { return new Promise(res => { const t = setTimeout(res, ms); addEventListener('message', function h(e) { if (e.source === frame.contentWindow && e.data && (e.data.type === type || e.data.type === 'ovmg-logout')) { clearTimeout(t); removeEventListener('message', h); res() } }) }) }
const frames2 = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

async function show(key, cred) {
  const { ps } = await startMain();
  const bytes = concat(await Promise.all(ps)); const S = slots(bytes);
  phase('open', 'Wird entschlüsselt …');
  let plain; try { plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: S.iv }, key, bytes.subarray(S.off)) } catch { throw new Error('password') }
  const html = await new Response(new Blob([plain]).stream().pipeThrough(new DecompressionStream('gzip'))).blob();
  let adm = null;
  if (ADM) {
    const a = concat(await startAdmin());
    if (new TextDecoder().decode(a.slice(0, 8)) !== 'OVMA001!') throw new Error('format');
    adm = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: a.slice(8, 20) }, key, a.subarray(20));
  }
  phase('open', 'Fast fertig …');
  if (objectURL) URL.revokeObjectURL(objectURL);
  objectURL = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  const loaded = new Promise(r => frame.addEventListener('load', r, { once: true }));
  viewer.hidden = false; frame.src = objectURL;
  await loaded;
  let ready = frames2();
  if (MODE) { ready = waitMsg('ovmg-ready', 4000); frame.contentWindow.postMessage({ type: 'ovmg-mode', mode: MODE }, '*'); }
  if (ADM) { phase('open', 'Admin-Daten werden geöffnet …'); ready = waitMsg('ovmg-ready', 30000); frame.contentWindow.postMessage(cred ? { type: 'ovmg-admin-cred', cred, keep: keep.checked, adm } : { type: 'ovmg-admin', adm }, '*', [adm]); }
  await ready;
  if (viewer.hidden) return false; /* inzwischen abgemeldet */
  gate.classList.add('is-out'); await new Promise(r => setTimeout(r, 260));
  gate.hidden = true; gate.classList.remove('is-out'); busyOff(); status.textContent = '';
  try { frame.focus() } catch (e) { }
  tidyCache(); goZiel(); return true;
}

/* ---------- Anmelden ---------- */
form.addEventListener('submit', async e => {
  e.preventDefault(); if (busy) return;
  if (ADM && !user.value.trim()) { user.focus(); return }
  if (!password.value) { password.focus(); return }
  let secret = ADM ? user.value.trim().toLowerCase() + '\n' + password.value : password.value;
  status.textContent = ''; busyOn();
  try {
    if (!supported()) throw new Error('browser');
    const { ps } = await startMain();
    const head = await ps[0];
    phase('check', T.check);
    const key = await openKey(secret, head, T_PW);
    password.value = ''; phase('dl', T.open + ' …'); progress();
    const ok = await show(key, ADM ? secret : null);
    if (!ok) return;
    if (keep.checked) { await keySave(key); setFlag(true) } else { await keyDrop(); setFlag(false) }
  } catch (err) { if (err.message === 'password') { password.select && password.select() } fail(errText(err)); viewer.hidden = true; }
  finally { secret = '' }
});

async function lock(msg) {
  await keyDrop(); setFlag(false); frame.src = 'about:blank'; if (objectURL) URL.revokeObjectURL(objectURL); objectURL = null;
  viewer.hidden = true; gate.hidden = false; busyOff(); status.textContent = msg || ''; password.value = '';
  (ADM && !user.value ? user : password).focus();
}
$('#lock').addEventListener('click', () => lock());

/* Passwort anzeigen */
const eye = $('#eye');
if (eye) eye.addEventListener('click', () => { const on = password.type === 'password'; password.type = on ? 'text' : 'password'; eye.setAttribute('aria-pressed', String(on)); eye.setAttribute('aria-label', on ? 'Passwort verbergen' : 'Passwort anzeigen'); password.focus(); });
/* Vorladen, sobald jemand das Formular benutzt */
form.addEventListener('focusin', () => { if (supported()) startMain().catch(() => { }) }, { once: true });

/* Admin: Druckvorlagen in einem eigenen Tab öffnen – aus dem geschützten Rahmen heraus geht das nicht */
addEventListener('message', e => {
  if (!ADM || e.source !== frame.contentWindow || !e.data || e.data.type !== 'ovmg-print' || typeof e.data.html !== 'string') return;
  const url = URL.createObjectURL(new Blob([e.data.html], { type: 'text/html' })); const w = window.open(url, '_blank');
  if (!w) { const a = document.createElement('a'); a.href = url; a.download = e.data.name || 'Druckvorlage.html'; document.body.append(a); a.click(); a.remove(); }
  setTimeout(() => URL.revokeObjectURL(url), 300000);
});
/* Admin: „Abmelden“ im Admin-Bereich meldet hier ab */
addEventListener('message', e => { if (ADM && e.source === frame.contentWindow && e.data && e.data.type === 'ovmg-logout') lock(e.data.fail ? 'Bitte erneut anmelden.' : ''); });

/* QR-Zugang: Schlüssel steht hinter „#zugang=“ (wird nie an den Server geschickt) und wird sofort aus der Adresse entfernt */
let ZIEL = null;
const qrToken = ADM ? null : (() => { const m = location.hash.match(/^#(?:zugang=([A-Za-z0-9_-]{16,}))?(?:&?ziel=([a-z0-9-]{1,40}))?$/); if (!m || (!m[1] && !m[2])) return null; ZIEL = m[2] || null; history.replaceState(null, '', location.pathname + location.search); return m[1] || null; })();
const goZiel = () => { if (ZIEL) { try { frame.contentWindow.postMessage({ type: 'ovmg-goto-sec', id: ZIEL }, '*') } catch (e) { } ZIEL = null } };

/* Beim Öffnen: QR-Zugang oder gemerkte Anmeldung direkt öffnen – ohne Formular dazwischen */
(async () => {
  if (!supported()) { busyOff(); return }
  if (qrToken) {
    busyOn(T.qr);
    try {
      const { ps } = await startMain(); const key = await openKey(qrToken, await ps[0], T_QR);
      phase('dl', T.open + ' …'); progress(); if (await show(key, null)) { await keySave(key); setFlag(true) } return;
    } catch (e) { fail(e.message === 'password' ? T.qrBad : errText(e)); viewer.hidden = true; return }
  }
  const key = await keyLoad();
  if (!key) { busyOff(); setFlag(false); if (await isCached()) startMain().catch(() => { }); return }
  if (await isCached()) load.dataset.cached = '1';
  busyOn(T.back + ' ' + T.open + ' …'); keep.checked = true;
  try { if (await show(key, null)) setFlag(true) } catch (e) { await keyDrop(); setFlag(false); viewer.hidden = true; busyOff(); status.textContent = e.message === 'network' ? errText(e) : ''; }
})();

/* Am Handy: Ist ein Entwurf geöffnet, entfällt diese Leiste – der Entwurf hat seine eigene mit „Zur Übersicht“. */
frame.addEventListener('load', () => {
  try {
    const body = frame.contentDocument && frame.contentDocument.body; if (!body) return;
    const sync = () => viewer.classList.toggle('is-concept', body.classList.contains('is-viewing'));
    new MutationObserver(sync).observe(body, { attributes: true, attributeFilter: ['class'] }); sync();
  } catch (e) { /* andere Herkunft: Leiste bleibt */ }
});

/* Web-App vom Home-Bildschirm: angemeldet bleiben, Leiste weglassen, Abstände für Notch und Home-Indikator weitergeben */
const isApp = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true || /[?&]app=1\b/.test(location.search);
if (isApp) { document.documentElement.classList.add('is-app'); keep.checked = true; }
const passInsets = () => { try { const cs = getComputedStyle($('#sa')), r = frame.contentDocument && frame.contentDocument.documentElement; if (r) { r.style.setProperty('--sat', cs.paddingTop); r.style.setProperty('--sab', cs.paddingBottom); } } catch (e) { } };
frame.addEventListener('load', passInsets); addEventListener('resize', passInsets);
