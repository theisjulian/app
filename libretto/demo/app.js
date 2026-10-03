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
  return { v: 1, settings: { teacher: '', school: '', year: R.schoolYearOf(), half1End: '', autoLock: 10 }, courses: [], classDates: [], events: [] };
}
let saveT = null;
let READONLY = false, POLICY = null;
function save() { if (READONLY) return; clearTimeout(saveT); saveT = setTimeout(() => { if (D) N.save(D).catch(e => toast('Speichern fehlgeschlagen: ' + e.message)); }, 400); }
function flush() { clearTimeout(saveT); if (D) return N.save(D); return Promise.resolve(); }
addEventListener('beforeunload', () => { if (D) { clearTimeout(saveT); N.saveSync(D); } });

function toast(msg, ms = 2600) { const t = $('#toast'); t.classList.remove('act'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), ms); }
function toastAction(msg, label, fn, ms = 6000) { const t = $('#toast'); t.innerHTML = `<span>${esc(msg)}</span><button type="button">${esc(label)}</button>`; t.classList.add('show', 'act'); t.querySelector('button').onclick = () => { t.classList.remove('show', 'act'); fn(); }; clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show', 'act'), ms); }
const course = () => D && D.courses.find(c => c.id === UI.course);
const upper = c => R.isUpper(c);

/* ---------- Dialoge ---------- */
function sheet({ title, body, ok = 'Sichern', cancel = 'Abbrechen', wide, small, onOk, onOpen, footer = '', allowRO }) {
  if (READONLY && ok && !allowRO) { ok = ''; cancel = 'Schließen'; }
  const dlg = document.createElement('dialog');
  if (wide) dlg.className = 'wide'; if (small) dlg.className = 'small';
  dlg.innerHTML = `<form method="dialog"><div class="sheethead"><button type="button" class="linkish" data-x>${esc(cancel)}</button><h2>${esc(title)}</h2>${ok ? `<button type="submit" class="linkish strong">${esc(ok)}</button>` : '<span></span>'}</div><div class="sheetbody">${body}${footer}</div></form>`;
  document.body.appendChild(dlg);
  const close = () => { dlg.close(); dlg.remove(); document.body.classList.remove('modal'); };
  dlg.querySelector('[data-x]').onclick = close;
  dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });
  dlg.querySelector('form').addEventListener('submit', async e => { e.preventDefault(); if (!onOk || (await onOk(dlg)) !== false) close(); });
  document.body.classList.add('modal');
  dlg.showModal(); if (onOpen) onOpen(dlg, close);
  return { dlg, close };
}
function ask(text, okLabel = 'OK', danger = false, title = 'Bitte bestätigen') {
  return new Promise(res => {
    const { dlg, close } = sheet({ title, small: true, ok: '', cancel: 'Abbrechen', body: `<p class="prose" style="margin:0">${text}</p><div class="askBtns"><button type="button" class="mini" data-n>Abbrechen</button><button type="button" class="mini ${danger ? 'dangerFill' : 'accent'}" data-y>${esc(okLabel)}</button></div>`,
      onOpen: d => { d.querySelector('[data-n]').onclick = () => { close(); res(false); }; d.querySelector('[data-y]').onclick = () => { close(); res(true); }; d.querySelector('[data-x]').addEventListener('click', () => res(false)); } });
  });
}
const field = (label, inner, cls = '') => `<label class="field ${cls}"><span>${label}</span>${inner}</label>`;
const sw = (id, on, label) => `<div class="row"><span>${label}</span><input type="checkbox" class="sw" id="${id}" ${on ? 'checked' : ''}></div>`;

/* ======================================================================
   Einrichtung & Sperre
   ====================================================================== */
const ICON = '<img class="appIcon" src="icon.png" alt="">';
function gate(html) { $('#appRoot').hidden = true; $('#gate').hidden = false; $('#gateCard').innerHTML = html; }

let SETUP = {};
function setupStep(n, ctx = {}) {
  const dots = `<div class="stepDots">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div>`;
  const card = $('#gateCard'); card.classList.toggle('wide', n > 1);
  if (n === 1) {
    gate(`${ICON}<h2>Willkommen bei Libretto</h2><p>Deine Notenverwaltung für das bayerische Gymnasium – Berechnung nach der GSO, alle Daten verschlüsselt auf diesem Computer.</p>${dots}
      <div class="notice" style="text-align:left"><div class="grow"><b>Wichtig:</b> ${esc(Print.DISCLAIMER)} Sichere deine Daten zusätzlich regelmäßig selbst.</div></div>
      <label class="check"><input type="checkbox" id="ackDoc"> <span>Verstanden: Libretto ist meine persönliche Hilfe, nicht die offizielle Dokumentation. Ich übertrage Noten ins Infoportal bzw. Schulprogramm.</span></label>
      <label class="check"><input type="checkbox" id="ackPriv"> <span>Ich kläre mit meiner Schulleitung, ob ich Noten auf diesem Gerät verarbeiten darf (Genehmigung für private Endgeräte).</span></label>
      <button class="go" id="next" disabled>Weiter</button>`);
    const upd = () => { $('#next').disabled = !($('#ackDoc').checked && $('#ackPriv').checked); };
    $('#ackDoc').onchange = upd; $('#ackPriv').onchange = upd; $('#next').onclick = () => setupStep(2);
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
    $('#pick').onclick = async () => { ST = await N.chooseBackupDir(); if (ST.backupDir) { $('#dirTxt').textContent = ST.backupDir; toast('Erste Sicherung angelegt'); } };
    const done = () => enterApp(); $('#next').onclick = done; $('#later').onclick = done;
  }
}
async function saveCodePdf(code) {
  const m = { title: 'Libretto – Notfallschlüssel', subtitle: 'Sicher und getrennt vom Computer aufbewahren', meta: [['Erstellt', new Date().toLocaleDateString('de-DE')]],
    blocks: [{ table: { head: ['Notfallschlüssel'], rows: [[code]], big: [0] } },
      { p: 'Mit diesem Schlüssel lassen sich deine Libretto-Daten und alle Sicherungen öffnen, wenn du das Passwort vergessen hast. Wer ihn besitzt, kann die Noten lesen – also wie einen Haustürschlüssel behandeln.' },
      { p: 'So geht es: Libretto öffnen → „Passwort vergessen? Mit Notfallschlüssel öffnen“ → Schlüssel eingeben → neues Passwort festlegen.' }] };
  await N.savePdf('Libretto-Notfallschluessel.pdf', Print.html(m, {}), false);
}

function renderLock(mode = 'pw', info = '') {
  const code = mode === 'code';
  gate(`${ICON}<h2>${code ? 'Mit Notfallschlüssel öffnen' : 'Libretto ist gesperrt'}</h2><p>${code ? 'Gib den Notfallschlüssel ein. Danach legst du ein neues Passwort fest.' : 'Deine Noten sind verschlüsselt. Gib dein Passwort ein.'}</p>
    <input class="pwInput" id="pw" type="${code ? 'text' : 'password'}" placeholder="${code ? 'XXXXXX-XXXXXX-XXXXXX-XXXXXX' : 'Passwort'}" autocomplete="${code ? 'off' : 'current-password'}">
    <p class="gateErr" id="err">${esc(info)}</p><button class="go" id="open">Öffnen</button>
    <div class="gateLinks">${code ? '<button id="back">Zurück zum Passwort</button>' : '<button id="useCode">Passwort vergessen?</button>'}<button id="restore">Sicherung wiederherstellen …</button></div>`);
  $('#gateCard').classList.remove('wide');
  $('#pw').focus();
  const go = async () => {
    const v = $('#pw').value; if (!v) return;
    $('#open').disabled = true; $('#open').textContent = 'Wird entschlüsselt …';
    const r = await N.unlock(v, code);
    if (!r.ok) { $('#err').textContent = r.error; $('#open').disabled = false; $('#open').textContent = 'Öffnen'; $('#pw').select(); return; }
    D = r.data; migrate();
    if (code) return newPasswordAfterCode();
    enterApp();
  };
  $('#open').onclick = go; $('#pw').onkeydown = e => { if (e.key === 'Enter') go(); };
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
      D = r.data; migrate(); toast('Sicherung wiederhergestellt'); enterApp(); return true;
    } });
  dlg.querySelector('#rsPw').focus();
}
async function lockNow() {
  if (!D) return;
  await flush(); await N.lock(); D = null;
  $('#main').innerHTML = ''; $$('dialog').forEach(d => d.remove()); document.body.classList.remove('modal');
  renderLock();
}
/* Automatisch sperren bei Inaktivität */
['mousemove', 'keydown', 'mousedown', 'wheel', 'touchstart'].forEach(ev => addEventListener(ev, () => { lastAct = Date.now(); }, { passive: true }));
setInterval(() => { if (D && (+D.settings.autoLock || 0) > 0 && Date.now() - lastAct > D.settings.autoLock * 60000) lockNow(); }, 15000);

function migrate() {
  D.settings = { ...blankData().settings, ...(D.settings || {}) };
  D.courses = D.courses || []; D.classDates = D.classDates || []; D.events = D.events || []; D.settings.hues = D.settings.hues || {}; D.settings.lastTerm = D.settings.lastTerm || {};
  D.courses.forEach(c => { c.students = (c.students || []).slice().sort(byName); c.away = c.away || {}; c.assessments = c.assessments || []; c.overrides = c.overrides || {}; c.notes = c.notes || {}; c.seminarPaper = c.seminarPaper || {}; });
}
async function enterApp() {
  $('#gate').hidden = true; $('#appRoot').hidden = false;
  ST = await N.status();
  if (!UI.course && D.courses[0]) UI.course = D.courses[0].id;
  $('#brandSub').textContent = `Notenverwaltung · Beta · Schuljahr ${D.settings.year}`;
  render();
  applyPolicy(await N.policy());
  if (!enterApp.checked) { enterApp.checked = true; N.checkUpdate().then(r => { if (r && r.update) UPDATE = r.update; if (r && r.policy) applyPolicy(r.policy); render(); }).catch(() => {}); }
}
let UPDATE = null;
/* Beta-Ende: Nur-Lesen-Modus statt Sperre */
function applyPolicy(p) {
  if (!p) return; POLICY = p;
  const was = READONLY; READONLY = !!p.expired;
  document.body.classList.toggle('readonly', READONLY);
  $('#brandSub').textContent = `Notenverwaltung · ${READONLY ? 'Beta beendet – nur lesen' : 'Beta'} · Schuljahr ${D.settings.year}`;
  if (READONLY && !was && !applyPolicy.shown) { applyPolicy.shown = true; betaEndSheet(); }
}
function betaEndSheet() {
  const p = POLICY || {};
  sheet({ title: p.outdated ? 'Bitte aktualisieren' : 'Die Beta-Phase ist beendet', ok: '', cancel: 'Verstanden', body: `<div class="prose">
    <p style="margin-top:0">${p.message ? esc(p.message) : p.outdated ? 'Diese Version von Libretto wird nicht mehr unterstützt.' : 'Vielen Dank fürs Testen! Die kostenlose Beta-Phase von Libretto ist beendet.'}</p>
    <p><b>Deine Noten bleiben vollständig erhalten.</b> Du kannst weiterhin alles ansehen, drucken, exportieren und sichern – nur neue Eintragungen sind in dieser Version nicht mehr möglich.</p>
    <p>Zum Weiterarbeiten lade die aktuelle Version von theisapps.de und installiere sie einfach über diese. Alle Daten werden übernommen.</p>
    <div class="panelBtns"><a class="mini accent" href="${esc(p.url || 'https://theisapps.de/libretto/')}" target="_blank" rel="noopener">Zur aktuellen Version</a></div></div>` });
}
function betaNotice() {
  if (!POLICY) return '';
  if (READONLY) return `<div class="notice"><div class="grow"><b>${POLICY.outdated ? 'Diese Version wird nicht mehr unterstützt' : 'Beta beendet'} – nur lesen.</b> Deine Noten bleiben erhalten und lassen sich drucken und exportieren. Zum Weiterarbeiten die aktuelle Version laden.</div><a class="mini" href="${esc(POLICY.url)}" target="_blank" rel="noopener">Aktuelle Version</a></div>`;
  if (POLICY.daysLeft <= 30) return `<div class="notice info"><div class="grow"><b>Die Beta-Phase endet am ${esc(R.fmtDate(POLICY.betaEnd))}</b> (in ${POLICY.daysLeft} Tagen). Danach bleibt diese Version lesbar; zum Weiterarbeiten gibt es dann die aktuelle Version auf theisapps.de.</div></div>`;
  return '';
}

/* ======================================================================
   Hauptansicht
   ====================================================================== */
