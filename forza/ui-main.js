/* forza · Hauptansichten: Anmeldung, Heute, Kalender, Fortschritt */
(function () {
  const F = window.F, E = F.E, esc = F.esc;
  const RIDE = ['Ride', 'VirtualRide', 'GravelRide', 'MountainBikeRide', 'EBikeRide'], HIKE = ['Hike', 'Walk'];
  const SPORT = { Ride: 'Rennrad', GravelRide: 'Gravel', MountainBikeRide: 'Mountainbike', VirtualRide: 'Indoor-Fahrt', EBikeRide: 'E-Bike', Hike: 'Wandern', Walk: 'Spaziergang', Run: 'Laufen', WeightTraining: 'Krafttraining', Workout: 'Training', Swim: 'Schwimmen' };
  F.sportName = (s) => SPORT[s] || s;
  const kind = (a) => (RIDE.includes(a.sport) ? 'r' : HIKE.includes(a.sport) ? 'h' : 'o');
  const MUSC = ['quadrizeps', 'hamstrings', 'gesaess', 'waden', 'brust', 'lat', 'ruecken_hoch', 'schulter_seitlich', 'schulter_hinten', 'rotatoren', 'bizeps', 'trizeps', 'rumpf'];
  F.MUSC = MUSC;

  /* ---------- Anmeldung ---------- */
  F.views.auth = (root) => {
    root.innerHTML = `<div class="auth"><div class="card"><div class="row" style="margin-bottom:18px"><img src="assets/forza.svg" width="52" height="52" style="border-radius:14px" alt=""><div><div class="h1">forza</div><div class="mute small">Dein Training, einfach geführt</div></div></div>
      <label class="f"><span>E-Mail</span><input id="au-mail" type="email" autocomplete="username" inputmode="email"></label>
      <label class="f"><span>Passwort</span><input id="au-pw" type="password" autocomplete="current-password"></label>
      <label class="chk"><input id="au-keep" type="checkbox" ${F.keepLogin() ? 'checked' : ''}><span>Angemeldet bleiben</span></label>
      <button class="btn pri block" data-act="login">Anmelden</button>
      <div class="row between" style="margin-top:12px"><button class="btn ghost sm" data-act="signup">Konto anlegen</button><button class="btn ghost sm" data-act="reset">Passwort vergessen</button></div>
      <p id="au-msg" class="small mute" style="margin:14px 0 0"></p></div></div>`;
  };
  const msg = (m) => { const e = document.getElementById('au-msg'); if (e) e.textContent = m; };
  F.acts.login = async () => {
    try { localStorage.setItem('forza-keep', document.getElementById('au-keep').checked ? '1' : '0'); } catch (e) { /* ignorieren */ }
    const r = await F.sb.auth.signInWithPassword({ email: document.getElementById('au-mail').value.trim(), password: document.getElementById('au-pw').value });
    if (r.error) return msg('Anmeldung nicht möglich: ' + r.error.message);
    await F.afterAuth();
  };
  F.acts.signup = async () => {
    const email = document.getElementById('au-mail').value.trim(), pw = document.getElementById('au-pw').value;
    if (pw.length < 8) return msg('Das Passwort braucht mindestens 8 Zeichen.');
    const r = await F.sb.auth.signUp({ email, password: pw, options: { emailRedirectTo: F.C.stravaRedirect } });
    if (r.error) return msg('Konto konnte nicht angelegt werden: ' + r.error.message);
    if (r.data.session) await F.afterAuth(); else msg('Bitte bestätige die E-Mail, die wir dir geschickt haben, und melde dich dann an.');
  };
  F.acts.reset = async () => {
    const email = document.getElementById('au-mail').value.trim(); if (!email) return msg('Bitte zuerst die E-Mail eintragen.');
    const r = await F.sb.auth.resetPasswordForEmail(email, { redirectTo: F.C.stravaRedirect }); msg(r.error ? r.error.message : 'E-Mail zum Zurücksetzen ist unterwegs.');
  };
  F.acts.logout = async () => { await F.sb.auth.signOut(); F.user = null; F.S = {}; F.render(); };

  /* ---------- Heute ---------- */
  F.views.heute = () => {
    const S = F.S, today = F.today(), hr = new Date().getHours();
    const greet = hr < 11 ? 'Guten Morgen' : hr < 18 ? 'Hallo' : 'Guten Abend';
    const name = (S.profile && S.profile.display_name) || 'Julian';
    const sg = F.suggestion(), open = F.openSession(), form = F.ls.get('form-' + today, 'normal'), place = F.items(), mins = F.ls.get('minutes', null);
    const d = F.dparse(today);
    let h = `<div class="row between" style="margin-bottom:14px"><div><div class="eyebrow">${F.WD[d.getDay()]}, ${d.getDate()}. ${F.MON[d.getMonth()]}</div><div class="h1">${greet}, ${esc(name)}</div></div></div>`;
    if (open) h += `<div class="card" style="border-color:var(--a)"><div class="row between"><div><div class="eyebrow">Läuft gerade</div><b>${esc(open.title || 'Training')}</b></div><button class="btn pri sm" data-act="resume">Fortsetzen</button></div></div>`;
    // Beinfrage nach Fahrt
    const ride = S.activities.find((a) => RIDE.includes(a.sport) && (Date.now() - new Date(a.start_at).getTime()) < 30 * 3600000 && ((a.kilojoules || 0) > 600 || (a.moving_s || 0) > 5400));
    if (ride && !F.ls.get('legs-' + today, null)) h += `<div class="card"><div class="eyebrow">Nach der Radfahrt</div><div style="margin:4px 0 10px"><b>Wie fühlen sich deine Beine an?</b></div><div class="row wrap gap">${[['frisch', 'Frisch'], ['mued', 'Etwas müde'], ['schwer', 'Schwer']].map(([k, l]) => `<button class="chip" data-act="legs" data-v="${k}">${l}</button>`).join('')}</div></div>`;
    else if (F.ls.get('legs-' + today, null) && ride) h += `<div class="small mute" style="margin:-4px 0 12px">Beine: ${{ frisch: 'frisch', mued: 'etwas müde', schwer: 'schwer' }[F.ls.get('legs-' + today)]} · <button class="small" style="color:var(--a)" data-act="legs" data-v="">ändern</button></div>`;
    h += `<div class="chipbar" data-noswipe><button class="chip" data-act="placeMenu">${F.icon.dumb.replace('<svg', '<svg width="16" height="16"')} ${esc(place.name)} ▾</button>${[30, 45, 60].map((m) => `<button class="chip ${mins === m ? 'on' : ''}" data-act="minutes" data-m="${m}">${m} min</button>`).join('')}${mins ? '<button class="chip" data-act="minutes" data-m="">frei</button>' : ''}<button class="chip" data-act="mobMenu">Mobilität</button><button class="chip" data-act="supCycle" title="Supersätze: Auto, immer oder aus">Supersätze: ${{ auto: 'Auto', immer: 'immer', aus: 'aus' }[F.ls.get('superset', 'auto')]}</button></div>`;
    // Hero
    if (sg.rest) h += `<div class="hero"><div class="eyebrow mute">Vorschlag für heute</div><div class="h1" style="margin:6px 0 8px">${esc(sg.title)}</div>${sg.reasons.map((r) => `<div class="mute">${esc(r)}</div>`).join('')}</div>`;
    else if (sg.empty) h += `<div class="hero"><div class="h2">${esc(sg.title)}</div><div class="mute">${esc(sg.reasons[0])}</div><button class="btn pri" style="margin-top:12px" data-act="nav" data-r="mehr/split">Split wählen</button></div>`;
    else h += `<div class="hero"><div class="row between"><div class="eyebrow mute">Vorschlag</div><div class="seg" role="group" aria-label="Tagesform"><button class="${form === 'normal' ? 'on' : ''}" data-act="form" data-v="normal">Normal</button><button class="${form === 'ruhiger' ? 'on' : ''}" data-act="form" data-v="ruhiger">Ruhiger</button></div></div>
      <div class="h1" style="margin:8px 0 2px">${esc(sg.title)}</div><div class="mute">ca. ${sg.minutes}${mins ? ' von ' + mins : ''} Minuten · ${sg.items.length} ${sg.items.length === 1 ? 'Übung' : 'Übungen'}${sg.reentry ? ' · Wiedereinstieg' : ''}</div>
      <div style="margin-top:10px">${sg.items.map((it, i) => `<div class="exrow"><div class="exn">${i + 1}</div><div class="grow"><b>${esc(it.name)}</b>${it.pair_with ? '<span class="badge" style="margin-left:6px">Superset</span>' : ''}<div class="mute small">${it.sets} × ${it.reps ? it.reps[0] + '–' + it.reps[1] + (it.perSide ? ' je Seite' : '') : it.secs ? it.secs[0] + '–' + it.secs[1] + (F.E.PROFILES[it.profile] === F.E.PROFILES.T ? ' s oder m' : ' s') : ''}${it.rir ? ' · Reserve ' + it.rir[0] + '–' + it.rir[1] : ''}${it.load_kg ? ' · ' + F.fmt(it.load_kg) + ' kg' + (it.load_convention === 'je_hand' ? ' je Hand' : '') : ''}</div></div><button class="icbtn" data-act="swapOne" data-id="${it.exercise_id}" aria-label="Diese Übung austauschen" title="Austauschen">${F.icon.swap}</button><button class="icbtn" data-act="help" data-id="${it.exercise_id}" aria-label="Hilfe" title="Hilfe">${F.icon.info}</button></div>`).join('')}</div>
      ${sg.mobility && sg.mobility.length ? `<div class="mobi"><div class="eyebrow mute" style="margin-bottom:4px">Optional zum Abschluss, ca. 4 Minuten · Haltung</div>${sg.mobility.map((m) => `<div class="small">${esc(m.name)} · ${m.sets} × ${m.reps[0]}–${m.reps[1]}</div>`).join('')}</div>` : ''}
      <div class="small mute why" style="margin:12px 0"><b>Warum?</b> ${sg.reasons.map(esc).join(' ')}</div>
      <button class="btn pri block" data-act="start">Training starten</button><div class="row gap" style="margin-top:8px"><button class="btn ghost hero-ghost grow" data-act="pickDay">Anderer Tag</button><button class="btn ghost hero-ghost dice grow" data-act="reroll" aria-label="Variieren">${F.icon.dice || '↻'} Variieren</button></div>
      ${sg.variant ? `<div class="small mute" style="margin-top:10px;text-align:center">Variante ${sg.variant} · <button class="lnk" data-act="rerollReset">zur festen Reihenfolge</button></div>` : ''}</div>`;
    // Woche
    const tiles = []; for (let i = 6; i >= 0; i--) {
      const ds = F.addDays(today, -i), ss = S.sessions.filter((s) => s.session_date === ds && s.kind === 'kraft' && ['gefuehrt', 'bestaetigt'].includes(s.status));
      const aa = S.activities.filter((a) => a.start_at.slice(0, 10) === ds), ab = S.absences.find((x) => x.from_date <= ds && x.to_date >= ds);
      let t = '<div class="tile">·</div>';
      if (ss.length) t = `<div class="tile k on">K</div>`; else if (aa.length) { const k = kind(aa[0]); t = `<div class="tile ${k === 'h' ? 'w' : ''} on" style="${k === 'r' ? 'border-radius:12px;background:var(--c-rad);color:var(--ink-on,#0b0f14)' : k === 'h' ? 'background:var(--c-wan);color:var(--ink-on,#0b0f14)' : ''}">${k === 'r' ? 'R' : k === 'h' ? 'W' : 'A'}</div>`; } else if (ab) t = `<div class="tile pause">${ab.kind === 'krank' ? 'K' : 'P'}</div>`;
      tiles.push(`<div>${t}<span>${F.WD[F.dparse(ds).getDay()]}</span></div>`);
    }
    const st = E.muscleStats(S.sessions, S.exById, today, F.activeSplit()).sets7;
    const P = E.params(S.params);
    const bars = MUSC.filter((m) => E.BIG.includes(m) || ['waden', 'rotatoren'].includes(m) || E.prioOf(S.priorities, m, today) === 'schwerpunkt').map((m) => { const n = st[m] || 0, mx = 14; return `<div style="margin:9px 0"><div class="row between small"><span>${E.LABEL[m]}</span><span class="mute">${n} Sätze</span></div><div class="bar" style="margin-top:5px"><div class="band" style="left:${P.corridor_min / mx * 100}%;width:${(P.corridor_max - P.corridor_min) / mx * 100}%"></div><i style="width:${Math.min(100, n / mx * 100)}%"></i></div></div>`; }).join('');
    const recent = recentList(5);
    h += `<div class="grid2"><div><div class="card"><div class="h2">Letzte 7 Tage</div><div class="week">${tiles.join('')}</div><div class="small mute" style="margin-top:10px">K Kraft · R Rad · W Wandern · P Pause</div></div>
      <div class="card"><div class="h2">Aktivitäten</div>${recent || '<div class="mute">Noch nichts eingetragen.</div>'}</div></div>
      <div><div class="card"><div class="row between"><div class="h2">Sätze pro Woche</div><span class="badge">Ziel ${P.corridor_min}–${P.corridor_max}</span></div>${bars}<div class="small mute">${Object.keys(st).length ? '' : 'Noch keine protokollierten Sätze: Aus den übernommenen Einheiten sind keine Sätze bekannt. '}Gezählt werden abgeschlossene Sätze der letzten 7 Tage für die Hauptmuskelgruppe.</div></div>${stravaCard()}</div></div>`;
    return h;
  };
  function recentList(n) {
    const S = F.S, items = [];
    S.sessions.filter((s) => ['gefuehrt', 'bestaetigt'].includes(s.status)).forEach((s) => items.push({ d: s.session_date, t: s.title || 'Training', sub: `Kraft${s.duration_min ? ' · ' + s.duration_min + ' min' : ''}${s.source === 'chat_import' ? ' · übernommen' : ''}`, ic: 'dumb' }));
    S.activities.forEach((a) => { const e = E.energy(a, F.weightNow()); const km = a.distance_m ? ` · ${F.fmt(Math.round(a.distance_m / 100) / 10)} km` : ''; const w = a.avg_watts ? ` · Ø ${Math.round(a.avg_watts)} W` : ''; items.push({ d: a.start_at.slice(0, 10), t: a.name || F.sportName(a.sport), sub: `${F.sportName(a.sport)}${km}${w} · ca. ${e.kcal.toLocaleString('de-DE')} kcal`, tip: e.method, ic: kind(a) === 'r' ? 'bike' : kind(a) === 'h' ? 'hike' : 'dumb', strava: true }); });
    items.sort((a, b) => (a.d < b.d ? 1 : -1));
    return items.slice(0, n).map((i) => `<div class="list"><div class="it"><div class="ico">${F.icon[i.ic]}</div><div class="grow"><b>${esc(i.t)}</b><div class="small mute">${F.dlabel(i.d)} · ${esc(i.sub)}</div></div></div></div>`).join('');
  }
  function stravaCard() {
    const st = F.S.strava;
    if (st && st.linked) return `<div class="card flat"><div class="row between"><div><b>Aktivitäten verbunden</b><div class="small mute">${st.last_sync_at ? 'Zuletzt abgeglichen ' + new Date(st.last_sync_at).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }) : 'Import läuft oder steht aus'}</div></div><button class="btn sm" data-act="stravaSync">Abgleichen</button></div></div>`;
    return `<div class="card flat"><b>Strava verbinden</b><div class="small mute" style="margin:4px 0 12px">Fahrten und Wanderungen erscheinen dann im Kalender und fließen in die Planung ein.</div><button class="btn pri sm" data-act="stravaConnect">Verbinden</button></div>`;
  }
  F.acts.form = (t) => { F.ls.set('form-' + F.today(), t.dataset.v); F.render(); };
  F.acts.legs = (t) => { F.ls.set('legs-' + F.today(), t.dataset.v || null); F.render(); };
  F.acts.minutes = (t) => { F.ls.set('minutes', t.dataset.m ? Number(t.dataset.m) : null); F.render(); };
  F.acts.placeMenu = () => {
    F.modal(`<div class="h2">Wo trainierst du?</div><div class="list">${F.S.equipment.map((p) => `<button class="it" data-act="place" data-id="${p.id}"><div class="grow"><b>${esc(p.name)}</b><div class="small mute">${p.kind === 'studio' ? 'Studio' : (p.items.length ? p.items.length + ' Geräte' : 'Noch keine Geräte gewählt')}</div></div>${F.items().id === p.id ? '✓' : ''}</button>`).join('')}</div><button class="btn block" style="margin-top:10px" data-act="nav" data-r="mehr/geraete">Geräte bearbeiten</button>`);
  };
  F.acts.place = (t) => { F.ls.set('place', t.dataset.id); F.closeModal(); F.render(); };
  F.acts.pickDay = () => {
    const sp = F.activeSplit(); if (!sp) return;
    F.modal(`<div class="h2">Welchen Tag heute?</div><div class="list">${sp.days.map((d) => `<button class="it" data-act="forceDay" data-n="${esc(d.name)}"><div class="grow"><b>${esc(d.name)}</b><div class="small mute">${d.focus.map((m) => E.LABEL[m]).slice(0, 4).join(', ')}</div></div></button>`).join('')}</div><button class="btn ghost block" data-act="forceDay" data-n="">Automatisch wählen lassen</button>`);
  };
  F.acts.forceDay = (t) => { F.ls.set('force-' + F.today(), t.dataset.n || null); F.closeModal(); F.render(); };

  /* ---------- Kalender ---------- */
  F.ui.cal = { y: null, m: null, sel: null };
  F.views.kalender = () => {
    const S = F.S, c = F.ui.cal, today = F.today();
    if (c.y === null) { c.y = +today.slice(0, 4); c.m = +today.slice(5, 7) - 1; c.sel = today; }
    const first = new Date(c.y, c.m, 1), lead = (first.getDay() + 6) % 7, days = new Date(c.y, c.m + 1, 0).getDate();
    let cells = ''; ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].forEach((w) => (cells += `<div class="hd">${w}</div>`));
    for (let i = 0; i < lead; i++) cells += '<div></div>';
    for (let d = 1; d <= days; d++) {
      const ds = `${c.y}-${String(c.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dots = []; S.sessions.filter((s) => s.session_date === ds && s.kind === 'kraft' && ['gefuehrt', 'bestaetigt'].includes(s.status)).forEach(() => dots.push('<i></i>'));
      S.activities.filter((a) => a.start_at.slice(0, 10) === ds).forEach((a) => dots.push(`<i class="${kind(a) === 'h' ? 'h' : 'r'}"></i>`));
      if (S.absences.some((a) => a.from_date <= ds && a.to_date >= ds)) dots.push('<i class="p"></i>');
      cells += `<button class="d ${ds === today ? 'today' : ''} ${ds === c.sel ? 'sel' : ''}" data-act="calSel" data-d="${ds}">${d}<span class="dots">${dots.slice(0, 4).join('')}</span></button>`;
    }
    const mm = S.sessions.filter((s) => s.session_date.startsWith(`${c.y}-${String(c.m + 1).padStart(2, '0')}`) && s.kind === 'kraft' && ['gefuehrt', 'bestaetigt'].includes(s.status)).length;
    const am = S.activities.filter((a) => a.start_at.startsWith(`${c.y}-${String(c.m + 1).padStart(2, '0')}`));
    const sel = c.sel, ss = S.sessions.filter((s) => s.session_date === sel), aa = S.activities.filter((a) => a.start_at.slice(0, 10) === sel), ab = S.absences.filter((a) => a.from_date <= sel && a.to_date >= sel);
    const stl = { geplant: 'geplant', gefuehrt: 'im Verlauf geführt', bestaetigt: 'bestätigt', ausgelassen: 'ausgelassen' };
    const det = `<div class="card"><div class="row between"><div class="h2">${F.dlabel(sel)}</div><button class="btn sm" data-act="addEntry" data-d="${sel}">${F.icon.plus.replace('<svg', '<svg width="16" height="16"')} Eintragen</button></div>
      ${ss.map((s) => `<div class="list"><div class="it"><div class="ico">${F.icon.dumb}</div><div class="grow"><b>${esc(s.title || 'Training')}</b><div class="small mute">${stl[s.status]}${s.duration_min || s.planned_minutes ? ' · ' + (s.duration_min || s.planned_minutes) + ' min' : ''}${s.source === 'chat_import' ? ' · aus früherem Verlauf übernommen' : ''}</div></div><button class="mute" data-act="delSession" data-id="${s.id}" aria-label="Löschen">✕</button></div></div>`).join('')}
      ${aa.map((a) => { const e = E.energy(a, F.weightNow()); return `<div class="list"><div class="it"><div class="ico">${F.icon[kind(a) === 'r' ? 'bike' : kind(a) === 'h' ? 'hike' : 'dumb']}</div><div class="grow"><b>${esc(a.name || F.sportName(a.sport))}</b><div class="small mute">${F.sportName(a.sport)}${a.distance_m ? ' · ' + F.fmt(Math.round(a.distance_m / 100) / 10) + ' km' : ''}${a.moving_s ? ' · ' + Math.floor(a.moving_s / 3600) + ' h ' + String(Math.round(a.moving_s % 3600 / 60)).padStart(2, '0') + ' min' : ''}${a.avg_watts ? ' · Ø ' + Math.round(a.avg_watts) + ' W' : ''}<br>≈ ${e.kcal.toLocaleString('de-DE')} kcal (Schätzung, ${esc(e.method)})</div></div></div></div>`; }).join('')}
      ${ab.map((a) => `<div class="list"><div class="it"><div class="ico">${F.icon.warn}</div><div class="grow"><b>${{ pause: 'Pause', krank: 'Krank', schmerz: 'Schmerz', reise: 'Unterwegs', urlaub: 'Urlaub', ski: 'Skiurlaub' }[a.kind]}</b><div class="small mute">${F.dshort(a.from_date)}–${F.dshort(a.to_date)}${a.note ? ' · ' + esc(a.note) : ''}</div></div><button class="mute" data-act="delAbs" data-id="${a.id}" aria-label="Löschen">✕</button></div></div>`).join('')}
      ${!ss.length && !aa.length && !ab.length ? '<div class="mute">Nichts eingetragen.</div>' : ''}</div>`;
    return `<div class="row between" style="margin-bottom:12px"><div class="h1">Kalender</div></div>
      <div class="row between" style="margin-bottom:10px"><button class="btn sm ghost" data-act="calMove" data-n="-1" aria-label="Vorheriger Monat">‹</button><b>${F.MON[c.m]} ${c.y}</b><button class="btn sm ghost" data-act="calMove" data-n="1" aria-label="Nächster Monat">›</button></div>
      <div class="cal">${cells}</div><div class="small mute" style="margin:10px 2px 16px">${mm} × Kraft · ${am.filter((a) => RIDE.includes(a.sport)).length} × Rad · ${am.filter((a) => HIKE.includes(a.sport)).length} × Wandern</div>${det}`;
  };
  F.acts.calSel = (t) => { F.ui.cal.sel = t.dataset.d; F.render(); };
  F.acts.calMove = (t) => { const c = F.ui.cal; if (c.y == null || c.m == null) { const d = F.dparse(c.sel || F.today()); c.y = d.getFullYear(); c.m = d.getMonth(); } c.m += Number(t.dataset.n); if (c.m < 0) { c.m = 11; c.y--; } if (c.m > 11) { c.m = 0; c.y++; } F.render(); };
  F.acts.addEntry = (t) => {
    const d = t.dataset.d, sp = F.activeSplit();
    F.modal(`<div class="h2">Eintragen für ${F.dlabel(d)}</div><div class="seg" style="margin-bottom:14px"><button class="on" data-act="entryTab" data-v="train">Training</button><button data-act="entryTab" data-v="abs">Pause / Krank</button></div>
      <div id="e-train"><label class="f"><span>Welcher Tag?</span><select id="e-day">${(sp ? sp.days : []).map((x) => `<option>${esc(x.name)}</option>`).join('')}<option value="">Anderes</option></select></label><label class="f"><span>Dauer in Minuten (optional)</span><input id="e-min" type="number" inputmode="numeric"></label><label class="f"><span>Notiz (optional)</span><input id="e-note" type="text"></label><div class="small mute" style="margin-bottom:12px">Es werden keine Sätze oder Gewichte erfunden. Details bleiben „unbekannt“.</div><button class="btn pri block" data-act="saveTrain" data-d="${d}">Speichern</button></div>
      <div id="e-abs" class="hide"><label class="f"><span>Art</span><select id="a-kind"><option value="pause">Pause</option><option value="krank">Krank</option><option value="schmerz">Schmerz</option><option value="reise">Unterwegs</option></select></label><div class="row gap"><label class="f grow"><span>Von</span><input id="a-from" type="date" value="${d}"></label><label class="f grow"><span>Bis</span><input id="a-to" type="date" value="${d}"></label></div><label class="f"><span>Notiz (optional)</span><input id="a-note" type="text"></label><button class="btn pri block" data-act="saveAbs">Speichern</button></div>`);
  };
  F.acts.entryTab = (t) => { document.querySelectorAll('.modal .seg button').forEach((b) => b.classList.toggle('on', b === t)); document.getElementById('e-train').classList.toggle('hide', t.dataset.v !== 'train'); document.getElementById('e-abs').classList.toggle('hide', t.dataset.v !== 'abs'); };
  F.acts.saveTrain = async (t) => {
    const day = document.getElementById('e-day').value, min = F.num(document.getElementById('e-min').value);
    await F.insert('sessions', { session_date: t.dataset.d, kind: 'kraft', title: day || 'Krafttraining', split_day: day || null, status: 'bestaetigt', source: 'manuell', duration_min: min, note: document.getElementById('e-note').value || 'Details unbekannt' });
    F.closeModal(); await F.refresh(); F.toast('Gespeichert');
  };
  F.acts.delSession = async (t) => { if (!confirm('Diesen Eintrag löschen? Er bleibt im Änderungsprotokoll erhalten.')) return; await F.del('sessions', t.dataset.id); await F.refresh(); };
  F.acts.delAbs = async (t) => { await F.del('absences', t.dataset.id); await F.refresh(); };

  /* ---------- Fortschritt ---------- */
  /* Fortschritt: Ansicht in ui-extra.js */
  F.ins.progEx = (t) => { F.ui.prog.ex = t.value; F.render(); };
  F.acts.addWeight = () => F.modal(`<div class="h2">Körpergewicht</div><label class="f"><span>Datum</span><input id="w-d" type="date" value="${F.today()}"></label><label class="f"><span>Gewicht in kg</span><input id="w-v" type="text" inputmode="decimal" value="${F.fmt(F.weightNow())}"></label><button class="btn pri block" data-act="saveWeight">Speichern</button>`);
  F.acts.saveWeight = async () => {
    const v = F.num(document.getElementById('w-v').value), d = document.getElementById('w-d').value; if (!v || v < 30 || v > 300) return F.toast('Bitte ein gültiges Gewicht eintragen.');
    const r = await F.sb.from('body_weights').upsert({ user_id: F.user.id, measured_on: d, weight_kg: v }, { onConflict: 'user_id,measured_on' }); if (r.error) throw r.error;
    F.closeModal(); await F.refresh();
  };
})();
