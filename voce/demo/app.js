/* Voce – Mündliche Prüfungen · Gymnasium Bayern – App-Logik (Oberfläche) · © 2026 theisapps */
'use strict';
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const uid = () => Math.random().toString(36).slice(2, 10);
const NATIVE = window.native || null;
if (NATIVE && NATIVE.platform === 'darwin') document.body.classList.add('mac');
if (NATIVE && NATIVE.platform === 'win32') document.body.classList.add('win');
const DEVICE = NATIVE && NATIVE.platform !== 'darwin' ? 'PC' : 'Mac';
const FILES = NATIVE && NATIVE.platform === 'win32' ? 'Explorer' : NATIVE && NATIVE.platform !== 'darwin' ? 'Dateimanager' : 'Finder';
/* Dialoge: beim Öffnen den Dialog selbst fokussieren – sonst trägt „Fertig“/„Schließen“ sofort einen blauen Fokusrahmen */
(() => { const sm = HTMLDialogElement.prototype.showModal; HTMLDialogElement.prototype.showModal = function () { sm.call(this); if (!this.querySelector('[autofocus]')) { this.tabIndex = -1; this.focus({ preventScroll: true }); } }; })();

/* ---------------- Speicher ---------------- */
/* GER-Niveaustufen fürs Sprechen nach ISB-Übersicht (Stand 12/2025, mit Stand 07/2026 unverändert); bei Doppelangaben gilt die niedrigere Stufe */
const DEFAULT_MAP = {
  fs1: { 5: 'A1', 6: 'A1+', 7: 'A2', 8: 'A2+', 9: 'A2+', 10: 'B1', 11: 'B1+', 12: 'OS', 13: 'OS' },
  e1:  { 5: 'A1', 6: 'A1+', 7: 'A2', 8: 'A2+', 9: 'B1', 10: 'B1+', 11: 'B1+/B2', 12: 'OS', 13: 'OS' },
  e2:  { 6: 'A1', 7: 'A2', 8: 'A2+', 9: 'B1', 10: 'B1+', 11: 'B1+/B2', 12: 'OS', 13: 'OS' },
  fs2: { 6: 'A1', 7: 'A2', 8: 'A2+', 9: 'A2+', 10: 'B1', 11: 'B1+', 12: 'OS', 13: 'OS' },
  fs3: { 8: 'A2', 9: 'A2+', 10: 'B1', 11: 'B1+', 12: 'OS', 13: 'OS' },
  spb: { 11: 'A2', 12: 'B1spb', 13: 'B1spb' },
};
const SEQ_ROWS = [['fs1', 'Französisch 1. FS', [5, 6, 7, 8, 9, 10, 11, 12, 13]], ['e1', 'Englisch 1. FS', [5, 6, 7, 8, 9, 10, 11, 12, 13]], ['e2', 'Englisch 2. FS', [6, 7, 8, 9, 10, 11, 12, 13]], ['fs2', '2. FS (F/It/Sp)', [6, 7, 8, 9, 10, 11, 12, 13]], ['fs3', '3. FS (F/It/Sp)', [8, 9, 10, 11, 12, 13]], ['spb', 'spät beginnend', [11, 12, 13]]];
const SUBJECT_LANG = { Englisch: 'en', Italienisch: 'it', Französisch: 'fr', Spanisch: 'es' };
const SUBJECT_SEQ = { Englisch: 'e2', Italienisch: 'fs3' };
const AI_DEFAULT_MODEL = { anthropic: 'claude-sonnet-5-5', openai: 'gpt-4.1-mini', gemini: 'gemini-2.5-flash', ollama: '' };
const fresh = () => ({
  v: 1,
  settings: { school: '', examiner: '', year: schoolYear(), logo: null, showDesc: true, hideDesc: false, parentSig: true, ai: false, aiProvider: 'anthropic', aiKeys: {}, aiModels: { ...AI_DEFAULT_MODEL }, aiHost: '', map: JSON.parse(JSON.stringify(DEFAULT_MAP)), mapV: 3 },
  classes: {}, exams: [], current: null, tab: 'plan', seeded: false,
});
function schoolYear() { const d = new Date(); const y = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1; return `${y}/${String(y + 1).slice(2)}`; }

let S = fresh();
async function loadState() {
  let raw = null;
  try { raw = NATIVE ? await NATIVE.load() : localStorage.getItem('mp_state'); } catch (e) { raw = null; }
  if (raw) { try { S = Object.assign(fresh(), JSON.parse(raw)); S.settings = Object.assign(fresh().settings, S.settings); } catch (e) { toast('Gespeicherte Daten konnten nicht gelesen werden.'); } }
  migrate();
  await keysInit();
  if (!S.seeded && !S.exams.length) seedExample();
}
function migrate() {
  const st = S.settings;
  /* v3 (Okt. 2026): Zuordnung nach ISB-Übersicht 12/2025 neu setzen; danach nur ungültige oder fehlende Felder ergänzen, eigene Änderungen bleiben */
  if (st.mapV !== 3) { st.map = JSON.parse(JSON.stringify(DEFAULT_MAP)); st.mapV = 3; }
  else for (const [k, row] of Object.entries(DEFAULT_MAP)) { st.map[k] ||= {}; for (const [j, v] of Object.entries(row)) if (!SCHEMES[st.map[k][j]]) st.map[k][j] = v; }
  for (const ex of S.exams) if (ex.seq === 'fs12') ex.seq = ex.subject === 'Englisch' ? 'e2' : 'fs2';
  for (const ex of S.exams) Tasks.ensure(ex);
  st.aiKeys ||= {}; if (st.aiKey) { st.aiKeys.anthropic ||= st.aiKey; delete st.aiKey; }
  st.aiModels = Object.assign({ ...AI_DEFAULT_MODEL }, st.aiModels || {}); st.aiProvider ||= 'anthropic';
}
/* Der Schlüssel der optionalen KI-Funktion liegt nicht in der Datendatei, nicht in Sicherungen und nicht in Exporten, sondern getrennt (nur Desktop-App) */
let KEYS_OK = false;
const snap = pretty => JSON.stringify(S, (k, v) => (k === 'aiKeys' && NATIVE && KEYS_OK ? undefined : v), pretty);
async function keysInit() {
  if (!NATIVE || !NATIVE.keys) return;
  try {
    const stored = (await NATIVE.keys.get()) || {}; const legacy = (S.settings && S.settings.aiKeys) || {};
    const merged = { ...legacy, ...Object.fromEntries(Object.entries(stored).filter(([, v]) => v)) };
    const ok = await NATIVE.keys.set(merged);
    if (ok) { KEYS_OK = true; S.settings.aiKeys = merged; if (Object.values(legacy).some(Boolean)) await NATIVE.save(snap()); }
  } catch (e) { /* bleibt wie bisher, bis das Speichern des Schlüssels klappt */ }
}
let saveT = null;
function save() {
  clearTimeout(saveT);
  saveT = setTimeout(async () => {
    const txt = snap();
    try { renderSide(); } catch (e) {}
    try { if (NATIVE) await NATIVE.save(txt); else localStorage.setItem('mp_state', txt); }
    catch (e) { toast('Speichern fehlgeschlagen – bitte eine Sicherung anlegen.'); }
  }, 250);
}
window.addEventListener('beforeunload', () => { if (saveT) { clearTimeout(saveT); const txt = snap(); try { if (NATIVE) NATIVE.saveSync(txt); else localStorage.setItem('mp_state', txt); } catch (e) {} } });

/* Beispiel beim ersten Start (erfundene Namen) */
function seedExample() {
  const raw = `1 Beispiel, Anna (w)\n2 Muster, Ben (m)\n3 Probe, Carla (w)\n4 Test, David (m)\n5 Vorlage, Emma (w)\n6 Entwurf, Felix (m)`;
  S.classes['Beispielklasse'] = { raw, students: parseList(raw) };
  const ex = newExam({ title: 'Beispiel: mündliche Schulaufgabe', cls: 'Beispielklasse', subject: 'Italienisch', jgst: '9', seq: 'fs3', scheme: 'A2+', wlang: 'it', date: isoInDays(14) });
  const st = S.classes['Beispielklasse'].students;
  ex.groups = [{ id: uid(), members: [st[0].id, st[1].id] }, { id: uid(), members: [st[2].id, st[3].id], breakAfter: false }, { id: uid(), members: [st[4].id, st[5].id] }];
  ex.results[st[0].id] = { scores: { pron: 5, lang: 4, inter: 5, content: 3 }, notes: { lang: 'Passato prossimo mehrfach falsch (Hilfsverb)' }, verdict: '', verdictAuto: true };
  ex.results[st[1].id] = { scores: { pron: 4, lang: 3.5, inter: 3, content: 3 }, notes: { inter: 'lässt die Partnerin meist führen' }, verdict: '', verdictAuto: true };
  S.exams.push(ex); S.current = ex.id; S.seeded = true; S.welcome = true;
}
function isoInDays(n) { const d = new Date(Date.now() + n * 864e5); return d.toISOString().slice(0, 10); }

/* Klassenliste wie in „Gruppo“ */
function parseList(text) {
  let lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.some(l => /^\d+[.)]?\s+/.test(l))) lines = lines.filter(l => /^\d+[.)]?\s+/.test(l));
  const out = []; const seen = new Set();
  for (let l of lines) {
    l = l.replace(/^\d+[.)]?\s+/, '');
    let g = ''; const gm = l.match(/\((w|m|d)\)\s*$/i);
    if (gm) { g = gm[1].toLowerCase(); l = l.replace(/\((w|m|d)\)\s*$/i, '').trim(); }
    let first, last;
    if (l.includes(',')) { const p = l.split(',').map(s => s.trim()); last = p[0]; first = p[1]; }
    else { const p = l.split(/\s+/); first = p.shift(); last = p.join(' '); }
    if (!first) continue;
    let id = `${last}|${first}`; while (seen.has(id)) id += '*'; seen.add(id);
    out.push({ id, first, last: last || '', g });
  }
  return out;
}
function ensureIds(cls) { for (const s of cls.students) if (!s.id) s.id = `${s.last}|${s.first}`; }

/* ---------------- Prüfung ---------------- */
/* Vorgaben aus Einstellungen → Neue Prüfungen (nur gültige Werte) */
function newExDefaults() {
  const d = (typeof S !== 'undefined' && S && S.settings && S.settings.newEx) || {}; const o = {};
  const num = (v, a, b) => { v = +v; return Number.isFinite(v) && v >= a && v <= b ? Math.round(v) : null; };
  if (['Englisch', 'Italienisch', 'Französisch', 'Spanisch', 'Russisch', 'Chinesisch'].includes(d.subject)) { o.subject = d.subject; o.wlang = SUBJECT_LANG[d.subject] || 'de'; o.seq = SUBJECT_SEQ[d.subject] || 'fs2'; }
  if (/^\d{2}:\d{2}$/.test(d.start || '')) o.start = d.start;
  [['dur', 3, 60], ['gap', 0, 30], ['brk', 0, 60], ['groupSize', 1, 4]].forEach(([k, a, b]) => { const v = num(d[k], a, b); if (v != null) o[k] = v; });
  return o;
}
function newExam(o) {
  const ex = (Object.assign({ id: uid(), title: '', cls: '', subject: 'Englisch', jgst: '9', seq: 'e2', scheme: 'B1', wlang: 'en', pct: 50,
    parts: 'Monologischer und dialogischer Teil', date: '', start: '08:00', dur: 15, gap: 5, brk: 15, room: '', planNote: '',
    groupSize: 2, groups: [], results: {}, cur: 0 }, newExDefaults(), o));
  Tasks.ensure(ex); return ex;
}
const exam = () => S.exams.find(e => e.id === S.current) || null;
const klass = ex => (ex && S.classes[ex.cls]) || { students: [] };
/* ex.only: Nachtermin – nur diese Personen der Klasse gehören zur Prüfung */
const studentsOf = ex => klass(ex).students.filter(s => !s.off && (!ex.only || ex.only.includes(s.id)));
const stById = (ex, id) => klass(ex).students.find(s => s.id === id);
const res = (ex, id) => (ex.results[id] ||= { scores: {}, notes: {}, verdict: '', verdictAuto: true, absent: false, general: '' });
const customKey = ex => (SCHEMES[ex.scheme].type === 'be' && ex.pct && ex.pct !== 50) ? keyFromPercent(ex.scheme, ex.pct) : null;
const evalOf = (ex, id) => evaluate(ex.scheme, res(ex, id).scores, customKey(ex));
const fullName = s => s ? `${s.first} ${s.last}`.trim() : '';
const shortNames = (ex, ids) => ids.map(id => stById(ex, id)).filter(Boolean).map(s => s.first).join(' · ');

/* Pause nach einer Gruppe: eigene Länge (g.brk) oder die Standardlänge der Prüfung (ex.brk); 0 = keine Pause */
const pauseOf = (ex, g) => g.breakAfter ? Math.max(0, g.brk != null ? +g.brk || 0 : +ex.brk || 0) : 0;
/* Zeitplan: [{group, idx, start, end, breakAfter}] */
function schedule(ex) {
  const [h, m] = (ex.start || '08:00').split(':').map(Number); let t = h * 60 + m;
  const out = [];
  ex.groups.forEach((g, i) => {
    const st = t, en = t + (+ex.dur || 0);
    out.push({ g, i, start: st, end: en });
    t = en + (+ex.gap || 0);
    t += pauseOf(ex, g);
  });
  return out;
}
const hm = t => `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
const dateDe = iso => { if (!iso) return ''; const d = new Date(iso + 'T12:00'); return d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); };
const unassigned = ex => { const used = new Set(ex.groups.flatMap(g => g.members)); return studentsOf(ex).filter(s => !used.has(s.id)); };

/* ---------------- Oberfläche ---------------- */
function toast(msg, ms = 2200) { const el = $('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), ms); }
function ask(text, yes = 'Löschen') {
  return new Promise(r => { $('askText').textContent = text; $('askYes').textContent = yes; const d = $('askDlg'); d.returnValue = ''; d.showModal(); d.addEventListener('close', () => r(d.returnValue === 'yes'), { once: true }); });
}
document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => b.closest('dialog').close());
/* Während ein Dialog offen ist, darf die Fensterleiste keine Klicks abfangen (macOS-Ziehbereich) */
const _showModal = HTMLDialogElement.prototype.showModal;
HTMLDialogElement.prototype.showModal = function () {
  document.body.classList.add('modal');
  this.addEventListener('close', () => { if (!document.querySelector('dialog[open]')) document.body.classList.remove('modal'); }, { once: true });
  return _showModal.call(this);
};

/* ---------- Seitenleiste (1.8.0) ---------- */
const SUBJ_HUE = { Englisch: '#2F5BEA', Italienisch: '#1E9E6A', Französisch: '#7A4FD6', Spanisch: '#E07A00', Russisch: '#C2364B', Chinesisch: '#B8860B' };
const todayIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
let homeView = true; /* beim Öffnen erscheint der Startbildschirm */
const daysTo = iso => Math.round((new Date(iso + 'T12:00') - new Date(todayIso() + 'T12:00')) / 864e5);
function sideLayout() { document.body.classList.toggle('sideC', S.tab === 'grade' && exam() && !homeView ? !S.settings.sideGradeOpen : !!S.settings.sideC); }
/* Kurzform langer Prüfungstitel für die Seitenleiste (voller Titel steht im Tooltip) */
const shortTitle = t => String(t || '').replace(/Großer mündlicher Leistungsnachweis/gi, 'Gr. mündl. LN').replace(/Mündliche Schulaufgabe/gi, 'Mündl. SA').replace(/\bSchulaufgabe\b/gi, 'SA').replace(/Leistungsnachweis/gi, 'LN').replace(/\(mündlich\)/gi, '');
function renderSide() {
  const t = todayIso();
  const up = S.exams.filter(e => (e.date || '9999') >= t).sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
  const past = S.exams.filter(e => e.date && e.date < t && daysTo(e.date) >= -14).sort((a, b) => b.date.localeCompare(a.date));
  let list = [...up, ...past].slice(0, 6);
  if (S.current && !list.some(e => e.id === S.current)) { const c = S.exams.find(e => e.id === S.current); if (c) list.push(c); }
  /* Die Schritte der gewählten Prüfung hängen direkt unter ihrem Eintrag (Akkordeon) – vor dem Neuaufbau sicher parken */
  const park = $('stepsPark'); park.append($('tabs'), $('editExamBtn'));
  $('exList').innerHTML = list.map(e => `<button class="exItem ${e.date && e.date < t ? 'past' : ''} ${e.id === S.current ? 'cur' : ''}" data-ex="${esc(e.id)}" aria-current="${e.id === S.current && !homeView}" aria-expanded="${e.id === S.current && !homeView}" title="${esc(e.cls + ' · ' + e.title)}" style="--hue:${SUBJ_HUE[e.subject] || 'var(--blue)'}">
    <span class="cl">${esc((e.cls || '?').slice(0, 4))}</span><div><b>${esc(e.cls)} · ${esc(e.subject)}</b>${e.date === t ? '<span class="today">heute</span>' : ''}</div><div><small>${e.date === t ? 'heute' : e.date ? new Date(e.date + 'T12:00').toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' }) : 'ohne Datum'} · ${esc(shortTitle(e.title))}</small></div></button>`).join('')
    + (S.exams.length ? `<button class="exMore" id="exMore">Archiv &amp; Vorlagen (${S.exams.length})</button>` : '');
  document.querySelectorAll('#exList [data-ex]').forEach(b => b.onclick = () => { S.current = b.dataset.ex; homeView = false; picked = null; save(); renderAll(); });
  if ($('exMore')) $('exMore').onclick = openArchive;
  const ex = exam(); $('tabs').hidden = !ex || homeView; $('editExamBtn').hidden = !ex || homeView; $('homeBtn').setAttribute('aria-current', homeView);
  const curItem = ex && !homeView && document.querySelector(`#exList .exItem.cur`);
  if (curItem) { const box = document.createElement('div'); box.className = 'exSteps'; box.style.setProperty('--hue', curItem.style.getPropertyValue('--hue')); box.append($('tabs'), $('editExamBtn')); curItem.after(box); }
  const st = { plan: '', tasks: '', grade: '', results: '' }; const ok = {};
  if (ex) {
    const pool = unassigned(ex).length; st.plan = ex.groups.length ? (pool ? String(pool) : '✓') : ''; ok.plan = ex.groups.length && !pool;
    const miss = ex.groups.length ? Tasks.missing(ex) : 'x'; st.tasks = miss ? '' : '✓'; ok.tasks = !miss;
    const n = studentsOf(ex).length, d = countDone(ex); st.grade = n ? `${d}/${n}` : ''; ok.grade = n && d === n;
  }
  document.querySelectorAll('#tabs [data-st]').forEach(e => { const k = e.dataset.st; e.textContent = st[k]; e.classList.toggle('ok', !!ok[k]); e.title = k === 'plan' && st.plan && !ok.plan ? 'noch ohne Gruppe' : ''; });
  sideLayout();
}
$('sideTog').onclick = () => {
  if (window.innerWidth < 1080) { document.body.classList.toggle('sideOpen'); return; }
  if (S.tab === 'grade' && exam() && !homeView) S.settings.sideGradeOpen = !S.settings.sideGradeOpen; else S.settings.sideC = !S.settings.sideC;
  save(); sideLayout();
};
document.addEventListener('click', e => { if (document.body.classList.contains('sideOpen') && !e.target.closest('#side')) document.body.classList.remove('sideOpen'); });
function nowBarHtml(ex) { const ns = nowSlot(ex); if (!ns) return ''; const g2 = ns.next && ns.next.g; return `<div class="nowBar">${ns.live ? '<i class="dot"></i>' : ''}<b>${ns.live ? `Jetzt: Gruppe ${ns.i + 1}` : `Gleich: Gruppe ${ns.i + 1}`}</b>
  <span>${ns.live ? `noch <span class="left">${ns.left} Min.</span>` : `beginnt in <span class="left">${ns.left} Min.</span>`}${ns.live && g2 ? ` · danach Gruppe ${ns.i + 2}: ${esc(shortNames(ex, g2.members))}` : ''}</span>
  ${ns.i !== ex.cur ? `<button class="mini accent" data-tonow="${ns.i}">Zu Gruppe ${ns.i + 1}</button>` : ''}</div>`; }
document.addEventListener('click', e => { const b = e.target.closest('[data-tonow]'); if (!b) return; const ex = exam(); ex.cur = +b.dataset.tonow; save(); renderGrade(); window.scrollTo(0, 0); });
setInterval(() => { if (S.tab === 'grade' && $('nowWrap')) $('nowWrap').innerHTML = nowBarHtml(exam()); }, 20000);
async function paintSideBk() {
  const el = $('sideBk'); if (!BK_SIDE) { el.hidden = true; return; }
  try { const st = await BK_SIDE.status(); const ago = bkAgoSide(st.lastLocal);
    el.classList.toggle('warn', !!st.lastLocalError);
    el.textContent = st.lastLocalError ? '⚠ Letzte Sicherung fehlgeschlagen' : st.lastLocal ? `Gesichert ${ago}` : 'Noch keine Sicherung';
    el.title = st.lastLocalError ? 'Details unter Einstellungen → Sicherung' : 'Voce sichert automatisch bei Änderungen und beim Beenden';
  } catch (e) { el.hidden = true; }
}
const BK_SIDE = NATIVE && NATIVE.backup;
const bkAgoSide = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'gerade eben' : m < 60 ? `vor ${m} Min.` : m < 1440 ? `vor ${Math.round(m / 60)} Std.` : `am ${new Date(t).toLocaleDateString('de-DE')}`; };
setInterval(paintSideBk, 60000); setTimeout(paintSideBk, 1500);
$('sideBk').onclick = () => openSettings('backup');
/* Prüfungstag: welche Gruppe ist laut Plan jetzt dran? → { i, left, next } oder null */
function nowSlot(ex) {
  if (!ex || ex.date !== todayIso() || !ex.groups.length) return null;
  const d = new Date(); const m = d.getHours() * 60 + d.getMinutes(); const sch = schedule(ex);
  const i = sch.findIndex(x => m >= x.start && m < x.end);
  if (i >= 0) return { i, left: sch[i].end - m, next: sch[i + 1] || null, live: true };
  const n = sch.findIndex(x => x.start > m); if (n >= 0) return { i: n, left: sch[n].start - m, next: sch[n], live: false };
  return null;
}