function render() {
  if (!D) return;
  $$('#tabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === UI.tab)));
  if (UI.tab === 'grades') renderGrades();
  if (UI.tab === 'dates') renderDates();
  if (UI.tab === 'backup') renderBackup();
}
$('#tabs').addEventListener('click', e => { const b = e.target.closest('button[data-tab]'); if (b) { UI.tab = b.dataset.tab; UI.calPick = null; $('#toast').classList.remove('show', 'act'); render(); } });
$('#newCourseBtn').onclick = () => courseSheet();
$('#settingsBtn').onclick = () => settingsSheet();
$('#lockBtn').onclick = () => lockNow();
$('#helpBtn').onclick = () => helpSheet();

function updateNotice() { return UPDATE ? `<div class="notice info"><div class="grow"><b>Neue Version ${esc(UPDATE.version)} verfügbar.</b> ${esc(UPDATE.notes)} Deine Daten bleiben beim Aktualisieren erhalten – Libretto sichert vorher automatisch.</div><a class="mini" href="${esc(UPDATE.url)}" target="_blank" rel="noopener">Herunterladen</a></div>` : ''; }
function backupNotice() {
  return betaNotice() + updateNotice() + backupNotice0();
}
function backupNotice0() {
  const days = ST.lastExternal ? (Date.now() - ST.lastExternal) / 864e5 : null;
  if (!ST.backupDir) return `<div class="notice"><div class="grow"><b>Noch kein externer Sicherungsordner.</b> Libretto sichert bisher nur auf diesem Computer. Wähle einen USB-Stick oder Cloud-Ordner – und übertrage Noten zeitnah ins Infoportal.</div><button class="mini" data-act="pickDir">Ordner wählen</button></div>`;
  if (ST.lastExternalError) return `<div class="notice"><div class="grow"><b>Sicherungsordner nicht erreichbar</b> (${esc(ST.lastExternalError)}). Ist der USB-Stick angeschlossen?</div><button class="mini" data-act="backupNow">Erneut sichern</button></div>`;
  if (days != null && days > 7) return `<div class="notice"><div class="grow"><b>Letzte externe Sicherung vor ${Math.floor(days)} Tagen.</b> Bitte Sicherungsordner verbinden.</div><button class="mini" data-act="backupNow">Jetzt sichern</button></div>`;
  return '';
}

function courseLabel(c) { return upper(c) ? c.name : `${c.name}`; }
/* Oberstufe: zuletzt geöffnetes Halbjahr je Kurs merken; sonst das laufende Halbjahr */
function defaultTerm(c) {
  const ts = R.termsOf(c), t = todayISO(), h = D.settings.half1End, mo = +t.slice(5, 7), day = +t.slice(8, 10);
  const second = h ? t > h : (mo >= 3 && mo <= 8) || (mo === 2 && day >= 20);
  return ts[second ? 1 : 0] || ts[0];
}
function pickTerm(c) { const last = D.settings.lastTerm && D.settings.lastTerm[c.id]; return R.termsOf(c).includes(last) ? last : defaultTerm(c); }
/* Abwesenheit (z. B. Auslandsaufenthalt): Zeitraum je Schüler */
function awayOf(c, sid) { const a = c.away && c.away[sid]; return a && (a.from || a.to) ? a : null; }
function isAway(c, sid, date) { const a = awayOf(c, sid); return !!(a && date && (!a.from || date >= a.from) && (!a.to || date <= a.to)); }
function awayText(a) { return `abwesend ${a.from ? 'ab ' + fdate(a.from) : ''}${a.to ? ' bis ' + fdate(a.to) : ''}${a.reason ? ' (' + a.reason + ')' : ''}`.replace(/\s+/g, ' '); }
function renderGrades() {
  const main = $('#main');
  if (!D.courses.length) {
    main.innerHTML = `${backupNotice() ? `<div class="notices">${backupNotice()}</div>` : ''}<div class="empty glass"><div><strong>Noch keine Kurse</strong><p>Lege für jede Klasse bzw. jeden Kurs, den du unterrichtest, einen Kurs an – z. B. „9F Englisch“ oder „Q13 Italienisch“. Schülerlisten kannst du einfügen oder aus Excel übernehmen.</p><button class="go" data-act="newCourse">Ersten Kurs anlegen</button></div></div>`;
    return;
  }
  if (!course()) UI.course = D.courses[0].id;
  const c = course();
  /* Kursliste gruppiert */
  if (upper(c) && UI.termFor !== c.id) { UI.term = pickTerm(c); UI.termFor = c.id; }
  /* Kursliste: nach Fach, darunter die Klassen aufsteigend, Oberstufe zuletzt */
  const groups = {};
  D.courses.forEach(x => { const g = (x.subject || 'Ohne Fach').trim(); (groups[g] = groups[g] || []).push(x); });
  const order = Object.keys(groups).sort((a, b) => a.localeCompare(b, 'de'));
  const list = order.map(g => `<div class="cgroup">${esc(g)}</div>` + groups[g].slice().sort((a, b) => (+a.grade || 0) - (+b.grade || 0) || a.name.localeCompare(b.name, 'de', { numeric: true })).map(x => {
    const warn = R.courseWarnings(x).length > 0;
    return `<button class="citem" data-course="${x.id}" aria-current="${x.id === UI.course}" style="--hue:var(${hueOf(x.subject)})"><span class="badge">${esc((x.subject || '?').slice(0, 2))}</span><span class="t">${esc(x.name)}<small>${upper(x) ? 'Oberstufe ' + x.grade : 'Jgst. ' + x.grade} · ${x.students.length} Schüler</small></span>${warn ? '<span class="warnDot" title="Hinweis"></span>' : ''}</button>`;
  }).join('')).join('');

  main.innerHTML = `<div class="layout">
    <aside class="rail">
      <section class="panel glass"><div class="phead"><h2 class="ptitle">Klassen und Kurse</h2><span class="count">${D.courses.length}</span></div><div class="courses">${list}</div>
        <div class="panelBtns"><button class="mini" data-act="newCourse">+ Kurs</button></div></section>
      <section class="panel glass">${infoPanel(c)}</section>
    </aside>
    <section id="work">${courseView(c)}</section></div>`;
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
    lines.push(['Kleine LN', c.smallMode === 'areas' ? 'nach Bereichen (schriftlich/mündlich/praktisch)' : 'gewichteter Durchschnitt']);
  } else {
    lines.push(['Stufe', `Qualifikationsphase ${c.grade}`]);
    lines.push(['Art', c.seminar ? 'Seminar – nur kleine LN' : c.lf ? 'Leistungsfach / mit Schulaufgabe in 13/2' : 'Halbjahresleistung: SA und Ø kleine LN 1:1']);
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
function visibleAssessments(c) {
  const sc = scopeOf(c);
  const as = c.assessments.slice().sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
  if (upper(c)) return sc.term ? as.filter(a => a.term === sc.term) : as;
  return as.filter(a => R.inScope(a, sc));
}
function courseView(c) {
  const sorted = c.students;
  const notices = [backupNotice()];
  R.courseWarnings(c).forEach(w => notices.push(`<div class="notice"><div class="grow">${esc(w.text)}</div></div>`));
  const cls = R.classOf(c.name);
  const conf = R.dateConflicts(classBigDates(cls));
  conf.forEach(cf => notices.push(`<div class="notice"><div class="grow"><b>Termin prüfen (§ 22 GSO):</b> ${esc(cf.text)}</div></div>`));
  const openN = c.assessments.reduce((n, a) => n + Object.values(a.results || {}).filter(r => r && r.status === 'ent').length, 0);
  if (openN) notices.push(`<div class="notice info"><div class="grow"><b>${openN} Nachtermin(e) offen</b> – mit „E“ markiert. Note einfach überschreiben, sobald nachgeschrieben.</div></div>`);
  let scope = '';
  if (upper(c)) {
    const terms = R.termsOf(c), cur = UI.term && terms.includes(UI.term) ? UI.term : null;
    scope = `<div class="scopeBar"><div class="seg">${terms.map(t => `<button data-term="${t}" aria-pressed="${cur === t}">${t}</button>`).join('')}<button data-term="" aria-pressed="${!cur}">Übersicht</button></div></div>`;
  } else {
    scope = `<div class="scopeBar"><div class="seg"><button data-scope="year" aria-pressed="${UI.scope === 'year'}">Ganzes Schuljahr</button><button data-scope="half" aria-pressed="${UI.scope === 'half'}">Stand Zwischenzeugnis</button><button data-scope="until" aria-pressed="${UI.scope === 'until'}">Stand bis Datum</button></div>
      ${UI.scope === 'until' ? `<input type="date" id="untilDate" value="${UI.until || todayISO()}">` : ''}${UI.scope === 'half' && !D.settings.half1End ? '<span class="hint warnHint">Stichtag fürs Halbjahr in den Einstellungen festlegen</span>' : UI.scope === 'half' ? `<span class="hint">bis ${fdate(D.settings.half1End)}</span>` : ''}</div>`;
  }
  return `<div class="courseHead"><h2>${esc(c.name)} · ${esc(c.subject)}<small>${upper(c) ? 'Qualifikationsphase' : 'Jahrgangsstufe'} ${c.grade} · ${c.students.length} Schüler${c.hours ? ' · ' + c.hours + ' Wochenstunden' : ''}</small></h2>
      <div class="headBtns"><button class="mini accent" data-act="newAssessment">+ Leistungsnachweis</button><button class="mini" data-act="editCourse">Kurs &amp; Schüler</button><button class="mini" data-act="print">Drucken &amp; Export</button></div></div>
    <div class="notices">${notices.filter(Boolean).join('')}</div>${scope}
    ${sorted.length ? `<div class="gridWrap glass">${upper(c) && !scopeOf(c).term ? upperOverview(c) : gridTable(c)}</div>
      <div class="legend"><span><b>Enter</b> nächste Zeile</span><span><b>←→↑↓</b> bewegen</span><span><b>E</b> Nachtermin</span><span><b>B</b> befreit</span><span><b>N</b> Note 6 (§ 26 Abs. 4)</span><span><b>U</b> Unterschleif</span><span>Spaltenkopf anklicken = bearbeiten, Notenspiegel, drucken</span></div>`
      : `<div class="empty glass" style="min-height:260px"><div><strong>Noch keine Schüler</strong><p>Füge die Namensliste ein oder übernimm sie aus Excel.</p><button class="go" data-act="editCourse">Schüler eintragen</button></div></div>`}`;
}
function classBigDates(cls) {
  const own = D.courses.filter(c => R.classOf(c.name) === cls && !upper(c)).flatMap(c => c.assessments.filter(a => R.isBig(a) && a.date).map(a => ({ date: a.date, label: `${c.subject} (${a.title || R.TYPES[a.type].label})` })));
  const other = D.classDates.filter(x => x.cls === cls).map(x => ({ date: x.date, label: x.subject + ' (eingetragen)' }));
  return own.concat(other);
}

/* ---------- Notentabelle ---------- */
function colHead(c, a, i) {
  const T = R.TYPES[a.type], up = upper(c);
  const big = R.isBig(a);
  const w = big ? (a.bigWeight && +a.bigWeight !== 1 ? wLabel(a.bigWeight) : '') : (R.weightOf(a, c) !== 1 ? '×' + String(R.weightOf(a, c)).replace('.', ',') : '');
  return `<th class="${i === 0 ? 'sep' : ''}"><button class="colhead" data-edit="${a.id}" title="${esc((a.title || T.label) + (a.date ? ' · ' + fdate(a.date) : ''))}"><b>${esc(a.short || T.short)}</b><small>${a.date ? sdate(a.date) : '–'}${up && !UI.term ? ' ' + a.term : ''}</small>${w ? `<i>${w}</i>` : ''}${a.usePoints ? '<i>Pkt.</i>' : ''}</button></th>`;
}
function cellHTML(c, a, s) {
  const r = a.results && a.results[s.id], up = upper(c);
  const txt = a.usePoints && r && !r.status && r.raw != null ? String(r.raw).replace('.', ',') : R.cellText(r, up);
  const cls = r && r.status ? (r.status === 'n6' || r.status === 'us' ? 'st n6' : 'st') : '';
  const sub = a.usePoints && r && !r.status && r.v != null ? `<span class="rawpts">${up ? r.v + ' P.' : 'Note ' + r.v}</span>` : '';
  const aw = !r && isAway(c, s.id, a.date);
  return `<td><input class="cell ${cls} ${a.usePoints ? 'pts' : ''} ${aw ? 'away' : ''}" data-a="${a.id}" data-s="${s.id}" value="${esc(txt)}" ${aw ? 'placeholder="abw." title="' + esc(awayText(awayOf(c, s.id))) + '"' : ''} autocomplete="off" spellcheck="false" inputmode="${up ? 'numeric' : 'text'}">${sub}</td>`;
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
    return `<td class="sum sep" data-sum="sa">${R.termHasSA(c, t) ? fmt(r.sa, 1) : '·'}</td><td class="sum" data-sum="sm">${fmt(r.small, 2)}</td><td class="sum main">${fmt(r.raw, 2)}</td><td class="res">${pointsBadge(r.points)}${flag}${r.open.length ? '<span class="flag info" title="Nachtermin offen"></span>' : ''}</td>`;
  }
  const r = R.computeLower(c, s.id, scopeOf(c));
  const ov = c.overrides[s.id] && c.overrides[s.id].grade;
  const ng = c.noGrade && c.noGrade[s.id];
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
  const chips = entriesOf(c, s.id).map(e => `<button class="echip ${e.status ? 'st' : ''}" data-ent="${s.id}" title="${esc(R.TYPES[e.type].label + (e.date ? ' · ' + fdate(e.date) : '') + (e.note ? ' · ' + e.note : ''))}">${esc(R.cellText(e, up))}</button>`).join('');
  return `<td class="ent sep"><div class="ents">${chips}<input class="cell entq" data-eq="${s.id}" placeholder="+" autocomplete="off" title="Note tippen + Enter = neue Einzelnote mit heutigem Datum"></div></td>`;
}
function gridTable(c) {
  const as = visibleAssessments(c), up = upper(c);
  const big = as.filter(a => R.isBig(a)), small = as.filter(a => !R.isBig(a));
  const showBig = up ? R.termHasSA(c, scopeOf(c).term) || big.length : c.hasSA;
  const hdrBig = showBig ? big.map((a, i) => colHead(c, a, i)).join('') : '';
  const hdrSmall = small.map((a, i) => colHead(c, a, showBig ? 1 : i)).join('') + `<th class="sep"><button class="colhead" data-entcfg="1" title="Einzelnoten mit eigenem Datum je Schüler – z. B. Unterrichtsbeiträge oder Abfragen. Note tippen + Enter."><b>Einzeln</b><small>${esc(R.TYPES[c.entryType || 'ub'].short)} · mit Datum</small></button></th>`;
  let grp, sumHead;
  if (up) {
    grp = `<tr class="grp"><th class="nm" rowspan="2" style="padding-left:14px;text-align:left">Name</th>${showBig ? `<th class="gBig sep" colspan="${Math.max(1, big.length)}">Schulaufgabe</th>` : ''}<th class="gSmall sep" colspan="${small.length + 1}">Kleine Leistungsnachweise</th><th class="gSum sep" colspan="4">Halbjahresleistung ${esc(scopeOf(c).term)}</th></tr>`;
    sumHead = `<th class="sep">Ø SA</th><th>Ø klein</th><th>Ergebnis</th><th>Punkte</th>`;
  } else {
    grp = `<tr class="grp"><th class="nm" rowspan="2" style="padding-left:14px;text-align:left">Name</th>${showBig ? `<th class="gBig sep" colspan="${Math.max(1, big.length)}">Große LN</th>` : ''}<th class="gSmall sep" colspan="${small.length + 1}">Kleine LN</th><th class="gSum sep" colspan="${c.hasSA ? 4 : 3}">Ergebnis</th></tr>`;
    sumHead = `${c.hasSA ? '<th class="sep">Ø groß</th>' : ''}<th class="${c.hasSA ? '' : 'sep'}">Ø klein</th><th class="sep">Ø gesamt</th><th>Zeugnis</th>`;
  }
  const emptyCol = '<th class="sep"><small class="hint" style="padding:0 10px">–</small></th>';
  const head = `<thead>${grp}<tr class="cols">${showBig ? (hdrBig || emptyCol) : ''}${hdrSmall}${sumHead}</tr></thead>`;
  const rows = c.students.map((s, i) => `<tr data-row="${s.id}"><td class="nm"><button data-stu="${s.id}"><span class="nr">${i + 1}</span>${esc(s.name)}${awayOf(c, s.id) ? `<span class="awayTag" title="${esc(awayText(awayOf(c, s.id)))}">abw.</span>` : ''}</button></td>${showBig ? (big.length ? big.map(a => cellHTML(c, a, s)).join('') : '<td class="sep"></td>') : ''}${small.map(a => cellHTML(c, a, s)).join('')}${entCell(c, s)}${summaryCells(c, s)}</tr>`).join('');
  return `<table class="grid">${head}<tbody>${rows}</tbody></table>`;
}
function upperOverview(c) {
  const terms = R.termsOf(c);
  const sem = c.seminar;
  const head = `<thead><tr class="grp"><th class="nm" rowspan="2" style="padding-left:14px;text-align:left">Name</th><th class="gSum sep" colspan="${terms.length}">Halbjahresleistungen (Punkte)</th>${sem ? '<th class="gBig sep" colspan="3">Seminararbeit (§ 29 GSO)</th>' : ''}</tr>
    <tr class="cols">${terms.map((t, i) => `<th class="${i ? '' : 'sep'}" style="padding:6px 14px">${t}</th>`).join('')}${sem ? '<th class="sep" style="padding:6px 10px">Arbeit</th><th style="padding:6px 10px">Präsentation/<br>Prüfungsgespräch</th><th style="padding:6px 10px">Gesamt (max. 30)</th>' : ''}</tr></thead>`;
  const rows = c.students.map((s, i) => {
    const sp = c.seminarPaper[s.id] || {};
    return `<tr><td class="nm"><button data-stu="${s.id}"><span class="nr">${i + 1}</span>${esc(s.name)}</button></td>${terms.map((t, j) => { const r = R.computeTerm(c, s.id, t); return `<td class="res ${j ? '' : 'sep'}">${pointsBadge(r.points)}${r.zero ? '<span class="flag red" title="0 Punkte – nicht belegt"></span>' : ''}</td>`; }).join('')}
      ${sem ? `<td class="sep"><input class="cell" data-sp="arbeit" data-s="${s.id}" value="${esc(sp.arbeit ?? '')}"></td><td><input class="cell" data-sp="gespraech" data-s="${s.id}" value="${esc(sp.gespraech ?? '')}"></td><td class="sum main" data-spsum="${s.id}">${R.seminarPaper(sp.arbeit, sp.gespraech) ?? '–'}</td>` : ''}</tr>`;
  }).join('');
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
    if (READONLY) { el.value = el.defaultValue; return; }
    if (el.dataset.sp) { // Seminararbeit
      const v = el.value.trim(); const n = v === '' ? '' : +v;
      if (v !== '' && (!/^\d{1,2}$/.test(v) || n > 15)) { el.classList.add('bad'); setTimeout(() => el.classList.remove('bad'), 400); toast('Punkte 0–15'); return; }
      const sp = c.seminarPaper[el.dataset.s] = c.seminarPaper[el.dataset.s] || {}; sp[el.dataset.sp] = n; save();
      const td = work.querySelector(`[data-spsum="${el.dataset.s}"]`); if (td) td.textContent = R.seminarPaper(sp.arbeit, sp.gespraech) ?? '–';
      return;
    }
    if (el.dataset.eq) { // neue Einzelnote
      const raw = el.value.trim(); if (!raw) return;
      const r = R.parseCell(raw, upper(c)); if (r.error) { bad(el, r.error + ' · Kürzel: E, B, N, U'); return; }
      const s = c.students.find(x => x.id === el.dataset.eq);
      c.entries = c.entries || [];
      const ne = { id: uid(), sid: s.id, type: c.entryType || 'ub', date: upper(c) ? todayISO() : (UI.scope === 'until' && UI.until ? UI.until : todayISO()), ...(upper(c) ? { term: scopeOf(c).term } : {}), ...r };
      c.entries.push(ne);
      el.value = ''; save();
      toastAction(`Einzelnote ${R.cellText(ne, upper(c))} für ${s.name} eingetragen`, 'Rückgängig', () => { c.entries = (c.entries || []).filter(x => x.id !== ne.id); save(); render(); });
      const tr = el.closest('tr'), td = el.closest('td'); const tmp = document.createElement('tr'); tmp.innerHTML = entCell(c, s); td.replaceWith(tmp.firstElementChild);
      $$('td.sum, td.res', tr).forEach(x => x.remove()); tr.insertAdjacentHTML('beforeend', summaryCells(c, s));
      return;
    }
    const a = c.assessments.find(x => x.id === el.dataset.a), sid = el.dataset.s, up = upper(c);
    a.results = a.results || {};
    const raw = el.value.trim();
    if (!raw) delete a.results[sid];
    else if (a.usePoints && /^[0-9]+([.,][0-9]+)?$/.test(raw)) {
      const p = +raw.replace(',', '.');
      if (a.key && a.key.max && p > a.key.max) { bad(el, `Höchstens ${a.key.max} Punkte`); return; }
      const v = up ? R.keyPoints(p, a.key) : R.keyGrade(p, a.key);
      if (v == null) { bad(el, 'Erst Notenschlüssel festlegen (Spaltenkopf anklicken)'); return; }
      a.results[sid] = { raw: p, v };
    } else {
      const r = R.parseCell(raw, up);
      if (r.error) { bad(el, r.error + ' · Kürzel: E, B, N, U'); return; }
      a.results[sid] = r;
    }
    save();
    const tr = el.closest('tr'), s = c.students.find(x => x.id === sid);
    const td = el.closest('td'); td.outerHTML; // Zelle neu zeichnen
    const tmp = document.createElement('tr'); tmp.innerHTML = cellHTML(c, a, s); const nc = tmp.firstElementChild; td.replaceWith(nc);
    $$('td.sum, td.res', tr).forEach(x => x.remove());
    tr.insertAdjacentHTML('beforeend', summaryCells(c, s));
  });
  function bad(el, msg) { el.classList.add('bad'); setTimeout(() => el.classList.remove('bad'), 400); toast(msg); el.select(); }
  work.addEventListener('keydown', e => {
    const el = e.target; if (!el.classList || !el.classList.contains('cell')) return;
    const td = el.closest('td'), tr = td.closest('tr');
    const col = [...tr.children].indexOf(td);
    const moveRow = d => { let r = tr; do { r = d > 0 ? r.nextElementSibling : r.previousElementSibling; } while (r && !r.children[col]); const n = r && r.children[col] && r.children[col].querySelector('.cell'); if (n) { el.dispatchEvent(new Event('change', { bubbles: true })); setTimeout(() => { const t = $(`.cell[data-a="${n.dataset.a}"][data-s="${n.dataset.s}"]`) || n; t.focus(); }, 0); } };
    const moveCol = d => { const list = cells().filter(x => x.closest('tr') === tr); const i = list.indexOf(el); const n = list[i + d]; if (n) n.focus(); };
    if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); moveRow(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveRow(-1); }
    else if (e.key === 'ArrowRight' && el.selectionStart === el.value.length) { e.preventDefault(); moveCol(1); }
    else if (e.key === 'ArrowLeft' && el.selectionStart === 0) { e.preventDefault(); moveCol(-1); }
    else if (e.key === 'Escape') { el.blur(); }
  });
  work.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => assessmentSheet(c, c.assessments.find(a => a.id === b.dataset.edit)));
  work.querySelectorAll('[data-stu]').forEach(b => b.onclick = () => studentSheet(c, c.students.find(s => s.id === b.dataset.stu)));
  work.addEventListener('click', e => { const ch = e.target.closest('[data-ent]'); if (ch) entrySheet(c, c.students.find(s => s.id === ch.dataset.ent)); });
  const ec = work.querySelector('[data-entcfg]'); if (ec) ec.onclick = () => entryCfgSheet(c);
}

