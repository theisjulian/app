/* forza · Training protokollieren, Übungshilfe */
(function () {
  const F = window.F, E = F.E, esc = F.esc;
  F.ui.tr = { ei: 0, skip: [] };
  /* Fokus ist auf dem Handy Standard: ein Satz nach dem anderen, große Knöpfe */
  F.focusOn = () => F.ls.get('focus', !matchMedia('(min-width:900px)').matches);
  const noLoad = (ex) => ['koerper', 'keine', 'zeit', 'strecke'].includes(ex.load_convention);

  /* ---------- Start ---------- */
  F.acts.start = async () => {
    if (F.openSession()) return F.go('training');
    const sg0 = F.suggestion(); if (sg0.rest || sg0.empty || !sg0.items.length) return F.toast('Heute kein Vorschlag möglich.');
    const sg = sg0; // Haltungsblock wird am Ende angeboten, nicht fest eingeplant
    const sess = await F.insert('sessions', { session_date: F.today(), kind: 'kraft', title: sg.title, split_day: sg.split_day, status: 'geplant', source: 'manuell', form: F.ls.get('form-' + F.today(), 'normal'), planned_minutes: sg.minutes, equipment_profile_id: F.items().id, rule_version: sg.rule_version, started_at: new Date().toISOString() });
    const ses = await F.sb.from('session_exercises').insert(sg.items.map((it, i) => ({ session_id: sess.id, exercise_id: it.exercise_id, position: i, planned_sets: it.sets, planned_reps: it.reps ? it.reps.join('–') : it.secs ? it.secs.join('–') + ' s' : null, planned_rir: it.rir ? it.rir.join('–') : null, why: it.load_text + (it.pair_with ? ' · Superset mit «' + it.pair_with + '»: im Wechsel, Pause erst nach beiden.' : '') }))).select();
    if (ses.error) throw ses.error;
    const rows = [];
    ses.data.forEach((se, i) => { const it = sg.items[i]; for (let n = 1; n <= it.sets; n++) rows.push({ session_exercise_id: se.id, set_no: n, load_kg: it.load_kg, load_per_hand: it.load_convention === 'je_hand' }); });
    const sr = await F.sb.from('sets').insert(rows); if (sr.error) throw sr.error;
    await F.sb.from('suggestions').insert({ for_date: F.today(), payload: { title: sg.title, items: sg.items.map((i) => ({ id: i.exercise_id, sets: i.sets })) }, reasons: sg.reasons, rule_version: sg.rule_version, accepted: true });
    F.ui.tr.ei = 0; F.ui.tr.skip = []; await F.load(); F.go('training');
  };
  F.acts.startPosture = async () => {
    if (F.openSession()) return F.toast('Es läuft schon eine Einheit. Beende sie zuerst.');
    const P = E.params(F.S.params), items = E.mobilityPick({ exercises: F.S.exercises, items: F.items().items, userEx: F.S.userEx, painEx: F.painSet(), sessions: F.S.sessions, goals: [] }, P, 3);
    if (!items.length) return F.toast('Mit dieser Ausstattung gibt es keine passende Übung. Eine Matte genügt.');
    const sess = await F.insert('sessions', { session_date: F.today(), kind: 'sonstiges', title: 'Haltung und Mobilität', status: 'geplant', source: 'manuell', planned_minutes: 8, equipment_profile_id: F.items().id, rule_version: E.RULE_VERSION, started_at: new Date().toISOString() });
    const ses = await F.sb.from('session_exercises').insert(items.map((it, i) => ({ session_id: sess.id, exercise_id: it.exercise_id, position: i, planned_sets: it.sets, planned_reps: it.reps.join('–'), why: it.load_text }))).select(); if (ses.error) throw ses.error;
    const rows = []; ses.data.forEach((se, i) => { for (let n = 1; n <= items[i].sets; n++) rows.push({ session_exercise_id: se.id, set_no: n }); });
    const sr = await F.sb.from('sets').insert(rows); if (sr.error) throw sr.error;
    F.ui.tr.ei = 0; F.ui.tr.skip = []; await F.load(); F.go('training');
  };
  F.acts.resume = () => F.go('training');

  /* ---------- Hilfen für die Satzwerte ---------- */
  const doneN = (e) => e.sets.filter((x) => x.done).length;
  const isOpen = (e) => e.sets.some((x) => !x.done);
  const kindOf = (ex) => { const pf = E.PROFILES[ex.dosage_profile] || E.PROFILES.A, cs = ex.content && ex.content.secs; return { pf, cs, timed: !!pf.secs || !!cs, perSide: pf.perSide || !!(ex.content && ex.content.perSide) }; };
  const planRange = (se, k) => { const m = /(\d+)\s*[–-]\s*(\d+)/.exec(se.planned_reps || ''); if (m) return [+m[1], +m[2]]; return k.timed ? (k.cs || k.pf.secs || null) : (k.pf.reps || null); };
  /* Vorschlag für einen offenen Satz: nichts wird gespeichert, bevor du den Satz abschließt */
  F.setTarget = (se, st) => {
    const ex = F.S.exById[se.exercise_id] || {}, k = kindOf(ex), range = planRange(se, k), i = se.sets.indexOf(st);
    const prev = se.sets.slice(0, Math.max(0, i)).reverse().find((x) => x.done);
    const load = st.load_kg !== null && st.load_kg !== undefined ? st.load_kg : prev ? prev.load_kg : null;
    if (k.timed) return { load_kg: load, seconds: st.seconds ?? (prev && prev.seconds) ?? (range ? range[0] : null), timed: true };
    const reps = st.reps ?? (prev && prev.reps !== null && Number(prev.load_kg) === Number(load) ? prev.reps : E.repTarget(range, E.lastWorkSets(F.S.sessions, ex.id), load, st.set_no));
    return { load_kg: load, reps, timed: false };
  };
  const partnerOf = (s, se) => { const m = /Superset mit «(.+?)»/.exec(se.why || ''); return m ? s.session_exercises.find((x) => x !== se && (F.S.exById[x.exercise_id] || {}).name === m[1]) || null : null; };
  /* nächste Übung mit offenen Sätzen ab der aktuellen; übersprungene erst, wenn sonst nichts mehr offen ist */
  const nextOpen = (s, from) => {
    const exs = s.session_exercises, n = exs.length, skip = F.ui.tr.skip;
    for (const allowSkipped of [false, true]) for (let k = 0; k < n; k++) { const i = (from + k) % n; if (isOpen(exs[i]) && (allowSkipped || !skip.includes(exs[i].id))) return i; }
    return -1;
  };
  const mmss = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  const ico = (k, w = 16) => F.icon[k].replace('<svg', `<svg width="${w}" height="${w}"`);

  /* ---------- Ansicht ---------- */
  const arrow = F.icon.chev.replace('<svg', '<svg width="18" height="18" style="stroke:var(--mute);fill:none;stroke-width:2"');
  const setLine = (se) => (se.sets || []).filter((x) => x.done).map((x) => (x.load_kg !== null ? F.fmt(Number(x.load_kg)) + ' kg × ' : '') + (x.reps !== null ? x.reps : (x.seconds ? x.seconds + ' s' : '?'))).join(' · ');
  const hub = () => {
    const S = F.S, sg = F.suggestion();
    const done = S.sessions.filter((x) => x.kind === 'kraft' && ['gefuehrt', 'bestaetigt'].includes(x.status)).sort((a, b) => (a.session_date < b.session_date ? 1 : -1));
    const card = (ic, t, sub, act, extra = '') => `<button class="it" data-act="${act}" ${extra}><div class="ico">${ic}</div><div class="grow"><b>${t}</b><div class="small mute">${sub}</div></div>${arrow}</button>`;
    return `<div class="h1" style="margin-bottom:4px">Training</div><p class="mute" style="margin-top:0">Hier startest du eine Einheit und siehst, was du schon gemacht hast.</p>
      <div class="card list">
        ${sg.rest || sg.empty ? '' : card(F.icon.dumb, `Vorschlag starten: ${esc(sg.title)}`, `ca. ${sg.minutes} min · ${sg.items.length} ${sg.items.length === 1 ? 'Übung' : 'Übungen'}`, 'start')}
        ${card(F.icon.kalender, 'Anderen Tag wählen', esc((F.activeSplit() ? F.activeSplit().days.map((d) => d.name) : []).join(' · ') || 'Erst einen Split wählen'), 'pickDay')}
        ${card(F.icon.plus, 'Freies Training', 'Leer starten und Übungen selbst hinzufügen', 'startFree')}
        ${card(F.icon.heute, 'Mobilität', 'Aufwärmen · Dehnen · Sanft · Haltung', 'mobMenu')}
        ${card(F.icon.note, 'Einheit nachtragen', 'Auch für frühere Tage', 'addEntry', `data-d="${F.today()}"`)}
      </div>
      <div class="card"><div class="h2">Bisherige Einheiten</div>${done.slice(0, 20).map((x) => `<details class="hist"><summary><div class="grow"><b>${esc(x.title || 'Training')}</b><div class="small mute">${F.dlabel(x.session_date)}${x.duration_min ? ' · ' + x.duration_min + ' min' : ''}${x.session_exercises.length ? ' · ' + x.session_exercises.length + (x.session_exercises.length === 1 ? ' Übung' : ' Übungen') : ' · Details unbekannt'}</div></div></summary>${x.session_exercises.length ? x.session_exercises.map((se) => `<div class="small" style="padding:4px 0"><b>${esc((S.exById[se.exercise_id] || {}).name || '?')}</b><div class="mute">${setLine(se) || 'keine Sätze erfasst'}</div></div>`).join('') + `<button class="btn sm" style="margin-top:6px" data-act="repeatSession" data-id="${x.id}">Diese Einheit wiederholen</button>` : '<div class="small mute" style="padding:4px 0">Zu dieser Einheit sind keine Übungen oder Sätze bekannt. Du kannst sie über „Einheit nachtragen“ ergänzen oder die Einheit so lassen.</div>'}</details>`).join('') || '<div class="mute">Noch nichts.</div>'}</div>`;
  };
  F.views.training = () => {
    const s = F.openSession();
    if (!s) return hub();
    if (!s.session_exercises.length) return `${topBar(s, 0)}<div class="card"><div class="h2">Noch keine Übung</div><div class="mute" style="margin-bottom:12px">Füge die erste Übung hinzu. forza merkt sich deine Gewichte für das nächste Mal.</div><button class="btn pri block" data-act="addExAsk">+ Übung hinzufügen</button></div><button class="btn ghost block" data-act="finishAsk">Beenden</button>`;
    return F.focusOn() ? focusView(s) : listView(s);
  };
  const topBar = (s, dn) => { const on = F.focusOn(); return `${on ? '<div class="fx-on"></div>' : ''}<div class="row between" style="margin-bottom:10px;gap:8px"><button class="btn sm" data-act="trOverview" style="gap:8px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg>${dn}/${s.session_exercises.length}</button><div class="row gap"><button class="btn sm ghost" data-act="voiceToggle" aria-pressed="${!!F.ls.get('voice', false)}" title="Ansagen nach der Pause"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/>${F.ls.get('voice', false) ? '<path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>' : '<path d="M17 9l5 6M22 9l-5 6"/>'}</svg></button><button class="btn sm ghost" data-act="focusToggle" aria-pressed="${on}">${on ? 'Liste' : 'Fokus'}</button><button class="btn sm ghost" data-act="finishAsk">Beenden</button></div></div>${(() => { const tot = s.session_exercises.reduce((n, e) => n + e.sets.length, 0), d = s.session_exercises.reduce((n, e) => n + doneN(e), 0); return tot && on ? `<div class="sprog" role="progressbar" aria-valuemin="0" aria-valuemax="${tot}" aria-valuenow="${d}" aria-label="${d} von ${tot} Sätzen"><i style="width:${d / tot * 100}%"></i></div>` : ''; })()}`; };

  /* Listenansicht: alle Sätze einer Übung, zum genauen Eintragen und Nachtragen */
  const listView = (s) => {
    const exs = s.session_exercises; if (F.ui.tr.ei >= exs.length) F.ui.tr.ei = exs.length - 1; if (F.ui.tr.ei < 0) F.ui.tr.ei = 0;
    const se = exs[F.ui.tr.ei], ex = F.S.exById[se.exercise_id] || { name: '?', load_convention: 'gesamt' }, { pf, timed, perSide } = kindOf(ex);
    const firstOpen = se.sets.findIndex((x) => !x.done), open = se.sets.filter((x) => !x.done).length;
    const elapsed = Math.max(0, Math.round((Date.now() - new Date(s.started_at).getTime()) / 60000));
    const unit = ex.load_convention === 'je_hand' ? 'kg je Hand' : 'kg';
    const dnEx = exs.filter((e) => e.sets.length && !isOpen(e)).length;
    return `${topBar(s, dnEx)}<div style="margin-bottom:10px"><div class="eyebrow">${esc(s.title || 'Training')} · ${elapsed} min</div><div class="h1" style="font-size:24px">${esc(ex.name)}</div></div>
      <div class="row gap" style="margin-bottom:14px">${exs.map((e, i) => `<button class="grow" style="height:8px;border-radius:99px;background:${doneN(e) === e.sets.length ? 'var(--a)' : i === F.ui.tr.ei ? 'color-mix(in srgb,var(--a) 45%,var(--card2))' : 'var(--card2)'}" data-act="goEx" data-i="${i}" aria-label="Übung ${i + 1}"></button>`).join('')}</div>
      <div class="card"><div class="row between wrap"><div class="small mute">Übung ${F.ui.tr.ei + 1} von ${exs.length} · ${doneN(se)}/${se.sets.length} Sätze</div><span class="badge">${pf.label}</span></div>
        <div style="margin:8px 0 2px">Ziel: <b>${se.planned_sets} × ${esc(se.planned_reps || '')}${perSide ? ' je Seite' : ''}</b>${se.planned_rir ? ' · Reserve ' + esc(se.planned_rir) : ''}</div>
        ${se.why ? `<div class="small mute">${esc(se.why)}</div>` : ''}${warmupLine(se, ex)}
        <div class="tools4"><button data-act="help" data-id="${se.exercise_id}">${ico('info', 20)}<span>Hilfe</span></button><button data-act="swapAsk" data-id="${se.id}">${ico('swap', 20)}<span>Ersetzen</span></button><button data-act="noteAsk" data-id="${se.id}">${ico('note', 20)}<span>Notiz</span></button><button class="bad" data-act="painAsk" data-id="${se.id}">${ico('warn', 20)}<span>Schmerz</span></button></div>${se.note ? `<div class="small" style="margin-top:10px">Notiz: ${esc(se.note)}</div>` : ''}</div>
      ${se.sets.map((st, i) => { if (st.done) return `<div class="setrow done compact" data-sid="${st.id}"><span class="sn">${F.icon.check.replace('<svg', '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.6"')}</span><div class="grow"><b>Satz ${st.set_no}</b><span class="mute"> · ${[st.load_kg !== null && !noLoad(ex) ? F.fmt(Number(st.load_kg)) + ' kg' : '', timed ? (st.seconds ? st.seconds + ' s' : '') : st.reps !== null ? st.reps + ' Wdh.' : ''].filter(Boolean).join(' × ') || 'ohne Werte'}${st.rir !== null && st.rir !== undefined ? ' · Reserve ' + st.rir : ''}${st.pain ? ' · Schmerz' : ''}</span></div><button class="btn sm ghost" data-act="undo" data-s="${st.id}">Ändern</button></div>`;
        const tg = F.setTarget(se, st); return `<div class="setrow ${st.done ? 'done' : i === firstOpen ? 'cur' : ''}" data-sid="${st.id}">
        <div class="row between" style="margin-bottom:10px"><b>Satz ${st.set_no}${st.pain ? ' · Schmerz gemeldet' : ''}</b>${st.done ? '<span class="badge ok">erledigt</span>' : ''}</div>
        <div class="row gap">${noLoad(ex) ? '' : `<div class="grow"><div class="small mute" style="margin-bottom:4px">${unit}${ex.load_convention === 'je_hand' && st.load_kg ? ' (= ' + F.fmt(st.load_kg * 2) + ' gesamt)' : ''}</div><div class="stepper"><button data-act="step" data-f="load_kg" data-d="-1" data-s="${st.id}" aria-label="weniger">−</button><input type="text" inputmode="decimal" data-in="setVal" data-f="load_kg" data-s="${st.id}" value="${st.load_kg === null ? '' : F.fmt(st.load_kg)}" placeholder="${tg.load_kg !== null && tg.load_kg !== undefined ? F.fmt(tg.load_kg) : '–'}"><button data-act="step" data-f="load_kg" data-d="1" data-s="${st.id}" aria-label="mehr">+</button></div></div>`}
        <div class="grow"><div class="small mute" style="margin-bottom:4px">${timed ? 'Sekunden / Meter' : 'Wiederholungen'}</div><div class="stepper"><button data-act="step" data-f="${timed ? 'seconds' : 'reps'}" data-d="-1" data-s="${st.id}" aria-label="weniger">−</button><input type="text" inputmode="numeric" data-in="setVal" data-f="${timed ? 'seconds' : 'reps'}" data-s="${st.id}" value="${(timed ? st.seconds : st.reps) ?? ''}" placeholder="${(timed ? tg.seconds : tg.reps) ?? '–'}"><button data-act="step" data-f="${timed ? 'seconds' : 'reps'}" data-d="1" data-s="${st.id}" aria-label="mehr">+</button></div></div></div>
        ${pf.rir ? `<div class="small mute" style="margin:10px 0 4px">Wie viele Wiederholungen hättest du noch geschafft? (optional)</div><div class="row wrap gap">${[0, 1, 2, 3, 4].map((r) => `<button class="chip ${st.rir === r ? 'on' : ''}" data-act="rir" data-s="${st.id}" data-v="${r}">${r === 4 ? '4+' : r}</button>`).join('')}</div>` : ''}
        <button class="btn ${st.done ? 'ghost' : 'pri'} block" style="margin-top:12px" data-act="${st.done ? 'undo' : 'doneSet'}" data-s="${st.id}">${st.done ? 'Wieder öffnen' : 'Satz abschließen'}</button></div>`; }).join('')}
      ${open >= 2 ? `<button class="btn block" style="margin-bottom:10px" data-act="doneAll" data-id="${se.id}">${ico('check')} Restliche ${open} Sätze wie vorgeschlagen abhaken</button>` : ''}
      <div class="row gap" style="margin-bottom:10px"><button class="btn ghost sm" data-act="addSet" data-id="${se.id}">+ Satz</button>${se.sets.length > 1 && se.sets[se.sets.length - 1].done === false ? `<button class="btn ghost sm" data-act="rmSet" data-id="${se.id}">− Satz</button>` : ''}<div class="grow"></div>
        ${F.ui.tr.ei > 0 ? `<button class="btn sm" data-act="goEx" data-i="${F.ui.tr.ei - 1}">‹ Zurück</button>` : ''}${F.ui.tr.ei < exs.length - 1 ? `<button class="btn sm pri" data-act="goEx" data-i="${F.ui.tr.ei + 1}">Weiter ›</button>` : `<button class="btn sm pri" data-act="finishAsk">Fertig</button>`}</div>
      <button class="btn ghost block" style="margin:6px 0 18px" data-act="addExAsk">+ Übung hinzufügen</button>`;
  };
  const warmupLine = (se, ex) => {
    if (ex.dosage_profile !== 'G' || doneN(se)) return '';
    const tg = se.sets[0] ? F.setTarget(se, se.sets[0]) : null, w = tg ? E.warmup(Number(tg.load_kg), ex.load_convention, E.params(F.S.params)) : [];
    return w.length ? `<div class="fz-warm"><b>Vorher aufwärmen</b> (nicht eintragen): ${w.map((x) => `${F.fmt(x.kg)} kg × ${x.reps}`).join(' · ')}</div>` : '';
  };

  /* Fokus: nur der nächste Satz, Werte vorgeschlagen, ein Tipp zum Abhaken. Danach läuft die Pause von selbst. */
  const enter = (key) => { const on = F.ui.tr.key !== key; F.ui.tr.key = key; return on ? ' fz-enter' : ''; };
  const focusView = (s) => {
    const exs = s.session_exercises, dnEx = exs.filter((e) => e.sets.length && !isOpen(e)).length;
    if (F.rest) return topBar(s, dnEx) + restScreen(s, enter('rest'));
    if (!exs[F.ui.tr.ei] || !isOpen(exs[F.ui.tr.ei])) { const i = nextOpen(s, F.ui.tr.ei || 0); if (i >= 0) F.ui.tr.ei = i; }
    const se = exs[F.ui.tr.ei];
    if (!se || !isOpen(se)) return topBar(s, dnEx) + `<div class="fz-done${enter('done')}"><svg class="ring" viewBox="0 0 120 120" aria-hidden="true"><circle class="rc" cx="60" cy="60" r="52"/><path class="rk" d="M36 62l16 16 32-36"/></svg><div class="h1">Alles erledigt</div><div class="mute" style="margin:6px 0 18px">${exs.reduce((n, e) => n + doneN(e), 0)} Sätze in ${Math.max(1, Math.round((Date.now() - new Date(s.started_at).getTime()) / 60000))} Minuten</div><button class="btn pri block fz-go" data-act="finishAsk">Training beenden</button>${postureOffer(s)}<button class="btn ghost block" style="margin-top:10px" data-act="addExAsk">+ Noch eine Übung</button></div>`;
    const ex = F.S.exById[se.exercise_id] || { name: '?', load_convention: 'gesamt' }, { pf, timed, perSide } = kindOf(ex);
    const st = se.sets.find((x) => !x.done), tg = F.setTarget(se, st), unit = ex.load_convention === 'je_hand' ? 'kg je Hand' : ex.load_convention === 'zusatz' ? 'kg Zusatz' : 'kg';
    const fld = timed ? 'seconds' : 'reps', val = timed ? tg.seconds : tg.reps, pair = partnerOf(s, se), skipped = F.ui.tr.skip.includes(se.id);
    const stepper = (f, v, im, lbl) => `<div class="fz-val"><span>${lbl}</span><div class="stepper"><button data-act="step" data-f="${f}" data-d="-1" data-s="${st.id}" aria-label="weniger">−</button><input type="text" inputmode="${im}" data-in="setVal" data-f="${f}" data-s="${st.id}" value="${v === null || v === undefined ? '' : F.fmt(v)}" placeholder="–"><button data-act="step" data-f="${f}" data-d="1" data-s="${st.id}" aria-label="mehr">+</button></div></div>`;
    return topBar(s, dnEx) + `<div class="fz${enter(st.id)}">
      <div class="eyebrow">Übung ${F.ui.tr.ei + 1} von ${exs.length}${pair ? ' · Superset mit ' + esc((F.S.exById[pair.exercise_id] || {}).name || '') : ''}</div>
      <div class="h1 fz-name">${esc(ex.name)}</div>
      <div class="fz-sub"><b>Satz ${st.set_no} von ${se.sets.length}</b> · Ziel ${esc(se.planned_reps || '')}${perSide ? ' je Seite' : ''}${se.planned_rir ? ' · Reserve ' + esc(se.planned_rir) : ''}</div>
      ${st.set_no === 1 ? warmupLine(se, ex) : ''}
      <div class="fz-vals">${noLoad(ex) ? '' : stepper('load_kg', tg.load_kg, 'decimal', unit)}${stepper(fld, val, 'numeric', timed ? 'Sekunden' : 'Wiederholungen')}</div>
      ${!noLoad(ex) && tg.load_kg === null ? '<div class="small" style="color:var(--warn);margin-top:-4px">Noch kein Gewicht bekannt: leicht starten und eintragen.</div>' : '<div class="small mute">Vorgeschlagen aus deinem letzten Training. Nur ändern, wenn es anders lief.</div>'}
      <button class="btn pri block fz-go" data-act="doneSet" data-s="${st.id}">${F.icon.check.replace('<svg', '<svg width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"')} Geschafft</button>
      <div class="fz-tools"><button data-act="skipEx" data-id="${se.id}">${skipped ? 'Später' : 'Überspringen'}</button><button data-act="help" data-id="${se.exercise_id}">Hilfe</button><button data-act="swapAsk" data-id="${se.id}">Ersetzen</button><button data-act="addSet" data-id="${se.id}">+ Satz</button><button class="bad" data-act="painAsk" data-id="${se.id}">Schmerz</button></div>
      ${(() => { const prev = se.sets.filter((x) => x.done); return prev.length ? `<div class="small mute" style="margin-top:10px">Heute: ${setLine(se)}</div>` : ''; })()}</div>`;
  };
  const nextPreview = (s) => {
    const i = nextOpen(s, F.ui.tr.ei || 0); if (i < 0) return '<div class="fz-next"><span class="eyebrow">Als Nächstes</span><b>Training beenden</b></div>';
    const se = s.session_exercises[i], ex = F.S.exById[se.exercise_id] || { name: '?' }, st = se.sets.find((x) => !x.done), tg = F.setTarget(se, st);
    const v = tg.timed ? (tg.seconds ? tg.seconds + ' s' : '') : (tg.reps ? tg.reps + ' Wdh.' : '');
    return `<div class="fz-next"><span class="eyebrow">Als Nächstes</span><b>${esc(ex.name)}</b><span class="mute">Satz ${st.set_no} von ${se.sets.length}${tg.load_kg !== null && !noLoad(ex) ? ' · ' + F.fmt(tg.load_kg) + ' kg' : ''}${v ? ' × ' + v : ''}</span></div>`;
  };
  const RING = 2 * Math.PI * 92;
  const restScreen = (s, cls = '') => {
    const left = Math.max(0, Math.ceil((F.rest.end - Date.now()) / 1000)), last = F.ui.tr.last && findSet(F.ui.tr.last), ex = last && F.S.exById[last.se.exercise_id], rated = last && last.st.rir;
    const rate = last && ex && (E.PROFILES[ex.dosage_profile] || {}).rir ? `<div class="fz-rate"><span class="small mute">Wie war der Satz eben? (optional)</span><div class="row gap">${[[4, 'Locker'], [2, 'Passt'], [0, 'Am Limit']].map(([v, l]) => `<button class="chip ${rated === v ? 'on' : ''}" data-act="rate" data-v="${v}">${l}</button>`).join('')}</div></div>` : '';
    const frac = Math.min(1, Math.max(0, left / F.rest.total));
    return `<div class="fz fz-restbox${cls}"><div class="fz-ring"><svg viewBox="0 0 200 200" aria-hidden="true"><circle class="bg" cx="100" cy="100" r="92"/><circle class="fg" id="rest-p" cx="100" cy="100" r="92" stroke-dasharray="${RING.toFixed(1)}" stroke-dashoffset="${(RING * (1 - frac)).toFixed(1)}"/></svg><div><div class="eyebrow">Pause</div><div class="fz-clock" id="rest-t">${mmss(left)}</div></div></div>
      <div class="row gap" style="margin:16px 0"><button class="btn grow" data-act="restAdd">+30 s</button><button class="btn pri grow" data-act="restStop">Weiter</button></div>${rate}${nextPreview(s)}</div>`;
  };
  const findSet = (id) => { for (const s of F.S.sessions) for (const se of s.session_exercises) for (const st of se.sets) if (st.id === id) return { s, se, st }; return null; };
  /* Wischen: nach links = nächste Übung, nach rechts = vorherige */
  (() => { let x0 = 0, y0 = 0, ok = false;
    document.addEventListener('touchstart', (e) => { const t0 = e.touches[0]; x0 = t0.clientX; y0 = t0.clientY; ok = /training/.test(location.hash) && !(e.target.closest && e.target.closest('input,textarea,select,.modal,.rangebar,[data-noswipe]')) && e.touches.length === 1; }, { passive: true });
    document.addEventListener('touchend', (e) => { if (!ok) return; ok = false; const t1 = e.changedTouches[0], dx = t1.clientX - x0, dy = t1.clientY - y0; if (Math.abs(dx) < 70 || Math.abs(dy) > 60 || Math.abs(dx) < 1.6 * Math.abs(dy)) return;
      const s = F.openSession && F.openSession(); if (!s) return; const i = F.ui.tr.ei + (dx < 0 ? 1 : -1); if (i < 0 || i >= s.session_exercises.length) return; F.acts.goEx({ dataset: { i: String(i) } }); }, { passive: true }); })();
  F.acts.goEx = (t) => { F.ui.tr.ei = Number(t.dataset.i); F.render(); window.scrollTo(0, 0); };
  F.ins.setVal = (t) => { const f = findSet(t.dataset.s); if (!f) return; const v = F.num(t.value); f.st[t.dataset.f] = t.dataset.f === 'load_kg' ? v : v === null ? null : Math.round(v); };
  F.acts.step = (t) => {
    const f = findSet(t.dataset.s); if (!f) return; const ex = F.S.exById[f.se.exercise_id], fld = t.dataset.f, d = Number(t.dataset.d);
    const inp = t.parentElement.querySelector('input'); let v = F.num(inp.value);
    const step = fld === 'load_kg' ? (ex.load_convention === 'je_hand' ? F.E.params(F.S.params).load_step_hand : F.E.params(F.S.params).load_step_total) : fld === 'seconds' ? 5 : 1;
    if (v === null) { const tg = F.setTarget(f.se, f.st); v = tg[fld] ?? (fld === 'reps' ? (E.PROFILES[ex.dosage_profile]?.reps?.[0] ?? 8) : fld === 'seconds' ? 20 : 0); if ((tg[fld] === null || tg[fld] === undefined) && d > 0 && fld !== 'load_kg') { f.st[fld] = v; inp.value = v; return; } }
    v = Math.max(0, v + d * step); f.st[fld] = fld === 'load_kg' ? v : Math.round(v); inp.value = F.fmt(v);
    inp.classList.remove('bump', 'up', 'dn'); void inp.offsetWidth; inp.classList.add('bump', d > 0 ? 'up' : 'dn');
  };
  F.acts.rir = (t) => { const f = findSet(t.dataset.s); if (!f) return; f.st.rir = f.st.rir === Number(t.dataset.v) ? null : Number(t.dataset.v); F.render(); };
  /* Vorschlag in die leeren Felder übernehmen (nur das, was du nicht selbst geändert hast) */
  const applyTarget = (se, st, ex) => { const tg = F.setTarget(se, st); if (st.load_kg === null && !noLoad(ex)) st.load_kg = tg.load_kg; if (tg.timed) { if (st.seconds === null || st.seconds === undefined) st.seconds = tg.seconds; } else if (st.reps === null || st.reps === undefined) st.reps = tg.reps; };
  const saveDone = async (st) => { const r = await F.update('sets', st.id, { load_kg: st.load_kg, reps: st.reps ?? null, seconds: st.seconds ?? null, rir: st.rir ?? null, done: true, done_at: new Date().toISOString() }); Object.assign(st, r); };
  F.acts.doneSet = async (t) => {
    const f = findSet(t.dataset.s); if (!f) return; const st = f.st, ex = F.S.exById[f.se.exercise_id] || {}, pf = E.PROFILES[ex.dosage_profile] || E.PROFILES.A;
    applyTarget(f.se, st, ex); F.sound.unlock(); try { navigator.vibrate && navigator.vibrate(12); } catch {} if (F.focusOn() && F.wake) F.wake(true);
    if (!noLoad(ex) && st.load_kg === null && pf.reps) { if (!confirm('Kein Gewicht eingetragen. Trotzdem abschließen? Das Gewicht bleibt dann „unbekannt“.')) return; }
    await saveDone(st); F.ui.tr.last = st.id;
    // nächsten offenen Satz mit dem Gewicht vorbelegen (nie erfundene Werte: nur Kopie des gerade Eingegebenen)
    const nxt = f.se.sets.find((x) => !x.done);
    if (nxt && nxt.load_kg === null && st.load_kg !== null) { nxt.load_kg = st.load_kg; F.update('sets', nxt.id, { load_kg: st.load_kg }).catch(() => null); }
    let rest = true;
    if (F.focusOn()) {
      // Superset: erst beide Übungen im Wechsel, Pause danach. Sonst weiter in derselben Übung bzw. zur nächsten offenen.
      const s = f.s, p = partnerOf(s, f.se), idx = (e) => s.session_exercises.indexOf(e);
      if (p && isOpen(p) && doneN(p) < doneN(f.se)) { F.ui.tr.ei = idx(p); rest = false; }
      else if (p && isOpen(p) && (!isOpen(f.se) || doneN(p) < doneN(f.se) || idx(p) < idx(f.se))) F.ui.tr.ei = idx(p);
      else if (!isOpen(f.se)) { const i = nextOpen(s, idx(f.se)); if (i >= 0) F.ui.tr.ei = i; }
      if (!s.session_exercises.some(isOpen)) rest = false;
    }
    if (rest) { const P = E.params(F.S.params), sec = P[pf.rest] || 90; F.rest = { end: Date.now() + sec * 1000, total: sec, warned: false }; }
    else F.rest = null;
    F.render(); F.pulseSet && F.pulseSet(st.id); if (F.rest) F.tick(); window.scrollTo(0, 0);
  };
  /* Nachtragen in einem Rutsch: alle offenen Sätze der Übung mit den vorgeschlagenen Werten abhaken */
  F.acts.doneAll = async (t) => {
    const s = F.openSession(), se = s.session_exercises.find((x) => x.id === t.dataset.id), ex = F.S.exById[se.exercise_id] || {};
    const open = se.sets.filter((x) => !x.done); open.forEach((st) => applyTarget(se, st, ex));
    if (!noLoad(ex) && open.some((st) => st.load_kg === null) && !confirm('Für mindestens einen Satz ist kein Gewicht bekannt. Trotzdem abhaken?')) return;
    for (const st of open) await saveDone(st);
    F.toast(open.length + ' Sätze abgehakt'); const i = nextOpen(s, s.session_exercises.indexOf(se)); if (i >= 0) F.ui.tr.ei = i; F.render(); window.scrollTo(0, 0);
  };
  F.acts.skipEx = (t) => {
    const s = F.openSession(), se = s.session_exercises.find((x) => x.id === t.dataset.id), sk = F.ui.tr.skip;
    if (!sk.includes(se.id)) sk.push(se.id); const i = nextOpen(s, s.session_exercises.indexOf(se) + 1);
    if (i >= 0 && s.session_exercises[i] !== se) F.ui.tr.ei = i; else F.toast('Keine andere Übung mehr offen.');
    F.render(); window.scrollTo(0, 0);
  };
  F.acts.rate = async (t) => { const f = F.ui.tr.last && findSet(F.ui.tr.last); if (!f) return; const v = Number(t.dataset.v), nv = f.st.rir === v ? null : v; f.st.rir = nv; F.render(); await F.update('sets', f.st.id, { rir: nv }); };
  F.acts.undo = async (t) => { const f = findSet(t.dataset.s); const r = await F.update('sets', f.st.id, { done: false, done_at: null }); Object.assign(f.st, r); F.render(); };
  F.acts.addSet = async (t) => { const se = F.openSession().session_exercises.find((x) => x.id === t.dataset.id); const last = se.sets[se.sets.length - 1]; const r = await F.insert('sets', { session_exercise_id: se.id, set_no: (last ? last.set_no : 0) + 1, load_kg: last ? last.load_kg : null, load_per_hand: last ? last.load_per_hand : false }); se.sets.push(r); F.render(); };
  F.acts.rmSet = async (t) => { const se = F.openSession().session_exercises.find((x) => x.id === t.dataset.id); const last = se.sets[se.sets.length - 1]; if (last.done) return; await F.del('sets', last.id); se.sets.pop(); F.render(); };

  /* Freies Training und Wiederholen einer früheren Einheit */
  F.acts.startFree = async () => {
    if (F.openSession()) return F.go('training');
    await F.insert('sessions', { session_date: F.today(), kind: 'kraft', title: 'Freies Training', status: 'geplant', source: 'manuell', equipment_profile_id: F.items().id, rule_version: E.RULE_VERSION, started_at: new Date().toISOString() });
    F.ui.tr.ei = 0; F.ui.tr.skip = []; await F.load(); F.go('training');
  };
  F.acts.repeatSession = async (t) => {
    if (F.openSession()) return F.toast('Es läuft schon eine Einheit. Beende sie zuerst.');
    const old = F.S.sessions.find((x) => x.id === t.dataset.id); if (!old) return;
    const list = old.session_exercises.filter((se) => F.S.exById[se.exercise_id] && se.sets.some((x) => x.done));
    if (!list.length) return F.toast('Diese Einheit hat keine erfassten Sätze.');
    const sess = await F.insert('sessions', { session_date: F.today(), kind: 'kraft', title: old.title, split_day: old.split_day, status: 'geplant', source: 'manuell', equipment_profile_id: F.items().id, rule_version: E.RULE_VERSION, started_at: new Date().toISOString() });
    const ses = await F.sb.from('session_exercises').insert(list.map((se, i) => ({ session_id: sess.id, exercise_id: se.exercise_id, position: i, planned_sets: se.planned_sets || se.sets.filter((x) => x.done).length, planned_reps: se.planned_reps, planned_rir: se.planned_rir, why: 'Wiederholt vom ' + F.dshort(old.session_date) + '.' }))).select(); if (ses.error) throw ses.error;
    const rows = []; ses.data.forEach((se, i) => { const ws = E.workSets(list[i].sets), n = Math.max(1, list[i].planned_sets || ws.length), top = ws.length ? Math.max(...ws.map((x) => Number(x.load_kg) || 0)) : 0; for (let k = 1; k <= n; k++) rows.push({ session_exercise_id: se.id, set_no: k, load_kg: top || null, load_per_hand: (F.S.exById[se.exercise_id] || {}).load_convention === 'je_hand' }); });
    const sr = await F.sb.from('sets').insert(rows); if (sr.error) throw sr.error;
    F.ui.tr.ei = 0; F.ui.tr.skip = []; await F.load(); F.go('training');
  };

  /* Ton, Vibration und Ansage. Auf dem iPhone geht Vibration nicht, deshalb immer zusätzlich ein Ton. */
  F.sound = (() => {
    let ctx = null;
    const unlock = () => { try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); } catch { ctx = null; } };
    const beep = (n = 2, f = 880) => { if (!ctx) return; for (let i = 0; i < n; i++) { const o = ctx.createOscillator(), g = ctx.createGain(), t0 = ctx.currentTime + i * 0.28; o.frequency.value = f; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2); o.start(t0); o.stop(t0 + 0.22); } };
    const say = (txt) => { try { if (!F.ls.get('voice', false) || !window.speechSynthesis) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(txt); u.lang = 'de-DE'; u.rate = 1.02; speechSynthesis.speak(u); } catch {} };
    return { unlock, beep, say };
  })();
  F.acts.voiceToggle = () => { const on = !F.ls.get('voice', false); F.ls.set('voice', on); F.sound.unlock(); if (on) { F.sound.say('Ansagen sind an.'); } F.toast(on ? 'Ansagen an: Nach der Pause sagt forza den nächsten Satz an.' : 'Ansagen aus'); F.render(); };
  const announce = () => {
    const s = F.openSession(); if (!s) return; const i = nextOpen(s, F.ui.tr.ei || 0); if (i < 0) return F.sound.say('Geschafft. Du kannst das Training beenden.');
    const se = s.session_exercises[i], ex = F.S.exById[se.exercise_id] || {}, st = se.sets.find((x) => !x.done), tg = F.setTarget(se, st);
    const kg = tg.load_kg !== null && !noLoad(ex) ? `, ${String(tg.load_kg).replace('.', ',')} Kilo` : '', v = tg.timed ? (tg.seconds ? `, ${tg.seconds} Sekunden` : '') : (tg.reps ? `, ${tg.reps} Wiederholungen` : '');
    F.sound.say(`Weiter. ${ex.name}, Satz ${st.set_no}${kg}${v}.`);
  };

  /* Pausentimer */
  F.restBar = () => { if (!F.rest || F.route()[0] !== 'training' || (F.focusOn() && F.openSession())) return ''; const left = Math.max(0, Math.ceil((F.rest.end - Date.now()) / 1000)); return `<div class="rest" id="rest"><span>Pause <b id="rest-t">${mmss(left)}</b></span><span class="row gap"><button class="btn sm" style="background:rgba(0,0,0,.15);color:inherit" data-act="restAdd">+30 s</button><button class="btn sm" style="background:rgba(0,0,0,.15);color:inherit" data-act="restStop">Überspringen</button></span></div>`; };
  const restOver = (silent) => {
    F.rest = null; clearInterval(F._tk); document.getElementById('rest')?.remove();
    if (!silent) { try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch {} F.sound.beep(2); announce(); if (!F.focusOn()) F.toast('Pause vorbei, weiter geht’s'); }
    if (F.focusOn() && F.route()[0] === 'training' && !document.getElementById('modal')) F.render();
  };
  F.tick = () => { clearInterval(F._tk); F._tk = setInterval(() => {
    if (!F.rest) return clearInterval(F._tk); const left = Math.ceil((F.rest.end - Date.now()) / 1000), el = document.getElementById('rest-t'), bar = document.getElementById('rest-p');
    if (left <= 0) return restOver(false);
    if (left <= 10 && !F.rest.warned) { F.rest.warned = true; F.sound.beep(1, 660); }
    if (el) el.textContent = mmss(left); if (bar) bar.style.strokeDashoffset = (2 * Math.PI * 92 * (1 - Math.min(1, left / F.rest.total))).toFixed(1);
    if (el) el.classList.toggle('soon', left <= 10);
  }, 500); };
  F.acts.restAdd = () => { if (F.rest) { F.rest.end += 30000; F.rest.total += 30; F.rest.warned = false; } };
  F.acts.restStop = () => restOver(true);
  // Nach dem Entsperren: abgelaufene Pause sofort auflösen
  document.addEventListener('visibilitychange', () => { if (!document.hidden && F.rest && F.rest.end <= Date.now()) restOver(false); });

  /* Ersetzen, Notiz, Schmerz */
  F.acts.swapAsk = (t) => {
    const s = F.openSession(), se = s.session_exercises.find((x) => x.id === t.dataset.id), cur = F.S.exById[se.exercise_id];
    const ctx = { items: F.items().items, userEx: F.S.userEx, painEx: F.painSet() };
    const used = new Set(s.session_exercises.map((x) => x.exercise_id));
    const alts = F.S.exercises.filter((e) => e.id !== cur.id && !used.has(e.id) && e.muscles_primary.some((m) => cur.muscles_primary.includes(m)) && E.eligible(e, ctx)).sort((a, b) => (b.pattern === cur.pattern) - (a.pattern === cur.pattern)).slice(0, 12);
    F.modal(`<div class="h2">Ersetzen durch</div>${alts.length ? `<div class="list">${alts.map((e) => `<button class="it" data-act="swap" data-id="${se.id}" data-ex="${e.id}"><div class="grow"><b>${esc(e.name)}</b><div class="small mute">${e.muscles_primary.map((m) => E.LABEL[m]).join(', ')}${e.pattern === cur.pattern ? ' · gleiches Bewegungsmuster' : ''}</div></div></button>`).join('')}</div>` : '<div class="mute">Mit deiner aktuellen Ausstattung und den freigegebenen Übungen gibt es keine passende Alternative. Unter „Mehr → Katalog“ kannst du Entwürfe freigeben.</div>'}`);
  };
  F.acts.swap = async (t) => {
    const s = F.openSession(), se = s.session_exercises.find((x) => x.id === t.dataset.id);
    await F.update('session_exercises', se.id, { exercise_id: t.dataset.ex, replaced_from: se.exercise_id, why: 'Ersetzt, Last bitte neu einschätzen.' });
    for (const st of se.sets.filter((x) => !x.done)) await F.update('sets', st.id, { load_kg: null });
    F.closeModal(); await F.load(); F.render();
  };
  F.acts.noteAsk = (t) => { const s = F.openSession(), se = s.session_exercises.find((x) => x.id === t.dataset.id); F.modal(`<div class="h2">Notiz</div><textarea id="n-t" rows="4">${esc(se.note || '')}</textarea><button class="btn pri block" style="margin-top:12px" data-act="noteSave" data-id="${se.id}">Speichern</button>`); };
  F.acts.noteSave = async (t) => { await F.update('session_exercises', t.dataset.id, { note: document.getElementById('n-t').value || null }); F.closeModal(); await F.load(); F.render(); };
  F.acts.painAsk = (t) => F.modal(`<div class="h2">Schmerz melden</div><p>Hör bei stechendem oder zunehmendem Schmerz mit der Übung auf. forza schlägt sie dann 14 Tage lang nicht vor.</p><p class="small mute">Das ist keine ärztliche Beurteilung. Bei anhaltenden Beschwerden lass es abklären.</p><div class="row gap"><button class="btn danger grow" data-act="painSave" data-id="${t.dataset.id}">Melden</button><button class="btn ghost grow" data-act="close">Abbrechen</button></div>`);
  F.acts.painSave = async (t) => { const se = F.openSession().session_exercises.find((x) => x.id === t.dataset.id); const target = se.sets.find((x) => !x.done) || se.sets[se.sets.length - 1]; await F.update('sets', target.id, { pain: true }); F.closeModal(); await F.load(); F.toast('Eingetragen. Diese Übung wird pausiert.'); F.render(); };

  /* Haltungsblock: ein Angebot am Ende statt fester Übungen in der Liste */
  const postureEx = (s) => { const P = E.params(F.S.params); if (!P.posture_block || !s || s.kind !== 'kraft' || s.session_exercises.some((se) => (F.S.exById[se.exercise_id] || {}).dosage_profile === 'M')) return [];
    return E.mobilityPick({ exercises: F.S.exercises, items: F.items().items, userEx: F.S.userEx, painEx: F.painSet(), sessions: F.S.sessions, goals: [], studio: F.items().kind === 'studio' }, P, 3); };
  const postureOffer = (s) => { const l = postureEx(s); return l.length ? `<button class="btn block" style="margin-top:10px" data-act="addPosture">Haltung anhängen · ${l.length} Übungen, ca. 4 min</button>` : ''; };
  F.acts.addPosture = async () => {
    const s = F.openSession(), items = postureEx(s); if (!items.length) return;
    const ses = await F.sb.from('session_exercises').insert(items.map((it, i) => ({ session_id: s.id, exercise_id: it.exercise_id, position: s.session_exercises.length + i, planned_sets: it.sets, planned_reps: it.reps.join('–'), why: it.load_text }))).select(); if (ses.error) throw ses.error;
    const rows = []; ses.data.forEach((se, i) => { for (let n = 1; n <= items[i].sets; n++) rows.push({ session_exercise_id: se.id, set_no: n }); });
    const sr = await F.sb.from('sets').insert(rows); if (sr.error) throw sr.error;
    const at = s.session_exercises.length; F.closeModal(); await F.load(); F.ui.tr.ei = at; F.render(); window.scrollTo(0, 0);
  };

  /* Beenden */
  F.acts.finishAsk = () => {
    const s = F.openSession(), mins = Math.max(1, Math.round((Date.now() - new Date(s.started_at).getTime()) / 60000)), n = s.session_exercises.reduce((a, e) => a + e.sets.filter((x) => x.done).length, 0);
    F.modal(`<div class="h2">Training beenden?</div><div class="kv" style="margin-bottom:14px"><span class="mute">Abgeschlossene Sätze</span><b>${n}</b><span class="mute">Dauer</span><b>${mins} min</b></div><label class="f"><span>Notiz (optional)</span><input id="f-n" type="text" placeholder="Wie war’s?"></label><button class="btn pri block" data-act="finish">Speichern und beenden</button>${postureOffer(s)}<button class="btn danger block" style="margin-top:8px" data-act="discard">Verwerfen</button>`);
  };
  F.acts.finish = async () => {
    const s = F.openSession(), mins = Math.max(1, Math.round((Date.now() - new Date(s.started_at).getTime()) / 60000));
    // Kennzahlen vor dem Speichern: Sätze, Volumen, neue Bestwerte (nur wenn frühere Werte bekannt sind)
    let sets = 0, vol = 0; const prs = [];
    for (const se of s.session_exercises) {
      const ex = F.S.exById[se.exercise_id]; if (!ex) continue; const done = se.sets.filter((x) => x.done); sets += done.length;
      if (ex.dosage_profile === 'M') continue;
      for (const x of done) if (x.load_kg !== null && x.reps !== null && !['koerper', 'zeit', 'keine'].includes(ex.load_convention)) vol += Number(x.load_kg) * x.reps * (ex.load_convention === 'je_hand' ? 2 : 1);
      const best = Math.max(0, ...done.filter((x) => x.load_kg !== null && x.reps !== null).map((x) => E.e1rm(Number(x.load_kg), x.reps) || 0));
      let prev = 0; for (const o of F.S.sessions) if (o.id !== s.id && ['gefuehrt', 'bestaetigt'].includes(o.status)) for (const oe of o.session_exercises) if (oe.exercise_id === se.exercise_id) for (const y of oe.sets) if (y.done && y.load_kg !== null && y.reps !== null) prev = Math.max(prev, E.e1rm(Number(y.load_kg), y.reps) || 0);
      if (prev > 0 && best > prev + 0.01) prs.push(`${ex.name}: ca. ${F.fmt(Math.round(best * 10) / 10)} kg Maximalkraft (vorher ${F.fmt(Math.round(prev * 10) / 10)})`);
    }
    const wk = F.S.sessions.filter((o) => o.kind === 'kraft' && ['gefuehrt', 'bestaetigt'].includes(o.status) && o.session_date >= F.addDays(F.today(), -6)).length + 1;
    await F.update('sessions', s.id, { status: 'bestaetigt', finished_at: new Date().toISOString(), duration_min: mins, note: document.getElementById('f-n').value || null });
    F.rest = null; F.ui.tr.skip = []; F.ui.tr.last = null; F.closeModal(); await F.load();
    if (F.celebrate) F.celebrate({ title: s.title || 'Training', sets, minutes: mins, volume: Math.round(vol), prs, week: s.kind === 'kraft' ? wk : 0 }); else F.go('heute');
  };
  F.acts.discard = async () => { if (!confirm('Dieses Training wirklich verwerfen? Eingetragene Sätze gehen verloren.')) return; await F.del('sessions', F.openSession().id); F.rest = null; F.ui.tr.skip = []; F.closeModal(); await F.load(); F.go('heute'); };

  /* ---------- Übungshilfe ---------- */
  const A = (a) => `<svg class="anim" viewBox="0 0 200 140" role="img" aria-label="Bewegungsanimation"><line x1="10" y1="128" x2="190" y2="128" stroke-opacity=".35"/>${a}</svg>`;
  const an = (attr, vals, dur = '3s') => `<animate attributeName="${attr}" values="${vals}" keyTimes="0;.5;1" dur="${dur}" repeatCount="indefinite" calcMode="spline" keySplines=".4 0 .2 1;.4 0 .2 1"/>`;
  const ANIM = {
    squat: () => A(`<polyline points="100,36 100,76 100,100 100,126"><animate attributeName="points" values="100,36 100,76 100,100 100,126;84,64 68,98 106,100 100,126;100,36 100,76 100,100 100,126" keyTimes="0;.5;1" dur="3.2s" repeatCount="indefinite"/></polyline><circle cx="100" cy="22" r="10"><animate attributeName="cx" values="100;86;100" dur="3.2s" repeatCount="indefinite"/><animate attributeName="cy" values="22;50;22" dur="3.2s" repeatCount="indefinite"/></circle><circle class="accf" cx="100" cy="36" r="6"><animate attributeName="cx" values="100;84;100" dur="3.2s" repeatCount="indefinite"/><animate attributeName="cy" values="36;64;36" dur="3.2s" repeatCount="indefinite"/></circle>`),
    press: () => A(`<line x1="30" y1="104" x2="130" y2="104" stroke-opacity=".5"/><circle cx="38" cy="88" r="9"/><polyline points="50,94 112,94 128,106 128,126"/><line x1="64" y1="94" x2="64" y2="76">${an('y2', '76;42;76', '3s')}</line><circle class="accf" cx="64" cy="76" r="7">${an('cy', '76;42;76', '3s')}</circle>`),
    pull: () => A(`<circle cx="92" cy="30" r="10"/><polyline points="92,42 90,98 134,98 136,126"/><line x1="92" y1="56" x2="140" y2="66"><animate attributeName="x2" values="146;104;146" dur="3s" repeatCount="indefinite"/><animate attributeName="y2" values="66;72;66" dur="3s" repeatCount="indefinite"/></line><line class="acc" x1="170" y1="66" x2="146" y2="66"><animate attributeName="x2" values="146;104;146" dur="3s" repeatCount="indefinite"/><animate attributeName="y2" values="66;72;66" dur="3s" repeatCount="indefinite"/></line>`),
    hinge: () => A(`<polyline points="100,78 100,102 98,126"/><circle cx="100" cy="22" r="10"><animate attributeName="cx" values="100;142;100" dur="3.2s" repeatCount="indefinite"/><animate attributeName="cy" values="22;62;22" dur="3.2s" repeatCount="indefinite"/></circle><line x1="100" y1="78" x2="100" y2="36"><animate attributeName="x2" values="100;132;100" dur="3.2s" repeatCount="indefinite"/><animate attributeName="y2" values="36;68;36" dur="3.2s" repeatCount="indefinite"/></line><line x1="100" y1="36" x2="100" y2="70"><animate attributeName="x1" values="100;132;100" dur="3.2s" repeatCount="indefinite"/><animate attributeName="y1" values="36;68;36" dur="3.2s" repeatCount="indefinite"/><animate attributeName="x2" values="100;130;100" dur="3.2s" repeatCount="indefinite"/><animate attributeName="y2" values="70;104;70" dur="3.2s" repeatCount="indefinite"/></line><circle class="accf" cx="100" cy="70" r="7"><animate attributeName="cx" values="100;130;100" dur="3.2s" repeatCount="indefinite"/><animate attributeName="cy" values="70;104;70" dur="3.2s" repeatCount="indefinite"/></circle>`),
    curl: () => A(`<circle cx="100" cy="22" r="10"/><polyline points="100,34 100,84 90,126"/><polyline points="100,84 110,126"/><line x1="100" y1="42" x2="100" y2="72"/><line x1="100" y1="72" x2="100" y2="102"><animate attributeName="x2" values="102;126;102" dur="2.6s" repeatCount="indefinite"/><animate attributeName="y2" values="102;66;102" dur="2.6s" repeatCount="indefinite"/></line><circle class="accf" cx="100" cy="102" r="7"><animate attributeName="cx" values="102;126;102" dur="2.6s" repeatCount="indefinite"/><animate attributeName="cy" values="102;66;102" dur="2.6s" repeatCount="indefinite"/></circle>`),
    raise: () => A(`<circle cx="100" cy="22" r="10"/><line x1="100" y1="34" x2="100" y2="84"/><line x1="100" y1="84" x2="88" y2="126"/><line x1="100" y1="84" x2="112" y2="126"/><line x1="100" y1="42" x2="80" y2="84"><animate attributeName="x2" values="80;44;80" dur="2.8s" repeatCount="indefinite"/><animate attributeName="y2" values="84;44;84" dur="2.8s" repeatCount="indefinite"/></line><line x1="100" y1="42" x2="120" y2="84"><animate attributeName="x2" values="120;156;120" dur="2.8s" repeatCount="indefinite"/><animate attributeName="y2" values="84;44;84" dur="2.8s" repeatCount="indefinite"/></line><circle class="accf" cx="80" cy="84" r="6"><animate attributeName="cx" values="80;44;80" dur="2.8s" repeatCount="indefinite"/><animate attributeName="cy" values="84;44;84" dur="2.8s" repeatCount="indefinite"/></circle><circle class="accf" cx="120" cy="84" r="6"><animate attributeName="cx" values="120;156;120" dur="2.8s" repeatCount="indefinite"/><animate attributeName="cy" values="84;44;84" dur="2.8s" repeatCount="indefinite"/></circle>`)
  };
  const PAT = { kniebeuge: 'squat', horizontal_druecken: 'press', horizontal_ziehen: 'pull', huefte_beugen: 'hinge', kreuzheben: 'hinge', curl: 'curl', seitheben: 'raise' };
  F.acts.help = (t) => F.go('uebung/' + t.dataset.id);
  F.views.uebung = ([id]) => {
    const ex = F.S.exById[id]; if (!ex) return '<div class="card">Übung nicht gefunden.</div>';
    const T = (ex.code && window.FORZA_TEXTS[ex.code]) || null, c = ex.content || {}, st = F.S.userEx[id] || {};
    const pf = E.PROFILES[ex.dosage_profile], anim = PAT[ex.pattern];
    const sec = (h, x) => (x ? `<div class="card"><div class="eyebrow" style="margin-bottom:6px">${h}</div><div>${esc(x)}</div></div>` : '');
    const checked = ex.tier === 'geprueft';
    return `<button class="back" data-act="back">${F.icon.back.replace('<svg', '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"')} Zurück</button>
      <div class="row between wrap" style="margin-bottom:10px"><div><div class="h1" style="font-size:26px">${esc(ex.name)}</div><div class="mute">${ex.muscles_primary.map((m) => E.LABEL[m]).join(', ')}${ex.code ? ' · ' + ex.code : ''}</div></div><span class="badge ${checked ? 'ok' : 'warn'}">${checked ? 'fachlich geprüft' : st.released ? 'Entwurf, von dir freigegeben' : 'Entwurf, nicht fachlich geprüft'}</span></div>
      ${anim ? `<div class="card" style="padding:12px">${ANIM[anim]()}<div class="small mute" style="margin-top:8px;text-align:center">Vereinfachte Skizze der Bewegung, kein Ersatz für die Beschreibung.</div></div>` : `<div class="card small mute">Für diese Übung gibt es noch keine Animation. Die Beschreibung unten erklärt den Ablauf.</div>`}
      ${T ? sec('Funktion und Ausstattung', T.funktion) + sec('Ausführung', T.ausfuehrung) + sec('Kontrolle und typische Probleme', T.kontrolle) + sec('Anpassen und ersetzen', T.anpassen) + sec('Dosierung und Tracking', T.dosierung) + sec('Aussagegrenzen', T.grenzen) + sec('Technikquellen', T.quellen) : sec('Ausführung', c.ausfuehrung) + sec('Typische Fehler', c.fehler) + sec('Hinweis', c.hinweis) + `<div class="card small mute">Diese Beschreibung ist ein Entwurf und wurde nicht fachlich geprüft.</div>`}
      <div class="card"><div class="eyebrow" style="margin-bottom:6px">Ausstattung und Last</div><div class="small">${ex.equipment.map((e) => esc(F.itemLabel(e))).join(', ') || 'keine'}${ex.equipment_alt.length ? ' · Alternative: ' + ex.equipment_alt.map((e) => esc(F.itemLabel(e))).join(', ') : ''}<br>Lastangabe: ${{ gesamt: 'Gesamtgewicht', je_hand: 'je Hand', koerper: 'Körpergewicht', zusatz: 'Zusatzgewicht', zeit: 'Zeit', keine: 'ohne Last' }[ex.load_convention] || '–'}${pf ? '<br>Dosierungsprofil: ' + pf.label : ''}</div></div>
      <div class="warnbox card" style="border-color:var(--warn)"><b>Bei Schmerz stoppen.</b> Hör bei stechendem oder zunehmendem Schmerz auf und wähle eine andere Übung.</div>
      ${!checked ? `<div class="row gap"><button class="btn grow" data-act="releaseEx" data-id="${id}">${st.released ? 'Freigabe zurücknehmen' : 'Für Vorschläge freigeben'}</button></div>` : ''}`;
  };
  F.acts.releaseEx = async (t) => {
    const id = t.dataset.id, cur = F.S.userEx[id];
    const r = await F.sb.from('user_exercise_settings').upsert({ user_id: F.user.id, exercise_id: id, released: !(cur && cur.released), hidden: cur ? cur.hidden : false }, { onConflict: 'user_id,exercise_id' }); if (r.error) throw r.error;
    await F.load(); F.render(); F.toast('Gespeichert');
  };
})();