function renderAll() {
  renderExamSel(); renderSide();
  const ex = exam();
  document.querySelectorAll('#tabs button').forEach(b => { b.setAttribute('aria-selected', !homeView && b.dataset.tab === S.tab); b.disabled = !ex; });
  $('editExamBtn').hidden = !ex || homeView;
  if (!ex || !S.exams.length) return renderEmpty();
  if (homeView) return renderHome();
  if (S.tab === 'plan') renderPlan(); else if (S.tab === 'tasks') renderTasks(); else if (S.tab === 'grade') renderGrade(); else renderResults();
}
function renderExamSel() {
  const sel = $('examSel'); sel.innerHTML = '';
  const list = [...S.exams].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  for (const e of list) { const o = document.createElement('option'); o.value = e.id; o.textContent = `${e.cls} · ${e.title}${e.date ? ' · ' + new Date(e.date + 'T12:00').toLocaleDateString('de-DE') : ''}`; sel.appendChild(o); }
  sel.value = S.current || ''; sel.parentElement.hidden = !list.length;
}
/* ---------- Startbildschirm ---------- */
function examState(ex) {
  const n = studentsOf(ex).length, pool = unassigned(ex).length, groups = ex.groups.length, miss = groups ? Tasks.missing(ex) : 'x', done = countDone(ex);
  const next = (!groups || pool) ? 'plan' : miss ? 'tasks' : done < n ? 'grade' : 'results';
  return { n, pool, groups, tasksOk: !miss, done, next, finished: n > 0 && done === n };
}
const NEXT_LABEL = { plan: 'Weiter: Gruppen bilden', tasks: 'Weiter: Aufgaben', grade: 'Weiter: Bewerten', results: 'Weiter: Ergebnisse & Bögen' };
function stateChips(ex, st) {
  const c = (ok, txt) => `<span class="schip ${ok ? 'ok' : 'todo'}">${ok ? '✓ ' : ''}${txt}</span>`;
  return c(st.groups && !st.pool, !st.groups ? 'Noch keine Gruppen' : st.pool ? `${st.pool} ohne Gruppe` : `${st.groups} Gruppen`) + c(st.tasksOk, st.tasksOk ? 'Aufgaben' : 'Aufgaben fehlen') + c(st.finished, st.n ? `Bewertet ${st.done}/${st.n}` : 'Keine Prüflinge');
}
function when(ex) {
  if (!ex.date) return 'ohne Datum';
  const d = daysTo(ex.date); const dt = new Date(ex.date + 'T12:00').toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
  return d === 0 ? `Heute · ${dt}` : d === 1 ? `Morgen · ${dt}` : d > 1 ? `In ${d} Tagen · ${dt}` : dt;
}
function renderHome() {
  const t = todayIso();
  const up = S.exams.filter(e => !e.date || e.date >= t).sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
  const old = S.exams.filter(e => e.date && e.date < t).sort((a, b) => b.date.localeCompare(a.date));
  const next = up[0] || old[0]; const others = [...up.slice(1), ...old.filter(e => e !== next)].filter(e => !(e.date && e.date < t && (() => { const s = examState(e); return s.n && !s.finished; })()));
  const open = old.filter(e => e !== next).filter(e => { const s = examState(e); return s.n && !s.finished; });
  const row = e => { const st = examState(e); return `<button class="homeRow" data-open="${esc(e.id)}"><span class="cl" style="--hue:${SUBJ_HUE[e.subject] || 'var(--blue)'}">${esc((e.cls || '?').slice(0, 4))}</span><span class="hrT"><b>${esc(e.cls)} · ${esc(e.subject)}</b><small>${esc(when(e))} · ${esc(e.title)}</small></span><span class="hrC">${stateChips(e, st)}</span></button>`; };
  const st = examState(next); const live = next.date === t ? nowBarHtml(next) : '';
  const showWelcome = !!S.welcome && S.exams.length <= 1 && Object.keys(S.classes).length <= 1;
  $('main').innerHTML = `<div class="home">
    <div class="homeHead"><h2>Start</h2><small>${new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</small></div>
    ${showWelcome ? `<section class="welcome glass">
      <div class="wTxt"><b>Willkommen bei Voce!</b><p>Die Beispielprüfung unten zeigt alles mit erfundenen Namen – zum Ausprobieren und Löschen.</p></div>
      <ol class="wSteps"><li><b>Klasse</b>Liste einlesen</li><li><b>Prüfung</b>Raster wählt Voce</li><li><b>Gruppen &amp; Aufgaben</b>Plan und Karten drucken</li><li><b>Bewerten</b>Note, Worturteil, Bögen</li></ol>
      <div class="hnBtns"><button class="mini accent" id="wClass">Erste Klasse anlegen</button><button class="mini" id="wHelp">Anleitung</button><button class="mini" id="wHide">Ausblenden</button></div>
    </section>` : ''}
    <div class="homeGrid">
      <section class="homeNext glass">
        <div class="hnKick">${up.includes(next) ? 'Als Nächstes' : 'Zuletzt'} · ${esc(when(next))}</div>
        <h3>${esc(next.cls)} · ${esc(next.subject)}</h3>
        <p class="hnSub">${esc(next.title)}${next.start && next.date ? ` · ${esc(next.start)} Uhr` : ''}${next.room ? ` · Raum ${esc(next.room)}` : ''} · ${st.groups} ${st.groups === 1 ? 'Gruppe' : 'Gruppen'} · ${st.n} Prüflinge</p>
        <div class="hnChips">${stateChips(next, st)}</div>
        ${live}
        <div class="hnBtns"><button class="go" data-openstep="${esc(next.id)}|${st.next}">${NEXT_LABEL[st.next]}</button><button class="go secondary" data-open="${esc(next.id)}">Öffnen</button></div>
      </section>
      <aside class="homeSide">
        <section class="glass homeCard"><b>Frühere Prüfung wiederverwenden</b><p>Aufgaben und Ablauf einer alten Prüfung übernehmen – Gruppen und Noten bleiben aus.</p><button class="mini accent" id="homeArch">Archiv &amp; Vorlagen …</button></section>
        <section class="glass homeCard"><b>Neu anlegen</b><div class="hnBtns"><button class="mini accent" id="homeNew">Neue Prüfung</button><button class="mini" id="homeClasses">Klassen &amp; Kurse</button></div></section>
      </aside>
    </div>
    ${open.length ? `<h3 class="homeH">Noch offen</h3><div class="homeList glass">${open.slice(0, 4).map(row).join('')}</div>` : ''}
    ${others.length ? `<h3 class="homeH">Weitere Prüfungen</h3><div class="homeList glass">${others.slice(0, 6).map(row).join('')}${others.length > 6 ? '<button class="homeMore" id="homeMore">Alle im Archiv anzeigen …</button>' : ''}</div>` : ''}
  </div>`;
  document.querySelectorAll('#main [data-open]').forEach(b => b.onclick = () => { S.current = b.dataset.open; homeView = false; S.tab = examState(exam()).next; save(); renderAll(); });
  document.querySelectorAll('#main [data-openstep]').forEach(b => b.onclick = () => { const [id, tab] = b.dataset.openstep.split('|'); S.current = id; homeView = false; S.tab = tab; if (tab === 'grade') { const ns = nowSlot(exam()); if (ns) exam().cur = ns.i; } save(); renderAll(); window.scrollTo(0, 0); });
  document.querySelectorAll('#main [data-tonow]').forEach(b => b.onclick = e => { e.stopPropagation(); const ex = next; S.current = ex.id; S.tab = 'grade'; homeView = false; ex.cur = +b.dataset.tonow; save(); renderAll(); });
  if (showWelcome) { $('wClass').onclick = openClassesDlg; $('wHelp').onclick = openHelp; $('wHide').onclick = () => { S.welcome = false; save(); renderHome(); }; }
  $('homeArch').onclick = openArchive; $('homeNew').onclick = () => openExamDlg(null); $('homeClasses').onclick = openClassesDlg;
  if ($('homeMore')) $('homeMore').onclick = openArchive;
}
$('homeBtn').onclick = () => { homeView = true; document.body.classList.remove('sideOpen'); renderAll(); window.scrollTo(0, 0); };
/* ---------- Archiv & Vorlagen ---------- */
const yearOf = e => { if (!e.date) return 'ohne Datum'; const d = new Date(e.date + 'T12:00'); const y = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1; return `${y}/${String(y + 1).slice(2)}`; };
function openArchive() {
  const fill = (id, label, vals) => { const sel = $(id); const cur = sel.value; sel.innerHTML = `<option value="">${label}</option>` + vals.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join(''); sel.value = vals.includes(cur) ? cur : ''; };
  const uniq = f => [...new Set(S.exams.map(f))].filter(Boolean).sort();
  fill('archJ', 'Alle Jahrgangsstufen', uniq(e => e.jgst).sort((a, b) => a - b)); fill('archS', 'Alle Fächer', uniq(e => e.subject)); fill('archY', 'Alle Schuljahre', uniq(yearOf).reverse());
  $('archQ').value = ''; renderArchive(); $('archDlg').showModal();
}
function renderArchive() {
  const q = $('archQ').value.trim().toLowerCase(), J = $('archJ').value, SU = $('archS').value, Y = $('archY').value;
  const list = S.exams.filter(e => (!J || e.jgst === J) && (!SU || e.subject === SU) && (!Y || yearOf(e) === Y) && (!q || `${e.cls} ${e.title} ${e.subject}`.toLowerCase().includes(q)))
    .sort((a, b) => (b.date || '9999').localeCompare(a.date || '9999'));
  $('archList').innerHTML = list.map(e => { const k = Tasks.ensure(e); const sc = SCHEMES[e.scheme];
    return `<div class="archRow"><span class="cl" style="--hue:${SUBJ_HUE[e.subject] || 'var(--blue)'}">${esc((e.cls || '?').slice(0, 4))}</span>
      <div class="arT"><b>${esc(e.cls)} · ${esc(e.subject)} – ${esc(e.title)}</b><small>Jgst. ${esc(e.jgst)} · ${e.date ? esc(new Date(e.date + 'T12:00').toLocaleDateString('de-DE')) : 'ohne Datum'} · Raster ${esc(sc ? sc.label : e.scheme)} · ${k.mono.on ? k.mono.items.length + ' Monolog' : ''}${k.mono.on && k.dia.on ? ' / ' : ''}${k.dia.on ? k.dia.items.length + ' Dialog' : ''}-Aufgaben</small></div>
      <div class="arB"><button class="mini" data-aopen="${esc(e.id)}">Öffnen</button><button class="mini accent" data-atpl="${esc(e.id)}" title="Neue Prüfung mit diesen Aufgaben und diesem Ablauf anlegen">Als Vorlage</button></div></div>`; }).join('') || '<p class="hint">Keine Prüfung passt zu dieser Auswahl.</p>';
  document.querySelectorAll('#archList [data-aopen]').forEach(b => b.onclick = () => { S.current = b.dataset.aopen; homeView = false; S.tab = examState(exam()).next; $('archDlg').close(); save(); renderAll(); });
  document.querySelectorAll('#archList [data-atpl]').forEach(b => b.onclick = () => { const src = S.exams.find(x => x.id === b.dataset.atpl); $('archDlg').close(); const tpl = JSON.parse(JSON.stringify(src)); delete tpl.only; tpl.groups = []; delete tpl.bogLang; homeView = false; openExamDlg(null, tpl); toast('Klasse und Termin wählen, dann „Sichern“ – Aufgaben und Ablauf werden übernommen', 4500); });
}
['archQ', 'archJ', 'archS', 'archY'].forEach(id => $(id).addEventListener(id === 'archQ' ? 'input' : 'change', renderArchive));
function renderEmpty() {
  const hasClass = Object.keys(S.classes).length > 0;
  $('main').innerHTML = `<div class="empty glass"><div><strong>Mündliche Prüfung vorbereiten</strong>
    <p>In zwei Schritten startklar: Klassenliste importieren, dann die Prüfung anlegen. Am Ende gibt es für jede Schülerin und jeden Schüler einen fertigen Bewertungsbogen als Word-Datei.</p>
    <div class="steps">
      <div class="step ${hasClass ? 'done' : ''}"><b>1 · Klasse anlegen</b>Liste als PDF oder Excel importieren oder Namen einfügen.<button class="go ${hasClass ? 'secondary' : ''}" id="emptyClass">${hasClass ? 'Weitere Klasse' : 'Klasse anlegen'}</button></div>
      <div class="step"><b>2 · Prüfung anlegen</b>Fach, Jahrgangsstufe, Raster und Termin festlegen.<button class="go ${hasClass ? '' : 'secondary'}" id="emptyNew">Prüfung anlegen</button></div>
    </div></div></div>`;
  $('emptyNew').onclick = () => openExamDlg(null);
  $('emptyClass').onclick = () => openClassDlg(null);
}

