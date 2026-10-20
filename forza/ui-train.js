/* forza · Training protokollieren, Übungshilfe */
(function () {
  const F = window.F, E = F.E, esc = F.esc;
  F.ui.tr = { ei: 0 };
  const noLoad = (ex) => ['koerper', 'keine', 'zeit', 'strecke'].includes(ex.load_convention);

  /* ---------- Start ---------- */
  F.acts.start = async () => {
    if (F.openSession()) return F.go('training');
    const sg0 = F.suggestion(); if (sg0.rest || sg0.empty || !sg0.items.length) return F.toast('Heute kein Vorschlag möglich.');
    const sg = Object.assign({}, sg0, { items: sg0.items.concat(sg0.mobility || []) });
    const sess = await F.insert('sessions', { session_date: F.today(), kind: 'kraft', title: sg.title, split_day: sg.split_day, status: 'geplant', source: 'manuell', form: F.ls.get('form-' + F.today(), 'normal'), planned_minutes: sg.minutes, equipment_profile_id: F.items().id, rule_version: sg.rule_version, started_at: new Date().toISOString() });
    const ses = await F.sb.from('session_exercises').insert(sg.items.map((it, i) => ({ session_id: sess.id, exercise_id: it.exercise_id, position: i, planned_sets: it.sets, planned_reps: it.reps ? it.reps.join('–') : it.secs ? it.secs.join('–') + ' s' : null, planned_rir: it.rir ? it.rir.join('–') : null, why: it.load_text }))).select();
    if (ses.error) throw ses.error;
    const rows = [];
    ses.data.forEach((se, i) => { const it = sg.items[i]; for (let n = 1; n <= it.sets; n++) rows.push({ session_exercise_id: se.id, set_no: n, load_kg: it.load_kg, load_per_hand: it.load_convention === 'je_hand' }); });
    const sr = await F.sb.from('sets').insert(rows); if (sr.error) throw sr.error;
    await F.sb.from('suggestions').insert({ for_date: F.today(), payload: { title: sg.title, items: sg.items.map((i) => ({ id: i.exercise_id, sets: i.sets })) }, reasons: sg.reasons, rule_version: sg.rule_version, accepted: true });
    F.ui.tr.ei = 0; await F.load(); F.go('training');
  };
  F.acts.startPosture = async () => {
    if (F.openSession()) return F.go('training');
    const P = E.params(F.S.params), items = E.mobilityPick({ exercises: F.S.exercises, items: F.items().items, userEx: F.S.userEx, painEx: F.painSet(), sessions: F.S.sessions, goals: [] }, P, 3);
    if (!items.length) return F.toast('Mit dieser Ausstattung gibt es keine passende Übung. Eine Matte genügt.');
    const sess = await F.insert('sessions', { session_date: F.today(), kind: 'sonstiges', title: 'Haltung und Mobilität', status: 'geplant', source: 'manuell', planned_minutes: 8, equipment_profile_id: F.items().id, rule_version: E.RULE_VERSION, started_at: new Date().toISOString() });
    const ses = await F.sb.from('session_exercises').insert(items.map((it, i) => ({ session_id: sess.id, exercise_id: it.exercise_id, position: i, planned_sets: it.sets, planned_reps: it.reps.join('–'), why: it.load_text }))).select(); if (ses.error) throw ses.error;
    const rows = []; ses.data.forEach((se, i) => { for (let n = 1; n <= items[i].sets; n++) rows.push({ session_exercise_id: se.id, set_no: n }); });
    const sr = await F.sb.from('sets').insert(rows); if (sr.error) throw sr.error;
    F.ui.tr.ei = 0; await F.load(); F.go('training');
  };
  F.acts.resume = () => F.go('training');

  /* ---------- Ansicht ---------- */
  F.views.training = () => {
    const s = F.openSession();
    if (!s) {
      const done = F.S.sessions.filter((x) => x.kind === 'kraft' && ['gefuehrt', 'bestaetigt'].includes(x.status)).slice(-6).reverse();
      return `<div class="h1" style="margin-bottom:14px">Training</div><div class="card"><div class="h2">Kein Training läuft</div><div class="mute" style="margin-bottom:14px">Starte den Vorschlag von „Heute“ oder wähle dort einen anderen Tag.</div><button class="btn pri" data-act="nav" data-r="heute">Zum Vorschlag</button></div>
      <div class="card"><div class="h2">Zuletzt</div>${done.map((x) => `<div class="list"><div class="it"><div class="ico">${F.icon.dumb}</div><div class="grow"><b>${esc(x.title || 'Training')}</b><div class="small mute">${F.dlabel(x.session_date)}${x.session_exercises.length ? ' · ' + x.session_exercises.length + ' Übungen' : ' · Details unbekannt'}</div></div></div></div>`).join('') || '<div class="mute">Noch nichts.</div>'}</div>`;
    }
    const exs = s.session_exercises; if (F.ui.tr.ei >= exs.length) F.ui.tr.ei = exs.length - 1; if (F.ui.tr.ei < 0) F.ui.tr.ei = 0;
    const se = exs[F.ui.tr.ei], ex = F.S.exById[se.exercise_id] || { name: '?', load_convention: 'gesamt' }, pf = E.PROFILES[ex.dosage_profile] || E.PROFILES.A;
    const doneN = (e) => e.sets.filter((x) => x.done).length;
    const firstOpen = se.sets.findIndex((x) => !x.done);
    const elapsed = Math.max(0, Math.round((Date.now() - new Date(s.started_at).getTime()) / 60000));
    const unit = ex.load_convention === 'je_hand' ? 'kg je Hand' : 'kg';
    const timed = !!pf.secs;
    return `<div class="row between" style="margin-bottom:10px"><div><div class="eyebrow">${esc(s.title || 'Training')} · ${elapsed} min</div><div class="h1" style="font-size:24px">${esc(ex.name)}</div></div><button class="btn sm ghost" data-act="finishAsk">Beenden</button></div>
      <div class="row gap" style="margin-bottom:14px">${exs.map((e, i) => `<button class="grow" style="height:8px;border-radius:99px;background:${doneN(e) === e.sets.length ? 'var(--a)' : i === F.ui.tr.ei ? 'color-mix(in srgb,var(--a) 45%,var(--card2))' : 'var(--card2)'}" data-act="goEx" data-i="${i}" aria-label="Übung ${i + 1}"></button>`).join('')}</div>
      <div class="card"><div class="row between wrap"><div class="small mute">Übung ${F.ui.tr.ei + 1} von ${exs.length} · ${doneN(se)}/${se.sets.length} Sätze</div><span class="badge">${pf.label}</span></div>
        <div style="margin:8px 0 2px">Ziel: <b>${se.planned_sets} × ${esc(se.planned_reps || '')}${pf.perSide ? ' je Seite' : ''}</b>${se.planned_rir ? ' · Reserve ' + esc(se.planned_rir) : ''}</div>
        ${se.why ? `<div class="small mute">${esc(se.why)}</div>` : ''}
        <div class="row wrap gap" style="margin-top:12px"><button class="btn sm" data-act="help" data-id="${se.exercise_id}">${F.icon.info.replace('<svg', '<svg width="16" height="16"')} Hilfe</button><button class="btn sm" data-act="swapAsk" data-id="${se.id}">${F.icon.swap.replace('<svg', '<svg width="16" height="16"')} Ersetzen</button><button class="btn sm" data-act="noteAsk" data-id="${se.id}">${F.icon.note.replace('<svg', '<svg width="16" height="16"')} Notiz</button><button class="btn sm danger" data-act="painAsk" data-id="${se.id}">${F.icon.warn.replace('<svg', '<svg width="16" height="16"')} Schmerz</button></div>${se.note ? `<div class="small" style="margin-top:10px">Notiz: ${esc(se.note)}</div>` : ''}</div>
      ${se.sets.map((st, i) => `<div class="setrow ${st.done ? 'done' : i === firstOpen ? 'cur' : ''}" data-sid="${st.id}">
        <div class="row between" style="margin-bottom:10px"><b>Satz ${st.set_no}${st.pain ? ' · Schmerz gemeldet' : ''}</b>${st.done ? '<span class="badge ok">erledigt</span>' : ''}</div>
        <div class="row gap">${noLoad(ex) ? '' : `<div class="grow"><div class="small mute" style="margin-bottom:4px">${unit}${ex.load_convention === 'je_hand' && st.load_kg ? ' (= ' + F.fmt(st.load_kg * 2) + ' gesamt)' : ''}</div><div class="stepper"><button data-act="step" data-f="load_kg" data-d="-1" data-s="${st.id}" aria-label="weniger">−</button><input type="text" inputmode="decimal" data-in="setVal" data-f="load_kg" data-s="${st.id}" value="${st.load_kg === null ? '' : F.fmt(st.load_kg)}" placeholder="–"><button data-act="step" data-f="load_kg" data-d="1" data-s="${st.id}" aria-label="mehr">+</button></div></div>`}
        <div class="grow"><div class="small mute" style="margin-bottom:4px">${timed ? 'Sekunden / Meter' : 'Wiederholungen'}</div><div class="stepper"><button data-act="step" data-f="${timed ? 'seconds' : 'reps'}" data-d="-1" data-s="${st.id}" aria-label="weniger">−</button><input type="text" inputmode="numeric" data-in="setVal" data-f="${timed ? 'seconds' : 'reps'}" data-s="${st.id}" value="${(timed ? st.seconds : st.reps) ?? ''}" placeholder="${timed ? pf.secs.join('–') : pf.reps ? pf.reps.join('–') : '–'}"><button data-act="step" data-f="${timed ? 'seconds' : 'reps'}" data-d="1" data-s="${st.id}" aria-label="mehr">+</button></div></div></div>
        ${pf.rir ? `<div class="small mute" style="margin:10px 0 4px">Wie viele Wiederholungen hättest du noch geschafft?</div><div class="row wrap gap">${[0, 1, 2, 3, 4].map((r) => `<button class="chip ${st.rir === r ? 'on' : ''}" data-act="rir" data-s="${st.id}" data-v="${r}">${r === 4 ? '4+' : r}</button>`).join('')}</div>` : ''}
        <button class="btn ${st.done ? 'ghost' : 'pri'} block" style="margin-top:12px" data-act="${st.done ? 'undo' : 'doneSet'}" data-s="${st.id}">${st.done ? 'Wieder öffnen' : 'Satz abschließen'}</button></div>`).join('')}
      <div class="row gap" style="margin-bottom:10px"><button class="btn ghost sm" data-act="addSet" data-id="${se.id}">+ Satz</button>${se.sets.length > 1 && se.sets[se.sets.length - 1].done === false ? `<button class="btn ghost sm" data-act="rmSet" data-id="${se.id}">− Satz</button>` : ''}<div class="grow"></div>
        ${F.ui.tr.ei > 0 ? `<button class="btn sm" data-act="goEx" data-i="${F.ui.tr.ei - 1}">‹ Zurück</button>` : ''}${F.ui.tr.ei < exs.length - 1 ? `<button class="btn sm pri" data-act="goEx" data-i="${F.ui.tr.ei + 1}">Weiter ›</button>` : `<button class="btn sm pri" data-act="finishAsk">Fertig</button>`}</div>`;
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
    if (v === null) { v = fld === 'reps' ? (E.PROFILES[ex.dosage_profile]?.reps?.[0] ?? 8) : fld === 'seconds' ? 20 : 0; if (d > 0 && fld !== 'load_kg') { f.st[fld] = v; inp.value = v; return; } }
    v = Math.max(0, v + d * step); f.st[fld] = fld === 'load_kg' ? v : Math.round(v); inp.value = F.fmt(v);
  };
  F.acts.rir = (t) => { const f = findSet(t.dataset.s); if (!f) return; f.st.rir = f.st.rir === Number(t.dataset.v) ? null : Number(t.dataset.v); F.render(); };
  F.acts.doneSet = async (t) => {
    const f = findSet(t.dataset.s); if (!f) return; const st = f.st, ex = F.S.exById[f.se.exercise_id];
    const pf = E.PROFILES[ex.dosage_profile] || E.PROFILES.A;
    if (!noLoad(ex) && st.load_kg === null && pf.reps) { if (!confirm('Kein Gewicht eingetragen. Trotzdem abschließen? Das Gewicht bleibt dann „unbekannt“.')) return; }
    const r = await F.update('sets', st.id, { load_kg: st.load_kg, reps: st.reps ?? null, seconds: st.seconds ?? null, rir: st.rir ?? null, done: true, done_at: new Date().toISOString() });
    Object.assign(st, r);
    // nächsten offenen Satz vorbelegen (nie erfundene Werte: nur Kopie des gerade Eingegebenen)
    const nxt = f.se.sets.find((x) => !x.done);
    if (nxt) { const patch = {}; if (nxt.load_kg === null && st.load_kg !== null) patch.load_kg = st.load_kg; if (nxt.reps === null && st.reps !== null) patch.reps = st.reps; if (Object.keys(patch).length) { Object.assign(nxt, patch); F.update('sets', nxt.id, patch).catch(() => null); } }
    F.rest = { end: Date.now() + (E.params(F.S.params)[pf.rest] || 90) * 1000, total: E.params(F.S.params)[pf.rest] || 90 };
    F.pulseSet && F.pulseSet(st.id); F.render(); F.pulseSet && F.pulseSet(st.id); F.tick();
  };
  F.acts.undo = async (t) => { const f = findSet(t.dataset.s); const r = await F.update('sets', f.st.id, { done: false, done_at: null }); Object.assign(f.st, r); F.render(); };
  F.acts.addSet = async (t) => { const se = F.openSession().session_exercises.find((x) => x.id === t.dataset.id); const last = se.sets[se.sets.length - 1]; const r = await F.insert('sets', { session_exercise_id: se.id, set_no: (last ? last.set_no : 0) + 1, load_kg: last ? last.load_kg : null, load_per_hand: last ? last.load_per_hand : false }); se.sets.push(r); F.render(); };
  F.acts.rmSet = async (t) => { const se = F.openSession().session_exercises.find((x) => x.id === t.dataset.id); const last = se.sets[se.sets.length - 1]; if (last.done) return; await F.del('sets', last.id); se.sets.pop(); F.render(); };

  /* Pausentimer */
  F.restBar = () => { if (!F.rest || F.route()[0] !== 'training') return ''; const left = Math.max(0, Math.ceil((F.rest.end - Date.now()) / 1000)); return `<div class="rest" id="rest"><span>Pause <b id="rest-t">${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}</b></span><span class="row gap"><button class="btn sm" style="background:rgba(0,0,0,.15);color:inherit" data-act="restAdd">+30 s</button><button class="btn sm" style="background:rgba(0,0,0,.15);color:inherit" data-act="restStop">Überspringen</button></span></div>`; };
  F.tick = () => { clearInterval(F._tk); F._tk = setInterval(() => { if (!F.rest) return clearInterval(F._tk); const left = Math.ceil((F.rest.end - Date.now()) / 1000), el = document.getElementById('rest-t'); if (left <= 0) { F.rest = null; clearInterval(F._tk); try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch {} F.toast('Pause vorbei, weiter geht’s'); document.getElementById('rest')?.remove(); return; } if (el) el.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`; }, 500); };
  F.acts.restAdd = () => { if (F.rest) F.rest.end += 30000; };
  F.acts.restStop = () => { F.rest = null; document.getElementById('rest')?.remove(); };

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

  /* Beenden */
  F.acts.finishAsk = () => {
    const s = F.openSession(), mins = Math.max(1, Math.round((Date.now() - new Date(s.started_at).getTime()) / 60000)), n = s.session_exercises.reduce((a, e) => a + e.sets.filter((x) => x.done).length, 0);
    F.modal(`<div class="h2">Training beenden?</div><div class="kv" style="margin-bottom:14px"><span class="mute">Abgeschlossene Sätze</span><b>${n}</b><span class="mute">Dauer</span><b>${mins} min</b></div><label class="f"><span>Notiz (optional)</span><input id="f-n" type="text" placeholder="Wie war’s?"></label><button class="btn pri block" data-act="finish">Speichern und beenden</button><button class="btn danger block" style="margin-top:8px" data-act="discard">Verwerfen</button>`);
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
    F.rest = null; F.closeModal(); await F.load();
    if (F.celebrate) F.celebrate({ title: s.title || 'Training', sets, minutes: mins, volume: Math.round(vol), prs, week: s.kind === 'kraft' ? wk : 0 }); else F.go('heute');
  };
  F.acts.discard = async () => { if (!confirm('Dieses Training wirklich verwerfen? Eingetragene Sätze gehen verloren.')) return; await F.del('sessions', F.openSession().id); F.closeModal(); await F.load(); F.go('heute'); };

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