/* Allgemeine Aktionen */
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]'); if (b) {
    const a = b.dataset.act;
    if (a === 'newCourse') courseSheet();
    if (a === 'editCourse') courseSheet(course());
    if (a === 'newAssessment') assessmentSheet(course());
    if (a === 'print') printSheet(course());
    if (a === 'pickDir') { ST = await N.chooseBackupDir(); render(); }
    if (a === 'backupNow') { const r = await N.backupNow(); ST = await N.status(); toast(r.external ? 'Gesichert – auch im Sicherungsordner' : 'Auf diesem Computer gesichert'); render(); }
  }
  const ci = e.target.closest('[data-course]'); if (ci) { UI.course = ci.dataset.course; UI.termFor = null; renderGrades(); }
});

/* ======================================================================
   Kurs anlegen / bearbeiten
   ====================================================================== */
function courseSheet(c) {
  const isNew = !c;
  c = c ? JSON.parse(JSON.stringify(c)) : { id: uid(), name: '', subject: '', grade: 9, hours: '', hasSA: true, saPlanned: '', ratio: 'auto', smallMode: 'flat', typeWeights: {}, areaWeights: { schriftlich: 1, 'mündlich': 1, praktisch: 1 }, lf: false, seminar: false, students: [], assessments: [], overrides: {}, notes: {}, seminarPaper: {} };
  const smallTypes = Object.entries(R.TYPES).filter(([k]) => k !== 'sa');
  const others = D.courses.filter(x => x.id !== c.id && x.students.length);
  let hueSel = (D.settings.hues || {})[subjKey(c.subject)] || '';
  const body = `
    <div class="grid3">
      ${field('Klasse / Kurs', `<input type="text" id="cName" value="${esc(c.name)}" placeholder="z. B. 9F oder Q13 E1" required>`)}
      ${field('Fach', `<input type="text" id="cSubj" list="subjList" value="${esc(c.subject)}" placeholder="z. B. Englisch" required><datalist id="subjList">${R.SUBJECTS.map(s => `<option>${esc(s)}</option>`).join('')}</datalist>`)}
      ${field('Jahrgangsstufe', `<select id="cGrade">${[5, 6, 7, 8, 9, 10, 11, 12, 13].map(g => `<option ${+c.grade === g ? 'selected' : ''}>${g}</option>`).join('')}</select>`)}
    </div>
    <div class="field"><span>Farbe des Fachs</span><div class="swatches" id="cHue"><button type="button" class="swAuto" data-hue="" aria-pressed="${!hueSel}">automatisch</button>${HUES.map(h => `<button type="button" class="swatch" data-hue="${h}" style="--hue:var(${h})" title="${HUE_NAMES[h]}" aria-label="${HUE_NAMES[h]}" aria-pressed="${hueSel === h}"></button>`).join('')}</div></div>
    <div id="lowerOpts">
      <div class="grid3">
        ${field('Wochenstunden', `<input type="number" min="1" max="10" id="cHours" value="${esc(c.hours)}" placeholder="z. B. 4">`)}
        ${field('Geplante Schulaufgaben', `<input type="number" min="0" max="8" id="cPlanned" value="${esc(c.saPlanned)}" placeholder="z. B. 3">`)}
        ${field('Verhältnis groß : klein', `<select id="cRatio"><option value="auto">automatisch (§ 28 GSO)</option><option value="1:1" ${c.ratio === '1:1' ? 'selected' : ''}>1 : 1</option><option value="2:1" ${c.ratio === '2:1' ? 'selected' : ''}>2 : 1</option></select>`)}
      </div>
      <div class="rows">${sw('cHasSA', c.hasSA, 'Fach mit Schulaufgaben')}</div>
      <p class="hint">§ 28 GSO: bei zwei Schulaufgaben zählen große und kleine Leistungsnachweise 1:1, bei mehr als zwei 2:1. Mindestzahlen nach § 22 GSO prüft Libretto für Deutsch, Mathematik und Fremdsprachen.</p>
    </div>
    <div id="upperOpts">
      <div class="rows">${sw('cLf', c.lf, 'Leistungsfach (Schulaufgabe auch in 13/2)')}${sw('cSem', c.seminar, 'Seminar (nur kleine Leistungsnachweise, mit Seminararbeit)')}</div>
      <p class="hint">§ 29 GSO: Halbjahresleistung = Durchschnitt aus Schulaufgabe und Schnitt der kleinen LN, gerundet; eine Aufrundung auf 1 Punkt ist nicht zulässig. In 13/2 schreiben nur Deutsch, Mathematik und das Leistungsfach eine Schulaufgabe.</p>
    </div>
    <div class="subhead">Schülerinnen und Schüler <span class="count" id="stCount" style="float:right;text-transform:none;letter-spacing:0"></span></div>
    <div class="importBox" id="dropImport"><div><b>Klassenliste einlesen</b><p class="hint">PDF, Excel oder CSV hierher ziehen oder auswählen – danach kurz prüfen. Vor- und Nachname vertauscht? Einfach „Tauschen“.</p></div>
      <div class="panelBtns" style="margin:0"><button type="button" class="mini accent" id="stFileBtn">Datei wählen …</button><button type="button" class="mini" id="stPasteBtn">Text einfügen</button></div>
      <input type="file" id="stFile" accept=".pdf,.xlsx,.xls,.ods,.csv,.txt" hidden></div>
    <div id="stPasteBox" hidden style="margin-top:10px">${field('Liste einfügen (eine Zeile pro Person, z. B. „Muster, Anna“)', '<textarea id="stText" rows="5"></textarea>')}<button type="button" class="mini accent" id="stPasteGo">Übernehmen</button></div>
    <div class="stTable" id="stRows" style="margin-top:10px"></div>
    <div class="panelBtns"><button type="button" class="mini" id="stAdd">+ Schüler/in</button><button type="button" class="mini" id="stSwap">Vor- und Nachname tauschen</button>
      ${others.length ? `<select class="mini" id="cFrom"><option value="">Aus anderem Kurs übernehmen …</option>${others.map(o => `<option value="${o.id}">${esc(o.name + ' ' + o.subject)} (${o.students.length})</option>`).join('')}</select>` : ''}</div>
    <details class="more" ${isNew ? '' : ''}><summary>Gewichtung der kleinen Leistungsnachweise</summary>
    ${field('Berechnung', `<select id="cSmall"><option value="flat">Gewichteter Durchschnitt aller kleinen LN</option><option value="areas" ${c.smallMode === 'areas' ? 'selected' : ''}>Erst je Bereich (schriftlich / mündlich / praktisch), dann Bereiche gewichten</option></select>`)}
    <div id="areaW" class="wgrid" style="margin-bottom:10px">${R.AREAS.map(a => `<label>${a}<input type="number" step="0.5" min="0" data-area="${a}" value="${c.areaWeights[a] ?? 1}"></label>`).join('')}</div>
    <span class="hint" style="display:block;margin-bottom:6px">Gewicht je Art (Standard 1 – einzelne Nachweise kannst du später abweichend gewichten):</span>
    <div class="wgrid">${smallTypes.map(([k, t]) => `<label>${t.label}<input type="number" step="0.5" min="0" data-tw="${k}" value="${c.typeWeights[k] ?? 1}"></label>`).join('')}</div>
    </details>
    ${isNew ? '' : '<button type="button" class="danger" id="cDel">Kurs löschen</button>'}`;
  const { dlg, close } = sheet({ title: isNew ? 'Neuer Kurs' : 'Kurs bearbeiten', wide: true, body, onOk: d => {
    const g = +d.querySelector('#cGrade').value;
    c.name = d.querySelector('#cName').value.trim(); c.subject = d.querySelector('#cSubj').value.trim(); c.grade = g;
    if (!c.name || !c.subject) { toast('Bitte Klasse/Kurs und Fach angeben'); return false; }
    c.hours = d.querySelector('#cHours').value; c.saPlanned = d.querySelector('#cPlanned').value; c.ratio = d.querySelector('#cRatio').value;
    c.hasSA = g >= 12 ? !d.querySelector('#cSem').checked : d.querySelector('#cHasSA').checked;
    c.lf = d.querySelector('#cLf').checked; c.seminar = d.querySelector('#cSem').checked;
    c.smallMode = d.querySelector('#cSmall').value;
    D.settings.hues = D.settings.hues || {}; if (hueSel) D.settings.hues[subjKey(c.subject)] = hueSel; else delete D.settings.hues[subjKey(c.subject)];
    $$('[data-area]', d).forEach(i => c.areaWeights[i.dataset.area] = +i.value || 0);
    $$('[data-tw]', d).forEach(i => { const v = i.value === '' ? 1 : +i.value; if (v === 1) delete c.typeWeights[i.dataset.tw]; else c.typeWeights[i.dataset.tw] = v; });
    /* Schüler übernehmen: bestehende behalten ihre ID und damit ihre Noten */
    const seen = new Set(), next = [];
    draft.filter(x => (x.last || '').trim() || (x.first || '').trim()).forEach(x => {
      const st = { id: x.id, last: x.last.trim(), first: x.first.trim() }; st.name = fullName(st);
      if (seen.has(st.name.toLowerCase())) return; seen.add(st.name.toLowerCase()); next.push(st);
    });
    const ids = new Set(next.map(x => x.id));
    const removed = c.students.filter(s => !ids.has(s.id) && (c.assessments.some(a => a.results && a.results[s.id]) || (c.entries || []).some(e => e.sid === s.id)));
    const finish = () => {
      next.sort(byName);
      c.students = next; c.entries = (c.entries || []).filter(e => ids.has(e.sid));
      const i = D.courses.findIndex(x => x.id === c.id);
      if (i >= 0) D.courses[i] = c; else D.courses.push(c);
      UI.course = c.id; save(); close(); render();
    };
    if (removed.length) { ask(`${removed.length} Schüler mit eingetragenen Noten würden entfernt (${removed.map(s => esc(s.name)).join(', ')}). Ihre Noten gehen dabei verloren.`, 'Entfernen', true).then(ok => { if (ok) finish(); }); return false; }
    finish(); return false;
  } });
  const upd = () => { const g = +dlg.querySelector('#cGrade').value; dlg.querySelector('#lowerOpts').hidden = g >= 12; dlg.querySelector('#upperOpts').hidden = g < 12; dlg.querySelector('#areaW').hidden = dlg.querySelector('#cSmall').value !== 'areas'; };
  dlg.querySelector('#cGrade').onchange = upd; dlg.querySelector('#cSmall').onchange = upd; upd();
  $$('#cHue button', dlg).forEach(b => b.onclick = () => { hueSel = b.dataset.hue; $$('#cHue button', dlg).forEach(x => x.setAttribute('aria-pressed', String(x === b))); });
  if (isNew) dlg.querySelector('#cName').focus();
  /* Entwurf der Schülerliste (Tabelle wie in Viva/Gruppen) */
  let draft = c.students.map(x => ({ id: x.id, ...splitName(x) }));
  const rowsEl = dlg.querySelector('#stRows');
  const drawDraft = () => {
    dlg.querySelector('#stCount').textContent = draft.length ? draft.length + ' Namen' : '';
    rowsEl.innerHTML = draft.length ? draft.map((x, i) => `<div class="stRow lib" data-i="${i}"><span class="nr">${i + 1}</span><input type="text" data-f="last" value="${esc(x.last)}" placeholder="Nachname"><input type="text" data-f="first" value="${esc(x.first)}" placeholder="Vorname"><button type="button" class="iconbtn" data-rm="${i}" title="Entfernen">✕</button></div>`).join('')
      : '<div class="stEmpty">Noch keine Namen – Klassenliste einlesen oder Namen einfügen.</div>';
    $$('.stRow', rowsEl).forEach(r => $$('input', r).forEach(inp => inp.oninput = () => { draft[+r.dataset.i][inp.dataset.f] = inp.value; }));
    $$('[data-rm]', rowsEl).forEach(b => b.onclick = () => { draft.splice(+b.dataset.rm, 1); drawDraft(); });
  };
  const addDraft = list => { const key = x => (x.last + '|' + x.first).toLowerCase(); const have = new Set(draft.map(key)); let n = 0;
    list.forEach(x => { const y = { id: uid(), last: (x.last || '').trim(), first: (x.first || '').trim() }; if (!y.last && !y.first) return; if (have.has(key(y))) return; have.add(key(y)); draft.push(y); n++; });
    draft.sort(byName); drawDraft(); toast(n ? `${n} Namen übernommen – bitte kurz prüfen` : 'Keine neuen Namen erkannt'); };
  drawDraft();
  const readF = async f => { try { toast('Liste wird gelesen …'); const r = await Importer.readFile(f); addDraft(r.list); const nm = dlg.querySelector('#cName'); if (!nm.value.trim() && r.cls) nm.value = r.cls; } catch (err) { console.error(err); toast('Datei konnte nicht gelesen werden'); } };
  dlg.querySelector('#stFileBtn').onclick = () => dlg.querySelector('#stFile').click();
  dlg.querySelector('#stFile').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) readF(f); };
  const dz = dlg.querySelector('#dropImport');
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('over'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('over'));
  dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) readF(f); });
  dlg.querySelector('#stPasteBtn').onclick = () => { const b = dlg.querySelector('#stPasteBox'); b.hidden = !b.hidden; if (!b.hidden) dlg.querySelector('#stText').focus(); };
  dlg.querySelector('#stPasteGo').onclick = () => { addDraft(Importer.recognizeNames(dlg.querySelector('#stText').value.split(/\r?\n/))); dlg.querySelector('#stText').value = ''; dlg.querySelector('#stPasteBox').hidden = true; };
  dlg.querySelector('#stAdd').onclick = () => { draft.push({ id: uid(), last: '', first: '' }); drawDraft(); const ins = $$('input[data-f=last]', rowsEl); ins[ins.length - 1].focus(); };
  dlg.querySelector('#stSwap').onclick = () => { draft.forEach(x => { [x.first, x.last] = [x.last, x.first]; }); drawDraft(); };
  const fr = dlg.querySelector('#cFrom'); if (fr) fr.onchange = () => { const o = D.courses.find(x => x.id === fr.value); if (o) addDraft(o.students.map(splitName)); fr.value = ''; };
  const del = dlg.querySelector('#cDel'); if (del) del.onclick = async () => {
    if (await ask(`Kurs <b>${esc(c.name + ' ' + c.subject)}</b> mit allen Noten löschen? Ältere Sicherungen bleiben erhalten.`, 'Löschen', true)) {
      D.courses = D.courses.filter(x => x.id !== c.id); UI.course = D.courses[0] && D.courses[0].id; save(); close(); render();
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
  const defTerm = up ? (UI.term || R.termsOf(c)[0]) : null;
  a = a ? JSON.parse(JSON.stringify(a)) : { id: uid(), type: (c.hasSA && !c.seminar && (up ? R.termHasSA(c, defTerm) && !c.assessments.some(x => x.type === 'sa' && x.term === defTerm) : nSA < (+c.saPlanned || 0))) ? 'sa' : 'stex', title: '', date: todayISO(), term: defTerm, results: {} };
  const types = Object.entries(R.TYPES).filter(([k]) => k !== 'sa' || c.hasSA || up);
  const dist = !isNew ? R.distribution(a, c.students, up) : null;
  /* Notenschlüssel-Vorgaben: je Fach gemerkt (Fachschaften legen z. B. „Note 4 ab 50 %, Note 5 ab 33 %“ fest) */
  const pKey = (c.subject || '').toLowerCase() + (up ? '|Q' : '');
  D.settings.keyPresets = D.settings.keyPresets || {};
  const pre = (a.key && a.key.anchors) || D.settings.keyPresets[pKey] || (up ? { p5: 45, p1: 20, step: 0.5 } : { p4: 50, p5: 25, step: 0.5 });
  let pctArr = up ? (a.key && a.key.pct15) || R.pct15FromAnchors(pre.p5, pre.p1) : (a.key && a.key.pct) || R.pctFromAnchors(pre.p4, pre.p5);
  const keyInputs = () => up
    ? `<div class="keyGrid k15">${Array.from({ length: 15 }, (_, i) => `<label>${15 - i} P.<input type="number" step="0.5" min="0" data-k="${i}" value="${a.key && a.key.pointThresholds ? a.key.pointThresholds[i] : ''}"></label>`).join('')}</div>`
    : `<div class="keyGrid">${[1, 2, 3, 4, 5].map((n, i) => `<label>Note ${n} ab<input type="number" step="0.5" min="0" data-k="${i}" value="${a.key && a.key.thresholds ? a.key.thresholds[i] : ''}"></label>`).join('')}</div>`;
  const body = `
    <div class="grid3">
      ${field('Art', `<select id="aType">${types.map(([k, t]) => `<option value="${k}" ${a.type === k ? 'selected' : ''}>${t.label}</option>`).join('')}</select>`)}
      ${field('Bezeichnung (optional)', `<input type="text" id="aTitle" value="${esc(a.title)}" placeholder="z. B. 1. Schulaufgabe">`)}
      ${field('Datum', `<input type="date" id="aDate" value="${esc(a.date || '')}">`)}
      ${up ? field('Halbjahr', `<select id="aTerm">${R.termsOf(c).map(t => `<option ${a.term === t ? 'selected' : ''}>${t}</option>`).join('')}</select>`) : ''}
      ${field('Kürzel in der Tabelle', `<input type="text" id="aShort" maxlength="6" value="${esc(a.short || '')}" placeholder="automatisch">`)}
    </div>
    <div id="jstOpt">${field('Jahrgangsstufentest zählt als', `<select id="aCount"><option value="small">kleiner Leistungsnachweis</option><option value="big" ${a.countAs === 'big' ? 'selected' : ''}>großer Leistungsnachweis</option></select>`)}</div>
    <div id="bigOpt">${field('Gewicht unter den großen Leistungsnachweisen', `<select id="aBigW">${WEIGHTS.map(([v, l]) => `<option value="${v}" ${String(+(a.bigWeight ?? 1)) === String(+v) ? 'selected' : ''}>${l}</option>`).join('')}</select>`)}</div>
    <div id="smallOpt" class="grid2">
      ${field('Gewicht (leer = Standard der Art)', `<input type="number" step="0.5" min="0" id="aW" value="${esc(a.weight ?? '')}" placeholder="${R.weightOf({ ...a, weight: null }, c)}">`)}
      ${field('Bereich', `<select id="aArea">${R.AREAS.map(x => `<option ${R.areaOf(a) === x ? 'selected' : ''}>${x}</option>`).join('')}</select>`)}
    </div>
    <div class="subhead">Notenschlüssel</div>
    <div class="rows">${sw('aPts', a.usePoints, 'Rohpunkte eingeben, Libretto rechnet in ' + (up ? 'Notenpunkte' : 'Noten') + ' um')}</div>
    <div id="keyBox" style="margin-top:10px">
      <div class="grid3">${field('Erreichbare Punkte', `<input type="number" step="0.5" min="1" id="aMax" value="${esc(a.key && a.key.max || '')}">`)}
        ${up ? field('5 Punkte (4–) ab … %', `<input type="number" step="1" min="1" max="99" id="aA1" value="${pre.p5}">`) + field('1 Punkt ab … %', `<input type="number" step="1" min="0" max="99" id="aA2" value="${pre.p1}">`)
             : field('Note 4 ab … %', `<input type="number" step="1" min="1" max="99" id="aA1" value="${pre.p4}">`) + field('Note 5 ab … %', `<input type="number" step="1" min="0" max="99" id="aA2" value="${pre.p5}">`)}</div>
      <div class="grid3">${field('Grenzen runden auf', `<select id="aStep"><option value="0.5" ${+pre.step === 0.5 ? 'selected' : ''}>halbe Punkte</option><option value="1" ${+pre.step === 1 ? 'selected' : ''}>ganze Punkte</option><option value="0.25" ${+pre.step === 0.25 ? 'selected' : ''}>Viertelpunkte</option></select>`)}
        <div class="field"><span>&nbsp;</span><button type="button" class="mini accent" id="aSuggest">Schlüssel berechnen</button></div>
        <label class="check" style="margin-top:22px"><input type="checkbox" id="aRemember" checked> <span>Als Standard für ${esc(c.subject || 'dieses Fach')} merken</span></label></div>
      ${keyInputs()}<div class="keyPct" id="keyPct"></div>
      <p class="hint">${up ? 'Die Punkte 6–15 werden gleichmäßig zwischen der 5-Punkte-Grenze und 100 % verteilt, 2–4 zwischen 1 und 5 Punkten.' : 'Die Noten 1–3 werden gleichmäßig zwischen der Grenze für die 4 und 100 % verteilt.'} Jede Grenze kannst du danach noch einzeln ändern.</p>
    </div>
    ${dist && dist.n ? `<div class="subhead">Notenspiegel</div><div class="distBar" style="--n:${dist.counts.length}">${dist.counts.map((n, i) => `<div>${n}<i style="height:${dist.n ? Math.max(2, n / Math.max(...dist.counts) * 56) : 2}px;background:var(--gr${up ? R.POINT_GRADE(i) : i + 1})"></i>${up ? i : i + 1}</div>`).join('')}</div>
      <p class="meta"><span>Teilnehmer: <b>${dist.n}</b></span><span>Durchschnitt: <b>${fmt(dist.avg, 2)}</b></span><span>${up ? 'unter 5 Punkten' : 'Noten 5 und 6'}: <b>${dist.weak} (${Math.round(dist.weakShare * 100)} %)</b></span></p>` : ''}
    <div class="subhead">Noten aus Datei übernehmen</div>
    <div class="importBox"><div><b>Notenliste einlesen</b><p class="hint">Z. B. die „Notenliste (CSV)“ aus <b>Viva</b> nach einer mündlichen Schulaufgabe. Libretto ordnet die ${up ? 'Notenpunkte' : 'Noten'} über die Namen zu; du kannst sie danach in der Tabelle ändern.</p><p class="hint" id="aImpInfo" hidden></p></div>
      <div class="panelBtns" style="margin:0"><button type="button" class="mini" id="aImpBtn">Datei wählen …</button></div><input type="file" id="aImpFile" accept=".csv,.txt" hidden></div>
    ${field('Notiz (nur für dich)', `<textarea id="aNote" rows="2">${esc(a.note || '')}</textarea>`)}
    ${isNew ? '' : '<div class="panelBtns"><button type="button" class="mini" id="aPrint">Notenliste drucken (PDF)</button><button type="button" class="mini" id="aWord">als Word</button></div><button type="button" class="danger" id="aDel">Leistungsnachweis löschen</button>'}`;
  const read = d => {
    a.type = d.querySelector('#aType').value; a.title = d.querySelector('#aTitle').value.trim(); a.date = d.querySelector('#aDate').value; a.short = d.querySelector('#aShort').value.trim();
    if (up) a.term = d.querySelector('#aTerm').value;
    if (a.type === 'jst') a.countAs = d.querySelector('#aCount').value; else delete a.countAs;
    const bw = +d.querySelector('#aBigW').value; if (R.isBig(a) && bw !== 1) a.bigWeight = bw; else delete a.bigWeight;
    const w = d.querySelector('#aW').value; if (!R.isBig(a) && w !== '') a.weight = +w; else delete a.weight;
    const ar = d.querySelector('#aArea').value; if (!R.isBig(a) && ar !== R.TYPES[a.type].area) a.area = ar; else delete a.area;
    a.usePoints = d.querySelector('#aPts').checked;
    const max = +d.querySelector('#aMax').value;
    const ks = $$('[data-k]', d).map(i => i.value === '' ? null : +i.value);
    if (a.usePoints) {
      if (!max || ks.some(x => x == null)) { toast('Bitte erreichbare Punkte und Notenschlüssel ausfüllen'); return false; }
      const anchors = up ? { p5: +d.querySelector('#aA1').value, p1: +d.querySelector('#aA2').value, step: +d.querySelector('#aStep').value } : { p4: +d.querySelector('#aA1').value, p5: +d.querySelector('#aA2').value, step: +d.querySelector('#aStep').value };
      a.key = up ? { max, pointThresholds: ks, pct15: pctArr, anchors } : { max, thresholds: ks, pct: pctArr, anchors };
      if (d.querySelector('#aRemember').checked) D.settings.keyPresets[pKey] = anchors;
      Object.values(a.results || {}).forEach(r => { if (r && r.raw != null && !r.status) r.v = up ? R.keyPoints(r.raw, a.key) : R.keyGrade(r.raw, a.key); });
    }
    a.note = d.querySelector('#aNote').value;
    return true;
  };
  const { dlg, close } = sheet({ title: isNew ? 'Neuer Leistungsnachweis' : (a.title || R.TYPES[a.type].label), wide: true, body, onOk: d => {
    if (!read(d)) return false;
    if (up && a.type === 'sa' && !R.termHasSA(c, a.term)) toast(`Hinweis: In ${a.term} ist für dieses Fach keine Schulaufgabe vorgesehen (§ 29 GSO).`);
    const i = c.assessments.findIndex(x => x.id === a.id);
    if (i >= 0) c.assessments[i] = a; else c.assessments.push(a);
    if (R.isBig(a) && !up) { const cf = R.dateConflicts(classBigDates(R.classOf(c.name))).filter(x => x.items.some(it => it.date === a.date)); if (cf.length) toast('Achtung: ' + cf[0].text, 5000); }
    save(); render();
  } });
  const upd = () => {
    const t = dlg.querySelector('#aType').value; const big = t === 'sa' || (t === 'jst' && dlg.querySelector('#aCount').value === 'big');
    dlg.querySelector('#jstOpt').hidden = t !== 'jst'; dlg.querySelector('#bigOpt').hidden = !big; dlg.querySelector('#smallOpt').hidden = big;
    dlg.querySelector('#keyBox').hidden = !dlg.querySelector('#aPts').checked;
    if (!dlg.querySelector('#aArea').dataset.touched) dlg.querySelector('#aArea').value = R.TYPES[t].area;
  };
  ['#aType', '#aCount', '#aPts'].forEach(s => dlg.querySelector(s).addEventListener('change', upd));
  dlg.querySelector('#aArea').addEventListener('change', e => e.target.dataset.touched = 1);
  upd();
  const showPct = () => { const max = +dlg.querySelector('#aMax').value; const el = dlg.querySelector('#keyPct');
    el.innerHTML = max ? $$('[data-k]', dlg).map(inp => `<span>${inp.value === '' ? '' : Math.round(+inp.value / max * 1000) / 10 + ' %'}</span>`).join('') : ''; el.className = 'keyPct ' + (up ? 'k15' : ''); };
  dlg.querySelector('#aSuggest').onclick = () => {
    const max = +dlg.querySelector('#aMax').value; if (!max) { toast('Erst erreichbare Punkte eingeben'); return; }
    const x = +dlg.querySelector('#aA1').value, y = +dlg.querySelector('#aA2').value, step = +dlg.querySelector('#aStep').value;
    if (!(x > y)) { toast(up ? 'Die 5-Punkte-Grenze muss über der 1-Punkt-Grenze liegen' : 'Die Grenze für die 4 muss über der für die 5 liegen'); return; }
    pctArr = up ? R.pct15FromAnchors(x, y) : R.pctFromAnchors(x, y);
    const k = up ? R.suggestKey15(max, pctArr, step).pointThresholds : R.suggestKey(max, pctArr, step).thresholds;
    $$('[data-k]', dlg).forEach((inp, i) => inp.value = k[i]); showPct();
  };
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
    if (await ask(`„${esc(a.title || R.TYPES[a.type].label)}“ ${n ? `mit ${n} eingetragenen Ergebnissen ` : ''}löschen?`, 'Löschen', true)) { c.assessments = c.assessments.filter(x => x.id !== a.id); save(); close(); render(); }
  };
  const pr = dlg.querySelector('#aPrint'); if (pr) { pr.onclick = () => exportModel(modelAssessment(c, c.assessments.find(x => x.id === a.id)), 'pdf'); dlg.querySelector('#aWord').onclick = () => exportModel(modelAssessment(c, c.assessments.find(x => x.id === a.id)), 'docx'); }
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
  c.students.forEach(st => { const n = splitName(st); byKey.set(key(n.last, n.first), st); const k = norm(n.last); byLast.set(k, byLast.has(k) ? null : st); });
  const results = {}, unknown = []; let n = 0;
  rows.slice(1).forEach(r => {
    let l = r[iL], f = iF >= 0 ? r[iF] : ''; if (iF < 0 && String(l).includes(',')) { [l, f] = String(l).split(','); }
    const v = String(r[iV] ?? '').trim(); if (!norm(l)) return;
    const st = byKey.get(key(l, f)) || byLast.get(norm(l)); if (!st) { unknown.push(`${String(l).trim()}${norm(f) ? ', ' + String(f).trim() : ''}`); return; }
    if (v === '' || /^fehlt$/i.test(v)) return;
    const pr = R.parseCell(v, up); if (pr.error) return; results[st.id] = pr; n++;
  });
  if (!n) return { error: 'Keine passenden Namen mit Noten gefunden. Stimmen Klasse und Datei überein?' };
  return { results, n, unknown, missing: c.students.filter(st => !results[st.id]).map(st => st.name) };
}