/* ---------- Reiter 1: Gruppen & Plan ---------- */
let picked = null; // ausgewählte Schüler-ID zum Verschieben
function renderPlan() {
  const ex = exam(); const cls = klass(ex); const sch = schedule(ex); const pool = unassigned(ex);
  const sc = SCHEMES[ex.scheme];
  $('main').innerHTML = `
  <div class="layout">
    <aside class="rail">
      <section class="panel glass">
        <h2 class="ptitle">Prüfung</h2>
        <div class="meta" style="flex-direction:column;gap:4px">
          <span><b>${esc(ex.cls)}</b> · ${esc(ex.subject)} · Jgst. ${esc(ex.jgst)}</span>
          <span>Raster <b>${esc(sc.label)}</b>${sc.type === 'be' ? ` · ${totalMax(ex.scheme)} BE` : ''}${customKey(ex) ? ` · Grenze ${ex.pct} %` : ''}</span>
          <span>${ex.date ? esc(dateDe(ex.date)) : 'Kein Datum'}${ex.room ? ' · Raum ' + esc(ex.room) : ''}</span>
          <span>${ex.dur} Min. je Gruppe · ${ex.gap} Min. Wechsel</span>
        </div>
        <div class="panelBtns"><button class="mini" id="pEdit">Prüfung ändern</button><button class="mini" id="pClass">Klassenliste bearbeiten</button></div>
      </section>
      <section class="panel glass">
        <h2 class="ptitle">Gruppen bilden</h2>
        <div class="seg" role="group" id="gsize">${[1, 2, 3, 4].map(n => `<button data-n="${n}" aria-pressed="${ex.groupSize === n}">${n === 1 ? 'Einzeln' : n + 'er'}</button>`).join('')}</div>
        <button class="go" id="shuffle">Zufällig einteilen</button>
        <button class="go secondary" id="emptyGroup">Leere Gruppe hinzufügen</button>
        <p class="note">Wunschgruppen: Namen auf eine Gruppe ziehen – auf einen anderen Namen gezogen, tauschen beide die Plätze. Alternativ Namen antippen und dann die Zielgruppe antippen.</p>
      </section>
      <section class="panel glass">
        <div class="phead"><h2 class="ptitle">Noch ohne Gruppe</h2><span class="count">${pool.length} / ${cls.students.length}</span></div>
        <div class="chips dropzone" id="pool" data-drop="pool">${pool.map(chipHtml).join('') || '<span class="hint" style="margin:0">Alle sind eingeteilt.</span>'}</div>
      </section>
    </aside>
    <section>
      <div class="planHead">
        <h2>Prüfungsplan<small>${ex.groups.length} Gruppen${sch.length ? ` · ${hm(sch[0].start)}–${hm(sch[sch.length - 1].end)} Uhr` : ''}</small></h2>
        <div class="exportBar" style="margin:0"><button class="mini accent" id="planPrint">Plan drucken …</button><button class="mini" id="planDocx">Als Word</button></div>
      </div>
      <div class="slots" id="slots">${sch.map(({ g, i, start, end }) => `
        <div class="slot" data-slot="${i}" style="--hue:var(--g${(i % 8) + 1})">
          <div class="grip" data-grip="${i}" draggable="true" title="Ziehen, um die Gruppe zu verschieben" aria-label="Gruppe ${i + 1} verschieben">⠿</div>
          <div class="num">${i + 1}</div>
          <div class="time">${hm(start)}–${hm(end)}<small>${g.members.length} ${g.members.length === 1 ? 'Person' : 'Personen'}</small></div>
          <div class="chips dropzone" data-drop="${g.id}">${g.members.map(id => stById(ex, id)).filter(Boolean).map(chipHtml).join('') || '<span class="hint" style="margin:0">Leer – Namen hierher verschieben</span>'}</div>
          <div class="ctl">
            <button class="iconbtn" title="Nach oben" data-up="${i}" ${i === 0 ? 'disabled' : ''}>↑</button>
            <button class="iconbtn" title="Nach unten" data-down="${i}" ${i === ex.groups.length - 1 ? 'disabled' : ''}>↓</button>
            <button class="iconbtn" title="Gruppe auflösen" data-del="${i}">✕</button>
          </div>
        </div>${i < ex.groups.length - 1 ? pauseRow(ex, g, i, end, sch[i + 1].start) : ''}`).join('') || '<div class="empty glass" style="min-height:260px"><div><strong>Noch keine Gruppen</strong>Gruppengröße wählen und „Zufällig einteilen“ drücken – oder leere Gruppen anlegen und Wunschpaare hineinsetzen.</div></div>'}
      </div>
    </section>
  </div>`;
  $('pEdit').onclick = () => openExamDlg(ex);
  $('pClass').onclick = () => openClassDlg(ex.cls);
  document.querySelectorAll('#gsize button').forEach(b => b.onclick = () => { ex.groupSize = +b.dataset.n; save(); renderPlan(); });
  $('shuffle').onclick = async () => {
    if (ex.groups.some(g => g.members.length) && Object.keys(ex.results).length && !(await ask('Gruppen neu einteilen? Bereits vergebene Punkte bleiben erhalten.', 'Neu einteilen'))) return;
    shuffleGroups(ex); save(); renderPlan();
  };
  $('emptyGroup').onclick = () => { ex.groups.push({ id: uid(), members: [] }); save(); renderPlan(); };
  $('planDocx').onclick = () => Export.plan(ex, S.settings, studentsOf(ex)).catch(err => toast(err.message || 'Export fehlgeschlagen'));
  $('planPrint').onclick = () => printPlan(ex);
  document.querySelectorAll('[data-up]').forEach(b => b.onclick = () => { moveGroup(ex, +b.dataset.up, +b.dataset.up - 1); save(); renderPlan(); });
  document.querySelectorAll('[data-down]').forEach(b => b.onclick = () => { moveGroup(ex, +b.dataset.down, +b.dataset.down + 1); save(); renderPlan(); });
  document.querySelectorAll('[data-addpause]').forEach(b => b.onclick = () => { const g = ex.groups[+b.dataset.addpause]; g.breakAfter = true; g.brk = +ex.brk || 15; save(); renderPlan(); });
  document.querySelectorAll('[data-pmin]').forEach(b => b.onclick = () => { const g = ex.groups[+b.dataset.pause]; const cur = pauseOf(ex, g) || (+ex.brk || 15); g.brk = Math.max(5, Math.min(180, +b.dataset.pmin > 0 ? Math.floor(cur / 5) * 5 + 5 : Math.ceil(cur / 5) * 5 - 5)); g.breakAfter = true; save(); renderPlan(); });
  document.querySelectorAll('[data-pnum]').forEach(b => b.onclick = () => {
    const g = ex.groups[+b.dataset.pnum]; const inp = document.createElement('input'); inp.type = 'number'; inp.min = 1; inp.max = 180; inp.value = pauseOf(ex, g); inp.className = 'pinp'; inp.setAttribute('aria-label', 'Minuten der Pause');
    b.replaceWith(inp); inp.focus(); inp.select(); let done = false;
    const fin = ok => { if (done) return; done = true; const v = Math.round(+inp.value); if (ok && v >= 1) { g.brk = Math.min(180, v); g.breakAfter = true; save(); } renderPlan(); };
    inp.onkeydown = e => { if (e.key === 'Enter') fin(true); else if (e.key === 'Escape') fin(false); };
    inp.onblur = () => fin(true);
  });
  document.querySelectorAll('[data-pdel]').forEach(b => b.onclick = () => { const g = ex.groups[+b.dataset.pdel]; g.breakAfter = false; delete g.brk; save(); renderPlan(); });
  document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { ex.groups.splice(+b.dataset.del, 1); save(); renderPlan(); });
  // Antippen: auswählen / tauschen / verschieben
  document.querySelectorAll('.chip[data-sid]').forEach(c => c.onclick = e => {
    e.stopPropagation(); const id = c.dataset.sid;
    if (!picked) { picked = id; return markPicked(); }
    if (picked === id) { picked = null; return markPicked(); }
    swapStudents(ex, picked, id); picked = null; save(); renderPlan();
  });
  document.querySelectorAll('[data-drop]').forEach(z => z.onclick = () => {
    if (!picked) return;
    moveStudent(ex, picked, z.dataset.drop); picked = null; save(); renderPlan();
  });
  markPicked();
  bindDnD(ex);
}
/* Pause zwischen zwei Gruppen: beschriftete Leiste mit − / + (5 Min.) und „Entfernen“, sonst „+ Pause einfügen“ */
function pauseRow(ex, g, i, end, nextStart) {
  const p = pauseOf(ex, g);
  if (!p) return `<div class="gapRow" data-gap="${i}"><button class="addPause" data-addpause="${i}" title="Zwischen Gruppe ${i + 1} und ${i + 2} eine Pause einplanen">+ Pause einfügen</button></div>`;
  return `<div class="gapRow" data-gap="${i}"><div class="pauseBar"><span class="pgrip" data-pgrip="${i}" draggable="true" title="Ziehen, um die Pause zu verschieben" aria-label="Pause verschieben">⠿</span><span class="pl">Pause</span><span class="pt">${hm(nextStart - p)}–${hm(nextStart)} Uhr</span>
    <span class="pstep"><button class="iconbtn" data-pause="${i}" data-pmin="-5" title="5 Minuten kürzer" ${p <= 5 ? 'disabled' : ''}>−</button><button class="pnum" data-pnum="${i}" title="Anklicken und die Minuten eintippen">${p} Min.</button><button class="iconbtn" data-pause="${i}" data-pmin="5" title="5 Minuten länger">+</button></span>
    <button class="pdel" data-pdel="${i}" title="Diese Pause entfernen">Entfernen</button></div></div>`;
}
/* Pause von einer Lücke in eine andere verschieben (liegt dort schon eine, tauschen beide) */
function movePause(ex, from, to) {
  const A = ex.groups[from], B = ex.groups[to]; if (!A || !B) return;
  const pa = pauseOf(ex, A), pb = pauseOf(ex, B);
  B.breakAfter = true; B.brk = pa;
  if (pb > 0) { A.breakAfter = true; A.brk = pb; } else { A.breakAfter = false; delete A.brk; }
}
/* Gruppe verschieben; Pausen bleiben an ihrer Stelle im Plan (z. B. die Mittagspause nach der 4. Gruppe) */
function moveGroup(ex, from, to) {
  if (from === to || from < 0 || to < 0 || from >= ex.groups.length || to >= ex.groups.length) return;
  const pa = ex.groups.map(g => ({ b: g.breakAfter, m: g.brk }));
  const [g] = ex.groups.splice(from, 1); ex.groups.splice(to, 0, g);
  ex.groups.forEach((x, i) => { if (pa[i].b === undefined) delete x.breakAfter; else x.breakAfter = pa[i].b; if (pa[i].m == null) delete x.brk; else x.brk = pa[i].m; });
  if (ex.cur === from) ex.cur = to;
}
/* Ziehen & Ablegen (Maus/Trackpad) */
function bindDnD(ex) {
  let dragId = null, dragGrp = null;
  /* Gruppen und Pausen ziehen: ein blauer Einfügestrich zeigt, wo losgelassen wird */
  const box = document.getElementById('slots'); let dragPause = null;
  const line = box ? Object.assign(document.createElement('div'), { className: 'dropLine', hidden: true }) : null; if (box) box.appendChild(line);
  const rel = r => { const b = box.getBoundingClientRect(); return { top: r.top - b.top, bottom: r.bottom - b.top }; };
  const slotsEls = () => [...box.querySelectorAll('.slot[data-slot]')];
  const boundary = y => { const els = slotsEls(); let b = 0; els.forEach(sl => { const r = sl.getBoundingClientRect(); if (y > r.top + r.height / 2) b++; }); return b; };
  const lineAt = b => { const els = slotsEls(); if (!els.length) return; const top = b === 0 ? rel(els[0].getBoundingClientRect()).top - 5 : b >= els.length ? rel(els[els.length - 1].getBoundingClientRect()).bottom + 1 : (rel(els[b - 1].getBoundingClientRect()).bottom + rel(els[b].getBoundingClientRect()).top) / 2 - 2; line.style.top = top + 'px'; line.hidden = false; };
  const gapNear = y => { let best = -1, bd = 1e9; box.querySelectorAll('.gapRow[data-gap]').forEach(g => { const r = g.getBoundingClientRect(); const d = Math.abs(y - (r.top + r.height / 2)); if (d < bd) { bd = d; best = +g.dataset.gap; } }); return best; };
  const clearDrag = () => { dragGrp = null; dragPause = null; if (line) line.hidden = true; document.querySelectorAll('.slot.dragging,.pauseBar.dragging').forEach(x => x.classList.remove('dragging')); box && box.querySelectorAll('.pTarget').forEach(x => x.classList.remove('pTarget')); };
  document.querySelectorAll('.grip[data-grip]').forEach(gr => {
    gr.addEventListener('dragstart', e => { dragGrp = +gr.dataset.grip; picked = null; markPicked(); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', 'gruppe'); const sl = gr.closest('.slot'); try { e.dataTransfer.setDragImage(sl, 24, 20); } catch (x) {} requestAnimationFrame(() => sl.classList.add('dragging')); });
    gr.addEventListener('dragend', clearDrag);
  });
  document.querySelectorAll('.pgrip[data-pgrip]').forEach(gr => {
    gr.addEventListener('dragstart', e => { dragPause = +gr.dataset.pgrip; picked = null; markPicked(); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', 'pause'); const pb = gr.closest('.pauseBar'); try { e.dataTransfer.setDragImage(pb, 24, 14); } catch (x) {} requestAnimationFrame(() => pb.classList.add('dragging')); });
    gr.addEventListener('dragend', clearDrag);
  });
  if (box) {
    box.addEventListener('dragover', e => {
      if (dragGrp != null) { e.preventDefault(); const b = boundary(e.clientY); if (b === dragGrp || b === dragGrp + 1) line.hidden = true; else lineAt(b); }
      else if (dragPause != null) { e.preventDefault(); const g = gapNear(e.clientY); box.querySelectorAll('.pTarget').forEach(x => x.classList.remove('pTarget')); const el = box.querySelector(`.gapRow[data-gap="${g}"]`); if (el && g !== dragPause) { el.classList.add('pTarget'); const r = rel(el.getBoundingClientRect()); line.style.top = ((r.top + r.bottom) / 2 - 2) + 'px'; line.hidden = false; } else line.hidden = true; }
    });
    box.addEventListener('dragleave', e => { const r = box.getBoundingClientRect(); if (line && (e.clientX <= r.left || e.clientX >= r.right || e.clientY <= r.top || e.clientY >= r.bottom)) line.hidden = true; });
    box.addEventListener('drop', e => {
      if (dragGrp != null) { e.preventDefault(); const b = boundary(e.clientY); const from = dragGrp; clearDrag(); const to = b > from ? b - 1 : b; if (to !== from) { moveGroup(ex, from, to); save(); renderPlan(); } }
      else if (dragPause != null) { e.preventDefault(); const g = gapNear(e.clientY); const from = dragPause; clearDrag(); if (g >= 0 && g !== from) { movePause(ex, from, g); save(); renderPlan(); } }
    });
  }
  document.querySelectorAll('.chip[data-sid]').forEach(c => {
    c.draggable = true;
    c.addEventListener('dragstart', e => { dragId = c.dataset.sid; picked = null; markPicked(); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragId); requestAnimationFrame(() => c.classList.add('dragging')); });
    c.addEventListener('dragend', () => { dragId = null; c.classList.remove('dragging'); document.querySelectorAll('.over,.swapTarget').forEach(x => x.classList.remove('over', 'swapTarget')); });
    c.addEventListener('dragover', e => { if (!dragId || dragId === c.dataset.sid) return; e.preventDefault(); e.stopPropagation(); c.classList.add('swapTarget'); });
    c.addEventListener('dragleave', () => c.classList.remove('swapTarget'));
    c.addEventListener('drop', e => { e.preventDefault(); e.stopPropagation(); const id = dragId || e.dataTransfer.getData('text/plain'); if (id && id !== c.dataset.sid) { swapStudents(ex, id, c.dataset.sid); save(); renderPlan(); } });
  });
  document.querySelectorAll('[data-drop]').forEach(z => {
    z.addEventListener('dragover', e => { if (!dragId) return; e.preventDefault(); z.classList.add('over'); });
    z.addEventListener('dragleave', e => { if (!z.contains(e.relatedTarget)) z.classList.remove('over'); });
    z.addEventListener('drop', e => { e.preventDefault(); const id = dragId || e.dataTransfer.getData('text/plain'); z.classList.remove('over'); if (id) { moveStudent(ex, id, z.dataset.drop); save(); renderPlan(); } });
  });
}
function chipHtml(s) { return `<button class="chip" data-sid="${esc(s.id)}"><span class="dot ${s.g}"></span>${esc(fullName(s))}</button>`; }
function markPicked() {
  document.querySelectorAll('.chip[data-sid]').forEach(c => c.classList.toggle('sel', c.dataset.sid === picked));
  document.querySelectorAll('[data-drop]').forEach(z => z.classList.toggle('target', !!picked));
}
function locate(ex, id) { for (const g of ex.groups) { const i = g.members.indexOf(id); if (i >= 0) return { g, i }; } return null; }
function swapStudents(ex, a, b) {
  const la = locate(ex, a), lb = locate(ex, b);
  if (la && lb) { la.g.members[la.i] = b; lb.g.members[lb.i] = a; }
  else if (la && !lb) la.g.members[la.i] = b;
  else if (!la && lb) lb.g.members[lb.i] = a;
}
function moveStudent(ex, id, target) {
  const l = locate(ex, id); if (l) l.g.members.splice(l.i, 1);
  if (target !== 'pool') { const g = ex.groups.find(x => x.id === target); if (g && !g.members.includes(id)) g.members.push(id); }
}
function shuffleGroups(ex) {
  const list = studentsOf(ex).map(s => s.id);
  for (let i = list.length - 1; i > 0; i--) { const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1); [list[i], list[j]] = [list[j], list[i]]; }
  const k = ex.groupSize, n = list.length; if (!n) { ex.groups = []; return; }
  const count = Math.max(1, Math.floor(n / k)); const groups = Array.from({ length: count }, () => []);
  // übrige Personen auf Gruppen verteilen (bei Paaren entsteht so höchstens eine Dreiergruppe je Rest)
  list.forEach((id, i) => groups[i < count * k ? Math.floor(i / k) : (i - count * k) % count].push(id));
  ex.groups = groups.map(m => ({ id: uid(), members: m })); ex.cur = 0;
}

/* ---------- Reiter: Aufgaben (Karten und Prüferblätter) ---------- */
const tkClosed = new Set();
function readImage(file) {
  return new Promise((ok, fail) => {
    const fr = new FileReader();
    fr.onerror = () => fail(new Error('Die Datei konnte nicht gelesen werden.'));
    fr.onload = () => {
      const im = new Image();
      im.onerror = () => fail(new Error('Das Bild konnte nicht gelesen werden.'));
      im.onload = () => {
        const sc = Math.min(1, 1400 / Math.max(im.width, im.height)); const w = Math.round(im.width * sc), h = Math.round(im.height * sc);
        const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
        x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(im, 0, 0, w, h);
        ok({ data: c.toDataURL('image/jpeg', 0.86), w, h });
      };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}
function renderTasks() {
  const ex = exam(); const k = Tasks.ensure(ex); const sch = schedule(ex);
  const maxMembers = Math.min(4, Math.max(2, ex.groupSize || 2, ...ex.groups.map(g => g.members.length)));
  const lang = ex.wlang;
  const opt = (items, sel, kind) => `<option value="">– wählen –</option>` + items.map((it, i) => `<option value="${it.id}" ${it.id === sel ? 'selected' : ''}>${esc(Tasks.itemName(it, i, lang))}</option>`).join('');
  const head = (it, i, kind) => `<summary><span class="tkNum">${i + 1}</span><b class="tkTitle">${esc(Tasks.itemName(it, i, lang))}</b><button type="button" class="iconbtn" data-del="${kind}:${it.id}" title="Aufgabe löschen">✕</button></summary>`;
  const monoHtml = k.mono.items.map((it, i) => `
    <details class="tkItem glass" data-id="${it.id}" ${tkClosed.has(it.id) ? '' : 'open'}>${head(it, i, 'mono')}
      <div class="tkBody">
        <label class="field"><span>Überschrift auf der Karte (optional)</span><input type="text" data-k="mono" data-id="${it.id}" data-f="title" value="${esc(it.title)}"></label>
        <label class="field"><span>Aufgabentext (Zeilen mit „- “ werden zu Aufzählungspunkten)</span><textarea rows="5" data-k="mono" data-id="${it.id}" data-f="text">${esc(it.text)}</textarea></label>
        <div class="tkImg" data-drop="${it.id}">${it.img ? `<img src="${it.img.data}" alt="">` : ''}
          <div class="tkImgCtl"><button type="button" class="mini" data-img="${it.id}">${it.img ? 'Bild ersetzen…' : 'Bild einfügen…'}</button><span class="tkHint">oder Bild hierher ziehen</span>${it.img ? `<button type="button" class="mini" data-imgdel="${it.id}">Bild entfernen</button>` : ''}</div>
          ${it.img ? `<label class="field"><span>Quelle / Urheber (erscheint unter dem Bild)</span><input type="text" data-k="mono" data-id="${it.id}" data-f="credit" value="${esc(it.credit)}"></label>` : ''}</div>
        <label class="field"><span>Erwartungen (nur auf dem Prüferblatt)</span><textarea rows="3" data-k="mono" data-id="${it.id}" data-f="expect">${esc(it.expect)}</textarea></label>
      </div></details>`).join('');
  const diaHtml = k.dia.items.map((it, i) => `
    <details class="tkItem glass" data-id="${it.id}" ${tkClosed.has(it.id) ? '' : 'open'}>${head(it, i, 'dia')}
      <div class="tkBody">
        <label class="field"><span>Überschrift auf der Karte (optional)</span><input type="text" data-k="dia" data-id="${it.id}" data-f="title" value="${esc(it.title)}"></label>
        <label class="field"><span>Situation bzw. Diskussionsfrage (für alle gleich)</span><textarea rows="3" data-k="dia" data-id="${it.id}" data-f="situation">${esc(it.situation)}</textarea></label>
        ${Array.from({ length: maxMembers }, (_, r) => `<label class="field"><span>Rolle ${Tasks.LETTERS[r]} (nur auf Karte ${Tasks.LETTERS[r]}; leer lassen, wenn es keine Rollen gibt)</span><textarea rows="3" data-k="dia" data-id="${it.id}" data-r="${r}">${esc(it.roles[r])}</textarea></label>`).join('')}
        <label class="field"><span>Erwartungen (nur auf dem Prüferblatt)</span><textarea rows="3" data-k="dia" data-id="${it.id}" data-f="expect">${esc(it.expect)}</textarea></label>
      </div></details>`).join('');
  const groupsHtml = sch.map(({ g, i, start, end }) => `
    <div class="tkGroup glass" style="--hue:var(--g${(i % 8) + 1})"><div class="num">${i + 1}</div>
      <div class="tkG"><div class="tkTime">${hm(start)}–${hm(end)}</div>
      ${g.members.map((id, mi) => { const st = stById(ex, id); const a = g.task.mono[id] || []; return `<div class="tkRow"><span class="tkLetter">${Tasks.LETTERS[mi]}</span><span class="tkWho">${esc(fullName(st) || '?')}</span>
        ${k.mono.on ? Array.from({ length: Math.min(k.mono.choice, Math.max(1, k.mono.items.length)) }, (_, j) => `<select data-gm="${g.id}|${id}|${j}" aria-label="Monolog">${opt(k.mono.items, a[j])}</select>`).join('') : ''}</div>`; }).join('') || '<div class="hint" style="margin:0">Leere Gruppe</div>'}
      ${k.dia.on && g.members.length ? `<div class="tkRow"><span class="tkLetter">⇄</span><span class="tkWho">Dialog</span><select data-gd="${g.id}" aria-label="Dialog">${opt(k.dia.items, g.task.dia)}</select></div>` : ''}</div></div>`).join('');
  $('main').innerHTML = `
  <div class="layout">
    <aside class="rail">
      <section class="panel glass">
        <h2 class="ptitle">Aufbau</h2>
        <div class="rows">
          <label class="row"><span>Monolog</span><input type="checkbox" class="sw" id="tkMonoOn" ${k.mono.on ? 'checked' : ''}></label>
          <label class="row"><span>Dialog</span><input type="checkbox" class="sw" id="tkDiaOn" ${k.dia.on ? 'checked' : ''}></label>
          <label class="row"><span>Hinweis „Wörterbuch nicht erlaubt“</span><input type="checkbox" class="sw" id="tkDict" ${k.noDict ? 'checked' : ''}></label>
        </div>
        <div class="grid2" style="margin-top:12px">
          <label class="field"><span>Monolog (Min.)</span><input type="number" id="tkMonoMin" min="1" max="30" value="${k.mono.min}" ${k.mono.on ? '' : 'disabled'}></label>
          <label class="field"><span>Dialog (Min.)</span><input type="number" id="tkDiaMin" min="1" max="30" value="${k.dia.min}" ${k.dia.on ? '' : 'disabled'}></label>
        </div>
        <div class="field" style="margin-bottom:0"><span>Themen zur Auswahl (Monolog)</span>
          <div class="seg" role="group" id="tkChoice">${[1, 2, 3, 4].map(n => `<button data-n="${n}" aria-pressed="${k.mono.choice === n}" ${k.mono.on ? '' : 'disabled'}>${n === 1 ? 'Nur eines' : n + ' zur Wahl'}</button>`).join('')}</div></div>
        <p class="note">Die Beschriftungen der Karten richten sich nach der Sprache der Prüfung (${esc(({ de: 'Deutsch', en: 'Englisch', it: 'Italienisch', fr: 'Französisch', es: 'Spanisch' })[ex.wlang])}). Das Prüferblatt ist immer deutsch.</p>
      </section>
      <section class="panel glass">
        <h2 class="ptitle">Ausgabe</h2>
        <button class="go secondary" id="tkAuto" style="margin-top:0">Aufgaben automatisch verteilen</button>
        <p class="note">Verteilt die Aufgaben reihum auf alle Prüflinge und Gruppen. Danach lässt sich jede Zuordnung rechts ändern.</p>
        <button class="go" data-print="cards">Karten für die Prüflinge …</button>
        <button class="go secondary" data-print="examiner" style="margin-top:8px">Prüferblätter …</button>
        <p class="note">Vor dem Speichern wählst du Design, Format (A4 oder A5) und Schriftgröße und siehst eine Vorschau.</p>
      </section>
    </aside>
    <section class="tkMain">
      ${k.mono.on ? `<div class="planHead"><h2>Monolog<small>${k.mono.items.length} ${k.mono.items.length === 1 ? 'Aufgabe' : 'Aufgaben'} · ${k.mono.min} Min. je Person</small></h2><div class="exportBar" style="margin:0"><button class="mini accent" id="addMono">+ Aufgabe</button></div></div>
        ${monoHtml || '<div class="empty glass" style="min-height:140px"><div>Noch keine Monolog-Aufgabe. Mit „+ Aufgabe“ anlegen: Text, optional ein Bild.</div></div>'}` : ''}
      ${k.dia.on ? `<div class="planHead" style="margin-top:22px"><h2>Dialog<small>${k.dia.items.length} ${k.dia.items.length === 1 ? 'Aufgabe' : 'Aufgaben'} · ${k.dia.min} Min. je Gruppe</small></h2><div class="exportBar" style="margin:0"><button class="mini accent" id="addDia">+ Aufgabe</button></div></div>
        ${diaHtml || '<div class="empty glass" style="min-height:140px"><div>Noch keine Dialog-Aufgabe. Mit „+ Aufgabe“ anlegen: Situation und Rollenkarten A und B.</div></div>'}` : ''}
      ${(k.mono.on || k.dia.on) ? `<div class="planHead" style="margin-top:22px"><h2>Zuordnung<small>Welche Aufgabe bekommt wer</small></h2></div>
        ${groupsHtml || '<div class="empty glass" style="min-height:120px"><div>Bilde zuerst im Reiter „Gruppen &amp; Plan“ die Prüfungsgruppen.</div></div>'}` : ''}
    </section>
  </div>`;
  const redo = () => { save(); renderTasks(); };
  $('tkMonoOn').onchange = e => { k.mono.on = e.target.checked; redo(); };
  $('tkDiaOn').onchange = e => { k.dia.on = e.target.checked; redo(); };
  $('tkDict').onchange = e => { k.noDict = e.target.checked; save(); };
  $('tkMonoMin').onchange = e => { k.mono.min = Math.max(1, Math.min(30, +e.target.value || 2)); redo(); };
  $('tkDiaMin').onchange = e => { k.dia.min = Math.max(1, Math.min(30, +e.target.value || 4)); redo(); };
  document.querySelectorAll('#tkChoice button').forEach(b => b.onclick = () => { k.mono.choice = +b.dataset.n; redo(); });
  $('tkAuto').onclick = () => { if (!k.mono.items.length && !k.dia.items.length) return toast('Bitte zuerst Aufgaben anlegen.'); Tasks.autoAssign(ex); redo(); toast('Aufgaben verteilt'); };
  const add = kind => { const it = kind === 'mono' ? Tasks.newMono() : Tasks.newDia(); k[kind].items.push(it); redo(); };
  if ($('addMono')) $('addMono').onclick = () => add('mono');
  if ($('addDia')) $('addDia').onclick = () => add('dia');
  document.querySelectorAll('[data-del]').forEach(b => b.onclick = async e => {
    e.preventDefault(); e.stopPropagation(); const [kind, id] = b.dataset.del.split(':');
    if (!await ask('Diese Aufgabe wird gelöscht. Bereits zugeteilte Gruppen müssen danach neu zugeteilt werden.')) return;
    k[kind].items = k[kind].items.filter(i => i.id !== id); redo();
  });
  document.querySelectorAll('details.tkItem').forEach(d => d.addEventListener('toggle', () => { d.open ? tkClosed.delete(d.dataset.id) : tkClosed.add(d.dataset.id); }));
  document.querySelectorAll('[data-k]').forEach(el => el.oninput = () => {
    const it = (el.dataset.k === 'mono' ? Tasks.monoOf : Tasks.diaOf)(ex, el.dataset.id); if (!it) return;
    if (el.dataset.r !== undefined) it.roles[+el.dataset.r] = el.value; else it[el.dataset.f] = el.value;
    const ti = el.closest('details').querySelector('.tkTitle'); const arr = k[el.dataset.k].items; const idx = arr.indexOf(it);
    if (ti) ti.textContent = Tasks.itemName(it, idx, lang);
    save();
  });
  const setImage = async (id, f) => { if (!f) return; if (!/^image\//.test(f.type)) return toast('Das ist keine Bilddatei.'); try { const it = Tasks.monoOf(ex, id); it.img = await readImage(f); redo(); } catch (err) { toast(err.message); } };
  document.querySelectorAll('[data-img]').forEach(b => b.onclick = () => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/png,image/jpeg,image/webp,image/gif';
    inp.onchange = () => setImage(b.dataset.img, inp.files[0]);
    inp.click();
  });
  /* Bild auch per Drag & Drop: auf die Bildfläche der Aufgabe ziehen */
  document.querySelectorAll('.tkImg[data-drop]').forEach(z => {
    const has = e => e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files');
    z.ondragover = e => { if (!has(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; z.classList.add('target'); };
    z.ondragleave = e => { if (!z.contains(e.relatedTarget)) z.classList.remove('target'); };
    z.ondrop = e => { if (!has(e)) return; e.preventDefault(); z.classList.remove('target'); setImage(z.dataset.drop, e.dataTransfer.files[0]); };
  });
  document.querySelectorAll('[data-imgdel]').forEach(b => b.onclick = () => { const it = Tasks.monoOf(ex, b.dataset.imgdel); it.img = null; it.credit = ''; redo(); });
  document.querySelectorAll('[data-gm]').forEach(sel => sel.onchange = () => {
    const [gid, sid, j] = sel.dataset.gm.split('|'); const g = ex.groups.find(x => x.id === gid); const a = (g.task.mono[sid] ||= []); a[+j] = sel.value; g.task.mono[sid] = a; save();
  });
  document.querySelectorAll('[data-gd]').forEach(sel => sel.onchange = () => { const g = ex.groups.find(x => x.id === sel.dataset.gd); g.task.dia = sel.value; save(); });
  document.querySelectorAll('[data-print]').forEach(b => b.onclick = () => {
    const miss = Tasks.missing(ex); if (miss) return toast(miss);
    printTasks(ex, b.dataset.print);
  });
}

/* ---------- Drucken (print.js) ---------- */
function printTasks(ex, what) {
  const models = Export.taskModels(ex, S.settings, klass(ex).students, schedule(ex), what);
  const base = Export.fileBase(ex, what === 'cards' ? 'Prüfungskarten' : 'Prüferblätter');
  const key = what === 'cards' ? 'cardLook' : 'sheetLook';
  Druck.open({ kind: 'tasks', title: what === 'cards' ? 'Karten für die Prüflinge' : 'Prüferblätter', models,
    opt: Object.assign({ design: 'nuechtern' }, S.settings[key] || {}), canSplit: what === 'cards' && !!(ex.task && ex.task.mono.on && ex.task.dia.on),
    onOpt: o => { S.settings[key] = o; save(); },
    file: o => `${base}${o.a5 ? ' (A5)' : ''}`,
    docx: () => Export.tasks(ex, S.settings, klass(ex).students, schedule(ex), what, 'docx').catch(err => toast(err.message || 'Export fehlgeschlagen')) });
}
function planData(ex) {
  const k = Tasks.ensure(ex); const sch = schedule(ex); const sc = SCHEMES[ex.scheme];
  const tname = (it, list) => Tasks.itemName(it, list.indexOf(it), ex.wlang);
  return { title: ex.title, subject: ex.subject, cls: ex.cls, date: dateDe(ex.date), room: ex.room, dur: ex.dur, gap: +ex.gap || 0, parts: ex.parts, note: ex.planNote,
    span: sch.length ? `${hm(sch[0].start)}–${hm(sch[sch.length - 1].end)} Uhr` : '',
    logo: S.settings.logo || null, level: sc.type === 'np' ? 'Q 12/13' : sc.type === 'bep' ? 'B1' : sc.label,
    slots: sch.map(({ g, i, start, end }) => {
      /* Lehrkraft-Fassung: Aufgaben je Person (wer welches Monolog-Thema hat), Dialog mit Rollen */
      const sts = g.members.map(id => stById(ex, id)).filter(Boolean);
      const mono = k.mono.on ? sts.map(s => { const its = ((g.task && g.task.mono[s.id]) || []).map(x => Tasks.monoOf(ex, x)).filter(Boolean); return its.length ? `${s.first}: ${its.map(it => tname(it, k.mono.items)).join(' / ')}` : ''; }).filter(Boolean) : [];
      const dia = g.task && Tasks.diaOf(ex, g.task.dia);
      const tasks = [mono.length ? 'Monolog – ' + mono.join(' · ') : '', k.dia.on && dia ? `Dialog – ${tname(dia, k.dia.items)}${sts.length > 1 ? ` (${sts.map((s, j) => `${s.first} ${'ABCD'[j]}`).join(', ')})` : ''}` : ''].filter(Boolean);
      const people = g.members.map(id => stById(ex, id)).filter(Boolean).map(s => `${s.first} ${s.last}`.trim());
      return { i, start, end, people, names: people.join(', '), tasks, brk: i < sch.length - 1 ? pauseOf(ex, g) : 0 };
    }) };
}
function printPlan(ex) {
  if (!ex.groups.length) return toast('Bitte zuerst Gruppen bilden');
  Druck.open({ kind: 'plan', title: 'Prüfungsplan drucken', data: planData(ex), opt: Object.assign({ design: 'nuechtern' }, S.settings.planLook || {}, { door: false, names: false }), onOpt: o => { S.settings.planLook = { design: o.design }; save(); },
    file: o => Export.fileBase(ex, o.door ? 'Türaushang' : o.teacher ? 'Prüfungsplan Lehrkraft' : 'Prüfungsplan'),
    docx: () => Export.plan(ex, S.settings, studentsOf(ex)).catch(err => toast(err.message || 'Export fehlgeschlagen')) });
}
function overviewData(ex) {
  const sts = studentsOf(ex); const cats = catsOf(ex.scheme); const sc = SCHEMES[ex.scheme]; const np = sc.type !== 'be';
  const rows = sts.map(s => ({ s, r: res(ex, s.id), e: evalOf(ex, s.id) }));
  const graded = rows.filter(x => x.e.complete && !x.r.absent);
  const f1 = n => String(Math.round(n * 10) / 10).replace('.', ',');
  const dist = np ? Array.from({ length: 16 }, (_, i) => graded.filter(x => x.e.np === 15 - i).length) : [1, 2, 3, 4, 5, 6].map(g => graded.filter(x => x.e.grade === g).length);
  const avg = graded.length ? graded.reduce((a, x) => a + x.e.grade, 0) / graded.length : null;
  const npAvg = np && graded.length ? graded.reduce((a, x) => a + x.e.np, 0) / graded.length : null;
  const weak = graded.filter(x => np ? x.e.np < 5 : x.e.grade >= 5).length;
  let key = null;
  if (sc.type === 'be') { const rg = keyRanges(ex.scheme, customKey(ex)); key = rg.map(x => ({ r: `${f1(x.from)}–${f1(x.to)}`, g: x.grade, c: graded.filter(y => y.e.grade === x.grade).length })); }
  return { title: ex.title, subject: ex.subject, cls: ex.cls, date: dateDe(ex.date), examiner: S.settings.examiner, logo: S.settings.logo || null, np,
    level: sc.type === 'np' ? 'Q 12/13' : sc.type === 'bep' ? 'B1' : sc.label, n: sts.length, graded: graded.length, absent: rows.filter(x => x.r.absent).length,
    avg: avg == null ? '–' : avg.toFixed(2).replace('.', ',') + (npAvg != null ? ` (${f1(npAvg)} NP)` : ''),
    weak: graded.length ? `${weak} (${Math.round(weak / graded.length * 100)} %)` : '–',
    dist, distLabels: np ? Array.from({ length: 16 }, (_, i) => String(15 - i)) : ['1', '2', '3', '4', '5', '6'],
    cats: cats.map(c => { const v = graded.map(x => x.r.scores[c]).filter(x => x != null); const a = v.length ? v.reduce((p, q) => p + q, 0) / v.length : 0; const mx = maxOf(ex.scheme, c);
      return { label: CATS[c].label, short: CATS[c].short, avg: v.length ? f1(a) : '–', max: mx, pct: Math.round(a / mx * 100) }; }),
    key, keyUnit: 'BE',
    rows: rows.map(({ s, r, e }) => ({ name: `${s.last}, ${s.first}`, vals: cats.map(c => r.absent ? '' : r.scores[c] != null ? f1(r.scores[c]) : '–'), sum: r.absent ? 'fehlt' : e.complete ? (np ? String(e.np) : f1(e.be)) : '–', grade: !r.absent && e.complete ? String(e.grade) : '' })) };
}
function printOverview(ex) {
  if (!studentsOf(ex).some(s => evalOf(ex, s.id).complete)) return toast('Noch niemand vollständig bewertet');
  Druck.open({ kind: 'overview', title: 'Übersicht für die Fachschaft', data: overviewData(ex), opt: Object.assign({ design: 'nuechtern' }, S.settings.planLook || {}, { names: false }), onOpt: o => { S.settings.planLook = { design: o.design }; save(); }, file: o => Export.fileBase(ex, 'Übersicht Fachschaft') });
}

/* ---------- Reiter 2: Bewerten ---------- */
let timer = { left: null, run: false, id: null, group: null };
let stickIO = null;
function renderGrade() {
  const ex = exam();
  if (!ex.groups.length) { $('main').innerHTML = `<div class="empty glass"><div><strong>Noch keine Gruppen</strong><p>Bilde zuerst im Reiter „Gruppen &amp; Plan“ die Prüfungsgruppen.</p><button class="go" id="toPlan">Zu den Gruppen</button></div></div>`; $('toPlan').onclick = () => setTab('plan'); return; }
  ex.cur = Math.min(Math.max(0, ex.cur || 0), ex.groups.length - 1);
  const sch = schedule(ex); const cur = sch[ex.cur]; const g = cur.g;
  if (timer.group !== g.id) { stopTimer(); timer = { left: ex.dur * 60, run: false, id: null, group: g.id }; }
  $('main').innerHTML = `
  <div class="layout">
    <aside class="rail"><section class="panel glass">
      <div class="phead"><h2 class="ptitle">Gruppen</h2><span class="count">${countDone(ex)} / ${studentsOf(ex).length} bewertet</span></div>
      <div class="glist">${sch.map(({ g, i, start }) => { const st = groupStatus(ex, g); return `
        <button class="gitem" data-g="${i}" aria-current="${i === ex.cur}"><span class="n">${i + 1}</span>
          <span class="who">${esc(shortNames(ex, g.members) || '—')}<small>${hm(start)} Uhr</small></span>
          <span class="pill ${st.cls}">${st.txt}</span></button>`; }).join('')}</div>
      <p class="srcLine">Raster und Beschreibungen: <a href="${ISB.url}" target="_blank" rel="noopener" title="${esc(ISB.name)}">ISB München</a></p>
    </section></aside>
    <section>
      <div id="nowWrap">${nowBarHtml(ex)}</div>
      <div class="gradeHead">
        <h2>Gruppe ${ex.cur + 1}<small>${hm(cur.start)}–${hm(cur.end)} Uhr · ${esc(ex.parts || '')}</small></h2>
        <div class="timer glass" id="timerBox"><span class="clock" id="clock"></span>
          <button class="mini" id="tStart"></button><button class="mini" id="tReset">Zurücksetzen</button></div>
        <div class="nav"><button class="mini" id="descTog" aria-pressed="${!!S.settings.hideDesc}" title="Beschreibungen der Rasterstufen bei allen Prüflingen ein- oder ausblenden">${S.settings.hideDesc ? 'Beschreibungen einblenden' : 'Beschreibungen ausblenden'}</button><button class="mini" id="prevG" ${ex.cur === 0 ? 'disabled' : ''}>← Vorherige</button><button class="mini accent" id="nextG" ${ex.cur === ex.groups.length - 1 ? 'disabled' : ''}>Nächste →</button></div>
      </div>
      <div class="cards ${S.settings.hideDesc ? 'noDesc' : ''}" style="--n:${Math.max(1, Math.min(g.members.length, 6))}">${g.members.map(id => stById(ex, id)).filter(Boolean).map(s => cardHtml(ex, s)).join('') || '<p class="hint">Diese Gruppe ist leer.</p>'}</div>
    </section>
  </div>`;
  document.querySelectorAll('.gitem').forEach(b => b.onclick = () => { ex.cur = +b.dataset.g; save(); renderGrade(); });
  $('descTog').onclick = () => { S.settings.hideDesc = !S.settings.hideDesc; save(); const el = document.querySelector('.cards'); el.classList.toggle('noDesc', S.settings.hideDesc); $('descTog').textContent = S.settings.hideDesc ? 'Beschreibungen einblenden' : 'Beschreibungen ausblenden'; $('descTog').setAttribute('aria-pressed', !!S.settings.hideDesc); };
  if (stickIO) stickIO.disconnect();
  if (window.IntersectionObserver) { stickIO = new IntersectionObserver(es => es.forEach(e => { const h = e.target.previousElementSibling; if (h) h.classList.toggle('stuck', !e.isIntersecting && !!e.rootBounds && e.boundingClientRect.top < e.rootBounds.top); }), { rootMargin: '-10px 0px 0px 0px' }); document.querySelectorAll('.card .hsp').forEach(el => stickIO.observe(el)); }
  $('prevG').onclick = () => { ex.cur--; save(); renderGrade(); window.scrollTo(0, 0); };
  $('nextG').onclick = () => { ex.cur++; save(); renderGrade(); window.scrollTo(0, 0); };
  $('tStart').onclick = () => timer.run ? stopTimer() : startTimer();
  $('tReset').onclick = () => { stopTimer(); timer.left = ex.dur * 60; paintTimer(); };
  paintTimer();
  bindCards(ex);
}
function startTimer() { timer.run = true; timer.id = setInterval(() => { timer.left--; paintTimer(); }, 1000); paintTimer(); }
function stopTimer() { timer.run = false; clearInterval(timer.id); timer.id = null; if ($('clock')) paintTimer(); }
function paintTimer() {
  const c = $('clock'); if (!c) return; const l = timer.left; const a = Math.abs(l);
  c.textContent = `${l < 0 ? '+' : ''}${Math.floor(a / 60)}:${String(a % 60).padStart(2, '0')}`;
  $('timerBox').classList.toggle('over', l < 0);
  $('tStart').textContent = timer.run ? 'Pause' : (l === exam().dur * 60 ? 'Start' : 'Weiter');
}
function groupStatus(ex, g) {
  const ms = g.members.filter(id => stById(ex, id)); if (!ms.length) return { cls: '', txt: 'leer' };
  const done = ms.filter(id => res(ex, id).absent || evalOf(ex, id).complete).length;
  const any = ms.some(id => Object.keys(res(ex, id).scores).length);
  return done === ms.length ? { cls: 'done', txt: 'fertig' } : any ? { cls: 'part', txt: `${done}/${ms.length}` } : { cls: '', txt: 'offen' };
}
function countDone(ex) { return studentsOf(ex).filter(s => { const r = ex.results[s.id]; return r && (r.absent || evaluate(ex.scheme, r.scores, customKey(ex)).complete); }).length; }

function cardHtml(ex, s) {
  const r = res(ex, s.id); const cats = catsOf(ex.scheme); const sc = SCHEMES[ex.scheme];
  return `<article class="card glass ${r.absent ? 'isAbsent' : ''}" data-sid="${esc(s.id)}" style="--rows:${cats.length + 3}">
    <div class="cardHead"><h3>${esc(fullName(s))}</h3>
      <label>fehlt <input type="checkbox" class="sw" data-absent ${r.absent ? 'checked' : ''}></label></div>
    <div class="hsp" style="grid-row:1"></div>
    ${cats.map((c, i) => catHtml(ex, s, c, i + 2)).join('')}
    <textarea class="generalNote" style="grid-row:${cats.length + 2}" data-general placeholder="Allgemeine Notizen zum Prüfungsverlauf (erscheinen nicht auf dem Bogen)">${esc(r.general || '')}</textarea>
    <div class="cardFoot" style="grid-row:${cats.length + 3}" data-foot>${footHtml(ex, s.id)}</div>
  </article>`;
}
function catHtml(ex, s, c, row) {
  const r = res(ex, s.id); const v = r.scores[c]; const sc = SCHEMES[ex.scheme];
  const max = maxOf(ex.scheme, c); const isNP = sc.type === 'np';
  const info = isNP ? `${sc.w[c] * 10} %` : `${sc.f[c]} × ${v != null ? fmt(v) : '–'} / ${max} BE${v != null ? ` = ${fmt(v * sc.f[c])} BE` : ''}`;
  let scale;
  if (isNP) {
    scale = `<div class="scale np" role="group">${Array.from({ length: 16 }, (_, i) => 15 - i).map(n => `<button data-c="${c}" data-v="${n}" data-band="${npToGrade(n)}" aria-pressed="${v === n}"${v === n ? ' title="Nochmal tippen, um die Punkte zu löschen"' : ''}>${n}</button>`).join('')}</div>`;
  } else {
    const whole = v != null ? Math.floor(v) : null; const half = v != null && v % 1 !== 0;
    scale = `<div class="scale" role="group" style="--n:${max + 2}">${Array.from({ length: max + 1 }, (_, i) => max - i).map(n => `<button data-c="${c}" data-v="${n}" aria-pressed="${whole === n}"${whole === n ? ' title="Nochmal tippen, um die Punkte zu löschen"' : ''}>${n}</button>`).join('')}
      <button class="half" data-c="${c}" data-half aria-pressed="${half}" title="Halben Punkt dazu (z. B. 4,5)">+½</button></div>`;
  }
  const d = v != null ? descriptor(ex.scheme, c, v) : [];
  return `<div class="cat" data-cat="${c}"${row ? ` style="grid-row:${row}"` : ''}>
    <div class="catHead"><b>${esc(CATS[c].label)}</b><span>${info}</span></div>
    ${scale}
    ${d.length ? `<ul class="desc">${d.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    <textarea class="catNote" rows="1" data-note="${c}" placeholder="Notiz zu ${esc(CATS[c].short)} (erscheint auf dem Bogen bei diesem Bereich)">${esc(r.notes[c] || '')}</textarea>
    ${c === 'pron' && SUBJECT_LANG[ex.subject] ? '<button type="button" class="mini pronBtn" data-pron title="Laute und häufige Fehler auswählen und in die Notiz einfügen">Aussprache markieren …</button>' : ''}
  </div>`;
}
const fmt = n => String(Math.round(n * 10) / 10).replace('.', ',');
function footHtml(ex, id) {
  const r = res(ex, id); if (r.absent) return `<span class="sum">Nicht teilgenommen – Nachtermin nötig</span><span class="grade">–</span>`;
  const e = evalOf(ex, id); const sc = SCHEMES[ex.scheme];
  if (sc.type === 'np') {
    if (!e.complete) return `<span class="sum">Noch nicht alle Bereiche bewertet</span><span class="grade">?</span>`;
    return `<span class="sum">rechnerisch <b>${fmt(e.npRaw)}</b> NP${e.capNote ? ' · gedeckelt (Bereich mit 0/≤3 NP)' : ''}</span><span class="grade g${e.grade}">${String(e.np).padStart(2, '0')}<small>NP</small></span>`;
  }
  const sumTxt = `<b>${fmt(e.be || 0)}</b> von ${e.max} BE`;
  if (!e.complete) return `<span class="sum">${sumTxt} · noch unvollständig</span><span class="grade">?</span>`;
  if (sc.type === 'bep') return `<span class="sum">${sumTxt}</span><span class="grade g${e.grade}">${String(e.np).padStart(2, '0')}<small>NP</small></span>`;
  return `<span class="sum">${sumTxt}</span><span class="grade g${e.grade}">${e.grade}</span>`;
}
function bindCards(ex) {
  document.querySelectorAll('.card').forEach(card => {
    const id = card.dataset.sid; const r = res(ex, id);
    const refresh = (c) => {
      if (c) { const box = card.querySelector(`.cat[data-cat="${CSS.escape(c)}"]`); const s = stById(ex, id); const note = box.querySelector('textarea'); const focus = document.activeElement === note;
        box.outerHTML = catHtml(ex, s, c, parseInt(box.style.gridRow, 10) || 0); bindCat(card.querySelector(`.cat[data-cat="${CSS.escape(c)}"]`)); if (focus) card.querySelector(`[data-note="${c}"]`).focus(); }
      card.querySelector('[data-foot]').innerHTML = footHtml(ex, id);
      if (r.verdictAuto) r.verdict = '';
      save(); updateRailStatus(ex);
    };
    const bindCat = box => {
      box.querySelectorAll('button[data-v]').forEach(b => b.onclick = () => {
        /* erneutes Tippen auf die gewählte Punktzahl löscht sie (falsch angetippt) */
        const c = b.dataset.c, v = +b.dataset.v; if (r.scores[c] === v) delete r.scores[c]; else r.scores[c] = v; refresh(c);
      });
      const h = box.querySelector('[data-half]');
      if (h) h.onclick = () => { const c = h.dataset.c; const cur = r.scores[c]; if (cur == null) return toast('Erst eine ganze Punktzahl wählen'); if (cur % 1) r.scores[c] = Math.floor(cur); else if (cur < maxOf(ex.scheme, c)) r.scores[c] = cur + .5; refresh(c); };
      const pb = box.querySelector('[data-pron]'); if (pb) pb.onclick = () => openPron(ex, id);
      const t = box.querySelector('[data-note]'); autoGrow(t);
      t.oninput = () => { r.notes[t.dataset.note] = t.value; autoGrow(t); if (r.verdictAuto) r.verdict = ''; save(); };
    };
    card.querySelectorAll('.cat').forEach(bindCat);
    card.querySelector('[data-absent]').onchange = e => { r.absent = e.target.checked; card.classList.toggle('isAbsent', r.absent); refresh(); };
    const gn = card.querySelector('[data-general]'); autoGrow(gn); gn.oninput = () => { r.general = gn.value; autoGrow(gn); save(); };
  });
}
/* ---------------- Aussprache markieren (Laute / häufige Fehler) ---------------- */
const PD = { lang: 'en', stage: 1, tab: 's', sel: new Map(), cur: null, ctx: null };
const SEQ_START = { fs1: 5, e1: 5, e2: 6, fs2: 6, fs3: 8, spb: 11 };
const STAGES = [{ n: 1, t: 'Anfang', s: '1.–2. Lernjahr' }, { n: 2, t: 'Mitte', s: '3.–4. Lernjahr' }, { n: 3, t: 'Fortgeschritten', s: 'ab 5. Lernjahr' }];
function pronStage(ex) { const y = (+ex.jgst || 9) - (SEQ_START[ex.seq] || 6) + 1; return y <= 2 ? 1 : y <= 4 ? 2 : 3; }
/* Text für die Notiz – in der Sprache des Bewertungsbogens, wenn die Liste dieselbe Sprache hat (Italienisch-Liste auf italienischem Bogen …), sonst deutsch */
function pronEntryText(e, wl = PD.wl) {
  const use = wl && wl !== 'de' && wl === e.lang ? AUSSPR_TR[wl] : null; const tt = x => (use && use.t[x]) || x;
  if (e.kind === 'e') return tt(e.item[0]);
  const it = e.item; const lab = it.lab ? tt(it.lab) : `/${it.i}/`;
  const ph = e.sub ? (e.sub[0] === '=' ? tt(e.sub.slice(1)) : (use ? use.as(e.sub) : `wie /${e.sub}/ gesprochen`)) : (use ? use.bad : 'nicht korrekt gesprochen');
  return `${lab} (${it.w}) → ${ph}`;
}
function openPron(ex, id) {
  PD.ctx = { id }; PD.wl = ex.wlang || 'de'; PD.lang = SUBJECT_LANG[ex.subject] || 'en'; PD.stage = pronStage(ex); PD.stageAuto = PD.stage; PD.tab = 's'; PD.sel = new Map(); PD.cur = null;
  const y = (+ex.jgst || 9) - (SEQ_START[ex.seq] || 6) + 1; PD.year = y;
  pronRender(); $('pronDlg').showModal();
}
function pronRender() {
  const D = AUSSPR[PD.lang];
  $('pdLang').innerHTML = Object.keys(AUSSPR).map(k => `<button type="button" data-l="${k}" aria-pressed="${k === PD.lang}">${esc(AUSSPR[k].name)}</button>`).join('');
  $('pdStage').innerHTML = STAGES.map(s => `<button type="button" data-st="${s.n}" aria-pressed="${s.n === PD.stage}" title="${esc(s.s)}">${esc(s.t)}</button>`).join('');
  $('pdTab').innerHTML = `<button type="button" data-t="s" aria-pressed="${PD.tab === 's'}">Laute</button><button type="button" data-t="e" aria-pressed="${PD.tab === 'e'}">Häufige Fehler</button>`;
  const list = (PD.tab === 's' ? D.sounds : D.errors).map((it, idx) => ({ it, idx })).filter(o => (PD.tab === 's' ? o.it.lv : o.it[1]) <= PD.stage);
  const btn = o => {
    const key = `${PD.lang}|${PD.tab}|${o.idx}`; const on = PD.sel.has(key);
    if (PD.tab === 's') { const it = o.it; const big = it.lab || '/' + it.i + '/'; return `<button type="button" class="pdItem snd ${on ? 'on' : ''}" data-k="${key}" data-i="${o.idx}" aria-pressed="${on}" ${it.h ? `title="${esc(it.h)}"` : ''}><b class="${big.length > 7 ? 'lg' : ''}">${esc(big)}</b><small>${esc(it.w)}</small></button>`; }
    return `<button type="button" class="pdItem err ${on ? 'on' : ''}" data-k="${key}" data-i="${o.idx}" aria-pressed="${on}">${esc(o.it[0])}</button>`;
  };
  const TOP = PD.tab === 's' ? 8 : 6;
  $('pdGrid').className = 'pdGrid ' + (PD.tab === 's' ? 'snds' : 'errs');
  $('pdGridMore').className = $('pdGrid').className;
  $('pdGrid').innerHTML = list.slice(0, TOP).map(btn).join('');
  const rest = list.slice(TOP); $('pdMore').hidden = !rest.length;
  $('pdGridMore').innerHTML = rest.map(btn).join(''); $('pdMoreSum').textContent = `Weitere anzeigen (${rest.length})`;
  if (rest.some(o => PD.sel.has(`${PD.lang}|${PD.tab}|${o.idx}`))) $('pdMore').open = true;
  // Ersatzlaute des zuletzt gewählten Lauts
  const cur = PD.cur && PD.sel.get(PD.cur);
  $('pdSub').innerHTML = cur && cur.kind === 's' && cur.item.s.length
    ? `<span class="pdLbl">Wie wurde er gesprochen? <small>(optional)</small></span><div class="chips">${cur.item.s.map(x => `<button type="button" class="chip pdSubBtn" data-sub="${esc(x)}" aria-pressed="${cur.sub === x}">${esc(x[0] === '=' ? x.slice(1) : 'wie /' + x + '/')}</button>`).join('')}</div>` : '';
  const ents = [...PD.sel.values()];
  $('pdPrev').innerHTML = ents.length ? ents.map(e => `<div class="pdLine">${esc(pronEntryText(e))}</div>`).join('') : '<div class="pdEmpty">Tippe Laute oder Fehler an. Sie werden hier gesammelt und beim Schließen automatisch in die Notiz zur Aussprache übernommen – in der Sprache des Bogens.</div>';
  $('pdIns').disabled = $('pdClr').disabled = !ents.length;
  $('pdUndo').hidden = !(PD.last && PD.ctx && PD.last.id === PD.ctx.id);
  const yr = PD.year;
  $('pdHint').textContent = PD.lang === 'fr' || PD.lang === 'es' ? 'Entwurf, bitte gegenlesen.' : (PD.stage === PD.stageAuto && yr ? `Voreinstellung: ${yr}. Lernjahr.` : '');
  pronBind();
}
function pronBind() {
  $('pdLang').querySelectorAll('[data-l]').forEach(b => b.onclick = () => { PD.lang = b.dataset.l; PD.cur = null; pronRender(); });
  $('pdStage').querySelectorAll('[data-st]').forEach(b => b.onclick = () => { PD.stage = +b.dataset.st; pronRender(); });
  $('pdTab').querySelectorAll('[data-t]').forEach(b => b.onclick = () => { PD.tab = b.dataset.t; PD.cur = null; pronRender(); });
  document.querySelectorAll('#pronDlg .pdItem').forEach(b => b.onclick = () => {
    const k = b.dataset.k; const D = AUSSPR[PD.lang]; const i = +b.dataset.i;
    if (PD.sel.has(k)) { PD.sel.delete(k); if (PD.cur === k) PD.cur = null; }
    else { PD.sel.set(k, PD.tab === 's' ? { kind: 's', item: D.sounds[i], sub: null, lang: PD.lang } : { kind: 'e', item: D.errors[i], lang: PD.lang }); PD.cur = PD.tab === 's' ? k : null; }
    pronRender();
  });
  document.querySelectorAll('#pronDlg .pdSubBtn').forEach(b => b.onclick = () => { const e = PD.sel.get(PD.cur); if (!e) return; e.sub = e.sub === b.dataset.sub ? null : b.dataset.sub; pronRender(); });
}
$('pdClr').onclick = () => { PD.sel.clear(); PD.cur = null; pronRender(); };
/* Auswahl in die Notiz übernehmen – rein additiv, gleiche Einträge nicht doppelt. Auch beim Schließen des Dialogs (Fertig, Esc, Klick daneben). */
function pronCommit(quiet) {
  if (!PD.sel.size || !PD.ctx) return false;
  const card = document.querySelector(`.card[data-sid="${CSS.escape(PD.ctx.id)}"]`); const t = card && card.querySelector('[data-note="pron"]'); if (!t) return false;
  const old = t.value.trim().replace(/[;,]\s*$/, '');
  const parts = [...PD.sel.values()].map(e => pronEntryText(e)).filter(x => !old.split(/;\s*/).includes(x));
  PD.sel.clear(); PD.cur = null;
  if (!parts.length) return false;
  const add = parts.join('; ');
  t.value = old ? `${old}; ${add}` : add; t.dispatchEvent(new Event('input'));
  PD.last = { id: PD.ctx.id, text: add };
  if (!quiet) toast('In die Notiz eingefügt');
  return true;
}
$('pdIns').onclick = () => { pronCommit(); pronRender(); };
$('pronDlg').addEventListener('close', () => { if (pronCommit(true)) toast('Aussprache in die Notiz übernommen'); });
$('pdUndo').onclick = () => {
  const L = PD.last; if (!L) return;
  const card = document.querySelector(`.card[data-sid="${CSS.escape(L.id)}"]`); const t = card && card.querySelector('[data-note="pron"]');
  if (!t) return; const v = t.value.trim();
  if (v.endsWith(L.text)) { t.value = v.slice(0, v.length - L.text.length).replace(/[;,]\s*$/, ''); t.dispatchEvent(new Event('input')); toast('Letzten Eintrag entfernt'); }
  PD.last = null; pronRender();
};

function autoGrow(t) { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight + 2, 240) + 'px'; }
function updateRailStatus(ex) {
  document.querySelectorAll('.gitem').forEach(b => { const st = groupStatus(ex, ex.groups[+b.dataset.g]); const p = b.querySelector('.pill'); p.className = 'pill ' + st.cls; p.textContent = st.txt; });
  const c = document.querySelector('.rail .count'); if (c) c.textContent = `${countDone(ex)} / ${studentsOf(ex).length} bewertet`;
}

/* ---------- Reiter 3: Ergebnisse ---------- */
function verdictFor(ex, s) {
  const r = res(ex, s.id);
  if (r.verdict && !r.verdictAuto) return r.verdict;
  const e = evalOf(ex, s.id); if (!e.complete || r.absent) return '';
  return autoVerdict(ex, s);
}
const autoVerdict = (ex, s) => { const r = res(ex, s.id); return worturteil(ex.scheme, s, r.scores, ex.wlang, null, customKey(ex)); };
/* Grundlage eines von Hand bearbeiteten Worturteils: ändern sich danach Punkte, Raster, Notenschlüssel oder „fehlt“, muss es geprüft werden */
const verdictBasis = (ex, id) => { const r = res(ex, id); const sc = r.scores || {}; return [ex.scheme, customKey(ex) ? ex.pct : 50, catsOf(ex.scheme).map(c => sc[c] ?? '-').join(','), r.absent ? 1 : 0].join('|'); };
const verdictStale = (ex, id) => { const r = res(ex, id); return !!(r.verdict && !r.verdictAuto && r.verdictBasis && r.verdictBasis !== verdictBasis(ex, id)); };
const STALE_HINT = 'Punkte oder Notenschlüssel wurden geändert, nachdem du dieses Worturteil bearbeitet hast. Bitte prüfen, ob es noch zur Note passt.';
function renderResults() {
  const ex = exam(); const sts = studentsOf(ex); const cats = catsOf(ex.scheme); const sc = SCHEMES[ex.scheme];
  const rows = sts.map(s => ({ s, r: res(ex, s.id), e: evalOf(ex, s.id) }));
  const graded = rows.filter(x => x.e.complete && !x.r.absent);
  const dist = [1, 2, 3, 4, 5, 6].map(g => graded.filter(x => x.e.grade === g).length);
  const avg = graded.length ? graded.reduce((a, x) => a + x.e.grade, 0) / graded.length : null;
  const npAvg = (sc.type !== 'be' && graded.length) ? graded.reduce((a, x) => a + x.e.np, 0) / graded.length : null;
  const maxD = Math.max(1, ...dist);
  const bogL = ex.bogLang || 'de';
  const exL = () => bogL !== ex.wlang ? Object.assign({}, ex, { wlang: bogL }) : ex;
  $('main').innerHTML = `
  <div class="stats">
    <div class="stat glass"><div class="v">${graded.length} / ${sts.length}</div><div class="l">bewertet${rows.filter(x => x.r.absent).length ? ` · ${rows.filter(x => x.r.absent).length} gefehlt` : ''}</div></div>
    <div class="stat glass"><div class="v">${avg == null ? '–' : avg.toFixed(2).replace('.', ',')}</div><div class="l">Notendurchschnitt${npAvg != null ? ` · ⌀ ${npAvg.toFixed(1).replace('.', ',')} NP` : ''}</div></div>
    <div class="stat glass" style="grid-column:span 2"><div class="l">Notenspiegel</div>
      <div class="spiegel">${dist.map((n, i) => `<div><span>${n}</span><i class="g${i + 1}" style="height:${Math.round(n / maxD * 44) + 2}px"></i><span>${i + 1}</span></div>`).join('')}</div></div>
  </div>
  <div class="exportBar">
    <div class="bogGroup"><button class="mini accent" id="allDocx">Alle Bewertungsbögen als Word</button><label class="langPick" title="Sprache der Beschriftungen und der automatischen Worturteile auf den Bögen. Von Hand bearbeitete Worturteile bleiben unverändert."><span>Sprache der Bögen</span><select id="bogLang">${Object.entries({ de: 'Deutsch', en: 'Englisch', it: 'Italienisch', fr: 'Französisch', es: 'Spanisch' }).map(([k, n]) => `<option value="${k}" ${k === bogL ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div>
    <button class="mini" id="overPrint">Übersicht für die Fachschaft …</button>
    <button class="mini" id="copyGrades" title="Name und Note in die Zwischenablage – zum Einfügen in Excel oder ein Notenprogramm">Noten kopieren</button>
    ${rows.some(x => x.r.absent) ? `<button class="mini" id="nachBtn">Nachtermin anlegen (${rows.filter(x => x.r.absent).length})</button>` : ''}
    <button class="mini" id="csvBtn">Notenliste (CSV für Excel)</button>
  </div>
  <div class="tableWrap glass"><table class="res">
    <thead><tr><th>Name</th>${cats.map(c => `<th class="num">${esc(CATS[c].short)}</th>`).join('')}<th class="num">${sc.type === 'np' ? 'NP' : 'BE'}</th><th>Note</th><th>Worturteil</th><th></th></tr></thead>
    <tbody>${rows.map(({ s, r, e }) => `<tr>
      <td><b>${esc(s.last)}</b>, ${esc(s.first)}</td>
      ${cats.map(c => `<td class="num">${r.scores[c] != null ? fmt(r.scores[c]) : '–'}</td>`).join('')}
      <td class="num">${r.absent ? 'fehlt' : e.complete ? (sc.type === 'np' ? String(e.np).padStart(2, '0') : fmt(e.be) + (sc.type === 'bep' ? ` (${e.np} NP)` : '')) : '–'}</td>
      <td>${!r.absent && e.complete ? `<span class="grade g${e.grade}">${e.grade}</span>` : ''}</td>
      <td><span class="vprev">${esc(r.absent ? '' : verdictFor(exL(), s)) || '<span style="opacity:.6">noch nicht vollständig bewertet</span>'}</span>${r.verdict && !r.verdictAuto ? (verdictStale(ex, s.id) ? ` <span class="pill warn" title="${esc(STALE_HINT)}">bitte prüfen</span>` : ' <span class="pill">bearbeitet</span>') : ''}</td>
      <td style="white-space:nowrap"><button class="mini" data-vd="${esc(s.id)}" ${!e.complete || r.absent ? 'disabled' : ''}>Worturteil</button> <button class="mini" data-one="${esc(s.id)}" ${!e.complete || r.absent ? 'disabled' : ''}>Bogen</button></td>
    </tr>`).join('')}</tbody></table></div>`;
  const ready = rows.filter(x => x.e.complete && !x.r.absent).map(x => x.s);
  $('bogLang').onchange = e => { ex.bogLang = e.target.value; save(); renderResults(); };
  const staleOk = async list => { const st = list.filter(x => verdictStale(ex, x.id)); if (!st.length) return true; return ask(`Bei ${st.map(fullName).join(', ')} wurde das Worturteil von Hand bearbeitet und danach änderten sich Punkte oder Notenschlüssel. Es passt womöglich nicht mehr zur Note. Trotzdem speichern?`, 'Trotzdem speichern'); };
  $('allDocx').onclick = async () => { if (!ready.length) return toast('Noch niemand vollständig bewertet'); if (!(await staleOk(ready))) return; Export.sheets(exL(), S.settings, ready.map(s => ({ s, r: res(ex, s.id), e: evalOf(ex, s.id), verdict: verdictFor(exL(), s) })), true).catch(err => toast(err.message || 'Export fehlgeschlagen')); };
  $('overPrint').onclick = () => printOverview(ex);
  if ($('nachBtn')) $('nachBtn').onclick = () => makeNachtermin(ex);
  $('copyGrades').onclick = async () => {
    const lines = rows.map(({ s, r, e }) => `${s.last}, ${s.first}\t${r.absent ? 'fehlt' : e.complete ? e.grade : ''}${sc.type !== 'be' && e.complete && !r.absent ? '\t' + e.np : ''}`);
    const txt = lines.join('\n');
    let ok = false; try { await navigator.clipboard.writeText(txt); ok = true; } catch (err) {}
    if (!ok) { const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); try { ok = document.execCommand('copy'); } catch (err) {} ta.remove(); }
    toast(ok ? `${rows.length} Zeilen kopiert (Name, Note${sc.type !== 'be' ? ', Notenpunkte' : ''}) – z. B. in Excel einfügen` : 'Kopieren nicht möglich', 4000);
  };
  $('csvBtn').onclick = () => exportCsv(ex);
  document.querySelectorAll('[data-one]').forEach(b => b.onclick = async () => { const s = stById(ex, b.dataset.one); if (!(await staleOk([s]))) return; Export.sheets(exL(), S.settings, [{ s, r: res(ex, s.id), e: evalOf(ex, s.id), verdict: verdictFor(exL(), s) }], false).catch(err => toast(err.message || 'Export fehlgeschlagen')); });
  document.querySelectorAll('[data-vd]').forEach(b => b.onclick = () => openVerdict(exL(), stById(ex, b.dataset.vd)));
}
async function exportCsv(ex) {
  const cats = catsOf(ex.scheme); const sc = SCHEMES[ex.scheme];
  const head = ['Nachname', 'Vorname', ...cats.map(c => CATS[c].label), sc.type === 'np' ? 'Notenpunkte' : 'BE', ...(sc.type === 'bep' ? ['Notenpunkte'] : []), 'Note'];
  const lines = [head];
  for (const s of studentsOf(ex)) {
    const r = res(ex, s.id); const e = evalOf(ex, s.id);
    lines.push([s.last, s.first, ...cats.map(c => r.scores[c] != null ? fmt(r.scores[c]) : ''), r.absent ? 'fehlt' : e.complete ? (sc.type === 'np' ? e.np : fmt(e.be)) : '', ...(sc.type === 'bep' ? [e.complete ? e.np : ''] : []), !r.absent && e.complete ? e.grade : '']);
  }
  const csv = '﻿' + lines.map(l => l.map(v => { v = String(v ?? ''); return /[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; }).join(';')).join('\r\n');
  await Export.saveBytes(new TextEncoder().encode(csv), Export.fileBase(ex, 'Notenliste') + '.csv', 'csv');
}

/* ---------- Worturteil-Dialog ---------- */
let vdCtx = null;
function openVerdict(ex, s) {
  vdCtx = { ex, s }; const r = res(ex, s.id); const e = evalOf(ex, s.id); const sc = SCHEMES[ex.scheme];
  $('vdTitle').textContent = `Worturteil – ${fullName(s)}`;
  $('vdMeta').innerHTML = catsOf(ex.scheme).map(c => `<span class="pill">${esc(CATS[c].short)}: ${fmt(r.scores[c])}${sc.type === 'np' ? ' NP' : ' / ' + maxOf(ex.scheme, c)}</span>`).join('') +
    `<span class="pill done">Note ${e.grade}${sc.type !== 'be' ? ` · ${e.np} NP` : ''}</span>`;
  $('vdText').value = verdictFor(ex, s);
  const c = aiCfg(); $('vdAi').hidden = !(S.settings.ai && NATIVE && NATIVE.ai && c.model && (c.key || c.provider === 'ollama'));
  $('vdStatus').textContent = r.verdict && !r.verdictAuto ? (verdictStale(ex, s.id) ? '⚠ ' + STALE_HINT + ' „Neu erzeugen“ passt es automatisch an.' : 'Von dir bearbeitet') : 'Automatisch erzeugt';
  $('verdictDlg').showModal();
}
$('vdRegen').onclick = () => { const { ex, s } = vdCtx; $('vdText').value = autoVerdict(ex, s); $('vdStatus').textContent = 'Neu erzeugt'; };
$('verdictForm').onsubmit = () => {
  const { ex, s } = vdCtx; const r = res(ex, s.id); const auto = autoVerdict(ex, s); const v = $('vdText').value.trim();
  if (v && v !== auto) { r.verdict = v; r.verdictAuto = false; r.verdictBasis = verdictBasis(ex, s.id); } else { r.verdict = ''; r.verdictAuto = true; delete r.verdictBasis; }
  save(); renderResults();
};
$('vdAi').onclick = async () => {
  const { ex, s } = vdCtx; const r = res(ex, s.id); const btn = $('vdAi');
  const scrub = t => String(t || '').split(s.first).join('[NAME]').split(s.last || '\u0000').join('[NAME]');
  const langName = { de: 'Deutsch', en: 'Englisch', it: 'Italienisch', fr: 'Französisch', es: 'Spanisch' }[ex.wlang];
  const sc = SCHEMES[ex.scheme]; const e = evalOf(ex, s.id);
  const facts = catsOf(ex.scheme).map(c => `- ${CATS[c].label}: ${fmt(r.scores[c])} ${sc.type === 'np' ? 'Notenpunkte (0–15)' : 'von ' + maxOf(ex.scheme, c) + ' BE'}\n  ISB-Beschreibung: ${descriptor(ex.scheme, c, r.scores[c]).join('; ')}`).join('\n');
  const prompt = `Du formulierst das Worturteil für den Bewertungsbogen einer mündlichen Schulaufgabe (Gymnasium Bayern, Fach ${ex.subject}, Jahrgangsstufe ${ex.jgst}, Raster ${sc.label}). Gesamtnote: ${e.grade}${sc.type !== 'be' ? ` (${e.np} Notenpunkte)` : ''} – insgesamt eine ${GRADE_WORD.de[e.grade - 1]} Leistung. Diese Gesamteinschätzung ist verbindlich: Das Worturteil muss sie sinngemäß enthalten und darf ihr nirgends widersprechen.

Bewertung je Bereich:
${facts}

Entwurf:
${scrub($('vdText').value)}

Aufgabe: Formuliere den Entwurf zu einem natürlichen, wertschätzenden und sachlichen Worturteil um, auf ${langName}, in der dritten Person, 4 bis 7 Sätze. Nenne die Person genau einmal am Anfang mit dem Platzhalter [NAME]; danach ${s.g === 'w' ? 'weibliche' : s.g === 'm' ? 'männliche' : 'keine geschlechtsbezogenen'} Pronomen. Stütze dich ausschließlich auf die Punkte und Beschreibungen oben; erfinde keine Details, beschönige nichts und nenne keine Punktzahlen oder Noten. Schließe mit einem konkreten Hinweis zur Weiterarbeit. Antworte nur mit dem Text des Worturteils.`;
  btn.disabled = true; $('vdStatus').textContent = 'KI formuliert …';
  try {
    const out = await NATIVE.ai({ ...aiCfg(), prompt });
    $('vdText').value = out.trim().split('[NAME]').join(s.first);
    $('vdStatus').textContent = 'Von der KI umformuliert – bitte prüfen';
  } catch (err) { $('vdStatus').textContent = 'KI nicht erreichbar: ' + errMsg(err); }
  btn.disabled = false;
};

/* ---------- Prüfung anlegen/bearbeiten ---------- */
let editingExam = null;
function fillClassSel(sel, val) {
  sel.innerHTML = Object.keys(S.classes).sort((a, b) => a.localeCompare(b, 'de', { numeric: true })).map(k => `<option>${esc(k)}</option>`).join('') || '<option value="">– erst eine Klasse anlegen –</option>';
  if (val) sel.value = val;
}
function fillSchemeSel(val) { $('exScheme').innerHTML = SCHEME_ORDER.map(k => `<option value="${esc(k)}">${esc(SCHEMES[k].label)}${SCHEMES[k].type === 'be' ? ` · ${totalMax(k)} BE` : ''}</option>`).join(''); $('exScheme').value = val; }
function suggestScheme() {
  const m = S.settings.map[$('exSeq').value] || {}; const s = m[$('exJgst').value];
  if (s) $('exScheme').value = s; updateSchemeHint();
}
function updateSchemeHint() {
  const k = $('exScheme').value; const sc = SCHEMES[k];
  $('exKeyField').hidden = sc.type !== 'be';
  if (sc.type === 'be') {
    $('exSchemeHint').textContent = `Aussprache ×${sc.f.pron} · Sprache ×${sc.f.lang} · Gespräch ×${sc.f.inter} · Inhalt ×${sc.f.content} = ${totalMax(k)} BE`;
    const key = +$('exPct').value === 50 ? sc.key : keyFromPercent(k, +$('exPct').value);
    $('exKeyPreview').textContent = 'Notenschlüssel: ' + keyRanges(k, key).map(r => `${r.grade}: ${fmt(r.from)}–${fmt(r.to)}`).join(' · ');
  } else if (sc.type === 'np') {
    $('exSchemeHint').textContent = `Sprachliche Leistung 40 % · Gesprächsfähigkeit 20 % · Inhalt 40 %, je 0–15 Notenpunkte${sc.cap4 ? '; ein Bereich ≤ 3 NP → höchstens 4 NP gesamt' : ''}; ein Bereich mit 0 NP → höchstens 3 NP gesamt`;
    $('exKeyPreview').textContent = '';
  } else { $('exSchemeHint').textContent = `BE wie B1 (62 BE), umgerechnet in Notenpunkte nach ISB-Rechentabelle`; $('exKeyPreview').textContent = ''; }
}
let copyFrom = null; /* Vorlage beim Kopieren (Aufgaben, Ablauf) – wird erst beim Sichern übernommen */
function openExamDlg(ex, tpl) {
  editingExam = ex; copyFrom = tpl || null;
  $('examDlgTitle').textContent = ex ? 'Prüfung bearbeiten' : tpl ? 'Prüfung kopieren' : 'Prüfung anlegen';
  const d = ex || (tpl ? Object.assign(JSON.parse(JSON.stringify(tpl)), { date: '' }) : null) || newExam({ title: '', date: '', cls: Object.keys(S.classes)[0] || '' });
  fillClassSel($('exClass'), d.cls);
  $('exTitle').value = d.title || (ex ? '' : 'Mündliche Schulaufgabe');
  $('exSubject').value = d.subject; $('exJgst').value = d.jgst; $('exSeq').value = d.seq || SUBJECT_SEQ[d.subject] || 'fs2';
  fillSchemeSel(d.scheme); $('exWLang').value = d.wlang; $('exPct').value = String(d.pct || 50);
  $('exParts').value = d.parts || ''; $('exDate').value = d.date || ''; $('exStart').value = d.start || '08:00'; $('exRoom').value = d.room || '';
  $('exDur').value = d.dur; $('exGap').value = d.gap; $('exBreak').value = d.brk; $('exPlanNote').value = d.planNote || '';
  $('exDelete').hidden = !ex; $('exCopy').hidden = !ex;
  if (!ex) suggestScheme(); else updateSchemeHint();
  $('examDlg').showModal();
}
$('exJgst').onchange = suggestScheme; $('exSeq').onchange = suggestScheme;
$('exScheme').onchange = updateSchemeHint; $('exPct').onchange = updateSchemeHint;
$('exSubject').onchange = () => { const sub = $('exSubject').value; const l = SUBJECT_LANG[sub]; if (l) $('exWLang').value = l; $('exSeq').value = SUBJECT_SEQ[sub] || 'fs2'; suggestScheme(); };
$('exNewClass').onclick = () => openClassDlg(null, name => fillClassSel($('exClass'), name));
$('examForm').onsubmit = e => {
  if (!$('exClass').value) { e.preventDefault(); toast('Bitte zuerst eine Klasse anlegen'); return; }
  const o = { title: $('exTitle').value.trim(), cls: $('exClass').value, subject: $('exSubject').value, jgst: $('exJgst').value, seq: $('exSeq').value,
    scheme: $('exScheme').value, wlang: $('exWLang').value, pct: +$('exPct').value, parts: $('exParts').value.trim(), date: $('exDate').value,
    start: $('exStart').value || '08:00', room: $('exRoom').value.trim(), dur: Math.max(1, +$('exDur').value || 15), gap: Math.max(0, +$('exGap').value || 0),
    brk: Math.max(0, +$('exBreak').value || 0), planNote: $('exPlanNote').value.trim() };
  const changedClass = !!editingExam && editingExam.cls !== o.cls;
  const graded = editingExam ? Object.values(editingExam.results || {}).filter(r => r.absent || Object.keys(r.scores || {}).length).length : 0;
  if (changedClass && (graded || (editingExam.groups || []).some(g => g.members.length)) && !e.confirmed) {
    e.preventDefault();
    ask(`Klasse wechseln? Dabei werden die Gruppen${graded ? ` und ${graded} Bewertung${graded === 1 ? '' : 'en'}` : ''} dieser Prüfung gelöscht.`, 'Klasse wechseln').then(ok => {
      if (!ok) return; $('examDlg').close(); $('examForm').onsubmit({ preventDefault() {}, confirmed: true });
    });
    return;
  }
  if (editingExam) {
    if (changedClass && editingExam.only) delete editingExam.only;
    Object.assign(editingExam, o);
    if (changedClass) { editingExam.groups = []; editingExam.results = {}; }
    for (const r of Object.values(editingExam.results)) if (r.verdictAuto) r.verdict = '';
  } else {
    const ex = newExam(o);
    if (copyFrom) { ex.task = JSON.parse(JSON.stringify(copyFrom.task || Tasks.defaults())); ex.groupSize = copyFrom.groupSize; if (copyFrom.only && copyFrom.cls === o.cls) { ex.only = copyFrom.only.slice(); ex.groups = JSON.parse(JSON.stringify(copyFrom.groups || [])); } }
    S.exams.push(ex); S.current = ex.id; S.tab = 'plan'; homeView = false;
  }
  copyFrom = null; save(); renderAll();
};
$('exCopy').onclick = () => { const src = editingExam; $('examDlg').close(); const tpl = JSON.parse(JSON.stringify(src)); delete tpl.only; tpl.groups = []; tpl.title = src.title; openExamDlg(null, tpl); toast('Klasse und Termin wählen, dann „Sichern“ – Aufgaben und Ablauf werden übernommen', 4500); };
/* Nachtermin: neue Prüfung mit denselben Einstellungen und Aufgaben, nur für die Personen, die gefehlt haben */
function makeNachtermin(ex) {
  const ids = studentsOf(ex).filter(s => res(ex, s.id).absent).map(s => s.id); if (!ids.length) return;
  const tpl = JSON.parse(JSON.stringify(ex)); tpl.only = ids; tpl.title = `${ex.title} – Nachtermin`;
  const size = Math.max(1, Math.min(ex.groupSize || 2, ids.length));
  tpl.groups = []; for (let i = 0; i < ids.length; i += size) tpl.groups.push({ id: uid(), members: ids.slice(i, i + size) });
  openExamDlg(null, tpl); toast('Termin für den Nachtermin eintragen, dann „Sichern“', 4500);
}
$('exDelete').onclick = async () => {
  if (!(await ask(`„${editingExam.title}“ mit allen Gruppen und Bewertungen löschen?`))) return;
  S.exams = S.exams.filter(x => x !== editingExam); S.current = S.exams[0]?.id || null; $('examDlg').close(); save(); renderAll();
};

/* ---------- Klassen ---------- */
function openClassesDlg() { renderClassList(); $('classesDlg').showModal(); }
function renderClassList() {
  const keys = Object.keys(S.classes).sort((a, b) => a.localeCompare(b, 'de', { numeric: true }));
  $('classList').innerHTML = keys.map(k => { const st = S.classes[k].students; const off = st.filter(s => s.off).length; const g = st.filter(s => s.guest).length;
    return `<div class="ci"><span><b>${esc(k)}</b> <small>${st.length - off} Namen${off ? ` · ${off} nicht dabei` : ''}${g ? ` · ${g} Gast` : ''}</small></span><button type="button" class="mini" data-ec="${esc(k)}">Bearbeiten</button></div>`; }).join('') || '<div class="ci"><small>Noch keine Klassen</small></div>';
  document.querySelectorAll('[data-ec]').forEach(b => b.onclick = () => openClassDlg(b.dataset.ec));
}

let editingClass = null, classCb = null, draft = [];
function openClassDlg(key, cb) {
  editingClass = key; classCb = cb || null;
  $('classDlgTitle').textContent = key ? `${key} bearbeiten` : 'Klasse hinzufügen';
  $('clName').value = key || '';
  draft = key ? S.classes[key].students.map(s => ({ ...s })) : [];
  $('clPasteBox').hidden = true; $('clText').value = '';
  $('clDelete').hidden = !key; renderDraft(); $('classDlg').showModal();
}
function renderDraft() {
  const on = draft.filter(s => !s.off).length;
  $('clCount').textContent = draft.length ? `${on} dabei${draft.length - on ? ` · ${draft.length - on} nicht dabei` : ''}` : '';
  setTimeout(updateGHint);
  $('clRows').innerHTML = draft.length ? draft.map((s, i) => `
    <div class="stRow ${s.off ? 'off' : ''}" data-i="${i}">
      <span class="nr">${i + 1}</span>
      <input type="text" data-f="last" value="${esc(s.last)}" placeholder="Nachname" aria-label="Nachname">
      <span style="display:flex;align-items:center;min-width:0"><input type="text" data-f="first" value="${esc(s.first)}" placeholder="Vorname" aria-label="Vorname">${s.guest ? '<span class="tag">Gast</span>' : ''}</span>
      <button type="button" class="gpill ${s.g || 'missing'}" data-gp title="Antippen: w → m → d → –">${s.g || '?'}</button>
      <label class="inc">dabei <input type="checkbox" class="sw" data-f="on" ${s.off ? '' : 'checked'}></label>
      <button type="button" class="iconbtn" data-rm="${i}" title="Aus der Liste löschen">✕</button>
    </div>`).join('') : '<div class="stEmpty">Noch keine Namen – Klassenliste importieren oder Namen einfügen.</div>';
  document.querySelectorAll('#clRows .stRow').forEach(row => {
    const s = draft[+row.dataset.i];
    row.querySelectorAll('input[type=text],select').forEach(inp => inp.oninput = () => { s[inp.dataset.f] = inp.value.trim(); });
    row.querySelector('[data-f="on"]').onchange = e => { s.off = !e.target.checked; renderDraft(); };
    const gp = row.querySelector('[data-gp]');
    gp.onclick = () => { s.g = ({ '': 'w', w: 'm', m: 'd', d: '' })[s.g || '']; gp.className = 'gpill ' + (s.g || 'missing'); gp.textContent = s.g || '?'; updateGHint(); };
    gp.onkeydown = e => { const k = e.key.toLowerCase(); if (['w', 'm', 'd'].includes(k)) { s.g = k; gp.className = 'gpill ' + k; gp.textContent = k; updateGHint(); const next = row.nextElementSibling && row.nextElementSibling.querySelector('[data-gp]'); if (next) next.focus(); e.preventDefault(); } };
  });
  document.querySelectorAll('#clRows [data-rm]').forEach(b => b.onclick = () => { draft.splice(+b.dataset.rm, 1); renderDraft(); });
}
function updateGHint() {
  const miss = draft.filter(s => !s.g).length; const el = $('clGHint');
  el.hidden = !miss; el.textContent = `Bei ${miss} ${miss === 1 ? 'Person fehlt' : 'Personen fehlt'} die Angabe w/m – dann steht im Worturteil der Vorname statt „sie/er“. Zum Nachtragen das „?“ antippen oder hineinklicken und w bzw. m tippen (springt automatisch weiter).`;
}
function addDraft(list) {
  const key = s => `${s.last}|${s.first}`.toLowerCase(); const have = new Set(draft.map(key)); let n = 0;
  for (const s of list) { if (have.has(key(s))) continue; draft.push({ id: 'n' + uid(), first: s.first, last: s.last, g: s.g || '' }); have.add(key(s)); n++; }
  renderDraft(); return n;
}
$('clAdd').onclick = () => { draft.push({ id: 'n' + uid(), first: '', last: '', g: '' }); renderDraft(); focusLast(); };
$('clAddGuest').onclick = () => { draft.push({ id: 'n' + uid(), first: '', last: '', g: '', guest: true }); renderDraft(); focusLast(); };
function focusLast() { const rows = document.querySelectorAll('#clRows .stRow'); const r = rows[rows.length - 1]; if (r) { r.querySelector('input').focus(); r.scrollIntoView({ block: 'nearest' }); } }
$('clSwap').onclick = () => { draft.forEach(s => { [s.first, s.last] = [s.last, s.first]; }); renderDraft(); };
$('clPasteBtn').onclick = () => { $('clPasteBox').hidden = !$('clPasteBox').hidden; if (!$('clPasteBox').hidden) $('clText').focus(); };
$('clPasteGo').onclick = () => { const list = recognizeNames($('clText').value.split(/\r?\n/)); const n = addDraft(list); toast(n ? `${n} Namen übernommen` : 'Keine neuen Namen erkannt'); if (n) { $('clText').value = ''; $('clPasteBox').hidden = true; } };
$('clFileBtn').onclick = () => $('clFile').click();
$('clFile').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) importFile(f); };
const dz = $('dropImport');
dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('over'); });
dz.addEventListener('dragleave', () => dz.classList.remove('over'));
dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) importFile(f); });

async function importFile(f) {
  try {
    toast('Liste wird gelesen …');
    const name = f.name.toLowerCase(); let list = []; importHead = [];
    if (name.endsWith('.pdf')) list = recognizeNames(await pdfLines(await f.arrayBuffer()));
    else if (/\.(xlsx|xls|ods)$/.test(name)) { const rows = sheetRows(await f.arrayBuffer()); importHead = rows.slice(0, 3).map(r => r.join(' ; ')); list = namesFromRows(rows); }
    else { const txt = await f.text(); const lines = txt.split(/\r?\n/); importHead = lines.slice(0, 3); list = /[;\t]/.test(txt) ? namesFromRows(lines.map(l => l.split(/[;\t]/))) : recognizeNames(lines); }
    if (!$('clName').value.trim()) { const c = detectClassName(importHead, f.name); if (c) $('clName').value = c; }
    const n = addDraft(list);
    toast(n ? `${n} Namen erkannt – bitte kurz prüfen` : 'In der Datei wurden keine Namen erkannt');
  } catch (err) { console.error(err); toast('Datei konnte nicht gelesen werden'); }
}
/* Klassen- bzw. Kursname aus Kopfzeilen oder Dateiname */
let importHead = [];
function detectClassName(head, fname) {
  const txt = head.join('\n');
  const pats = [/\bKurs:?\s+([0-9]{0,2}[A-Za-zÄÖÜäöü]{1,4}\d{0,2})\b/, /(?:^|\n)\s*((?:[5-9]|1[0-3])\s?[A-Z]{1,3})\s*[,;]/, /(?:^|\n)\s*(\d[a-z]{1,3}\d{1,2})\s*[,;]/i, /\bKlasse:?\s+((?:[5-9]|1[0-3])\s?[A-Z]{1,3})\b/];
  for (const re of pats) { const m = txt.match(re); if (m) return m[1].replace(/\s+/g, ''); }
  // Spalte, in der überall dieselbe Klasse steht (z. B. ASV-Export „…;9F;…“)
  const col = head.map(l => String(l).split(/[;\t]/).map(x => x.trim())).filter(r => r.length > 2);
  if (col.length) for (let i = 0; i < col[0].length; i++) { const v = col[0][i]; if (/^(?:[5-9]|1[0-3])[A-Z]{1,3}$/.test(v) && col.every(r => r[i] === v)) return v; }
  const m = fname.match(/(?:^|[_\s-])((?:[5-9]|1[0-3])\s?[A-Za-z]{1,3}|\d[a-z]{1,3}\d{1,2})(?=[_\s.-]|$)/i); if (m) return m[1];
  return '';
}
/* PDF → Zeilen; bei Tabellen mit Kopfzeile werden die Spalten über die x-Positionen erkannt */
async function pdfLines(buf) {
  const lib = window.pdfjsLib; lib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';
  const pdf = await lib.getDocument({ data: new Uint8Array(buf) }).promise;
  const allRows = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p); const tc = await page.getTextContent(); const rows = [];
    for (const it of tc.items) { if (!it.str || !it.str.trim()) continue; const y = it.transform[5], x = it.transform[4];
      let row = rows.find(r => Math.abs(r.y - y) < 3); if (!row) { row = { y, items: [] }; rows.push(row); } row.items.push({ x, s: it.str.trim(), w: it.width || 0 }); }
    rows.sort((a, b) => b.y - a.y); rows.forEach(r => r.items.sort((a, b) => a.x - b.x)); allRows.push(...rows);
  }
  importHead = allRows.slice(0, 3).map(r => r.items.map(i => i.s).join(' '));
  const isHead = r => r.items.some(i => /^(nach)?name$|^familienname|^vorname|^rufname/i.test(i.s));
  const hi = allRows.findIndex(isHead);
  if (hi >= 0) {
    const data = allRows.slice(hi + 1).filter(r => r.items.length >= 2 && !isHead(r));
    const xs = data.flatMap(r => r.items.map(i => i.x)).sort((a, b) => a - b); const cl = [];
    for (const x of xs) { const c = cl[cl.length - 1]; if (c && x - c.max <= 4) { c.max = x; c.n++; } else cl.push({ min: x, max: x, n: 1, end: x }); }
    const cols = cl.filter(c => c.n >= Math.max(2, data.length * .3));
    if (cols.length >= 2) {
      const colOf = x => { let k = 0; cols.forEach((c, i) => { if (c.min <= x + 4) k = i; }); return k; };
      data.forEach(r => r.items.forEach(i => { const c = cols[colOf(i.x)]; c.end = Math.max(c.end, i.x + i.w); }));
      const head = cols.map(() => '');
      for (const h of allRows[hi].items) { const mid = h.x + h.w / 2; let best = 0, bd = Infinity;
        cols.forEach((c, i) => { const d = mid < c.min ? c.min - mid : mid > c.end ? mid - c.end : 0; if (d < bd) { bd = d; best = i; } });
        head[best] = (head[best] ? head[best] + ' ' : '') + h.s; }
      const table = [head, ...data.map(r => { const cells = cols.map(() => ''); r.items.forEach(i => { const k = colOf(i.x); cells[k] = (cells[k] ? cells[k] + ' ' : '') + i.s; }); return cells; })];
      const viaTable = namesFromRows(table, true);
      if (viaTable.length) return viaTable.map(s => `${s.last}, ${s.first}${s.g ? ` (${s.g})` : ''}`);
    }
  }
  return allRows.map(r => r.items.map(i => i.s).join(' '));
}
function sheetRows(buf) {
  const wb = XLSX.read(new Uint8Array(buf), { type: 'array' }); const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
}
/* Tabellen ohne Kopfzeile (ASV-/Kurslisten-Export): Spalte 1 = Nachname, Spalte 2 = Vorname */
function headerlessTable(rows) {
  const norm = v => String(v ?? '').trim();
  const nameLike = v => /^[A-Za-zÀ-ÿĀ-žḀ-ỿ'’.\- ]{2,}$/.test(v) && !/^\d/.test(v);
  const data = rows.map(r => r.map(norm)).filter(r => r.filter(Boolean).length >= 2);
  const ok = data.filter(r => nameLike(r[0]) && nameLike(r[1]));
  if (ok.length < Math.max(2, data.length * .6)) return [];
  // Geschlechtsspalte: überwiegend M/W
  let gc = -1;
  for (let i = 2; i < Math.max(...ok.map(r => r.length)); i++) { const v = ok.map(r => (r[i] || '').toLowerCase()); if (v.filter(x => /^(m|w|d|männlich|weiblich|divers)$/.test(x)).length >= ok.length * .8) { gc = i; break; } }
  const HEADISH = /belegart|jahrgangsstufe|klasse|kurs|schuljahr|\bstr\b|\bostr\b|\bstd\b|lehrkraft|name/i;
  const out = [];
  data.forEach((r, i) => {
    if (!(nameLike(r[0]) && nameLike(r[1]))) return;
    if (i === 0 && (HEADISH.test(r.join(' ')) || /\d/.test(r[0]))) return;
    const gv = gc >= 0 ? (r[gc] || '').toLowerCase() : '';
    out.push({ last: r[0], first: r[1], g: /^w/.test(gv) ? 'w' : /^m/.test(gv) ? 'm' : /^d/.test(gv) ? 'd' : '' });
  });
  return out;
}
/* Tabellen mit Kopfzeile (Name/Nachname, Vorname, Geschlecht) */
function namesFromRows(rows, strict) {
  const norm = v => String(v ?? '').trim();
  let hi = -1, cL = -1, cF = -1, cG = -1, cFull = -1;
  for (let i = 0; i < Math.min(rows.length, 40) && hi < 0; i++) {
    const r = rows[i].map(x => norm(x).toLowerCase());
    const L = r.findIndex(x => /^(nach)?name$|^familienname|^schüler.*name|^name,? vorname$|^name des schülers/.test(x));
    const F = r.findIndex(x => /^vorname|^rufname/.test(x));
    if (L >= 0 || F >= 0) { hi = i; cL = L; cF = F; cG = r.findIndex(x => /^geschl|^g$|^m\/w|^w\/m|^sex/.test(x)); if (L >= 0 && F < 0) cFull = L; }
  }
  if (hi < 0) { if (strict) return []; const t = headerlessTable(rows); return t.length ? t : recognizeNames(rows.map(r => r.map(norm).filter(Boolean).join(' '))); }
  const out = [];
  for (const r of rows.slice(hi + 1)) {
    let first = '', last = '';
    if (cFull >= 0) { const v = norm(r[cFull]); if (v.includes(',')) { [last, first] = v.split(',').map(x => x.trim()); } else { const p = v.split(/\s+/); first = p.pop() || ''; last = p.join(' '); } }
    else { last = norm(r[cL]); first = norm(r[cF]); }
    first = first.replace(/\(.*?\)/g, '').trim(); last = last.replace(/^\d+[.)]?\s*/, '').trim();
    if (!first || !/[A-Za-zÀ-ÿ]/.test(first + last) || /^(summe|gesamt|anzahl)/i.test(last)) continue;
    const gv = cG >= 0 ? norm(r[cG]).toLowerCase() : '';
    out.push({ first, last, g: /^w|weibl|^f/.test(gv) ? 'w' : /^m|männ/.test(gv) ? 'm' : /^d/.test(gv) ? 'd' : '' });
  }
  return out;
}
/* Freitext-Zeilen (PDF ohne Kopfzeile, eingefügter Text) */
function recognizeNames(lines) {
  const out = [];
  const HEAD = /\b(klasse|klassenliste|schuljahr|seite|lehrkraft|klassenleit|datum|stand|gymnasium|schule|anzahl|geburtsdatum|konfession|religion|ausbildungsrichtung|nachname|vorname|schüler(innen)?liste)\b/i;
  const numbered = lines.filter(l => /^\s*\d+[.)]?\s+\S/.test(l)).length >= 3;
  for (let raw of lines) {
    let l = String(raw || '').replace(/\s+/g, ' ').trim(); if (!l) continue;
    if (numbered && !/^\d+[.)]?\s+/.test(l)) continue;
    l = l.replace(/^\d+[.)]?\s+/, '');
    if (HEAD.test(l) && !/,/.test(l)) continue;
    let g = ''; const gm = l.match(/(?:\(|\s|^)(w|m|d|weiblich|männlich|divers)(?:\)|\s|$)/i);
    if (gm) { const v = gm[1].toLowerCase(); g = v[0] === 'w' ? 'w' : v[0] === 'm' ? 'm' : 'd'; l = l.replace(gm[0], ' '); }
    l = l.replace(/\b\d{1,2}\.\d{1,2}\.(\d{2}|\d{4})\b/g, ' ').replace(/\b\d+[a-z]?\b/gi, ' ').replace(/(?<![\p{L}\p{N}])(ev|rk|ak|eth|isl|ohne|RK|EV|K|E)(?![\p{L}\p{N}])\.?/gu, ' ').replace(/[|•·]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!l || !/[A-Za-zÀ-ÿ]{2}/.test(l)) continue;
    let first, last;
    if (l.includes(',')) { const p = l.split(',').map(x => x.trim()).filter(Boolean); last = p[0]; first = (p[1] || '').split(' ').filter(Boolean).join(' '); }
    else { const p = l.split(' '); if (p.length > 5) continue; first = p.shift(); last = p.join(' '); }
    if (!first || first.length < 2) continue;
    out.push({ first, last: last || '', g });
  }
  return out;
}

