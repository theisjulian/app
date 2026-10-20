/* forza – Feiertage und Schulferien (Bayern), Urlaub, Umschalter auf der Startseite */
(function () {
  'use strict';
  const F = window.F, esc = F.esc;

  /* ---------- Feiertage Bayern (berechnet) ---------- */
  const pad = (n) => String(n).padStart(2, '0'), iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
  const addD = (ds, n) => { const d = new Date(ds + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d.getFullYear(), d.getMonth() + 1, d.getDate()); };
  const easter = (y) => { const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1; return iso(y, mo, da); };
  const cache = {};
  const feiertage = (y) => {
    if (cache[y]) return cache[y]; const e = easter(y), m = {};
    const set = (d, n, reg) => (m[d] = { n, reg: !!reg });
    set(iso(y, 1, 1), 'Neujahr'); set(iso(y, 1, 6), 'Heilige Drei Könige'); set(addD(e, -2), 'Karfreitag'); set(addD(e, 1), 'Ostermontag'); set(iso(y, 5, 1), 'Tag der Arbeit');
    set(addD(e, 39), 'Christi Himmelfahrt'); set(addD(e, 50), 'Pfingstmontag'); set(addD(e, 60), 'Fronleichnam'); set(iso(y, 8, 15), 'Mariä Himmelfahrt (nur in manchen Gemeinden)', true);
    set(iso(y, 10, 3), 'Tag der Deutschen Einheit'); set(iso(y, 11, 1), 'Allerheiligen'); set(iso(y, 12, 25), '1. Weihnachtstag'); set(iso(y, 12, 26), '2. Weihnachtstag');
    return (cache[y] = m);
  };
  /* Schulferien Bayern (Quelle: km.bayern.de; weitere Jahre folgen, sobald veröffentlicht) */
  const FERIEN = [
    ['Winterferien', '2025-03-03', '2025-03-07'], ['Osterferien', '2025-04-14', '2025-04-25'], ['Pfingstferien', '2025-06-10', '2025-06-20'], ['Sommerferien', '2025-08-01', '2025-09-15'], ['Herbstferien', '2025-11-03', '2025-11-07'], ['Weihnachtsferien', '2025-12-22', '2026-01-05'],
    ['Winterferien', '2026-02-16', '2026-02-20'], ['Osterferien', '2026-03-30', '2026-04-10'], ['Pfingstferien', '2026-05-26', '2026-06-05'], ['Sommerferien', '2026-08-03', '2026-09-14'], ['Herbstferien', '2026-11-02', '2026-11-06'], ['Weihnachtsferien', '2026-12-24', '2027-01-08'],
    ['Winterferien', '2027-02-08', '2027-02-12'], ['Osterferien', '2027-03-22', '2027-04-02'], ['Pfingstferien', '2027-05-18', '2027-05-28'], ['Sommerferien', '2027-08-02', '2027-09-13']
  ];
  F.holiday = (ds) => { const ft = feiertage(+ds.slice(0, 4))[ds] || null; const fe = FERIEN.find((f) => f[1] <= ds && f[2] >= ds) || null; return { ft: ft && ft.n, ftReg: ft && ft.reg, fe: fe && fe[0] }; };

  /* ---------- Urlaub / Abwesenheit ---------- */
  const KIND = { pause: 'Pause', krank: 'Krank', schmerz: 'Schmerz', reise: 'Unterwegs', urlaub: 'Urlaub', ski: 'Skiurlaub' };
  const MODE = { eigengewicht: 'Eigengewicht & Bänder (Calisthenics)', frei: 'Kein Training, Erholung', studio: 'Hotel-Gym oder Studio, alle Geräte' };
  F.absMode = (ds) => (F.S.absences.find((a) => a.from_date <= ds && a.to_date >= ds && ['urlaub', 'ski'].includes(a.kind)) || null);
  const absForm = (d) => `<label class="f"><span>Art</span><select id="a-kind"><option value="urlaub">Urlaub</option><option value="ski">Skiurlaub</option><option value="reise">Unterwegs (Reise, Dienstreise)</option><option value="pause">Pause</option><option value="krank">Krank</option><option value="schmerz">Schmerz</option></select></label>
    <div class="row gap"><label class="f grow"><span>Von</span><input id="a-from" type="date" value="${d}"></label><label class="f grow"><span>Bis</span><input id="a-to" type="date" value="${d}"></label></div>
    <label class="f" id="a-modebox"><span>Training im Urlaub</span><select id="a-mode"><option value="eigengewicht">${MODE.eigengewicht}</option><option value="frei">${MODE.frei}</option><option value="studio">${MODE.studio}</option></select></label>
    <label class="f"><span>Ort oder Notiz (optional)</span><input id="a-note" type="text" placeholder="z. B. Südfrankreich"></label>
    <button class="btn pri block" data-act="saveAbs">Speichern</button>`;
  const baseAdd = F.acts.addEntry;
  F.acts.addEntry = (t) => { baseAdd(t); const box = document.getElementById('e-abs'); if (box) box.innerHTML = absForm(t.dataset.d); const b = document.querySelector('.modal .seg button[data-v=abs]'); if (b) b.textContent = 'Urlaub · Pause · Krank'; };
  document.addEventListener('change', (e) => { if (e.target && e.target.id === 'a-kind') { const box = document.getElementById('a-modebox'); if (box) box.classList.toggle('hide', !['urlaub', 'ski'].includes(e.target.value)); } });
  F.acts.saveAbs = async () => {
    const from = document.getElementById('a-from').value, to = document.getElementById('a-to').value, kind = document.getElementById('a-kind').value;
    if (!from || !to || to < from) return F.toast('Bitte einen gültigen Zeitraum wählen.');
    const mode = ['urlaub', 'ski'].includes(kind) ? document.getElementById('a-mode').value : null;
    await F.insert('absences', { from_date: from, to_date: to, kind, mode, note: document.getElementById('a-note').value || null });
    F.closeModal(); await F.refresh(); F.toast('Gespeichert');
  };
  F.acts.addUrlaub = () => { const d = (F.ui.cal && F.ui.cal.sel) || F.today(); F.acts.addEntry({ dataset: { d } }); F.acts.entryTab(document.querySelector('.modal .seg button[data-v=abs]')); };

  /* ---------- Kalender: Feiertage, Ferien, Urlaub dezent ---------- */
  const baseKal = F.views.kalender;
  F.views.kalender = () => {
    const box = document.createElement('div'); box.innerHTML = baseKal(); const c = F.ui.cal, evs = [];
    box.querySelectorAll('.cal .d[data-d]').forEach((el) => {
      const ds = el.dataset.d, h = F.holiday(ds), ab = F.absMode(ds);
      if (h.ft && !h.ftReg) el.classList.add('ft'); if (h.fe) el.classList.add('fe'); if (ab) el.classList.add('ur');
      if (h.ft || h.fe || ab) el.title = [h.ft, h.fe, ab && KIND[ab.kind]].filter(Boolean).join(' · ');
    });
    if (c.y !== null) {
      const days = new Date(c.y, c.m + 1, 0).getDate(), seen = new Set();
      for (let d = 1; d <= days; d++) { const ds = iso(c.y, c.m + 1, d), h = F.holiday(ds); if (h.ft && !h.ftReg) evs.push(`${d}.${c.m + 1}. ${h.ft}`); if (h.fe && !seen.has(h.fe)) { seen.add(h.fe); evs.push(h.fe); } }
    }
    const cal = box.querySelector('.cal');
    const legend = `<div class="cal-leg"><span><i class="lg ft"></i>Feiertag</span><span><i class="lg fe"></i>Schulferien</span><span><i class="lg ur"></i>Urlaub</span></div>${evs.length ? `<div class="small mute" style="margin:8px 2px 0">${esc(evs.join(' · '))}</div>` : ''}<button class="btn ghost block" style="margin:14px 0 6px" data-act="addUrlaub">+ Urlaub oder Abwesenheit eintragen</button>`;
    if (cal) cal.insertAdjacentHTML('afterend', legend); else box.insertAdjacentHTML('beforeend', legend);
    return box.innerHTML;
  };
  const baseSel = F.acts.calSel;
  F.acts.calSel = (t) => {
    baseSel(t); const ds = t.dataset.d, h = F.holiday(ds), ab = F.absMode(ds), m = document.querySelector('#modal > div .h2');
    const lines = [h.ft && `${h.ft}${h.ftReg ? '' : ' (Feiertag in Bayern)'}`, h.fe && `${h.fe} in Bayern`, ab && `${KIND[ab.kind]} · ${MODE[ab.mode] || MODE.eigengewicht}`].filter(Boolean);
    if (m && lines.length) m.insertAdjacentHTML('afterend', `<div class="small mute" style="margin:-4px 0 6px">${lines.map(esc).join(' · ')}</div>`);
  };

  /* ---------- Startseite: Urlaubshinweis + Umschalter ---------- */
  const ICON = { klassisch: '<rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="13" width="8" height="7" rx="2"/><rect x="13" y="13" width="8" height="7" rx="2"/>', fokus: '<rect x="3" y="4" width="18" height="12" rx="3"/><path d="M8 20h8"/>', woche: '<circle cx="9" cy="12" r="6"/><path d="M17 8v8M21 11v5"/>', training: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>' };
  const NAMES = { klassisch: 'Klassisch', fokus: 'Fokus', woche: 'Woche', training: 'Training' };
  const baseH = F.views.heute;
  F.views.heute = (a) => {
    const box = document.createElement('div'); box.innerHTML = baseH(a); const cur = F.look().dash || F.defDash(), today = F.today();
    const first = box.querySelector('.row.between');
    if (first) { first.style.position = 'relative'; first.insertAdjacentHTML('beforeend', `<div class="dashseg" role="group" aria-label="Ansicht">${Object.keys(ICON).map((k) => `<button class="${k === cur ? 'on' : ''}" data-act="dash" data-v="${k}" aria-label="${NAMES[k]}" title="${NAMES[k]}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</svg></button>`).join('')}</div>`); }
    const now = F.absMode(today), nxt = !now && F.S.absences.filter((x) => ['urlaub', 'ski'].includes(x.kind) && x.from_date > today).sort((p, q) => (p.from_date < q.from_date ? -1 : 1))[0];
    let note = '';
    if (now) note = `<div class="card ur-card"><div class="eyebrow">${KIND[now.kind]}${now.note ? ' · ' + esc(now.note) : ''}</div><div style="margin-top:4px"><b>Bis ${F.dshort(now.to_date)}</b> · <span class="mute">${MODE[now.mode] || MODE.eigengewicht}</span></div></div>`;
    else if (nxt) { const n = Math.round((F.dparse(nxt.from_date) - F.dparse(today)) / 864e5); if (n <= 14) note = `<div class="small mute" style="margin:-6px 2px 12px">${KIND[nxt.kind]}${nxt.note ? ' (' + esc(nxt.note) + ')' : ''} in ${n} ${n === 1 ? 'Tag' : 'Tagen'}</div>`; }
    if (note && first) first.insertAdjacentHTML('afterend', note);
    return box.innerHTML;
  };
})();