/* Einzelnoten eines Schülers bearbeiten */
function entrySheet(c, s) {
  const up = upper(c), sc = entScope(c);
  let rows = entriesOf(c, s.id, sc).map(e => ({ ...e }));
  const typeOpts = t => ENTRY_TYPES.map(k => `<option value="${k}" ${t === k ? 'selected' : ''}>${R.TYPES[k].label}</option>`).join('');
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
    list.innerHTML = rows.length ? `<div class="entRow entHead"><span>Datum</span><span>Art</span><span>${up ? 'Punkte' : 'Note'}</span><span>Notiz</span><span></span></div>` + rows.map((r, i) => `<div class="entRow" data-i="${i}"><input type="date" data-f="date" value="${esc(r.date || '')}"><select data-f="type">${typeOpts(r.type)}</select><input type="text" data-f="grade" value="${esc(R.cellText(r, up))}" placeholder="${up ? '0–15' : '1–6'}"><input type="text" data-f="note" value="${esc(r.note || '')}" placeholder="Notiz (optional)"><button type="button" class="mini del" data-del="${i}">Löschen</button></div>`).join('')
      : '<div class="stEmpty">Noch keine Einzelnoten.</div>';
    $$('.entRow[data-i]', list).forEach(row => { const r = rows[+row.dataset.i];
      row.querySelector('[data-f=date]').onchange = e => r.date = e.target.value;
      row.querySelector('[data-f=type]').onchange = e => r.type = e.target.value;
      row.querySelector('[data-f=note]').oninput = e => r.note = e.target.value;
      const g = row.querySelector('[data-f=grade]'); g.onchange = () => { const p = R.parseCell(g.value, up); if (!g.value.trim()) { delete r.v; delete r.tend; delete r.status; return; } if (p.error) { toast(p.error); g.select(); return; } delete r.v; delete r.tend; delete r.status; Object.assign(r, p); };
    });
    $$('[data-del]', list).forEach(b => b.onclick = () => { rows.splice(+b.dataset.del, 1); draw(); });
  };
  draw();
  dlg.querySelector('#entAdd').onclick = () => { rows.push({ id: uid(), type: c.entryType || 'ub', date: todayISO() }); draw(); const g = $$('[data-f=grade]', list); g[g.length - 1].focus(); };
}
function entryCfgSheet(c) {
  sheet({ title: 'Spalte „Einzeln“', small: true, body: `<p class="prose" style="margin-top:0">Hier trägst du Noten ein, die nicht die ganze Klasse am selben Tag bekommt – etwa <b>Unterrichtsbeiträge</b> oder <b>Rechenschaftsablagen</b>. Note in die Zelle tippen und Enter: Libretto speichert sie mit dem heutigen Datum. Auf eine Note klicken: Datum, Art und Notiz ändern – oder die Note wieder <b>löschen</b>.</p>
    ${field('Art bei schneller Eingabe', `<select id="eT">${ENTRY_TYPES.map(k => `<option value="${k}" ${(c.entryType || 'ub') === k ? 'selected' : ''}>${R.TYPES[k].label}</option>`).join('')}</select>`)}`,
    onOk: d => { c.entryType = d.querySelector('#eT').value; save(); render(); } });
}

