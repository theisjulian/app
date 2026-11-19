/* Foliva – Formatleiste oben (wie in Word) · © 2026 theis
   Ziel der Leiste:
   – Text wird auf dem Blatt bearbeitet (Doppelklick): Schrift, Größe, Farbe, F/K/U, hoch/tief wirken auf die Markierung.
     Ohne Markierung: auf das Wort am Cursor bzw. auf das, was man als Nächstes tippt (wie in Word).
   – Ein Element ist nur ausgewählt (Klick): alles wirkt auf den ganzen Text des Elements
     (Überschrift, Text, Arbeitsanweisung einer Aufgabe, Titel des Blatts).
   – Markierung in einem Textfeld rechts: F/K/U/hoch/tief setzen bzw. entfernen die Kurzschrift.
   Alles läuft über change() bzw. den Verlauf der Bearbeitung → Rückgängig funktioniert immer. */
'use strict';
const FmtTop = (() => {
  const RT = window.FolivaRT;
  const SIZES = [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 60, 72];
  const COLORS = [['#111111', 'Schwarz'], ['#5f6368', 'Grau'], ['#c8102e', 'Rot'], ['#e8710a', 'Orange'], ['#b8860b', 'Ocker'], ['#0a7d32', 'Grün'], ['#1f6feb', 'Blau'], ['#1a3c8f', 'Dunkelblau'], ['#7b3fb8', 'Lila'], ['#8b5a2b', 'Braun']];
  const I = p => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">${p}</svg>`;
  const IC = {
    left: I('<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>'), center: I('<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>'), right: I('<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>'), justify: I('<path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>'),
    ul: I('<circle cx="5" cy="7" r="1" fill="currentColor"/><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="5" cy="17" r="1" fill="currentColor"/><path d="M9 7h11M9 12h11M9 17h11"/>'),
    ol: I('<path d="M9 7h11M9 12h11M9 17h11"/><path d="M4 5.5 5 5v4M4 14.2c.3-.6 1.8-.8 1.8.2 0 .8-1.8 1.4-1.8 2.6h2" stroke-width="1.2"/>'),
    caret: '<svg viewBox="0 0 10 10" width="9" height="9" aria-hidden="true"><path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  };
  let lastColor = '#c8102e'; try { lastColor = localStorage.getItem('foliva.lastColor') || lastColor; } catch (e) { }

  /* ---------- Ziel bestimmen ---------- */
  const isDoc = c => c && c.doc;
  function ctx() {
    if (typeof cur === 'undefined' || !cur || typeof view !== 'undefined' && view !== 'editor') return null;
    if (editing) return make(editing.obj === cur && editing.prop === 'title' ? null : editing.obj, editing.prop, RichEdit.inst);
    const rf = RichField.current();
    if (rf && sel) { const o = cur.items.find(x => x.id === sel); if (o) { const c = make(o, rf.el.dataset.k, rf); c.label = 'Textfeld „' + ((C.TYPES[o.type].props.find(p => p.k === rf.el.dataset.k) || {}).label || '') + '“'; return c; } }
    if (msel.size > 1) return null;
    if (sel) {
      const o = cur.items.find(x => x.id === sel); if (!o) return null;
      const prop = (o.type === 'heading' || o.type === 'text') ? 'text' : RD.TASK.has(o.type) ? 'title' : null;
      return make(o, prop, false);
    }
    if (zone === 'head' && cur.settings.showTitle !== false) return make(null, 'title', false);
    return null;
  }
  function make(o, prop, inst) {
    const edit = !!inst; const doc = !o; const t = doc ? 'doctitle' : o.type;
    const el = edit ? inst.el : prop ? document.querySelector(doc ? '#pages [data-edit="doctitle"]' : `#pages .it[data-id="${o.id}"] [data-edit="${prop}"]`) : null;
    const label = doc ? 'Titel des Blatts' : t === 'heading' ? 'Überschrift' : t === 'text' ? 'Text' : RD.TASK.has(t) ? 'Arbeitsanweisung' : (C.TYPES[t] ? C.TYPES[t].name : '');
    const fontKey = doc ? 'fontT' : t === 'heading' ? 'font' : RD.TASK.has(t) ? 'fontI' : 'fontC';
    const sizeProp = !doc && (t === 'heading' || t === 'text');
    const defBold = inst ? inst.defBold : el ? (parseInt(getComputedStyle(el).fontWeight, 10) || 400) >= 600 : false;
    const textField = !!(el && prop);
    return { doc, o: doc ? cur : o, type: t, prop, el, edit, inst, label, fontKey, sizeProp, defBold, textField, panel: !!(inst && inst !== RichEdit.inst) };
  }
  const markupOf = c => fieldMarkup(c.o, c.prop);
  const fontVal = c => c.doc ? (cur.settings.fontT || '') : (c.o[c.fontKey] || (c.fontKey === 'fontC' || c.fontKey === 'fontI' ? c.o.font : '') || '');
  /* Standardgröße des Elements (pt) */
  function defSize(c) {
    if (c.sizeProp && +c.o.size) return +c.o.size;
    if (c.type === 'heading') return 20;
    const sheetEl = c.panel ? document.querySelector(`#pages .it[data-id="${c.o.id}"] [data-edit="${c.prop}"]`) : c.el;
    if (sheetEl) { const px = parseFloat(getComputedStyle(sheetEl).fontSize); if (px) return Math.round(px * .75 * 2) / 2; }
    return +cur.settings.size || 14;
  }
  /* ---------- Zustand ---------- */
  function state(c) {
    const st = { b: false, i: false, u: false, sup: false, sub: false, f: '', s: '', c: '' };
    if (!c) return st;
    if (c.edit) {
      const r = c.inst.state(); if (r) Object.assign(st, r);
      st.f = r && r.f === null ? null : (r && r.f ? RD.fontKeyFromName(r.f) : fontVal(c));
      st.s = r && r.s === null ? null : (r && r.s ? +r.s : (c.sizeProp && +c.o.size) || defSize(c));
      return st;
    }
    st.f = fontVal(c);
    if (c.textField) {
      const runs = RT.parse(markupOf(c)); const L = RT.units(runs);
      if (L) { ['b', 'i', 'u', 'sup', 'sub'].forEach(k => { st[k] = RT.stateIn(runs, 0, L, k, c.defBold); }); }
      else st.b = c.defBold;
      if (c.sizeProp) st.s = +c.o.size || defSize(c);
      else { const v = L ? RT.valueIn(runs, 0, L, 's') : ''; st.s = v === null ? null : v ? +v : defSize(c); }
    } else if (c.sizeProp) st.s = +c.o.size || defSize(c);
    return st;
  }

  /* ---------- Aktionen ---------- */
  const whole = (c, key, val) => change(() => {
    const runs = RT.parse(markupOf(c)); const L = RT.units(runs); if (!L) return;
    setFieldMarkup(c.o, c.prop, RT.serialize(RT.apply(runs, 0, L, key, val, c.defBold)), true);
  }, null, { panel: true, top: isDoc(c) });
  function cmd(k) {
    const c = ctx(); if (!c) return hint();
    if (c.edit) { c.inst.apply(k); return; }
    if (!c.textField) return hint(c);
    if (k === 'sup' || k === 'sub') return toast('Hoch- und Tiefstellen wirkt auf markierten Text: auf dem Blatt doppelklicken und Text markieren.', 3400);
    whole(c, k);
  }
  function hint(c) { toast(c ? `„${c.label}“ hat keinen Text zum Formatieren.` : 'Zum Formatieren einen Text auf dem Blatt anklicken – oder doppelklicken und Text markieren.', 3200); }
  function setFont(key) {
    const c = ctx(); if (!c) return hint();
    if (c.edit) { c.inst.refocus(); c.inst.apply('f', key); return; }
    change(() => {
      if (c.doc) { if (key) cur.settings.fontT = key; else delete cur.settings.fontT; }
      else { const o = c.o; if (key) o[c.fontKey] = key; else delete o[c.fontKey]; if (c.fontKey !== 'font' && o.font) { const other = c.fontKey === 'fontC' ? 'fontI' : 'fontC'; if (!o[other]) o[other] = o.font; delete o.font; } }
      if (c.textField) { const runs = RT.parse(markupOf(c)); const L = RT.units(runs); if (L) setFieldMarkup(c.o, c.prop, RT.serialize(RT.apply(runs, 0, L, 'f', '')), true); }
    }, null, { panel: true });
  }
  function setSize(v) {
    const c = ctx(); if (!c) return hint();
    if (c.edit) { c.inst.refocus(); c.inst.apply('s', v || ''); return; }
    if (c.sizeProp) change(() => { if (v) c.o.size = v; else delete c.o.size; if (c.textField) { const runs = RT.parse(markupOf(c)); const L = RT.units(runs); if (L) setFieldMarkup(c.o, c.prop, RT.serialize(RT.apply(runs, 0, L, 's', '')), true); } }, null, { panel: true });
    else if (c.textField) whole(c, 's', v || '');
    else hint(c);
  }
  function setColor(v) {
    if (v) { lastColor = v; try { localStorage.setItem('foliva.lastColor', v); } catch (e) { } }
    const c = ctx(); if (!c) return hint();
    if (c.edit) { c.inst.refocus(); c.inst.apply('c', v || ''); }
    else if (wholeItem(c)) change(() => {
      /* ganzer Baustein ausgewählt: alle Texte und Zahlen färben; Farben einzelner Wörter in der Anweisung weichen der neuen Farbe */
      if (v) c.o.tcol = v; else delete c.o.tcol;
      if (c.textField) { const runs = RT.parse(markupOf(c)); const L = RT.units(runs); if (L) setFieldMarkup(c.o, c.prop, RT.serialize(RT.apply(runs, 0, L, 'c', '')), true); }
    }, null, { panel: true });
    else if (c.textField) whole(c, 'c', v || '');
    else hint(c);
    update();
  }
  /* Ganzer Baustein (nicht Überschrift/Text, die sind selbst nur Text) */
  const wholeItem = c => c && !c.doc && !c.edit && !c.panel && c.o && c.o.id && c.type !== 'heading' && c.type !== 'text' && c.type !== 'break';
  /* Ausrichtung: Titel des Blatts, Bausteine mit eigener Ausrichtung, sonst der Inhalt des ganzen Bausteins */
  const alignKind = c => !c ? '' : c.doc ? 'title' : !c.o || c.type === 'break' ? '' : C.TYPES[c.type] && C.TYPES[c.type].props.some(p => p.k === 'align') ? 'prop' : 'calign';
  const alignOk = c => !!alignKind(c);
  const alignVal = c => { const k = alignKind(c); if (k === 'title') { const s = cur.settings; return s.titleAlign || (s.titleStyle === 'left' || s.titleStyle === 'line' ? 'left' : 'center'); } if (k === 'prop') return c.o.align || 'left'; if (k === 'calign') return c.o.calign || 'left'; return ''; };
  function setAlign(a) {
    const c = ctx(); const k = alignKind(c); if (!k) return toast('Zum Ausrichten einen Baustein oder den Titel anklicken.');
    if (k === 'prop') return setProp('align', a);
    withEditPaused(() => change(() => { if (k === 'title') { if (a === 'justify') return; cur.settings.titleAlign = a; } else { if (a === 'left' || a === 'justify') delete c.o.calign; else c.o.calign = a; } }, null, { panel: true, top: k === 'title' }));
  }
  function setProp(k, v) { const c = ctx(); if (!c || c.doc) return; withEditPaused(() => change(() => { if (v === '' || v == null) delete c.o[k]; else c.o[k] = v; }, null, { panel: true })); }
  function listToggle(kind) {
    const c = ctx(); if (!c || c.type !== 'text') return toast('Aufzählungen gibt es im Baustein „Text“.');
    if (c.edit) { c.inst.listToggle(kind); return; }
    const o = c.o; const re = /^(•\s|\d+\.\s)/;
    change(() => { const lines = String(o.text || '').split('\n'); const all = lines.filter(l => l.trim()).every(l => kind === 'ul' ? /^•\s/.test(l) : /^\d+\.\s/.test(l)); let n = 0; o.text = lines.map(l => { if (!l.trim()) return l; const base = l.replace(re, ''); return all ? base : (kind === 'ul' ? '• ' : (++n) + '. ') + base; }).join('\n'); }, null, { panel: true });
  }

  /* ---------- Farbauswahl ---------- */
  let pop = null;
  function closePop() { if (pop) { pop.remove(); pop = null; } }
  function openPop(btn) {
    if (pop) return closePop();
    const c0 = ctx(); if (c0 && c0.inst) c0.inst.save();
    pop = document.createElement('div'); pop.className = 'clrPop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Schriftfarbe');
    pop.innerHTML = `<button type="button" class="clrAuto" data-c="">Automatisch (schwarz)</button><div class="clrGrid">${COLORS.map(([v, n]) => `<button type="button" data-c="${v}" title="${n}" aria-label="${n}" style="--c:${v}"></button>`).join('')}</div>`;
    document.body.appendChild(pop);
    const r = btn.getBoundingClientRect(); pop.style.left = Math.max(8, Math.min(innerWidth - 230, r.left)) + 'px'; pop.style.top = (r.bottom + 4) + 'px';
    pop.querySelectorAll('button').forEach(b => { b.addEventListener('mousedown', e => e.preventDefault()); b.onclick = () => { closePop(); setColor(b.dataset.c); }; });
  }
  document.addEventListener('pointerdown', e => { if (pop && !pop.contains(e.target) && !e.target.closest('#ftClrMore')) closePop(); }, true);
  window.addEventListener('keydown', e => { if (pop && e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closePop(); const c = ctx(); if (c && c.inst) c.inst.refocus(); } }, true);

  /* ---------- Leiste aufbauen (einmal) und Zustand aktualisieren ---------- */
  function build(bar) {
    const tip = (t, k) => `${t}${k ? ` (${MOD}+${k})` : ''}`;
    bar.innerHTML = `<div class="ftGrp"><select id="ftFont" title="Schriftart" aria-label="Schriftart"></select>
      <select id="ftSize" title="Schriftgröße (pt)" aria-label="Schriftgröße"></select></div>
      <div class="ftGrp"><button type="button" data-ft="b" title="${tip('Fett', 'B')}" aria-label="Fett"><b>F</b></button><button type="button" data-ft="i" title="${tip('Kursiv', 'I')}" aria-label="Kursiv"><i>K</i></button><button type="button" data-ft="u" title="${tip('Unterstrichen', 'U')}" aria-label="Unterstrichen"><u>U</u></button><button type="button" data-ft="sup" title="Hochgestellt (markierten Text)" aria-label="Hochgestellt">x<sup>2</sup></button><button type="button" data-ft="sub" title="Tiefgestellt (markierten Text)" aria-label="Tiefgestellt">x<sub>2</sub></button></div>
      <div class="ftGrp ftClr"><button type="button" id="ftClr" title="Schriftfarbe" aria-label="Schriftfarbe"><span class="ftA">A</span><span class="ftBar" id="ftClrBar"></span></button><button type="button" id="ftClrMore" class="ftMore" title="Farbe wählen" aria-label="Farbe wählen">${IC.caret}</button></div>
      <div class="ftGrp">${['left', 'center', 'right', 'justify'].map(a => `<button type="button" data-al="${a}" title="${{ left: 'Linksbündig', center: 'Zentriert', right: 'Rechtsbündig', justify: 'Blocksatz' }[a]}" aria-label="${{ left: 'Linksbündig', center: 'Zentriert', right: 'Rechtsbündig', justify: 'Blocksatz' }[a]}">${IC[a]}</button>`).join('')}</div>
      <div class="ftGrp"><button type="button" data-li="ul" title="Aufzählung" aria-label="Aufzählung">${IC.ul}</button><button type="button" data-li="ol" title="Nummerierung" aria-label="Nummerierung">${IC.ol}</button>
      <select id="ftLh" title="Zeilenabstand" aria-label="Zeilenabstand">${[['', 'Abstand'], ['1', '1,0'], ['1.2', '1,2'], ['1.5', '1,5'], ['2', '2,0']].map(([a, b]) => `<option value="${a}">${b}</option>`).join('')}</select></div>
      <span class="ftHint" id="ftHint"></span><button type="button" id="ftPage" class="ftPage" title="Format (hoch/quer), Seitenränder, Rahmen, Kopf- und Fußzeile, Seitenzahlen">${I('<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M8 7h8M8 11h8M8 15h5"/>')}Seite einrichten</button>`;
    bar.dataset.built = '1'; fontSig = '';
    bar.querySelectorAll('button').forEach(b => b.addEventListener('mousedown', e => e.preventDefault()));
    bar.querySelectorAll('[data-ft]').forEach(b => b.onclick = () => { cmd(b.dataset.ft); update(); });
    bar.querySelectorAll('[data-al]').forEach(b => b.onclick = () => setAlign(b.dataset.al));
    bar.querySelectorAll('[data-li]').forEach(b => b.onclick = () => listToggle(b.dataset.li));
    bar.querySelector('#ftClr').onclick = () => setColor(lastColor);
    bar.querySelector('#ftPage').onclick = () => { if (editing) finishEdit(true); pageSetupDialog(); };
    bar.querySelector('#ftClrMore').onclick = e => openPop(e.currentTarget);
    bar.querySelectorAll('select').forEach(s => { const sv = () => { const c = ctx(); if (c && c.inst) c.inst.save(); }; s.addEventListener('mousedown', sv); s.addEventListener('keydown', e => { if (e.key === 'Escape') { const c = ctx(); if (c && c.inst) { e.preventDefault(); c.inst.refocus(); } } }); });
    const fs = bar.querySelector('#ftFont');
    fs.onchange = () => {
      const v = fs.value; if (v === '__mixed') return;
      if (v === '__more') { const c = ctx(); if (!c) return update(); FontUI.open(fs, state(c).f || '', null, key => { if (key == null) { const c2 = ctx(); if (c2 && c2.inst) c2.inst.refocus(); return update(); } setFont(key); }); return; }
      setFont(v);
    };
    const ss = bar.querySelector('#ftSize'); ss.onchange = () => { if (ss.value === '__mixed') return; setSize(ss.value ? +ss.value : ''); };
    const ls = bar.querySelector('#ftLh'); ls.onchange = () => setProp('lh', ls.value ? +ls.value : '');
  }
  let fontSig = '';
  function render() {
    const bar = document.getElementById('fmtTop'); if (!bar) return;
    if (bar.dataset.built !== '1') build(bar);
    if (document.activeElement && document.activeElement.closest && document.activeElement.closest('#fmtTop select')) return;   /* offene Auswahlliste nicht stören */
    const c = ctx(); const st = state(c);
    const can = !!c, txt = !!(c && (c.textField || c.edit));
    /* Schriftart */
    const fs = bar.querySelector('#ftFont'); const keys = Object.keys(RD.FONTS);
    const cv = st.f === null ? '__mixed' : (st.f || '');
    const sig = keys.join() + '|' + cv;
    if (sig !== fontSig) {
      const opts = [['', 'Wie das Blatt'], ...keys.map(f => [f, RD.fontLabel(f)])]; if (cv && cv !== '__mixed' && !keys.includes(cv)) opts.push([cv, RD.fontLabel(cv)]);
      fs.innerHTML = (cv === '__mixed' ? '<option value="__mixed">–</option>' : '') + opts.map(([a, b]) => `<option value="${esc(a)}">${esc(b)}</option>`).join('') + '<option value="__more">Weitere Schriften …</option>';
      fontSig = sig;
    }
    fs.value = cv; fs.disabled = !can;
    /* Schriftgröße */
    const ss = bar.querySelector('#ftSize'); const sv = st.s === null ? '__mixed' : st.s ? String(st.s) : '';
    const list = SIZES.slice(); if (sv && sv !== '__mixed' && !list.includes(+sv)) list.push(+sv); list.sort((a, b) => a - b);
    ss.innerHTML = (sv === '__mixed' ? '<option value="__mixed">–</option>' : '') + (sv === '' ? '<option value="">–</option>' : '') + list.map(n => `<option value="${n}">${String(n).replace('.', ',')}</option>`).join('');
    ss.value = sv; ss.disabled = !(c && (c.sizeProp || txt));
    /* Zeichenformate */
    bar.querySelectorAll('[data-ft]').forEach(b => { const k = b.dataset.ft; b.disabled = !txt || ((k === 'sup' || k === 'sub') && !(c && c.edit)); b.setAttribute('aria-pressed', txt && st[k] ? 'true' : 'false'); });
    bar.querySelector('#ftClr').disabled = bar.querySelector('#ftClrMore').disabled = !txt;
    bar.querySelector('#ftClrBar').style.background = lastColor;
    /* Absatz */
    const al = c && alignOk(c) ? alignVal(c) : '';
    bar.querySelectorAll('[data-al]').forEach(b => { const a = b.dataset.al; b.disabled = !(c && alignOk(c)) || (a === 'justify' && c.type !== 'text'); b.setAttribute('aria-pressed', al === a ? 'true' : 'false'); });
    const isText = c && c.type === 'text';
    bar.querySelectorAll('[data-li]').forEach(b => { b.disabled = !isText; });
    const ls = bar.querySelector('#ftLh'); ls.disabled = !isText; ls.value = isText && c.o.lh ? String(c.o.lh) : '';
    bar.querySelector('#ftHint').textContent = !c ? 'Text anklicken oder doppelklicken, um ihn zu formatieren' : c.edit ? (st.hasSel ? 'Formatiert: markierter Text' : c.panel ? c.label : `Bearbeiten: ${c.label}`) : wholeItem(c) ? `Ganzer Baustein – Farbe gilt für alles, Schrift für „${c.label}“` : `Formatiert: ${c.label} (ganz)`;
  }
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, x => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x]));
  let raf = 0;
  function update() { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); }
  document.addEventListener('selectionchange', () => { if (editing || RichField.current()) update(); });
  document.addEventListener('focusin', update); document.addEventListener('focusout', update);
  return { update, render, cmd, setFont, setSize, setColor, ctx, state };
})();
