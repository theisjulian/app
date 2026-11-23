/* forza · Therapieplan: feste Übungen an festen Wochentagen (z. B. vom Orthopäden), läuft im normalen Trainingsablauf.
   Gespeichert als eigener, nie aktiver Split mit Kennung in der Beschreibung (keine eigene Tabelle nötig). */
(function () {
  const F = window.F, E = F.E, esc = F.esc;
  const MARK = 'forza:therapie';
  const WDN = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  /* Vorlage: Rücken/Brustwirbelsäule nach dem Plan des Orthopädiezentrums (20.11.2026).
     Wo dort nur „1 × 1“ steht, sind die Werte ein Vorschlag von forza und frei anpassbar. */
  const TEMPLATE = {
    name: 'Therapieplan Rücken', mode: 'einstreuen', count: 3, pos: 'auto', weekdays: [1, 3, 5], rest: 30, source: 'Orthopädiezentrum, Plan vom 20.11.2026', review: '2027-01-08',
    items: [
      { name: 'Pallof Press', sets: 3, reps: 10, note: 'Band an der Türklinke oder am Kabel. Schultern unten lassen, Arme neutral nach vorn führen.' },
      { name: 'Unterarmstütz', sets: 3, secs: 30, note: 'Bauch anspannen und nach innen ziehen, Rücken leicht gerundet.' },
      { name: 'Ein Bein halten (Rückenlage)', sets: 3, reps: 12, note: 'Lendenwirbelsäule bleibt auf der Matte, Bewegung ruhig.' },
      { name: 'Dynamische 4 (Vierfüßler)', sets: 3, reps: 8, note: 'Langsam und kontrolliert, ohne Schwung.' },
      { name: 'Kinn-Einzug (Chin Tuck) im Stand an der Wand', sets: 2, reps: 10, note: 'Doppelkinn machen, je 5 Sekunden halten. Vorschlag: 2 × 10.', own: true },
      { name: 'Katze-Kuh (Cat-Camel)', sets: 1, reps: 10, note: 'Langsam im eigenen Rhythmus. Vorschlag: 1 × 10.', own: true },
      { name: 'Handgelenk-Dehnung (Beuger und Strecker)', sets: 2, secs: 30, note: 'Je Seite und Richtung etwa 30 Sekunden. Vorschlag: 2 × 30 s.', own: true },
      { name: 'Flexbar-Übungen (Unterarm)', sets: 2, reps: 15, note: 'Verdrehen, Biegen und Drücken des Flexbar wie gezeigt. Vorschlag: 2 × 15.', own: true }
    ]
  };
  /* Übungen, die im Katalog fehlen, legt forza beim Einrichten als deine eigenen an */
  const NEW_EX = {
    // Diese vier gibt es im Katalog bereits; nur falls nicht, legt forza sie an
    'Pallof Press': { muscles_primary: ['rumpf'], pattern: 'anti_rotation', equipment: ['band'], dosage_profile: 'C', load_convention: 'keine',
      content: { ausfuehrung: 'Seitlich zum Band oder Kabel stehen, Griff vor der Brust. Arme gerade nach vorn drücken, ohne dass sich der Rumpf mitdreht, langsam zurück.', fehler: 'Rumpf dreht mit, Schultern ziehen hoch.', hinweis: 'Aus deinem Therapieplan.' } },
    'Unterarmstütz': { muscles_primary: ['rumpf'], pattern: 'stuetz', equipment: ['matte'], dosage_profile: 'I', load_convention: 'zeit',
      content: { ausfuehrung: 'Unterarme und Fußspitzen am Boden, Körper bildet eine Linie. Bauch fest, Position halten.', fehler: 'Hüfte hängt durch oder ist zu hoch.', hinweis: 'Aus deinem Therapieplan.' } },
    'Kinn-Einzug (Chin Tuck) im Stand an der Wand': { muscles_primary: ['nacken'], pattern: 'mobilitaet_nacken', equipment: ['koerpergewicht'], dosage_profile: 'M', load_convention: 'keine',
      content: { ausfuehrung: 'Aufrecht stehen oder sitzen, Blick geradeaus. Das Kinn waagerecht nach hinten schieben (Doppelkinn), kurz halten, lösen.', fehler: 'Kopf nach unten nicken statt nach hinten schieben.', hinweis: 'Aus deinem Therapieplan.' } },
    'Katze-Kuh (Cat-Camel)': { muscles_primary: ['brustwirbelsaeule'], pattern: 'mobilitaet_bws', equipment: ['matte'], dosage_profile: 'M', load_convention: 'keine',
      content: { ausfuehrung: 'Vierfüßlerstand. Rücken langsam rund machen, Kopf sinkt, dann den Rücken sanft durchhängen lassen und den Blick heben. Im Atemrhythmus wechseln.', fehler: 'Ruckartig, in den Schmerz hinein.', hinweis: 'Aus deinem Therapieplan.' } },
    'Ein Bein halten (Rückenlage)': { muscles_primary: ['rumpf'], pattern: 'rumpf_stabil', equipment: ['matte'], dosage_profile: 'C', load_convention: 'keine',
      content: { ausfuehrung: 'Rückenlage, Arme vor der Brust verschränkt, Lendenwirbelsäule flach auf der Matte. Ein Bein angewinkelt anheben (Hüfte und Knie etwa 90 Grad), das andere gestreckt knapp über dem Boden halten, dann kontrolliert wechseln.', fehler: 'Hohlkreuz, Luft anhalten, Schwung aus den Beinen.', hinweis: 'Aus deinem Therapieplan.' } },
    'Dynamische 4 (Vierfüßler)': { muscles_primary: ['rumpf', 'ruecken_unten'], pattern: 'rumpf_dynamisch', equipment: ['matte'], dosage_profile: 'C', load_convention: 'keine',
      content: { ausfuehrung: 'Vierfüßlerstand, Rücken lang. Gegengleich einen Arm nach vorn und das andere Bein nach hinten strecken, zurück in den Vierfüßlerstand und das Gesäß Richtung Fersen schieben, Oberkörper sinkt ab. Seiten wechseln.', fehler: 'Hohlkreuz beim Strecken, Becken kippt zur Seite.', hinweis: 'Aus deinem Therapieplan.', perSide: true } },
    'Handgelenk-Dehnung (Beuger und Strecker)': { muscles_primary: ['unterarme'], pattern: 'dehnung_oberkoerper', equipment: ['koerpergewicht'], dosage_profile: 'M', load_convention: 'keine',
      content: { ausfuehrung: 'Arm gestreckt nach vorn, mit der anderen Hand die Finger sanft nach oben bzw. nach unten zurückziehen. Alternativ im Vierfüßlerstand die Handflächen mit den Fingern zum Körper aufsetzen.', fehler: 'Ruckartig ziehen, Schmerz statt Dehngefühl.', hinweis: 'Aus deinem Therapieplan.', secs: [30, 30], perSide: true } },
    'Flexbar-Übungen (Unterarm)': { muscles_primary: ['unterarme'], pattern: 'unterarme', equipment: ['flexbar'], dosage_profile: 'A', load_convention: 'keine',
      content: { ausfuehrung: 'Flexbar mit beiden Händen fassen: gegeneinander verdrehen (auswringen), zu einem U biegen, und einhändig auf dem Tisch drücken, wie gezeigt. Langsam zurück.', fehler: 'Handgelenke überstrecken, ruckartig arbeiten.', hinweis: 'Aus deinem Therapieplan.' } }
  };

  /* ---------- Plan lesen ---------- */
  F.therapy = () => { const sp = (F.S.splits || []).find((x) => x.user_id && x.description === MARK); if (!sp) return null; const p = (sp.days || [])[0] || {}; return Object.assign({ id: sp.id, active: true }, p); };
  // Therapie-Split nie als Trainings-Split verwenden oder in der Split-Liste zeigen
  const baseActive = F.activeSplit;
  F.activeSplit = () => { const s = baseActive(); return s && s.description === MARK ? (F.S.splits.find((x) => x.user_id && x.active && x.description !== MARK) || F.S.splits.find((x) => x.active && x.description !== MARK) || null) : s; };
  const exOf = (it) => F.S.exercises.find((e) => e.name === it.name) || null;
  const isTher = (se) => /^Therapieplan/.test((se && se.why) || '');
  F.therapyRest = (s, se) => { const p = F.therapy(); return p && (isTher(se) || (s && s.title === p.name)) ? p.rest || 30 : null; };
  // erledigt: Einheit abgeschlossen und mindestens ein Satz aus dem Plan gemacht, oder alle Plan-Sätze abgehakt
  const doneDates = () => { const p = F.therapy(), out = new Set(); if (!p) return out;
    for (const s of F.S.sessions) { const th = s.session_exercises.filter(isTher); if (!th.length) continue; const sets = th.flatMap((se) => se.sets);
      if ((s.status !== 'geplant' && sets.some((x) => x.done)) || (sets.length && sets.every((x) => x.done))) out.add(s.session_date); }
    return out; };
  F.therapyToday = () => { const p = F.therapy(); if (!p || !p.active) return null; const wd = F.dparse(F.today()).getDay(), open = F.openSession();
    return { p, due: (p.weekdays || []).includes(wd), done: doneDates().has(F.today()), running: !!(open && open.session_exercises.some(isTher)) }; };
  const weekCount = () => { const p = F.therapy(), d = F.dparse(F.today()), mon = F.addDays(F.today(), -((d.getDay() + 6) % 7)); let n = 0; for (const x of doneDates()) if (x >= mon) n++; return { n, of: (p.weekdays || []).length }; };
  const nextDay = (p) => { const wd = F.dparse(F.today()).getDay(); for (let k = 1; k <= 7; k++) { const w = (wd + k) % 7; if ((p.weekdays || []).includes(w)) return WDN[w]; } return ''; };
  const mins = (p) => Math.round(p.items.reduce((t, it) => t + it.sets * ((it.secs ? it.secs / 60 : (it.reps || 10) * 0.07) + (p.rest || 30) / 60) + 0.5, 0));

  /* ---------- Einrichten aus der Vorlage ---------- */
  F.acts.therapySetup = async () => {
    const tpl = JSON.parse(JSON.stringify(TEMPLATE));
    for (const it of tpl.items) if (!exOf(it)) {
      const nx = NEW_EX[it.name]; if (!nx) continue;
      await F.insert('exercises', Object.assign({ user_id: F.user.id, name: it.name, muscles_secondary: [], equipment_alt: [], tier: 'eigen' }, nx));
    }
    await F.insert('splits', { user_id: F.user.id, name: tpl.name, description: MARK, days: [tpl], active: false });
    await F.load(); F.render(); F.toast('Therapieplan eingerichtet');
  };
  const savePlan = async (p) => { const cur = F.S.splits.find((x) => x.id === p.id); const clean = Object.assign({}, p); delete clean.id; if (cur) cur.days = [clean]; await F.update('splits', p.id, { days: [clean], name: p.name }); };

  /* ---------- Einstreuen: bei jedem Training ein paar Plan-Übungen im Wechsel ----------
     Zuerst, was am längsten nicht dran war. Position automatisch: Dehnen und Mobilisieren an den Anfang, Kräftigen ans Ende. */
  const lastDone = () => { const m = {}; for (const s of F.S.sessions) for (const se of s.session_exercises) if (isTher(se) && se.sets.some((x) => x.done)) { if (!m[se.exercise_id] || s.session_date > m[se.exercise_id]) m[se.exercise_id] = s.session_date; } return m; };
  F.therapyPick = (p) => { const ld = lastDone(), n = Math.max(1, Math.min(p.items.length, p.count || 3));
    return p.items.map((it, i) => ({ it, ex: exOf(it), i })).filter((x) => x.ex).sort((a, b) => (ld[a.ex.id] || '') < (ld[b.ex.id] || '') ? -1 : (ld[a.ex.id] || '') > (ld[b.ex.id] || '') ? 1 : a.i - b.i).slice(0, n); };
  const atStart = (p, x) => p.pos === 'anfang' || (p.pos !== 'ende' && x.ex.dosage_profile === 'M');
  const insertPicked = async (s, list, p) => {
    if (!list.length) return;
    const minPos = Math.min(0, ...s.session_exercises.map((e) => e.position)), maxPos = Math.max(0, ...s.session_exercises.map((e) => e.position));
    const pre = list.filter((x) => atStart(p, x)), post = list.filter((x) => !atStart(p, x));
    const rowsSE = pre.map((x, i) => [x, minPos - pre.length + i]).concat(post.map((x, i) => [x, maxPos + 1 + i]));
    const ses = await F.sb.from('session_exercises').insert(rowsSE.map(([x, pos]) => ({ session_id: s.id, exercise_id: x.ex.id, position: pos, planned_sets: x.it.sets, planned_reps: x.it.secs ? x.it.secs + ' s' : String(x.it.reps), why: 'Therapieplan: ' + (x.it.note || '') }))).select();
    if (ses.error) throw ses.error;
    const rows = []; ses.data.forEach((se, i) => { for (let k = 1; k <= rowsSE[i][0].it.sets; k++) rows.push({ session_exercise_id: se.id, set_no: k }); });
    const sr = await F.sb.from('sets').insert(rows); if (sr.error) throw sr.error;
  };
  const baseStart = F.acts.start;
  F.acts.start = async (t, e) => {
    const had = F.openSession(); await baseStart(t, e);
    const p = F.therapy(), s = F.openSession();
    if (had || !p || !p.active || p.mode !== 'einstreuen' || !s || s.kind !== 'kraft' || s.session_exercises.some(isTher)) return;
    try { await insertPicked(s, F.therapyPick(p), p); await F.load(); F.ui.tr.ei = 0; F.render(); } catch (er) { F.err(er, 'Therapieplan'); }
  };

  F.therapyRows = (where) => { const p = F.therapy(); if (!p || !p.active || p.mode !== 'einstreuen') return '';
    const l = F.therapyPick(p).filter((x) => (where === 'vor') === atStart(p, x)); if (!l.length) return '';
    return l.map((x) => `<div class="exrow ther-row"><div class="exn">${F.icon.heute.replace('<svg', '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"')}</div><div class="grow"><b>${esc(x.it.name)}</b><span class="badge" style="margin-left:6px">Therapie</span><div class="mute small">${x.it.sets} × ${x.it.secs ? x.it.secs + ' s' : x.it.reps} · ${where === 'vor' ? 'vorher' : 'zum Schluss'}</div></div><button class="icbtn" data-act="help" data-id="${x.ex.id}" aria-label="Hilfe">${F.icon.info}</button></div>`).join(''); };

  /* ---------- Starten oder an ein laufendes Training anhängen ---------- */
  const addItems = async (sessId, startPos, p) => {
    const list = p.items.map((it) => ({ it, ex: exOf(it) })).filter((x) => x.ex);
    if (!list.length) throw new Error('Keine Übungen des Plans gefunden');
    const ses = await F.sb.from('session_exercises').insert(list.map((x, i) => ({ session_id: sessId, exercise_id: x.ex.id, position: startPos + i, planned_sets: x.it.sets, planned_reps: x.it.secs ? x.it.secs + ' s' : String(x.it.reps), why: 'Therapieplan: ' + (x.it.note || '') }))).select();
    if (ses.error) throw ses.error;
    const rows = []; ses.data.forEach((se, i) => { for (let n = 1; n <= list[i].it.sets; n++) rows.push({ session_exercise_id: se.id, set_no: n }); });
    const sr = await F.sb.from('sets').insert(rows); if (sr.error) throw sr.error;
  };
  F.acts.therapyStart = async () => {
    const p = F.therapy(); if (!p) return;
    const open = F.openSession(); if (open) return F.acts.therapyAppend();
    const sess = await F.insert('sessions', { session_date: F.today(), kind: 'sonstiges', title: p.name, status: 'geplant', source: 'manuell', planned_minutes: mins(p), equipment_profile_id: F.items().id, rule_version: E.RULE_VERSION, started_at: new Date().toISOString() });
    await addItems(sess.id, 0, p);
    F.ui.tr.ei = 0; F.ui.tr.skip = []; await F.load(); F.go('training');
  };
  F.acts.therapyAppend = async () => {
    const p = F.therapy(), s = F.openSession(); if (!p || !s) return;
    const at = s.session_exercises.length; await addItems(s.id, at, p);
    F.closeModal(); await F.load(); F.ui.tr.ei = at; F.go('training'); window.scrollTo(0, 0);
  };
  // Angebot am Ende eines Krafttrainings an Plantagen (statt des allgemeinen Haltungsblocks)
  F.therapyOffer = (s) => { const t = F.therapyToday(); if (!t || t.p.mode === 'einstreuen' || !t.due || t.done || !s || s.session_exercises.some(isTher)) return '';
    return `<button class="btn block ther-offer" style="margin-top:10px" data-act="therapyAppend">${esc(t.p.name)} anhängen · ca. ${mins(t.p)} min</button>`; };

  /* ---------- Karte auf „Heute“ ---------- */
  F.therapyCard = () => {
    // Noch kein Plan: einmal deutlich anbieten (lässt sich ausblenden)
    if (!F.therapy() && !F.ls.get('ther-hint-off', false)) return `<div class="card ther-card"><div class="eyebrow">Therapieplan</div><b>Übungen aus Physio oder Orthopädie</b><div class="small mute" style="margin:4px 0 12px">Einmal einrichten, dann streut forza sie im Wechsel in dein Training ein: Dehnen vorher, Kräftigen am Ende.</div><div class="row gap"><button class="btn pri grow" data-act="nav" data-r="mehr/therapie">Einrichten</button><button class="btn ghost" data-act="therapyHintOff">Später</button></div></div>`;
    const t = F.therapyToday(); if (!t) return '';
    if (t.p.mode === 'einstreuen') { if (t.running) return ''; const pk = F.therapyPick(t.p), pre = pk.filter((x) => atStart(t.p, x)), post = pk.filter((x) => !atStart(t.p, x));
      return `<div class="ther-line small mute"><span><b>Therapieplan im Training:</b> ${[pre.length ? 'vorher ' + pre.map((x) => esc(x.it.name.replace(/ \(.*\)$/, ''))).join(', ') : '', post.length ? 'danach ' + post.map((x) => esc(x.it.name.replace(/ \(.*\)$/, ''))).join(', ') : ''].filter(Boolean).join(' · ')}</span><button class="lnk" data-act="nav" data-r="mehr/therapie">Plan</button></div>`; }
    const w = weekCount(), dots = `<span class="ther-dots" aria-label="${w.n} von ${w.of} diese Woche">${Array.from({ length: w.of }, (_, i) => `<i class="${i < w.n ? 'on' : ''}"></i>`).join('')}</span>`;
    if (t.running) return ''; // läuft gerade: die Karte „Läuft gerade“ reicht
    if (t.done) return `<div class="card ther-card done"><div class="row between"><div><div class="eyebrow">Therapieplan</div><b>Heute erledigt</b></div>${dots}</div></div>`;
    if (!t.due) return `<div class="ther-line small mute"><span>Therapieplan: nächstes Mal ${nextDay(t.p)}</span>${dots}</div>`;
    return `<div class="card ther-card"><div class="row between" style="align-items:flex-start"><div><div class="eyebrow">Heute dran</div><b>${esc(t.p.name)}</b><div class="small mute">${t.p.items.length} Übungen · ca. ${mins(t.p)} min · Pause ${t.p.rest || 30} s</div></div>${dots}</div>
      <div class="row gap" style="margin-top:12px"><button class="btn pri grow" data-act="therapyStart">${F.openSession() ? 'An Training anhängen' : 'Starten'}</button><button class="btn ghost" data-act="nav" data-r="mehr/therapie">Plan</button></div></div>`;
  };

  /* ---------- Einstellungen: Plan ansehen und anpassen ---------- */
  const bk = '<button class="back" data-act="nav" data-r="mehr">' + F.icon.back.replace('<svg', '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"') + ' Einstellungen</button>';
  F.views.m_therapie = () => {
    const p = F.therapy();
    if (!p) return bk + `<div class="h1" style="margin-bottom:6px">Therapieplan</div><div class="card"><p style="margin-top:0">Feste Übungen an festen Tagen, zum Beispiel aus der Physiotherapie oder vom Orthopäden. forza erinnert dich an den Plantagen, führt dich im Fokus durch die Übungen und zählt das nicht als Krafttraining.</p>
      <div class="card flat" style="background:var(--card2)"><b>Vorlage: Rücken und Brustwirbelsäule</b><div class="small mute" style="margin:4px 0 8px">Nach deinem Plan vom 20.11.2026 · 8 Übungen · 3 davon in jedem Training, im Wechsel · 30 s Pause</div><div class="small">${TEMPLATE.items.map((it) => esc(it.name)).join(' · ')}</div></div>
      <button class="btn pri block" data-act="therapySetup">Plan übernehmen</button><div class="small mute" style="margin-top:8px">Wo im Plan nur „1 × 1“ steht, setzt forza einen Vorschlag ein. Du kannst alles danach anpassen.</div></div>`;
    const days = [1, 2, 3, 4, 5, 6, 0];
    return bk + `<div class="h1" style="margin-bottom:6px">${esc(p.name)}</div><p class="mute" style="margin-top:0">${esc(p.source || '')}${p.review ? ` · Kontrolltermin etwa ab ${F.dshort(p.review)}` : ''}</p>
      <div class="card"><div class="row between"><b>Aktiv</b><button class="sw ${p.active ? 'on' : ''}" role="switch" aria-checked="${!!p.active}" data-act="therapyToggle"><i></i></button></div>
        <div class="eyebrow" style="margin:14px 0 8px">Wie</div><div class="seg"><button class="${p.mode === 'einstreuen' ? 'on' : ''}" data-act="therapyMode" data-v="einstreuen">Im Training einstreuen</button><button class="${p.mode !== 'einstreuen' ? 'on' : ''}" data-act="therapyMode" data-v="einzeln">Eigene Einheit</button></div>
        ${p.mode === 'einstreuen' ? `<div class="small mute" style="margin-top:8px">Jedes Training bekommt ein paar Übungen aus dem Plan, im Wechsel: zuerst, was am längsten nicht dran war.</div>
        <div class="eyebrow" style="margin:14px 0 8px">Übungen pro Training</div><div class="row wrap gap">${[2, 3, 4, 5].map((n) => `<button class="chip ${(p.count || 3) === n ? 'on' : ''}" data-act="therapyCount" data-n="${n}">${n}</button>`).join('')}</div>
        <div class="eyebrow" style="margin:14px 0 8px">Wo</div><div class="row wrap gap">${[['auto', 'Automatisch'], ['anfang', 'Am Anfang'], ['ende', 'Am Ende']].map(([k, l]) => `<button class="chip ${(p.pos || 'auto') === k ? 'on' : ''}" data-act="therapyPos" data-v="${k}">${l}</button>`).join('')}</div>
        <div class="small mute" style="margin-top:6px">Automatisch: Dehnen und Mobilisieren vorher, Kräftigen am Ende.</div>
        <div class="small" style="margin-top:10px">Nächstes Training: ${F.therapyPick(p).map((x) => esc(x.it.name)).join(' · ')}</div>`
        : `<div class="eyebrow" style="margin:14px 0 8px">Tage</div><div class="row wrap gap">${days.map((d) => `<button class="chip ${(p.weekdays || []).includes(d) ? 'on' : ''}" data-act="therapyDay" data-d="${d}">${WDN[d]}</button>`).join('')}</div>`}
        <div class="eyebrow" style="margin:14px 0 8px">Pause zwischen den Sätzen</div><div class="row wrap gap">${[20, 30, 45, 60].map((r) => `<button class="chip ${(p.rest || 30) === r ? 'on' : ''}" data-act="therapyRest" data-r="${r}">${r} s</button>`).join('')}</div></div>
      <div class="card"><div class="eyebrow" style="margin-bottom:6px">Übungen</div>${p.items.map((it, i) => { const ex = exOf(it); return `<div class="ther-it"><div class="grow"><b>${esc(it.name)}</b>${it.note ? `<div class="small mute">${esc(it.note)}</div>` : ''}${ex ? `<button class="lnk small" data-act="help" data-id="${ex.id}">Anleitung</button>` : '<div class="small" style="color:var(--warn)">Übung fehlt im Katalog</div>'}</div>
        <div class="ther-dose"><div class="mini"><button data-act="therapyDose" data-i="${i}" data-k="sets" data-d="-1" aria-label="weniger Sätze">−</button><span>${it.sets}×</span><button data-act="therapyDose" data-i="${i}" data-k="sets" data-d="1" aria-label="mehr Sätze">+</button></div>
        <div class="mini"><button data-act="therapyDose" data-i="${i}" data-k="${it.secs ? 'secs' : 'reps'}" data-d="-1" aria-label="weniger">−</button><span>${it.secs ? it.secs + ' s' : it.reps}</span><button data-act="therapyDose" data-i="${i}" data-k="${it.secs ? 'secs' : 'reps'}" data-d="1" aria-label="mehr">+</button></div></div></div>`; }).join('')}</div>
      <button class="btn ${p.mode === 'einstreuen' ? '' : 'pri'} block" data-act="therapyStart">${p.mode === 'einstreuen' ? 'Alle Übungen jetzt als eigene Einheit' : 'Jetzt starten'}</button>
      <div class="small mute" style="margin-top:10px">Bei Schmerzen die Übung abbrechen und mit deiner Therapeutin oder deinem Arzt besprechen. forza ersetzt keine ärztliche Beratung.</div>`;
  };
  const edit = async (fn) => { const p = F.therapy(); fn(p); await savePlan(p); F.render(); };
  F.acts.therapyToggle = () => edit((p) => { p.active = !p.active; });
  F.acts.therapyDay = (t) => edit((p) => { const d = +t.dataset.d, w = p.weekdays || []; p.weekdays = w.includes(d) ? w.filter((x) => x !== d) : w.concat(d).sort(); });
  F.acts.therapyHintOff = () => { F.ls.set('ther-hint-off', true); F.render(); };
  F.acts.therapyMode = (t) => edit((p) => { p.mode = t.dataset.v; });
  F.acts.therapyCount = (t) => edit((p) => { p.count = +t.dataset.n; });
  F.acts.therapyPos = (t) => edit((p) => { p.pos = t.dataset.v; });
  F.acts.therapyRest = (t) => edit((p) => { p.rest = +t.dataset.r; });
  F.acts.therapyDose = (t) => edit((p) => { const it = p.items[+t.dataset.i], k = t.dataset.k, d = +t.dataset.d, step = k === 'secs' ? 5 : 1, min = k === 'sets' ? 1 : k === 'secs' ? 5 : 1; it[k] = Math.max(min, (it[k] || 0) + d * step); });

  /* Einstiege: Einstellungsliste und Split-Liste */
  const baseMehr = F.views.mehr;
  F.views.mehr = (args) => { const h = baseMehr(args); if (args && args[0]) return h; const p = F.therapy();
    const row = `<button class="it" data-act="nav" data-r="mehr/therapie"><div class="ico">${F.icon.heute}</div><div class="grow"><b>Therapieplan</b><div class="small mute">${p ? esc(p.name) + ' · ' + (p.mode === 'einstreuen' ? (p.count || 3) + ' pro Training' : (p.weekdays || []).map((d) => WDN[d]).join(', ')) : 'Übungen aus Physio oder Orthopädie'}</div></div>${F.icon.chev.replace('<svg', '<svg width="18" height="18" style="stroke:var(--mute);fill:none;stroke-width:2"')}</button>`;
    return h.replace(/(<button class="it" data-act="nav" data-r="mehr\/schwerpunkte">)/, row + '$1'); };
  const baseSplit = F.views.m_split;
  F.views.m_split = (a) => { const sv = F.S.splits; F.S.splits = sv.filter((x) => x.description !== MARK); try { return baseSplit(a); } finally { F.S.splits = sv; } };
})();
