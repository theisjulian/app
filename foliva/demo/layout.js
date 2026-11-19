/* Foliva – Layout: fertige Layouts, Kopf und Titel, Kopfzeilen-Baukasten, eigene Layouts und Vorlagen · © 2026 theis
   Einfach: Layout-Vorlage wählen. Für Profis: Kopfzeile Zeile für Zeile selbst bauen und als eigenes Layout speichern. */
'use strict';
const LAYOUT_KEYS = ['headStyle', 'headFields', 'headLook', 'headCustom', 'frame', 'frameCol', 'titleStyle', 'titleAlign', 'margin', 'header', 'pointsTable', 'gradeKey', 'pointsCol', 'sign', 'footText', 'pageNums', 'pnFmt', 'brandFoot', 'showTitle'];
const allLayouts = () => [...RD.LAYOUTS.map(l => ({ ...l, own: false })), ...((ST.layouts || []).map(l => ({ ...l, own: true })))];
function layoutFieldHTML(s) {
  const L = allLayouts(); const v = s.layoutId && L.some(l => l.id === s.layoutId) ? s.layoutId : '';
  return `<label class="field"><span>Layout-Vorlage</span><select id="layoutSel"><option value="" ${v ? '' : 'selected'}>${v ? '' : 'Eigene Einstellungen'}</option><optgroup label="Mitgeliefert">${RD.LAYOUTS.map(l => `<option value="${l.id}" ${l.id === v ? 'selected' : ''}>${esc(l.name)}</option>`).join('')}</optgroup>${(ST.layouts || []).length ? `<optgroup label="Meine Layouts">${ST.layouts.map(l => `<option value="${esc(l.id)}" ${l.id === v ? 'selected' : ''}>${esc(l.name)}</option>`).join('')}</optgroup>` : ''}</select><small class="h">Setzt Kopfzeile, Titel, Rahmen und Ränder auf einmal. Inhalte bleiben unverändert.</small></label>`;
}
function applyLayout(doc, id) {
  const l = allLayouts().find(x => x.id === id); if (!l) return false;
  LAYOUT_KEYS.forEach(k => { if (k in l.set) doc.settings[k] = JSON.parse(JSON.stringify(l.set[k])); });
  doc.settings.layoutId = id; return true;
}
function bindLayoutField(el) {
  const sel = $('#layoutSel', el); if (!sel) return;
  sel.onchange = () => { if (!sel.value) return; change(() => applyLayout(cur, sel.value), null, { panel: true }); toast('Layout übernommen – Rückgängig mit ' + MOD + '+Z.'); };
}
function bindHeadFields(el, d) {
  const fields = Array.isArray(d.settings.headFields) && d.settings.headFields.length ? d.settings.headFields : ['name', 'datum', 'klasse'];
  $$('#hFields button', el).forEach(b => b.onclick = () => change(() => { const k = b.dataset.hf; let f = fields.slice(); f = f.includes(k) ? f.filter(x => x !== k) : Object.keys(RD.HEAD_FIELDS).filter(x => f.includes(x) || x === k); d.settings.headFields = f; delete d.settings.layoutId; }, null, { panel: true }));
}
const panelHead = (title, sub) => `<div class="sideHead"><h2><span>${esc(title)}</span></h2><button class="collapse" id="hideR" title="Einstellungen ausblenden" aria-label="Einstellungen ausblenden">${ICO.sideR}</button></div><div class="props">${sub ? `<p class="hint" style="margin:0 0 12px">${sub}</p>` : ''}`;
function renderHeadPanel(el) {
  const d = cur, s = d.settings; const fields = Array.isArray(s.headFields) && s.headFields.length ? s.headFields : ['name', 'datum', 'klasse'];
  el.innerHTML = panelHead('Kopf und Titel', 'Den Titel kannst du auch direkt auf dem Blatt doppelklicken und ändern.') + `
    <label class="field"><span>Titel des Materials</span><input type="text" id="hTitle" value="${esc(d.title)}" spellcheck="true"></label>
    ${fieldHTML({ k: 'showTitle', label: 'Titel auf dem Blatt zeigen', type: 'toggle' }, s.showTitle !== false)}
    ${fieldHTML({ k: 'titleStyle', label: 'Titelzeile', type: 'select', opts: [['', 'Mittig, fett'], ['left', 'Linksbündig'], ['line', 'Mit Linie darunter'], ['band', 'Im Farbband']] }, s.titleStyle || '')}
    <div class="sec">Kopfzeile</div>
    ${layoutFieldHTML(s)}
    ${fieldHTML({ k: 'header', label: 'Kopfzeile anzeigen', type: 'toggle' }, s.header !== false)}
    ${fieldHTML({ k: 'headStyle', label: 'Art der Kopfzeile', type: 'select', opts: [['linie', 'Schlicht: Linien zum Ausfüllen'], ['kasten', 'Im Kasten'], ['leistung', 'Leistungsnachweis (Art, Fach, Name, Note)'], ['eigen', 'Selbst gestaltet']] }, s.headStyle || 'linie')}
    ${(s.headStyle || 'linie') === 'eigen' ? `<p class="hint">Diese Kopfzeile ist frei gestaltet. Mit einer anderen „Art der Kopfzeile“ kommst du zur einfachen Einstellung zurück.</p>
    <div class="btnCol"><button class="tb primary" type="button" id="hbBtn">Kopfzeile bearbeiten …</button><button class="tb" type="button" id="laySave">Dieses Layout speichern …</button></div>` : `<div class="field"><span>Felder</span><div class="chipsG wide" id="hFields">${Object.entries(RD.HEAD_FIELDS).map(([k, [n]]) => `<button type="button" data-hf="${k}" aria-pressed="${fields.includes(k)}">${n}</button>`).join('')}</div></div>
    ${fieldHTML({ k: 'headLook', label: 'Felder zum Ausfüllen als', type: 'seg', opts: [['', 'Linie'], ['kaestchen', 'Kästchen']] }, s.headLook || '')}
    <p class="hint" style="margin-top:-4px">Die Breiten passen sich automatisch an: Name am breitesten, dann Datum, Fach, Klasse, Note und Punkte.</p>
    <div class="btnCol"><button class="tb" type="button" id="laySave">Dieses Layout speichern …</button><button class="tb ghost" type="button" id="hbBtn">Erweitert: Kopfzeile frei gestalten …</button></div>`}
    ${d.kind === 'probe' ? `<div class="sec">Leistungsnachweis</div>
    <label class="field"><span>Art</span><select id="assessSel">${RD.ASSESS.map(a => `<option ${a === RD.assessLabel(d) ? 'selected' : ''}>${a}</option>`).join('')}</select></label>
    ${fieldHTML({ k: 'assessNo', label: 'Nummer (leer = ohne)', type: 'text' }, s.assessNo || '')}
    ${fieldHTML({ k: 'pointsTable', label: 'Punktetabelle je Aufgabe', type: 'toggle' }, s.pointsTable !== false)}
    ${fieldHTML({ k: 'gradeKey', label: 'Notenschlüssel zum Ausfüllen', type: 'toggle' }, !!s.gradeKey)}
    ${fieldHTML({ k: 'pointsCol', label: 'Punktekästchen rechts je Aufgabe', type: 'toggle' }, !!s.pointsCol)}
    ${fieldHTML({ k: 'sign', label: 'Unterschrift Erziehungsberechtigte am Ende', type: 'toggle' }, !!s.sign)}` : ''}
    <div class="sec">Schrift für Titel und Kopf</div>
    ${fieldHTML({ k: 'fontT', label: 'Schrift', type: 'font', inheritLabel: 'Wie die Anweisungen: ' + RD.fontLabel(RD.sheetFonts(s).fI) }, s.fontT || '')}
    <div class="btnCol" style="margin-top:8px"><button class="tb ghost" type="button" id="backDoc">← Alle Material-Einstellungen</button></div></div>`;
  $('#hideR').onclick = () => { UI.right = false; saveUI(); applySides(); };
  const ti = $('#hTitle', el); ti.oninput = () => { change(() => { cur.title = ti.value; }, 'title'); const tt = $(`.tab[data-tab="${cur.id}"] .tt`); if (tt) tt.textContent = ti.value || 'Unbenanntes Material'; const tn = $('#titleIn'); if (tn) tn.value = ti.value; };
  bindFields(el, d, false, () => d.settings); bindHeadFields(el, d); bindLayoutField(el);
  { const ts = $('[data-k="titleStyle"]', el); if (ts) ts.addEventListener('change', () => { if (d.settings.titleAlign) { delete d.settings.titleAlign; renderPages(); } }); }
  const as = $('#assessSel', el); if (as) as.onchange = () => change(() => { const old = RD.assessLabel(d); d.assess = as.value; if (d.title === 'Neue ' + old) d.title = 'Neue ' + as.value; }, null, { panel: true, top: true });
  $('#hbBtn').onclick = headBuilderDialog; $('#laySave').onclick = saveLayoutDialog; $('#backDoc').onclick = () => { zone = null; renderPages(); renderRight(); };
}
function renderFootPanel(el) {
  const d = cur, s = d.settings;
  el.innerHTML = panelHead('Seite und Fußzeile', 'Seitenzahlen und eigener Text sind freiwillig – ohne Angaben bleibt die Fußzeile leer.') + `
    ${fieldHTML({ k: 'footText', label: 'Eigener Text in der Fußzeile', type: 'text' }, s.footText || '')}
    ${fieldHTML({ k: 'pnFmt', label: 'Seitenzahlen', type: 'select', opts: RD.PN_FORMATS }, s.pnFmt || '')}
    ${fieldHTML({ k: 'brandFoot', label: '„© 2026 theisapps“ in der Fußzeile', type: 'toggle' }, !!s.brandFoot)}
    ${fieldHTML({ k: 'orient', label: 'Format', type: 'seg', opts: [['hoch', 'A4 hoch'], ['quer', 'A4 quer']] }, s.orient || 'hoch')}
    ${fieldHTML({ k: 'margin', label: 'Seitenränder', type: 'seg', opts: [['schmal', 'schmal'], ['normal', 'normal'], ['breit', 'breit']] }, s.margin || 'normal')}
    ${fieldHTML({ k: 'frame', label: 'Seitenrahmen', type: 'select', opts: RD.FRAMES }, s.frame || 'none')}<button class="tb mini" type="button" data-frdlg style="margin:-4px 0 10px">Rahmen mit Vorschau aussuchen …</button>
    <div class="btnCol" style="margin-top:8px"><button class="tb ghost" type="button" id="backDoc">← Alle Material-Einstellungen</button></div></div>`;
  $('#hideR').onclick = () => { UI.right = false; saveUI(); applySides(); };
  bindFields(el, d, false, () => d.settings); $('#backDoc').onclick = () => { zone = null; renderPages(); renderRight(); };
}
function renderMultiPanel(el) {
  const list = selectedItems(); const tasks = list.filter(x => RD.TASK.has(x.type));
  el.innerHTML = panelHead(list.length + ' Bausteine ausgewählt', `Mit ${MOD}/Umschalt + Klick weitere Bausteine hinzufügen oder abwählen. Esc hebt die Auswahl auf.`) + `
    <div class="btnCol mselBar"><button class="tb" data-ma="dup">${ICO.copy} Duplizieren</button><button class="tb" data-ma="copy">Kopieren (auch in andere Tabs)</button><button class="tb" data-ma="renew">${ICO.dice} Neue Aufgaben erzeugen</button><button class="tb" data-ma="home">⤺ Position zurücksetzen</button><button class="tb" data-ma="del" style="color:var(--bad)">${ICO.trash} Löschen</button></div>
    <div class="sec">Für alle ausgewählten</div>
    <div class="field"><span>Schrift der Arbeitsanweisung</span>${FontUI.button('mI', '', { k: 'fontI', inheritLabel: 'Wie das Blatt' })}</div>
    <div class="field"><span>Schrift des Aufgabeninhalts</span>${FontUI.button('mC', '', { k: 'fontC', inheritLabel: 'Wie das Blatt' })}</div>
    ${cur.kind === 'probe' && tasks.length ? `<label class="field"><span>Punkte je Aufgabe</span><input type="number" id="mPts" min="0" max="100" step=".5" placeholder="z. B. 4"></label>` : ''}
    <label class="trow"><span>Nummerieren</span><input type="checkbox" class="sw" id="mNum" ${tasks.every(x => x.numbered !== false) ? 'checked' : ''}></label></div>`;
  $('#hideR').onclick = () => { UI.right = false; saveUI(); applySides(); };
  $$('[data-ma]', el).forEach(b => b.onclick = () => multiAction(b.dataset.ma));
  FontUI.bind(el, (k, key) => change(() => list.forEach(x => { if (key) { x[k] = key; delete x.font; } else delete x[k]; }), null, { panel: true }));
  const mp = $('#mPts', el); if (mp) mp.onchange = () => { if (mp.value === '') return; change(() => tasks.forEach(x => { x.points = +mp.value; }), null, { panel: true }); };
  $('#mNum', el).onchange = e => change(() => tasks.forEach(x => { x.numbered = e.target.checked; }), null, { panel: true });
}

