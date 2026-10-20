/* forza · Regelwerk (regelbasiert, keine KI). Version der Parameter wird mit jedem Vorschlag gespeichert. */
(function (root) {
  const RULE_VERSION = 'forza-regeln-1.0';
  const DAY = 86400000;
  const DEFAULTS = {
    corridor_min: 6, corridor_max: 10,           // R13: Sätze je großer Muskelgruppe pro Woche
    calm_reserve_add: 1,                          // R05: ruhigere Tagesform = Reserve +1
    calm_sets_minus: 1,                           // R05: ein Satz weniger bei 3+ Sätzen
    pause_reentry_days: 7,                        // R15: ab dieser Pause vorsichtiger Wiedereinstieg
    reentry_load_factor: 1.0,                     // optional 0.85–0.90 (Standard aus)
    infection_reentry_sessions: 2,                // R17: so viele Einheiten reduziert nach Krankheit
    min_rest_hours_same_muscle: 48,
    leg_after_ride_hours: 24,                     // R19
    load_step_total: 2.5, load_step_hand: 1,      // kg
    default_minutes: 55,
    rest_m: 30, posture_block: 1, rest_g: 150, rest_g_long: 180, rest_a: 90, rest_s: 75, rest_c: 75, rest_i: 75, rest_t: 90 // Sekunden
  };
  const PROFILES = {
    G: { sets: 2, reps: [6, 10], rir: [2, 3], rest: 'rest_g', label: 'Grundbewegung' },
    A: { sets: 2, reps: [10, 15], rir: [2, 3], rest: 'rest_a', label: 'Zusatzübung' },
    S: { sets: 2, reps: [12, 20], rir: [3, 4], rest: 'rest_s', label: 'Schulterkontrolle' },
    C: { sets: 2, reps: [6, 10], rir: null, rest: 'rest_c', label: 'Rumpf dynamisch', perSide: true },
    I: { sets: 2, secs: [15, 30], rir: null, rest: 'rest_i', label: 'Stütz' },
    T: { sets: 2, secs: [20, 30], rir: null, rest: 'rest_t', label: 'Tragen' },
    M: { sets: 2, reps: [8, 12], rir: null, rest: 'rest_m', label: 'Mobilität und Haltung' }
  };
  const BIG = ['quadrizeps', 'hamstrings', 'gesaess', 'brust', 'lat', 'ruecken_hoch', 'schulter_seitlich', 'schulter_hinten'];
  const LABEL = {
    quadrizeps: 'Quadrizeps', hamstrings: 'Beinbeuger', gesaess: 'Gesäß', waden: 'Waden', adduktoren: 'Adduktoren',
    brust: 'Brust', lat: 'Latissimus', ruecken_hoch: 'Oberer Rücken', ruecken_unten: 'Unterer Rücken',
    schulter_vorn: 'Vordere Schulter', schulter_seitlich: 'Seitliche Schulter', schulter_hinten: 'Hintere Schulter',
    rotatoren: 'Rotatoren', bizeps: 'Bizeps', trizeps: 'Trizeps', unterarme: 'Unterarme', rumpf: 'Rumpf',
    rotatoren_huefte: 'Hüftrotatoren', brustwirbelsaeule: 'Brustwirbelsäule', nacken: 'Nacken'
  };
  const PRIO_W = { schwerpunkt: 1.5, normal: 1, erhalt: 0.5 };

  const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));
  const dstr = (d) => new Date(d).toISOString().slice(0, 10);
  const todayStr = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
  const dayDiff = (a, b) => Math.round((new Date(a + 'T12:00:00Z') - new Date(b + 'T12:00:00Z')) / DAY);

  function profOf(code, P, goals, prio) {
    const base = PROFILES[code] || PROFILES.A, out = Object.assign({}, base);
    if (P['dose_' + code + '_sets']) out.sets = P['dose_' + code + '_sets'];
    if (P['dose_' + code + '_lo'] && P['dose_' + code + '_hi'] && base.reps) out.reps = [P['dose_' + code + '_lo'], P['dose_' + code + '_hi']];
    // Ziel Kraft: Schwerpunkt-Grundübung 3 x 4-6 mit längerer Pause (Projektdatei, Abschnitt 51)
    if (code === 'G' && prio === 'schwerpunkt' && (goals || []).includes('Kraft') && !P['dose_G_lo']) { out.sets = Math.max(out.sets, 3); out.reps = [4, 6]; out.rest = 'rest_g_long'; }
    return out;
  }
  function params(user) { return Object.assign({}, DEFAULTS, user || {}); }

  /* Aktuelle Priorität je Muskelgruppe: jüngster Eintrag mit valid_from <= Stichtag (R22: gilt ab nächster Planung) */
  function prioOf(priorities, muscle, onDate) {
    let best = null;
    for (const p of priorities || []) {
      if (p.muscle_group !== muscle || p.valid_from > onDate) continue;
      if (!best || p.valid_from > best.valid_from) best = p;
    }
    return best ? best.level : 'normal';
  }

  function available(ex, items) {
    const have = new Set(items);
    const ok = (list) => list.every((e) => have.has(e) || e === 'koerpergewicht');
    if (ok(ex.equipment || [])) return { ok: true, via: 'direkt' };
    // Alternative: mindestens ein Heimgerät aus equipment_alt
    if ((ex.equipment_alt || []).some((e) => have.has(e)) && ex.equipment_alt.length) return { ok: true, via: 'alternativ' };
    return { ok: false };
  }

  function eligible(ex, ctx) {
    if (!ex.active) return false;
    const st = (ctx.userEx || {})[ex.id] || {};
    if (st.hidden) return false;
    if (ex.tier !== 'geprueft' && !st.released && ex.dosage_profile !== 'M') return false;
    // Neutrale Vorgabe: keine Langhantel-Bankdrücken-Automatik (Vorliebe Kurzhantel)
    if (ex.name === 'Langhantel Bankdrücken') return false;
    if ((ctx.painEx || new Set()).has(ex.id)) return false;
    return available(ex, ctx.items).ok;
  }

  /* Letzte Belastung je Muskelgruppe in Tagen; Sätze der letzten 7 Tage */
  function muscleStats(sessions, exById, today, split) {
    const last = {}, sets7 = {};
    for (const s of sessions) {
      if (s.kind !== 'kraft' || !['gefuehrt', 'bestaetigt'].includes(s.status)) continue;
      const ago = dayDiff(today, s.session_date);
      if (!(s.session_exercises || []).length && s.split_day && split && split.days) {
        // Einheit ohne Satzdaten (z. B. nachgetragen): Fokus-Muskeln des Split-Tags mit 3 Sätzen angerechnet
        const dd = split.days.find((x) => x.name === s.split_day);
        for (const m of (dd ? dd.focus : [])) {
          if (last[m] === undefined || ago < last[m]) last[m] = ago;
          if (ago >= 0 && ago < 7) sets7[m] = (sets7[m] || 0) + 3;
        }
        continue;
      }
      // Je Einheit zählen: ab 3 Sätzen auf einen Muskel gilt er als voll belastet; wenige Zusatzsätze (z. B. spontan
      // eine Beinpresse am Brusttag) setzen die Erholungsuhr nur teilweise zurück, damit der Beintag nicht ausfällt.
      const perM = {};
      for (const se of s.session_exercises || []) {
        const ex = exById[se.exercise_id]; if (!ex || ex.dosage_profile === 'M') continue;
        const nSets = (se.sets || []).filter((x) => x.done).length || 0;
        for (const m of ex.muscles_primary) perM[m] = (perM[m] || 0) + nSets;
      }
      for (const m in perM) {
        const n = perM[m]; if (!n) continue;
        const eff = n >= 3 ? ago : ago + 3;
        if (last[m] === undefined || eff < last[m]) last[m] = eff;
        if (ago >= 0 && ago < 7) sets7[m] = (sets7[m] || 0) + n;
      }
    }
    return { last, sets7 };
  }

  function lastWorkSets(sessions, exId) {
    const arr = sessions.filter((s) => ['gefuehrt', 'bestaetigt'].includes(s.status))
      .sort((a, b) => (a.session_date < b.session_date ? 1 : -1));
    for (const s of arr) for (const se of s.session_exercises || []) {
      if (se.exercise_id === exId) {
        const sets = (se.sets || []).filter((x) => x.done && x.load_kg !== null && x.reps !== null);
        if (sets.length) return { date: s.session_date, sets };
      }
    }
    return null;
  }

  /* R06: Doppelte Progression. Alle Sätze im oberen Wiederholungsbereich bei ausreichender Reserve → Last erhöhen. */
  function loadSuggestion(ex, prof, last, P, calm) {
    const step = ex.load_convention === 'je_hand' ? P.load_step_hand : P.load_step_total;
    if (!last) return { kg: null, text: 'Erstkalibrierung: leichter starten, 3–4 Wiederholungen Reserve; Gewicht notieren.', first: true };
    const top = Math.max(...last.sets.map((s) => s.load_kg));
    const topSets = last.sets.filter((s) => s.load_kg === top);
    const hit = prof.reps && topSets.length >= 2 && topSets.every((s) => s.reps >= prof.reps[1] && (s.rir === null || s.rir >= prof.rir[0]));
    let kg = top;
    let text = `Zuletzt ${fmt(top)} kg${ex.load_convention === 'je_hand' ? ' je Hand' : ''} (${last.date.slice(8, 10)}.${last.date.slice(5, 7)}.).`;
    if (hit && !calm) { kg = top + step; text += ` Oberer Bereich sicher erreicht, daher +${fmt(step)} kg.`; }
    else text += ' Gleiches Gewicht, mehr Wiederholungen anpeilen.';
    if (calm) text += ' Ruhigere Tagesform: keine Steigerung.';
    return { kg, text, first: false };
  }
  const fmt = (n) => String(Math.round(n * 100) / 100).replace('.', ',');

  /* Tagesauswahl im Split */
  function pickDay(split, ctx, stats, P) {
    const days = (split && split.days) || [];
    if (!days.length) return null;
    if (ctx.forceDay) { const i = days.findIndex((x) => x.name === ctx.forceDay); if (i >= 0) return { d: days[i], i, score: 0, legs: 0, penalty: 0, forced: true }; }
    const rows = days.map((d, i) => {
      let score = 0, parts = [];
      for (const m of d.focus) {
        const pr = prioOf(ctx.priorities, m, ctx.today);
        const since = stats.last[m] === undefined ? 14 : Math.min(stats.last[m], 14);
        const sets = stats.sets7[m] || 0;
        const def = BIG.includes(m) ? Math.max(0, P.corridor_min - sets) : 0;
        score += (since + def) * PRIO_W[pr];
        parts.push(m);
      }
      score /= d.focus.length;
      // Beine als Schwerpunkt: Tage mit Beinen werden bevorzugt, damit sie regelmäßig dran sind
      const lg = d.focus.filter((m) => ['quadrizeps', 'hamstrings', 'gesaess', 'waden'].includes(m) && prioOf(ctx.priorities, m, ctx.today) === 'schwerpunkt').length;
      if (lg) score += Math.min(2, lg * 0.8);
      // Ein Schwerpunkt-Muskel, der seit 5+ Tagen nicht voll dran war, hebt Tage mit ihm deutlich an
      const stale = d.focus.filter((m) => prioOf(ctx.priorities, m, ctx.today) === 'schwerpunkt' && (stats.last[m] === undefined || stats.last[m] >= 5)).length;
      if (stale) score += Math.min(3, stale * 1.2);
      // R19: Beine nach harter Radeinheit zurückhalten
      const legs = d.focus.filter((m) => ['quadrizeps', 'hamstrings', 'gesaess'].includes(m)).length / d.focus.length;
      let penalty = 0;
      if (ctx.rideHoursAgo !== null && ctx.rideHoursAgo < P.leg_after_ride_hours) penalty = legs * 6;
      // Rotation: gleicher Tag wie zuletzt wird gemieden
      if (ctx.lastDayName && d.name === ctx.lastDayName) penalty += 3;
      // Rotation: Tag nach dem zuletzt geführten bekommt kleinen Bonus
      const li = days.findIndex((x) => x.name === ctx.lastDayName);
      if (li >= 0 && (li + 1) % days.length === i) score += 1.5;
      return { d, i, score: score - penalty, legs, penalty };
    });
    rows.sort((a, b) => b.score - a.score || a.i - b.i);
    return rows[0];
  }

  /* Haltungs- und Mobilitätsblock: rotiert zwischen BWS, Brust/Nacken, je Einheit höchstens n Übungen */
  function mobilityPick(ctx, P, n) {
    const have = new Set((ctx.items || []));
    const all = ctx.exercises.filter((e) => e.active && e.dosage_profile === 'M' && !((ctx.userEx || {})[e.id] || {}).hidden && available(e, [...have]).ok && !(ctx.painEx || new Set()).has(e.id));
    const lastUse = {};
    (ctx.sessions || []).forEach((s) => (s.session_exercises || []).forEach((se) => { if (!lastUse[se.exercise_id] || s.session_date > lastUse[se.exercise_id]) lastUse[se.exercise_id] = s.session_date; }));
    const groups = [['mobilitaet_bws'], ['mobilitaet_nacken'], ['mobilitaet_bws', 'mobilitaet_nacken']];
    const out = [], used = new Set();
    const prof = profOf('M', P, ctx.goals, 'normal');
    const order = (list) => list.slice().sort((a, b) => (lastUse[a.id] || '') < (lastUse[b.id] || '') ? -1 : 1);
    for (const g of groups.slice(0, n)) {
      const e = order(all.filter((x) => g.includes(x.pattern) && !used.has(x.id)))[0];
      if (e) { used.add(e.id); out.push({ exercise_id: e.id, name: e.name, code: null, muscle: e.muscles_primary[0], sets: prof.sets, profile: 'M', reps: prof.reps, secs: null, perSide: false, rir: null, rest_s: P.rest_m, load_kg: null, load_convention: 'keine', load_text: 'Langsam und kontrolliert, ohne Schmerz.', first: false, tier: e.tier, prio: 'normal', mobility: true }); }
    }
    return out;
  }

  /* Feste Reihenfolge je Split-Tag (wie im bisherigen Coaching). Jeder Platz: Muskel, Profil, bevorzugte Bewegungsmuster in Reihenfolge. */
  const TEMPLATES = {
    'Oberkörper': [['brust', 'G', ['horizontal_druecken', 'schraeg_druecken']], ['lat', 'G', ['vertikal_ziehen']], ['ruecken_hoch', 'G', ['horizontal_ziehen']], ['brust', 'G', ['schraeg_druecken', 'vertikal_druecken']], ['schulter_seitlich', 'A', ['seitheben']], ['schulter_hinten', 'A', ['reverse_fly']], ['rotatoren', 'S', ['rotation', 'horizontal_ziehen']], ['trizeps', 'A', ['trizeps_strecken']]],
    'Unterkörper': [['quadrizeps', 'G', ['kniebeuge']], ['hamstrings', 'G', ['huefte_beugen']], ['quadrizeps', 'G', ['beinpresse', 'ausfallschritt']], ['hamstrings', 'A', ['beinbeugen']], ['quadrizeps', 'A', ['kniestrecken']], ['waden', 'A', ['wadenheben']], ['rumpf', 'C', ['rumpf_dynamisch', 'anti_rotation']]],
    'Push': [['brust', 'G', ['schraeg_druecken']], ['brust', 'G', ['horizontal_druecken']], ['brust', 'A', ['brust_fliegen']], ['schulter_seitlich', 'A', ['seitheben']], ['trizeps', 'A', ['trizeps_strecken']], ['rotatoren', 'S', ['rotation', 'horizontal_ziehen']]],
    'Ganzkörper': [['quadrizeps', 'G', ['beinpresse', 'kniebeuge']], ['lat', 'G', ['vertikal_ziehen']], ['brust', 'G', ['schraeg_druecken', 'horizontal_druecken']], ['ruecken_hoch', 'G', ['horizontal_ziehen']], ['hamstrings', 'A', ['beinbeugen', 'huefte_beugen']], ['rumpf', 'C', ['rumpf_dynamisch', 'anti_rotation']]],
    'Lower + Pull': [['quadrizeps', 'G', ['kniebeuge']], ['lat', 'G', ['vertikal_ziehen']], ['quadrizeps', 'G', ['beinpresse']], ['ruecken_hoch', 'G', ['horizontal_ziehen']], ['hamstrings', 'A', ['beinbeugen']], ['waden', 'A', ['wadenheben']], ['rotatoren', 'S', ['rotation', 'horizontal_ziehen']]]
  };

  /* Grundpräferenz: geprüfte Standardübungen vor Heim-/Bandvarianten (im Studio sind alle Geräte da) */
  const pref = (e, gym) => {
    let r = 0;
    if (e.tier === 'geprueft') r += 1;
    if (e.code) r += 0.5 - (parseInt(String(e.code).slice(1), 10) || 0) / 100;
    if (gym && (e.equipment || []).length && (e.equipment || []).every((q) => ['band', 'matte', 'stufe', 'koerpergewicht'].includes(q))) r -= 3;
    if (/Heimtraining|Negativ/.test(e.name)) r -= 2;
    return r;
  };
  const hash = (str) => { let h = 2166136261; for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000; };

  function suggest(ctx) {
    const P = params(ctx.params);
    const today = ctx.today || todayStr();
    const reasons = [];
    const exById = {}; ctx.exercises.forEach((e) => (exById[e.id] = e));
    const calm = ctx.form === 'ruhiger';

    // R17/R18: Krankheit und Schmerz zuerst
    const abs = (ctx.absences || []).find((a) => a.from_date <= today && a.to_date >= today);
    if (abs && ['krank', 'schmerz'].includes(abs.kind)) {
      return { rest: true, title: abs.kind === 'krank' ? 'Heute Erholung' : 'Heute schonen', reasons: [abs.kind === 'krank' ? 'Du bist als krank eingetragen. Erst wieder trainieren, wenn du dich fit fühlst.' : 'Schmerz ist eingetragen. Bewegung nur schmerzfrei, kein Krafttraining an der betroffenen Stelle.'], rule_version: RULE_VERSION };
    }
    if (abs && ['urlaub', 'ski'].includes(abs.kind)) {
      if (abs.mode === 'frei') return { rest: true, title: abs.kind === 'ski' ? 'Skiurlaub: Erholung' : 'Urlaub: Erholung', reasons: ['Du bist im Urlaub und hast Erholung gewählt. Wenn du Lust hast, kannst du über „Anderer Tag“ trotzdem etwas wählen.'], rule_version: RULE_VERSION };
      reasons.push(abs.mode === 'studio' ? 'Urlaub: Training nach Lust, alle Geräte stehen zur Verfügung.' : 'Urlaub: nur Eigengewicht und Bänder.');
    }
    if (abs && abs.kind === 'pause') reasons.push('Heute ist als Pause eingetragen. Du kannst trotzdem starten.');

    const stats = muscleStats(ctx.sessions, exById, today, ctx.split);
    const doneDates = ctx.sessions.filter((s) => s.kind === 'kraft' && ['gefuehrt', 'bestaetigt'].includes(s.status)).map((s) => s.session_date).sort();
    const lastDate = doneDates.length ? doneDates[doneDates.length - 1] : null;
    const gap = lastDate ? dayDiff(today, lastDate) : null;
    const lastSess = lastDate ? ctx.sessions.filter((s) => s.session_date === lastDate && s.kind === 'kraft').pop() : null;
    ctx.lastDayName = lastSess ? lastSess.split_day : null;

    // R15/R17: Wiedereinstieg
    let reentry = false;
    const recentIll = (ctx.absences || []).filter((a) => a.kind === 'krank' && dayDiff(today, a.to_date) >= 0 && dayDiff(today, a.to_date) < 21);
    if (gap !== null && gap >= P.pause_reentry_days) { reentry = true; reasons.push(`Letztes Krafttraining vor ${gap} Tagen: vorsichtiger Wiedereinstieg, eine Reserve mehr.`); }
    if (recentIll.length) { reentry = true; reasons.push('Nach Krankheit: reduziert wieder einsteigen.'); }

    const pick = pickDay(ctx.split, ctx, stats, P);
    if (!pick) return { rest: false, empty: true, title: 'Kein Split gewählt', reasons: ['Wähle unter „Mehr → Plan & Split“ einen Split.'], rule_version: RULE_VERSION };
    const day = pick.d;
    if (gap === 0) reasons.push('Heute wurde schon trainiert. Das hier wäre eine zweite Einheit.');
    reasons.push(pick.forced ? `${day.name}: von dir gewählt.` : `${day.name}: ${day.focus.slice(0, 3).map((m) => LABEL[m]).join(', ')} sind am längsten nicht dran oder unter dem Wochenziel.`);
    if (pick.penalty >= 3 && ctx.rideHoursAgo !== null && ctx.rideHoursAgo < P.leg_after_ride_hours) reasons.push('Gestern lange gefahren: Beine werden zurückhaltend eingeplant.');

    // Zeitbudget
    let minutes = ctx.minutes || day.minutes || P.default_minutes;
    if (calm) minutes = Math.round(minutes * 0.85);
    if (reentry) minutes = Math.min(minutes, 45);
    if (ctx.minutes) reasons.push(`Zeitfenster ${ctx.minutes} Minuten berücksichtigt.`);

    // Übungsauswahl: je Fokus-Muskel nach Priorität, Grundübung zuerst, Muster nicht doppeln
    const gym = (ctx.items || []).length > 12;
    const excl = new Set(ctx.exclude || []);
    const elig = ctx.exercises.filter((e) => eligible(e, ctx) && !excl.has(e.id));
    const focus = day.focus.slice().sort((a, b) => PRIO_W[prioOf(ctx.priorities, b, today)] - PRIO_W[prioOf(ctx.priorities, a, today)] ||
      (stats.last[b] ?? 14) - (stats.last[a] ?? 14));
    const chosen = [], usedPattern = new Set(), usedEx = new Set();
    const recentEx = new Set();
    ctx.sessions.slice().sort((a, b) => (a.session_date < b.session_date ? 1 : -1)).slice(0, 3)
      .forEach((s) => (s.session_exercises || []).forEach((se) => recentEx.add(se.exercise_id)));
    const rank = (e, m) => {
      let r = 0;
      if (e.muscles_primary[0] === m) r += 3; else if (e.muscles_primary.includes(m)) r += 2; else r += 0.5;
      if (e.dosage_profile === 'G') r += 1.5;
      r += pref(e, gym);
      if (ctx.variant && recentEx.has(e.id)) r -= 1;          // Abwechslung nur beim Würfeln; sonst bleibt die Reihenfolge stabil
      if (usedPattern.has(e.pattern)) r -= 2.5;
      if ((ctx.favorites || new Set()).has(e.id)) r += 1;
      return r;
    };
    const setsFor = (e, m, prio) => {
      const pf = profOf(e.dosage_profile, P, ctx.goals, prio);
      let n = pf.sets;
      if (e.dosage_profile === 'G' && prio === 'schwerpunkt' && !P.dose_G_sets) n = Math.max(n, 3);
      if (prio === 'erhalt') n = Math.max(1, n - 1);
      if (calm && n >= 3) n -= P.calm_sets_minus;
      return n;
    };
    const estMin = (e, n) => { const pf = profOf(e.dosage_profile, P, ctx.goals, 'normal'); return n * (0.9 + P[pf.rest] / 60) + 1.5; };
    let used = 4; // Aufwärmen
    const variant = ctx.variant || 0;
    const tplSlots = TEMPLATES[day.name] || null;
    // zuletzt in diesem Tag verwendete Übungen (Reihenfolge bleibt stabil)
    const sameDay = ctx.sessions.filter((s) => s.split_day === day.name && ['gefuehrt', 'bestaetigt'].includes(s.status) && (s.session_exercises || []).length).sort((a, b) => (a.session_date < b.session_date ? 1 : -1))[0];
    const lastSame = new Set(sameDay ? sameDay.session_exercises.map((x) => x.exercise_id) : []);
    const prevOffered = new Set(ctx.avoid || []);
    if (tplSlots) {
      for (const [m, pf0, pats] of tplSlots) {
        if (used >= minutes) break;
        const prio = prioOf(ctx.priorities, m, today);
        const base = elig.filter((e) => !usedEx.has(e.id) && e.muscles_primary.includes(m) && (e.dosage_profile || 'A') === pf0);
        let pool = base.filter((e) => pats.includes(e.pattern));
        if (!pool.length) pool = base.filter((e) => !usedPattern.has(e.pattern));
        if (!pool.length) continue;
        const sc = (e) => {
          let r = 0;
          r += pref(e, gym);
          if (e.muscles_primary[0] === m) r += 3;
          const pi = pats.indexOf(e.pattern); if (pi >= 0) r -= pi * 0.8;
          if (usedPattern.has(e.pattern)) r -= 2.5;
          if (lastSame.has(e.id)) r += 2;
          if (variant) { r += hash(e.id + ':' + variant + ':' + day.name) * 3; if (prevOffered.has(e.id)) r -= 2; }
          if ((ctx.favorites || new Set()).has(e.id)) r += 1;
          return r;
        };
        pool.sort((a, b) => sc(b) - sc(a) || (a.name < b.name ? -1 : 1));
        const e = pool[0];
        const n = setsFor(e, m, prio), t = estMin(e, n);
        if (used + t > minutes + 3) continue;
        used += t; usedEx.add(e.id); usedPattern.add(e.pattern);
        chosen.push({ muscle: m, ex: e, sets: n, prio, minutes: t });
      }
      // Schwerpunkt-Muskeln, die die Vorlage nicht abdeckt, kommen als eine Zusatzübung dazu
      for (const m of focus) {
        if (used >= minutes) break;
        if (prioOf(ctx.priorities, m, today) !== 'schwerpunkt' || chosen.some((c) => c.ex.muscles_primary.includes(m))) continue;
        const e = elig.filter((x) => !usedEx.has(x.id) && x.muscles_primary.includes(m) && ['G', 'A', 'S'].includes(x.dosage_profile || 'A')).sort((a, b) => rank(b, m) - rank(a, m) || (a.name < b.name ? -1 : 1))[0];
        if (!e) continue;
        const n = setsFor(e, m, 'schwerpunkt'), t = estMin(e, n);
        if (used + t > minutes + 3) continue;
        used += t; usedEx.add(e.id); usedPattern.add(e.pattern); chosen.push({ muscle: m, ex: e, sets: n, prio: 'schwerpunkt', minutes: t });
      }
    }
    // Reihenfolge der Runden: erst Grundbewegungen je Muskel, dann Zusatz, dann Stabilität
    const rounds = [['G'], ['A'], ['S', 'C', 'I', 'T']];
    for (const rd of (tplSlots ? [] : rounds)) {
      for (const m of focus) {
        if (used >= minutes) break;
        const prio = prioOf(ctx.priorities, m, today);
        const have = chosen.filter((c) => c.muscle === m).length;
        if (have >= (prio === 'schwerpunkt' ? 3 : 2)) continue;
        if (rd[0] === 'G' && prio === 'erhalt' && !['schulter_hinten', 'rotatoren'].includes(m)) { /* Erhalt: nur eine Übung, später */ }
        const cands = elig.filter((e) => !usedEx.has(e.id) && rd.includes(e.dosage_profile || 'A') && (e.muscles_primary.includes(m)))
          .sort((a, b) => rank(b, m) - rank(a, m));
        const e = cands[0];
        if (!e) continue;
        const n = setsFor(e, m, prio);
        const t = estMin(e, n);
        if (used + t > minutes + 3) continue;
        used += t; usedEx.add(e.id); usedPattern.add(e.pattern);
        chosen.push({ muscle: m, ex: e, sets: n, prio, minutes: t });
      }
    }
    // Reihenfolge: G vor A vor S/C/I/T, dann Priorität
    const ord = { G: 0, A: 1, S: 2, C: 3, I: 3, T: 3 };
    if (!tplSlots) chosen.sort((a, b) => ord[a.ex.dosage_profile || 'A'] - ord[b.ex.dosage_profile || 'A']);

    const items = chosen.map((c) => {
      const pf = profOf(c.ex.dosage_profile, P, ctx.goals, c.prio);
      const last = lastWorkSets(ctx.sessions, c.ex.id);
      const ls = loadSuggestion(c.ex, pf, last, P, calm || reentry);
      let rirLo = pf.rir ? pf.rir[0] : null, rirHi = pf.rir ? pf.rir[1] : null;
      if (pf.rir && (calm || reentry)) { rirLo += P.calm_reserve_add; rirHi += P.calm_reserve_add; }
      if (pf.rir && ls.first) { rirLo = Math.max(rirLo, 3); rirHi = Math.max(rirHi, 4); }
      let kg = ls.kg;
      if (kg !== null && reentry && P.reentry_load_factor < 1) kg = Math.round(kg * P.reentry_load_factor / (c.ex.load_convention === 'je_hand' ? 1 : 2.5)) * (c.ex.load_convention === 'je_hand' ? 1 : 2.5);
      return {
        exercise_id: c.ex.id, name: c.ex.name, code: c.ex.code, muscle: c.muscle, sets: c.sets,
        profile: c.ex.dosage_profile, reps: pf.reps || null, secs: pf.secs || null, perSide: !!pf.perSide,
        rir: pf.rir ? [rirLo, rirHi] : null, rest_s: P[pf.rest], load_kg: kg, load_convention: c.ex.load_convention,
        load_text: ls.text, first: ls.first, tier: c.ex.tier, prio: c.prio
      };
    });
    const total = Math.round(4 + items.reduce((s, i) => s + estMin(exById[i.exercise_id], i.sets), 0));
    if (calm) reasons.push('Ruhigere Tagesform: eine Reserve mehr und bei 3+ Sätzen ein Satz weniger.');
    const gaps = focus.filter((m) => !chosen.some((c) => c.muscle === m) && BIG.includes(m));
    if (gaps.length) reasons.push(`Wegen Zeit oder Ausstattung nicht abgedeckt: ${gaps.map((m) => LABEL[m]).join(', ')}.`);
    const unk = items.filter((i) => i.first).length;
    if (unk) reasons.push(`${unk} Übung${unk > 1 ? 'en' : ''} ohne bekannte Last: Erstkalibrierung, keine erfundenen Gewichte.`);
    // Ziele: nachvollziehbare Hinweise, keine verdeckten Eingriffe
    const goals = ctx.goals || [];
    if (goals.includes('Kraft') && items.some((i) => i.prio === 'schwerpunkt' && i.profile === 'G')) reasons.push('Ziel Kraft: Schwerpunkt-Grundübungen mit 3 × 4–6 und längerer Pause.');
    if (goals.includes('Muskelaufbau')) reasons.push('Ziel Muskelaufbau: Wiederholungen meist 6–15 mit 1–3 Reserve, Wochenziel 6–10 Sätze je Muskelgruppe.');
    if (goals.includes('Fettabbau')) reasons.push('Ziel Fettabbau: Gewichte und Satzzahl halten, nicht kürzen. Ob mehr Volumen im Defizit mehr Muskeln erhält, ist offen.');
    const mobility = P.posture_block ? mobilityPick(ctx, P, 3) : [];
    return { rest: false, title: day.name, split_day: day.name, minutes: total + (mobility.length ? 4 : 0), items, mobility, reasons, reentry, rule_version: RULE_VERSION, params: P, variant, stable: !variant, template: !!tplSlots };
  }

  /* Energie: immer Schätzung mit Methode */
  function energy(act, weightKg) {
    if (act.kcal_strava) return { kcal: Math.round(act.kcal_strava), method: 'Strava-Angabe' };
    if (act.kilojoules && act.has_power) return { kcal: Math.round(act.kilojoules / 4.184 / 0.24), method: 'aus Arbeit (kJ) bei ca. 24 % Wirkungsgrad' };
    const hrs = (act.moving_s || act.duration_s || 0) / 3600;
    const MET = { Hike: 6, Walk: 3.5, Run: 9.8, Ride: 7.5, VirtualRide: 7.5, GravelRide: 7.5, MountainBikeRide: 8.5, WeightTraining: 5, Workout: 5, Swim: 7 };
    const met = MET[act.sport] || 5;
    return { kcal: Math.round(met * weightKg * hrs), method: `MET-Schätzung (${String(met).replace('.', ',')})` };
  }

  function e1rm(kg, reps) { return reps && kg ? kg * (1 + reps / 30) : null; }

  const api = { TEMPLATES, mobilityPick, profOf, RULE_VERSION, DEFAULTS, PROFILES, LABEL, BIG, prioOf, available, eligible, suggest, energy, e1rm, muscleStats, lastWorkSets, params, todayStr, dayDiff, fmt };
  if (typeof module !== 'undefined') module.exports = api; else root.Engine = api;
})(typeof window !== 'undefined' ? window : globalThis);
