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
  F.toast = (m, ms = 2600) => { const t = document.getElementById('toast'); t.textContent = m; t.classList.add('show'); clearTimeout(F._tt); F._tt = setTimeout(() => t.classList.remove('show'), ms); };
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

  /* ---------- Darstellung ---------- */
  F.applyLook = () => {
    const el = document.documentElement, p = F.ls.get('look', { theme: 'graphit', mode: 'dark', font: 'standard', anim: true });
    let mode = p.mode; if (mode === 'auto') mode = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    el.dataset.theme = p.theme; el.dataset.mode = mode; el.dataset.font = p.font; el.classList.toggle('noanim', !p.anim);
    const m = document.querySelector('meta[name=theme-color]'); if (m) { const bg = getComputedStyle(el).getPropertyValue('--bg2').trim(); m.content = bg || (mode === 'dark' ? '#141922' : '#f2f4f7'); }
  };
  F.look = () => F.ls.get('look', { theme: 'graphit', mode: 'dark', font: 'standard', anim: true });
  F.setLook = (k, v) => { const l = F.look(); l[k] = v; F.ls.set('look', l); F.applyLook(); };
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => F.applyLook());

  /* ---------- Daten laden ---------- */
  F.load = async () => {
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
    Object.assign(S, { exercises: ex, userEx: Object.fromEntries(ux.map((u) => [u.exercise_id, u])), splits, profile: prof, weights, priorities: prios, equipment: eqp, paramRows: params, sessions: sess, absences: abs, activities: acts, strava: link });
    S.exById = Object.fromEntries(ex.map((e) => [e.id, e]));
    S.params = Object.fromEntries(params.map((p) => [p.key, p.value]));
    for (const s of S.sessions) { s.session_exercises = (s.session_exercises || []).sort((a, b) => a.position - b.position); s.session_exercises.forEach((se) => (se.sets = (se.sets || []).sort((a, b) => a.set_no - b.set_no))); }
  };
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
  F.allItems = () => { const set = new Set(); (F.S.exercises || []).forEach((e) => [...(e.equipment || []), ...(e.equipment_alt || [])].forEach((i) => i !== 'koerpergewicht' && set.add(i))); return [...set]; };
  F.openSession = () => F.S.sessions.find((s) => ['kraft', 'sonstiges'].includes(s.kind) && s.status === 'geplant' && s.started_at && !s.finished_at) || null;

  F.painSet = () => {
    const cut = F.addDays(F.today(), -14), set = new Set();
    for (const s of F.S.sessions) if (s.session_date >= cut) for (const se of s.session_exercises) if (se.sets.some((x) => x.pain)) set.add(se.exercise_id);
    return set;
  };
  F.suggestion = () => {
    const S = F.S, form = F.ls.get('form-' + F.today(), 'normal'), minutes = F.ls.get('minutes', null);
    const acts = S.activities.filter((a) => ['Ride', 'VirtualRide', 'GravelRide', 'MountainBikeRide', 'EBikeRide'].includes(a.sport));
    const latest = acts[0]; let rideH = null;
    if (latest) { const end = new Date(latest.start_at).getTime() + (latest.moving_s || latest.duration_s || 0) * 1000; rideH = (Date.now() - end) / 3600000; if (rideH < 0 || rideH > 72 || (latest.kilojoules || 0) < 600 && (latest.moving_s || 0) < 5400) rideH = null; }
    const prio = F.S.priorities;
    const legs = F.ls.get('legs-' + F.today(), null);
    if (legs === 'frisch') rideH = null; else if (legs === 'schwer') rideH = 0;
    return E.suggest({ variant: F.ls.get('variant-' + F.today(), 0), avoid: F.ls.get('avoid-' + F.today(), []), exclude: F.ls.get('excl-' + F.today(), []), forceDay: F.ls.get('force-' + F.today(), null),
      exercises: S.exercises, items: F.items().items, split: F.activeSplit(), sessions: S.sessions, absences: S.absences, priorities: prio,
      today: F.today(), form, minutes, params: S.params, rideHoursAgo: rideH,
      userEx: S.userEx, painEx: F.painSet(), favorites: new Set(S.exercises.filter((x) => x.code === 'E17' || ['Pec Deck (Butterfly)', 'Leg Extension'].includes(x.name)).map((x) => x.id)), goals: (S.profile && S.profile.goals) || []
    });
  };

  /* ---------- Rendern und Ereignisse ---------- */
  F.route = () => (location.hash.replace(/^#\/?/, '') || 'heute').split('/');
  F.go = (r) => { location.hash = '#/' + r; };
  F.render = () => {
    const root = document.getElementById('root');
    if (!F.user) { F.views.auth(root); return; }
    const [main, ...rest] = F.route();
    const nav = [['heute', 'Heute'], ['training', 'Training'], ['kalender', 'Kalender'], ['fortschritt', 'Fortschritt'], ['mehr', 'Einstellungen']];
    const cur = ['uebung', 'katalog'].includes(main) ? 'mehr' : main;
    const view = F.views[main] || F.views.heute;
    const body = view(rest) || '';
    root.innerHTML = `<div class="app"><aside class="side"><div class="brand"><img src="assets/forza.svg" alt="">forza</div>${nav.map(([k, l]) => `<button class="nv ${cur === k ? 'on' : ''}" data-act="nav" data-r="${k}">${F.icon[k]}${l}</button>`).join('')}</aside>
      <main class="main">${body}</main><nav class="bnav">${nav.map(([k, l]) => `<button class="${cur === k ? 'on' : ''}" data-act="nav" data-r="${k}">${F.icon[k]}<span>${l}</span></button>`).join('')}</nav></div>${F.restBar ? F.restBar() : ''}`;
    if (F.after) F.after(main, rest);
  };
  F.modal = (html) => { F.closeModal(); const m = document.createElement('div'); m.className = 'modal'; m.id = 'modal'; m.innerHTML = `<div>${html}</div>`; m.addEventListener('click', (e) => { if (e.target === m) F.closeModal(); }); document.body.appendChild(m); };
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
  F.del = async (t, id) => { const r = await F.sb.from(t).delete().eq('id', id); if (r.error) throw r.error; };
})();