$('classForm').onsubmit = e => {
  const name = $('clName').value.trim();
  const students = draft.filter(s => s.first || s.last).map(s => ({ ...s, first: s.first || s.last, last: s.first ? s.last : '' }));
  if (!students.length) { e.preventDefault(); toast('Die Liste ist noch leer'); return; }
  if (!editingClass && S.classes[name] && !confirmOverwrite(name)) { e.preventDefault(); return; }
  // stabile, eindeutige IDs
  const seen = new Set(); for (const s of students) { if (!s.id) s.id = 'n' + uid(); while (seen.has(s.id)) s.id += '*'; seen.add(s.id); }
  if (editingClass && editingClass !== name) { delete S.classes[editingClass]; S.exams.forEach(x => { if (x.cls === editingClass) x.cls = name; }); }
  S.classes[name] = { raw: '', students };
  // entfernte Personen aus Gruppen nehmen
  const ids = new Set(students.map(s => s.id));
  S.exams.filter(x => x.cls === name).forEach(x => x.groups.forEach(g => { g.members = g.members.filter(id => ids.has(id)); }));
  save(); toast(`${name}: ${students.filter(s => !s.off).length} Namen gespeichert`);
  if (classCb) classCb(name);
  if ($('classesDlg').open) renderClassList();
  renderAll();
};
function confirmOverwrite(name) { toast(`Eine Klasse „${name}“ gibt es schon – bitte anderen Namen wählen oder die Klasse bearbeiten`); return false; }
$('clDelete').onclick = async () => {
  const used = S.exams.filter(x => x.cls === editingClass).length;
  if (!(await ask(`Klasse ${editingClass} löschen?${used ? ` Sie wird in ${used} Prüfung(en) verwendet.` : ''}`))) return;
  delete S.classes[editingClass]; $('classDlg').close(); save(); if ($('classesDlg').open) renderClassList(); renderAll();
};


