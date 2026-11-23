/* forza · Kern: Zustand, Daten, Hilfsfunktionen */
(function () {
  const C = window.FORZA_CONFIG, E = window.Engine;
  const F = (window.F = { acts: {}, ins: {}, E, C, sb: null, S: {}, ui: {}, views: {} });
  F.keepLogin = () => { try { return localStorage.getItem('forza-keep') !== '0'; } catch (e) { return true; } };
  F.authStore = {
    getItem: (k) => { try { return localStorage.getItem(k) ?? sessionStorage.getItem(k); } catch (e) { return null; } },
    setItem: (k, v) => { try { if (F.keepLogin()) { localStorage.setItem(k, v); sessionStorage.removeItem(k); } else { sessionStorage.setItem(k, v); localStorage.removeItem(k); } } catch (e) { /* ignorieren */ } },
    removeItem: (k) => { try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch (e) { /* ignorieren */ } }
  };
  F.sb = window.supabase.createClient(C.supabaseUrl, C.publishableKey, { auth: { storage: F.authStore, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'forza-auth' } });

  /* ---------- Hilfen ---------- */
  F.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  F.num = (v) => { if (v === '' || v === null || v === undefined) return null; const n = Number(String(v).replace(',', '.')); return Number.isFinite(n) ? n : null; };
  F.fmt = E.fmt;
  F.today = () => E.todayStr();
  const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'], MON = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  F.WD = WD; F.MON = MON;
  F.dparse = (s) => new Date(s + 'T12:00:00');
  F.dlabel = (s) => { const d = F.dparse(s); return `${WD[d.getDay()]}, ${d.getDate()}. ${MON[d.getMonth()].slice(0, 3)}.`; };
  F.dshort = (s) => `${s.slice(8, 10)}.${s.slice(5, 7)}.`;
  F.addDays = (s, n) => { const d = F.dparse(s); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  F.toast = (m, ms = 2600) => { const t = document.getElementById('toast'); t.textContent = m; t.classList.remove('act'); t.classList.add('show'); clearTimeout(F._tt); F._tt = setTimeout(() => t.classList.remove('show'), ms); };
  /* Hinweis mit einer Aktion (z. B. „Rückgängig“), verschwindet nach 4,5 s */
  F.toastAct = (m, label, fn, ms = 4500) => {
    const t = document.getElementById('toast'); t.innerHTML = ''; const sp = document.createElement('span'); sp.textContent = m; const b = document.createElement('button'); b.className = 'toast-act'; b.textContent = label;
    b.addEventListener('click', async () => { t.classList.remove('show'); clearTimeout(F._tt); try { await fn(); } catch (e) { F.err(e); } }, { once: true });
    t.append(sp, b); t.classList.add('show', 'act'); clearTimeout(F._tt); F._tt = setTimeout(() => t.classList.remove('show', 'act'), ms);
  };
  F.err = (e, where) => { console.error(where, e); F.toast('Fehler' + (where ? ' bei ' + where : '') + ': ' + (e && e.message ? e.message : e), 4500); };
  F.ls = { get(k, d) { try { const v = localStorage.getItem('forza-' + k); return v === null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem('forza-' + k, JSON.stringify(v)); } catch {} } };

  const I = (p) => `<svg viewBox="0 0 24 24">${p}</svg>`;
  F.icon = {
    heute: I('<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>'),
    training: I('<path d="M6.5 6.5l11 11M3.5 9.5l3-3 2 2-3 3zM15.5 15.5l3-3 2 2-3 3zM9 4l2 2M13 18l2 2"/>'),
    kalender: I('<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/>'),
    fortschritt: I('<path d="M4 19V5M4 19h16M8 15l3-4 3 2 5-7"/>'),
    mehr: I('<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>'),
    chev: I('<path d="M9 6l6 6-6 6"/>'), back: I('<path d="M15 6l-6 6 6 6"/>'),
    bike: I('<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-8h5l3 8M10 8L9 6H7"/>'),
    hike: I('<path d="M3 19l6-10 4 6 2-3 6 7z"/>'),
    dumb: I('<path d="M6.5 6.5l11 11M3.5 9.5l3-3 2 2-3 3zM15.5 15.5l3-3 2 2-3 3z"/>'),
    plus: I('<path d="M12 5v14M5 12h14"/>'), check: I('<path d="M5 12l5 5 9-10"/>'), info: I('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.1"/>'),
    swap: I('<path d="M7 7h12l-3-3M17 17H5l3 3"/>'), warn: I('<path d="M12 4l9 16H3zM12 10v4M12 17v.1"/>'), note: I('<path d="M6 4h9l4 4v12H6zM9 12h6M9 16h6"/>')
  };

  /* ---------- Übungssuche ----------
     Findet auch mit Tippfehlern, ohne Umlaute (ue/ü/u), mit Muskel, Gerät oder englischen Namen.
     Jedes Suchwort muss irgendwo passen; sortiert nach Treffergüte, dann nach Häufigkeit bei dir. */
  const nz = (x) => String(x || '').toLowerCase().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u').replace(/[^a-z0-9]+/g, ' ').trim();
  F.nz = nz;
  const lev = (a, b) => { if (Math.abs(a.length - b.length) > 2) return 9; const d = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) { let prev = d[0]; d[0] = i; for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; } } return d[b.length]; };
  const SYN = { bauch: 'rumpf crunch core', bauchmuskeln: 'rumpf', sixpack: 'rumpf', core: 'rumpf', po: 'gesass', hintern: 'gesass', glute: 'gesass hip', glutes: 'gesass hip',
    arme: 'bizeps trizeps unterarme', arm: 'bizeps trizeps', bein: 'quadrizeps beinbeuger', beine: 'quadrizeps beinbeuger waden', oberschenkel: 'quadrizeps beinbeuger',
    rucken: 'lat oberer rucken', back: 'rucken lat', brustmuskel: 'brust', chest: 'brust', schulter: 'schulter', shoulder: 'schulter', nacken: 'nacken kinn',
    zuhause: 'korpergewicht band matte', heim: 'korpergewicht band matte', ohne: 'korpergewicht', hantel: 'kurzhantel langhantel', kabel: 'kabelzug', cable: 'kabel',
    maschine: 'maschine presse', machine: 'maschine', dumbbell: 'kurzhantel', barbell: 'langhantel', stange: 'langhantel ez',
    pulldown: 'latzug', row: 'rudern', rows: 'rudern', fly: 'fliegende butterfly pec', flys: 'fliegende butterfly', squat: 'kniebeuge', deadlift: 'kreuzheben',
    bench: 'bankdrucken', press: 'drucken presse', calf: 'waden', calves: 'waden', lunge: 'ausfallschritt split', lunges: 'ausfallschritt', triceps: 'trizeps', biceps: 'bizeps',
    hamstring: 'beinbeuger', hamstrings: 'beinbeuger', quad: 'quadrizeps beinstrecker', quads: 'quadrizeps beinstrecker', abs: 'rumpf crunch', dip: 'dips', pullup: 'klimmzug',
    chinup: 'chin klimmzug', raise: 'heben', extension: 'strecker strecken', curl: 'curl', plank: 'unterarmstutz stutz', stutz: 'unterarmstutz plank',
    dehnen: 'dehnung dehn', stretch: 'dehnung', mobility: 'mobilitat', haltung: 'mobilitat nacken bws', bws: 'brustwirbelsaule', therapie: 'therapieplan',
    klimmzug: 'klimmzug chin', liegestutz: 'liegestutz push up', pushup: 'liegestutz', crunch: 'crunch', wade: 'waden' };
  F.exSearch = (q, list) => {
    const toks = nz(q).split(' ').filter((t) => t.length >= 2 || /\d/.test(t)); if (!toks.length) return list.map((e) => ({ e, sc: 0 }));
    const freq = F.exFreq ? F.exFreq(90) : {};
    const prep = (e) => e._sx || (e._sx = { name: nz(e.name), nw: nz(e.name).split(' '),
      mus: nz((e.muscles_primary || []).map((m) => (E.LABEL[m] || '') + ' ' + m).join(' ')), sec: nz((e.muscles_secondary || []).map((m) => (E.LABEL[m] || '') + ' ' + m).join(' ')),
      eq: nz((e.equipment || []).concat(e.equipment_alt || []).map((i) => (F.itemLabel ? F.itemLabel(i) : '') + ' ' + i).join(' ')), pat: nz(e.pattern) });
    const tokScore = (x, t) => {
      let best = 0;
      for (const w of x.nw) { if (w === t) best = Math.max(best, 14); else if (w.startsWith(t)) best = Math.max(best, 11); else if (w.includes(t) && t.length >= 3) best = Math.max(best, 4); } // mitten im Wort zählt weniger (sonst passt „rücken“ auf „drücken“)
      if (x.mus.includes(t)) best = Math.max(best, 7); if (x.eq.includes(t)) best = Math.max(best, 5); if (x.sec.includes(t)) best = Math.max(best, 3); if (x.pat.includes(t)) best = Math.max(best, 3);
      if (!best && SYN[t]) for (const sy of SYN[t].split(' ')) if (x.name.includes(sy)) best = Math.max(best, 8); else if (x.mus.includes(sy) || x.eq.includes(sy) || x.pat.includes(sy)) best = Math.max(best, 5);
      if (!best && t.length >= 4) { const tol = t.length >= 7 ? 2 : 1; for (const w of x.nw.concat(x.mus.split(' '), x.eq.split(' '))) if (w.length >= 3 && (lev(t, w) <= tol || (w.length > t.length && lev(t, w.slice(0, t.length)) <= tol))) { best = Math.max(best, 4); break; } }
      return best;
    };
    const out = [];
    for (const e of list) { const x = prep(e); let sc = 0, ok = true; for (const t of toks) { const v = tokScore(x, t); if (!v) { ok = false; break; } sc += v; }
      if (!ok) continue; if (x.name.startsWith(toks[0])) sc += 4; sc += Math.min(4, freq[e.id] || 0); out.push({ e, sc }); }
    return out.sort((a, b) => b.sc - a.sc || a.e.name.localeCompare(b.e.name, 'de'));
  };

  /* ---------- Darstellung ---------- */
  /* Tageslicht-Theme: Phase nach Sonnenstand (Näherung für Süddeutschland, ca. 48,2° N / 10,8° O) */
  F.sunPhase = (d = new Date()) => {
    const N = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5), rad = Math.PI / 180, lat = 48.2, lon = 10.8;
    const decl = 23.44 * Math.sin(2 * Math.PI * (284 + N) / 365) * rad, H = Math.acos(Math.max(-1, Math.min(1, -Math.tan(lat * rad) * Math.tan(decl)))) / rad / 15;
    const noon = 12 - lon / 15 - d.getTimezoneOffset() / 60, sr = noon - H, ss = noon + H, t = d.getHours() + d.getMinutes() / 60;
    if (t < sr - .75 || t >= ss + .75) return 'nacht';
    if (t < sr + .75) return 'morgen';
    if (t < noon - 2) return 'vormittag';
    if (t < noon + 2) return 'mittag';
    if (t < ss - 1.25) return 'nachmittag';
    return 'abend';
  };
  setInterval(() => { if (F.look().theme === 'tag') F.applyLook(); }, 300000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && F.look().theme === 'tag') F.applyLook(); });
  F.defDash = () => (matchMedia('(min-width:900px)').matches ? 'klassisch' : 'fokus');
  F.applyLook = () => {
    const el = document.documentElement, p = F.ls.get('look', { theme: 'graphit', mode: 'dark', font: 'standard', anim: true });
    let mode = p.mode; if (mode === 'auto') mode = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    if (p.theme === 'tag') { const ph = F.sunPhase(); el.dataset.phase = ph; mode = (ph === 'nacht' || ph === 'abend') ? 'dark' : 'light'; } else delete el.dataset.phase;
    el.dataset.theme = p.theme; el.dataset.mode = mode; el.dataset.font = p.font; el.classList.toggle('noanim', !p.anim);
    const m = document.querySelector('meta[name=theme-color]'); if (m) { const bg = getComputedStyle(el).getPropertyValue('--bg2').trim(); m.content = bg || (mode === 'dark' ? '#141922' : '#f2f4f7'); }
  };
  F.look = () => F.ls.get('look', { theme: 'graphit', mode: 'dark', font: 'standard', anim: true });
  F.setLook = (k, v) => { const l = F.look(); l[k] = v; F.ls.set('look', l); F.applyLook(); };
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => F.applyLook());

  /* ---------- Daten laden ---------- */
  F.load = async () => {
    F.adoptOld(); await F.flush();
    const sb = F.sb, S = F.S;
    const since = F.addDays(F.today(), -400);
    const q = (t, f) => f(sb.from(t)).then((r) => { if (r.error) throw r.error; return r.data; });
    const [ex, ux, splits, prof, weights, prios, eqp, params, sess, abs, acts, link] = await Promise.all([
      q('exercises', (t) => t.select('*').order('name').limit(1000)),
      q('user_exercise_settings', (t) => t.select('*')),
      q('splits', (t) => t.select('*').order('created_at')),
      q('profiles', (t) => t.select('*').maybeSingle()),
      q('body_weights', (t) => t.select('*').order('measured_on')),
      q('priorities', (t) => t.select('*').order('valid_from')),
      q('equipment_profiles', (t) => t.select('*').order('created_at')),
      q('rule_params', (t) => t.select('*')),
      q('sessions', (t) => t.select('*, session_exercises(*, sets(*))').gte('session_date', since).order('session_date')),
      q('absences', (t) => t.select('*').gte('to_date', since).order('from_date')),
      q('activities', (t) => t.select('*').is('deleted_at', null).gte('start_at', since).order('start_at', { ascending: false }).limit(1500)),
      F.sb.functions.invoke('strava', { body: { action: 'status' } }).then((r) => r.data).catch(() => null)
    ]);
    Object.assign(S, { _freq: null, exercises: ex, userEx: Object.fromEntries(ux.map((u) => [u.exercise_id, u])), splits, profile: prof, weights, priorities: prios, equipment: eqp, paramRows: params, sessions: sess, absences: abs, activities: acts, strava: link });
    S.exById = Object.fromEntries(ex.map((e) => [e.id, e]));
    S.params = Object.fromEntries(params.map((p) => [p.key, p.value]));
    for (const s of S.sessions) { s.session_exercises = (s.session_exercises || []).sort((a, b) => a.position - b.position); s.session_exercises.forEach((se) => (se.sets = (se.sets || []).sort((a, b) => a.set_no - b.set_no))); }
    F.applyBox();
  };
  /* Nach längerer Pause frische Daten holen (z. B. neue Strava-Fahrten), aber nie mitten im Training oder beim Tippen */
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => { if (document.hidden) { hiddenAt = Date.now(); return; } F.flush(); if (F.user && hiddenAt && Date.now() - hiddenAt > 300000 && !F.openSession() && !document.getElementById('modal') && !(document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))) F.load().then(() => F.render()).catch(() => null); });
  F.refresh = async () => { await F.load(); F.render(); };

  F.weightNow = () => { const w = F.S.weights; return w.length ? Number(w[w.length - 1].weight_kg) : 80; };
  F.activeSplit = () => F.S.splits.find((s) => s.user_id && s.active) || F.S.splits.find((s) => s.active) || null;
  F.items = () => {
    const sel = F.ls.get('place', null);
    const prof = F.S.equipment.find((p) => p.id === sel) || F.S.equipment.find((p) => p.is_default) || F.S.equipment[0];
    if (!prof) return { id: null, name: 'Studio', kind: 'studio', items: F.allItems() };
    // Im Fitnessstudio sind immer alle Geräte da
    if (prof.kind === 'studio') return Object.assign({}, prof, { items: F.allItems() });
    return prof;
  };
  F.openSession = () => F.S.sessions.find((s) => ['kraft', 'sonstiges'].includes(s.kind) && s.status === 'geplant' && s.started_at && !s.finished_at) || null;

  F.painSet = () => {
    const cut = F.addDays(F.today(), -14), set = new Set();
    for (const s of F.S.sessions) if (s.session_date >= cut) for (const se of s.session_exercises) if (se.sets.some((x) => x.pain)) set.add(se.exercise_id);
    return set;
  };
  /* Übungen, die du in den letzten 90 Tagen in mindestens zwei Einheiten gemacht hast */
  /* Wie oft eine Übung in den letzten Tagen gemacht wurde (Einheiten mit erledigten Sätzen); zwischengespeichert bis zum nächsten Laden */
  F.exFreq = (days = 60, skipId = null) => { const k = days + ':' + skipId, c = (F.S._freq = F.S._freq || {}); if (c[k]) return c[k];
    const cut = F.addDays(F.today(), -days), n = {}; for (const s of F.S.sessions) if (s.session_date >= cut && s.id !== skipId) for (const se of s.session_exercises) if (se.sets.some((x) => x.done)) n[se.exercise_id] = (n[se.exercise_id] || 0) + 1; return (c[k] = n); };
  F.tried = () => { const n = F.exFreq(90); return new Set(Object.keys(n).filter((k) => n[k] >= 2)); };
  F.suggestion = () => {
    const S = F.S, form = F.ls.get('form-' + F.today(), 'normal'), minutes = F.ls.get('minutes', null);
    const acts = S.activities.filter((a) => ['Ride', 'VirtualRide', 'GravelRide', 'MountainBikeRide', 'EBikeRide'].includes(a.sport));
    const latest = acts[0]; let rideH = null;
    if (latest) { const end = new Date(latest.start_at).getTime() + (latest.moving_s || latest.duration_s || 0) * 1000; rideH = (Date.now() - end) / 3600000; if (rideH < 0 || rideH > 72 || (latest.kilojoules || 0) < 600 && (latest.moving_s || 0) < 5400) rideH = null; }
    const prio = F.S.priorities;
    const legs = F.ls.get('legs-' + F.today(), null);
    if (legs === 'frisch') rideH = null; else if (legs === 'schwer') rideH = 0;
    return E.suggest({ variant: F.ls.get('variant-' + F.today(), 0), avoid: F.ls.get('avoid-' + F.today(), []), exclude: F.ls.get('excl-' + F.today(), []), forceDay: F.ls.get('force-' + F.today(), null),
      studio: F.items().kind === 'studio' && !F.absMode(F.today()), superset: F.ls.get('superset', 'auto'), exercises: S.exercises, items: (() => { const u = F.absMode(F.today()); return u && u.mode !== 'studio' ? ['matte', 'band'] : F.items().items; })(), split: F.activeSplit(), sessions: S.sessions, absences: S.absences, priorities: prio,
      today: F.today(), form, minutes, params: S.params, rideHoursAgo: rideH,
      userEx: S.userEx, painEx: F.painSet(), tried: F.tried(), favorites: new Set(S.exercises.filter((x) => x.code === 'E17' || ['Pec Deck (Butterfly)', 'Leg Extension'].includes(x.name)).map((x) => x.id)), goals: (S.profile && S.profile.goals) || []
    });
  };

  /* iPhone: nach dem Schließen der Tastatur bleibt die Seite manchmal verschoben, feste Leisten sitzen falsch.
     Kurz an die aktuelle Stelle scrollen zwingt Safari, alles neu auszurichten. */
  document.addEventListener('focusout', (e) => { if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) setTimeout(() => { if (!document.activeElement || !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) window.scrollTo(window.scrollX, window.scrollY); }, 60); });
  /* Tastatur offen (iPhone): feste Leisten wandern sonst mit der Tastatur nach oben */
  if (window.visualViewport) {
    const vv = window.visualViewport, de = document.documentElement;
    // --vvh/--vvt: sichtbare Höhe und Verschiebung, damit Vollbild-Blätter genau über der Tastatur enden
    const kb = () => { de.classList.toggle('kb', window.innerHeight - vv.height > 140); de.style.setProperty('--vvh', vv.height + 'px'); de.style.setProperty('--vvt', vv.offsetTop + 'px'); };
    vv.addEventListener('resize', kb); vv.addEventListener('scroll', kb); kb();
  }

  /* ---------- Rendern und Ereignisse ---------- */
  F.route = () => (location.hash.replace(/^#\/?/, '') || 'heute').split('/');
  F.go = (r) => { if (location.hash === '#/' + r) { F.closeModal(); F.render(); window.scrollTo(0, 0); } else location.hash = '#/' + r; }; // gleiche Adresse: kein hashchange, also selbst neu zeichnen
  F.render = () => {
    const root = document.getElementById('root');
    if (!F.user) { F.views.auth(root); return; }
    const [main, ...rest] = F.route();
    const nav = [['heute', 'Heute'], ['training', 'Training'], ['kalender', 'Kalender'], ['fortschritt', 'Fortschritt'], ['mehr', 'Einstellungen']];
    // Übungsseite: der Tab, aus dem man kam (im Training: Training, sonst Einstellungen)
    const cur = main === 'uebung' ? (F.openSession() ? 'training' : 'mehr') : main === 'katalog' ? 'mehr' : main;
    const view = F.views[main] || F.views.heute;
    const body = view(rest) || '';
    root.innerHTML = `<div class="app"><aside class="side"><div class="brand"><img src="assets/forza.svg" alt="">forza</div>${nav.map(([k, l]) => `<button class="nv ${cur === k ? 'on' : ''}" data-act="nav" data-r="${k}">${F.icon[k]}${l}</button>`).join('')}</aside>
      <main class="main">${body}</main><nav class="bnav">${nav.map(([k, l]) => `<button class="${cur === k ? 'on' : ''}" data-act="nav" data-r="${k}">${F.icon[k]}<span>${l}</span></button>`).join('')}</nav></div>${F.restBar ? F.restBar() : ''}<div id="netb" class="netb" role="status"></div>`;
    if (F.after) F.after(main, rest);
    if (F.fitAll) F.fitAll();
    F.netBadge();
  };
  /* Fenster als Blatt von unten: Griff oben, nach unten wischen schließt, Hintergrund scrollt nicht mit */
  F.modal = (html, o = {}) => {
    F.closeModal(); const m = document.createElement('div'); m.className = 'modal' + (o.full ? ' full' : ''); m.id = 'modal'; m.innerHTML = `<div><span class="grab" aria-hidden="true"></span>${html}</div>`;
    m.addEventListener('click', (e) => { if (e.target === m) F.closeModal(); }); document.body.appendChild(m);
    const sh = m.firstElementChild; let y0 = null, dy = 0;
    // Nur ziehen, wenn nichts darüber gescrollt ist (auch keine innere Liste wie die Übungssuche)
    const scrolled = (el) => { for (let n = el; n && n !== m; n = n.parentElement) if (n.scrollTop > 0) return true; return false; };
    sh.addEventListener('touchstart', (e) => { if (scrolled(e.target) || (e.target.closest && e.target.closest('input,textarea,select,[data-noswipe]'))) { y0 = null; return; } y0 = e.touches[0].clientY; dy = 0; sh.style.animation = 'none'; sh.style.transition = 'none'; }, { passive: true });
    sh.addEventListener('touchmove', (e) => { if (y0 === null) return; dy = Math.max(0, e.touches[0].clientY - y0); if (dy > 0) sh.style.transform = `translateY(${dy}px)`; }, { passive: true });
    sh.addEventListener('touchend', () => { if (y0 === null) return; y0 = null; sh.style.transition = ''; if (dy > 110) { sh.style.transform = 'translateY(110%)'; setTimeout(F.closeModal, 180); } else sh.style.transform = ''; });
  };
  F.closeModal = () => document.getElementById('modal')?.remove();

  document.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-act]'); if (!t) return;
    const fn = F.acts[t.dataset.act]; if (!fn) return;
    try { await fn(t, e); } catch (er) { F.err(er); }
  });
  const onIn = (ev) => { const t = ev.target.closest('[data-in]'); if (!t) return; const fn = F.ins[t.dataset.in]; if (fn) fn(t, ev); };
  document.addEventListener('change', onIn); document.addEventListener('input', (e) => { if (e.target.dataset && e.target.dataset.live) onIn(e); });
  F.acts.nav = (t) => { F.go(t.dataset.r); };
  F.acts.back = () => history.length > 1 ? history.back() : F.go('heute');
  F.acts.close = () => F.closeModal();
  window.addEventListener('hashchange', () => { F.closeModal(); F.render(); window.scrollTo(0, 0); });

  /* ---------- Schreibhilfen ---------- */
  F.insert = async (t, row) => { const r = await F.sb.from(t).insert(row).select().single(); if (r.error) throw r.error; return r.data; };
  F.update = async (t, id, row) => { const r = await F.sb.from(t).update(row).eq('id', id).select().single(); if (r.error) throw r.error; return r.data; };

  /* ---------- Offline-fest speichern (Studio mit schlechtem Netz) ----------
     Sätze und das Beenden gehen nie verloren: Klappt das Speichern nicht, merkt sich forza die Änderung
     auf dem Gerät und reicht sie nach, sobald wieder Netz da ist. */
  const isNet = (e) => !navigator.onLine || /fetch|network|load failed|timed? ?out|abort/i.test(String((e && (e.message || e.details)) || e));
  const isAuth = (e) => /jwt|token|401|PGRST301|not authenticated/i.test(String((e && (e.code + ' ' + e.message)) || e));
  // je Konto getrennt, damit nie Änderungen eines anderen Kontos auf diesem Gerät gesendet werden
  const bkey = () => 'outbox-' + (F.user ? F.user.id : 'x');
  const box = () => F.ls.get(bkey(), []), boxSet = (b) => F.ls.set(bkey(), b);
  F.pending = () => box().length;
  // Speichern mit Zeitlimit: schwaches WLAN soll nichts blockieren; nach 8 s gilt es als „kein Netz“
  const updT = async (t, id, row, ms = 8000) => {
    const ac = new AbortController(), tm = setTimeout(() => ac.abort(), ms);
    try { const r = await F.sb.from(t).update(row).eq('id', id).select().single().abortSignal(ac.signal); if (r.error) throw r.error; return r.data; } finally { clearTimeout(tm); }
  };
  F.save = async (t, id, row) => {
    if (!F.pending()) { try { return await updT(t, id, row); } catch (e) { if (!isNet(e) && !isAuth(e)) throw e; } }
    const b = box(), hit = b.find((x) => x.t === t && x.id === id);
    if (hit) { Object.assign(hit.row, row); hit.v = (hit.v || 0) + 1; } else b.push({ t, id, row, v: 1, n: 0 });
    boxSet(b); F.netBadge();
    if (b.length === 1) F.toast('Kein Netz: gespeichert auf dem Gerät, wird automatisch nachgereicht.', 3500);
    F.flush();
    return Object.assign({ id }, row);
  };
  /* Nachreichen: liest die Warteschlange bei jedem Schritt neu (es kann parallel abgehakt werden) und entfernt
     einen Eintrag nur, wenn genau diese Fassung gespeichert wurde. Anmeldefehler: Sitzung erneuern, später nochmal. */
  let flushP = null;
  F.flush = () => {
    if (flushP) return flushP;
    if (!F.pending() || !navigator.onLine || !F.user) return Promise.resolve();
    flushP = (async () => {
      try {
        for (;;) {
          const x = box()[0]; if (!x) break;
          let gone = false;
          try { await updT(x.t, x.id, x.row); gone = true; } catch (e) {
            if (isNet(e)) break;
            if (isAuth(e)) { await F.sb.auth.refreshSession().catch(() => null); break; }
            console.error('Nachreichen', e); x.n = (x.n || 0) + 1;
            if (x.n >= 5) { gone = true; F.toast('Eine Änderung ließ sich nicht speichern und wurde verworfen.', 4500); }
            else { const b = box(); const k = b.findIndex((y) => y.t === x.t && y.id === x.id); if (k >= 0) { b[k].n = x.n; boxSet(b); } break; }
          }
          if (gone) { const b = box(), k = b.findIndex((y) => y.t === x.t && y.id === x.id && (y.v || 0) === (x.v || 0)); if (k >= 0) { b.splice(k, 1); boxSet(b); } }
        }
        if (!F.pending()) F.toast('Alles nachgetragen.');
      } finally { flushP = null; F.netBadge(); }
    })();
    return flushP;
  };
  // Falls das Netz „da“ ist, aber nichts durchkommt: alle 30 s erneut versuchen, solange etwas aussteht
  setInterval(() => { if (F.pending()) F.flush(); }, 30000);
  // Alte, kontoübergreifende Warteschlange aus der ersten Fassung übernehmen
  try { const old = localStorage.getItem('forza-outbox'); if (old) { localStorage.setItem('forza-outbox-pending', old); localStorage.removeItem('forza-outbox'); } } catch (e) { /* ignorieren */ }
  F.adoptOld = () => { try { const old = JSON.parse(localStorage.getItem('forza-outbox-pending') || '[]'); if (old.length && F.user) { boxSet(box().concat(old)); localStorage.removeItem('forza-outbox-pending'); } } catch (e) { /* ignorieren */ } };
  // noch ausstehende Änderungen auf frisch geladene Daten legen
  F.applyBox = () => { for (const x of box()) { if (x.t === 'sessions') { const o = F.S.sessions.find((q) => q.id === x.id); if (o) Object.assign(o, x.row); }
    else if (x.t === 'sets') for (const q of F.S.sessions) for (const se of q.session_exercises) { const st = se.sets.find((y) => y.id === x.id); if (st) Object.assign(st, x.row); } } };
  F.netBadge = () => { const n = F.pending(); document.documentElement.classList.toggle('offline', !navigator.onLine || n > 0); const el = document.getElementById('netb'); if (el) el.textContent = n ? n + ' ausstehend' : 'Offline'; };
  window.addEventListener('online', () => { F.netBadge(); F.flush(); });
  window.addEventListener('offline', () => F.netBadge());
  F.del = async (t, id) => { const r = await F.sb.from(t).delete().eq('id', id); if (r.error) throw r.error; };
})();
