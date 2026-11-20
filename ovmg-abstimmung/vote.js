'use strict';
/* Oskar stimmt ab · Abstimmungsseite
   Ablauf: Code prüfen (Supabase vote_check) → nur bei gültigem, unbenutztem Code in einem offenen Durchgang kommt
   der Schlüssel für die Entwürfe zurück → Entwürfe entschlüsseln → Rundgang und Rangliste → Stimme (vote_cast).
   Der Code verlässt das Gerät nur für die Prüfung und die Stimmabgabe. Keine Cookies, nichts wird gespeichert. */
const SB = 'https://ocaepkslxqjnyknslicc.supabase.co', SBK = 'sb_publishable_Vq4ojxY2PVXcLHSTpOMD6g_43ZgqpZA', BASE = '../ovmg-konzepte/', T_AB = 5;
const $ = s => document.querySelector(s);
const form = $('form'), input = $('#password'), status = $('#status'), gate = $('#gate'), card = $('.card'), viewer = $('#viewer'), frame = $('#viewer iframe'),
  load = $('#load'), bar = $('#load-bar'), ltext = $('#load-t'), lsub = $('#load-s');
let busy = false, AB = null, CODE = '', objectURL = null;
const norm = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const fmt = c => c.length === 8 ? c.slice(0, 4) + '-' + c.slice(4) : c;
const supported = () => !!(window.crypto && crypto.subtle && window.DecompressionStream);

async function rpc(fn, body) {
  const r = await fetch(SB + '/rest/v1/rpc/' + fn, { method: 'POST', headers: { apikey: SBK, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) { const t = await r.text().catch(() => ''); const e = new Error(r.status >= 500 || r.status === 0 ? 'network' : 'server'); e.detail = t; throw e }
  return r.json();
}

/* ---------- Laden der verschlüsselten Entwürfe (gleiche Dateien wie die Vorschau) ---------- */
let VER = null, MAIN = null, got = 0, total = 0;
const verLoad = () => VER || (VER = fetch(BASE + 'version.json?t=' + Date.now(), { cache: 'no-store' }).then(r => { if (!r.ok) throw 0; return r.json() }).catch(() => { VER = null; throw new Error('network') }));
const openCache = async () => { try { return await caches.open('ovmg-dl') } catch (e) { return null } };
function progress() { if (!total) return; const p = Math.min(1, got / total); bar.style.transform = `scaleX(${(.04 + p * .86).toFixed(3)})`; if (load.dataset.phase === 'dl') { ltext.textContent = 'Die Entwürfe werden geladen … ' + Math.round(p * 100) + ' %'; lsub.textContent = p < 1 ? Math.round(got / 1e6) + ' von ' + Math.round(total / 1e6) + ' MB' : '' } }
async function part(name, v) {
  const url = new URL(BASE + name + '?v=' + v, location.href).href, cache = await openCache();
  if (cache) { const hit = await cache.match(url).catch(() => null); if (hit) { const b = new Uint8Array(await hit.arrayBuffer()); got += b.length; progress(); return b } }
  const r = await fetch(url, { cache: 'no-cache' }); if (!r.ok) throw new Error('network');
  let b;
  if (r.body && r.body.getReader) { const rd = r.body.getReader(), ch = []; let n = 0; for (; ;) { const { done, value } = await rd.read(); if (done) break; ch.push(value); n += value.length; got += value.length; progress() } b = new Uint8Array(n); let o = 0; for (const c of ch) { b.set(c, o); o += c.length } }
  else { b = new Uint8Array(await r.arrayBuffer()); got += b.length; progress() }
  if (cache) cache.put(url, new Response(b, { headers: { 'content-type': 'application/octet-stream' } })).catch(() => { });
  return b;
}
function startMain() {
  if (MAIN) return MAIN;
  MAIN = verLoad().then(V => { total += V.p.reduce((a, b) => a + b, 0); progress(); return { V, ps: V.p.map((_, i) => part('preview-' + String(i + 1).padStart(2, '0') + '.bin', V.v)) } });
  MAIN.catch(() => { MAIN = null; VER = null; got = 0; total = 0 });
  return MAIN;
}
const concat = a => { const o = new Uint8Array(a.reduce((n, b) => n + b.length, 0)); let p = 0; for (const b of a) { o.set(b, p); p += b.length } return o };
function slots(bytes) {
  if (new TextDecoder().decode(bytes.slice(0, 8)) !== 'OVMG002!') throw new Error('format');
  const n = bytes[8], out = []; let p = 9;
  for (let i = 0; i < n; i++) { out.push({ type: bytes[p], salt: bytes.slice(p + 1, p + 17), iv: bytes.slice(p + 17, p + 29), wrapped: bytes.slice(p + 29, p + 77) }); p += 77 }
  return { list: out, iv: bytes.slice(p, p + 12), off: p + 12 };
}
async function openKey(secret, head) {
  const m = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveKey']);
  for (const s of slots(head).list.filter(x => x.type === T_AB)) {
    const kek = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: s.salt, iterations: 600000, hash: 'SHA-256' }, m, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    try { const raw = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: s.iv }, kek, s.wrapped); return await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['decrypt']) } catch (e) { }
  }
  throw new Error('format');
}