/* ---------- Klassen austauschen (theis-Klassen) ---------- */
const KL = { plan: [] };
const klExt = s => s.ext || {};
const klWrap = s => ({ xid: s.xid || null, last: s.last || '', first: s.first || '', g: s.g || '', cls: klExt(s).cls || '', away: klExt(s).away || null });
$('klExp').onclick = async () => {
  const keys = Object.keys(S.classes).sort((a, b) => a.localeCompare(b, 'de', { numeric: true }));
  if (!keys.length) return toast('Noch keine Klassen vorhanden');
  const classes = keys.map(k => { const c = S.classes[k]; c.xid ||= TheisKlassen.rid('k-');
    return { id: c.xid, name: k, students: c.students.map(s => { s.xid ||= TheisKlassen.rid('s-'); const { cls, away, ...rest } = klExt(s); return { id: s.xid, last: s.last, first: s.first, g: s.g, cls, away, rest }; }) }; });
  save();
  const ver = NATIVE && NATIVE.version ? await NATIVE.version() : '';
  const data = TheisKlassen.build({ app: `Voce ${ver}`.trim(), schoolYear: S.settings.year || '', classes });
  await Export.saveBytes(new TextEncoder().encode(JSON.stringify(data, null, 1)), `theis-Klassen-${new Date().toISOString().slice(0, 10)}.json`, 'json');
};
$('klImp').onclick = () => $('klFile').click();
$('klFile').onchange = e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  const fr = new FileReader();
  fr.onload = () => {
    let raw; try { raw = JSON.parse(fr.result); } catch (err) { return toast('Die Datei ist nicht lesbar.', 4500); }
    if (raw && raw.exams) return toast('Das ist eine Voce-Sicherung (alle Daten). Die liest du unter „Einstellungen“ → „Sicherung einlesen …“ ein.', 6500);
    if (raw && raw.format !== TheisKlassen.FORMAT && raw.classes && !Array.isArray(raw.classes) && typeof raw.classes === 'object') {
      /* Sicherung der App „Aula“ (früher Gruppo): nur Namen und Geschlecht, keine Kennungen */
      const classes = Object.entries(raw.classes).filter(([, c]) => c && (c.raw || Array.isArray(c.students))).map(([name, c]) => ({
        id: null, name, subject: '', grade: '',
        students: (c.raw ? parseList(c.raw) : c.students).map(x => ({ id: null, last: x.last || '', first: x.first || '', g: ['w', 'm', 'd'].includes(x.g) ? x.g : '', cls: '', away: null, rest: {} })).filter(x => x.last || x.first) }));
      return klPlan({ version: 1, app: 'Aula', exported: '', schoolYear: '', classes, warnings: [] });
    }
    let d; try { d = TheisKlassen.parse(fr.result); } catch (err) { return toast(err.message, 4500); }
    klPlan(d);
  };
  fr.readAsText(f);
};
function klPlan(d) {
  const keys = Object.keys(S.classes);
  KL.meta = d; KL.plan = d.classes.map(c => {
    let key = c.id ? keys.find(k => S.classes[k].xid === c.id) : null;
    if (!key) key = keys.find(k => TheisKlassen.norm(k) === TheisKlassen.norm(c.name));
    if (!key) return { c, isNew: true, on: true };
    const df = TheisKlassen.diff(S.classes[key].students.map(klWrap), c.students);
    df.added.forEach(x => x.on = true); df.changed.forEach(x => x.on = true); df.removed.forEach(x => x.on = false);
    return { c, key, d: df };
  });
  if (!KL.plan.length) return toast('Die Datei enthält keine Klassen');
  const none = KL.plan.every(p => !p.isNew && !p.d.added.length && !p.d.removed.length && !p.d.changed.some(x => !x.silent));
  if (none) { klApply(true); return toast('Alles schon auf dem gleichen Stand – nichts zu ändern'); }
  klRender(); $('klDlg').showModal();
}
const klName = s => [s.last, s.first].filter(Boolean).join(', ');
const klFieldTxt = x => x.fields.map(f => f === 'name' ? `Name: ${klName(x.cur)} → ${klName(x.inc)}` : f === 'g' ? `Geschlecht: ${x.cur.g || '–'} → ${x.inc.g || '–'}` : f === 'cls' ? `Klasse: ${x.cur.cls || '–'} → ${x.inc.cls || '–'}` : 'Abwesenheit geändert').join(' · ');
function klRender() {
  const m = KL.meta;
  $('klMeta').textContent = `Datei aus ${m.app === 'Gruppo' ? 'Aula' : (m.app || 'einer App von theisapps')}${m.exported ? ' vom ' + new Date(m.exported).toLocaleDateString('de-DE') : ''}${m.schoolYear ? ' · Schuljahr ' + m.schoolYear : ''}. Nichts wird geändert, bevor du „Übernehmen“ drückst.`;
  const used = id => S.exams.some(ex => ex.results[id] && (Object.keys(ex.results[id].scores || {}).length || ex.results[id].absent));
  $('klPlan').innerHTML = KL.plan.map((p, pi) => {
    if (p.isNew) return `<div class="klCard"><label class="klHead"><input type="checkbox" data-kn="${pi}" ${p.on ? 'checked' : ''}><span><b>${esc(p.c.name)}</b> <small>neue Klasse · ${p.c.students.length} Namen</small></span></label></div>`;
    const d = p.d; const real = d.changed.filter(x => !x.silent);
    const sec = (t, kind, arr, txt) => arr.length ? `<div class="klSec"><h4>${t} <small>${arr.length}</small></h4>${arr.map((x, i) => `<label class="klRow"><input type="checkbox" data-pi="${pi}" data-kind="${kind}" data-i="${i}" ${x.on ? 'checked' : ''}><span>${esc(txt(x))}</span></label>`).join('')}</div>` : '';
    return `<div class="klCard"><div class="klHead"><span><b>${esc(p.key)}</b> <small>${d.same} unverändert</small></span></div>
      ${sec('Neu', 'add', d.added, x => klName(x.inc) + (x.inc.g ? ` (${x.inc.g})` : ''))}
      ${sec('Geändert', 'chg', real, x => klName(x.cur) + ' – ' + klFieldTxt(x))}
      ${sec('Nicht mehr in der Datei', 'rem', d.removed, x => klName(x.cur) + (used(x.cur.id || (S.classes[p.key].students[x.i] || {}).id) ? ' – hat Bewertungen' : ''))}
      ${!d.added.length && !real.length && !d.removed.length ? '<p class="hint" style="margin:6px 0 0">Keine Unterschiede.</p>' : ''}
      ${d.removed.length ? '<p class="hint" style="margin:6px 0 0">Nicht mehr in der Datei: Häkchen bei Personen setzen, die aus der Liste entfernt werden sollen. Ohne Häkchen bleiben sie bestehen.</p>' : ''}</div>`;
  }).join('');
  $('klPlan').querySelectorAll('input[data-kn]').forEach(c => c.onchange = () => { KL.plan[+c.dataset.kn].on = c.checked; });
  $('klPlan').querySelectorAll('input[data-kind]').forEach(c => c.onchange = () => { const p = KL.plan[+c.dataset.pi]; const arr = { add: p.d.added, chg: p.d.changed.filter(x => !x.silent), rem: p.d.removed }[c.dataset.kind]; arr[+c.dataset.i].on = c.checked; });
}
function klMake(inc, taken) {
  let id = 'n' + uid(); while (taken.has(id)) id = 'n' + uid(); taken.add(id);
  const ext = { ...inc.rest }; if (inc.cls) ext.cls = inc.cls; if (inc.away) ext.away = inc.away;
  const s = { id, first: inc.first || inc.last, last: inc.first ? inc.last : '', g: inc.g || '' };
  if (inc.id) s.xid = inc.id; if (Object.keys(ext).length) s.ext = ext; return s;
}
function klApply(silent) {
  const sum = { nc: 0, na: 0, nch: 0, nr: 0 };
  for (const p of KL.plan) {
    if (p.isNew) { if (!p.on) continue; let k = p.c.name; while (S.classes[k]) k += ' (neu)'; const taken = new Set();
      S.classes[k] = { raw: '', xid: p.c.id || TheisKlassen.rid('k-'), students: p.c.students.map(s => klMake(s, taken)) }; sum.nc++; continue; }
    const cls = S.classes[p.key]; if (p.c.id && !cls.xid) cls.xid = p.c.id;
    const taken = new Set(cls.students.map(s => s.id));
    const rem = new Set();
    for (const x of p.d.changed) { const s = cls.students[x.i]; if (!s) continue;
      if (x.inc.id && !s.xid) s.xid = x.inc.id;
      if (x.silent || !x.on) continue;
      if (x.fields.includes('name')) { s.first = x.inc.first || x.inc.last; s.last = x.inc.first ? x.inc.last : ''; }
      if (x.fields.includes('g')) s.g = x.inc.g;
      if (x.fields.includes('cls') || x.fields.includes('away')) { const ext = { ...(s.ext || {}), ...x.inc.rest }; if (x.inc.cls) ext.cls = x.inc.cls; else delete ext.cls; if (x.inc.away) ext.away = x.inc.away; else delete ext.away; if (Object.keys(ext).length) s.ext = ext; else delete s.ext; }
      sum.nch++; }
    for (const x of p.d.removed) if (x.on && cls.students[x.i]) rem.add(cls.students[x.i].id);
    if (rem.size) { cls.students = cls.students.filter(s => !rem.has(s.id)); S.exams.filter(e => e.cls === p.key).forEach(e => e.groups.forEach(g => { g.members = g.members.filter(id => !rem.has(id)); })); sum.nr += rem.size; }
    const cmp = (a, b) => (a.last || '').localeCompare(b.last || '', 'de') || (a.first || '').localeCompare(b.first || '', 'de');
    const wasSorted = cls.students.every((s, i, a) => !i || cmp(a[i - 1], s) <= 0);
    for (const x of p.d.added) if (x.on) { cls.students.push(klMake(x.inc, taken)); sum.na++; }
    if (wasSorted && sum.na) cls.students.sort(cmp);
  }
  save(); renderAll(); if ($('classesDlg').open) renderClassList();
  if (silent) return;
  $('klDlg').close();
  toast(`Übernommen: ${sum.nc ? sum.nc + ' neue Klasse(n), ' : ''}${sum.na} neu, ${sum.nch} geändert, ${sum.nr} entfernt`, 4000);
}
$('klApply').onclick = () => klApply(false);