/* ======================================================================
   Schülerblatt
   ====================================================================== */
function studentSheet(c, s) {
  const up = upper(c);
  const as = c.assessments.concat((c.entries || []).filter(e => e.sid === s.id).map(e => ({ ...e, title: R.TYPES[e.type].label + ' (einzeln)', results: { [s.id]: e } }))).sort((x, y) => (x.date || '').localeCompare(y.date || ''));
  let sum = '', warn = [];
  if (up) {
    sum = R.termsOf(c).map(t => { const r = R.computeTerm(c, s.id, t); return `<div class="stat"><div class="v">${r.points ?? '–'}</div><div class="l">Halbjahr ${t}${r.points != null ? ' · ' + R.POINT_LABEL(r.points) : ''}</div></div>`; }).join('');
    if (c.seminar) { const sp = c.seminarPaper[s.id] || {}; sum += `<div class="stat"><div class="v">${R.seminarPaper(sp.arbeit, sp.gespraech) ?? '–'}</div><div class="l">Seminararbeit (max. 30)</div></div>`; }
  } else {
    const r = R.computeLower(c, s.id, scopeOf(c));
    warn = R.studentWarnings(c, s.id, r);
    sum = `${c.hasSA ? `<div class="stat"><div class="v">${fmt(r.saAvg)}</div><div class="l">Ø große LN</div></div>` : ''}<div class="stat"><div class="v">${fmt(r.smAvg)}</div><div class="l">Ø kleine LN</div></div><div class="stat"><div class="v">${fmt(r.total)}</div><div class="l">Ø gesamt (${c.hasSA ? r.ratio + ':1' : 'nur klein'})</div></div><div class="stat"><div class="v">${r.suggestion ? r.suggestion.text : '–'}</div><div class="l">Vorschlag Zeugnis</div></div>`;
  }
  const ov = c.overrides[s.id] || {};
  const aw = (c.away && c.away[s.id]) || {};
  const body = `
    ${field('Name', `<input type="text" id="sName" value="${esc(s.name)}">`)}
    <div class="stuSum">${sum}</div>
    ${warn.length ? `<div class="notices">${warn.map(w => `<div class="notice ${w.level === 'info' ? 'info' : ''}"><div class="grow">${esc(w.text)}</div></div>`).join('')}</div>` : ''}
    <div class="lnList">${as.length ? as.map(a => { const r = a.results && a.results[s.id]; const big = R.isBig(a); return `<div class="li"><div>${esc(a.title || R.TYPES[a.type].label)}<small>${big ? 'groß' : 'klein'}${a.date ? ' · ' + fdate(a.date) : ''}${up ? ' · ' + a.term : ''}${r && r.status ? ' · ' + esc(R.STATUS[r.status].label) : ''}${!r && isAway(c, s.id, a.date) ? ' · abwesend' : ''}</small></div><div class="hint" style="text-align:right">${r && r.raw != null ? String(r.raw).replace('.', ',') + ' / ' + (a.key ? a.key.max : '') + ' P.' : ''}</div><div class="v">${esc(R.cellText(r, up)) || '–'}</div></div>`; }).join('') : '<div class="li"><div class="hint">Noch keine Leistungsnachweise</div></div>'}</div>
    ${up ? '' : `<div class="subhead">Zeugnisnote</div><div class="rows" style="margin-bottom:10px">${sw('sNg', !!(c.noGrade && c.noGrade[s.id]), 'Ohne Note (z. B. längere Erkrankung) – keine Warnungen, Hinweis auf Bemerkung nach § 39 Abs. 6 GSO')}</div><div class="grid2">${field('Festlegen (überschreibt den Vorschlag)', `<select id="sOv"><option value="">Vorschlag übernehmen</option>${[1, 2, 3, 4, 5, 6].map(n => `<option ${+ov.grade === n ? 'selected' : ''}>${n}</option>`).join('')}</select>`)}${field('Begründung (z. B. pädagogische Gesamtwürdigung)', `<input type="text" id="sOvR" value="${esc(ov.reason || '')}">`)}</div>`}
    <div class="subhead">Längere Abwesenheit</div>
    <div class="grid3">${field('Abwesend von', `<input type="date" id="sAwF" value="${esc(aw.from || '')}">`)}${field('bis', `<input type="date" id="sAwT" value="${esc(aw.to || '')}">`)}${field('Grund (optional)', `<input type="text" id="sAwR" value="${esc(aw.reason || '')}" placeholder="z. B. Auslandsaufenthalt">`)}</div>
    <p class="hint">Z. B. für ein Halbjahr im Ausland: Leistungsnachweise in diesem Zeitraum werden in der Tabelle und auf Ausdrucken mit „abw.“ gekennzeichnet. Gerechnet wird wie immer nur mit den vorhandenen Noten.</p>
    ${field('Notizen (nur für dich)', `<textarea id="sNote" rows="3">${esc(c.notes[s.id] || '')}</textarea>`)}
    <div class="panelBtns"><button type="button" class="mini" id="sPdf">Schülerblatt drucken (PDF)</button><button type="button" class="mini" id="sDoc">als Word</button></div>`;
  const { dlg } = sheet({ title: s.name, wide: true, body, onOk: d => {
    const n = d.querySelector('#sName').value.trim(); if (n && n !== s.name) { Object.assign(s, splitName({ name: n })); s.name = fullName(s); }
    if (!up) { c.noGrade = c.noGrade || {}; if (d.querySelector('#sNg').checked) c.noGrade[s.id] = { reason: d.querySelector('#sOvR').value.trim() }; else delete c.noGrade[s.id]; }
    if (!up) { const g = d.querySelector('#sOv').value; if (g) c.overrides[s.id] = { grade: +g, reason: d.querySelector('#sOvR').value.trim() }; else delete c.overrides[s.id]; }
    const nt = d.querySelector('#sNote').value.trim(); if (nt) c.notes[s.id] = nt; else delete c.notes[s.id];
    const af = d.querySelector('#sAwF').value, at = d.querySelector('#sAwT').value; c.away = c.away || {};
    if (af && at && at < af) { toast('Abwesenheit: Das Ende liegt vor dem Beginn'); return false; }
    if (af || at) c.away[s.id] = { from: af, to: at, reason: d.querySelector('#sAwR').value.trim() }; else delete c.away[s.id];
    c.students.sort(byName);
    save(); render();
  } });
  dlg.querySelector('#sPdf').onclick = () => exportModel(modelStudents(c, [s]), 'pdf');
  dlg.querySelector('#sDoc').onclick = () => exportModel(modelStudents(c, [s]), 'docx');
}

