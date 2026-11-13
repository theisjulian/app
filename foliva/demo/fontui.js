/* Foliva – Schriftauswahl wie in einer Textverarbeitung · © 2026 theis
   Mitgelieferte Schriften oben, dann zuletzt verwendete, dann alle auf diesem Computer installierten Schriftfamilien.
   Installierte Schriften werden nur benutzt, nicht mitgeliefert oder weitergegeben. */
'use strict';
const FontUI = (() => {
  let LOCAL = null;        /* Map Familie → [Stile] */
  const NATIVE_ONLY = new Set();   /* nur in den Schriftordnern gefunden – evtl. erst nach Neustart nutzbar */
  let loading = null;
  const RECENT_KEY = 'foliva-recent-fonts';
  const recent = () => { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').filter(Boolean).slice(0, 8); } catch (e) { return []; } };
  const addRecent = k => { if (!k) return; try { const r = [k, ...recent().filter(x => x !== k)].slice(0, 8); localStorage.setItem(RECENT_KEY, JSON.stringify(r)); } catch (e) {} };

  /* Liste der installierten Schriften über die Plattform (Local Font Access in der Desktop-App) */
  async function loadLocal(force) {
    if (LOCAL && !force) return LOCAL;
    if (loading && !force) return loading;
    loading = (async () => {
      const m = new Map();
      try {
        if (typeof window.queryLocalFonts === 'function') {
          const list = await window.queryLocalFonts();
          for (const f of list) { const fam = String(f.family || '').trim(); if (!fam || fam.startsWith('.')) continue; if (!m.has(fam)) m.set(fam, new Set()); m.get(fam).add(String(f.style || 'Regular')); }
        }
      } catch (e) { /* ohne Zugriff: leere Liste, die App bleibt nutzbar */ }
      /* zusätzlich die Schriftordner des Systems lesen (erkennt auch frisch installierte Schriften) */
      try { const nat = window.native && window.native.listFonts ? await window.native.listFonts() : []; for (const f of nat || []) { const fam = String(f.family || '').trim(); if (!fam || fam.startsWith('.')) continue; if (!m.has(fam)) { m.set(fam, new Set()); NATIVE_ONLY.add(fam); } (f.styles || []).forEach(x => m.get(fam).add(String(x))); } } catch (e) {}
      /* frühere, von Hand eingetragene Namen (0.2) zusätzlich prüfen */
      ((typeof ST !== 'undefined' && ST && ST.customFonts) || []).forEach(n => { if (!m.has(n) && measureInstalled(n)) m.set(n, new Set(['Regular'])); });
      LOCAL = new Map([...m.entries()].sort((a, b) => a[0].localeCompare(b[0], 'de')).map(([k, v]) => [k, [...v]]));
      return LOCAL;
    })();
    return loading;
  }
  function measureInstalled(name) {
    try { const c = document.createElement('canvas').getContext('2d'); const txt = 'mmmmmmmmmmlliWWQqg123äöü'; const w = f => { c.font = `40px ${f}`; return c.measureText(txt).width; };
      return ['monospace', 'serif', 'sans-serif'].some(b => w(`"${name}", ${b}`) !== w(b)); } catch (e) { return false; }
  }
  /* Ist eine Schrift hier verfügbar? Mitgelieferte immer; installierte nach Liste (oder Messung) */
  function available(key) {
    if (!key || RD.FONTS[key]) return true;
    const n = RD.sysName(key); if (!n) return true;
    if (n === 'Times New Roman' || n === 'Arial') return measureInstalled(n);
    if (LOCAL && LOCAL.has(n)) return true;
    return measureInstalled(n);
  }
  function styles(key) { const n = RD.sysName(key); if (!n || !LOCAL) return null; return LOCAL.get(n) || null; }
  function hasBold(key) { const f = RD.FONTS[key]; if (f) return f.bold; const st = styles(key); return st ? st.some(s => /bold|fett|black|heavy|semibold|demi/i.test(s)) : true; }

  const label = key => RD.fontLabel(key);
  /* Knopf, der wie ein Auswahlfeld aussieht; zeigt den Namen in der Schrift selbst */
  function button(id, value, opts = {}) {
    const v = value || '';
    const shown = v ? label(v) : (opts.inheritLabel || 'Wie das Blatt');
    const miss = v && !available(v);
    return `<button type="button" class="fpk ${miss ? 'miss' : ''}" id="${id}" data-fpk="${esc(opts.k || '')}" data-fv="${esc(v)}" data-inh="${esc(opts.inheritLabel || '')}" title="${miss ? 'Diese Schrift fehlt auf diesem Computer' : 'Schrift wählen'}">
      <span class="fpkN" style="${v ? `font-family:${esc(RD.fontCss(v))}` : ''}">${esc(shown)}</span>${miss ? '<span class="fpkW">fehlt</span>' : ''}<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></button>`;
  }

  /* Auswahlliste öffnen; onPick(key) – '' bedeutet „übernehmen“ */
  async function open(anchor, value, inheritLabel, onPick) {
    closeAll();
    const pop = document.createElement('div'); pop.className = 'fontPop'; pop.id = 'fontPop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Schrift wählen');
    pop.innerHTML = `<div class="search">${ICO.search}<input type="search" placeholder="Schrift suchen …" aria-label="Schrift suchen"></div><div class="fpList" role="listbox"></div>
      <div class="fpFoot"><span class="hint" id="fpCount"></span><button type="button" class="tb ghost" data-refresh>Liste aktualisieren</button></div>`;
    document.body.appendChild(pop);
    const r = anchor.getBoundingClientRect();
    const W = Math.min(380, window.innerWidth - 20); pop.style.width = W + 'px';
    pop.style.left = Math.max(10, Math.min(window.innerWidth - W - 10, r.left)) + 'px';
    const below = window.innerHeight - r.bottom - 16, above = r.top - 16;
    const H = Math.min(460, Math.max(below, above)); pop.style.maxHeight = H + 'px';
    if (below >= Math.min(320, above)) pop.style.top = (r.bottom + 6) + 'px'; else pop.style.bottom = (window.innerHeight - r.top + 6) + 'px';
    const q = pop.querySelector('input'), list = pop.querySelector('.fpList');
    let rows = [], act = -1;
    const row = (key, text, sub, cls = '') => `<div class="fpRow ${cls} ${key === (value || '') ? 'on' : ''}" role="option" data-key="${esc(key)}" tabindex="-1"><span class="fpName" style="${key && !cls.includes('inh') ? `font-family:${esc(RD.fontCss(key))}` : ''}">${esc(text)}</span>${sub ? `<small>${esc(sub)}</small>` : ''}</div>`;
    const draw = async () => {
      const loc = await loadLocal(); const term = q.value.trim().toLowerCase(); const hit = s => !term || s.toLowerCase().includes(term);
      let h = '';
      if (inheritLabel != null && hit(inheritLabel)) h += row('', inheritLabel, 'übernimmt die Einstellung darüber', 'inh');
      const bundled = Object.entries(RD.FONTS).filter(([k, f]) => hit(f.label));
      const sec = (t, x) => x ? `<div class="fpSec">${esc(t)}</div>${x}` : '';
      h += sec('Mitgeliefert und Standard', bundled.map(([k, f]) => row(k, f.label, f.bundled ? (f.bold ? 'mitgeliefert · Normal und Fett' : 'mitgeliefert · ohne Fett-Schnitt') : 'auf Mac und Windows vorhanden')).join(''));
      const rec = recent().filter(k => !RD.FONTS[k] && hit(label(k)) && available(k));
      h += sec('Zuletzt verwendet', rec.map(k => row(k, label(k), 'auf diesem Computer')).join(''));
      const fams = [...loc.keys()].filter(hit);
      h += sec(`Auf diesem Computer (${loc.size})`, fams.slice(0, 600).map(n => { const st = loc.get(n); const later = NATIVE_ONLY.has(n) && !measureInstalled(n); return row('sys:' + n, n, (later ? 'neu installiert – nach Neustart von Foliva sichtbar · ' : '') + (st.length > 1 ? `${st.length} Schnitte: ${st.slice(0, 4).join(', ')}${st.length > 4 ? ' …' : ''}` : (st[0] || ''))); }).join(''));
      if (fams.length > 600) h += `<p class="hint" style="padding:6px 12px">… und ${fams.length - 600} weitere – bitte genauer suchen.</p>`;
      if (!loc.size) h += `<p class="hint" style="padding:6px 12px">Die Liste der installierten Schriften ist gerade nicht verfügbar. „Liste aktualisieren“ versuchen.</p>`;
      if (term && !RD.FONTS[term] && ![...loc.keys()].some(n => n.toLowerCase() === term) && measureInstalled(q.value.trim())) h += row('sys:' + q.value.trim(), q.value.trim(), 'gefunden');
      list.innerHTML = h || '<p class="hint" style="padding:10px 12px">Keine passende Schrift.</p>';
      pop.querySelector('#fpCount').textContent = loc.size ? `${loc.size} Schriftfamilien installiert` : '';
      rows = [...list.querySelectorAll('.fpRow')]; act = rows.findIndex(x => x.classList.contains('on'));
      rows.forEach((x, i) => { x.onclick = () => choose(x.dataset.key); x.onmousemove = () => setAct(i, false); });
      if (act >= 0) rows[act].scrollIntoView({ block: 'nearest' });
    };
    const setAct = (i, scroll = true) => { rows.forEach(x => x.classList.remove('act')); act = Math.max(0, Math.min(rows.length - 1, i)); if (rows[act]) { rows[act].classList.add('act'); if (scroll) rows[act].scrollIntoView({ block: 'nearest' }); } };
    const choose = k => { closeAll(); addRecent(k); onPick(k); };
    q.oninput = () => { draw().then(() => setAct(0, true)); };
    q.onkeydown = e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setAct(act + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setAct(act - 1); }
      else if (e.key === 'Enter') { e.preventDefault(); if (rows[act]) choose(rows[act].dataset.key); }
      else if (e.key === 'Escape') { e.preventDefault(); closeAll(); anchor.focus(); }
    };
    pop.querySelector('[data-refresh]').onclick = async () => { await loadLocal(true); draw(); toast('Schriftenliste aktualisiert.'); };
    setTimeout(() => document.addEventListener('mousedown', outside), 0);
    await draw(); q.focus();
  }
  function outside(e) { if (!e.target.closest('#fontPop')) closeAll(); }
  function closeAll() { const p = document.getElementById('fontPop'); if (p) p.remove(); document.removeEventListener('mousedown', outside); }

  /* Alle Schriftknöpfe in el verdrahten; set(k, key) übernimmt die Wahl */
  function bind(el, set) {
    el.querySelectorAll('[data-fpk]').forEach(b => b.onclick = () => open(b, b.dataset.fv, b.dataset.inh || null, key => set(b.dataset.fpk, key, b)));
  }
  return { loadLocal, available, hasBold, styles, button, open, bind, closeAll, addRecent, measureInstalled, get local() { return LOCAL; } };
})();
