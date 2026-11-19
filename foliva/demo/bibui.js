/* Foliva – Text-Bibliothek, Lernwörter der Schule, Seitenrahmen-Assistent (Oberfläche) · © 2026 theis
   Nutzt die globalen Editor-Funktionen aus app.js (cur, change, dialog, insertWithProps, …) erst beim Aufruf. */
'use strict';

/* ---------- Text-Bibliothek ---------- */
function bibDialog(opts = {}) {
  const BIB = window.FolivaBibliothek; if (!BIB || !cur) return;
  const target = opts.target || null;
  const F = Object.assign({ quelle: 'alle', stufe: '', q: '', themen: [], laengen: [], lernwoerter: '' }, (UI.bib || {}), opts.filter || {});
  if (target && target.type === 'gedicht' && !opts.filter) F.quelle = 'gedichte';
  let selId = null, res = [];
  const chk = (name, key, label, on) => `<label class="bibChk"><input type="checkbox" data-${name}="${esc(key)}" ${on ? 'checked' : ''}><span>${esc(label)}</span></label>`;
  const html = `<div class="bibTop"><svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5.5C5.5 4 8.5 4 12 5.5 15.5 4 18.5 4 21 5.5V19c-2.5-1.5-5.5-1.5-9 0-3.5-1.5-6.5-1.5-9 0Z"/><path d="M12 5.5V19"/></svg><div><b>Such dir einen Text aus</b><span>Kleine Geschichten, Märchen, Fabeln, Sachtexte, Gedichte und Textaufgaben – alle frei verwendbar</span></div></div>
    <div class="bibGrid">
      <div class="bibF">
        <label class="field"><span>Quelle</span><select id="bQuelle"><option value="alle">Alle Texte</option>${Object.entries(BIB.QUELLEN).map(([k, v]) => `<option value="${k}" ${F.quelle === k ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></label>
        <div class="field"><span>Klassenstufe</span><div class="segP" id="bStufe">${[['', 'alle'], ['12', '1/2'], ['34', '3/4']].map(([k, v]) => `<button type="button" data-v="${k}" aria-pressed="${F.stufe === k}">${v}</button>`).join('')}</div></div>
        <label class="field"><span>Suchen (Titel, Stichwort, Text)</span><input type="search" id="bQ" value="${esc(F.q)}" placeholder="z. B. Hund, Winter"></label>
        <label class="field"><span>Enthaltene Lernwörter</span><textarea id="bLW" rows="3" placeholder="z. B. Hund, Schnee, spielen">${esc(F.lernwoerter)}</textarea></label>
        <div class="bibLwBtns"><button class="tb mini" type="button" data-lwfill="12">Lernwörter 1/2</button><button class="tb mini" type="button" data-lwfill="34">3/4</button><button class="tb mini" type="button" data-lwfill="">leeren</button></div>
        <div class="bibFs"><span>Anzahl Wörter</span>${BIB.WORT_BEREICHE.map(([k, l]) => chk('len', k, l, F.laengen.includes(k))).join('')}</div>
        <div class="bibFs"><span>Thema</span>${Object.entries(BIB.THEMEN).map(([k, l]) => chk('th', k, l, F.themen.includes(k))).join('')}</div>
        <button class="tb mini" type="button" id="bReset">Alle Filter zurücksetzen</button>
      </div>
      <div class="bibL"><div class="bibLh"><b id="bCount"></b></div><div class="bibList" id="bList" role="listbox" aria-label="Texte"></div></div>
      <div class="bibP" id="bPrev"></div>
    </div>
    <div class="bibFoot"><span class="hint">Tipp: Markiere einen Teil des Textes, um nur diesen Teil zu übernehmen.</span><span class="sp"></span>
      <label class="bibAs"><span>Einfügen als</span><select id="bAs"></select></label>
      <button class="tb" type="button" data-x2>Schließen</button><button class="tb primary" type="button" id="bTake">${target ? 'Text ersetzen' : 'Übernehmen'}</button></div>`;
  dialog({ title: 'Bibliothek', html, wide: true, onOpen: (d, close) => {
    d.classList.add('xwide');
    const q = id => d.querySelector('#' + id);
    const save = () => { UI.bib = { quelle: F.quelle, stufe: F.stufe, themen: F.themen, laengen: F.laengen, lernwoerter: F.lernwoerter }; saveUI(); };
    const lwSet = () => new Set(BIB.lwParse(F.lernwoerter));
    const highlight = (text, x) => { const L = lwSet(); const hits = new Set(L.size ? BIB.lwHits(x, [...L]) : []); return esc(BIB.plain(text)).replace(/[A-Za-zÄÖÜäöüßẞ]+/g, w => { const lw = w.toLowerCase(); return [...hits].some(l => lw === l || (l.length >= 4 && lw.startsWith(l))) ? `<mark>${w}</mark>` : w; }).replace(/\n/g, '<br>'); };
    const asOpts = x => { if (x && x.kind === 'aufgabe') return [['sachaufgabe', 'Sachaufgabe (Frage – Rechnung – Antwort)'], ['text', 'Nur den Text']]; const o = [['text', 'Lesetext']]; if (x && x.fragen) o.push(['sachtext', 'Lesetext mit Fragen']); if (x && x.kind !== 'gedicht') o.push(['luecke', 'Lückentext']); if (x && x.kind === 'gedicht') o.unshift(['gedicht', 'Gedicht']); return o; };
    const setAs = x => { const o = asOpts(x); const keep = q('bAs').value; const def = target ? (target.type === 'sachtext' && x && x.fragen ? 'sachtext' : target.type === 'gedicht' && x && x.kind === 'gedicht' ? 'gedicht' : 'text') : (x && x.kind === 'aufgabe' ? 'sachaufgabe' : x && x.kind === 'gedicht' ? 'gedicht' : x && x.fragen ? 'sachtext' : 'text'); q('bAs').innerHTML = o.map(([k, l]) => `<option value="${k}">${l}</option>`).join(''); q('bAs').value = o.some(z => z[0] === keep) && !target ? keep : def; q('bAs').disabled = !!target; };
    const prev = () => {
      part = ''; const x = selId && BIB.byId(selId); setAs(x);
      if (!x) { q('bPrev').innerHTML = `<p class="hint">Links einen Text anklicken – hier erscheint die Vorschau.</p>`; q('bTake').disabled = true; return; }
      q('bTake').disabled = false;
      const ONE = { geschichten: 'Kleine Geschichte', maerchen: 'Märchen', fabeln: 'Fabel', sachtexte: 'Sachtext', gedichte: 'Gedicht', elfchen: 'Elfchen', aufgaben: 'Textaufgabe' };
      const meta = [ONE[x.quelle] || '', `${x.words} Wörter`, x.stufe ? 'Klasse ' + (x.stufe === '12' ? '1/2' : '3/4') : 'Klasse 1–4', x.author || (['geschichten', 'elfchen', 'aufgaben'].includes(x.quelle) || (x.quelle === 'gedichte' && !x.author) ? 'für Foliva geschrieben' : '')].filter(Boolean).join(' · ');
      const hits = BIB.lwParse(F.lernwoerter).length ? BIB.lwHits(x, BIB.lwParse(F.lernwoerter)) : [];
      q('bPrev').innerHTML = `<h3>${esc(x.title)}</h3><p class="bibMeta">${esc(meta)}</p>${x.tags ? `<p class="bibTags">Stichwörter: ${esc(x.tags)}</p>` : ''}${hits.length ? `<p class="bibTags">Enthält ${hits.length} Lernwörter: ${esc(hits.join(', '))}</p>` : ''}${x.status === 'entwurf' ? `<p class="bibTags warn">Sachtext im Entwurf: fachlich noch nicht freigegeben, Quellen werden mit übernommen.</p>` : ''}
        <div class="bibText${x.kind === 'gedicht' ? ' bibPoem' : ''}" id="bText" tabindex="0">${highlight(x.text, x)}</div><p class="bibTags" id="bPart"></p>${x.kind === 'aufgabe' ? `<details class="bibQ" open><summary>Lösung</summary><ol><li>Frage<small>${esc(x.F)}</small></li><li>Rechnung<small>${esc(x.R)}</small></li><li>Antwort<small>${esc(x.A)}</small></li></ol></details>` : ''}${x.fragen ? `<details class="bibQ"><summary>Fragen mit Musterantworten (${x.fragen.split('\n').length})</summary><ol>${x.fragen.split('\n').map(l => { const [f, a] = l.split('|'); return `<li>${esc(f)}<small>${esc(a || '')}</small></li>`; }).join('')}</ol></details>` : ''}`;
    };
    const run = () => {
      res = BIB.filter(F);
      q('bCount').textContent = `Texte (${res.length}):`;
      if (selId && !res.some(o => o.x.id === selId)) selId = null;
      if (!selId && res.length) selId = res[0].x.id;
      q('bList').innerHTML = res.length ? res.map(({ x, hits }) => `<button type="button" class="bibI${x.id === selId ? ' on' : ''}" data-id="${esc(x.id)}" role="option" aria-selected="${x.id === selId}"><span>${esc(BIB.QUELLEN[x.quelle])}: ${esc(x.title)}</span><small>${x.words} W.${x.stufe ? ' · ' + (x.stufe === '12' ? '1/2' : '3/4') : ''}${hits.length ? ' · ' + hits.length + ' LW' : ''}</small></button>`).join('') : `<p class="hint" style="padding:10px">Kein Text passt zu diesen Filtern.</p>`;
      d.querySelectorAll('.bibI').forEach(b => b.onclick = () => { selId = b.dataset.id; d.querySelectorAll('.bibI').forEach(z => { z.classList.toggle('on', z === b); z.setAttribute('aria-selected', z === b); }); prev(); });
      prev(); save();
    };
    q('bQuelle').onchange = () => { F.quelle = q('bQuelle').value; run(); };
    d.querySelectorAll('#bStufe button').forEach(b => b.onclick = () => { F.stufe = b.dataset.v; d.querySelectorAll('#bStufe button').forEach(z => z.setAttribute('aria-pressed', z === b)); run(); });
    q('bQ').oninput = () => { F.q = q('bQ').value; run(); };
    q('bLW').oninput = () => { F.lernwoerter = q('bLW').value; run(); };
    d.querySelectorAll('[data-lwfill]').forEach(b => b.onclick = () => { const L = window.FolivaLernwoerter; const st = b.dataset.lwfill; F.lernwoerter = st && L ? L.words(st, 'alle').filter(x => x.art).map(x => x.wort).join(', ') : ''; q('bLW').value = F.lernwoerter; run(); });
    d.querySelectorAll('[data-len]').forEach(c => c.onchange = () => { F.laengen = [...d.querySelectorAll('[data-len]:checked')].map(z => z.dataset.len); run(); });
    d.querySelectorAll('[data-th]').forEach(c => c.onchange = () => { F.themen = [...d.querySelectorAll('[data-th]:checked')].map(z => z.dataset.th); run(); });
    q('bReset').onclick = () => { Object.assign(F, { quelle: 'alle', stufe: '', q: '', themen: [], laengen: [], lernwoerter: '' }); q('bQuelle').value = 'alle'; q('bQ').value = ''; q('bLW').value = ''; d.querySelectorAll('[data-len],[data-th]').forEach(c => c.checked = false); d.querySelectorAll('#bStufe button').forEach(z => z.setAttribute('aria-pressed', z.dataset.v === '')); run(); };
    d.querySelector('[data-x2]').onclick = () => close(null);
    /* markierter Teil: beim Markieren merken (eine spätere Auswahl im Menü „Einfügen als“ hebt die Markierung sonst auf) */
    let part = '';
    const readSel = () => { const s = window.getSelection(); const box = q('bText'); if (s && s.rangeCount && box && box.contains(s.anchorNode) && box.contains(s.focusNode)) { part = String(s.toString()).replace(/\r/g, '').trim(); } else if (s && s.isCollapsed && box && box.contains(s.anchorNode)) part = ''; const pi = q('bPart'); if (pi) pi.textContent = part ? `Markiert: ${part.length} Zeichen – nur dieser Teil wird übernommen.` : ''; };
    document.addEventListener('selectionchange', readSel);
    d.addEventListener('close', () => document.removeEventListener('selectionchange', readSel));
    q('bTake').onclick = () => {
      const x = selId && BIB.byId(selId); if (!x) return;
      document.removeEventListener('selectionchange', readSel);
      close(true); bibTake(x, q('bAs') ? q('bAs').value : 'text', part, target);
    };
    run();
  } });
}
/* Text übernehmen: neuer Baustein oder Text eines vorhandenen Bausteins ersetzen */
function bibTake(x, as, part, target) {
  const BIB = window.FolivaBibliothek; const body = part || BIB.plain(x.text).trim(); const whole = !part;
  const titleLine = whole ? `**${x.title}**\n` : '';
  if (as === 'sachaufgabe' || (target && target.type === 'sachaufgabe')) {
    const props = { source: 'eigene', text: body, frage: true, solF: whole ? x.F || '' : '', solR: whole ? x.R || '' : '', solA: whole ? x.A || '' : '' };
    if (target) change(() => { Object.assign(target, props); }, null, { panel: true }); else insertWithProps('sachaufgabe', { title: 'Löse die Sachaufgabe.', ...props });
    toast(whole ? `„${x.title}“ übernommen – mit Lösung im Lösungsblatt.` : 'Markierter Teil übernommen.'); return;
  }
  if (as === 'gedicht' || (target && target.type === 'gedicht')) {
    const props = { mode: 'lesen', source: 'eigene', ptitle: whole ? x.title : '', author: whole && x.author && !/nacherzählt/.test(x.author) ? x.author : '', text: body };
    if (target) change(() => { Object.assign(target, props, { mode: target.mode || 'lesen' }); regen(target); }, null, { panel: true }); else insertWithProps('gedicht', props);
    toast(whole ? `„${x.title}“ übernommen.` : 'Markierter Teil übernommen.'); return;
  }
  if (as === 'sachtext' || (target && target.type === 'sachtext')) {
    const props = { source: 'eigene', text: titleLine + body, questions: whole ? x.fragen || '' : '', status: x.status === 'entwurf' ? 'entwurf' : '', sources: x.sources || '' };
    if (target) change(() => { Object.assign(target, props); }, null, { panel: true }); else insertWithProps('sachtext', { title: 'Lies den Text und beantworte die Fragen.', ...props });
    toast(whole ? `„${x.title}“ mit ${props.questions ? props.questions.split('\n').length + ' Fragen ' : ''}übernommen.` : 'Markierter Teil übernommen.'); return;
  }
  const props = { text: titleLine + body };
  if (as === 'luecke') Object.assign(props, { ex: 'luecke', gapEvery: 5, gapMin: 4, gapBank: true });
  if (target) change(() => { Object.assign(target, props); }, null, { panel: true }); else insertWithProps('text', props);
  toast(whole ? `„${x.title}“ übernommen.` : 'Markierter Teil übernommen.');
}

/* ---------- Lernwörter der Schule ---------- */
async function loadOwnLernwoerter() { try { const v = N.getCfg ? await N.getCfg('lernwoerter') : null; if (v && window.FolivaLernwoerter) window.FolivaLernwoerter.setOwn(v); } catch (e) { } }
function lernwoerterDialog() {
  const L = window.FolivaLernwoerter; if (!L) return;
  const own = L.own(); const txt = a => a.map(x => x.w).join('\n');
  dialog({ title: 'Lernwörter der Schule', wide: true, html: `<p class="hint" style="margin-top:0">Hier kannst du eure Lernwörterliste einfügen, zum Beispiel den Grundwortschatz aus dem LehrplanPLUS (Servicematerial) oder die Liste eures Lehrwerks. Ein Wort je Zeile oder durch Komma getrennt; Nomen gern mit Artikel. Foliva nutzt die Liste bei „Lernwörter üben“, im Wortsuchgitter, beim ABC und Buchstabensalat und als Filter in der Bibliothek. Foliva bringt außerdem einen eigenen Lernwortschatz mit (${L.LIST.length} Wörter).</p>
    <div class="grid2"><label class="field"><span>Jahrgangsstufe 1/2</span><textarea id="lw12" rows="12" spellcheck="false">${esc(txt(own['12']))}</textarea></label><label class="field"><span>Jahrgangsstufe 3/4</span><textarea id="lw34" rows="12" spellcheck="false">${esc(txt(own['34']))}</textarea></label></div>
    <p class="hint" id="lwInfo"></p>${window.FolivaPools && window.FolivaPools.GWS ? `<div class="inline" style="gap:8px;flex-wrap:wrap"><button class="tb" type="button" id="lwGws">Grundwortschatz LehrplanPLUS Bayern einsetzen</button><small class="hint" style="margin:0">amtliche Liste des ISB für 1/2 und 3/4 – ersetzt den Inhalt der beiden Felder</small></div>` : ''}
    <div class="dlgBtns"><button class="tb" type="button" data-x2>Abbrechen</button><button class="tb primary" type="button" id="lwSave">Speichern</button></div>`,
    onOpen: (d, close) => {
      const info = () => { const n = id => d.querySelector('#' + id).value.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean).length; d.querySelector('#lwInfo').textContent = `${n('lw12')} Wörter für 1/2 · ${n('lw34')} Wörter für 3/4`; };
      d.querySelectorAll('textarea').forEach(t => t.oninput = info); info();
      const gb = d.querySelector('#lwGws'); if (gb) gb.onclick = () => { const P = window.FolivaPools; ['12', '34'].forEach(st => { d.querySelector('#lw' + st).value = P.gwsForms(st).join('\n'); }); info(); };
      d.querySelector('[data-x2]').onclick = () => close(null);
      d.querySelector('#lwSave').onclick = async () => {
        const v = { '12': d.querySelector('#lw12').value, '34': d.querySelector('#lw34').value };
        try { await N.setCfg({ lernwoerter: v }); L.setOwn(v); close(true); toast('Lernwörter gespeichert.'); if (typeof renderRight === 'function') renderRight(); } catch (e) { toast('Speichern nicht möglich: ' + e.message, 5000); }
      };
    } });
}

/* ---------- Seitenrahmen-Assistent ---------- */
function frameDialog() {
  if (!cur) return;
  const s0 = cur.settings; const before = { frame: s0.frame || 'none', frameCol: s0.frameCol || '' };
  const label = k => (RD.FRAMES.find(x => x[0] === k) || [k, k])[1].replace(/^Schmuckrand /, '');
  const tile = (k, col) => { const d = { ...cur, settings: { ...cur.settings, frame: k, frameCol: col }, items: [] }; let pg = ''; try { pg = RD.page('', 1, 1, d, {}); } catch (e) { pg = ''; } return `<button type="button" class="frT${(cur.settings.frame || 'none') === k ? ' on' : ''}" data-fr="${k}" aria-pressed="${(cur.settings.frame || 'none') === k}"><span class="frPv"><span class="frPz">${pg}</span></span><span>${esc(label(k))}</span></button>`; };
  const body = () => { const col = cur.settings.frameCol || ''; return `<div class="frTop"><span>Darstellung</span><div class="segP" id="frCol"><button type="button" data-c="" aria-pressed="${!col}">farbig</button><button type="button" data-c="sw" aria-pressed="${col === 'sw'}">schwarz-weiß</button></div><span class="hint">Klicken übernimmt den Rahmen sofort für das ganze Material.</span></div>${(RD.FRAME_GROUPS || [['Rahmen', RD.FRAMES.map(x => x[0])]]).map(([g, ks]) => `<div class="frG"><div class="sec">${esc(g)}</div><div class="frGrid">${ks.filter(k => RD.FRAMES.some(x => x[0] === k)).map(k => tile(k, col)).join('')}</div></div>`).join('')}`; };
  dialog({ title: 'Seitenrahmen aussuchen', wide: true, html: `<div id="frBox"></div><div class="dlgBtns"><button class="tb" type="button" id="frUndo">Wie vorher</button><button class="tb primary" type="button" data-x2>Fertig</button></div>`, onOpen: (d, close) => {
    d.classList.add('xwide');
    const draw = () => { d.querySelector('#frBox').innerHTML = body();
      d.querySelectorAll('.frT').forEach(b => b.onclick = () => { change(() => { cur.settings.frame = b.dataset.fr; }, null, { panel: true }); draw(); });
      d.querySelectorAll('#frCol button').forEach(b => b.onclick = () => { change(() => { if (b.dataset.c) cur.settings.frameCol = b.dataset.c; else delete cur.settings.frameCol; }, null, { panel: true }); draw(); }); };
    draw();
    d.querySelector('#frUndo').onclick = () => { change(() => { cur.settings.frame = before.frame; if (before.frameCol) cur.settings.frameCol = before.frameCol; else delete cur.settings.frameCol; }, null, { panel: true }); draw(); };
    d.querySelector('[data-x2]').onclick = () => close(true);
  } });
}

/* Klicks auf Links in Einstellungsfeldern */
document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('[data-lwedit]'); if (a) { e.preventDefault(); lernwoerterDialog(); return; }
  const b = e.target.closest && e.target.closest('[data-bibopen]'); if (b) { e.preventDefault(); const it = sel && cur && cur.items.find(x => x.id === sel); bibDialog(b.dataset.bibopen === 'item' && it ? { target: it } : {}); return; }
  const f = e.target.closest && e.target.closest('[data-frdlg]'); if (f) { e.preventDefault(); frameDialog(); }
});
