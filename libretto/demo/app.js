/* Libretto – Notenverwaltung für das bayerische Gymnasium · © 2026 theis */
'use strict';
const R = window.Rules, N = window.native;
const $ = s => document.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const fmt = (x, d = 2) => x == null || isNaN(x) ? '–' : (+x).toFixed(d).replace('.', ',');
const fdate = d => d ? R.fmtDate(d) : '';
const sdate = d => { if (!d) return ''; const [, m, dd] = d.split('-'); return `${+dd}.${+m}.`; };
const todayISO = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const HUES = ['--g1', '--g2', '--g3', '--g4', '--g5', '--g6', '--g7', '--g8'];
const HUE_NAMES = { '--g1': 'Blau', '--g2': 'Hellblau', '--g3': 'Grün', '--g4': 'Violettblau', '--g5': 'Rot', '--g6': 'Orange', '--g7': 'Lila', '--g8': 'Türkis' };
const SUBJ_HUE = { deu: '--g5', mat: '--g1', eng: '--g3', fra: '--g2', lat: '--g2', gri: '--g2', ita: '--g8', spa: '--g6', rus: '--g4', bio: '--g3', nat: '--g3', nut: '--g3', che: '--g6', phy: '--g4', inf: '--g2', ges: '--g4', geo: '--g6', erd: '--g6', pol: '--g5', soz: '--g5', pug: '--g5', wir: '--g2', rel: '--g7', kat: '--g7', eva: '--g7', eth: '--g7', kun: '--g5', mus: '--g6', spo: '--g8', 'w-s': '--g4', 'p-s': '--g6' };
const subjKey = s => (s || '').trim().toLowerCase();
const hueOf = s => { const k = subjKey(s); return (D && D.settings && D.settings.hues && D.settings.hues[k]) || SUBJ_HUE[k.slice(0, 3)] || HUES[[...k].reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length]; };
const byName = (a, b) => Names.compare(a, b);
const WEIGHTS = [['1', 'volle Schulaufgabe'], ['0.5', '½ Schulaufgabe'], ['0.333', '⅓ Schulaufgabe'], ['0.25', '¼ Schulaufgabe'], ['2', 'doppelt']];
const wLabel = w => ({ 1: '', 0.5: '×½', 0.333: '×⅓', 0.25: '×¼', 2: '×2' }[+w] ?? '×' + String(w).replace('.', ','));

let D = null;            // entschlüsselte Daten (nur im Arbeitsspeicher)
let ST = {};             // Status (Sicherung etc.)
const UI = { tab: 'grades', course: null, scope: 'year', until: '', term: null, termFor: null };
let lastAct = Date.now();

/* ---------- Grundgerüst ---------- */
function blankData() {
  return { v: 1, settings: { teacher: '', school: '', year: R.schoolYearOf(), half1End: '', autoLock: 10, dl: [] }, courses: [], classDates: [], events: [] };
}
let saveT = null;
let READONLY = false, POLICY = null;
/* Speichern: Schlägt es fehl, bleibt ein roter Hinweis stehen, bis es wieder klappt (Libretto versucht es alle 20 Sekunden erneut) */
let SAVE_ERR = null, saveRetry = null;
function saveState(err) {
  SAVE_ERR = err || null; let b = document.getElementById('saveErr');
  if (!SAVE_ERR) { if (b) { b.remove(); toast('Wieder gespeichert'); } clearInterval(saveRetry); saveRetry = null; return; }
  if (!b) { b = document.createElement('div'); b.id = 'saveErr'; b.className = 'saveErr'; document.body.appendChild(b); }
  b.innerHTML = `<b>Speichern fehlgeschlagen</b> – ${esc(SAVE_ERR)}. Libretto versucht es weiter. Bitte Libretto nicht beenden und Speicherplatz prüfen; die zuletzt gespeicherten Daten und alle Sicherungen bleiben unverändert. <button type="button" class="mini">Erneut versuchen</button>`;
  b.querySelector('button').onclick = () => flush().catch(() => {});
  if (!saveRetry) saveRetry = setInterval(() => { if (D && SAVE_ERR) flush().catch(() => {}); }, 20000);
}
function doSave() { if (!D) return Promise.resolve(); const snap = D; return N.save(snap).then(r => { if (SAVE_ERR) saveState(null); return r; }, e => { saveState(e && e.message || String(e)); throw e; }); }
function save() { if (READONLY) return; clearTimeout(saveT); saveT = setTimeout(() => { doSave().catch(() => {}); }, 400); }
function flush() { clearTimeout(saveT); return doSave(); }
/* Beim Schließen: erst speichern. Klappt das nicht, bleibt Libretto offen (es sei denn, man hat „Trotzdem beenden“ gewählt). */
let PENDING = null, QUIT_ANYWAY = false;
addEventListener('beforeunload', e => {
  const data = D || PENDING; if (!data) return;
  clearTimeout(saveT);
  let ok = false; try { ok = N.saveSync(data) !== false; } catch (x) { ok = false; }
  if (!ok && !QUIT_ANYWAY) { e.preventDefault(); e.returnValue = ''; saveState('Beim Beenden konnte nicht gespeichert werden'); quitAnywayOffer(); }
});
function quitAnywayOffer() {
  const b = $('#saveErr'); if (!b || b.querySelector('.quitAny')) return;
  b.insertAdjacentHTML('beforeend', ' <button type="button" class="mini quitAny" title="Die Änderungen seit dem letzten erfolgreichen Speichern gehen verloren">Trotzdem beenden</button>');
  b.querySelector('.quitAny').onclick = () => { QUIT_ANYWAY = true; window.close(); };
}

function toast(msg, ms = 2600) { const t = $('#toast'); t.classList.remove('act'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), ms); }
function toastAction(msg, label, fn, ms = 6000) { const t = $('#toast'); t.innerHTML = `<span>${esc(msg)}</span><button type="button">${esc(label)}</button>`; t.classList.add('show', 'act'); t.querySelector('button').onclick = () => { t.classList.remove('show', 'act'); fn(); }; clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show', 'act'), ms); }
const course = () => D && D.courses.find(c => c.id === UI.course);
/* Zuletzt geöffneten Kurs merken (nur die Kennung, in der Konfiguration – nicht in den Noten) */
const rememberCourse = () => { if (UI.course && ST) { ST.lastCourse = UI.course; try { N.setCfg({ lastCourse: UI.course }); } catch (e) {} } };
const upper = c => R.isUpper(c);
/* Kurse mit Schülern aus mehreren Klassen (z. B. Italienisch aus 8A und 8B): Klasse je Schüler im Feld „cls“.
   Stehen mindestens zwei verschiedene Klassen im Kurs, wird die Liste nach Klassen unterteilt. */
const clsKey = s => String((s && s.cls) || '').trim().toUpperCase();
const cmpCls = (a, b) => (a === '') - (b === '') || (parseInt(a) || 99) - (parseInt(b) || 99) || a.localeCompare(b, 'de');
const isMixed = list => new Set(list.map(clsKey).filter(Boolean)).size > 1;
/* Feld „Klasse“ zeigen: bei mehreren Klassen – oder wenn nur ein Teil der Namen eine Klasse hat (sonst bliebe sie unsichtbar) */
const clsShown = list => isMixed(list) || (list.some(clsKey) && !list.every(clsKey));
/* Sortieren: bei mehreren Klassen erst nach Klasse, dann nach Namen; gleiche Klasse in gleicher Schreibweise („8b“ → „8B“, wenn die anderen so heißen) */
const sortList = list => {
  const sp = {}; list.forEach(x => { const k = clsKey(x); if (k) { const m = sp[k] = sp[k] || {}; m[x.cls.trim()] = (m[x.cls.trim()] || 0) + 1; } });
  list.forEach(x => { const k = clsKey(x); if (k) x.cls = Object.entries(sp[k]).sort((a, b) => b[1] - a[1])[0][0]; });
  const mx = isMixed(list); return list.sort((a, b) => (mx ? cmpCls(clsKey(a), clsKey(b)) : 0) || byName(a, b));
};
/* Gruppen in Anzeige-Reihenfolge: [{ key, label, students }] – bei Kursen aus einer Klasse genau eine Gruppe ohne Überschrift */
function groupsOf(c) {
  if (!isMixed(c.students)) return [{ key: '', label: '', students: c.students }];
  const out = [];
  c.students.forEach(s => { const k = clsKey(s); let g = out.find(x => x.key === k); if (!g) out.push(g = { key: k, label: k ? 'Klasse ' + s.cls.trim() : 'Ohne Klasse', students: [] }); g.students.push(s); });
  return out;
}
/* Klassen, für die ein Kurs bei der Terminprüfung (§ 22 GSO) zählt */
function classesOf(c) { if (upper(c)) return [c.name]; return isMixed(c.students) ? [...new Set(c.students.map(clsKey).filter(Boolean))].sort(cmpCls) : [R.classOf(c.name)]; }
/* Zeilen für Ausdrucke: je Klasse eine Zwischenüberschrift; die Nummern laufen durch – wie auf dem Notenblatt des Infoportals */
/* Nachteilsausgleich / Notenschutz je Schüler (c.support[sid] = { k: 'na' | 'ns', t: 'Text' }) – Merkhilfe, sichtbar beim Eintragen */
const SUP = { na: ['NA', 'Nachteilsausgleich'], ns: ['NS', 'Notenschutz'] };
const supOf = (c, sid) => (c.support && c.support[sid] && SUP[c.support[sid].k]) ? c.support[sid] : null;
const supTag = (c, sid) => { const x = supOf(c, sid); return x ? `<span class="supTag ${x.k}" title="${esc(SUP[x.k][1] + (x.t ? ': ' + x.t : ''))}">${SUP[x.k][0]}</span>` : ''; };
const supText = (c, sid) => { const x = supOf(c, sid); return x ? SUP[x.k][1] + (x.t ? ': ' + x.t : '') : ''; };
function groupedRows(c, fn) { let n = 0; return groupsOf(c).flatMap(g => [...(g.label ? [{ group: `${g.label} · ${g.students.length} Schüler` }] : []), ...g.students.map(s => fn(s, n++))]); }
/* Vorschlag für den Kursnamen aus den Klassen: 8A + 8B → „8AB“ (nur wenn alle Klassen dieselbe Jahrgangsstufe haben) */
function mixedName(list) { const ks = [...new Set(list.map(clsKey).filter(Boolean))].sort(cmpCls).map(k => /^(\d{1,2})(\D+)$/.exec(k)); return ks.length > 1 && ks.every(m => m && m[1] === ks[0][1]) ? ks[0][1] + ks.map(m => m[2]).join('') : ''; }

/* ---------- Dialoge ---------- */
/* Unterfenster: Das aufrufende Fenster bleibt darunter offen. Schließt man das Unterfenster, ist man wieder dort, wo man war.
   refresh (optional) baut das aufrufende Fenster danach neu auf (z. B. weil das Unterfenster Zahlen darin geändert hat) –
   noch nicht gesicherte Eingaben und die Bildlaufposition bleiben dabei erhalten. */
let AFTER = null;
/* Alle Fenster schließen, ohne zurückzukehren – wenn eine Schaltfläche woandershin führt (z. B. zum Reiter „Termine“) */
function closeAll() { AFTER = null; $$('dialog').forEach(d => { d._after = null; if (d.open) d.close(); d.remove(); }); document.body.classList.remove('modal'); }
async function openSub(parent, open, refresh) {
  AFTER = refresh ? () => refreshSheet(parent, refresh) : null;
  try { await open(); } finally { AFTER = null; }
}
async function refreshSheet(old, reopen) {
  if (!old || !old.isConnected) return;
  const edited = $$('input[id],select[id],textarea[id]', old).filter(e => e.type === 'checkbox' || e.type === 'radio' ? e.checked !== e.defaultChecked
    : e.tagName === 'SELECT' ? [...e.options].some(o => o.selected !== o.defaultSelected) : e.type !== 'file' && e.value !== e.defaultValue)
    .map(e => [e.id, e.type === 'checkbox' || e.type === 'radio' ? e.checked : e.value, e.type === 'checkbox' || e.type === 'radio']);
  const scr = $$('.sheetbody,.setMain', old).map(e => e.scrollTop);
  AFTER = old._after; old._after = null; old.close(); old.remove();
  try { await reopen(); } finally { AFTER = null; }
  const nd = [...document.querySelectorAll('dialog[open]')].pop(); if (!nd) return;
  nd.classList.add('noAnim');
  edited.forEach(([id, v, chk]) => { const e = nd.querySelector('#' + CSS.escape(id)); if (e) { if (chk) e.checked = v; else e.value = v; } });
  $$('.sheetbody,.setMain', nd).forEach((e, i) => { if (scr[i]) e.scrollTop = scr[i]; });
}
function sheet({ title, body, ok = 'Sichern', cancel = 'Abbrechen', wide, small, onOk, onOpen, footer = '', allowRO }) {
  if (READONLY && ok && !allowRO) { ok = ''; cancel = 'Schließen'; }
  const dlg = document.createElement('dialog');
  if (wide) dlg.className = 'wide'; if (small) dlg.className = 'small';
  dlg.innerHTML = `<form method="dialog"><div class="sheethead"><button type="button" class="linkish" data-x>${esc(cancel)}</button><h2>${esc(title)}</h2>${ok ? `<button type="submit" class="linkish strong">${esc(ok)}</button>` : '<span></span>'}</div><div class="sheetbody">${body}${footer}</div></form>`;
  document.body.appendChild(dlg);
  dlg._after = AFTER; AFTER = null;
  const close = () => { const f = dlg._after; dlg._after = null; dlg.close(); dlg.remove(); if (!document.querySelector('dialog[open]')) document.body.classList.remove('modal'); if (f) f(); };
  dlg.querySelector('[data-x]').onclick = close;
  dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });
  dlg.querySelector('form').addEventListener('submit', async e => { e.preventDefault(); if (!onOk || (await onOk(dlg)) !== false) close(); });
  document.body.classList.add('modal');
  dlg.showModal(); if (onOpen) onOpen(dlg, close);
  return { dlg, close };
}
function ask(text, okLabel = 'OK', danger = false, title = 'Bitte bestätigen', noLabel = 'Abbrechen') {
  return new Promise(res => {
    const { dlg, close } = sheet({ title, small: true, ok: '', cancel: 'Abbrechen', body: `<p class="prose" style="margin:0">${text}</p><div class="askBtns"><button type="button" class="mini" data-n>${esc(noLabel)}</button><button type="button" class="mini ${danger ? 'dangerFill' : 'accent'}" data-y>${esc(okLabel)}</button></div>`,
      onOpen: d => { d.querySelector('[data-n]').onclick = () => { close(); res(false); }; d.querySelector('[data-y]').onclick = () => { close(); res(true); }; d.querySelector('[data-x]').addEventListener('click', () => res(false)); } });
  });
}
const field = (label, inner, cls = '') => `<label class="field ${cls}"><span>${label}</span>${inner}</label>`;
const sw = (id, on, label) => `<div class="row"><span>${label}</span><input type="checkbox" class="sw" id="${id}" ${on ? 'checked' : ''}></div>`;

/* ======================================================================
   Einrichtung & Sperre
   ====================================================================== */
const ICON = '<img class="appIcon" src="icon.png" alt="">';
let APPV = ''; try { N.version().then(v => { APPV = v || ''; }).catch(() => {}); } catch (e) {}
function gate(html) { $('#appRoot').hidden = true; $('#gate').hidden = false; $('#gateCard').classList.remove('lockCard'); $('#gateCard').innerHTML = html;
  if (!$('#gateBrand') && window.THEISAPPS_LOGO) { const b = document.createElement('div'); b.id = 'gateBrand'; b.className = 'gateBrand'; b.innerHTML = window.THEISAPPS_LOGO; $('#gate').appendChild(b); } }

let SETUP = {};
function setupStep(n, ctx = {}) {
  const dots = `<div class="stepDots">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div>`;
  const card = $('#gateCard'); card.classList.toggle('wide', n > 1);
  if (n === 1) {
    gate(`${ICON}<h2>Willkommen bei Libretto</h2><p>Deine Notenverwaltung für das bayerische Gymnasium – Berechnung nach der GSO, alle Daten verschlüsselt auf diesem Computer.</p>${dots}
      <div class="notice" style="text-align:left"><div class="grow"><b>Wichtig:</b> ${esc(Print.DISCLAIMER)} Sichere deine Daten zusätzlich regelmäßig selbst.</div></div>
      <label class="check"><input type="checkbox" id="ackDoc"> <span>Verstanden: Libretto ist meine persönliche Hilfe, nicht die offizielle Dokumentation. Ich übertrage Noten ins Infoportal bzw. Schulprogramm.</span></label>
      <button class="go" id="next" disabled>Weiter</button>`);
    $('#ackDoc').onchange = () => { $('#next').disabled = !$('#ackDoc').checked; }; $('#next').onclick = () => setupStep(2);
  }
  if (n === 2) {
    gate(`${dots}<h2>Über dich</h2><p>Erscheint auf deinen Ausdrucken. Alles freiwillig und später in den Einstellungen änderbar.</p>
      <div class="grid2">${field('Dein Name', `<input type="text" id="suT" value="${esc(SETUP.teacher || '')}" placeholder="z. B. J. Muster">`)}${field('Schule', `<input type="text" id="suS" value="${esc(SETUP.school || '')}" placeholder="z. B. Gymnasium Musterstadt">`)}
      ${field('Schuljahr', `<input type="text" id="suY" value="${esc(SETUP.year || R.schoolYearOf())}">`)}${field('Notenschluss Zwischenzeugnis', `<input type="date" id="suH" value="${esc(SETUP.half1End || '')}">`)}</div>
      <p class="hint">Der Notenschluss steuert die Ansicht „Stand Zwischenzeugnis“ – kannst du auch später festlegen.</p>
      <button class="go" id="next">Weiter</button><div class="gateLinks"><button id="skip">Überspringen</button></div>`);
    $('#suT').focus();
    const go = () => { SETUP = { teacher: $('#suT').value.trim(), school: $('#suS').value.trim(), year: $('#suY').value.trim() || R.schoolYearOf(), half1End: $('#suH').value }; setupStep(3); };
    $('#next').onclick = go; $('#skip').onclick = () => { SETUP = {}; setupStep(3); };
  }
  if (n === 3) {
    gate(`${dots}<h2>Passwort festlegen</h2><p>Mit diesem Passwort werden alle Noten verschlüsselt. Ohne Passwort (oder Notfallschlüssel) kann niemand die Daten lesen – auch du nicht.</p>
      ${field('Passwort (mindestens 8 Zeichen)', '<input type="password" id="pw1" autocomplete="new-password"><div class="strength"><i id="pwBar"></i></div>')}
      ${field('Passwort wiederholen', '<input type="password" id="pw2" autocomplete="new-password">')}
      <p class="gateErr" id="err"></p><button class="go" id="next">Verschlüsselung einrichten</button>`);
    $('#pw1').focus();
    $('#pw1').oninput = () => { const v = $('#pw1').value; let s = Math.min(4, Math.floor(v.length / 4) + (/[0-9]/.test(v) ? 1 : 0) + (/[^A-Za-z0-9]/.test(v) ? 1 : 0)); $('#pwBar').style.width = (s * 25) + '%'; $('#pwBar').style.background = s >= 3 ? 'var(--green)' : s >= 2 ? 'var(--orange)' : 'var(--red)'; };
    const go = async () => {
      const a = $('#pw1').value, b = $('#pw2').value;
      if (a.length < 8) return ($('#err').textContent = 'Bitte mindestens 8 Zeichen.');
      if (a !== b) return ($('#err').textContent = 'Die Passwörter stimmen nicht überein.');
      $('#next').disabled = true; $('#next').textContent = 'Wird eingerichtet …';
      D = blankData(); Object.assign(D.settings, SETUP);
      try { const r = await N.create(a, D); setupStep(4, { code: r.code }); } catch (e) { $('#err').textContent = e.message; $('#next').disabled = false; }
    };
    $('#next').onclick = go; $('#pw2').onkeydown = e => { if (e.key === 'Enter') go(); };
  }
  if (n === 4) {
    gate(`${dots}<h2>Dein Notfallschlüssel</h2><p>Falls du das Passwort vergisst, öffnet nur dieser Schlüssel deine Daten. Speichere ihn als PDF und drucke ihn aus – bewahre ihn getrennt vom Computer auf.</p>
      <div class="code" id="code">${esc(ctx.code)}</div>
      <div class="panelBtns" style="justify-content:center"><button class="mini accent" id="pdf">Als PDF speichern / drucken</button><button class="mini" id="copy">Kopieren</button></div>
      <label class="check"><input type="checkbox" id="ack"> <span>Ich habe den Notfallschlüssel sicher aufbewahrt.</span></label>
      <button class="go" id="next" disabled>Weiter</button>`);
    $('#pdf').onclick = () => saveCodePdf(ctx.code);
    $('#copy').onclick = () => { navigator.clipboard.writeText(ctx.code); toast('Kopiert'); };
    $('#ack').onchange = () => { $('#next').disabled = !$('#ack').checked; };
    $('#next').onclick = () => setupStep(5);
  }
  if (n === 5) {
    gate(`${dots}<h2>Automatische Sicherung</h2><p>Libretto sichert nach jeder Sitzung automatisch – verschlüsselt und mit Versionen der letzten Wochen. Wähle zusätzlich einen Ordner <b>außerhalb</b> dieses Computers, z. B. einen USB-Stick, iCloud Drive oder OneDrive, damit nichts verloren geht, wenn der Computer kaputtgeht.</p>
      <div class="rows"><div class="row"><span id="dirTxt">Noch kein Sicherungsordner gewählt</span><button class="mini accent" id="pick">Ordner wählen …</button></div></div>
      <p class="hint">Die Sicherungen sind verschlüsselt – auch in der Cloud kann sie niemand ohne dein Passwort lesen. Ob Cloud-Speicher an deiner Schule erlaubt ist, entscheidet die Schulleitung.</p>
      <button class="go" id="next">Los geht's</button><div class="gateLinks"><button id="later">Später einrichten</button></div>`);
    $('#pick').onclick = async () => { ST = await N.chooseBackupDir(); if (ST.backupDir) { $('#dirTxt').textContent = ST.backupDir; toast(ST.lastExternalError ? '⚠ In diesem Ordner konnte nicht gesichert werden: ' + ST.lastExternalError : 'Erste Sicherung angelegt', ST.lastExternalError ? 6000 : 2600); } };
    const done = () => enterApp(); $('#next').onclick = done; $('#later').onclick = done;
  }
}
async function saveCodePdf(code) {
  const m = { title: 'Libretto – Notfallschlüssel', subtitle: 'Sicher und getrennt vom Computer aufbewahren', meta: [['Erstellt', new Date().toLocaleDateString('de-DE')]],
    blocks: [{ table: { head: ['Notfallschlüssel'], rows: [[code]], big: [0] } },
      { p: 'Mit diesem Schlüssel lassen sich deine Libretto-Daten und alle Sicherungen öffnen, wenn du das Passwort vergessen hast. Wer ihn besitzt, kann die Noten lesen – also wie einen Haustürschlüssel behandeln.' },
      { p: 'So geht es: Libretto öffnen → „Passwort vergessen? Mit Notfallschlüssel öffnen“ → Schlüssel eingeben → neues Passwort festlegen.' }] };
  await N.savePdf('Libretto-Notfallschluessel.pdf', Print.html(m, {}), false, Print.footer({}));
}

const SVG_TOUCH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.2A8 8 0 0 1 20 12v1.5"/><path d="M4 12a8 8 0 0 1 .9-3.7"/><path d="M8 18.5c.9-1.8 1.4-3.9 1.4-6a2.6 2.6 0 0 1 5.2 0c0 1.2-.1 2.3-.3 3.4"/><path d="M12 12.5c0 3-1 5.8-2.6 8"/><path d="M17.2 14.5c-.3 2.4-1 4.6-2.2 6.5"/><path d="M6.6 16.7c.6-1.3.9-2.7.9-4.2A4.5 4.5 0 0 1 12 8a4.5 4.5 0 0 1 4.5 4.5"/></svg>';
const SVG_LOCK = '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
const SVG_KEY = '<svg viewBox="0 0 24 24"><circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l3 3M14 9l2 2"/></svg>';
const SVG_EYE = '<svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const SVG_EYE_OFF = '<svg viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
const SVG_SHIELD = '<svg viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 4.6-3.4 8.4-8 9-4.6-.6-8-4.4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>';
/* Passwortfeld mit Schloss, „anzeigen“ und Hinweis bei Feststelltaste */
function pwWire(input) {
  const wrap = input.closest('.pwField'); if (!wrap) return;
  const eye = wrap.querySelector('.pwEye'), caps = wrap.parentNode.querySelector('.capsHint');
  if (eye) eye.onclick = () => { const show = input.type === 'password'; input.type = show ? 'text' : 'password'; eye.innerHTML = show ? SVG_EYE_OFF : SVG_EYE; eye.setAttribute('aria-label', show ? 'Passwort verbergen' : 'Passwort anzeigen'); eye.title = eye.getAttribute('aria-label'); input.focus(); };
  const cap = e => { if (caps && e.getModifierState) caps.hidden = !e.getModifierState('CapsLock'); };
  input.addEventListener('keydown', cap); input.addEventListener('keyup', cap);
}
function renderLock(mode = 'pw', info = '', opts = {}) {
  const code = mode === 'code', tidOn = !code && ST.touchId === 'on';
  const now = new Date(), h = now.getHours();
  const hello = h < 5 ? 'Gute Nacht' : h < 11 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend';
  gate(`<div class="lockTop"><span>${esc(now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }))}</span></div>
    <div class="lockIcon">${ICON}</div>
    <h2>${code ? 'Mit Notfallschlüssel öffnen' : esc(hello)}</h2><p>${code ? 'Gib den Notfallschlüssel ein. Danach legst du ein neues Passwort fest.' : (tidOn ? 'Libretto ist gesperrt. Lege den Finger auf Touch ID oder gib dein Passwort ein.' : 'Libretto ist gesperrt. Gib dein Passwort ein, um deine Noten zu öffnen.')}</p>
    <div class="pwField${code ? ' code' : ''}${tidOn ? ' hasTid' : ''}"><i class="pwIc">${code ? SVG_KEY : SVG_LOCK}</i>
      <input class="pwInput" id="pw" type="${code ? 'text' : 'password'}" placeholder="${code ? 'XXXXXX-XXXXXX-XXXXXX-XXXXXX' : 'Passwort'}" autocomplete="${code ? 'off' : 'current-password'}" spellcheck="false" aria-label="${code ? 'Notfallschlüssel' : 'Passwort'}">
      ${tidOn ? `<button type="button" class="pwTid" id="tid" aria-label="Mit Touch ID entsperren" title="Mit Touch ID entsperren">${SVG_TOUCH}</button>` : ''}${code ? '' : `<button type="button" class="pwEye" aria-label="Passwort anzeigen" title="Passwort anzeigen">${SVG_EYE}</button>`}</div>
    <div class="capsHint" hidden>⇪ Feststelltaste ist an</div>
    <p class="gateErr" id="err" role="alert">${esc(info)}</p><button class="go" id="open"><span>${code ? 'Öffnen' : 'Entsperren'}</span></button>
    <div class="gateLinks">${code ? '<button id="back">Zurück zum Passwort</button>' : '<button id="useCode">Passwort vergessen?</button>'}<i></i><button id="restore">Sicherung wiederherstellen …</button></div>
    <div class="lockSafe">${SVG_SHIELD}<span>Verschlüsselt mit AES-256 · Daten nur auf diesem Computer</span></div>`);
  $('#gateCard').classList.add('lockCard');
  pwWire($('#pw'));
  $('#gateCard').classList.remove('wide');
  $('#pw').focus();
  const go = async () => {
    const v = $('#pw').value; if (!v) return;
    $('#open').disabled = true; $('#open').textContent = 'Wird entschlüsselt …';
    const r = await N.unlock(v, code);
    if (!r.ok) { $('#err').textContent = r.error; $('#open').disabled = false; $('#open').innerHTML = `<span>${code ? 'Öffnen' : 'Entsperren'}</span>`; $('#pw').select(); const f = $('.pwField'); if (f) { f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); } return; }
    opened(r);
  };
  /* Touch ID (Mac, freiwillig): Fingerabdruck statt Tippen – das Passwort-Feld bleibt immer daneben */
  const tid = async () => { const b = $('#tid'); if (!b || b.disabled) return; b.disabled = true; b.classList.add('wait');
    const r = await N.tidUnlock().catch(() => ({ ok: false, error: '' }));
    if (!$('#tid')) return;
    if (r.ok) return opened(r);
    b.disabled = false; b.classList.remove('wait');
    if (r.error) { $('#err').textContent = r.error; ST.touchId = 'off'; b.remove(); $('.pwField').classList.remove('hasTid'); }
    $('#pw').focus();
  };
  const opened = r => {
    D = r.data; migrate();
    if (PENDING) { D = PENDING; PENDING = null; flush().catch(() => {}); }
    if (r.recovered) setTimeout(() => sheet({ title: 'Letzter Stand geöffnet', small: true, ok: '', cancel: 'Verstanden', body: `<p class="prose" style="margin:0">Die Datei mit deinen Daten war beim letzten Speichern beschädigt worden (z. B. durch einen Absturz oder Stromausfall). Libretto hat deshalb den <b>vorherigen gespeicherten Stand</b>${typeof r.recovered === 'string' ? ' vom ' + esc(new Date(r.recovered).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })) : ''} geöffnet. Die beschädigte Datei liegt bei den Sicherungen. Bitte prüfe die zuletzt eingetragenen Noten.</p>` }), 400);
    if (code) return newPasswordAfterCode();
    enterApp();
  };
  $('#open').onclick = go; $('#pw').onkeydown = e => { if (e.key === 'Enter') go(); };
  /* Fingerabdruck von selbst abfragen: beim Start und nach dem automatischen Sperren – sobald das Fenster vorne ist (nicht nach „Sperren“ von Hand) */
  if ($('#tid')) { $('#tid').onclick = tid;
    if (opts.autoTid && !info) { const ask = () => setTimeout(tid, 300); if (document.hasFocus()) ask(); else window.addEventListener('focus', ask, { once: true }); } }
  if ($('#useCode')) $('#useCode').onclick = () => renderLock('code');
  if ($('#back')) $('#back').onclick = () => renderLock('pw');
  $('#restore').onclick = () => restoreFlow(true);
}
function newPasswordAfterCode() {
  gate(`${ICON}<h2>Neues Passwort festlegen</h2><p>Der Notfallschlüssel hat funktioniert. Lege jetzt ein neues Passwort fest.</p>
    ${field('Neues Passwort (mindestens 8 Zeichen)', '<input type="password" id="pw1" autocomplete="new-password">')}
    ${field('Wiederholen', '<input type="password" id="pw2" autocomplete="new-password">')}
    <p class="gateErr" id="err"></p><button class="go" id="next">Passwort speichern</button>`);
  $('#pw1').focus();
  $('#next').onclick = async () => {
    const a = $('#pw1').value, b = $('#pw2').value;
    if (a.length < 8) return ($('#err').textContent = 'Bitte mindestens 8 Zeichen.');
    if (a !== b) return ($('#err').textContent = 'Die Passwörter stimmen nicht überein.');
    const r = await N.resetPassword(a);
    if (!r.ok) return ($('#err').textContent = r.error);
    toast('Neues Passwort gespeichert'); enterApp();
  };
}
async function restoreFlow(fromLock) {
  const file = await N.pickBackup(); if (!file) return;
  const { dlg } = sheet({ title: 'Sicherung wiederherstellen', small: true, ok: 'Wiederherstellen', allowRO: true,
    body: `<p class="prose" style="margin-top:0">Gib das Passwort ein, das <b>zum Zeitpunkt der Sicherung</b> galt – oder den Notfallschlüssel. Der aktuelle Stand wird vorher noch einmal gesichert.</p>
      ${field('Datei', `<input type="text" value="${esc(file.split(/[\\/]/).pop())}" disabled>`)}${field('Passwort oder Notfallschlüssel', '<input type="password" id="rsPw">')}
      <label class="check"><input type="checkbox" id="rsCode"> <span>Das ist der Notfallschlüssel</span></label><p class="gateErr" id="rsErr"></p>`,
    onOk: async d => {
      const r = await N.restore(file, d.querySelector('#rsPw').value, d.querySelector('#rsCode').checked);
      if (!r.ok) { d.querySelector('#rsErr').textContent = r.error; return false; }
      D = r.data; migrate(); PENDING = null; toast(r.attFail ? `Noten wiederhergestellt – ${r.attFail === 1 ? 'ein Dateianhang konnte' : r.attFail + ' Dateianhänge konnten'} nicht kopiert werden` : 'Sicherung wiederhergestellt', r.attFail ? 8000 : 2600); enterApp(); return true;
    } });
  dlg.querySelector('#rsPw').focus();
}
async function lockNow(auto = false) {
  if (!D) return;
  try { await flush(); } catch (e) {
    /* Speichern klappt gerade nicht: trotzdem sperren (Sichtschutz), den ungespeicherten Stand im Speicher behalten und nach dem Entsperren erneut speichern */
    PENDING = D; D = null;
    $('#main').innerHTML = ''; $$('dialog').forEach(d => d.remove()); document.body.classList.remove('modal');
    renderLock('pw', 'Gesperrt. Die letzten Änderungen konnten noch nicht gespeichert werden – sie bleiben erhalten und werden nach dem Entsperren erneut gespeichert.');
    return;
  }
  await N.lock(); D = null;
  $('#main').innerHTML = ''; $$('dialog').forEach(d => d.remove()); document.body.classList.remove('modal');
  renderLock('pw', '', { autoTid: auto });
}
/* Automatisch sperren bei Inaktivität */
['mousemove', 'keydown', 'mousedown', 'wheel', 'touchstart'].forEach(ev => addEventListener(ev, () => { lastAct = Date.now(); }, { passive: true }));
setInterval(() => { if (D && (+D.settings.autoLock || 0) > 0 && Date.now() - lastAct > D.settings.autoLock * 60000) lockNow(true); }, 15000);

function migrate() {
  D.settings = { ...blankData().settings, ...(D.settings || {}) };
  D.courses = D.courses || []; D.classDates = D.classDates || []; D.events = D.events || []; D.settings.hues = D.settings.hues || {}; D.settings.lastTerm = D.settings.lastTerm || {};
  if (D.settings && !(+D.settings.autoLock > 0 && +D.settings.autoLock <= 15)) D.settings.autoLock = 15;   /* Mindestsicherheitsstandards des KM: Sperre spätestens nach 15 Minuten */
  D.courses.forEach(c => { c.students = sortList((c.students || []).slice()); c.away = c.away || {}; c.assessments = c.assessments || []; c.overrides = c.overrides || {}; c.notes = c.notes || {}; c.seminarPaper = c.seminarPaper || {}; c.xfer = c.xfer || {}; c.typeWeights = c.typeWeights || {}; c.areaWeights = c.areaWeights || { schriftlich: 1, 'mündlich': 1, praktisch: 1 }; if (c.seminar) semCfg(c); });
  D.courses.forEach(c => c.assessments.forEach(a => R.markRawOrigin(a)));   /* 1.0.12: Herkunft der Gesamtpunkte ausdrücklich merken */
  D.attTrash = D.attTrash || {};
  D.trash = (D.trash || []).filter(x => x && x.when && Date.now() - new Date(x.when) < TRASH_DAYS * 864e5);
}
/* ---------- Papierkorb: Gelöschtes bleibt 60 Tage wiederherstellbar (Kurse, Leistungsnachweise, Betreuungstermine, Stand vor dem Entfernen von Personen) ---------- */
const TRASH_DAYS = 60;
function toTrash(kind, label, data, extra = {}) { if (!data) return; D.trash = D.trash || []; D.trash.unshift({ id: uid(), kind, label, when: new Date().toISOString(), ...extra, data: JSON.parse(JSON.stringify(data)) }); }
function restoreTrash(x) {
  const d = JSON.parse(JSON.stringify(x.data)), when = new Date(x.when).toLocaleDateString('de-DE');
  if (x.kind === 'course' || x.kind === 'snapshot') {
    if (x.kind === 'snapshot' || D.courses.some(c => c.id === d.id)) { d.id = uid(); delete d.xid; (d.students || []).forEach(s => delete s.xid); d.name = d.name + (x.kind === 'snapshot' ? ` (Stand ${when})` : ' (wiederhergestellt)'); }
    D.courses.push(d); UI.course = d.id; UI.termFor = null;
  } else {
    const c = D.courses.find(k => k.id === x.courseId);
    if (!c) { toast('Den Kurs gibt es nicht mehr – bitte zuerst den Kurs wiederherstellen.', 5000); return false; }
    if (x.kind === 'assessment') { if (c.assessments.some(a => a.id === d.id)) d.id = uid(); c.assessments.push(d); }
    if (x.kind === 'termin') { if (!c.students.some(s => s.id === x.sid)) { toast('Die Person ist nicht mehr im Kurs.', 5000); return false; } const o = semSt(c, x.sid); o.termine = o.termine || []; if (o.termine.some(t => t.id === d.id)) d.id = uid(); o.termine.push(d); o.termine.sort((a, b) => (a.date || '').localeCompare(b.date || '')); }
  }
  D.trash = D.trash.filter(y => y.id !== x.id); migrate(); save(); attHousekeeping(); return true;
}
async function enterApp() {
  $('#gate').hidden = true; $('#appRoot').hidden = false;
  ST = await N.status();
  if (!UI.course && D.courses[0]) UI.course = (ST.lastCourse && D.courses.some(x => x.id === ST.lastCourse)) ? ST.lastCourse : D.courses[0].id;   /* zuletzt geöffneter Kurs */
  if (!enterApp.tabSet) { enterApp.tabSet = true; if (D.courses.length && ST.startTab !== 'grades') UI.tab = 'start'; }   /* beim ersten Öffnen: Übersicht (abstellbar unter Einstellungen → Allgemein) */
  brandLine();
  render();
  setTimeout(() => refreshFeed(false), 3500);
  if (!ST.test) setTimeout(kmkMfsCheck, 1500);   /* in den automatischen Tests gezielt aufgerufen (e2e25) */   /* abonnierter Schulkalender: höchstens alle 6 Stunden still aktualisieren */
  applyPolicy(await N.policy());
  attHousekeeping();
  if (!enterApp.checked) { enterApp.checked = true; N.checkUpdate().then(r => { if (r && r.update) UPDATE = r.update; if (r && r.policy) applyPolicy(r.policy); render(); }).catch(() => {}); }
}
let UPDATE = null;
/* Zeile unter dem Namen in der Leiste */
function brandLine() { if (D) $('#brandSub').textContent = READONLY ? 'Nur lesen – bitte aktualisieren' : `Schuljahr ${D.settings.year}`; }
/* Nicht mehr unterstützte Version: Nur-Lesen-Modus statt Sperre (Libretto 1.0 läuft nicht ab) */
function applyPolicy(p) {
  if (!p) return; POLICY = p;
  const was = READONLY; READONLY = !!p.expired;
  document.body.classList.toggle('readonly', READONLY);
  brandLine();
  if (READONLY && !was && !applyPolicy.shown) { applyPolicy.shown = true; betaEndSheet(); }
}
function betaEndSheet() {
  const p = POLICY || {};
  sheet({ title: 'Bitte aktualisieren', ok: '', cancel: 'Verstanden', body: `<div class="prose">
    <p style="margin-top:0">${p.message ? esc(p.message) : 'Diese Version von Libretto wird nicht mehr unterstützt.'}</p>
    <p><b>Deine Noten bleiben vollständig erhalten.</b> Du kannst weiterhin alles ansehen, drucken, exportieren und sichern – nur neue Eintragungen sind in dieser Version nicht mehr möglich.</p>
    <p>Zum Weiterarbeiten lade die aktuelle Version von theisapps.de und installiere sie einfach über diese. Alle Daten werden übernommen.</p>
    <div class="panelBtns"><a class="mini accent" href="${esc(p.url || 'https://theisapps.de/libretto/')}" target="_blank" rel="noopener">Zur aktuellen Version</a></div></div>` });
}
function betaNotice() {
  if (!POLICY || !READONLY) return '';
  return `<div class="notice"><div class="grow"><b>Diese Version wird nicht mehr unterstützt – nur lesen.</b> Deine Noten bleiben erhalten und lassen sich drucken und exportieren. Zum Weiterarbeiten die aktuelle Version laden.</div><a class="mini" href="${esc(POLICY.url)}" target="_blank" rel="noopener">Aktuelle Version</a></div>`;
}

/* ======================================================================
   Hauptansicht
   ====================================================================== */
function render() {
  if (!D) return;
  $$('#tabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === UI.tab)));
  $('#main').dataset.tab = UI.tab;
  if (UI.tab === 'grades') renderGrades();
  else if (UI.tab === 'start') return renderStart();
  else renderSide();
  if (UI.tab === 'dates') renderDates();
  if (UI.tab === 'backup') renderBackup();
}
$('#tabs').addEventListener('click', e => { const b = e.target.closest('button[data-tab]'); if (b) { UI.tab = b.dataset.tab; UI.calPick = null; $('#toast').classList.remove('show', 'act'); sidePeek(false); render(); } });
$('#newCourseBtn').onclick = () => courseSheet();
$('#settingsBtn').onclick = () => settingsSheet();
$('#lockBtn').onclick = () => lockNow();
$('#helpBtn').onclick = () => helpSheet();

function updateNotice() { return UPDATE ? `<div class="notice info"><div class="grow"><b>Neue Version ${esc(UPDATE.version)} verfügbar.</b> ${esc(UPDATE.notes)} Deine Daten bleiben beim Aktualisieren erhalten – Libretto sichert vorher automatisch.</div><a class="mini" href="${esc(UPDATE.url)}" target="_blank" rel="noopener">Herunterladen</a></div>` : ''; }
function backupNotice() {
  return betaNotice() + updateNotice() + backupNotice0();
}
/* Meldung nach „Jetzt sichern“: „Gesichert“ nur, wenn wirklich eine Datei geschrieben wurde */
function bkMsg(r) {
  if (!r || !r.ok) return '⚠ Sicherung fehlgeschlagen' + (r && (r.localError || r.externalError) ? ' (' + (r.localError || r.externalError) + ')' : '') + ' – bitte Speicherplatz und Sicherungsordner prüfen.';
  if (r.external && r.local) return 'Gesichert – auch im Sicherungsordner';
  if (r.external) return 'Nur im Sicherungsordner gesichert – auf diesem Computer ging es nicht' + (r.localError ? ' (' + r.localError + ')' : '') + '.';
  if (r.externalError) return '⚠ Nur auf diesem Computer gesichert – Sicherungsordner: ' + r.externalError;
  return 'Auf diesem Computer gesichert';
}
function backupNotice0() {
  if (ST.lastLocalError) return `<div class="notice"><div class="grow"><b>Sicherung auf diesem Computer fehlgeschlagen</b> (${esc(ST.lastLocalError)}). Bitte Speicherplatz prüfen und unter „Sicherung“ erneut sichern.</div></div>`;
  const days = ST.lastExternal ? (Date.now() - ST.lastExternal) / 864e5 : null;
  if (!ST.backupDir) return `<div class="notice"><div class="grow"><b>Noch kein externer Sicherungsordner.</b> Libretto sichert bisher nur auf diesem Computer. Wähle einen USB-Stick oder Cloud-Ordner – und übertrage Noten zeitnah ins Infoportal.</div><button class="mini" data-act="pickDir">Ordner wählen</button></div>`;
  if (ST.lastExternalError) return `<div class="notice"><div class="grow"><b>Sicherungsordner nicht erreichbar</b> (${esc(ST.lastExternalError)}). Ist der USB-Stick angeschlossen?</div><button class="mini" data-act="backupNow">Erneut sichern</button></div>`;
  if (days != null && days > 7) return `<div class="notice"><div class="grow"><b>Letzte externe Sicherung vor ${Math.floor(days)} Tagen.</b> Bitte Sicherungsordner verbinden.</div><button class="mini" data-act="backupNow">Jetzt sichern</button></div>`;
  return '';
}

function courseLabel(c) { return upper(c) ? c.name : `${c.name}`; }
/* Oberstufe: zuletzt geöffnetes Halbjahr je Kurs merken; sonst das laufende Halbjahr */
function defaultTerm(c) {
  if (c.seminar) { const x = semTermNow(c); return x === '12/1' || x === '12/2' ? x : SEM_TAB; }   /* ab 13/1: gleich die Seminararbeit */
  const ts = R.termsOf(c), t = todayISO(), h = D.settings.half1End, mo = +t.slice(5, 7), day = +t.slice(8, 10);
  const second = h ? t > h : (mo >= 3 && mo <= 8) || (mo === 2 && day >= 20);
  return ts[second ? 1 : 0] || ts[0];
}
function pickTerm(c) { const last = D.settings.lastTerm && D.settings.lastTerm[c.id]; return R.termsOf(c).includes(last) || (c.seminar && last === SEM_TAB) ? last : defaultTerm(c); }
/* Abwesenheit (z. B. Auslandsaufenthalt): Zeitraum je Schüler */
function awayOf(c, sid) { const a = c.away && c.away[sid]; return a && (a.from || a.to) ? a : null; }
function isAway(c, sid, date) { const a = awayOf(c, sid); if (a && date && (!a.from || date >= a.from) && (!a.to || date <= a.to)) return true;
  /* Gast nur für einen Zeitraum da: außerhalb davon wie abwesend */
  const g = guestOf(c, sid); return !!(g && date && ((g.from && date < g.from) || (g.to && date > g.to))); }
function guestTag(c, s) { return s.guest ? `<span class="guestTag${s.guest.counts === false ? ' off' : ''}" title="${esc(guestText(s.guest))}">Gast</span>` : ''; }
function awayLabel(c, sid) { const a = awayOf(c, sid); if (a) return awayText(a); const g = guestOf(c, sid); return g ? guestText(g) + ' – in diesem Zeitraum nicht da' : ''; }
function guestOf(c, sid) { const s = (c.students || []).find(x => x.id === sid); return s && s.guest ? s.guest : null; }
function guestText(g) { return `Gast${g.from || g.to ? ' ' + (g.from ? 'ab ' + fdate(g.from) : '') + (g.to ? ' bis ' + fdate(g.to) : '') : ''} · Noten ${g.counts === false ? 'zählen nicht (nur dokumentiert)' : 'zählen'}${g.note ? ' · ' + g.note : ''}`.replace(/\s+/g, ' '); }
function awayText(a) { return `abwesend ${a.from ? 'ab ' + fdate(a.from) : ''}${a.to ? ' bis ' + fdate(a.to) : ''}${a.reason ? ' (' + a.reason + ')' : ''}`.replace(/\s+/g, ' '); }
/* ---- Kursliste: drei Ansichten (nur Darstellung; gespeichert wird allein die Wahl) ---- */
function courseViewMode() { const v = D.settings.courseView; return v === 'c' || v === 'e' ? v : 'b'; }
function courseLabel(x) { return upper(x) ? (x.seminar ? 'W-Seminar · Abitur ' + semAbi(x) : 'Oberstufe ' + x.grade) : 'Jgst. ' + x.grade; }
function courseCmp(a, b) { return (+a.grade || 0) - (+b.grade || 0) || a.name.localeCompare(b.name, 'de', { numeric: true }); }
/* Eingetragene Ergebnisse bis heute: reine Zählung (Leistungsnachweise ab morgen und abwesende Schüler zählen nicht) */
function courseFill(x) {
  const t = todayISO(); let have = 0, all = 0;
  x.assessments.forEach(a => {
    if (a.date && a.date > t) return;
    x.students.forEach(s => { if (isAway(x, s.id, a.date) || !R.counted(s)) return; all++; if (a.results && a.results[s.id]) have++; });
  });
  return { have, all };
}
/* Gruppen der Kursliste: Oberstufe = Jgst. 11–13 (G9); Seminare (W und P) eigens */
const COURSE_GROUPS = [['u', 'Unter- und Mittelstufe'], ['o', 'Oberstufe'], ['s', 'Seminare']];
const courseGroup = x => (x.seminar || isPSem(x) ? 's' : +x.grade >= 11 ? 'o' : 'u');
const courseBadge = x => (x.seminar ? 'WS' : isPSem(x) ? 'PS' : upper(x) ? 'Q' + x.grade : String(x.grade));
const courseSub = x => { const f = (x.seminar ? semLeit(x) : x.subject || '').trim() || 'Ohne Fach';
  return x.seminar ? `${f} · Abitur ${semAbi(x)}` : `${f} · ${x.students.length} Schüler`; };
function courseListHtml(cv) {
  const warnDot = x => R.courseWarnings(x).length > 0 ? '<span class="warnDot" title="Hinweis"></span>' : '';
  const hint = 'Doppelklick: Kurs bearbeiten · Rechtsklick: Menü';
  const subj = x => (x.subject || 'Ohne Fach').trim();
  const attrs = x => `data-course="${x.id}" aria-current="${x.id === UI.course}" title="${hint}" style="--hue:var(${hueOf(x.subject)})"`;
  if (cv === 'c') {
    const subjects = [...new Set(D.courses.map(subj))].sort((a, b) => a.localeCompare(b, 'de'));
    if (UI.csubj && !subjects.includes(UI.csubj)) UI.csubj = null;
    const tabs = `<div class="ctabs">${['', ...subjects].map(s => `<button class="ctab${(UI.csubj || '') === s ? ' on' : ''}" data-csubj="${esc(s)}">${s ? esc(s) : 'Alle'}</button>`).join('')}</div>`;
    return tabs + D.courses.filter(x => !UI.csubj || subj(x) === UI.csubj).sort(courseCmp)
      .map(x => `<button class="citem plain" ${attrs(x)}><span class="t">${esc(x.name)}<small>${esc(courseLabel(x))} · ${x.students.length} Schüler</small></span>${warnDot(x)}</button>`).join('');
  }
  if (cv === 'e') {
    return `<div class="ccards">` + D.courses.slice().sort(courseCmp).map(x => {
      const f = courseFill(x), p = f.all ? Math.round(100 * f.have / f.all) : 0;
      const tip = f.all ? `${f.have} von ${f.all} Ergebnissen bis heute eingetragen` : 'Noch keine Leistungsnachweise bis heute';
      return `<button class="citem card" ${attrs(x)}><span class="t">${esc(x.name)}${warnDot(x)}<small>${esc(subj(x))} · ${x.students.length} Schüler</small></span><span class="fill" title="${tip}"><i style="width:${p}%"></i></span></button>`;
    }).join('') + `</div>`;
  }
  return COURSE_GROUPS.map(([k, g]) => { const cs = D.courses.filter(x => courseGroup(x) === k).sort(courseCmp); return cs.length ? `<div class="cgroup">${g}</div>` + cs.map(x => {
    return `<button class="citem stripe" ${attrs(x)}><span class="badge neu">${esc(courseBadge(x))}</span><span class="t">${esc(x.name)}<small>${esc(courseSub(x))}</small></span>${warnDot(x)}</button>`;
  }).join('') : ''; }).join('');
}
function renderGrades() {
  const main = $('#main');
  if (!D.courses.length) {
    renderSide();
    main.innerHTML = `${backupNotice() ? `<div class="notices">${backupNotice()}</div>` : ''}<div class="empty glass"><div><strong>Noch keine Kurse</strong><p>Lege für jede Klasse bzw. jeden Kurs, den du unterrichtest, einen Kurs an – z. B. „9F Englisch“ oder „Q13 Italienisch“. Schülerlisten kannst du einfügen oder aus Excel übernehmen.</p><button class="go" data-act="newCourse">Ersten Kurs anlegen</button></div></div>`;
    return;
  }
  if (!course()) UI.course = D.courses[0].id;
  const c = course();
  /* Kursliste gruppiert */
  if (upper(c) && UI.termFor !== c.id) { UI.term = pickTerm(c); UI.termFor = c.id; }
  renderSide();
  main.innerHTML = `<section id="work">${courseView(c)}</section>`;
  bindGrid(c);
}

function infoPanel(c) {
  const lines = [];
  if (!upper(c)) {
    if (c.hasSA) {
      const nSA = c.assessments.filter(a => a.type === 'sa').length, m = R.minSA(c);
      lines.push(['Schulaufgaben', `${nSA} eingetragen${c.saPlanned ? ' · ' + c.saPlanned + ' geplant' : ''}${m ? ' · mind. ' + m : ''}`]);
      const r = R.saRatio(c); lines.push(['Gewichtung', `groß : klein = ${r}:1 ${c.ratio && c.ratio !== 'auto' ? '(manuell)' : '(§ 28 GSO)'}`]);
    } else lines.push(['Schulaufgaben', 'keine – Note nur aus kleinen LN']);
    if (isPSem(c)) lines.push(['P-Seminar', 'mind. zwei kleine LN, v. a. individuelle Projektbeiträge (§ 21 Abs. 2 GSO); Note = Jahresfortgangsnote (§ 20 GSO)']);
    lines.push(['Kleine LN', c.smallMode === 'areas' ? 'nach Bereichen (schriftlich/mündlich/praktisch)' : 'gewichteter Durchschnitt']);
  } else {
    if (c.seminar) {
      const cf = semCfg(c);
      lines.push(['Kurs', `W-Seminar 12/1 bis 13/1 · Abitur ${semAbi(c)}`]);
      if (cf.rahmen) lines.push(['Rahmenthema', cf.rahmen]);
      lines.push(['12/1 und 12/2', 'Halbjahresleistung = Ø der kleinen LN, mindestens zwei je Halbjahr, keine Schulaufgabe (§ 21, § 29 GSO)']);
      lines.push(['Seminararbeit', '(2 × Arbeit + Prüfungsgespräch) × 2/3, gerundet, max. 30 Punkte (§ 29 Abs. 6 GSO)']);
      lines.push(['Abgabe', cf.deadline ? wdate(cf.deadline) + (cf.deadlineTime ? ', ' + cf.deadlineTime + ' Uhr' : '') : 'noch nicht eingetragen (spätestens 2. Unterrichtstag im November, Jgst. 13)']);
    } else lines.push(['Stufe', `Qualifikationsphase ${c.grade}`]);
    if (!c.seminar) lines.push(['Art', c.lf ? 'Leistungsfach / mit Schulaufgabe in 13/2' : 'Halbjahresleistung: SA und Ø kleine LN 1:1']);
    if (+c.grade === 13 && !c.seminar) lines.push(['13/2', R.termHasSA(c, '13/2') ? 'mit Schulaufgabe' : 'nur kleine LN (§ 29 GSO)']);
  }
  return `<h2 class="ptitle">Regeln für diesen Kurs</h2><div class="meta" style="flex-direction:column;gap:6px">${lines.map(([k, v]) => `<div><b>${esc(k)}:</b> ${esc(v)}</div>`).join('')}</div>
    <p class="note">Kürzel in der Tabelle: <b>E</b> entschuldigt (Nachtermin) · <b>B</b> befreit · <b>N</b> Note 6 (versäumt/verweigert) · <b>U</b> Unterschleif. Tendenzen wie 2+ werden angezeigt, gerechnet wird mit ganzen Noten.</p>`;
}

function scopeOf(c) {
  if (upper(c)) return { term: UI.term && R.termsOf(c).includes(UI.term) ? UI.term : null };
  if (UI.scope === 'half') return { until: D.settings.half1End || '9999' };
  if (UI.scope === 'until') return { until: UI.until || todayISO() };
  return null;
}
/* Festgelegte Zeugnisnote gilt für einen Zeitraum: Jahreszeugnis (c.overrides) oder Zwischenzeugnis/Notenbild (c.ovHalf).
   Ältere Festlegungen ohne Zeitraum (bis 1.0.9) gelten wie bisher für beide; bei „bis heute“ zählt keine Festlegung. */
const ovKind = () => UI.scope === 'half' ? 'half' : UI.scope === 'until' ? 'until' : 'year';
function ovOf(c, sid) {
  const k = ovKind(), y = c.overrides && c.overrides[sid];
  if (k === 'until') return null;
  if (k === 'half') return (c.ovHalf && c.ovHalf[sid]) || (y && !y.scope ? y : null);
  return y || null;
}
function visibleAssessments(c) {
  const sc = scopeOf(c);
  const as = c.assessments.slice().sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
  if (upper(c)) return sc.term ? as.filter(a => a.term === sc.term) : as;
  return as.filter(a => R.inScope(a, sc));
}
let HINTS = [];
/* Marke anklicken: Erklärung klappt darunter auf (erneut klicken, Esc oder Klick daneben schließt) */
function closeHint() { const p = document.getElementById('hintPop'); if (p) p.remove(); $$('.hchip[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false')); }
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-hint]');
  if (!b) { if (!e.target.closest || !e.target.closest('#hintPop')) closeHint(); return; }
  const was = b.getAttribute('aria-expanded') === 'true'; closeHint(); if (was) return;
  const h = HINTS[+b.dataset.hint]; if (!h) return;
  b.setAttribute('aria-expanded', 'true');
  const pop = document.createElement('div'); pop.id = 'hintPop'; pop.className = 'hintPop'; pop.setAttribute('role', 'note'); pop.innerHTML = h.html;
  b.parentNode.appendChild(pop);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.getElementById('hintPop')) closeHint(); });
function courseView(c) {
  const sorted = c.students;
  /* Selten und wichtig bleibt als Balken (nicht unterstützte Version, Update, fehlgeschlagene Sicherung); alles andere wird zur kleinen Marke rechts über der Tabelle */
  const notices = [betaNotice(), updateNotice(), ST.lastLocalError ? backupNotice0() : '', deadlineNotice(c)];
  const hints = [];
  const warns = R.courseWarnings(c);
  if (warns.length) hints.push({ cls: '', short: warns.length === 1 ? '1 Hinweis' : warns.length + ' Hinweise', html: warns.map(w => `<p style="margin:0 0 6px">${esc(w.text)}</p>`).join('') });
  const conf = upper(c) ? [] : classesOf(c).flatMap(cls => R.dateConflicts(classBigDates(cls)).map(cf => classesOf(c).length > 1 ? { ...cf, text: `Klasse ${cls}: ${cf.text}` } : cf));
  if (conf.length) hints.push({ cls: '', short: 'Termin prüfen', html: `<b>Termin prüfen (§ 22 GSO)</b>` + conf.map(cf => `<p style="margin:6px 0 0">${esc(cf.text)}</p>`).join('') });
  const openN = c.assessments.reduce((n, a) => n + Object.values(a.results || {}).filter(r => r && r.status === 'ent').length, 0);
  if (openN) hints.push({ cls: 'info', short: openN === 1 ? '1 Nachtermin offen' : openN + ' Nachtermine offen', html: `<b>${openN} Nachtermin(e) offen</b> – in der Tabelle mit „E“ markiert. Note einfach überschreiben, sobald nachgeschrieben – sie wird dann als Nachtermin (NT) markiert: zählt für die Person, aber nicht im Notenspiegel/Ø der Arbeit.` });
  HINTS = hints;
  const chips = hints.length ? `<div class="hintChips" id="hintChips">${hints.map((h, i) => `<button type="button" class="hchip ${h.cls}" data-hint="${i}" aria-expanded="false"><i></i>${esc(h.short)}</button>`).join('')}</div>` : '';
  let scope = '';
  if (upper(c)) {
    const terms = R.termsOf(c), cur = UI.term && terms.includes(UI.term) ? UI.term : null;
    const semB = c.seminar ? `<button data-term="${SEM_TAB}" aria-pressed="${isSemTab(c)}">Seminararbeit</button>` : '';
    scope = `<div class="scopeBar"><div class="seg">${terms.map(t => `<button data-term="${t}" aria-pressed="${cur === t}">${t}</button>`).join('')}${semB}<button data-term="" aria-pressed="${!cur && !isSemTab(c)}">Übersicht</button></div>${chips}</div>`;
  } else {
    scope = `<div class="scopeBar"><div class="seg"><button data-scope="year" aria-pressed="${UI.scope === 'year'}">Ganzes Schuljahr</button><button data-scope="half" aria-pressed="${UI.scope === 'half'}">Stand Zwischenzeugnis</button><button data-scope="until" aria-pressed="${UI.scope === 'until'}">Stand bis Datum</button></div>
      ${UI.scope === 'until' ? `<input type="date" id="untilDate" value="${UI.until || todayISO()}">` : ''}${UI.scope === 'half' && !D.settings.half1End ? '<span class="hint warnHint">Stichtag fürs Halbjahr in den Einstellungen festlegen</span>' : UI.scope === 'half' ? `<span class="hint">bis ${fdate(D.settings.half1End)}</span>` : ''}${chips}</div>`;
  }
  const semT = isSemTab(c);
  return `<div class="courseHead"><h2>${esc(c.name)} · ${esc(c.subject)}<small>${c.seminar ? 'W-Seminar 12/1–13/1 · Abitur ' + semAbi(c) : c.psem ? 'P-Seminar · Oberstufe, Jahrgangsstufe ' + c.grade : upper(c) ? 'Qualifikationsphase ' + c.grade : +c.grade === 11 ? 'Oberstufe · Jahrgangsstufe 11' : 'Jahrgangsstufe ' + c.grade} · ${c.students.length} Schüler${isMixed(c.students) ? ' aus ' + esc(groupsOf(c).filter(g => g.key).map(g => g.students[0].cls.trim()).join(', ')) : ''}${c.hours ? ' · ' + c.hours + ' Wochenstunden' : ''}${(() => { const L = courseDeadlines(c); if (!L.length) return ''; const x = nextDeadlines(c)[0]; return ` · <button type="button" class="dlChip ${x && dlDays(x) <= 7 ? 'soon' : ''}" data-act="courseDeadlines" title="Alle Fristen dieses Kurses">${x ? 'Nächste Frist: ' + esc(dlTitle(x)) + ', ' + sdate(dlDue(x)) : 'Fristen'}</button>`; })()}</small></h2>
      <div class="headBtns">${semT ? '' : '<button class="mini accent" data-act="newAssessment">+ Leistungsnachweis</button>'}<button class="mini" data-act="editCourse">Kurs &amp; Schüler</button>${semT ? '' : '<button class="mini" data-act="transfer" title="Welche Noten sind schon ins Notenprogramm der Schule übertragen?">Übertrag</button>'}<button class="mini" data-act="print">Drucken &amp; Export</button><button class="mini" data-act="rules" title="Regeln und Kürzel für diesen Kurs">Regeln</button></div></div>
    ${notices.some(Boolean) ? `<div class="notices">${notices.filter(Boolean).join('')}</div>` : ''}${scope}
    ${sorted.length && semT ? semView(c) : sorted.length ? `<div class="gridWrap glass">${upper(c) && !scopeOf(c).term ? upperOverview(c) : gridTable(c)}</div>
      <div class="legend"><span><b>Enter</b> / <b>Tab</b> nächste Zeile</span><span><b>←→↑↓</b> bewegen</span><span><b>E</b> Nachtermin</span><span><b>B</b> befreit</span><span><b>N</b> Note 6 (§ 26 Abs. 4)</span><span><b>U</b> Unterschleif</span><span>Spaltenkopf anklicken = bearbeiten, Notenspiegel, drucken</span></div>`
      : `<div class="empty glass" style="min-height:260px"><div><strong>Noch keine Schüler</strong><p>Füge die Namensliste ein oder übernimm sie aus Excel.</p><button class="go" data-act="editCourse">Schüler eintragen</button></div></div>`}`;
}
/* § 22 Abs. 4 Satz 2 GSO betrifft große schriftliche LN – mündliche Schulaufgaben (Titel „mündlich“) zählen hier nicht mit */
function classBigDates(cls) {
  const own = D.courses.filter(c => !upper(c) && classesOf(c).includes(cls)).flatMap(c => c.assessments.filter(a => R.isBig(a) && a.date && !/m(ü|ue)ndl/i.test(a.title || '')).map(a => ({ date: a.date, label: `${c.subject} (${a.title || R.TYPES[a.type].label})` })));
  const other = D.classDates.filter(x => x.cls === cls).map(x => ({ date: x.date, label: x.subject + ' (eingetragen)' }));
  return own.concat(other);
}

/* ---------- Übertrag (ins Notenprogramm der Schule, z. B. Infoportal) ----------
   c.xfer = { '<LN-ID>|<Schüler-ID>': '2+', 'e|<Einzelnote-ID>': '3' } merkt sich, welcher Wert übertragen wurde.
   Ändert sich die Note danach, weicht der Wert ab → „geändert“. Die Noten selbst bleiben unberührt. */
const xKeyA = (a, sid) => a.id + '|' + sid;
const xKeyE = e => 'e|' + e.id;
const xSig = (c, r) => (!r || r.status === 'ent' || r.status === 'bef') ? '' : R.cellText(r, upper(c));
function xState(c, key, r) { const s = xSig(c, r); if (!s) return null; const x = c.xfer && c.xfer[key]; return x == null ? 'open' : x === s ? 'done' : 'changed'; }
function xMark(c, key, r) { const s = xSig(c, r); c.xfer = c.xfer || {}; if (s) c.xfer[key] = s; }
/* Zustand eines Leistungsnachweises: 'done' (alles übertragen) · 'part' (nach dem Übertrag geändert oder ergänzt) · 'open' (noch nichts) · null (keine Noten) */
function xAssess(c, a) {
  const st = c.students.map(s => xState(c, xKeyA(a, s.id), a.results && a.results[s.id])).filter(Boolean);
  if (!st.length) return null;
  if (st.every(x => x === 'done')) return 'done';
  return st.every(x => x === 'open') ? 'open' : 'part';
}
const xMarkHTML = st => st === 'done' ? '<em class="xm" title="übertragen">✓</em>' : st === 'part' ? '<em class="xm dot" title="nach dem Übertrag geändert oder ergänzt – Nachtrag nötig">●</em>' : '';

/* ---------- Notentabelle ---------- */
function colHead(c, a, i) {
  const T = R.TYPES[a.type], up = upper(c);
  const big = R.isBig(a);
  const w = big ? (a.bigWeight && +a.bigWeight !== 1 ? wLabel(a.bigWeight) : '') : (R.weightOf(a, c) !== 1 ? '×' + String(R.weightOf(a, c)).replace('.', ',') : '');
  return `<th class="${i === 0 ? 'sep' : ''}"><button class="colhead" data-edit="${a.id}" title="${esc((a.title || T.label) + (a.date ? ' · ' + fdate(a.date) : ''))}"><b>${esc(a.short || T.short)}</b><small>${a.date ? sdate(a.date) : '–'}${up && !UI.term ? ' ' + a.term : ''}</small>${w ? `<i>${w}</i>` : ''}${up && R.upperFormula(c) === 'sportlf' && !big && a.type !== 'prak' ? (R.sportPart(a) === 't' ? '<i title="Sporttheorie">Th</i>' : '<i title="Fach Sport">FS</i>') : ''}${R.byTask(a) ? '<i>Aufg.</i>' : R.byParts(a) ? '<i>Teile</i>' : a.usePoints ? '<i>Pkt.</i>' : ''}${xMarkHTML(xAssess(c, a))}</button></th>`;
}
function cellHTML(c, a, s) {
  const r = a.results && a.results[s.id], up = upper(c), tk = R.byTask(a) || R.byParts(a);
  let txt = a.usePoints && r && !r.status && r.raw != null ? String(r.raw).replace('.', ',') : R.cellText(r, up);
  if (tk && r && !r.status && r.raw == null && r.v == null && ((r.pts && Object.keys(r.pts).length) || (r.pp && Object.keys(r.pp).length))) txt = '…';   /* Aufgabenpunkte noch nicht vollständig */
  const cls = r && r.status ? (r.status === 'n6' || r.status === 'us' ? 'st n6' : 'st') : (r && r.nt ? 'nt' : '');
  /* Punkte-Spalten: groß die Note (bzw. Notenpunkte), klein darunter die erreichten Punkte; beim Bearbeiten wieder die Punkte groß (nur CSS, Wert bleibt die Punktzahl) */
  const pv = a.usePoints && r && !r.status && r.v != null && txt !== '…';
  const sub = pv ? `<span class="rawpts" aria-hidden="true">${up ? r.v : r.v + (r.tend || '')}</span>` : '';
  const aw = !r && isAway(c, s.id, a.date);
  const xs = xState(c, xKeyA(a, s.id), r);
  const ntAttr = r && r.nt && !r.status ? ' title="Nachtermin – zählt für die Person, nicht im Notenspiegel/Ø der Arbeit"' : '';
  const tkAttr = tk ? ` readonly data-tk="1"${aw ? '' : ' placeholder="…"'} title="${R.byParts(a) ? (a.alt ? 'Übersetzung und Aufgabenteil' : 'Prüfungsteile') : 'Punkte je Aufgabe'} – Klick oder Enter zum Eintragen${r && r.exact != null && !r.status ? ' · genau ' + String(r.exact).replace('.', ',') : ''}"` : '';
  return `<td class="${xs === 'done' ? 'xd' : xs === 'changed' ? 'xc' : ''}${pv ? ' pvc' : ''}"${xs === 'done' ? ' title="übertragen"' : xs === 'changed' ? ' title="nach dem Übertrag geändert – Nachtrag nötig"' : ''}><input class="cell ${cls} ${a.usePoints ? 'pts' : ''} ${pv ? 'pv' : ''} ${tk ? 'tk' : ''} ${aw ? 'away' : ''}" data-a="${a.id}" data-s="${s.id}"${ntAttr} value="${esc(txt)}" ${aw ? 'placeholder="abw." title="' + esc(awayLabel(c, s.id)) + '"' : ''}${tkAttr} autocomplete="off" spellcheck="false" inputmode="${up ? 'numeric' : 'text'}">${sub}</td>`;
}
function gradeBadge(sug, ov) {
  if (ov) return `<span class="gb g${ov} ov" title="Von dir festgelegt">${ov}</span>`;
  if (!sug) return '<span class="hint">–</span>';
  if (sug.grade == null) return `<span class="gb border" title="Genau x,5 – pädagogische Entscheidung">${sug.text}</span>`;
  return `<span class="gb g${sug.grade}">${sug.grade}</span>`;
}
function pointsBadge(p) { if (p == null) return '<span class="hint">–</span>'; return `<span class="gb g${R.POINT_GRADE(p)}" title="entspricht ${R.POINT_LABEL(p)}">${p}</span>`; }
function summaryCells(c, s) {
  if (upper(c)) {
    const t = scopeOf(c).term; const r = R.computeTerm(c, s.id, t);
    const flag = r.zero ? '<span class="flag red" title="0 Punkte – Kurs gilt als nicht belegt"></span>' : r.under5 ? '<span class="flag warn" title="unter 5 Punkten"></span>' : '';
    if (r.formula === 'sportlf') return `<td class="sum sep" data-sum="sa" title="${r.fsRaw != null ? 'ungerundet ' + fmt(r.fsRaw, 2) : ''}">${r.fs ?? '–'}</td><td class="sum" data-sum="sm" title="${r.thRaw != null ? 'ungerundet ' + fmt(r.thRaw, 2) : ''}">${r.th ?? '–'}</td><td class="sum main">${fmt(r.raw, 1)}</td><td class="res">${R.counted(s) ? pointsBadge(r.points) + flag : '<span class="gb border" title="Gast – Noten zählen nicht">Gast</span>'}${r.note ? `<span class="flag warn" title="${esc(r.note)}"></span>` : ''}${r.open.length ? '<span class="flag info" title="Nachtermin offen"></span>' : ''}</td>`;
    return `<td class="sum sep" data-sum="sa">${R.termHasSA(c, t) || r.formula === 'sport' ? fmt(r.sa, r.formula === 'sport' ? 2 : 1) : '·'}</td><td class="sum" data-sum="sm">${fmt(r.small, 2)}</td><td class="sum main">${fmt(r.raw, 2)}</td><td class="res">${R.counted(s) ? pointsBadge(r.points) + flag : '<span class="gb border" title="Gast – Noten zählen nicht">Gast</span>'}${r.open.length ? '<span class="flag info" title="Nachtermin offen"></span>' : ''}</td>`;
  }
  const r = R.computeLower(c, s.id, scopeOf(c));
  const ov = ovOf(c, s.id) && ovOf(c, s.id).grade;
  const ng = c.noGrade && c.noGrade[s.id];
  if (!R.counted(s)) return `${c.hasSA ? `<td class="sum">${fmt(r.saAvg)}</td>` : ''}<td class="sum">${fmt(r.smAvg)}</td><td class="sum main sep">${fmt(r.total)}</td><td class="res"><span class="gb border" title="Gast – Noten zählen nicht, keine Zeugnisnote">Gast</span></td>`;
  if (ng) return `${c.hasSA ? `<td class="sum">${fmt(r.saAvg)}</td>` : ''}<td class="sum">${fmt(r.smAvg)}</td><td class="sum main sep">${fmt(r.total)}</td><td class="res"><span class="gb border" title="${esc('Ohne Note' + (ng.reason ? ': ' + ng.reason : ''))}">o. N.</span></td>`;
  const ws = R.studentWarnings(c, s.id, r);
  const flag = ws.some(w => w.level === 'warn') ? `<span class="flag warn" title="${esc(ws.map(w => w.text).join(' · '))}"></span>` : r.open.length ? '<span class="flag info" title="Nachtermin offen"></span>' : '';
  return `${c.hasSA ? `<td class="sum">${fmt(r.saAvg)}</td>` : ''}<td class="sum">${fmt(r.smAvg)}</td><td class="sum main sep">${fmt(r.total)}</td><td class="res">${gradeBadge(r.suggestion, ov)}${flag}</td>`;
}
/* Einzelnoten: eigene Spalte mit Datum je Note (z. B. Unterrichtsbeiträge, Abfragen einzelner Schüler) */
const ENTRY_TYPES = ['ub', 'ra', 'ref', 'stex', 'ka', 'prak', 'proj', 'sonst'];
function entScope(c) { return upper(c) ? { term: scopeOf(c).term } : scopeOf(c); }
function entriesOf(c, sid, sc = entScope(c)) { return (c.entries || []).filter(e => e.sid === sid && R.inScope(e, sc)).sort((a, b) => (a.date || '').localeCompare(b.date || '')); }
function entCell(c, s) {
  const up = upper(c);
  const chips = entriesOf(c, s.id).map(e => `<button class="echip ${e.status ? 'st' : ''} ${{ done: 'xd', changed: 'xc' }[xState(c, xKeyE(e), e)] || ''}" data-ent="${s.id}" title="${esc(R.TYPES[e.type].label + (e.date ? ' · ' + fdate(e.date) : '') + (e.note ? ' · ' + e.note : ''))}">${esc(R.cellText(e, up))}</button>`).join('');
  return `<td class="ent sep"><div class="ents">${chips}<input class="cell entq" data-eq="${s.id}" placeholder="+" autocomplete="off" title="Note tippen + Enter = neue Einzelnote mit heutigem Datum"></div></td>`;
}
/* Zwischenzeile je Klasse (nur bei Kursen aus mehreren Klassen) */
function clsRow(g, nCols) { return g.label ? `<tr class="clsRow"><td class="nm"><span>${esc(g.label)}</span><small>${g.students.length} Schüler</small></td><td colspan="${nCols}"></td></tr>` : ''; }
function gridTable(c) {
  const as = visibleAssessments(c), up = upper(c);
  const big = as.filter(a => R.isBig(a)), small = as.filter(a => !R.isBig(a));
  const showBig = up ? R.termHasSA(c, scopeOf(c).term) || big.length : c.hasSA;
  const hdrBig = showBig ? big.map((a, i) => colHead(c, a, i)).join('') : '';
  const hdrSmall = small.map((a, i) => colHead(c, a, showBig ? 1 : i)).join('') + `<th class="sep"><button class="colhead" data-entcfg="1" title="Einzelnoten mit eigenem Datum je Schüler – z. B. Unterrichtsbeiträge oder Abfragen. Note tippen + Enter."><b>Einzeln</b><small>${esc(R.TYPES[c.entryType || 'ub'].short)} · mit Datum</small></button></th>`;
  let grp, sumHead;
  /* Halbjahr ohne Schulaufgabe (W-Seminar, 13/2 im gA-Kurs): Spalte „Ø SA“ ausblenden – sie wäre immer leer */
  const noSA = up && !R.termHasSA(c, scopeOf(c).term) && !R.upperFormula(c) && !big.length;
  if (up) {
    grp = `<tr class="grp"><th class="nm" rowspan="2" style="padding-left:14px;text-align:left">Name</th>${showBig ? `<th class="gBig sep" colspan="${Math.max(1, big.length)}">Schulaufgabe</th>` : ''}<th class="gSmall sep" colspan="${small.length + 1}">Kleine Leistungsnachweise</th><th class="gSum sep" colspan="${noSA ? 3 : 4}">Halbjahresleistung ${esc(scopeOf(c).term)}</th></tr>`;
    sumHead = R.upperFormula(c) === 'sportlf' ? `<th class="sep" title="(2 × Ø praktische Leistungen + Ø kleine LN des Fachs Sport) ÷ 3, gerundet (KMBek Sport Q12/13 Nr. 1.2.1)">Fach Sport</th><th title="(Schulaufgabe + Ø kleine LN) ÷ 2, gerundet (§ 29 Abs. 2 GSO)">Sport&shy;theorie</th><th title="(Fach Sport + Sporttheorie) ÷ 2">Ergebnis</th><th>Punkte</th>` : R.upperFormula(c) === 'sport' ? `<th class="sep" title="Durchschnitt der praktischen Leistungen im Handlungsfeld – zählt doppelt (§ 29 Abs. 5 GSO)">Ø prakt. ×2</th><th>Ø klein</th><th>Ergebnis</th><th>Punkte</th>` : `<th class="sep hSA">Ø SA</th><th class="hSm">Ø klein</th><th>Ergebnis</th><th>Punkte</th>`;
  } else {
    grp = `<tr class="grp"><th class="nm" rowspan="2" style="padding-left:14px;text-align:left">Name</th>${showBig ? `<th class="gBig sep" colspan="${Math.max(1, big.length)}">Große LN</th>` : ''}<th class="gSmall sep" colspan="${small.length + 1}">Kleine LN</th><th class="gSum sep" colspan="${c.hasSA ? 4 : 3}">Ergebnis</th></tr>`;
    sumHead = `${c.hasSA ? '<th class="sep">Ø groß</th>' : ''}<th class="${c.hasSA ? '' : 'sep'}">Ø klein</th><th class="sep">Ø gesamt</th><th>Zeugnis</th>`;
  }
  const emptyCol = '<th class="sep"><small class="hint" style="padding:0 10px">–</small></th>';
  const head = `<thead>${grp}<tr class="cols">${showBig ? (hdrBig || emptyCol) : ''}${hdrSmall}${sumHead}</tr></thead>`;
  const nCols = (showBig ? Math.max(1, big.length) : 0) + small.length + 1 + (up || c.hasSA ? 4 : 3) - (noSA ? 1 : 0);
  let nr = 0;
  const rows = groupsOf(c).map(g => clsRow(g, nCols) + g.students.map(s => `<tr data-row="${s.id}"><td class="nm"><button data-stu="${s.id}"><span class="nr">${++nr}</span>${esc(s.name)}${awayOf(c, s.id) ? `<span class="awayTag" title="${esc(awayText(awayOf(c, s.id)))}">abw.</span>` : ''}${guestTag(c, s)}${supTag(c, s.id)}</button></td>${showBig ? (big.length ? big.map(a => cellHTML(c, a, s)).join('') : '<td class="sep"></td>') : ''}${small.map(a => cellHTML(c, a, s)).join('')}${entCell(c, s)}${summaryCells(c, s)}</tr>`).join('')).join('');
  return `<table class="grid${noSA ? ' noSA' : ''}">${head}<tbody>${rows}</tbody><tfoot>${gridFoot(c)}</tfoot></table>`;
}
/* Fußzeile der Notentabelle: Durchschnitt der Klasse je Spalte – bleibt beim Rollen unten stehen und rechnet beim Eintragen mit */
function gridFoot(c) {
  const as = visibleAssessments(c), up = upper(c);
  const big = as.filter(a => R.isBig(a)), small = as.filter(a => !R.isBig(a));
  const showBig = up ? R.termHasSA(c, scopeOf(c).term) || big.length : c.hasSA;
  const col = a => { const d = R.distribution(a, c.students, up); return `<td title="${d.n} von ${c.students.filter(R.counted).length} mit ${up ? 'Punkten' : 'Note'}">${d.n ? fmt(d.avg, 2) : ''}</td>`; };
  const avg = (list, dg = 2) => { const v = list.filter(x => x != null); return v.length ? fmt(R.mean(v), dg) : ''; };
  let sum;
  if (up) { const t = scopeOf(c).term, rs = c.students.filter(R.counted).map(s => R.computeTerm(c, s.id, t));
    sum = `<td class="sum sep fSA">${R.termHasSA(c, t) || R.upperFormula(c) === 'sport' ? avg(rs.map(r => r.sa)) : ''}</td><td class="sum fSm">${avg(rs.map(r => r.small))}</td><td class="sum main">${avg(rs.map(r => r.raw))}</td><td class="res" title="Durchschnitt der Halbjahresleistungen">${avg(rs.map(r => r.points), 1)}</td>`;
  } else { const sc = scopeOf(c), rs = c.students.filter(s => !(c.noGrade && c.noGrade[s.id]) && R.counted(s)).map(s => R.computeLower(c, s.id, sc));
    sum = `${c.hasSA ? `<td class="sum">${avg(rs.map(r => r.saAvg))}</td>` : ''}<td class="sum">${avg(rs.map(r => r.smAvg))}</td><td class="sum main sep">${avg(rs.map(r => r.total))}</td><td class="res"></td>`;
  }
  return `<tr class="avgRow"><td class="nm"><span>Ø Klasse</span></td>${showBig ? (big.length ? big.map(col).join('') : '<td></td>') : ''}${small.map(col).join('')}<td class="ent sep"></td>${sum}</tr>`;
}
const refreshFoot = c => { const tf = $('#work table.grid tfoot'); if (tf) tf.innerHTML = gridFoot(c); };
function upperOverview(c) {
  const terms = R.termsOf(c);
  const sem = c.seminar;
  const head = `<thead><tr class="grp"><th class="nm" rowspan="2" style="padding-left:14px;text-align:left">Name</th><th class="gSum sep" colspan="${terms.length}">Halbjahresleistungen (Punkte)</th>${sem ? '<th class="gBig sep" colspan="3">Seminararbeit (§ 29 GSO)</th>' : ''}</tr>
    <tr class="cols">${terms.map((t, i) => `<th class="${i ? '' : 'sep'}" style="padding:6px 14px">${t}</th>`).join('')}${sem ? '<th class="sep" style="padding:6px 10px">Arbeit</th><th style="padding:6px 10px">Prüfungs-<br>gespräch</th><th style="padding:6px 10px">Gesamt (max. 30)</th>' : ''}</tr></thead>`;
  let nr = 0;
  const rows = groupsOf(c).map(g => clsRow(g, terms.length + (sem ? 3 : 0)) + g.students.map(s => {
    const sp = c.seminarPaper[s.id] || {};
    return `<tr><td class="nm"><button data-stu="${s.id}"><span class="nr">${++nr}</span>${esc(s.name)}${supTag(c, s.id)}</button></td>${terms.map((t, j) => { const r = R.computeTerm(c, s.id, t); if (!R.counted(s)) return `<td class="res ${j ? '' : 'sep'}"><span class="gb border" title="Gast – Noten zählen nicht">Gast</span></td>`; return `<td class="res ${j ? '' : 'sep'}">${pointsBadge(r.points)}${r.zero ? '<span class="flag red" title="0 Punkte – nicht belegt"></span>' : ''}</td>`; }).join('')}
      ${sem ? `<td class="sep"><input class="cell" data-sp="arbeit" data-s="${s.id}" value="${esc(sp.arbeit ?? '')}"></td><td><input class="cell" data-sp="gespraech" data-s="${s.id}" value="${esc(sp.gespraech ?? '')}"></td><td class="sum main" data-spsum="${s.id}">${R.seminarPaper(sp.arbeit, sp.gespraech) ?? '–'}</td>` : ''}</tr>`;
  }).join('')).join('');
  return `<table class="grid">${head}<tbody>${rows}</tbody></table>`;
}

function bindGrid(c) {
  const work = $('#work');
  work.querySelectorAll('[data-term]').forEach(b => b.onclick = () => { UI.term = b.dataset.term || null; UI.termFor = c.id; if (UI.term) { D.settings.lastTerm = D.settings.lastTerm || {}; D.settings.lastTerm[c.id] = UI.term; save(); } renderGrades(); });
  work.querySelectorAll('[data-scope]').forEach(b => b.onclick = () => { UI.scope = b.dataset.scope; renderGrades(); });
  const ud = work.querySelector('#untilDate'); if (ud) ud.onchange = () => { UI.until = ud.value; renderGrades(); };
  const cells = () => $$('.cell', work);
  work.addEventListener('focusin', e => { if (e.target.classList.contains('cell')) e.target.select(); });
  work.addEventListener('change', e => {
    const el = e.target; if (!el.classList.contains('cell')) return;
    if (el._gone) return; /* Zelle wird gerade neu gezeichnet: das Entfernen löst sonst ein zweites „change“ aus */
    if (READONLY) { el.value = el.defaultValue; return; }
    if (el.dataset.sp) { // Seminararbeit
      const v = el.value.trim(); const n = v === '' ? '' : +v;
      if (v !== '' && (!/^\d{1,2}$/.test(v) || n > 15)) { el.classList.add('bad'); setTimeout(() => el.classList.remove('bad'), 400); toast('Punkte 0–15'); el.value = ((c.seminarPaper[el.dataset.s] || {})[el.dataset.sp]) ?? ''; el.select(); return; }
      const sp = c.seminarPaper[el.dataset.s] = c.seminarPaper[el.dataset.s] || {}; sp[el.dataset.sp] = n; save();
      const td = work.querySelector(`[data-spsum="${el.dataset.s}"]`), stu = c.students.find(x => x.id === el.dataset.s);
      if (td) { if (td.closest('.semTbl')) td.innerHTML = semBadge(c, stu); else td.textContent = R.seminarPaper(sp.arbeit, sp.gespraech) ?? '–'; }
      const sc = work.querySelector(`[data-spstat="${el.dataset.s}"]`); if (sc) { const tmp = document.createElement('tr'); tmp.innerHTML = semStatusCell(c, stu); sc.replaceWith(tmp.firstElementChild); }
      return;
    }
    if (el.dataset.eq) { // neue Einzelnote
      const raw = el.value.trim(); if (!raw) return;
      const r = R.parseCell(raw, upper(c)); if (r.error) { bad(el, r.error + ' · Kürzel: E, B, N, U'); return; }
      const s = c.students.find(x => x.id === el.dataset.eq);
      c.entries = c.entries || [];
      const ne = { id: uid(), sid: s.id, type: c.entryType || 'ub', ...(c.entrySt && c.entryType !== 'prak' && R.upperFormula(c) === 'sportlf' ? { st: c.entrySt } : {}), date: upper(c) ? todayISO() : (UI.scope === 'until' && UI.until ? UI.until : todayISO()), ...(upper(c) ? { term: scopeOf(c).term } : {}), ...r };
      c.entries.push(ne);
      el.value = ''; save();
      toastAction(`Einzelnote ${R.cellText(ne, upper(c))} für ${s.name} eingetragen`, 'Rückgängig', () => { c.entries = (c.entries || []).filter(x => x.id !== ne.id); save(); render(); });
      const tr = el.closest('tr'), td = el.closest('td'); const tmp = document.createElement('tr'); tmp.innerHTML = entCell(c, s); el._gone = true; td.replaceWith(tmp.firstElementChild);
      $$('td.sum, td.res', tr).forEach(x => x.remove()); tr.insertAdjacentHTML('beforeend', summaryCells(c, s)); refreshFoot(c);
      return;
    }
    const a = c.assessments.find(x => x.id === el.dataset.a), sid = el.dataset.s, up = upper(c);
    a.results = a.results || {};
    const raw = el.value.trim();
    /* Stand vorher merken: wird eine vorhandene Note überschrieben oder gelöscht, lässt sich das sofort zurücknehmen */
    const prev = a.results[sid] ? JSON.parse(JSON.stringify(a.results[sid])) : null;
    const shown = r => !r ? '' : (a.usePoints && !r.status && r.raw != null ? String(r.raw).replace('.', ',') + ' P.' : R.cellText(r, up));
    const before = shown(prev);
    if (!raw) { const o = a.results[sid]; if (o && o.pts && Object.keys(o.pts).length) a.results[sid] = { pts: o.pts }; else delete a.results[sid]; }
    else if (a.usePoints && /^[0-9]+([.,][0-9]+)?$/.test(raw)) {
      const p = +raw.replace(',', '.');
      if (a.key && a.key.max && p > a.key.max) { bad(el, `Höchstens ${a.key.max} Punkte`); return; }
      if (a.key && a.key.preset === 'hv' && p !== Math.round(p)) { bad(el, 'Hörverstehen: nur ganze BE (ISB-Leitfaden 04/2025)'); return; }
      const kr = R.keyResult(p, a.key, up);
      if (kr == null) { bad(el, 'Erst Notenschlüssel festlegen (Spaltenkopf anklicken)'); return; }
      const keep = a.results[sid] && a.results[sid].pts ? { pts: a.results[sid].pts } : {};   /* Aufgabenpunkte bleiben erhalten */
      a.results[sid] = { ...keep, raw: p, rawMan: true, v: kr.v, ...(kr.tend ? { tend: kr.tend } : {}) };
    } else {
      const r = R.parseCell(raw, up);
      if (r.error) { bad(el, r.error + ' · Kürzel: E, B, N, U'); return; }
      a.results[sid] = a.results[sid] && a.results[sid].pts ? { pts: a.results[sid].pts, ...r } : r;
    }
    /* Nachtermin: Wer entschuldigt gefehlt hat (E) und jetzt eine Note bekommt, hat den Nachtermin geschrieben –
       die Note zählt für die Person, aber nicht im Notenspiegel / Durchschnitt der Arbeit */
    { const nr = a.results[sid]; if (nr && !nr.status && (nr.v != null || nr.raw != null) && prev && (prev.status === 'ent' || prev.nt)) { if (!nr.nt) { nr.nt = true; toast('Nachtermin: Die Note zählt für ' + c.students.find(x => x.id === sid).name + ', aber nicht im Notenspiegel und Ø der Arbeit (Kürzel NT)'); } } }
    save();
    const tr = el.closest('tr'), s = c.students.find(x => x.id === sid);
    const after = shown(a.results[sid]);
    if (before && before !== after) toastAction(`${s.name}: ${before} ${after ? '→ ' + after : 'gelöscht'}`, 'Rückgängig', () => { if (prev) a.results[sid] = prev; else delete a.results[sid]; save(); render(); }, 8000);
    const td = el.closest('td'); // Zelle neu zeichnen
    const tmp = document.createElement('tr'); tmp.innerHTML = cellHTML(c, a, s); const nc = tmp.firstElementChild; el._gone = true; td.replaceWith(nc);
    $$('td.sum, td.res', tr).forEach(x => x.remove());
    tr.insertAdjacentHTML('beforeend', summaryCells(c, s)); refreshFoot(c);
    const hb = work.querySelector(`.colhead[data-edit="${a.id}"]`); if (hb) { const o = hb.querySelector('.xm'); if (o) o.remove(); hb.insertAdjacentHTML('beforeend', xMarkHTML(xAssess(c, a))); } /* Haken/Punkt am Spaltenkopf nachziehen */
  });
  function bad(el, msg) { el.classList.add('bad'); setTimeout(() => el.classList.remove('bad'), 400); toast(msg); el.select(); }
  work.addEventListener('keydown', e => {
    const el = e.target; if (!el.classList || !el.classList.contains('cell')) return;
    const td = el.closest('td'), tr = td.closest('tr');
    const col = [...tr.children].indexOf(td);
    const moveRow = d => { let r = tr; do { r = d > 0 ? r.nextElementSibling : r.previousElementSibling; } while (r && (r.classList.contains('clsRow') || !r.children[col])); const n = r && r.children[col] && r.children[col].querySelector('.cell'); if (n) { el.dispatchEvent(new Event('change', { bubbles: true })); { const t = $(`.cell[data-a="${n.dataset.a}"][data-s="${n.dataset.s}"]`) || n; t.focus(); } } };   /* sofort weiter, damit kein Tastendruck verloren geht */
    const moveCol = d => { const list = cells().filter(x => x.closest('tr') === tr); const i = list.indexOf(el); const n = list[i + d]; if (n) n.focus(); };
    /* Tab wie im Infoportal: Tab = eine Zeile nach unten, Shift+Tab = nach oben; am Spaltenende in die nächste (vorherige) Spalte; ganz am Ende verlässt Tab die Tabelle wie gewohnt */
    const tabMove = back => {
      const d = back ? -1 : 1;
      let r = tr; do { r = d > 0 ? r.nextElementSibling : r.previousElementSibling; } while (r && (r.classList.contains('clsRow') || !r.children[col]));
      const n = r && r.children[col] && r.children[col].querySelector('.cell:not(.entq)');
      if (n) { el.dispatchEvent(new Event('change', { bubbles: true })); { const t = $(`.cell[data-a="${n.dataset.a}"][data-s="${n.dataset.s}"]`) || n; t.focus(); t.select && t.select(); } return true; }
      const all = cells().filter(x => !x.classList.contains('entq') && x.dataset.a);
      const keys = [...new Set(all.map(x => x.dataset.a))], k = keys.indexOf(el.dataset.a) + d;
      if (k < 0 || k >= keys.length) return false;
      const colCells = all.filter(x => x.dataset.a === keys[k]); const t0 = d > 0 ? colCells[0] : colCells[colCells.length - 1];
      if (!t0) return false;
      el.dispatchEvent(new Event('change', { bubbles: true })); { const t = $(`.cell[data-a="${t0.dataset.a}"][data-s="${t0.dataset.s}"]`) || t0; t.focus(); t.select && t.select(); } return true;
    };
    if (e.key === 'Enter' && el.classList.contains('tk')) { e.preventDefault(); taskSheet(c, c.assessments.find(x => x.id === el.dataset.a), el.dataset.s); }
    else if (e.key === 'Tab' && !e.ctrlKey && !e.altKey && !e.metaKey && !el.classList.contains('entq') && el.dataset.a) { if (tabMove(e.shiftKey)) e.preventDefault(); }
    else if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); moveRow(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveRow(-1); }
    else if (e.key === 'ArrowRight' && el.selectionStart === el.value.length) { e.preventDefault(); moveCol(1); }
    else if (e.key === 'ArrowLeft' && el.selectionStart === 0) { e.preventDefault(); moveCol(-1); }
    else if (e.key === 'Escape') { el.blur(); }
  });
  work.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => assessmentSheet(c, c.assessments.find(a => a.id === b.dataset.edit)));
  work.addEventListener('click', e => { const el = e.target.closest && e.target.closest('.cell.tk'); if (el) taskSheet(c, c.assessments.find(x => x.id === el.dataset.a), el.dataset.s); });
  work.querySelectorAll('[data-stu]').forEach(b => b.onclick = () => studentSheet(c, c.students.find(s => s.id === b.dataset.stu)));
  work.addEventListener('click', e => { const ch = e.target.closest('[data-ent]'); if (ch) entrySheet(c, c.students.find(s => s.id === ch.dataset.ent)); });
  const ec = work.querySelector('[data-entcfg]'); if (ec) ec.onclick = () => entryCfgSheet(c);
  work.addEventListener('click', e => { const b = e.target.closest('[data-semcard]'); if (b) semCard(c, c.students.find(s => s.id === b.dataset.semcard)); });
  const sc = work.querySelector('[data-semcfg]'); if (sc) sc.onclick = () => courseSheet(c);
  const spg = work.querySelector('[data-sempg]'); if (spg) spg.onclick = () => semPgSheet(c);
}

/* Allgemeine Aktionen */
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]'); if (b) {
    const a = b.dataset.act;
    if (a === 'newCourse') courseSheet();
    if (a === 'klassen') klassenSheet();
    if (a === 'deadlines') deadlineSheet();
    if (a === 'ldo') ldoSheet();
    if (a === 'courseDeadlines' && course()) courseDeadlineSheet(course());
    if (a === 'editCourse') courseSheet(course());
    if (a === 'newAssessment') assessmentSheet(course());
    if (a === 'transfer') transferSheet(course());
    if (a === 'print') printSheet(course());
    if (a === 'rules' && course()) sheet({ title: 'Regeln für ' + course().name, ok: '', cancel: 'Schließen', body: infoPanel(course()).replace(/^<h2 class="ptitle">[^<]*<\/h2>/, '') });
    if (a === 'pickDir') { ST = await N.chooseBackupDir(); render(); }
    if (a === 'backupNow') { const r = await N.backupNow(); ST = await N.status(); toast(bkMsg(r)); render(); }
  }
  closeCtx();
  const vw = e.target.closest('[data-cview]'); if (vw) { D.settings.courseView = vw.dataset.cview; save(); renderSide(); return; }
  const ts = e.target.closest('[data-csubj]'); if (ts) { UI.csubj = ts.dataset.csubj || null; renderSide(); return; }
  const ci = e.target.closest('[data-course]'); if (ci) { sidePeek(false); pickCourse(ci.dataset.course); }
});
/* Doppelklick auf einen Kurs: Kurs & Schüler öffnen. Rechtsklick: kleines Menü. */
function pickCourse(id) { const ch = id !== UI.course; if (ch) { UI.course = id; UI.termFor = null; rememberCourse(); } if (ch || UI.tab !== 'grades') { UI.tab = 'grades'; render(); } }
function closeCtx() { const m = document.getElementById('ctxMenu'); if (m) m.remove(); }
document.addEventListener('dblclick', e => {
  const ci = e.target.closest('.citem[data-course]'); if (!ci) return;
  pickCourse(ci.dataset.course); courseSheet(course());
});
document.addEventListener('contextmenu', e => {
  const ci = e.target.closest('.citem[data-course]'); if (!ci) return;
  e.preventDefault(); closeCtx(); pickCourse(ci.dataset.course);
  const m = document.createElement('div'); m.id = 'ctxMenu'; m.className = 'ctx'; m.setAttribute('role', 'menu');
  m.innerHTML = '<button role="menuitem" data-ctx="edit">Kurs bearbeiten …</button><button role="menuitem" data-ctx="rename">Umbenennen …</button>';
  document.body.appendChild(m);
  m.style.left = Math.max(4, Math.min(e.clientX, innerWidth - m.offsetWidth - 4)) + 'px';
  m.style.top = Math.max(4, Math.min(e.clientY, innerHeight - m.offsetHeight - 4)) + 'px';
  m.onclick = ev => {
    const b = ev.target.closest('[data-ctx]'); if (!b) return; ev.stopPropagation(); closeCtx();
    courseSheet(course());
    if (b.dataset.ctx === 'rename') setTimeout(() => { const i = document.getElementById('cName'); if (i) { i.focus(); i.select(); } }, 60);
  };
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCtx(); });
window.addEventListener('blur', closeCtx);

/* ======================================================================
   Kurs anlegen / bearbeiten
   ====================================================================== */
function courseSheet(c, pre) {
  const isNew = !c;
  c = c ? JSON.parse(JSON.stringify(c)) : { id: uid(), name: '', subject: '', grade: 9, hours: '', hasSA: true, saPlanned: '', ratio: 'auto', smallMode: 'flat', typeWeights: {}, areaWeights: { schriftlich: 1, 'mündlich': 1, praktisch: 1 }, lf: false, seminar: false, students: [], assessments: [], overrides: {}, notes: {}, seminarPaper: {} };
  if (isNew && pre) { Object.assign(c, pre.fields || {}); c.students = pre.students || []; } /* neuer Kurs aus einer theis-Klassen-Datei: Name, Fach, Namen vorbelegt, Rest wie bei „Neuer Kurs“ */
  const smallTypes = Object.entries(R.TYPES).filter(([k]) => k !== 'sa');
  const semC = c.sem || {}, semStart0 = +semC.start || (yearStart() - (+c.grade === 13 ? 1 : 0));
  const others = D.courses.filter(x => x.id !== c.id && x.students.length);
  let hueSel = (D.settings.hues || {})[subjKey(c.subject)] || '';
  const body = `
    <div class="grid3">
      ${field('Klasse / Kurs', `<input type="text" id="cName" value="${esc(c.name)}" placeholder="z. B. 9F oder Q13 E1" required>`)}
      ${field(c.seminar || isPSem(c) ? 'Leitfach' : 'Fach', `<input type="text" id="cSubj" value="${esc(isWSemName(c.subject) ? ((c.sem && c.sem.leit) || '') : /^p[\s-]?seminar$/i.test(String(c.subject || '').trim()) ? '' : c.subject)}" placeholder="z. B. Englisch" autocomplete="off" required>`)}
      ${field('Jahrgangsstufe', `<select id="cGrade">${[5, 6, 7, 8, 9, 10, 11, 12, 13].map(g => `<option ${+c.grade === g ? 'selected' : ''}>${g}</option>`).join('')}</select>`)}
    </div>
    <div class="field"><span>Farbe des Fachs</span><div class="swatches" id="cHue"><button type="button" class="swAuto" data-hue="" aria-pressed="${!hueSel}">automatisch</button>${HUES.map(h => `<button type="button" class="swatch" data-hue="${h}" style="--hue:var(${h})" title="${HUE_NAMES[h]}" aria-label="${HUE_NAMES[h]}" aria-pressed="${hueSel === h}"></button>`).join('')}</div></div>
    <div id="lowerOpts">
      <div class="grid3">
        ${field('Wochenstunden', `<input type="number" min="1" max="10" id="cHours" value="${esc(c.hours)}" placeholder="z. B. 4">`)}
        ${field('Geplante Schulaufgaben', `<input type="number" min="0" max="8" id="cPlanned" value="${esc(c.saPlanned)}" placeholder="z. B. 3">`)}
        ${field('Verhältnis groß : klein', `<select id="cRatio"><option value="auto">automatisch (§ 28 GSO)</option><option value="1:1" ${c.ratio === '1:1' ? 'selected' : ''}>1 : 1</option><option value="2:1" ${c.ratio === '2:1' ? 'selected' : ''}>2 : 1</option></select>`)}
      </div>
      <div class="rows">${sw('cHasSA', c.hasSA, 'Fach mit Schulaufgaben')}<div id="psemRow">${sw('cPsem', isPSem(c), 'P-Seminar (Projektseminar) – oben das Leitfach eintragen')}</div></div>
      <p class="hint" id="pHint" hidden><b>P-Seminar (Jahrgangsstufe 11):</b> keine Schulaufgaben, mindestens zwei kleine Leistungsnachweise, vor allem individuelle Projektbeiträge (§ 21 Abs. 2 GSO). Die Note gilt als Jahresfortgangsnote (§ 20 GSO) – Libretto rechnet sie wie ein Fach ohne Schulaufgaben.</p>
      <p class="hint">§ 28 GSO: bei zwei Schulaufgaben zählen große und kleine Leistungsnachweise 1:1, bei mehr als zwei 2:1. Mindestzahlen nach § 22 Abs. 1 GSO: Deutsch 3, Mathematik 4 (Jgst. 5–7) bzw. 3, Fremdsprachen 3 bzw. 4 ab vier Wochenstunden, übrige Fächer mit Schulaufgaben 2.</p>
    </div>
    <div id="lateRow"><div class="rows">${sw('cLate', !!c.late, 'Spät beginnende Fremdsprache')}</div><p class="hint" style="margin-top:4px">Spät beginnende Fremdsprachen werden auch in Q12/13 mit Bewertungseinheiten bewertet (Schreiben und Sprachmittlung mit Inhalt 4 + Sprache 6), nicht nach den Prüfungsteilen der fortgeführten Fremdsprache (Hinweise des ISB zur Qualifikationsphase).</p></div>
    <div id="upperOpts">
      ${field('Art des Kurses', `<select id="cKind"><option value="n">Kurs auf grundlegendem Niveau (gA) – in 13/2 ohne Schulaufgabe</option><option value="lf" ${c.lf && !c.seminar ? 'selected' : ''}>Leistungsfach (eA) – Schulaufgabe auch in 13/2</option><option value="w" ${c.seminar ? 'selected' : ''}>W-Seminar (mit Seminararbeit)</option></select>`)}
      <p class="hint" id="kindHintN">§ 29 GSO: Halbjahresleistung = Durchschnitt aus Schulaufgabe und Schnitt der kleinen LN, gerundet; eine Aufrundung auf 1 Punkt ist nicht zulässig. In 13/2 schreiben nur Kurse auf erhöhtem Niveau (eA) eine Schulaufgabe (§ 22 Abs. 3 GSO): das Leistungsfach sowie Deutsch und Mathematik, die immer auf eA belegt werden – das berücksichtigt Libretto automatisch. Profilfächer wie fremdsprachige Konversation rechnen genauso – dort ist die „Schulaufgabe“ die Konversationsübung (§ 22 Abs. 3 GSO).</p>
      <div id="sportThRow" hidden>${field('Sporttheorie im Leistungsfach Sport', `<select id="cSportTh"><option value="here">im selben Kurs – Libretto rechnet die Endpunktzahl (empfohlen)</option><option value="own" ${(c.sportTh || (isNew ? 'here' : 'own')) === 'own' ? 'selected' : ''}>in einem eigenen Kurs – Endpunktzahl selbst bilden</option></select>`)}</div>
      <p class="hint" id="fmHint" hidden></p>
      <div id="semOpts">
        <div class="grid3">
          ${field('Beginn der Jahrgangsstufe 12', `<select id="cSemStart">${[-2, -1, 0, 1].map(k => yearStart() + k).map(y => `<option value="${y}" ${+semStart0 === y ? 'selected' : ''}>Schuljahr ${y}/${String((y + 1) % 100).padStart(2, '0')} · Abitur ${y + 2}</option>`).join('')}</select>`)}
          ${field('Rahmenthema (optional)', `<input type="text" id="cSemRahmen" value="${esc(semC.rahmen || '')}">`)}
        </div>
        <div class="grid3">
          ${field('Thema festlegen bis', `<input type="date" id="cSemThema" value="${esc(semC.themeDue || '')}">`)}
          ${field('Abgabe der Seminararbeit', `<input type="date" id="cSemDue" value="${esc(semC.deadline || '')}">`)}
          ${field('Uhrzeit der Abgabe (optional)', `<input type="time" id="cSemTime" value="${esc(semC.deadlineTime || '')}">`)}
        </div>
        <div class="panelBtns" style="margin-top:0"><button type="button" class="mini" id="cSemSug">Vorschlag: 2. Unterrichtstag im November</button><span class="hint" id="cSemSugTxt"></span></div>
        <p class="hint">§ 24 GSO: Das Thema wird bis zum Ende von 12/1 im Einvernehmen mit der Kursleitung gewählt. Die Seminararbeit ist in der Jahrgangsstufe 13 spätestens am <b>zweiten Unterrichtstag im November</b> abzugeben; die Schule kann eine Uhrzeit festlegen und in besonderen Fällen die Frist verlängern. Trage den Termin ein, den deine Schule festgelegt hat. In 12/1 und 12/2 gibt es keine Schulaufgabe – die Halbjahresleistung ist der Durchschnitt der kleinen Leistungsnachweise, mindestens zwei je Halbjahr (§ 21 Abs. 3, § 29 Abs. 2 GSO).</p>
      </div>
    </div>
    <div class="subhead">Schülerinnen und Schüler <span class="count" id="stCount" style="float:right;text-transform:none;letter-spacing:0"></span></div>
    <div class="importBox" id="dropImport"><div><b>Klassenliste oder Notenblatt einlesen</b><p class="hint">PDF, Excel oder CSV hierher ziehen oder auswählen – danach kurz prüfen. Vor- und Nachname vertauscht? Einfach „Tauschen“. <b>Mitten im Schuljahr?</b> Das Notenblatt (PDF) mit Noten aus dem Infoportal geht auch – Libretto übernimmt Schüler und Noten.</p></div>
      <div class="panelBtns" style="margin:0"><button type="button" class="mini accent" id="stFileBtn">Datei wählen …</button><button type="button" class="mini" id="stPasteBtn">Text einfügen</button></div>
      <input type="file" id="stFile" accept=".pdf,.xlsx,.xls,.ods,.csv,.txt" hidden></div>
    <div id="stPasteBox" hidden style="margin-top:10px">${field('Liste einfügen (eine Zeile pro Person, z. B. „Muster, Anna“)', '<textarea id="stText" rows="5"></textarea>')}<button type="button" class="mini accent" id="stPasteGo">Übernehmen</button></div>
    <div class="stTable" id="stRows" style="margin-top:10px"></div>
    <p class="hint" id="stClsHint" hidden>Kurs aus mehreren Klassen: Trage bei jedem Namen die Klasse ein (z. B. 8A) – Libretto unterteilt die Liste dann nach Klassen, auch auf der Übertragsliste fürs Infoportal. Steht die Klasse in der eingelesenen Liste, wird sie übernommen.</p>
    <div class="panelBtns"><button type="button" class="mini" id="stAdd">+ Schüler/in</button><button type="button" class="mini" id="stSwap">Vor- und Nachname tauschen</button><button type="button" class="mini" id="stCls" title="Für Kurse mit Schülern aus mehreren Klassen, z. B. Italienisch aus 8A und 8B">Klassen eintragen</button><button type="button" class="mini" id="stFill" hidden>Fehlende Klassen ausfüllen …</button>
      ${others.length ? `<select class="mini" id="cFrom"><option value="">Aus anderem Kurs übernehmen …</option>${others.map(o => `<option value="${o.id}">${esc(o.name + ' ' + o.subject)} (${o.students.length})</option>`).join('')}</select>` : ''}<button type="button" class="mini" id="cGuest" title="Für Gastschülerinnen und -schüler, die nicht auf der Klassenliste stehen">+ Gast …</button></div>
    <details class="more" ${isNew ? '' : ''}><summary>Gewichtung der kleinen Leistungsnachweise</summary>
    ${field('Berechnung', `<select id="cSmall"><option value="flat">Gewichteter Durchschnitt aller kleinen LN</option><option value="areas" ${c.smallMode === 'areas' ? 'selected' : ''}>Erst je Bereich (schriftlich / mündlich / praktisch), dann Bereiche gewichten</option></select>`)}
    <div id="areaW" class="wgrid" style="margin-bottom:10px">${R.AREAS.map(a => `<label>${a}<input type="number" step="0.5" min="0" data-area="${a}" value="${c.areaWeights[a] ?? 1}"></label>`).join('')}</div>
    <span class="hint" style="display:block;margin-bottom:6px">Gewicht je Art (Standard 1 – einzelne Nachweise kannst du später abweichend gewichten):</span>
    <div class="wgrid">${smallTypes.map(([k, t]) => `<label>${t.label}<input type="number" step="0.5" min="0" data-tw="${k}" value="${c.typeWeights[k] ?? 1}"></label>`).join('')}</div>
    </details>
    ${isNew ? '' : '<button type="button" class="danger" id="cDel">Kurs löschen</button>'}`;
  const { dlg, close } = sheet({ title: isNew ? 'Neuer Kurs' : 'Kurs bearbeiten', wide: true, body, onOk: d => {
    const g = +d.querySelector('#cGrade').value;
    /* Wechsel zwischen Noten (5–11) und Notenpunkten (12/13) bei vorhandenen Noten: nie umdeuten – eine „1“ aus Klasse 11 ist nicht 1 Punkt */
    if (!isNew && (+c.grade >= 12) !== (g >= 12) && (c.assessments.some(a => a.results && Object.keys(a.results).length) || (c.entries || []).length)) {
      toast(`In diesem Kurs stehen schon ${+c.grade >= 12 ? 'Notenpunkte' : 'Noten'}. Für die ${g >= 12 ? 'Qualifikationsphase' : 'Jahrgangsstufe ' + g} bitte einen neuen Kurs anlegen („Aus anderem Kurs übernehmen“ holt die Namen).`, 8000);
      return false;
    }
    c.name = d.querySelector('#cName').value.trim(); c.subject = d.querySelector('#cSubj').value.trim(); c.grade = g;
    if (!c.name || !c.subject) { toast(d.querySelector('#cKind').value === 'w' && g >= 12 || d.querySelector('#cPsem').checked ? 'Bitte Kurs und Leitfach angeben' : 'Bitte Klasse/Kurs und Fach angeben'); return false; }
    c.hours = d.querySelector('#cHours').value; c.saPlanned = d.querySelector('#cPlanned').value; c.ratio = d.querySelector('#cRatio').value;
    const kind = d.querySelector('#cKind').value;
    if (g >= 12) { c.lf = kind === 'lf'; c.seminar = kind === 'w'; } else c.seminar = false;
    if (g >= 12 && c.lf && R.isSportPraxis(c.subject)) c.sportTh = d.querySelector('#cSportTh').value; else delete c.sportTh;
    if (g === 11 && d.querySelector('#cPsem').checked) c.psem = true; else delete c.psem;
    c.hasSA = g >= 12 ? !c.seminar : (c.psem || isPSem(c)) ? false : d.querySelector('#cHasSA').checked;
    if (R.isModernLang(c.subject) && g >= 11 && !c.seminar && !c.psem && d.querySelector('#cLate').checked) c.late = true; else delete c.late;
    if (c.seminar) {   /* W-Seminar: Fristen und Angaben; vorhandene Betreuungsdaten (c.sem.st) bleiben unberührt */
      c.sem = c.sem || {}; c.sem.st = c.sem.st || {};
      c.sem.start = +d.querySelector('#cSemStart').value;
      const setS = (k, sel) => { const v = d.querySelector(sel).value.trim(); if (v) c.sem[k] = v; else delete c.sem[k]; };
      c.sem.leit = c.subject; setS('rahmen', '#cSemRahmen'); setS('themeDue', '#cSemThema'); setS('deadline', '#cSemDue'); setS('deadlineTime', '#cSemTime');
    }
    c.smallMode = d.querySelector('#cSmall').value;
    D.settings.hues = D.settings.hues || {}; if (hueSel) D.settings.hues[subjKey(c.subject)] = hueSel; else delete D.settings.hues[subjKey(c.subject)];
    $$('[data-area]', d).forEach(i => c.areaWeights[i.dataset.area] = +i.value || 0);
    $$('[data-tw]', d).forEach(i => { const v = i.value === '' ? 1 : +i.value; if (v === 1) delete c.typeWeights[i.dataset.tw]; else c.typeWeights[i.dataset.tw] = v; });
    /* Schüler übernehmen: bestehende behalten ihre ID und damit ihre Noten */
    const seen = new Set(), next = [], dup = [];
    draft.filter(x => (x.last || '').trim() || (x.first || '').trim()).forEach(x => {
      const st = { id: x.id, last: x.last.trim(), first: x.first.trim() }; st.name = fullName(st); const was = c.students.find(o => o.id === x.id); if (was) ['xid', 'ext', 'g', 'guest'].forEach(k => { if (was[k] != null) st[k] = was[k]; }); if (x.guest) st.guest = x.guest; else if (was && x.guest === null) delete st.guest; const k = Importer.normCls(x.cls) || String(x.cls || '').trim(); if (k) st.cls = k;
      /* Doppelte nur bei neu eingefügten Zeilen weglassen (gleicher Name und gleiche Klasse). Wer schon im Kurs ist, bleibt immer – auch bei gleichem Namen. */
      const key = st.name.toLowerCase() + '|' + (st.cls || '').toLowerCase();
      if (!was && seen.has(key)) { dup.push(st); return; } seen.add(key); next.push(st);
    });
    const go = () => {
    const ids = new Set(next.map(x => x.id));
    const removed = c.students.filter(s => !ids.has(s.id) && (c.assessments.some(a => a.results && a.results[s.id]) || (c.entries || []).some(e => e.sid === s.id) || semHasData(c, s.id)));
    const finish = () => {
      if (removed.length) toTrash('snapshot', `${c.name} · ${c.subject}: Stand vor dem Entfernen von ${removed.map(s => s.name).join(', ')}`, D.courses.find(x => x.id === c.id));
      sortList(next);
      c.students.filter(s => !ids.has(s.id)).forEach(s => semDrop(c, s.id));   /* Betreuungsdaten entfernter Personen (Dateien erst nach 120 Tagen endgültig weg) */
      c.students = next; c.entries = (c.entries || []).filter(e => ids.has(e.sid));
      const i = D.courses.findIndex(x => x.id === c.id);
      if (i >= 0) D.courses[i] = c; else D.courses.push(c);
      UI.course = c.id; rememberCourse(); save(); close(); render();
    };
    if (removed.length) { ask(`${removed.length} Schüler mit eingetragenen Noten${c.seminar ? ' bzw. Seminar-Dokumentation' : ''} würden entfernt (${removed.map(s => esc(s.name)).join(', ')}). Ihre Noten gehen dabei verloren.`, 'Entfernen', true).then(ok => { if (ok) finish(); }); return; }
    finish();
    };
    /* gleicher Name und gleiche Klasse: nicht still weglassen – es können zwei verschiedene Personen sein */
    if (dup.length) { ask(`Diese Namen gibt es mit gleicher Klasse schon in der Liste: <b>${dup.map(x => esc(x.name) + (x.cls ? ' (' + esc(x.cls) + ')' : '')).join('; ')}</b>.<br>Sind das verschiedene Personen?`, 'Ja, zusätzlich anlegen', false, 'Gleicher Name', 'Nein, nur einmal').then(keep => { if (keep) next.push(...dup); go(); }); return false; }
    go(); return false;
  } });
  if (pre && pre.next) dlg.addEventListener('close', pre.next, { once: true });
  const upd = () => { const g = +dlg.querySelector('#cGrade').value; dlg.querySelector('#lowerOpts').hidden = g >= 12; dlg.querySelector('#upperOpts').hidden = g < 12; dlg.querySelector('#areaW').hidden = dlg.querySelector('#cSmall').value !== 'areas';
    const w = dlg.querySelector('#cKind').value === 'w'; dlg.querySelector('#semOpts').hidden = !w; dlg.querySelector('#kindHintN').hidden = w;
    const ps = g === 11 && dlg.querySelector('#cPsem').checked; dlg.querySelector('#psemRow').hidden = g !== 11;
    dlg.querySelector('#pHint').hidden = !ps; if (ps) dlg.querySelector('#cHasSA').checked = false;
    dlg.querySelector('#cSubj').closest('.field').querySelector('span').textContent = (w && g >= 12) || ps ? 'Leitfach' : 'Fach';
    const sj = dlg.querySelector('#cSubj').value.trim();
    dlg.querySelector('#lateRow').hidden = !(R.isModernLang(sj) && g >= 11) || (w && g >= 12) || ps;
    const fm = g >= 12 && !w ? R.upperFormula({ subject: sj, lf: dlg.querySelector('#cKind').value === 'lf', sportTh: dlg.querySelector('#cSportTh').value }) : null, fh = dlg.querySelector('#fmHint');
    dlg.querySelector('#sportThRow').hidden = !(g >= 12 && !w && dlg.querySelector('#cKind').value === 'lf' && R.isSportPraxis(sj));
    fh.hidden = !fm;
    fh.innerHTML = fm === 'sport' ? '<b>Sport (§ 29 Abs. 5 GSO):</b> Halbjahresleistung = (2 × Durchschnitt der praktischen Leistungen im Handlungsfeld + Durchschnitt der übrigen kleinen LN) ÷ 3, gerundet. Praktische Leistungen trägst du als Art „Praktische Leistung“ ein.' + (dlg.querySelector('#cKind').value === 'lf' ? ' Leistungsfach mit eigenem Theoriekurs: Die Endpunktzahl ist der Durchschnitt beider gerundeten Punktzahlen (§ 29 Abs. 5 Satz 2 GSO) – die bildest du selbst.' : '')
      : fm === 'sportlf' ? '<b>Leistungsfach Sport (§ 29 Abs. 5 GSO, KMBek Sport Q12/13 Nr. 2.3.1):</b> Fach Sport = (2 × Ø praktische Leistungen im Handlungsfeld + Ø kleine LN des Fachs Sport) ÷ 3, gerundet. Sporttheorie = (Schulaufgabe + Ø kleine LN der Sporttheorie) ÷ 2, gerundet. Endpunktzahl = Durchschnitt beider, gerundet; keine Aufrundung auf 1 Punkt. Bei jedem kleinen LN wählst du, ob er zum Fach Sport oder zur Sporttheorie gehört.'
      : fm === 'kunst' ? '<b>Leistungsfach Kunst (§ 29 Abs. 3 GSO):</b> Halbjahresleistung = Durchschnitt aus Schulaufgabe, künstlerischem Projekt (eigene Art) und Durchschnitt der kleinen LN, gerundet.'
      : fm === 'musik' ? '<b>Leistungsfach Musik (§ 29 Abs. 4 GSO):</b> Halbjahresleistung = Durchschnitt aus Schulaufgabe, praktischer Prüfung (eigene Art) und Durchschnitt der kleinen LN, gerundet.' : ''; };
  dlg.querySelector('#cGrade').onchange = upd; dlg.querySelector('#cSmall').onchange = upd; dlg.querySelector('#cKind').onchange = upd; dlg.querySelector('#cSportTh').onchange = upd; dlg.querySelector('#cPsem').onchange = upd; dlg.querySelector('#cSubj').addEventListener('input', upd);
  combo(dlg.querySelector('#cSubj'), () => R.SUBJECTS); upd();
  /* Fach „W-Seminar“ / „P-Seminar“: passende Einstellungen vorschlagen */
  dlg.querySelector('#cSubj').addEventListener('change', () => {
    const v = dlg.querySelector('#cSubj').value, gs = dlg.querySelector('#cGrade');
    if (isWSemName(v)) { if (+gs.value < 12) gs.value = '12'; dlg.querySelector('#cKind').value = 'w'; dlg.querySelector('#cSubj').value = ''; toast('W-Seminar ist als „Art des Kurses“ eingestellt – bitte noch das Leitfach eintragen'); }
    if (/^p[\s-]?seminar$/i.test(v.trim())) { gs.value = '11'; dlg.querySelector('#cPsem').checked = true; dlg.querySelector('#cSubj').value = ''; toast('P-Seminar ist eingestellt – bitte noch das Leitfach eintragen'); }
    upd();
  });
  const sugTxt = () => { const x = semDeadlineSuggest(+dlg.querySelector('#cSemStart').value); dlg.querySelector('#cSemSugTxt').textContent = x ? 'laut Ferienkalender Bayern: ' + wdate(x) : +dlg.querySelector('#cSemStart').value > 0 ? 'Ferienkalender nur bis 2029/30 hinterlegt – Abgabetag bitte selbst eintragen (§ 24 GSO).' : ''; return x; };
  dlg.querySelector('#cSemStart').onchange = sugTxt; sugTxt();
  dlg.querySelector('#cSemSug').onclick = () => { const x = sugTxt(); if (x) dlg.querySelector('#cSemDue').value = x; else toast('Für dieses Schuljahr kennt Libretto die Ferien noch nicht – bitte Termin selbst eintragen'); };
  $$('#cHue button', dlg).forEach(b => b.onclick = () => { hueSel = b.dataset.hue; $$('#cHue button', dlg).forEach(x => x.setAttribute('aria-pressed', String(x === b))); });
  if (isNew) dlg.querySelector('#cName').focus();
  /* Entwurf der Schülerliste (Tabelle wie in Viva/Gruppen) */
  let draft = c.students.map(x => ({ id: x.id, ...splitName(x), cls: x.cls || '', ...(x.guest ? { guest: { ...x.guest } } : {}) }));
  const rowsEl = dlg.querySelector('#stRows');
  /* Spalte „Klasse“: sichtbar, sobald sie gebraucht wird (zwei Klassen im Kurs, Klasse nur bei einem Teil der Namen) oder auf Wunsch */
  let clsOn = false;
  const clsSet = () => new Set(draft.map(clsKey).filter(Boolean));
  const showCls = () => clsOn || clsShown(draft);
  const drawDraft = () => {
    const kc = showCls();
    dlg.querySelector('#stCount').textContent = draft.length ? draft.length + ' Namen' + (clsSet().size > 1 ? ' aus ' + clsSet().size + ' Klassen' : '') : '';
    dlg.querySelector('#stCls').hidden = kc; dlg.querySelector('#stClsHint').hidden = !kc; dlg.querySelector('#stFill').hidden = !(kc && draft.some(x => !clsKey(x)) && draft.length > 1);
    rowsEl.innerHTML = draft.length ? draft.map((x, i) => `<div class="stRow lib ${kc ? 'withCls' : ''}" data-i="${i}"><span class="nr" ${x.guest ? `title="${esc(guestText(x.guest))}"` : ''}>${x.guest ? '<i class="guestTag sm">G</i>' : i + 1}</span><input type="text" data-f="last" value="${esc(x.last)}" placeholder="Nachname"><input type="text" data-f="first" value="${esc(x.first)}" placeholder="Vorname">${kc ? `<input type="text" data-f="cls" value="${esc(x.cls || '')}" placeholder="Klasse" maxlength="6" title="Klasse, z. B. 8A">` : ''}<button type="button" class="iconbtn" data-rm="${i}" title="Entfernen">✕</button></div>`).join('')
      : '<div class="stEmpty">Noch keine Namen – Klassenliste einlesen oder Namen einfügen.</div>';
    $$('.stRow', rowsEl).forEach(r => $$('input', r).forEach(inp => inp.oninput = () => { draft[+r.dataset.i][inp.dataset.f] = inp.value; }));
    $$('[data-rm]', rowsEl).forEach(b => b.onclick = () => { draft.splice(+b.dataset.rm, 1); drawDraft(); });
  };
  const addDraft = (list, batchCls = '') => { const key = x => (x.last + '|' + x.first).toLowerCase(); const have = new Map(draft.map(x => [key(x), x])); let n = 0, k = 0;
    list.forEach(x => { const y = { id: uid(), last: (x.last || '').trim(), first: (x.first || '').trim(), cls: Importer.normCls(x.cls) || batchCls }; if (!y.last && !y.first) return;
      const old = have.get(key(y)); if (old && !(y.cls && clsKey(old) && clsKey(old).toUpperCase() !== String(y.cls).toUpperCase())) { if (y.cls && !clsKey(old)) { old.cls = y.cls; k++; } return; }   /* gleicher Name in anderer Klasse = andere Person */ /* schon in der Liste: nur die fehlende Klasse ergänzen */
      have.set(key(y), y); draft.push(y); n++; });
    sortList(draft); drawDraft();
    const kl = clsSet().size > 1 ? ` aus ${clsSet().size} Klassen` : '';
    toast(n ? `${n} Namen übernommen${kl} – bitte kurz prüfen` : k ? `Klasse bei ${k} Namen ergänzt` : 'Keine neuen Namen erkannt'); };
  drawDraft();
  /* Steht in der Datei nur eine einzelne Klasse (Kopfzeile/Dateiname, z. B. „8A“), gilt sie für alle Namen dieser Datei */
/* Notenblatt (PDF) aus dem Infoportal: Schüler und Noten für den Einstieg mitten im Schuljahr */
  const nbPreview = pages => {
    const p = Notenblatt.parse(pages);
    if (!p.ok) { sheet({ title: 'Notenblatt einlesen', small: true, ok: '', cancel: 'Schließen', body: `<p class="prose" style="margin:0">${esc(p.error)}</p>` }); return; }
    const probe = { ...c, grade: +dlg.querySelector('#cGrade').value || c.grade, students: draft.filter(x => (x.last || '').trim() || (x.first || '').trim()).map(x => ({ id: x.id, last: x.last.trim(), first: x.first.trim(), cls: x.cls })), assessments: c.assessments, entries: c.entries || [] };
    const pl = Notenblatt.plan(p, probe, { R, uid });
    const rep = pl.rep;
    if (rep.error) { sheet({ title: 'Notenblatt einlesen', small: true, ok: '', cancel: 'Schließen', body: `<p class="prose" style="margin:0">${esc(rep.error)}</p>` }); return; }
    const dd = iso => iso ? sdate(iso) : '';
    const list = rep.assessments.map(a => `<li><b>${esc(a.label)} ${dd(a.date)}</b>${a.factor != null && a.factor !== 1 ? ` · Faktor ${String(a.factor).replace('.', ',')}` : ''} – ${a.n ? a.n + (a.n === 1 ? ' Note' : ' Noten') : 'noch ohne Noten (geplant)'}</li>`).join('');
    const body = `<p class="prose" style="margin-top:0"><b>${esc([p.year && 'Schuljahr ' + p.year, p.cls, p.subject].filter(Boolean).join(' · '))}</b>${p.date ? ' · Stand ' + fdate(p.date) : ''}</p>
      <ul class="nbList"><li><b>${p.students.length} Schüler</b> – ${rep.matched} schon in der Liste${rep.newStudents.length ? `, <b>${rep.newStudents.length} neu</b> (werden zur Liste hinzugefügt)` : ''}</li>${list}
      ${rep.entries ? `<li><b>${rep.entries} mündliche Einzelnoten</b> mit Datum (UB, RA, Ref., Praktisch; weitere Kürzel wie GR, WZ als „Sonstiger kleiner LN“ mit Notiz)</li>` : ''}</ul>
      ${rep.skipped.length ? `<p class="hint">Schon in Libretto, bleibt unverändert: ${rep.skipped.map(esc).join(' · ')}.</p>` : ''}
      ${rep.nachtermin ? `<p class="hint">„N“ (Nachschrift) bei ${rep.nachtermin} Schüler(n) wurde als Nachtermin „E“ übernommen.</p>` : ''}
      ${rep.unknown.length ? `<div class="notice"><div class="grow"><b>Nicht erkannt (wird nicht übernommen):</b> ${rep.unknown.slice(0, 8).map(esc).join(' · ')}${rep.unknown.length > 8 ? ' …' : ''}</div></div>` : ''}
      ${rep.warnings.length ? `<div class="notice"><div class="grow">${rep.warnings.map(esc).join('<br>')}</div></div>` : ''}
      <p class="hint">Die übernommenen Noten gelten als <b>übertragen</b> (✓), denn sie stehen ja schon im Notenprogramm der Schule. Bitte vergleiche kurz stichprobenartig mit dem Notenblatt. Gespeichert wird erst mit „Sichern“ im Kurs-Fenster.</p>`;
    sheet({ title: 'Notenblatt einlesen', ok: 'Übernehmen', body, onOk: () => {
      pl.students.forEach(s => draft.push({ id: s.id, last: s.last, first: s.first, cls: Importer.normCls(s.cls) || s.cls || '' }));
      sortList(draft);
      c.assessments = c.assessments.concat(pl.assessments); c.entries = (c.entries || []).concat(pl.entries); c.xfer = { ...(c.xfer || {}), ...pl.xfer };
      const nm = dlg.querySelector('#cName'), sj = dlg.querySelector('#cSubj'), fresh = !nm.value.trim();
      if (fresh) nm.value = /^\d{1,2}[A-Za-zÄÖÜäöü]$/.test(p.cls) && !isMixed(draft) ? p.cls : isMixed(draft) ? mixedName(draft) : p.cls;
      if (!sj.value.trim() && R.SUBJECTS.includes(p.subject)) sj.value = p.subject;
      const gm = /^(\d{1,2})/.exec(nm.value.trim()); if (isNew && fresh && gm && +gm[1] >= 5 && +gm[1] <= 11) { dlg.querySelector('#cGrade').value = String(+gm[1]); upd(); }
      drawDraft(); toast(`Notenblatt übernommen: ${pl.assessments.length} Leistungsnachweise, ${pl.entries.length} Einzelnoten – mit „Sichern“ speichern`, 5000);
    } });
  };
  const readF = async f => { try { toast('Liste wird gelesen …'); const r = await Importer.readFile(f); if (r.notenblatt) return nbPreview(r.notenblatt); const one = /^\d{1,2}[A-Za-zÄÖÜäöü]$/.test(r.cls || '') && !r.list.some(x => x.cls) ? r.cls : ''; addDraft(r.list, one);
      /* Vorschläge aus der Liste – nur in leere Felder: Kursname (bei mehreren Klassen z. B. „8AB“), Fach (Kopfzeile der Liste), Jahrgangsstufe */
      const nm = dlg.querySelector('#cName'), sj = dlg.querySelector('#cSubj'), fresh = !nm.value.trim();
      if (fresh) nm.value = isMixed(draft) ? mixedName(draft) : (r.cls || '');
      if (!sj.value.trim()) { const hit = (r.head || []).map(h => String(h).trim().toLowerCase()).map(h => R.SUBJECTS.find(x => x.toLowerCase() === h) || (/^evang/.test(h) ? 'Religionslehre (ev.)' : /^kath/.test(h) ? 'Religionslehre (kath.)' : '')).find(Boolean); if (hit && (R.SUBJECTS.includes(hit))) sj.value = hit; }
      const gm = /^(\d{1,2})/.exec(nm.value.trim()); if (isNew && fresh && gm && +gm[1] >= 5 && +gm[1] <= 13) { dlg.querySelector('#cGrade').value = String(+gm[1]); upd(); }
    } catch (err) { console.error(err); toast('Datei konnte nicht gelesen werden'); } };
  dlg.querySelector('#stFileBtn').onclick = () => dlg.querySelector('#stFile').click();
  dlg.querySelector('#stFile').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) readF(f); };
  const dz = dlg.querySelector('#dropImport');
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('over'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('over'));
  dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) readF(f); });
  dlg.querySelector('#stPasteBtn').onclick = () => { const b = dlg.querySelector('#stPasteBox'); b.hidden = !b.hidden; if (!b.hidden) dlg.querySelector('#stText').focus(); };
  dlg.querySelector('#stPasteGo').onclick = () => { addDraft(Importer.recognizeNames(dlg.querySelector('#stText').value.split(/\r?\n/))); dlg.querySelector('#stText').value = ''; dlg.querySelector('#stPasteBox').hidden = true; };
  dlg.querySelector('#stCls').onclick = () => { clsOn = true; drawDraft(); const i = rowsEl.querySelector('input[data-f=cls]'); if (i) i.focus(); };
  dlg.querySelector('#stFill').onclick = () => {
    const open = draft.filter(x => !clsKey(x)).length;
    sheet({ title: 'Fehlende Klassen ausfüllen', small: true, ok: 'Eintragen', body: `<p class="prose" style="margin-top:0">${open} Namen haben noch keine Klasse. Welche Klasse soll bei ihnen stehen?</p>${field('Klasse', '<input type="text" id="fillCls" placeholder="z. B. 8B" maxlength="6">')}`,
      onOpen: d => d.querySelector('#fillCls').focus(),
      onOk: d => { const v = d.querySelector('#fillCls').value.trim(); if (!v) return false; draft.forEach(x => { if (!clsKey(x)) x.cls = Importer.normCls(v) || v; }); sortList(draft); drawDraft(); } });
  };
  dlg.querySelector('#stAdd').onclick = () => { draft.push({ id: uid(), last: '', first: '', cls: !showCls() && clsSet().size === 1 ? draft.find(clsKey).cls : '' }); drawDraft(); const ins = $$('input[data-f=last]', rowsEl); ins[ins.length - 1].focus(); };
  dlg.querySelector('#stSwap').onclick = () => { draft.forEach(x => { [x.first, x.last] = [x.last, x.first]; }); drawDraft(); };
  dlg.querySelector('#cGuest').onclick = () => sheet({ title: 'Gast hinzufügen', small: true, ok: 'Hinzufügen', body: `<p class="prose" style="margin-top:0">Für Gastschülerinnen und -schüler, die nicht auf der Klassenliste stehen – z. B. aus dem Austausch, zur Probe oder aus einer anderen Klasse.</p>
      <div class="grid2">${field('Nachname', '<input type="text" id="gL">')}${field('Vorname', '<input type="text" id="gF">')}</div>
      <div class="grid3">${field('Klasse / Herkunft', '<input type="text" id="gC" maxlength="20" placeholder="z. B. Lyon">')}${field('Da von', '<input type="date" id="gA">')}${field('bis', '<input type="date" id="gB">')}</div>
      ${field('Noten', '<select id="gN"><option value="1">zählen wie bei allen</option><option value="0">nur dokumentieren (zählen nicht)</option></select>')}
      <p class="hint">Was gilt, ist Absprache mit der Schule. „Zählen nicht“: Die Noten stehen in der Tabelle, aber nicht im Durchschnitt und Notenspiegel der Klasse; es gibt keine Zeugnisnote. Außerhalb des Zeitraums gilt der Gast als abwesend. Ändern kannst du alles später im Schülerblatt.</p><p class="gateErr" id="gErr"></p>`,
    onOk: g => { const l = g.querySelector('#gL').value.trim(), f = g.querySelector('#gF').value.trim(); if (!l && !f) { g.querySelector('#gErr').textContent = 'Bitte einen Namen eintragen'; return false; }
      const a = g.querySelector('#gA').value, b = g.querySelector('#gB').value; if (a && b && b < a) { g.querySelector('#gErr').textContent = 'Das Ende liegt vor dem Beginn'; return false; }
      draft.push({ id: uid(), last: l, first: f, cls: g.querySelector('#gC').value.trim(), guest: { counts: g.querySelector('#gN').value === '1', ...(a ? { from: a } : {}), ...(b ? { to: b } : {}) } });
      drawDraft(); toast('Gast hinzugefügt – mit „Sichern“ übernehmen'); return true; } });
  const fr = dlg.querySelector('#cFrom'); if (fr) fr.onchange = () => { const o = D.courses.find(x => x.id === fr.value); if (o) addDraft(o.students.map(x => ({ ...splitName(x), cls: x.cls || '' }))); fr.value = ''; };
  const del = dlg.querySelector('#cDel'); if (del) del.onclick = async () => {
    if (await ask(`Kurs <b>${esc(c.name + ' ' + c.subject)}</b> mit allen Noten löschen? Du kannst ihn 60 Tage lang unter „Sicherung“ wiederherstellen.`, 'Löschen', true)) {
      toTrash('course', `Kurs ${c.name} · ${c.subject}`, D.courses.find(x => x.id === c.id));
      D.courses = D.courses.filter(x => x.id !== c.id); UI.course = D.courses[0] && D.courses[0].id; save(); close(); render(); toast('Kurs gelöscht – 60 Tage lang unter „Sicherung“ wiederherstellbar', 4500);
    }
  };
}
/* Namen */
function splitName(x) { if (x.last != null || x.first != null) return { last: x.last || '', first: x.first || '' }; const n = x.name || ''; if (n.includes(',')) { const [l, f] = n.split(','); return { last: l.trim(), first: (f || '').trim() }; } const p = n.trim().split(/\s+/); const f = p.shift() || ''; return { last: p.join(' '), first: f }; }
function fullName(x) { return x.last && x.first ? `${x.last}, ${x.first}` : (x.last || x.first || ''); }

/* ======================================================================
   Leistungsnachweis
   ====================================================================== */
function assessmentSheet(c, a) {
  if (!c) return;
  const isNew = !a, up = upper(c);
  const nSA = c.assessments.filter(x => x.type === 'sa').length;
  const tl = R.termsOf(c), semNow = c.seminar ? semTermNow(c) : null;
  const defTerm = up ? (tl.includes(UI.term) ? UI.term : c.seminar ? (tl.includes(semNow) ? semNow : '12/2') : tl[0]) : null;
  a = a ? JSON.parse(JSON.stringify(a)) : { id: uid(), type: (c.hasSA && !c.seminar && (up ? R.termHasSA(c, defTerm) && !c.assessments.some(x => x.type === 'sa' && x.term === defTerm) : nSA < (+c.saPlanned || R.minSA(c) || 0))) ? 'sa' : 'stex', title: '', date: todayISO(), term: defTerm, results: {} };
  const fmC = up ? R.upperFormula(c) : null;
  const types = Object.entries(R.TYPES).filter(([k]) => (k !== 'sa' || a.type === 'sa' || (up ? !c.seminar && fmC !== 'sport' : c.hasSA)) && (k !== 'kp' || fmC === 'kunst' || a.type === 'kp') && (k !== 'mp' || fmC === 'musik' || a.type === 'mp'));   /* W-Seminar: keine Schulaufgabe (§ 29 Abs. 2 GSO) */
  const dist = !isNew ? R.distribution(a, c.students, up) : null;
  /* Notenschlüssel-Vorgaben: je Fach gemerkt (Fachschaften legen z. B. „Note 4 ab 50 %, Note 5 ab 33 %“ fest) */
  const pKey = (c.subject || '').toLowerCase() + (up ? '|Q' : '');
  D.settings.keyPresets = D.settings.keyPresets || {};
  /* Moderne Fremdsprachen: ISB-Leitfaden „Leistungsnachweise in der Profil- und Leistungsstufe“ (April 2025): bei BE-Bewertung Schwellenwert
     „ausreichend“ 50 %, „mangelhaft“ 33 % (spät beginnende FS und Jgst. 5–11: ausreichend zwischen 50 und 60 %, mangelhaft 33 %) */
  const mfs = R.isModernLang(ruleSubj(c));
  const hvOK = up && mfs && !c.late;   /* fortgeführte moderne Fremdsprache Q12/Q13: Hörverstehen nach der ISB-Rechentabelle */
  const defPre = up ? (mfs ? { q4: 50, p1: 33, step: 0.5, preset: 'custom' } : { q4: 40, p1: 20, step: 0.5 }) : { p4: 50, p5: mfs ? 33 : 25, step: 0.5 };
  let pre = (a.key && a.key.anchors) || D.settings.keyPresets[pKey] || defPre;
  /* fehlende Anker (z. B. bei KMK-Schlüsseln) mit den Vorschlägen auffüllen – nie eine vorhandene Angabe ersetzen */
  if (up) { if (pre.q4 == null && pre.p5 == null) pre = { ...pre, q4: defPre.q4 }; if (pre.p1 == null) pre = { ...pre, p1: defPre.p1 }; }
  else { if (pre.p4 == null) pre = { ...pre, p4: defPre.p4 }; if (pre.p5 == null) pre = { ...pre, p5: defPre.p5 }; }
  /* Gespeicherte Vorgaben werden nie automatisch ersetzt – auch nicht die alte Standardvorgabe. Die ISB-Werte gibt es per Knopf (#mfsUse). */
  /* Vorgabe: „KMK-Raster“ (Prozentgrenzen der Abiturprüfung, auch für Noten 1–6) oder eigene Grenzen; Mathematik beginnt mit dem KMK-Raster */
  /* Moderne Fremdsprachen: kein KMK-Raster/keine Gesamt-BE-Tabelle (KMS 08.03.2023 V.6-BS4402.8/118/1: ausreichend 50–60 % je nach Aufgabe, ungenügend unter 33 %;
     Q12/Q13: ISB-Leitfaden 04/2025 S. 4). Ein schon gespeicherter KMK-Schlüssel bleibt sichtbar, wird aber deutlich als unpassend markiert. */
  const kmkBad = mfs, kmkStored = !!(a.key && a.key.preset === 'kmk');
  const preset0 = (a.key && a.key.preset) || (kmkBad && pre.preset === 'kmk' ? 'custom' : pre.preset) || ((up && !mfs) || /^mathe/i.test(c.subject || '') ? 'kmk' : 'custom');   /* Oberstufe: das KMK-Raster ist die Tabelle der Abiturprüfung (BE → Notenpunkte) */
  const tend0 = a.key && a.key.preset ? a.key.tend !== false : pre.tend !== false;
  D.settings.taskDefaults = D.settings.taskDefaults || {};
  const tkDef = !!(isNew && D.settings.taskDefaults[pKey]);   /* „Punkte je Aufgabe“ als Standard für dieses Fach */
  if (tkDef) a.usePoints = true;
  let tasks = (a.tasks || []).map(t => ({ ...t })), manualKey = false;
  /* Oberstufe: Bewertung nach Prüfungsteilen (ISB-Rechentabelle) – Vorlage je Fach gemerkt */
  D.settings.partDefaults = D.settings.partDefaults || {};
  const ptDef = !!(up && isNew && R.isModernLang(ruleSubj(c)) && !c.late && D.settings.partDefaults[pKey]);
  const altR = R.altRule(ruleSubj(c), c.grade);
  const altOn = !!altR && (R.byParts(a) ? !!a.alt : isNew && a.type === 'sa');
  let parts = (a.parts && a.parts.length ? a.parts : (D.settings.partDefaults[pKey] || R.PARTS_ABI())).map(p => ({ ...p, id: p.id || uid() }));
  let pctArr = up ? (a.key && a.key.pct15) || (pre.q4 == null && pre.p5 != null ? R.pct15Old(+pre.p5, +pre.p1 || 0) : R.pct15FromAnchors(R.anchor4(pre), pre.p1)) : (a.key && a.key.pct) || R.pctFromAnchors(pre.p4, pre.p5);
  const keyInputs = () => up
    ? `<div class="keyGrid k15">${Array.from({ length: 15 }, (_, i) => `<label>${15 - i} P. <small class="kgL">(${R.POINT_LABEL(15 - i)})</small><input type="number" step="0.5" min="0" data-k="${i}" value="${a.key && a.key.pointThresholds ? a.key.pointThresholds[i] : ''}"><span class="kp" data-kp="${i}"></span></label>`).join('')}</div>`
    : `<div class="keyGrid">${[1, 2, 3, 4, 5].map((n, i) => `<label>Note ${n} ab<input type="number" step="0.5" min="0" data-k="${i}" value="${a.key && a.key.thresholds ? a.key.thresholds[i] : ''}"><span class="kp" data-kp="${i}"></span></label>`).join('')}</div>`;
  const body = `
    <div class="grid3 aGrid${up ? ' five' : ''}">
      ${field('Art', `<select id="aType">${types.map(([k, t]) => `<option value="${k}" ${a.type === k ? 'selected' : ''}>${t.label}</option>`).join('')}</select>`)}
      ${field('Bezeichnung (optional)', `<input type="text" id="aTitle" value="${esc(a.title)}" placeholder="z. B. 1. Schulaufgabe">`)}
      ${field('Datum', `<input type="date" id="aDate" value="${esc(a.date || '')}"><small class="dateWarn" id="aDateW" hidden></small>`)}
      ${up ? field('Halbjahr', `<select id="aTerm">${R.termsOf(c).map(t => `<option ${a.term === t ? 'selected' : ''}>${t}</option>`).join('')}</select>`) : ''}
      ${field('Kürzel', `<input type="text" id="aShort" maxlength="6" value="${esc(a.short || '')}" placeholder="automatisch">`)}
    </div>
    <div id="jstOpt">${field('Jahrgangsstufentest zählt als', `<select id="aCount"><option value="small">kleiner Leistungsnachweis</option><option value="big" ${a.countAs === 'big' ? 'selected' : ''}>großer Leistungsnachweis</option></select>`)}</div>
    ${fmC === 'sportlf' ? `<div id="stOpt">${field('Gehört im Leistungsfach Sport zu', `<select id="aSt"><option value="f">Fach Sport (kleiner LN, z. B. Stundenteil, Demonstration, Kurzreferat)</option><option value="t" ${R.sportPart(a) === 't' ? 'selected' : ''}>Sporttheorie (kleiner LN)</option></select>`)}</div>` : ''}
    <div id="bigOpt">${field('Gewicht unter den großen Leistungsnachweisen', `<select id="aBigW">${WEIGHTS.map(([v, l]) => `<option value="${v}" ${String(+(a.bigWeight ?? 1)) === String(+v) ? 'selected' : ''}>${l}</option>`).join('')}</select>`)}</div>
    <div id="smallOpt" class="grid2">
      ${field('Gewicht (leer = Standard der Art)', `<input type="number" step="0.5" min="0" id="aW" value="${esc(a.weight ?? '')}" placeholder="${R.weightOf({ ...a, weight: null }, c)}">`)}
      ${field('Bereich', `<select id="aArea">${R.AREAS.map(x => `<option ${R.areaOf(a) === x ? 'selected' : ''}>${x}</option>`).join('')}</select>`)}
    </div>
    <div class="subhead">Notenschlüssel</div>
    ${altR ? `<div class="rows">${sw('aAlt', altOn, `Zweigeteilte Schulaufgabe: Übersetzung und Aufgabenteil (Gewichtung ${altR.w[0]} : ${altR.w[1]})`)}</div>
      <p class="hint" id="altHint" style="margin:4px 0 8px">Nach den Richtlinien des Kultusministeriums (KMS vom 31.07.2023, Anlagen 3 und 4): Beide Teile werden getrennt ${up ? 'in Notenpunkten' : 'mit ganzen Noten'} bewertet, die Gesamtnote ist der gewichtete Durchschnitt – bei n,5 die bessere Note.${altR.ue5 ? ' „Ausreichend“ gibt es nur, wenn die Übersetzung mindestens „mangelhaft“ ist.' : ''}${altR.g11 ? ' „Befriedigend“ gibt es nur, wenn kein Teil „ungenügend“ ist.' : ''}${altR.up ? ' Hat ein Teil 0 Punkte, gibt es höchstens 6 Punkte (Tabelle der Anlage 2).' : ''} Für eine Interpretationsschulaufgabe oder Ersatzform schaltest du das aus.</p>
      <div class="panelBtns" id="altBtns"><button type="button" class="mini accent" id="altEnter">Sichern und Teilnoten eintragen …</button></div>` : ''}
    ${up && ((R.isModernLang(ruleSubj(c)) && !c.late) || (R.byParts(a) && !a.alt)) ? `<div class="rows">${sw('aParts', R.byParts(a) || ptDef, 'Nach Prüfungsteilen bewerten (Q12/Q13, moderne Fremdsprachen: Hörverstehen in BE, Schreiben und Sprachmittlung mit Inhalt und Sprache)')}</div>
    <div id="partBox" hidden><p class="hint" style="margin:6px 0 8px">Wie in der Rechentabelle des ISB: Teile mit <b>BE</b> (z. B. Hörverstehen) werden über den Lösungsgrad in Notenpunkte umgerechnet (95 % = 15 … 20 % = 1). Bei <b>Inhalt + Sprache</b> trägst du je 0–15 Notenpunkte nach den Bewertungsrastern ein; gerechnet wird 40 % Inhalt + 60 % Sprache, und ist eins davon 0 Punkte, gibt es höchstens 3 Punkte (Sperrklausel). Das Ergebnis ist der nach den Anteilen gewichtete Durchschnitt, gerundet.</p>
      <div class="prowH"><span>Prüfungsteil</span><span>Bewertung</span><span>max. BE</span><span>Anteil</span><span></span></div><div id="partRows"></div>
      <div class="panelBtns"><button type="button" class="mini" id="pAdd">+ Prüfungsteil</button><span class="pTplL">Vorlage:</span><button type="button" class="mini" data-ptpl="hvsm" title="ISB-Leitfaden 04/2025, S. 2: Hörverstehen 30–40 %, Sprachmittlung 60–70 %">Hörverstehen + Sprachmittlung (35 / 65 %)</button><button type="button" class="mini" data-ptpl="tvps" title="ISB-Leitfaden 04/2025, S. 2: Textverstehen/Textanalyse 60–70 %, persönliche Stellungnahme/gestaltendes Schreiben 30–40 %">Textaufgaben + Stellungnahme (65 / 35 %)</button><button type="button" class="mini" data-ptpl="abi" id="pAbi" title="Abitur: Hörverstehen 20 %, Schreiben 55 %, Sprachmittlung 25 %">Wie im Abitur (20 / 55 / 25 %)</button></div>
      <div class="panelBtns"><button type="button" class="mini accent" id="pEnter">Sichern und Teilnoten eintragen …</button></div>
      <p class="hint" id="pHint"></p>
      <p class="hint"><b>Wichtig:</b> Laut ISB-Leitfaden (S. 4) wird die Gesamtnote in Q12/Q13 über die verpflichtende Excel-Rechentabelle des ISB berechnet. Libretto rechnet genauso (Lösungsgrad, 40 : 60, Sperrklausel, Runden am Ende – mit der Tabelle abgeglichen) und dient zum Eintragen, Prüfen und Dokumentieren.</p>
      <p class="hint">Die zwei Vorlagen für Schulaufgaben stammen aus dem ISB-Leitfaden „Leistungsnachweise in der Profil- und Leistungsstufe“ (April 2025, S. 2) – es sind Vorschläge; den genauen Anteil legst du nach Anforderung und Zeitbedarf fest und gibst ihn auf dem Angabenblatt an. Hat ein Teil mehrere Schreibaufgaben (z. B. zwei Textaufgaben), leg für jede einen eigenen Teil an und teil den Anteil auf: Inhalt und Sprache und die Sperrklausel gelten <b>je Aufgabe</b> (ebd., S. 3–4; Rechentabelle: Schreiben 1, 2, 3).</p>
      <label class="check" style="margin:2px 0 6px"><input type="checkbox" id="pRemember" checked> <span>Prüfungsteile als Vorlage für ${esc(c.subject || 'dieses Fach')} merken</span></label></div>
    <div id="ptsRow">` : '<div>'}<div class="rows">${sw('aPts', a.usePoints && !R.byParts(a) && !ptDef, 'Rohpunkte eingeben, Libretto rechnet in ' + (up ? 'Notenpunkte' : 'Noten') + ' um')}</div>${/^deutsch/i.test((c.subject || '').trim()) ? '<p class="hint" style="margin:4px 0 0">Deutsch: Aufsätze werden ganzheitlich bewertet (KMS „Lernbereich Schreiben“ vom 28.09.2026) – trag die Note direkt ein und lass Rohpunkte aus. Rohpunkte nur für andere Formate, z. B. einen Grammatiktest.</p>' : ''}</div>
    <div id="keyBox" style="margin-top:10px">
      <div class="rows">${sw('aTasks', R.byTask(a) || (a.byTask && tasks.length) || tkDef, 'Punkte je Aufgabe eingeben')}</div>
      <div id="taskBox" hidden><div class="subhead" style="margin-top:6px">Aufgaben und erreichbare Punkte</div>
        <div class="field"><span>Schnell: Höchstpunkte aller Aufgaben in einer Zeile (z. B. 2 3 4 3 2 2 2; auch aus Excel einfügbar)</span><input type="text" id="tQuick" placeholder="2 3 4 3 2 2 2 – dann Enter" autocomplete="off"></div>
        <div id="taskRows"></div>
        <div class="panelBtns"><button type="button" class="mini" id="tAdd">+ Aufgabe</button><button type="button" class="mini" id="tPrev" hidden></button><button type="button" class="mini accent" id="tEnter">Sichern und Aufgabenpunkte eintragen …</button></div>
        <p class="hint" id="tHint"></p>
        <details class="sim tfSim" id="aTfSim" hidden><summary>Simulation: Was passiert, wenn eine Aufgabe anders zählt (z. B. halb oder doppelt)? – mit ganzer Klassenliste</summary><div id="aTfBody"></div></details></div>
      <div class="grid3 kGrid">${field('Erreichbare Punkte', `<input type="number" step="0.5" min="1" id="aMax" value="${esc(a.key && a.key.max || '')}">`)}
        ${field('Schlüssel', `<select id="aPreset"><option value="custom" ${preset0 === 'custom' ? 'selected' : ''}>Eigene Grenzen</option>${!kmkBad || kmkStored ? `<option value="kmk" ${preset0 === 'kmk' ? 'selected' : ''}>${up ? 'Amtliche BE-Tabelle (Abitur: 4 P. ab 40 %)' : 'KMK-Raster (1 ab 85 %, 2 ab 70 %, 3 ab 55 %, 4 ab 40 %, 5 ab 20 %)'}${kmkBad ? ' – passt nicht für moderne Fremdsprachen' : ''}</option>` : ''}${hvOK ? `<option value="hv" ${preset0 === 'hv' ? 'selected' : ''}>Hörverstehen – ISB-Rechentabelle (Lösungsgrad)</option>` : ''}</select>`)}
        <span id="anchorBox" style="display:contents">${up ? field('4 P. (Note 4–) ab … %', `<input type="number" step="1" min="1" max="99" id="aA1" value="${R.anchor4(pre)}">`) + field('1 P. (Note 5–) ab … %', `<input type="number" step="1" min="0" max="99" id="aA2" value="${pre.p1}">`)
             : field('Note 4 ab … %', `<input type="number" step="1" min="1" max="99" id="aA1" value="${pre.p4}">`) + field('Note 5 ab … %', `<input type="number" step="1" min="0" max="99" id="aA2" value="${pre.p5}">`)}</span></div>
      ${up ? '' : `<label class="check" id="tendBox" style="margin:6px 0" hidden><input type="checkbox" id="aTend" ${tend0 ? 'checked' : ''}> <span>Tendenzen (z. B. 2+, 3-) aus dem KMK-Raster mit anzeigen – gerechnet wird mit ganzen Noten</span></label>`}
      <div class="grid3">${field('Grenzen runden auf', `<select id="aStep"><option value="0.5" ${+pre.step === 0.5 ? 'selected' : ''}>halbe Punkte</option><option value="1" ${+pre.step === 1 ? 'selected' : ''}>ganze Punkte</option><option value="0.25" ${+pre.step === 0.25 ? 'selected' : ''}>Viertelpunkte</option></select>`)}
        <div class="field"><span>&nbsp;</span><button type="button" class="mini accent" id="aSuggest">Schlüssel berechnen</button></div>
        <label class="check" style="margin-top:22px"><input type="checkbox" id="aRemember" ${isNew ? 'checked' : ''}> <span>Schlüssel und Eingabeart als Standard für ${esc(c.subject || 'dieses Fach')} merken</span></label></div>
      ${keyInputs()}<div class="keyPct" id="keyPct"></div>
      ${mfs ? `<p class="hint" id="mfsSrc">${up && !c.late ? 'ISB-Leitfaden (April 2025): Wo in Q12/13 mit BE bewertet wird (z. B. Wortschatz- und Grammatikaufgaben), beginnt „ausreichend“ bei 50 % (4 Punkte), „mangelhaft“ bei 33 % (1 Punkt). Eine vollständige Tabelle aller Notenpunktgrenzen legt der Leitfaden für dieses Aufgabenformat nicht fest – Libretto verteilt die übrigen Punkte gleichmäßig (15 Punkte dann ab rund 96 %); jede Grenze kannst du ändern. Das Verfahren richtet sich nach dem Aufgabenformat, nicht danach, ob es eine Klausur oder ein kleiner Test ist: <b>Hörverstehen</b> → Schlüssel „Hörverstehen – ISB-Rechentabelle“ (Lösungsgrad, 4 Punkte ab 40 %, ganze BE), in einer kombinierten Arbeit als eigener Prüfungsteil; <b>Schreiben und Sprachmittlung im Abiturformat</b> → nie über einen Prozentschlüssel, sondern mit dem Bewertungsraster (Inhalt und Sprache in Notenpunkten, 40 : 60) – also „Nach Prüfungsteilen bewerten“, auch wenn es die einzige Aufgabe ist; <b>Wortschatz- und Grammatiktest</b> ohne Abiturformat → eigener BE-Schlüssel mit diesen Schwellen. <button type="button" class="linkbtn" id="mfsUse">4 P. ab 50 % und 1 P. ab 33 % eintragen</button>' : 'KMS vom 08.03.2023 (Jgst. 11, gilt wie in 5–10): „ausreichend“ je nach Aufgabe zwischen 50 % und 60 % – bei Aufgaben mit viel eigener Sprachproduktion 50 %, bei Multiple Choice oder Kurzantworten im Hör- und Leseverstehen eher höher; die Grenze zu „ungenügend“ liegt immer bei 33 %. Den Wert legt die Lehrkraft für die jeweilige Arbeit fest; ein pauschaler Fachschaftsbeschluss ohne Blick auf die Aufgabe wäre „nicht sachgerecht“. Ein KMK-Raster gibt es für moderne Fremdsprachen nicht. <button type="button" class="linkbtn" data-mfs4="50">4 ab 50 %</button> · <button type="button" class="linkbtn" data-mfs4="55">55 %</button> · <button type="button" class="linkbtn" data-mfs4="60">60 %</button> (Note 5 ab 33 %)'}</p>` : ''}
      ${hvOK ? '<p class="hint" id="hvSrc" hidden>Hörverstehen wie die <b>ISB-Rechentabelle PuLSt</b> (Stand 12/2025): Teilnote über den Lösungsgrad – 15 P. ab 95 %, 4 P. ab 40 %, 1 P. ab 20 % –, die Grenzen werden <b>nicht</b> gerundet. Es zählen nur ganze BE (ISB-Leitfaden 04/2025, S. 3: keine halben BE im Hörverstehen). Empfohlen sind 20 bis 26 BE (ebd., S. 2). Für Schreiben und Sprachmittlung gibt es keinen Prozentschlüssel – dafür „Nach Prüfungsteilen bewerten“.</p>' : ''}
      ${kmkBad && kmkStored ? `<div class="needMsg" id="kmkBadMsg" style="margin:8px 0">Dieser Leistungsnachweis nutzt noch das ${up ? 'Gesamt-BE-Raster (4 P. ab 40 %)' : 'KMK-Raster (4 ab 40 %, 6 unter 20 %)'}. Für moderne Fremdsprachen gilt das nicht: „ausreichend“ je nach Aufgabe ab 50–60 %, ${up ? '1 Punkt' : 'Note 5'} ab 33 % (${up ? 'ISB-Leitfaden 04/2025, S. 4' : 'KMS vom 08.03.2023'})${up ? ', Hörverstehen nach der ISB-Rechentabelle' : ''}. Libretto ändert gespeicherte Noten nie von selbst. <button type="button" class="linkbtn" id="kmkFix">${up ? '4 P. ab 50 % und 1 P. ab 33 %' : 'Note 4 ab 50 % und Note 5 ab 33 %'} einsetzen</button> – dann „Sichern“; wer sich dadurch ändert, siehst du vorher in der Simulation.</div>` : ''}
      <p class="hint" id="kmkSrc" hidden>${up ? 'Amtliche BE-Tabelle der Abiturprüfung ab 2026 (ISB-Kontaktbrief Oberstufe 2025, S. 4; KMK-Vereinbarung zur gymnasialen Oberstufe i. d. F. vom 06.06.2024): 15 P. ab 95 %, 6 P. ab 50 %, 5 P. ab 45 %, 4 P. ab 40 %, 3 ab 33 %, 2 ab 27 %, 1 ab 20 %. Die Grenzen sind ganze BE, kaufmännisch gerundet – genau wie die amtliche Tabelle (z. B. 90 BE: 2 Punkte ab 24 BE, 15 Punkte ab 86 BE). Halbe BE bei den erreichten Punkten sind trotzdem möglich (nicht im Hörverstehen; in spät beginnenden Fremdsprachen ausdrücklich erwünscht, ISB-Leitfaden 04/2025) – die Grenze bleibt ganzzahlig, z. B. reichen 33,5 BE nicht für eine Grenze von 34. ' + (R.isAncient(c.subject) ? 'In Latein und Griechisch ist dieser KMK-Bewertungsschlüssel für BE-Bewertungen in der Qualifikationsphase verbindlich (KMS vom 31.07.2023, Anlage 3 Nr. 8 bzw. Anlage 4 Nr. 9); die Übersetzung wird getrennt nach Fehlern bewertet.' : 'Verbindlich für BE-bewertete Abiturprüfungen bzw. Prüfungsteile; für andere Leistungsnachweise legen Lehrkraft und Fachschaft den Schlüssel fest, soweit keine Fachvorgabe besteht.') : 'KMK-Raster: die Prozentgrenzen der Abitur-Tabelle als Noten (1 ab 85 %, 2 ab 70 %, 3 ab 55 %, 4 ab 40 %, 5 ab 20 %). Bei ganzen Punkten kaufmännisch gerundet, bei halben Punkten aufgerundet. Eine Vorlage – keine Pflicht für die Unter- und Mittelstufe.'}</p>
      <p class="hint" id="ownHint">${up ? 'Die Punkte 5–15 werden gleichmäßig zwischen der Grenze für 4 Punkte (unterste 4) und 100 % verteilt, 2 und 3 Punkte zwischen 1 und 4 Punkten.' : 'Die Noten 1–3 werden gleichmäßig zwischen der Grenze für die 4 und 100 % verteilt.'} Jede Grenze kannst du danach noch einzeln ändern.</p>
    </div>
    ${dist && dist.n ? `<div class="subhead">Notenspiegel <small class="hint" style="font-weight:400">– ändert sich live mit den Grenzen</small></div><div id="distLive">${distHTML(dist, null, up, countSpan(c, a, up))}</div>
      <details class="sim" id="simBox"><summary>Simulation: Was passiert, wenn ich die Grenzen verschiebe?</summary><div id="simBody"></div></details>` : ''}
    <div id="impSec"><div class="subhead">Noten aus Datei übernehmen</div>
    <div class="importBox"><div><b>Notenliste einlesen</b><p class="hint">Z. B. die „Notenliste (CSV für Excel)“ aus <b>Voce</b> nach einer mündlichen Schulaufgabe. Libretto ordnet die ${up ? 'Notenpunkte' : 'Noten'} über die Namen zu; du kannst sie danach in der Tabelle ändern.</p><p class="hint" id="aImpInfo" hidden></p></div>
      <div class="panelBtns" style="margin:0"><button type="button" class="mini" id="aImpBtn">Datei wählen …</button></div><input type="file" id="aImpFile" accept=".csv,.txt" hidden></div></div>
    ${field('Notiz (nur für dich)', `<textarea id="aNote" rows="2">${esc(a.note || '')}</textarea>`)}
    ${isNew ? '' : '<div class="panelBtns"><button type="button" class="mini" id="aPrint">Notenliste drucken (PDF)</button><button type="button" class="mini" id="aWord">als Word</button>' + (R.byTask(a) || R.byParts(a) ? `<button type="button" class="mini accent" id="aPrintD" title="${a.alt && R.byParts(a) ? 'Mit den Teilnoten für Übersetzung und Aufgabenteil' : R.byParts(a) ? 'Mit Inhalt, Sprache und Teilnote je Prüfungsteil' : 'Mit den Punkten jeder Aufgabe je Schüler, Ø Punkten und Lösungsquote je Aufgabe'}">Detailliert (PDF)</button><button type="button" class="mini" id="aWordD">Detailliert als Word</button><button type="button" class="mini" id="aTkOpen">${R.byParts(a) ? 'Teilnoten eintragen …' : 'Aufgabenpunkte eintragen …'}</button>` : '') + (R.byParts(a) && !a.alt && upper(c) ? `<button type="button" class="mini accent" id="aSlips" title="Je Schüler ein Abschnitt mit allen Prüfungsteilen und der Rechnung als Tabelle – zum Ausschneiden">Schülerübersichten (PDF)</button><button type="button" class="mini" id="aSlipsG" title="Dasselbe mit Balken: jede Teilnote auf der Skala 0–15 und wie sie zur Gesamtnote beiträgt">grafisch</button>` : '') + '</div><button type="button" class="danger" id="aDel">Leistungsnachweis löschen</button>'}`;
  const read = d => {
    a.type = d.querySelector('#aType').value; a.title = d.querySelector('#aTitle').value.trim(); a.date = d.querySelector('#aDate').value; a.short = d.querySelector('#aShort').value.trim();
    if (up) a.term = d.querySelector('#aTerm').value;
    if (a.type === 'jst') a.countAs = d.querySelector('#aCount').value; else delete a.countAs;
    const bw = +d.querySelector('#aBigW').value; if (R.isBig(a) && bw !== 1) a.bigWeight = bw; else delete a.bigWeight;
    { const st = d.querySelector('#aSt'); if (st && !R.isBig(a) && a.type !== 'prak') a.st = st.value; else delete a.st; }
    const w = d.querySelector('#aW').value; if (!R.isBig(a) && w !== '') a.weight = +w; else delete a.weight;
    const ar = d.querySelector('#aArea').value; if (!R.isBig(a) && ar !== R.TYPES[a.type].area) a.area = ar; else delete a.area;
    a.usePoints = d.querySelector('#aPts').checked;
    const wantAlt = !!altR && !!d.querySelector('#aAlt') && d.querySelector('#aAlt').checked;
    const wantParts = !wantAlt && up && !!d.querySelector('#aParts') && d.querySelector('#aParts').checked;
    if (wantAlt) {
      const old = a.alt && a.parts ? a.parts : [];
      a.usePoints = false; a.byParts = true; a.alt = altR;
      a.parts = [{ id: (old[0] && old[0].id) || 'ue', label: 'Übersetzung', kind: 'n', w: altR.w[0] }, { id: (old[1] && old[1].id) || 'at', label: 'Aufgabenteil', kind: 'n', w: altR.w[1] }];
      reParts(c, a);
    } else if (wantParts) {
      delete a.alt;
      syncParts();
      if (!parts.length) { toast('Bitte mindestens einen Prüfungsteil anlegen'); return false; }
      if (parts.some(p => p.kind !== 'is' && !(+p.max > 0))) { partHint(); const m = d.querySelector('.prow [data-pm].need'); if (m) { m.scrollIntoView({ block: 'center', behavior: 'smooth' }); setTimeout(() => m.focus(), 250); } toast('Erreichbare BE fehlen – das rot umrandete Feld ausfüllen', 4500); return false; }
      const W = parts.reduce((x, p) => x + (+p.w || 0), 0);
      if (Math.abs(W - 100) > 0.01) { toast(`Die Anteile ergeben zusammen ${String(Math.round(W * 10) / 10).replace('.', ',')} % – bitte auf 100 % bringen`); return false; }
      const over = parts.find(p => p.kind !== 'is' && Object.values(a.results || {}).some(r => r && r.pp && r.pp[p.id] != null && r.pp[p.id] !== '' && typeof r.pp[p.id] !== 'object' && +r.pp[p.id] > +p.max));
      if (over) { toast(`Bei „${over.label}“ sind schon mehr BE eingetragen, als die neue Höchstzahl zulässt`); return false; }
      a.usePoints = false; a.byParts = true;
      a.parts = parts.map((p, i) => ({ id: p.id, label: p.label || 'Teil ' + (i + 1), kind: p.kind === 'is' ? 'is' : 'be', ...(p.kind === 'is' ? {} : { max: +p.max, fmt: R.isHVPart(p) ? 'hv' : 'be' }), w: +p.w }));
      reParts(c, a);
      if (d.querySelector('#pRemember').checked) D.settings.partDefaults[pKey] = a.parts.map(({ id, ...p }) => p);
    } else if (a.byParts) a.byParts = false;   /* a.parts und die Teilnoten bleiben gespeichert */
    const wantTasks = a.usePoints && d.querySelector('#aTasks').checked;
    if (wantTasks) {
      syncTasks();
      /* noch keine Höchstpunkte eingetragen: eine Startspalte anlegen, die Höchstpunkte trägt man im Eingabeblatt ein */
      if (!tasks.length || tasks.every(t => t.max === '' || t.max == null)) { tasks = [{ id: tasks.length ? tasks[0].id : uid(), label: '1', max: 1 }]; d.querySelector('#aMax').value = 1; manualKey = false; suggest(true); }
      if (!tasks.length) { toast('Bitte mindestens eine Aufgabe anlegen'); return false; }
      if (tasks.some(t => !(+t.max > 0))) { toast('Bitte bei jeder Aufgabe die erreichbaren Punkte eintragen'); return false; }
      tasks.forEach((t, i) => { if (!t.label) t.label = String(i + 1); });
      const over = tasks.find(t => Object.values(a.results || {}).some(r => r && r.pts && r.pts[t.id] != null && r.pts[t.id] !== '' && +r.pts[t.id] > +t.max));
      if (over) { toast(`Bei Aufgabe ${over.label} sind schon mehr Punkte eingetragen, als die neue Höchstpunktzahl zulässt`); return false; }
      /* vor dem Übernehmen merken, wessen Summe genau aus den Aufgabenpunkten kam – die rechnet auch bei geändertem Faktor neu */
      R.markRawOrigin(a);
      a.tasks = tasks.map(t => ({ id: t.id, label: t.label, max: +t.max, ...(+t.f > 0 && +t.f !== 1 ? { f: +t.f } : {}), ...(t.g ? { g: t.g, gl: t.gl || 'Schreiben' } : {}) }));
    }
    a.byTask = !!wantTasks;   /* a.tasks und die Aufgabenpunkte bleiben auch dann gespeichert, wenn die Option ausgeschaltet wird */
    const max = +d.querySelector('#aMax').value;
    const ks = $$('[data-k]', d).map(i => i.value === '' ? null : +i.value);
    if (a.usePoints) {
      if (!max || ks.some(x => x == null)) { toast('Bitte erreichbare Punkte und Notenschlüssel ausfüllen'); return false; }
      { const err = R.keyProblem(max, ks); if (err) { toast(err); const kb = d.querySelector('#keyBox'); if (kb) kb.scrollIntoView({ block: 'center', behavior: 'smooth' }); return false; } }
      const preset = d.querySelector('#aPreset').value, tend = !up && preset === 'kmk' && d.querySelector('#aTend').checked, step = d.querySelector('#aStep').value === 'tab' ? (+d.querySelector('#aStep').dataset.prev || 0.5) : +d.querySelector('#aStep').value;
      /* alte Vorgabe („5 P. ab …“) unverändert gelassen → in der alten Form speichern, damit der Fachstandard exakt gleich bleibt */
      const keepOld = up && pre.q4 == null && pre.p5 != null && +d.querySelector('#aA1').value === R.anchor4(pre) && +d.querySelector('#aA2').value === +pre.p1;
      const anchors = keepOld ? { p5: +pre.p5, p1: +pre.p1, step, preset } : up ? { q4: +d.querySelector('#aA1').value, p1: +d.querySelector('#aA2').value, step, preset } : { p4: +d.querySelector('#aA1').value, p5: +d.querySelector('#aA2').value, step, preset, tend: !up && d.querySelector('#aTend').checked };
      a.key = up ? { max, pointThresholds: ks, pct15: pctArr, anchors, preset } : { max, thresholds: ks, pct: pctArr, anchors, preset, tend, ...(tend ? { tendThresholds: R.suggestKeyKmk(max, false, step, true).tendThresholds } : {}) };
      if (d.querySelector('#aRemember').checked) { D.settings.keyPresets[pKey] = anchors; if (wantTasks) D.settings.taskDefaults[pKey] = true; else delete D.settings.taskDefaults[pKey]; }
      R.markRawOrigin(a);
      Object.values(a.results || {}).forEach(r => {
        if (!r || r.status) return;
        /* Ein von Hand eingetragener Gesamtwert (r.rawMan) bleibt stehen; sonst kommt die Summe aus den Aufgabenpunkten */
        R.regrade(a, r, up);
      });
      if (R.byTask(a) && Object.values(a.results || {}).some(r => r && !r.status && r.raw != null && r.pts && !a.tasks.every(t => r.pts[t.id] != null && r.pts[t.id] !== ''))) toast('Hinweis: Bei einigen Personen fehlen Punkte für neue Aufgaben – bitte im Eingabeblatt prüfen.', 4500);
    }
    a.note = d.querySelector('#aNote').value;
    return true;
  };
  const commit = d => {
    if (!read(d)) return false;
    if (up && a.type === 'sa' && !R.termHasSA(c, a.term)) toast(`Hinweis: In ${a.term} ist für dieses Fach keine Schulaufgabe vorgesehen (§ 29 GSO).`);
    const i = c.assessments.findIndex(x => x.id === a.id);
    if (i >= 0) c.assessments[i] = a; else c.assessments.push(a);
    if (R.isBig(a) && !up) { const cf = classesOf(c).flatMap(cls => R.dateConflicts(classBigDates(cls))).filter(x => x.items.some(it => it.date === a.date)); if (cf.length) toast('Achtung: ' + cf[0].text, 5000); }
    save(); render();
    return true;
  };
  const { dlg, close } = sheet({ title: isNew ? 'Neuer Leistungsnachweis' : (a.title || R.TYPES[a.type].label), wide: true, body, onOk: d => commit(d) });
  /* Hinweis (kein Hindernis): Datum fällt auf Wochenende, Feiertag oder Ferien */
  const dateW = () => { const v = dlg.querySelector('#aDate').value, el = dlg.querySelector('#aDateW'); if (!el) return; let t = '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) { const [y, m] = v.split('-'), f = (Cal.freeDays(+y, +m - 1)[v] || [])[0], wd = new Date(v + 'T12:00').getDay();
      t = f ? (f.kind === 'feiertag' ? 'Feiertag: ' : '') + f.name : wd === 0 ? 'Sonntag' : wd === 6 ? 'Samstag' : ''; }
    el.textContent = t ? '⚠ ' + t : ''; el.hidden = !t; };
  dlg.querySelector('#aDate').addEventListener('input', dateW); dlg.querySelector('#aDate').addEventListener('change', dateW); dateW();
  /* Seminare: übliche Formen kleiner Leistungsnachweise als Vorschläge (ISB-Leitfaden W-Seminar) */
  if (c.seminar || isPSem(c)) combo(dlg.querySelector('#aTitle'), () => c.seminar ? LN_W : LN_P, { openOnFocus: false });
  { const ast = dlg.querySelector('#aSt'); if (ast) { if (!isNew) ast.dataset.touched = 1; ast.onchange = () => { ast.dataset.touched = 1; }; } }   /* Leistungsfach Sport: Wahl der Lehrkraft bleibt beim Wechsel der Art */
  const upd = () => {
    const t = dlg.querySelector('#aType').value; const big = t === 'sa' || (t === 'jst' && dlg.querySelector('#aCount').value === 'big');
    dlg.querySelector('#jstOpt').hidden = t !== 'jst'; dlg.querySelector('#bigOpt').hidden = !big; dlg.querySelector('#smallOpt').hidden = big;
    { const so = dlg.querySelector('#stOpt'); if (so) { so.hidden = big || t === 'prak'; if (!dlg.querySelector('#aSt').dataset.touched) dlg.querySelector('#aSt').value = R.sportPart({ type: t, st: a.type === t ? a.st : undefined }); } }
    const al = !!dlg.querySelector('#aAlt') && dlg.querySelector('#aAlt').checked;
    if (dlg.querySelector('#altHint')) { dlg.querySelector('#altHint').hidden = !al; dlg.querySelector('#altBtns').hidden = !al; }
    if (al && dlg.querySelector('#aParts')) dlg.querySelector('#aParts').checked = false;
    const pt = al || (up && dlg.querySelector('#aParts') && dlg.querySelector('#aParts').checked);
    if (dlg.querySelector('#partBox')) { dlg.querySelector('#partBox').hidden = !pt || al; dlg.querySelector('#ptsRow').hidden = !!pt; if (pt && !al) { dlg.querySelector('#aPts').checked = false; drawParts(); } }
    if (al) { dlg.querySelector('#aPts').checked = false; dlg.querySelector('#aPts').closest('.rows').hidden = true; } else dlg.querySelector('#aPts').closest('.rows').hidden = false;
    dlg.querySelector('#keyBox').hidden = !dlg.querySelector('#aPts').checked || !!pt;
    const sb = dlg.querySelector('#simBox'); if (sb) sb.hidden = !!pt;
    if (!dlg.querySelector('#aArea').dataset.touched) dlg.querySelector('#aArea').value = R.TYPES[t].area;
    const pv = dlg.querySelector('#aPreset').value, hv = pv === 'hv', kmk = pv === 'kmk' || hv, tk = dlg.querySelector('#aTasks').checked;
    dlg.querySelector('#anchorBox').hidden = kmk; dlg.querySelector('#kmkSrc').hidden = !kmk || hv; if (dlg.querySelector('#hvSrc')) dlg.querySelector('#hvSrc').hidden = !hv; if (dlg.querySelector('#mfsSrc')) dlg.querySelector('#mfsSrc').hidden = kmk; dlg.querySelector('#ownHint').hidden = kmk;
    const tb = dlg.querySelector('#tendBox'); if (tb) tb.hidden = !kmk || hv;
    /* Q12/Q13 mit amtlicher BE-Tabelle: Grenzen sind immer ganze BE (wie die Tabelle) – Auswahl sperren; halbe BE bei den erreichten Punkten bleiben möglich */
    { const st = dlg.querySelector('#aStep'), lock = up && kmk;
      if (lock && !st.disabled) { st.dataset.prev = st.value; if (![...st.options].some(o => o.value === 'tab')) st.insertAdjacentHTML('beforeend', '<option value="tab">ganze BE – wie die amtliche Tabelle</option>'); st.value = 'tab'; st.disabled = true; }
      else if (!lock && st.disabled) { st.disabled = false; st.value = st.dataset.prev || '0.5'; const o = st.querySelector('option[value="tab"]'); if (o) o.remove(); }
      { const o = st.querySelector('option[value="tab"]'); if (o) o.textContent = hv ? 'ganze BE – wie die Rechentabelle' : 'ganze BE – wie die amtliche Tabelle'; } }
    dlg.querySelector('#taskBox').hidden = !tk; dlg.querySelector('#impSec').hidden = tk || !!pt;
    const mx = dlg.querySelector('#aMax'); mx.readOnly = tk; mx.title = tk ? 'Summe der Aufgaben' : '';
  };
  /* Prüfungsteile (Oberstufe) */
  const partRow = p => `<div class="prow" data-pid="${p.id}"><input type="text" data-pl maxlength="24" placeholder="z. B. Hörverstehen" value="${esc(p.label || '')}"><select data-pk><option value="hv" ${R.isHVPart(p) ? 'selected' : ''}>BE · Hörverstehen (ganze BE)</option><option value="be" ${p.kind !== 'is' && !R.isHVPart(p) ? 'selected' : ''}>BE (Lösungsgrad)</option><option value="is" ${p.kind === 'is' ? 'selected' : ''}>Inhalt + Sprache</option></select><input type="number" data-pm min="1" step="0.5" placeholder="BE" value="${p.kind === 'is' ? '' : esc(p.max ?? '')}" ${p.kind === 'is' ? 'disabled' : ''}><span class="pw"><input type="number" data-pw min="0" max="100" step="1" value="${esc(p.w ?? '')}"> %</span><button type="button" class="mini del" data-pdel title="Prüfungsteil entfernen" aria-label="Prüfungsteil entfernen">×</button></div>`;
  function syncParts() { if (!dlg) return; $$('.prow', dlg).forEach(r => { const p = parts.find(x => x.id === r.dataset.pid); if (!p) return; p.label = r.querySelector('[data-pl]').value.trim(); { const k = r.querySelector('[data-pk]').value; p.kind = k === 'is' ? 'is' : 'be'; p.fmt = k === 'is' ? undefined : k; } p.max = p.kind === 'is' ? undefined : (r.querySelector('[data-pm]').value === '' ? '' : +r.querySelector('[data-pm]').value); p.w = r.querySelector('[data-pw]').value === '' ? '' : +r.querySelector('[data-pw]').value; }); }
  const partHint = () => { const W = parts.reduce((x, p) => x + (+p.w || 0), 0), ok = Math.abs(W - 100) < 0.01; const h = dlg.querySelector('#pHint');
    /* fehlende erreichbare BE deutlich zeigen: Feld rot umrandet und Hinweis */
    const miss = parts.filter(p => p.kind !== 'is' && !(+p.max > 0));
    $$('.prow', dlg).forEach(r => { const m = r.querySelector('[data-pm]'), p = parts.find(x => x.id === r.dataset.pid); if (m) m.classList.toggle('need', !!p && p.kind !== 'is' && !(+p.max > 0)); });
    if (h) h.innerHTML = `${parts.length} ${parts.length === 1 ? 'Prüfungsteil' : 'Prüfungsteile'} · Anteile zusammen <b style="color:${ok ? 'inherit' : 'var(--red)'}">${String(Math.round(W * 10) / 10).replace('.', ',')} %</b>${ok ? '' : ' – sie müssen 100 % ergeben'}`
      + (miss.length ? `<span class="needMsg">Bei ${miss.map(p => '„' + esc(p.label || 'BE-Teil') + '“').join(' und ')} ${miss.length === 1 ? 'fehlt' : 'fehlen'} noch die <b>erreichbaren BE</b> (rot umrandet) – ohne sie kann Libretto den Lösungsgrad nicht ausrechnen.</span>` : ''); };
  function drawParts() { const box = dlg.querySelector('#partRows'); if (!box) return; box.innerHTML = parts.map(partRow).join(''); partHint(); }
  if (dlg.querySelector('#partBox')) {
    dlg.querySelector('#partRows').addEventListener('input', () => { syncParts(); partHint(); });
    dlg.querySelector('#partRows').addEventListener('change', e => { if (e.target.matches('[data-pk]')) { syncParts(); drawParts(); } });
    dlg.querySelector('#partRows').addEventListener('click', async e => { const b = e.target.closest('[data-pdel]'); if (!b) return; syncParts(); const id = b.closest('.prow').dataset.pid;
      const n = Object.values(a.results || {}).filter(r => r && r.pp && r.pp[id] != null).length;
      if (n && !(await ask(`Prüfungsteil entfernen? Die dafür eingetragenen Werte von ${n} ${n === 1 ? 'Person' : 'Personen'} werden nicht mehr mitgerechnet (sie bleiben gespeichert).`, 'Entfernen', true))) return;
      parts = parts.filter(x => x.id !== id); drawParts(); });
    dlg.querySelector('#pAdd').onclick = () => { syncParts(); parts.push({ id: uid(), label: '', kind: 'is', w: '' }); drawParts(); const l = $$('.prow [data-pl]', dlg).pop(); if (l) l.focus(); };
    $$('[data-ptpl]', dlg).forEach(b => b.onclick = () => { syncParts(); const hv = parts.find(p => p.kind !== 'is'), old = parts.slice();
      parts = R.PARTS_TPL(b.dataset.ptpl).map((p, i) => ({ ...p, id: (old[i] && old[i].kind === p.kind) ? old[i].id : uid(), ...(p.kind !== 'is' && hv && +hv.max > 0 ? { max: hv.max } : {}) }));
      drawParts(); const m = dlg.querySelector('.prow [data-pm]:not([disabled])'); if (m && m.value === '') m.focus(); });
    dlg.querySelector('#pEnter').onclick = () => { if (commit(dlg) !== false) openSub(dlg, () => partsSheet(c, c.assessments.find(x => x.id === a.id)), () => assessmentSheet(c, c.assessments.find(x => x.id === a.id))); };
    dlg.querySelector('#aParts').addEventListener('change', upd);
  }
  ['#aType', '#aCount', '#aPts', '#aTasks'].forEach(s => dlg.querySelector(s).addEventListener('change', upd));
  $$('[data-mfs4]', dlg).forEach(b => b.onclick = () => { dlg.querySelector('#aPreset').value = 'custom'; dlg.querySelector('#aA1').value = b.dataset.mfs4; dlg.querySelector('#aA2').value = 33; upd(); manualKey = false; if (+dlg.querySelector('#aMax').value > 0) suggest(true); });
  if (dlg.querySelector('#kmkFix')) dlg.querySelector('#kmkFix').onclick = () => { const p = dlg.querySelector('#aPreset'); p.value = 'custom'; const o = p.querySelector('option[value=kmk]'); if (o) o.remove(); dlg.querySelector('#aA1').value = 50; dlg.querySelector('#aA2').value = 33; upd(); manualKey = false; if (+dlg.querySelector('#aMax').value > 0) suggest(true); dlg.querySelector('#kmkBadMsg').hidden = true; toast('Grenzen nach den Vorgaben eingesetzt – mit „Sichern“ übernehmen'); };
  if (dlg.querySelector('#mfsUse')) dlg.querySelector('#mfsUse').onclick = () => { dlg.querySelector('#aPreset').value = 'custom'; dlg.querySelector('#aA1').value = 50; dlg.querySelector('#aA2').value = 33; upd(); manualKey = false; if (+dlg.querySelector('#aMax').value > 0) suggest(true); };
  if (dlg.querySelector('#aAlt')) { dlg.querySelector('#aAlt').addEventListener('change', e => { e.target.dataset.touched = 1; upd(); });
    /* neue Schulaufgabe in Latein/Griechisch: zweigeteilt vorschlagen (andere Arten: aus) */
    if (isNew) dlg.querySelector('#aType').addEventListener('change', () => { const x = dlg.querySelector('#aAlt'); if (!x.dataset.touched) { x.checked = dlg.querySelector('#aType').value === 'sa'; upd(); } }); dlg.querySelector('#altEnter').onclick = () => { if (commit(dlg) !== false) { close(); partsSheet(c, c.assessments.find(x => x.id === a.id)); } }; }
  dlg.querySelector('#aArea').addEventListener('change', e => e.target.dataset.touched = 1);
  upd();
  /* Notenspiegel live: rechnet die schon eingetragenen Rohpunkte mit den gerade eingegebenen Grenzen (noch nichts gespeichert) */
  function liveDist() {
    const box = dlg.querySelector('#distLive'); if (!box || !dist) return;
    const vals = $$('[data-k]', dlg).map(i => i.value === '' ? NaN : +i.value);
    const ok = dlg.querySelector('#aPts').checked && vals.length && vals.every(x => !isNaN(x)), key = up ? { pointThresholds: vals } : { thresholds: vals };
    const list = c.students.map(s => { const r = a.results && a.results[s.id]; if (!r) return null; if (ok && !r.status && r.raw != null) { const k = R.keyResult(r.raw, key, up); if (k) return k.v; } return R.valueOf(r, up); }).filter(v => v != null);
    const counts = up ? Array(16).fill(0) : Array(6).fill(0); list.forEach(v => counts[up ? v : v - 1]++);
    const weak = up ? list.filter(v => v < 5).length : list.filter(v => v >= 5).length;
    box.innerHTML = distHTML({ counts, n: list.length, avg: R.mean(list), weak, weakShare: list.length ? weak / list.length : 0 }, dist.avg, up, countSpan(c, a, up));
  }
  /* Simulation: dieselben Rohpunkte mit verschiedenen Notenschlüsseln durchgerechnet – nur zum Vergleichen, gespeichert wird erst mit „Sichern“ */
  let simShow = null;   /* Index der Variante, deren Klassenliste aufgeklappt ist */
  function simRender() {
    const box = dlg.querySelector('#simBody'), det = dlg.querySelector('#simBox'); if (!box || !det || !det.open) return;
    const max = +dlg.querySelector('#aMax').value, step = (dlg.querySelector('#aStep').value === 'tab' ? 1 : +dlg.querySelector('#aStep').value) || 0.5;
    const raws = c.students.map(s => a.results && a.results[s.id]).filter(r => r && !r.status && !r.nt && r.raw != null).map(r => +r.raw);
    if (!dlg.querySelector('#aPts').checked || !max || !raws.length) { box.innerHTML = '<p class="hint">Die Simulation rechnet mit den eingetragenen Rohpunkten. Sobald Punkte da sind, siehst du hier, wie sich Durchschnitt und Notenspiegel mit anderen Grenzen ändern.</p>'; return; }
    const a1 = +dlg.querySelector('#aA1').value, a2 = +dlg.querySelector('#aA2').value, kn = up ? 'pointThresholds' : 'thresholds';
    const curTh = $$('[data-k]', dlg).map(i => i.value === '' ? NaN : +i.value), same = th => th.length === curTh.length && th.every((x, i) => Math.abs(x - curTh[i]) < 1e-9);
    const rawOf = st => { const r = a.results && a.results[st.id]; return r && !r.status && r.raw != null ? +r.raw : null; };
    const sAt = th => st => { const p = rawOf(st); if (p == null) return null; const k = R.keyResult(p, { [kn]: th }, up); return k ? k.v : null; };
    const sNow = curTh.every(x => !isNaN(x)) ? sAt(curTh) : st => { const r = a.results && a.results[st.id]; return r && !r.status && r.v != null ? r.v : null; };
    const rows = [];
    const add = (label, sub, th, apply) => { if (!th || th.some(x => x == null || isNaN(x))) return;
      const vs = raws.map(p => { const k = R.keyResult(p, { [kn]: th }, up); return k ? k.v : null; }).filter(v => v != null); if (!vs.length) return;
      const counts = up ? null : [1, 2, 3, 4, 5, 6].map(g => vs.filter(v => v === g).length);
      rows.push({ label, sub, th, avg: R.mean(vs), counts, weak: up ? vs.filter(v => v < 5).length : vs.filter(v => v >= 5).length, good: up ? vs.filter(v => v >= 10).length : null, cur: same(th), apply }); };
    if (curTh.every(x => !isNaN(x))) add('Jetzt eingestellt', '', curTh, null);
    (up ? [55, 50, 45, 40] : [60, 55, 50, 45, 40]).forEach(x => { const y = a2 > 0 && a2 < x ? Math.min(a2, x - (up ? 15 : 10)) : Math.round(x / 2);
      const th = up ? R.suggestKey15(max, R.pct15FromAnchors(x, y), step).pointThresholds : R.suggestKey(max, R.pctFromAnchors(x, y), step).thresholds;
      add(up ? `4 Punkte (4–) ab ${x} %` : `Note 4 ab ${x} %`, up ? `1 Punkt ab ${y} %` : `Note 5 ab ${y} %`, th, { preset: 'custom', x, y }); });
    if (hvOK) add('Hörverstehen (ISB-Rechentabelle)', 'Lösungsgrad, Grenzen ungerundet', R.suggestKeyHV(max).pointThresholds, { preset: 'hv' });
    const kk = R.suggestKeyKmk(max, up, step, true); add(up ? 'Amtliche BE-Tabelle' : 'KMK-Raster', up ? '4 Punkte ab 40 %, 5 Punkte ab 45 %' : 'Note 4 ab 40 %', up ? kk.pointThresholds : kk.thresholds, { preset: 'kmk' });
    /* „Jetzt eingestellt“ nur zeigen, wenn es keiner der Vorschläge ist */
    const list = rows.filter((r, i) => i > 0 || !rows.slice(1).some(x => x.cur));
    box.innerHTML = `<table class="simTbl"><thead><tr><th>Schlüssel</th><th>Ø</th>${up ? '<th>ab 10 P.</th>' : [1, 2, 3, 4, 5, 6].map(g => `<th><i style="background:var(--gr${g})"></i>${g}</th>`).join('')}<th>${up ? 'unter 5 P.' : '5 und 6'}</th><th></th></tr></thead><tbody>${list.map((r, i) => `<tr class="${r.cur ? 'cur' : ''}"><td><b>${esc(r.label)}</b>${r.sub ? `<small>${esc(r.sub)}</small>` : ''}</td><td class="n"><b>${fmt(r.avg, 2)}</b></td>${up ? `<td class="n">${r.good}</td>` : r.counts.map(n => `<td class="n">${n || '<span class="z">·</span>'}</td>`).join('')}<td class="n">${r.weak}<small>${Math.round(r.weak / raws.length * 100)} %</small></td><td class="simAct">${r.cur ? '<span class="pill done">aktuell</span>' : `<button type="button" class="mini ${simShow === i ? 'on' : ''}" data-simcls="${i}" title="Klassenliste: bei wem sich mit diesem Schlüssel die Note ändert">Klasse</button>${r.apply ? `<button type="button" class="mini" data-sim="${i}">Übernehmen</button>` : ''}`}</td></tr>`).join('')}</tbody></table>
      ${simShow != null && list[simShow] ? `<p class="simFor">Klassenliste: <b>jetzt</b> → <b>${esc(list[simShow].label)}</b>${list[simShow].sub ? ' (' + esc(list[simShow].sub) + ')' : ''}</p>` + simClassHTML(c, up, sNow, sAt(list[simShow].th)) : ''}
      <p class="hint">Gerechnet mit den Rohpunkten von ${raws.length} ${raws.length === 1 ? 'Person' : 'Personen'}. „Klasse“ zeigt, bei wem sich die Note ändern würde. „Übernehmen“ trägt die Grenzen oben ein – gespeichert wird erst mit „Sichern“. Welche Grenzen gelten, entscheiden Lehrkraft und Fachschaft im Rahmen der Fachvorgaben.</p>`;
    $$('[data-simcls]', box).forEach(b => b.onclick = () => { const i = +b.dataset.simcls; simShow = simShow === i ? null : i; simRender(); });
    if (simShow != null && list[simShow]) simPrintWire(box, () => modelSim(c, a, `Notenschlüssel „${list[simShow].label}${list[simShow].sub ? ' · ' + list[simShow].sub : ''}“ statt des jetzt eingestellten`, sNow, sAt(list[simShow].th)));
    $$('[data-sim]', box).forEach(b => b.onclick = () => { const ap = list[+b.dataset.sim].apply; if (!ap) return;
      dlg.querySelector('#aPreset').value = ap.preset; if (ap.preset === 'custom') { dlg.querySelector('#aA1').value = ap.x; dlg.querySelector('#aA2').value = ap.y; }
      upd(); manualKey = false; suggest(true); });
  }
  const showPct = () => { const max = +dlg.querySelector('#aMax').value; const el = dlg.querySelector('#keyPct');
    /* Prozentwert direkt unter jeder Grenze (auch bei den zwei Zeilen der Oberstufe richtig zugeordnet) */
    $$('[data-k]', dlg).forEach(inp => { const sp = dlg.querySelector(`[data-kp="${inp.dataset.k}"]`); if (sp) sp.textContent = max && inp.value !== '' ? String(Math.round(+inp.value / max * 1000) / 10).replace('.', ',') + ' %' : ''; });
    el.innerHTML = ''; liveDist(); simRender(); };
  const suggest = quiet => {
    const max = +dlg.querySelector('#aMax').value; if (!max) { if (!quiet) toast('Erst erreichbare Punkte eingeben'); return; }
    const step = dlg.querySelector('#aStep').value === 'tab' ? 1 : +dlg.querySelector('#aStep').value;
    if (dlg.querySelector('#aPreset').value === 'hv') {
      const kk = R.suggestKeyHV(max); pctArr = kk.pct15;
      $$('[data-k]', dlg).forEach((inp, i) => inp.value = kk.pointThresholds[i]); showPct(); return;
    }
    if (dlg.querySelector('#aPreset').value === 'kmk') {
      const kk = R.suggestKeyKmk(max, up, step, true); pctArr = up ? kk.pct15 : kk.pct;
      $$('[data-k]', dlg).forEach((inp, i) => inp.value = (up ? kk.pointThresholds : kk.thresholds)[i]); showPct(); return;
    }
    const x = +dlg.querySelector('#aA1').value, y = +dlg.querySelector('#aA2').value;
    if (!(x > y)) { if (!quiet) toast(up ? 'Die 4-Punkte-Grenze muss über der 1-Punkt-Grenze liegen' : 'Die Grenze für die 4 muss über der für die 5 liegen'); return; }
    /* unveränderte alte Vorgabe („5 P. ab …“): genau die alte Verteilung, damit sich der Fachstandard nicht still ändert */
    const old = up && pre.q4 == null && pre.p5 != null && x === R.anchor4(pre) && y === +pre.p1;
    pctArr = up ? (old ? R.pct15Old(+pre.p5, +pre.p1) : R.pct15FromAnchors(x, y)) : R.pctFromAnchors(x, y);
    const k = up ? R.suggestKey15(max, pctArr, step).pointThresholds : R.suggestKey(max, pctArr, step).thresholds;
    $$('[data-k]', dlg).forEach((inp, i) => inp.value = k[i]); showPct();
  };
  dlg.querySelector('#aSuggest').onclick = () => { manualKey = false; suggest(false); };
  if (dlg.querySelector('#simBox')) dlg.querySelector('#simBox').addEventListener('toggle', simRender);
  /* Vorgabe gewechselt: Grenzen sofort neu berechnen */
  dlg.querySelector('#aPreset').addEventListener('change', () => { upd(); manualKey = false; suggest(true); });
  /* eine Grenze von Hand geändert: ab jetzt „Eigene Grenzen“ (das KMK-Raster wäre sonst nicht mehr korrekt beschriftet) */
  $$('[data-k]', dlg).forEach(i => i.addEventListener('input', () => { manualKey = true; if (dlg.querySelector('#aPreset').value !== 'custom') { dlg.querySelector('#aPreset').value = 'custom'; upd(); } }));
  dlg.querySelector('#aStep').addEventListener('change', () => { if (!manualKey) suggest(true); });
  /* Punkte je Aufgabe */
  const taskRow = (t, n) => `${t.g && (tasks.findIndex(x => x.g === t.g) === tasks.indexOf(t)) ? `<div class="trowG">${esc(t.gl || 'Schreiben')} <small>– eine Aufgabe aus Inhalt und Sprache, gemeinsamer Faktor</small></div>` : ''}<div class="trowE${t.g ? ' inG' : ''}" data-tid="${t.id}"${t.g ? ` data-g="${t.g}"` : ''}><input type="text" data-tl maxlength="12" placeholder="${n}" value="${esc(t.label || '')}"><input type="number" data-tm step="0.5" min="0.5" placeholder="Punkte" value="${t.max == null ? '' : t.max}"><select data-tf title="Faktor: Die Punkte dieser Aufgabe zählen mehrfach (z. B. Schreibaufgabe × 2,5)" aria-label="Faktor">${factorOpts(t.f)}</select><button type="button" class="mini del" data-tdel title="Aufgabe entfernen" aria-label="Aufgabe entfernen">×</button></div>`;
  const syncTasks = () => $$('.trowE', dlg).forEach(r => { const t = tasks.find(x => x.id === r.dataset.tid); if (t) { t.label = r.querySelector('[data-tl]').value.trim(); const m = r.querySelector('[data-tm]').value; t.max = m === '' ? '' : +m; const f = +r.querySelector('[data-tf]').value; if (f > 0 && f !== 1) t.f = f; else delete t.f; } });
  const sumTasks = () => Math.round(tasks.reduce((x, t) => x + (+t.max || 0) * R.taskF(t), 0) * 100) / 100;
  const nOld = () => Object.values(a.results || {}).filter(r => r && !r.status && r.raw != null && !(r.pts && Object.keys(r.pts).length)).length;
  const updTasks = () => {
    if (!dlg.querySelector('#aTasks').checked) return;
    const sum = sumTasks(); dlg.querySelector('#aMax').value = sum || '';
    dlg.querySelector('#tHint').textContent = `${tasks.length} ${tasks.length === 1 ? 'Aufgabe' : 'Aufgaben'} · zusammen ${String(sum).replace('.', ',')} Punkte.` + (nOld() ? ` ${nOld()} ${nOld() === 1 ? 'Person hat' : 'Personen haben'} bisher nur Gesamtpunkte – sie bleiben bestehen, bis du für die Person Aufgabenpunkte einträgst.` : '');
    if (!manualKey) suggest(true); else showPct();
  };
  const drawTasks = () => { dlg.querySelector('#taskRows').innerHTML = tasks.map((t, i) => taskRow(t, i + 1)).join(''); updTasks(); };
  /* Faktor-Simulation direkt hier (gleicher Baustein wie in „Punkte je Aufgabe“) */
  const aTf = {};
  const aTfRender = () => {
    const det = dlg.querySelector('#aTfSim'), box = dlg.querySelector('#aTfBody'); if (!det) return;
    const valid = tasks.filter(t => +t.max > 0);
    const hasPts = Object.values(a.results || {}).some(r => r && !r.status && r.pts && Object.keys(r.pts).length);
    det.hidden = !a.key || !valid.length || !hasPts; if (det.hidden || !det.open) return;
    const B = JSON.parse(JSON.stringify(a)); B.tasks = JSON.parse(JSON.stringify(valid)); B.results = B.results || {};
    rekeyAssessment(B, up);
    Object.values(B.results).forEach(r => { if (r && !r.status && r.pts && B.tasks.every(x => r.pts[x.id] != null && r.pts[x.id] !== '')) R.applyTasks(B, r, up); });
    renderFactorSim(box, c, B, up, aTf, (u, f) => {
      $$('.trowE', dlg).filter(r => u.ids.includes(r.dataset.tid)).forEach(r => { const sel = r.querySelector('[data-tf]'); if (![...sel.options].some(o => +o.value === f)) sel.insertAdjacentHTML('beforeend', `<option value="${f}">× ${String(f).replace('.', ',')}</option>`); sel.value = String(f); });
      syncTasks(); updTasks(); aTfRender(); toast(`${u.label} zählt jetzt × ${String(f).replace('.', ',')} – wird mit „Sichern“ gespeichert`); }, 'ab jetzt');
  };
  dlg.querySelector('#aTfSim').addEventListener('toggle', aTfRender);
  ['input', 'change'].forEach(ev => dlg.querySelector('#taskRows').addEventListener(ev, () => setTimeout(() => { if (dlg.querySelector('#aTfSim').open) aTfRender(); })));
  if (!tasks.length) tasks.push({ id: uid(), label: '', max: '' });
  drawTasks();
  aTfRender();
  dlg.querySelector('#aTasks').addEventListener('change', () => { if (dlg.querySelector('#aTasks').checked) updTasks(); });
  dlg.querySelector('#tAdd').onclick = () => { syncTasks(); tasks.push({ id: uid(), label: '', max: '' }); drawTasks(); const l = $$('[data-tl]', dlg); l[l.length - 1].focus(); };
  dlg.querySelector('#taskRows').addEventListener('input', () => { syncTasks(); updTasks(); });
  dlg.querySelector('#taskRows').addEventListener('change', e => { if (e.target.matches('[data-tf]')) { syncTasks(); updTasks(); } });
  /* Schreibaufgabe: Faktor gilt für Inhalt und Sprache gemeinsam */
  dlg.querySelector('#taskRows').addEventListener('change', e => { const row = e.target.closest('.trowE'); if (!e.target.matches('[data-tf]') || !row || !row.dataset.g) return; $$(`.trowE[data-g="${row.dataset.g}"] [data-tf]`, dlg).forEach(x => { x.value = e.target.value; }); });
  dlg.querySelector('#taskRows').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('[data-tm]')) { e.preventDefault(); const rows = $$('.trowE', dlg); if (e.target.closest('.trowE') === rows[rows.length - 1]) dlg.querySelector('#tAdd').click(); else rows[rows.indexOf(e.target.closest('.trowE')) + 1].querySelector('[data-tl]').focus(); } });
  /* Tab im letzten Punktefeld: neue Zeile entsteht von selbst */
  dlg.querySelector('#taskRows').addEventListener('keydown', e => { if (e.key === 'Tab' && !e.shiftKey && e.target.matches('[data-tm]') && e.target.value !== '') { const rows = $$('.trowE', dlg); if (e.target.closest('.trowE') === rows[rows.length - 1]) { e.preventDefault(); dlg.querySelector('#tAdd').click(); } } });
  /* Schnelleingabe: Höchstpunkte als Zeile. Vorhandene Aufgaben werden der Reihe nach angepasst, Aufgaben mit schon eingetragenen Punkten bleiben immer erhalten. */
  const hasPts = id => Object.values(a.results || {}).some(r => r && r.pts && r.pts[id] != null && r.pts[id] !== '');
  const applyQuick = () => {
    const inp = dlg.querySelector('#tQuick'), raw = inp.value.trim(); if (!raw) return;
    const parts = (/[\s;]/.test(raw) ? raw.split(/[\s;]+/).map(x => x.replace(',', '.')) : raw.split(',')).filter(x => x !== '');
    const nums = parts.map(Number);
    if (!nums.length || nums.some(x => !(x > 0) || x > 1000)) { toast('Bitte nur Zahlen größer als 0 eingeben, z. B. 2 3 4 3 2 2 2'); return; }
    syncTasks();
    const keep = [];
    tasks.forEach((t, i) => { if (i < nums.length) { t.max = nums[i]; keep.push(t); } else if (hasPts(t.id)) keep.push(t); });
    for (let i = tasks.length; i < nums.length; i++) keep.push({ id: uid(), label: '', max: nums[i] });
    tasks = keep; inp.value = ''; drawTasks();
    if (tasks.length > nums.length) toast('Hinweis: Einige Aufgaben mit schon eingetragenen Punkten bleiben bestehen.', 4500);
  };
  dlg.querySelector('#tQuick').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); applyQuick(); } });
  dlg.querySelector('#tQuick').addEventListener('change', applyQuick);
  /* gleiche Aufgaben wie bei der letzten Arbeit dieses Kurses */
  const prevA = (c.assessments || []).filter(x => x.id !== a.id && x.tasks && x.tasks.length).sort((x, y) => String(y.date || '').localeCompare(String(x.date || '')))[0];
  const blankTasks = () => tasks.every(t => !t.label && (t.max === '' || t.max == null)) && !(a.tasks && a.tasks.length);
  const prevBtn = dlg.querySelector('#tPrev');
  if (prevA) { prevBtn.textContent = `Aufgaben von „${prevA.title || R.TYPES[prevA.type].label}“ übernehmen`; prevBtn.title = prevA.tasks.map(t => t.max + (R.taskF(t) !== 1 ? ' ×' + R.taskF(t) : '')).join(' · ').replace(/\./g, ','); prevBtn.hidden = false; }
  prevBtn.onclick = async () => {
    syncTasks();
    if (!blankTasks() && !(await ask('Die bisherigen Aufgaben dieser Arbeit werden durch die der letzten Arbeit ersetzt. Schon eingetragene Aufgabenpunkte bleiben gespeichert, zählen aber nicht mehr mit.', 'Übernehmen', true))) return;
    tasks = prevA.tasks.map(t => ({ id: uid(), label: t.label, max: t.max, ...(t.f ? { f: t.f } : {}) })); drawTasks();
  };
  dlg.querySelector('#taskRows').addEventListener('click', async e => {
    const b = e.target.closest('[data-tdel]'); if (!b) return;
    syncTasks(); const id = b.closest('.trowE').dataset.tid, t = tasks.find(x => x.id === id);
    const n = Object.values(a.results || {}).filter(r => r && r.pts && r.pts[id] != null && r.pts[id] !== '').length;
    if (n && !(await ask(`Aufgabe <b>${esc(t.label || '')}</b> entfernen? Die dafür eingetragenen Punkte von ${n} ${n === 1 ? 'Person' : 'Personen'} werden nicht mehr mitgerechnet (die Eingaben bleiben gespeichert).`, 'Entfernen', true))) return;
    tasks = tasks.filter(x => x.id !== id); if (!tasks.length) tasks.push({ id: uid(), label: '', max: '' }); drawTasks();
  });
  dlg.querySelector('#tEnter').onclick = () => { if (commit(dlg) !== false) openSub(dlg, () => taskSheet(c, c.assessments.find(x => x.id === a.id)), () => assessmentSheet(c, c.assessments.find(x => x.id === a.id))); };
  /* Schlüssel gleich mitrechnen, sobald Punkte oder Prozentgrenzen eingegeben sind (solange keine Grenze von Hand geändert wurde) */
  const autoKey = () => { if (!dlg.querySelector('#aTasks').checked && !manualKey && +dlg.querySelector('#aMax').value > 0) suggest(true); };
  /* Punkte geändert: KMK-Raster immer neu; eigene Grenzen nur, solange noch keine eingetragen sind (gespeicherte Grenzen bleiben stehen) */
  dlg.querySelector('#aMax').addEventListener('input', () => { if (['kmk', 'hv'].includes(dlg.querySelector('#aPreset').value) || $$('[data-k]', dlg).every(i => i.value === '')) autoKey(); });
  ['#aA1', '#aA2'].forEach(sel => dlg.querySelector(sel).addEventListener('input', () => { manualKey = false; autoKey(); }));
  upd();
  dlg.querySelector('#aImpBtn').onclick = () => dlg.querySelector('#aImpFile').click();
  dlg.querySelector('#aImpFile').onchange = async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try {
      const res = importGrades(await f.text(), c, up); const info = dlg.querySelector('#aImpInfo'); info.hidden = false;
      if (res.error) { info.textContent = res.error; return; }
      a.results = a.results || {}; Object.assign(a.results, res.results);
      info.innerHTML = `<b>${res.n} ${up ? 'Ergebnisse' : 'Noten'} übernommen</b>${res.missing.length ? ' · nicht in der Datei: ' + esc(res.missing.join('; ')) : ''}${res.unknown.length ? ' · nicht im Kurs: ' + esc(res.unknown.join('; ')) : ''}. Mit „Sichern“ werden sie eingetragen.`;
    } catch (err) { console.error(err); toast('Datei konnte nicht gelesen werden'); }
  };
  dlg.querySelector('#aMax').addEventListener('input', showPct); $$('[data-k]', dlg).forEach(i => i.addEventListener('input', showPct)); showPct();
  const del = dlg.querySelector('#aDel'); if (del) del.onclick = async () => {
    const n = Object.keys(a.results || {}).length;
    if (await ask(`„${esc(a.title || R.TYPES[a.type].label)}“ ${n ? `mit ${n} eingetragenen Ergebnissen ` : ''}löschen?`, 'Löschen', true)) { toTrash('assessment', `${a.title || R.TYPES[a.type].label}${a.date ? ' vom ' + fdate(a.date) : ''} · ${c.name} ${c.subject}`, c.assessments.find(x => x.id === a.id), { courseId: c.id }); c.assessments = c.assessments.filter(x => x.id !== a.id); save(); close(); render(); toast('Gelöscht – 60 Tage lang unter „Sicherung“ wiederherstellbar', 4000); }
  };
  const cur = () => c.assessments.find(x => x.id === a.id);
  const pd = dlg.querySelector('#aPrintD'); if (pd) { pd.onclick = () => exportModel(modelAssessment(c, cur(), { detail: true }), 'pdf'); dlg.querySelector('#aWordD').onclick = () => exportModel(modelAssessment(c, cur(), { detail: true }), 'docx'); dlg.querySelector('#aTkOpen').onclick = () => openSub(dlg, () => taskSheet(c, cur()), () => assessmentSheet(c, cur())); }
  const slips = async graf => { const m = modelSlips(c, cur(), graf);
    if (!m.slips.items.length) return toast('Noch keine vollständigen Ergebnisse – erst alle Prüfungsteile eintragen');
    await exportModel(m, 'pdf');
    if (m.skipped.length) toast(`Ohne Übersicht (noch nicht vollständig, abwesend oder Nachtermin): ${m.skipped.map(x => x.name).join('; ')}`, 6000); };
  const sl = dlg.querySelector('#aSlips'); if (sl) { sl.onclick = () => slips(false); dlg.querySelector('#aSlipsG').onclick = () => slips(true); }
  const pr = dlg.querySelector('#aPrint'); if (pr) { pr.onclick = () => exportModel(modelAssessment(c, c.assessments.find(x => x.id === a.id)), 'pdf'); dlg.querySelector('#aWord').onclick = () => exportModel(modelAssessment(c, c.assessments.find(x => x.id === a.id)), 'docx'); }
}

/* Notenspiegel (Balken + Kennzahlen); old = Durchschnitt vor der Änderung der Grenzen (zeigt „bisher …“, wenn er sich unterscheidet) */
function distHTML(dist, old, up, cnt) {
  const chg = old != null && dist.avg != null && Math.abs(old - dist.avg) > 0.004;
  return `<div class="distBar" style="--n:${dist.counts.length}">${dist.counts.map((n, i) => `<div>${n}<i style="height:${dist.n ? Math.max(2, n / Math.max(1, ...dist.counts) * 56) : 2}px;background:var(--gr${up ? R.POINT_GRADE(i) : i + 1})"></i>${up ? i : i + 1}</div>`).join('')}</div>
      <p class="meta"><span class="avgPill">Ø <b>${fmt(dist.avg, 2)}</b>${chg ? ` <small>bisher ${fmt(old, 2)}</small>` : ''}</span>${cnt || `<span>Gewertet: <b>${dist.n}</b></span>`}<span>${up ? 'unter 5 Punkten' : 'Noten 5 und 6'}: <b>${dist.weak} (${Math.round(dist.weakShare * 100)} %)</b></span></p>`;
}
/* Prüfungsteile neu rechnen und sagen, bei wem sich die Notenpunkte dadurch ändern (nichts ändert sich still) */
function reParts(c, a) {
  const ch = [];
  Object.entries(a.results || {}).forEach(([sid, r]) => { if (!r || !r.pp || r.status) return; const was = r.v; R.applyParts(a, r);
    if (was != null && r.v !== was) { const st = c.students.find(x => x.id === sid); ch.push(`${st ? st.name : '?'}: ${was} → ${r.v ?? '–'}`); } });
  if (ch.length) setTimeout(() => toast(`Neu berechnet – ${ch.length === 1 ? 'eine Note geändert' : ch.length + ' Noten geändert'}: ${ch.slice(0, 4).join(' · ')}${ch.length > 4 ? ' …' : ''}`, 9000), 300);
  return ch;
}
/* Faktor einer Aufgabe (Punkte zählen mehrfach) */
/* Notenschlüssel an eine neue Gesamtpunktzahl anpassen (KMK neu, eigene Grenzen im gleichen Prozentverhältnis) */
function rekeyAssessment(a, up) {
  const max = R.tasksMax(a), k = a.key; if (!k || !max) return; const old = +k.max || 0; if (max === old) return;
  const step = (k.anchors && +k.anchors.step) || 0.5;
  if (k.preset === 'hv') k.pointThresholds = R.suggestKeyHV(max).pointThresholds;
  else if (k.preset === 'kmk') {
    const kk = R.suggestKeyKmk(max, up, step, up ? true : k.tend !== false);
    if (up) k.pointThresholds = kk.pointThresholds; else { k.thresholds = kk.thresholds; if (k.tend) k.tendThresholds = kk.tendThresholds; }
  } else if (old) {
    /* Eigene Grenzen: Sind sie noch genau die aus den Prozentwerten berechneten, wird für die neue Summe wieder aus den Prozentwerten gerechnet
       (sonst gingen sie bei kleinen Summen – etwa der Startspalte mit 1 Punkt – durch das Runden verloren). Von Hand geänderte Grenzen wandern im gleichen Verhältnis mit. */
    const key = up ? 'pointThresholds' : 'thresholds', pct = up ? k.pct15 : k.pct;
    const calc = m => pct && pct.length ? (up ? R.suggestKey15(m, pct, step).pointThresholds : R.suggestKey(m, pct, step).thresholds) : null;
    const was = calc(old), untouched = was && k[key] && was.length === k[key].length && was.every((x, i) => Math.abs(x - +k[key][i]) < 1e-9);
    if (untouched) k[key] = calc(max); else if (k[key]) k[key] = k[key].map(x => R.ceilStep(x / old * max, step));
  }
  k.max = max;
}
/* Simulation „Faktor einer Aufgabe ändern“ – an einer Kopie; units = Aufgaben bzw. Schreibaufgaben (Inhalt + Sprache als eine) */
function factorUnits(a) { const out = [], seen = new Set();
  (a.tasks || []).forEach(t => { if (t.g) { if (seen.has(t.g)) return; seen.add(t.g); const l = a.tasks.filter(x => x.g === t.g); out.push({ ids: l.map(x => x.id), label: (t.gl || 'Schreiben') + ' (' + l.map(x => x.label).join(' + ') + ')', f: R.taskF(t), key: 'g:' + t.g }); }
    else out.push({ ids: [t.id], label: 'Aufgabe ' + t.label, f: R.taskF(t), key: 't:' + t.id }); });
  return out; }
function simFactor(a, up, ids, f) {
  const A = JSON.parse(JSON.stringify(a)); A.results = A.results || {};
  R.markRawOrigin(A);
  A.tasks.filter(t => ids.includes(t.id)).forEach(x => { if (f > 0 && f !== 1) x.f = f; else delete x.f; });
  rekeyAssessment(A, up); Object.values(A.results).forEach(r => R.regrade(A, r, up));
  return A; }
function renderFactorSim(box, c, a, up, st, onApply, applyWord) {
  const vOf = A => s => { const r = A.results && A.results[s.id]; return r && !r.status && r.v != null ? r.v : null; };
  const fp = x => String(Math.round(x * 100) / 100).replace('.', ','), lbl = f => '× ' + fp(f);
  const us = factorUnits(a); if (!us.length) { box.innerHTML = ''; return; }
  if (!(st.u < us.length)) st.u = 0; const u = us[st.u]; if (st.f == null) st.f = u.f === 1 ? 0.5 : 1;
  if (!c.students.some(s => vOf(a)(s) != null)) { box.innerHTML = '<p class="hint">Sobald für alle Aufgaben Punkte eingetragen sind, siehst du hier, wie sich Durchschnitt und Noten mit einem anderen Faktor ändern würden – für die ganze Klasse.</p>'; return; }
  const A = simFactor(a, up, u.ids, st.f), d0 = R.distribution(a, c.students, up), d1 = R.distribution(A, c.students, up);
  box.innerHTML = `<div class="tfCtl"><label>Aufgabe <select data-tfu>${us.map((x, i) => `<option value="${i}" ${i === st.u ? 'selected' : ''}>${esc(x.label)} – jetzt ${lbl(x.f)}</option>`).join('')}</select></label>
      <span class="tfSeg">zählt ${[0.5, 1, 1.5, 2, 2.5, 3].map(f => `<button type="button" class="mini ${f === st.f ? 'on' : ''}" data-tff="${f}">${lbl(f)}</button>`).join('')}</span></div>
    <table class="simTbl tfTbl"><thead><tr><th></th><th>erreichbar</th><th>Ø</th><th>${up ? 'unter 5 P.' : '5 und 6'}</th></tr></thead><tbody>
      <tr class="cur"><td><b>Jetzt</b><small>${esc(u.label)} ${lbl(u.f)}</small></td><td class="n">${fp(R.tasksMax(a))}</td><td class="n"><b>${fmt(d0.avg, 2)}</b></td><td class="n">${d0.weak}</td></tr>
      <tr><td><b>Simuliert</b><small>${esc(u.label)} ${lbl(st.f)}</small></td><td class="n">${fp(R.tasksMax(A))}</td><td class="n"><b>${fmt(d1.avg, 2)}</b></td><td class="n">${d1.weak}</td></tr></tbody></table>
    ${simClassHTML(c, up, vOf(a), vOf(A))}
    <div class="panelBtns">${st.f !== u.f && !READONLY ? `<button type="button" class="mini accent" data-tfapply>${esc(u.label)} ${applyWord} ${lbl(st.f)} zählen</button>` : ''}</div>
    <p class="hint">Gerechnet wird an einer Kopie – geändert wird erst mit dem Knopf. ${a.key && a.key.preset === 'kmk' ? 'Der Notenschlüssel wird für die neue Summe neu berechnet.' : 'Eigene Grenzen wandern im gleichen Prozentverhältnis mit.'}</p>`;
  box.querySelector('[data-tfu]').onchange = e => { st.u = +e.target.value; st.f = null; renderFactorSim(box, c, a, up, st, onApply, applyWord); };
  $$('[data-tff]', box).forEach(b => b.onclick = () => { st.f = +b.dataset.tff; renderFactorSim(box, c, a, up, st, onApply, applyWord); });
  simPrintWire(box, () => modelSim(c, a, `${u.label} zählt × ${fp(st.f)} statt ${lbl(u.f)} (erreichbar ${fp(R.tasksMax(A))} statt ${fp(R.tasksMax(a))} Punkte${a.key && a.key.preset === 'kmk' ? ', Schlüssel neu nach amtlicher Tabelle' : ', Grenzen im gleichen Prozentverhältnis'})`, vOf(a), vOf(A)));
  const ap = box.querySelector('[data-tfapply]'); if (ap) ap.onclick = () => { const f = st.f; st.f = null; onApply(u, f); };
}
/* Simulation: ganze Klassenliste „jetzt → simuliert“; wer sich ändert, ist farbig hervorgehoben (grün besser, rot schlechter) */
function simClassHTML(c, up, nowOf, simOf) {
  const rows = c.students.map(s => ({ s, n: nowOf(s), m: simOf(s) })).filter(x => x.n != null || x.m != null);
  const better = x => up ? x.m > x.n : x.m < x.n, lab = v => v == null ? '–' : up ? v + ' P.' : String(v);
  const ch = rows.filter(x => x.n !== x.m), nb = ch.filter(better).length;
  return `<div class="simCls"><p class="simClsH">${ch.length ? `<b>${ch.length}</b> ${ch.length === 1 ? 'Person ändert' : 'Personen ändern'} sich – <span class="cUp">${nb} besser</span>, <span class="cDn">${ch.length - nb} schlechter</span>` : 'Bei niemandem ändert sich die Note.'}</p>
    <div class="simList">${rows.map(x => { const d = x.n !== x.m; return `<div class="${d ? (better(x) ? 'chg up' : 'chg down') : ''}"><span>${esc(x.s.name)}</span><b>${lab(x.n)}${d ? ` <i>→</i> ${lab(x.m)}` : ''}</b></div>`; }).join('')}</div>
    <div class="panelBtns simPrint"><button type="button" class="mini" data-simprint="pdf">Simulation drucken (PDF)</button><button type="button" class="mini" data-simprint="docx">Word</button></div></div>`;
}
/* Ausdruck einer Simulation: Klassenliste jetzt → simuliert (nur zum Besprechen, z. B. mit der Fachbetreuung – an den Noten ändert sich nichts) */
function modelSim(c, a, what, nowOf, simOf) {
  const up = upper(c), lab = v => v == null ? '–' : up ? v + ' P.' : String(v), better = (n, m) => up ? m > n : m < n;
  const stOf = f => { const vs = c.students.map(f).filter(v => v != null); const weak = up ? vs.filter(v => v < 5).length : vs.filter(v => v >= 5).length; return { n: vs.length, avg: vs.length ? R.mean(vs) : null, weak, vs }; };
  const s0 = stOf(nowOf), s1 = stOf(simOf);
  let nUp = 0, nDn = 0;
  const rows = groupedRows(c, (s, i) => { const n = nowOf(s), m = simOf(s); const d = n != null && m != null && n !== m; if (d) { if (better(n, m)) nUp++; else nDn++; }
    return { cells: [String(i + 1), s.name, lab(n), lab(m), d ? (better(n, m) ? 'besser' : 'schlechter') : ''], cls: d ? (better(n, m) ? 'up' : 'down') : '' }; });
  rows.push({ cells: ['', 'Ø', s0.avg == null ? '' : fmt(s0.avg, 2), s1.avg == null ? '' : fmt(s1.avg, 2), ''], cls: 'foot' });
  const weakL = up ? 'Unter 5 Punkten' : 'Noten 5 und 6';
  const stats = [{ l: 'Ø jetzt', v: s0.avg == null ? '–' : fmt(s0.avg, 2), s: up ? 'Notenpunkte' : 'Note' }, { l: 'Ø simuliert', v: s1.avg == null ? '–' : fmt(s1.avg, 2), s: up ? 'Notenpunkte' : 'Note', key: true },
    { l: weakL, v: s0.weak + ' → ' + s1.weak, s: 'jetzt → simuliert' }, { l: 'Geändert', v: String(nUp + nDn), s: `${nUp} besser · ${nDn} schlechter` }];
  const labels = up ? Array.from({ length: 16 }, (_, i) => 15 - i) : [1, 2, 3, 4, 5, 6];
  const cnt = st => labels.map(g => String(st.vs.filter(v => v === g).length));
  const spiegel = { head: [up ? 'Punkte' : 'Note', ...labels.map(String)], rows: [['jetzt', ...cnt(s0)], ['simuliert', ...cnt(s1)]], small: true, keep: true, align: ['l'], widths: [5, ...labels.map(() => up ? 1.6 : 2.4)] };
  const lnT = a.title || R.TYPES[a.type].label;
  return { eyebrow: 'Simulation · ' + R.TYPES[a.type].label, title: lnT, file: fileName(lnT + ' Simulation', c, a.date),
    subtitle: `${cLabel(c)}${a.date ? ' · ' + wdate(a.date) : ''}${up ? ' · Halbjahr ' + a.term : ''}`, meta: baseMeta(c),
    blocks: [{ note: 'Simuliert: ' + what + '\nNur ein Gedankenspiel – an den eingetragenen Noten ändert dieser Ausdruck nichts.' }, { stats },
      { table: { head: ['Nr.', 'Name', 'jetzt', 'simuliert', 'Änderung'], rows, align: ['c', 'l'], bold: [3], widths: [3, 16, 5, 5, 6], dense: c.students.length > 24 } },
      { h: 'Notenspiegel' }, { table: spiegel }] };
}
const simPrintWire = (box, mk) => $$('[data-simprint]', box).forEach(b => b.onclick = () => exportModel(mk(), b.dataset.simprint));
const FACTORS = [0.5, 1, 1.5, 2, 2.5, 3, 4];   /* ×0,5: eine Aufgabe nachträglich nur halb werten (z. B. weil sie sehr schlecht ausgefallen ist) */
const factorOpts = f => { const cur = +f > 0 ? +f : 1; return (FACTORS.includes(cur) ? FACTORS : FACTORS.concat(cur).sort((x, y) => x - y)).map(x => `<option value="${x}" ${x === cur ? 'selected' : ''}>× ${String(x).replace('.', ',')}</option>`).join(''); };
/* Schritt (Raster) eines Notenschlüssels */
const keyStep = k => (k && k.anchors && +k.anchors.step) || 0.5;
/* Bereiche des Notenschlüssels: [{ label, lo, hi }] – Note 1 … 6 bzw. 15 … 0 Punkte (hi = oberste Punktzahl, die noch zu dieser Note gehört) */
function keyRanges(a, up) {
  const k = a.key, max = R.tasksMax(a) || (k && +k.max) || 0, st = k && k.preset === 'hv' ? 1 : keyStep(k);   /* Hörverstehen: nur ganze BE */
  const th = k && (up ? k.pointThresholds : k.thresholds); if (!th || !max || th.some(x => x == null || x === '' || isNaN(+x))) return null;
  const r2 = x => Math.round(x * 100) / 100, out = [];
  const n = th.length;
  for (let i = 0; i <= n; i++) {
    const lo = i < n ? +th[i] : 0, hi = i === 0 ? max : r2(+th[i - 1] - st);
    out.push({ label: up ? String(15 - i) : String(i + 1), lo, hi });
  }
  return out;
}
/* „Knapp dran“: fehlen höchstens `near` Punkte zur nächstbesseren Note (↑) bzw. liegt jemand höchstens `near` über der Grenze zur Note 5 (↓, nur diese Grenze) */
const NEAR = 1;
function nearInfo(raw, key, up) {
  if (raw == null || !key) return null;
  const th = up ? key.pointThresholds : key.thresholds; if (!th) return null;
  const r2 = x => Math.round(x * 100) / 100;
  let idx = -1; for (let i = 0; i < th.length; i++) if (raw >= +th[i]) { idx = i; break; }   /* idx = Stufe (0 = beste) */
  const out = {};
  if (idx !== 0) { const need = r2((idx === -1 ? +th[th.length - 1] : +th[idx - 1]) - raw); if (need > 0 && need <= NEAR) out.up = need; }
  /* untere Grenze der Versetzungsrelevanz: Unterstufe Note 4 -> 5, Oberstufe 5 Punkte -> 4 Punkte */
  const edge = up ? 10 : 3;
  if (idx === edge) { const over = r2(raw - +th[edge]); if (over >= 0 && over <= NEAR) out.down = over; }
  return out.up != null || out.down != null ? out : null;
}

/* ======================================================================
   Punkte je Aufgabe eintragen – Zeilen = Schüler, Spalten = Aufgaben (wie in der Excel-Notenliste)
   ====================================================================== */
/* ======================================================================
   Oberstufe: Teilnoten je Prüfungsteil eintragen (ISB-Rechentabelle). Je Person: BE bzw. Inhalt und Sprache (0–15).
   Libretto rechnet Teilnoten, den gewichteten Durchschnitt (genau) und die gerundeten Notenpunkte – wie die Excel-Tabelle des ISB.
   ====================================================================== */
function partsSheet(c, a, focusSid) {
  if (!c || !a || !R.byParts(a)) return;
  const ps = a.parts, fp = x => x == null || x === '' ? '' : String(Math.round(x * 100) / 100).replace('.', ',');
  const up = upper(c), alt = !!a.alt, tnOn = p => p.kind !== 'n', unitW = up ? 'Punkte' : 'Note';
  a.results = a.results || {};
  const STAT = up ? [['', '–', '– nichts Besonderes'], ['ent', 'E', 'E – entschuldigt gefehlt, Nachtermin offen (zählt noch nicht)'], ['nt', 'NT', 'NT – Nachtermin geschrieben: zählt für die Person, nicht im Notenspiegel/Ø der Arbeit'], ['bef', 'B', 'B – befreit (zählt nicht)'], ['n6', '0*', '0* – versäumt ohne Entschuldigung oder verweigert: 0 Punkte (§ 26 Abs. 4 GSO)'], ['us', 'U', 'U – Unterschleif: 0 Punkte']]
    : [['', '–', '– nichts Besonderes'], ['ent', 'E', 'E – entschuldigt gefehlt, Nachtermin offen (zählt noch nicht)'], ['nt', 'NT', 'NT – Nachtermin geschrieben: zählt für die Person, nicht im Notenspiegel/Ø der Arbeit'], ['bef', 'B', 'B – befreit (zählt nicht)'], ['n6', '6*', '6* – versäumt ohne Entschuldigung oder verweigert: Note 6 (§ 26 Abs. 4 GSO)'], ['us', 'U', 'U – Unterschleif: Note 6']];
  const statText = (sel, long) => [...sel.options].forEach(o => { const x = STAT.find(z => z[0] === o.value); if (x) o.textContent = long ? x[2] : x[1]; });
  const keys = p => p.kind === 'is' ? ['i', 's'] : ['v'];
  const valOf = (r, p, k) => { const v = r && r.pp && r.pp[p.id]; if (v == null || v === '') return ''; return p.kind === 'is' ? (v[k] == null ? '' : v[k]) : v; };
  const tnCell = (r, p) => { if (!r || r.status) return ''; const n = R.partNote(p, r.pp && r.pp[p.id]); if (!n) return ''; return n.sperr ? `<span class="sperr" title="Sperrklausel: Inhalt oder Sprache 0 Punkte – höchstens 3 Notenpunkte">${fp(n.tn)}</span>` : fp(n.tn); };
  const rowCells = s => { const r = a.results[s.id];
    const ex = r && !r.status && r.exact != null ? fp(r.exact) : (r && r.pp && Object.keys(r.pp).length && !r.status ? '<span class="part" title="noch nicht alle Teile eingetragen">…</span>' : '');
    const res = r && r.status ? R.cellText(r, up) : r && r.v != null ? (up ? r.v + ' P.' : String(r.v)) + (r.cap ? ` <span class="sperr" title="${esc(r.cap)}">!</span>` : '') : '';
    return { ex, res }; };
  const rowHTML = (s, n) => { const r = a.results[s.id], cc = rowCells(s), dis = r && r.status ? 'disabled' : '';
    return `<tr data-s="${s.id}"><td class="nr">${n}</td><td class="nm">${esc(s.name)}${supTag(c, s.id)}</td>${ps.map(p => keys(p).map((k, j) => `<td class="${j === 0 ? 'pS' : ''}"><input class="cell ppc" data-s="${s.id}" data-p="${p.id}" data-k="${k}" value="${esc(fp(valOf(r, p, k)))}" inputmode="decimal" autocomplete="off" spellcheck="false" ${dis} ${READONLY ? 'readonly' : ''}></td>`).join('') + (tnOn(p) ? `<td class="tn" data-tn="${p.id}">${tnCell(r, p)}</td>` : '')).join('')}<td class="sum">${cc.ex}</td><td class="res"><b>${cc.res}</b></td><td><select class="tkst" tabindex="-1" data-st="${s.id}" ${READONLY ? 'disabled' : ''}>${STAT.map(([v, sh]) => `<option value="${v}" ${(r && (r.status || (r.nt ? 'nt' : '')) || '') === v ? 'selected' : ''}>${sh}</option>`).join('')}</select></td></tr>`; };
  const avg = list => { const v = list.filter(x => x != null && x !== '' && isFinite(+x)).map(Number); return v.length ? fp(R.mean(v)) : ''; };
  const foot = () => { const rs = c.students.map(s => a.results[s.id]).filter(r => r && !r.status && r.pp);
    return `<tr class="avgRow"><td></td><td class="nm">Ø ${up ? 'Kurs' : 'Klasse'}</td>${ps.map(p => keys(p).map(k => `<td>${avg(rs.map(r => valOf(r, p, k)))}</td>`).join('') + (tnOn(p) ? `<td class="tn">${avg(rs.map(r => { const n = R.partNote(p, r.pp[p.id]); return n ? n.tn : null; }))}</td>` : '')).join('')}<td class="sum">${avg(rs.map(r => r.exact))}</td><td class="res"><b>${avg(rs.map(r => r.v))}</b></td><td></td></tr>`; };
  const summary = () => { const d = R.distribution(a, c.students, up); return d.n ? `<span class="avgPill">Ø <b>${fmt(d.avg, 2)}</b>${up ? ' Punkte' : ''}</span>${countSpan(c, a, up)}<span>${up ? 'unter 5 Punkten' : 'Noten 5 und 6'}: <b>${d.weak}</b></span>` : 'Noch keine vollständigen Ergebnisse.'; };
  const head = () => `<tr class="hg1"><th rowspan="2">Nr.</th><th rowspan="2">Name</th>${ps.map(p => `<th colspan="${keys(p).length + (tnOn(p) ? 1 : 0)}" class="tkG"><div class="tkGh"><b>${esc(p.label)}</b><span class="pwB">${alt ? 'Gewicht ' + fp(p.w) : fp(p.w) + ' %'}</span></div></th>`).join('')}<th rowspan="2" title="Gewichteter Durchschnitt der Teilnoten, ungerundet">genau</th><th rowspan="2">${unitW}</th><th rowspan="2" title="Besonderheit statt Punkten">Status</th></tr>
    <tr class="hg2">${ps.map(p => p.kind === 'n' ? `<th class="gsub" title="Teilnote ${up ? 'in Notenpunkten' : 'als ganze Note'}">${unitW}<small>${up ? '0–15' : '1–6'}</small></th>` : (p.kind === 'is' ? `<th class="gsub" title="Inhalt und Textstruktur, 0–15 Notenpunkte (40 %)">Inhalt<small>0–15</small></th><th class="gsub" title="Sprache, 0–15 Notenpunkte (60 %)">Sprache<small>0–15</small></th>` : `<th class="gsub" title="Erreichte Bewertungseinheiten">BE<small>max. ${fp(p.max)}</small></th>`) + '<th class="gsub tnH" title="Teilnote in Notenpunkten">Teilnote</th>').join('')}</tr>`;
  const body = () => alt ? `<details class="tkHelp"><summary><span>Je Person die Teilnote für <b>Übersetzung</b> und <b>Aufgabenteil</b> (${up ? 'Notenpunkte 0–15' : 'ganze Noten 1–6'}). <b>Enter</b> = eine Zeile nach unten, <b>Tab</b> = ein Feld nach rechts.</span><em>Mehr dazu</em></summary>
      <p class="hint">Gesamtnote = gewichteter Durchschnitt (Übersetzung : Aufgabenteil = ${fp(ps[0].w)} : ${fp(ps[1].w)}), bei n,5 die bessere Note.${a.alt.ue5 ? ' „Ausreichend“ nur, wenn die Übersetzung mindestens „mangelhaft“ ist.' : ''}${a.alt.g11 ? ' „Befriedigend“ nur, wenn kein Teil „ungenügend“ ist.' : ''}${a.alt.up ? ' Hat ein Teil 0 Punkte, höchstens 6 Punkte.' : ''} Wo eine dieser Regeln greift, steht ein rotes ! neben der Note. Quelle: KMS vom 31.07.2023, V.3-BS5402.7/135/1, Anlagen 2–4.</p></details>${bodyTbl()}` : `<details class="tkHelp"><summary><span>Je Person die <b>BE</b> bzw. die Notenpunkte für <b>Inhalt</b> und <b>Sprache</b> (0–15, nach den Bewertungsrastern). <b>Enter</b> = eine Zeile nach unten, <b>Tab</b> = ein Feld nach rechts.</span><em>Mehr dazu</em></summary>
      <p class="hint">BE-Teile: Teilnote nach dem Lösungsgrad wie im Abitur (95 % = 15, 90 % = 14 … 27 % = 2, 20 % = 1, darunter 0). Inhalt + Sprache: Teilnote = 40 % Inhalt + 60 % Sprache; ist Inhalt oder Sprache 0 Punkte, höchstens 3 Notenpunkte (Sperrklausel, rot markiert). Ergebnis: Teilnoten nach den Anteilen gemittelt („genau“), dann gerundet. Erst wenn alle Teile einer Person eingetragen sind, gibt es Punkte. Prüfungsteile und Anteile änderst du unter „Leistungsnachweis bearbeiten“.</p></details>
    ${bodyTbl()}`;
  const bodyTbl = () => `<div class="tkWrap"><table class="tkTbl ppTbl"><thead>${head()}</thead><tbody>${groupsOf(c).map(g => (g.label ? `<tr class="grpRow"><td colspan="99">${esc(g.label)}</td></tr>` : '') + g.students.map(s => rowHTML(s, c.students.indexOf(s) + 1)).join('')).join('')}</tbody><tfoot>${foot()}</tfoot></table></div>
    <p class="tkLegend"><b>Status</b> – nur wenn jemand keine Teilnoten bekommt: <b>E</b> entschuldigt gefehlt (Nachtermin offen, zählt noch nicht) · <b>NT</b> Nachtermin geschrieben (zählt für die Person, nicht im Notenspiegel) · <b>B</b> befreit (zählt nicht) · <b>${up ? '0*' : '6*'}</b> versäumt ohne Entschuldigung oder verweigert = ${up ? '0 Punkte' : 'Note 6'} · <b>U</b> Unterschleif = ${up ? '0 Punkte' : 'Note 6'}</p>
    <p class="meta" id="tkSum">${summary()}</p>`;
  const { dlg } = sheet({ title: (a.title || R.TYPES[a.type].label) + (alt ? ' – Übersetzung und Aufgabenteil' : ' – Prüfungsteile'), ok: '', cancel: 'Fertig', wide: true, body: body() });
  dlg.classList.add('tkDlg');
  const refresh = sid => { const s = c.students.find(x => x.id === sid), tr = dlg.querySelector(`tr[data-s="${sid}"]`); if (!s || !tr) return; const r = a.results[sid], cc = rowCells(s);
    ps.forEach(p => { const td = tr.querySelector(`td[data-tn="${p.id}"]`); if (td) td.innerHTML = tnCell(r, p); });
    tr.querySelector('.sum').innerHTML = cc.ex; tr.querySelector('.res').innerHTML = `<b>${cc.res}</b>`;
    dlg.querySelector('tfoot').innerHTML = foot(); dlg.querySelector('#tkSum').innerHTML = summary(); };
  dlg.addEventListener('change', e => {
    const el = e.target; if (READONLY || !el.matches) return;
    if (el.matches('.ppc')) {
      const sid = el.dataset.s, p = ps.find(x => x.id === el.dataset.p), k = el.dataset.k; if (!p) return;
      const raw = el.value.trim().replace(',', '.');
      let v = null;
      if (raw !== '') {
        const x = +raw;
        if (!/^\d+(\.\d+)?$/.test(raw) || !isFinite(x)) { toast('Bitte eine Zahl eintragen'); el.value = fp(valOf(a.results[sid], p, k)); return; }
        if (p.kind === 'n' && (x !== Math.round(x) || (up ? x > 15 : (x < 1 || x > 6)))) { toast(up ? 'Teilnote: ganze Notenpunkte von 0 bis 15' : 'Teilnote: ganze Note von 1 bis 6 (ohne Tendenz)'); el.value = fp(valOf(a.results[sid], p, k)); return; }
        if (p.kind === 'is' && (x > 15 || x !== Math.round(x))) { toast('Inhalt und Sprache: ganze Notenpunkte von 0 bis 15'); el.value = fp(valOf(a.results[sid], p, k)); return; }
        if (p.kind === 'be' && R.isHVPart(p) && x !== Math.round(x)) { toast('Hörverstehen: nur ganze BE (ISB-Leitfaden 04/2025, S. 3)'); el.value = fp(valOf(a.results[sid], p, k)); return; }
        if (p.kind === 'be' && (x > +p.max || Math.round(x * 2) !== x * 2)) { toast(`Höchstens ${fp(p.max)} BE (halbe BE möglich)`); el.value = fp(valOf(a.results[sid], p, k)); return; }
        v = x;
      }
      const r = a.results[sid] || (a.results[sid] = {}); r.pp = r.pp || {};
      if (p.kind === 'is') { const o = { ...(typeof r.pp[p.id] === 'object' && r.pp[p.id] ? r.pp[p.id] : {}) }; if (v == null) delete o[k]; else o[k] = v; if (Object.keys(o).length) r.pp[p.id] = o; else delete r.pp[p.id]; }
      else { if (v == null) delete r.pp[p.id]; else r.pp[p.id] = v; }
      if (v != null) el.value = fp(v);
      R.applyParts(a, r);
      if (!Object.keys(r.pp).length && !r.status) delete a.results[sid];
      save(); refresh(sid);
    } else if (el.matches('.tkst')) {
      const sid = el.dataset.st; const r = a.results[sid] || (a.results[sid] = {});
      const wasE = r.status === 'ent';
      if (el.value && el.value !== 'nt') { r.status = el.value; delete r.nt; delete r.v; delete r.exact; } else { delete r.status; if (el.value === 'nt' || wasE) { r.nt = true; if (wasE && !el.value) { el.value = 'nt'; toast('Als Nachtermin markiert (NT) – zählt für die Person, nicht im Notenspiegel/Ø der Arbeit'); } } else delete r.nt; R.applyParts(a, r); }
      const dis0 = !!el.value && el.value !== 'nt';
      if (!Object.keys(r.pp || {}).length && !r.status && !r.nt) delete a.results[sid];
      save(); const tr = el.closest('tr'); $$('.ppc', tr).forEach(i => i.disabled = dis0); refresh(sid);
    }
  });
  ['mousedown', 'focusin', 'keydown'].forEach(ev => dlg.addEventListener(ev, e => { if (e.target.matches && e.target.matches('.tkst')) statText(e.target, true); }));
  ['change', 'focusout'].forEach(ev => dlg.addEventListener(ev, e => { if (e.target.matches && e.target.matches('.tkst')) statText(e.target, false); }));
  dlg.addEventListener('keydown', e => {
    const el = e.target; if (!el.matches || !el.matches('.ppc')) return;
    const sel = `.ppc[data-p="${el.dataset.p}"][data-k="${el.dataset.k}"]`, rows = $$('tbody tr[data-s]', dlg), i = rows.indexOf(el.closest('tr'));
    const go = d => { let k = i + d; while (rows[k] && rows[k].querySelector(sel).disabled) k += d; const n2 = rows[k] && rows[k].querySelector(sel); if (n2) { el.dispatchEvent(new Event('change', { bubbles: true })); { n2.focus(); n2.select(); } } };
    if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); go(1); } else if (e.key === 'ArrowUp') { e.preventDefault(); go(-1); }
    else if (e.key === 'Tab') { const mine = $$('.ppc:not(:disabled)', el.closest('tr')), k = mine.indexOf(el); let target = null;
      if (!e.shiftKey && k === mine.length - 1) { for (let j = i + 1; j < rows.length && !target; j++) target = $$('.ppc:not(:disabled)', rows[j])[0]; }
      else if (e.shiftKey && k === 0) { for (let j = i - 1; j >= 0 && !target; j--) { const l = $$('.ppc:not(:disabled)', rows[j]); target = l[l.length - 1]; } }
      if (target) { e.preventDefault(); el.dispatchEvent(new Event('change', { bubbles: true })); { target.focus(); target.select(); } } }
  });
  dlg.addEventListener('focusin', e => { if (e.target.matches && e.target.matches('.ppc')) { e.target.select(); $$('tr.cur', dlg).forEach(x => x.classList.remove('cur')); const tr = e.target.closest('tr'); if (tr) tr.classList.add('cur'); } });
  dlg.addEventListener('close', () => { save(); render(); });
  const first = (focusSid && dlg.querySelector(`tr[data-s="${focusSid}"] .ppc:not(:disabled)`)) || dlg.querySelector('.ppc:not(:disabled)');
  if (first && !READONLY) setTimeout(() => { first.focus(); first.select(); }, 60);
}
function taskSheet(c, a, focusSid) {
  if (a && R.byParts(a)) return partsSheet(c, a, focusSid);
  if (!c || !a || !R.byTask(a)) return;
  const up = upper(c), fp = x => x == null || x === '' ? '' : String(Math.round(x * 100) / 100).replace('.', ',');
  let tasks = a.tasks; a.results = a.results || {};
  /* Schreibaufgaben aus Version 1.0.0 (zwei einzelne Aufgaben „Inhalt“ und „Sprache“ direkt nebeneinander) zu einer Aufgabe zusammenfassen – nur Darstellung, Punkte bleiben */
  tasks.forEach((t, i) => { const n = tasks[i + 1]; if (!t.g && n && !n.g && t.label === 'Inhalt' && n.label === 'Sprache' && R.taskF(t) === R.taskF(n)) { const g = uid(); t.g = n.g = g; t.gl = n.gl = 'Schreiben'; } });
  const WORST = up ? '0 Punkte' : 'Note 6';
  /* [Wert, Kürzel in der Tabelle, ausgeschrieben (erscheint, sobald die Auswahl aufklappt)] */
  const STAT = [['', '–', '– nichts Besonderes'], ['ent', 'E', 'E – entschuldigt gefehlt, Nachtermin offen (zählt noch nicht)'], ['nt', 'NT', 'NT – Nachtermin geschrieben: zählt für die Person, nicht im Notenspiegel/Ø der Arbeit'], ['bef', 'B', 'B – befreit (zählt nicht)'], ['n6', up ? '0*' : '6*', `${up ? '0*' : '6*'} – versäumt ohne Entschuldigung oder verweigert: ${WORST} (§ 26 Abs. 4 GSO)`], ['us', 'U', `U – Unterschleif: ${WORST}`]];
  const statText = (sel, long) => [...sel.options].forEach(o => { const x = STAT.find(z => z[0] === o.value); if (x) o.textContent = long ? x[2] : x[1]; });
  const cells = s => {
    const r = a.results[s.id] || {}, ent = tasks.filter(t => r.pts && r.pts[t.id] != null && r.pts[t.id] !== '');
    const part = R.tasksSum(a, r.pts);
    const sum = r.status ? '' : r.raw != null ? fp(r.raw) + (r.rawMan ? ' <span class="man" title="Gesamtpunkte von Hand eingetragen – rechnen nicht aus den Aufgaben. Zum Ändern einen Aufgabenwert eintragen.">✎</span>' : '') : ent.length ? `<span class="part" title="noch nicht alle Aufgaben eingetragen">(${fp(part)})</span>` : '';
    const res = r.status ? R.cellText(r, up) : r.v != null ? (up ? r.v + ' P.' : r.v + (r.tend || '')) : '';
    return { sum, res, near: nearHTML(r) };
  };
  const nearHTML = r => {
    if (!r || r.status || r.raw == null) return '';
    const n = nearInfo(r.raw, a.key, up); if (!n) return '';
    const fq = fp, w = up ? 'Notenpunkt' : 'Note';
    return (n.up != null ? `<span class="near up" title="Es fehlen nur ${fq(n.up)} Punkte zum nächstbesseren ${w} – nochmal ansehen?">↑ ${fq(n.up)}</span>` : '') + (n.down != null ? `<span class="near down" title="Nur ${fq(n.down)} Punkte über der Grenze zum schlechteren ${w} (${up ? '4 statt 5 Punkte' : 'Note 5 statt 4'}) – nochmal ansehen?">↓ ${fq(n.down)}</span>` : '');
  };
  const nearCount = () => c.students.filter(s => { const r = a.results[s.id]; return r && !r.status && r.raw != null && nearInfo(r.raw, a.key, up); }).length;
  /* Notenschlüssel unter der Tabelle: immer sichtbar, mit Anzahl je Note */
  const keyStrip = () => {
    const rg = keyRanges(a, up); if (!rg) return '';
    const cnt = R.distribution(a, c.students, up).counts;
    return `<b>Notenschlüssel</b>${rg.map((g, i) => { const gr = up ? R.POINT_GRADE(15 - i) : i + 1, n = cnt[up ? 15 - i : i]; return `<span class="kc"><i style="background:var(--gr${gr})"></i>${up ? g.label + ' P. (' + R.POINT_LABEL(+g.label) + ')' : 'Note ' + g.label}: ${fp(g.lo)}–${fp(g.hi)}${n ? ` <em title="so viele Personen">${n}×</em>` : ''}</span>`; }).join('')}`;
  };
  /* Zwischensumme einer Schreibaufgabe/Sprachmittlung (Inhalt + Sprache) × Faktor – z. B. (4 + 6) × 2 = 20, für den Korrekturbogen */
  const gTot = (r, g) => { const l = tasks.filter(t => t.g === g); if (!r || r.status || !r.pts || !l.every(t => r.pts[t.id] != null && r.pts[t.id] !== '')) return ''; return '= ' + fp(Math.round(l.reduce((x, t) => x + (+r.pts[t.id]) * R.taskF(t), 0) * 100) / 100); };
  const gEnd = i => tasks[i].g && (i === tasks.length - 1 || tasks[i + 1].g !== tasks[i].g);
  const rowHTML = (s, n) => {
    const r = a.results[s.id] || {}, cc = cells(s), aw = !a.results[s.id] && isAway(c, s.id, a.date);
    return `<tr data-s="${s.id}"><td class="nr">${n}</td><td class="nm">${esc(s.name)}${supTag(c, s.id)}${aw ? ' <small class="hint">abwesend laut Kurseinstellung</small>' : ''}</td>${tasks.map((t, i) => `<td${t.g ? ` class="tkInG${!i || tasks[i - 1].g !== t.g ? ' gS' : ''}${i === tasks.length - 1 || tasks[i + 1].g !== t.g ? ' gE' : ''}"` : ''}><input class="cell tkc" data-s="${s.id}" data-t="${t.id}" value="${esc(fp(r.pts && r.pts[t.id]))}" inputmode="decimal" autocomplete="off" spellcheck="false" ${r.status ? 'disabled' : ''}>${gEnd(i) ? `<span class="gTot" data-gt="${t.g}" title="${esc(t.gl || 'Schreiben')} zusammen (mit Faktor) – zum Übertragen auf den Korrekturbogen">${gTot(r, t.g)}</span>` : ''}</td>`).join('')}${READONLY ? '' : '<td></td>'}<td class="sum">${cc.sum}</td><td class="res"><b>${cc.res}</b>${cc.near}</td><td><select class="tkst" tabindex="-1" data-st="${s.id}" title="Besonderheit: E entschuldigt gefehlt (Nachtermin) · B befreit · ${up ? '0*' : '6*'} versäumt/verweigert · U Unterschleif">${STAT.map(([v, l]) => `<option value="${v}" ${(r.status || (r.nt ? 'nt' : '')) === v ? 'selected' : ''}>${l}</option>`).join('')}</select></td></tr>`;
  };
  const colN = () => tasks.length + 6;
  const foot = () => {
    const st = R.taskStats(a, c.students), dist = R.distribution(a, c.students, up);
    const pct = x => x == null ? '' : Math.round(x * 100) + ' %';
    return `<tr class="ft"><td></td><td class="nm">Ø Punkte</td>${st.map(t => `<td>${t.avg == null ? '' : fp(t.avg)}</td>`).join('')}${READONLY ? '' : '<td></td>'}<td class="sum">${dist.n ? fp(c.students.map(x => a.results[x.id]).filter(r => r && !r.status && r.raw != null).reduce((x, r, _, l) => x + r.raw / l.length, 0)) : ''}</td><td colspan="2"></td></tr>
      <tr class="ft"><td></td><td class="nm">Lösungsquote</td>${st.map(t => `<td>${pct(t.quote)}</td>`).join('')}${READONLY ? '' : '<td></td>'}<td class="sum">${dist.n ? pct(c.students.map(x => a.results[x.id]).filter(r => r && !r.status && r.raw != null).reduce((x, r, _, l) => x + r.raw / l.length, 0) / R.tasksMax(a)) : ''}</td><td colspan="2"></td></tr>`;
  };
  const summary = () => { const d = R.distribution(a, c.students, up); return d.n ? `<span class="avgPill" title="Durchschnitt der bisher vollständigen Ergebnisse">Ø <b>${fmt(d.avg, 2)}</b></span>${countSpan(c, a, up)}<span>${up ? 'unter 5 Punkten' : 'Noten 5 und 6'}: <b>${d.weak}</b></span>${nearCount() ? `<span class="near">knapp dran: <b>${nearCount()}</b></span>` : ''}` : 'Noch keine vollständigen Ergebnisse.'; };
  let n = 0;
  const hasAnyPts = () => Object.values(a.results).some(r => r && r.pts && Object.keys(r.pts).length);
  const taskTh = (t, sub, rs) => `<th data-t="${t.id}"${rs ? ' rowspan="2"' : ''}${sub ? ' class="gsub"' : ''}><input class="tkl" data-t="${t.id}" value="${esc(t.label)}" maxlength="12" title="Name der Aufgabe – zum Ändern anklicken" aria-label="Name der Aufgabe" ${READONLY ? 'readonly' : ''}><input class="tkm" data-t="${t.id}" value="${fp(t.max)}" inputmode="decimal" title="Erreichbare Punkte dieser Aufgabe" aria-label="Höchstpunkte Aufgabe ${esc(t.label)}" ${READONLY ? 'readonly' : ''}>${sub ? '' : `<select class="tkf${R.taskF(t) !== 1 ? ' on' : ''}" data-t="${t.id}" tabindex="-1" title="Faktor: Die Punkte dieser Aufgabe zählen mehrfach – z. B. × 2" aria-label="Faktor Aufgabe ${esc(t.label)}" ${READONLY ? 'disabled' : ''}>${factorOpts(t.f)}</select>${!READONLY && tasks.length > 1 ? `<button type="button" class="tkdel" data-t="${t.id}" title="Aufgabe entfernen" aria-label="Aufgabe ${esc(t.label)} entfernen">×</button>` : ''}`}</th>`;
  /* zusammengehörige Aufgaben (Schreibaufgabe: Inhalt + Sprache) – oben gemeinsam überschrieben, ein Faktor */
  const spans = () => { const out = []; for (let i = 0; i < tasks.length;) { const g = tasks[i].g; let n = 1; if (g) while (i + n < tasks.length && tasks[i + n].g === g) n++; out.push({ g: n > 1 || g ? g : null, list: tasks.slice(i, i + n) }); i += n; } return out; };
  const tailTh = rs => `${READONLY ? '' : `<th class="tkplus"${rs}><span>+</span><input class="tkm new" inputmode="decimal" placeholder="Punkte" title="Neue Aufgabe: Höchstpunkte eintippen, dann Tab" aria-label="Neue Aufgabe: Höchstpunkte">` + (R.isModernLang(c.subject) && (!up || c.late) ? '<button type="button" class="tkWrite" id="tkWrite" tabindex="-1" title="Schreibaufgabe oder Sprachmittlung: eine Aufgabe mit den Teilen „Inhalt“ und „Sprache“ (4 + 6 oder 3 + 7 Punkte) und einem gemeinsamen Faktor">+ Schreiben / SM</button>' : '') + '</th>'}<th${rs}>Summe<small>${fp(R.tasksMax(a))}</small></th><th${rs}>${up ? 'Punkte' : 'Note'}</th><th${rs} title="Besonderheit statt Punkten – siehe Erklärung unter der Tabelle">Status</th>`;
  const headHTML = () => {
    const sp = spans();
    if (!sp.some(x => x.g)) return `<tr><th>Nr.</th><th>Name</th>${tasks.map(t => taskTh(t)).join('')}${tailTh('')}</tr>`;
    const rs = ' rowspan="2"';
    return `<tr class="hg1"><th${rs}>Nr.</th><th${rs}>Name</th>${sp.map(x => x.g ? `<th colspan="${x.list.length}" class="tkG"><div class="tkGh"><input class="tkgl" data-g="${x.g}" value="${esc(x.list[0].gl || 'Schreiben')}" maxlength="16" title="Name der Aufgabe – zum Ändern anklicken" aria-label="Name der Aufgabe" ${READONLY ? 'readonly' : ''}><select class="tkf${R.taskF(x.list[0]) !== 1 ? ' on' : ''}" data-g="${x.g}" tabindex="-1" title="Faktor der ganzen Aufgabe (Inhalt und Sprache zusammen)" aria-label="Faktor ${esc(x.list[0].gl || 'Schreiben')}" ${READONLY ? 'disabled' : ''}>${factorOpts(x.list[0].f)}</select><span class="gMax" title="So viele Punkte bringt diese Aufgabe höchstens in die Summe">max. ${fp(Math.round(x.list.reduce((y, t) => y + (+t.max || 0) * R.taskF(t), 0) * 100) / 100)}</span>${!READONLY && tasks.length > x.list.length ? `<button type="button" class="tkdel" data-g="${x.g}" title="Ganze Aufgabe entfernen" aria-label="${esc(x.list[0].gl || 'Schreiben')} entfernen">×</button>` : ''}</div></th>` : taskTh(x.list[0], false, true)).join('')}${tailTh(rs)}</tr>
      <tr class="hg2">${sp.filter(x => x.g).flatMap(x => x.list.map(t => taskTh(t, true))).join('')}</tr>`;
  };
  const inner = () => `<details class="tkHelp"><summary><span>Oben die <b>erreichbaren Punkte</b> je Aufgabe (bei „+“ entsteht eine neue), darunter die Punkte je Schüler. <b>Enter</b> = eine Zeile nach unten, <b>Tab</b> = ein Feld nach rechts.</span><em>Mehr dazu</em></summary>
      <p class="hint">Sobald alle Aufgaben einer Person eingetragen sind (auch 0), berechnet Libretto Summe und ${up ? 'Notenpunkte' : 'Note'}; leere Felder zählen nicht als 0. Ein kleiner Pfeil <b>↑</b> zeigt, wie viele Punkte bis zur nächstbesseren ${up ? 'Punktzahl' : 'Note'} fehlen (höchstens 1 Punkt), <b>↓</b> nur an der Grenze zur 5 – Libretto ändert dadurch nichts.</p>
      <p class="hint">Unter den erreichbaren Punkten steht der <b>Faktor</b> (× 1): Stellst du ihn z. B. auf × 2,5, zählen die Punkte dieser Aufgabe zweieinhalbfach${R.isModernLang(c.subject) && (!up || c.late) ? '. „+ Schreiben / SM“ legt für eine Schreibaufgabe oder Sprachmittlung gleich die Teile Inhalt und Sprache an; rechts daneben steht je Person die Zwischensumme mit Faktor (z. B. = 20) für den Korrekturbogen' : ''}.</p>
      <p class="hint">Eine Tabelle aus Excel (erreichbare Punkte und Namen mit Punkten) kannst du hier mit Strg/Cmd + V einfügen.</p></details>
    ${tasks.length === 1 && +tasks[0].max === 1 && !hasAnyPts() ? '<p class="hint tkStart">Neu: Trage zuerst oben bei der ersten Aufgabe die erreichbaren Punkte ein, dann bei „+“ die weiteren.</p>' : ''}
    <div class="tkWrap"><table class="tkTbl"><thead>${headHTML()}</thead>
      <tbody>${(n = 0, groupsOf(c).map(g => (g.label ? `<tr class="clsRow"><td colspan="${colN()}">${esc(g.label)}</td></tr>` : '') + g.students.map(s => rowHTML(s, ++n)).join('')).join(''))}</tbody><tfoot>${foot()}</tfoot></table></div>
    <div class="tkKey" id="tkKey" title="Der Notenschlüssel dieser Arbeit – ändern kannst du ihn unter „Leistungsnachweis bearbeiten“">${keyStrip()}</div>
    <p class="tkLegend"><b>Status</b> – nur wenn jemand keine Punkte bekommt: <b>E</b> entschuldigt gefehlt (Nachtermin offen, zählt noch nicht) · <b>NT</b> Nachtermin geschrieben (zählt für die Person, nicht im Notenspiegel) · <b>B</b> befreit (zählt nicht) · <b>${up ? '0*' : '6*'}</b> versäumt ohne Entschuldigung oder verweigert = ${WORST} · <b>U</b> Unterschleif = ${WORST}</p>
    <p class="meta" id="tkSum">${summary()}</p>`;
  const body = () => `<div id="tkRoot">${inner()}</div>
    <details class="sim tfSim" id="tfSim"><summary>Simulation: Was passiert, wenn eine Aufgabe anders zählt (z. B. halb oder doppelt)?</summary><div id="tfBody"></div></details>`;
  const { dlg } = sheet({ title: (a.title || R.TYPES[a.type].label) + ' – Punkte je Aufgabe', ok: '', cancel: 'Fertig', wide: true, body: body() });
  dlg.classList.add('tkDlg');
  dlg.querySelector('#tfSim').addEventListener('toggle', tfRender);
  const refreshRow = sid => { const s = c.students.find(x => x.id === sid), tr = dlg.querySelector(`tr[data-s="${sid}"]`); if (!s || !tr) return; const cc = cells(s); tr.querySelector('.sum').innerHTML = cc.sum; tr.querySelector('.res').innerHTML = `<b>${cc.res}</b>${cc.near}`; tr.querySelectorAll('.gTot').forEach(x => { x.textContent = gTot(a.results[sid], x.dataset.gt); }); const kb = dlg.querySelector('#tkKey'); if (kb) kb.innerHTML = keyStrip(); dlg.querySelector('tfoot').innerHTML = foot(); dlg.querySelector('#tkSum').innerHTML = summary(); };
  const bad = (el, msg) => { el.classList.add('bad'); setTimeout(() => el.classList.remove('bad'), 400); toast(msg); const r0 = a.results[el.dataset.s]; el.value = fp(r0 && r0.pts ? r0.pts[el.dataset.t] : null); el.select(); };
  dlg.addEventListener('change', e => {
    const el = e.target; if (READONLY) return;
    if (el.matches('.tkc')) {
      const sid = el.dataset.s, t = tasks.find(x => x.id === el.dataset.t), raw = el.value.trim().replace(',', '.');
      let v = null;
      if (raw !== '') { if (!/^\d+(\.\d+)?$/.test(raw)) { bad(el, 'Bitte eine Zahl eintragen'); return; } v = +raw; if (v > +t.max) { bad(el, `Aufgabe ${t.label}: höchstens ${fp(t.max)} Punkte`); return; }
        if (a.key && a.key.preset === 'hv' && v !== Math.round(v)) { bad(el, 'Hörverstehen: nur ganze BE (ISB-Leitfaden 04/2025, S. 3)'); return; } }
      let r = a.results[sid] || (a.results[sid] = {}); r.pts = r.pts || {};
      if (v == null) delete r.pts[t.id]; else { r.pts[t.id] = v; el.value = fp(v); }
      R.applyTasks(a, r, up);
      if (!Object.keys(r.pts).length && !r.status) delete a.results[sid];
      save(); refreshRow(sid);
    } else if (el.matches('.tkst')) {
      const sid = el.dataset.st; let r = a.results[sid] || (a.results[sid] = {});
      const wasE = r.status === 'ent';
      if (el.value && el.value !== 'nt') { r.status = el.value; delete r.nt; delete r.raw; delete r.v; delete r.tend; } else { delete r.status; if (el.value === 'nt' || wasE) { r.nt = true; if (wasE && !el.value) { el.value = 'nt'; toast('Als Nachtermin markiert (NT) – zählt für die Person, nicht im Notenspiegel/Ø der Arbeit'); } } else delete r.nt; R.applyTasks(a, r, up); }
      const dis0 = !!el.value && el.value !== 'nt';
      if (!Object.keys(r.pts || {}).length && !r.status && !r.nt) delete a.results[sid];
      save(); const tr = el.closest('tr'); $$('.tkc', tr).forEach(i => i.disabled = dis0); refreshRow(sid);
    }
  });
  dlg.addEventListener('keydown', e => {
    const el = e.target; if (!el.matches || !el.matches('.tkc')) return;
    const col = el.dataset.t, rows = $$('tbody tr[data-s]', dlg), i = rows.indexOf(el.closest('tr'));
    const go = d => { let k = i + d; while (rows[k] && rows[k].querySelector(`.tkc[data-t="${col}"]`).disabled) k += d; const n2 = rows[k] && rows[k].querySelector(`.tkc[data-t="${col}"]`); if (n2) { el.dispatchEvent(new Event('change', { bubbles: true })); { n2.focus(); n2.select(); } } };
    if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); go(1); } else if (e.key === 'ArrowUp') { e.preventDefault(); go(-1); }
    else if (e.key === 'Tab') {   /* Tab springt von der letzten Aufgabe zur ersten Aufgabe der nächsten Person (nicht in die Status-Auswahl) */
      const mine = $$('.tkc:not(:disabled)', el.closest('tr')), k = mine.indexOf(el);
      const step = e.shiftKey ? -1 : 1; let target = null;
      if (!e.shiftKey && k === mine.length - 1) { for (let j = i + 1; j < rows.length && !target; j++) target = $$('.tkc:not(:disabled)', rows[j])[0]; }
      else if (e.shiftKey && k === 0) { for (let j = i - 1; j >= 0 && !target; j--) { const l = $$('.tkc:not(:disabled)', rows[j]); target = l[l.length - 1]; } }
      if (target) { e.preventDefault(); el.dispatchEvent(new Event('change', { bubbles: true })); { target.focus(); target.select(); } }
    }
  });
  dlg.addEventListener('focusin', e => { if (e.target.matches && e.target.matches('.tkc')) e.target.select(); });
  ['mousedown', 'focusin', 'keydown'].forEach(ev => dlg.addEventListener(ev, e => { if (e.target.matches && e.target.matches('.tkst')) statText(e.target, true); }));
  ['change', 'focusout'].forEach(ev => dlg.addEventListener(ev, e => { if (e.target.matches && e.target.matches('.tkst')) statText(e.target, false); }));
  /* ---- Aufgaben im Blatt anlegen / ändern (wie in Excel) ---- */
  const redraw = () => { dlg.querySelector('#tkRoot').innerHTML = inner(); tfRender(); };
  /* Nach jeder Änderung an Aufgaben: automatische Summen immer neu aus den Aufgaben; von Hand eingetragene Gesamtpunkte (r.rawMan) bleiben.
     Passt der Notenschlüssel nicht mehr (z. B. Summe nur noch 1 BE), gibt es keine Note und einen deutlichen Hinweis. */
  R.markRawOrigin(a);
  const recompute = () => {
    Object.values(a.results).forEach(r => R.regrade(a, r, up));
    const err = R.keyCheck(a.key, up);
    if (err) toast(`Der Notenschlüssel passt nicht mehr zu ${fp(R.tasksMax(a))} Punkten: ${err} Bis dahin rechnet Libretto keine Noten. Notenschlüssel im Spaltenkopf anpassen.`, 9000);
  };
  /* Summe geändert: Notenschlüssel auf die neue Summe umrechnen (KMK-Raster neu, eigene Grenzen im gleichen Prozentverhältnis) */
  const rekey = () => rekeyOf(a);
  const rekeyOf = A => rekeyAssessment(A, up);
  /* ---- Simulation: Faktor einer Aufgabe ändern (gemeinsamer Baustein, auch im Fenster „Leistungsnachweis bearbeiten“) ---- */
  const tfState = {};
  function tfRender() {
    const det = dlg.querySelector('#tfSim'), box = dlg.querySelector('#tfBody'); if (!det || !box) return;
    det.hidden = !a.tasks.length || !a.key; if (!det.open || det.hidden) return;
    renderFactorSim(box, c, a, up, tfState, (u, f) => {
      const sel = u.key.startsWith('g:') ? dlg.querySelector(`select.tkf[data-g="${u.key.slice(2)}"]`) : dlg.querySelector(`select.tkf[data-t="${u.key.slice(2)}"]`);
      if (!sel) return; if (![...sel.options].some(o => +o.value === f)) sel.insertAdjacentHTML('beforeend', `<option value="${f}">× ${String(f).replace('.', ',')}</option>`);
      sel.value = String(f); sel.dispatchEvent(new Event('change', { bubbles: true })); toast(`${u.label} zählt jetzt × ${String(f).replace('.', ',')}`); }, 'ab jetzt');
  }
  const changed = (focusSel) => { rekey(); recompute(); save(); redraw(); if (focusSel) { const el = dlg.querySelector(focusSel); if (el) { el.focus(); el.select && el.select(); } } };
  const numOf = v => { const x = String(v).trim().replace(',', '.'); return /^\d+(\.\d+)?$/.test(x) && +x > 0 && +x <= 1000 ? +x : null; };
  const addTask = (v) => {
    const x = numOf(v); if (x == null) { toast('Bitte die erreichbaren Punkte als Zahl größer als 0 eintragen'); return false; }
    a.tasks.push({ id: uid(), label: String(a.tasks.length + 1), max: x }); tasks = a.tasks; return true;
  };
  dlg.addEventListener('change', e => {
    const el = e.target; if (READONLY || !el.matches) return;
    if (el.matches('.tkl')) { const t = a.tasks.find(x => x.id === el.dataset.t); if (!t) return; t.label = el.value.trim() || String(a.tasks.indexOf(t) + 1); el.value = t.label; save(); const th = dlg.querySelector(`.tkm[data-t="${t.id}"]`); if (th) th.setAttribute('aria-label', 'Höchstpunkte Aufgabe ' + t.label); }
    else if (el.matches('.tkgl')) { const list = a.tasks.filter(x => x.g === el.dataset.g); const v = el.value.trim() || 'Schreiben'; list.forEach(x => x.gl = v); el.value = v; save(); }
    else if (el.matches('.tkf')) { const list = el.dataset.g ? a.tasks.filter(x => x.g === el.dataset.g) : a.tasks.filter(x => x.id === el.dataset.t), t = list[0]; if (!t) return;
      /* automatische Summen rechnen mit dem neuen Faktor neu; von Hand eingetragene Gesamtpunkte bleiben stehen */
      const f = +el.value; list.forEach(x => { if (f > 0 && f !== 1) x.f = f; else delete x.f; });
      changed(); }
    else if (el.matches('.tkm.new')) { if (el.value.trim() === '') return; if (addTask(el.value)) changed('.tkm.new'); else { el.value = ''; } }
    else if (el.matches('.tkm')) {
      const t = a.tasks.find(x => x.id === el.dataset.t); if (!t) return; const x = numOf(el.value);
      const over = Object.values(a.results).some(r => r && r.pts && r.pts[t.id] != null && r.pts[t.id] !== '' && +r.pts[t.id] > (x || 0));
      if (x == null || over) { toast(x == null ? 'Bitte eine Zahl größer als 0 eintragen' : `Bei Aufgabe ${t.label} sind schon mehr Punkte eingetragen – so viele Höchstpunkte gehen nicht`); el.value = fp(t.max); return; }
      if (x === +t.max) { el.value = fp(x); return; }
      t.max = x; changed();
    }
  });
  dlg.addEventListener('keydown', e => {
    const el = e.target; if (!el.matches || !el.matches('.tkm.new') || READONLY) return;
    if (e.key === 'Tab' && !e.shiftKey && el.value.trim() !== '') { e.preventDefault(); const v = el.value; el.value = ''; if (addTask(v)) changed('.tkm.new'); }
    else if (e.key === 'Enter') { e.preventDefault(); const v = el.value; el.value = ''; const wasVal = v.trim() !== ''; if (wasVal) { if (!addTask(v)) return; rekey(); recompute(); save(); redraw(); } const f = dlg.querySelector('.tkc:not(:disabled)'); if (f) { f.focus(); f.select(); } }
  });
  dlg.addEventListener('keydown', e => { const el = e.target; if (el.matches && el.matches('.tkm:not(.new), .tkl') && e.key === 'Enter') { e.preventDefault(); el.dispatchEvent(new Event('change', { bubbles: true })); const f = dlg.querySelector('.tkc:not(:disabled)'); if (f) { setTimeout(() => { f.focus(); f.select(); }, 0); } } });
  dlg.addEventListener('click', async e => {
    const b = e.target.closest && e.target.closest('.tkdel'); if (!b || READONLY) return;
    if (b.dataset.g) { const list = a.tasks.filter(x => x.g === b.dataset.g); if (!list.length || a.tasks.length <= list.length) return;
      const n = Object.values(a.results).filter(r => r && r.pts && list.some(t => r.pts[t.id] != null && r.pts[t.id] !== '')).length;
      if (!(await ask(`Aufgabe <b>${esc(list[0].gl || 'Schreiben')}</b> (${list.map(t => esc(t.label)).join(' und ')}) entfernen?${n ? ` Die dafür eingetragenen Punkte von ${n} ${n === 1 ? 'Person' : 'Personen'} werden nicht mehr mitgerechnet (die Eingaben bleiben gespeichert).` : ''}`, 'Entfernen', true))) return;
      a.tasks = a.tasks.filter(x => x.g !== b.dataset.g); tasks = a.tasks; changed(); return; }
    const t = a.tasks.find(x => x.id === b.dataset.t); if (!t || a.tasks.length < 2) return;
    const n = Object.values(a.results).filter(r => r && r.pts && r.pts[t.id] != null && r.pts[t.id] !== '').length;
    if (!(await ask(`Aufgabe <b>${esc(t.label)}</b> entfernen?${n ? ` Die dafür eingetragenen Punkte von ${n} ${n === 1 ? 'Person' : 'Personen'} werden nicht mehr mitgerechnet (die Eingaben bleiben gespeichert).` : ''}`, 'Entfernen', true))) return;
    a.tasks = a.tasks.filter(x => x.id !== t.id); tasks = a.tasks; changed();
  });
  /* ---- Schreibaufgabe / Sprachmittlung (moderne Fremdsprachen, Jgst. 5–11): EINE Aufgabe mit den Teilen „Inhalt“ und „Sprache“ und gemeinsamem Faktor ----
     Verteilung nach den Bewertungsrastern des ISB: 4 + 6 (ab A2), im Anfangsunterricht (A1) 3 + 7. Die letzte Wahl merkt sich Libretto je Kurs (c.wtPref). */
  dlg.addEventListener('click', e => {
    if (READONLY || !(e.target.closest && e.target.closest('#tkWrite'))) return;
    const pref = c.wtPref || {};
    let kind = 'Schreiben', dist = pref.dist || '4,6', fac = pref.f || 2;
    const info = d => { const [i, sp] = dist.split(',').map(Number); d.querySelector('#wtSum').innerHTML = `Du trägst je Schüler höchstens <b>${i}</b> Punkte für den Inhalt und <b>${sp}</b> für die Sprache ein (halbe Punkte möglich). In die Summe gehen <b>${fp((i + sp) * fac)}</b> Punkte ein.`; };
    const seg = (id, key, list, cur) => `<div class="seg wtSeg" id="${id}">${list.map(([v, l]) => `<button type="button" data-${key}="${v}" aria-pressed="${String(v) === String(cur)}">${l}</button>`).join('')}</div>`;
    sheet({ title: 'Schreibaufgabe oder Sprachmittlung', small: true, ok: 'Hinzufügen', body: `<p class="hint" style="margin-top:0">Eine Aufgabe mit den beiden Teilen <b>Inhalt</b> und <b>Sprache</b>. Den Faktor wählst du nach Umfang und Anspruch – er gilt für beide Teile und lässt sich später in der Überschrift ändern.</p>
        <div class="setHead">Art</div>${seg('wtK', 'k', [['Schreiben', 'Schreibaufgabe'], ['Sprachmittlung', 'Sprachmittlung']], kind)}
        <div class="setHead">Verteilung</div>${seg('wtDist', 'd', [['4,6', 'Inhalt 4 · Sprache 6'], ['3,7', 'Inhalt 3 · Sprache 7']], dist)}
        <p class="hint">4 + 6 ist der Regelfall; 3 + 7 passt im Anfangsunterricht (Niveau A1), wenn die Aufgabe eng geführt ist (ISB, Bewertungsraster).</p>
        <div class="setHead">Faktor</div>${seg('wtF', 'f', [0.5, 1, 1.5, 2, 2.5, 3].map(x => [x, '× ' + String(x).replace('.', ',')]), fac)}
        <p class="hint" id="wtSum" style="margin-top:12px"></p>`,
      onOpen: d => { info(d);
        const bind = (key, set) => $$(`[data-${key}]`, d).forEach(b => b.onclick = () => { set(b.dataset[key]); $$(`[data-${key}]`, d).forEach(x => x.setAttribute('aria-pressed', String(x === b))); info(d); });
        bind('k', v => kind = v); bind('d', v => dist = v); bind('f', v => fac = +v); },
      onOk: () => { const [i, sp] = dist.split(',').map(Number), f = fac !== 1 ? { f: fac } : {};
        c.wtPref = { dist, f: fac };
        if (a.tasks.length === 1 && +a.tasks[0].max === 1 && !hasAnyPts()) a.tasks = [];   /* die leere Startspalte braucht es dann nicht */
        const g = uid(), same = a.tasks.filter(x => x.g && (x.gl || '').startsWith(kind)).length / 2, gl = same ? kind + ' ' + (same + 1) : kind;
        a.tasks.push({ id: uid(), label: 'Inhalt', max: i, g, gl, ...f }, { id: uid(), label: 'Sprache', max: sp, g, gl, ...f }); tasks = a.tasks; changed(); } });
  });
  /* ---- Einfügen aus Excel: Zeile „erreichbar“ (optional) + eine Zeile je Schüler ---- */
  dlg.addEventListener('paste', async e => {
    if (READONLY) return; const txt = (e.clipboardData && e.clipboardData.getData('text')) || '';
    if (!/[\t\n]/.test(txt.trim())) return;   /* einzelner Wert: normal einfügen */
    e.preventDefault();
    const res = parseTaskPaste(txt, c, a, up); if (res.error) { toast(res.error, 6000); return; }
    const msg = `Aus der Tabelle übernehmen?<br>${res.newTasks ? `<b>${res.tasks.length} Aufgaben</b> (zusammen ${fp(res.tasks.reduce((x, t) => x + t.max, 0))} Punkte)<br>` : ''}<b>${res.rows.length}</b> von ${res.total} Zeilen einem Schüler zugeordnet${res.overwrite ? `<br>Bei ${res.overwrite} ${res.overwrite === 1 ? 'Person werden' : 'Personen werden'} schon eingetragene Punkte überschrieben.` : ''}${res.unknown.length ? `<br>Nicht gefunden: ${esc(res.unknown.slice(0, 6).join('; '))}${res.unknown.length > 6 ? ' …' : ''}` : ''}`;
    if (!(await ask(msg, 'Übernehmen'))) return;
    if (res.newTasks) { a.tasks = res.tasks; tasks = a.tasks; }
    res.rows.forEach(({ st, vals }) => { const r = a.results[st.id] || (a.results[st.id] = {}); r.pts = r.pts || {}; tasks.forEach((t, i) => { if (vals[i] != null) r.pts[t.id] = vals[i]; }); delete r.rawMan; });
    rekey(); recompute(); save(); redraw(); toast('Punkte übernommen');
  });
  dlg.addEventListener('close', () => { save(); render(); });
  const first = (focusSid && dlg.querySelector(`tr[data-s="${focusSid}"] .tkc:not(:disabled)`) && [...dlg.querySelectorAll(`tr[data-s="${focusSid}"] .tkc:not(:disabled)`)].find(x => !x.value)) || dlg.querySelector('.tkc:not(:disabled)');
  const startEl = dlg.querySelector('.tkStart') && dlg.querySelector('.tkm:not(.new)');
  if (startEl) { startEl.focus(); startEl.select(); } else if (first) first.focus();
}

/* Tabelle aus Excel (Tab-getrennt) lesen: optional Kopfzeile mit Aufgabennamen, Zeile „erreichbar“ (nur Zahlen oder „erreichbar“/„max“ vorn), danach eine Zeile je Schüler.
   Reihenfolge von Vor- und Nachname egal. Es wird nichts verändert, nur ein Ergebnis zurückgegeben (oder ein Fehler). */
function parseTaskPaste(text, c, a, up) {
  const num = v => { const x = String(v == null ? '' : v).trim().replace(',', '.'); return x !== '' && /^\d+(\.\d+)?$/.test(x) ? +x : null; };
  const rows = text.replace(/\r/g, '').split('\n').map(l => l.split('\t').map(x => x.trim())).filter(r => r.some(x => x !== ''));
  if (rows.length < 1) return { error: 'In der Zwischenablage wurde keine Tabelle gefunden.' };
  const split = r => { let i = 0; const name = []; while (i < r.length && r[i] !== '' && num(r[i]) == null) name.push(r[i++]); while (i < r.length && r[i] === '' && !name.length) i++; return { name, rest: r.slice(i) }; };
  let labels = null, maxRow = null, start = 0;
  const parsed = rows.map(split);
  /* Kopfzeile: nur Text, keine Zahl (z. B. „Name  1a  1b …“) */
  if (rows[0].filter(x => x !== '').length > 1 && rows[0].every(x => num(x) == null) && !/^(erreichbar|max|höchst)/i.test(rows[0][0] || '')) { labels = rows[0]; start = 1; }
  /* Zeile „erreichbar“: ohne Namen (nur Zahlen) oder mit Beschriftung erreichbar/max */
  const p0 = parsed[start];
  if (p0 && (p0.name.length === 0 || /^(erreichbar|max|höchst|punkte)/i.test(p0.name.join(' '))) && p0.rest.some(x => num(x) != null)) { maxRow = p0.rest.map(num); start++; }
  let vals = null;
  if (maxRow) {
    let m = maxRow.slice(); while (m.length && m[m.length - 1] == null) m.pop();
    if (labels) { const lp = split(labels); const lab = (lp.name.length ? labels.slice(lp.name.length) : labels).filter(x => x !== ''); if (lab.length && lab.length <= m.length) m = m.slice(0, lab.length); }
    else if (m.length > 1) { const s0 = Math.round(m.slice(0, -1).reduce((x, y) => x + (y || 0), 0) * 100) / 100; if (Math.abs(s0 - m[m.length - 1]) < 0.01) m.pop(); }   /* Summenspalte am Ende nicht als Aufgabe lesen */
    if (!m.length || m.some(x => x == null || x <= 0 || x > 1000)) return { error: 'Die Zeile mit den erreichbaren Punkten enthält Lücken oder ungültige Zahlen.' };
    vals = m;
  }
  const hasPts = Object.values(a.results || {}).some(r => r && r.pts && Object.keys(r.pts).length);
  let tasks = a.tasks, newTasks = false;
  if (vals) {
    const same = vals.length === tasks.length && vals.every((x, i) => Math.abs(x - +tasks[i].max) < 1e-9);
    if (!same) {
      if (hasPts) return { error: 'Die Aufgaben in der Tabelle passen nicht zu den schon eingetragenen Aufgaben. Es wurde nichts verändert.' };
      const lab = labels ? (() => { const lp = split(labels); return (lp.name.length ? labels.slice(lp.name.length) : labels).filter(x => x !== ''); })() : [];
      tasks = vals.map((mx, i) => ({ id: (a.tasks[i] && a.tasks[i].id) || uid(), label: (lab[i] || String(i + 1)).slice(0, 12), max: mx })); newTasks = true;
    }
  }
  const N = tasks.length;
  const norm = x => String(x || '').toLowerCase().replace(/[.,;]/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ');
  const byKey = new Map(), byLast = new Map();
  c.students.forEach(st => { const n = splitName(st); const k = norm(n.last + ' ' + n.first); byKey.set(k, byKey.has(k) ? null : st); const l = norm(n.last); byLast.set(l, byLast.has(l) ? null : st); });
  const out = [], unknown = []; let total = 0, overwrite = 0; const seen = new Set();
  for (let i = start; i < rows.length; i++) {
    const { name, rest } = parsed[i]; if (!name.length) continue; total++;
    const key = norm(name.join(' ')), st = byKey.get(key) || byLast.get(key);
    if (!st) { unknown.push(name.join(', ')); continue; }
    if (seen.has(st.id)) { unknown.push(name.join(', ') + ' (doppelt)'); continue; } seen.add(st.id);
    const cells = rest.slice(0, N), v = [];
    for (let k = 0; k < N; k++) {
      const raw = cells[k]; if (raw == null || raw === '') { v.push(null); continue; }
      const x = num(raw); if (x == null) return { error: `„${raw}“ bei ${name.join(', ')} ist keine Zahl. Es wurde nichts verändert.` };
      if (x > +tasks[k].max) return { error: `${name.join(', ')}: ${raw} Punkte bei Aufgabe ${tasks[k].label}, erreichbar sind nur ${String(tasks[k].max).replace('.', ',')}. Es wurde nichts verändert.` };
      if (a.key && a.key.preset === 'hv' && x !== Math.round(x)) return { error: `${name.join(', ')}: ${raw} BE – im Hörverstehen gibt es nur ganze BE (ISB-Leitfaden 04/2025, S. 3). Es wurde nichts verändert.` };
      v.push(x);
    }
    const r0 = (a.results || {})[st.id]; if (r0 && r0.status) { unknown.push(name.join(', ') + ' (Status gesetzt)'); continue; }
    if (r0 && r0.pts && v.some((x, k) => x != null && r0.pts[tasks[k].id] != null && r0.pts[tasks[k].id] !== '' && +r0.pts[tasks[k].id] !== x)) overwrite++;
    out.push({ st, vals: v });
  }
  if (!out.length && !newTasks) return { error: 'Keine Zeile konnte einem Schüler zugeordnet werden. Stehen die Namen in der ersten Spalte?' };
  return { rows: out, tasks, newTasks, unknown, total, overwrite };
}

/* Noten aus einer CSV-Datei zuordnen (Viva-Notenliste: Nachname;Vorname;…;Note bzw. Notenpunkte) */
function parseCsv(text) {
  text = String(text || '').replace(/^\uFEFF/, '');
  const first = text.split(/\r?\n/)[0] || ''; const sep = (first.match(/;/g) || []).length >= (first.match(/,/g) || []).length ? ';' : ',';
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) { const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true; else if (ch === sep) { row.push(cur); cur = ''; }
    else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; } else if (ch !== '\r') cur += ch; }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows.filter(r => r.some(x => String(x).trim() !== ''));
}
function importGrades(text, c, up) {
  const rows = parseCsv(text); if (rows.length < 2) return { error: 'In der Datei wurden keine Zeilen gefunden.' };
  const head = rows[0].map(h => String(h).trim().toLowerCase());
  const col = (...names) => head.findIndex(h => names.includes(h));
  const iL = col('nachname', 'familienname', 'name'), iF = col('vorname', 'rufname');
  const iV = up ? (col('notenpunkte', 'punkte', 'np') >= 0 ? col('notenpunkte', 'punkte', 'np') : col('note')) : col('note', 'zensur');
  if (iL < 0 || iV < 0) return { error: `Spalten nicht erkannt – erwartet werden „Nachname“, „Vorname“ und „${up ? 'Notenpunkte' : 'Note'}“ in der ersten Zeile.` };
  const norm = x => String(x || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const key = (l, f) => norm(l) + '|' + norm(f);
  const byKey = new Map(), byLast = new Map();
  /* gleiche Namen doppelt im Kurs → nicht zuordnen (null) statt raten; nur Nachname allein nur, wenn die Datei keinen Vornamen hat */
  c.students.forEach(st => { const n = splitName(st); const k0 = key(n.last, n.first); byKey.set(k0, byKey.has(k0) ? null : st); const k = norm(n.last); byLast.set(k, byLast.has(k) ? null : st); });
  const results = {}, unknown = []; let n = 0;
  rows.slice(1).forEach(r => {
    let l = r[iL], f = iF >= 0 ? r[iF] : ''; if (iF < 0 && String(l).includes(',')) { [l, f] = String(l).split(','); }
    const v = String(r[iV] ?? '').trim(); if (!norm(l)) return;
    const st = byKey.get(key(l, f)) || (!norm(f) ? byLast.get(norm(l)) : null); if (!st || results[st.id]) { unknown.push(`${String(l).trim()}${norm(f) ? ', ' + String(f).trim() : ''}${st ? ' (doppelt)' : byKey.get(key(l, f)) === null ? ' (Name mehrfach im Kurs)' : ''}`); return; }
    if (v === '' || /^fehlt$/i.test(v)) return;
    const pr = R.parseCell(v, up); if (pr.error) return; results[st.id] = pr; n++;
  });
  if (!n) return { error: 'Keine passenden Namen mit Noten gefunden. Stimmen Klasse und Datei überein?' };
  return { results, n, unknown, missing: c.students.filter(st => !results[st.id]).map(st => st.name) };
}

/* Einzelnoten eines Schülers bearbeiten */
/* Leistungsfach Sport: Art der Einzelnote zusammen mit dem Teil (Fach Sport / Sporttheorie) wählen – Wert „art|f“ bzw. „art|t“ */
function entTypeOptsLF(t, part) {
  return ENTRY_TYPES.flatMap(k => k === 'prak' ? [[k + '|f', R.TYPES[k].label + ' · Fach Sport', t === k]] : [[k + '|f', R.TYPES[k].label + ' · Fach Sport', t === k && part === 'f'], [k + '|t', R.TYPES[k].label + ' · Sporttheorie', t === k && part === 't']])
    .map(([v, l, sel]) => `<option value="${v}" ${sel ? 'selected' : ''}>${l}</option>`).join('');
}
function entrySheet(c, s) {
  const up = upper(c), sc = entScope(c);
  let rows = entriesOf(c, s.id, sc).map(e => ({ ...e }));
  const lfS = up && R.upperFormula(c) === 'sportlf';
  const typeOpts = (t, r) => lfS ? entTypeOptsLF(t, r && R.sportPart(r)) : ENTRY_TYPES.map(k => `<option value="${k}" ${t === k ? 'selected' : ''}>${R.TYPES[k].label}</option>`).join('');
  const { dlg } = sheet({ title: `Einzelnoten · ${s.name}`, wide: true, body: `<p class="hint" style="margin-top:0">Jede Einzelnote zählt als eigener kleiner Leistungsnachweis – mit eigenem Datum und Gewicht nach ihrer Art. Falsch eingetragen? Einfach die Zeile <b>löschen</b> und oben „Sichern“. ${up ? 'Halbjahr ' + esc(sc.term) + '.' : ''}</p>
      <div class="entList" id="entList"></div><div class="panelBtns"><button type="button" class="mini accent" id="entAdd">+ Einzelnote</button></div>`,
    onOk: d => {
      const keep = rows.filter(r => r.v != null || r.status);
      const ids = new Set(entriesOf(c, s.id, sc).map(e => e.id));
      c.entries = (c.entries || []).filter(e => !ids.has(e.id)).concat(keep.map(r => ({ ...r, sid: s.id, ...(up ? { term: sc.term } : {}) })));
      save(); render();
    } });
  const list = dlg.querySelector('#entList');
  const draw = () => {
    list.innerHTML = rows.length ? `<div class="entRow entHead"><span>Datum</span><span>Art</span><span>${up ? 'Punkte' : 'Note'}</span><span>Notiz</span><span></span></div>` + rows.map((r, i) => `<div class="entRow" data-i="${i}"><input type="date" data-f="date" value="${esc(r.date || '')}"><select data-f="type">${typeOpts(r.type, r)}</select><input type="text" data-f="grade" value="${esc(R.cellText(r, up))}" placeholder="${up ? '0–15' : '1–6'}"><input type="text" data-f="note" value="${esc(r.note || '')}" placeholder="Notiz (optional)"><button type="button" class="mini del" data-del="${i}">Löschen</button></div>`).join('')
      : '<div class="stEmpty">Noch keine Einzelnoten.</div>';
    $$('.entRow[data-i]', list).forEach(row => { const r = rows[+row.dataset.i];
      row.querySelector('[data-f=date]').onchange = e => r.date = e.target.value;
      row.querySelector('[data-f=type]').onchange = e => { const [k, st] = e.target.value.split('|'); r.type = k; if (st && k !== 'prak') r.st = st; else delete r.st; };
      row.querySelector('[data-f=note]').oninput = e => r.note = e.target.value;
      const g = row.querySelector('[data-f=grade]'); g.onchange = () => { const p = R.parseCell(g.value, up); if (!g.value.trim()) { delete r.v; delete r.tend; delete r.status; return; } if (p.error) { toast(p.error); g.select(); return; } delete r.v; delete r.tend; delete r.status; Object.assign(r, p); };
    });
    $$('[data-del]', list).forEach(b => b.onclick = () => { rows.splice(+b.dataset.del, 1); draw(); });
  };
  draw();
  dlg.querySelector('#entAdd').onclick = () => { rows.push({ id: uid(), type: c.entryType || 'ub', ...(lfS && c.entrySt && c.entryType !== 'prak' ? { st: c.entrySt } : {}), date: todayISO() }); draw(); const g = $$('[data-f=grade]', list); g[g.length - 1].focus(); };
}
function entryCfgSheet(c) {
  sheet({ title: 'Spalte „Einzeln“', small: true, body: `<p class="prose" style="margin-top:0">Hier trägst du Noten ein, die nicht die ganze Klasse am selben Tag bekommt – etwa <b>Unterrichtsbeiträge</b> oder <b>Rechenschaftsablagen</b>. Note in die Zelle tippen und Enter: Libretto speichert sie mit dem heutigen Datum. Auf eine Note klicken: Datum, Art und Notiz ändern – oder die Note wieder <b>löschen</b>.</p>
    ${field('Art bei schneller Eingabe', `<select id="eT">${upper(c) && R.upperFormula(c) === 'sportlf' ? entTypeOptsLF(c.entryType || 'ub', R.sportPart({ type: c.entryType || 'ub', st: c.entrySt })) : ENTRY_TYPES.map(k => `<option value="${k}" ${(c.entryType || 'ub') === k ? 'selected' : ''}>${R.TYPES[k].label}</option>`).join('')}</select>`)}`,
    onOk: d => { const [k, st] = d.querySelector('#eT').value.split('|'); c.entryType = k; if (st && k !== 'prak') c.entrySt = st; else delete c.entrySt; save(); render(); } });
}

/* ======================================================================
   Schülerblatt
   ====================================================================== */
/* ======================================================================
   Elternsprechtag: eine Person groß, alle Noten in zeitlicher Folge, Weiterblättern mit ← →. Notizen sind zunächst verborgen (Bildschirm sehen evtl. die Eltern).
   ====================================================================== */
function talkView(c, sid) {
  const up = upper(c), list = c.students; let i = Math.max(0, list.findIndex(x => x.id === sid)), showNotes = false;
  const chip = (v, txt) => `<span class="tvChip ${v == null ? 'none' : ''}" style="${v == null ? '' : `--g:var(--gr${up ? R.POINT_GRADE(v) : v})`}">${esc(txt)}</span>`;
  const inner = () => {
    const s = list[i];
    const as = c.assessments.concat((c.entries || []).filter(e => e.sid === s.id).map(e => ({ ...e, title: R.TYPES[e.type].label, results: { [s.id]: e } }))).filter(a => a.results && a.results[s.id]).sort((x, y) => (x.date || '').localeCompare(y.date || ''));
    let stats;
    if (up) stats = R.termsOf(c).map(t => { const fo = finalOf(c, s, t), p = fo.points; return `<div class="tvStat ${t === scopeOf(c).term ? 'key' : ''}"><span>Halbjahr ${t}</span><b>${esc(fo.v)}</b><small>${fo.kind !== 'calc' ? fo.label : p == null ? 'noch offen' : 'Punkte · ' + R.POINT_LABEL(p)}</small></div>`; }).join('');
    else { const r = R.computeLower(c, s.id, scopeOf(c)), ov = ovOf(c, s.id);
      stats = `<div class="tvStat key"><span>Zeugnisnote</span><b>${esc(finalOf(c, s).v)}</b><small>${(fo => fo.kind === 'ng' ? 'ohne Note' : fo.kind === 'guest' ? 'Gast – zählt nicht' : fo.kind === 'ov' ? 'festgelegt' : 'Vorschlag nach § 28 GSO')(finalOf(c, s))}</small></div><div class="tvStat"><span>Ø gesamt</span><b>${fmt(r.total) || '–'}</b><small>rechnerisch</small></div>${c.hasSA ? `<div class="tvStat"><span>Ø große LN</span><b>${fmt(r.saAvg) || '–'}</b><small>Schulaufgaben</small></div>` : ''}<div class="tvStat"><span>Ø kleine LN</span><b>${fmt(r.smAvg) || '–'}</b><small>gewichtet</small></div>`; }
    const warn = up ? [] : R.studentWarnings(c, s.id, R.computeLower(c, s.id, scopeOf(c)));
    const row = (title, filter) => { const l = as.filter(filter); return l.length ? `<div class="tvRow"><div class="tvRowT">${title}</div><div class="tvChips">${l.map(a => { const r = a.results[s.id], v = R.valueOf(r, up); return `<div class="tvItem">${chip(v, R.cellText(r, up) || '–')}<small>${esc(a.title || R.TYPES[a.type].short)}${a.date ? '<br>' + sdate(a.date) : ''}</small></div>`; }).join('')}</div></div>` : ''; };
    const note = c.notes[s.id];
    return `<div class="tvTop"><button type="button" class="mini" data-tv="-1" ${i ? '' : 'disabled'} aria-label="Vorherige Person">←</button>
        <div class="tvName"><h2>${esc(s.name)}${supTag(c, s.id)}</h2><p>${esc(cLabel(c))}${isMixed(c.students) && s.cls ? ' · Klasse ' + esc(s.cls) : ''} · ${esc(scopeLabel(c))} · ${i + 1} von ${list.length}</p></div>
        <button type="button" class="mini" data-tv="1" ${i < list.length - 1 ? '' : 'disabled'} aria-label="Nächste Person">→</button></div>
      <div class="tvStats">${stats}</div>
      ${warn.length ? `<div class="notices">${warn.map(w => `<div class="notice ${w.level === 'info' ? 'info' : ''}"><div class="grow">${esc(w.text)}</div></div>`).join('')}</div>` : ''}
      ${as.length ? row(up ? 'Schulaufgaben' : 'Große Leistungsnachweise', a => R.isBig(a)) + row('Kleine Leistungsnachweise', a => !R.isBig(a)) : '<p class="hint">Noch keine Noten.</p>'}
      ${supOf(c, s.id) ? `<p class="hint">${esc(supText(c, s.id))}</p>` : ''}
      ${note ? `<div class="tvNote">${showNotes ? `<b>Notizen (nur für dich)</b><p>${esc(note)}</p><button type="button" class="linkbtn" data-tvn>Notizen verbergen</button>` : '<button type="button" class="linkbtn" data-tvn>Notizen zeigen</button> <small class="hint">– zunächst verborgen, falls die Eltern mit auf den Bildschirm schauen</small>'}</div>` : ''}
      <p class="hint tvKeys">← → blättern · Esc schließt</p>`;
  };
  const { dlg } = sheet({ title: 'Elternsprechtag', wide: true, ok: '', cancel: 'Fertig', body: `<div id="tvBox">${inner()}</div>` });
  dlg.classList.add('tvDlg');
  const draw = () => { dlg.querySelector('#tvBox').innerHTML = inner(); };
  dlg.addEventListener('click', e => { const b = e.target.closest('[data-tv]'); if (b) { i = Math.max(0, Math.min(list.length - 1, i + +b.dataset.tv)); showNotes = false; draw(); } if (e.target.closest('[data-tvn]')) { showNotes = !showNotes; draw(); } });
  dlg.addEventListener('keydown', e => { if (e.target.matches && e.target.matches('input,textarea,select')) return; if (e.key === 'ArrowRight' && i < list.length - 1) { i++; showNotes = false; draw(); e.preventDefault(); } if (e.key === 'ArrowLeft' && i > 0) { i--; showNotes = false; draw(); e.preventDefault(); } });
}
function studentSheet(c, s) {
  const up = upper(c);
  const as = c.assessments.concat((c.entries || []).filter(e => e.sid === s.id).map(e => ({ ...e, title: R.TYPES[e.type].label + ' (einzeln)', results: { [s.id]: e } }))).sort((x, y) => (x.date || '').localeCompare(y.date || ''));
  let sum = '', warn = [];
  if (up) {
    sum = R.termsOf(c).map(t => { const fo = finalOf(c, s, t); return `<div class="stat"><div class="v">${esc(fo.v)}</div><div class="l">Halbjahr ${t}${fo.kind !== 'calc' ? ' · ' + fo.label : fo.points != null ? ' · ' + R.POINT_LABEL(fo.points) : ''}</div></div>`; }).join('');
    if (c.seminar) { const sp = c.seminarPaper[s.id] || {}; sum += `<div class="stat"><div class="v">${R.seminarPaper(sp.arbeit, sp.gespraech) ?? '–'}</div><div class="l">Seminararbeit (max. 30)</div></div>`; }
  } else {
    const r = R.computeLower(c, s.id, scopeOf(c));
    warn = R.studentWarnings(c, s.id, r);
    sum = `${c.hasSA ? `<div class="stat"><div class="v">${fmt(r.saAvg)}</div><div class="l">Ø große LN</div></div>` : ''}<div class="stat"><div class="v">${fmt(r.smAvg)}</div><div class="l">Ø kleine LN</div></div><div class="stat"><div class="v">${fmt(r.total)}</div><div class="l">Ø gesamt (${c.hasSA ? r.ratio + ':1' : 'nur klein'})</div></div><div class="stat"><div class="v">${r.suggestion ? r.suggestion.text : '–'}</div><div class="l">Vorschlag Zeugnis</div></div>`;
  }
  const ov = ovOf(c, s.id) || {}, ovK = ovKind();
  const aw = (c.away && c.away[s.id]) || {};
  const body = `
    ${clsShown(c.students) ? `<div class="grid3">${field('Name', `<input type="text" id="sName" value="${esc(s.name)}">`, 'span2')}${field('Klasse', `<input type="text" id="sCls" value="${esc(s.cls || '')}" placeholder="z. B. 8A" maxlength="6">`)}</div>` : field('Name', `<input type="text" id="sName" value="${esc(s.name)}">`)}
    <div class="stuSum">${sum}</div>
    ${warn.length ? `<div class="notices">${warn.map(w => `<div class="notice ${w.level === 'info' ? 'info' : ''}"><div class="grow">${esc(w.text)}</div></div>`).join('')}</div>` : ''}
    <div class="lnList">${as.length ? as.map(a => { const r = a.results && a.results[s.id]; const big = R.isBig(a); return `<div class="li"><div>${esc(a.title || R.TYPES[a.type].label)}<small>${big ? 'groß' : 'klein'}${a.date ? ' · ' + fdate(a.date) : ''}${up ? ' · ' + a.term : ''}${r && r.status ? ' · ' + esc(R.STATUS[r.status].label) : ''}${!r && isAway(c, s.id, a.date) ? ' · abwesend' : ''}</small></div><div class="hint" style="text-align:right">${r && r.raw != null ? String(r.raw).replace('.', ',') + ' / ' + (a.key ? a.key.max : '') + ' P.' : ''}</div><div class="v">${esc(R.cellText(r, up)) || '–'}</div></div>`; }).join('') : '<div class="li"><div class="hint">Noch keine Leistungsnachweise</div></div>'}</div>
    ${up ? '' : `<div class="subhead">Zeugnisnote</div><div class="rows" style="margin-bottom:10px">${sw('sNg', !!(c.noGrade && c.noGrade[s.id]), 'Ohne Note (z. B. längere Erkrankung) – keine Warnungen, Hinweis auf Bemerkung nach § 39 Abs. 6 GSO')}</div><div class="grid2">${field(ovK === 'half' ? 'Festlegen fürs Zwischenzeugnis / Notenbild' : ovK === 'until' ? 'Festlegen (nur in „Ganzes Jahr“ oder „Zwischenzeugnis“)' : 'Festlegen fürs Jahreszeugnis', `<select id="sOv" ${ovK === 'until' ? 'disabled' : ''}><option value="">Vorschlag übernehmen</option>${[1, 2, 3, 4, 5, 6].map(n => `<option ${+ov.grade === n ? 'selected' : ''}>${n}</option>`).join('')}</select>`)}${field('Begründung (z. B. pädagogische Gesamtwürdigung)', `<input type="text" id="sOvR" value="${esc(ov.reason || '')}">`)}</div>`}
    <div class="subhead">Nachteilsausgleich / Notenschutz</div>
    <div class="grid3"><div class="field"><span>Art</span><select id="sSupK"><option value="">keiner</option><option value="na" ${(supOf(c, s.id) || {}).k === 'na' ? 'selected' : ''}>Nachteilsausgleich</option><option value="ns" ${(supOf(c, s.id) || {}).k === 'ns' ? 'selected' : ''}>Notenschutz</option></select></div>${field('Was gilt? (optional)', `<input type="text" id="sSupT" value="${esc((supOf(c, s.id) || {}).t || '')}" placeholder="z. B. 25 % mehr Zeit · Rechtschreibung wird nicht bewertet" maxlength="120">`, 'span2')}</div>
    <p class="hint">Erscheint als kleine Marke (NA bzw. NS) neben dem Namen – in der Notentabelle und beim Eintragen –, damit du es beim Korrigieren vor Augen hast. Notenschutz wird im Zeugnis vermerkt; auf der Übertragsliste steht deshalb ein Hinweis.</p>
    <div class="subhead">Längere Abwesenheit</div>
    <div class="grid3">${field('Abwesend von', `<input type="date" id="sAwF" value="${esc(aw.from || '')}">`)}${field('bis', `<input type="date" id="sAwT" value="${esc(aw.to || '')}">`)}${field('Grund (optional)', `<input type="text" id="sAwR" value="${esc(aw.reason || '')}" placeholder="z. B. Auslandsaufenthalt">`)}</div>
    <p class="hint">Z. B. für ein Halbjahr im Ausland: Leistungsnachweise in diesem Zeitraum werden in der Tabelle und auf Ausdrucken mit „abw.“ gekennzeichnet. Gerechnet wird wie immer nur mit den vorhandenen Noten.</p>
    <div class="subhead">Gastschüler/in</div>
    <div class="rows" style="margin-bottom:8px">${sw('sGuest', !!s.guest, 'Gast in diesem Kurs (steht nicht auf der Klassenliste)')}</div>
    <div id="guestBox" ${s.guest ? '' : 'hidden'}><div class="grid3">${field('Da von', `<input type="date" id="sGF" value="${esc((s.guest && s.guest.from) || '')}">`)}${field('bis', `<input type="date" id="sGT" value="${esc((s.guest && s.guest.to) || '')}">`)}${field('Noten', `<select id="sGC"><option value="1">zählen wie bei allen</option><option value="0" ${s.guest && s.guest.counts === false ? 'selected' : ''}>nur dokumentieren (zählen nicht)</option></select>`)}</div>
      ${field('Herkunft / Vereinbarung (optional)', `<input type="text" id="sGN" value="${esc((s.guest && s.guest.note) || '')}" placeholder="z. B. Austauschschülerin aus Lyon, Absprache mit der Schulleitung">`)}
      <p class="hint">„Zählen nicht“: Die Noten stehen in der Tabelle, gehen aber nicht in Notenspiegel, Durchschnitt und Statistik der Klasse ein; es gibt keine Zeugnisnote und keine Warnungen. Außerhalb des Zeitraums gilt der Gast wie abwesend.</p></div>
    ${field('Notizen (nur für dich)', `<textarea id="sNote" rows="3">${esc(c.notes[s.id] || '')}</textarea>`)}
    <div class="panelBtns">${c.seminar ? '<button type="button" class="mini accent" id="sSem">Betreuung &amp; Seminararbeit …</button>' : ''}<button type="button" class="mini accent" id="sTalk" title="Große Ansicht für Elterngespräche, mit ← → zur nächsten Person">Elternsprechtag-Ansicht</button><button type="button" class="mini" id="sPdf">Schülerblatt drucken (PDF)</button><button type="button" class="mini" id="sDoc">als Word</button></div>`;
  const { dlg, close: closeStu } = sheet({ title: s.name, wide: true, body, onOk: d => {
    const n = d.querySelector('#sName').value.trim(); if (n && n !== s.name) { Object.assign(s, splitName({ name: n })); s.name = fullName(s); }
    if (!up) { c.noGrade = c.noGrade || {}; if (d.querySelector('#sNg').checked) c.noGrade[s.id] = { reason: d.querySelector('#sOvR').value.trim() }; else delete c.noGrade[s.id]; }
    if (!up && ovK !== 'until') { const g = d.querySelector('#sOv').value, o = g ? { grade: +g, reason: d.querySelector('#sOvR').value.trim(), scope: ovK } : null;
      if (ovK === 'half') { c.ovHalf = c.ovHalf || {}; if (o) c.ovHalf[s.id] = o; else delete c.ovHalf[s.id]; if (c.overrides[s.id] && !c.overrides[s.id].scope) c.overrides[s.id].scope = 'year'; }
      else { if (o) c.overrides[s.id] = o; else delete c.overrides[s.id]; } }
    const nt = d.querySelector('#sNote').value.trim(); if (nt) c.notes[s.id] = nt; else delete c.notes[s.id];
    const sk = d.querySelector('#sSupK').value; c.support = c.support || {}; if (sk) c.support[s.id] = { k: sk, t: d.querySelector('#sSupT').value.trim() }; else delete c.support[s.id];
    if (d.querySelector('#sGuest').checked) { const gf = d.querySelector('#sGF').value, gt = d.querySelector('#sGT').value; if (gf && gt && gt < gf) { toast('Gast: Das Ende liegt vor dem Beginn'); return false; }
      s.guest = { counts: d.querySelector('#sGC').value === '1', ...(gf ? { from: gf } : {}), ...(gt ? { to: gt } : {}), ...(d.querySelector('#sGN').value.trim() ? { note: d.querySelector('#sGN').value.trim() } : {}) }; } else delete s.guest;
    const af = d.querySelector('#sAwF').value, at = d.querySelector('#sAwT').value; c.away = c.away || {};
    if (af && at && at < af) { toast('Abwesenheit: Das Ende liegt vor dem Beginn'); return false; }
    if (af || at) c.away[s.id] = { from: af, to: at, reason: d.querySelector('#sAwR').value.trim() }; else delete c.away[s.id];
    const kl = d.querySelector('#sCls'); if (kl) { const v = Importer.normCls(kl.value) || kl.value.trim(); if (v) s.cls = v; else delete s.cls; }
    sortList(c.students);
    save(); render();
  } });
  const semB = dlg.querySelector('#sSem'); if (semB) semB.onclick = () => { closeStu(); semCard(c, s); };
  dlg.querySelector('#sPdf').onclick = () => exportModel(modelStudents(c, [s]), 'pdf');
  dlg.querySelector('#sTalk').onclick = () => { closeStu(); talkView(c, s.id); };
  dlg.querySelector('#sGuest').onchange = e => { dlg.querySelector('#guestBox').hidden = !e.target.checked; };
  dlg.querySelector('#sDoc').onclick = () => exportModel(modelStudents(c, [s]), 'docx');
}

/* ======================================================================
   W-Seminar: Seminararbeit, Betreuung, Dateien
   Daten (nur ergänzt, nichts Bestehendes geändert):
     c.seminar = true                       W-Seminar (wie bisher)
     c.seminarPaper[sid] = {arbeit, gespraech}   Punkte (wie bisher)
     c.sem = { start, leit, rahmen, themeDue, deadline, deadlineTime, st: { sid: { thema, themaAm, abgabe, abgabeZeit, erkl, verl, verlGrund, wett, wettText, pgAm, bem, files:[…], termine:[…] } } }
     Termin = { id, date, term, kind, inhalt, vereinbart, next, signed, files:[{id, name, size, added}] }
     D.attTrash = { Datei-Kennung: Datum der Entfernung }   (aufgeräumt wird erst nach 120 Tagen)
   ====================================================================== */
const SEM_TAB = 'W';
const isPSem = c => !!(c && c.psem) || /^(p[\s-]?seminar|projekt-?seminar)/i.test(String((c && c.subject) || '').trim());
/* Auswahlfeld mit eigener Liste (statt der Browser-Vorschlagsliste): tippen filtert, Pfeiltasten + Enter wählen, Esc schließt */
function combo(input, itemsFn, opts = {}) {
  const wrap = document.createElement('div'); wrap.className = 'combo'; input.parentNode.insertBefore(wrap, input); wrap.appendChild(input);
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'comboBtn'; btn.tabIndex = -1; btn.setAttribute('aria-label', 'Liste öffnen');
  btn.innerHTML = '<svg viewBox="0 0 12 8" width="12" height="8" aria-hidden="true"><path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  wrap.appendChild(btn);
  const list = document.createElement('div'); list.className = 'comboList'; list.setAttribute('role', 'listbox'); list.hidden = true; wrap.appendChild(list);
  input.setAttribute('role', 'combobox'); input.setAttribute('aria-autocomplete', 'list'); input.autocomplete = 'off';
  let act = -1, shown = [];
  const draw = all => { const q = input.value.trim().toLowerCase(), items = itemsFn();
    shown = all || !q || items.some(x => x.toLowerCase() === q) ? items : items.filter(x => x.toLowerCase().includes(q));
    if (!shown.length) { close(); return; }
    act = Math.max(0, shown.findIndex(x => x.toLowerCase() === q));
    list.innerHTML = shown.map((x, i) => `<div class="comboItem ${i === act ? 'act' : ''} ${x.toLowerCase() === q ? 'sel' : ''}" role="option" data-i="${i}">${esc(x)}</div>`).join('');
    list.hidden = false; wrap.classList.add('open'); const a = list.querySelector('.act'); if (a) a.scrollIntoView({ block: 'nearest' }); };
  const close = () => { list.hidden = true; wrap.classList.remove('open'); act = -1; };
  const pick = i => { if (shown[i] == null) return; input.value = shown[i]; close(); input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); };
  const mark = () => $$('.comboItem', list).forEach((el, i) => { el.classList.toggle('act', i === act); if (i === act) el.scrollIntoView({ block: 'nearest' }); });
  if (opts.openOnFocus !== false) input.addEventListener('focus', () => draw(true));
  input.addEventListener('click', () => { if (list.hidden) draw(true); });
  input.addEventListener('input', e => { if (e.isTrusted !== false && document.activeElement === input) draw(false); });
  input.addEventListener('blur', () => setTimeout(close, 120));
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (list.hidden) { draw(true); return; } act = (act + (e.key === 'ArrowDown' ? 1 : -1) + shown.length) % shown.length; mark(); }
    else if (e.key === 'Enter' && !list.hidden && act >= 0) { e.preventDefault(); e.stopPropagation(); pick(act); }
    else if (e.key === 'Escape' && !list.hidden) { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === 'Tab') close(); });
  list.addEventListener('mousedown', e => { e.preventDefault(); const it = e.target.closest('.comboItem'); if (it) pick(+it.dataset.i); });
  btn.addEventListener('mousedown', e => { e.preventDefault(); if (list.hidden) { input.focus(); draw(true); } else close(); });
  return { close };
}
const LN_W = ['Exposé', 'Gliederungsentwurf', 'Zwischenbericht', 'Arbeitsplan zur Seminararbeit', 'Exzerpt', 'Recherche-Protokoll', 'Protokoll einer Seminarsitzung', 'Analyse einer Quelle', 'Zwischenpräsentation', 'Kurzreferat', 'Glossar', 'Interview', 'Materialmappe', 'Experiment', 'Organisation einer Exkursion'];
const LN_P = ['Projektbeitrag', 'Präsentation', 'Projektdokumentation', 'Portfolio', 'Organisation und Planung', 'Kurzreferat', 'Protokoll'];
/* Fachregeln (moderne Fremdsprachen, Latein …) gelten nicht für Seminare – das Leitfach ist dort nur Angabe */
const ruleSubj = c => (c.seminar || isPSem(c) ? '' : c.subject);
const isWSemName = x => /^(w[\s-]?seminar|wissenschaftsprop)/i.test(String(x || '').trim());
const isSemTab = c => !!(c && c.seminar && UI.term === SEM_TAB);
const yearStart = () => { const m = /^(\d{4})/.exec(String(D.settings.year || '')); return m ? +m[1] : +R.schoolYearOf().slice(0, 4); };
const semMid = () => (/^\d{4}-\d{2}-\d{2}$/.test(D.settings.half1End || '') ? D.settings.half1End.slice(5) : R.SEM_MID);
function semCfg(c) { c.sem = c.sem || {}; c.sem.st = c.sem.st || {}; if (!+c.sem.start) c.sem.start = yearStart() - (+c.grade === 13 ? 1 : 0); return c.sem; }
const semGet = (c, sid) => ((c.sem || {}).st || {})[sid] || {};
function semSt(c, sid) { const cf = semCfg(c); return (cf.st[sid] = cf.st[sid] || {}); }
const semAbi = c => +semCfg(c).start + 2;
const semTermNow = c => R.semTermAt(semCfg(c).start, todayISO(), semMid());
const semToday = () => todayISO();
const semStatusOf = (c, sid) => R.semStatus(c, sid, semToday(), semMid());
const isFreeDay = iso => { const [y, m] = iso.split('-'); return !!Cal.freeDays(+y, +m - 1)[iso]; };
/* nur innerhalb des hinterlegten Ferienkalenders (KMBek 07.12.2022: bis 2029/30) – danach kein scheinbar amtliches Datum */
const semDeadlineSuggest = start => { const y = +start + 1; if (!(y > 2000) || `${y}-11-30` > Cal.COVERED_UNTIL) return null; return R.secondSchoolDayNov(y, isFreeDay); };
const SEM_KINDS = [['beratung', 'Beratungsgespräch'], ['zwischen', 'Zwischenstand / Zwischenpräsentation'], ['kurz', 'Kurze Rücksprache'], ['pruefung', 'Prüfungsgespräch'], ['sonst', 'Sonstiges']];
const semKind = k => (SEM_KINDS.find(x => x[0] === k) || SEM_KINDS[4])[1];
const fmtSize = b => b >= 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const wdate = d => d ? WD[new Date(d + 'T12:00').getDay()] + ', ' + fdate(d) : '';
/* Sprache der Arbeit (§ 24 Abs. 1 GSO) nach dem Leitfach */
const semLeit = c => String((isWSemName(c.subject) ? (c.sem && c.sem.leit) : c.subject) || (c.sem && c.sem.leit) || '').trim();
function semLangHint(c) {
  const f = semLeit(c);
  if (/^englisch/i.test(f)) return 'Leitfach Englisch: Die Seminararbeit wird auf Englisch verfasst, das Prüfungsgespräch auf Englisch geführt (§ 24 GSO).';
  if (R.isLang(f) && !/^(latein|griechisch)/i.test(f)) return `Leitfach ${f}: Die Arbeit wird auf ${f} oder auf Deutsch verfasst; das Prüfungsgespräch wird auf ${f} geführt (§ 24 GSO).`;
  return '';
}
function semHasData(c, sid) {
  const st = semGet(c, sid), sp = (c.seminarPaper || {})[sid] || {};
  return !!((st.thema || '').trim() || (st.termine || []).length || (st.files || []).length || st.abgabe || (sp.arbeit !== '' && sp.arbeit != null) || (sp.gespraech !== '' && sp.gespraech != null));
}
/* Alle Datei-Kennungen eines Schülers bzw. aller Kurse */
const semFilesOf = st => [...(st.files || []), ...(st.termine || []).flatMap(t => t.files || [])];
const usedAttIds = () => D.courses.flatMap(c => Object.values((c.sem || {}).st || {}).flatMap(semFilesOf)).map(f => f.id);
function trashAtt(list) { D.attTrash = D.attTrash || {}; (list || []).forEach(f => { if (f && f.id) D.attTrash[f.id] = todayISO(); }); }
/* Schüler aus einem Kurs entfernt: Seminar-Daten mit entfernen, Dateien in den Papierkorb (endgültig erst nach 120 Tagen) */
function semDrop(c, sid) { const st = (c.sem && c.sem.st) ? c.sem.st[sid] : null; if (st) { trashAtt(semFilesOf(st)); delete c.sem.st[sid]; } }
async function attHousekeeping() {
  try {
    D.attTrash = D.attTrash || {}; const used = new Set(usedAttIds());
    let ch = false; Object.keys(D.attTrash).forEach(id => { if (used.has(id)) { delete D.attTrash[id]; ch = true; } });
    if (!Object.keys(D.attTrash).length) { if (ch) save(); return; }
    await N.attGc([...used], D.attTrash);
    const lim = new Date(Date.now() - 120 * 864e5).toISOString().slice(0, 10);
    Object.entries(D.attTrash).forEach(([id, d]) => { if (d < lim) { delete D.attTrash[id]; ch = true; } });
    if (ch) save();
  } catch (e) {}
}

/* ---------- Ansicht „Seminararbeit“ (ein Reiter neben 12/1 und 12/2) ---------- */
function semBadge(c, s) { const r = semStatusOf(c, s.id); return r.gesamt == null ? '<span class="hint">–</span>' : `<span class="gb ${r.gesamt < 9 ? 'g6' : 'g' + R.POINT_GRADE(Math.round(r.gesamt / 2))}" title="Gesamtleistung Seminararbeit (max. 30)">${r.gesamt}</span>`; }
function semStatusCell(c, s) {
  const r = semStatusOf(c, s.id);
  const txt = r.flags.map(f => f.text).join('\n');
  return `<td class="semSt" data-spstat="${s.id}">${r.worst ? `<button class="semFlag ${r.worst}" data-semcard="${s.id}" title="${esc(txt)}">${r.flags.length}</button>` : '<span class="semOk" title="Keine offenen Punkte">✓</span>'}</td>`;
}
function semView(c) {
  const cf = semCfg(c), t = semToday(), n = c.students.length;
  const due = cf.deadline;
  const days = due ? Math.round((new Date(due + 'T12:00') - new Date(t + 'T12:00')) / 864e5) : null;
  const cnt = f => c.students.filter(f).length;
  const nThema = cnt(s => (semGet(c, s.id).thema || '').trim()), nAbg = cnt(s => semGet(c, s.id).abgabe), nBew = cnt(s => semStatusOf(c, s.id).gesamt != null);
  const bar = `<div class="semBar glass">
      <div class="semDue ${due && days < 0 ? 'past' : due && days <= 14 ? 'soon' : ''}"><small>Abgabe der Seminararbeit</small>${due ? `<b>${esc(wdate(due))}${cf.deadlineTime ? ', ' + esc(cf.deadlineTime) + ' Uhr' : ''}</b><span>${days > 1 ? `noch ${days} Tage` : days === 1 ? 'morgen' : days === 0 ? 'heute' : 'Frist vorbei'}</span>` : '<b>noch nicht eingetragen</b><span>laut GSO spätestens am 2. Unterrichtstag im November (Jgst. 13)</span>'}</div>
      <div class="semCnt"><b>${nThema}<i>/${n}</i></b><small>Themen</small></div>
      <div class="semCnt"><b>${nAbg}<i>/${n}</i></b><small>abgegeben</small></div>
      <div class="semCnt"><b>${nBew}<i>/${n}</i></b><small>bewertet</small></div>
      <div class="semBtns"><button class="mini" data-semcfg="1" title="Abgabetermin, Themenfrist, Rahmenthema">Fristen …</button><button class="mini" data-sempg="1" title="Tag und Uhrzeit je Person, Terminliste drucken">Prüfungsgespräche …</button></div></div>`;
  const terms = ['12/1', '12/2', '13/1'];
  const head = `<thead><tr class="grp"><th class="nm" rowspan="2" style="padding-left:14px;text-align:left">Name</th><th class="sep" rowspan="2" style="text-align:left;padding-left:12px">Thema</th><th class="gSmall sep" colspan="3">Betreuungstermine</th><th class="sep" rowspan="2">Abgabe</th><th class="gBig sep" colspan="3">Bewertung (§ 29 Abs. 6 GSO)</th><th class="sep" rowspan="2">Hinweise</th></tr>
    <tr class="cols">${terms.map((x, i) => `<th class="${i ? '' : 'sep'}" style="padding:6px 10px">${x}</th>`).join('')}<th class="sep" style="padding:6px 10px">Arbeit</th><th style="padding:6px 10px">Prüfungs-<br>gespräch</th><th style="padding:6px 10px">Gesamt<br><small>max. 30</small></th></tr></thead>`;
  let nr = 0;
  const rows = groupsOf(c).map(g => clsRow(g, 10) + g.students.map(s => {
    const st = semGet(c, s.id), sp = c.seminarPaper[s.id] || {};
    const ter = terms.map((x, i) => { const k = (st.termine || []).filter(y => y.term === x).length; const miss = !k && R.semTermOver(cf.start, x, t, semMid()); return `<td class="${i ? '' : 'sep'} semN ${miss ? 'miss' : ''}">${k || '–'}</td>`; }).join('');
    const eff = st.verl || cf.deadline;
    const abg = st.abgabe ? `<span class="semAbg ${eff && st.abgabe > eff ? 'late' : 'ok'}">${sdate(st.abgabe)}</span>` : eff && t > eff ? '<span class="semAbg miss">fehlt</span>' : '<span class="hint">offen</span>';
    const th = (st.thema || '').trim();
    return `<tr data-row="${s.id}"><td class="nm"><button data-semcard="${s.id}"><span class="nr">${++nr}</span>${esc(s.name)}</button></td>
      <td class="sep semThema"><button data-semcard="${s.id}" title="${esc(th || 'Thema eintragen')}">${th ? esc(th) : '<span class="hint">Thema eintragen …</span>'}</button></td>${ter}
      <td class="sep">${abg}${(st.files || []).length ? ' <span class="hint" title="Dateien der Arbeit">📎</span>' : ''}</td>
      <td class="sep"><input class="cell" data-sp="arbeit" data-s="${s.id}" value="${esc(sp.arbeit ?? '')}" autocomplete="off" inputmode="numeric" title="Punkte der Arbeit (0–15)"></td><td><input class="cell" data-sp="gespraech" data-s="${s.id}" value="${esc(sp.gespraech ?? '')}" autocomplete="off" inputmode="numeric" title="Punkte des Prüfungsgesprächs (0–15)"></td>
      <td class="res" data-spsum="${s.id}">${semBadge(c, s)}</td>${semStatusCell(c, s)}</tr>`;
  }).join('')).join('');
  return `${bar}<div class="gridWrap glass"><table class="grid semTbl">${head}<tbody>${rows}</tbody></table></div>
    <div class="legend"><span>Name oder Thema anklicken: <b>Betreuungskarte</b> – Thema, Termine mit Protokoll und Dateien, Abgabe, Bewertung</span><span>Gesamtleistung = (2 × Arbeit + Prüfungsgespräch) × 2/3, gerundet</span><span>Zulassung: abgegeben, keine 0 Punkte, mindestens 9 Punkte (§ 44 GSO)</span></div>`;
}

/* ---------- Dateien (Anhänge) ---------- */
function attChips(list) {
  return (list || []).map(f => `<span class="att" data-att="${esc(f.id)}"><button type="button" class="attName" data-attopen="${esc(f.id)}" title="Öffnen">${esc(f.name)}</button><small>${fmtSize(f.size || 0)}</small><button type="button" class="iconbtn" data-attsave="${esc(f.id)}" title="Speichern unter …">⤓</button><button type="button" class="iconbtn" data-attrm="${esc(f.id)}" title="Entfernen">✕</button></span>`).join('');
}
function attBoxHTML(list, label = 'Dateien') {
  return `<div class="attBox"><div class="attList">${attChips(list)}</div><div class="attDrop"><span>${esc(label)} hierher ziehen oder</span><button type="button" class="mini" data-attpick="1">Dateien wählen …</button></div></div>`;
}
/* Verhalten einer Dateiliste: get() liefert die Liste, set(list) speichert sie; onRemove(f) für Papierkorb */
function bindAtt(box, get, set, onRemove) {
  const draw = () => { box.querySelector('.attList').innerHTML = attChips(get()); mark(); };
  const mark = async () => { const ids = get().map(f => f.id); if (!ids.length) return; try { const miss = new Set(await N.attMissing(ids)); box.querySelectorAll('.att').forEach(el => { if (miss.has(el.dataset.att)) { el.classList.add('gone'); el.title = 'Diese Datei ist auf diesem Computer nicht vorhanden (Sicherung aus dem Sicherungsordner wiederherstellen).'; } }); } catch (e) {} };
  const take = r => { if (!r) return; if (r.added && r.added.length) { set(get().concat(r.added)); draw(); toast(r.added.length === 1 ? `„${r.added[0].name}“ angehängt` : `${r.added.length} Dateien angehängt`); }
    if (r.skipped && r.skipped.length) toast('Nicht angehängt: ' + r.skipped.map(x => `${x.name} (${x.reason})`).join('; '), 6000); };
  box.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.attpick) { if (READONLY) return; take(await N.attPick()); }
    else if (b.dataset.attopen) { const f = get().find(x => x.id === b.dataset.attopen); if (f) { const r = await N.attOpen(f.id, f.name); if (r && r.ok === false && r.error) toast(r.error, 5000); } }
    else if (b.dataset.attsave) { const f = get().find(x => x.id === b.dataset.attsave); if (f) { const r = await N.attSave(f.id, f.name); if (r && r.ok === false && r.error) toast(r.error, 5000); } }
    else if (b.dataset.attrm) { if (READONLY) return; const f = get().find(x => x.id === b.dataset.attrm); if (f && await ask(`„${esc(f.name)}“ aus der Liste entfernen?`, 'Entfernen', true)) { set(get().filter(x => x.id !== f.id)); onRemove && onRemove(f); draw(); } }
  });
  const dz = box.querySelector('.attDrop');
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('over'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('over'));
  dz.addEventListener('drop', async e => { e.preventDefault(); dz.classList.remove('over'); if (READONLY) return;
    for (const f of [...e.dataTransfer.files]) { try { take(await N.attAdd(f.name, new Uint8Array(await f.arrayBuffer()))); } catch (err) { toast('Datei konnte nicht gelesen werden: ' + f.name); } } });
  mark();
}

const bwState = (c, s, kind) => { const b = semGet(c, s.id)[kind === 'P' ? 'bwP' : 'bwA']; const K = kind === 'P' ? kritP(c) : kritA(c);
  const n = b ? K.filter(x => (b.p && b.p[x.k] != null && b.p[x.k] !== '') || (b.e && b.e[x.k])).length : 0;
  return n ? `${n} von ${K.length} ${kind === 'P' ? 'Kompetenzen' : 'Bereichen'} bewertet` : `${K.length} ${kind === 'P' ? 'Kompetenzen nach ISB' : 'Bereiche nach ISB (Anlage 5a)'} – noch leer`; };
/* ---------- Betreuungskarte (je Schüler) – speichert jede Änderung sofort ---------- */
function semCard(c, s) {
  const cf = semCfg(c);
  const st = () => semSt(c, s.id);
  const sp = () => (c.seminarPaper[s.id] = c.seminarPaper[s.id] || {});
  const v = semGet(c, s.id), p0 = c.seminarPaper[s.id] || {};
  const lh = semLangHint(c);
  const stats = () => { const r = semStatusOf(c, s.id), x = semGet(c, s.id);
    const hj = t => { const q = R.computeTerm(c, s.id, t).points; return q == null ? '–' : q; };
    return `<div class="stat"><div class="v">${r.gesamt ?? '–'}</div><div class="l">Seminararbeit (max. 30)</div></div><div class="stat"><div class="v">${hj('12/1')}</div><div class="l">Halbjahr 12/1</div></div><div class="stat"><div class="v">${hj('12/2')}</div><div class="l">Halbjahr 12/2</div></div><div class="stat"><div class="v">${(x.termine || []).length}</div><div class="l">Betreuungstermine</div></div><div class="stat"><div class="v">${x.abgabe ? sdate(x.abgabe) : '–'}</div><div class="l">abgegeben</div></div>`; };
  const flags = () => semStatusOf(c, s.id).flags.map(f => `<div class="notice ${f.level === 'info' ? 'info' : ''} ${f.level === 'red' ? 'red' : ''}"><div class="grow">${esc(f.text)}</div></div>`).join('');
  const terminList = () => { const ts = (semGet(c, s.id).termine || []).slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    return ts.length ? ts.map(t => `<div class="tmRow"><span class="d">${t.date ? sdate(t.date) + String(t.date).slice(2, 4) : '–'}<small>${esc(t.term || '')}</small></span><span class="tx"><b>${esc(semKind(t.kind))}</b>${t.signed ? ' <em class="ok" title="Protokoll unterschrieben">✓ unterschrieben</em>' : ''}<small>${esc(((t.inhalt || '').split(/\n/)[0] || 'ohne Notiz').slice(0, 140))}</small></span><span class="hint">${(t.files || []).length ? '📎 ' + t.files.length : ''}</span><span class="tmBtns"><button type="button" class="mini" data-tmedit="${t.id}">Öffnen</button><button type="button" class="mini" data-tmpdf="${t.id}" title="Protokoll als PDF">PDF</button></span></div>`).join('')
      : '<div class="stEmpty">Noch keine Termine. Nach jedem Gespräch kurz festhalten, was besprochen und vereinbart wurde – Libretto druckt daraus das Protokoll zum Unterschreiben.</div>'; };
  const body = `<div class="stuSum" id="smStats">${stats()}</div><div class="notices" id="smFlags">${flags()}</div>
    <div class="subhead">Thema</div>
    ${field('Thema der Seminararbeit', `<textarea id="smThema" rows="2" placeholder="Arbeitstitel – endgültig bis Ende 12/1 (§ 24 Abs. 1 GSO)">${esc(v.thema || '')}</textarea>`)}
    <div class="grid3">${field('Kurztitel fürs Abiturzeugnis (falls nötig)', `<input type="text" id="smKurz" value="${esc(v.kurz || '')}" placeholder="begrenzte Zeichenzahl – laut Schule">`, 'span2')}<div class="field"><span>Zeichen</span><div class="semSum" id="smKurzN" style="font-size:20px">${(v.kurz || '').length}</div></div></div>
    ${R.isModernLang(semLeit(c)) && !/^englisch/i.test(semLeit(c)) ? `<div class="grid3">${field('Sprache der Arbeit (§ 24 Abs. 1 GSO)', `<select id="smSpr"><option value="">${esc(semLeit(c))}</option><option value="de" ${v.sprache === 'de' ? 'selected' : ''}>Deutsch</option></select>`)}</div>` : ''}
    <label class="check"><input type="checkbox" id="smWb" ${v.wb ? 'checked' : ''}> <span>Wettbewerbsbeitrag ersetzt die Seminararbeit (§ 24 Abs. 3 GSO)</span></label>
    <div id="smWbRow" ${v.wb ? '' : 'hidden'}>${field('Wettbewerb', `<input type="text" id="smWbN" value="${esc(v.wbName || '')}" placeholder="vom Staatsministerium als geeignet anerkannt, z. B. Jugend forscht">`)}</div>
    <div class="grid3">${field('Thema festgelegt am', `<input type="date" id="smThemaAm" value="${esc(v.themaAm || '')}">`)}<div class="span2 hint" style="align-self:end;margin-bottom:12px">${esc(lh || 'Das Thema wählt die Schülerin bzw. der Schüler bis Ende 12/1 im Einvernehmen mit der Kursleitung (§ 24 Abs. 1 GSO).')}</div></div>
    <div class="subhead">Betreuungstermine <button type="button" class="mini accent" id="smTmAdd" style="float:right">+ Termin</button></div>
    <div class="tmList" id="smTm">${terminList()}</div>
    <label class="check"><input type="checkbox" id="smExp" ${v.expose ? 'checked' : ''}> <span>Exposé bzw. Gliederungsentwurf besprochen (Meilenstein 12/2)</span></label>
    <div class="subhead">Abgabe</div>
    <div class="grid3">${field('Abgegeben am', `<input type="date" id="smAbg" value="${esc(v.abgabe || '')}">`)}${field('Uhrzeit (optional)', `<input type="time" id="smAbgZ" value="${esc(v.abgabeZeit || '')}">`)}
      <label class="check" style="margin-top:22px"><input type="checkbox" id="smErkl" ${v.erkl ? 'checked' : ''}> <span>Erklärung zur selbstständigen Anfertigung liegt vor</span></label></div>
    <label class="check"><input type="checkbox" id="smKi" ${v.kiDoc ? 'checked' : ''}> <span>Dokumentation der KI-Nutzung abgegeben</span></label>
    <div class="grid3">${field('Frist verlängert bis', `<input type="date" id="smVerl" value="${esc(v.verl || '')}">`)}${field('Grund (Entscheidung der Schule)', `<input type="text" id="smVerlG" value="${esc(v.verlGrund || '')}" placeholder="z. B. längere Erkrankung">`, 'span2')}</div>
    <label class="check"><input type="checkbox" id="smWett" ${v.wett ? 'checked' : ''}> <span>Ersetzt durch einen gleichwertigen Wettbewerbsbeitrag (§ 24 GSO)</span></label>
    <div id="smWettBox" ${v.wett ? '' : 'hidden'}>${field('Wettbewerb / Beitrag', `<input type="text" id="smWettT" value="${esc(v.wettText || '')}">`)}</div>
    <div class="field"><span>Dateien der Arbeit (z. B. abgegebene Seminararbeit als PDF)</span><div id="smFiles">${attBoxHTML(v.files, 'Dateien')}</div></div>
    <div class="subhead">Bewertung</div>
    <div class="grid3">${field('Seminararbeit (0–15 Punkte)', `<input type="text" inputmode="numeric" id="smA" value="${esc(p0.arbeit ?? '')}" maxlength="2">`)}${field('Prüfungsgespräch (0–15 Punkte)', `<input type="text" inputmode="numeric" id="smP" value="${esc(p0.gespraech ?? '')}" maxlength="2">`)}
      <div class="field"><span>Gesamtleistung (max. 30)</span><div class="semSum" id="smG">${R.seminarPaper(p0.arbeit, p0.gespraech) ?? '–'}</div></div></div>
    <div class="bwBtns"><button type="button" class="bwBtn" id="smBwA"><b>Bewertungsbogen Seminararbeit</b><small id="smBwAS">${bwState(c, s, 'A')}</small></button><button type="button" class="bwBtn" id="smBwP"><b>Bewertungsbogen Prüfungsgespräch</b><small id="smBwPS">${bwState(c, s, 'P')}</small></button></div>
    <div class="grid3">${field('Prüfungsgespräch am', `<input type="date" id="smPgAm" value="${esc(v.pgAm || '')}">`)}${field('Uhrzeit', `<input type="time" id="smPgZ" value="${esc(v.pgZeit || '')}">`)}${field('Bemerkung zur Bewertung (nur für dich)', `<input type="text" id="smBem" value="${esc(v.bem || '')}">`)}</div>
    <p class="hint">§ 29 Abs. 6 GSO: Die Punkte der Arbeit zählen doppelt, dazu die Punkte des Prüfungsgesprächs (§ 24 Abs. 2 GSO; laut ISB-Übersicht insgesamt ca. 25 Minuten, optional mit einem Kurzvortrag von höchstens 5 Minuten); die Summe wird mit 2/3 multipliziert und gerundet. Unter 9 Punkten muss die Schule das bis Ende 13/1 mitteilen (§ 44 Abs. 1 Satz 2 GSO); ob die Zulassung gefährdet ist, hängt von allen eingebrachten Leistungen ab (§ 44 Abs. 2 Nr. 3 GSO). Weder Arbeit noch Prüfungsgespräch dürfen mit 0 Punkten bewertet sein (§ 44 GSO). ${lh ? esc(lh) : ''}</p>
    ${field('Notizen (nur für dich)', `<textarea id="smNote" rows="2">${esc(c.notes[s.id] || '')}</textarea>`)}
    <div class="panelBtns"><button type="button" class="mini" id="smDocPdf">Betreuungsdokumentation (PDF)</button><button type="button" class="mini" id="smDocWord">als Word</button><button type="button" class="mini" id="smGrades">Noten 12/1 und 12/2 …</button></div>
    <p class="hint">Alles wird sofort gespeichert. Libretto dokumentiert nur – über Zulassung, Fristverlängerung und Folgen entscheidet die Schule.</p>`;
  const { dlg, close } = sheet({ title: s.name + ' · W-Seminar', wide: true, ok: '', cancel: 'Fertig', body });
  dlg.addEventListener('close', () => renderGrades(), { once: true });
  const q = id => dlg.querySelector(id);
  const refresh = () => { q('#smStats').innerHTML = stats(); q('#smFlags').innerHTML = flags(); };
  const put = (k, val) => { if (READONLY) return; const o = st(); if (val === '' || val === false || val == null) delete o[k]; else o[k] = val; save(); refresh(); };
  [['#smThema', 'thema'], ['#smKurz', 'kurz'], ['#smWbN', 'wbName'], ['#smPgZ', 'pgZeit'], ['#smThemaAm', 'themaAm'], ['#smAbg', 'abgabe'], ['#smAbgZ', 'abgabeZeit'], ['#smVerl', 'verl'], ['#smVerlG', 'verlGrund'], ['#smWettT', 'wettText'], ['#smPgAm', 'pgAm'], ['#smBem', 'bem']]
    .forEach(([sel, k]) => { const el = q(sel); el.addEventListener('change', () => put(k, el.value.trim())); });
  q('#smThema').addEventListener('input', () => { if (!READONLY) { const o = st(); const x = q('#smThema').value.trim(); if (x) o.thema = x; else delete o.thema; save(); } });
  q('#smErkl').onchange = () => put('erkl', q('#smErkl').checked);
  q('#smKi').onchange = () => put('kiDoc', q('#smKi').checked);
  q('#smWb').onchange = () => { put('wb', q('#smWb').checked); q('#smWbRow').hidden = !q('#smWb').checked; };
  if (q('#smSpr')) q('#smSpr').onchange = () => put('sprache', q('#smSpr').value);
  q('#smExp').onchange = () => put('expose', q('#smExp').checked);
  q('#smKurz').addEventListener('input', () => { q('#smKurzN').textContent = q('#smKurz').value.trim().length; });
  const bwDone = () => { const x = c.seminarPaper[s.id] || {}; q('#smA').value = x.arbeit ?? ''; q('#smP').value = x.gespraech ?? ''; q('#smG').textContent = R.seminarPaper(x.arbeit, x.gespraech) ?? '–';
    const y = semGet(c, s.id); q('#smPgAm').value = y.pgAm || ''; q('#smPgZ').value = y.pgZeit || ''; q('#smBwAS').textContent = bwState(c, s, 'A'); q('#smBwPS').textContent = bwState(c, s, 'P'); refresh(); };
  q('#smBwA').onclick = () => semBwSheet(c, s, 'A', bwDone);
  q('#smBwP').onclick = () => semBwSheet(c, s, 'P', bwDone);
  q('#smWett').onchange = () => { put('wett', q('#smWett').checked); q('#smWettBox').hidden = !q('#smWett').checked; };
  q('#smNote').addEventListener('change', () => { if (READONLY) return; const x = q('#smNote').value.trim(); if (x) c.notes[s.id] = x; else delete c.notes[s.id]; save(); });
  const pts = (sel, k) => { const el = q(sel); el.addEventListener('change', () => {
    if (READONLY) return; const x = el.value.trim();
    if (x !== '' && (!/^\d{1,2}$/.test(x) || +x > 15)) { toast('Punkte 0–15'); el.select(); return; }
    sp()[k] = x === '' ? '' : +x; save(); q('#smG').textContent = R.seminarPaper(sp().arbeit, sp().gespraech) ?? '–'; refresh(); }); };
  pts('#smA', 'arbeit'); pts('#smP', 'gespraech');
  bindAtt(q('#smFiles'), () => semGet(c, s.id).files || [], list => { st().files = list; save(); }, f => { trashAtt([f]); save(); });
  const redrawTm = () => { q('#smTm').innerHTML = terminList(); refresh(); };
  q('#smTmAdd').onclick = () => { if (READONLY) return; semTerminSheet(c, s, null, redrawTm); };
  q('#smTm').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const t = (semGet(c, s.id).termine || []).find(x => x.id === (b.dataset.tmedit || b.dataset.tmpdf)); if (!t) return;
    if (b.dataset.tmedit) semTerminSheet(c, s, t, redrawTm); else exportModel(modelSemProtocol(c, s, t), 'pdf'); });
  q('#smDocPdf').onclick = () => exportModel(modelSemDossier(c, [s]), 'pdf');
  q('#smDocWord').onclick = () => exportModel(modelSemDossier(c, [s]), 'docx');
  q('#smGrades').onclick = () => openSub(dlg, () => studentSheet(c, s));
  if (!(v.thema || '').trim()) q('#smThema').focus();
}

/* ---------- W-Seminar: Bewertungsbögen (ISB-Material 2026, an die Schule anpassbar) ---------- */
const KRIT_P = [
  { k: 'fach', l: 'Fachkompetenz', d: 'Inhalte korrekt, differenziert und fachlich fundiert darstellen', f: 1 },
  { k: 'arg', l: 'Argumentationskompetenz', d: 'schlüssig, strukturiert und überzeugend argumentieren', f: 1 },
  { k: 'meth', l: 'Methoden- und Wissenschaftskompetenz', d: 'geeignete wissenschaftliche Methoden anwenden und begründen', f: 1 },
  { k: 'dar', l: 'Darstellungskompetenz', d: 'Inhalte klar strukturiert und sprachlich präzise präsentieren', f: 1 },
  { k: 'refl', l: 'Reflexions- und Transferkompetenz', d: 'Wissen und Erkenntnisse kritisch hinterfragen, bewerten und auf neue Problemstellungen übertragen', f: 1 }];
const KRIT_A = [   /* Leitfragen wörtlich nach Anlage 5a „Bewertungsbogen für die Seminararbeit“ (Gewichte dort „z. B.“ – von der Schule anpassbar) */
  { k: 'form', l: 'Form', d: 'formale Vorgaben eingehalten; übersichtlich und ansprechend gestaltet; übliche Kriterien einer wissenschaftlichen Arbeit (Seitenzählung, Schriftsatz usw.)', w: 10 },
  { k: 'spr', l: 'Sprache', d: 'orthografisch, sprachlich und stilistisch korrekt; gut lesbarer, sachlicher Stil; Fachbegriffe und fremdsprachige Begriffe richtig verwendet', w: 20 },
  { k: 'meth', l: 'Methode', d: 'Behauptungen genau belegt und begründet; überzeugende Untersuchungsstrategie; Bilder, Zitate, Tabellen mit Erkenntniszugewinn; fachspezifische Methoden korrekt angewendet; maßgebliche Quellen verwendet und genau ausgewertet; alle Quellen korrekt angegeben; ggf. experimentelle, forschende oder analytische Anteile auf die Problemstellung bezogen und angemessen reflektiert', w: 30, ds: 'Behauptungen belegt und begründet, überzeugende Untersuchungsstrategie, Bilder/Zitate/Tabellen mit Erkenntnisgewinn, fachspezifische Methoden korrekt, maßgebliche Quellen ausgewertet und korrekt angegeben' },
  { k: 'inh', l: 'Inhalt', d: 'klar und logisch gegliedert; zentrale Frage- bzw. Problemstellung klar herausgearbeitet; Forschungsstand hinreichend einbezogen; Bezug zum Thema in allen Teilen erkennbar; Gedankengänge nachvollziehbar und überzeugend; Ergebnisse am Ende von Kapiteln klar formuliert; Ausführungen und Schlussfolgerungen sachlich und fachlich zutreffend; am Schluss plausible, schlüssige Antwort auf die Frage-/Problemstellung', w: 40, ds: 'klar gegliedert, Fragestellung klar herausgearbeitet, Forschungsstand einbezogen, Themenbezug, nachvollziehbare Gedankengänge, fachlich zutreffende Ergebnisse, schlüssige Antwort am Schluss' }];
const EINSCH = ['++', '+', '–', '––'];
const kritP = c => (semCfg(c).kritP && semCfg(c).kritP.length ? semCfg(c).kritP : KRIT_P);
const kritA = c => (semCfg(c).kritA && semCfg(c).kritA.length ? semCfg(c).kritA : KRIT_A);
const rnd = x => Math.floor(x + 0.5 + 1e-9);
const noteOf = n => (R.POINT_LABEL ? R.POINT_LABEL(+n).replace('-', '–') : String(R.POINT_GRADE(+n)));
const ptsLabel = v => v === '' || v == null ? '' : `${v} P.`;
const ptsNote = v => v === '' || v == null ? '' : ['ungenügend', 'mangelhaft', 'ausreichend', 'befriedigend', 'gut', 'sehr gut'][Math.min(5, Math.floor((+v + 2) / 3))];
/* Vorschläge: gewichteter Durchschnitt der Teilpunkte, gerundet – nur, wenn alle Kriterien bewertet sind */
function bwPVorschlag(c, b) { const K = kritP(c); if (!b || !K.every(x => b.p && b.p[x.k] !== '' && b.p[x.k] != null)) return null; const sf = K.reduce((a, x) => a + (+x.f || 1), 0); return rnd(K.reduce((a, x) => a + (+b.p[x.k]) * (+x.f || 1), 0) / sf); }
function bwAVorschlag(c, b) { const K = kritA(c); if (!b || !K.every(x => b.p && b.p[x.k] !== '' && b.p[x.k] != null)) return null; const sw = K.reduce((a, x) => a + (+x.w || 0), 0) || 1; return rnd(K.reduce((a, x) => a + (+b.p[x.k]) * (+x.w || 0), 0) / sw); }
const PSCALE = [{ g: '1', v: ['15', '14', '13'] }, { g: '2', v: ['12', '11', '10'] }, { g: '3', v: ['9', '8', '7'] }, { g: '4', v: ['6', '5', '4'] }, { g: '5', v: ['3', '2', '1'] }, { g: '6', v: ['0'] }];
const ptsSelect = (attr, v) => `<select ${attr}><option value="">–</option>${Array.from({ length: 16 }, (_, i) => 15 - i).map(n => `<option value="${n}" ${String(v) === String(n) ? 'selected' : ''}>${n} P. · Note ${noteOf(n)}</option>`).join('')}</select>`;

function modelSemBwP(c, s, blank) {
  const st = blank ? {} : semGet(c, s.id), b = blank ? {} : (st.bwP || {}), sp = blank ? {} : (c.seminarPaper[s.id] || {}), v = bwPVorschlag(c, b);
  const zeit = st.pgZeit ? st.pgZeit + (st.pgBis ? '–' + st.pgBis : '') + ' Uhr' : '';
  return { eyebrow: 'W-Seminar · Abitur ' + semAbi(c), title: 'Bewertung des Prüfungsgesprächs', subtitle: blank ? 'Bewertungsbogen' : s.name, file: fileSafe(`${st.pgAm || todayISO()} Bewertung Prüfungsgespräch ${blank ? 'Vorlage' : s.name} ${c.name}`), meta: semMeta(c),
    blocks: [{ kv: [['Schülerin / Schüler', blank ? ' ' : s.name], ['Thema der Seminararbeit', blank ? '\n ' : st.thema || ''], ['Datum, Uhrzeit', [st.pgAm ? wdate(st.pgAm) : '', zeit].filter(Boolean).join(', ')], ['Form', (blank ? '☐ mit freiem Kurzvortrag (höchstens 5 Minuten)     ☐ nur Prüfungsgespräch' : b.vortrag ? 'freier Kurzvortrag (höchstens 5 Minuten) und Prüfungsgespräch' : 'Prüfungsgespräch') + (R.isModernLang(semLeit(c)) ? ' – in der Fremdsprache (§ 24 Abs. 2 GSO)' : '')]] },
      { h: 'Bewertung nach Kompetenzen' },
      { crit: { scale: PSCALE, lines: blank ? 2 : 0, items: kritP(c).map(x => { const pv = (b.p || {})[x.k]; return { l: x.l, d: x.d, w: (+x.f || 1) !== 1 ? 'Faktor ' + String(x.f).replace('.', ',') : '', v: ptsLabel(pv), vs: pv === '' || pv == null ? '' : 'Note ' + noteOf(pv), sel: pv, note: (b.n || {})[x.k] || '' }; }) } },
      { group: [...(b.urteil ? [{ h: 'Gesamturteil' }, { p: b.urteil }] : blank ? [{ h: 'Gesamturteil' }, { lines: 4 }] : []), { stats: [...(v != null ? [{ l: 'Vorschlag aus den Kompetenzen', v: v + ' P.', s: 'gewichteter Durchschnitt, gerundet' }] : []), { l: 'Prüfungsgespräch', v: sp.gespraech === '' || sp.gespraech == null ? (blank ? '____ Punkte' : '–') : sp.gespraech + ' Punkte', s: 'von 15 · festgesetzt von der Lehrkraft', key: true }] },
      { note: 'Prüfungsgespräch nach § 24 Abs. 2 GSO; Dauer laut ISB-Übersicht ca. 25 Minuten (Umsetzung des KMS vom 02.02.2026). Kompetenzen nach dem Bewertungsbogen des ISB, von der Schule anpassbar. Die Punkte je Kompetenz sind eine Ersteinschätzung; die Bewertung setzt die Lehrkraft fest.' },
      { sig: ['Datum, Unterschrift Kursleitung'] }] }] };
}
function modelSemBwA(c, s, blank) {
  const st = blank ? {} : semGet(c, s.id), b = blank ? {} : (st.bwA || {}), sp = blank ? {} : (c.seminarPaper[s.id] || {}), v = bwAVorschlag(c, b), cf = semCfg(c);
  const due = st.verl || cf.deadline, inTime = st.abgabe ? (due ? st.abgabe <= due : null) : null;
  return { eyebrow: 'W-Seminar · Abitur ' + semAbi(c), title: 'Bewertung der Seminararbeit', subtitle: blank ? 'Bewertungsbogen' : s.name, file: fileSafe(`${todayISO()} Bewertung Seminararbeit ${blank ? 'Vorlage' : s.name} ${c.name}`), meta: semMeta(c),
    blocks: [{ kv: [['Schülerin / Schüler', blank ? ' ' : s.name], ['Thema der Seminararbeit', blank ? '\n ' : st.thema || ''], ...(st.kurz || blank ? [['Kurztitel (Abiturzeugnis)', blank ? ' ' : st.kurz]] : []),
        ['Abgabe', blank ? ' ' : st.abgabe ? `${wdate(st.abgabe)}${st.abgabeZeit ? ', ' + st.abgabeZeit + ' Uhr' : ''}${inTime === true ? ' – termingerecht' : inTime === false ? ' – nach der Frist' : ''}` : 'noch nicht abgegeben'],
        /* eine Zeile statt drei – damit der Bogen auf eine Seite passt */
        ['Selbstständig verfasst', blank ? '☐ ja – nur mithilfe der angegebenen Quellen     ☐ nein' : [b.selbst ? 'ja' + (st.erkl ? ' (Erklärung liegt vor)' : '') : st.erkl ? 'Erklärung liegt vor' : '–', st.kiDoc ? 'KI-Nutzung dokumentiert' : '', R.isModernLang(semLeit(c)) ? 'Sprache der Arbeit: ' + (st.sprache === 'de' ? 'Deutsch' : semLeit(c)) : ''].filter(Boolean).join(' · ')],
        ...(st.wb ? [['Wettbewerbsbeitrag (§ 24 Abs. 3 GSO)', st.wbName || 'ja']] : [])] },
      { h: 'Bewertung nach Bereichen' },
      { crit: { scale: EINSCH, lines: blank ? 2 : 0, items: kritA(c).map(x => { const pv = (b.p || {})[x.k]; return { l: x.l, d: x.ds || x.d, w: x.w ? x.w + ' %' : '', v: ptsLabel(pv), vs: pv === '' || pv == null ? '' : 'Note ' + noteOf(pv), sel: (b.e || {})[x.k], note: (b.n || {})[x.k] || '' }; }) } },
      { group: [...(b.urteil ? [{ h: 'Gesamturteil' }, { p: b.urteil }] : blank ? [{ h: 'Gesamturteil' }, { lines: 4 }] : []), { stats: [...(v != null ? [{ l: 'Vorschlag aus den Bereichen', v: v + ' P.', s: 'nach Gewichtung, gerundet' }] : []), { l: 'Seminararbeit', v: sp.arbeit === '' || sp.arbeit == null ? (blank ? '____ Punkte' : '–') : sp.arbeit + ' Punkte', s: 'von 15 · festgesetzt von der Lehrkraft', key: true }] },
      { note: 'Bereiche und Gewichtung nach dem ISB-Bewertungsbogen (Anlage 5a), von der Schule anpassbar. ++ voll · + überwiegend · – teilweise · –– nicht erfüllt. Die Abgabe ist Zulassungsvoraussetzung (§ 44 Abs. 2 Nr. 6 GSO); Gesamtleistung (2 × Arbeit + Prüfungsgespräch) × 2/3, gerundet (§ 29 Abs. 6 GSO).' },
      { sig: ['Datum, Unterschrift Kursleitung'] }] }] };
}
/* Mehrere Bögen in einer Datei (je Person eine neue Seite mit eigenem Kopf) */
function modelMany(c, mk, title, file) {
  const list = c.students; if (!list.length) return mk(c, { id: '', name: '' }, true);
  const first = mk(c, list[0]);
  list.slice(1).forEach(s => { const m = mk(c, s); first.blocks.push({ pagebreak: true }, { head: { eyebrow: m.eyebrow, title: m.title, subtitle: m.subtitle, meta: m.meta } }, ...m.blocks); });
  first.file = fileName(file, c); return first;
}
const modelSemBwAAll = c => modelMany(c, modelSemBwA, 'Bewertung der Seminararbeit', 'Bewertungsbögen Seminararbeit');
const modelSemBwPAll = c => modelMany(c, modelSemBwP, 'Bewertung des Prüfungsgesprächs', 'Bewertungsbögen Prüfungsgespräch');

/* Bewertungsbogen bearbeiten (kind 'A' = Arbeit, 'P' = Prüfungsgespräch) – speichert sofort */
function semBwSheet(c, s, kind, done) {
  const isP = kind === 'P', key = isP ? 'bwP' : 'bwA', spk = isP ? 'gespraech' : 'arbeit';
  const b0 = () => { const o = semSt(c, s.id); o[key] = o[key] || { p: {}, n: {}, e: {} }; ['p', 'n', 'e'].forEach(k => o[key][k] = o[key][k] || {}); return o[key]; };
  const v0 = semGet(c, s.id)[key] || {}, st0 = semGet(c, s.id), sp0 = c.seminarPaper[s.id] || {};
  const K = isP ? kritP(c) : kritA(c);
  const row = x => `<div class="bwRow" data-k="${esc(x.k)}">
      <div class="bwHead"><div><b>${esc(x.l)}</b><small>${esc(x.d || '')}</small></div><span class="bwW">${isP ? ((+x.f || 1) !== 1 ? 'Faktor ' + String(x.f).replace('.', ',') : '') : (x.w ? x.w + ' %' : '')}</span></div>
      <div class="bwCtl">${isP ? '' : `<span class="seg bwSeg">${EINSCH.map(e => `<button type="button" class="${((v0.e || {})[x.k]) === e ? 'on' : ''}" data-be="${e}">${e}</button>`).join('')}</span>`}
        <label class="bwPts"><span>${isP ? 'Punkte' : 'Punkte (optional)'}</span>${ptsSelect(`data-bp="${esc(x.k)}"`, (v0.p || {})[x.k] ?? '')}</label></div>
      <textarea rows="2" data-bn="${esc(x.k)}" placeholder="Anmerkungen">${esc((v0.n || {})[x.k] || '')}</textarea></div>`;
  const body = `${isP ? `<div class="grid3">${field('Datum', `<input type="date" id="bwD" value="${esc(st0.pgAm || '')}">`)}${field('von', `<input type="time" id="bwV" value="${esc(st0.pgZeit || '')}">`)}${field('bis', `<input type="time" id="bwB" value="${esc(st0.pgBis || '')}">`)}</div>
      <label class="check"><input type="checkbox" id="bwVt" ${v0.vortrag ? 'checked' : ''}> <span>mit freiem Kurzvortrag zum Einstieg (höchstens 5 Minuten, ohne Medien)</span></label>`
    : `<label class="check"><input type="checkbox" id="bwSelbst" ${v0.selbst ? 'checked' : ''}> <span>Die Arbeit wurde eindeutig selbstständig und nur mithilfe der angegebenen Quellen verfasst</span></label>
      <p class="hint">Abgabe: ${st0.abgabe ? esc(wdate(st0.abgabe)) : 'noch nicht eingetragen'} – die Abgabe ist Zulassungsvoraussetzung (§ 44 Abs. 2 Nr. 6 GSO).</p>`}
    <div class="bwList">${K.map(row).join('')}</div>
    ${field('Gesamturteil', `<textarea id="bwU" rows="3" placeholder="Kurzes Gutachten">${esc(v0.urteil || '')}</textarea>`)}
    <div class="bwRes"><div><small>Vorschlag aus den ${isP ? 'Kompetenzen' : 'Bereichen'}</small><b id="bwVor">–</b></div><button type="button" class="mini" id="bwTake" disabled>Vorschlag übernehmen</button>
      <label class="bwFinal"><small>${isP ? 'Prüfungsgespräch' : 'Seminararbeit'} (festgesetzt)</small><input type="text" inputmode="numeric" maxlength="2" id="bwP" value="${esc(sp0[spk] ?? '')}"></label></div>
    <div class="panelBtns"><button type="button" class="mini accent" id="bwPdf">Bewertungsbogen drucken (PDF)</button><button type="button" class="mini" id="bwWord">als Word</button><button type="button" class="mini" id="bwKrit">Kriterien für diesen Kurs …</button></div>
    <p class="hint">${isP ? 'Kompetenzen nach dem Bewertungsbogen des ISB. Die Punkte je Kompetenz sind eine Ersteinschätzung; der Vorschlag ist ihr (gewichteter) Durchschnitt, gerundet.' : 'Bereiche und Gewichtung nach dem ISB-Bewertungsbogen (Anlage 5a). Wenn du je Bereich Punkte vergibst, rechnet Libretto einen gewichteten Vorschlag.'} Die Punkte setzt du fest. Alles wird sofort gespeichert.</p>`;
  const { dlg } = sheet({ title: (isP ? 'Prüfungsgespräch · ' : 'Seminararbeit · ') + s.name, wide: true, ok: '', cancel: 'Fertig', body });
  dlg.addEventListener('close', () => done && done(), { once: true });
  const q = id => dlg.querySelector(id);
  const upd = () => { const v = isP ? bwPVorschlag(c, semGet(c, s.id).bwP) : bwAVorschlag(c, semGet(c, s.id).bwA); q('#bwVor').textContent = v == null ? '–' : v + ' P. (Note ' + noteOf(v) + ')'; q('#bwTake').disabled = v == null || READONLY; q('#bwTake').dataset.v = v ?? ''; };
  const rw = fn => { if (READONLY) return; fn(b0()); save(); upd(); };
  $$('[data-bp]', dlg).forEach(el => el.onchange = () => rw(b => { if (el.value === '') delete b.p[el.dataset.bp]; else b.p[el.dataset.bp] = +el.value; }));
  $$('[data-bn]', dlg).forEach(el => el.onchange = () => rw(b => { const x = el.value.trim(); if (x) b.n[el.dataset.bn] = x; else delete b.n[el.dataset.bn]; }));
  $$('.bwSeg', dlg).forEach(sg => sg.onclick = e => { const bt = e.target.closest('[data-be]'); if (!bt) return; const k = sg.closest('.bwRow').dataset.k, on = bt.classList.contains('on');
    $$('button', sg).forEach(x => x.classList.remove('on')); if (!on) bt.classList.add('on'); rw(b => { if (on) delete b.e[k]; else b.e[k] = bt.dataset.be; }); });
  q('#bwU').onchange = () => rw(b => { const x = q('#bwU').value.trim(); if (x) b.urteil = x; else delete b.urteil; });
  if (isP) { [['#bwD', 'pgAm'], ['#bwV', 'pgZeit'], ['#bwB', 'pgBis']].forEach(([sel, k]) => q(sel).onchange = () => { if (READONLY) return; const o = semSt(c, s.id); if (q(sel).value) o[k] = q(sel).value; else delete o[k]; save(); });
    q('#bwVt').onchange = () => rw(b => { if (q('#bwVt').checked) b.vortrag = true; else delete b.vortrag; }); }
  else q('#bwSelbst').onchange = () => rw(b => { if (q('#bwSelbst').checked) b.selbst = true; else delete b.selbst; });
  const setPts = x => { if (READONLY) return; if (x !== '' && (!/^\d{1,2}$/.test(String(x)) || +x > 15)) { toast('Punkte 0–15'); q('#bwP').select(); return; }
    const o = (c.seminarPaper[s.id] = c.seminarPaper[s.id] || {}); o[spk] = x === '' ? '' : +x; q('#bwP').value = o[spk]; save(); };
  q('#bwP').onchange = () => setPts(q('#bwP').value.trim());
  q('#bwTake').onclick = () => { setPts(q('#bwTake').dataset.v); toast('Vorschlag übernommen'); };
  q('#bwPdf').onclick = () => exportModel(isP ? modelSemBwP(c, s) : modelSemBwA(c, s), 'pdf');
  q('#bwWord').onclick = () => exportModel(isP ? modelSemBwP(c, s) : modelSemBwA(c, s), 'docx');
  q('#bwKrit').onclick = () => semKritSheet(c, kind, () => { dlg.close(); semBwSheet(c, s, kind, done); });
  upd();
}
/* Kriterien eines Kurses anpassen (die Schule darf das ISB-Raster anpassen) */
function semKritSheet(c, kind, done) {
  const isP = kind === 'P'; let L = JSON.parse(JSON.stringify(isP ? kritP(c) : kritA(c)));
  const draw = d => { d.querySelector('#krRows').innerHTML = L.map((x, i) => `<div class="krRow"><input type="text" data-kl="${i}" value="${esc(x.l)}" placeholder="Kriterium"><input type="text" data-kd="${i}" value="${esc(x.d || '')}" placeholder="Beschreibung"><label><span>${isP ? 'Faktor' : 'Gewicht %'}</span><input type="number" min="0" step="${isP ? '0.5' : '5'}" data-kw="${i}" value="${esc(isP ? (x.f ?? 1) : (x.w ?? 0))}"></label><button type="button" class="iconbtn" data-kx="${i}" title="Entfernen">✕</button></div>`).join('');
    const sum = L.reduce((a, x) => a + (+x.w || 0), 0); d.querySelector('#krSum').textContent = isP ? '' : `Summe der Gewichte: ${sum} %${sum !== 100 ? ' – wird anteilig gerechnet' : ''}`;
    $$('[data-kx]', d).forEach(b => b.onclick = () => { sync(d); L.splice(+b.dataset.kx, 1); draw(d); }); };
  const sync = d => L.forEach((x, i) => { x.l = d.querySelector(`[data-kl="${i}"]`).value.trim(); x.d = d.querySelector(`[data-kd="${i}"]`).value.trim(); const w = +d.querySelector(`[data-kw="${i}"]`).value; if (isP) x.f = w > 0 ? w : 1; else x.w = w >= 0 ? w : 0; });
  sheet({ title: (isP ? 'Kompetenzen Prüfungsgespräch' : 'Bereiche Seminararbeit') + ' · ' + c.name, wide: true, body: `<p class="prose">Vorgabe ist der Bewertungsbogen des ISB. Die Schule bzw. du kannst die Kriterien anpassen – sie gelten für alle in diesem Kurs. Bereits vergebene Teilpunkte bleiben erhalten.</p>
    <div id="krRows" class="krRows"></div><p class="hint" id="krSum"></p>
    <div class="panelBtns"><button type="button" class="mini" id="krAdd">+ Kriterium</button><button type="button" class="mini" id="krDef">ISB-Vorschlag wiederherstellen</button></div>`,
    onOpen: d => { draw(d); d.querySelector('#krAdd').onclick = () => { sync(d); L.push(isP ? { k: uid(), l: '', d: '', f: 1 } : { k: uid(), l: '', d: '', w: 0 }); draw(d); };
      d.querySelector('#krDef').onclick = () => { L = JSON.parse(JSON.stringify(isP ? KRIT_P : KRIT_A)); draw(d); }; },
    onOk: d => { sync(d); L = L.filter(x => x.l); if (!L.length) { toast('Mindestens ein Kriterium'); return false; }
      const cf = semCfg(c); if (JSON.stringify(L) === JSON.stringify(isP ? KRIT_P : KRIT_A)) delete cf[isP ? 'kritP' : 'kritA']; else cf[isP ? 'kritP' : 'kritA'] = L; save(); done && done(); } });
}
/* Terminliste der Prüfungsgespräche: je Person Tag und Uhrzeit, automatisch verteilen, ausdrucken */
const addMin = (hm, m) => { const [h, mi] = hm.split(':').map(Number), t = h * 60 + mi + m; return String(Math.floor(t / 60) % 24).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };
function semPgSheet(c) {
  const cf = semCfg(c);
  const rowsHTML = () => c.students.map(s => { const st = semGet(c, s.id); return `<tr><td class="l">${esc(s.name)}</td><td><input type="date" data-pd="${s.id}" value="${esc(st.pgAm || '')}"></td><td><input type="time" data-pz="${s.id}" value="${esc(st.pgZeit || '')}"></td><td><input type="time" data-pb="${s.id}" value="${esc(st.pgBis || '')}"></td><td class="l pgTh">${esc(st.kurz || st.thema || '')}</td></tr>`; }).join('');
  const { dlg } = sheet({ title: 'Prüfungsgespräche · ' + c.name, wide: true, ok: '', cancel: 'Fertig', body: `
    <p class="prose">Tag und Uhrzeit je Person. Das Prüfungsgespräch (§ 24 Abs. 2 GSO) dauert laut ISB-Übersicht insgesamt ca. 25 Minuten.</p>
    <div class="pgAuto"><b>Automatisch verteilen</b>${field('ab', `<input type="date" id="pgD" value="${esc(cf.pgStart || todayISO())}">`)}${field('Beginn', `<input type="time" id="pgZ" value="${esc(cf.pgTime || '08:00')}">`)}${field('Dauer (Min.)', `<input type="number" id="pgL" min="10" max="25" value="${esc(cf.pgLen || 25)}">`)}${field('Pause (Min.)', `<input type="number" id="pgP" min="0" max="60" value="${esc(cf.pgPause ?? 5)}">`)}${field('je Tag höchstens', `<input type="number" id="pgN" min="1" max="20" value="${esc(cf.pgPerDay || 4)}">`)}<button type="button" class="mini" id="pgGo">Freie Plätze füllen</button></div>
    <div class="gridWrap"><table class="grid pgTbl"><thead><tr><th class="l">Name</th><th>Tag</th><th>von</th><th>bis</th><th class="l">Thema</th></tr></thead><tbody id="pgRows">${rowsHTML()}</tbody></table></div>
    <label class="check"><input type="checkbox" id="pgTh" checked> <span>Themen mitdrucken (für einen Aushang ggf. weglassen)</span></label>
    <div class="panelBtns"><button type="button" class="mini accent" id="pgPdf">Terminliste drucken (PDF)</button><button type="button" class="mini" id="pgWord">als Word</button></div>
    <p class="hint">„Freie Plätze füllen“ vergibt Termine nur an Personen ohne Termin – in der Reihenfolge der Liste, nur an Schultagen. Alles wird sofort gespeichert.</p>` });
  const q = id => dlg.querySelector(id);
  const bindRows = () => { [['pd', 'pgAm'], ['pz', 'pgZeit'], ['pb', 'pgBis']].forEach(([a, k]) => $$(`[data-${a}]`, dlg).forEach(el => el.onchange = () => { if (READONLY) return; const o = semSt(c, el.dataset[a]); if (el.value) o[k] = el.value; else delete o[k];
    if (k === 'pgZeit' && el.value && !o.pgBis) { o.pgBis = addMin(el.value, +q('#pgL').value || 25); dlg.querySelector(`[data-pb="${el.dataset[a]}"]`).value = o.pgBis; } save(); })); };
  bindRows();
  q('#pgGo').onclick = () => { if (READONLY) return; const len = Math.min(25, Math.max(10, +q('#pgL').value || 25)), pause = Math.max(0, +q('#pgP').value || 0), per = Math.max(1, +q('#pgN').value || 4), z0 = q('#pgZ').value || '08:00';
    Object.assign(cf, { pgStart: q('#pgD').value, pgTime: z0, pgLen: len, pgPause: pause, pgPerDay: per });
    let d = new Date((q('#pgD').value || todayISO()) + 'T12:00'); const free = iso => { const wd = new Date(iso + 'T12:00').getDay(); return wd === 0 || wd === 6 || isFreeDay(iso); };
    const used = iso => c.students.filter(s => semGet(c, s.id).pgAm === iso).length;
    let n = 0;
    c.students.filter(s => !semGet(c, s.id).pgAm).forEach(s => { let iso = Cal.iso(d); let guard = 0; while ((free(iso) || used(iso) >= per) && guard++ < 400) { d = Cal.add(d, 1); iso = Cal.iso(d); }
      const k = used(iso), from = addMin(z0, k * (len + pause)); const o = semSt(c, s.id); o.pgAm = iso; o.pgZeit = from; o.pgBis = addMin(from, len); n++; });
    save(); q('#pgRows').innerHTML = rowsHTML(); bindRows(); toast(n ? `${n} Termine vergeben` : 'Alle haben schon einen Termin'); };
  q('#pgPdf').onclick = () => exportModel(modelSemPgPlan(c, q('#pgTh').checked), 'pdf');
  q('#pgWord').onclick = () => exportModel(modelSemPgPlan(c, q('#pgTh').checked), 'docx');
}
function modelSemPgPlan(c, withTheme = true) {
  const list = c.students.map(s => ({ s, st: semGet(c, s.id) })).sort((a, b) => ((a.st.pgAm || '9') + (a.st.pgZeit || '')).localeCompare((b.st.pgAm || '9') + (b.st.pgZeit || '')));
  const rows = []; let day = null;
  list.forEach(({ s, st }) => { const d = st.pgAm || ''; if (d !== day) { day = d; rows.push({ group: d ? wdate(d).replace(/^(\w\w), /, (m0, w) => ({ Mo: 'Montag', Di: 'Dienstag', Mi: 'Mittwoch', Do: 'Donnerstag', Fr: 'Freitag', Sa: 'Samstag', So: 'Sonntag' })[w] + ', ') : 'noch ohne Termin' }); }
    const z = st.pgZeit ? st.pgZeit + (st.pgBis ? '–' + st.pgBis : '') : '';
    rows.push(withTheme ? [z, s.name, st.kurz || st.thema || ''] : [z, s.name]); });
  return { eyebrow: 'W-Seminar · Abitur ' + semAbi(c), title: 'Prüfungsgespräche', subtitle: 'Terminliste · ' + c.name, file: fileName('Terminliste Prüfungsgespräche', c), meta: semMeta(c),
    blocks: [{ table: { head: withTheme ? ['Uhrzeit', 'Name', 'Thema der Seminararbeit'] : ['Uhrzeit', 'Name'], rows, align: withTheme ? ['c', 'l', 'l'] : ['c', 'l'], widths: withTheme ? [13, 27, 60] : [20, 80] } },
      { note: 'Das Prüfungsgespräch (§ 24 Abs. 2 GSO) dauert laut ISB-Übersicht insgesamt ca. 25 Minuten: optional ein Kurzvortrag von höchstens 5 Minuten, dann das Gespräch (ca. 20–25 Minuten).' }] };
}
/* Leitfragen fürs Beratungsgespräch (Auswahl nach der ISB-Übersicht „Beratungsgespräche“) */
const BERAT_Q = {
  '12/1': ['Bezug des Themas zum Rahmenthema? Umfang realistisch, ggf. eingrenzen', 'Echte Forschungsfrage mit eigenständiger Untersuchung?', 'Wo recherchieren, Forschungsstand?', 'Nächste Schritte und verbindliche Zwischenziele', 'Kleine Leistungsnachweise: Selbsteinschätzung und Rückmeldung', 'KI: welche Anwendungen wofür – und warum?'],
  '12/2': ['Zwischenergebnisse, z. B. Exposé: Ziele erreicht?', 'Gliederung schlüssig, formale Vorgaben beachtet?', 'Literatur- und Materialstand, Methode passend zur Fragestellung?', 'Zeitplan realistisch? Was ist schon geschafft?', 'KI: Nutzung transparent dokumentiert?'],
  '13/1': ['Formale Vorgaben, welche Teile müssen noch überarbeitet werden?', 'Aufbau stimmig, Bewertungskriterien bekannt?', 'Zeitpuffer für Ausdruck, Unterschriften, Technik', 'Anforderungen an das Prüfungsgespräch bekannt?', 'KI-Nutzung reflektiert darstellbar?'] };

/* Zielvereinbarung des letzten früheren Gesprächs (Ziel, sonst „vereinbart“) */
function semPrevGoal(c, s, id, date) {
  const ts = (semGet(c, s.id).termine || []).filter(x => x.id !== id && (x.ziel || x.vereinbart) && (!date || (x.date || '') <= date)).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return ts[0] ? { date: ts[0].date, text: ts[0].ziel || ts[0].vereinbart } : null;
}
/* ---------- Betreuungstermin ---------- */
function semTerminSheet(c, s, t0, done) {
  const isNew = !t0, cf = semCfg(c);
  const t = t0 ? JSON.parse(JSON.stringify(t0)) : { id: uid(), date: todayISO(), term: '', kind: 'beratung', files: [] };
  if (!t.term) t.term = ['12/1', '12/2', '13/1'].includes(R.semTermAt(cf.start, t.date, semMid())) ? R.semTermAt(cf.start, t.date, semMid()) : '13/1';
  t.files = t.files || [];
  const added = [];   /* in diesem Fenster angehängt – bei „Abbrechen“ wieder weg */
  let saved = false, termTouched = !isNew;
  const body = `<div class="grid3">${field('Datum', `<input type="date" id="tmD" value="${esc(t.date || '')}">`)}${field('Halbjahr', `<select id="tmT">${['12/1', '12/2', '13/1'].map(x => `<option ${t.term === x ? 'selected' : ''}>${x}</option>`).join('')}</select>`)}${field('Art', `<select id="tmK">${SEM_KINDS.map(([k, l]) => `<option value="${k}" ${t.kind === k ? 'selected' : ''}>${l}</option>`).join('')}</select>`)}</div>
    <div id="tmBer" ${t.kind === 'beratung' ? '' : 'hidden'}>
      <div class="tmPrev" id="tmPrev"></div>
      <details class="tmQ"><summary>Leitfragen fürs Gespräch (ISB, Auswahl)</summary><div id="tmQ"></div></details>
      ${field('Bisher begonnene / abgeschlossene Arbeiten (Schülerin / Schüler)', `<textarea id="tmE" rows="3">${esc(t.erledigt || '')}</textarea>`)}
      ${field('Aufgetretene Schwierigkeiten / Fragen', `<textarea id="tmF2" rows="2">${esc(t.fragen || '')}</textarea>`)}</div>
    ${field(t.kind === 'beratung' ? 'Rückmeldung und Vorschläge der Lehrkraft' : 'Besprochen (Stand der Arbeit, Fragen, Rückmeldung)', `<textarea id="tmI" rows="4">${esc(t.inhalt || '')}</textarea>`)}
    ${field(t.kind === 'beratung' ? 'Nächste Schritte mit Zeitrahmen' : 'Vereinbart / nächste Schritte', `<textarea id="tmV" rows="3">${esc(t.vereinbart || '')}</textarea>`)}
    <div id="tmBer2" ${t.kind === 'beratung' ? '' : 'hidden'}>
      ${field('Zielvereinbarung inkl. zeitlichem Rahmen', `<textarea id="tmZ" rows="2">${esc(t.ziel || '')}</textarea>`)}
      ${field('Einsatz von KI (Anwendungen, Zweck, Reflexion)', `<textarea id="tmKI" rows="2">${esc(t.ki || '')}</textarea>`)}</div>
    <div class="grid3">${field('Nächster Termin', `<input type="date" id="tmN" value="${esc(t.next || '')}">`)}<label class="check span2" style="margin-top:22px"><input type="checkbox" id="tmS" ${t.signed ? 'checked' : ''}> <span>Protokoll ist von der Schülerin / dem Schüler unterschrieben</span></label></div>
    <div class="field"><span>Dateien zu diesem Termin (z. B. Exposé, Gliederung, Literaturliste, Entwurf)</span><div id="tmF">${attBoxHTML(t.files, 'Dateien')}</div></div>
    <div class="panelBtns"><button type="button" class="mini" id="tmPdf">Protokoll drucken (PDF)</button><button type="button" class="mini" id="tmWord">als Word</button></div>
    ${isNew ? '' : '<button type="button" class="danger" id="tmDel">Termin löschen</button>'}`;
  const read = d => { t.date = d.querySelector('#tmD').value; t.term = d.querySelector('#tmT').value; t.kind = d.querySelector('#tmK').value; t.inhalt = d.querySelector('#tmI').value.trim(); t.vereinbart = d.querySelector('#tmV').value.trim(); t.next = d.querySelector('#tmN').value; t.signed = d.querySelector('#tmS').checked;
    t.erledigt = d.querySelector('#tmE').value.trim(); t.fragen = d.querySelector('#tmF2').value.trim(); t.ziel = d.querySelector('#tmZ').value.trim(); t.ki = d.querySelector('#tmKI').value.trim();
    ['inhalt', 'vereinbart', 'next', 'erledigt', 'fragen', 'ziel', 'ki'].forEach(k => { if (!t[k]) delete t[k]; }); if (!t.signed) delete t.signed; };
  const { dlg, close } = sheet({ title: (isNew ? 'Neuer Betreuungstermin' : 'Betreuungstermin') + ' · ' + s.name, wide: true, body, onOk: d => {
    read(d); if (!t.date) { toast('Bitte ein Datum eintragen'); return false; }
    const o = semSt(c, s.id); o.termine = (o.termine || []).filter(x => x.id !== t.id).concat([t]).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    trashAtt([...(t0 ? t0.files || [] : []), ...added].filter(f => !t.files.some(x => x.id === f.id)));
    saved = true; save(); done && done();
  } });
  dlg.addEventListener('close', () => { if (!saved && added.length) { trashAtt(added); save(); } }, { once: true });
  const q = id => dlg.querySelector(id);
  q('#tmD').addEventListener('change', () => { if (!termTouched) { const x = R.semTermAt(cf.start, q('#tmD').value, semMid()); q('#tmT').value = ['12/1', '12/2', '13/1'].includes(x) ? x : '13/1'; } });
  q('#tmT').addEventListener('change', () => { termTouched = true; berQ(); });
  /* Beratungsgespräch: Zielvereinbarung des letzten Gesprächs zeigen, Leitfragen zum Halbjahr */
  const berQ = () => { q('#tmQ').innerHTML = `<ul>${(BERAT_Q[q('#tmT').value] || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
    const pv = semPrevGoal(c, s, t.id, q('#tmD').value); q('#tmPrev').innerHTML = pv ? `<small>Zielvereinbarung aus dem Gespräch vom ${esc(fdate(pv.date))}</small><div>${esc(pv.text)}</div>` : ''; q('#tmPrev').hidden = !pv; };
  const kindUi = () => { const ber = q('#tmK').value === 'beratung'; q('#tmBer').hidden = !ber; q('#tmBer2').hidden = !ber;
    q('#tmI').closest('.field').querySelector('span').textContent = ber ? 'Rückmeldung und Vorschläge der Lehrkraft' : 'Besprochen (Stand der Arbeit, Fragen, Rückmeldung)';
    q('#tmV').closest('.field').querySelector('span').textContent = ber ? 'Nächste Schritte mit Zeitrahmen' : 'Vereinbart / nächste Schritte'; };
  q('#tmK').addEventListener('change', kindUi); q('#tmD').addEventListener('change', berQ); berQ();
  bindAtt(q('#tmF'), () => t.files, list => { list.filter(f => !t.files.some(x => x.id === f.id)).forEach(f => added.push(f)); t.files = list; });
  q('#tmPdf').onclick = () => { read(dlg); exportModel(modelSemProtocol(c, s, t), 'pdf'); };
  q('#tmWord').onclick = () => { read(dlg); exportModel(modelSemProtocol(c, s, t), 'docx'); };
  const del = q('#tmDel'); if (del) del.onclick = async () => {
    if (await ask(`Termin vom ${esc(fdate(t0.date))} löschen? Er lässt sich 60 Tage lang unter „Sicherung“ wiederherstellen.`, 'Löschen', true)) {
      toTrash('termin', `Betreuungstermin ${fdate(t0.date)} · ${s.name} · ${c.name}`, t0, { courseId: c.id, sid: s.id });
      const o = semSt(c, s.id); o.termine = (o.termine || []).filter(x => x.id !== t0.id); trashAtt(t0.files); trashAtt(added); saved = true; save(); close(); done && done(); }
  };
  if (isNew) q('#tmI').focus();
}

/* ---------- Ausdrucke W-Seminar ---------- */
function semMeta(c) { const cf = semCfg(c); return [['Kurs', `${c.name} · ${c.subject}`], ...(isWSemName(c.subject) && cf.leit ? [['Leitfach', cf.leit]] : []), ...(cf.rahmen ? [['Rahmenthema', cf.rahmen]] : []), ['Abiturjahrgang', String(semAbi(c))], ...(D.settings.teacher ? [['Kursleitung', D.settings.teacher]] : [])]; }
const filesTxt = list => (list || []).map(f => f.name).join('\n');
function modelSemProtocol(c, s, t) {
  const st = semGet(c, s.id);
  if (t.kind === 'beratung') { const pv = semPrevGoal(c, s, t.id, t.date);
    return { eyebrow: 'W-Seminar · Abitur ' + semAbi(c), title: 'Beratungsgespräch', subtitle: `${s.name} · ${wdate(t.date)}`, file: fileSafe(`${t.date || todayISO()} Beratungsgespräch ${s.name} ${c.name}`), meta: semMeta(c),
      blocks: [{ kv: [['Schülerin / Schüler', s.name + (isMixed(c.students) && s.cls ? ' (' + s.cls + ')' : '')], ['Thema der Seminararbeit', st.thema || '–'], ['Datum · Ausbildungsabschnitt', `${wdate(t.date)} · ${t.term || ''}`]] },
        ...(pv ? [{ h: 'Zielvereinbarung aus dem letzten Gespräch (' + fdate(pv.date) + ')' }, { p: pv.text }] : []),
        { h: 'Stand der Arbeit' }, { kv: [['Bisher begonnene / abgeschlossene Arbeiten', t.erledigt || ''], ['Schwierigkeiten / Fragen', t.fragen || ''], ['Rückmeldung und Vorschläge der Lehrkraft', t.inhalt || '']] },
        { h: 'Vereinbarungen' }, { kv: [['Nächste Schritte mit Zeitrahmen', t.vereinbart || ''], ['Zielvereinbarung', t.ziel || ''], ...(t.ki ? [['Einsatz von KI', t.ki]] : []), ['Nächster Termin', t.next ? wdate(t.next) : ''], ['Vorgelegte Unterlagen', filesTxt(t.files) || '–']] },
        { sig: ['Datum, Unterschrift Schülerin / Schüler', 'Datum, Unterschrift Kursleitung'] }] }; }
  return { eyebrow: 'W-Seminar · Abitur ' + semAbi(c), title: 'Betreuungsprotokoll W-Seminar', subtitle: `${s.name} · ${wdate(t.date)}`, file: fileSafe(`${t.date || todayISO()} Betreuungsprotokoll ${s.name} ${c.name}`), meta: semMeta(c),
    blocks: [{ kv: [['Schülerin / Schüler', s.name + (isMixed(c.students) && s.cls ? ' (' + s.cls + ')' : '')], ['Thema der Seminararbeit', st.thema || '–'], ['Datum', wdate(t.date)], ['Ausbildungsabschnitt', t.term || ''], ['Art', semKind(t.kind)],
      ['Besprochen', t.inhalt || ''], ['Vereinbart / nächste Schritte', t.vereinbart || ''], ['Nächster Termin', t.next ? wdate(t.next) : ''], ['Vorgelegte Unterlagen', filesTxt(t.files) || '–']] },
      { sig: ['Datum, Unterschrift Schülerin / Schüler', 'Datum, Unterschrift Kursleitung'] }] };
}
function modelSemDossier(c, list) {
  const blocks = [];
  list.forEach((s, i) => {
    const st = semGet(c, s.id), r = semStatusOf(c, s.id), sp = c.seminarPaper[s.id] || {};
    if (i) blocks.push({ pagebreak: true }, { head: { title: s.name, subtitle: `Betreuungsdokumentation W-Seminar · ${c.name}`, meta: semMeta(c) } });
    const due = st.verl || semCfg(c).deadline;
    blocks.push({ kv: [['Thema der Seminararbeit', st.thema || '–'], ['Thema festgelegt am', st.themaAm ? fdate(st.themaAm) : '–'],
      ['Abgabe', (st.abgabe ? `abgegeben am ${fdate(st.abgabe)}${st.abgabeZeit ? ', ' + st.abgabeZeit + ' Uhr' : ''}` : 'noch nicht abgegeben') + (due ? ` · Frist ${fdate(due)}${st.verl ? ' (verlängert' + (st.verlGrund ? ': ' + st.verlGrund : '') + ')' : ''}` : '')],
      ...(st.kurz ? [['Kurztitel (Abiturzeugnis)', st.kurz]] : []), ['Erklärung zur selbstständigen Anfertigung', st.erkl ? 'liegt vor' : '–'], ...(st.expose ? [['Exposé / Gliederung', 'besprochen']] : []), ...(st.kiDoc ? [['Dokumentation der KI-Nutzung', 'abgegeben']] : []), ...(st.wett ? [['Ersatz durch Wettbewerbsbeitrag', st.wettText || 'ja']] : []), ...((st.files || []).length ? [['Dateien der Arbeit', filesTxt(st.files)]] : [])] });
    const ts = (st.termine || []).slice().sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    blocks.push({ h: `Betreuungstermine (${ts.length})` });
    if (!ts.length) blocks.push({ p: 'Noch keine Termine dokumentiert.' });
    ts.forEach(t => blocks.push({ kv: [[`${fdate(t.date)} · ${t.term || ''}`, semKind(t.kind) + (t.signed ? ' · Protokoll unterschrieben' : '')], ...(t.erledigt ? [['Bisher erledigt', t.erledigt]] : []), ...(t.fragen ? [['Schwierigkeiten / Fragen', t.fragen]] : []), ...(t.inhalt ? [[t.kind === 'beratung' ? 'Rückmeldung' : 'Besprochen', t.inhalt]] : []), ...(t.vereinbart ? [['Vereinbart', t.vereinbart]] : []), ...(t.ziel ? [['Zielvereinbarung', t.ziel]] : []), ...(t.ki ? [['Einsatz von KI', t.ki]] : []), ...(t.next ? [['Nächster Termin', fdate(t.next)]] : []), ...((t.files || []).length ? [['Unterlagen', filesTxt(t.files)]] : [])] }));
    const tail = []; tail.push({ h: 'Leistungen' });
    const hj = x => { const q = R.computeTerm(c, s.id, x).points; return q == null ? '–' : String(q); };
    tail.push({ table: { head: ['Halbjahr 12/1', 'Halbjahr 12/2', 'Seminararbeit', 'Prüfungsgespräch', 'Gesamtleistung (max. 30)'], rows: [[hj('12/1'), hj('12/2'), sp.arbeit === '' || sp.arbeit == null ? '–' : String(sp.arbeit), sp.gespraech === '' || sp.gespraech == null ? '–' : String(sp.gespraech), r.gesamt == null ? '–' : String(r.gesamt)]], big: [4] } });
    if (st.pgAm) tail.push({ p: `Prüfungsgespräch am ${fdate(st.pgAm)}${st.pgZeit ? ', ' + st.pgZeit + ' Uhr' : ''}.` });
    if (r.flags.length) tail.push({ p: 'Hinweise: ' + r.flags.map(f => f.text).join(' ') });
    tail.push({ sig: ['Datum, Unterschrift Kursleitung'] }); blocks.push({ group: tail });
  });
  const one = list.length === 1 ? list[0] : null;
  return { title: one ? one.name : `Betreuungsdokumentation ${c.name}`, subtitle: one ? `Betreuungsdokumentation W-Seminar · ${c.name}` : 'W-Seminar', file: one ? fileSafe(`${todayISO()} Betreuungsdokumentation ${one.name} ${c.name}`) : fileName('Betreuungsdokumentation', c), meta: semMeta(c),
    blocks };
}
function modelSemDossierAll(c) { const m = modelSemDossier(c, c.students); if (c.students.length) { m.title = c.students[0].name; m.subtitle = `Betreuungsdokumentation W-Seminar · ${c.name}`; } return m; }
function modelSemOverview(c) {
  const cf = semCfg(c);
  const rows = groupedRows(c, (s, i) => { const st = semGet(c, s.id); const k = x => String((st.termine || []).filter(y => y.term === x).length || '–');
    return [String(i + 1), s.name, st.thema || '–', st.themaAm ? fdate(st.themaAm) : '', k('12/1'), k('12/2'), k('13/1'), st.abgabe ? fdate(st.abgabe) : '']; });
  return { title: `Seminararbeiten ${c.name}`, subtitle: `Themen, Betreuung und Abgabe · Abitur ${semAbi(c)}`, file: fileName('Übersicht Seminararbeiten', c), meta: semMeta(c), landscape: true,
    blocks: [{ table: { head: ['Nr.', 'Name', 'Thema', 'festgelegt', 'Termine 12/1', '12/2', '13/1', 'abgegeben'], rows, align: ['c', 'l', 'l'], widths: [4, 18, 42, 9, 7, 5, 5, 10] } },
      { p: `Abgabe laut Kurs: ${cf.deadline ? wdate(cf.deadline) + (cf.deadlineTime ? ', ' + cf.deadlineTime + ' Uhr' : '') : 'noch nicht festgelegt'} (§ 24 GSO: spätestens am zweiten Unterrichtstag im November der Jahrgangsstufe 13). Ohne Noten.` }] };
}
function modelSemResults(c) {
  const rows = groupedRows(c, (s, i) => { const r = semStatusOf(c, s.id), sp = c.seminarPaper[s.id] || {}, st = semGet(c, s.id); const hj = x => { const q = R.computeTerm(c, s.id, x).points; return q == null ? '–' : String(q); };
    const note = [...['12/1', '12/2'].filter(x => R.computeTerm(c, s.id, x).zero).map(x => x + ': 0 Punkte'), r.arbeit === 0 || r.gespraech === 0 ? 'Arbeit/Gespräch 0 Punkte' : '', r.gesamt != null && r.gesamt < 9 ? 'unter 9 Punkten' : '', !st.abgabe && r.flags.some(f => f.key === 'late') ? 'nicht abgegeben' : ''].filter(Boolean).join(', ');
    return [String(i + 1), s.name, hj('12/1'), hj('12/2'), sp.arbeit === '' || sp.arbeit == null ? '–' : String(sp.arbeit), sp.gespraech === '' || sp.gespraech == null ? '–' : String(sp.gespraech), r.gesamt == null ? '–' : String(r.gesamt), note]; });
  return { title: `Ergebnisse W-Seminar ${c.name}`, subtitle: `Halbjahresleistungen und Seminararbeit · Abitur ${semAbi(c)}`, file: fileName('Ergebnisse W-Seminar', c), meta: semMeta(c),
    blocks: [{ table: { head: ['Nr.', 'Name', '12/1', '12/2', 'Arbeit', 'Prüfungs­gespräch', 'Gesamtleistung (max. 30)', 'Hinweis'], rows, align: ['c', 'l', 'c', 'c', 'c', 'c', 'c', 'l'], big: [6], widths: [4, 24, 7, 7, 7, 10, 12, 20] } },
      { p: 'Halbjahresleistung 12/1 und 12/2: Durchschnitt der kleinen Leistungsnachweise, gerundet, keine Aufrundung auf 1 Punkt (§ 29 Abs. 2 GSO). Gesamtleistung der Seminararbeit: (2 × Arbeit + Prüfungsgespräch) × 2/3, gerundet (§ 29 Abs. 6 GSO). Zulassung zur Abiturprüfung u. a. nur, wenn die Arbeit abgegeben ist, weder Arbeit noch Prüfungsgespräch 0 Punkte haben und die Gesamtleistung mindestens 9 Punkte beträgt (§ 44 Abs. 2 GSO).' },
      { sig: ['Datum, Unterschrift Kursleitung'] }] };
}

/* ======================================================================
   Drucken & Export
   ====================================================================== */
/* ---------- Übertrag-Übersicht ---------- */
function transferSheet(c) {
  const up = upper(c);
  const open = new Set();
  const numbered = () => { let n = 0; return groupsOf(c).flatMap(g => g.students.map(st => ({ n: ++n, s: st, g: g.label }))); };
  const stateText = (st, n) => st === 'done' ? 'alles übertragen' : st === 'open' ? 'noch nichts übertragen' : st === 'part' ? `${n} offen oder geändert` : 'keine Noten';
  const mk = st => st === 'done' ? '<span class="xmk ok">✓</span>' : st === 'part' ? '<span class="xmk dot">●</span>' : '<span class="xmk"></span>';
  const stLabel = x => x === 'done' ? 'übertragen' : x === 'changed' ? 'geändert' : 'noch offen';
  const items = a => numbered().map(({ n, s, g }) => ({ n, s, g, r: a.results && a.results[s.id], key: xKeyA(a, s.id) })).filter(x => xSig(c, x.r));
  const body = () => {
    const as = visibleAssessments(c).filter(a => xAssess(c, a));
    const ents = (c.entries || []).filter(e => R.inScope(e, entScope(c)) && xSig(c, e)).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const nm = id => (c.students.find(x => x.id === id) || {}).name || '';
    const rowsA = as.map(a => {
      const its = items(a), st = xAssess(c, a), todo = its.filter(x => xState(c, x.key, x.r) !== 'done').length;
      const any = its.some(x => xState(c, x.key, x.r) !== 'open');
      return `<details class="xrow" data-d="${a.id}" ${open.has(a.id) ? 'open' : ''}><summary>${mk(st)}<b>${esc(a.short || R.TYPES[a.type].short)}${a.date ? ' ' + sdate(a.date) : ''}</b><span class="xt">${esc(a.title || R.TYPES[a.type].label)}</span><span class="hint">${stateText(st, todo)}</span></summary>
        <div class="xbtns">${st !== 'done' ? `<button type="button" class="mini accent" data-all="${a.id}">Alle als übertragen markieren</button>` : ''}${any ? `<button type="button" class="mini" data-none="${a.id}">Übertrag zurücknehmen</button>` : ''}</div>
        <div class="xlist">${its.map((x, i) => { const xs = xState(c, x.key, x.r); return `${x.g && (!i || its[i - 1].g !== x.g) ? `<div class="xgrp">${esc(x.g)}</div>` : ''}<label class="xi ${xs}"><input type="checkbox" data-k="${x.key}" ${xs === 'done' ? 'checked' : ''}><span class="nr">${x.n}</span><span class="xn">${esc(x.s.name)}</span><b>${esc(xSig(c, x.r))}</b><span class="hint">${stLabel(xs)}</span></label>`; }).join('')}</div></details>`;
    }).join('');
    const stE = ents.length ? (ents.every(e => xState(c, xKeyE(e), e) === 'done') ? 'done' : ents.every(e => xState(c, xKeyE(e), e) === 'open') ? 'open' : 'part') : null;
    const rowsE = ents.length ? `<details class="xrow" data-d="ent" ${open.has('ent') ? 'open' : ''}><summary>${mk(stE)}<b>Einzelnoten</b><span class="xt">z. B. Unterrichtsbeiträge</span><span class="hint">${stateText(stE, ents.filter(e => xState(c, xKeyE(e), e) !== 'done').length)}</span></summary>
        <div class="xbtns">${stE !== 'done' ? '<button type="button" class="mini accent" data-all="ent">Alle als übertragen markieren</button>' : ''}${ents.some(e => xState(c, xKeyE(e), e) !== 'open') ? '<button type="button" class="mini" data-none="ent">Übertrag zurücknehmen</button>' : ''}</div>
        <div class="xlist">${ents.map(e => { const xs = xState(c, xKeyE(e), e); return `<label class="xi ${xs}"><input type="checkbox" data-k="${xKeyE(e)}" ${xs === 'done' ? 'checked' : ''}><span class="xn">${esc(nm(e.sid))}</span><span class="hint">${esc(R.TYPES[e.type].short)}${e.date ? ' ' + sdate(e.date) : ''}</span><b>${esc(xSig(c, e))}</b><span class="hint">${stLabel(xs)}</span></label>`; }).join('')}</div></details>` : '';
    return `<p class="hint">Hier merkst du dir, was du schon ins Notenprogramm der Schule (z. B. Infoportal) übertragen hast. <b>✓</b> alles übertragen · <b style="color:var(--orange)">●</b> nach dem Übertrag geändert oder ergänzt (Nachtrag nötig) · ohne Zeichen: noch nicht übertragen. Libretto schickt nichts weg – es ist nur deine Merkhilfe.</p>
      ${rowsA || rowsE ? `<div class="xtop"><button type="button" class="mini accent" data-allall>Alles Angezeigte als übertragen markieren</button><span class="hint">${esc(scopeLabel(c))}</span></div>${rowsA}${rowsE}` : '<div class="empty" style="min-height:120px"><div><strong>Noch keine Noten</strong><p>Sobald Noten eingetragen sind, siehst du hier, was noch zu übertragen ist.</p></div></div>'}`;
  };
  const { dlg } = sheet({ title: 'Übertrag', ok: '', cancel: 'Fertig', wide: true, body: body() });
  const root = dlg.querySelector('.sheetbody');
  const refresh = () => { root.querySelectorAll('details[data-d]').forEach(d => d.open ? open.add(d.dataset.d) : open.delete(d.dataset.d)); root.innerHTML = body(); save(); renderGrades(); };
  const asById = id => c.assessments.find(a => a.id === id);
  const markAll = id => { if (id === 'ent') (c.entries || []).filter(e => R.inScope(e, entScope(c))).forEach(e => xMark(c, xKeyE(e), e)); else { const a = asById(id); if (a) items(a).forEach(x => xMark(c, x.key, x.r)); } };
  const clearAll = id => { const keys = id === 'ent' ? (c.entries || []).filter(e => R.inScope(e, entScope(c))).map(xKeyE) : items(asById(id) || { results: {} }).map(x => x.key); keys.forEach(k => delete c.xfer[k]); };
  root.addEventListener('click', e => {
    if (READONLY) return;
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.all) { markAll(b.dataset.all); refresh(); }
    else if (b.dataset.none) { clearAll(b.dataset.none); refresh(); }
    else if ('allall' in b.dataset) { visibleAssessments(c).forEach(a => markAll(a.id)); markAll('ent'); refresh(); }
  });
  root.addEventListener('change', e => {
    const i = e.target.closest('input[data-k]'); if (!i) return;
    if (READONLY) { i.checked = !i.checked; return; }
    const k = i.dataset.k;
    if (i.checked) { let r = null; if (k.startsWith('e|')) r = (c.entries || []).find(x => xKeyE(x) === k); else { const [aid, sid] = k.split('|'); const a = asById(aid); r = a && a.results && a.results[sid]; } xMark(c, k, r); }
    else delete c.xfer[k];
    refresh();
  });
}

function scopeLabel(c) { if (isSemTab(c)) return 'W-Seminar · Seminararbeit'; if (upper(c)) { const t = scopeOf(c).term; return t ? 'Halbjahr ' + t : c.seminar ? 'W-Seminar · Übersicht' : 'Qualifikationsphase ' + c.grade; } return UI.scope === 'half' ? `Stand Zwischenzeugnis${D.settings.half1End ? ' (bis ' + fdate(D.settings.half1End) + ')' : ''}` : UI.scope === 'until' ? 'Stand bis ' + fdate(UI.until || todayISO()) : 'Schuljahr ' + D.settings.year; }
function baseMeta(c) { return [['Kurs', `${c.name} · ${c.seminar || c.psem ? (c.seminar ? 'W-Seminar' : 'P-Seminar') + ', Leitfach ' : ''}${c.subject}`], [upper(c) ? 'Q-Phase' : 'Jahrgangsstufe', c.seminar ? `W-Seminar, Abitur ${semAbi(c)}` : String(c.grade)], ['Schuljahr', D.settings.year], ...(D.settings.teacher ? [['Lehrkraft', D.settings.teacher]] : [])]; }
/* Kopfdaten eines Schülerblatts: bei gemischten Kursen (8A+8B) steht die tatsächliche Klasse der Person extra */
function studMeta(c, s) { const m = baseMeta(c); if (isMixed(c.students) && s.cls) m.splice(1, 0, ['Klasse', s.cls]); return m; }
const ct = (c, a, s, up) => R.cellText(a.results && a.results[s.id], up) || (isAway(c, s.id, a.date) ? 'abw.' : '');
function lnName(a) { return (a.short || R.TYPES[a.type].short) + (a.date ? ' ' + sdate(a.date) : ''); }
function entTxt(c, s) { return entriesOf(c, s.id).map(e => R.cellText(e, upper(c))).join(' ') || ''; }
/* EIN Ergebnis für Ansicht und alle Ausgaben (Übertragsliste, Schülerblatt, Notenübersicht, CSV): „ohne Note“ und „Gast ohne Wertung“ gehen vor jeder Rechnung.
   kind: 'ng' | 'guest' | 'ov' | 'calc'; v = Eintrag (Note bzw. Punkte oder „–“); sub = kurze Erläuterung */
function finalOf(c, s, term) {
  const up = upper(c), ng = c.noGrade && c.noGrade[s.id];
  if (ng) return { kind: 'ng', v: '–', label: 'ohne Note', sub: 'ohne Note' + (ng.reason ? ': ' + ng.reason : '') + (up ? '' : ' – ggf. Bemerkung (§ 39 Abs. 6 GSO)') };
  if (!R.counted(s)) return { kind: 'guest', v: '–', label: 'Gast', sub: 'Gast – Noten zählen nicht (nur dokumentiert)' };
  if (up) { const r = R.computeTerm(c, s.id, term); return { kind: 'calc', v: r.points == null ? '–' : String(r.points), points: r.points, r, label: '', sub: '' }; }
  const r = R.computeLower(c, s.id, scopeOf(c)), ov = ovOf(c, s.id);
  if (ov) return { kind: 'ov', v: String(ov.grade), r, label: 'festgelegt', sub: ov.reason || 'von der Lehrkraft festgelegt' };
  return { kind: 'calc', v: r.suggestion ? r.suggestion.text : '–', r, label: '', sub: '' };
}
const inStats = (c, s) => R.counted(s) && !(c.noGrade && c.noGrade[s.id]);
function finalTxt(c, s, r) { const ng = c.noGrade && c.noGrade[s.id]; if (ng) return 'ohne Note'; if (!R.counted(s)) return 'Gast'; const ov = ovOf(c, s.id); return ov ? ov.grade + ' (festgelegt)' : r.suggestion ? r.suggestion.text : '–'; }
/* ---- Ausdrucke: gemeinsame Bausteine ---- */
const cLabel = c => (c.name || '').toLowerCase().includes((c.subject || '').toLowerCase()) ? c.name : `${c.name} · ${c.subject}`;
const f2 = x => x == null || x === '' || !isFinite(+x) ? '' : String(Math.round(+x * 100) / 100).replace('.', ',');
const avgTxt = (list, dg = 2) => { const v = list.filter(x => x != null && x !== '' && isFinite(+x)).map(Number); return v.length ? fmt(R.mean(v), dg) : ''; };
/* Kürzel-Erklärung nur für die Kürzel, die im Ausdruck vorkommen */
/* Wer zählt bei einer Arbeit? Gewertet = alle mit Note, auch 6* (unentschuldigt versäumt, § 26 Abs. 4 GSO) und Unterschleif;
   nicht gewertet: entschuldigt (Nachtermin offen), befreit, noch ohne Eintrag */
function countInfo(c, a, up) {
  const ss = c.students.filter(R.counted), guests = c.students.length - ss.length;   /* Gäste, deren Noten nicht zählen, gehören nicht zur Klasse dieser Statistik */
  const rs = ss.map(s => a.results && a.results[s.id]);
  const by = k => rs.filter(r => r && r.status === k).length;
  const nt = rs.filter(r => r && r.nt && R.valueOf(r, up) != null).length;
  const n = rs.filter(r => r && !r.nt && R.valueOf(r, up) != null).length, n6 = by('n6'), us = by('us'), ent = by('ent'), bef = by('bef');
  const leer = ss.length - n - nt - ent - bef;
  const inn = [n6 ? `${n6} × ${up ? '0*' : '6*'} (unentschuldigt versäumt)` : '', us ? `${us} × Unterschleif` : ''].filter(Boolean);
  const out = [nt ? `${nt} Nachtermin (eigene Arbeit)` : '', ent ? `${ent} entschuldigt` : '', bef ? `${bef} befreit` : '', leer > 0 ? `${leer} ohne Eintrag` : '', guests ? `${guests} ${guests === 1 ? 'Gast' : 'Gäste'} (zählen nicht)` : ''].filter(Boolean);
  return { n, all: ss.length, txt: `${n} von ${ss.length}` + (inn.length ? ' · mitgezählt: ' + inn.join(', ') : '') + (out.length ? ' · nicht gezählt: ' + out.join(', ') : '') };
}
const countSpan = (c, a, up) => { const ci = countInfo(c, a, up); return `<span title="${esc(ci.txt)}">Gewertet: <b>${ci.n}</b> von ${ci.all}</span>`; };
function statusNote(results, up) {
  const used = new Set(Object.values(results || {}).filter(r => r && r.status).map(r => r.status));
  if (Object.values(results || {}).some(r => r && r.nt && !r.status)) used.add('nt');
  const T = { nt: 'NT = Nachtermin (zählt für die Person, nicht im Notenspiegel/Ø dieser Arbeit)', ent: 'E = entschuldigt, Nachtermin offen', bef: 'B = befreit (zählt nicht)', n6: (up ? '0*' : '6*') + ' = versäumt ohne Entschuldigung oder verweigert (§ 26 Abs. 4 GSO)', us: 'U = Unterschleif' };
  const list = Object.keys(T).filter(k => used.has(k)).map(k => T[k]);
  return list.length ? 'Kürzel: ' + list.join(' · ') + '.' : '';
}
function modelCourse(c) {
  const up = upper(c), st = courseStats(c);
  const statsBox = [{ l: up ? 'Ø Halbjahresleistung' : 'Ø gesamt', v: st.avg == null ? '–' : fmt(st.avg, 2), s: up ? 'Punkte' + (st.term ? ' · ' + st.term : '') : 'rechnerisch, Klasse', key: true },
    { l: 'Schüler', v: String(c.students.length), s: isMixed(c.students) ? classesOf(c).join(', ') : '' },
    { l: 'Gefährdet', v: String(st.risk), s: up ? 'unter 5 Punkten oder 0 Punkte' : 'Note 5 oder 6 möglich' },
    { l: 'Leistungsnachweise', v: String(visibleAssessments(c).length), s: scopeLabel(c) }];
  if (up && !scopeOf(c).term) {
    const terms = R.termsOf(c);
    const head = ['Name', ...terms.map(t => t + ' (Punkte)'), ...(c.seminar ? ['Seminararbeit (max. 30)'] : [])];
    const rows = groupedRows(c, s => [s.name, ...terms.map(t => { const fo = finalOf(c, s, t); return fo.kind === 'calc' ? fo.v : fo.label; }), ...(c.seminar ? [String(R.seminarPaper((c.seminarPaper[s.id] || {}).arbeit, (c.seminarPaper[s.id] || {}).gespraech) ?? '–')] : [])]);
    rows.push({ cells: ['Ø Kurs', ...terms.map(t => avgTxt(c.students.filter(s => inStats(c, s)).map(s => R.computeTerm(c, s.id, t).points))), ...(c.seminar ? [avgTxt(c.students.map(s => R.seminarPaper((c.seminarPaper[s.id] || {}).arbeit, (c.seminarPaper[s.id] || {}).gespraech)))] : [])], cls: 'foot' });
    return { eyebrow: 'Notenübersicht', title: cLabel(c), file: fileName('Notenübersicht', c), subtitle: scopeLabel(c), meta: baseMeta(c), blocks: [{ stats: statsBox.filter((_, i) => i !== 3) }, { table: { head, rows, align: ['l'], bold: head.map((_, i) => i).slice(1) } }], landscape: false };
  }
  const as = visibleAssessments(c);
  const big = as.filter(a => R.isBig(a)), small = as.filter(a => !R.isBig(a));
  const colAvg = a => { const d = R.distribution(a, c.students, up); return d.n ? fmt(d.avg, 2) : ''; };
  let head, rows, foot;
  if (up) {
    const t = scopeOf(c).term, rs = c.students.filter(s => inStats(c, s)).map(s => R.computeTerm(c, s.id, t));
    const lfS = R.upperFormula(c) === 'sportlf', pt = x => x == null ? '' : String(x);
    head = ['Name', ...big.map(lnName), ...small.map(lnName), 'Einzeln', lfS ? 'Fach Sport' : 'Ø klein', lfS ? 'Sporttheorie' : 'Ergebnis', 'Punkte'];
    rows = groupedRows(c, s => { const r = R.computeTerm(c, s.id, t); return [s.name, ...big.map(a => ct(c, a, s, true)), ...small.map(a => ct(c, a, s, true)), entTxt(c, s), lfS ? pt(r.fs) : fmt(r.small), lfS ? pt(r.th) : fmt(r.raw), (fo => fo.kind === 'calc' ? fo.v : fo.label)(finalOf(c, s, t))]; });
    foot = ['Ø Kurs', ...big.map(colAvg), ...small.map(colAvg), '', avgTxt(rs.map(r => r.small)), avgTxt(rs.map(r => lfS ? r.th : r.raw)), avgTxt(rs.map(r => r.points), 1)];
  } else {
    const rs = c.students.filter(s => inStats(c, s)).map(s => R.computeLower(c, s.id, scopeOf(c)));
    head = ['Name', ...(c.hasSA ? big.map(lnName) : []), ...(c.hasSA ? ['Ø groß'] : []), ...small.map(lnName), 'Einzeln', 'Ø klein', 'Ø gesamt', 'Zeugnis'];
    rows = groupedRows(c, s => { const r = R.computeLower(c, s.id, scopeOf(c)); return [s.name, ...(c.hasSA ? big.map(a => ct(c, a, s, false)) : []), ...(c.hasSA ? [fmt(r.saAvg)] : []), ...small.map(a => ct(c, a, s, false)), entTxt(c, s), fmt(r.smAvg), fmt(r.total), finalTxt(c, s, r)]; });
    foot = ['Ø Klasse', ...(c.hasSA ? big.map(colAvg) : []), ...(c.hasSA ? [avgTxt(rs.map(r => r.saAvg))] : []), ...small.map(colAvg), '', avgTxt(rs.map(r => r.smAvg)), avgTxt(rs.map(r => r.total)), ''];
  }
  rows.push({ cells: foot, cls: 'foot' });
  const legend = (as.length || (c.entries || []).length ? 'Einzeln = Einzelnoten mit eigenem Datum (z. B. Unterrichtsbeiträge) · ' : '') + as.map(a => `${lnName(a)} = ${a.title || R.TYPES[a.type].label}${up && R.upperFormula(c) === 'sportlf' && a.type !== 'prak' ? (R.sportPart(a) === 't' ? ' (Sporttheorie)' : ' (Fach Sport)') : ''}${R.isBig(a) && a.bigWeight && +a.bigWeight !== 1 ? ' (' + wLabel(a.bigWeight) + ')' : ''}${!R.isBig(a) && R.weightOf(a, c) !== 1 ? ' (Gewicht ' + R.weightOf(a, c) + ')' : ''}`).join(' · ');
  const rule = up ? (R.upperFormula(c) === 'sportlf' ? 'Leistungsfach Sport (§ 29 Abs. 5 GSO, KMBek Sport Q12/13 Nr. 2.3.1): Fach Sport = (2 × Ø praktische Leistungen + Ø kleine LN) ÷ 3, gerundet; Sporttheorie = (Schulaufgabe + Ø kleine LN) ÷ 2, gerundet; Punkte = Durchschnitt beider, gerundet.' : R.upperFormula(c) === 'sport' ? 'Sport (§ 29 Abs. 5 GSO): (2 × Ø praktische Leistungen + Ø übrige kleine LN) ÷ 3, gerundet.' : 'Halbjahresleistung nach § 29 GSO: Schulaufgabe und Durchschnitt der kleinen LN 1:1, gerundet.') : c.hasSA ? `Jahresfortgangsnote nach § 28 GSO: große : kleine LN = ${R.saRatio(c)}:1.` : 'Fach ohne Schulaufgaben: Note aus den kleinen Leistungsnachweisen.';
  return { eyebrow: 'Notenübersicht', title: cLabel(c), file: fileName('Notenübersicht', c), subtitle: scopeLabel(c), meta: baseMeta(c), landscape: head.length > 11,
    blocks: [{ stats: statsBox }, { table: { head, rows, align: ['l'], bold: [head.length - 1], small: head.length > 16 } }, { note: rule + ' Kürzel: E = entschuldigt (Nachtermin), B = befreit, ' + (up ? '0*' : '6*') + ' = versäumt/verweigert (§ 26 Abs. 4 GSO), U = Unterschleif' + (Object.keys(c.away || {}).length ? ', abw. = längere Abwesenheit' : '') + '.' }, ...(legend ? [{ note: legend }] : [])] };
}
function modelTransfer(c) {
  if (isSemTab(c)) return modelSemResults(c);
  const up = upper(c);
  const head = ['Nr.', 'Name', up ? 'Punkte ' + (scopeOf(c).term || R.termsOf(c)[0]) : 'Note', 'Bemerkung', '✓'];
  const rows = groupedRows(c, (s, i) => {
    const fo = finalOf(c, s, up ? (scopeOf(c) || {}).term || R.termsOf(c)[0] : undefined);
    if (fo.kind === 'ng' || fo.kind === 'guest') return [String(i + 1), s.name, '–', fo.sub, ''];
    if (up) { const r = fo.r; return [String(i + 1), s.name, fo.v, [r.zero ? '0 Punkte – nicht belegt' : r.open.length ? 'Nachtermin offen' : '', s.guest ? 'Gast (zählt)' : ''].filter(Boolean).join(' · '), '']; }
    const r = fo.r; const ov = ovOf(c, s.id);
    const nsNote = (supOf(c, s.id) || {}).k === 'ns' ? 'Notenschutz – im Zeugnis vermerken' : '';
    const rem = ov ? (ov.reason || 'von der Lehrkraft festgelegt') : r.suggestion && r.suggestion.grade == null ? 'Grenzfall – Entscheidung nötig' : r.open.length ? 'Nachtermin offen' : '';
    return [String(i + 1), s.name, fo.v, [rem, nsNote, s.guest ? 'Gast (zählt)' : ''].filter(Boolean).join(' · '), ''];
  });
  return { eyebrow: 'Übertragsliste', title: `Übertragsliste ${cLabel(c)}`, file: fileName('Übertragsliste', c), subtitle: scopeLabel(c) + ' – zum Eintragen ins Notenprogramm der Schule', meta: baseMeta(c),
    blocks: [{ table: { head, rows, align: ['c', 'l', 'c', 'l', 'c'], big: [2], widths: [4, 30, 9, 30, 4] } }, { note: (isMixed(c.students) ? 'Nach Klassen unterteilt, je Klasse alphabetisch – Reihenfolge und Nummern wie auf dem Notenblatt des Infoportals.' : 'Reihenfolge alphabetisch wie in der Schülerliste.') + ' Nach dem Übertragen in der Spalte ✓ abhaken.' }] };
}
/* Kopfgruppen für Aufgaben, die zusammengehören (Schreibaufgabe: Inhalt + Sprache), und Rand-Markierung der Gruppe */
function taskHeadGroups(tk, before, after) {
  if (!tk.some(t => t.g)) return null;
  const out = [{ label: '', span: before }];
  for (let i = 0; i < tk.length;) { const g = tk[i].g; let n = 1; if (g) while (i + n < tk.length && tk[i + n].g === g) n++;
    out.push(g ? { label: (tk[i].gl || 'Schreiben') + (R.taskF(tk[i]) !== 1 ? ' ×' + f2(R.taskF(tk[i])) : ''), span: n } : { label: '', span: 1 }); i += n; }
  out.push({ label: '', span: after });
  return out;
}
/* Schülerübersichten (Oberstufe, Klausur nach Prüfungsteilen): je Schüler ein Abschnitt mit Prüfungsteilen, Teilnoten und nachvollziehbarer Rechnung –
   drei je A4-Seite zum Ausschneiden (wie die Übersichten der ISB-Rechentabelle). Nur Schüler mit vollständigem Ergebnis. */
const PCT15 = [95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 33, 27, 20];
function modelSlips(c, a, graf) {
  const ps = a.parts, W = ps.reduce((x, p) => x + (+p.w || 0), 0) || 1, lnT = a.title || R.TYPES[a.type].label;
  const pc = p => Math.round((+p.w || 0) / W * 1000) / 10, dz = x => fmt(x, 1).replace(/,0$/, '');
  const WORD = ['ungenügend', 'mangelhaft', 'mangelhaft', 'mangelhaft', 'ausreichend', 'ausreichend', 'ausreichend', 'befriedigend', 'befriedigend', 'befriedigend', 'gut', 'gut', 'gut', 'sehr gut', 'sehr gut', 'sehr gut'];
  const items = [], skipped = [];
  groupsOf(c).forEach(g => g.students.forEach(s => {
    const r = a.results && a.results[s.id];
    if (!r || r.status || r.v == null || r.exact == null) { if (R.counted(s)) skipped.push(s); return; }
    const rows = ps.map(p => { const v = (r.pp || {})[p.id], n = R.partNote(p, v); if (!n) return null;
      if (p.kind === 'be') { const thr = n.tn ? PCT15[15 - n.tn] : null;
        return { label: p.label, w: pc(p), tn: n.tn, bew: [['', f2(v)], [` von ${f2(p.max)} BE`, '']], extra: dz(n.lg) + ' %', bewG: [['', f2(v)], [` von ${f2(p.max)} BE · ${dz(n.lg)} %`, '']],
          calc: `${f2(v)} ÷ ${f2(p.max)} BE = ${dz(n.lg)} % Lösungsgrad → ${n.tn} ${n.tn === 1 ? 'Punkt' : 'Punkte'} (${thr ? 'ab ' + thr + ' %' : 'unter 20 %'})` }; }
      if (p.kind === 'is') { const raw = Math.round((0.4 * v.i + 0.6 * v.s) * 100) / 100;
        return { label: p.label, w: pc(p), tn: n.tn, sperr: n.sperr, bew: [['Inhalt ', f2(v.i)], [' · Sprache ', f2(v.s)]],
          calc: `0,4 × ${f2(v.i)} (Inhalt) + 0,6 × ${f2(v.s)} (Sprache) = ${dz(raw)}${n.sperr ? ` → Sperrklausel (${+v.i === 0 ? 'Inhalt' : 'Sprache'} 0 Punkte): höchstens 3` : ''}` }; }
      return { label: p.label, w: pc(p), tn: n.tn, bew: [['', f2(v)]], calc: '' };
    }).filter(Boolean);
    items.push({ name: `${s.first || ''} ${s.last || ''}`.trim() || s.name, v: r.v, exact: fmt(r.exact, 2), ex: +r.exact, word: WORD[r.v],
      rows: rows.map(x => ({ ...x, tnT: dz(x.tn) })),
      total: `${rows.map(x => `${String(x.w).replace('.', ',')} % × ${dz(x.tn)}`).join(' + ')} = ${fmt(r.exact, 2)} → gerundet ${r.v} Notenpunkte (${WORD[r.v]})` });
  }));
  return { title: `Schülerübersichten · ${lnT}`, file: `${a.date || ''} ${lnT} Schülerübersichten${graf ? ' grafisch' : ''} ${c.name} ${c.subject}`.trim(), skipped,
    slips: { graf: !!graf, eyebrow: [lnT, c.subject, c.name, a.term || '', a.date ? fdate(a.date) : ''].filter(Boolean).join(' · '), items } };
}
function modelAssessment(c, a, opt = {}) {
  const up = upper(c), dist = R.distribution(a, c.students, up), unit = up ? 'Punkte' : 'Note';   /* Q12/13: „Punkte“ = Notenpunkte, Rohwerte heißen dort BE */
  const lnT = a.title || R.TYPES[a.type].label, parts = R.byParts(a), tasksMode = R.byTask(a);
  const detail = !!opt.detail && (tasksMode || parts);
  const res = s => a.results && a.results[s.id];
  const noteTxt = s => { const r = res(s); const t = R.cellText(r, up); return t ? t + (r && r.nt && !r.status ? ' NT' : '') : (isAway(c, s.id, a.date) ? 'abw.' : '–'); };
  const raws = a.usePoints ? c.students.map(res).filter(r => r && !r.status && !r.nt && r.raw != null && r.raw !== '' && isFinite(+r.raw)).map(r => +r.raw).sort((x, y) => x - y) : [];
  const avgRaw = raws.length ? R.mean(raws) : null, maxP = a.key && (tasksMode ? R.tasksMax(a) : +a.key.max);
  const exacts = parts ? c.students.map(res).filter(r => r && !r.status && r.exact != null).map(r => +r.exact) : [];
  /* Kennzahlen oben – der Durchschnitt groß und hervorgehoben */
  const stats = [{ l: 'Durchschnitt', v: dist.n ? fmt(dist.avg, 2) : '–', s: dist.n ? unit : 'noch keine Ergebnisse', key: true },
    { l: 'Gewertet', v: String(dist.n), s: `von ${c.students.filter(R.counted).length} Schülern` },
    { l: up ? 'Unter 5 Punkten' : 'Noten 5 und 6', v: String(dist.weak), s: dist.n ? Math.round(dist.weakShare * 100) + ' % der Gewerteten' : '' }];
  if (raws.length && maxP) stats.push({ l: 'Ø Punkte', v: f2(avgRaw), s: `von ${f2(maxP)} · ${Math.round(avgRaw / maxP * 100)} %` });
  if (parts && exacts.length) stats.push({ l: 'Ø ungerundet', v: f2(R.mean(exacts)), s: (up ? 'Notenpunkte' : 'Noten') + ' vor dem Runden' });
  /* Liste */
  let table;
  if (detail && tasksMode) {
    const tk = a.tasks, ts = R.taskStats(a, c.students), grpEdge = {};
    tk.forEach((t, i) => { if (t.g) { if (!i || tk[i - 1].g !== t.g) grpEdge[i + 2] = 'gL'; if (i === tk.length - 1 || tk[i + 1].g !== t.g) grpEdge[i + 2] = ((grpEdge[i + 2] || '') + ' gR').trim(); } });
    const dh = ['Nr.', 'Name', ...tk.map(t => t.label), 'Summe', unit];
    const dr = groupedRows(c, (s, i) => { const r = res(s); return [String(i + 1), s.name, ...tk.map(t => r && !r.status && r.pts && r.pts[t.id] != null && r.pts[t.id] !== '' ? f2(r.pts[t.id]) : ''), r && !r.status && r.raw != null ? f2(r.raw) : '', noteTxt(s)]; });
    const pc = x => x == null ? '' : Math.round(x * 100) + ' %';
    table = { head: dh, headGroups: taskHeadGroups(tk, 2, 2), gEdge: grpEdge,
      rows: [{ cells: ['', 'erreichbar', ...tk.map(t => f2(t.max) + (R.taskF(t) !== 1 && !t.g ? ' ×' + f2(R.taskF(t)) : '')), f2(R.tasksMax(a)), ''], cls: 'sub' }, ...dr,
        { cells: ['', 'Ø Klasse', ...ts.map(t => f2(t.avg)), f2(avgRaw), dist.n ? fmt(dist.avg, 2) : ''], cls: 'foot' },
        { cells: ['', 'Lösungsquote', ...ts.map(t => pc(t.quote)), avgRaw == null ? '' : pc(avgRaw / R.tasksMax(a)), ''], cls: 'foot' }],
      align: ['c', 'l'], big: [dh.length - 1], bold: [dh.length - 2], small: tk.length > 9, widths: [3, 14, ...tk.map(() => 3.4), 4.4, 4.4] };
  } else if (detail && parts) {
    const ps = a.parts, cols = [], heads = [], hg = [{ label: '', span: 2 }], edge = {};
    ps.forEach(p => { const st = cols.length + 2; if (p.kind === 'is') { heads.push('Inhalt', 'Sprache', 'Teilnote'); cols.push([p, 'i'], [p, 's'], [p, 'tn']); hg.push({ label: `${p.label} · ${f2(p.w)}\u00a0%`, span: 3 }); edge[st] = 'gL'; edge[st + 2] = 'gR'; }
      else if (p.kind === 'n') { heads.push(up ? 'Punkte' : 'Note'); cols.push([p, 'v']); hg.push({ label: `${p.label} · Gewicht ${f2(p.w)}`, span: 1 }); edge[st] = 'gL gR'; }
      else { heads.push('BE', 'Teilnote'); cols.push([p, 'v'], [p, 'tn']); hg.push({ label: `${p.label} · ${f2(p.w)}\u00a0%`, span: 2 }); edge[st] = 'gL'; edge[st + 1] = 'gR'; } });
    hg.push({ label: '', span: 2 });
    let sperr = false;
    const val = (r, p, k) => { if (!r || r.status || !r.pp) return ''; const v = r.pp[p.id]; if (k === 'tn') { const n = R.partNote(p, v); if (!n) return ''; if (n.sperr) sperr = true; return f2(n.tn) + (n.sperr ? '*' : ''); } if (p.kind === 'is') return v && v[k] != null && v[k] !== '' ? String(v[k]) : ''; return v != null && v !== '' ? f2(v) : ''; };
    const dr = groupedRows(c, (s, i) => { const r = res(s); return [String(i + 1), s.name, ...cols.map(([p, k]) => val(r, p, k)), r && r.exact != null && !r.status ? f2(r.exact) : '', noteTxt(s)]; });
    const colAvg = ([p, k]) => avgTxt(c.students.map(res).map(r => { if (!r || r.status || !r.pp) return null; const v = r.pp[p.id]; if (k === 'tn') { const n = R.partNote(p, v); return n ? n.tn : null; } if (p.kind === 'is') return v && v[k] !== '' ? v[k] : null; return v; }));
    table = { head: ['Nr.', 'Name', ...heads, 'genau', unit], headGroups: hg, gEdge: edge,
      rows: [{ cells: ['', a.alt ? 'Bewertung' : 'erreichbar', ...cols.map(([p, k]) => k === 'tn' ? '0–15' : p.kind === 'is' ? '0–15' : p.kind === 'n' ? (up ? '0–15' : '1–6') : f2(p.max)), '', ''], cls: 'sub' }, ...dr,
        { cells: ['', up ? 'Ø Kurs' : 'Ø Klasse', ...cols.map(colAvg), exacts.length ? f2(R.mean(exacts)) : '', dist.n ? fmt(dist.avg, 2) : ''], cls: 'foot' }],
      align: ['c', 'l'], big: [cols.length + 3], small: cols.length > 8, widths: [3, 14, ...cols.map(() => 3.2), 4, 4] };
    if (sperr) opt._sperr = true;
  } else {
    const pts = a.usePoints, ex = parts;
    const head = ['Nr.', 'Name', ...(pts ? [up ? 'BE' : 'Punkte'] : []), ...(ex ? ['genau'] : []), unit];
    const rows = groupedRows(c, (s, i) => { const r = res(s); return [String(i + 1), s.name, ...(pts ? [r && r.raw != null ? f2(r.raw) : ''] : []), ...(ex ? [r && r.exact != null && !r.status ? f2(r.exact) : ''] : []), noteTxt(s)]; });
    rows.push({ cells: ['', 'Ø Klasse', ...(pts ? [f2(avgRaw)] : []), ...(ex ? [exacts.length ? f2(R.mean(exacts)) : ''] : []), dist.n ? fmt(dist.avg, 2) : ''], cls: 'foot' });
    table = { head, rows, align: ['c', 'l'], big: [head.length - 1], widths: [3, 18, ...(pts ? [5] : []), ...(ex ? [5] : []), 5] };
  }
  /* Notenspiegel und Notenschlüssel */
  const labels = up ? Array.from({ length: 16 }, (_, i) => String(15 - i)) : ['1', '2', '3', '4', '5', '6'];
  const counts = up ? dist.counts.slice().reverse() : dist.counts.slice();
  const right = [{ h: 'Notenspiegel' }];
  if (dist.n) right.push({ bars: { labels, values: counts, upper: up, w: up ? 330 : 300, h: 132 } }); else right.push({ note: 'Noch keine Ergebnisse.' });
  const kr = a.usePoints && a.key ? keyRanges(a, up) : null;
  if (kr) {
    right.push({ h: 'Notenschlüssel' + (a.key.preset === 'hv' ? ' · Hörverstehen (ISB)' : a.key.preset === 'kmk' ? (up ? ' (amtliche BE-Tabelle)' : ' (KMK-Raster)') : '') });
    const kRow = (g, i) => [up ? `${g.label} (${R.POINT_LABEL(+g.label)})` : g.label, g.hi < g.lo ? "–" : g.lo === g.hi ? f2(g.lo) : `${f2(g.lo)} – ${f2(g.hi)}`, String(counts[i] || 0)];
    if (up) {   /* 16 Stufen in zwei Hälften nebeneinander (15–8 | 7–0): halb so hoch, passt neben bzw. unter die Liste, ohne Seitenumbruch */
      const h = Math.ceil(kr.length / 2);
      right.push({ table: { head: ['Punkte', 'BE', 'Anz.', 'Punkte', 'BE', 'Anz.'], rows: kr.slice(0, h).map((g, i) => [...kRow(g, i), ...(kr[i + h] ? kRow(kr[i + h], i + h) : ['', '', ''])]), small: true, keep: true, widths: [3.4, 5, 2, 3.4, 5, 2], gEdge: { 2: 'gR', 3: 'gL' } } });
    } else right.push({ table: { head: ['Note', 'Rohpunkte', 'Anzahl'], rows: kr.map(kRow), keep: true, widths: [3, 6, 3] } });
  }
  if (parts && a.alt) right.push({ h: 'Gewichtung' }, { table: { head: ['Teil', 'Bewertung', 'Gewicht'], rows: a.parts.map(p => [p.label, up ? 'Notenpunkte' : 'ganze Note', f2(p.w)]), align: ['l', 'l'], small: true, keep: true, widths: [5, 7, 2.4] } });
  else if (parts) right.push({ h: 'Gewichtung' }, { table: { head: ['Prüfungsteil', 'Bewertung', 'Anteil'], rows: a.parts.map(p => [p.label, p.kind === 'is' ? 'Inhalt 40 % · Sprache 60 %' : `BE (max. ${f2(p.max)}) → Lösungsgrad`, f2(p.w) + ' %']), align: ['l', 'l'], small: true, keep: true, widths: [5, 7, 2.4] } });
  const notes = [];
  if (raws.length) { const med = raws.length % 2 ? raws[(raws.length - 1) / 2] : (raws[raws.length / 2 - 1] + raws[raws.length / 2]) / 2; notes.push(`${up ? "BE" : "Rohpunkte"}: Ø ${f2(avgRaw)} · Median ${f2(med)} · höchste ${f2(raws[raws.length - 1])} · niedrigste ${f2(raws[0])}${maxP ? ' · erreichbar ' + f2(maxP) : ''}.`); }
  if (!up && a.usePoints && a.key && a.key.preset === 'kmk' && a.key.tend) notes.push('Tendenzen aus dem 15-Punkte-Raster.');
  if (parts && a.alt) notes.push(`Zweigeteilte Schulaufgabe nach KMS vom 31.07.2023 (V.3-BS5402.7/135/1): Übersetzung und Aufgabenteil getrennt bewertet, Gesamtnote = gewichteter Durchschnitt ${f2(a.parts[0].w)} : ${f2(a.parts[1].w)}, bei n,5 die bessere Note.${a.alt.ue5 ? ' „Ausreichend“ nur bei mindestens „mangelhafter“ Übersetzung.' : ''}${a.alt.g11 ? ' „Befriedigend“ nur, wenn kein Teil „ungenügend“ ist.' : ''}${a.alt.up ? ' Hat ein Teil 0 Punkte, höchstens 6 Punkte (Anlage 2).' : ''}`);
  else if (parts) notes.push('Teilnote Hörverstehen o. Ä.: Anteil der BE nach Abitur-Tabelle (95 % = 15 … 20 % = 1 Punkt). Schreiben/Sprachmittlung: 40 % Inhalt + 60 % Sprache; ist Inhalt oder Sprache 0 Punkte, höchstens 3 Punkte (Sperrklausel' + (opt._sperr ? ', mit * markiert' : '') + '). Gesamt: gewichteter Durchschnitt, gerundet.');
  const sn = statusNote(a.results, up); if (sn) notes.push(sn);
  { const ci = countInfo(c, a, up); if (ci.n !== ci.all) notes.push('Gewertet: ' + ci.txt + '.'); }
  if (notes.length) right.push({ note: notes.join('\n') });
  /* lange Klassenlisten (bis ca. 34) etwas enger setzen, damit Liste und Auswertung möglichst auf eine Seite passen */
  if (table && c.students.length > 20) table.dense = true;
  const sideBySide = !detail && c.students.length <= 34;
  const blocks = [{ stats }];
  /* Unterschrift gehört zur Auswertung (rechte Spalte) – so steht sie nie allein auf einer neuen Seite */
  right.push({ sig: R.isBig(a) ? ['Datum, Unterschrift der Lehrkraft', 'Kenntnisnahme Fachbetreuung'] : ['Datum, Unterschrift der Lehrkraft'] });
  if (sideBySide) blocks.push({ split: [[{ table }], right], cols: '1.25fr 1fr', long: c.students.length > 22 });
  else { blocks.push({ table }); const [h0, b0, ...rest] = right; blocks.push({ split: [[h0, b0], rest], cols: '1fr 1fr' }); }
  return { eyebrow: (detail ? (R.isBig(a) ? 'Auswertung für die Fachbetreuung · ' : 'Auswertung · ') : 'Notenliste · ') + R.TYPES[a.type].label + (R.isBig(a) ? ' (großer LN' + (a.bigWeight && +a.bigWeight !== 1 ? ', ' + wLabel(a.bigWeight) : '') + ')' : ' (kleiner LN)'),
    title: lnT, file: fileName(lnT + (detail ? ' Auswertung' : ''), c, a.date), subtitle: `${cLabel(c)}${a.date ? ' · ' + wdate(a.date) : ''}${up ? ' · Halbjahr ' + a.term : ''}`, meta: baseMeta(c), blocks,
    landscape: detail && ((tasksMode && a.tasks.length > 8) || (parts && a.parts.reduce((x, p) => x + (p.kind === 'is' ? 3 : 2), 0) > 9)) };
}
const stuSub = (c, s) => `${cLabel(c)}${isMixed(c.students) && s.cls ? ' · Klasse ' + s.cls : ''} · ${scopeLabel(c)}`;
function modelStudents(c, list) {
  const up = upper(c);
  const blocks = [];
  list.forEach((s, idx) => {
    const as = c.assessments.concat((c.entries || []).filter(e => e.sid === s.id).map(e => ({ ...e, title: R.TYPES[e.type].label + ' (einzeln)', results: { [s.id]: e } }))).sort((x, y) => (x.date || '').localeCompare(y.date || ''));
    const head = { eyebrow: 'Schülerblatt', title: s.name, subtitle: stuSub(c, s), meta: studMeta(c, s) };
    if (idx) blocks.push({ pagebreak: true }, { head });
    /* Kennzahlen oben: Zeugnisnote bzw. Halbjahresleistungen auf einen Blick */
    if (c.seminar) { /* W-Seminar: Tabelle unten */ }
    else if (up) blocks.push({ stats: R.termsOf(c).map((t, i) => { const fo = finalOf(c, s, t), p = fo.points; return { l: 'Halbjahr ' + t, v: fo.v, s: fo.kind !== 'calc' ? fo.label : p == null ? 'noch offen' : 'Punkte (' + R.POINT_LABEL(p) + ')', key: t === scopeOf(c).term || (!scopeOf(c).term && i === 0) }; }) });
    else { const fo = finalOf(c, s), r = R.computeLower(c, s.id, scopeOf(c)); blocks.push({ stats: [{ l: 'Zeugnisnote', v: fo.v, s: fo.kind === 'ng' ? fo.label : fo.kind === 'guest' ? 'Gast – zählt nicht' : fo.kind === 'ov' ? 'von der Lehrkraft festgelegt' : 'Vorschlag nach § 28 GSO', key: true }, { l: 'Ø gesamt', v: fmt(r.total) || '–', s: 'rechnerisch' }, ...(c.hasSA ? [{ l: 'Ø große LN', v: fmt(r.saAvg) || '–', s: 'Schulaufgaben' }] : []), { l: 'Ø kleine LN', v: fmt(r.smAvg) || '–', s: 'gewichtet' }] }); }
    const rows = as.map(a => { const r = a.results && a.results[s.id]; return [a.title || R.TYPES[a.type].label, R.isBig(a) ? 'groß' + (a.bigWeight && +a.bigWeight !== 1 ? ' ' + wLabel(a.bigWeight) : '') : 'klein', a.date ? fdate(a.date) : '', ...(up ? [a.term] : []), r && r.raw != null ? String(r.raw).replace('.', ',') + (a.key ? ' / ' + String(a.key.max).replace('.', ',') : '') : '', R.cellText(r, up) || (isAway(c, s.id, a.date) ? 'abw.' : '–')]; });
    if (awayOf(c, s.id)) blocks.push({ p: 'Hinweis: ' + awayText(awayOf(c, s.id)) + '.' });
    if (supOf(c, s.id)) blocks.push({ p: supText(c, s.id) + '.' });
    blocks.push({ h: 'Leistungsnachweise' }, { table: { head: ['Leistungsnachweis', 'Art', 'Datum', ...(up ? ['Halbjahr'] : []), up ? 'BE' : 'Punkte', up ? 'Punkte' : 'Note'], rows: rows.length ? rows : [['Noch keine Einträge', '', '', ...(up ? [''] : []), '', '']], align: ['l'], bold: [up ? 5 : 4] } });
    if (c.seminar) { blocks.push({ h: 'Ergebnis' }); const sp = c.seminarPaper[s.id] || {}, g = R.seminarPaper(sp.arbeit, sp.gespraech); const pv = x => x === '' || x == null ? '–' : String(x); blocks.push({ table: { head: ['Seminararbeit', 'Prüfungsgespräch', 'Gesamtleistung (max. 30)'], rows: [[pv(sp.arbeit), pv(sp.gespraech), g == null ? '–' : String(g)]], big: [2] } }); }
  });
  return { eyebrow: 'Schülerblatt', title: list.length === 1 ? list[0].name : `Schülerblätter ${cLabel(c)}`, file: list.length === 1 ? fileSafe(`${todayISO()} Schülerblatt ${list[0].name} ${cLabel(c).replace(' · ', ' ')}`) : fileName('Schülerblätter', c), subtitle: list.length === 1 ? stuSub(c, list[0]) : scopeLabel(c), meta: list.length && list[0] ? studMeta(c, list[0]) : baseMeta(c), blocks };
}
function modelStudentsAll(c) {
  const m = modelStudents(c, c.students);
  if (c.students.length) { m.title = c.students[0].name; m.subtitle = stuSub(c, c.students[0]); m.meta = studMeta(c, c.students[0]); m.file = fileName('Schülerblätter', c); }
  return m;
}
const fileSafe = s => s.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '-').replace(/\s+/g, ' ').replace(/-{2,}/g, '-').replace(/^[\s.-]+|[\s.-]+$/g, '');
/* Dateiname: Datum zuerst (sortiert sich von selbst nach Zeit), dann Art, Kurs, Fach – z. B. „2026-10-06 Stehgreifaufgabe 8AB Italienisch“ */
const fileName = (kind, c, date) => fileSafe(`${date || todayISO()} ${kind} ${cLabel(c).replace(' · ', ' ')}`);   /* Fach nur, wenn es nicht schon im Kursnamen steht */
/* Vor dem PDF: Bliebe auf dem letzten Blatt nur ein Rest (unter gut einem Fünftel), wird die Seite stufenweise etwas enger gesetzt –
   aber nur, wenn dadurch wirklich ein Blatt wegfällt. Gemessen in unsichtbarem Rahmen in Druckbreite (A4, Ränder wie beim Drucken). */
async function fitHtml(html, landscape) {
  const W = landscape ? 1027 : 698, PH = landscape ? 664 : 993;
  const fr = document.createElement('iframe'); fr.setAttribute('sandbox', 'allow-same-origin'); fr.style.cssText = `position:fixed;left:-5000px;top:0;width:${W}px;height:400px;border:0;visibility:hidden`;
  document.body.appendChild(fr);
  try {
    await new Promise(r => { fr.onload = r; fr.srcdoc = html; });
    const doc = fr.contentDocument; if (!doc || !doc.body) return html;
    const pages = () => Math.ceil((doc.documentElement.scrollHeight - 2) / PH);
    const p0 = pages(), rest = doc.documentElement.scrollHeight - (p0 - 1) * PH;
    if (p0 < 2 || rest > PH * 0.22) return html;
    for (const k of ['fit1', 'fit2', 'fit3']) { doc.body.className = k; if (pages() < p0) return html.replace('<body>', `<body class="${k}">`); }
    return html;
  } catch (e) { return html; } finally { fr.remove(); }
}
/* Schülerübersichten: drei je Seite, bei vielen Teilen (ab vier) zwei; passt ein Abschnitt trotzdem nicht in seine Höhe, wird nachgemessen und weniger je Seite gedruckt – nie abgeschnitten */
async function fitSlips(m, st) {
  let per = m.slips.items.some(it => it.rows.length > 3) ? 2 : 3, html;
  for (;;) {
    m.slips.per = per; html = Print.html(m, st);
    if (per === 1) return html;
    const fr = document.createElement('iframe'); fr.setAttribute('sandbox', 'allow-same-origin'); fr.style.cssText = 'position:fixed;left:-5000px;top:0;width:698px;height:400px;border:0;visibility:hidden';
    document.body.appendChild(fr);
    let over = false;
    try { await new Promise(r => { fr.onload = r; fr.srcdoc = html; }); over = [...fr.contentDocument.querySelectorAll('.slip')].some(e => e.scrollHeight > e.clientHeight + 1); } catch (e) {} finally { fr.remove(); }
    if (!over) return html;
    per--;
  }
}
async function exportModel(m, kind) {
  const base = m.file ? fileSafe(m.file) : fileSafe(m.title);
  try {
    const st = (D && D.settings) || {};
    if (kind === 'pdf' && m.slips) await N.savePdf(base + '.pdf', await fitSlips(m, st), false, Print.footer(st));
    else if (kind === 'pdf') await N.savePdf(base + '.pdf', await fitHtml(Print.html(m, st), m.landscape), m.landscape, Print.footer(st));
    if (kind === 'docx') await N.saveFile(base + '.docx', await Print.docx(m, st), 'docx');
    if (kind === 'csv') await N.saveFile(base + '.csv', Print.csv(m), 'csv');
  } catch (e) { toast('Export fehlgeschlagen: ' + e.message); }
}
function printSheet(c) {
  if (!c) return;
  const opt = (id, title, sub, xl) => `<div class="row"><span><b>${title}</b><br><small class="hint">${sub}</small></span><button type="button" class="mini accent" data-p="${id}:pdf">PDF</button><button type="button" class="mini" data-p="${id}:docx">Word</button>${id === 'course' || xl ? `<button type="button" class="mini" data-p="${id}:csv">Excel</button>` : ''}</div>`;
  const { dlg, close } = sheet({ title: 'Drucken & Export', ok: '', cancel: 'Fertig', body: `<p class="hint" style="margin-top:0">Gilt für die aktuelle Ansicht: <b>${esc(scopeLabel(c))}</b>. Alle Ausdrucke tragen das theis-Logo und den Hinweis, dass Libretto die Dokumentation der Schule nicht ersetzt.</p>
    <div class="rows">${opt('course', 'Kursübersicht', 'Alle Schüler mit allen Noten, Durchschnitten und Vorschlag')}${opt('transfer', 'Übertragsliste fürs Infoportal', isSemTab(c) ? 'Ergebnisse der Seminararbeit – zum Abtippen und Abhaken' : 'Nur Name und Endnote – zum Abtippen und Abhaken')}${opt('students', 'Schülerblätter', 'Eine Seite pro Schüler, z. B. für Elterngespräche')}</div>
    ${c.seminar ? `<div class="subhead">W-Seminar</div><div class="rows">${opt('semOverview', 'Übersicht der Seminararbeiten', 'Themen, Betreuungstermine je Halbjahr, Abgabe – ohne Noten, z. B. für die Oberstufenkoordination', true)}${opt('semResults', 'Ergebnisse W-Seminar', '12/1, 12/2, Arbeit, Prüfungsgespräch, Gesamtleistung mit Hinweisen (§ 44 GSO)', true)}${opt('semDossier', 'Betreuungsdokumentation', 'Je Schüler: Thema, alle Termine mit Protokoll, Abgabe, Bewertung – eine Seite pro Person')}${opt('semBwA', 'Bewertungsbögen Seminararbeit', 'Je Person: Bereiche nach ISB (Anlage 5a) mit Einschätzung, Anmerkungen, Punkten')}${opt('semBwP', 'Bewertungsbögen Prüfungsgespräch', 'Je Person: fünf Kompetenzen nach ISB mit Punkten und Anmerkungen')}${opt('semPg', 'Terminliste Prüfungsgespräche', 'Tag, Uhrzeit, Name und Thema – nach Tagen geordnet')}${opt('semBlankA', 'Leerer Bewertungsbogen Seminararbeit', 'Zum Ausfüllen von Hand')}${opt('semBlankP', 'Leerer Bewertungsbogen Prüfungsgespräch', 'Zum Ausfüllen von Hand')}</div>` : ''}
    <p class="hint">Einzelne Leistungsnachweise druckst du über den Spaltenkopf in der Tabelle, einzelne Schüler über ihren Namen.</p>` });
  $$('[data-p]', dlg).forEach(b => b.onclick = () => { const [what, kind] = b.dataset.p.split(':'); exportModel(({ course: modelCourse, transfer: modelTransfer, students: modelStudentsAll, semOverview: modelSemOverview, semResults: modelSemResults, semDossier: modelSemDossierAll, semBwA: modelSemBwAAll, semBwP: modelSemBwPAll, semPg: modelSemPgPlan, semBlankA: x => modelSemBwA(x, { id: '', name: '' }, true), semBlankP: x => modelSemBwP(x, { id: '', name: '' }, true) }[what])(c), kind); });
}

/* ======================================================================
   Termine & Nachtermine
   ====================================================================== */
/* Kalender: schriftliche Leistungsnachweise, Ferien und Feiertage in Bayern */
const WRITTEN = ['sa', 'stex', 'ka', 'flt', 'jst', 'proj'];
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
function eventsOn(iso) { return (D.events || []).filter(e => e.from <= iso && (e.to || e.from) >= iso); }
function calendarHTML() {
  const now = new Date(); UI.cal = UI.cal || { y: now.getFullYear(), m: now.getMonth() };
  const { y, m } = UI.cal; const t = todayISO();
  const clsOf = c => upper(c) ? c.name : R.classOf(c.name);
  const classes = [...new Set(D.courses.flatMap(classesOf))].sort((a, b) => (parseInt(a) || 99) - (parseInt(b) || 99) || a.localeCompare(b));
  const f = UI.calCls || '';
  const ev = {};
  D.courses.filter(c => !f || classesOf(c).includes(f)).forEach(c => c.assessments.filter(a => a.date && WRITTEN.includes(a.type)).forEach(a => (ev[a.date] = ev[a.date] || []).push({ c, a })));
  D.classDates.filter(x => !f || x.cls === f).forEach(x => (ev[x.date] = ev[x.date] || []).push({ other: x }));
  D.courses.filter(c => c.seminar && c.sem && c.sem.deadline && (!f || classesOf(c).includes(f))).forEach(c => (ev[c.sem.deadline] = ev[c.sem.deadline] || []).push({ semc: c }));
  dlList().filter(x => !f || D.courses.some(c => classesOf(c).includes(f) && dlFor(x, c))).forEach(x => {
    if (x.close) (ev[x.close] = ev[x.close] || []).push({ dl: x, ns: true });
    if (x.date && x.date !== x.close) (ev[x.date] = ev[x.date] || []).push({ dl: x }); });
  const free = Cal.freeDays(y, m);
  const first = new Date(y, m, 1), start = Cal.add(first, -((first.getDay() + 6) % 7));
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = Cal.add(start, i), iso = Cal.iso(d), inM = d.getMonth() === m, fr = free[iso], we = d.getDay() === 0 || d.getDay() === 6;
    if (i >= 35 && !inM) break;
    const items = (ev[iso] || []).map(x => x.dl ? `<button type="button" class="cev dl" data-act="deadlines" title="${esc((x.ns ? 'Notenschluss ' : '') + dlLabel(x.dl) + ' · ' + DL_G[dlG(x.dl)])}">${esc((x.ns ? 'Notenschluss ' : '') + dlLabel(x.dl))}</button>` : x.semc ? `<span class="cev" style="--hue:var(${hueOf(x.semc.subject)})" title="${esc('Abgabe der Seminararbeit · ' + x.semc.name + ' ' + x.semc.subject + (x.semc.sem.deadlineTime ? ' · ' + x.semc.sem.deadlineTime + ' Uhr' : ''))}">${esc(x.semc.name)} Abgabe</span>` : x.other ? `<span class="cev other" title="${esc(x.other.cls + ' · ' + x.other.subject)}">${esc(x.other.cls)} ${esc(x.other.subject.slice(0, 4))}</span>`
      : `<button class="cev" style="--hue:var(${hueOf(x.c.subject)})" data-cal="${x.c.id}|${x.a.id}" title="${esc(x.c.name + ' ' + x.c.subject + ' · ' + (x.a.title || R.TYPES[x.a.type].label))}">${esc(clsOf(x.c))} ${esc(x.a.short || R.TYPES[x.a.type].short)}</button>`).join('');
    const se = inM ? eventsOn(iso) : [];
    const sev = se.slice(0, 2).map(e => `<span class="cev sch" title="${esc((e.time ? e.time + ' · ' : '') + e.title)}">${esc(e.title)}</span>`).join('') + (se.length > 2 ? `<span class="cev more" title="${esc(se.slice(2).map(e => e.title).join('\n'))}">+${se.length - 2} weitere</span>` : '');
    cells.push(`<div class="cday ${inM ? '' : 'out'} ${we ? 'we' : ''} ${fr ? 'free ' + fr[0].kind : ''} ${iso === t ? 'today' : ''}"><span class="dn">${d.getDate()}</span>${fr && inM ? `<span class="fl">${esc(fr[0].name)}</span>` : ''}${items}${sev}</div>`);
  }
  /* Monats- und Jahreswahl */
  const pk = UI.calPick;
  const picker = pk ? `<div class="calPick glass"><div class="yrs"><button class="iconbtn" data-pky="-1" title="Frühere Jahre">‹</button>${[-2, -1, 0, 1, 2].map(k => `<button data-pkyear="${pk.y + k}" aria-pressed="${pk.y + k === pk.sel}">${pk.y + k}</button>`).join('')}<button class="iconbtn" data-pky="1" title="Spätere Jahre">›</button></div>
      <div class="mos">${MONTHS.map((n, i) => `<button data-pkm="${i}" aria-pressed="${pk.sel === y && i === m}">${n.slice(0, 3)}</button>`).join('')}</div></div>` : '';
  /* Schultermine des Monats */
  const mFrom = Cal.iso(first), mTo = Cal.iso(new Date(y, m + 1, 0));
  const mEv = (D.events || []).filter(e => e.from <= mTo && (e.to || e.from) >= mFrom).sort((a, b) => a.from.localeCompare(b.from) || (a.time || '').localeCompare(b.time || ''));
  const rng = e => e.to && e.to !== e.from ? `${sdate(e.from)}–${sdate(e.to)}` : sdate(e.from);
  const evList = (D.events || []).length ? `<details class="evBox" ${UI.evOpen === false ? '' : 'open'}><summary>Schultermine im ${MONTHS[m]} <span class="count">${mEv.length}</span></summary>
      <div class="tlist">${mEv.length ? mEv.map(e => `<div class="trow"><span class="d">${rng(e)}${e.time ? `<br><small>${esc(e.time)}</small>` : ''}</span><span>${esc(e.title)}</span></div>`).join('') : '<p class="hint">Keine Schultermine in diesem Monat.</p>'}</div>
      ${feedLine()}
      <div class="panelBtns">${D.settings.evFeed ? '<button class="mini" id="evFeedNow">Jetzt aktualisieren</button><button class="mini" id="evFeedSet">Abo-Link ändern …</button>' : '<button class="mini" id="evImp2">Neu einlesen …</button><button class="mini" id="evFeedSet">Als Abo verknüpfen …</button>'}<button class="mini" id="evClear">${D.settings.evFeed ? 'Abo beenden und Termine entfernen' : 'Schultermine entfernen'}</button></div></details>` : '';
  return `<section class="panel glass" style="margin-bottom:16px"><div class="calHead"><h2 class="ptitle" style="margin:0">Kalender</h2>
      <div class="calNav"><button class="iconbtn" data-calnav="-1" title="Vorheriger Monat">‹</button><span class="calTitleWrap"><button class="calTitle" id="calTitle" title="Monat und Jahr wählen" aria-expanded="${!!pk}">${MONTHS[m]} ${y}<i>▾</i></button>${picker}</span><button class="iconbtn" data-calnav="1" title="Nächster Monat">›</button><button class="mini" data-calnav="0">Heute</button></div>
      <div class="calTools">${(D.events || []).length ? '' : '<button class="mini" id="evImp" title="Termine der Schule aus dem Infoportal (CSV) oder aus einer Kalenderdatei (ICS) übernehmen">Schultermine einlesen …</button><button class="mini" id="evFeedSet" title="Link zum Schulkalender (ICS/webcal) – Libretto holt neue Termine dann selbst">Schulkalender abonnieren …</button>'}<span class="picker"><select id="calCls"><option value="">Alle Klassen und Kurse</option>${classes.map(x => `<option ${x === f ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></span></div></div>
    <div class="cal"><div class="cwd">Mo</div><div class="cwd">Di</div><div class="cwd">Mi</div><div class="cwd">Do</div><div class="cwd">Fr</div><div class="cwd">Sa</div><div class="cwd">So</div>${cells.join('')}</div>
    ${evList}<input type="file" id="evFile" accept=".csv,.ics,.txt" hidden>
    <p class="note">Zeigt angekündigte und geplante schriftliche Leistungsnachweise (Schulaufgaben, Stegreifaufgaben, Kurzarbeiten, Tests)${(D.events || []).length ? ' und die eingelesenen Schultermine (grau)' : ''}. Ferien und Feiertage in Bayern laut Kultusministerium, ohne Gewähr; Mariä Himmelfahrt gilt nur in überwiegend katholischen Gemeinden.</p></section>`;
}
/* ======================================================================
   Fristen fürs Notenmachen: Zwischenbericht/Zwischenzeugnis, Halbjahr, Q12/Q13, Jahreszeugnis
   (je Schule verschieden – § 40 Abs. 2 GSO: Zwischenzeugnis oder mind. zwei Informationen über das Notenbild).
   Gespeichert in D.settings.dl = [{ id, kind, date, close, title?, g?, src }]; date = Termin, close = Notenschluss (optional).
   ====================================================================== */
const DL_KINDS = {
  zb1: { l: '1. Zwischenbericht (Notenbild)', g: 'u' },
  zz: { l: 'Zwischenzeugnis', g: 'u' },
  hj: { l: 'Klassenkonferenz zum Halbjahr', g: 'u' },
  zb2: { l: '2. Zwischenbericht (Notenbild)', g: 'u' },
  jz: { l: 'Jahreszeugnis (Klassenkonferenz)', g: 'u' },
  q13: { l: 'Zeugnis 13/1', g: '13' },
  abi: { l: 'Ende 13/2 – Zulassung zum Abitur', g: '13' },
  q12: { l: 'Zeugnis 12/1', g: '12' },
  q12e: { l: 'Ende 12/2', g: '12' },
  own: { l: 'Eigene Frist', g: 'all' } };
const DL_G = { all: 'alle Kurse', u: 'Jgst. 5–11', '12': 'Q12', '13': 'Q13' };
const dlList = () => (D.settings.dl = Array.isArray(D.settings.dl) ? D.settings.dl : []);
const dlG = x => x.kind === 'own' ? (x.g || 'all') : DL_KINDS[x.kind].g;
const dlLabel = x => x.kind === 'own' ? (x.title || 'Eigene Frist') : DL_KINDS[x.kind].l;
const dlDue = x => x.close || x.date || '';
const dlFor = (x, c) => { const g = dlG(x); return g === 'all' || (g === 'u' ? !upper(c) : upper(c) && String(c.grade) === g); };
/* Was steht im Schulkalender? Erkennt die üblichen Titel; Notenschluss-Termine werden der passenden Frist zugeordnet */
function detectDeadlines(events) {
  const out = {}, own = [];
  const kindOf = (t, iso) => { const mo = +iso.slice(5, 7), early = mo >= 1 && mo <= 4;
    if (/q\s*13|13\s*\/\s*1|abitur/i.test(t) && /zeugnis|notenschluss|zulassung|halbjahr/i.test(t)) return /13\s*\/\s*2|zulassung/i.test(t) || !early ? 'abi' : 'q13';
    if (/q\s*12|12\s*\/\s*1/i.test(t) && /zeugnis|notenschluss|halbjahr/i.test(t)) return /12\s*\/\s*2/i.test(t) || !early ? 'q12e' : 'q12';
    if (/(1\.|erste[nrs]?)\s*zwischenbericht/i.test(t)) return 'zb1';
    if (/(2\.|zweite[nrs]?)\s*zwischenbericht/i.test(t)) return 'zb2';
    if (/zwischenzeugnis/i.test(t)) return 'zz';
    if (/konferenz\w*\s+(zum|zur)\s+(schul)?halbjahr|halbjahres\w*konferenz/i.test(t)) return 'hj';
    if (/konferenz\w*\s+zum\s+jahreszeugnis|jahreszeugnis\w*\s*konferenz|notenschluss\s+(zum\s+)?jahreszeugnis/i.test(t)) return 'jz';
    return null; };
  (events || []).forEach(e => { const t = e.title || '', k = kindOf(t, e.from), ns = /notenschluss|noten\s*schluss|notenabgabe/i.test(t);
    if (k) { const o = out[k] = out[k] || { kind: k, src: 'cal' }; if (ns) o.close = o.close || e.from; else o.date = o.date || e.from; }
    else if (ns) own.push({ kind: 'own', title: t.slice(0, 80), g: 'all', close: e.from, src: 'cal' }); });
  return Object.values(out).concat(own).map(x => ({ ...x, date: x.date || '' })).sort((a, b) => dlDue(a).localeCompare(dlDue(b)));
}
/* Gefundene Fristen in die Liste übernehmen, ohne Eigenes zu überschreiben: ein eingetragener Notenschluss bleibt stehen */
function mergeDeadlines(found) {
  const L = dlList(); let n = 0;
  found.forEach(f => { const ex = f.kind === 'own' ? L.find(x => x.kind === 'own' && x.title === f.title) : L.find(x => x.kind === f.kind);
    if (!ex) { L.push({ id: uid(), ...f }); n++; return; }
    if (f.date && ex.date !== f.date && (!ex.date || ex.src === 'cal')) { ex.date = f.date; n++; }
    if (f.close && !ex.close) { ex.close = f.close; n++; } });
  if (!D.settings.half1End) { const h = L.find(x => x.kind === 'zz') || L.find(x => x.kind === 'hj'); if (h && dlDue(h)) D.settings.half1End = dlDue(h); }
  return n;
}
/* Nach dem Einlesen der Schultermine: gefundene Fristen zum Übernehmen anbieten */
function offerDeadlines(events) {
  const found = detectDeadlines(events); if (!found.length || READONLY) return;
  sheet({ title: 'Fristen fürs Notenmachen gefunden', ok: 'Übernehmen', body: `<p class="prose">Im Schulkalender stehen diese Termine. Libretto zeigt sie dann in der Übersicht und im passenden Kurs an – und erinnert, wenn eine Frist naht.</p>
    <div class="dlFound">${found.map((f, i) => `<label class="row"><input type="checkbox" data-dlf="${i}" checked><span><b>${esc(dlLabel(f))}</b><small>${f.date ? wdate(f.date) : ''}${f.close ? (f.date ? ' · ' : '') + 'Notenschluss ' + wdate(f.close) : ''} · ${DL_G[dlG(f)]}</small></span></label>`).join('')}</div>
    <p class="hint">Den Notenschluss (bis wann die Noten fertig sein müssen) legt jede Schule selbst fest – du kannst ihn danach unter „Fristen“ ergänzen.</p>`,
    onOk: d => { const pick = found.filter((f, i) => d.querySelector(`[data-dlf="${i}"]`).checked); const n = mergeDeadlines(pick); save(); render(); toast(n ? `${pick.length} Fristen übernommen` : 'Fristen waren schon eingetragen'); } });
}
/* Fristen bearbeiten */
function deadlineSheet() {
  let L = JSON.parse(JSON.stringify(dlList()));
  const row = (x, i) => `<div class="dlRow" data-dl="${i}">
      <div class="dlName">${x.kind === 'own' ? `<input type="text" data-dt="${i}" value="${esc(x.title || '')}" placeholder="z. B. Notenschluss Q13">
        <select data-dg="${i}">${Object.entries(DL_G).map(([k, l]) => `<option value="${k}" ${(x.g || 'all') === k ? 'selected' : ''}>${l}</option>`).join('')}</select>` : `<b>${esc(dlLabel(x))}</b><small>${DL_G[dlG(x)]}${x.src === 'cal' ? ' · aus dem Schulkalender' : ''}</small>`}</div>
      ${field('Termin', `<input type="date" data-dd="${i}" value="${esc(x.date || '')}">`)}${field('Notenschluss', `<input type="date" data-dc="${i}" value="${esc(x.close || '')}">`)}
      <button type="button" class="iconbtn" data-ddel="${i}" title="Frist entfernen">✕</button></div>`;
  const avail = () => Object.keys(DL_KINDS).filter(k => k === 'own' || !L.some(x => x.kind === k));
  const draw = d => { d.querySelector('#dlRows').innerHTML = L.length ? L.map(row).join('') : '<p class="hint">Noch keine Fristen eingetragen.</p>';
    d.querySelector('#dlAddK').innerHTML = avail().map(k => `<option value="${k}">${esc(DL_KINDS[k].l)}${k === 'own' ? '' : ' (' + DL_G[DL_KINDS[k].g] + ')'}</option>`).join(''); bind(d); };
  const sync = d => L.forEach((x, i) => { const g = sel => d.querySelector(sel); if (g(`[data-dd="${i}"]`)) x.date = g(`[data-dd="${i}"]`).value; if (g(`[data-dc="${i}"]`)) x.close = g(`[data-dc="${i}"]`).value;
    if (g(`[data-dt="${i}"]`)) x.title = g(`[data-dt="${i}"]`).value.trim(); if (g(`[data-dg="${i}"]`)) x.g = g(`[data-dg="${i}"]`).value; if (x.src === 'cal') x.src = 'cal'; });
  const bind = d => $$('[data-ddel]', d).forEach(b => b.onclick = () => { sync(d); L.splice(+b.dataset.ddel, 1); draw(d); });
  const nEv = (D.events || []).length, nFound = nEv ? detectDeadlines(D.events).length : 0;
  sheet({ title: 'Fristen fürs Notenmachen', wide: true, body: `
    <p class="prose">Bis wann müssen die Noten stehen? Das legt jede Schule selbst fest – je nach Jahrgangsstufe verschieden. <b>Termin</b> ist z. B. die Ausgabe oder die Klassenkonferenz, <b>Notenschluss</b> der Tag, bis zu dem alle Noten eingetragen sein müssen (optional). Libretto zeigt die nächste Frist in der Übersicht und im passenden Kurs und hebt sie zwei Wochen vorher hervor.</p>
    <div id="dlRows" class="dlRows"></div>
    <div class="panelBtns"><span class="picker"><select id="dlAddK"></select></span><button type="button" class="mini" id="dlAdd">+ Frist</button>
      ${nEv ? `<button type="button" class="mini" id="dlCal" ${nFound ? '' : 'disabled'} title="${nFound ? '' : 'In den eingelesenen Schulterminen wurde nichts Passendes gefunden'}">Aus den Schulterminen übernehmen${nFound ? ' (' + nFound + ')' : ''}</button>` : `<button type="button" class="mini" id="dlImp">Schultermine einlesen …</button>`}</div>
    <p class="hint">Schulen mit Zwischenberichten statt Zwischenzeugnis (§ 40 Abs. 2 GSO) tragen den 1. und 2. Zwischenbericht ein. Der Stichtag für die Ansicht „Stand Zwischenzeugnis“ wird aus dem Zwischenzeugnis bzw. der Halbjahreskonferenz übernommen, falls er unter Einstellungen noch leer ist.</p>`,
    onOpen: (d, close) => { draw(d);
      d.querySelector('#dlAdd').onclick = () => { sync(d); const k = d.querySelector('#dlAddK').value; if (!k) return; L.push({ id: uid(), kind: k, date: '', close: '', src: 'hand', ...(k === 'own' ? { title: '', g: 'all' } : {}) }); draw(d); };
      const cb = d.querySelector('#dlCal'); if (cb) cb.onclick = () => { sync(d); const keep = D.settings.dl; D.settings.dl = L; const n = mergeDeadlines(detectDeadlines(D.events)); L = D.settings.dl; D.settings.dl = keep; draw(d); toast(n ? 'Aus den Schulterminen ergänzt – mit „Sichern“ übernehmen' : 'Schon alles eingetragen'); };
      const ib = d.querySelector('#dlImp'); if (ib) ib.onclick = () => { closeAll(); UI.tab = 'dates'; render(); setTimeout(() => { const f = $('#evFile'); if (f) f.click(); }, 60); }; },
    onOk: d => { sync(d); D.settings.dl = L.filter(x => x.date || x.close || (x.kind === 'own' && x.title));
      if (!D.settings.half1End) { const h = D.settings.dl.find(x => x.kind === 'zz') || D.settings.dl.find(x => x.kind === 'hj'); if (h && dlDue(h)) { D.settings.half1End = dlDue(h); toast('Stichtag „Stand Zwischenzeugnis“: ' + fdate(D.settings.half1End)); } }
      save(); render(); } });
}
/* Die nächsten Fristen (ab heute); für einen Kurs nur die passenden */
/* Alle Fristen eines Kurses: die passenden der Schule und beim W-Seminar Themenwahl und Abgabe der Seminararbeit */
function courseDeadlines(c) {
  const L = dlList().filter(x => dlDue(x) && dlFor(x, c));
  if (c.seminar && c.sem) { const cf = c.sem;
    if (cf.themeDue) L.push({ id: 'semT', kind: 'own', title: 'Themenwahl Seminararbeit (§ 24 GSO)', g: 'all', date: cf.themeDue, src: 'sem' });
    if (cf.deadline) L.push({ id: 'semA', kind: 'own', title: 'Abgabe der Seminararbeit' + (cf.deadlineTime ? ' (' + cf.deadlineTime + ' Uhr)' : ''), g: 'all', date: cf.deadline, src: 'sem' }); }
  return L.sort((a, b) => dlDue(a).localeCompare(dlDue(b)));
}
function nextDeadlines(c, days = 400) {
  const t = todayISO(), lim = Cal.iso(Cal.add(new Date(t + 'T12:00'), days));
  return (c ? courseDeadlines(c) : dlList()).filter(x => dlDue(x) && dlDue(x) >= t && dlDue(x) <= lim).sort((a, b) => dlDue(a).localeCompare(dlDue(b)));
}
/* Fristen dieses Kurses auf einen Blick (über die kleine Marke im Kurskopf) */
function courseDeadlineSheet(c) {
  const t = todayISO(), L = courseDeadlines(c), nx = L.find(x => dlDue(x) >= t);
  const rows = L.map(x => { const past = dlDue(x) < t, n = dlDays(x);
    return `<div class="trow dlLine ${past ? 'past' : ''} ${x === nx ? 'next' : ''}"><span class="d">${sdate(dlDue(x))}<small>${past ? 'vorbei' : dlWhen(n)}</small></span><span><b>${esc(dlTitle(x))}</b>${x.close && x.date ? `<br><small>Termin ${esc(wdate(x.date))}</small>` : ''}${x.src === 'sem' ? '<br><small>W-Seminar – ändern unter „Kurs &amp; Schüler“</small>' : ''}</span></div>`; }).join('');
  sheet({ title: 'Fristen · ' + c.name, ok: '', cancel: 'Schließen', body: `<div class="tlist">${rows || '<p class="hint">Für diesen Kurs ist noch keine Frist eingetragen.</p>'}</div>
    <div class="panelBtns"><button type="button" class="mini" data-dlall>Fristen der Schule bearbeiten …</button></div>
    <p class="hint">Es erscheinen nur die Fristen für ${upper(c) ? 'Q' + esc(String(c.grade)) : 'die Jahrgangsstufen 5–11'}${c.seminar ? ' und das W-Seminar' : ''}. Ob deine Schule ein Zwischenzeugnis oder Zwischenberichte hat, legst du unter „Fristen“ fest – eingetragen wird nur, was es gibt.</p>`,
    onOpen: d => { d.querySelector('[data-dlall]').onclick = () => openSub(d, deadlineSheet, () => courseDeadlineSheet(c)); } });
}
const dlDays = x => Math.round((new Date(dlDue(x) + 'T12:00') - new Date(todayISO() + 'T12:00')) / 864e5);
const dlWhen = n => n === 0 ? 'heute' : n === 1 ? 'morgen' : n < 14 ? 'in ' + n + ' Tagen' : 'in ' + Math.round(n / 7) + ' Wochen';
const dlTitle = x => (x.close ? 'Notenschluss ' : '') + dlLabel(x);
/* Hinweis oben im Kurs: nächste Frist in den kommenden drei Wochen */
function deadlineNotice(c) {
  const x = nextDeadlines(c, 7)[0]; if (!x) return '';
  const n = dlDays(x), open = c.assessments.reduce((k, a) => k + Object.values(a.results || {}).filter(r => r && r.status === 'ent').length, 0);
  return `<div class="notice dlNote soon"><div class="grow"><b>${esc(dlTitle(x))}: ${esc(wdate(dlDue(x)))} (${dlWhen(n)})</b>${x.close && x.date ? ` – Termin ${esc(fdate(x.date))}` : ''}.${open ? ` Noch ${open === 1 ? '1 Nachtermin' : open + ' Nachtermine'} offen.` : ''}</div><button class="mini" data-act="deadlines">Fristen</button></div>`;
}
/* Einmaliger Hinweis (1.0.10): Leistungsnachweise in modernen Fremdsprachen mit KMK-Raster bzw. Gesamt-BE-Tabelle – dort nicht vorgesehen.
   Libretto ändert nichts von selbst; die Liste zeigt, wo die Lehrkraft prüfen sollte. */
function kmkMfsCheck() {
  if (!D || READONLY || (D.settings.notice || {}).kmkMfs) return;
  const hits = [];
  D.courses.forEach(c => { if (!R.isModernLang(ruleSubj(c))) return; (c.assessments || []).forEach(a => { if (a.key && a.key.preset === 'kmk') hits.push({ c, a }); }); });
  if (!hits.length) return;
  sheet({ title: 'Bitte Notenschlüssel prüfen', ok: 'Verstanden', cancel: 'Später erinnern', body: `<p class="prose" style="margin-top:0">In diesen Leistungsnachweisen der modernen Fremdsprachen ist das <b>KMK-Raster</b> bzw. die Gesamt-BE-Tabelle gewählt (4 ab 40 %). Das ist dort nicht vorgesehen: „ausreichend“ liegt je nach Aufgabe bei 50–60 %, die Grenze zu „ungenügend“ bei 33 % (KMS vom 08.03.2023; Q12/Q13: ISB-Leitfaden 04/2025). Ältere Libretto-Versionen haben das KMK-Raster hier noch angeboten.</p>
    <div class="kmkList">${hits.map(({ c, a }) => `<button type="button" class="kmkItem" data-c="${c.id}" data-a="${a.id}"><b>${esc(c.name)}</b> · ${esc(c.subject || '')}<span>${esc(R.TYPES[a.type] ? R.TYPES[a.type].label : a.type)}${a.title ? ' „' + esc(a.title) + '“' : ''}${a.date ? ' · ' + fdate(a.date) : ''}</span></button>`).join('')}</div>
    <p class="hint">Libretto ändert keine Noten von selbst. Ein Klick öffnet den Leistungsnachweis; dort setzt „Note 4 ab 50 % …“ passende Grenzen ein, und der Notenspiegel zeigt sofort, was sich ändern würde. Falls die Grenzen bewusst so gewählt sind (z. B. Absprache mit der Schule), einfach lassen.</p>`,
    onOpen: (d, close) => $$('.kmkItem', d).forEach(b => b.onclick = () => { closeAll(); UI.course = b.dataset.c; UI.tab = 'grades'; render(); const c = course(), a = c && c.assessments.find(x => x.id === b.dataset.a); if (a) setTimeout(() => assessmentSheet(c, a), 200); }),
    onOk: () => { D.settings.notice = { ...(D.settings.notice || {}), kmkMfs: true }; save(); } });
}
/* ---------- Schulkalender als Abo (ICS-Link) ----------
   D.settings.evFeed = { url, last (ISO-Zeit), n, err }. Der Link liegt verschlüsselt bei den übrigen Daten. Neue Termine ersetzen die alten nur,
   wenn der Abruf klappt und Termine enthält – sonst bleibt alles, wie es ist. */
function feedLine() {
  const f = D.settings.evFeed; if (!f) return '';
  const when = f.last ? new Date(f.last).toLocaleString('de-DE', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'noch nie';
  return `<p class="hint feedLine"><b>Abo:</b> ${esc(feedHost(f.url))} · zuletzt aktualisiert ${esc(when)}${f.err ? ` · <span style="color:var(--red)">letzter Versuch: ${esc(f.err)}</span>` : ''}</p>`;
}
function feedHost(u) { try { return new URL(String(u).replace(/^webcals?:/i, 'https:')).host; } catch (e) { return 'Link'; } }
async function refreshFeed(force) {
  const f = D && D.settings.evFeed; if (!f || READONLY) return null;
  if (!force && f.last && Date.now() - new Date(f.last).getTime() < 6 * 3600e3) return null;
  let r; try { r = await N.icsFetch(f.url); } catch (e) { r = { ok: false, error: 'Nicht erreichbar' }; }
  if (!D || D.settings.evFeed !== f) return null;
  if (!r.ok) { f.err = r.error; save(); if (UI.tab === 'dates') renderDates(); return r; }
  const list = parseEvents(r.text) || [];
  if (!list.length) { f.err = 'keine Termine im Kalender'; save(); return { ok: false, error: f.err }; }
  D.events = list; f.last = new Date().toISOString(); f.n = list.length; delete f.err; save();
  if (UI.tab === 'dates') renderDates();
  return { ok: true, n: list.length };
}
function feedSheet() {
  const f = D.settings.evFeed || {};
  sheet({ title: 'Schulkalender abonnieren', small: true, ok: 'Abonnieren', body: `<p class="prose" style="margin-top:0">Hat deine Schule einen Kalender zum <b>Abonnieren</b> (ICS- oder webcal-Link, z. B. im Infoportal, auf der Schulhomepage oder als Google-/Outlook-Kalender), kopier den Link hierher. Libretto holt dann neue und geänderte Termine selbst – beim Start höchstens alle sechs Stunden oder mit „Jetzt aktualisieren“.</p>
    ${field('Link zum Kalender', `<input type="url" id="fdUrl" placeholder="https://… oder webcal://…" value="${esc(f.url || '')}" spellcheck="false" autocomplete="off">`)}
    <p class="hint">Libretto ruft den Link nur ab und schickt nichts mit – keine Namen, keine Noten. Der Link wird verschlüsselt mit deinen Daten gespeichert. Die bisher eingelesenen Schultermine werden durch die Termine aus dem Abo ersetzt.</p><p class="hint"><button type="button" class="linkbtn" id="fdHow">Wo finde ich den Link? Schritt für Schritt …</button></p><p class="gateErr" id="fdErr"></p>`,
    onOpen: d => { d.querySelector('#fdHow').onclick = () => helpSheet({ topic: 'kalabo' }); },
    onOk: async d => {
      const url = d.querySelector('#fdUrl').value.trim(); if (!url) { d.querySelector('#fdErr').textContent = 'Bitte einen Link einfügen'; return false; }
      const btn = d.querySelector('.sheethead button[type=submit]'); if (btn) btn.disabled = true;
      const r = await N.icsFetch(url); if (btn) btn.disabled = false;
      if (!r.ok) { d.querySelector('#fdErr').textContent = r.error; return false; }
      const list = parseEvents(r.text) || []; if (!list.length) { d.querySelector('#fdErr').textContent = 'Im Kalender wurden keine Termine gefunden'; return false; }
      D.events = list; D.settings.evFeed = { url, last: new Date().toISOString(), n: list.length }; save(); UI.evOpen = true; renderDates();
      toast(`Schulkalender abonniert – ${list.length} Termine`, 4000); offerDeadlines(list); return true;
    } });
}
/* Schultermine einlesen: CSV-Export des Infoportals (Kalender;Titel;…;Start;Ende) oder ICS-Kalenderdatei */
function parseEvents(text) {
  text = String(text || '').replace(/^﻿/, '');
  const dt = v => { v = String(v || '').trim(); let m;
    if ((m = v.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/))) return { d: `${m[1]}-${m[2]}-${m[3]}`, t: m[4] ? `${m[4]}:${m[5]}` : '' };
    if ((m = v.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[ ,]+(\d{1,2}):(\d{2}))?/))) return { d: `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`, t: m[4] ? `${m[4].padStart(2, '0')}:${m[5]}` : '' };
    if ((m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/))) return { d: `${m[1]}-${m[2]}-${m[3]}`, t: m[4] ? `${m[4]}:${m[5]}` : '' };
    return null; };
  const out = [];
  const push = (title, a, b, allDayEndExclusive) => { title = String(title || '').replace(/\s+/g, ' ').trim(); if (!title || !a) return;
    let to = b && b.d >= a.d ? b.d : a.d; if (allDayEndExclusive && b && !b.t && to > a.d) to = Cal.iso(Cal.add(new Date(to + 'T12:00'), -1));
    if (/ferien/i.test(title) && !/unterricht|gottesdienst/i.test(title)) return;   // Ferien kennt Libretto schon
    out.push({ id: uid(), title: title.slice(0, 240), from: a.d, to, time: a.t ? a.t + (b && b.t && b.d === a.d ? '–' + b.t : '') : '' }); };
  if (/BEGIN:VCALENDAR/i.test(text)) {
    const lines = text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/); let cur = null;
    for (const ln of lines) {
      if (/^BEGIN:VEVENT/i.test(ln)) cur = {}; else if (/^END:VEVENT/i.test(ln)) { if (cur) push(cur.s, cur.a, cur.b, true); cur = null; }
      else if (cur) { const i = ln.indexOf(':'); if (i < 0) continue; const k = ln.slice(0, i).split(';')[0].toUpperCase(), v = ln.slice(i + 1);
        if (k === 'SUMMARY') cur.s = v.replace(/\\([,;])/g, '$1').replace(/\\n/gi, ' '); if (k === 'DTSTART') cur.a = dt(v); if (k === 'DTEND') cur.b = dt(v); }
    }
    return out;
  }
  const rows = parseCsv(text); if (rows.length < 2) return out;
  const head = rows[0].map(h => String(h).trim().toLowerCase());
  const col = (...n) => head.findIndex(h => n.includes(h));
  const iT = col('titel', 'betreff', 'subject', 'summary', 'bezeichnung', 'termin', 'name'), iA = col('start', 'beginn', 'von', 'start date', 'datum', 'anfang'), iB = col('ende', 'end', 'bis', 'end date');
  if (iT < 0 || iA < 0) return null;
  rows.slice(1).forEach(r => push(r[iT], dt(r[iA]), iB >= 0 ? dt(r[iB]) : null, false));
  return out;
}
function bindCalendar() {
  $$('[data-calnav]').forEach(b => b.onclick = () => { const k = +b.dataset.calnav; const n = new Date(); if (!k) UI.cal = { y: n.getFullYear(), m: n.getMonth() }; else { const d = new Date(UI.cal.y, UI.cal.m + k, 1); UI.cal = { y: d.getFullYear(), m: d.getMonth() }; } UI.calPick = null; renderDates(); });
  const sel = $('#calCls'); if (sel) sel.onchange = () => { UI.calCls = sel.value; renderDates(); };
  $$('[data-cal]').forEach(b => b.onclick = () => { const [cid, aid] = b.dataset.cal.split('|'); const c = D.courses.find(x => x.id === cid); if (c) assessmentSheet(c, c.assessments.find(a => a.id === aid)); });
  const ti = $('#calTitle'); if (ti) ti.onclick = () => { UI.calPick = UI.calPick ? null : { y: UI.cal.y, sel: UI.cal.y }; renderDates(); };
  $$('[data-pky]').forEach(b => b.onclick = () => { UI.calPick.y += 5 * +b.dataset.pky; renderDates(); });
  $$('[data-pkyear]').forEach(b => b.onclick = () => { UI.calPick.sel = +b.dataset.pkyear; UI.cal = { y: UI.calPick.sel, m: UI.cal.m }; UI.calPick.y = UI.calPick.sel; renderDates(); });
  $$('[data-pkm]').forEach(b => b.onclick = () => { UI.cal = { y: UI.calPick.sel, m: +b.dataset.pkm }; UI.calPick = null; renderDates(); });
  const det = $('.evBox'); if (det) det.addEventListener('toggle', () => { UI.evOpen = det.open; });
  const file = $('#evFile');
  const pick = () => { if (READONLY) return; file.click(); };
  if ($('#evImp')) $('#evImp').onclick = pick; if ($('#evImp2')) $('#evImp2').onclick = pick;
  if ($('#evFeedSet')) $('#evFeedSet').onclick = () => { if (!READONLY) feedSheet(); };
  if ($('#evFeedNow')) $('#evFeedNow').onclick = async () => { const b = $('#evFeedNow'); b.disabled = true; const r = await refreshFeed(true); if (r && !r.ok) toast('Aktualisieren fehlgeschlagen: ' + r.error, 6000); else if (r) toast(`Schulkalender aktualisiert – ${r.n} Termine`); };
  if (file) file.onchange = async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try { const list = parseEvents(await f.text());
      if (list === null) { toast('Spalten nicht erkannt – erwartet werden „Titel“ und „Start“ (CSV aus dem Infoportal) oder eine ICS-Kalenderdatei', 6000); return; }
      if (!list.length) { toast('In der Datei wurden keine Termine gefunden'); return; }
      const had = (D.events || []).length; D.events = list; if (D.settings.evFeed) { delete D.settings.evFeed; toast('Abo beendet – jetzt gelten die Termine aus der Datei', 4000); } save(); UI.evOpen = true; renderDates(); toast(`${list.length} Schultermine eingelesen${had ? ' – die bisherigen wurden ersetzt' : ''}`, 4000); offerDeadlines(list);
    } catch (err) { console.error(err); toast('Datei konnte nicht gelesen werden'); } };
  if ($('#evClear')) $('#evClear').onclick = async () => { if (READONLY) return; if (await ask(`Alle ${D.events.length} eingelesenen Schultermine aus dem Kalender entfernen?${D.settings.evFeed ? ' Das Abo wird beendet.' : ''} Deine Leistungsnachweise bleiben unverändert.`, 'Entfernen', true)) { D.events = []; delete D.settings.evFeed; save(); renderDates(); } };
}
function renderDates() {
  const t = todayISO();
  const bigs = D.courses.flatMap(c => c.assessments.filter(a => R.isBig(a)).map(a => ({ c, a, cls: classesOf(c) }))).sort((x, y) => (x.a.date || '9999').localeCompare(y.a.date || '9999'));
  const confKeys = new Set();
  const classes = [...new Set(D.courses.filter(c => !upper(c)).flatMap(classesOf))].sort(cmpCls);
  classes.forEach(cls => R.dateConflicts(classBigDates(cls)).forEach(cf => cf.items.forEach(it => confKeys.add(cls + it.date))));
  const open = D.courses.flatMap(c => c.assessments.flatMap(a => Object.entries(a.results || {}).filter(([, r]) => r && r.status === 'ent').map(([sid]) => ({ c, a, s: c.students.find(x => x.id === sid) })))).filter(x => x.s);
  $('#main').innerHTML = `<header class="sHead pHead"><div><h1>Kalender &amp; Termine</h1><p>Leistungsnachweise aller Kurse, Ferien und Schultermine</p></div></header><div class="notices">${backupNotice()}</div>${calendarHTML()}<div class="twoCol">
    <section class="panel glass"><div class="phead"><h2 class="ptitle">Große Leistungsnachweise</h2><span class="count">${bigs.length}</span></div>
      <div class="tlist">${bigs.length ? bigs.map(({ c, a, cls }) => ({ c, a, hit: cls.some(k => confKeys.has(k + a.date)) })).map(({ c, a, hit }) => `<div class="trow ${hit ? 'conf' : ''} ${a.date && a.date < t ? 'past' : ''}"><span class="d">${a.date ? fdate(a.date) : 'ohne Datum'}</span><span>${esc(c.name)} · ${esc(c.subject)}<br><small>${esc(a.title || R.TYPES[a.type].label)}${a.bigWeight && +a.bigWeight !== 1 ? ' · ' + wLabel(a.bigWeight) : ''}</small></span>${hit ? '<span class="pill part">Termin prüfen</span>' : ''}</div>`).join('') : '<p class="hint">Noch keine Schulaufgaben eingetragen.</p>'}</div>
      <p class="note">§ 22 GSO: große schriftliche Leistungsnachweise spätestens eine Woche vorher ankündigen; höchstens einer pro Tag und zwei pro Woche je Klasse. Libretto prüft deine eigenen Termine und die unten eingetragenen anderer Fächer.</p></section>
    <div style="display:flex;flex-direction:column;gap:16px">
    <section class="panel glass"><div class="phead"><h2 class="ptitle">Offene Nachtermine (§ 27 GSO)</h2><span class="count">${open.length}</span></div>
      <div class="tlist">${open.length ? open.map(({ c, a, s }) => `<div class="trow"><span class="d">${a.date ? fdate(a.date) : ''}</span><span>${esc(s.name)}<br><small>${esc(c.name)} ${esc(c.subject)} · ${esc(a.title || R.TYPES[a.type].label)}</small></span><button class="mini" data-goto="${c.id}">Öffnen</button></div>`).join('') : '<p class="hint">Keine offenen Nachtermine. Mit „E“ in der Notentabelle markierst du entschuldigtes Fehlen.</p>'}</div>
      <p class="note">Mehrere versäumte große LN eines Fachs können in einem Nachtermin zusammengefasst werden. Wird auch der Nachtermin entschuldigt versäumt, kann eine Ersatzprüfung angesetzt werden (einmal pro Halbjahr und Fach, Ankündigung eine Woche vorher).</p></section>
    <section class="panel glass"><h2 class="ptitle">Schulaufgaben anderer Fächer</h2>
      <p class="hint" style="margin-top:0">Für die Terminprüfung: Termine der Kolleginnen und Kollegen in deinen Klassen.</p>
      <form id="cdForm" class="grid3" style="margin-top:10px">${field('Klasse', `<select id="cdCls">${classes.map(x => `<option>${esc(x)}</option>`).join('')}</select>`)}${field('Fach', '<input type="text" id="cdSubj" placeholder="z. B. Mathematik">')}${field('Datum', `<input type="date" id="cdDate" value="${t}">`)}<button class="mini accent span3" ${classes.length ? '' : 'disabled'}>Eintragen</button></form>
      <div class="tlist">${D.classDates.slice().sort((x, y) => x.date.localeCompare(y.date)).map(x => `<div class="trow ${confKeys.has(x.cls + x.date) ? 'conf' : ''}"><span class="d">${fdate(x.date)}</span><span>${esc(x.cls)} · ${esc(x.subject)}</span><button class="iconbtn" data-cddel="${x.id}" title="Entfernen">✕</button></div>`).join('')}</div></section>
    </div></div>`;
  const f = $('#cdForm'); f.onsubmit = e => { e.preventDefault(); const s = $('#cdSubj').value.trim(), d = $('#cdDate').value; if (!s || !d) return toast('Fach und Datum angeben'); D.classDates.push({ id: uid(), cls: $('#cdCls').value, subject: s, date: d }); save(); renderDates(); };
  $$('[data-cddel]').forEach(b => b.onclick = () => { if (READONLY) return; D.classDates = D.classDates.filter(x => x.id !== b.dataset.cddel); save(); renderDates(); });
  $$('[data-goto]').forEach(b => b.onclick = () => { UI.course = b.dataset.goto; rememberCourse(); UI.tab = 'grades'; render(); });
  bindCalendar();
}

/* ======================================================================
   Übersicht (Startseite): was ansteht und was offen ist. Nur Anzeige – ändert keine Daten.
   ====================================================================== */
const WHOLE_CLASS = ['sa', 'jst', 'stex', 'ka', 'flt'];   /* schreibt in der Regel die ganze Klasse – hier fällt auf, wenn einzelne Noten fehlen */
function startData() {
  const t = todayISO(), has = r => !!r && (r.status || r.v != null);
  const all = D.courses.flatMap(c => c.assessments.map(a => ({ c, a })));
  const next = all.filter(x => x.a.date && x.a.date >= t).sort((x, y) => x.a.date.localeCompare(y.a.date));
  /* Noten fehlen: Termin vorbei, aber noch nicht (alle) eingetragen. Abwesende zählen nicht; „E“ (Nachtermin) gilt als eingetragen und steht unten eigens. */
  const missing = all.filter(x => x.a.date && x.a.date < t).map(x => {
    const need = x.c.students.filter(s => !isAway(x.c, s.id, x.a.date) && R.counted(s));
    const got = need.filter(s => has(x.a.results && x.a.results[s.id])).length;
    /* § 25 GSO: schriftliche LN binnen zwei Wochen korrigieren und zurückgeben – Schulaufgaben in 12/13 und in Deutsch ab Jgst. 10 binnen drei Wochen */
    const written = ['sa', 'jst', 'stex', 'ka', 'flt'].includes(x.a.type), long = x.a.type === 'sa' && (upper(x.c) || (/^deutsch/i.test(x.c.subject || '') && +x.c.grade >= 10));
    const due = written ? Cal.iso(Cal.add(new Date(x.a.date + 'T12:00'), long ? 21 : 14)) : null;
    return { ...x, n: need.length - got, of: need.length, none: got === 0, due, late: !!due && got === 0 && due < t };
  }).filter(x => x.of > 0 && x.n > 0 && (x.none || WHOLE_CLASS.includes(x.a.type))).sort((x, y) => y.a.date.localeCompare(x.a.date));
  const makeup = D.courses.flatMap(c => c.assessments.flatMap(a => Object.entries(a.results || {}).filter(([, r]) => r && r.status === 'ent').map(([sid]) => ({ c, a, s: c.students.find(x => x.id === sid) })))).filter(x => x.s);
  /* Übertrag nur bei Kursen, in denen die Merkhilfe überhaupt benutzt wird */
  const xfer = D.courses.filter(c => c.xfer && Object.keys(c.xfer).length).map(c => ({ c, n: c.assessments.filter(a => { const st = xAssess(c, a); return st === 'open' || st === 'part'; }).length })).filter(x => x.n);
  const confKeys = new Set();
  [...new Set(D.courses.filter(c => !upper(c)).flatMap(classesOf))].forEach(cls => R.dateConflicts(classBigDates(cls)).forEach(cf => cf.items.forEach(it => { if (it.date >= t) confKeys.add(cls + '|' + it.date); })));
  const events = (D.events || []).filter(e => (e.to || e.from) >= t).sort((a, b) => a.from.localeCompare(b.from));
  return { t, next, missing, makeup, xfer, conflicts: confKeys.size, events };
}
/* Kennzahlen eines Kurses für die Kachel: Durchschnitt und wie viele gefährdet sind */
/* Übersicht: schmale Notenverteilung je Kurs (Zeugnisnote bzw. Halbjahresleistung in Notenstufen) */
function distBar(dist, unit) {
  const n = (dist || []).reduce((a, b) => a + b, 0); if (!n) return '';
  const lab = ['sehr gut', 'gut', 'befriedigend', 'ausreichend', 'mangelhaft', 'ungenügend'];
  const tip = dist.map((k, i) => k ? `${unit ? lab[i] : 'Note ' + (i + 1)}: ${k}` : '').filter(Boolean).join(' · ');
  return `<span class="sDist" role="img" aria-label="Notenverteilung: ${esc(tip)}" title="Notenverteilung (${unit ? 'Punkte in Notenstufen' : 'Zeugnisnote nach jetzigem Stand'}): ${esc(tip)}">${dist.map((k, i) => k ? `<i class="g${i + 1}" style="flex:${k}"></i>` : '').join('')}</span>`;
}
function courseStats(c) {
  const up = upper(c); let vals = [], risk = 0;
  if (up) { const tm = R.termsOf(c).includes(pickTerm(c)) ? pickTerm(c) : defaultTerm(c);
    const dist = [0, 0, 0, 0, 0, 0];
    c.students.filter(R.counted).forEach(s => { const r = R.computeTerm(c, s.id, tm); if (r.points != null) { vals.push(r.points); dist[R.POINT_GRADE(r.points) - 1]++; }   /* wie die Zeile „Ø Kurs“: Durchschnitt der Halbjahresleistungen (Punkte) */ if (r.under5 || r.zero) risk++; });
    return { avg: R.mean(vals), risk, unit: 'P.', term: tm, dist };
  }
  const dist = [0, 0, 0, 0, 0, 0];
  c.students.forEach(s => { if ((c.noGrade && c.noGrade[s.id]) || !R.counted(s)) return; const r = R.computeLower(c, s.id, null); if (r.total != null) vals.push(r.total);
    const ov = ovOf(c, s.id) && ovOf(c, s.id).grade, g = +ov || (r.suggestion && r.suggestion.grade); if (g >= 1 && g <= 6) dist[g - 1]++;
    if (R.studentWarnings(c, s.id, r).some(w => w.level === 'warn')) risk++; });
  return { avg: R.mean(vals), risk, unit: '', dist };
}
/* ---------- Datenschutz: Löschhinweis nach LDO § 14a Abs. 2 Satz 2 – Libretto löscht nie von selbst ----------
   Ein Kurs erscheint ab zwei Monaten vor der Frist (zwei Jahre nach Ende seines Schuljahres). „Noch behalten“ (z. B. wenn die Schule etwas anderes bestimmt hat)
   blendet den Hinweis für ein Jahr aus (c.ldoKeep = Datum). */
function ldoDue() {
  const t = todayISO(), soon = Cal.iso(Cal.add(new Date(t + 'T12:00'), 60));
  return D.courses.map(c => ({ c, r: R.retention(c) })).filter(x => x.r && x.r.due <= soon && !(x.c.ldoKeep && x.c.ldoKeep > t)).sort((a, b) => a.r.due.localeCompare(b.r.due));
}
function ldoSheet() {
  const t = todayISO();
  const rowsHTML = () => { const l = ldoDue(); return l.length ? l.map(({ c, r }) => `<div class="ldoRow"><span><b>${esc(c.name)} · ${esc(c.seminar ? 'W-Seminar' : c.subject || '')}</b><small>Schuljahr ${esc(r.year)} · ${r.due < t ? '<b class="late">Frist abgelaufen</b> am ' : 'zu löschen bis '}${wdate(r.due)}</small></span><span class="ldoBtns"><button type="button" class="mini" data-keep="${c.id}" title="Hinweis ein Jahr lang ausblenden – z. B. wenn die Schule eine längere Aufbewahrung bestimmt hat">Noch behalten</button><button type="button" class="mini dangerFill" data-ldodel="${c.id}">Löschen</button></span></div>`).join('') : '<p class="hint">Keine Kurse mehr, die gelöscht werden müssen.</p>'; };
  const { dlg } = sheet({ title: 'Alte Kurse löschen', ok: '', cancel: 'Schließen', body: `<p class="prose" style="margin-top:0">Nach <b>§ 14a Abs. 2 der Lehrerdienstordnung</b> sind eigene Aufzeichnungen über Schülerinnen und Schüler – also auch die Noten in Libretto – spätestens <b>zwei Jahre nach Ablauf des Schuljahres</b> zu löschen, sofern nichts anderes bestimmt ist. Libretto löscht nie von selbst.</p>
    <div id="ldoList">${rowsHTML()}</div>
    <p class="hint">Gelöschte Kurse bleiben 60 Tage im Papierkorb (unter „Sicherung“). Ältere Sicherungen auf diesem Computer und im Sicherungsordner enthalten sie, bis Libretto sie nach und nach ersetzt (etwa drei Monate). Ausdrucke und Dateien außerhalb von Libretto bitte selbst löschen.</p>` });
  dlg.addEventListener('click', async e => {
    const k = e.target.closest('[data-keep]'), x = e.target.closest('[data-ldodel]');
    if (k) { const c = D.courses.find(y => y.id === k.dataset.keep); if (!c) return; c.ldoKeep = Cal.iso(Cal.add(new Date(t + 'T12:00'), 365)); save(); toast('Hinweis für ein Jahr ausgeblendet'); }
    else if (x) { const c = D.courses.find(y => y.id === x.dataset.ldodel); if (!c) return;
      if (!(await ask(`Kurs <b>${esc(c.name + ' · ' + (c.subject || ''))}</b> mit allen Noten löschen? Er bleibt 60 Tage lang unter „Sicherung“ wiederherstellbar.`, 'Löschen', true))) return;
      toTrash('course', `Kurs ${c.name} · ${c.subject}`, c); D.courses = D.courses.filter(y => y.id !== c.id); if (UI.course === c.id) UI.course = D.courses[0] && D.courses[0].id; save(); toast('Kurs gelöscht – 60 Tage lang wiederherstellbar'); }
    else return;
    dlg.querySelector('#ldoList').innerHTML = rowsHTML(); render();
  });
}
function renderStart() {
  renderSide();
  const main = $('#main');
  if (!D.courses.length) { UI.tab = 'grades'; return render(); }
  const d = startData(), t = d.t, h = new Date().getHours();
  const hello = h < 5 ? 'Gute Nacht' : h < 11 ? 'Guten Morgen' : h < 17 ? 'Guten Tag' : 'Guten Abend';
  const lnName = x => esc(x.a.title || R.TYPES[x.a.type].label), cName = c => `${esc(c.name)} · ${esc(c.subject || '')}`;
  const inDays = iso => { const n = Math.round((new Date(iso + 'T12:00') - new Date(t + 'T12:00')) / 864e5); return n === 0 ? 'heute' : n === 1 ? 'morgen' : n < 7 ? 'in ' + n + ' Tagen' : n < 14 ? 'in ' + n + ' Tagen' : 'in ' + Math.round(n / 7) + ' Wochen'; };
  const bkBad = !!ST.lastLocalError || !ST.backupDir || !!ST.lastExternalError || !ST.lastExternal || Date.now() - ST.lastExternal > 7 * 864e5;
  const bkText = ST.lastLocalError ? 'Sicherung auf diesem Computer fehlgeschlagen' : !ST.backupDir ? 'Noch kein Sicherungsordner' : ST.lastExternalError ? 'Sicherungsordner nicht erreichbar' : 'Letzte Sicherung im Sicherungsordner ' + ago(ST.lastExternal);
  /* Zu erledigen */
  const todo = [];
  const since = iso => { const n = Math.round((new Date(t + 'T12:00') - new Date(iso + 'T12:00')) / 864e5); return n === 1 ? 'gestern' : 'vor ' + n + ' Tagen'; };
  d.missing.slice(0, 6).forEach(x => todo.push(`<button type="button" class="trow sRow" data-goto="${x.c.id}"><span class="d">${sdate(x.a.date)}<small>${since(x.a.date)}</small></span><span><b>${lnName(x)}</b><br><small>${cName(x.c)}</small></span><span class="pill ${x.late ? 'late' : 'part'}" ${x.due && x.none ? `title="§ 25 GSO: Rückgabe und Besprechung binnen ${x.a.type === 'sa' && x.due && Math.round((new Date(x.due) - new Date(x.a.date)) / 864e5) > 14 ? 'drei' : 'zwei'} Wochen"` : ''}>${x.none ? (x.late ? 'Rückgabefrist vorbei' : x.due ? 'Rückgabe bis ' + sdate(x.due) : 'Noten eintragen') : x.n === 1 ? '1 Note fehlt' : x.n + ' Noten fehlen'}</span></button>`));
  if (d.missing.length > 6) todo.push(`<p class="hint sMore">und ${d.missing.length - 6} weitere Leistungsnachweise ohne vollständige Noten</p>`);
  d.makeup.slice(0, 6).forEach(x => todo.push(`<button type="button" class="trow sRow" data-goto="${x.c.id}"><span class="d">${x.a.date ? sdate(x.a.date) : ''}</span><span><b>${esc(x.s.name)}</b><br><small>${cName(x.c)} · ${lnName(x)}</small></span><span class="pill info">Nachtermin</span></button>`));
  if (d.makeup.length > 6) todo.push(`<p class="hint sMore">und ${d.makeup.length - 6} weitere Nachtermine – alle unter „Kalender &amp; Termine“</p>`);
  d.xfer.forEach(x => todo.push(`<button type="button" class="trow sRow" data-xfer="${x.c.id}"><span class="d">Übertrag</span><span><b>${cName(x.c)}</b><br><small>${x.n === 1 ? '1 Leistungsnachweis' : x.n + ' Leistungsnachweise'} noch nicht (vollständig) ins Notenprogramm der Schule übertragen</small></span><span class="pill">Öffnen</span></button>`));
  if (d.conflicts) todo.push(`<button type="button" class="trow sRow" data-tabgo="dates"><span class="d">Termine</span><span><b>Termin prüfen (§ 22 GSO)</b><br><small>${d.conflicts === 1 ? 'Ein Termin kollidiert' : d.conflicts + ' Termine kollidieren'} mit einem anderen großen Leistungsnachweis der Klasse</small></span><span class="pill part">Kalender</span></button>`);
  /* Fristen fürs Notenmachen: zwei Wochen vorher unter „Zu erledigen“ */
  const dls = nextDeadlines(null, 28), dlCs = x => D.courses.filter(c => dlFor(x, c));
  const dlOpen = x => dlCs(x).reduce((k, c) => k + d.missing.filter(m => m.c.id === c.id).length + d.makeup.filter(m => m.c.id === c.id).length, 0);
  dls.filter(x => dlDays(x) <= 14 && dlCs(x).length).forEach(x => { const o = dlOpen(x), cs = dlCs(x);
    todo.push(`<button type="button" class="trow sRow dlRowS" data-act="deadlines"><span class="d">${sdate(dlDue(x))}<small>${dlWhen(dlDays(x))}</small></span><span><b>${esc(dlTitle(x))}</b><br><small>${esc(cs.slice(0, 4).map(c => c.name).join(', '))}${cs.length > 4 ? ' …' : ''}${o ? ` · noch offen: ${o} (fehlende Noten, Nachtermine)` : ''}</small></span><span class="pill ${dlDays(x) <= 7 ? 'late' : 'part'}">Frist</span></button>`); });
  { const old = ldoDue(); if (old.length) todo.push(`<button type="button" class="trow sRow" data-act="ldo"><span class="d">Datenschutz</span><span><b>${old.length === 1 ? '1 alter Kurs kann gelöscht werden' : old.length + ' alte Kurse können gelöscht werden'}</b><br><small>Noten sind spätestens zwei Jahre nach Ende des Schuljahres zu löschen (LDO § 14a Abs. 2)</small></span><span class="pill info">Ansehen</span></button>`); }
  if (bkBad) todo.push(`<button type="button" class="trow sRow" data-tabgo="backup"><span class="d">Sicherung</span><span><b>${esc(bkText)}</b><br><small>${ST.backupDir ? 'Deine Noten liegen sonst nur auf diesem Computer.' : 'USB-Stick oder Cloud-Ordner wählen – sonst liegen deine Noten nur auf diesem Computer.'}</small></span><span class="pill part">Einrichten</span></button>`);
  /* Als Nächstes: Leistungsnachweise und Schultermine der kommenden Wochen */
  const horizon = Cal.iso(Cal.add(new Date(t + 'T12:00'), 28));
  const coming = d.next.filter(x => x.a.date <= horizon).map(x => ({ date: x.a.date, html: `<button type="button" class="trow sRow" data-goto="${x.c.id}"><span class="d">${sdate(x.a.date)}<small>${inDays(x.a.date)}</small></span><span><b>${lnName(x)}</b><br><small>${cName(x.c)}</small></span>${R.isBig(x.a) ? '<span class="pill big">groß</span>' : ''}</button>` }))
    .concat(dls.filter(x => dlDays(x) > 14).map(x => ({ date: dlDue(x), html: `<button type="button" class="trow sRow" data-act="deadlines"><span class="d">${sdate(dlDue(x))}<small>${inDays(dlDue(x))}</small></span><span><b>${esc(dlTitle(x))}</b><br><small>${DL_G[dlG(x)]}</small></span><span class="pill info">Frist</span></button>` })))
    .concat(d.events.filter(e => e.from <= horizon).slice(0, 8).map(e => ({ date: e.from < t ? t : e.from, html: `<div class="trow sRow ev"><span class="d">${sdate(e.from)}<small>${e.from <= t ? 'läuft' : inDays(e.from)}</small></span><span>${esc(e.title)}${e.time ? `<br><small>${esc(e.time)}</small>` : ''}</span><span class="pill">Schule</span></div>` })))
    .sort((a, b) => a.date.localeCompare(b.date)).slice(0, 9);
  const later = d.next.filter(x => x.a.date > horizon).length;
  /* Kurse */
  const card = c => { const st = courseStats(c), nMk = d.makeup.filter(x => x.c.id === c.id).length, nMi = d.missing.filter(x => x.c.id === c.id).length;
    return `<button type="button" class="sCard" data-goto="${c.id}" style="--hue:var(${hueOf(c.subject)})"><span class="sCardTop"><b>${esc(c.name)}<em class="sBadge">${esc(courseBadge(c))}</em></b><span>${esc(c.seminar ? 'W-Seminar · ' + semLeit(c) : isPSem(c) ? 'P-Seminar · ' + c.subject : c.subject || '')}</span></span>
      <span class="sAvg">${st.avg == null ? '–' : fmt(st.avg, 2)}<small>${st.avg == null ? 'noch keine Noten' : 'Ø ' + (st.term ? st.term : 'Klasse')}${st.unit ? ' · Punkte' : ''}</small></span>
      ${distBar(st.dist, st.unit)}
      <span class="sMeta">${c.students.length} Schüler · ${c.assessments.length} LN</span>
      <span class="sTags">${st.risk ? `<i class="warn">${st.risk} gefährdet</i>` : ''}${nMi ? `<i>${nMi === 1 ? '1 LN offen' : nMi + ' LN offen'}</i>` : ''}${nMk ? `<i class="info">${nMk === 1 ? '1 Nachtermin' : nMk + ' Nachtermine'}</i>` : ''}</span></button>`; };
  const grpsUsed = COURSE_GROUPS.filter(([k]) => D.courses.some(c => courseGroup(c) === k));
  const cards = grpsUsed.map(([k, g]) => `${grpsUsed.length > 1 ? `<div class="sGrp">${g}</div>` : ''}<div class="sCards">${D.courses.filter(c => courseGroup(c) === k).sort(courseCmp).map(card).join('')}</div>`).join('');
  const lastC = course();
  const top = [betaNotice(), updateNotice()].filter(Boolean).join('');
  main.innerHTML = `<div class="startPage">
    <header class="sHead"><div><h1>${hello}</h1><p>${esc(wdate(t))} · Schuljahr ${esc(D.settings.year || '')}</p></div>
      <div class="sHeadActs">${lastC ? `<button type="button" class="mini" data-goto="${lastC.id}" title="Zuletzt geöffneter Kurs">Weiter in ${esc(lastC.name)}</button>` : ''}<button type="button" class="mini accent" id="sNewLN">+ Leistungsnachweis</button></div></header>
    ${top ? `<div class="notices">${top}</div>` : ''}
    <div class="sCols">
      <section class="panel glass"><div class="phead"><h2 class="ptitle">Zu erledigen</h2><span class="count">${d.missing.length + d.makeup.length + d.xfer.length + (d.conflicts ? 1 : 0) + (bkBad ? 1 : 0) + (ldoDue().length ? 1 : 0) + dls.filter(x => dlDays(x) <= 14 && dlCs(x).length).length}</span></div>
        <div class="tlist">${todo.length ? todo.join('') : '<div class="sDone"><b>Alles erledigt.</b><span>Keine fehlenden Noten, keine offenen Nachtermine, Sicherung aktuell.</span></div>'}</div></section>
      <section class="panel glass"><div class="phead"><h2 class="ptitle">Als Nächstes</h2><span class="count">${coming.length}</span></div>
        <div class="tlist">${coming.length ? coming.map(x => x.html).join('') : '<p class="hint" style="margin:6px 10px">In den nächsten vier Wochen steht nichts an. Geplante Leistungsnachweise trägst du mit Datum ein – dann erscheinen sie hier und im Kalender.</p>'}</div>
        ${dlList().length ? '' : `<p class="note">Bis wann müssen die Noten stehen? <button type="button" class="linkbtn" data-act="deadlines">Fristen fürs Notenmachen eintragen</button> (Zwischenbericht, Halbjahr, Q12/Q13, Jahreszeugnis) – oder aus den Schulterminen übernehmen.</p>`}
        ${later ? `<p class="note">${later === 1 ? 'Ein weiterer Leistungsnachweis' : later + ' weitere Leistungsnachweise'} später im Schuljahr – siehe <button type="button" class="linkbtn" data-tabgo="dates">Kalender &amp; Termine</button>.</p>` : ''}</section>
    </div>
    <div class="sHeadline">Meine Klassen und Kurse</div>
    ${cards}
    <p class="note sFoot">${bkBad ? '' : esc(bkText) + ' · '}Die Übersicht zeigt nur an – geändert wird hier nichts. Was beim Öffnen erscheint, stellst du unter Einstellungen → Allgemein ein.</p></div>`;
  $$('[data-goto]', main).forEach(b => b.onclick = () => pickCourse(b.dataset.goto));
  $$('[data-xfer]', main).forEach(b => b.onclick = () => { pickCourse(b.dataset.xfer); transferSheet(course()); });
  $$('[data-tabgo]', main).forEach(b => b.onclick = () => { UI.tab = b.dataset.tabgo; render(); });
  $('#sNewLN').onclick = () => { if (D.courses.length === 1) { pickCourse(D.courses[0].id); return assessmentSheet(course()); }
    /* mehrere Kurse: erst wählen, für welchen */
    sheet({ title: 'Leistungsnachweis – für welchen Kurs?', ok: '', cancel: 'Abbrechen', body: `<div class="pickList">${D.courses.slice().sort(courseCmp).map(c => `<button type="button" class="pickRow" data-pick="${c.id}" style="--hue:var(${hueOf(c.subject)})"><b>${esc(c.name)}</b><span>${esc(c.subject || '')}</span></button>`).join('')}</div>`,
      onOpen: (dl, close) => $$('[data-pick]', dl).forEach(b => b.onclick = () => { close(); pickCourse(b.dataset.pick); assessmentSheet(course()); }) }); };
}

/* ======================================================================
   Sicherung
   ====================================================================== */
const ago = ms => { if (!ms) return 'noch nie'; const m = Math.round((Date.now() - ms) / 6e4); if (m < 1) return 'gerade eben'; if (m < 60) return `vor ${m} Min.`; const h = Math.round(m / 60); if (h < 24) return `vor ${h} Std.`; return `vor ${Math.round(h / 24)} Tagen`; };
async function renderBackup() {
  ST = await N.status();
  const list = await N.listBackups();
  const extOk = ST.backupDir && !ST.lastExternalError && ST.lastExternal && Date.now() - ST.lastExternal < 7 * 864e5;
  $('#main').innerHTML = `<header class="sHead pHead"><div><h1>Sicherung</h1><p>Verschlüsselt auf diesem Computer und in deinem Sicherungsordner</p></div></header>
    <div class="notices"><div class="notice"><div class="grow"><b>Wichtig:</b> ${esc(Print.DISCLAIMER)} Libretto sichert automatisch – sichere aber zusätzlich selbst, z. B. regelmäßig auf einen USB-Stick, und drucke wichtige Übersichten aus.</div></div></div>
    <div class="bkStat"><div class="stat glass okc"><div class="v">${ago(ST.lastLocal)}</div><div class="l">Letzte Sicherung auf diesem Computer</div></div>
      <div class="stat glass ${extOk ? 'okc' : 'warnc'}"><div class="v">${ST.backupDir ? ago(ST.lastExternal) : 'kein Ordner'}</div><div class="l">Letzte Sicherung im Sicherungsordner${ST.lastExternalError ? ' · ' + esc(ST.lastExternalError) : ''}</div></div>
      <div class="stat glass okc"><div class="v">AES-256</div><div class="l">Verschlüsselung · Sperre nach ${D.settings.autoLock ? D.settings.autoLock + ' Min.' : '–'}</div></div></div>
    <div class="twoCol">
      <section class="panel glass"><h2 class="ptitle">Automatische Sicherung</h2>
        <p class="prose" style="margin-top:0">Libretto sichert beim Sperren, beim Beenden und während der Arbeit alle 15 Minuten. Aufbewahrt werden die letzten 30 Sicherungen und je eine pro Tag für 90 Tage – alles verschlüsselt.</p>
        <div class="rows"><div class="row"><span><b>Sicherungsordner</b><br><small class="hint">${ST.backupDir ? esc(ST.backupDir) : 'z. B. USB-Stick, iCloud Drive, OneDrive'}</small></span><button class="mini accent" id="bkPick">${ST.backupDir ? 'Ändern' : 'Ordner wählen'}</button>${ST.backupDir ? '<button class="mini" id="bkOpenExt">Zeigen</button>' : ''}</div>
          <div class="row"><span><b>Auf diesem Computer</b><br><small class="hint">immer aktiv</small></span><button class="mini" id="bkOpenLoc">Zeigen</button></div></div>
        <button class="go" id="bkNow">Jetzt sichern</button>
        <button class="go secondary" id="bkRestore">Sicherung wiederherstellen …</button>
        <p class="note">Zum Umzug auf einen neuen Computer: Libretto dort installieren, beim Start „Sicherung wiederherstellen“ wählen und eine .vault-Datei aus dem Sicherungsordner öffnen.</p></section>
      <section class="panel glass"><div class="phead"><h2 class="ptitle">Vorhandene Sicherungen</h2><span class="count">${list.length}</span></div>
        <div class="bkList">${list.slice(0, 60).map(b => `<div class="r"><span>${new Date(b.time).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })}<br><small>${esc(b.where)}</small></span><small>${Math.max(1, Math.round(b.size / 1024))} KB</small></div>`).join('') || '<div class="r"><span class="hint">Noch keine</span></div>'}</div>
        <h2 class="ptitle" style="margin-top:22px">Zugang</h2>
        <div class="panelBtns"><button class="mini" id="pwChange">Passwort ändern …</button><button class="mini" id="codeNew">Neuen Notfallschlüssel erstellen …</button></div>
        <p class="note">Ohne Passwort und Notfallschlüssel lassen sich die Daten nicht wiederherstellen – auch nicht von theis. So bleibt sichergestellt, dass niemand anderes die Noten lesen kann.</p></section>
    </div>
    ${(D.trash || []).length ? `<section class="panel glass" style="margin-top:16px"><div class="phead"><h2 class="ptitle">Zuletzt gelöscht</h2><span class="count">${D.trash.length}</span></div>
      <div class="tlist">${D.trash.map(x => `<div class="trow"><span class="d">${new Date(x.when).toLocaleDateString('de-DE')}</span><span>${esc(x.label)}<br><small>${{ course: 'Kurs mit allen Noten', snapshot: 'wird als eigener Kurs wiederhergestellt – nichts wird überschrieben', assessment: 'Leistungsnachweis mit allen Noten', termin: 'Betreuungstermin (W-Seminar)' }[x.kind] || ''}</small></span><button class="mini" data-untrash="${x.id}">Wiederherstellen</button></div>`).join('')}</div>
      <p class="note">Gelöschtes bleibt ${TRASH_DAYS} Tage hier und kann mit einem Klick zurückgeholt werden; danach ist es nur noch in älteren Sicherungen enthalten.</p></section>` : ''}`;
  $$('[data-untrash]').forEach(b => b.onclick = () => { if (READONLY) return; const x = (D.trash || []).find(y => y.id === b.dataset.untrash); if (x && restoreTrash(x)) { toast('Wiederhergestellt'); renderBackup(); } });
  $('#bkPick').onclick = async () => { ST = await N.chooseBackupDir(); renderBackup(); };
  if ($('#bkOpenExt')) $('#bkOpenExt').onclick = () => N.openBackupDir('external');
  $('#bkOpenLoc').onclick = () => N.openBackupDir('local');
  $('#bkNow').onclick = async () => { await flush(); const r = await N.backupNow(); toast(bkMsg(r)); renderBackup(); };
  $('#bkRestore').onclick = async () => { if (await ask('Eine Sicherung ersetzt den aktuellen Stand. Der aktuelle Stand wird vorher noch einmal gesichert.', 'Sicherung wählen …')) { await flush(); restoreFlow(false); } };
  $('#pwChange').onclick = () => sheet({ title: 'Passwort ändern', small: true, allowRO: true, body: `${field('Bisheriges Passwort', '<input type="password" id="o">')}${field('Neues Passwort (mind. 8 Zeichen)', '<input type="password" id="n1">')}${field('Wiederholen', '<input type="password" id="n2">')}<p class="gateErr" id="e"></p><p class="hint">Ältere Sicherungen behalten ihr damaliges Passwort.</p>`,
    onOk: async d => { const o = d.querySelector('#o').value, a = d.querySelector('#n1').value, b = d.querySelector('#n2').value; const e = d.querySelector('#e');
      if (a.length < 8) { e.textContent = 'Bitte mindestens 8 Zeichen.'; return false; } if (a !== b) { e.textContent = 'Stimmt nicht überein.'; return false; }
      await flush(); const r = await N.changePassword(o, a); if (!r.ok) { e.textContent = r.error; return false; } toast('Passwort geändert'); renderBackup(); } });
  $('#codeNew').onclick = () => sheet({ title: 'Neuer Notfallschlüssel', small: true, ok: 'Erstellen', allowRO: true, body: `<p class="hint" style="margin-top:0">Der alte Notfallschlüssel gilt danach nicht mehr (für ältere Sicherungen aber weiterhin).</p>${field('Passwort zur Bestätigung', '<input type="password" id="p">')}<p class="gateErr" id="e"></p>`,
    onOk: async d => { await flush(); const r = await N.newCode(d.querySelector('#p').value); if (!r.ok) { d.querySelector('#e').textContent = r.error; return false; }
      sheet({ title: 'Dein neuer Notfallschlüssel', ok: '', cancel: 'Fertig', body: `<div class="code">${esc(r.code)}</div><div class="panelBtns" style="justify-content:center"><button type="button" class="mini accent" id="cp">Als PDF speichern / drucken</button></div>`, onOpen: dd => dd.querySelector('#cp').onclick = () => saveCodePdf(r.code) }); } });
}

/* ======================================================================
   Einstellungen & Hilfe
   ====================================================================== */
/* ======================================================================
   Klassen austauschen (theis-Klassen) – gemeinsames Format von Voce, Libretto, Gruppo
   Nichts wird geändert, bevor im Abgleich „Übernehmen“ gedrückt wird; vorher entsteht automatisch eine Sicherung.
   ====================================================================== */
const KL = { plan: [], meta: null };
const klCls = v => String(Importer.normCls(v) || v || '').trim().toUpperCase();
const klAway = (c, sid) => { const a = awayOf(c, sid); return a ? { from: a.from || '', to: a.to || '', reason: a.reason || '' } : null; };
const klWrap = (c, s) => ({ id: s.id, xid: s.xid || null, last: s.last || '', first: s.first || '', g: s.g || '', cls: klCls(s.cls), away: klAway(c, s.id) });
const klName = s => [s.last, s.first].filter(Boolean).join(', ');
function klassenSheet() {
  sheet({ title: 'Klassen austauschen', small: true, ok: '', cancel: 'Schließen', body: `<p class="prose" style="margin-top:0">Klassen und Kurse mit den anderen theis-Apps austauschen (Voce, später Gruppo) – einmal anlegen, überall nutzen. <b>Nur Namen</b>, keine Noten.</p>
    <div class="panelBtns" style="flex-direction:column;align-items:stretch;gap:8px"><button type="button" class="mini accent" id="klExp">Klassen exportieren …</button>${READONLY ? '' : '<button type="button" class="mini" id="klImp">Klassen einlesen und abgleichen …</button>'}</div>
    <p class="hint">Beim Einlesen siehst du erst eine Liste: <b>neu</b>, <b>geändert</b>, <b>nicht mehr in der Datei</b>. Es wird nur übernommen, was angehakt ist. Kurse aus mehreren Klassen (z. B. 8AB) bleiben dabei unverändert – die Klasse je Person steht mit in der Datei.</p>`,
    onOpen: (d, close) => { d.querySelector('#klExp').onclick = () => { close(); klExport(); }; const im = d.querySelector('#klImp'); if (im) im.onclick = () => { close(); klImport(); }; } });
}
async function klBuild() {
  const rnd = () => TheisKlassen.rid('k-');
  const classes = D.courses.map(c => { c.xid = c.xid || rnd();
    return { id: c.xid, name: c.name, subject: c.subject, grade: String(c.grade || ''), students: c.students.map(s => { s.xid = s.xid || TheisKlassen.rid('s-'); return { id: s.xid, last: s.last || '', first: s.first || '', g: s.g || '', cls: s.cls || '', away: klAway(c, s.id) || undefined, rest: s.ext || {} }; }) }; });
  save();
  const v = await N.version();
  return TheisKlassen.build({ app: 'Libretto ' + v, schoolYear: D.settings.year || '', classes });
}
async function klExport() {
  if (!D.courses.length) return toast('Noch keine Kurse vorhanden');
  const data = await klBuild();
  const r = await N.saveFile(`theis-Klassen-${todayISO()}.json`, new TextEncoder().encode(JSON.stringify(data, null, 1)), 'json');
  if (r && r.ok) toast('Klassen exportiert');
}
function klImport() {
  if (window.__librettoDemo) return toast('Das Einlesen von Dateien gibt es in der installierten App.', 4000);
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = async () => {
    const f = inp.files[0]; if (!f) return;
    let txt; try { txt = await f.text(); } catch (e) { return toast('Die Datei ist nicht lesbar.', 4500); }
    let raw = null; try { raw = JSON.parse(txt); } catch (e) {}
    if (raw && !raw.format && (raw.cards || raw.exams || raw.classes)) return toast('Das ist eine Sicherung einer anderen App, keine Klassen-Datei. Bitte in der App „Klassen exportieren“ wählen.', 6500);
    let d; try { d = TheisKlassen.parse(txt); } catch (e) { return toast(e.message, 4500); }
    klPlan(d);
  };
  inp.click();
}
function klMatch(c) {
  const byX = c.id ? D.courses.filter(k => k.xid === c.id) : [];
  if (byX.length === 1) return byX[0];
  const nm = D.courses.filter(k => TheisKlassen.norm(k.name) === TheisKlassen.norm(c.name));
  const sub = c.subject ? nm.filter(k => TheisKlassen.norm(k.subject) === TheisKlassen.norm(c.subject)) : nm;
  return sub.length === 1 ? sub[0] : null;   /* uneindeutig → lieber als neuer Kurs anbieten als in den falschen zu schreiben */
}
function klPlan(d) {
  KL.meta = d;
  KL.plan = d.classes.map(c => {
    const inc = c.students.map(s => ({ ...s, cls: klCls(s.cls) }));
    const course = klMatch(c);
    if (!course) return { c: { ...c, students: inc }, isNew: true, on: true };
    const df = TheisKlassen.diff(course.students.filter(s => !s.guest).map(s => klWrap(course, s)), inc);   /* Gäste stehen nicht auf der Klassenliste – sie bleiben unberührt */
    df.added.forEach(x => x.on = true); df.changed.forEach(x => x.on = true); df.removed.forEach(x => x.on = false);
    return { c: { ...c, students: inc }, course, d: df };
  });
  if (!KL.plan.length) return toast('Die Datei enthält keine Klassen');
  const none = KL.plan.every(p => !p.isNew && !p.d.added.length && !p.d.removed.length && !(p.d.ambiguous || []).length && !p.d.changed.some(x => !x.silent));
  if (none) { klApply(true); return toast('Alles schon auf dem gleichen Stand – nichts zu ändern'); }
  klDialog();
}
const klFieldTxt = x => x.fields.map(f => f === 'name' ? `Name: ${klName(x.cur)} → ${klName(x.inc)}` : f === 'g' ? `Geschlecht: ${x.cur.g || '–'} → ${x.inc.g || '–'}` : f === 'cls' ? `Klasse: ${x.cur.cls || '–'} → ${x.inc.cls || '–'}` : 'Abwesenheit geändert').join(' · ');
const klHasGrades = (c, sid) => c.assessments.some(a => a.results && a.results[sid]) || (c.entries || []).some(e => e.sid === sid) || semHasData(c, sid);
function klDialog() {
  const m = KL.meta;
  const cards = KL.plan.map((p, pi) => {
    if (p.isNew) return `<div class="klCard"><label class="klHead"><input type="checkbox" data-kn="${pi}" ${p.on ? 'checked' : ''}><span><b>${esc(p.c.name)}</b>${p.c.subject ? ' · ' + esc(p.c.subject) : ''} <small>neuer Kurs · ${p.c.students.length} Namen</small></span></label><p class="hint" style="margin:4px 0 0 28px">Nach „Übernehmen“ öffnet sich „Neuer Kurs“ mit diesen Namen – dort ergänzt du Fach, Stufe und Wochenstunden.</p></div>`;
    const d = p.d, real = d.changed.filter(x => !x.silent);
    const sec = (t, kind, arr, txt) => arr.length ? `<div class="klSec"><h4>${t} <small>${arr.length}</small></h4>${arr.map((x, i) => `<label class="klRow"><input type="checkbox" data-pi="${pi}" data-kind="${kind}" data-i="${i}" ${x.on ? 'checked' : ''}><span>${esc(txt(x))}</span></label>`).join('')}</div>` : '';
    return `<div class="klCard"><div class="klHead"><span><b>${esc(p.course.name)}</b> · ${esc(p.course.subject)} <small>${d.same} unverändert</small></span></div>
      ${sec('Neu', 'add', d.added, x => klName(x.inc) + (x.inc.cls ? ` (${x.inc.cls})` : ''))}
      ${sec('Geändert', 'chg', real, x => klName(x.cur) + ' – ' + klFieldTxt(x))}
      ${sec('Nicht mehr in der Datei', 'rem', d.removed, x => klName(x.cur) + (klHasGrades(p.course, x.cur.id) ? ' – hat eingetragene Noten' : ''))}
      ${(d.ambiguous || []).length ? `<div class="klSec"><h4>Nicht eindeutig – bleibt unverändert <small>${d.ambiguous.length}</small></h4>${d.ambiguous.map(x => `<div class="klRow"><span>${esc(klName(x.cur[0]))}: ${x.cur.length}× im Kurs${x.cur.some(s => s.cls) ? ' (' + x.cur.map(s => esc(s.cls || '–')).join(', ') + ')' : ''}, ${x.inc.length}× in der Datei${x.inc.some(s => s.cls) ? ' (' + x.inc.map(s => esc(s.cls || '–')).join(', ') + ')' : ''}</span></div>`).join('')}<p class="hint" style="margin:6px 0 0">Gleiche Namen ohne eindeutige Klasse ordnet Libretto nicht selbst zu – sonst könnten Noten bei der falschen Person landen. Bitte bei Bedarf von Hand anpassen (Schülerblatt).</p></div>` : ''}
      ${!d.added.length && !real.length && !d.removed.length && !(d.ambiguous || []).length ? '<p class="hint" style="margin:6px 0 0">Keine Unterschiede.</p>' : ''}
      ${d.removed.length ? '<p class="hint" style="margin:6px 0 0">„Nicht mehr in der Datei“: Nur wenn du ein Häkchen setzt, wird die Person aus dem Kurs entfernt – mit ihren Noten. Ohne Häkchen bleibt alles bestehen.</p>' : ''}</div>`;
  }).join('');
  sheet({ title: 'Klassen abgleichen', wide: true, ok: 'Übernehmen', body: `<p class="hint" style="margin:0 0 8px">Datei aus ${esc(m.app || 'einer theis-App')}${m.exported ? ' vom ' + esc(new Date(m.exported).toLocaleDateString('de-DE')) : ''}${m.schoolYear ? ' · Schuljahr ' + esc(m.schoolYear) : ''}. Nichts wird geändert, bevor du „Übernehmen“ drückst; vorher legt Libretto eine Sicherung an.</p><div id="klPlan">${cards}</div>`,
    onOpen: d => {
      d.querySelectorAll('input[data-kn]').forEach(c => c.onchange = () => { KL.plan[+c.dataset.kn].on = c.checked; });
      d.querySelectorAll('input[data-kind]').forEach(c => c.onchange = () => { const p = KL.plan[+c.dataset.pi]; const arr = { add: p.d.added, chg: p.d.changed.filter(x => !x.silent), rem: p.d.removed }[c.dataset.kind]; arr[+c.dataset.i].on = c.checked; });
    },
    onOk: async () => {
      const dropping = KL.plan.filter(p => !p.isNew).flatMap(p => p.d.removed.filter(x => x.on && klHasGrades(p.course, x.cur.id)).map(x => x.cur.name || klName(x.cur)));
      if (dropping.length && !(await ask(`${dropping.length} Person(en) mit eingetragenen Noten würden entfernt (${dropping.map(esc).join('; ')}). Die Noten gehen dabei verloren.`, 'Entfernen', true))) return false;
      await klApply(false); return true;
    } });
}
async function klApply(silent) {
  const touches = KL.plan.some(p => p.isNew ? p.on : (p.d.added.some(x => x.on) || p.d.removed.some(x => x.on) || p.d.changed.some(x => !x.silent && x.on)));
  if (touches) { /* Sicherheitskopie vor jeder echten Änderung */
    await flush(); const b = await N.backupNow();
    if (!b || !b.ok) { if (!(await ask('Die automatische Sicherung vor dem Abgleich ist fehlgeschlagen. Trotzdem fortfahren?', 'Trotzdem übernehmen', true))) return; }
  }
  const sum = { nc: 0, na: 0, nch: 0, nr: 0 }, fresh = [];
  for (const p of KL.plan) {
    if (p.isNew) { if (p.on) fresh.push(p.c); continue; }
    const c = p.course; if (p.c.id && !c.xid) c.xid = p.c.id;
    if (p.d.removed.some(x => x.on)) toTrash('snapshot', `${c.name} · ${c.subject}: Stand vor dem Klassen-Abgleich`, c);
    const rem = new Set();
    for (const x of p.d.changed) {
      const s = c.students.find(o => o.id === x.cur.id); if (!s) continue;
      if (x.inc.id && !s.xid && (x.silent || x.on)) s.xid = x.inc.id;   /* Kennung nur bei eindeutiger bzw. bestätigter Zuordnung */
      if (x.silent || !x.on) continue;
      if (x.fields.includes('name')) { s.last = x.inc.last; s.first = x.inc.first; s.name = fullName(s); }
      if (x.fields.includes('g')) { if (x.inc.g) s.g = x.inc.g; else delete s.g; }
      if (x.fields.includes('cls')) { if (x.inc.cls) s.cls = Importer.normCls(x.inc.cls) || x.inc.cls; else delete s.cls; }
      if (x.fields.includes('away')) { c.away = c.away || {}; if (x.inc.away) c.away[s.id] = { ...x.inc.away }; else delete c.away[s.id]; }
      sum.nch++;
    }
    for (const x of p.d.removed) if (x.on) rem.add(x.cur.id);
    if (rem.size) {
      c.students = c.students.filter(s => !rem.has(s.id)); c.entries = (c.entries || []).filter(e => !rem.has(e.sid));
      const del = (o, id) => { if (o && typeof o === 'object') delete o[id]; };
      rem.forEach(id => { ['away', 'overrides', 'ovHalf', 'notes', 'seminarPaper', 'noGrade'].forEach(k => del(c[k], id)); semDrop(c, id); });
      c.assessments.forEach(a => { if (a.results) rem.forEach(id => delete a.results[id]); });
      Object.keys(c.xfer || {}).forEach(k => { const sid = k.startsWith('e|') ? null : k.split('|')[1]; if (sid && rem.has(sid)) delete c.xfer[k]; });
      sum.nr += rem.size;
    }
    for (const x of p.d.added) if (x.on) {
      const st = { id: uid(), last: x.inc.last, first: x.inc.first }; st.name = fullName(st);
      if (x.inc.id) st.xid = x.inc.id; if (x.inc.cls) st.cls = Importer.normCls(x.inc.cls) || x.inc.cls; if (x.inc.g) st.g = x.inc.g; if (x.inc.rest && Object.keys(x.inc.rest).length) st.ext = x.inc.rest;
      c.students.push(st); if (x.inc.away) { c.away = c.away || {}; c.away[st.id] = { ...x.inc.away }; } sum.na++;
    }
    if (rem.size || p.d.added.some(x => x.on)) sortList(c.students);
  }
  save(); render();
  if (silent) return;
  toast(`Übernommen: ${sum.na} neu, ${sum.nch} geändert, ${sum.nr} entfernt${fresh.length ? ' · ' + fresh.length + ' neuer Kurs folgt' : ''}`, 4000);
  /* neue Kurse: nacheinander in „Neuer Kurs“ öffnen, damit Fach und Stufe ergänzt werden können */
  const queue = fresh.slice();
  const openNext = () => { const k = queue.shift(); if (!k) return; courseSheet(null, { fields: { name: k.name, subject: k.subject || '', grade: +k.grade || 9, xid: k.id || TheisKlassen.rid('k-') }, students: k.students.map(s => { const st = { id: uid(), last: s.last, first: s.first, xid: s.id || TheisKlassen.rid('s-') }; st.name = fullName(st); if (s.cls) st.cls = Importer.normCls(s.cls) || s.cls; if (s.g) st.g = s.g; if (s.rest && Object.keys(s.rest).length) st.ext = s.rest; return st; }), next: () => setTimeout(openNext, 50) }); };
  setTimeout(openNext, 300);
}

async function openLicenses() {
  let txt = 'Lizenzen werden in der Desktop-App angezeigt.';
  try { if (N && N.licenses) txt = await N.licenses(); } catch (e) {}
  sheet({ title: 'Lizenzen', wide: true, ok: '', cancel: 'Fertig', body: `<pre class="lic">${esc(txt)}</pre><div class="linkrow"><button type="button" class="mini" id="licChromium">Lizenzen der Chromium-Komponenten öffnen</button></div>`,
    onOpen: d => { d.querySelector('#licChromium').onclick = () => { if (N && N.openDoc) N.openDoc('chromium'); }; } });
}
/* Effekte reduzieren und Textgröße (nur dieses Gerät) */
function applyFx(fx) { document.documentElement.classList.toggle('lowfx', fx === 'low'); }
function applyZoom(z) { try { N.zoom(z || 1).catch(() => {}); } catch (e) {} }
async function settingsSheet(tab) {
  const s = D.settings, v = await N.version();
  const skin = ST.skin && SKINS.some(x => x[0] === ST.skin) ? ST.skin : 'standard', mode = ST.mode || 'auto', font = ST.font || 'standard';
  const IC = {
    gen: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>',
    grade: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4M16 3v4M4 10h16M9 15l2 2 4-4"/></svg>',
    look: '<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.9 1.8-1.8 0-1.3-1-1.6-1-2.7 0-1 .8-1.6 1.8-1.6H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10.5" cy="7.2" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/></svg>',
    sec: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    about: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>' };
  const TABS = [['gen', 'Allgemein', 'Name, Schule, Start'], ['grade', 'Termine', 'Stichtag, Fristen, Schultermine'], ['look', 'Aussehen', 'Farben, Schrift, Größe'], ['sec', 'Sicherheit', 'Sperre, Updates, Sicherung'], ['about', 'Über', 'Version, Hilfe, Quellen']];
  const cur = TABS.some(t => t[0] === tab) ? tab : (settingsSheet.last || 'gen');
  const row = (title, sub, ctl) => `<div class="setRow"><div><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</div>${ctl}</div>`;
  const card = (title, inner, hint) => `<section class="setCard">${title ? `<h4>${title}</h4>` : ''}${inner}${hint ? `<p class="setHint">${hint}</p>` : ''}</section>`;
  const seg = (id, attr, items, on) => `<div class="seg modePick" id="${id}">${items.map(([k, l]) => `<button type="button" data-${attr}="${k}" aria-pressed="${String(on) === String(k)}">${l}</button>`).join('')}</div>`;
  const nd = nextDeadlines(null)[0];
  const zoom = ST.zoom || 1, cv = courseViewMode();
  const { dlg } = sheet({ title: 'Einstellungen', wide: true, body: `<div class="setTwo">
    <nav class="setNav" role="tablist">${TABS.map(([k, l, sub]) => `<button type="button" role="tab" data-stab="${k}" aria-pressed="${k === cur}"><i>${IC[k]}</i><span><b>${l}</b><small>${sub}</small></span></button>`).join('')}
      <div class="setNavFoot"><img src="icon.png" alt=""><span>Libretto ${esc(v)}</span></div></nav>
    <div class="setMain">
    <div class="setPane" data-pane="gen" ${cur === 'gen' ? '' : 'hidden'}>
      ${card('Für deine Ausdrucke', `<div class="grid2">${field('Name der Lehrkraft', `<input type="text" id="sT" value="${esc(s.teacher)}" placeholder="z. B. J. Muster">`)}${field('Schule (optional)', `<input type="text" id="sS" value="${esc(s.school)}" placeholder="z. B. Gymnasium Musterstadt">`)}</div>`, 'Name und Schule stehen oben rechts auf jedem Ausdruck.')}
      ${card('Schuljahr', `<div class="grid2">${field('Schuljahr', `<input type="text" id="sY" value="${esc(s.year)}">`)}<div></div></div>`)}
      ${card('Beim Öffnen zeigen', seg('sStart', 'start', [['start', 'Übersicht'], ['grades', 'Letzter Kurs']], ST.startTab === 'grades' ? 'grades' : 'start'), 'Die Übersicht zeigt, wo Noten fehlen, welche Nachtermine offen sind und was als Nächstes ansteht. Gilt für diesen Computer.')}
    </div>
    <div class="setPane" data-pane="grade" ${cur === 'grade' ? '' : 'hidden'}>
      ${card('Stichtag', `<div class="grid2">${field('Stichtag Zwischenzeugnis / Notenbild', `<input type="date" id="sH" value="${esc(s.half1End)}">`)}<div></div></div>`, 'Steuert die Ansicht „Stand Zwischenzeugnis“ (§ 40 GSO): Es zählen nur Noten bis zu diesem Tag.')}
      ${card('Fristen fürs Notenmachen', row(dlList().length ? dlList().length + ' Fristen eingetragen' : 'Noch keine Fristen', dlList().length ? (nd ? 'Nächste: ' + esc(dlTitle(nd) + ' – ' + fdate(dlDue(nd))) : 'keine mehr in diesem Schuljahr') : 'Zwischenbericht oder Zwischenzeugnis, Halbjahr, Q12, Q13, Jahreszeugnis – je Schule verschieden', '<button type="button" class="mini accent" id="sDl">Fristen …</button>'), 'Libretto erinnert eine Woche vorher in der Übersicht und im Kurs.')}
      ${card('Schultermine', `${row((D.events || []).length ? (D.events.length === 1 ? '1 Schultermin' : D.events.length + ' Schultermine') + (D.settings.evFeed ? ' · abonniert' : ' · aus einer Datei') : 'Noch keine Schultermine', D.settings.evFeed ? esc('Abo: ' + feedHost(D.settings.evFeed.url)) : 'Erscheinen grau im Kalender und in der Übersicht; erkannte Fristen bietet Libretto zum Übernehmen an.', '')}
        <div class="setBtns"><button type="button" class="mini" id="sEvImp">Aus Datei einlesen …</button><button type="button" class="mini" id="sEvFeed">${D.settings.evFeed ? 'Abo-Link ändern …' : 'Schulkalender abonnieren …'}</button>${D.settings.evFeed ? '<button type="button" class="mini" id="sEvNow">Jetzt aktualisieren</button>' : ''}<button type="button" class="mini linkish" id="sEvHow">So geht’s</button></div>`, 'Datei: CSV aus dem Infoportal oder ICS. Abo: Link zum Schulkalender (ICS oder webcal) – Libretto holt neue Termine dann selbst.')}
    </div>
    <div class="setPane" data-pane="look" ${cur === 'look' ? '' : 'hidden'}>
      ${card('Farbwelt', `<div class="pillPick">${SKINS.map(([k, l]) => `<button type="button" class="pill${skin === k ? ' on' : ''}" data-sk="${k}" aria-pressed="${skin === k}"><span class="pillSw">${(() => { const [b0, c1, c2] = SKIN_SW[k] || ['#eee', '#888', '#888']; return `<i style="background:conic-gradient(${c1} 0 50%, ${c2 === c1 ? b0 : c2} 0 100%)"></i>`; })()}</span>${esc(l)}</button>`).join('')}</div>`)}
      ${card('Helligkeit', seg('sMode', 'mode', [['auto', 'Automatisch'], ['light', 'Hell'], ['dark', 'Dunkel']], mode), 'Automatisch folgt dem Computer – tagsüber hell, abends dunkel.')}
      ${card('Schrift', `<div class="pillPick">${FONTS.map(([k, n, st, d]) => `<button type="button" class="pill fpill${font === k ? ' on' : ''}" data-font="${k}" aria-pressed="${font === k}" title="${esc(d)}" style="font-family:${esc(st)}">${esc(n)}<small>${esc(d)}</small></button>`).join('')}</div>`)}
      ${card('Textgröße', `<div class="seg modePick zoomPick" id="sZoom">${[[0.9, 'Klein', 13], [1, 'Normal', 15], [1.1, 'Groß', 17], [1.2, 'Sehr groß', 19]].map(([k, l, px]) => `<button type="button" data-zoom="${k}" aria-pressed="${zoom === k}"><span style="font-size:${px}px">Aa</span> ${l}</button>`).join('')}</div>`, 'Vergrößert die ganze Oberfläche – angenehm auf großen Bildschirmen oder am Beamer.')}
      ${card('Darstellung', `${row('Kursliste in der Leiste', 'Wie die Kurse links geordnet sind.', seg('sCv', 'cv', [['b', 'Stufen'], ['c', 'Fächer'], ['e', 'Karten']], cv))}
        ${row('Kompakte Zeilen', 'Mehr Schülerinnen und Schüler auf einen Blick – praktisch auf dem Laptop.', `<input type="checkbox" class="sw" id="sDense" ${ST.dense ? 'checked' : ''}>`)}
        ${row('Effekte reduzieren', 'Ohne Glas- und Bewegungseffekte – ruhiger und spürbar schneller auf älteren Computern.', `<input type="checkbox" class="sw" id="sFx" ${ST.fx === 'low' ? 'checked' : ''}>`)}`, 'Das Aussehen gilt nur für diesen Computer und wird sofort übernommen. Noten und Ausdrucke ändern sich dadurch nicht.')}
    </div>
    <div class="setPane" data-pane="sec" ${cur === 'sec' ? '' : 'hidden'}>
      ${card('Sperre und Updates', `<div class="grid2">${field('Automatisch sperren nach', `<select id="sL">${[[5, '5 Minuten'], [10, '10 Minuten'], [15, '15 Minuten']].map(([m, l]) => `<option value="${m}" ${+s.autoLock === m ? 'selected' : ''}>${l}</option>`).join('')}</select>`)}
        ${field('Nach Updates suchen', `<select id="sU"><option value="1" ${ST.updateCheck !== false ? 'selected' : ''}>Beim Start (nur Versionsnummer)</option><option value="0" ${ST.updateCheck === false ? 'selected' : ''}>Nie</option></select>`)}</div>`, 'Die automatische Sperre gehört zu den Mindestsicherheitsstandards für dienstliche Daten auf privaten Geräten. Bei der Update-Suche wird nur die Versionsnummer abgefragt – keine Noten, keine Namen.')}
      ${card('Daten', `${row('Sicherung, Passwort und Notfallschlüssel', 'Sicherungsordner wählen, jetzt sichern, Passwort ändern, wiederherstellen.', '<button type="button" class="mini" id="sToBackup">Zur Sicherung</button>')}
        ${ST.touchId && ST.touchId !== 'none' ? row('Mit Touch ID entsperren', ST.touchId === 'on' ? 'Eingeschaltet. Das Passwort funktioniert weiterhin – merke es dir trotzdem gut.' : 'Fingerabdruck statt Passwort tippen. Das Passwort bleibt gültig und wird weiter gebraucht, z. B. zum Wiederherstellen von Sicherungen.', `<button type="button" class="mini" id="sTid">${ST.touchId === 'on' ? 'Ausschalten' : 'Einschalten …'}</button>`) : ''}
        ${row('Jetzt sperren', 'Libretto sperrt sich auch selbst, wenn du eine Weile nichts eingibst.', '<button type="button" class="mini" id="sLockNow">Sperren</button>')}
        ${row('Klassen austauschen', 'Namen und Klassen (ohne Noten) als theis-Klassen-Datei speichern oder einlesen – z. B. mit Voce.', '<button type="button" class="mini" id="sKl">Öffnen …</button>')}
        ${row('Alte Kurse (Datenschutz)', ldoDue().length ? (ldoDue().length === 1 ? '1 Kurs' : ldoDue().length + ' Kurse') + ' älter als zwei Schuljahre – nach LDO § 14a zu löschen.' : 'Keine Kurse, die nach LDO § 14a gelöscht werden müssen.', '<button type="button" class="mini" id="sLdo">Ansehen …</button>')}`, 'Alle Noten liegen verschlüsselt (AES-256-GCM) nur auf diesem Computer und in deinem Sicherungsordner.')}
    </div>
    <div class="setPane" data-pane="about" ${cur === 'about' ? '' : 'hidden'}>
      <section class="setCard aboutCard"><img src="icon.png" alt=""><div><b>Libretto</b><span>Notenverwaltung für das bayerische Gymnasium (G9)</span><span class="sel">Version ${esc(v)} · kostenlos</span></div><button type="button" class="mini" id="abOpen">Was ist neu?</button></section>
      ${card('Nachschlagen', `<div class="setLinks">
        <button type="button" data-ab="help"><b>Hilfe</b><small>alle Themen mit Suche</small></button>
        <button type="button" data-ab="hb"><b>Handbuch als PDF</b><small>vollständig, zum Ausdrucken</small></button>
        <button type="button" data-ab="src"><b>Quellenverzeichnis</b><small>Rechtsgrundlagen und Vorgaben</small></button>
        <button type="button" id="licBtn"><b>Lizenzen</b><small>Open-Source-Software</small></button></div>`)}
      <section class="setCard maker"><span class="by">Eine App von</span>${window.THEISAPPS_LOGO}<div class="mk-meta">Apps für die Schule · <a href="${SITE_URL}" target="_blank" rel="noopener">theisapps.de</a><br>© 2026 theisapps. Alle Rechte vorbehalten.<br><a href="${SUPPORT_URL}" target="_blank" rel="noopener" style="font-weight:600">☕ Einen Kaffee ausgeben</a> · freiwillig</div></section>
      <p class="setHint">Berechnungen nach der Schulordnung für die Gymnasien in Bayern (GSO), ohne Gewähr. ${esc(Print.DISCLAIMER)}</p>
    </div></div></div>`,
    onOpen: (d, close) => {
      d.classList.add('setDlg');
      const pick = (attr, b) => $$(`[data-${attr}]`, d).forEach(x => { x.setAttribute('aria-pressed', String(x === b)); x.classList.toggle('on', x === b); });
      $$('[data-stab]', d).forEach(b => b.onclick = () => { settingsSheet.last = b.dataset.stab; pick('stab', b); $$('.setPane', d).forEach(x => { x.hidden = x.dataset.pane !== b.dataset.stab; }); d.querySelector('.setMain').scrollTop = 0; });
      d.querySelector('#licBtn').onclick = openLicenses;
      d.querySelector('#sDl').onclick = () => openSub(d, deadlineSheet, () => settingsSheet());
      d.querySelector('#sEvImp').onclick = () => { closeAll(); UI.tab = 'dates'; render(); setTimeout(() => { const f = $('#evFile'); if (f) f.click(); }, 60); };
      d.querySelector('#sEvFeed').onclick = () => openSub(d, feedSheet, () => settingsSheet());
      d.querySelector('#sEvHow').onclick = () => helpSheet({ topic: 'kalabo' });
      { const nb = d.querySelector('#sEvNow'); if (nb) nb.onclick = async () => { nb.disabled = true; const r = await refreshFeed(true); nb.disabled = false; if (r && !r.ok) toast('Aktualisieren fehlgeschlagen: ' + r.error, 6000); else toast('Schulkalender aktualisiert'); }; }
      d.querySelector('#sKl').onclick = () => openSub(d, klassenSheet);
      d.querySelector('#sLdo').onclick = () => openSub(d, ldoSheet, () => settingsSheet());
      d.querySelector('#abOpen').onclick = () => openAbout();
      $$('[data-ab]', d).forEach(b => b.onclick = async () => { const k = b.dataset.ab;
        if (k === 'help') helpSheet(); else if (k === 'src') sourcesSheet();
        else { b.disabled = true; try { await helpSheet({ pdf: true }); } catch (e) { toast('PDF konnte nicht erstellt werden'); } finally { b.disabled = false; } } });
      d.querySelector('#sToBackup').onclick = () => { close(); UI.tab = 'backup'; render(); };
      d.querySelector('#sLockNow').onclick = () => { close(); lockNow(); };
      const tb = d.querySelector('#sTid');
      if (tb) tb.onclick = async () => {
        const back = () => { const on = ST.touchId === 'on', sm = tb.closest('.setRow').querySelector('small');
          tb.textContent = on ? 'Ausschalten' : 'Einschalten …';
          if (sm) sm.textContent = on ? 'Eingeschaltet. Das Passwort funktioniert weiterhin – merke es dir trotzdem gut.' : 'Fingerabdruck statt Passwort tippen. Das Passwort bleibt gültig und wird weiter gebraucht, z. B. zum Wiederherstellen von Sicherungen.'; };
        if (ST.touchId === 'on') { await N.tidDisable(); ST = await N.status(); toast('Touch ID ausgeschaltet'); return back(); }
        sheet({ title: 'Touch ID einschalten', small: true, ok: 'Einschalten', allowRO: true, body: `<p class="hint" style="margin-top:0">Gib zur Bestätigung dein Passwort ein. Danach fragt der Mac nach deinem Fingerabdruck.</p>${field('Passwort', '<input type="password" id="tp" autocomplete="current-password">')}<p class="gateErr" id="te"></p><p class="hint">Das Passwort wird im Schlüsselbund dieses Mac verschlüsselt abgelegt – nicht im Sicherungsordner. Es bleibt immer gültig.</p>`,
          onOk: async dd => { const r = await N.tidEnable(dd.querySelector('#tp').value); if (!r.ok) { dd.querySelector('#te').textContent = r.error; return false; } ST = await N.status(); toast('Touch ID eingeschaltet'); back(); } });
      };
      $$('[data-sk]', d).forEach(b => b.onclick = () => { ST.skin = b.dataset.sk; applyLook(ST.skin, ST.mode, ST.font); pick('sk', b); N.setCfg({ skin: ST.skin }).catch(() => {}); });
      $$('[data-start]', d).forEach(b => b.onclick = () => { ST.startTab = b.dataset.start; pick('start', b); N.setCfg({ startTab: ST.startTab }).catch(() => {}); });
      $$('[data-mode]', d).forEach(b => b.onclick = () => { ST.mode = b.dataset.mode; applyLook(ST.skin, ST.mode, ST.font); pick('mode', b); N.setCfg({ mode: ST.mode }).catch(() => {}); });
      $$('[data-font]', d).forEach(b => b.onclick = () => { ST.font = b.dataset.font; applyLook(ST.skin, ST.mode, ST.font); pick('font', b); N.setCfg({ font: ST.font }).catch(() => {}); });
      $$('[data-zoom]', d).forEach(b => b.onclick = () => { ST.zoom = +b.dataset.zoom; applyZoom(ST.zoom); pick('zoom', b); N.setCfg({ zoom: ST.zoom }).catch(() => {}); });
      $$('[data-cv]', d).forEach(b => b.onclick = () => { D.settings.courseView = b.dataset.cv; pick('cv', b); save(); renderSide(); });
      d.querySelector('#sDense').onchange = e => { ST.dense = e.target.checked; document.body.classList.toggle('dense', !!ST.dense); N.setCfg({ dense: !!ST.dense }).catch(() => {}); };
      d.querySelector('#sFx').onchange = e => { ST.fx = e.target.checked ? 'low' : 'full'; applyFx(ST.fx); N.setCfg({ fx: ST.fx }).catch(() => {}); };
    },
    onOk: d => { s.teacher = d.querySelector('#sT').value.trim(); s.school = d.querySelector('#sS').value.trim(); s.year = d.querySelector('#sY').value.trim() || s.year; s.half1End = d.querySelector('#sH').value; s.autoLock = +d.querySelector('#sL').value; N.setCfg({ updateCheck: d.querySelector('#sU').value === '1' }).then(x => { ST = x; }); save(); brandLine(); render(); } });
  return dlg;
}
/* ======================================================================
   Quellenverzeichnis: alle Vorschriften und Vorgaben, auf die sich Libretto stützt (Stand November 2026).
   Eine Liste für Hilfe, eigenes Fenster und PDF. w = wofür in Libretto.
   ====================================================================== */
const SOURCES_STAND = '21.11.2026';
/* [Kürzel, Titel mit Datum/Aktenzeichen, wofür Libretto es nutzt, Fundstelle im Dokument, direkter Link (nur geprüfte), Prüfstand]
   Prüfstand: 'Volltext' = Original gelesen und abgeglichen · 'Passage' = konkrete Stelle geprüft · 'Titel' = nur Veröffentlichung/Bezeichnung geprüft */
const SOURCES = [
  ['Gesetze und Verordnungen', [
    ['BayEUG Art. 52', 'Bayerisches Gesetz über das Erziehungs- und Unterrichtswesen, Art. 52 (Nachweise des Leistungsstands, Bewertung)', 'pädagogische Verantwortung der Lehrkraft bei der Bewertung; was Libretto nur vorschlägt', 'Art. 52', 'https://www.gesetze-bayern.de/Content/Document/BayEUG-52', 'Titel'],
    ['GSO § 21', 'Gymnasialschulordnung, § 21 Leistungsnachweise (Fassung ab 01.08.2026)', 'große und kleine LN; P-Seminar mindestens zwei kleine LN (Abs. 2 Satz 7)', '§ 21', 'https://www.gesetze-bayern.de/Content/Document/BayGSO-21', 'Passage'],
    ['GSO § 19', 'GSO, § 19 Gestaltung des Pflichtprogramms in der Qualifikationsphase', 'Deutsch, Mathematik und das Leistungsfach auf erhöhtem Niveau – deshalb mit Schulaufgabe in 13/2', '§ 19 Abs. 1 Satz 7', 'https://www.gesetze-bayern.de/Content/Document/BayGSO-19', 'Passage'],
    ['GSO § 22', 'GSO, § 22 Große Leistungsnachweise', 'Mindestzahl der Schulaufgaben, Ersatzformen, höchstens eine Schulaufgabe am Tag; Q12/13: je Halbjahr eine Schulaufgabe, in 13/2 nur auf erhöhtem Niveau und in Sport (Abs. 3 Nr. 1)', '§ 22 Abs. 1 ff.', 'https://www.gesetze-bayern.de/Content/Document/BayGSO-22', 'Passage'],
    ['GSO § 23', 'GSO, § 23 Kleine Leistungsnachweise', 'kleine LN (Stegreifaufgaben, Kurzarbeiten, mündliche Leistungen)', '§ 23', 'https://www.gesetze-bayern.de/Content/Document/BayGSO-23', 'Passage'],
    ['GSO § 24', 'GSO, § 24 Seminararbeit', 'Thema bis Ende 12/1 (Abs. 1 Satz 1); Sprache der Arbeit (Abs. 1 Satz 2); Abgabe spätestens am zweiten Unterrichtstag im November der Jgst. 13 (Abs. 1 Satz 3); Prüfungsgespräch (Abs. 2); Wettbewerbsbeitrag (Abs. 3)', '§ 24 Abs. 1–3', 'https://www.gesetze-bayern.de/Content/Document/BayGSO-24', 'Volltext'],
    ['GSO § 26', 'GSO, § 26 Bewertung der Leistungen', 'Versäumnis, Verweigerung, Unterschleif (Kürzel N, U)', '§ 26', 'https://www.gesetze-bayern.de/Content/Document/BayGSO-26', 'Passage'],
    ['GSO § 28', 'GSO, § 28 Bildung der Jahresfortgangsnote in den Jahrgangsstufen 5 bis 11', 'große : kleine LN 1 : 1 bzw. 2 : 1; Rundung, x,5 als pädagogische Entscheidung', '§ 28', 'https://www.gesetze-bayern.de/Content/Document/BayGSO-28', 'Passage'],
    ['GSO § 29', 'GSO, § 29 Bewertung der Leistungen in den Jahrgangsstufen 12 und 13', 'Halbjahresleistung (Abs. 2), Kunst/Musik LF (Abs. 3/4), Sport und Sporttheorie (Abs. 5), Gesamtleistung Seminararbeit (Abs. 6)', '§ 29 Abs. 2–6', 'https://www.gesetze-bayern.de/Content/Document/BayGSO-29', 'Passage'],
    ['GSO § 44', 'GSO, § 44 Zulassung zur Abiturprüfung', 'Mitteilung unter 9 Punkten im W-Seminar (Abs. 1 Satz 2); Hinweise zur Zulassung (Abs. 2 Nr. 3 und Nr. 6: Abgabe, keine 0 Punkte in Arbeit oder Gespräch) – Libretto warnt nur, die Schule entscheidet', '§ 44 Abs. 1–2', 'https://www.gesetze-bayern.de/Content/Document/BayGSO-44', 'Volltext'],
    ['GSO (gesamt)', 'Schulordnung für die Gymnasien in Bayern, außerdem § 25 Rückgabe, § 27 Nachtermin, §§ 39/40 Zeugnisse', 'Nachtermin, Rückgabefristen, Zeugnisbemerkungen', 'die genannten Paragrafen', 'https://www.gesetze-bayern.de/Content/Document/BayGSO', 'Titel'],
    ['BaySchO § 34', 'Bayerische Schulordnung, §§ 31–36 Nachteilsausgleich und Notenschutz (§ 34 Notenschutz), § 20 Entschuldigung', 'nur Kennzeichnung am Namen – die bewilligte Maßnahme setzt die Lehrkraft selbst um', '§ 20, §§ 31–36', 'https://www.gesetze-bayern.de/Content/Document/BaySchO2016-34', 'Titel'],
    ['LDO § 14a', 'Lehrerdienstordnung, § 14a Datenschutz (gültig ab 01.01.2025)', 'Löschhinweis: eigene Aufzeichnungen spätestens zwei Jahre nach Ablauf des Schuljahres löschen, sofern nichts anderes bestimmt ist (Abs. 2 Satz 2) – Libretto erinnert, löscht aber nie von selbst', '§ 14a Abs. 1–3', 'https://www.gesetze-bayern.de/Content/Document/BayVwV288393-14a', 'Volltext']]],
  ['Bekanntmachungen und Schreiben des Kultusministeriums', [
    ['W-Seminar', 'KMBek „Das Wissenschaftspropädeutische Seminar in den Jahrgangsstufen 12 und 13 des neunjährigen Gymnasiums …“ vom 06.04.2023, V.9-BS5610.0/13/1, BayMBl. 2023 Nr. 185', 'Ablauf, Seminararbeit, Betreuung (zusammen mit § 24/§ 29/§ 44 GSO und den Änderungen 2026 zu lesen)', 'gesamte Bekanntmachung', 'https://www.verkuendung-bayern.de/baymbl/2023-185/', 'Titel'],
    ['KMS 02.02.2026', 'KMS „Anpassungen im Wissenschaftspropädeutischen Seminar“ (Abiturjahrgang 2025/2027), VI.5-BS5640.0/422/4', 'Prüfungsgespräch – Umsetzung nach der ISB-Übersicht (s. „Prüfungsgespräch – Übersicht“)', 'Volltext liegt Libretto nicht vor; Datum und Aktenzeichen amtlich belegt (Kontaktbrief Französisch 2026, S. 10)', '', 'Titel'],
    ['P-Seminar', 'KMBek „Das Projekt-Seminar zur beruflichen Orientierung in Jahrgangsstufe 11 des neunjährigen Gymnasiums“ vom 17.05.2022, V.9-BS5610.0/11/2, BayMBl. 2022 Nr. 338', 'P-Seminar (Jgst. 11): Zahl der LN nach § 21 Abs. 2 Satz 7 GSO', 'Nr. 2, Nr. 5', 'https://www.verkuendung-bayern.de/baymbl/2022-338/', 'Titel'],
    ['KMS 18.06.2026', '„Weiterentwicklung der Prüfungskultur an den bayerischen Gymnasien“, VI.3-BS5200.0/88/5', 'Mindestzahl der Schulaufgaben ab 2026/27 (Deutsch 5–8, Mathematik 9); mündliche große LN in den modernen Fremdsprachen', '11 Seiten, v. a. S. 4–5', 'https://www.isb.bayern.de/fileadmin/user_upload/Gymnasium/Faecher/Moderne_Fremdsprachen/KMBek_und_KMS/weiterentwicklung_pruefungskultur_gymnasium_kms_06_26.pdf', 'Volltext'],
    ['KMS 24.07.2026', '„Weiterentwicklung der Mündlichkeit in den modernen Fremdsprachen“, VI.2-BS5402.8/127/7', 'mündliche große LN, Übergang in Jgst. 11 (Libretto prüft das nicht jahrgangsübergreifend)', 'S. 4–6', 'https://www.isb.bayern.de/fileadmin/user_upload/Gymnasium/Faecher/Moderne_Fremdsprachen/KMBek_und_KMS/weiterentwicklung_muendlichkeit_mod_fs_kms_07_26.pdf', 'Passage'],
    ['KMS 24.07.2025', '„Moderne Fremdsprachen, Jahrgangsstufen 5 bis 11“, VI.2-BS4402.8/151/1', 'Rahmen der Leistungsnachweise in 5–11 (Soll-Vorgaben zur Kompetenzabdeckung bleiben Entscheidung der Lehrkraft)', 'Nr. 3, S. 4; S. 10', 'https://www.isb.bayern.de/fileadmin/user_upload/Gymnasium/Faecher/Moderne_Fremdsprachen/KMBek_und_KMS/moderne_fremdsprachen_jgst_5_bis_11_kms_07_25.pdf', 'Titel'],
    ['KMS 08.03.2023', '„Unterricht in den Modernen Fremdsprachen im LehrplanPLUS, Jahrgangsstufe 11; hier: Regelungen für Leistungsnachweise“, V.6-BS4402.8/118/1', '„ausreichend“ je nach Aufgabe 50–60 % (viel Sprachproduktion: 50 %), Grenze zu „ungenügend“ 33 %; kein pauschaler Fachschaftsbeschluss; darum kein KMK-Raster in modernen Fremdsprachen (spätere Regelungen zur Mündlichkeit: KMS 24.07.2026)', 'S. 2–3', 'https://www.isb.bayern.de/fileadmin/user_upload/Gymnasium/Faecher/Moderne_Fremdsprachen/KMBek_und_KMS/unterricht_mod_fs_jgst_11_regelungen_fuer_leistungsnachweise_kms_03_23.pdf', 'Volltext'],
    ['KMS 12.06.2023 (schriftlich)', '„Schriftliche Prüfungsformen im Unterricht der modernen Fremdsprachen in der Profil- und Leistungsstufe (ab 2024/25) und der Abiturprüfung (ab 2026)“, V.6-BS4402.8/99/1', 'Abitur-Gewichte 20 / 55 / 25 %, Inhalt : Sprache 40 : 60, Sperrklausel', 'Nr. 1.3, 1.4, Nr. 3', 'https://www.isb.bayern.de/fileadmin/user_upload/Gymnasium/Faecher/Moderne_Fremdsprachen/KMBek_und_KMS/Moderne_FS_-_Schriftliche_Pruefungsformen_in_der_Profil-_und_Leistungsstufe_und_im_Abitur.pdf', 'Passage'],
    ['KMS 12.06.2023 (mündlich)', '„Mündliche Prüfungsformen in den modernen Fremdsprachen als große Leistungsnachweise in der Profil- und Leistungsstufe …“, V.6-BS5402.8/80/1', 'großer mündlicher LN Q12/Q13', 'Nr. 5, S. 9–11', 'https://www.isb.bayern.de/fileadmin/user_upload/Gymnasium/Faecher/Moderne_Fremdsprachen/KMBek_und_KMS/Muendliche_Pruefungsformen_in_Q-Phase_und_Abitur.pdf', 'Titel'],
    ['KMS 31.07.2023', 'Latein und Griechisch: „Altsprachlicher Unterricht im neunjährigen Gymnasium; hier: Abiturprüfung und Gestaltung der Schulaufgaben in der Qualifikationsphase“, V.3-BS5402.7/135/1, Anlagen 2–4', 'zweigeteilte Schulaufgabe, Gewichtung der Teile, KMK-Schlüssel für BE in der Qualifikationsphase', 'Anlage 3 Nr. 8, Anlage 4 Nr. 9', 'https://www.km.bayern.de/download/4-23-12/KMS_Abitur_L_Gr_G9_mit_Anlagen%2520%281%29.pdf', 'Passage'],
    ['KMS 08.07.2025', 'Latein und Griechisch: „Altsprachlicher Unterricht in Bayern – Korrekturmatrix, jahrgangsübergreifende Kurse“, VI.3-BS5402.7/159/1', 'neue Übersetzungs-Korrekturmatrix ab Abitur 2026 (ersetzt die alte Matrix, nicht die Gesamtpunktetabelle) – in Libretto nicht als eigene Rechnung hinterlegt', 'S. 2–5 und Anlage', 'https://www.km.bayern.de/download/4-25-07/250708_KMS_AU_Korrekturmatrix_J%C3%9CK_k.pdf', 'Titel'],
    ['KMS 28.09.2026', 'Deutsch: „Unterricht im Fach Deutsch – Lernbereich Schreiben“, VI.4-BS5402.5/105/7, mit Anlage „Progression der Schreibformen“', 'ganzheitliche Bewertung der Schreibleistungen (direkte Notengebung, Kommentar)', 'Nr. 3.3/3.4', 'https://www.deutschabitur.bayern.de/fileadmin/user_upload/deutschabitur/KMS_Unterricht_im_Fach_Deutsch_-_Lernbereich_Schreiben_vom_28.09.2026.pdf', 'Passage'],
    ['KMS 11.09.2026', 'Mathematik: „Weiterentwicklung der Prüfungskultur im Fach Mathematik; Digitaler Grundkompetenztest und digitale Hilfsmittel …“, VI.7-BS5400.13/135/1', 'Grundkompetenztest Jgst. 11 als kleiner LN (Schlüssel kommt zentral – Libretto hinterlegt keinen)', 'Nr. 1–2', 'https://www.isb.bayern.de/fileadmin/user_upload/Gymnasium/Faecher/Mathematik/KMBek_und_KMS/KMS_Weiterentwicklung_Pruefungskultur_Mathematik_GYM-3.pdf', 'Titel'],
    ['KMS 14.07.2026', '„Informationen zur Verankerung der Modus-Maßnahmen in der GSO“, VI-BS5610.0/16/1', 'Ende der früheren freien Verhältniswahl (Modus-Maßnahme 23); Libretto rechnet nach § 28 GSO', 'Anlage S. 4 Nr. 2 (Anlage nur über schulrecht-online.de, kein amtlicher Host; Hauptschreiben liegt nicht vor)', 'https://www.schulrecht-online.de/fileadmin/user_upload/KMS_2026-07-14_Anlage.pdf', 'Titel'],
    ['Sport Q12/13', 'KMBek „Durchführung des Sportunterrichts in den Jahrgangsstufen 12 und 13 (neunjähriges Gymnasium)“ vom 01.08.2022, geändert 06.09.2024', 'Fach Sport: (2 × Ø praktische Leistungen + Ø kleine LN) ÷ 3, erst die Endpunktzahl gerundet (Nr. 1.2.1); Leistungsfach: Fach Sport und Sporttheorie je gerundet, Endpunktzahl = Durchschnitt, gerundet; keine Aufrundung auf 1 Punkt (Nr. 2.3.1)', 'Nr. 1.2.1, Nr. 2.3.1', 'https://www.gesetze-bayern.de/Content/Document/BayVV_2235_1_1_5_K_13224/true', 'Passage'],
    ['Kunst Q12/13', 'KMBek „Regelungen für das Fach Kunst in der Qualifikationsphase …“ vom 07.07.2023, geändert 18.08.2026 (BayMBl. 2026 Nr. 350)', 'Hinweis zur Halbjahresleistung im Leistungsfach (§ 29 Abs. 3 GSO)', 'Nr. 1.3, 1.4', 'https://www.gesetze-bayern.de/Content/Document/BayVV_2235_1_1_5_K_13894/true', 'Titel'],
    ['Musik Q12/13', 'KMBek „Leistungsfach Musik sowie Fächer des Zusatzangebots Vokal- und Instrumentalensemble …“ vom 15.06.2023 (BayMBl. 2023 Nr. 323), geändert 18.08.2026 (BayMBl. 2026 Nr. 349)', 'Hinweis zur Halbjahresleistung im Leistungsfach (§ 29 Abs. 4 GSO) – praktische Prüfung nicht in Libretto hinterlegt', 'Nr. 1.4.5, 1.5', 'https://www.verkuendung-bayern.de/baymbl/2023-323/', 'Titel'],
    ['Mindestsicherheitsstandards', '„Mindestsicherheitsstandards beim Einsatz privater informationstechnischer Systeme von Lehrkräften im dienstlichen Bereich“ (Fußzeile 14.09.2023, Dateiname 20.09.2023)', 'verschlüsselte Speicherung und Sicherung, automatische Sperre spätestens nach 15 Minuten (betrifft das ganze Gerät, nicht nur Libretto)', 'Nr. 1, 4, 7–9', 'https://www.km.bayern.de/download/4-24-02/Mindestsicherheitsstandards_Stand_20.09.2023.pdf', 'Passage']]],
  ['ISB – Staatsinstitut für Schulqualität und Bildungsforschung', [
    ['Hinweise 5–11', 'Schriftliche Leistungsnachweise in den Jahrgangsstufen 5–11, Moderne Fremdsprachen – Hinweise (Stand Juli 2024, Datei „…_01_25“)', 'Inhalt/Textstruktur : Sprache 4 : 6 (A1/A1+ 3 : 7, bei längeren offenen Texten auch 4 : 6); halbe BE möglich; keine Sperrklausel in 5–11', 'S. 1–2', 'https://www.isb.bayern.de/fileadmin/user_upload/Gymnasium/Faecher/Moderne_Fremdsprachen/Leistungserhebungen_und_Bewertungsraster/Hinweise/5-11_mod_fs_schriftliche_leistungsnachweise_hinweise_01_25.pdf', 'Volltext'],
    ['Rechentabelle PuLSt 12/2025', 'Rechentabellen Hörverstehen und Schreiben (Pakete „pulst_hoerverstehen_12_25.zip“, „pulst_schreiben_12_25.zip“ auf der ISB-Seite „Leistungserhebungen und Bewertungsraster“)', 'Hörverstehen über den Lösungsgrad ohne gerundete Grenzen (Deckblatt D22:S23, Klassenliste E7/F7); Inhalt 40 % / Sprache 60 % mit Sperrklausel je Schreibaufgabe (I7, M7, Q7, V7); Gesamtnote = Runden des ungerundeten gewichteten Werts (X7 → Y7)', 'Blätter „Deckblatt“ und „Klassenliste“', 'https://www.isb.bayern.de/schularten/gymnasium/faecher/moderne-fremdsprachen/leistungserhebungen-und-bewertungsraster/', 'Volltext'],
    ['Leitfaden 04/2025', '„Leistungsnachweise in der Profil- und Leistungsstufe – Moderne Fremdsprachen“, Leitfaden (Stand April 2025)', 'Gewichtungsvorschläge HV 30–40 % + Sprachmittlung 60–70 %, Textverstehen 60–70 % + Stellungnahme 30–40 % (S. 2); HV 20–26 BE empfohlen, keine halben BE im HV (S. 2–3); 40 : 60 je Teilaufgabe, Sperrklausel (S. 3–4); BE-Formate: ausreichend ab 50 %, mangelhaft ab 33 % (S. 4); spät beginnende Fremdsprachen 50–60 %, halbe BE erwünscht, keine Sperrklausel (S. 5)', 'S. 1–6', 'https://www.isb.bayern.de/fileadmin/user_upload/Gymnasium/Faecher/Moderne_Fremdsprachen/Leistungserhebungen_und_Bewertungsraster/pulst_mod_fs_leistungsnachweise_leitfaden_04_25.pdf', 'Volltext'],
    ['Kontaktbrief Oberstufe 2025', 'Kontaktbrief Oberstufe 2025: Umsetzung der Bewertungseinheiten in Notenpunkte ab Abitur 2026', 'amtliche BE-Tabelle für Gesamt-BE (ganze BE, kaufmännisch gerundet; Beispiele 120/100/90/60 BE)', 'S. 4', 'https://www.isb.bayern.de/fileadmin/user_upload/Gymnasium/Kontaktbriefe/Oberstufe/kontaktbrief_oberstufe_2025.pdf', 'Passage'],
    ['Kontaktbrief Französisch 2026', 'ISB, Kontaktbrief Französisch 2026 (September 2026)', 'Nachweis des KMS 02.02.2026; Hörverstehen oder Sprachmittlung auch als kleiner LN möglich', 'S. 3, 9–11', 'https://www.isb.bayern.de/fileadmin/user_upload/Gymnasium/Kontaktbriefe/Franzoesisch/kontaktbrief_franzoesisch_2026.pdf', 'Titel'],
    ['Bewertungsbogen Seminararbeit', 'Anlage 5a „Bewertungsbogen für die Seminararbeit“ (DOCX, oberstufe.bayern.de) – Vorschlag, an die Schule anpassbar', 'Bereiche, Gewichtung 10/20/30/40 % und Leitfragen im Bewertungsbogen (Leitfragen im Wortlaut, im Ausdruck teils gekürzt)', 'ganzer Bogen', 'https://www.oberstufe.bayern.de/fileadmin/user_upload/oberstufe/Anlage_5a_Bewertungsbogen_fuer_die_Seminararbeit.docx', 'Volltext'],
    ['Bewertung Prüfungsgespräch', 'Bewertungsbogen und Bewertungsraster Prüfungsgespräch (DOCX/XLSX „final“, oberstufe.bayern.de) – Vorschlag, an die Schule anpassbar', 'fünf Kompetenzen im Bewertungsbogen Prüfungsgespräch (Bezeichnungen übernommen, Beschreibungen gekürzt)', 'ganzer Bogen; Raster ohne Formeln', 'https://www.oberstufe.bayern.de/fileadmin/user_upload/oberstufe/Bewertungsbogen_Pruefungsgespraech_final.docx', 'Passage'],
    ['Prüfungsgespräch – Übersicht', '„Das Prüfungsgespräch im W-Seminar – Übersicht für Lehrkräfte“ (One-Pager, ohne Ausgabedatum, abgerufen 17.11.2026)', 'Dauer insgesamt ca. 25 Minuten: optionaler Kurzvortrag höchstens 5 Minuten, Gespräch ca. 20–25 Minuten', 'Abschnitt „Ablauf & Inhalte“', 'https://www.oberstufe.bayern.de/fileadmin/user_upload/oberstufe/One_Pager_Pruefungsgespraech.pdf', 'Volltext'],
    ['W-Seminar-Material', 'Materialportal W-Seminar (Übersicht der Beratungsgespräche, Feedbackbogen Anlage 3)', 'Beratungsgespräch mit Zielvereinbarung', 'Materialseite', 'https://www.oberstufe.bayern.de/wissenschaftspropaedeutisches-seminarw-seminar-q1213/material/', 'Titel']]],
  ['Kultusministerkonferenz', [
    ['KMK-Vereinbarung', 'Vereinbarung zur Gestaltung der gymnasialen Oberstufe und der Abiturprüfung, Beschluss vom 07.07.1972 i. d. F. vom 06.06.2024', 'Prozentgrenzen für 15 bis 1 Notenpunkte (für Abiturprüfungen in Fächern mit Bildungsstandards; in Libretto nur als wählbarer Schlüssel, nicht für alle Fächer und Formate)', 'Anlage 1, S. 25 (PDF-S. 24)', 'https://www.kmk.org/fileadmin/veroeffentlichungen_beschluesse/1972/1972_07_07-VB-gymnasiale-Oberstufe-Abiturpruefung.pdf', 'Passage']]],
  ['Kalender', [
    ['Ferienordnung', 'KMBek „Ferienordnung und schulfreie Samstage für die Schuljahre 2024/2025 bis 2029/2030“ vom 07.12.2022, IV.7-BS4407/521/59, BayMBl. 2022 Nr. 747', 'Kalender, Abgabefrist der Seminararbeit, Terminliste der Prüfungsgespräche – hinterlegt bis zu den Sommerferien 2030; für spätere Schuljahre schlägt Libretto keine Frist vor. Abweichungen der eigenen Schule bitte selbst eintragen.', 'Nr. 1.1 (Abweichungen Nr. 1.3/1.4)', 'https://www.verkuendung-bayern.de/baymbl/2022-747/', 'Volltext'],
    ['FTG Art. 1', 'Gesetz über den Schutz der Sonn- und Feiertage (Feiertagsgesetz – FTG), Art. 1 Gesetzliche Feiertage', 'Feiertage im Kalender und im Hinweis beim Datum eines Leistungsnachweises; Mariä Himmelfahrt nur in überwiegend katholischen Gemeinden (fällt in die Sommerferien)', 'Art. 1 Abs. 1 und 2', 'https://www.gesetze-bayern.de/Content/Document/BayFTG-1', 'Passage']]],
  ['Eigene Verfahren von Libretto (keine amtliche Vorgabe)', [
    ['Verteilung der Zwischenstufen', 'Wo eine Quelle nur zwei Schwellen nennt (z. B. 4 P. ab 50 %, 1 P. ab 33 %), verteilt Libretto die übrigen Grenzen gleichmäßig', 'Vorschlag – jede Grenze ist änderbar', '–', '', ''],
    ['Warnungen und Fristen', 'Hinweise auf fehlende Noten, Termine und Fristen', 'Erinnerung, keine rechtliche Prüfung', '–', '', ''],
    ['Vorlagen je Fach', '„Als Standard merken“ speichert Schlüssel und Prüfungsteile je Fach', 'deine eigene Festlegung', '–', '', '']]]];
const SRC_ST = { Volltext: 'Original gelesen', Passage: 'Stelle geprüft', Titel: 'nur Bezeichnung geprüft' };
function sourcesHTML() {
  let n = 0;
  return `<p>Libretto stützt sich auf diese Vorschriften und Vorgaben (Stand ${SOURCES_STAND}) – nicht jede ist vollständig umgesetzt. Libretto ist keine amtliche Software; maßgeblich sind die Originaltexte und die Entscheidungen deiner Schule. Bei jeder Quelle steht, wofür Libretto sie nutzt, wo im Dokument die Stelle steht und wie genau sie geprüft ist.</p>
    <div class="srcDir">${SOURCES.map(([g, items]) => `<section class="srcGrp"><h4>${esc(g)}</h4>${items.map(([k, t, w, f, u, st]) => `<div class="srcItem"><span class="srcNo">${++n}</span><div><b>${esc(k)}</b><span class="srcT">${esc(t)}</span><span class="srcW"><em>In Libretto:</em> ${esc(w)}</span>${u ? `<a class="srcL" href="${esc(u)}" target="_blank" rel="noopener">${esc(u.replace(/^https:\/\/(www\.)?/, '').replace(/\/.*\/(.{0,40})$/, '/…/$1'))}</a>` : ''}</div><span class="srcF">${esc(f)}${st ? `<i class="srcS ${st}">${esc(SRC_ST[st])}</i>` : ''}</span></div>`).join('')}</section>`).join('')}</div>
    <p class="hint">Neuere Fassung oder Fehler entdeckt? Bitte an hallo@theisapps.de.</p>`;
}
function modelSources() {
  let n = 0;
  const blocks = [{ p: `Libretto stützt sich auf diese Vorschriften und Vorgaben (Stand ${SOURCES_STAND}) – nicht jede ist vollständig umgesetzt. Libretto ist keine amtliche Software; maßgeblich sind die Originaltexte und die Entscheidungen der Schule. „Prüfstand“: Original gelesen · Stelle geprüft · nur Bezeichnung geprüft. Links abgerufen am ${SOURCES_STAND}. Neuere Fassung oder Fehler entdeckt? Bitte an hallo@theisapps.de.` }];
  SOURCES.forEach(([g, items]) => blocks.push({ h: g }, ({ table: { head: ['Nr.', 'Quelle', 'In Libretto verwendet für', 'Fundstelle · Prüfstand'], rows: items.map(([k, t, w, f, u, st]) => [String(++n), k + ' – ' + t + (u ? '\n' + u : ''), w, f + (st ? ' · ' + SRC_ST[st] : '')]), align: ['c', 'l', 'l', 'l'], widths: [6, 40, 36, 18], pct: true, small: true } })));
  return { eyebrow: 'Libretto · Notenverwaltung Gymnasium Bayern', title: 'Quellenverzeichnis', subtitle: 'Rechtsgrundlagen und Vorgaben, Stand ' + SOURCES_STAND, file: 'Libretto Quellenverzeichnis', meta: [['Stand', SOURCES_STAND]], blocks };
}
function sourcesSheet() {
  sheet({ title: 'Quellenverzeichnis', wide: true, ok: '', cancel: 'Schließen', body: `<div class="prose helpDoc">${sourcesHTML()}</div>
    <div class="panelBtns"><button type="button" class="mini accent" id="srcPdf">Als PDF speichern</button></div>`,
    onOpen: d => { d.querySelector('#srcPdf').onclick = () => exportModel(modelSources(), 'pdf'); } });
}
function helpSheet(opts) {
  const fig = (img, alt) => `<figure class="helpFig"><img src="help/${img}.jpg" alt="${esc(alt)}"></figure>`;
  const K = document.body.classList.contains('mac') ? '⌘' : 'Strg+';
  const kbd = x => `<span class="kbd">${x}</span>`;
  /* Abschnitte: [id, Titel, Gruppe, Inhalt] – die Gruppe ordnet das Inhaltsverzeichnis */
  const S = [
  ['start', 'Schnellstart in sechs Schritten', 'Erste Schritte', `
    <ol class="hSteps">
      <li><b>Kurs anlegen:</b> In der Leiste links neben „Kurse“ auf <b>+</b>. Klasse (z. B. 9F), Fach und Jahrgangsstufe eintragen.</li>
      <li><b>Klassenliste einlesen:</b> PDF aus dem Infoportal, Excel- oder CSV-Datei ins Feld ziehen – oder Namen einfügen. Libretto erkennt Vor- und Nachnamen; jede Zeile bleibt änderbar.</li>
      <li><b>Leistungsnachweis anlegen:</b> „+ Leistungsnachweis“: Art (z. B. Schulaufgabe), Datum, ggf. Rohpunkte und Notenschlüssel.</li>
      <li><b>Noten eintragen:</b> In die Spalte klicken, Note tippen, ${kbd('Enter')} – weiter zur nächsten Person.</li>
      <li><b>Speichern:</b> Libretto speichert jede Eingabe sofort von selbst. Wer es gewohnt ist, drückt trotzdem ${kbd(K + 'S')}: Das übernimmt auch einen gerade getippten Wert, speichert und legt höchstens alle zehn Minuten zusätzlich eine Sicherung an.</li>
      <li><b>Sicherungsordner wählen:</b> Unter „Sicherung“ einen USB-Stick oder Cloud-Ordner wählen. Ab dann sichert Libretto automatisch und verschlüsselt.</li>
    </ol>${fig('kurs', 'Kurs anlegen')}
    <p><b>Kurs aus mehreren Klassen</b> (z. B. Italienisch aus 8A und 8B, Religion aus 6A bis 6E): Steht die Klasse in der Liste, übernimmt Libretto sie beim Einlesen; sonst „Klassen eintragen“ wählen und die Klasse je Namen ergänzen. Notentabelle und Ausdrucke – auch die Übertragsliste – sind dann nach Klassen unterteilt, und die Terminprüfung gilt für jede der Klassen.</p>${fig('gemischt', 'Kurs aus zwei Klassen: Notentabelle nach Klassen gegliedert')}
    <p><b>Einstieg mitten im Schuljahr:</b> Im Infoportal das Notenblatt als PDF speichern und im Fenster „Neuer Kurs“ ins Einlesefeld ziehen. Libretto zeigt eine Vorschau (Schüler, Schulaufgaben, Stegreifaufgaben/Kurzarbeiten, mündliche Einzelnoten mit Datum) und übernimmt alles als „schon übertragen“. RA, UB, RF und PN passen zu Librettos Arten; GR, WZ, WS, EP, PF, LN und KSL werden „Sonstiger kleiner LN“ mit dem Kürzel als Notiz; „N“ (Nachschrift) wird Nachtermin „E“. Vorhandene Noten überschreibt Libretto nie.</p>`],
  ['wer', 'Wer nutzt was? Wege für verschiedene Aufgaben', 'Erste Schritte', `
    <div class="hCards">
      <div><b>Fachlehrkraft</b><p>Übersicht beim Öffnen → Kurs → Noten eintragen. Wichtig: Notenschlüssel je Fach merken lassen, Übertrag ins Infoportal abhaken, vor dem Zeugnis „Stand Zwischenzeugnis“ ansehen.</p></div>
      <div><b>Klassenleitung</b><p>„Kalender &amp; Termine“: alle Schulaufgaben der Klasse, Prüfung nach § 22 GSO (höchstens eine am Tag, zwei pro Woche), Schultermine aus dem Infoportal. „Klassen austauschen“ gibt die Namensliste an Kolleginnen und Kollegen weiter (ohne Noten).</p></div>
      <div><b>Oberstufe</b><p>Kurse der Jgst. 12/13 rechnen in Notenpunkten je Halbjahr (§ 29 GSO). Moderne Fremdsprachen: Klausuren nach Prüfungsteilen. Seminare: W-Seminar mit Betreuungskarte und Seminararbeit, P-Seminar mit kleinen LN.</p></div>
      <div><b>Fachbetreuung</b><p>Zu jedem Leistungsnachweis gibt es die „Auswertung für die Fachbetreuung“: Durchschnitt, Notenspiegel, Schlüssel, Punkte je Aufgabe mit Lösungsquote und Unterschriftsfeld.</p></div>
    </div>`],
  ['alltag', 'Übersicht, Leiste und Suche', 'Im Alltag', `
    <p>Beim Öffnen zeigt Libretto die <b>Übersicht</b>: Wo fehlen noch Noten (mit der Rückgabefrist nach § 25 GSO), welche Nachtermine sind offen, was steht in den nächsten vier Wochen an – und je Kurs eine Kachel mit Durchschnitt, einem schmalen Farbbalken für die Notenverteilung (grün = gut bis dunkelrot = ungenügend; beim Darüberfahren die genauen Zahlen) und der Zahl gefährdeter Schülerinnen und Schüler. Ein Klick führt in den Kurs. Die Übersicht zeigt nur an und ändert nichts; wer lieber gleich im zuletzt geöffneten Kurs landet, stellt das unter <b>Einstellungen → Allgemein</b> um.</p>
    <p>Die <b>Leiste links</b>: oben die Suche (Schüler oder Kurs, ${kbd(K + 'K')}), darunter Übersicht, Noten, Kalender &amp; Termine und Sicherung (ein orangefarbener Punkt heißt: bitte um die Sicherung kümmern), dann deine Klassen und Kurse in drei Ansichten. Es folgen Schnellzugriffe für den geöffneten Kurs; die selteneren unter „Allgemein“ klappst du mit einem Klick auf. Der Knopf oben rechts schrumpft die Leiste auf Symbole; bei schmalem Fenster geschieht das von selbst.</p>
    <p><b>Rückgabefrist (§ 25 GSO):</b> Schriftliche Leistungsnachweise sollen binnen zwei Wochen korrigiert, zurückgegeben und besprochen werden, Schulaufgaben in 12/13 und in Deutsch ab Jgst. 10 binnen drei Wochen. Die Übersicht zeigt „Rückgabe bis …“ und wird rot, wenn die Frist vorbei ist und noch keine Noten eingetragen sind.</p>${fig('uebersicht', 'Übersicht mit Zu erledigen, Als Nächstes und den Kurskacheln')}`],
  ['eintragen', 'Noten eintragen', 'Im Alltag', `
    <p>Zelle anklicken, Note tippen, ${kbd('Enter')} oder ${kbd('Tab')} – weiter zur nächsten Person (${kbd('Shift')}+${kbd('Tab')} zurück; am Spaltenende geht es oben in der nächsten Spalte weiter, wie im Infoportal). Die Zeile, in der du schreibst, ist farbig hervorgehoben. Tendenzen wie 2+ werden angezeigt, gerechnet wird mit ganzen Noten. Leere Zellen sind kein Problem – gerechnet wird nur mit vorhandenen Noten.</p>
    <p><b>Kürzel statt Note:</b> ${kbd('E')} entschuldigt, Nachtermin offen (zählt noch nicht) · ${kbd('B')} befreit (zählt nicht) · ${kbd('N')} versäumt ohne Entschuldigung oder verweigert – Note 6 bzw. 0 Punkte, angezeigt als 6* (§ 26 Abs. 4 GSO) · ${kbd('U')} Unterschleif.</p>
    <p><b>Wer wird gewertet?</b> Im Notenspiegel und im Durchschnitt einer Arbeit zählen alle mit Note – auch ${kbd('N')} (Note 6 bzw. 0 Punkte, versäumt ohne Entschuldigung, § 26 Abs. 4 GSO) und Unterschleif, denn das sind echte Noten. Nicht gezählt werden ${kbd('E')} (entschuldigt, Nachtermin offen), ${kbd('B')} (befreit) und leere Felder. „Gewertet: 10 von 12“ zeigt beim Darüberfahren, wer genau mitzählt.</p>
    <p><b>Nachtermin (NT):</b> Wer mit ${kbd('E')} markiert war und dann eine Note bekommt, hat den Nachtermin geschrieben: Die Note zählt für die Person (Zeugnis), aber nicht im Notenspiegel und Durchschnitt der Arbeit – der Nachtermin ist an einem anderen Tag mit anderen Aufgaben. In der Zelle steht ein kleines „NT“, im Ausdruck „NT“ hinter der Note. Die GSO regelt das nicht ausdrücklich; wenn eure Fachschaft den Nachtermin mitzählt, im Eingabeblatt den Status von „NT“ auf „–“ stellen.</p>
    <p><b>Vertippt?</b> Überschreibst oder löschst du eine vorhandene Note, erscheint unten kurz „Rückgängig“. Die unterste Zeile <b>„Ø Klasse“</b> zeigt den Durchschnitt je Spalte und rechnet mit. Kleine Marken rechts über der Tabelle (z. B. „1 Nachtermin offen“) klappen beim Anklicken ihre Erklärung auf.</p>${fig('tabelle', 'Notentabelle')}
    <p><b>Einzelnoten mit Datum</b> (Unterrichtsbeiträge, Rechenschaftsablagen – nicht die ganze Klasse am selben Tag): Spalte „Einzeln“, Note ins Feld „+“ tippen und ${kbd('Enter')}. Gespeichert wird mit dem heutigen Datum; ein Klick auf eine Note öffnet die Liste zum Ändern oder Löschen. Die Art für die schnelle Eingabe stellst du über den Spaltenkopf ein.</p>${fig('einzeln', 'Einzelnoten')}`],
  ['ln', 'Leistungsnachweise, Gewichte und Notenschlüssel', 'Leistungsnachweise', `
    <p>„+ Leistungsnachweis“: Art, Datum und ggf. Gewicht (z. B. Jahrgangsstufentest als ½ Schulaufgabe, eine Stegreifaufgabe doppelt). In Fächern mit Schulaufgaben ist „Schulaufgabe“ vorausgewählt, bis die Mindestzahl (bzw. die unter „Kurs &amp; Schüler“ geplante Zahl) erreicht ist. Fällt das Datum in die Ferien, auf einen Feiertag oder ein Wochenende, steht darunter ein kleiner Hinweis – speichern geht trotzdem. Spaltenkopf anklicken: bearbeiten, Notenspiegel, drucken.</p>
    <p>Mit <b>„Rohpunkte eingeben“</b> tippst du Punkte ein, Libretto rechnet über den Notenschlüssel in Noten bzw. Notenpunkte um. Den Schlüssel berechnet Libretto aus den Vorgaben eurer Fachschaft – etwa <b>Note 4 ab 50 %, Note 5 ab 33 %</b>; die Noten 1–3 werden gleichmäßig verteilt, jede Grenze bleibt änderbar. Libretto merkt sich die Vorgabe je Fach.</p>${fig('schluessel', 'Notenschlüssel')}
    <p><b>Oberstufe (Notenpunkte):</b> Bei „Eigene Grenzen“ legst du fest, ab wie viel Prozent es <b>4 Punkte (Note 4–)</b> – also die unterste 4 – und <b>1 Punkt (Note 5–)</b> gibt; dazwischen und darüber verteilt Libretto gleichmäßig. Nach dem KMK-Raster (Abitur-Tabelle) beginnt die 4 bei 40 % (4 Punkte), 5 Punkte gibt es ab 45 %, 6 Punkte (4+) ab 50 %. <b>Moderne Fremdsprachen:</b> Wo in Q12/13 mit BE bewertet wird – etwa Wortschatz- und Grammatikaufgaben –, gilt nach dem ISB-Leitfaden (April 2025) „ausreichend“ ab 50 % und „mangelhaft“ ab 33 %; Libretto schlägt deshalb 4 Punkte ab 50 % und 1 Punkt ab 33 % vor. Das Hörverstehen in Klausuren rechnet dagegen – wie die Excel-Tabelle des ISB – mit der Abitur-Tabelle (4 Punkte ab 40 %). Zur Erinnerung: 15/14/13 Punkte = 1+/1/1–, 12/11/10 = 2+/2/2–, 9/8/7 = 3+/3/3–, 6/5/4 = 4+/4/4–, 3/2/1 = 5+/5/5–, 0 = 6. Halbjahresleistungen unter 5 Punkten gelten als unterpunktet.</p>
    <p><b>Amtliche BE-Tabelle / KMK-Raster</b> (Abiturprüfung ab 2026 nach dem ISB-Kontaktbrief Oberstufe 2025, S. 4, und der KMK-Vereinbarung zur gymnasialen Oberstufe i. d. F. vom 06.06.2024): 15 Punkte ab 95 %, 14 ab 90 %, 13 ab 85 % … 5 ab 45 %, 4 ab 40 %, 3 ab 33 %, 2 ab 27 %, 1 ab 20 %. Für die modernen Fremdsprachen in Jgst. 5–11 und die spät beginnenden Fremdsprachen nennt das ISB als Schwellenwert für „ausreichend“ 50–60 % und für „mangelhaft“ 33 % – Libretto schlägt dort Note 4 ab 50 % und Note 5 ab 33 % vor. In der Unter- und Mittelstufe ergibt das KMK-Raster die Noten <b>1 ab 85 %, 2 ab 70 %, 3 ab 55 %, 4 ab 40 %, 5 ab 20 %</b>, auf Wunsch mit Tendenzen. Vorgewählt in Mathematik und in Q12/Q13 (außer moderne Fremdsprachen). <b>Moderne Fremdsprachen:</b> Hier bietet Libretto das KMK-Raster gar nicht an – „ausreichend“ liegt je nach Aufgabe bei 50–60 %, „ungenügend“ unter 33 % (KMS vom 08.03.2023 für Jgst. 11, wie in 5–10; Q12/Q13: ISB-Leitfaden 04/2025). Ältere Leistungsnachweise mit KMK-Raster zeigt Libretto einmal zur Prüfung an; geändert wird nichts von selbst. In der Oberstufe setzt Libretto die Grenzen immer in ganzen BE kaufmännisch gerundet – genau wie die amtliche Tabelle (z. B. 90 BE: 2 Punkte ab 24 BE, 15 Punkte ab 86 BE). <b>Ausnahme Hörverstehen</b> (fortgeführte moderne Fremdsprachen, Q12/Q13): Hier rechnet die ISB-Rechentabelle über den Lösungsgrad <b>ohne</b> gerundete Grenzen – in Libretto der Schlüssel „Hörverstehen – ISB-Rechentabelle“ bzw. ein BE-Prüfungsteil. Beispiel 22 BE: 7 BE sind 31,8 % → 2 Punkte (die gerundete Gesamt-BE-Tabelle gäbe 3). In der Unter- und Mittelstufe wird bei halben Punkten – wie in den üblichen Excel-Notenlisten – aufgerundet. Wichtig: Verbindlich ist die Tabelle für BE-bewertete Abiturprüfungen und Prüfungsteile sowie – nach dem Altsprachen-KMS vom 31.07.2023 – für BE-Bewertungen in Latein und Griechisch in der Qualifikationsphase (dort empfohlen schon ab Jgst. 11). Für andere Leistungsnachweise legen Lehrkraft und Fachschaft den Schlüssel fest, soweit keine Fachvorgabe besteht (BayEUG Art. 52). Deutsch-Aufsätze werden nicht über Rohpunkte, sondern ganzheitlich bewertet (KMS vom 28.09.2026).</p>
    <p><b>Was ist verbindlich, was entscheidet die Fachschaft?</b> Für die meisten Fächer in Jgst. 5–11 gibt es <b>keinen</b> landesweiten Prozentschlüssel – den legen Lehrkraft und Fachschaft fest (BayEUG Art. 52, § 26 GSO). Verbindlich sind dagegen die Tabellen der Abiturprüfung und die Raster, deren Verwendung ein KMS vorschreibt (z. B. Q12/Q13 moderne Fremdsprachen, zweigeteilte Schulaufgabe in Latein und Griechisch).</p>
    <p><b>Simulation des Notenschlüssels:</b> Im Leistungsnachweis zeigt „Was passiert, wenn ich die Grenzen verschiebe?“ verschiedene Schlüssel nebeneinander – z. B. Note 4 ab 60 / 55 / 50 / 45 / 40 % (Q12/Q13: 4 Punkte ab …) und das KMK-Raster bzw. die amtliche BE-Tabelle – mit Durchschnitt, Verteilung und Anteil der 5er und 6er bzw. der Ergebnisse unter 5 Punkten. <b>„Klasse“</b> klappt die ganze Klassenliste auf: Wer mit diesem Schlüssel eine andere Note bekäme, ist grün (besser) oder rot (schlechter) markiert, mit „jetzt → neu“. „Übernehmen“ trägt die Grenzen nur ein – gespeichert wird erst mit „Sichern“. Der Notenspiegel darunter zeigt beim Ändern sofort den neuen Durchschnitt.</p>
    <p><b>Simulation des Faktors:</b> Im Fenster „Leistungsnachweis bearbeiten“ direkt unter den Aufgaben (sobald Punkte eingetragen sind) und im Eingabeblatt „Punkte je Aufgabe“ unten steht „Was passiert, wenn eine Aufgabe anders zählt?“. Aufgabe wählen (eine Schreibaufgabe zählt als eine Aufgabe), Faktor antippen (× 0,5 … × 3) – Libretto zeigt erreichbare Punkte, Durchschnitt und die Klassenliste mit allen, deren Note sich ändern würde. Gerechnet wird an einer Kopie; erst der Knopf „… ab jetzt × … zählen“ ändert die Arbeit. Mit „Simulation drucken“ (PDF oder Word) bekommst du die Klassenliste jetzt → simuliert mit Notenspiegel auf Papier, z. B. für die Fachbetreuung – das gibt es auch bei der Schlüssel-Simulation, sobald du dort „Klasse“ antippst.</p>`],
  ['aufgaben', 'Punkte je Aufgabe, Faktor und nachträgliche Gewichtung', 'Leistungsnachweise', `
    <p>Unter „Rohpunkte“ gibt es „Punkte je Aufgabe eingeben“. Im Eingabeblatt stehen oben die <b>erreichbaren Punkte</b> je Aufgabe: eintippen und ${kbd('Tab')} – bei „+“ entsteht die nächste Aufgabe. Darunter trägst du je Person die Punkte ein; sobald alle Aufgaben eingetragen sind (auch 0), rechnet Libretto Summe und Note. Leere Felder zählen nicht als 0. Unten: Ø Punkte und Lösungsquote je Aufgabe, darunter immer der <b>Notenschlüssel</b> mit Punktbereichen und der <b>Durchschnitt</b> groß.</p>
    <p><b>Knapp dran:</b> ↑ neben der Note heißt: höchstens 1 Punkt fehlt zur nächstbesseren Note; ↓ erscheint knapp über der Grenze zur 5. Nur ein Hinweis zum Nochmal-Ansehen – Libretto ändert keine Note.</p>
    <p><b>Faktor je Aufgabe:</b> Unter jeder Höchstpunktzahl steht „× 1“. Dort stellst du ein, dass eine Aufgabe <b>doppelt</b> (× 2), <b>halb</b> (× 0,5) oder z. B. × 2,5 zählt. Das geht auch <b>nachträglich</b> – etwa wenn eine Aufgabe sehr schlecht ausgefallen ist: Faktor ändern, Libretto rechnet erreichbare Punkte, Summen und Noten neu (bei Prozent-Grenzen passt sich der Schlüssel an). Eine Aufgabe ganz streichen: × in der Überschrift – die Eingaben bleiben gespeichert. Auf dem Ausdruck steht der Faktor in der Zeile „erreichbar“.</p>
    <p><b>Schreibaufgabe und Sprachmittlung</b> (moderne Fremdsprachen): „+ Schreiben / SM“ legt eine Aufgabe mit den Teilen Inhalt und Sprache und einem gemeinsamen Faktor an. Im Kopf steht, wie viele Punkte sie höchstens bringt (z. B. „max. 20“), und je Person rechts daneben die <b>Zwischensumme mit Faktor</b> – bei Inhalt 4 und Sprache 6 mit × 2 also „= 20“ – zum Übertragen auf den Korrekturbogen.</p>
    <p><b>Gesamtpunkte von Hand:</b> Trägst du in der Notentabelle direkt eine Summe ein, bleibt sie stehen, auch wenn sich Aufgaben ändern (im Aufgabenblatt mit ✎ markiert). Sobald du wieder Aufgabenpunkte einträgst, rechnet Libretto die Summe aus den Aufgaben. Passt der Notenschlüssel nach einer Änderung nicht mehr zu den erreichbaren Punkten, zeigt Libretto keine Note, sondern einen Hinweis.</p>
    <p><b>Aus Excel:</b> Eine Tabelle (Zeile „erreichbar“ und Namen mit Punkten) im Blatt mit ${kbd(K + 'V')} einfügen; Libretto zeigt vorher, was übernommen wird. Mit „Als Standard für das Fach merken“ startet jede neue Arbeit dieses Fachs gleich so.</p>
    <p><b>Status-Spalte:</b> nur für Personen ohne Punkte: E entschuldigt (Nachtermin offen) · B befreit · 6* bzw. 0* versäumt/verweigert · U Unterschleif. Beim Aufklappen steht der volle Text.</p>${fig('aufgaben', 'Punkte je Aufgabe mit Schreibaufgabe (Inhalt und Sprache, Faktor 2,5) und Zwischensumme')}`],
  ['sim', 'Simulationen: erst ausprobieren, dann entscheiden', 'Leistungsnachweise', `
    <p><b>Notenschlüssel:</b> Im Fenster „Leistungsnachweis bearbeiten“ zeigt „Simulation“ Varianten der Grenzen (z. B. die 4 ab 50, 55 oder 60 %) mit Durchschnitt und Notenspiegel. „Klasse“ öffnet die ganze Klassenliste: Wer besser würde, ist grün, wer schlechter würde, rot. „Übernehmen“ setzt die Grenzen.</p>
    <p><b>Faktor einer Aufgabe:</b> Unter den Aufgaben (im Bearbeiten-Fenster und im Blatt „Punkte je Aufgabe“): Was passiert, wenn Aufgabe 2 halb oder doppelt zählt? Wieder mit Klassenliste; „… ab jetzt × 2 zählen“ stellt den Faktor um, gespeichert wird mit „Sichern“.</p>
    <p><b>Drucken:</b> Jede Simulation mit Klassenliste lässt sich als PDF oder Word ausgeben – Liste jetzt → simuliert, Notenspiegel, Kennzahlen, mit dem Hinweis, dass an den Noten nichts geändert wurde. Praktisch fürs Gespräch mit der Fachbetreuung.</p>
    <p class="hint">Gerechnet wird immer an einer Kopie. Es ändert sich erst etwas, wenn du übernimmst.</p>${fig('simulation', 'Simulation des Notenschlüssels mit Klassenliste: besser grün, schlechter rot')}`],
  ['fs', 'Moderne Fremdsprachen, Jgst. 5–11', 'Szenarien nach Fächern', `
    <p><b>Schreibaufgabe und Sprachmittlung:</b> Im Eingabeblatt legt „+ Schreiben / SM“ eine Aufgabe mit den Teilen <b>Inhalt</b> und <b>Sprache</b> an – 4 + 6 Punkte (Regelfall) oder 3 + 7 (Anfangsunterricht, Niveau A1), wie in den Bewertungsrastern des ISB. Sie steht unter einer gemeinsamen Überschrift und hat <b>einen</b> Faktor (z. B. × 2 oder × 2,5) für beide Teile; Name und Faktor änderst du direkt in der Überschrift. Libretto merkt sich je Kurs die zuletzt gewählte Verteilung und den Faktor.</p>
    <p><b>Typischer Ablauf einer Schulaufgabe:</b> Hörverstehen und Leseverstehen als normale Aufgaben (Punkte), dazu „+ Schreiben / SM“; Notenschlüssel nach Fachschaftsbeschluss (z. B. Note 4 ab 50 %). Mündliche Schulaufgaben bewertest du z. B. mit <b>Voce</b> und übernimmst die Noten (siehe „Voce“ unter Kalender, Termine und Klassen austauschen). Seit 2026/27 findet in den fortgeführten modernen Fremdsprachen in mindestens zwei Jahrgangsstufen mindestens ein großer Leistungsnachweis oder ein Teil davon mündlich statt (KMS vom 18.06.2026) – zusätzlich, nicht als Ersatz.</p>
    <p class="hint">Latein und Griechisch sind keine modernen Fremdsprachen – dort bietet Libretto diese Aufteilung nicht an.</p>`],
  ['fsq', 'Moderne Fremdsprachen, Oberstufe (Q12/13)', 'Szenarien nach Fächern', `
    <p>Im Leistungsnachweis <b>„Nach Prüfungsteilen bewerten“</b> einschalten – nachgebaut nach der Rechentabelle des ISB:</p>
    <ul><li>Teile mit <b>BE</b> (z. B. Hörverstehen): Anteil der BE → Teilnote nach der Abitur-Tabelle (95 % = 15 … 20 % = 1, darunter 0).</li>
      <li><b>Inhalt + Sprache</b> (Schreiben, Sprachmittlung): je 0–15 Notenpunkte nach den Bewertungsrastern; Teilnote = 40 % Inhalt + 60 % Sprache. Ist Inhalt oder Sprache 0 Punkte, höchstens 3 Punkte (<b>Sperrklausel</b>, rot markiert).</li>
      <li>Ergebnis: Teilnoten nach den Anteilen gemittelt („genau“), dann gerundet. Vorlagen: „Hörverstehen + Sprachmittlung“ (35 / 65 %) und „Textaufgaben + Stellungnahme“ (65 / 35 %) nach dem ISB-Leitfaden 04/2025 (S. 2: 30–40 % / 60–70 %) sowie „Wie im Abitur“ (Hörverstehen 20 %, Schreiben 55 %, Sprachmittlung 25 %). Teile und Anteile änderst du frei (zusammen 100 %). Mehrere Schreibaufgaben = je ein eigener Teil, denn Inhalt/Sprache und Sperrklausel gelten je Aufgabe. Fehlen bei einem BE-Teil die erreichbaren BE, ist das Feld rot umrandet.</li></ul>
    <p>Libretto merkt sich die Prüfungsteile je Fach als Vorlage. Der Ausdruck „Detailliert“ zeigt BE, Inhalt, Sprache und Teilnote je Teil.</p>
    <p><b>Schülerübersichten (PDF):</b> Im Leistungsnachweis auf „Schülerübersichten (PDF)“ – je Schüler ein Abschnitt zum Ausschneiden, drei je Seite: alle Prüfungsteile mit BE bzw. Inhalt und Sprache, Lösungsgrad, Teilnote, Gewicht und die ganze Rechnung bis zu den Notenpunkten (Sperrklausel rot mit Begründung). Wer noch nicht alle Teile hat, abwesend war oder nachschreibt, bekommt (noch) keine Übersicht – Libretto nennt die Namen. Daneben „grafisch“: dieselbe Übersicht mit Balken – jede Teilnote auf der Skala 0–15 und ein Gesamtbalken, der zeigt, wie viel jeder Teil zur Note beiträgt.</p>
    <p><b>Mündliche Schulaufgabe:</b> In der Q-Phase ist genau eine Schulaufgabe mündlich (KMS vom 12.06.2023) – Bewertung z. B. mit Voce, Noten übernehmen (siehe „Voce“ unter Kalender, Termine und Klassen austauschen).</p>
    <p><b>Spät beginnende Fremdsprache:</b> Beim Kurs „Spät beginnende Fremdsprache“ anhaken. Dann bewertest du auch in Q12/13 mit Bewertungseinheiten wie in Jgst. 5–11 – „+ Schreiben / SM“ mit Inhalt 4 + Sprache 6, ohne Sperrklausel, halbe BE erwünscht – und Libretto rechnet über den Notenschlüssel in Notenpunkte um; „ausreichend“ beginnt zwischen 50 % und 60 %, „mangelhaft“ bei 33 % (ISB-Leitfaden, April 2025).</p>${fig('oberstufe', 'Notentabelle Q12: Notenpunkte und Halbjahresleistung')}${fig('pruefungsteile', 'Klausur nach Prüfungsteilen: Hörverstehen in BE, Sprachmittlung mit Inhalt und Sprache')}`],
  ['alt', 'Latein und Griechisch', 'Szenarien nach Fächern', `
    <p>Schulaufgaben sind <b>zweigeteilt</b>: Übersetzung und Aufgabenteil. Im Leistungsnachweis ist dafür „Zweigeteilte Schulaufgabe“ eingeschaltet (bei neuen Schulaufgaben automatisch). Du trägst je Person zwei Teilnoten ein – ganze Noten, in Q12/13 Notenpunkte –, Libretto rechnet die Gesamtnote nach den Richtlinien des Kultusministeriums:</p>
    <ul><li>Gewichtung Übersetzung : Aufgabenteil – Latein Jgst. 5–8 <b>3 : 1</b>, 9–10 <b>2 : 1</b>, ab 11 <b>1 : 1</b>; Griechisch 8–9 <b>3 : 1</b>, 10 <b>2 : 1</b>, ab 11 <b>1 : 1</b>.</li>
      <li>Bei n,5 gibt es die <b>bessere</b> Note (z. B. 2,5 → 2; in Q12/13 7,5 → 8 Punkte).</li>
      <li>Latein 9/10: „ausreichend“ nur, wenn die Übersetzung mindestens „mangelhaft“ ist. Ab Jgst. 11 (beide Sprachen): „befriedigend“ bzw. 7 Punkte nur, wenn kein Teil „ungenügend“ ist – in Q12/13 also höchstens 6 Punkte, wenn ein Teil 0 Punkte hat. Greift eine dieser Regeln, steht ein rotes ! neben der Note.</li></ul>
    <p>Die Teilnote der Übersetzung bildest du selbst aus der Fehlerzahl – einen landesweiten Fehlerschlüssel für Jgst. 5–11 gibt es nicht; die Korrekturmatrix und ein Bonus von höchstens zwei Fehlern für besonders treffende Formulierungen gelten nach KMS. Für eine Interpretationsschulaufgabe (Jgst. 11, Q 13/1) oder eine Ersatzform wie die Dialogschulaufgabe schaltest du „Zweigeteilt“ aus und benotest direkt.</p>
    <p class="hint">Quelle: KMS vom 31.07.2023, V.3-BS5402.7/135/1 („Altsprachlicher Unterricht im neunjährigen Gymnasium“), Anlagen 2–4.</p>${fig('latein', 'Zweigeteilte Schulaufgabe Latein: Übersetzung 3 : 1 Aufgabenteil')}`],
  ['mint', 'Mathematik und Naturwissenschaften', 'Szenarien nach Fächern', `
    <p>Rohpunkte mit <b>Punkten je Aufgabe</b>; das KMK-Raster ist vorgewählt. Die Lösungsquote je Aufgabe zeigt, welche Aufgabe schwierig war – nachträglich halb werten geht über den Faktor × 0,5. In Q12/Q13 entspricht das KMK-Raster der Tabelle der Abiturprüfung. Mathematik hat in Jgst. 5–7 vier Schulaufgaben (§ 22 GSO) – Libretto prüft die Mindestzahl.</p>`],
  ['de', 'Deutsch und Fächer mit direkter Notengebung', 'Szenarien nach Fächern', `
    <p>Aufsätze werden meist direkt benotet: Leistungsnachweis ohne Rohpunkte anlegen und Noten (Q12/Q13: Notenpunkte) eintippen. Rückgabefrist für Schulaufgaben in Deutsch ab Jgst. 10: drei Wochen. Das KMS „Unterricht im Fach Deutsch – Lernbereich Schreiben“ vom 28.09.2026 verlangt eine ganzheitliche Bewertung der Schreibleistung – eine bloße Addition von Teilpunkten wird dem nicht gerecht; direkt benoten ist deshalb der richtige Weg. In Jgst. 5–8 sind drei Aufsatz-Schulaufgaben verbindlich (KMS vom 18.06.2026).</p>`],
  ['ohne', 'Fächer ohne Schulaufgaben, Sport, Kunst und Musik', 'Szenarien nach Fächern', `
    <p>Sport, Musik, Kunst & Co.: beim Kurs „Fach mit Schulaufgaben“ ausschalten – die Note entsteht nur aus kleinen Leistungsnachweisen. Praktische Leistungen als Art „Praktische Leistung“.</p>
    <p><b>Sport in Q12/13</b> (§ 29 Abs. 5 GSO): Halbjahresleistung = (2 × Durchschnitt der praktischen Leistungen im Handlungsfeld + Durchschnitt der übrigen kleinen LN) ÷ 3. Praktische Leistungen trägst du als „Praktische Leistung“ ein – Libretto zählt sie doppelt. </p>
    <p><b>Leistungsfach Sport</b> (§ 29 Abs. 5 Satz 2 GSO; KMBek „Durchführung des Sportunterrichts in den Jahrgangsstufen 12 und 13“, Nr. 2.3.1): Fach Sport und Sporttheorie werden in <b>einem</b> Kurs geführt (Kurs anlegen: Art „Leistungsfach“, Sporttheorie „im selben Kurs“). Libretto rechnet in drei Stufen, jeweils gerundet: <b>Fach Sport</b> = (2 × Ø praktische Leistungen + Ø kleine LN des Fachs Sport) ÷ 3; <b>Sporttheorie</b> = (Schulaufgabe + Ø kleine LN der Sporttheorie) ÷ 2; <b>Endpunktzahl</b> = (Fach Sport + Sporttheorie) ÷ 2. Eine Aufrundung auf 1 Punkt ist nicht zulässig. Bei jedem kleinen LN wählst du „Fach Sport“ oder „Sporttheorie“ (im Spaltenkopf: FS bzw. Th); die Schulaufgabe gehört immer zur Sporttheorie, praktische Leistungen immer zum Fach Sport. Fehlt ein Teil, zeigt Libretto noch keine Endpunktzahl. Ältere Kurse mit eigenem Theoriekurs rechnen wie bisher – dort bildest du die Endpunktzahl selbst.</p>
    <p><b>Kunst und Musik als Leistungsfach</b> (§ 29 Abs. 3 und 4 GSO): Halbjahresleistung = Durchschnitt aus Schulaufgabe, <b>künstlerischem Projekt</b> bzw. <b>praktischer Prüfung</b> und dem Durchschnitt der kleinen LN. Dafür gibt es in diesen Kursen die eigenen Arten „Künstlerisches Projekt“ und „Praktische Prüfung“.</p>
    `],
  ['wsem', 'W-Seminar: Kurs und Betreuung', 'Seminare', `
    <p><b>Kurs anlegen:</b> „Neuer Kurs“ → Jahrgangsstufe 12, „Art des Kurses: W-Seminar“ und oben das <b>Leitfach</b> eintragen (z. B. Italienisch). Über „Fristen …“ im Reiter „Seminararbeit“ trägst du Rahmenthema, Themenfrist und Abgabetermin ein.</p>
    <p><b>W-Seminar:</b> Kurs der Jgst. 12 oder 13, „Art des Kurses“ W-Seminar (oder Fach „W-Seminar“). Reiter 12/1, 12/2, Seminararbeit und Übersicht; Klick auf einen Namen öffnet die <b>Betreuungskarte</b> mit Thema, Terminen und Protokoll (Besprochen, Vereinbart, nächster Termin, unterschrieben), Abgabe mit Fristverlängerung und Bewertung. Dateien (Exposé, Gliederung, Arbeit) hängst du an den Termin – verschlüsselt gespeichert und mitgesichert. Ausdrucke: Betreuungsprotokoll, Betreuungsdokumentation, Übersicht der Seminararbeiten, Ergebnisliste. Über Zulassung, Fristverlängerung und Rücktritt entscheidet die Schule.</p>
    <p><b>Betreuungskarte:</b> Thema, Kurztitel fürs Abiturzeugnis (mit Zeichenzähler), bei modernen Fremdsprachen die Sprache der Arbeit (Englisch immer Englisch, sonst Fremdsprache oder Deutsch, § 24 Abs. 1 GSO), Wettbewerbsbeitrag statt Seminararbeit (§ 24 Abs. 3), Haken für Exposé bzw. Gliederung (12/2) und die Dokumentation der KI-Nutzung, Abgabe mit Uhrzeit und Fristverlängerung, Erklärung zur selbstständigen Anfertigung – alles wird sofort gespeichert.</p>
    <p><b>Beratungsgespräch:</b> Als Art „Beratungsgespräch“ gibt es die Felder des ISB-Feedbackbogens: bisher erledigt, Schwierigkeiten und Fragen, Rückmeldung, nächste Schritte, Zielvereinbarung, KI-Einsatz. Die Zielvereinbarung des letzten Gesprächs steht oben, die Leitfragen zum Halbjahr sind aufklappbar. Ausdruck mit zwei Unterschriften.</p>
    <p><b>Seminare und Leitfach:</b> W- und P-Seminar sind keine Fächer, sondern eine Kursart: Beim W-Seminar „Art des Kurses: W-Seminar“ wählen, beim P-Seminar (Jgst. 11) den Schalter „P-Seminar“ – und oben jeweils das <b>Leitfach</b> eintragen. Fachregeln (z. B. Notenschlüssel der modernen Fremdsprachen) gelten für Seminare nicht. Beim neuen Leistungsnachweis schlägt Libretto übliche Formen vor (Exposé, Exzerpt, Gliederungsentwurf, Recherche-Protokoll …). Im W-Seminar mit einer modernen Fremdsprache als Leitfach: Sprache der Arbeit (Englisch immer Englisch, sonst Fremdsprache oder Deutsch) und Prüfungsgespräch in der Fremdsprache (§ 24 Abs. 1 und 2 GSO); ein anerkannter Wettbewerbsbeitrag kann die Seminararbeit ersetzen (§ 24 Abs. 3).</p>${fig('wseminar', 'W-Seminar, Reiter Seminararbeit: Abgabe, Bewertung, Hinweise')}${fig('betreuung', 'Betreuungskarte mit Thema und Beratungsterminen')}`],
  ['wbew', 'W-Seminar: Bewertung und Prüfungsgespräch', 'Seminare', `
    <p><b>Bewertungsbögen (W-Seminar):</b> In der Betreuungskarte öffnen „Bewertungsbogen Seminararbeit“ und „Bewertungsbogen Prüfungsgespräch“ die Raster nach dem ISB-Material: die Arbeit nach Form, Sprache, Methode und Inhalt (Gewichtung 10/20/30/40 %, Einschätzung ++ bis ––, auf Wunsch Punkte je Bereich), das Prüfungsgespräch nach fünf Kompetenzen (Fach-, Argumentations-, Methoden- und Wissenschafts-, Darstellungs-, Reflexions- und Transferkompetenz) mit Punkten je Kompetenz. Libretto rechnet daraus einen <b>Vorschlag</b> (gewichteter Durchschnitt, gerundet) – die Punkte setzt du fest. Kriterien und Gewichte lassen sich je Kurs anpassen. Ausdruck als PDF oder Word, auch als leerer Bogen zum Ausfüllen von Hand. Das Prüfungsgespräch (§ 24 Abs. 2 GSO) dauert laut ISB-Übersicht insgesamt ca. 25 Minuten; ein Kurzvortrag von höchstens 5 Minuten zum Einstieg ist möglich.</p>
    <p><b>Prüfungsgespräche planen:</b> Im Reiter „Seminararbeit“ → „Prüfungsgespräche …“ trägst du Tag und Uhrzeit ein oder lässt freie Plätze automatisch füllen (Dauer, Pause, Gespräche je Tag, nur Schultage). Die Terminliste lässt sich mit oder ohne Themen drucken.</p>
    <p><b>Rechnung:</b> Gesamtleistung = (2 × Seminararbeit + Prüfungsgespräch) × 2/3, gerundet, höchstens 30 Punkte (§ 29 Abs. 6 GSO). Libretto zeigt je Person den Stand der Zulassung nach § 44 GSO (termingerechte Abgabe, Bewertung) – die Entscheidung trifft die Schule.</p>
    <p><b>Ausdrucke</b> (Drucken &amp; Export im W-Seminar): Bewertungsbögen für alle oder leer zum Ausfüllen, Terminliste der Prüfungsgespräche (mit oder ohne Themen), Betreuungsdokumentation je Person, Protokolle der Beratungsgespräche, Übertragsliste der Ergebnisse.</p>`],
  ['psem', 'P-Seminar', 'Seminare', `
    <p><b>Kurs anlegen:</b> Jahrgangsstufe 11, Schalter „P-Seminar“ einschalten und oben das Leitfach eintragen. Fachregeln des Leitfachs (z. B. Notenschlüssel der modernen Fremdsprachen) gelten im Seminar nicht. Beim neuen Leistungsnachweis schlägt Libretto übliche Formen vor (Projektbeitrag, Präsentation, Projektdokumentation …).</p>
    <p><b>P-Seminar</b> (Jgst. 11): ohne Schulaufgaben, mindestens zwei kleine Leistungsnachweise, vor allem individuelle Projektbeiträge. <b>Profilfächer</b> in 12/13 als normaler Kurs; bei fremdsprachiger Konversation heißt die „Schulaufgabe“ Konversationsübung (§ 22 Abs. 3 GSO).</p>`],
  ['sonder', 'Nachtermin, Krankheit, Abwesenheit, Nachteilsausgleich', 'Sonderfälle', `
    <p><b>Nachtermin:</b> ${kbd('E')} eintragen; die Übersicht und der Kalender listen offene Nachtermine. Die Note des Nachtermins trägst du später in dieselbe Zelle ein.</p>
    <p><b>Länger erkrankt, zu wenige Noten:</b> Fehlendes leer lassen oder B/E setzen – Libretto rechnet mit dem, was da ist. Kann keine Note gebildet werden: im Schülerblatt „Ohne Note“; die Übertragsliste weist auf die Bemerkung nach § 39 Abs. 6 GSO hin.</p>
    <p><b>Auslandsaufenthalt, längere Abwesenheit:</b> im Schülerblatt Beginn und Ende eintragen; Leistungsnachweise in dem Zeitraum stehen dann als „abw.“ in Tabelle und Ausdrucken.</p>
    <p><b>Gastschülerinnen und Gastschüler</b> (stehen oft auf keiner Klassenliste): unter „Kurs &amp; Schüler“ → „+ Gast“ anlegen – mit Zeitraum (von/bis) und der Vereinbarung, ob die Noten <b>zählen</b> oder nur <b>dokumentiert</b> werden. Am Namen steht dann „Gast“. Zählen die Noten nicht, bleiben sie aus Notenspiegel, Durchschnitten und Zeugnisnote heraus; Übertragsliste und Schülerblatt zeigen „Gast“ statt einer Note. Außerhalb des Zeitraums erscheinen Leistungsnachweise als „abw.“. Beim Klassen-Abgleich bleiben Gäste unberührt.</p>
    <p><b>Nachteilsausgleich und Notenschutz:</b> im Schülerblatt eintragen, was gilt (z. B. „25 % mehr Zeit“, „Rechtschreibung wird nicht bewertet“). Eine Marke <b>NA</b> bzw. <b>NS</b> steht dann neben dem Namen – in der Notentabelle und beim Eintragen. Bei Notenschutz erinnert die Übertragsliste an den Zeugnisvermerk. Über Art und Umfang entscheidet die Schule.</p>
    <p><b>Reihenfolge der Namen:</b> wie auf den Klassenlisten – „von“, „Freiherr von“ usw. zählen nicht zum Sortierwort.</p>`],
  ['zeugnis', 'Zeugnis, Übertrag und Elterngespräche', 'Zeugnis und Gespräche', `
    <p><b>Stand Zwischenzeugnis:</b> Der Stichtag unter Einstellungen steuert die Ansicht „Stand Zwischenzeugnis“ (§ 40 GSO). Die Zeugnisnote ist ein Vorschlag nach § 28 GSO; genau x,5 wird als Grenzfall markiert – die pädagogische Entscheidung triffst du im Schülerblatt unter „Zeugnisnote“ → „Festlegen“, mit Begründung.</p>
    
    <p><b>Übertrag ins Notenprogramm der Schule:</b> Mit „Übertrag“ merkst du dir, was schon im Infoportal steht – je Leistungsnachweis oder Note. ✓ = alles übertragen, <b style="color:var(--orange)">●</b> = danach geändert, Nachtrag nötig. Die Namen stehen in der Reihenfolge der Klassenliste. Libretto schickt nichts ab – es ist deine Merkhilfe. Die Übertragsliste zum Abhaken druckst du über „Drucken &amp; Export“.</p>
    <p><b>Elternsprechtag:</b> Im Schülerblatt (Klick auf den Namen) öffnet „Elternsprechtag-Ansicht“ eine große Ansicht mit Zeugnisnote, Durchschnitten und allen Noten in zeitlicher Folge; mit ← → geht es zur nächsten Person. Deine Notizen sind dort zunächst verborgen.</p>${fig('schuelerblatt', 'Schülerblatt mit Durchschnitten, allen Noten und Zeugnisnote')}${fig('uebertrag', 'Übertrag: was schon im Infoportal steht')}`],
  ['kalender', 'Kalender, Termine und Klassen austauschen', 'Organisation', `
    <p>Alle schriftlichen Leistungsnachweise im Monatskalender, mit Ferien und Feiertagen in Bayern, filterbar nach Klasse. <b>Schultermine einlesen:</b> im Infoportal unter Termine „als CSV exportieren“ und hier auswählen (auch ICS-Dateien). <b>Oder abonnieren:</b> Gibt es einen Link zum Schulkalender (ICS oder webcal – z. B. im Infoportal, auf der Homepage, Google- oder Outlook-Kalender), wählt „Schulkalender abonnieren …“. Libretto holt neue und geänderte Termine dann selbst (beim Start höchstens alle sechs Stunden, sonst „Jetzt aktualisieren“); abgerufen wird nur, gesendet nichts. Dazu: Terminprüfung nach § 22 GSO, offene Nachtermine und Schulaufgaben anderer Fächer deiner Klassen („Termin anderer Fächer“).</p>${fig('kalender', 'Kalender')}
    <p><b>Klassen austauschen:</b> exportiert deine Kurse (nur Namen und Klassen, keine Noten) als theis-Klassen-Datei – etwa für Voce – oder liest eine solche Datei ein. Libretto zeigt vorher, was neu, geändert oder entfallen ist; übernommen wird nur, was du anhakst, und vorher wird gesichert.</p>
    <p><b>Voce</b> (früher Viva): Nach einer mündlichen Schulaufgabe in Voce unter „Ergebnisse &amp; Bögen“ die „Notenliste (CSV für Excel)“ speichern; in Libretto im Leistungsnachweis unter „Noten aus Datei übernehmen“ wählen – die Noten werden über die Namen zugeordnet.</p>`],
  ['kalabo', 'Schultermine einlesen oder abonnieren – Schritt für Schritt', 'Organisation', `
    <p>Schultermine erscheinen grau im Kalender, in der Übersicht unter „Als Nächstes“ und helfen bei den Fristen fürs Notenmachen. Beides findest du unter <b>Einstellungen → Termine</b> oder im Kalender.</p>
    <p><b>Einmal einlesen (Datei):</b></p>
    <ol><li>Im Infoportal (oder einem anderen Schulkalender) die Termine als <b>CSV</b> oder <b>ICS</b> exportieren und speichern.</li>
      <li>In Libretto „Schultermine einlesen …“ wählen und die Datei öffnen.</li>
      <li>Libretto übernimmt die Termine und bietet erkannte Fristen (z. B. „Ausgabe des 1. Zwischenberichts“) zum Übernehmen an. Neue Termine kommen erst mit der nächsten Datei dazu.</li></ol>
    <p><b>Abonnieren (Link) – neue Termine kommen von selbst:</b></p>
    <ol><li>Den Link zum Schulkalender besorgen. Er endet meist auf <b>.ics</b> oder beginnt mit <b>webcal://</b>. Häufige Wege:
        <ul><li><b>Google Kalender</b> (im Browser): beim Kalender ⋮ → „Einstellungen und Freigabe“ → „Kalender integrieren“ → „Öffentliche Adresse im iCal-Format“ (bei nicht öffentlichen Kalendern: „Geheime Adresse im iCal-Format“).</li>
          <li><b>Outlook / Microsoft 365</b> (im Browser): Einstellungen → Kalender → „Freigegebene Kalender“ → „Kalender veröffentlichen“ → den <b>ICS</b>-Link kopieren.</li>
          <li><b>Apple iCloud</b>: in der Kalender-App beim Kalender „Freigeben“ → „Öffentlicher Kalender“ → Link kopieren (beginnt mit webcal://).</li>
          <li><b>Infoportal:</b> An manchen Schulen gibt es dort eine <b>ICS-Freigabe</b> der Schultermine (ein Link zum Kopieren). Wo sie steht und ob sie freigeschaltet ist, legt jede Schule selbst fest – im Zweifel die Schulverwaltung oder den Infoportal-Administrator fragen.</li>
          <li><b>Schulhomepage:</b> Steht dort „Kalender abonnieren“, „iCal“ oder „ICS“, ist das der Link.</li></ul>
        Das ist nicht an jeder Schule gleich; entscheidend ist nur, dass du einen Link auf eine ICS-Datei (oder webcal://) hast.</li>
      <li>In Libretto „Schulkalender abonnieren …“ wählen, den Link einfügen und „Abonnieren“ drücken.</li>
      <li>Libretto holt die Termine sofort und danach beim Start höchstens alle sechs Stunden; „Jetzt aktualisieren“ geht jederzeit. Abgerufen wird nur – Libretto sendet nichts an den Kalender.</li></ol>
    <p class="hint">Ein eingelesener Stand und ein Abo schließen sich aus: Liest du später eine Datei ein, endet das Abo (und umgekehrt). Deine Leistungsnachweise bleiben dabei immer unberührt.</p>`],
  ['fristen', 'Fristen fürs Notenmachen', 'Organisation', `
    <p><b>Fristen fürs Notenmachen:</b> Unter Einstellungen → „Fristen …“ (oder in der Übersicht) trägst du ein, bis wann die Noten stehen müssen: 1. und 2. Zwischenbericht <i>oder</i> Zwischenzeugnis (das entscheidet jede Schule, § 40 Abs. 2 GSO), Klassenkonferenz zum Halbjahr, Zeugnis 12/1 und 13/1, Ende 12/2, Zulassung zum Abitur, Jahreszeugnis – jeweils mit Termin und, wenn die Schule einen festlegt, Notenschluss. Liest du die Schultermine ein (CSV aus dem Infoportal), erkennt Libretto Titel wie „Ausgabe des 1. Zwischenberichts“, „Zeugnistermin Q12“ oder „Klassenkonferenzen zum Jahreszeugnis“ und bietet sie zum Übernehmen an. Jede Frist gilt nur für die passenden Kurse (Jgst. 5–11, Q12 oder Q13): Im Kurskopf steht die nächste Frist – ein Klick zeigt alle Fristen dieses Kurses (beim W-Seminar auch Themenwahl und Abgabe der Seminararbeit); eine Woche vorher erscheint oben ein Hinweis; in der Übersicht steht sie zwei Wochen vorher unter „Zu erledigen“ – mit fehlenden Noten und offenen Nachterminen.</p>
    <p class="hint">Ob deine Schule ein Zwischenzeugnis oder Zwischenberichte hat und wann Notenschluss ist, legt die Schule fest (§ 40 Abs. 2 GSO) – eingetragen wird nur, was es gibt.</p>`],
  ['druck', 'Ausdrucke und Export', 'Organisation', `
    <p>Jede Notenliste beginnt mit den Kennzahlen – der <b>Durchschnitt</b> steht groß und umrahmt oben links –, darunter die Liste mit der Zeile „Ø Klasse“, daneben Notenspiegel und Notenschlüssel mit Punktbereichen. „Detailliert“ zeigt zusätzlich die Punkte je Aufgabe bzw. je Prüfungsteil, Ø und Lösungsquote; bei Schulaufgaben heißt das Blatt „Auswertung für die Fachbetreuung“ und hat zwei Unterschriftsfelder. Außerdem: Notenübersicht des Kurses, Übertragsliste, Schülerblätter – als PDF, Word oder Excel.</p>${fig('drucken', 'Drucken & Export: PDF, Word oder Excel')}`],
  ['sicher', 'Sicherung, Sperre, Updates und Datenschutz', 'Einstellungen und Sicherheit', `
    <ul><li>Alle Daten liegen nur auf diesem Computer, verschlüsselt (AES-256-GCM). Kein Server, kein Konto, keine Übertragung von Noten oder Namen. Einzige Verbindung: die abschaltbare Abfrage der aktuellen Versionsnummer bei theisapps.de.</li>
      <li><b>Sicherung:</b> automatisch und verschlüsselt in deinen Sicherungsordner (USB-Stick, Cloud-Ordner), mit Versionen. Zusätzlich sichert Libretto auf diesem Computer. „Jetzt sichern“ in der Leiste.</li>
      <li><b>Notfallschlüssel:</b> Beim Einrichten erhältst du einen Notfallschlüssel – ausdrucken und gut aufbewahren. Ohne Passwort und Notfallschlüssel lassen sich die Daten nicht öffnen, auch nicht von theis.</li><li><b>Gelöscht?</b> Gelöschte Kurse, Leistungsnachweise und Termine lassen sich 60 Tage lang unter „Sicherung“ wiederherstellen.</li>
      <li><b>Speichern:</b> geschieht nach jeder Eingabe von selbst. ${kbd(K + 'S')} speichert sofort (auch einen gerade getippten Wert, auch in offenen Fenstern) und sichert höchstens alle zehn Minuten zusätzlich. Libretto behält die 30 neuesten Sicherungen und eine je Tag für 90 Tage – der Sicherungsordner bleibt klein (eine Sicherung ist meist nur einige Kilobyte bis wenige hundert Kilobyte groß).</li>
      <li><b>Alte Kurse löschen (Datenschutz):</b> Nach § 14a Abs. 2 der Lehrerdienstordnung sind eigene Notenaufzeichnungen spätestens zwei Jahre nach Ende des Schuljahres zu löschen, sofern nichts anderes bestimmt ist. Libretto zeigt solche Kurse in der Übersicht unter „Zu erledigen“ (oder unter Einstellungen → Sicherheit → „Alte Kurse“): „Löschen“ legt sie für 60 Tage in den Papierkorb, „Noch behalten“ blendet den Hinweis für ein Jahr aus. Von selbst löscht Libretto nie.</li>
      <li><b>Sperre:</b> nach 5, 10 oder spätestens 15 Minuten ohne Eingabe (Mindestsicherheitsstandards des Kultusministeriums; einstellbar unter Einstellungen); „Jetzt sperren“ ebenda.</li>
      <li><b>Touch ID (Mac):</b> Unter Einstellungen → Sicherheit lässt sich „Mit Touch ID entsperren“ einschalten (nur auf Macs mit Fingerabdrucksensor). Das Passwort wird dafür im Schlüsselbund dieses Mac verschlüsselt abgelegt, nie im Sicherungsordner. Beim Start und nach dem automatischen Sperren fragt der Mac gleich nach dem Fingerabdruck; sonst genügt ein Klick auf das Fingerabdruck-Zeichen im Passwortfeld. Das Passwort bleibt immer gültig: Auf dem Sperrbildschirm steht das Passwortfeld weiter zur Verfügung, und zum Wiederherstellen einer Sicherung brauchst du es weiterhin. Nach einer Passwortänderung passt sich Touch ID von selbst an. Unter Windows gibt es diese Möglichkeit (Windows Hello) derzeit nicht.</li>
      <li><b>Installieren:</b> Mac – die DMG-Datei öffnen und Libretto auf „Programme“ ziehen; beim ersten Öffnen meldet macOS, die App sei nicht überprüft: Das Blatt „Erster Start.pdf“ im selben Fenster zeigt in vier Schritten, wie man sie trotzdem öffnet (nur einmal nötig). Windows – „Libretto-Windows-Setup.exe“ ausführen; erscheint „Der Computer wurde durch Windows geschützt“, auf „Weitere Informationen“ und dann „Trotzdem ausführen“ klicken. Administratorrechte sind nicht nötig.</li>
      <li><b>Updates:</b> neue Version einfach über die alte installieren. Die Daten liegen getrennt von der App und bleiben erhalten; beim ersten Start einer neuen Version legt Libretto zusätzlich eine Sicherung an.</li>
      <li><b>Systemvoraussetzungen:</b> macOS 13 (Ventura) oder neuer – Apple-Chip oder Intel; Windows 10 oder 11 (64 Bit).</li>
      <li>Für Noten auf privaten Geräten ist in Bayern die Genehmigung der Schulleitung nötig (Mindestsicherheitsstandards des Kultusministeriums).</li></ul>${fig('sicherung', 'Sicherung')}`],
  ['einstellungen', 'Einstellungen und Aussehen', 'Einstellungen und Sicherheit', `
    <p>Die Einstellungen (unten links) sind nach Bereichen geordnet:</p>
    <ul><li><b>Allgemein:</b> Name und Schule für die Ausdrucke, Schuljahr und was beim Öffnen erscheint (Übersicht oder letzter Kurs).</li>
      <li><b>Termine:</b> Stichtag für die Ansicht „Stand Zwischenzeugnis“, Fristen fürs Notenmachen und die Schultermine – als Datei einlesen oder als Schulkalender abonnieren.</li>
      <li><b>Aussehen:</b> acht Farbwelten, hell/dunkel/automatisch, sechs Schriften, Textgröße, Ansicht der Kursliste, kompakte Zeilen und „Effekte reduzieren“ (ohne Glas- und Bewegungseffekte – spürbar schneller auf älteren Computern).</li>
      <li><b>Sicherheit:</b> automatische Sperre (5, 10 oder 15 Minuten), Touch ID (Mac), Suche nach Updates, Sicherung, Passwort und Notfallschlüssel, Klassen austauschen und alte Kurse löschen (Datenschutz).</li>
      <li><b>Über:</b> Version, Neuerungen, Hilfe als PDF, Quellenverzeichnis, Lizenzen.</li></ul>
    <p class="hint">Aussehen, Textgröße und Effekte gelten nur für diesen Computer und ändern weder Noten noch Ausdrucke.</p>${fig('einstellungen', 'Einstellungen, Bereich Aussehen')}`],
  ['gso', 'Regeln, die Libretto anwendet (GSO)', 'Regeln und Fragen', `
    <ul>
      <li><b>§ 28</b> Jahresfortgangsnote 5–11: Gesamtnote große LN und Gesamtnote kleine LN – bei zwei Schulaufgaben 1:1, bei mehr als zwei 2:1 (abweichend einstellbar). Fächer ohne Schulaufgaben: nur kleine LN. Rundung kaufmännisch; genau x,5 ist ein Grenzfall für deine Entscheidung.</li>
      <li><b>§ 22</b> Mindestzahl Schulaufgaben (Deutsch 3; Mathematik 4 in 5–7, sonst 3; Fremdsprachen 3, ab 4 Wochenstunden 4; übrige Fächer mit Schulaufgaben 2), Termine (mindestens eine Woche vorher angekündigt, höchstens 1 pro Tag, 2 pro Woche) und Q12/13 (je Halbjahr eine Schulaufgabe, in 13/2 nur auf erhöhtem Niveau und in Sport, Abs. 3).</li>
      <li><b>§ 25</b> Rückgabe binnen zwei Wochen, Schulaufgaben in 12/13 und Deutsch ab 10 binnen drei Wochen.</li>
      <li><b>§ 26 Abs. 4</b> Versäumnis ohne Entschuldigung oder Verweigerung: Note 6. <b>§ 27</b> Nachtermin, Ersatzprüfung.</li>
      <li><b>§ 29</b> Q12/13: Halbjahresleistung = (Schulaufgabe + Ø kleine LN) / 2, gerundet, keine Aufrundung auf 1 Punkt; 13/2 auf grundlegendem Niveau nur kleine LN (Schulaufgabe nur auf erhöhtem Niveau – das sind nach § 19 Abs. 1 Satz 7 GSO Deutsch, Mathematik und das Leistungsfach); Kunst/Musik als Leistungsfach je ein Drittel Schulaufgabe, Projekt bzw. praktische Prüfung, kleine LN; Sport (2 × praktisch + kleine LN) / 3; W-Seminar nur kleine LN; Seminararbeit (Arbeit × 2 + Prüfungsgespräch) × 2/3.</li>
      <li><b>§ 30, § 40</b> Hinweis bei möglicher Note 5/6 (Gefährdung des Vorrückens – Mitteilung prüfen).</li>
      <li><b>W-Seminar:</b> § 20, § 21 Abs. 3, § 24, § 29 Abs. 2 und 6, § 44. <b>P-Seminar:</b> § 20, § 21 Abs. 2.</li></ul>
    <p class="hint">Alle Fundstellen mit Datum stehen im Abschnitt <button type="button" class="linkbtn" data-hgo="quellen">Quellen und Rechtsgrundlagen</button>. Schulinterne Regelungen (Grundsätze der Lehrerkonferenz, Fachschaftsbeschlüsse) gehen vor, soweit die GSO sie zulässt.</p>`],
  ['spiel', 'Was Schule und Fachschaft selbst festlegen', 'Regeln und Fragen', `
    <p>Viele Regeln lassen bewusst Spielraum. Libretto macht dafür <b>Vorschläge</b> und lässt dich alles einstellen – es schreibt nichts vor, was die Schule entscheidet.</p>
    <ul><li><b>Lehrerkonferenz</b> (§ 21 Abs. 2, § 22 GSO): Grundsätze für Zahl, Art und Termine der Leistungsnachweise; Ersatz einer Schulaufgabe durch ein gleichwertiges Format; welche kleinen LN am Tag einer Schulaufgabe erlaubt sind; Ersatz des Zwischenzeugnisses durch Informationen (§ 40).</li>
      <li><b>Fachschaft</b>: Notenschlüssel (z. B. „Note 4 ab 50 %“) – in Libretto „als Standard für das Fach merken“; in den modernen Fremdsprachen nur im Rahmen der ISB-Vorgaben (ausreichend je nach Aufgabe ab 50–60 %) und in Q12/Q13 nicht für Schreiben, Sprachmittlung und Hörverstehen; Schreibprogramm in Deutsch; Abstimmung von Prüfungsformen.</li>
      <li><b>Lehrkraft</b> (BayEUG Art. 52, § 28 Abs. 1 GSO): Zahl und Art der kleinen LN, Gewichtung schriftlich/mündlich/praktisch (in Libretto: Gewichte je Art oder nach Bereichen), Aufgaben und Erwartungshorizont, pädagogische Festsetzung der Zeugnisnote – genau x,5 zeigt Libretto als Grenzfall.</li>
      <li><b>Nicht frei wählbar</b>: das Verhältnis groß : klein nach § 28 (1 : 1 bzw. 2 : 1 – Abweichungen nur begründet im Einzelfall, weil die GSO „grundsätzlich“ sagt), die Rechnung in Q12/13 (§ 29), Seminararbeit 2 : 1, die Raster in Q12/Q13 in den modernen Fremdsprachen, die zweigeteilte Schulaufgabe in Latein/Griechisch, die Abiturtabellen.</li></ul>`],
  ['quellen', 'Quellenverzeichnis', 'Regeln und Fragen', sourcesHTML() + `<div class="panelBtns"><button type="button" class="mini" data-srcpdf="1">Quellenverzeichnis als PDF</button></div>`],
  ['faq', 'Häufige Fragen', 'Regeln und Fragen', `
    <p><b>Ich habe mich vertippt.</b> Direkt danach „Rückgängig“ unten anklicken – oder die Zelle einfach neu füllen.</p>
    <p><b>Die Zeugnisnote ist ein Grenzfall.</b> Im Schülerblatt die Note festlegen und kurz begründen; auf der Übertragsliste steht dann „von der Lehrkraft festgelegt“.</p>
    <p><b>Eine Aufgabe ist schlecht ausgefallen.</b> Im Eingabeblatt den Faktor der Aufgabe auf × 0,5 setzen (oder die Aufgabe mit × entfernen) – alles rechnet sich neu.</p>
    <p><b>Mein Fachschaftsschlüssel ist anders.</b> „Eigene Grenzen“ wählen, Grenzen eintragen und „als Standard merken“ – gilt dann für jede neue Arbeit dieses Fachs.</p>
    <p><b>Passwort vergessen?</b> Beim Entsperren „Passwort vergessen?“ wählen und den Notfallschlüssel eingeben.</p>
    <p><b>Neuer Computer.</b> Libretto installieren, beim Start „Sicherung wiederherstellen …“ wählen und die .vault-Datei aus deinem Sicherungsordner öffnen.</p>
    <p><b>Fehler oder Wünsche?</b> Schreib an <b>hallo@theisapps.de</b>.</p>`]
  ];
  /* Einstellungen vor Sicherung (Reihenfolge innerhalb der Gruppe) */
  { const i = S.findIndex(x => x[0] === 'einstellungen'), j = S.findIndex(x => x[0] === 'sicher'); if (i > j && j >= 0) S.splice(j, 0, S.splice(i, 1)[0]); }
  const groups = [...new Set(S.map(x => x[2]))];
  const GI = { 'Erste Schritte': '①', 'Im Alltag': '✎', 'Leistungsnachweise': '▤', 'Szenarien nach Fächern': '◎', 'Seminare': '◆', 'Sonderfälle': '◐', 'Zeugnis und Gespräche': '✉', 'Organisation': '◷', 'Einstellungen und Sicherheit': '⚙', 'Regeln und Fragen': '§' };
  if (opts && opts.pdf) return helpPdf(S, groups, GI);
  const nav = groups.map(g => `<div class="hNavG"><div class="hNavGT"><i>${GI[g] || '•'}</i>${esc(g)}</div>${S.filter(x => x[2] === g).map(x => `<button type="button" class="hNavI" data-hgo="${x[0]}">${esc(x[1])}</button>`).join('')}</div>`).join('');
  const { dlg } = sheet({ title: 'Libretto – Hilfe', wide: true, ok: '', cancel: 'Schließen', body: `<div class="helpDoc hTwo">
    <aside class="hNav"><input type="search" id="hQ" class="hSearch" placeholder="Hilfe durchsuchen …" aria-label="Hilfe durchsuchen">
      <nav id="hToc">${nav}</nav>
      <button type="button" class="hPdf" id="hPdf"><b>Handbuch als PDF</b><small>vollständig, zum Ausdrucken</small></button></aside>
    <div class="hMain prose" id="hMain">
      <div class="hHero"><img src="icon.png" alt=""><div><div class="hHeroT">Libretto – Handbuch</div><div class="hHeroS">Version ${esc(APPV || '')} · ${S.length} Themen in ${groups.length} Bereichen · Bayerisches Gymnasium (G9)</div></div></div>
      <div class="notice"><div class="grow"><b>Wichtig:</b> ${esc(Print.DISCLAIMER)} Sichere zusätzlich selbst. Fehler oder Wünsche? Schreib an <b>hallo@theisapps.de</b>.</div></div>
      ${groups.map(g => `<div class="hGroup" data-hg="${esc(g)}"><div class="hGroupT"><i>${GI[g] || '•'}</i>${esc(g)}</div>${S.filter(x => x[2] === g).map(x => `<section class="hSec" id="h-${x[0]}"><h3>${esc(x[1])}</h3>${x[3]}</section>`).join('')}</div>`).join('')}
      <p class="hint" id="hNone" hidden>Nichts gefunden – versuch ein anderes Wort oder schreib an hallo@theisapps.de.</p></div></div>` });
  dlg.classList.add('helpDlg');
  const main = dlg.querySelector('#hMain');
  const mark = id => $$('.hNavI', dlg).forEach(b => b.classList.toggle('on', b.dataset.hgo === id));
  dlg.addEventListener('click', e => {
    const b = e.target.closest('[data-hgo]'); if (b) { const t = dlg.querySelector('#h-' + b.dataset.hgo); if (t) { main.scrollTo({ top: t.offsetTop - main.offsetTop - 8, behavior: 'smooth' }); mark(b.dataset.hgo); } }
    if (e.target.closest('[data-srcpdf]')) exportModel(modelSources(), 'pdf');
  });
  /* aktueller Abschnitt in der Leiste markiert */
  let raf = 0; main.addEventListener('scroll', () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; const y = main.scrollTop + 40; let cur = null;
    for (const sx of $$('.hSec', main)) { if (sx.hidden) continue; if (sx.offsetTop - main.offsetTop <= y) cur = sx; else break; }
    if (cur) mark(cur.id.slice(2)); }); }, { passive: true });
  mark(S[0][0]);
  if (opts && opts.topic) setTimeout(() => { const t = dlg.querySelector('#h-' + opts.topic); if (t) { main.scrollTo({ top: t.offsetTop - main.offsetTop - 8 }); mark(opts.topic); } }, 60);
  dlg.querySelector('#hQ').addEventListener('input', e => { const q = e.target.value.trim().toLowerCase(); let n = 0;
    $$('.hSec', dlg).forEach(sx => { const hit = !q || sx.textContent.toLowerCase().includes(q); sx.hidden = !hit; if (hit) n++; const nb = dlg.querySelector(`.hNavI[data-hgo="${sx.id.slice(2)}"]`); if (nb) nb.hidden = !hit; });
    $$('.hGroup', dlg).forEach(g => g.hidden = !$$('.hSec', g).some(sx => !sx.hidden));
    $$('.hNavG', dlg).forEach(g => g.hidden = !$$('.hNavI', g).some(x => !x.hidden));
    dlg.querySelector('#hNone').hidden = n > 0; });
  dlg.querySelector('#hPdf').onclick = async ev => { const btn = ev.currentTarget; btn.disabled = true;
    try { await helpPdf(S, groups, GI); } catch (err) { toast('PDF konnte nicht erstellt werden'); } finally { btn.disabled = false; } };
}

/* Handbuch als PDF: Titelseite, Inhaltsverzeichnis, je Bereich eine neue Seite; Bilder eingebettet */
async function helpPdf(S, groups, GI) {
  const st = (D && D.settings) || {};
  const box = document.createElement('div');
  box.innerHTML = S.map(x => `<section data-id="${x[0]}">${x[3]}</section>`).join('');
  box.querySelectorAll('button,input,.panelBtns').forEach(n => n.remove());
  for (const img of box.querySelectorAll('img')) {
    try { const bl = await (await fetch(img.getAttribute('src'))).blob(); img.src = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(bl); }); } catch (e) { img.closest('figure') ? img.closest('figure').remove() : img.remove(); }
  }
  const body = {}; box.querySelectorAll('section[data-id]').forEach(n => body[n.dataset.id] = n.innerHTML);
  let icon = ''; try { const bl = await (await fetch('icon.png')).blob(); icon = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(bl); }); } catch (e) {}
  const num = {}; let k = 0; groups.forEach((g, gi) => S.filter(x => x[2] === g).forEach((x, si) => num[x[0]] = (gi + 1) + '.' + (si + 1)));
  const css = `*{box-sizing:border-box}body{margin:0;font:10.2pt/1.5 -apple-system,"Segoe UI",Helvetica,Arial,sans-serif;color:#1b1d22;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .cover{height:252mm;display:flex;flex-direction:column;justify-content:space-between;padding:26mm 6mm 8mm;page-break-after:always}
  .cover img.ic{width:30mm;height:30mm;border-radius:7mm;box-shadow:0 2mm 6mm rgba(29,43,79,.18)}
  .cover .ey{font-size:9pt;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#6b7280;margin-top:18mm}
  .cover h1{font-size:38pt;line-height:1.05;margin:3mm 0 4mm;color:#1d2b4f;letter-spacing:-.02em}
  .cover .sub{font-size:14pt;color:#444;max-width:130mm}
  .cover .bar{height:2.2mm;width:42mm;background:#1d2b4f;border-radius:1mm;margin:9mm 0}
  .cover .facts{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm;margin-top:6mm}
  .cover .facts div{border:.3mm solid #d5d9e0;border-radius:3mm;padding:3.5mm 4mm}.cover .facts b{display:block;font-size:15pt;color:#1d2b4f}.cover .facts span{font-size:8.4pt;color:#5b6271;text-transform:uppercase;letter-spacing:.06em}
  .cover .foot{font-size:8.6pt;color:#5b6271;border-top:.3mm solid #d5d9e0;padding-top:3mm}
  .toc{page-break-after:always}.toc h2,.grp h2{font-size:20pt;color:#1d2b4f;margin:0 0 6mm;letter-spacing:-.01em}
  .toc .g{margin:0 0 4mm;break-inside:avoid}.toc .g b{display:block;font-size:9pt;text-transform:uppercase;letter-spacing:.08em;color:#1d2b4f;border-bottom:.3mm solid #1d2b4f;padding-bottom:1mm;margin-bottom:1.5mm}
  .toc .it{display:flex;gap:3mm;font-size:10pt;padding:.6mm 0}.toc .it i{font-style:normal;color:#6b7280;width:9mm;flex:none;font-variant-numeric:tabular-nums}
  .toc .cols{columns:2;column-gap:10mm}
  .grp{page-break-before:always}.grp:first-of-type{page-break-before:auto}
  .gh{display:flex;align-items:center;gap:4mm;border-bottom:.6mm solid #1d2b4f;padding-bottom:2.5mm;margin-bottom:5mm}
  .gh .n{font-size:9pt;font-weight:700;color:#fff;background:#1d2b4f;border-radius:1.6mm;padding:1mm 2.4mm}.gh h2{margin:0}
  section{margin:0 0 6mm}section h3{font-size:12.5pt;color:#1d2b4f;margin:0 0 2mm;break-after:avoid;page-break-after:avoid}
  section h3 i{font-style:normal;color:#8a93a6;font-weight:600;margin-right:2mm;font-variant-numeric:tabular-nums}
  p{margin:0 0 2.2mm;orphans:3;widows:3}ul,ol{margin:0 0 2.5mm;padding-left:5.5mm}li{margin:.6mm 0}
  .hint,.note{color:#4b5263;font-size:9.4pt;background:#f3f5fa;border-left:.8mm solid #9aa6c2;padding:2mm 3mm;border-radius:0 1.5mm 1.5mm 0;break-inside:avoid}
  .kbd{display:inline-block;border:.3mm solid #b9bec8;border-bottom-width:.6mm;border-radius:1.2mm;padding:0 1.4mm;font-size:8.6pt;font-family:inherit;background:#fff}
  figure{margin:2mm 0 4mm;break-inside:avoid;text-align:center}figure img{max-width:125mm;max-height:72mm;margin:0 auto;border:.3mm solid #d5d9e0;border-radius:2mm;display:block}
  table{border-collapse:collapse;width:100%;font-size:9pt;margin:1mm 0 3mm;break-inside:auto}th,td{border:.3mm solid #c9ced8;padding:1.2mm 2mm;text-align:left;vertical-align:top}th{background:#eef0f4}tr{break-inside:avoid}
  .hCards{display:grid;grid-template-columns:1fr 1fr;gap:3mm}.hCards>div{border:.3mm solid #d5d9e0;border-radius:2.5mm;padding:2.5mm 3mm;break-inside:avoid}.hCards p{margin:1mm 0 0;font-size:9.4pt}
  .srcDir{display:block}.srcGrp{margin:0 0 4mm}.srcGrp h4{font-size:9pt;text-transform:uppercase;letter-spacing:.07em;color:#1d2b4f;margin:4mm 0 1.5mm;break-after:avoid}
  .srcItem{display:grid;grid-template-columns:7mm 1fr 40mm;gap:0 3mm;padding:1.1mm 0;border-top:.2mm solid #e2e5eb;break-inside:avoid}.srcItem b,.srcItem span{display:block}.srcNo{color:#6b7280;font-weight:700;font-size:8.6pt}.srcT{font-weight:400}.srcW{color:#444;font-size:9pt;margin-top:.6mm}.srcW em{font-style:normal;color:#6b7280}.srcF{color:#5b6271;font-size:8.2pt;text-align:right}.srcL{display:block;font-size:7.8pt;color:#1d2b4f;word-break:break-all;margin-top:.6mm}.srcS{display:block;font-style:normal;font-size:7.4pt;color:#5b6271;margin-top:.5mm}
  a{color:#1d2b4f;text-decoration:none}`;
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>${css}</style></head><body>
  <div class="cover"><div>${icon ? `<img class="ic" src="${icon}" alt="">` : ''}<div class="ey">Handbuch · Version ${esc(APPV || '')}</div><h1>Libretto</h1><div class="sub">Notenverwaltung für Lehrkräfte am bayerischen Gymnasium (G9) – alles, was du zum Arbeiten brauchst.</div><div class="bar"></div>
    <div class="facts"><div><b>${S.length}</b><span>Themen</span></div><div><b>${groups.length}</b><span>Bereiche</span></div><div><b>${esc(new Date().toLocaleDateString('de-DE'))}</b><span>Stand</span></div></div></div>
    <div class="foot">${st.school ? esc(st.school) + ' · ' : ''}${st.teacher ? esc(st.teacher) + ' · ' : ''}Libretto ist kostenlos · theisapps.de · hallo@theisapps.de</div></div>
  <div class="toc"><h2>Inhalt</h2><div class="cols">${groups.map((g, gi) => `<div class="g"><b>${gi + 1} · ${esc(g)}</b>${S.filter(x => x[2] === g).map(x => `<div class="it"><i>${num[x[0]]}</i><span>${esc(x[1])}</span></div>`).join('')}</div>`).join('')}</div></div>
  ${groups.map((g, gi) => `<div class="grp"><div class="gh"><span class="n">${gi + 1}</span><h2>${esc(g)}</h2></div>${S.filter(x => x[2] === g).map(x => `<section><h3><i>${num[x[0]]}</i>${esc(x[1])}</h3>${body[x[0]]}</section>`).join('')}</div>`).join('')}
  </body></html>`;
  await N.savePdf('Libretto-Handbuch.pdf', html, false, Print.footer(st));
}

/* ======================================================================
   Seitenleiste: Bereiche, Kurse, Schnellzugriffe, Suche (nur Darstellung und Navigation – keine eigenen Daten)
   ====================================================================== */
const shortName = x => String(x.name || '').trim().split(/\s+/)[0].slice(0, 4) || '?';
let stFetched = 0;
function renderSide() {
  if (!D || !$('#sideCourses')) return;
  if (D.courses.length && !course()) UI.course = D.courses[0].id;
  const cv = courseViewMode();
  const sw = [['b', 'Nach Jahrgangsstufe', '☷'], ['c', 'Nach Fach', '≡'], ['e', 'Karten', '▦']].map(([k, t, i]) => `<button class="vsw${cv === k ? ' on' : ''}" data-cview="${k}" title="${t}" aria-label="${t}" aria-pressed="${cv === k}">${i}</button>`).join('');
  $('#sideCourses').innerHTML = `<div class="sideHead"><span class="ttl" title="Klassen und Kurse">Kurse</span><span class="vswBox">${sw}</span><button type="button" class="sideAdd" data-act="newCourse" title="Neuer Kurs" aria-label="Neuer Kurs">+</button></div>
    <div class="courses cv-${cv}">${D.courses.length ? courseListHtml(cv) : '<p class="hint sideEmpty">Noch keine Kurse – mit „+“ legst du den ersten an.</p>'}</div>
    <div class="sideMini">${D.courses.slice().sort(courseCmp).map(x => `<button class="citem mini0" data-course="${x.id}" aria-current="${x.id === UI.course}" title="${esc(x.name + ' · ' + (x.subject || ''))}" style="--hue:var(${hueOf(x.subject)})">${esc(shortName(x))}</button>`).join('')}</div>`;
  const c = course(), q = $('#sideCourseQ');
  q.textContent = c ? 'Im Kurs ' + c.name : 'Im Kurs'; q.parentNode.title = c ? c.name + ' · ' + (c.subject || '') : '';
  $$('#side [data-qa=newAssessment],#side [data-qa=editCourse],#side [data-qa=transfer],#side [data-qa=print]').forEach(b => b.disabled = !c);
  paintSideBk();
  if (Date.now() - stFetched > 30000) { stFetched = Date.now(); N.status().then(x => { if (x) { ST = x; paintSideBk(); } }).catch(() => {}); }
}
/* Sicherungsstand in der Leiste: grün, wenn die letzte Sicherung im Sicherungsordner höchstens 7 Tage her ist */
function paintSideBk() {
  const b = $('#sideBk'); if (!b || !ST) return;
  const days = ST.lastExternal ? (Date.now() - ST.lastExternal) / 864e5 : null;
  const bad = !!ST.lastLocalError || !ST.backupDir || !!ST.lastExternalError || days == null || days > 7;
  const info = ST.lastLocalError ? 'Sicherung fehlgeschlagen' : !ST.backupDir ? 'kein Sicherungsordner' : ST.lastExternalError ? 'Sicherungsordner nicht erreichbar' : 'zuletzt ' + ago(ST.lastExternal);
  b.classList.toggle('warn', bad);
  let sm = b.querySelector('small'); if (!sm) { sm = document.createElement('small'); b.querySelector('span').appendChild(sm); }
  sm.textContent = info; b.title = 'Jetzt sichern – ' + info;
  /* derselbe Stand als kleiner Punkt am Bereich „Sicherung“ – sichtbar, auch wenn „Allgemein“ eingeklappt ist */
  const tb = $('#tabs [data-tab=backup]'); if (tb) { let dot = tb.querySelector('.bkDot'); if (!dot) { dot = document.createElement('i'); dot.className = 'bkDot'; tb.appendChild(dot); } dot.classList.toggle('warn', bad); dot.title = 'Sicherung: ' + info; tb.title = 'Sicherung – ' + info; }
}
/* Ein- und Ausklappen (gemerkt auf diesem Gerät); bei schmalem Fenster automatisch eingeklappt */
function setSideC(on, keep = true) { document.body.classList.toggle('sideC', !!on); if (keep) { try { N.setCfg({ sideC: !!on }); } catch (e) {} } }
function sideNarrow() { document.body.classList.toggle('sideNarrow', innerWidth < 1080); }
function sidePeek(on) { document.body.classList.toggle('sidePeek', !!on); }
const sideSmall = () => document.body.classList.contains('sideC') || document.body.classList.contains('sideNarrow');
window.addEventListener('resize', sideNarrow); sideNarrow();
$('#sideToggle').onclick = () => { if (document.body.classList.contains('sideNarrow')) sidePeek(!document.body.classList.contains('sidePeek')); else setSideC(!document.body.classList.contains('sideC')); };
$('#side').addEventListener('click', async e => {
  const q = e.target.closest('[data-qa]'); if (!q || !D) return;
  const a = q.dataset.qa;
  if (['newAssessment', 'editCourse', 'transfer', 'print'].includes(a)) {
    if (!D.courses.length) { toast('Lege zuerst einen Kurs an'); return; }
    if (!course()) UI.course = D.courses[0].id;
    if (UI.tab !== 'grades') { UI.tab = 'grades'; render(); }
    sidePeek(false);
    if (a === 'newAssessment') assessmentSheet(course());
    if (a === 'editCourse') courseSheet(course());
    if (a === 'transfer') transferSheet(course());
    if (a === 'print') printSheet(course());
    return;
  }
  sidePeek(false);
  if (a === 'importList') {
    courseSheet();
    setTimeout(() => { const dl = [...document.querySelectorAll('dialog[open]')].pop(), b = dl && dl.querySelector('#dropImport'); if (b) { b.scrollIntoView({ block: 'center' }); b.classList.add('flash'); setTimeout(() => b.classList.remove('flash'), 1800); } }, 80);
  }
  if (a === 'otherDates') {
    UI.tab = 'dates'; render();
    setTimeout(() => { const i = document.getElementById('cdSubj'); if (i) { i.closest('section').scrollIntoView({ block: 'center' }); i.focus(); } }, 60);
  }
  if (a === 'klassen') klassenSheet();
  if (a === 'backupNow') { const r = await flush().then(() => N.backupNow()); ST = await N.status(); stFetched = Date.now(); toast(bkMsg(r), r && r.ok ? 2600 : 6000); render(); }
});
/* Suche: Schüler und Kurse (ohne Akzente, Groß/klein egal) */
const sNorm = x => String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ');
let sideHits = [], sideAt = 0;
function sideFind(q) {
  q = sNorm(q).trim(); if (!q || !D) return [];
  const words = q.split(' ');
  const hit = t => { t = sNorm(t); return words.every(w => t.includes(w)); };
  const out = D.courses.filter(c => hit(c.name + ' ' + (c.subject || ''))).map(c => ({ c }));
  D.courses.forEach(c => c.students.forEach(s => { if (hit(s.name + ' ' + (s.cls || ''))) out.push({ c, s }); }));
  return out.slice(0, 12);
}
function paintSideRes() {
  const box = $('#sideRes'), q = $('#sideQ').value.trim();
  if (!q) { box.hidden = true; box.innerHTML = ''; return; }
  box.hidden = false;
  box.innerHTML = sideHits.length ? sideHits.map((h, i) => `<button class="sr${i === sideAt ? ' on' : ''}" data-sr="${i}" role="option" aria-selected="${i === sideAt}">${h.s ? `<b>${esc(h.s.name)}</b><small>${esc(h.c.name)} · ${esc(h.c.subject || '')}</small>` : `<b>${esc(h.c.name)}</b><small>Kurs · ${esc(h.c.subject || '')} · ${h.c.students.length} Schüler</small>`}</button>`).join('') : '<p class="hint" style="margin:6px 10px">Nichts gefunden</p>';
}
function sideGo(i) {
  const h = sideHits[i]; if (!h) return;
  $('#sideQ').value = ''; sideHits = []; paintSideRes(); $('#sideQ').blur(); sidePeek(false);
  pickCourse(h.c.id);
  if (h.s) setTimeout(() => studentSheet(h.c, h.c.students.find(x => x.id === h.s.id)), 30);
}
$('#sideQ').addEventListener('input', () => { sideHits = sideFind($('#sideQ').value); sideAt = 0; paintSideRes(); });
$('#sideQ').addEventListener('keydown', e => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (sideHits.length) { sideAt = (sideAt + (e.key === 'ArrowDown' ? 1 : -1) + sideHits.length) % sideHits.length; paintSideRes(); } }
  else if (e.key === 'Enter') { e.preventDefault(); sideGo(sideAt); }
  else if (e.key === 'Escape') { $('#sideQ').value = ''; sideHits = []; paintSideRes(); $('#sideQ').blur(); sidePeek(false); }
});
$('#sideRes').addEventListener('mousedown', e => { const b = e.target.closest('[data-sr]'); if (b) { e.preventDefault(); sideGo(+b.dataset.sr); } });
$('#sideQ').addEventListener('blur', () => setTimeout(() => { if (document.activeElement !== $('#sideQ')) { $('#sideRes').hidden = true; if (sideSmall() && !$('#sideQ').value) sidePeek(false); } }, 150));
$('#sideQ').addEventListener('focus', () => { if ($('#sideQ').value) paintSideRes(); });
const sideSearchFocus = () => { if (sideSmall()) sidePeek(true); setTimeout(() => { $('#sideQ').focus(); $('#sideQ').select(); }, 30); };
$('#sideSearchBtn').onclick = sideSearchFocus;
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && !e.altKey && (e.key === 'k' || e.key === 'K') && D && !$('#appRoot').hidden && !document.querySelector('dialog[open]')) { e.preventDefault(); sideSearchFocus(); }
});
document.addEventListener('mousedown', e => { if (document.body.classList.contains('sidePeek') && !e.target.closest('#side')) sidePeek(false); });

/* ======================================================================
   Aussehen: Theme (Farbwelt) und Hell/Dunkel – je Gerät gemerkt, unabhängig von den Noten
   ====================================================================== */
const SKIN_SW = {"standard": ["#E9ECF4", "#0A6CFF", "#FF9CC2"], "apple": ["#F2F2F7", "#007AFF", "#5856D6"], "neon": ["#f6f0ff", "#d4127a", "#2f5bff"], "heft": ["#f4efe2", "#2c4a9a", "#c0392b"], "graphit": ["#ffffff", "#0040d0", "#000000"], "laguna": ["#f1f7f7", "#0b7f8e", "#0a64a8"], "glut": ["#fff6ee", "#c2410c", "#b3261e"], "wald": ["#f1f8f3", "#166534", "#0e7490"]};
const SKINS = [['standard', 'Liquid Glass'], ['apple', 'Apple'], ['neon', 'Neon'], ['heft', 'Heft'], ['graphit', 'Graphit'], ['laguna', 'Laguna'], ['glut', 'Glut'], ['wald', 'Wald']];
const FONTS = [['standard', 'Inter', 'Inter, system-ui, sans-serif', 'Standard'], ['nunito', 'Nunito', "'Nunito', ui-rounded, sans-serif", 'rund und freundlich'], ['lora', 'Lora', "'Lora', Georgia, serif", 'mit Serifen'], ['grotesk', 'Space Grotesk', "'Space Grotesk', sans-serif", 'technisch'], ['atkinson', 'Atkinson Hyperlegible', "'Atkinson Hyperlegible', sans-serif", 'besonders gut lesbar'], ['jost', 'Jost', "'Jost', 'Century Gothic', sans-serif", 'geometrisch']];
/* Hell/Dunkel wird immer ausdrücklich gesetzt (data-theme), bei „Automatisch“ nach dem Gerät – und folgt ihm, wenn es umschaltet */
const darkMq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
let lookMode = 'auto';
/* 1.1: drei fast gleiche Farbwelten entfernt – wer eine gewählt hatte, bekommt die ähnliche */
const SKIN_OLD = { klar: 'apple', terrakotta: 'glut', salbei: 'wald' };
function applyLook(skin, mode, font) {
  skin = SKIN_OLD[skin] || skin;
  const r = document.documentElement;
  const sk = SKINS.some(x => x[0] === skin) ? skin : 'standard';
  if (sk === 'standard') r.removeAttribute('data-skin'); else r.setAttribute('data-skin', sk);
  lookMode = mode === 'light' || mode === 'dark' ? mode : 'auto';
  r.setAttribute('data-theme', lookMode === 'auto' ? (darkMq && darkMq.matches ? 'dark' : 'light') : lookMode);
  if (font !== undefined) { const f = FONTS.some(x => x[0] === font) ? font : 'standard'; if (f === 'standard') r.removeAttribute('data-font'); else r.setAttribute('data-font', f); }
}
if (darkMq) { const on = () => { if (lookMode === 'auto') document.documentElement.setAttribute('data-theme', darkMq.matches ? 'dark' : 'light'); }; if (darkMq.addEventListener) darkMq.addEventListener('change', on); else if (darkMq.addListener) darkMq.addListener(on); }
applyLook('standard', 'auto');   /* sofort, bevor die gemerkte Einstellung geladen ist – kein Aufblitzen in der falschen Helligkeit */

/* ---------- Über Libretto ---------- */
const SITE_URL = 'https://theisapps.de/', SUPPORT_URL = 'https://buy.stripe.com/3cI3cv0i8eLk31g4mNgw000';
/* Was ist neu – je Version (neueste zuerst); im Fenster „Über Libretto“ */
const CHANGES = [
  ['1.1.4', ['Schülerübersichten jetzt auch grafisch: Ring für die Notenpunkte, jede Teilnote als Balken auf der Skala 0–15 und ein Gesamtbalken, der zeigt, wie viel jeder Teil beiträgt', 'Fenster: Aus einem Unterfenster (z. B. Teilnoten eintragen, Quellenverzeichnis, Fristen) kommst du beim Schließen wieder dorthin zurück, wo du warst – nicht gesicherte Eingaben bleiben erhalten', 'Ausdrucke: Balken in den Schülerübersichten überall exakt gleich dick, Schriftgrößen vereinheitlicht']],
  ['1.1.3', ['Neu: Schülerübersichten für Klausuren nach Prüfungsteilen (Oberstufe) – je Schüler ein Abschnitt mit allen Prüfungsteilen, Teilnoten und der vollständigen Rechnung, drei je A4-Seite zum Ausschneiden']],
  ['1.1.2', ['Touch ID schöner eingebunden: Fingerabdruck-Zeichen direkt im Passwortfeld statt eigener Schaltfläche; der Mac fragt beim Start und nach dem automatischen Sperren von selbst; klarere Abfrage („Libretto“ möchte deine Noten öffnen)', 'Schärfere Bilder in Hilfe und Handbuch, neues Bild „Kurs aus mehreren Klassen“']],
  ['1.1.1', ['Touch ID am Mac: Libretto lässt sich mit dem Fingerabdruck entsperren (freiwillig, unter Einstellungen → Sicherheit) – das Passwort bleibt immer gültig', 'Notentabelle: Noten stehen exakt untereinander – der Hinweis-Punkt bei gefährdeten Schülern verschiebt die Note nicht mehr', 'Übersicht: Notenverteilung je Kurs als schmaler Farbbalken, beide Spalten gleich hoch, klarere Hinweise', 'Farbwelten aufgeräumt: acht statt elf (Klar, Terrakotta und Salbei waren fast gleich wie Apple, Glut und Wald – wer sie gewählt hatte, bekommt automatisch die ähnliche)', 'Schalter im Dunkelmodus besser erkennbar', 'Neuer Leistungsnachweis: In Fächern mit Schulaufgaben ist „Schulaufgabe“ vorausgewählt, bis die Mindestzahl erreicht ist', 'Hinweis, wenn das Datum eines Leistungsnachweises in die Ferien, auf einen Feiertag oder ein Wochenende fällt', 'W-Seminar und 13/2 ohne Schulaufgabe: keine leere Spalte „Ø SA“ mehr', 'Zweigeteilte Schulaufgabe (Latein, Griechisch): leere Felder zeigen „…“ – Klick öffnet die Eingabe der Teile', 'Hilfe und Handbuch überarbeitet: 18 aktuelle Bildschirmfotos, neue Funktionen beschrieben, Voce statt Viva; Quellenverzeichnis ergänzt (GSO § 19, Feiertagsgesetz), alle Links am 21.11.2026 geprüft', 'Handbuch als PDF speichern klappt jetzt auch mit vielen Bildern (vorher konnte es bei großen Ausdrucken scheitern)']],
  ['1.1.0', ['Leistungsfach Sport: Fach Sport und Sporttheorie in einem Kurs – Libretto rechnet die Endpunktzahl nach der Bekanntmachung zum Sportunterricht in Q12/Q13 (Nr. 2.3.1): beide Teile gerundet, dann der Durchschnitt, keine Aufrundung auf 1 Punkt', 'Datenschutz: Hinweis in der Übersicht, wenn Kurse älter als zwei Schuljahre sind (LDO § 14a) – mit Löschen oder „Noch behalten“; Libretto löscht nie von selbst', 'Technik erneuert: aktuelle Electron-Version (45), PDF-Leser pdf.js 6 und Excel-Leser SheetJS 0.20.3 mit allen Sicherheitskorrekturen', 'Notentabelle: Tab und Enter springen ohne Verzögerung weiter – kein Tastendruck geht verloren', 'Punkte-Spalten zeigen groß die Note und klein die Punkte – beim Eintippen wie gewohnt die Punkte', 'Aufgabenblatt: Felder stehen in jeder Fenstergröße exakt unter ihren Spaltenköpfen', 'Neue Installation: DMG für den Mac mit Anleitung für den ersten Start, Installationsprogramm für Windows im neuen Design', 'Einstellungen → Termine: Schultermine aus Datei einlesen oder Schulkalender abonnieren; Einstellungen → Sicherheit: Klassen austauschen und alte Kurse', 'Hilfe und Handbuch ergänzt: Kalender-Abo Schritt für Schritt, Gastschüler, Zwischensumme, Speichern, Löschhinweis', '⌘S bzw. Strg+S speichert überall – auch in offenen Fenstern und mit gerade getipptem Wert; eine Sicherung höchstens alle zehn Minuten', 'Punkte je Aufgabe: Schreibaufgabe und Sprachmittlung zeigen ihre Zwischensumme mit Faktor (z. B. (4 + 6) × 2 = 20) – zum Übertragen auf den Korrekturbogen', 'Neu: macOS 13 (Ventura) oder neuer nötig']],
  ['1.0.12', ['Aufgabenpunkte: Wird eine Aufgabe gelöscht, ergänzt oder werden Punkte eingefügt, rechnet die Summe immer neu – von Hand eingetragene Gesamtpunkte bleiben stehen und sind mit ✎ markiert', 'Passt der Notenschlüssel nicht mehr zur Summe (z. B. nur noch 1 BE), gibt es keine Note statt einer falschen – mit deutlichem Hinweis', 'Gleiche Namen: Notenblatt und Klassen-Abgleich ordnen nichts mehr unsicher zu (andere Klasse, gleicher Name ohne Kennung); beim Einfügen gleicher Namen fragt Libretto nach', 'Gast ohne Wertung und „ohne Note“ jetzt in allen Ausgaben gleich: Übertragsliste, Schülerblatt, Notenübersicht, CSV', 'Hörverstehen: nur ganze BE auch im Aufgabenblatt und beim Einfügen; Prüfungsteil „BE · Hörverstehen“ als eigene Art', 'Ersatz-Schulaufgabe in zwei Teilen zählt beim Verhältnis 1 : 1 / 2 : 1 als eine Arbeit', 'Ferienkalender bis Sommer 2030 (Ferienordnung vom 07.12.2022); danach schlägt Libretto keine Abgabefrist vor', 'Kalender-Abo: Zeit- und Größenlimit gelten für den ganzen Download', 'Quellenverzeichnis mit geprüften Links zu allen Originalen; W-Seminar: Prüfungsgespräch „ca. 25 Minuten“ laut ISB-Übersicht']],
  ['1.0.11', ['Moderne Fremdsprachen: kein KMK-Raster mehr (KMS vom 08.03.2023: ausreichend je nach Aufgabe 50–60 %, ungenügend unter 33 %); ältere Arbeiten mit KMK-Raster werden einmal zur Prüfung angezeigt – nichts ändert sich von selbst', 'Schnellwahl 4 ab 50 / 55 / 60 %', 'W-Seminar: Leitfragen der Seminararbeit wörtlich nach Anlage 5a; Bewertungsbogen wieder auf einer Seite', 'Alle Ausdrucke geprüft: kein fast leeres letztes Blatt mehr (Liste wird bei Bedarf etwas enger gesetzt), Word im Querformat richtig, keine leere Seite zwischen Bögen, Zahl und Einheit nie getrennt, Q12/Q13 „BE“ und „Punkte“ einheitlich']],
  ['1.0.10', ['Hörverstehen Q12/Q13 wie die ISB-Rechentabelle (Lösungsgrad, Grenzen ungerundet, nur ganze BE)', 'Prüfungsteile: Gesamtnote wird erst am Ende gerundet (wie die Rechentabelle); Vorlagen nach dem ISB-Leitfaden 04/2025; fehlende BE deutlich markiert', 'Sporttheorie als eigene Punktzahl (§ 29 Abs. 2 GSO)', 'Gastschüler: Zeitraum, Noten zählen oder nur dokumentieren', 'Schulkalender abonnieren (ICS/webcal-Link)', 'Gleichnamige Schüler werden beim Einlesen nicht mehr verwechselt', 'Festgelegte Zeugnisnote getrennt für Zwischen- und Jahreszeugnis', 'Mehr Sicherheit: Schließen nur nach erfolgreichem Speichern, Sperre auch bei Speicherfehler, Wiederherstellen in sicheren Schritten', 'Quellenverzeichnis mit Fundstellen, Links und Prüfstand', 'Notenschlüssel werden vor dem Speichern geprüft; Verhältnis 2 : 1 von Anfang an nach der Mindestzahl der Schulaufgaben']],
  ['1.0.9', ['Einstellungen neu geordnet: Farbwelten und Schriften als Auswahl, Textgröße, „Effekte reduzieren“ für ältere Computer, Ansicht der Kursliste', 'Neues Anmeldefenster mit „Passwort anzeigen“ und Hinweis bei Feststelltaste', 'Hilfe überarbeitet und vollständig – auch als PDF zum Ausdrucken', 'Strukturiertes Quellenverzeichnis aller Rechtsgrundlagen, auch als PDF', 'Q12/Q13 mit amtlicher BE-Tabelle: Grenzen immer ganze BE']],
  ['1.0.8', ['W- und P-Seminar mit Leitfach statt als „Fach“', 'Fach-Auswahl mit eigener, aufgeräumter Liste', 'Kursliste und Übersicht nach Stufen: Oberstufe ab Jahrgangsstufe 11, Seminare eigens']],
  ['1.0.7', ['W-Seminar: Bewertungsbögen nach ISB-Vorlage für Seminararbeit und Prüfungsgespräch (auch leer zum Ausfüllen)', 'Beratungsgespräch mit Zielvereinbarung und Leitfragen', 'Terminliste der Prüfungsgespräche', 'Kurztitel fürs Abiturzeugnis', '„Prüfungsgespräch“ wie in der GSO 2026', 'Unterschriftsfeld im Ausdruck nie allein auf einer neuen Seite']],
  ['1.0.6', ['Fristen fürs Notenmachen (Zwischenbericht, Halbjahr, Q12/Q13, Jahreszeugnis) – auch aus den Schulterminen', 'Simulationen lassen sich drucken', 'Nachtermin (NT) zählt für die Person, nicht im Notenspiegel der Arbeit', '„Gewertet: x von y“ zeigt, wer mitzählt', 'Fußzeile im Ausdruck gut lesbar, Fenster rollen flüssiger']],
  ['1.0.5', ['Faktor-Simulation direkt im Fenster „Leistungsnachweis bearbeiten“']],
  ['1.0.4', ['Simulationen mit ganzer Klassenliste – wer sich ändert, ist farbig markiert', 'Simulation: Was passiert, wenn eine Aufgabe halb oder doppelt zählt?', 'Ausdrucke ohne Umbruch mitten in der Auswertung']],
  ['1.0.3', ['Amtliche BE-Tabelle für Q12/Q13', '„Eigene Grenzen“ in Q12/Q13 ab der untersten 4 (4 Punkte)', 'Hilfe mit Quellenverzeichnis']]];
const NEW_IN = 'Neu in ' + CHANGES[0][0] + ': ' + CHANGES[0][1].join(' · ');
async function openAbout() {
  const old = document.getElementById('abDlg'); if (old) { old.close(); old.remove(); }
  const v = await N.version();
  const d = document.createElement('dialog'); d.id = 'abDlg'; d.className = 'abdlg';
  d.innerHTML = `<button type="button" class="abx" aria-label="Schließen">×</button>
    <div class="abtop"><div class="abicon"><img src="icon.png" alt="" width="104" height="104"></div><h2 class="abname">Libretto</h2><div class="abver">Version ${esc(v)}</div>
      <p class="abline">Notenverwaltung für das bayerische Gymnasium – rechnet nach der GSO, verschlüsselt auf deinem Computer.</p></div>
    <div class="abacts"><a class="abbtn" href="${SITE_URL}" target="_blank" rel="noopener">Website</a><a class="abbtn pri" href="${SUPPORT_URL}" target="_blank" rel="noopener">☕ Einen Kaffee ausgeben</a></div>
    <div class="abnew"><h3>Neu in Version ${esc(CHANGES[0][0])}</h3><ul>${CHANGES[0][1].map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      <details class="abold"><summary>Frühere Versionen</summary>${CHANGES.slice(1).map(([vv, it]) => `<h4>${esc(vv)}</h4><ul>${it.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`).join('')}</details></div>
    <p class="abnote">Alle Daten bleiben auf diesem Gerät. · Berechnungen nach der GSO ohne Gewähr – die Verantwortung für die Notengebung liegt bei der Lehrkraft.</p>
    <div class="ablinks"><button type="button" id="abHelp">Hilfe</button><button type="button" id="abSrc">Quellenverzeichnis</button><button type="button" id="abLic">Lizenzen</button></div>
    <div class="abfoot"><span>© 2026</span>${window.THEISAPPS_LOGO}</div>`;
  document.body.appendChild(d);
  const close = () => { d.close(); d.remove(); };
  d.querySelector('.abx').onclick = close;
  d.addEventListener('click', e => { if (e.target === d) close(); });
  d.addEventListener('cancel', e => { e.preventDefault(); close(); });
  d.querySelector('#abLic').onclick = () => openLicenses();
  d.querySelector('#abHelp').onclick = () => { if (D) helpSheet(); else close(); };
  d.querySelector('#abSrc').onclick = () => sourcesSheet();
  d.showModal();
}
$('#aboutBtn').innerHTML = window.THEISAPPS_LOGO;
$('#aboutBtn').onclick = () => openAbout();
/* Schnellzugriffe in der Leiste ein- und ausklappen (auf diesem Gerät gemerkt) */
function applySideG(g) { $$('#sideActs .sideGroup').forEach(b => { const open = g && b.dataset.sg in g ? g[b.dataset.sg] !== false : b.dataset.sg !== 'g';   /* „Allgemein“ ist anfangs eingeklappt – so bleibt Platz für die Kursliste */ b.setAttribute('aria-expanded', String(open)); }); }
$('#sideActs').addEventListener('click', e => {
  const b = e.target.closest('.sideGroup'); if (!b) return;
  const open = b.getAttribute('aria-expanded') !== 'true'; b.setAttribute('aria-expanded', String(open));
  ST.sideG = { ...(ST.sideG || {}), [b.dataset.sg]: open }; try { N.setCfg({ sideG: ST.sideG }); } catch (err) {}
});

/* Menü */
/* ⌘S / Strg+S – überall, auch mit offenem Fenster: 1. gerade getippten Wert übernehmen (wie Enter), 2. sofort speichern,
   3. eine Sicherung höchstens alle 10 Minuten (sonst verdrängen viele Sicherungen am selben Tag die älteren Stände). */
let lastShortcutBk = 0;
async function saveShortcut() {
  const el = document.activeElement;
  if (el && el.matches && el.matches('input:not([type=checkbox]):not([type=radio]):not([type=file]), textarea') && !el.readOnly && !el.disabled && el.value !== el.defaultValue) el.dispatchEvent(new Event('change', { bubbles: true }));
  try { await flush(); } catch (e) { toast('Speichern fehlgeschlagen – Libretto versucht es weiter', 6000); return; }
  if (Date.now() - lastShortcutBk < 10 * 60e3) { toast('Gespeichert ✓', 1600); return; }
  const r = await N.backupNow(); if (r && r.ok) lastShortcutBk = Date.now();
  toast(r && r.ok ? 'Gespeichert und gesichert ✓' : bkMsg(r), r && r.ok ? 2200 : 6000);
}
N.onMenu(cmd => {
  if (!D) return;
  if (cmd === 'newCourse') courseSheet();
  if (cmd === 'newAssessment') assessmentSheet(course());
  if (cmd === 'pdf' && course()) exportModel(modelCourse(course()), 'pdf');
  if (cmd === 'csv' && course()) exportModel(modelCourse(course()), 'csv');
  if (cmd === 'licenses') openLicenses();
  if (cmd === 'backup') saveShortcut();
  if (cmd === 'lock') lockNow();
  if (cmd === 'settings') settingsSheet();
  if (cmd === 'help') helpSheet();
});
N.onMenu(cmd => { if (cmd === 'about') openAbout(); });

/* Start */
(async () => {
  const pf = await N.platform(); if (pf === 'darwin') document.body.classList.add('mac');
  ST = await N.status();
  if (SKIN_OLD[ST.skin]) { ST.skin = SKIN_OLD[ST.skin]; N.setCfg({ skin: ST.skin }).catch(() => {}); }
  applyLook(ST.skin, ST.mode, ST.font); applyFx(ST.fx); applyZoom(ST.zoom); setSideC(!!ST.sideC, false); applySideG(ST.sideG); document.body.classList.toggle('dense', !!ST.dense);
  $('#sideKbd').textContent = pf === 'darwin' ? '⌘K' : 'Strg+K';
  if (!ST.exists) setupStep(1); else renderLock('pw', '', { autoTid: true });
})();
