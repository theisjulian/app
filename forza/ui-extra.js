/* forza · Erweiterungen: Würfeln, Einstellungen, Training-Hub, Fortschritt mit Zeiträumen, PDF-Export */
(function () {
  const F = window.F, E = F.E, esc = F.esc;
  const RIDE = ['Ride', 'VirtualRide', 'GravelRide', 'MountainBikeRide', 'EBikeRide'], HIKE = ['Hike', 'Walk'];
  const arrow = F.icon.chev.replace('<svg', '<svg width="18" height="18" style="stroke:var(--mute);fill:none;stroke-width:2"');
  F.icon.dice = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="15" r="1" fill="currentColor"/><circle cx="15" cy="15" r="1" fill="currentColor"/></svg>';

  /* ---------- Würfeln: Alternativen anbieten, feste Reihenfolge bleibt Standard ---------- */
  F.acts.reroll = () => {
    const t = F.today(), sg = F.suggestion();
    F.ls.set('avoid-' + t, (sg.items || []).map((i) => i.exercise_id));
    F.ls.set('variant-' + t, (F.ls.get('variant-' + t, 0) || 0) + 1);
    F.render(); if (F.fx && F.fx.pulse) F.fx.pulse(); F.toast('Andere Übungen gewählt');
  };
  F.acts.swapOne = (t) => { const k = 'excl-' + F.today(), a = F.ls.get(k, []); a.push(t.dataset.id); F.ls.set(k, a); F.render(); F.toast('Ersatz gewählt'); };
  F.acts.rerollReset = () => { const t = F.today(); F.ls.set('variant-' + t, 0); F.ls.set('avoid-' + t, []); F.ls.set('excl-' + t, []); F.render(); };

  /* ---------- Einstellungen: Darstellung sofort sichtbar ---------- */
  const THEMES = [['graphit', 'Graphit', '#c8f542', '#141922'], ['neon', 'Neon', '#ff4fb0', '#6a3ff0'], ['laguna', 'Laguna', '#2cc4d0', '#0b5f69'], ['klar', 'Klar', '#4f9bff', '#0a64e0'], ['glut', 'Glut', '#ffb067', '#ef4f1c'], ['wald', 'Wald', '#6fe29b', '#12853f']];
  const FONTS = [['standard', 'Standard', 'Geist'], ['rund', 'Rund', 'Nunito'], ['klassisch', 'Klassisch', 'Lora'], ['technisch', 'Technisch', 'Space Grotesk'], ['lesbar', 'Gut lesbar', 'Atkinson Hyperlegible'], ['geometrisch', 'Geometrisch', 'Jost']];
  const lookCards = () => {
    const l = F.look();
    return `<div class="card"><div class="eyebrow" style="margin-bottom:8px">Farbe</div><div class="row wrap gap">${THEMES.map(([k, n, c, c2]) => `<button class="chip ${l.theme === k ? 'on' : ''}" data-act="look" data-k="theme" data-v="${k}"><i style="width:16px;height:16px;border-radius:50%;background:linear-gradient(135deg,${c},${c2});display:inline-block"></i>${n}</button>`).join('')}</div>
      <div class="eyebrow" style="margin:16px 0 8px">Modus</div><div class="seg">${[['Hell', 'light'], ['Dunkel', 'dark'], ['Automatisch', 'auto']].map(([n, v]) => `<button class="${l.mode === v ? 'on' : ''}" data-act="look" data-k="mode" data-v="${v}">${n}</button>`).join('')}</div>
      <div class="eyebrow" style="margin:16px 0 8px">Schrift</div><div class="row wrap gap">${FONTS.map(([k, n, f]) => `<button class="fbtn ${l.font === k ? 'on' : ''}" style="font-family:'${f}',sans-serif" data-act="look" data-k="font" data-v="${k}">${n}</button>`).join('')}</div>
      <div class="eyebrow" style="margin:16px 0 8px">Startseite</div><div class="dashpick">${DASH.map(([k, n, s]) => `<button class="dp ${(l.dash || 'klassisch') === k ? 'on' : ''}" data-act="dash" data-v="${k}" aria-pressed="${(l.dash || 'klassisch') === k}">${PREV[k]}<b>${n}</b><span>${s}</span></button>`).join('')}</div>
      <div class="row between" style="margin-top:16px"><div><b>Animationen</b><div class="small mute">Weiche Übergänge, Konfetti, Bewegungsskizzen</div></div><button class="sw ${l.anim ? 'on' : ''}" role="switch" aria-checked="${!!l.anim}" data-act="lookAnim"><i></i></button></div></div>`;
  };
  F.views.m_darstellung = () => `<button class="back" data-act="nav" data-r="mehr">${F.icon.back.replace('<svg', '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"')} Einstellungen</button><div class="h1" style="margin-bottom:12px">Darstellung</div>${lookCards()}`;
  const baseMehr = F.views.mehr;
  F.views.mehr = (args) => {
    const [sub] = args || [];
    if (sub) return baseMehr(args);
    return baseMehr(args).replace('<div class="h1" style="margin-bottom:14px">Mehr</div>', `<div class="h1" style="margin-bottom:14px">Einstellungen</div><div class="eyebrow" style="margin:0 2px 8px">Darstellung</div>${lookCards()}<div class="eyebrow" style="margin:6px 2px 8px">Training & Konto</div>`)
      .replace(/<button class="it" data-act="nav" data-r="mehr\/darstellung">[\s\S]*?<\/button>/, '');
  };

  /* ---------- Training: Zentrale ---------- */
  F.ui.tr = F.ui.tr || { ei: 0 };
  const baseTraining = F.views.training;
  const setLine = (se) => (se.sets || []).filter((x) => x.done).map((x) => (x.load_kg !== null ? F.fmt(Number(x.load_kg)) + ' kg × ' : '') + (x.reps !== null ? x.reps : (x.secs ? x.secs + ' s' : '?'))).join(' · ');
  F.views.training = () => {
    if (F.openSession()) return baseTraining();
    const S = F.S, sg = F.suggestion();
    const done = S.sessions.filter((x) => x.kind === 'kraft' && ['gefuehrt', 'bestaetigt'].includes(x.status)).sort((a, b) => (a.session_date < b.session_date ? 1 : -1));
    const card = (ic, t, s, act, extra = '') => `<button class="it" data-act="${act}" ${extra}><div class="ico">${ic}</div><div class="grow"><b>${t}</b><div class="small mute">${s}</div></div>${arrow}</button>`;
    return `<div class="h1" style="margin-bottom:4px">Training</div><p class="mute" style="margin-top:0">Hier startest du eine Einheit und siehst, was du schon gemacht hast.</p>
      <div class="card list">
        ${sg.rest || sg.empty ? '' : card(F.icon.dumb, `Vorschlag starten: ${esc(sg.title)}`, `ca. ${sg.minutes} min · ${sg.items.length} Übungen`, 'start')}
        ${card(F.icon.kalender, 'Anderen Tag wählen', 'Oberkörper, Unterkörper, Push …', 'pickDay')}
        ${card(F.icon.heute, 'Nur Haltung & Mobilität', 'ca. 8 Minuten', 'startPosture')}
        ${card(F.icon.plus, 'Einheit nachtragen', 'Auch für frühere Tage', 'addEntry', `data-d="${F.today()}"`)}
      </div>
      <div class="card"><div class="h2">Bisherige Einheiten</div>${done.slice(0, 20).map((x) => `<details class="hist"><summary><div class="grow"><b>${esc(x.title || 'Training')}</b><div class="small mute">${F.dlabel(x.session_date)}${x.duration_min ? ' · ' + x.duration_min + ' min' : ''}${x.session_exercises.length ? ' · ' + x.session_exercises.length + ' Übungen' : ' · Details unbekannt'}</div></div></summary>${x.session_exercises.length ? x.session_exercises.map((se) => `<div class="small" style="padding:4px 0"><b>${esc((S.exById[se.exercise_id] || {}).name || '?')}</b><div class="mute">${setLine(se) || 'keine Sätze erfasst'}</div></div>`).join('') : '<div class="small mute" style="padding:4px 0">Zu dieser Einheit sind keine Übungen oder Sätze bekannt. Du kannst sie über „Einheit nachtragen“ ergänzen oder die Einheit so lassen.</div>'}</details>`).join('') || '<div class="mute">Noch nichts.</div>'}</div>`;
  };

  /* ---------- Fortschritt: Zeiträume ---------- */
  const RANGES = [['woche', 'Diese Woche'], ['monat', 'Dieser Monat'], ['3m', '3 Monate'], ['6m', '6 Monate'], ['jahr', 'Seit Jahresbeginn'], ['alles', 'Alles']];
  const rangeFrom = (k, today) => {
    const d = F.dparse(today);
    if (k === 'woche') return F.addDays(today, -((d.getDay() + 6) % 7));
    if (k === 'monat') return today.slice(0, 8) + '01';
    if (k === '3m') return F.addDays(today, -91);
    if (k === '6m') return F.addDays(today, -182);
    if (k === 'jahr') return today.slice(0, 4) + '-01-01';
    return '2000-01-01';
  };
  const rangeName = (k) => (RANGES.find((r) => r[0] === k) || [])[1];
  F.ui.prog = F.ui.prog || { ex: null };
  const stats = (k) => {
    const S = F.S, today = F.today(), from = rangeFrom(k, today), W = F.weightNow();
    const ses = S.sessions.filter((s) => s.kind === 'kraft' && ['gefuehrt', 'bestaetigt'].includes(s.status) && s.session_date >= from && s.session_date <= today);
    const acts = S.activities.filter((a) => a.start_at.slice(0, 10) >= from && a.start_at.slice(0, 10) <= today);
    let sets = 0, vol = 0, noData = 0; const muscle = {}, lifts = {};
    for (const s of ses) {
      if (!s.session_exercises.length) { noData++; continue; }
      for (const se of s.session_exercises) {
        const ex = S.exById[se.exercise_id]; if (!ex) continue;
        for (const x of se.sets.filter((q) => q.done)) {
          sets++; if (x.load_kg !== null && x.reps !== null) vol += Number(x.load_kg) * x.reps;
          if (ex.dosage_profile !== 'M') ex.muscles_primary.forEach((m) => (muscle[m] = (muscle[m] || 0) + 1));
          if (x.load_kg !== null && x.reps !== null && !['koerper', 'zeit'].includes(ex.load_convention)) {
            const e1 = E.e1rm(Number(x.load_kg), x.reps); const l = (lifts[ex.id] = lifts[ex.id] || { name: ex.name, first: null, best: 0, firstD: s.session_date, lastD: s.session_date });
            if (l.first === null) l.first = e1; if (e1 > l.best) l.best = e1; l.lastD = s.session_date;
          }
        }
      }
    }
    const rides = acts.filter((a) => RIDE.includes(a.sport)), hikes = acts.filter((a) => HIKE.includes(a.sport));
    const sum = (arr, f) => arr.reduce((t, a) => t + (Number(f(a)) || 0), 0);
    const kcal = acts.reduce((t, a) => t + E.energy(a, W).kcal, 0);
    const days = new Set([...ses.map((s) => s.session_date), ...acts.map((a) => a.start_at.slice(0, 10))]).size;
    // Wochenbalken
    const wk = []; const start = k === 'alles' ? (ses.concat([]).map((s) => s.session_date).sort()[0] || F.addDays(today, -56)) : from;
    let a = F.addDays(start, -((F.dparse(start).getDay() + 6) % 7)); let guard = 0;
    while (a <= today && guard++ < 60) { const b = F.addDays(a, 6); wk.push({ l: F.dshort(a), kraft: ses.filter((s) => s.session_date >= a && s.session_date <= b).length, rad: rides.filter((x) => x.start_at.slice(0, 10) >= a && x.start_at.slice(0, 10) <= b).length, wan: hikes.filter((x) => x.start_at.slice(0, 10) >= a && x.start_at.slice(0, 10) <= b).length }); a = F.addDays(a, 7); }
    return { k, from, today, ses, acts, sets, vol: Math.round(vol), noData, muscle, lifts: Object.values(lifts).filter((l) => l.first !== null), rides, hikes, kcal: Math.round(kcal), days,
      kraftMin: sum(ses, (s) => s.duration_min), rideKm: sum(rides, (x) => x.distance_m) / 1000, rideH: sum(rides, (x) => x.moving_s) / 3600, rideKj: sum(rides, (x) => x.kilojoules), hikeKm: sum(hikes, (x) => x.distance_m) / 1000, hikeUp: sum(hikes, (x) => x.elevation_m), wk };
  };
  F.progStats = stats;
  const kpi = (n, l) => `<div class="kpi"><b data-count="${n}">${n}</b><span>${l}</span></div>`;
  const lineChart = (pts) => {
    if (pts.length < 2) return '<div class="mute small">Noch zu wenig Daten für einen Verlauf.</div>';
    const W = 320, H = 150, p = 28, xs = pts.map((q) => new Date(q.d).getTime()), ys = pts.map((q) => q.v);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys) * 0.97, y1 = Math.max(...ys) * 1.03 || 1;
    const X = (v) => p + (x1 === x0 ? 0 : (v - x0) / (x1 - x0)) * (W - p - 8), Y = (v) => H - p - (y1 === y0 ? 0 : (v - y0) / (y1 - y0)) * (H - p - 10);
    return `<svg class="chart" viewBox="0 0 ${W} ${H}"><line class="gr" x1="${p}" x2="${W - 8}" y1="${H - p}" y2="${H - p}"/><text x="2" y="${Y(y1) + 8}">${Math.round(y1)}</text><text x="2" y="${Y(y0)}">${Math.round(y0)}</text><polyline class="ln" points="${pts.map((q, i) => X(xs[i]) + ',' + Y(q.v)).join(' ')}"/>${pts.map((q, i) => `<circle class="pt" cx="${X(xs[i])}" cy="${Y(q.v)}" r="3.2"/>`).join('')}<text x="${p}" y="${H - 8}">${F.dshort(pts[0].d)}</text><text x="${W - 8}" y="${H - 8}" text-anchor="end">${F.dshort(pts[pts.length - 1].d)}</text></svg>`;
  };
  F.views.fortschritt = () => {
    const S = F.S, k = F.ls.get('range', 'monat'), st = stats(k);
    const mx = Math.max(3, ...st.wk.map((w) => w.kraft + w.rad + w.wan));
    const mus = Object.entries(st.muscle).sort((a, b) => b[1] - a[1]), mm = Math.max(1, ...mus.map((m) => m[1]));
    // Kraftverlauf je Übung (gesamt)
    const byEx = {};
    for (const s of S.sessions) if (['gefuehrt', 'bestaetigt'].includes(s.status)) for (const se of s.session_exercises) {
      const ex = S.exById[se.exercise_id]; if (!ex) continue;
      const dn = se.sets.filter((x) => x.done && x.load_kg !== null && x.reps !== null && !['koerper', 'zeit'].includes(ex.load_convention)); if (!dn.length) continue;
      (byEx[se.exercise_id] = byEx[se.exercise_id] || []).push({ d: s.session_date, v: Math.round(Math.max(...dn.map((x) => E.e1rm(Number(x.load_kg), x.reps) || 0)) * 10) / 10 });
    }
    const ids = Object.keys(byEx); const sel = F.ui.prog.ex && byEx[F.ui.prog.ex] ? F.ui.prog.ex : ids[0];
    const weights = S.weights.map((w) => ({ d: w.measured_on, v: Number(w.weight_kg) }));
    return `<div class="row between" style="margin-bottom:12px"><div class="h1">Fortschritt</div><button class="btn sm" data-act="pdf">PDF</button></div>
      <div class="rangebar">${RANGES.map(([v, l]) => `<button class="chip ${k === v ? 'on' : ''}" data-act="range" data-v="${v}">${l}</button>`).join('')}</div>
      <div class="kpis">${kpi(st.ses.length, 'Krafteinheiten')}${kpi(st.rides.length, 'Radfahrten')}${kpi(st.hikes.length, 'Wanderungen')}${kpi(st.days, 'aktive Tage')}</div>
      <div class="card"><div class="kv"><span class="mute">Sätze mit Daten</span><b>${st.sets}</b><span class="mute">Gesamtvolumen</span><b>${st.vol ? F.fmt(st.vol) + ' kg' : 'unbekannt'}</b><span class="mute">Krafttraining Dauer</span><b>${st.kraftMin ? st.kraftMin + ' min' : 'unbekannt'}</b><span class="mute">Rad</span><b>${st.rides.length ? F.fmt(Math.round(st.rideKm)) + ' km · ' + F.fmt(Math.round(st.rideH * 10) / 10) + ' h' : '–'}</b><span class="mute">Wandern</span><b>${st.hikes.length ? F.fmt(Math.round(st.hikeKm)) + ' km · ' + Math.round(st.hikeUp) + ' hm' : '–'}</b><span class="mute">Energie (Schätzung)</span><b>${st.kcal ? '≈ ' + F.fmt(st.kcal) + ' kcal' : '–'}</b></div>${st.noData ? `<div class="small mute" style="margin-top:8px">${st.noData} Einheit${st.noData > 1 ? 'en' : ''} ohne Satzdaten (übernommen). Sie zählen bei Einheiten, aber nicht bei Sätzen oder Volumen.</div>` : ''}</div>
      <div class="card"><div class="h2">Wochen · ${rangeName(k)}</div><div class="row" style="align-items:flex-end;gap:6px;height:110px;overflow-x:auto">${st.wk.map((w) => `<div class="grow" style="text-align:center;min-width:28px"><div style="display:flex;flex-direction:column;justify-content:flex-end;height:80px;gap:2px"><div style="height:${w.wan / mx * 80}px;background:#e9a23b;border-radius:5px"></div><div style="height:${w.rad / mx * 80}px;background:#6aa9ff;border-radius:5px"></div><div class="bargrow" style="height:${w.kraft / mx * 80}px;background:var(--a);border-radius:5px"></div></div><div class="small mute" style="font-size:10px">${w.l}</div></div>`).join('')}</div><div class="small mute" style="margin-top:8px">Grün Kraft · Blau Rad · Orange Wandern</div></div>
      <div class="card"><div class="h2">Sätze je Muskelgruppe</div>${mus.length ? mus.map(([m, n]) => `<div class="mrow"><span>${E.LABEL[m] || m}</span><div class="bar"><i class="grow" style="width:${n / mm * 100}%"></i></div><b>${n}</b></div>`).join('') : '<div class="mute small">In diesem Zeitraum gibt es noch keine Sätze mit Daten.</div>'}</div>
      <div class="card"><div class="h2">Kraftverlauf</div>${ids.length ? `<label class="f"><select data-in="progEx">${ids.map((id) => `<option value="${id}" ${id === sel ? 'selected' : ''}>${esc(S.exById[id].name)}</option>`).join('')}</select></label>${lineChart(byEx[sel])}<div class="small mute">Geschätzte Maximalkraft (Epley) aus dem besten Satz je Einheit.</div>` : '<div class="mute">Sobald du Sätze mit Gewicht und Wiederholungen protokollierst, erscheint hier dein Verlauf. Aus übernommenen Einheiten gibt es bewusst keine Werte.</div>'}</div>
      <div class="card"><div class="row between"><div class="h2">Körpergewicht</div><button class="btn sm" data-act="addWeight">Eintragen</button></div>${lineChart(weights)}<div class="small mute">Zuletzt ${F.fmt(F.weightNow())} kg${weights.length ? ' am ' + F.dshort(weights[weights.length - 1].d) : ''}.</div></div>`;
  };
  F.acts.range = (t) => { F.ls.set('range', t.dataset.v); F.render(); };

  /* ---------- PDF ---------- */
  const loadScript = (src) => new Promise((res, rej) => { if (window.jspdf) return res(); const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('PDF-Baustein nicht ladbar')); document.head.appendChild(s); });
  const toDataUrl = async (u) => { const b = await (await fetch(u)).blob(); return new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(b); }); };

  const footer = (pdf, logo) => {
    const pages = pdf.getNumberOfPages();
    for (let n = 1; n <= pages; n++) {
      pdf.setPage(n); pdf.setDrawColor(175, 184, 193); pdf.setLineWidth(.2); pdf.line(16, 278, 194, 278); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6.5); pdf.setTextColor(119, 125, 134);
      pdf.text('Persönliche Trainingsdaten · Kalorien sind Schätzungen.', 16, 283); pdf.text('forza · theisapps.de/forza', 16, 287); pdf.text('Seite ' + n + ' / ' + pages, 194, 283, { align: 'right' }); pdf.text('© 2026', 175, 289.4, { align: 'right' });
      if (logo) pdf.addImage(logo, 'PNG', 178, 285.2, 16, 5.05);
    }
  };
  const ACC = [77, 107, 0], INK = [24, 28, 36], MUTE = [110, 118, 130], LINE = [214, 219, 226];
  const dd = (s) => s.slice(8, 10) + '.' + s.slice(5, 7) + '.' + s.slice(0, 4);
  /* kleines Dokument-Gerüst für alle weiteren Exporte */
  const newDoc = (title, st) => {
    const { jsPDF } = window.jspdf, pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true }); let y = 20;
    const d = { pdf, get y() { return y; }, set y(v) { y = v; },
      need(h) { if (y + h > 272) { pdf.addPage(); y = 20; } },
      head(t) { d.need(14); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12); pdf.setTextColor(...INK); pdf.text(t, 16, y); y += 2; pdf.setDrawColor(...ACC); pdf.setLineWidth(.6); pdf.line(16, y, 36, y); y += 6; },
      line(txt, o = {}) { d.need(o.h || 5.5); pdf.setFont('helvetica', o.bold ? 'bold' : 'normal'); pdf.setFontSize(o.size || 9.5); pdf.setTextColor(...(o.color || INK)); pdf.text(String(txt), o.x || 16, y); y += o.h || 5.5; },
      row(cols, o = {}) { d.need(o.h || 6); pdf.setFont('helvetica', o.bold ? 'bold' : 'normal'); pdf.setFontSize(o.size || 9); pdf.setTextColor(...(o.color || INK)); cols.forEach(([t, x, al]) => pdf.text(String(t), x, y, al ? { align: al } : undefined)); y += o.h || 6; if (o.rule) { pdf.setDrawColor(...LINE); pdf.setLineWidth(.15); pdf.line(16, y - 4, 194, y - 4); } } };
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(22); pdf.setTextColor(...INK); pdf.text('forza', 16, y); pdf.setFontSize(11); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...MUTE);
    const name = (F.S.profile && F.S.profile.display_name) || '';
    pdf.text(title + (name ? ' · ' + name : ''), 16, y + 7); pdf.text(rangeName(st.k) + ' · ' + (st.k === 'alles' ? 'bis ' : dd(st.from) + ' – ') + dd(st.today), 16, y + 13); y += 24;
    return d;
  };
  const setTxt = (x) => (x.load_kg !== null ? F.fmt(Number(x.load_kg)) + ' kg × ' : '') + (x.reps !== null ? x.reps : x.seconds ? x.seconds + ' s' : '?') + (x.rir !== null && x.rir !== undefined ? ' (Reserve ' + x.rir + ')' : '') + (x.pain ? ' · Schmerz' : '');
  const exHist = (st) => { // je Übung aggregiert
    const out = {};
    for (const s of st.ses) for (const se of s.session_exercises) {
      const ex = F.S.exById[se.exercise_id]; if (!ex) continue; const o = (out[ex.id] = out[ex.id] || { ex, n: 0, sets: 0, reps: 0, vol: 0, top: null, e1: 0, last: null, lastD: '', pts: [] });
      const dn = se.sets.filter((x) => x.done); if (!dn.length) continue; o.n++; o.sets += dn.length; let best = 0;
      dn.forEach((x) => { if (x.reps !== null) o.reps += x.reps; if (x.load_kg !== null && x.reps !== null) { o.vol += Number(x.load_kg) * x.reps; if (o.top === null || Number(x.load_kg) > o.top) o.top = Number(x.load_kg); const e1 = E.e1rm(Number(x.load_kg), x.reps) || 0; if (e1 > o.e1) o.e1 = e1; if (e1 > best) best = e1; } });
      if (s.session_date >= o.lastD) { o.lastD = s.session_date; const t = dn.filter((x) => x.load_kg !== null).pop(); o.last = t ? F.fmt(Number(t.load_kg)) + ' kg' : ''; }
      if (best) o.pts.push({ d: s.session_date, v: best });
    }
    return Object.values(out).filter((o) => o.sets);
  };
  const pdfProtokoll = (logo) => {
    const st = stats(F.ls.get('range', 'monat')), d = newDoc('Trainingsprotokoll', st), S = F.S;
    const days = {}; st.ses.forEach((s) => (days[s.session_date] = days[s.session_date] || { s: [], a: [] }).s.push(s)); st.acts.forEach((a) => (days[a.start_at.slice(0, 10)] = days[a.start_at.slice(0, 10)] || { s: [], a: [] }).a.push(a));
    const keys = Object.keys(days).sort().reverse(); if (!keys.length) d.line('In diesem Zeitraum sind keine Einheiten eingetragen.', { color: MUTE });
    keys.forEach((k) => {
      d.need(16); d.line(dd(k) + ' · ' + F.WD[F.dparse(k).getDay()], { bold: true, size: 11, h: 6.5 });
      days[k].s.forEach((s) => {
        d.line((s.started_at ? hhmm(s.started_at) + ' Uhr · ' : '') + (s.title || 'Krafttraining') + (s.duration_min ? ' · ' + s.duration_min + ' min' : '') + (s.form === 'ruhiger' ? ' · ruhigere Tagesform' : ''), { bold: true, x: 20 });
        if (!s.session_exercises.length) d.line('Details unbekannt (übernommene Einheit).', { x: 20, color: MUTE, size: 8.5 });
        s.session_exercises.forEach((se) => { const ex = S.exById[se.exercise_id]; d.line((ex ? ex.name : '?').slice(0, 70), { x: 22, size: 9.5, bold: true, h: 5 }); const dn = se.sets.filter((x) => x.done); d.line(dn.length ? dn.map(setTxt).join('   |   ').slice(0, 150) : 'keine Sätze erfasst', { x: 26, size: 8.5, color: MUTE, h: 5 }); if (se.note) d.line('Notiz: ' + se.note.slice(0, 110), { x: 26, size: 8, color: MUTE, h: 4.5 }); });
        if (s.note && s.note !== 'Details unbekannt') d.line('Notiz: ' + s.note.slice(0, 110), { x: 20, size: 8.5, color: MUTE });
      });
      days[k].a.forEach((a) => { const e = E.energy(a, F.weightNow()); d.line(F.sportName(a.sport) + ': ' + (a.name || '') + (a.distance_m ? ' · ' + F.fmt(Math.round(a.distance_m / 100) / 10) + ' km' : '') + (a.avg_watts ? ' · Ø ' + Math.round(a.avg_watts) + ' W' : '') + ' · ca. ' + F.fmt(e.kcal) + ' kcal', { x: 20, size: 9, color: [40, 90, 170] }); });
      d.y += 2;
    });
    footer(d.pdf, logo); d.pdf.save('forza-protokoll-' + st.k + '-' + F.today() + '.pdf');
  };
  const pdfUebungen = (logo) => {
    const st = stats(F.ls.get('range', 'monat')), d = newDoc('Übungsstatistik', st), rows = exHist(st).sort((a, b) => b.sets - a.sets);
    if (!rows.length) d.line('In diesem Zeitraum gibt es noch keine Sätze mit Daten.', { color: MUTE });
    else { d.row([['Übung', 16], ['Einh.', 112, 'right'], ['Sätze', 126, 'right'], ['Wdh.', 140, 'right'], ['Top-Last', 158, 'right'], ['gesch. 1RM', 176, 'right'], ['Volumen', 194, 'right']], { bold: true, color: MUTE, size: 8, rule: true });
      rows.forEach((o) => d.row([[o.ex.name.slice(0, 52), 16], [o.n, 112, 'right'], [o.sets, 126, 'right'], [o.reps || '–', 140, 'right'], [o.top !== null ? F.fmt(o.top) + ' kg' : '–', 158, 'right'], [o.e1 ? F.fmt(Math.round(o.e1)) + ' kg' : '–', 176, 'right'], [o.vol ? F.fmt(Math.round(o.vol)) + ' kg' : '–', 194, 'right']], { rule: true }));
      d.y += 2; d.line('1RM = geschätzte Maximalkraft nach Epley. Volumen = Summe aus Last × Wiederholungen. Zeitübungen und Körpergewichtsübungen ohne Last haben keine 1RM.', { size: 7.5, color: MUTE }); }
    const mus = Object.entries(st.muscle).sort((a, b) => b[1] - a[1]); if (mus.length) { d.y += 4; d.head('Sätze je Muskelgruppe'); const mm = mus[0][1]; mus.forEach(([m, n]) => { d.need(7); d.pdf.setFont('helvetica', 'normal'); d.pdf.setFontSize(9.5); d.pdf.setTextColor(...INK); d.pdf.text(E.LABEL[m] || m, 16, d.y); d.pdf.setFillColor(236, 239, 243); d.pdf.roundedRect(60, d.y - 3.4, 110, 4, 2, 2, 'F'); d.pdf.setFillColor(...ACC); d.pdf.roundedRect(60, d.y - 3.4, Math.max(2, n / mm * 110), 4, 2, 2, 'F'); d.pdf.setFont('helvetica', 'bold'); d.pdf.text(String(n), 174, d.y); d.y += 7; }); }
    footer(d.pdf, logo); d.pdf.save('forza-uebungen-' + st.k + '-' + F.today() + '.pdf');
  };
  const miniChart = (d, pts, title, unit) => {
    const pdf = d.pdf, W = 80, H = 30; d.need(H + 16); const x0 = 16, y0 = d.y + 6;
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9.5); pdf.setTextColor(...INK); pdf.text(title.slice(0, 60), x0, d.y);
    pdf.setDrawColor(...LINE); pdf.setLineWidth(.2); pdf.line(x0, y0 + H, x0 + W * 2, y0 + H);
    const xs = pts.map((p) => new Date(p.d).getTime()), ys = pts.map((p) => p.v), ax = Math.min(...xs), bx = Math.max(...xs), ay = Math.min(...ys) * 0.95, by = Math.max(...ys) * 1.05 || 1;
    const X = (v) => x0 + (bx === ax ? W : (v - ax) / (bx - ax) * W * 2), Y = (v) => y0 + H - (by === ay ? H / 2 : (v - ay) / (by - ay) * H);
    pdf.setDrawColor(...ACC); pdf.setLineWidth(.7); for (let i = 1; i < pts.length; i++) pdf.line(X(xs[i - 1]), Y(ys[i - 1]), X(xs[i]), Y(ys[i]));
    pdf.setFillColor(...ACC); pts.forEach((p, i) => pdf.circle(X(xs[i]), Y(p.v), 0.9, 'F'));
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(...MUTE); pdf.text(dd(pts[0].d), x0, y0 + H + 4); pdf.text(dd(pts[pts.length - 1].d), x0 + W * 2, y0 + H + 4, { align: 'right' }); pdf.text(F.fmt(Math.round(ay)) + ' ' + unit, x0 + W * 2 + 3, y0 + H); pdf.text(F.fmt(Math.round(by)) + ' ' + unit, x0 + W * 2 + 3, y0 + 3);
    d.y += H + 16;
  };
  const pdfVerlauf = (logo) => {
    const st = stats(F.ls.get('range', 'monat')), d = newDoc('Kraft- und Körperverlauf', st);
    const rows = exHist(st).filter((o) => o.pts.length >= 2).sort((a, b) => b.pts.length - a.pts.length).slice(0, 10);
    if (!rows.length) d.line('Für einen Kraftverlauf braucht eine Übung mindestens zwei Einheiten mit Gewicht und Wiederholungen im Zeitraum.', { color: MUTE, size: 9 });
    rows.forEach((o) => { const df = o.pts[o.pts.length - 1].v - o.pts[0].v; miniChart(d, o.pts.map((p) => ({ d: p.d, v: p.v })), o.ex.name + '  ·  ' + (df >= 0 ? '+' : '') + F.fmt(Math.round(df * 10) / 10) + ' kg', 'kg'); });
    const w = F.S.weights.filter((q) => q.measured_on >= st.from).map((q) => ({ d: q.measured_on, v: Number(q.weight_kg) })); d.head('Körpergewicht'); if (w.length >= 2) miniChart(d, w, 'Verlauf', 'kg'); else d.line(w.length ? 'Nur eine Messung im Zeitraum: ' + F.fmt(w[0].v) + ' kg.' : 'Keine Messung im Zeitraum.', { color: MUTE, size: 9 });
    footer(d.pdf, logo); d.pdf.save('forza-verlauf-' + st.k + '-' + F.today() + '.pdf');
  };
  const pdfAktiv = (logo) => {
    const st = stats(F.ls.get('range', 'monat')), d = newDoc('Aktivitäten (Rad, Wandern, weitere)', st), W = F.weightNow(), acts = st.acts.slice().sort((a, b) => (a.start_at < b.start_at ? 1 : -1));
    if (!acts.length) d.line('In diesem Zeitraum gibt es keine Aktivitäten.', { color: MUTE });
    else { d.row([['Datum', 16], ['Aktivität', 36], ['km', 110, 'right'], ['Zeit', 126, 'right'], ['Ø Watt', 142, 'right'], ['kJ', 156, 'right'], ['kcal', 172, 'right'], ['Quelle', 176]], { bold: true, color: MUTE, size: 8, rule: true });
      let kc = 0; acts.forEach((a) => { const e = E.energy(a, W); kc += e.kcal; const h = (a.moving_s || a.duration_s || 0) / 3600; d.row([[dd(a.start_at.slice(0, 10)).slice(0, 5) + '.', 16], [((F.sportName(a.sport) + ' · ' + (a.name || '')).slice(0, 44)), 36], [a.distance_m ? F.fmt(Math.round(a.distance_m / 100) / 10) : '–', 110, 'right'], [h ? Math.floor(h) + ':' + String(Math.round((h % 1) * 60)).padStart(2, '0') : '–', 126, 'right'], [a.avg_watts ? Math.round(a.avg_watts) : '–', 142, 'right'], [a.kilojoules ? Math.round(a.kilojoules) : '–', 156, 'right'], [F.fmt(e.kcal), 172, 'right'], [e.method.startsWith('Strava') ? 'Strava' : e.method.startsWith('aus') ? 'aus kJ' : 'MET', 176]], { size: 8.5, rule: true }); });
      d.y += 2; d.row([['Summe', 16], [F.fmt(Math.round(st.rideKm + st.hikeKm)) + ' km', 110, 'right'], [F.fmt(kc) + ' kcal', 172, 'right']], { bold: true }); d.line('Kalorien sind Schätzungen: Strava-Angabe, sonst aus der Arbeit (kJ, ca. 24 % Wirkungsgrad), sonst MET-Wert mal Körpergewicht mal Zeit.', { size: 7.5, color: MUTE }); }
    footer(d.pdf, logo); d.pdf.save('forza-aktivitaeten-' + st.k + '-' + F.today() + '.pdf');
  };
  const PDFS = [['stats', 'Statistik-Überblick', 'Kennzahlen, Wochenbalken, Sätze je Muskelgruppe, Kraft', 'pdfStats'], ['protokoll', 'Detailliertes Trainingsprotokoll', 'Jede Einheit mit Übungen, Sätzen, Gewichten, Notizen und Aktivitäten', 'pdfProtokoll'], ['uebungen', 'Übungsstatistik', 'Je Übung: Einheiten, Sätze, Top-Last, geschätzte Maximalkraft, Volumen', 'pdfUebungen'], ['verlauf', 'Kraft- und Körperverlauf', 'Verlaufsdiagramme je Übung plus Körpergewicht', 'pdfVerlauf'], ['aktiv', 'Aktivitäten', 'Rad und Wandern mit Strecke, Zeit, Watt und Energie', 'pdfAktiv']];
  F.acts.pdf = () => {
    const k = F.ls.get('range', 'monat');
    F.modal(`<div class="h2">PDF exportieren</div><div class="small mute" style="margin-bottom:8px">Zeitraum</div><div class="rangebar">${RANGES.map(([v, l]) => `<button class="chip ${k === v ? 'on' : ''}" data-act="pdfRange" data-v="${v}">${l}</button>`).join('')}</div>
      <div class="list" style="margin-top:8px">${PDFS.map(([id, t, s]) => `<button class="it" data-act="pdfDo" data-k="${id}"><div class="grow"><b>${t}</b><div class="small mute">${s}</div></div>${arrow}</button>`).join('')}</div>`);
  };
  F.acts.pdfRange = (t) => { F.ls.set('range', t.dataset.v); F.acts.pdf(); };
  F.acts.pdfDo = async (t) => {
    const f = PDFS.find((p) => p[0] === t.dataset.k); if (!f) return; F.toast('PDF wird erstellt …');
    await loadScript('assets/jspdf-4.2.1.umd.min.js'); let logo = null; try { logo = await toDataUrl('assets/theis-logo.png'); } catch (e) { /* ohne Logo */ }
    await ({ pdfStats, pdfProtokoll, pdfUebungen, pdfVerlauf, pdfAktiv })[f[3]](logo); F.closeModal(); F.toast('PDF gespeichert');
  };
  const pdfStats = async (logo) => {
    const k = F.ls.get('range', 'monat'), st = stats(k), { jsPDF } = window.jspdf, pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const acc = [77, 107, 0], ink = [24, 28, 36], mute = [110, 118, 130], line = [214, 219, 226];
    const name = (F.S.profile && F.S.profile.display_name) || '';
    let y = 20;
    const need = (h) => { if (y + h > 272) { pdf.addPage(); y = 20; } };
    const head = (t) => { need(14); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12); pdf.setTextColor(...ink); pdf.text(t, 16, y); y += 2; pdf.setDrawColor(...acc); pdf.setLineWidth(.6); pdf.line(16, y, 36, y); y += 6; };
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(22); pdf.setTextColor(...ink); pdf.text('forza', 16, y); pdf.setFontSize(11); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...mute);
    pdf.text('Trainingsstatistik' + (name ? ' · ' + name : ''), 16, y + 7); pdf.text(rangeName(k) + ' · ' + (k === 'alles' ? 'bis ' : dd(st.from) + ' – ') + dd(st.today), 16, y + 13); y += 24;
    // Kennzahlen als Kacheln
    const tiles = [[st.ses.length, 'Krafteinheiten'], [st.rides.length, 'Radfahrten'], [st.hikes.length, 'Wanderungen'], [st.days, 'aktive Tage']];
    tiles.forEach(([n, l], i) => { const x = 16 + i * 45; pdf.setFillColor(244, 246, 249); pdf.roundedRect(x, y, 42, 22, 3, 3, 'F'); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(20); pdf.setTextColor(...acc); pdf.text(String(n), x + 4, y + 11); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(...mute); pdf.text(l, x + 4, y + 18); });
    y += 30;
    head('Überblick');
    const rows = [['Sätze mit Daten', String(st.sets)], ['Gesamtvolumen', st.vol ? F.fmt(st.vol) + ' kg' : 'unbekannt'], ['Krafttraining Dauer', st.kraftMin ? st.kraftMin + ' min' : 'unbekannt'], ['Rad', st.rides.length ? F.fmt(Math.round(st.rideKm)) + ' km · ' + F.fmt(Math.round(st.rideH * 10) / 10) + ' h' + (st.rideKj ? ' · ' + F.fmt(Math.round(st.rideKj)) + ' kJ' : '') : '–'], ['Wandern', st.hikes.length ? F.fmt(Math.round(st.hikeKm)) + ' km · ' + Math.round(st.hikeUp) + ' hm' : '–'], ['Energie (Schätzung)', st.kcal ? 'ca. ' + F.fmt(st.kcal) + ' kcal' : '–']];
    pdf.setFontSize(10); rows.forEach(([a, b]) => { pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...mute); pdf.text(a, 16, y); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...ink); pdf.text(b, 80, y); y += 6; });
    if (st.noData) { pdf.setFont('helvetica', 'italic'); pdf.setFontSize(8.5); pdf.setTextColor(...mute); pdf.text(st.noData + ' übernommene Einheit(en) ohne Satzdaten zählen nur bei den Einheiten.', 16, y); y += 6; }
    y += 4;
    // Wochenbalken
    head('Wochen im Überblick');
    const H = 34, mx = Math.max(3, ...st.wk.map((w) => w.kraft + w.rad + w.wan)), bw = Math.min(10, 170 / Math.max(1, st.wk.length) - 2);
    need(H + 14); const base = y + H;
    st.wk.slice(-16).forEach((w, i) => { const x = 18 + i * (bw + 2); let yy = base; [[w.kraft, acc], [w.rad, [60, 130, 230]], [w.wan, [233, 162, 59]]].forEach(([n, c]) => { const h = n / mx * H; if (h > 0) { pdf.setFillColor(...c); pdf.rect(x, yy - h, bw, h, 'F'); yy -= h; } }); pdf.setFontSize(6.5); pdf.setTextColor(...mute); pdf.text(w.l, x + bw / 2, base + 4, { align: 'center' }); });
    pdf.setDrawColor(...line); pdf.setLineWidth(.2); pdf.line(16, base, 194, base); y = base + 9;
    pdf.setFontSize(8); pdf.setTextColor(...mute); pdf.text('Grün Kraft · Blau Rad · Orange Wandern (Einheiten je Woche)', 16, y); y += 9;
    // Muskelgruppen
    const mus = Object.entries(st.muscle).sort((a, b) => b[1] - a[1]);
    head('Sätze je Muskelgruppe');
    if (!mus.length) { pdf.setFontSize(9.5); pdf.setTextColor(...mute); pdf.setFont('helvetica', 'normal'); pdf.text('In diesem Zeitraum gibt es noch keine Sätze mit Daten.', 16, y); y += 8; }
    const mm = Math.max(1, ...mus.map((m) => m[1]));
    mus.forEach(([m, n]) => { need(7); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9.5); pdf.setTextColor(...ink); pdf.text(E.LABEL[m] || m, 16, y); pdf.setFillColor(236, 239, 243); pdf.roundedRect(60, y - 3.4, 110, 4, 2, 2, 'F'); pdf.setFillColor(...acc); pdf.roundedRect(60, y - 3.4, Math.max(2, n / mm * 110), 4, 2, 2, 'F'); pdf.setFont('helvetica', 'bold'); pdf.text(String(n), 174, y); y += 7; });
    y += 4;
    // Kraft je Übung
    if (st.lifts.length) {
      head('Kraft (geschätzte Maximalkraft)');
      st.lifts.sort((a, b) => b.best - a.best).slice(0, 14).forEach((l) => { need(7); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9.5); pdf.setTextColor(...ink); pdf.text(l.name.slice(0, 48), 16, y); pdf.setFont('helvetica', 'bold'); const d = l.best - l.first; pdf.text(F.fmt(Math.round(l.best * 10) / 10) + ' kg', 130, y); pdf.setTextColor(...(d >= 0 ? acc : [190, 70, 50])); pdf.text((d >= 0 ? '+' : '') + F.fmt(Math.round(d * 10) / 10) + ' kg seit Beginn', 152, y); y += 6.5; });
    }
    footer(pdf, logo);
    pdf.save('forza-statistik-' + k + '-' + F.today() + '.pdf');
  };
  /* ---------- Startseite: vier Varianten, gemerkt wie Farbe und Schrift ---------- */

  /* Mini-Vorschau der Startseiten (Strichzeichnung) */
  const R = (x, y, w, h, c = 'l') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" class="pv-${c}"/>`;
  const PREV = {
    klassisch: `<svg viewBox="0 0 80 56" class="pv" aria-hidden="true">${R(4, 3, 30, 4, 't')}${R(4, 10, 72, 20, 'a')}${R(4, 34, 35, 18)}${R(41, 34, 35, 18)}</svg>`,
    fokus: `<svg viewBox="0 0 80 56" class="pv" aria-hidden="true">${R(4, 3, 30, 4, 't')}${R(4, 10, 72, 32, 'a')}${R(20, 33, 40, 6, 'b')}${R(4, 46, 72, 6)}</svg>`,
    woche: `<svg viewBox="0 0 80 56" class="pv" aria-hidden="true">${R(4, 3, 30, 4, 't')}${R(4, 9, 72, 13)}${[0, 1, 2, 3, 4, 5, 6].map((i) => `<circle cx="${12 + i * 10.5}" cy="15.5" r="3.4" class="${i === 1 || i === 4 || i === 5 ? 'pv-a' : 'pv-d'}"/>`).join('')}${R(4, 25, 72, 14, 'a')}${R(4, 42, 72, 10)}</svg>`,
    training: `<svg viewBox="0 0 80 56" class="pv" aria-hidden="true">${R(4, 3, 30, 4, 't')}${R(4, 9, 72, 22)}${[0, 1, 2, 3, 4].map((i) => `${R(10, 13 + i * 4, 18 + (i * 13) % 34, 2, 'a')}`).join('')}${R(4, 34, 72, 18, 'a')}</svg>`
  };
  const DASH = [['klassisch', 'Klassisch', 'Vorschlag, Woche, Aktivitäten und Wochenziele'], ['fokus', 'Fokus', 'Ein großer Vorschlag, sonst nichts'], ['woche', 'Woche', 'Zuerst deine Woche, dann der Vorschlag'], ['training', 'Training', 'Zuerst die Wochenziele je Muskel, dann der Vorschlag']];
  const baseHeute = F.views.heute;
  F.views.heute = (a) => {
    const v = F.look().dash || 'klassisch', html = baseHeute(a);
    if (v === 'klassisch') return html;
    const box = document.createElement('div'); box.innerHTML = html;
    const hero = box.querySelector('.hero'), grid = box.querySelector('.grid2'), cols = grid ? [...grid.children] : [];
    const fold = (keepWhy) => { // Übungsliste einklappen
      if (!hero) return; const rows = hero.querySelectorAll('.exrow'); if (rows.length) { const det = document.createElement('details'); det.className = 'exfold'; det.innerHTML = `<summary>${rows.length} Übungen anzeigen</summary>`; rows[0].parentNode.insertBefore(det, rows[0]); rows.forEach((r) => det.appendChild(r)); const mobi = hero.querySelector('.mobi'); if (mobi) det.appendChild(mobi); }
      if (!keepWhy) hero.querySelectorAll('.small.mute').forEach((e) => { if (/Warum/.test(e.textContent)) e.remove(); });
    };
    const weekCard = cols[0] && cols[0].children[0], actCard = cols[0] && cols[0].children[1], barCard = cols[1] && cols[1].children[0];
    if (v === 'fokus') { fold(false); if (hero) hero.classList.add('hero-focus'); if (grid) grid.remove(); const w = weekCard; if (w && hero) { w.classList.add('strip'); hero.after(w); } }
    if (v === 'woche') {
      fold(true); const st = stats('woche'); if (grid) grid.remove();
      const sum = document.createElement('div'); sum.className = 'kpis k3'; sum.innerHTML = kpi(st.ses.length, 'Kraft') + kpi(st.rides.length, 'Rad') + kpi(st.hikes.length, 'Wandern');
      const titl = document.createElement('div'); titl.className = 'eyebrow'; titl.style.margin = '4px 2px 8px'; titl.textContent = 'Diese Woche';
      if (hero) { if (weekCard) hero.before(titl, sum, weekCard); else hero.before(titl, sum); if (actCard) hero.after(actCard); }
    }
    if (v === 'training') { fold(true); if (grid) grid.remove(); if (hero && barCard) hero.before(barCard); }
    return box.innerHTML;
  };
  F.acts.dash = (t) => { F.setLook('dash', t.dataset.v); F.render(); };

  /* ---------- Spontan eine Übung hinzufügen ---------- */
  const addList = (q) => {
    const s = F.openSession(), have = new Set(s.session_exercises.map((e) => e.exercise_id)), ctx = { items: F.items().items, userEx: F.S.userEx, painEx: F.painSet() };
    const needle = (q || '').toLowerCase().trim();
    const all = F.S.exercises.filter((e) => !have.has(e.id) && E.eligible(e, ctx) && e.dosage_profile !== 'M' && (!needle || e.name.toLowerCase().includes(needle) || e.muscles_primary.some((m) => (E.LABEL[m] || '').toLowerCase().includes(needle))));
    const groups = {}; all.forEach((e) => (groups[e.muscles_primary[0]] = groups[e.muscles_primary[0]] || []).push(e));
    const keys = Object.keys(groups).sort((a, b) => (E.LABEL[a] || a).localeCompare(E.LABEL[b] || b, 'de'));
    return keys.map((m) => `<div class="eyebrow" style="margin:12px 0 4px">${E.LABEL[m] || m}</div><div class="list">${groups[m].sort((a, b) => a.name.localeCompare(b.name, 'de')).map((e) => `<button class="it" data-act="addEx" data-ex="${e.id}"><div class="grow"><b>${esc(e.name)}</b></div></button>`).join('')}</div>`).join('') || '<div class="mute">Nichts gefunden. Entwürfe lassen sich im Katalog freigeben.</div>';
  };
  F.acts.addExAsk = () => { F.modal(`<div class="h2">Übung hinzufügen</div><input id="ax-q" type="search" placeholder="Suchen: Name oder Muskel" data-in="axq" data-live="1" style="width:100%;margin:6px 0"><div id="ax-list" style="max-height:55vh;overflow:auto">${addList('')}</div>`); };
  F.ins.axq = (t) => { const l = document.getElementById('ax-list'); if (l) l.innerHTML = addList(t.value); };
  F.acts.addEx = async (t) => {
    const s = F.openSession(), ex = F.S.exById[t.dataset.ex]; if (!s || !ex) return;
    const P = E.params(F.S.params), prio = E.prioOf(F.S.priorities, ex.muscles_primary[0], F.today()), pf = E.profOf(ex.dosage_profile, P, (F.S.profile && F.S.profile.goals) || [], prio);
    const last = E.lastWorkSets(F.S.sessions, ex.id), kg = last ? Math.max(...last.sets.map((q) => Number(q.load_kg))) : null;
    const se = await F.insert('session_exercises', { session_id: s.id, exercise_id: ex.id, position: s.session_exercises.length, planned_sets: pf.sets, planned_reps: pf.reps ? pf.reps.join('–') : pf.secs ? pf.secs.join('–') + ' s' : null, planned_rir: pf.rir ? pf.rir.join('–') : null, why: 'Spontan hinzugefügt.' + (last ? ' Zuletzt ' + F.fmt(kg) + ' kg.' : ' Keine bekannte Last: leicht starten.') });
    const rows = []; for (let n = 1; n <= pf.sets; n++) rows.push({ session_exercise_id: se.id, set_no: n, load_kg: kg, load_per_hand: ex.load_convention === 'je_hand' });
    const sr = await F.sb.from('sets').insert(rows); if (sr.error) throw sr.error;
    F.closeModal(); await F.load(); F.ui.tr.ei = F.openSession().session_exercises.length - 1; F.render(); window.scrollTo(0, 0); F.toast('Hinzugefügt · zählt für künftige Vorschläge');
  };
  const tv = F.views.training;
  F.views.training = () => { const h = tv(); return F.openSession() ? h + '<button class="btn ghost block" style="margin:6px 0 18px" data-act="addExAsk">+ Übung hinzufügen</button>' : h; };

  /* ---------- Zeiten je Einheit und Übung ---------- */
  const hhmm = (iso) => new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const exMinutes = (s) => { // Zeit je Übung: vom Ende der vorigen Übung (oder Start) bis zum letzten abgeschlossenen Satz
    const out = {}; let prev = s.started_at ? new Date(s.started_at).getTime() : null;
    for (const se of s.session_exercises) {
      const ts = se.sets.filter((q) => q.done && q.done_at).map((q) => new Date(q.done_at).getTime()); if (!ts.length) continue;
      const end = Math.max(...ts); if (prev !== null && end > prev) out[se.id] = Math.max(1, Math.round((end - prev) / 60000)); prev = end;
    }
    return out;
  };
  const dur = (sec) => { const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60); return h ? h + ' h ' + String(m).padStart(2, '0') + ' min' : m + ' min'; };
  const num1 = (n) => F.fmt(Math.round(n * 10) / 10);

  /* ---------- Kalender: Tag als Fenster mit Details ---------- */
  const actDetail = (a) => {
    const e = E.energy(a, F.weightNow()), t = a.moving_s || a.duration_s || 0, kmh = a.distance_m && t ? a.distance_m / 1000 / (t / 3600) : null;
    const cell = (l, v) => (v === null || v === undefined || v === '' ? '' : `<div class="mc"><span>${l}</span><b>${v}</b></div>`);
    return `<details class="act"><summary><div class="ico">${F.icon[RIDE.includes(a.sport) ? 'bike' : HIKE.includes(a.sport) ? 'hike' : 'dumb']}</div><div class="grow"><b>${esc(a.name || F.sportName(a.sport))}</b><div class="small mute">${F.sportName(a.sport)} · ${hhmm(a.start_at)}${a.distance_m ? ' · ' + num1(a.distance_m / 1000) + ' km' : ''}${t ? ' · ' + dur(t) : ''}</div></div></summary>
      <div class="mgrid">${cell('Strecke', a.distance_m ? num1(a.distance_m / 1000) + ' km' : null)}${cell('Zeit in Bewegung', t ? dur(t) : null)}${cell('Gesamtzeit', a.duration_s ? dur(a.duration_s) : null)}${cell('Ø Tempo', kmh ? num1(kmh) + ' km/h' : null)}${cell('Höhenmeter', a.elevation_m ? Math.round(a.elevation_m) + ' hm' : null)}${cell('Ø Leistung', a.avg_watts ? Math.round(a.avg_watts) + ' W' : null)}${cell('Normalisiert', a.weighted_watts ? Math.round(a.weighted_watts) + ' W' : null)}${cell('Arbeit', a.kilojoules ? Math.round(a.kilojoules) + ' kJ' : null)}${cell('Energie', '≈ ' + F.fmt(e.kcal) + ' kcal')}</div><div class="small mute" style="margin-top:6px">Energie: ${esc(e.method)}</div></details>`;
  };
  const sessDetail = (s) => {
    const S = F.S, tm = exMinutes(s), when = s.started_at ? hhmm(s.started_at) + (s.finished_at ? '–' + hhmm(s.finished_at) : '') : '';
    const st = { geplant: 'geplant', gefuehrt: 'im Verlauf geführt', bestaetigt: 'bestätigt', ausgelassen: 'ausgelassen' }[s.status];
    return `<details class="act"><summary><div class="ico">${F.icon.dumb}</div><div class="grow"><b>${esc(s.title || 'Training')}</b><div class="small mute">${[when, s.duration_min || s.planned_minutes ? (s.duration_min || s.planned_minutes) + ' min' : '', st].filter(Boolean).join(' · ')}</div></div></summary>
      ${s.session_exercises.length ? s.session_exercises.map((se) => { const ex = S.exById[se.exercise_id], dn = se.sets.filter((q) => q.done); return `<div class="small" style="padding:5px 0"><b>${esc(ex ? ex.name : '?')}</b>${tm[se.id] ? ` <span class="mute">· ca. ${tm[se.id]} min</span>` : ''}<div class="mute">${dn.length ? dn.map(setTxt).join(' · ') : 'keine Sätze erfasst'}</div></div>`; }).join('') : '<div class="small mute" style="padding:5px 0">Details sind nicht bekannt (übernommene Einheit).</div>'}
      ${s.note ? `<div class="small mute" style="margin-top:6px">Notiz: ${esc(s.note)}</div>` : ''}<button class="btn sm danger" style="margin-top:8px" data-act="delSession" data-id="${s.id}">Eintrag löschen</button></details>`;
  };
  const dayModal = (d) => {
    const S = F.S, ss = S.sessions.filter((s) => s.session_date === d), aa = S.activities.filter((a) => a.start_at.slice(0, 10) === d).sort((a, b) => (a.start_at < b.start_at ? -1 : 1)), ab = S.absences.filter((a) => a.from_date <= d && a.to_date >= d);
    F.modal(`<div class="row between"><div class="h2">${F.dlabel(d)}</div><button class="btn sm" data-act="addEntry" data-d="${d}">${F.icon.plus.replace('<svg', '<svg width="16" height="16"')} Eintragen</button></div>
      <div style="max-height:62vh;overflow:auto;margin-top:8px">${ss.map(sessDetail).join('')}${aa.map(actDetail).join('')}${ab.map((a) => `<div class="list"><div class="it"><div class="ico">${F.icon.warn}</div><div class="grow"><b>${{ pause: 'Pause', krank: 'Krank', schmerz: 'Schmerz', reise: 'Unterwegs' }[a.kind]}</b><div class="small mute">${F.dshort(a.from_date)}–${F.dshort(a.to_date)}${a.note ? ' · ' + esc(a.note) : ''}</div></div><button class="mute" data-act="delAbs" data-id="${a.id}" aria-label="Löschen">✕</button></div></div>`).join('')}${!ss.length && !aa.length && !ab.length ? '<div class="mute" style="padding:14px 0">An diesem Tag ist nichts eingetragen.</div>' : ''}</div>`);
  };
  F.acts.calSel = (t) => { F.ui.cal.sel = t.dataset.d; F.render(); dayModal(t.dataset.d); };
  /* Kalender springt immer auf heute: beim Öffnen des Tabs und beim Zurückkehren in die App */
  const calToday = () => { F.ui.cal.y = null; F.ui.cal.m = null; F.ui.cal.sel = null; };
  window.addEventListener('hashchange', () => { if (/kalender/.test(location.hash)) calToday(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && /kalender/.test(location.hash)) { calToday(); F.render(); } });
  const baseKal = F.views.kalender;
  F.views.kalender = () => { const box = document.createElement('div'); box.innerHTML = baseKal(); const last = box.lastElementChild; if (last && last.classList.contains('card')) last.remove(); return box.innerHTML; };

  /* ---------- Fortschritt: Auswertung je Sportart ---------- */
  const catOf = (a) => (RIDE.includes(a.sport) ? 'rad' : a.sport);
  const catName = (c) => (c === 'rad' ? 'Rad' : c === 'kraft' ? 'Kraft' : F.sportName(c));
  const periods = (from, today, k) => {
    const out = [], monthly = k === 'jahr' || k === 'alles' || k === '6m';
    if (monthly) { let [y, m] = [+from.slice(0, 4), +from.slice(5, 7)]; const ey = +today.slice(0, 4), em = +today.slice(5, 7); let g = 0; while ((y < ey || (y === ey && m <= em)) && g++ < 60) { const a = `${y}-${String(m).padStart(2, '0')}-01`, b = `${y}-${String(m).padStart(2, '0')}-31`; out.push({ l: F.MON[m - 1].slice(0, 3), a, b }); m++; if (m > 12) { m = 1; y++; } } }
    else { let a = F.addDays(from, -((F.dparse(from).getDay() + 6) % 7)), g = 0; while (a <= today && g++ < 20) { out.push({ l: F.dshort(a), a, b: F.addDays(a, 6) }); a = F.addDays(a, 7); } }
    return out;
  };
  const bars = (vals, unit) => { const mx = Math.max(...vals.map((v) => v.v), 0.0001); return `<div class="row" style="align-items:flex-end;gap:6px;height:120px;overflow-x:auto">${vals.map((v) => `<div class="grow" style="text-align:center;min-width:26px"><div class="small mute" style="font-size:10px;height:14px">${v.v ? (v.v >= 100 ? Math.round(v.v) : num1(v.v)) : ''}</div><div style="display:flex;flex-direction:column;justify-content:flex-end;height:80px"><div class="bargrow" style="height:${v.v / mx * 80}px;background:var(--a);border-radius:5px;min-height:${v.v ? 3 : 0}px"></div></div><div class="small mute" style="font-size:10px">${v.l}</div></div>`).join('')}</div><div class="small mute" style="margin-top:6px">${unit}</div>`; };
  const mgrid = (cells) => `<div class="mgrid">${cells.filter((c) => c && c[1] !== null && c[1] !== undefined && c[1] !== '').map(([l, v]) => `<div class="mc"><span>${l}</span><b>${v}</b></div>`).join('')}</div>`;
  const sportDetail = (cat, st) => {
    const S = F.S, W = F.weightNow(), wks = Math.max(1, (new Date(st.today) - new Date(st.k === 'alles' ? (st.ses[0] ? st.ses[st.ses.length - 1].session_date : st.today) : st.from)) / 6048e5);
    const per = periods(st.k === 'alles' ? ((cat === 'kraft' ? st.ses : st.acts).map((q) => q.session_date || q.start_at.slice(0, 10)).sort()[0] || st.today) : st.from, st.today, st.k);
    if (cat === 'kraft') {
      const ses = st.ses, withDur = ses.filter((s) => s.duration_min), hist = ses.filter((s) => s.started_at);
      const avgStart = hist.length ? (hist.reduce((t, s) => { const d = new Date(s.started_at); return t + d.getHours() * 60 + d.getMinutes(); }, 0) / hist.length) : null;
      const exTimes = []; ses.forEach((s) => Object.values(exMinutes(s)).forEach((m) => exTimes.push(m)));
      const byDay = {}; ses.forEach((s) => { const k = s.split_day || 'Sonstige'; byDay[k] = (byDay[k] || 0) + 1; });
      const exs = exHist(st).sort((a, b) => b.n - a.n).slice(0, 6), mus = Object.entries(st.muscle).sort((a, b) => b[1] - a[1]), mm = mus[0] ? mus[0][1] : 1;
      return `<div class="card">${mgrid([['Einheiten', ses.length], ['pro Woche', ses.length ? num1(ses.length / wks) : null], ['Ø Dauer', withDur.length ? Math.round(withDur.reduce((t, s) => t + s.duration_min, 0) / withDur.length) + ' min' : 'unbekannt'], ['Gesamtzeit', withDur.length ? dur(withDur.reduce((t, s) => t + s.duration_min, 0) * 60) : 'unbekannt'], ['Sätze', st.sets], ['Ø Sätze je Einheit', st.sets && ses.length - st.noData > 0 ? num1(st.sets / (ses.length - st.noData)) : null], ['Volumen', st.vol ? F.fmt(st.vol) + ' kg' : 'unbekannt'], ['Ø Startzeit', avgStart !== null ? String(Math.floor(avgStart / 60)).padStart(2, '0') + ':' + String(Math.round(avgStart % 60)).padStart(2, '0') : 'noch unbekannt'], ['Ø Zeit je Übung', exTimes.length ? Math.round(exTimes.reduce((a, b) => a + b, 0) / exTimes.length) + ' min' : 'noch unbekannt']])}</div>
        <div class="card"><div class="h2">Einheiten pro ${per.length && st.k !== 'jahr' && st.k !== 'alles' && st.k !== '6m' ? 'Woche' : 'Monat'}</div>${bars(per.map((p) => ({ l: p.l, v: ses.filter((s) => s.session_date >= p.a && s.session_date <= p.b).length })), 'Krafteinheiten')}</div>
        <div class="card"><div class="h2">Nach Split-Tag</div>${Object.entries(byDay).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<div class="mrow"><span>${esc(k)}</span><div class="bar"><i class="grow" style="width:${n / ses.length * 100}%"></i></div><b>${n}</b></div>`).join('') || '<div class="mute small">Noch keine Einheiten.</div>'}</div>
        <div class="card"><div class="h2">Meistgemachte Übungen</div>${exs.length ? exs.map((o) => `<div class="mrow" style="grid-template-columns:1fr auto"><span>${esc(o.ex.name)}</span><b>${o.n}×</b></div>`).join('') : '<div class="mute small">Noch keine Übungsdaten.</div>'}</div>
        <div class="card"><div class="h2">Sätze je Muskelgruppe</div>${mus.length ? mus.map(([m, n]) => `<div class="mrow"><span>${E.LABEL[m] || m}</span><div class="bar"><i class="grow" style="width:${n / mm * 100}%"></i></div><b>${n}</b></div>`).join('') : '<div class="mute small">Noch keine Sätze mit Daten.</div>'}</div>`;
    }
    const a = st.acts.filter((q) => catOf(q) === cat), n = a.length, sum = (f) => a.reduce((t, q) => t + (Number(f(q)) || 0), 0);
    if (!n) return '<div class="card"><div class="mute">In diesem Zeitraum gibt es dazu nichts.</div></div>';
    const km = sum((q) => q.distance_m) / 1000, sec = sum((q) => q.moving_s || q.duration_s), hm = sum((q) => q.elevation_m), pw = a.filter((q) => q.avg_watts && (q.moving_s || q.duration_s)), pwT = pw.reduce((t, q) => t + (q.moving_s || q.duration_s), 0);
    const longest = a.slice().sort((p, q) => (q.distance_m || 0) - (p.distance_m || 0))[0], climb = a.slice().sort((p, q) => (q.elevation_m || 0) - (p.elevation_m || 0))[0], strong = pw.slice().sort((p, q) => q.avg_watts - p.avg_watts)[0];
    const kc = a.reduce((t, q) => t + E.energy(q, W).kcal, 0), kj = sum((q) => q.kilojoules);
    return `<div class="card">${mgrid([['Aktivitäten', n], ['Strecke gesamt', km ? F.fmt(Math.round(km)) + ' km' : null], ['Ø Tourlänge', km ? num1(km / n) + ' km' : null], ['Längste Tour', longest && longest.distance_m ? num1(longest.distance_m / 1000) + ' km' : null], ['Zeit gesamt', sec ? dur(sec) : null], ['Ø Dauer', sec ? dur(sec / n) : null], ['Ø Tempo', km && sec ? num1(km / (sec / 3600)) + ' km/h' : null], ['Höhenmeter', hm ? F.fmt(Math.round(hm)) + ' hm' : null], ['Ø Höhenmeter je Tour', hm ? Math.round(hm / n) + ' hm' : null], ['Ø Leistung', pwT ? Math.round(pw.reduce((t, q) => t + q.avg_watts * (q.moving_s || q.duration_s), 0) / pwT) + ' W' : null], ['Stärkste Tour (Ø)', strong ? Math.round(strong.avg_watts) + ' W' : null], ['Arbeit', kj ? F.fmt(Math.round(kj)) + ' kJ' : null], ['Energie (Schätzung)', '≈ ' + F.fmt(Math.round(kc)) + ' kcal'], ['pro Woche', num1(n / wks)]])}</div>
      <div class="card"><div class="h2">Strecke pro ${st.k === 'woche' || st.k === 'monat' || st.k === '3m' ? 'Woche' : 'Monat'}</div>${bars(per.map((p) => ({ l: p.l, v: a.filter((q) => q.start_at.slice(0, 10) >= p.a && q.start_at.slice(0, 10) <= p.b).reduce((t, q) => t + (q.distance_m || 0) / 1000, 0) })), 'Kilometer')}</div>
      ${hm ? `<div class="card"><div class="h2">Höhenmeter pro ${st.k === 'woche' || st.k === 'monat' || st.k === '3m' ? 'Woche' : 'Monat'}</div>${bars(per.map((p) => ({ l: p.l, v: a.filter((q) => q.start_at.slice(0, 10) >= p.a && q.start_at.slice(0, 10) <= p.b).reduce((t, q) => t + (q.elevation_m || 0), 0) })), 'Höhenmeter')}</div>` : ''}
      <div class="card"><div class="h2">Highlights</div>${[longest && longest.distance_m ? ['Längste Tour', longest, num1(longest.distance_m / 1000) + ' km'] : null, climb && climb.elevation_m ? ['Meiste Höhenmeter', climb, Math.round(climb.elevation_m) + ' hm'] : null, strong ? ['Höchste Ø-Leistung', strong, Math.round(strong.avg_watts) + ' W'] : null].filter(Boolean).map(([t, q, v]) => `<div class="mrow" style="grid-template-columns:1fr auto"><span>${t}<div class="small mute">${esc(q.name || '')} · ${F.dshort(q.start_at.slice(0, 10))}</div></span><b>${v}</b></div>`).join('') || '<div class="mute small">Noch nichts.</div>'}</div>`;
  };
  const baseFort = F.views.fortschritt;
  F.views.fortschritt = () => {
    const sp = F.ls.get('sport', 'all'), k = F.ls.get('range', 'monat');
    const cats = ['kraft', ...[...new Set(F.S.activities.map(catOf))].sort((a, b) => (a === 'rad' ? -1 : b === 'rad' ? 1 : a.localeCompare(b)))];
    const chips = `<div class="rangebar"><button class="chip ${sp === 'all' ? 'on' : ''}" data-act="sport" data-v="all">Überblick</button>${cats.map((c) => `<button class="chip ${sp === c ? 'on' : ''}" data-act="sport" data-v="${c}">${esc(catName(c))}</button>`).join('')}</div>`;
    if (sp === 'all' || !cats.includes(sp)) return baseFort().replace('<div class="kpis">', chips + '<div class="kpis">');
    return `<div class="row between" style="margin-bottom:12px"><div class="h1">Fortschritt</div><button class="btn sm" data-act="pdf">PDF</button></div><div class="rangebar">${RANGES.map(([v, l]) => `<button class="chip ${k === v ? 'on' : ''}" data-act="range" data-v="${v}">${l}</button>`).join('')}</div>${chips}<div class="h2" style="margin:6px 2px 10px">${esc(catName(sp))} · ${rangeName(k)}</div>${sportDetail(sp, stats(k))}`;
  };
  F.acts.sport = (t) => { F.ls.set('sport', t.dataset.v); F.render(); };
})();