/* ---------- Einstellungen ---------- */
function renderLook() {
  const L = VoceLook.get();
  $('skinGrid').innerHTML = SKINS.map(([k, n, sw]) => `<button type="button" class="skinChip" data-skin="${k}" aria-pressed="${L.skin === k}"><i class="dot" style="--a:${sw[1]};--b:${sw[2]}"></i>${n}</button>`).join('');
  $('modeRow').innerHTML = [['light', 'Hell'], ['dark', 'Dunkel'], ['auto', 'Automatisch']].map(([k, n]) => `<button type="button" data-mode="${k}" aria-pressed="${L.mode === k}" ${L.skin === 'tag' ? 'disabled' : ''}>${n}</button>`).join('');
  $('tagNote').hidden = L.skin !== 'tag';
  if ($('zoomRow')) { $('zoomField').hidden = !(window.native && window.native.setZoom);
    $('zoomRow').innerHTML = [[0.9, 'Kompakt'], [1, 'Normal'], [1.12, 'Groß'], [1.25, 'Sehr groß']].map(([k, n]) => `<button type="button" data-zoom="${k}" aria-pressed="${(+L.zoom || 1) === k}">${n}</button>`).join('');
    document.querySelectorAll('#zoomRow [data-zoom]').forEach(b => b.onclick = () => { VoceLook.set('zoom', +b.dataset.zoom); renderLook(); }); }
  $('fontGrid').innerHTML = VoceLook.FONTS.map(([k, n, ff]) => `<button type="button" class="fontBtn" data-font="${k}" aria-pressed="${L.font === k}" style="font-family:${ff.replace(/"/g, '&quot;')}">${n}</button>`).join('');
  document.querySelectorAll('#skinGrid [data-skin]').forEach(b => b.onclick = () => { VoceLook.set('skin', b.dataset.skin); renderLook(); });
  document.querySelectorAll('#modeRow [data-mode]').forEach(b => b.onclick = () => { VoceLook.set('mode', b.dataset.mode); renderLook(); });
  document.querySelectorAll('#fontGrid [data-font]').forEach(b => b.onclick = () => { VoceLook.set('font', b.dataset.font); renderLook(); });
}
/* Einstellungen in Bereichen: links die Liste, rechts ein Bereich (merkt sich den zuletzt geöffneten) */
let setSecCur = 'look';
function setSec(k) {
  if (k === 'raster') k = 'new';
  setSecCur = k;
  document.querySelectorAll('#setNav [data-sec]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.sec === k)));
  document.querySelectorAll('#setMain .setSec').forEach(s => { s.hidden = s.dataset.sec !== k; });
  $('setMain').scrollTop = 0;
}
document.querySelectorAll('#setNav [data-sec]').forEach(b => b.onclick = () => setSec(b.dataset.sec));
['dfSubject', 'dfStart', 'dfDur', 'dfGap', 'dfBrk', 'dfSize'].forEach(id => $(id).addEventListener('change', () => {
  S.settings.newEx = { subject: $('dfSubject').value, start: $('dfStart').value || '08:00', dur: +$('dfDur').value || 15, gap: Math.max(0, +$('dfGap').value || 0), brk: Math.max(0, +$('dfBrk').value || 0), groupSize: +$('dfSize').value || 2 };
  save();
}));
function openSettings(sec) {
  setSec(sec || setSecCur);
  document.querySelectorAll('.fm').forEach(x => { x.textContent = FILES; });
  renderLook();
  const st = S.settings;
  $('stSchool').value = st.school || ''; $('stExaminer').value = st.examiner || ''; $('stYear').value = st.year || schoolYear();
  const nd = Object.assign({ subject: 'Englisch', start: '08:00', dur: 15, gap: 5, brk: 15, groupSize: 2 }, st.newEx || {});
  $('dfSubject').value = nd.subject; $('dfStart').value = nd.start; $('dfDur').value = nd.dur; $('dfGap').value = nd.gap; $('dfBrk').value = nd.brk; $('dfSize').value = String(nd.groupSize);
  $('stDesc').checked = !!st.showDesc; $('stParent').checked = !!st.parentSig; $('stAi').checked = !!st.ai;
  paintAi();
  if (NATIVE && NATIVE.version) NATIVE.version().then(v => { $('appVersion').textContent = v; });
  paintLogo(); renderMap();
  $('storeInfo').textContent = NATIVE ? `Alle Daten liegen nur auf diesem ${DEVICE} und werden bei jeder Änderung gespeichert; zusätzlich legt die App täglich eine Sicherungskopie an.` : 'Die Daten liegen im Browser dieses Geräts. Bitte regelmäßig eine Sicherung speichern.';
  if (NATIVE && NATIVE.dataPath) NATIVE.dataPath().then(p => { if (p) $('storeInfo').textContent += ` Ordner: ${p}`; });
  bkPaint();
  $('setDlg').showModal();
}
function paintLogo() { const l = S.settings.logo; $('logoBox').innerHTML = l ? `<img src="${l.data}" alt="Schullogo">` : '<span>Kein Logo</span>'; $('logoRemove').disabled = !l; }
function renderMap() {
  const m = S.settings.map; const rows = SEQ_ROWS;
  const opts = v => SCHEME_ORDER.map(k => `<option value="${esc(k)}" ${k === v ? 'selected' : ''}>${esc(k === 'OS' ? 'OS' : k === 'OSB1' ? 'B1 NP' : k === 'B1spb' ? 'B1 spb' : k)}</option>`).join('');
  $('mapTable').innerHTML = `<tr><th></th>${[5, 6, 7, 8, 9, 10, 11, 12, 13].map(j => `<th>${j}</th>`).join('')}</tr>` +
    rows.map(([k, label, js]) => `<tr><td>${label}</td>${[5, 6, 7, 8, 9, 10, 11, 12, 13].map(j => js.includes(j) ? `<td><select data-mk="${k}" data-mj="${j}" title="${esc(SCHEMES[m[k]?.[j]]?.label || '')}">${opts(m[k]?.[j])}</select></td>` : '<td></td>').join('')}</tr>`).join('');
  document.querySelectorAll('[data-mk]').forEach(s => s.onchange = () => { (S.settings.map[s.dataset.mk] ||= {})[s.dataset.mj] = s.value; save(); });
}
$('mapReset').onclick = async () => {
  if (!await ask('Die Voreinstellung für alle Jahrgangsstufen wird auf die ISB-Übersicht (Stand 12/2025) zurückgesetzt. Bereits angelegte Prüfungen bleiben unverändert.', 'Zurücksetzen')) return;
  S.settings.map = JSON.parse(JSON.stringify(DEFAULT_MAP)); save(); renderMap();
};
['stSchool', 'stExaminer', 'stYear'].forEach(id => $(id).oninput = () => { const k = { stSchool: 'school', stExaminer: 'examiner', stYear: 'year' }[id]; S.settings[k] = $(id).value.trim(); save(); });
/* ---------- KI-Anbieter ---------- */
const AI_INFO = {
  anthropic: { key: 'Anthropic-API-Schlüssel (console.anthropic.com)', ph: 'sk-ant-…', hint: 'Claude von Anthropic. Die Nutzung wird über den API-Zugang abgerechnet, ein Claude-Abo gilt dafür nicht.' },
  openai: { key: 'OpenAI-API-Schlüssel (platform.openai.com)', ph: 'sk-…', hint: 'ChatGPT von OpenAI. Die Nutzung wird über den API-Zugang abgerechnet, ein ChatGPT-Abo gilt dafür nicht.' },
  gemini: { key: 'Gemini-API-Schlüssel (Google AI Studio)', ph: 'AIza…', hint: 'Gemini von Google. Der Schlüssel wird in Google AI Studio erstellt.' },
  ollama: { key: '', ph: '', hint: `Läuft vollständig auf diesem ${DEVICE}, es verlassen keine Daten das Gerät. Voraussetzung: Ollama ist installiert (ollama.com) und ein Modell geladen, z. B. im Terminal „ollama pull gemma3“. Dann „Liste laden“ und Modell wählen.` },
};
function aiCfg() { const st = S.settings; const p = st.aiProvider; return { provider: p, key: (st.aiKeys || {})[p] || '', model: (st.aiModels || {})[p] || '', host: st.aiHost || '' }; }
function paintAi() {
  const st = S.settings; const p = st.aiProvider; const inf = AI_INFO[p];
  $('aiBox').hidden = !st.ai;
  document.querySelectorAll('#aiProv button').forEach(b => b.setAttribute('aria-pressed', b.dataset.p === p));
  $('aiKeyField').hidden = p === 'ollama'; $('aiHostField').hidden = p !== 'ollama';
  $('aiKeyLabel').textContent = inf.key; $('stAiKey').placeholder = inf.ph; $('stAiKey').value = (st.aiKeys || {})[p] || '';
  $('stAiHost').value = st.aiHost || ''; $('stAiModel').value = (st.aiModels || {})[p] || ''; $('stAiModel').placeholder = p === 'ollama' ? 'z. B. gemma3' : AI_DEFAULT_MODEL[p];
  $('aiHint').textContent = inf.hint + (p === 'ollama' ? '' : ' Gesendet werden nur Stufe, Punkte und Entwurf – der Name wird vorher durch einen Platzhalter ersetzt. Trotzdem sind es Leistungsdaten: bitte vorab mit der/dem Datenschutzbeauftragten der Schule klären.');
  $('aiStatus').textContent = ''; $('aiModelList').innerHTML = '';
}
const errMsg = err => String((err && err.message) || err).replace(/^Error invoking remote method '[^']+': (Error: )?/, '');
document.querySelectorAll('#aiProv button').forEach(b => b.onclick = () => { S.settings.aiProvider = b.dataset.p; save(); paintAi(); });
$('stAiKey').oninput = () => { (S.settings.aiKeys ||= {})[S.settings.aiProvider] = $('stAiKey').value.trim(); if (KEYS_OK) NATIVE.keys.set(S.settings.aiKeys); save(); };
$('stAiModel').oninput = () => { (S.settings.aiModels ||= {})[S.settings.aiProvider] = $('stAiModel').value.trim(); save(); };
$('stAiHost').oninput = () => { S.settings.aiHost = $('stAiHost').value.trim(); save(); };
$('aiLoadModels').onclick = async () => {
  if (!NATIVE || !NATIVE.aiModels) return toast('Nur in der Desktop-App verfügbar');
  $('aiStatus').textContent = 'Lade Modelle …';
  try { const list = await NATIVE.aiModels(aiCfg()); $('aiModelList').innerHTML = list.map(m => `<option value="${esc(m)}">`).join('');
    $('aiStatus').textContent = list.length ? `${list.length} Modelle gefunden – ins Feld „Modell“ klicken und auswählen` : 'Keine Modelle gefunden';
    if (list.length && !$('stAiModel').value) { $('stAiModel').value = list[0]; $('stAiModel').oninput(); } }
  catch (err) { $('aiStatus').textContent = 'Fehler: ' + errMsg(err); }
};
$('aiTest').onclick = async () => {
  if (!NATIVE || !NATIVE.ai) return toast('Nur in der Desktop-App verfügbar');
  const c = aiCfg(); if (c.provider !== 'ollama' && !c.key) return ($('aiStatus').textContent = 'Bitte zuerst den API-Schlüssel eintragen');
  if (!c.model) return ($('aiStatus').textContent = 'Bitte ein Modell eintragen oder „Liste laden“');
  $('aiStatus').textContent = 'Teste Verbindung …';
  try { const out = await NATIVE.ai({ ...c, prompt: 'Antworte nur mit dem Wort OK.' }); $('aiStatus').textContent = out ? '✓ Verbindung klappt' : 'Keine Antwort erhalten'; }
  catch (err) { $('aiStatus').textContent = 'Fehler: ' + errMsg(err); }
};
$('stDesc').onchange = e => { S.settings.showDesc = e.target.checked; save(); };
$('stParent').onchange = e => { S.settings.parentSig = e.target.checked; save(); };
$('stAi').onchange = e => { S.settings.ai = e.target.checked; save(); paintAi(); };
$('setForm').onsubmit = () => renderAll();
$('addClassBtn').onclick = () => openClassDlg(null);
$('classesBtn').onclick = openClassesDlg;
$('logoPick').onclick = () => $('logoFile').click();
$('logoRemove').onclick = () => { S.settings.logo = null; save(); paintLogo(); };
$('logoFile').onchange = e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  const img = new Image(); const url = URL.createObjectURL(f);
  img.onload = () => {
    const scale = Math.min(1, 600 / Math.max(img.width, img.height)); const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
    const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h);
    S.settings.logo = { data: c.toDataURL('image/png'), w, h }; URL.revokeObjectURL(url); save(); paintLogo(); toast('Logo gespeichert');
  };
  img.onerror = () => toast('Bild konnte nicht gelesen werden'); img.src = url;
};
$('expBtn').onclick = async () => { await Export.saveBytes(new TextEncoder().encode(snap(1)), `Voce-Sicherung ${new Date().toISOString().slice(0, 10)}.json`, 'json'); };
/* ---------- Sicherung: Ordner, „Jetzt sichern“, Wiederherstellen (nur in der Desktop-App) ---------- */
const BK = NATIVE && NATIVE.backup;
const bkAgo = t => { if (!t) return 'noch nie'; const m = Math.round((Date.now() - t) / 60000); if (m < 1) return 'gerade eben'; if (m < 60) return `vor ${m} Min.`; const h = Math.round(m / 60); if (h < 24) return `vor ${h} Std.`; const d = Math.round(h / 24); return d === 1 ? 'gestern' : `vor ${d} Tagen`; };
const bkWhen = t => new Date(t).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
async function bkPaint() {
  $('bkNative').hidden = !BK; if (!BK) return;
  if (NATIVE.update) NATIVE.update.get().then(u => { $('updChk').checked = u.enabled; });
  const st = await BK.status();
  $('bkStatus').textContent = (st.lastLocalError ? `⚠ Die letzte Sicherung auf diesem ${DEVICE} ist fehlgeschlagen (${st.lastLocalError}). Letzte erfolgreiche: ` : `Zuletzt auf diesem ${DEVICE} gesichert: `) + `${bkAgo(st.lastLocal).replace(/\.$/, '')}. ` + (st.backupDir
    ? (st.lastExternalError ? `Sicherungsordner „${st.backupDir}“ nicht erreichbar (${st.lastExternalError}) – ist der Stick angesteckt bzw. der Ordner da?` : `Zusätzlich im Sicherungsordner „${st.backupDir}“: ${bkAgo(st.lastExternal).replace(/\.$/, '')}.`)
    : 'Noch kein Sicherungsordner. Tipp: einen Ordner wählen (z. B. iCloud Drive oder USB-Stick), dann liegt jede Sicherung zusätzlich dort.') + ' Gesichert wird bei Änderungen etwa alle 15 Minuten und beim Beenden.';
  $('bkDirClear').hidden = !st.backupDir;
}
async function bkList() {
  const box = $('bkList'); const list = await BK.list();
  box.innerHTML = list.length ? list.slice(0, 20).map((b, i) => `<div class="bkRow"><span><b>${bkWhen(b.time)}</b> <small class="hint">${esc(b.where)}${/vor-Wiederherstellung/.test(b.name) ? ' · Stand vor einer Wiederherstellung' : ''}</small></span><button type="button" class="mini" data-bk="${i}">Wiederherstellen…</button></div>`).join('') : '<p class="hint">Noch keine Sicherungen.</p>';
  box.querySelectorAll('[data-bk]').forEach(btn => btn.onclick = async () => { const b = list[+btn.dataset.bk]; const r = await BK.read({ name: b.name, where: b.where }); bkRestore(r, bkWhen(b.time)); });
}
async function bkRestore(r, label) {
  if (!r || r.canceled) return;
  if (!r.ok) return toast(r.error || 'Sicherung nicht lesbar');
  let d; try { d = JSON.parse(r.text); } catch (e) { return toast('Datei nicht lesbar'); }
  if (!d || !Array.isArray(d.exams)) return toast('Keine Sicherung dieser App');
  if (!(await ask(`Aktuelle Daten durch die Sicherung vom ${label} ersetzen? Der jetzige Stand wird vorher selbst gesichert.`, 'Wiederherstellen'))) return;
  try { await NATIVE.save(snap()); await BK.beforeRestore(); } catch (e) {}
  S = Object.assign(fresh(), d); S.settings = Object.assign(fresh().settings, d.settings); migrate(); await keysInit(); save(); $('setDlg').close(); renderAll(); toast('Sicherung wiederhergestellt');
}
if (BK) {
  $('bkNow').onclick = async () => { try { await NATIVE.save(snap()); } catch (e) {} const r = await BK.now(); await bkPaint(); paintSideBk(); toast(!r || !r.ok || (!r.local && !r.external) ? '⚠ Sicherung fehlgeschlagen – bitte Speicherort prüfen (Details in den Einstellungen)' : !r.local ? 'Nur im Sicherungsordner gesichert – auf dem ' + DEVICE + ' war es nicht möglich' : r.external ? 'Gesichert – auch im Sicherungsordner' : r.externalError ? 'Nur auf dem ' + DEVICE + ' gesichert – Sicherungsordner nicht erreichbar' : 'Gesichert', 4500); if ($('bkBox').open) bkList(); };
  $('bkDir').onclick = async () => { await BK.chooseDir(); await bkPaint(); };
  $('bkDirClear').onclick = async () => { await BK.clearDir(); await bkPaint(); };
  $('bkOpen').onclick = async () => { const st = await BK.status(); BK.openDir(st.backupDir ? 'external' : 'local'); };
  $('bkBox').ontoggle = () => { if ($('bkBox').open) bkList(); };
  $('bkPick').onclick = async () => { const r = await BK.read({ pick: true }); bkRestore(r, r && r.name ? r.name : 'gewählten Datei'); };
}
$('impBtn').onclick = () => { $('impFile').click(); };
$('impFile').onchange = e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  const fr = new FileReader();
  fr.onload = async () => {
    let d; try { d = JSON.parse(fr.result); } catch (err) { return toast('Datei nicht lesbar'); }
    if (!d.exams && d.classes && !Array.isArray(d.classes)) return toast('Das ist eine Sicherung aus Aula (früher Gruppo). Klassen daraus liest du im Dialog „Klassen & Kurse“ mit „Klassen einlesen …“ ein.', 6000);
    if (!d || !Array.isArray(d.exams)) return toast('Keine Sicherung dieser App');
    if (!(await ask(`Aktuelle Daten durch die Sicherung ersetzen?${BK ? ' Der jetzige Stand wird vorher selbst gesichert.' : ''}`, 'Ersetzen'))) return;
    try { if (NATIVE) await NATIVE.save(snap()); if (BK) await BK.beforeRestore(); } catch (err) {}
    S = Object.assign(fresh(), d); S.settings = Object.assign(fresh().settings, d.settings); migrate(); await keysInit(); save(); $('setDlg').close(); homeView = true; renderAll(); toast('Sicherung eingelesen');
  };
  fr.readAsText(f);
};