/* ======================================================================
   Drucken & Export
   ====================================================================== */
function scopeLabel(c) { if (upper(c)) return UI.term ? 'Halbjahr ' + UI.term : 'Qualifikationsphase ' + c.grade; return UI.scope === 'half' ? `Stand Zwischenzeugnis${D.settings.half1End ? ' (bis ' + fdate(D.settings.half1End) + ')' : ''}` : UI.scope === 'until' ? 'Stand bis ' + fdate(UI.until || todayISO()) : 'Schuljahr ' + D.settings.year; }
function baseMeta(c) { return [['Kurs', `${c.name} · ${c.subject}`], [upper(c) ? 'Q-Phase' : 'Jahrgangsstufe', String(c.grade)], ['Schuljahr', D.settings.year], ...(D.settings.teacher ? [['Lehrkraft', D.settings.teacher]] : [])]; }
const ct = (c, a, s, up) => R.cellText(a.results && a.results[s.id], up) || (isAway(c, s.id, a.date) ? 'abw.' : '');
function lnName(a) { return (a.short || R.TYPES[a.type].short) + (a.date ? ' ' + sdate(a.date) : ''); }
function entTxt(c, s) { return entriesOf(c, s.id).map(e => R.cellText(e, upper(c))).join(' ') || ''; }
function finalTxt(c, s, r) { const ng = c.noGrade && c.noGrade[s.id]; if (ng) return 'ohne Note'; const ov = c.overrides[s.id]; return ov ? ov.grade + ' (festgelegt)' : r.suggestion ? r.suggestion.text : '–'; }
function modelCourse(c) {
  const up = upper(c);
  if (up && !UI.term) {
    const terms = R.termsOf(c);
    const head = ['Name', ...terms.map(t => t + ' (Punkte)'), ...(c.seminar ? ['Seminararbeit (max. 30)'] : [])];
    const rows = c.students.map(s => [s.name, ...terms.map(t => { const p = R.computeTerm(c, s.id, t).points; return p == null ? '–' : String(p); }), ...(c.seminar ? [String(R.seminarPaper((c.seminarPaper[s.id] || {}).arbeit, (c.seminarPaper[s.id] || {}).gespraech) ?? '–')] : [])]);
    return { title: `Notenübersicht ${c.name} · ${c.subject}`, subtitle: scopeLabel(c), meta: baseMeta(c), blocks: [{ table: { head, rows, align: ['l'], bold: head.map((_, i) => i).slice(1) } }], landscape: false };
  }
  const as = visibleAssessments(c);
  const big = as.filter(a => R.isBig(a)), small = as.filter(a => !R.isBig(a));
  let head, rows;
  if (up) {
    const t = scopeOf(c).term;
    head = ['Name', ...big.map(lnName), ...small.map(lnName), 'Einzeln', 'Ø klein', 'Ergebnis', 'Punkte'];
    rows = c.students.map(s => { const r = R.computeTerm(c, s.id, t); return [s.name, ...big.map(a => ct(c, a, s, true)), ...small.map(a => ct(c, a, s, true)), entTxt(c, s), fmt(r.small), fmt(r.raw), r.points == null ? '–' : String(r.points)]; });
  } else {
    head = ['Name', ...(c.hasSA ? big.map(lnName) : []), ...(c.hasSA ? ['Ø groß'] : []), ...small.map(lnName), 'Einzeln', 'Ø klein', 'Ø gesamt', 'Zeugnis'];
    rows = c.students.map(s => { const r = R.computeLower(c, s.id, scopeOf(c)); return [s.name, ...(c.hasSA ? big.map(a => ct(c, a, s, false)) : []), ...(c.hasSA ? [fmt(r.saAvg)] : []), ...small.map(a => ct(c, a, s, false)), entTxt(c, s), fmt(r.smAvg), fmt(r.total), finalTxt(c, s, r)]; });
  }
  const legend = (as.length || (c.entries || []).length ? 'Einzeln = Einzelnoten mit eigenem Datum (z. B. Unterrichtsbeiträge) · ' : '') + as.map(a => `${lnName(a)} = ${a.title || R.TYPES[a.type].label}${R.isBig(a) && a.bigWeight && +a.bigWeight !== 1 ? ' (' + wLabel(a.bigWeight) + ')' : ''}${!R.isBig(a) && R.weightOf(a, c) !== 1 ? ' (Gewicht ' + R.weightOf(a, c) + ')' : ''}`).join(' · ');
  const rule = up ? 'Halbjahresleistung nach § 29 GSO: Schulaufgabe und Durchschnitt der kleinen LN 1:1, gerundet.' : c.hasSA ? `Jahresfortgangsnote nach § 28 GSO: große : kleine LN = ${R.saRatio(c)}:1.` : 'Fach ohne Schulaufgaben: Note aus den kleinen Leistungsnachweisen.';
  return { title: `Notenübersicht ${c.name} · ${c.subject}`, subtitle: scopeLabel(c), meta: baseMeta(c), landscape: head.length > 11,
    blocks: [{ table: { head, rows, align: ['l'], bold: [head.length - 1], small: head.length > 16 } }, { p: rule + ' Kürzel: E = entschuldigt (Nachtermin), B = befreit, 6* = versäumt/verweigert (§ 26 Abs. 4 GSO), U = Unterschleif' + (Object.keys(c.away || {}).length ? ', abw. = längere Abwesenheit' : '') + '.' }, ...(legend ? [{ p: legend }] : [])] };
}
function modelTransfer(c) {
  const up = upper(c);
  const head = ['Nr.', 'Name', up ? (UI.term ? 'Punkte ' + UI.term : 'Punkte') : 'Note', 'Bemerkung'];
  const rows = c.students.map((s, i) => {
    if (up) { const t = UI.term || R.termsOf(c)[0]; const r = R.computeTerm(c, s.id, t); return [String(i + 1), s.name, r.points == null ? '–' : String(r.points), r.zero ? '0 Punkte – nicht belegt' : r.open.length ? 'Nachtermin offen' : '']; }
    const r = R.computeLower(c, s.id, scopeOf(c)); const ov = c.overrides[s.id]; const ng = c.noGrade && c.noGrade[s.id];
    if (ng) return [String(i + 1), s.name, '–', 'ohne Note' + (ng.reason ? ': ' + ng.reason : '') + ' – ggf. Bemerkung (§ 39 Abs. 6 GSO)'];
    return [String(i + 1), s.name, ov ? String(ov.grade) : r.suggestion ? r.suggestion.text : '–', ov ? (ov.reason || 'von der Lehrkraft festgelegt') : r.suggestion && r.suggestion.grade == null ? 'Grenzfall – Entscheidung nötig' : r.open.length ? 'Nachtermin offen' : ''];
  });
  return { title: `Übertragsliste ${c.name} · ${c.subject}`, subtitle: scopeLabel(c) + ' – zum Eintragen ins Infoportal', meta: baseMeta(c), blocks: [{ table: { head, rows, align: ['c', 'l', 'c', 'l'], big: [2] } }, { p: 'Reihenfolge alphabetisch wie in der Schülerliste. Bitte nach dem Übertragen abhaken.' }] };
}
function modelAssessment(c, a) {
  const up = upper(c), dist = R.distribution(a, c.students, up);
  const head = ['Nr.', 'Name', ...(a.usePoints ? ['Punkte'] : []), up ? 'Notenpunkte' : 'Note'];
  const rows = c.students.map((s, i) => { const r = a.results && a.results[s.id]; return [String(i + 1), s.name, ...(a.usePoints ? [r && r.raw != null ? String(r.raw).replace('.', ',') : ''] : []), R.cellText(r, up) || (isAway(c, s.id, a.date) ? 'abw.' : '–')]; });
  const blocks = [{ table: { head, rows, align: ['c', 'l'], big: [head.length - 1] } }];
  blocks.push({ h: 'Notenspiegel' });
  blocks.push({ table: { head: up ? Array.from({ length: 16 }, (_, i) => String(15 - i)) : ['1', '2', '3', '4', '5', '6'], rows: [up ? dist.counts.slice().reverse().map(String) : dist.counts.map(String)], bold: [] } });
  blocks.push({ p: `Teilnehmer: ${dist.n} · Durchschnitt: ${fmt(dist.avg, 2)} · ${up ? 'unter 5 Punkten' : 'Noten 5 und 6'}: ${dist.weak} (${Math.round(dist.weakShare * 100)} %)` });
  if (a.usePoints && a.key) blocks.push({ h: 'Notenschlüssel' }, { table: up ? { head: Array.from({ length: 15 }, (_, i) => (15 - i) + ' P.'), rows: [a.key.pointThresholds.map(x => 'ab ' + String(x).replace('.', ','))], small: true } : { head: ['Note 1', 'Note 2', 'Note 3', 'Note 4', 'Note 5', 'Note 6'], rows: [[...a.key.thresholds.map(x => 'ab ' + String(x).replace('.', ',')), 'darunter']] } }, { p: `Erreichbar: ${String(a.key.max).replace('.', ',')} Punkte` });
  blocks.push({ sig: ['Datum, Unterschrift der Lehrkraft'] });
  return { title: `${a.title || R.TYPES[a.type].label} – ${c.name} · ${c.subject}`, subtitle: `${R.TYPES[a.type].label}${R.isBig(a) ? ' (großer LN' + (a.bigWeight && +a.bigWeight !== 1 ? ', ' + wLabel(a.bigWeight) : '') + ')' : ' (kleiner LN)'}${a.date ? ' · ' + fdate(a.date) : ''}${up ? ' · Halbjahr ' + a.term : ''}`, meta: baseMeta(c), blocks };
}
function modelStudents(c, list) {
  const up = upper(c);
  const blocks = [];
  list.forEach((s, idx) => {
    const as = c.assessments.concat((c.entries || []).filter(e => e.sid === s.id).map(e => ({ ...e, title: R.TYPES[e.type].label + ' (einzeln)', results: { [s.id]: e } }))).sort((x, y) => (x.date || '').localeCompare(y.date || ''));
    const head = { title: s.name, subtitle: `${c.name} · ${c.subject} · ${scopeLabel(c)}`, meta: baseMeta(c) };
    if (idx) blocks.push({ pagebreak: true }, { head });
    const rows = as.map(a => { const r = a.results && a.results[s.id]; return [a.title || R.TYPES[a.type].label, R.isBig(a) ? 'groß' + (a.bigWeight && +a.bigWeight !== 1 ? ' ' + wLabel(a.bigWeight) : '') : 'klein', a.date ? fdate(a.date) : '', ...(up ? [a.term] : []), r && r.raw != null ? String(r.raw).replace('.', ',') + (a.key ? ' / ' + String(a.key.max).replace('.', ',') : '') : '', R.cellText(r, up) || (isAway(c, s.id, a.date) ? 'abw.' : '–')]; });
    if (awayOf(c, s.id)) blocks.push({ p: 'Hinweis: ' + awayText(awayOf(c, s.id)) + '.' });
    blocks.push({ h: 'Leistungsnachweise' }, { table: { head: ['Leistungsnachweis', 'Art', 'Datum', ...(up ? ['Halbjahr'] : []), 'Punkte', up ? 'Notenpunkte' : 'Note'], rows: rows.length ? rows : [['Noch keine Einträge', '', '', ...(up ? [''] : []), '', '']], align: ['l'], bold: [up ? 5 : 4] } });
    blocks.push({ h: 'Ergebnis' });
    if (up) blocks.push({ table: { head: R.termsOf(c).map(t => 'Halbjahr ' + t), rows: [R.termsOf(c).map(t => { const p = R.computeTerm(c, s.id, t).points; return p == null ? '–' : `${p} Punkte (${R.POINT_LABEL(p)})`; })], bold: [0, 1] } });
    else { const r = R.computeLower(c, s.id, scopeOf(c)); const ov = c.overrides[s.id]; blocks.push({ table: { head: [...(c.hasSA ? ['Ø große LN'] : []), 'Ø kleine LN', 'Ø gesamt', 'Zeugnisnote (Vorschlag)'], rows: [[...(c.hasSA ? [fmt(r.saAvg)] : []), fmt(r.smAvg), fmt(r.total), ov ? String(ov.grade) : r.suggestion ? r.suggestion.text : '–']], big: [c.hasSA ? 3 : 2] } }); }
  });
  return { title: list.length === 1 ? list[0].name : `Schülerblätter ${c.name} · ${c.subject}`, subtitle: list.length === 1 ? `${c.name} · ${c.subject} · ${scopeLabel(c)}` : scopeLabel(c), meta: baseMeta(c), blocks };
}
function modelStudentsAll(c) {
  const m = modelStudents(c, c.students);
  if (c.students.length) { m.title = c.students[0].name; m.subtitle = `${c.name} · ${c.subject} · ${scopeLabel(c)}`; }
  return m;
}
const fileSafe = s => s.replace(/[^\wäöüÄÖÜß.-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
async function exportModel(m, kind) {
  const base = fileSafe(m.title);
  try {
    if (kind === 'pdf') await N.savePdf(base + '.pdf', Print.html(m, D.settings), m.landscape, Print.footer(D.settings));
    if (kind === 'docx') await N.saveFile(base + '.docx', await Print.docx(m, D.settings), 'docx');
    if (kind === 'csv') await N.saveFile(base + '.csv', Print.csv(m), 'csv');
  } catch (e) { toast('Export fehlgeschlagen: ' + e.message); }
}
function printSheet(c) {
  if (!c) return;
  const opt = (id, title, sub) => `<div class="row"><span><b>${title}</b><br><small class="hint">${sub}</small></span><button type="button" class="mini accent" data-p="${id}:pdf">PDF</button><button type="button" class="mini" data-p="${id}:docx">Word</button>${id === 'course' ? '<button type="button" class="mini" data-p="course:csv">Excel</button>' : ''}</div>`;
  const { dlg, close } = sheet({ title: 'Drucken & Export', ok: '', cancel: 'Fertig', body: `<p class="hint" style="margin-top:0">Gilt für die aktuelle Ansicht: <b>${esc(scopeLabel(c))}</b>. Alle Ausdrucke tragen das theis-Logo und den Hinweis, dass Libretto die Dokumentation der Schule nicht ersetzt.</p>
    <div class="rows">${opt('course', 'Kursübersicht', 'Alle Schüler mit allen Noten, Durchschnitten und Vorschlag')}${opt('transfer', 'Übertragsliste fürs Infoportal', 'Nur Name und Endnote – zum Abtippen und Abhaken')}${opt('students', 'Schülerblätter', 'Eine Seite pro Schüler, z. B. für Elterngespräche')}</div>
    <p class="hint">Einzelne Leistungsnachweise druckst du über den Spaltenkopf in der Tabelle, einzelne Schüler über ihren Namen.</p>` });
  $$('[data-p]', dlg).forEach(b => b.onclick = () => { const [what, kind] = b.dataset.p.split(':'); exportModel(what === 'course' ? modelCourse(c) : what === 'transfer' ? modelTransfer(c) : modelStudentsAll(c), kind); });
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
  const classes = [...new Set(D.courses.map(clsOf))].sort((a, b) => (parseInt(a) || 99) - (parseInt(b) || 99) || a.localeCompare(b));
  const f = UI.calCls || '';
  const ev = {};
  D.courses.filter(c => !f || clsOf(c) === f).forEach(c => c.assessments.filter(a => a.date && WRITTEN.includes(a.type)).forEach(a => (ev[a.date] = ev[a.date] || []).push({ c, a })));
  D.classDates.filter(x => !f || x.cls === f).forEach(x => (ev[x.date] = ev[x.date] || []).push({ other: x }));
  const free = Cal.freeDays(y, m);
  const first = new Date(y, m, 1), start = Cal.add(first, -((first.getDay() + 6) % 7));
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = Cal.add(start, i), iso = Cal.iso(d), inM = d.getMonth() === m, fr = free[iso], we = d.getDay() === 0 || d.getDay() === 6;
    if (i >= 35 && !inM) break;
    const items = (ev[iso] || []).map(x => x.other ? `<span class="cev other" title="${esc(x.other.cls + ' · ' + x.other.subject)}">${esc(x.other.cls)} ${esc(x.other.subject.slice(0, 4))}</span>`
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
      <div class="panelBtns"><button class="mini" id="evImp2">Neu einlesen …</button><button class="mini" id="evClear">Schultermine entfernen</button></div></details>` : '';
  return `<section class="panel glass" style="margin-bottom:16px"><div class="calHead"><h2 class="ptitle" style="margin:0">Kalender</h2>
      <div class="calNav"><button class="iconbtn" data-calnav="-1" title="Vorheriger Monat">‹</button><span class="calTitleWrap"><button class="calTitle" id="calTitle" title="Monat und Jahr wählen" aria-expanded="${!!pk}">${MONTHS[m]} ${y}<i>▾</i></button>${picker}</span><button class="iconbtn" data-calnav="1" title="Nächster Monat">›</button><button class="mini" data-calnav="0">Heute</button></div>
      <div class="calTools">${(D.events || []).length ? '' : '<button class="mini" id="evImp" title="Termine der Schule aus dem Infoportal (CSV) oder aus einer Kalenderdatei (ICS) übernehmen">Schultermine einlesen …</button>'}<span class="picker"><select id="calCls"><option value="">Alle Klassen und Kurse</option>${classes.map(x => `<option ${x === f ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></span></div></div>
    <div class="cal"><div class="cwd">Mo</div><div class="cwd">Di</div><div class="cwd">Mi</div><div class="cwd">Do</div><div class="cwd">Fr</div><div class="cwd">Sa</div><div class="cwd">So</div>${cells.join('')}</div>
    ${evList}<input type="file" id="evFile" accept=".csv,.ics,.txt" hidden>
    <p class="note">Zeigt angekündigte und geplante schriftliche Leistungsnachweise (Schulaufgaben, Stegreifaufgaben, Kurzarbeiten, Tests)${(D.events || []).length ? ' und die eingelesenen Schultermine (grau)' : ''}. Ferien und Feiertage in Bayern laut Kultusministerium, ohne Gewähr; Mariä Himmelfahrt gilt nur in überwiegend katholischen Gemeinden.</p></section>`;
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
  if (file) file.onchange = async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try { const list = parseEvents(await f.text());
      if (list === null) { toast('Spalten nicht erkannt – erwartet werden „Titel“ und „Start“ (CSV aus dem Infoportal) oder eine ICS-Kalenderdatei', 6000); return; }
      if (!list.length) { toast('In der Datei wurden keine Termine gefunden'); return; }
      const had = (D.events || []).length; D.events = list; save(); UI.evOpen = true; renderDates(); toast(`${list.length} Schultermine eingelesen${had ? ' – die bisherigen wurden ersetzt' : ''}`, 4000);
    } catch (err) { console.error(err); toast('Datei konnte nicht gelesen werden'); } };
  if ($('#evClear')) $('#evClear').onclick = async () => { if (READONLY) return; if (await ask(`Alle ${D.events.length} eingelesenen Schultermine aus dem Kalender entfernen? Deine Leistungsnachweise bleiben unverändert.`, 'Entfernen', true)) { D.events = []; save(); renderDates(); } };
}
function renderDates() {
  const t = todayISO();
  const bigs = D.courses.flatMap(c => c.assessments.filter(a => R.isBig(a)).map(a => ({ c, a, cls: upper(c) ? c.name : R.classOf(c.name) }))).sort((x, y) => (x.a.date || '9999').localeCompare(y.a.date || '9999'));
  const confKeys = new Set();
  const classes = [...new Set(D.courses.filter(c => !upper(c)).map(c => R.classOf(c.name)))];
  classes.forEach(cls => R.dateConflicts(classBigDates(cls)).forEach(cf => cf.items.forEach(it => confKeys.add(cls + it.date))));
  const open = D.courses.flatMap(c => c.assessments.flatMap(a => Object.entries(a.results || {}).filter(([, r]) => r && r.status === 'ent').map(([sid]) => ({ c, a, s: c.students.find(x => x.id === sid) })))).filter(x => x.s);
  $('#main').innerHTML = `<div class="notices">${backupNotice()}</div>${calendarHTML()}<div class="twoCol">
    <section class="panel glass"><div class="phead"><h2 class="ptitle">Große Leistungsnachweise</h2><span class="count">${bigs.length}</span></div>
      <div class="tlist">${bigs.length ? bigs.map(({ c, a, cls }) => `<div class="trow ${confKeys.has(cls + a.date) ? 'conf' : ''} ${a.date && a.date < t ? 'past' : ''}"><span class="d">${a.date ? fdate(a.date) : 'ohne Datum'}</span><span>${esc(c.name)} · ${esc(c.subject)}<br><small>${esc(a.title || R.TYPES[a.type].label)}${a.bigWeight && +a.bigWeight !== 1 ? ' · ' + wLabel(a.bigWeight) : ''}</small></span>${confKeys.has(cls + a.date) ? '<span class="pill part">Termin prüfen</span>' : ''}</div>`).join('') : '<p class="hint">Noch keine Schulaufgaben eingetragen.</p>'}</div>
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
  $$('[data-goto]').forEach(b => b.onclick = () => { UI.course = b.dataset.goto; UI.tab = 'grades'; render(); });
  bindCalendar();
}

/* ======================================================================
   Sicherung
   ====================================================================== */
const ago = ms => { if (!ms) return 'noch nie'; const m = Math.round((Date.now() - ms) / 6e4); if (m < 1) return 'gerade eben'; if (m < 60) return `vor ${m} Min.`; const h = Math.round(m / 60); if (h < 24) return `vor ${h} Std.`; return `vor ${Math.round(h / 24)} Tagen`; };
async function renderBackup() {
  ST = await N.status();
  const list = await N.listBackups();
  const extOk = ST.backupDir && !ST.lastExternalError && ST.lastExternal && Date.now() - ST.lastExternal < 7 * 864e5;
  $('#main').innerHTML = `
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
    </div>`;
  $('#bkPick').onclick = async () => { ST = await N.chooseBackupDir(); renderBackup(); };
  if ($('#bkOpenExt')) $('#bkOpenExt').onclick = () => N.openBackupDir('external');
  $('#bkOpenLoc').onclick = () => N.openBackupDir('local');
  $('#bkNow').onclick = async () => { await flush(); const r = await N.backupNow(); toast(r.external ? 'Gesichert – auch im Sicherungsordner' : r.externalError ? 'Nur lokal gesichert: ' + r.externalError : 'Auf diesem Computer gesichert'); renderBackup(); };
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
async function settingsSheet() {
  const s = D.settings, v = await N.version();
  const LOGO = window.THEIS_LOGO.replace('<svg ', '<svg class="theislogo" ').replace('fill="#16171a"', 'fill="currentColor"').replace(/fill="#16171a"/g, 'fill="currentColor"').replace('fill="#2F5BEA"', 'class="dot" fill="#2F5BEA"');
  sheet({ title: 'Einstellungen', body: `
    <div class="grid2">${field('Name der Lehrkraft (für Ausdrucke)', `<input type="text" id="sT" value="${esc(s.teacher)}">`)}${field('Schule (optional)', `<input type="text" id="sS" value="${esc(s.school)}">`)}
      ${field('Schuljahr', `<input type="text" id="sY" value="${esc(s.year)}">`)}${field('Stichtag Zwischenzeugnis / Notenbild', `<input type="date" id="sH" value="${esc(s.half1End)}">`)}
      ${field('Nach Updates suchen', `<select id="sU"><option value="1" ${ST.updateCheck !== false ? 'selected' : ''}>Beim Start (nur Versionsnummer abfragen)</option><option value="0" ${ST.updateCheck === false ? 'selected' : ''}>Nie</option></select>`)}
      ${field('Automatisch sperren nach', `<select id="sL">${[[5, '5 Minuten'], [10, '10 Minuten'], [15, '15 Minuten'], [30, '30 Minuten'], [60, '60 Minuten']].map(([m, l]) => `<option value="${m}" ${+s.autoLock === m ? 'selected' : ''}>${l}</option>`).join('')}</select>`)}</div>
    <p class="hint">Der Stichtag steuert die Ansicht „Stand Zwischenzeugnis“ (§ 40 GSO). Die automatische Sperre gehört zu den Sicherheitsstandards für dienstliche Daten auf privaten Geräten.</p>
    <div class="maker"><span class="by">Eine App von</span>${LOGO}<div class="mk-meta">Apps für die Schule · <a href="https://theisapps.de/" target="_blank" rel="noopener">theisapps.de</a><br>Libretto ${esc(v)} · © 2026 theis. Alle Rechte vorbehalten.<br><a href="https://buy.stripe.com/3cI3cv0i8eLk31g4mNgw000" target="_blank" rel="noopener" style="font-weight:600">☕ Einen Kaffee ausgeben</a> · freiwillig</div></div>
    <p class="hint">Berechnungen nach der Schulordnung für die Gymnasien in Bayern (GSO), ohne Gewähr. ${esc(Print.DISCLAIMER)}</p>`,
    onOk: d => { s.teacher = d.querySelector('#sT').value.trim(); s.school = d.querySelector('#sS').value.trim(); s.year = d.querySelector('#sY').value.trim() || s.year; s.half1End = d.querySelector('#sH').value; s.autoLock = +d.querySelector('#sL').value; N.setCfg({ updateCheck: d.querySelector('#sU').value === '1' }).then(x => { ST = x; }); save(); $('#brandSub').textContent = `Notenverwaltung · Beta · Schuljahr ${s.year}`; render(); } });
}
function helpSheet() {
  const fig = (img, alt) => `<figure class="helpFig"><img src="help/${img}.jpg" alt="${esc(alt)}" loading="lazy"></figure>`;
  sheet({ title: 'Libretto – Hilfe', wide: true, ok: '', cancel: 'Schließen', body: `<div class="prose">
    <div class="notice"><div class="grow"><b>Beta · Wichtig:</b> ${esc(Print.DISCLAIMER)} Sichere zusätzlich selbst. Fehler oder Wünsche? Schreib an <b>hallo@theisapps.de</b>.</div></div>
    <h3>1 · Kurs anlegen und Klassenliste einlesen</h3>
    <p>Oben „Neuer Kurs“: Klasse (z. B. 9F), Fach und Jahrgangsstufe. Die Klassenliste als <b>PDF, Excel oder CSV</b> hineinziehen oder Text einfügen – Libretto erkennt Vor- und Nachnamen. Stimmt etwas nicht, kannst du jede Zeile bearbeiten, Schüler entfernen oder Vor- und Nachname mit einem Klick tauschen.</p>${fig('kurs', 'Kurs anlegen')}
    <h3>2 · Noten eintragen</h3>
    <p>Zelle anklicken, Note tippen, <span class="kbd">Enter</span> – weiter zur nächsten Zeile. Tendenzen wie 2+ werden angezeigt, gerechnet wird mit ganzen Noten. Kürzel: <code>E</code> entschuldigt (Nachtermin offen) · <code>B</code> befreit · <code>N</code> Note 6 wegen Versäumnis/Verweigerung · <code>U</code> Unterschleif. Leere Zellen sind kein Problem – gerechnet wird nur mit vorhandenen Noten.</p>${fig('tabelle', 'Notentabelle')}
    <h3>3 · Einzelnoten mit Datum</h3>
    <p>Unterrichtsbeiträge oder Rechenschaftsablagen bekommt meist nicht die ganze Klasse am selben Tag. Dafür gibt es die Spalte <b>„Einzeln“</b>: Note ins Feld „+“ tippen und Enter – gespeichert mit dem heutigen Datum. Vertippt? Direkt nach der Eingabe erscheint unten „Rückgängig“. Ein Klick auf eine Note öffnet die Liste: Datum, Art und Notiz ändern oder die Note <b>löschen</b>. Die Art für die schnelle Eingabe stellst du über den Spaltenkopf ein.</p>${fig('einzeln', 'Einzelnoten')}
    <h3>4 · Leistungsnachweise und Notenschlüssel</h3>
    <p>„+ Leistungsnachweis“: Art, Datum, Gewicht (z. B. Jahrgangsstufentest als ½ Schulaufgabe). Mit „Rohpunkte eingeben“ tippst du die Punkte ein und Libretto rechnet in Noten um. Den Schlüssel berechnet Libretto aus den Vorgaben eurer Fachschaft – etwa <b>Note 4 ab 50 %, Note 5 ab 33 %</b>; die Noten 1–3 werden gleichmäßig verteilt, jede Grenze bleibt änderbar. Libretto merkt sich die Vorgabe je Fach. Spaltenkopf anklicken: bearbeiten, Notenspiegel, Notenliste drucken.</p>${fig('schluessel', 'Notenschlüssel')}
    <h3>5 · Kalender und Termine</h3>
    <p>Alle schriftlichen Leistungsnachweise im Monatskalender, mit Ferien und Feiertagen in Bayern, filterbar nach Klasse. Ein Klick auf den Monatsnamen öffnet die Monats- und Jahreswahl. Mit <b>„Schultermine einlesen“</b> übernimmst du den Terminkalender deiner Schule: im Infoportal unter Termine „als CSV exportieren“ und die Datei hier auswählen (auch ICS-Kalenderdateien funktionieren). Die Schultermine erscheinen grau im Kalender und als Liste darunter. Außerdem: Terminprüfung nach § 22 GSO, offene Nachtermine und Schulaufgaben anderer Fächer deiner Klassen.</p>${fig('kalender', 'Kalender')}
    <h3>6 · Drucken, Sicherung, Sperre</h3>
    <p>„Drucken &amp; Export“: Kursübersicht, Übertragsliste fürs Infoportal, Schülerblätter – als PDF, Word oder Excel. Unter „Sicherung“ wählst du einen Sicherungsordner (z. B. USB-Stick); Libretto sichert dann automatisch und verschlüsselt. Nach einigen Minuten ohne Eingabe sperrt sich Libretto.</p>${fig('sicherung', 'Sicherung')}
    <h3>Noten aus Viva übernehmen</h3>
    <p>Nach einer mündlichen Schulaufgabe in <b>Viva</b>: dort unter „Ergebnisse &amp; Bögen“ die „Notenliste (CSV)“ speichern. In Libretto den Leistungsnachweis anlegen oder öffnen und unter „Noten aus Datei übernehmen“ die Datei wählen – die Noten werden über die Namen zugeordnet.</p>
    <h3>Auslandsaufenthalt, längere Abwesenheit</h3>
    <p>Im Schülerblatt (auf den Namen klicken) unter „Längere Abwesenheit“ Beginn und Ende eintragen, z. B. für ein Halbjahr im Ausland. Leistungsnachweise in diesem Zeitraum sind dann in der Tabelle und auf Ausdrucken mit „abw.“ gekennzeichnet.</p>
    <h3>Reihenfolge der Namen</h3>
    <p>Wie auf den Klassenlisten: Adelsbezeichnungen und Zusätze wie „von“, „Freiherr von“ oder „Gräfin zu“ zählen nicht zum Sortierwort – „Freiherr von Musterberg“ steht bei M.</p>
    <h3>Länger erkrankt, zu wenige Noten?</h3>
    <p>Kein Problem: Fehlende Noten einfach leer lassen oder mit <code>B</code> (befreit) bzw. <code>E</code> (Nachtermin) markieren – Libretto rechnet mit dem, was da ist. Kann am Ende keine Note gebildet werden, setze im Schülerblatt „Ohne Note“: Warnungen verschwinden, und die Übertragsliste weist auf die Bemerkung nach § 39 Abs. 6 GSO hin. Über Nachtermine, Ersatzprüfung oder Vorrücken auf Probe entscheiden Schule und Klassenkonferenz.</p>
    <h3>Regeln, die Libretto anwendet (GSO)</h3><ul>
      <li><b>§ 28</b> Jahresfortgangsnote 5–11: Gesamtnote große LN und Gesamtnote kleine LN – bei zwei Schulaufgaben 1:1, bei mehr als zwei 2:1 (abweichend einstellbar). Fächer ohne Schulaufgaben: nur kleine LN.</li>
      <li><b>Rundung</b>: Vorschlag kaufmännisch; genau x,5 wird als Grenzfall markiert – pädagogische Entscheidung der Lehrkraft.</li>
      <li><b>§ 22</b> Mindestzahl Schulaufgaben (Deutsch 3; Mathematik 4 in 5–7, sonst 3; Fremdsprachen 3, ab 4 Wochenstunden 4) und Termine (höchstens 1 pro Tag, 2 pro Woche).</li>
      <li><b>§ 26 Abs. 4</b> Versäumnis ohne Entschuldigung oder Verweigerung: Note 6. <b>§ 27</b> Nachtermin, Ersatzprüfung.</li>
      <li><b>§ 29</b> Q12/13: Halbjahresleistung = (Schulaufgabe + Ø kleine LN) / 2, gerundet, keine Aufrundung auf 1 Punkt; 13/2 Schulaufgabe nur in Deutsch, Mathematik, Leistungsfach; Seminar nur kleine LN; Seminararbeit (Arbeit × 2 + Prüfungsgespräch) × 2/3.</li>
      <li><b>§ 30, § 40</b> Hinweis bei möglicher Note 5/6 (Gefährdung des Vorrückens – Mitteilung prüfen).</li></ul>
    <p class="hint">Schulinterne Regelungen (Leistungserhebungskonzept, Fachschaftsbeschlüsse) gehen vor – passe Gewichte und Notenschlüssel entsprechend an.</p>
    <h3>Datenschutz & Sicherheit</h3><ul><li>Alle Daten liegen nur auf diesem Computer, verschlüsselt (AES-256-GCM). Kein Server, kein Konto, keine Übertragung von Noten oder Namen. Einzige Verbindung: die (abschaltbare) Abfrage der aktuellen Versionsnummer bei theisapps.de.</li><li><b>Updates:</b> Neue Version einfach über die alte installieren. Die Daten liegen getrennt von der App und bleiben erhalten; Libretto legt beim ersten Start einer neuen Version zusätzlich eine Sicherung an.</li><li>Automatische Sperre nach Inaktivität, verschlüsselte Sicherungen mit Versionen.</li><li>Für Noten auf privaten Geräten ist in Bayern die Genehmigung der Schulleitung nötig (Mindestsicherheitsstandards des Kultusministeriums).</li></ul></div>` });
}

/* Menü */
N.onMenu(cmd => {
  if (!D) return;
  if (cmd === 'newCourse') courseSheet();
  if (cmd === 'newAssessment') assessmentSheet(course());
  if (cmd === 'pdf' && course()) exportModel(modelCourse(course()), 'pdf');
  if (cmd === 'csv' && course()) exportModel(modelCourse(course()), 'csv');
  if (cmd === 'backup') { flush().then(() => N.backupNow()).then(r => toast(r.external ? 'Gesichert – auch im Sicherungsordner' : 'Auf diesem Computer gesichert')); }
  if (cmd === 'lock') lockNow();
  if (cmd === 'settings') settingsSheet();
  if (cmd === 'help') helpSheet();
});

/* Start */
(async () => {
  const pf = await N.platform(); if (pf === 'darwin') document.body.classList.add('mac');
  ST = await N.status();
  if (!ST.exists) setupStep(1); else renderLock();
})();
