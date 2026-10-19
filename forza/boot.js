/* forza · Start: Anmeldung prüfen, Erstbefüllung, Strava-Rückkehr, Service Worker */
(function () {
  const F = window.F;
  F.afterAuth = async () => {
    const { data } = await F.sb.auth.getSession(); F.user = data.session ? data.session.user : null;
    if (!F.user) { F.render(); return; }
    try {
      const pr = await F.sb.from('profiles').select('user_id').maybeSingle();
      if (!pr.data) await firstRun();
      await F.load();
      // Strava-Rückkehr
      const q = new URLSearchParams(location.search);
      if (q.get('code') && q.get('scope')) { const code = q.get('code'), scope = q.get('scope'); history.replaceState(null, '', location.pathname + '#/mehr/strava'); F.render(); try { await F.stravaExchange(code, scope); } catch (e) { F.err(e, 'Strava-Verbindung'); } }
      else if (q.get('error')) history.replaceState(null, '', location.pathname + '#/mehr/strava');
      else if (F.S.strava && F.S.strava.linked && F.S.strava.import_cursor && F.S.strava.import_cursor.done) F.stravaSync('recent').catch(() => null);
    } catch (e) { F.err(e, 'Laden'); }
    F.render();
  };
  async function firstRun() {
    const sb = F.sb, uid = F.user.id;
    const seed = await sb.rpc('seed_history'); if (seed.error) throw seed.error;
    const ex = await sb.from('exercises').select('equipment,equipment_alt').is('user_id', null);
    const items = new Set(); (ex.data || []).forEach((e) => [...e.equipment, ...e.equipment_alt].forEach((i) => i !== 'koerpergewicht' && items.add(i)));
    await sb.from('equipment_profiles').insert([{ name: 'Studio', kind: 'studio', items: [...items], is_default: true }, { name: 'Zuhause', kind: 'zuhause', items: [] }]);
    const tpl = await sb.from('splits').select('*').is('user_id', null).eq('name', 'Flexibler Mix (wie bisher)').maybeSingle();
    if (tpl.data) await sb.from('splits').insert({ user_id: uid, name: tpl.data.name, description: tpl.data.description, days: tpl.data.days, active: true });
    const today = F.today();
    await sb.from('priorities').insert(['quadrizeps', 'waden', 'ruecken_hoch', 'schulter_hinten', 'rotatoren'].map((m) => ({ muscle_group: m, level: 'schwerpunkt', valid_from: today })));
    await sb.from('profiles').upsert({ user_id: uid, display_name: 'Julian', sex: 'm', birth_year: 1993, height_cm: 176, goals: [] }, { onConflict: 'user_id' });
  }
  F.applyLook();
  (async () => {
    await F.afterAuth();
    F.sb.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_OUT') { F.user = null; F.render(); } });
    document.getElementById('boot')?.remove();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => null);
  })();
})();