/* ---------- Kopfzeilen-Baukasten ---------- */
const HC_TYPES = [['field', 'Feld mit Linie'], ['text', 'Eigener Text'], ['auto', 'Automatisch'], ['box', 'Kästchen (z. B. Note)'], ['logo', 'Bild / Schullogo'], ['space', 'Leerraum']];
const HC_AUTO = [['art', 'Art + Nr. + Fach (z. B. Schulaufgabe Nr. 1 in Mathematik)'], ['titel', 'Titel des Materials'], ['fach', 'Fach'], ['jg', 'Jahrgangsstufe'], ['thema', 'Thema'], ['punkte', 'Punkte: __ / gesamt'], ['heute', 'Heutiges Datum']];
const HC_W = [['auto', 'automatisch'], ['s', 'schmal'], ['m', 'mittel'], ['b', 'breit']];
const HC_STYLE = [['', 'normal'], ['b', 'fett'], ['big', 'groß, fett'], ['r', 'rechtsbündig'], ['c', 'mittig']];
function defaultHeadCustom(s) {
  const f = Array.isArray(s.headFields) && s.headFields.length ? s.headFields : ['name', 'datum', 'klasse'];
  const bx = s.headLook === 'kaestchen';
  return { border: s.headStyle === 'kasten' ? 'box' : 'none', rows: [{ cells: f.filter(k => RD.HEAD_FIELDS[k]).map(k => ({ t: bx || k === 'note' ? 'box' : 'field', label: RD.HEAD_FIELDS[k][0], wk: 'auto' })) }] };
}
function headBuilderDialog() {
  const s = cur.settings; let H = JSON.parse(JSON.stringify(s.headCustom && Array.isArray(s.headCustom.rows) ? s.headCustom : defaultHeadCustom(s)));
  const styleOf = c => c.size > 1 ? 'big' : c.bold ? 'b' : c.align === 'right' ? 'r' : c.align === 'center' ? 'c' : '';
  const setStyle = (c, v) => { delete c.bold; delete c.size; delete c.align; if (v === 'b') c.bold = true; if (v === 'big') { c.bold = true; c.size = 1.2; } if (v === 'r') c.align = 'right'; if (v === 'c') c.align = 'center'; };
  dialog({ title: 'Kopfzeile selbst gestalten', wide: true, closeLabel: 'Abbrechen', html: `
    <p class="hint" style="margin-top:0">Baue die Kopfzeile aus Zeilen und Elementen. Bei <b>Breite „automatisch“</b> bekommt jedes Element passend Platz (Name breit, Note schmal). Die Vorschau zeigt das Ergebnis.</p>
    <div class="hcPrev" id="hcPrev"></div>
    <div class="inline" style="margin:12px 0;gap:10px;align-items:center"><span class="hint" style="margin:0">Umrandung</span><select id="hcBorder" style="border:1px solid var(--hairline);border-radius:9px;padding:6px 10px;background:var(--panel-2)">${[['none', 'keine'], ['box', 'Rahmen'], ['lines', 'Linien oben und unten'], ['shade', 'farbig hinterlegt']].map(([a, b]) => `<option value="${a}">${b}</option>`).join('')}</select><span class="sp"></span><span class="hint" style="margin:0">Alle Felder als</span><button class="tb" id="hcAllLine" type="button">Linie</button><button class="tb" id="hcAllBox" type="button">Kästchen</button><button class="tb" id="hcAddRow" type="button">+ Zeile</button></div>
    <div class="hcEd" id="hcEd"></div>
    <div class="dlgBtns"><button class="tb" data-x2>Abbrechen</button><button class="tb primary" id="hcOk">Übernehmen</button></div>`,
    onOpen: (dl, close) => {
      const ed = $('#hcEd', dl), prev = $('#hcPrev', dl); $('#hcBorder', dl).value = H.border || 'none';
      const preview = () => {
        const tmp = { ...cur, settings: { ...cur.settings, headStyle: 'eigen', headCustom: H, header: true } };
        const head = RD.blocks(tmp).find(b => b.head);
        const W = prev.clientWidth - 20, sc = Math.min(1, W / (RD.dims(cur).w * MM));
        prev.innerHTML = `<div style="height:${Math.ceil(70 * MM * sc)}px;overflow:hidden"><div class="page" style="${RD.pageVars(cur)};height:70mm;transform:scale(${sc});transform-origin:top left;box-shadow:none"><div class="pc" style="left:${RD.dims(cur).m}mm;right:${RD.dims(cur).m}mm;top:6mm">${head ? head.html : ''}</div></div></div>`;
      };
      const draw = () => {
        ed.innerHTML = H.rows.map((r, ri) => `<div class="hcRow" data-r="${ri}"><div class="hcRowHead"><b>Zeile ${ri + 1}</b><span class="sp"></span><button class="tb ghost" data-rup ${ri ? '' : 'disabled'}>↑</button><button class="tb ghost" data-rdn ${ri < H.rows.length - 1 ? '' : 'disabled'}>↓</button><button class="tb ghost" data-radd>+ Element</button><button class="tb ghost" data-rdel style="color:var(--bad)">Zeile entfernen</button></div>
          <div class="hcCells">${(r.cells || []).length ? '<div class="hcCell hcLab"><span>Element</span><span>Inhalt</span><span>Breite</span><span>Stil / Höhe</span><span></span></div>' : ''}${(r.cells || []).map((c, ci) => `<div class="hcCell" data-c="${ci}"><select data-ct>${HC_TYPES.map(([a, b]) => `<option value="${a}" ${a === c.t ? 'selected' : ''}>${b}</option>`).join('')}</select>
            ${c.t === 'auto' ? `<select data-cv>${HC_AUTO.map(([a, b]) => `<option value="${a}" ${a === c.what ? 'selected' : ''}>${b}</option>`).join('')}</select>` : c.t === 'logo' ? `<button class="tb" data-cimg type="button">${c.src ? 'Anderes Bild …' : 'Bild wählen …'}</button>` : c.t === 'space' ? '<span></span>' : `<input type="text" data-cv value="${esc(c.t === 'text' ? c.text || '' : c.label || '')}" placeholder="${c.t === 'text' ? 'Text, z. B. Schulname' : 'Beschriftung, z. B. Name'}">`}
            <select data-cw title="Breite">${!c.wk && +c.w > 0 ? '<option value="x" selected>wie bisher</option>' : ''}${HC_W.map(([a, b]) => `<option value="${a}" ${a === c.wk ? 'selected' : ''}>${b}</option>`).join('')}</select>
            ${c.t === 'logo' ? `<input type="number" data-ch min="5" max="40" value="${+c.h || 12}" title="Höhe des Bilds (mm)">` : `<select data-cs>${HC_STYLE.map(([a, b]) => `<option value="${a}" ${a === styleOf(c) ? 'selected' : ''}>${b}</option>`).join('')}</select>`}
            <span style="display:flex;gap:2px"><button class="collapse" data-cl title="nach links" ${ci ? '' : 'disabled'}>‹</button><button class="collapse" data-cr title="nach rechts" ${ci < r.cells.length - 1 ? '' : 'disabled'}>›</button><button class="collapse" data-cdel title="Element entfernen">${ICO.trash}</button></span></div>`).join('') || '<p class="hint" style="margin:0">Noch leer – „+ Element“.</p>'}</div></div>`).join('') || '<p class="hint">Noch keine Zeile – „+ Zeile“.</p>';
        $$('.hcRow', ed).forEach(rowEl => {
          const r = H.rows[+rowEl.dataset.r]; const ri = +rowEl.dataset.r;
          rowEl.querySelector('[data-rup]').onclick = () => { [H.rows[ri - 1], H.rows[ri]] = [H.rows[ri], H.rows[ri - 1]]; draw(); };
          rowEl.querySelector('[data-rdn]').onclick = () => { [H.rows[ri + 1], H.rows[ri]] = [H.rows[ri], H.rows[ri + 1]]; draw(); };
          rowEl.querySelector('[data-radd]').onclick = () => { r.cells.push({ t: 'field', label: 'Name', wk: 'auto' }); draw(); };
          rowEl.querySelector('[data-rdel]').onclick = () => { H.rows.splice(ri, 1); draw(); };
          $$('.hcCell[data-c]', rowEl).forEach(ce => {
            const ci = +ce.dataset.c, c = r.cells[ci];
            ce.querySelector('[data-ct]').onchange = e => { const t = e.target.value; const keep = c.wk ? { wk: c.wk } : { w: c.w }; Object.keys(c).forEach(k => delete c[k]); Object.assign(c, keep, { t }, t === 'field' ? { label: 'Name' } : t === 'box' ? { label: 'Note' } : t === 'auto' ? { what: 'art' } : t === 'text' ? { text: '' } : t === 'logo' ? { h: 12 } : {}); draw(); };
            const cv = ce.querySelector('[data-cv]'); if (cv) cv[cv.tagName === 'SELECT' ? 'onchange' : 'oninput'] = e => { if (c.t === 'auto') c.what = e.target.value; else if (c.t === 'text') c.text = e.target.value; else c.label = e.target.value; preview(); };
            ce.querySelector('[data-cw]').onchange = e => { if (e.target.value !== 'x') c.wk = e.target.value; preview(); };
            const ch = ce.querySelector('[data-ch]'); if (ch) ch.oninput = e => { c.h = +e.target.value || 12; preview(); };
            const cs = ce.querySelector('[data-cs]'); if (cs) cs.onchange = e => { setStyle(c, e.target.value); preview(); };
            const ci2 = ce.querySelector('[data-cimg]'); if (ci2) ci2.onclick = async () => { const src = await BildUI.pick(); if (src) { c.src = src; draw(); } };
            ce.querySelector('[data-cl]').onclick = () => { [r.cells[ci - 1], r.cells[ci]] = [r.cells[ci], r.cells[ci - 1]]; draw(); };
            ce.querySelector('[data-cr]').onclick = () => { [r.cells[ci + 1], r.cells[ci]] = [r.cells[ci], r.cells[ci + 1]]; draw(); };
            ce.querySelector('[data-cdel]').onclick = () => { r.cells.splice(ci, 1); draw(); };
          });
        });
        preview();
      };
      $('#hcBorder', dl).onchange = e => { H.border = e.target.value; preview(); };
      $('#hcAddRow', dl).onclick = () => { H.rows.push({ cells: [{ t: 'field', label: 'Name', wk: 'auto' }, { t: 'field', label: 'Datum', wk: 'auto' }] }); draw(); };
      const allAs = t => { H.rows.forEach(r => (r.cells || []).forEach(c => { if (c.t === 'field' || c.t === 'box') c.t = t; })); draw(); };
      $('#hcAllLine', dl).onclick = () => allAs('field'); $('#hcAllBox', dl).onclick = () => allAs('box');
      dl.querySelector('[data-x2]').onclick = () => close(null);
      $('#hcOk', dl).onclick = () => { close(true); change(() => { cur.settings.headStyle = 'eigen'; cur.settings.headCustom = H; cur.settings.header = true; delete cur.settings.layoutId; }, null, { panel: true }); toast('Kopfzeile übernommen. Tipp: „Dieses Layout speichern“, um sie wiederzuverwenden.', 3600); };
      draw();
    } });
}
/* ---------- eigenes Layout speichern ---------- */
function saveLayoutDialog() {
  dialog({ title: 'Layout speichern', html: `<p class="hint" style="margin-top:0">Speichert Kopfzeile, Titel, Rahmen, Ränder und Fußzeile dieses Blatts als eigenes Layout. Inhalte werden nicht gespeichert.</p>
    <label class="field"><span>Name</span><input type="text" id="lyName" placeholder="z. B. Meine Schulaufgabe" value=""></label>
    <label class="trow"><span>Als Standard für neue Materialien (Grundschule)</span><input type="checkbox" class="sw" id="lyP"></label>
    <label class="trow"><span>Als Standard für neue Materialien (ab Klasse 5)</span><input type="checkbox" class="sw" id="lyS"></label>`,
    buttons: [{ label: 'Abbrechen', value: false }, { label: 'Speichern', primary: true, value: true }],
    onOpen: dl => { $('#lyName', dl).focus(); saveLayoutDialog.dl = dl; } }).then(async ok => {
      if (!ok) return; const dl = saveLayoutDialog.dl; const name = $('#lyName', dl).value.trim() || 'Mein Layout';
      const set = {}; LAYOUT_KEYS.forEach(k => { if (cur.settings[k] !== undefined) set[k] = JSON.parse(JSON.stringify(cur.settings[k])); });
      const id = rid('ly-', 4); const layouts = [...(ST.layouts || []), { id, name, set }];
      const presets = JSON.parse(JSON.stringify(ST.presets || {}));
      if ($('#lyP', dl).checked) presets.primar = { ...(presets.primar || {}), layout: id };
      if ($('#lyS', dl).checked) presets.sek = { ...(presets.sek || {}), layout: id };
      ST = await N.setCfg({ layouts, presets }); change(() => { cur.settings.layoutId = id; }, null, { panel: true });
      toast(`Layout „${name}“ gespeichert.`);
    });
}
/* ---------- eigenes Material als Vorlage ---------- */
function saveTemplateDialog() {
  dialog({ title: 'Als eigene Vorlage speichern', html: `<p class="hint" style="margin-top:0">Die Vorlage erscheint unter „Vorlagen → Meine Vorlagen“. Beim Verwenden entsteht jedes Mal eine eigene Kopie – mit frisch erzeugten Aufgaben, wo das möglich ist. Dein Material bleibt unverändert.</p>
    <label class="field"><span>Name der Vorlage</span><input type="text" id="tpName" value="${esc(cur.title)}"></label>`,
    buttons: [{ label: 'Abbrechen', value: false }, { label: 'Als Vorlage speichern', primary: true, value: true }],
    onOpen: dl => { saveTemplateDialog.dl = dl; } }).then(async ok => {
      if (!ok) return; await flush(); const c = cloneDoc(cur, $('#tpName', saveTemplateDialog.dl).value.trim() || cur.title); c.tpl = true; docs.set(c.id, c); markDirty(c); await flush();
      toast('Als Vorlage gespeichert – zu finden unter „Vorlagen → Meine Vorlagen“.', 3600);
    });
}
function useTemplate(t) {
  const c = cloneDoc(t, t.title); delete c.tpl; c.tags = (c.tags || '').replace(/\s*Meine Vorlage,?\s*/g, '');
  c.items.forEach(it => { if (canNew(it) && !['choice', 'gaps', 'match', 'vocab'].includes((T(it.type) || {}).gen)) { renew(it); } });
  return c;
}

