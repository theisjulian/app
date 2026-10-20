/* forza · Mehr: Plan & Split, Schwerpunkte, Geräte, Katalog, Profil, Strava, Regeln, Darstellung, Sicherung */
(function () {
  const F = window.F, E = F.E, esc = F.esc, L = E.LABEL;
  const ITEMS = { plyo_box: 'Plyo-Box (Sprungbox)', langhantel: 'Langhantel', rack: 'Rack', kurzhanteln: 'Kurzhanteln', kettlebell: 'Kettlebell', bank: 'Flachbank', schraegbank: 'Schrägbank', beinpresse: 'Beinpresse', beinbeuger_liegend: 'Beinbeuger liegend', beinbeuger_sitzend: 'Beinbeuger sitzend', wadenmaschine: 'Wadenmaschine stehend', wadenmaschine_sitzend: 'Wadenmaschine sitzend', kabelzug: 'Kabelzug', latzug: 'Latzug', ruderbank_maschine: 'Rudermaschine mit Bruststütze', brustpresse: 'Brustpresse', pec_deck: 'Pec Deck', klimmzugstange: 'Klimmzugstange', klimmzugstange_neutral: 'Klimmzugstange mit Parallelgriff', klimmzug_maschine: 'Klimmzug-Maschine', band: 'Flexband (sicherer Anker nötig)', stufe: 'Stufe / Step', matte: 'Matte', koerpergewicht: 'Körpergewicht', dip_station: 'Dip-Station', smith: 'Smith Machine', hyperextension: 'Rückenstrecker', abduktor_maschine: 'Abduktoren-Maschine', adduktor_maschine: 'Adduktoren-Maschine', leg_extension: 'Beinstrecker', schulterpresse: 'Schulterpresse', hackenschmidt: 'Hack Squat', trapbar: 'Trap-Bar', ez_stange: 'EZ-Stange', t_bar: 'T-Bar', ab_wheel: 'Ab-Wheel', scheibe: 'Hantelscheibe' };
  F.itemLabel = (k) => ITEMS[k] || k;
  F.allItems = () => { const s = new Set(); F.S.exercises.forEach((e) => [...e.equipment, ...e.equipment_alt].forEach((i) => i !== 'koerpergewicht' && s.add(i))); return [...s].sort((a, b) => F.itemLabel(a).localeCompare(F.itemLabel(b), 'de')); };
  const GOALS = ['Muskelaufbau', 'Kraft', 'Fettabbau', 'Gesundheit', 'Radfahren unterstützen', 'Rücken und Schulter', 'Gewicht halten'];
  const arrow = F.icon.chev.replace('<svg', '<svg width="18" height="18" style="stroke:var(--mute);fill:none;stroke-width:2"');
  const bk = '<button class="back" data-act="nav" data-r="mehr">' + F.icon.back.replace('<svg', '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"') + ' Einstellungen</button>';
  const sw = (on, act, extra = '') => `<button class="sw ${on ? 'on' : ''}" role="switch" aria-checked="${!!on}" data-act="${act}" ${extra}><i></i></button>`;

  F.views.mehr = ([sub, arg]) => {
    if (sub && F.views['m_' + sub]) return F.views['m_' + sub](arg);
    const sp = F.activeSplit(), st = F.S.strava;
    const row = (r, ic, t, s) => `<button class="it" data-act="nav" data-r="${r}"><div class="ico">${ic}</div><div class="grow"><b>${t}</b><div class="small mute">${s}</div></div>${arrow}</button>`;
    return `<div class="h1" style="margin-bottom:14px">Mehr</div><div class="card list">
      ${row('mehr/split', F.icon.kalender, 'Plan & Split', esc(sp ? sp.name : 'Noch kein Split gewählt'))}
      ${row('mehr/schwerpunkte', F.icon.fortschritt, 'Schwerpunkte', 'Was dir gerade wichtig ist')}
      ${row('mehr/geraete', F.icon.dumb, 'Geräte & Orte', F.S.equipment.map((p) => esc(p.name)).join(' · '))}
      ${row('katalog', F.icon.note, 'Übungskatalog', F.S.exercises.length + ' Übungen')}</div>
      <div class="card list">
      ${row('mehr/profil', F.icon.heute, 'Profil & Körperdaten', F.fmt(F.weightNow()) + ' kg')}
      ${row('mehr/strava', F.icon.bike, 'Aktivitäten (Strava)', st && st.linked ? 'verbunden' : 'nicht verbunden')}
      ${row('mehr/regeln', F.icon.info, 'Erweitert: Regeln', 'Reserve, Pausen, Lastschritte')}
      ${row('mehr/darstellung', F.icon.mehr, 'Darstellung', 'Farben, Schrift, Modus')}
      ${row('mehr/sicherung', F.icon.check, 'Sicherung & Export', 'Deine Daten gehören dir')}
      ${row('mehr/ueber', F.icon.info, 'Über diese App', 'theis')}</div>
      <button class="btn ghost block" data-act="logout">Abmelden</button>`;
  };

  /* ---------- Split ---------- */
  F.views.m_split = () => {
    const S = F.S, mine = S.splits.filter((s) => s.user_id), tpl = S.splits.filter((s) => !s.user_id);
    const card = (s, own) => `<div class="card"><div class="row between"><div><b>${esc(s.name)}</b>${s.active ? ' <span class="badge ok">aktiv</span>' : ''}<div class="small mute">${esc(s.description || '')}</div></div></div><div class="row wrap gap" style="margin:10px 0">${s.days.map((d) => `<span class="chip">${esc(d.name)}</span>`).join('')}</div><div class="row gap wrap">${own ? `${s.active ? '' : `<button class="btn sm pri" data-act="splitActivate" data-id="${s.id}">Aktivieren</button>`}<button class="btn sm" data-act="splitEdit" data-id="${s.id}">Bearbeiten</button><button class="btn sm danger" data-act="splitDel" data-id="${s.id}">Löschen</button>` : `<button class="btn sm pri" data-act="splitUse" data-id="${s.id}">Als meinen Split nutzen</button>`}</div></div>`;
    return bk + `<div class="h1" style="margin-bottom:6px">Plan & Split</div><p class="mute" style="margin-top:0">Der Split ist eine Vorlage, keine Vorschrift: forza wählt je nach Pausen, Radfahren und Schwerpunkten den passenden Tag. Du kannst alles ändern.</p>
      ${mine.length ? '<div class="eyebrow" style="margin:14px 0 8px">Meine Splits</div>' + mine.map((s) => card(s, true)).join('') : ''}
      <div class="eyebrow" style="margin:14px 0 8px">Vorlagen</div>${tpl.map((s) => card(s, false)).join('')}<button class="btn block" data-act="splitNew">+ Eigenen Split anlegen</button>`;
  };
  const deact = async () => { const r = await F.sb.from('splits').update({ active: false }).not('user_id', 'is', null); if (r.error) throw r.error; };
  F.acts.splitUse = async (t) => { const s = F.S.splits.find((x) => x.id === t.dataset.id); await deact(); await F.insert('splits', { user_id: F.user.id, name: s.name, description: s.description, days: s.days, active: true }); await F.refresh(); F.toast('Split aktiv'); };
  F.acts.splitActivate = async (t) => { await deact(); await F.update('splits', t.dataset.id, { active: true }); await F.refresh(); };
  F.acts.splitDel = async (t) => { if (!confirm('Diesen Split löschen?')) return; await F.del('splits', t.dataset.id); await F.refresh(); };
  F.acts.splitNew = async () => { const r = await F.insert('splits', { user_id: F.user.id, name: 'Mein Split', days: [{ name: 'Tag 1', focus: ['brust', 'lat'], minutes: 55 }], active: false }); await F.load(); F.go('mehr/splitedit/' + r.id); };
  F.acts.splitEdit = (t) => F.go('mehr/splitedit/' + t.dataset.id);
  F.views.m_splitedit = (id) => {
    const s = F.S.splits.find((x) => x.id === id); if (!s) return bk + '<div class="card">Nicht gefunden.</div>';
    return `<button class="back" data-act="nav" data-r="mehr/split">${F.icon.back.replace('<svg', '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"')} Splits</button><div class="h1" style="margin-bottom:12px">Split bearbeiten</div>
      <div class="card"><label class="f"><span>Name</span><input type="text" data-in="spName" data-id="${id}" value="${esc(s.name)}"></label>
      ${s.days.map((d, i) => `<div class="card flat" style="background:var(--bg2)"><div class="row gap"><input type="text" data-in="dayName" data-id="${id}" data-i="${i}" value="${esc(d.name)}" aria-label="Name des Trainingstags"><input type="number" style="width:90px" inputmode="numeric" data-in="dayMin" data-id="${id}" data-i="${i}" value="${d.minutes || ''}" aria-label="Minuten"><button class="mute" data-act="dayDel" data-id="${id}" data-i="${i}" aria-label="Tag löschen">✕</button></div><div class="row wrap gap" style="margin-top:10px">${F.MUSC.map((m) => `<button class="chip ${d.focus.includes(m) ? 'on' : ''}" data-act="dayFocus" data-id="${id}" data-i="${i}" data-m="${m}">${L[m]}</button>`).join('')}</div></div>`).join('')}
      <button class="btn block" data-act="dayAdd" data-id="${id}">+ Trainingstag</button></div>`;
  };
  const saveDays = async (id) => { const s = F.S.splits.find((x) => x.id === id); await F.update('splits', id, { days: s.days, name: s.name }); };
  F.ins.spName = async (t) => { const s = F.S.splits.find((x) => x.id === t.dataset.id); s.name = t.value; await saveDays(s.id); };
  F.ins.dayName = async (t) => { const s = F.S.splits.find((x) => x.id === t.dataset.id); s.days[+t.dataset.i].name = t.value || 'Tag'; await saveDays(s.id); };
  F.ins.dayMin = async (t) => { const s = F.S.splits.find((x) => x.id === t.dataset.id); s.days[+t.dataset.i].minutes = F.num(t.value) || 55; await saveDays(s.id); };
  F.acts.dayFocus = async (t) => { const s = F.S.splits.find((x) => x.id === t.dataset.id), d = s.days[+t.dataset.i], m = t.dataset.m; d.focus = d.focus.includes(m) ? d.focus.filter((x) => x !== m) : [...d.focus, m]; await saveDays(s.id); F.render(); };
  F.acts.dayAdd = async (t) => { const s = F.S.splits.find((x) => x.id === t.dataset.id); s.days.push({ name: 'Tag ' + (s.days.length + 1), focus: [], minutes: 55 }); await saveDays(s.id); F.render(); };
  F.acts.dayDel = async (t) => { const s = F.S.splits.find((x) => x.id === t.dataset.id); if (s.days.length < 2) return F.toast('Mindestens ein Tag.'); s.days.splice(+t.dataset.i, 1); await saveDays(s.id); F.render(); };

  /* ---------- Schwerpunkte ---------- */
  const PRESETS = { aktuell: { quadrizeps: 'schwerpunkt', waden: 'schwerpunkt', ruecken_hoch: 'schwerpunkt', schulter_hinten: 'schwerpunkt', rotatoren: 'schwerpunkt' }, ausgewogen: {}, oberkoerper: { brust: 'schwerpunkt', schulter_seitlich: 'schwerpunkt', lat: 'schwerpunkt', trizeps: 'schwerpunkt', bizeps: 'schwerpunkt' } };
  F.views.m_schwerpunkte = () => {
    const today = F.today();
    return bk + `<div class="h1" style="margin-bottom:6px">Schwerpunkte</div><p class="mute" style="margin-top:0">„Schwerpunkt“ bekommt mehr Sätze und kommt öfter dran, „Erhalt“ weniger. Änderungen gelten ab der nächsten Planung, bisherige Einheiten bleiben unverändert.</p>
      <div class="card row between"><div><b>Haltungsblock vor dem Training</b><div class="small mute">3 kurze Übungen für Brustwirbelsäule und Nacken, ca. 4 Minuten</div></div>${sw(E.params(F.S.params).posture_block, 'postureToggle')}</div><div class="row wrap gap" style="margin-bottom:12px"><button class="chip" data-act="prioPreset" data-p="aktuell">Beine & Rücken</button><button class="chip" data-act="prioPreset" data-p="ausgewogen">Ausgewogen</button><button class="chip" data-act="prioPreset" data-p="oberkoerper">Oberkörper</button></div>
      <div class="card">${F.MUSC.map((m) => { const lv = E.prioOf(F.S.priorities, m, today); return `<div class="row between" style="padding:9px 0;border-top:1px solid var(--line)"><span>${L[m]}</span><div class="seg">${[['schwerpunkt', 'Schwerpunkt'], ['normal', 'Normal'], ['erhalt', 'Erhalt']].map(([k, l]) => `<button class="${lv === k ? 'on' : ''}" style="padding:6px 9px;font-size:13px" data-act="prio" data-m="${m}" data-v="${k}">${l}</button>`).join('')}</div></div>`; }).join('')}</div>
      <div class="small mute">Der Bereich „Erhalt“ ist eine Produktregel von forza, keine Studienempfehlung.</div>`;
  };
  F.acts.postureToggle = async () => { const v = E.params(F.S.params).posture_block ? 0 : 1; const r = await F.sb.from('rule_params').upsert({ user_id: F.user.id, key: 'posture_block', value: v }, { onConflict: 'user_id,key' }); if (r.error) throw r.error; F.S.params.posture_block = v; F.render(); };
  const setPrio = async (m, v) => { const r = await F.sb.from('priorities').upsert({ user_id: F.user.id, muscle_group: m, level: v, valid_from: F.today() }, { onConflict: 'user_id,muscle_group,valid_from' }); if (r.error) throw r.error; };
  F.acts.prio = async (t) => { await setPrio(t.dataset.m, t.dataset.v); await F.refresh(); };
  F.acts.prioPreset = async (t) => { const p = PRESETS[t.dataset.p]; for (const m of F.MUSC) await setPrio(m, p[m] || 'normal'); await F.refresh(); F.toast('Übernommen'); };

  /* ---------- Geräte ---------- */
  const QUICK = { 'Nur Flexband': ['band'], 'Flexband + Klimmzugstange': ['band', 'klimmzugstange'], 'Kurzhanteln + Bank': ['kurzhanteln', 'bank', 'schraegbank'] };
  F.views.m_geraete = () => {
    const all = F.allItems();
    return bk + `<div class="h1" style="margin-bottom:6px">Geräte & Orte</div><p class="mute" style="margin-top:0">Wähle pro Ort, was vorhanden ist. Auf „Heute“ siehst du dann nur passende Vorschläge. Lücken zeigt forza ehrlich an.</p>
      ${F.S.equipment.map((p) => { const gaps = gapsFor(p.items); return `<div class="card"><div class="row between"><input type="text" style="max-width:60%" data-in="eqName" data-id="${p.id}" value="${esc(p.name)}" aria-label="Name"><div class="row gap">${p.is_default ? '<span class="badge ok">Standard</span>' : `<button class="btn sm" data-act="eqDefault" data-id="${p.id}">Standard</button>`}${F.S.equipment.length > 1 ? `<button class="mute" data-act="eqDel" data-id="${p.id}" aria-label="Löschen">✕</button>` : ''}</div></div>
        ${p.kind === 'zuhause' ? `<div class="row wrap gap" style="margin:12px 0 4px">${Object.keys(QUICK).map((k) => `<button class="chip" data-act="eqQuick" data-id="${p.id}" data-k="${esc(k)}">${esc(k)}</button>`).join('')}</div>` : ''}
        <div class="row wrap gap" style="margin-top:12px">${all.map((i) => `<button class="chip ${p.items.includes(i) ? 'on' : ''}" data-act="eqItem" data-id="${p.id}" data-i="${i}">${esc(F.itemLabel(i))}</button>`).join('')}</div>
        ${gaps.length ? `<div class="small" style="margin-top:12px;color:var(--warn)">Mit dieser Auswahl gibt es keine geprüfte Übung für: ${gaps.map((m) => L[m]).join(', ')}.</div>` : ''}</div>`; }).join('')}
      <button class="btn block" data-act="eqNew">+ Weiteren Ort anlegen</button>`;
  };
  function gapsFor(items) { const ctx = { items, userEx: F.S.userEx, painEx: new Set() }; return ['quadrizeps', 'hamstrings', 'gesaess', 'waden', 'brust', 'lat', 'ruecken_hoch', 'schulter_seitlich', 'schulter_hinten', 'rotatoren', 'rumpf'].filter((m) => !F.S.exercises.some((e) => e.muscles_primary.includes(m) && E.eligible(e, ctx))); }
  F.ins.eqName = async (t) => { await F.update('equipment_profiles', t.dataset.id, { name: t.value || 'Ort' }); await F.load(); };
  F.acts.eqItem = async (t) => { const p = F.S.equipment.find((x) => x.id === t.dataset.id), i = t.dataset.i; p.items = p.items.includes(i) ? p.items.filter((x) => x !== i) : [...p.items, i]; await F.update('equipment_profiles', p.id, { items: p.items }); F.render(); };
  F.acts.eqQuick = async (t) => { const p = F.S.equipment.find((x) => x.id === t.dataset.id); p.items = QUICK[t.dataset.k]; await F.update('equipment_profiles', p.id, { items: p.items }); F.render(); };
  F.acts.eqDefault = async (t) => { for (const p of F.S.equipment) await F.update('equipment_profiles', p.id, { is_default: p.id === t.dataset.id }); await F.refresh(); };
  F.acts.eqDel = async (t) => { if (!confirm('Diesen Ort löschen?')) return; await F.del('equipment_profiles', t.dataset.id); F.ls.set('place', null); await F.refresh(); };
  F.acts.eqNew = async () => { await F.insert('equipment_profiles', { name: 'Zuhause', kind: 'zuhause', items: [] }); await F.refresh(); };

  /* ---------- Katalog ---------- */
  F.ui.cat = { q: '', m: '', tier: '' };
  F.views.katalog = () => {
    const c = F.ui.cat, ctx = { items: F.items().items, userEx: F.S.userEx, painEx: new Set() };
    const list = F.S.exercises.filter((e) => (!c.q || e.name.toLowerCase().includes(c.q.toLowerCase())) && (!c.m || e.muscles_primary.includes(c.m)) && (!c.tier || (c.tier === 'avail' ? E.available(e, ctx.items).ok : e.tier === c.tier)));
    return bk + `<div class="row between" style="margin-bottom:12px"><div class="h1">Übungskatalog</div><button class="btn sm" data-act="exNew">+ Eigene</button></div>
      <input type="text" data-in="catQ" data-live="1" id="cq" placeholder="Suchen" value="${esc(c.q)}" style="margin-bottom:10px">
      <div class="row wrap gap" style="margin-bottom:12px"><select data-in="catM" style="width:auto"><option value="">Alle Muskeln</option>${F.MUSC.map((m) => `<option value="${m}" ${c.m === m ? 'selected' : ''}>${L[m]}</option>`).join('')}</select><select data-in="catT" style="width:auto"><option value="">Alle</option><option value="geprueft" ${c.tier === 'geprueft' ? 'selected' : ''}>Fachlich geprüft</option><option value="entwurf" ${c.tier === 'entwurf' ? 'selected' : ''}>Entwürfe</option><option value="eigen" ${c.tier === 'eigen' ? 'selected' : ''}>Eigene</option><option value="avail" ${c.tier === 'avail' ? 'selected' : ''}>Mit meinen Geräten</option></select></div>
      <div class="card list" id="catlist">${catRows(list)}</div>`;
  };
  const catRows = (list) => list.map((e) => { const u = F.S.userEx[e.id] || {}; return `<button class="it" data-act="help" data-id="${e.id}"><div class="grow"><b>${esc(e.name)}</b><div class="small mute">${e.muscles_primary.map((m) => L[m]).join(', ')}</div></div><span class="badge ${e.tier === 'geprueft' ? 'ok' : ''}">${e.tier === 'geprueft' ? 'geprüft' : u.released ? 'freigegeben' : e.tier === 'eigen' ? 'eigene' : 'Entwurf'}</span></button>`; }).join('') || '<div class="mute">Nichts gefunden.</div>';
  F.ins.catQ = (t) => { F.ui.cat.q = t.value; const c = F.ui.cat, ctx = { items: F.items().items }; const list = F.S.exercises.filter((e) => (!c.q || e.name.toLowerCase().includes(c.q.toLowerCase())) && (!c.m || e.muscles_primary.includes(c.m)) && (!c.tier || (c.tier === 'avail' ? E.available(e, ctx.items).ok : e.tier === c.tier))); document.getElementById('catlist').innerHTML = catRows(list); };
  F.ins.catM = (t) => { F.ui.cat.m = t.value; F.render(); }; F.ins.catT = (t) => { F.ui.cat.tier = t.value; F.render(); };
  F.acts.exNew = () => F.modal(`<div class="h2">Eigene Übung</div><label class="f"><span>Name</span><input id="x-n" type="text"></label><label class="f"><span>Hauptmuskel</span><select id="x-m">${F.MUSC.map((m) => `<option value="${m}">${L[m]}</option>`).join('')}</select></label><label class="f"><span>Gerät</span><select id="x-e">${F.allItems().map((i) => `<option value="${i}">${esc(F.itemLabel(i))}</option>`).join('')}<option value="koerpergewicht">Körpergewicht</option></select></label><label class="f"><span>Dosierung</span><select id="x-p"><option value="G">Grundbewegung (2 × 6–10)</option><option value="A" selected>Zusatzübung (2 × 10–15)</option><option value="S">Schulterkontrolle</option></select></label><label class="f"><span>Last</span><select id="x-l"><option value="gesamt">Gesamtgewicht</option><option value="je_hand">je Hand</option><option value="koerper">Körpergewicht</option></select></label><div class="small mute" style="margin-bottom:12px">Von dir angelegt, nicht von forza fachlich geprüft.</div><button class="btn pri block" data-act="exSave">Speichern</button>`);
  F.acts.exSave = async () => {
    const n = document.getElementById('x-n').value.trim(); if (!n) return F.toast('Bitte einen Namen eingeben.');
    const r = await F.insert('exercises', { user_id: F.user.id, name: n, muscles_primary: [document.getElementById('x-m').value], equipment: [document.getElementById('x-e').value], dosage_profile: document.getElementById('x-p').value, load_convention: document.getElementById('x-l').value, tier: 'eigen', content: { hinweis: 'Von dir angelegt.' } });
    await F.sb.from('user_exercise_settings').upsert({ user_id: F.user.id, exercise_id: r.id, released: true }, { onConflict: 'user_id,exercise_id' });
    F.closeModal(); await F.refresh(); F.toast('Angelegt und freigegeben');
  };

  /* ---------- Profil ---------- */
  F.views.m_profil = () => {
    const p = F.S.profile || {}, goals = p.goals || [];
    return bk + `<div class="h1" style="margin-bottom:12px">Profil & Körperdaten</div><div class="card">
      <label class="f"><span>Name</span><input type="text" id="p-n" value="${esc(p.display_name || '')}"></label>
      <div class="row gap"><label class="f grow"><span>Größe (cm)</span><input type="text" inputmode="decimal" id="p-h" value="${p.height_cm ? F.fmt(p.height_cm) : ''}"></label><label class="f grow"><span>Geburtsjahr</span><input type="number" id="p-y" value="${p.birth_year || ''}"></label></div>
      <label class="f"><span>Geschlecht</span><select id="p-s"><option value="m" ${p.sex === 'm' ? 'selected' : ''}>männlich</option><option value="w" ${p.sex === 'w' ? 'selected' : ''}>weiblich</option><option value="d" ${p.sex === 'd' ? 'selected' : ''}>divers</option></select></label>
      <div class="small mute" style="margin-bottom:6px">Ziele</div><div class="row wrap gap" style="margin-bottom:14px">${GOALS.map((g) => `<button class="chip ${goals.includes(g) ? 'on' : ''}" data-act="goal" data-g="${esc(g)}">${g}</button>`).join('')}</div>
      <button class="btn pri block" data-act="profSave">Speichern</button></div>
      <div class="card"><div class="row between"><div><b>Körpergewicht</b><div class="small mute">${F.fmt(F.weightNow())} kg · mit Datum gespeichert</div></div><button class="btn sm" data-act="addWeight">Neu eintragen</button></div></div>`;
  };
  F.acts.goal = async (t) => { const p = F.S.profile || {}, g = t.dataset.g; const goals = (p.goals || []).includes(g) ? p.goals.filter((x) => x !== g) : [...(p.goals || []), g]; const r = await F.sb.from('profiles').upsert({ user_id: F.user.id, goals }, { onConflict: 'user_id' }); if (r.error) throw r.error; await F.refresh(); };
  F.acts.profSave = async () => {
    const r = await F.sb.from('profiles').upsert({ user_id: F.user.id, display_name: document.getElementById('p-n').value || null, height_cm: F.num(document.getElementById('p-h').value), birth_year: F.num(document.getElementById('p-y').value), sex: document.getElementById('p-s').value }, { onConflict: 'user_id' }); if (r.error) throw r.error;
    await F.refresh(); F.toast('Gespeichert');
  };

  /* ---------- Strava ---------- */
  F.views.m_strava = () => {
    const st = F.S.strava || {}, n = F.S.activities.length;
    return bk + `<div class="h1" style="margin-bottom:12px">Aktivitäten</div><div class="card"><div class="row between"><div><b>${st.linked ? 'Verbunden' : 'Nicht verbunden'}</b><div class="small mute">${n} Aktivitäten gespeichert${st.last_sync_at ? ' · zuletzt ' + new Date(st.last_sync_at).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }) : ''}</div></div></div>
      <div id="sv-prog" class="small mute" style="margin:10px 0"></div>
      <div class="row wrap gap">${st.linked ? `<button class="btn pri sm" data-act="stravaSync">Jetzt abgleichen</button><button class="btn sm" data-act="stravaSub">Live-Abgleich einschalten</button><button class="btn sm danger" data-act="stravaOff">Trennen</button>` : `<button class="btn pri" data-act="stravaConnect">Mit Strava verbinden</button>`}</div></div>
      <div class="card small mute">forza liest deine Aktivitäten (Lesezugriff) und speichert sie dauerhaft nur in deiner eigenen Datenbank. Sie werden nur dir angezeigt. Wenn du bei Strava eine Aktivität löschst oder den Zugriff widerrufst, wird sie auch hier entfernt. Kalorien sind immer Schätzungen und mit der Methode beschriftet.</div>`;
  };
  F.acts.stravaConnect = () => { const u = new URL('https://www.strava.com/oauth/authorize'); u.search = new URLSearchParams({ client_id: F.C.stravaClientId, redirect_uri: F.C.stravaRedirect, response_type: 'code', approval_prompt: 'auto', scope: 'read,activity:read_all' }); location.href = u.toString(); };
  const call = async (body) => { const r = await F.sb.functions.invoke('strava', { body }); if (r.error) { let m = r.error.message; try { const j = await r.error.context.json(); m = j.error || m; } catch {} throw new Error(m); } return r.data; };
  F.stravaExchange = async (code, scope) => { await call({ action: 'exchange', code, scope }); F.toast('Strava verbunden. Der Import startet.'); await F.stravaSync('import'); };
  F.stravaSync = async (mode) => {
    mode = typeof mode === 'string' ? mode : (F.S.strava && F.S.strava.import_cursor && F.S.strava.import_cursor.done ? 'recent' : 'import');
    const el = () => document.getElementById('sv-prog'); let guard = 0, total = 0;
    for (;;) {
      const r = await call({ action: 'sync', mode }); total += r.imported;
      if (el()) el().textContent = `Import läuft … ${total} Aktivitäten, ${r.remaining_details} Details offen`;
      if (r.done || mode === 'recent' && r.list_done && r.remaining_details === 0) break;
      if (r.paused) { F.toast('Strava-Limit erreicht. Der Rest folgt beim nächsten Abgleich.', 5000); break; }
      if (++guard > 80) break; await new Promise((s) => setTimeout(s, 800));
    }
    await F.refresh(); F.toast('Abgleich fertig');
  };
  F.acts.stravaSync = () => F.stravaSync();
  F.acts.stravaSub = async () => { const r = await call({ action: 'subscribe' }); F.toast(r.status === 201 || r.status === 200 ? 'Live-Abgleich ist aktiv' : 'Strava-Antwort: ' + r.body.slice(0, 80), 5000); };
  F.acts.stravaOff = () => F.modal(`<div class="h2">Strava trennen</div><p>Die Verbindung wird bei Strava widerrufen.</p><button class="btn block" data-act="stravaOffGo" data-p="">Trennen, Aktivitäten behalten</button><button class="btn danger block" style="margin-top:8px" data-act="stravaOffGo" data-p="1">Trennen und Strava-Aktivitäten löschen</button>`);
  F.acts.stravaOffGo = async (t) => { await call({ action: 'disconnect', purge: !!t.dataset.p }); F.closeModal(); await F.refresh(); };

  /* ---------- Regeln ---------- */
  const RP = [['corridor_min', 'Wochenziel Sätze, Minimum', 1], ['corridor_max', 'Wochenziel Sätze, Maximum', 1], ['calm_reserve_add', 'Ruhigere Tagesform: zusätzliche Reserve', 1], ['calm_sets_minus', 'Ruhigere Tagesform: Sätze weniger (bei 3+)', 1], ['pause_reentry_days', 'Vorsichtiger Wiedereinstieg nach Tagen Pause', 1], ['reentry_load_factor', 'Wiedereinstieg: Lastfaktor (1 = aus, 0,9 = −10 %)', 0.05], ['leg_after_ride_hours', 'Beine zurückhalten nach langer Fahrt (Stunden)', 1], ['load_step_total', 'Lastschritt Gesamtgewicht (kg)', 0.5], ['load_step_hand', 'Lastschritt je Hand (kg)', 0.5], ['default_minutes', 'Standard-Trainingsdauer (min)', 5], ['rest_g', 'Pause Grundbewegung (s)', 15], ['rest_a', 'Pause Zusatzübung (s)', 15]];
  const DOSE = [['G', 'Grundbewegungen'], ['A', 'Zusatzübungen'], ['S', 'Schulterkontrolle']];
  F.views.m_regeln = () => { const P = E.params(F.S.params); const goals = (F.S.profile && F.S.profile.goals) || []; return bk + `<div class="h1" style="margin-bottom:6px">Erweitert: Regeln</div><p class="mute" style="margin-top:0">Hier stellst du die Parameter des Regelwerks ein. Die Standardwerte stammen aus deiner Projektdatei. Regelversion: ${E.RULE_VERSION}.</p><div class="card">${RP.map(([k, l, s]) => `<label class="f"><span>${l}</span><input type="text" inputmode="decimal" data-in="rule" data-k="${k}" value="${F.fmt(P[k])}"></label>`).join('')}<button class="btn ghost block" data-act="ruleReset">Auf Standard zurücksetzen</button></div>
    <div class="card"><div class="h2">Sätze und Wiederholungen</div><p class="small mute" style="margin-top:0">Leer lassen = Vorschlag von forza. Eigene Werte gelten für alle Vorschläge dieser Übungsart. Im Training kannst du jederzeit abweichen.</p>${DOSE.map(([k, n]) => `<div class="eyebrow" style="margin:10px 0 4px">${n}</div><div class="row gap"><label class="f grow"><span>Sätze</span><input type="text" inputmode="numeric" placeholder="${E.PROFILES[k].sets}" data-in="dose" data-k="dose_${k}_sets" value="${F.S.params['dose_' + k + '_sets'] || ''}"></label><label class="f grow"><span>Wdh. von</span><input type="text" inputmode="numeric" placeholder="${E.PROFILES[k].reps[0]}" data-in="dose" data-k="dose_${k}_lo" value="${F.S.params['dose_' + k + '_lo'] || ''}"></label><label class="f grow"><span>bis</span><input type="text" inputmode="numeric" placeholder="${E.PROFILES[k].reps[1]}" data-in="dose" data-k="dose_${k}_hi" value="${F.S.params['dose_' + k + '_hi'] || ''}"></label></div>`).join('')}</div>
    <div class="card"><div class="h2">Woher kommen die Vorschläge?</div><div class="small">
      <p style="margin-top:0"><b>Grundlage:</b> deine Projektdatei (Dosierungsprofile) und das Positionspapier des American College of Sports Medicine (2009) zur Progression im Krafttraining: Wiederholungsbereiche und Satzzahlen für Gesunde mit Trainingserfahrung.</p>
      <p><b>Muskelaufbau:</b> Muskelzuwachs ist über einen weiten Wiederholungsbereich möglich, solange die Sätze nah genug an die Erschöpfung kommen. Deshalb 6–10 bei Grundübungen und 10–15 bei Zusatzübungen, mit 1–3 Wiederholungen Reserve und 6–10 Sätzen je Muskelgruppe pro Woche.</p>
      <p><b>Kraft:</b> Schwere Lasten bringen bei gleichem Volumen etwas mehr Maximalkraft, mittlere Lasten etwas mehr Muskelzuwachs (Schoenfeld et al., randomisierte Studie, J Sports Sci Med). Mit Ziel Kraft bekommen Schwerpunkt-Grundübungen 3 × 4–6 und längere Pausen.</p>
      <p><b>Fettabbau:</b> Krafttraining bleibt im Kaloriendefizit wichtig, damit Muskeln erhalten bleiben. Der Energieumsatz einer Einheit ist klein, entscheidend ist die Bilanz. Eine Übersichtsarbeit an Trainierten (15 Studien) fand keine ausreichende Evidenz, dass im Defizit mehr Volumen mehr Muskeln erhält. forza kürzt deshalb weder Last noch Sätze, empfiehlt aber auch nicht mehr.</p>
      <p><b>Kombinierte Ziele:</b> Mehrere Ziele ändern die Vorschläge nur dort, wo es eine klare Regel gibt (Kraft → Schwerpunkt-Grundübungen, siehe oben). Sonst gilt die allgemeine Dosierung.</p>
      <p style="margin-bottom:0"><b>Haltungsblock:</b> Die Studienlage dazu, ob Übungen die Kopfhaltung messbar verbessern, ist uneinheitlich. Training der tiefen Nackenbeuger ist bei Nackenschmerz gut untersucht. Mobilisation der Brustwirbelsäule verbessert kurzfristig die Beweglichkeit. forza verspricht keine Haltungskorrektur.</p></div></div>`; };
  F.ins.rule = async (t) => { const v = F.num(t.value); if (v === null || v < 0) return F.toast('Bitte eine Zahl eingeben.'); const r = await F.sb.from('rule_params').upsert({ user_id: F.user.id, key: t.dataset.k, value: v }, { onConflict: 'user_id,key' }); if (r.error) throw r.error; F.S.params[t.dataset.k] = v; F.toast('Gespeichert'); };
  F.ins.dose = async (t) => { const v = F.num(t.value); const r = v === null || v <= 0 ? await F.sb.from('rule_params').delete().eq('user_id', F.user.id).eq('key', t.dataset.k) : await F.sb.from('rule_params').upsert({ user_id: F.user.id, key: t.dataset.k, value: Math.round(v) }, { onConflict: 'user_id,key' }); if (r.error) throw r.error; if (v === null || v <= 0) delete F.S.params[t.dataset.k]; else F.S.params[t.dataset.k] = Math.round(v); F.toast('Gespeichert'); };
  F.acts.ruleReset = async () => { const r = await F.sb.from('rule_params').delete().eq('user_id', F.user.id); if (r.error) throw r.error; await F.refresh(); };

  /* ---------- Darstellung ---------- */
  F.views.m_darstellung = () => {
    const l = F.look();
    const T = [['graphit', 'Graphit', '#c8f542'], ['laguna', 'Laguna', '#2cc4d0'], ['klar', 'Klar', '#7db1ff'], ['neon', 'Neon', '#ff6fd8']];
    const FN = [['standard', 'Standard', 'Geist'], ['rund', 'Rund', 'Nunito'], ['klassisch', 'Klassisch', 'Lora'], ['technisch', 'Technisch', 'Space Grotesk'], ['lesbar', 'Gut lesbar', 'Atkinson Hyperlegible'], ['geometrisch', 'Geometrisch', 'Jost']];
    return bk + `<div class="h1" style="margin-bottom:12px">Darstellung</div>
      <div class="card"><div class="eyebrow" style="margin-bottom:8px">Farbe</div><div class="row wrap gap">${T.map(([k, n, c]) => `<button class="chip ${l.theme === k ? 'on' : ''}" data-act="look" data-k="theme" data-v="${k}"><i style="width:14px;height:14px;border-radius:50%;background:${c};display:inline-block"></i>${n}</button>`).join('')}</div>
      <div class="eyebrow" style="margin:16px 0 8px">Modus</div><div class="seg">${[['hell', 'Hell', 'light'], ['dunkel', 'Dunkel', 'dark'], ['auto', 'Automatisch', 'auto']].map(([k, n, v]) => `<button class="${l.mode === v ? 'on' : ''}" data-act="look" data-k="mode" data-v="${v}">${n}</button>`).join('')}</div></div>
      <div class="card"><div class="eyebrow" style="margin-bottom:8px">Schrift</div><div class="row wrap gap">${FN.map(([k, n, f]) => `<button class="fbtn ${l.font === k ? 'on' : ''}" style="font-family:'${f}',sans-serif" data-act="look" data-k="font" data-v="${k}">${n}</button>`).join('')}</div></div>
      <div class="card row between"><div><b>Animationen</b><div class="small mute">Weiche Übergänge und Bewegungsskizzen</div></div>${sw(l.anim, 'lookAnim')}</div>`;
  };
  F.acts.look = (t) => { F.setLook(t.dataset.k, t.dataset.v); F.render(); };
  F.acts.lookAnim = () => { F.setLook('anim', !F.look().anim); F.render(); };

  /* ---------- Sicherung ---------- */
  F.views.m_sicherung = () => bk + `<div class="h1" style="margin-bottom:12px">Sicherung & Export</div>
    <div class="card"><b>Alle Daten als Datei</b><div class="small mute" style="margin:4px 0 12px">Eine JSON-Datei mit Einheiten, Sätzen, Plänen, Einstellungen und Aktivitäten. Strava-Zugangsdaten sind nicht enthalten.</div><button class="btn pri" data-act="exportAll">Exportieren</button></div>
    <div class="card"><b>Nächtliche Sicherung</b><div class="small mute" style="margin-top:4px">Läuft automatisch über GitHub (verschlüsselt, 30 Tage plus eine je Monat). Fehlschläge meldet GitHub per E-Mail.</div></div>
    <div class="card"><div class="row between"><div><b>Änderungsprotokoll</b><div class="small mute">Jede Änderung und Löschung bleibt nachvollziehbar.</div></div><button class="btn sm" data-act="auditShow">Anzeigen</button></div><div id="audit"></div></div>`;
  F.acts.exportAll = async () => {
    const tabs = ['profiles', 'body_weights', 'priorities', 'equipment_profiles', 'rule_params', 'sessions', 'session_exercises', 'sets', 'absences', 'suggestions', 'activities', 'splits', 'user_exercise_settings'];
    const out = { app: 'forza', exported_at: new Date().toISOString(), rule_version: E.RULE_VERSION };
    for (const t of tabs) { let all = [], from = 0; for (;;) { const r = await F.sb.from(t).select('*').range(from, from + 999); if (r.error) throw r.error; all = all.concat(r.data); if (r.data.length < 1000) break; from += 1000; } out[t] = all; }
    const own = await F.sb.from('exercises').select('*').not('user_id', 'is', null); out.exercises_own = own.data || [];
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' })); a.download = `forza-sicherung-${F.today()}.json`; a.click(); F.toast('Export erstellt');
  };
  F.acts.auditShow = async () => { const r = await F.sb.from('audit_log').select('*').order('at', { ascending: false }).limit(40); document.getElementById('audit').innerHTML = (r.data || []).map((x) => `<div class="small" style="padding:6px 0;border-top:1px solid var(--line)">${new Date(x.at).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })} · ${{ INSERT: 'angelegt', UPDATE: 'geändert', DELETE: 'gelöscht' }[x.op]} · ${esc(x.table_name)}</div>`).join('') || '<div class="mute small">Noch leer.</div>'; };

  /* ---------- Über ---------- */
  F.views.m_ueber = () => bk + `<div class="h1" style="margin-bottom:12px">Über diese App</div><div class="card" style="text-align:center"><img src="assets/forza.svg" width="84" height="84" style="border-radius:22px" alt=""><div class="h1" style="margin-top:10px">forza</div><div class="mute">Training, das sich an dich anpasst.</div>
    <div style="margin:22px auto 10px;width:150px;color:var(--text)"><svg class="theis-wm" role="img" aria-label="theis" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 228.1 71.9"><g transform="translate(0,71.86)"><path transform="translate(0.00,0) scale(0.1,-0.1)" fill="currentColor" d="M283.6005859375 0Q204.0001220703125 0 166.49993896484375 36.80023193359375Q128.999755859375 73.6004638671875 128.999755859375 152.801025390625V659.2003173828125H257.00244140625V165.20166015625Q257.00244140625 127.6015625 273.20245361328125 113.40155029296875Q289.4024658203125 99.2015380859375 322.802490234375 99.2015380859375H398.00244140625V0ZM45.3994140625 434.7987060546875V534.000244140625H398.00244140625V434.7987060546875Z"/><path transform="translate(38.70,0) scale(0.1,-0.1)" fill="currentColor" d="M70.3994140625 0V710H198.402099609375V411.7999267578125L182.001708984375 412.1998291015625Q190.401611328125 458.199951171875 214.20159912109375 487.60003662109375Q238.0015869140625 517.0001220703125 273.20159912109375 531.5001831054688Q308.401611328125 546.000244140625 350.401611328125 546.000244140625Q409.4017333984375 546.000244140625 449.50177001953125 520.3002319335938Q489.601806640625 494.6002197265625 510.101806640625 448.7001953125Q530.601806640625 402.8001708984375 530.601806640625 343.400146484375V0H402.59912109375V311.7996826171875Q402.59912109375 377.198974609375 380.89947509765625 409.59869384765625Q359.1998291015625 441.9984130859375 311.600341796875 441.9984130859375Q259.60107421875 441.9984130859375 229.0015869140625 408.19873046875Q198.402099609375 374.3990478515625 198.402099609375 308.799560546875V0Z"/><path transform="translate(94.80,0) scale(0.1,-0.1)" fill="currentColor" d="M300.600830078125 -12Q220.800537109375 -12 162.10028076171875 22.4000244140625Q103.4000244140625 56.800048828125 71.29986572265625 119.7000732421875Q39.19970703125 182.60009765625 39.19970703125 267.0001220703125Q39.19970703125 351.400146484375 71.29986572265625 413.8001708984375Q103.4000244140625 476.2001953125 161.50030517578125 511.1002197265625Q219.6005859375 546.000244140625 298.200927734375 546.000244140625Q374.4013671875 546.000244140625 431.60162353515625 511.900146484375Q488.8018798828125 477.800048828125 520.1019897460938 413.7999267578125Q551.402099609375 349.7998046875 551.402099609375 259.999755859375V231.3995361328125H172.00244140625Q175.8023681640625 160.8004150390625 210.302001953125 125.60089111328125Q244.8016357421875 90.4013671875 302.200927734375 90.4013671875Q345.0003662109375 90.4013671875 373.300048828125 109.50103759765625Q401.5997314453125 128.6007080078125 412.9996337890625 163.8004150390625L543.8021240234375 155.600341796875Q522.402099609375 78.199951171875 457.70172119140625 33.0999755859375Q393.0013427734375 -12 300.600830078125 -12ZM172.00244140625 317.4002685546875H418.599609375Q414.5997314453125 382.3995361328125 381.90008544921875 413.79925537109375Q349.200439453125 445.198974609375 298.200927734375 445.198974609375Q246.801513671875 445.198974609375 213.3018798828125 412.29925537109375Q179.80224609375 379.3995361328125 172.00244140625 317.4002685546875Z"/><path transform="translate(149.90,0) scale(0.1,-0.1)" fill="currentColor" d="M70.3994140625 0V534.000244140625H198.402099609375V0Z"/><path transform="translate(149.90,0) scale(0.1,-0.1)" class="dot" fill="#2F5BEA" d="M67.9993896484375 605.3995361328125V718.6004638671875H200.8021240234375V605.3995361328125Z"/><path transform="translate(172.80,0) scale(0.1,-0.1)" fill="currentColor" d="M287.40087890625 -12Q205.600341796875 -12 152.10009765625 11.20001220703125Q98.599853515625 34.4000244140625 70.8997802734375 75.10003662109375Q43.19970703125 115.800048828125 39.19970703125 168.2000732421875L170.0023193359375 173.800048828125Q177.2022705078125 132.200439453125 203.9019775390625 108.9007568359375Q230.6016845703125 85.60107421875 287.8009033203125 85.60107421875Q332.600341796875 85.60107421875 356.5 100.3009033203125Q380.399658203125 115.000732421875 380.399658203125 146.000244140625Q380.399658203125 164.2000732421875 371.89971923828125 176.199951171875Q363.3997802734375 188.1998291015625 338.79998779296875 197.29974365234375Q314.2001953125 206.399658203125 266.6005859375 214.799560546875Q185.8001708984375 229.1995849609375 139.99993896484375 249.799560546875Q94.19970703125 270.3995361328125 75.599609375 301.39959716796875Q56.99951171875 332.399658203125 56.99951171875 377.599853515625Q56.99951171875 452.60009765625 114.49981689453125 499.3001708984375Q172.0001220703125 546.000244140625 283.2010498046875 546.000244140625Q360.4014892578125 546.000244140625 409.7017822265625 521.7002563476562Q459.0020751953125 497.4002685546875 484.4022216796875 456.60015869140625Q509.8023681640625 415.800048828125 514.0023193359375 366.399658203125L384.3997802734375 360.399658203125Q383.1998291015625 385.399658203125 371.99993896484375 405.3995361328125Q360.800048828125 425.3994140625 338.80029296875 436.8992919921875Q316.800537109375 448.399169921875 281.2010498046875 448.399169921875Q235.8017578125 448.399169921875 212.60198974609375 430.19940185546875Q189.4022216796875 411.9996337890625 189.4022216796875 382.39990234375Q189.4022216796875 360.8001708984375 198.7021484375 346.90032958984375Q208.0020751953125 333.00048828125 231.10186767578125 324.30059814453125Q254.20166015625 315.6007080078125 293.80126953125 309.2008056640625Q376.2015380859375 297.0008544921875 424.2017822265625 276.2008056640625Q472.2020263671875 255.4007568359375 492.502197265625 223.900634765625Q512.8023681640625 192.4005126953125 512.8023681640625 147.600341796875Q512.8023681640625 71.0001220703125 451.5020751953125 29.50006103515625Q390.2017822265625 -12 287.40087890625 -12Z"/></g></svg></div><div class="small mute">© 2026</div></div>
    <div class="card small mute">Vorschläge entstehen nach festen, nachvollziehbaren Regeln (Version ${E.RULE_VERSION}), nicht durch KI. Sie ersetzen keine ärztliche oder therapeutische Beratung. Kalorienwerte sind Schätzungen. Aktivitätsdaten stammen von Strava und werden nur dir angezeigt.</div>`;
})();