/* ---------- Leiste ---------- */
function setTab(t) { homeView = false; S.tab = t; if (t === 'grade') { const ns = nowSlot(exam()); if (ns) exam().cur = ns.i; } document.body.classList.remove('sideOpen'); save(); renderAll(); window.scrollTo(0, 0); }
document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => setTab(b.dataset.tab));
$('examSel').onchange = e => { S.current = e.target.value; picked = null; save(); renderAll(); };
$('newExamBtn').onclick = () => openExamDlg(null);
$('editExamBtn').onclick = () => openExamDlg(exam());
$('settingsBtn').onclick = openSettings;
const openHelp = () => { if (NATIVE && NATIVE.openDoc) NATIVE.openDoc('help'); else window.open('help.html', '_blank'); };
Druck.init();
$('helpBtn').onclick = openHelp; $('helpOpen').onclick = openHelp;
$('helpPdf').onclick = () => { if (NATIVE && NATIVE.helpPdf) NATIVE.helpPdf(); else toast('Nur in der Desktop-App verfügbar'); };
async function openLicenses() {
  let txt = 'Lizenzen werden in der Desktop-App angezeigt.';
  try { if (NATIVE && NATIVE.licenses) txt = await NATIVE.licenses(); } catch (e) {}
  $('licText').textContent = txt; $('licDlg').showModal();
}
$('licBtn').onclick = openLicenses;
$('licChromium').onclick = () => { if (NATIVE && NATIVE.openDoc) NATIVE.openDoc('chromium'); };
document.addEventListener('keydown', e => {
  if (S.tab !== 'grade' || homeView || document.querySelector('dialog[open]') || /TEXTAREA|INPUT|SELECT/.test(document.activeElement.tagName)) return;
  const ex = exam(); if (!ex) return;
  if (e.key === 'ArrowRight' && ex.cur < ex.groups.length - 1) { ex.cur++; save(); renderGrade(); }
  if (e.key === 'ArrowLeft' && ex.cur > 0) { ex.cur--; save(); renderGrade(); }
});
if (NATIVE && NATIVE.onMenu) NATIVE.onMenu(cmd => { if (cmd === 'settings') openSettings(); if (cmd === 'new') openExamDlg(null); if (cmd === 'backup') $('expBtn').click(); if (cmd === 'classes') openClassesDlg(); if (cmd === 'licenses') openLicenses(); });

/* Hinweis auf neue Version (nur Mac/Windows-App, abschaltbar) */
const UPD = NATIVE && NATIVE.update;
function showUpd(u) { $('updNote').hidden = !u; if (u) { $('updTxt').textContent = `Neue Version ${u.version} verfügbar. Deine Klassen und Prüfungen bleiben beim Aktualisieren erhalten. –`; $('updGet').href = u.url; } }
if (UPD) {
  $('updChk').onchange = e => { UPD.set(e.target.checked); if (!e.target.checked) showUpd(null); else UPD.check().then(showUpd).catch(() => {}); };
  $('updX').onclick = () => showUpd(null);
}
loadState().then(() => { if (!exam() && S.exams[0]) S.current = S.exams[0].id; renderAll(); if (UPD) UPD.check().then(showUpd).catch(() => {}); });