/* ---------- Anzeige ---------- */
function phase(p, text) { load.dataset.phase = p; if (text) { ltext.textContent = text; lsub.textContent = '' } if (p !== 'dl') bar.style.transform = 'scaleX(1)' }
function busyOn(text) { busy = true; document.documentElement.classList.add('is-loading'); load.hidden = false; form.setAttribute('aria-hidden', 'true'); phase('check', text) }
function busyOff() { busy = false; document.documentElement.classList.remove('is-loading', 'auto'); load.hidden = true; form.removeAttribute('aria-hidden') }
function fail(msg) { busyOff(); status.textContent = msg; card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); setTimeout(() => { input.focus(); input.select && input.select() }, 30) }
const MSG = {
  invalid: 'Dieser Code gilt nicht. Vielleicht ist er schon verwendet, falsch abgetippt – oder die Abstimmung ist gerade nicht geöffnet.',
  short: 'Der Code hat acht Zeichen, zum Beispiel K7TM-4QXR.',
  network: 'Keine Verbindung. Bitte Internet prüfen und noch einmal versuchen.',
  browser: 'Bitte die Seite in einem aktuellen Safari, Chrome, Firefox oder Edge öffnen.',
  format: 'Die Entwürfe konnten nicht geöffnet werden. Bitte später noch einmal versuchen.'
};
const waitMsg = (type, ms) => new Promise(res => { const t = setTimeout(res, ms); addEventListener('message', function h(e) { if (e.source === frame.contentWindow && e.data && e.data.type === type) { clearTimeout(t); removeEventListener('message', h); res() } }) });

async function open(code) {
  if (busy) return; CODE = norm(code);
  if (CODE.length < 8) { fail(MSG.short); return }
  if (!supported()) { fail(MSG.browser); return }
  status.textContent = ''; busyOn('Code wird geprüft …'); startMain().catch(() => { });
  try {
    let r; try { r = await rpc('vote_check', { p_code: CODE }) } catch (e) { throw new Error('network') }
    if (!r || !r.k) { fail(MSG.invalid); return }
    const k = r.k; delete r.k; AB = Object.assign(r, { code: fmt(CODE) });
    phase('dl', 'Die Entwürfe werden geladen …'); progress();
    const { ps } = await startMain(); const bytes = concat(await Promise.all(ps)); const S = slots(bytes);
    phase('open', 'Wird geöffnet …');
    const key = await openKey(k, bytes);
    let plain; try { plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: S.iv }, key, bytes.subarray(S.off)) } catch (e) { throw new Error('format') }
    const html = await new Response(new Blob([plain]).stream().pipeThrough(new DecompressionStream('gzip'))).blob();
    if (objectURL) URL.revokeObjectURL(objectURL);
    objectURL = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const loaded = new Promise(res => frame.addEventListener('load', res, { once: true }));
    viewer.hidden = false; frame.src = objectURL; await loaded;
    const ready = waitMsg('ovmg-ready', 6000);
    frame.contentWindow.postMessage({ type: 'ovmg-mode', mode: 'abstimmung', ab: AB }, '*');
    await ready;
    gate.classList.add('is-out'); await new Promise(res => setTimeout(res, 260));
    gate.hidden = true; gate.classList.remove('is-out'); busyOff(); input.value = '';
    try { frame.focus() } catch (e) { }
  } catch (e) { viewer.hidden = true; fail(MSG[e.message] || MSG.format) }
}
form.addEventListener('submit', e => { e.preventDefault(); open(input.value) });
form.addEventListener('focusin', () => { if (supported()) startMain().catch(() => { }) }, { once: true });
input.addEventListener('input', () => { const c = norm(input.value).slice(0, 8); const f = c.length > 4 ? c.slice(0, 4) + '-' + c.slice(4) : c; if (f !== input.value) input.value = f; status.textContent = '' });

/* Stimme abgeben – die Seite im Rahmen schickt die Reihenfolge, hier geht sie mit dem Code an die Datenbank */
addEventListener('message', async e => {
  if (e.source !== frame.contentWindow || !e.data || e.data.type !== 'ovmg-vote') return;
  const d = e.data; let res;
  try { const ok = await rpc('vote_cast', { p_code: CODE, p_web: d.web, p_stu: d.stu || null, p_unveraendert: !!d.unv }); res = { ok: ok === true, err: ok === true ? '' : 'used' } }
  catch (x) { res = { ok: false, err: x.message === 'server' ? 'invalid' : 'network' } }
  if (res.ok) { CODE = '' }
  try { frame.contentWindow.postMessage(Object.assign({ type: 'ovmg-vote-res' }, res), '*') } catch (x) { }
});

function lock() { frame.src = 'about:blank'; if (objectURL) URL.revokeObjectURL(objectURL); objectURL = null; AB = null; CODE = ''; viewer.hidden = true; gate.hidden = false; busyOff(); status.textContent = ''; input.value = ''; input.focus() }
$('#lock').addEventListener('click', lock);

/* Code aus dem QR-Code (#K7TM4QXR) übernehmen und sofort aus der Adresse entfernen */
const fromHash = () => {
  const m = location.hash.match(/^#([A-Za-z0-9-]{8,12})$/);
  if (m) { history.replaceState(null, '', location.pathname + location.search); if (!gate.hidden) { input.value = fmt(norm(m[1])); open(m[1]) } return true }
  return false;
};
if (!fromHash()) { document.documentElement.classList.remove('auto'); busyOff() }
addEventListener('hashchange', fromHash);

/* Leiste ausblenden, wenn ein Entwurf ganz geöffnet ist */
frame.addEventListener('load', () => { try { const b = frame.contentDocument && frame.contentDocument.body; if (!b) return; const sync = () => viewer.classList.toggle('is-concept', b.classList.contains('is-viewing')); new MutationObserver(sync).observe(b, { attributes: true, attributeFilter: ['class'] }); sync() } catch (e) { } });
const passInsets = () => { try { const cs = getComputedStyle($('#sa')), r = frame.contentDocument && frame.contentDocument.documentElement; if (r) { r.style.setProperty('--sat', cs.paddingTop); r.style.setProperty('--sab', cs.paddingBottom) } } catch (e) { } };
frame.addEventListener('load', passInsets); addEventListener('resize', passInsets);