/* ---------- Seite einrichten (wie in Word: Format, Ränder, Rahmen, Kopf- und Fußzeile an einer Stelle) ---------- */
function pageSetupDialog() {
  if (!cur) return;
  dialog({ title: 'Seite einrichten', wide: true, html: '<div class="psBox" id="psBox"></div>', onOpen: (dl, close) => {
    const box = dl.querySelector('#psBox');
    const draw = () => {
      const s = cur.settings;
      box.innerHTML = `<div class="props psGrid">
        <div><div class="sec">Papier</div>
        ${fieldHTML({ k: 'orient', label: 'Format', type: 'seg', opts: [['hoch', 'A4 hoch'], ['quer', 'A4 quer']] }, s.orient || 'hoch')}
        ${fieldHTML({ k: 'margin', label: 'Seitenränder', type: 'seg', opts: [['schmal', 'schmal'], ['normal', 'normal'], ['breit', 'breit']] }, s.margin || 'normal')}
        ${fieldHTML({ k: 'frame', label: 'Seitenrahmen', type: 'select', opts: RD.FRAMES }, s.frame || 'none')}<button class="tb mini" type="button" data-frdlg style="margin:-4px 0 10px">Rahmen mit Vorschau aussuchen …</button>
        ${fieldHTML({ k: 'numbering', label: 'Aufgaben nummerieren', type: 'toggle' }, s.numbering !== false)}</div>
        <div><div class="sec">Kopfzeile</div>
        ${fieldHTML({ k: 'header', label: 'Kopfzeile (Name, Datum, Klasse …)', type: 'toggle' }, s.header !== false)}
        ${fieldHTML({ k: 'showTitle', label: 'Titel auf dem Blatt zeigen', type: 'toggle' }, s.showTitle !== false)}
        <button class="tb" type="button" id="psHead">Kopf und Titel genauer einstellen …</button>
        <div class="sec" style="margin-top:14px">Fußzeile</div>
        ${fieldHTML({ k: 'pnFmt', label: 'Seitenzahlen', type: 'select', opts: RD.PN_FORMATS }, s.pnFmt || '')}
        ${fieldHTML({ k: 'footText', label: 'Eigener Text in der Fußzeile', type: 'text', plain: true }, s.footText || '')}
        ${fieldHTML({ k: 'brandFoot', label: '„© 2026 theisapps“ in der Fußzeile', type: 'toggle' }, !!s.brandFoot)}</div></div>
        <p class="hint" style="margin-top:6px">Änderungen siehst du sofort auf dem Blatt. Kopf- und Fußzeile lassen sich auch direkt auf dem Blatt anklicken.</p>`;
      bindFields(box, cur, false, () => cur.settings);
      box.querySelector('#psHead').onclick = () => { close(); selectZone('head'); };
    };
    draw();
    box.addEventListener('change', e => { if (e.target.matches('select,input[type=checkbox]')) setTimeout(draw, 30); });
    box.addEventListener('click', e => { if (e.target.closest('[data-seg] button')) setTimeout(draw, 30); });
  } });
}
