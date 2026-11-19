/* Foliva – Text bearbeiten wie in einer Textverarbeitung · © 2026 theis
   Gilt für das Bearbeiten direkt auf dem Blatt (Doppelklick) UND für die Textfelder rechts.
   Man sieht immer die Formatierung (fett, kursiv, Farbe …) – nie Steuerzeichen.
   Jede Formatierung läuft über das Läufe-Modell (rt.js): DOM lesen → Bereich ändern → sauber neu zeichnen →
   Markierung wiederherstellen. Dadurch ist das Ergebnis immer vorhersehbar, unabhängig von Browser-Eigenheiten. */
'use strict';
const RichCore = (() => {
  const R = window.FolivaRT;

  /* ---------- DOM ↔ Läufe ---------- */
  function walk(root) {
    const runs = []; const pos = new Map(); const ends = new Map(); let n = 0;
    const push = r => { runs.push(r); n += r.raw ? 1 : r.t.length; };
    const rec = (node, a) => {
      pos.set(node, n);
      if (node.nodeType === 3) { const t = node.nodeValue.replace(/\u00A0/g, ' '); t.split(/(\n)/).forEach(p => { if (p) push({ ...a, t: p }); }); ends.set(node, n); return; }
      if (node.nodeType !== 1) { ends.set(node, n); return; }
      const el = node, tag = el.tagName;
      if (tag === 'BR') { if (!el.hasAttribute('data-tail')) push({ ...a, t: '\n' }); ends.set(node, n); return; }
      if (el.dataset && el.dataset.raw) { const r0 = R.parse(el.dataset.raw)[0]; if (r0 && r0.raw) push({ ...a, raw: r0.raw, a: r0.a, d: r0.d, t: '\uFFFC' }); else push({ ...a, t: el.textContent }); ends.set(node, n); return; }
      if (el !== root && /^(DIV|P|LI)$/.test(tag) && runs.length && runs[runs.length - 1].t !== '\n') { push({ ...a, t: '\n' }); pos.set(node, n); }
      const b = { ...a };
      if (tag === 'B' || tag === 'STRONG') { b.b = true; delete b.nb; }
      if (tag === 'I' || tag === 'EM') b.i = true;
      if (tag === 'U') b.u = true;
      if (tag === 'SUP') { b.sup = true; delete b.sub; } if (tag === 'SUB') { b.sub = true; delete b.sup; }
      if (el !== root) {
        if (el.dataset && el.dataset.st) { try { const d = JSON.parse(el.dataset.st); ['f', 'c', 's', 'nb'].forEach(k => { if (d[k]) b[k] = d[k]; }); } catch (e) { } }
        else if (el.style) {
          /* von Chrome beim Tippen erzeugte Stile: nur fett/kursiv/unterstrichen/hoch/tief übernehmen */
          const fw = el.style.fontWeight; if (fw) { if (+fw >= 600 || fw === 'bold') { b.b = true; delete b.nb; } else delete b.b; }
          if (el.style.fontStyle === 'italic') b.i = true;
          if (/underline/.test(el.style.textDecoration || el.style.textDecorationLine || '')) b.u = true;
          if (el.style.verticalAlign === 'super') { b.sup = true; delete b.sub; } else if (el.style.verticalAlign === 'sub') { b.sub = true; delete b.sup; }
        }
      }
      for (const c of el.childNodes) rec(c, b);
      ends.set(node, n);
    };
    rec(root, {});
    return { runs: R.norm(runs), pos, ends, len: n };
  }
  function pointToIndex(w, root, node, off) {
    if (!root.contains(node)) return null;
    if (node.nodeType === 3) return (w.pos.get(node) || 0) + Math.min(off, node.nodeValue.length);
    const kids = node.childNodes;
    if (off < kids.length) { const k = kids[off]; return w.pos.has(k) ? w.pos.get(k) : 0; }
    return w.ends.has(node) ? w.ends.get(node) : w.len;
  }
  function selIndexIn(el) {
    const s = window.getSelection(); if (!s.rangeCount) return null; const r = s.getRangeAt(0); if (!el.contains(r.startContainer) || !el.contains(r.endContainer)) return null;
    const w = walk(el); const a = pointToIndex(w, el, r.startContainer, r.startOffset), b = pointToIndex(w, el, r.endContainer, r.endOffset);
    return a == null || b == null ? null : { a: Math.min(a, b), b: Math.max(a, b) };
  }

  /* Ein Bearbeiter für genau ein Element */
  function create(el, opts = {}) {
    const I = { el, multi: !!opts.multi, defBold: !!opts.defBold, undo: [], redo: [], last: 0, saved: null, lastType: '', onChange: opts.onChange || null, ownUndo: opts.ownUndo !== false };
    const current = () => walk(el).runs;
    const getSel = () => selIndexIn(el);
    function indexToPoint(idx, after) {
      const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); const w = walk(el);
      let cand = null; let node;
      while ((node = tw.nextNode())) {
        if (node.parentElement && node.parentElement.closest('[data-raw]')) continue;
        const s = w.pos.get(node), e = w.ends.get(node);
        if (idx >= s && idx <= e) { if (after && idx === e) cand = [node, idx - s]; else if (!after && idx < e) return [node, idx - s]; else if (!cand) cand = [node, idx - s]; }
      }
      if (cand) return cand;
      for (const x of el.querySelectorAll('br,[data-raw]')) { const s = w.pos.get(x); if (s === idx) return [x.parentNode, [...x.parentNode.childNodes].indexOf(x)]; if (w.ends.get(x) === idx) return [x.parentNode, [...x.parentNode.childNodes].indexOf(x) + 1]; }
      return [el, el.childNodes.length];
    }
    function setSel(a, b) {
      const s = window.getSelection(); const r = document.createRange();
      try { const p1 = indexToPoint(a, a === b); const p2 = a === b ? p1 : indexToPoint(b, true); r.setStart(p1[0], p1[1]); r.setEnd(p2[0], p2[1]); s.removeAllRanges(); s.addRange(r); } catch (e) { }
    }
    function draw(runs, sel) {
      let h = R.toHtml(runs, { edit: true }); if (runs.length && runs[runs.length - 1].t === '\n') h += '<br data-tail="1">';
      el.innerHTML = h || '';
      if (sel) setSel(sel.a, sel.b);
    }
    const emit = () => { if (I.onChange) I.onChange(I.markup()); if (typeof FmtTop !== 'undefined') FmtTop.update(); };
    /* Verlauf (nur beim Bearbeiten auf dem Blatt; die Felder rechts nutzen den Verlauf des Materials) */
    const snapshot = () => ({ m: R.serialize(current(), { keepZW: true }), sel: getSel() || { a: 0, b: 0 } });
    function pushUndo(force) { if (!I.ownUndo) return; const now = Date.now(); if (!force && now - I.last < 800) { I.last = now; return; } I.last = now; I.undo.push(snapshot()); if (I.undo.length > 200) I.undo.shift(); I.redo = []; }
    function restore(sn) { draw(R.parse(sn.m), sn.sel); }
    I.undoStep = () => { if (!I.undo.length) return false; I.redo.push(snapshot()); restore(I.undo.pop()); I.last = 0; emit(); return true; };
    I.redoStep = () => { if (!I.redo.length) return false; I.undo.push(snapshot()); restore(I.redo.pop()); I.last = 0; emit(); return true; };
    const focused = () => document.activeElement === el || el.contains(document.activeElement);
    const range = () => (focused() ? getSel() : null) || I.saved || getSel() || { a: R.units(current()), b: R.units(current()) };
    I.markup = () => { let m = R.serialize(current()).replace(/\n+$/, ''); if (!I.multi) m = m.replace(/\n/g, ' '); return m; };
    I.apply = (key, val) => {
      const s = range(); if (!focused()) el.focus({ preventScroll: true }); pushUndo(true);
      let runs = current(); const { a, b } = s;
      if (a === b) {
        const wd = R.wordAt(runs, a);
        if (wd) { runs = R.apply(runs, wd[0], wd[1], key, val, I.defBold); draw(runs, { a, b }); }
        else {
          /* Cursor zwischen Wörtern: die nächste Eingabe bekommt die Formatierung (unsichtbarer Platzhalter) */
          const at = R.attrsAt(runs, a); const f = R.apply([{ ...at, t: R.ZW }], 0, 1, key, val, I.defBold)[0];
          draw(R.norm(R.insert(runs, a, f)), { a: a + 1, b: a + 1 });
        }
      } else { runs = R.apply(runs, a, b, key, val, I.defBold); draw(runs, { a, b }); }
      I.saved = null; emit();
    };
    I.state = () => {
      const runs = current(); const s = range(); const st = { hasSel: s.a !== s.b };
      ['b', 'i', 'u', 'sup', 'sub'].forEach(k => { st[k] = R.stateIn(runs, s.a, s.b, k, I.defBold); });
      ['f', 'c', 's'].forEach(k => { st[k] = R.valueIn(runs, s.a, s.b, k); });
      return st;
    };
    I.listToggle = kind => {
      pushUndo(true); const s = range();
      const lines = R.serialize(current(), { keepZW: true }).split('\n'); const re = /^(•\s|\d+\.\s)/;
      const all = lines.filter(l => l.trim()).every(l => kind === 'ul' ? /^•\s/.test(l) : /^\d+\.\s/.test(l)); let k = 0;
      const out = lines.map(l => { if (!l.trim()) return l; const base = l.replace(re, ''); return all ? base : (kind === 'ul' ? '• ' : (++k) + '. ') + base; }).join('\n');
      const runs = R.parse(out); el.focus({ preventScroll: true }); draw(runs, null); const L = R.units(runs); const p = Math.min(L, s.b + (all ? -2 : 3)); setSel(Math.max(0, p), Math.max(0, p)); emit();
    };
    I.save = () => { const s = getSel(); if (s) I.saved = s; };
    I.refocus = () => { const s = I.saved || getSel(); el.focus({ preventScroll: true }); if (s) setSel(s.a, s.b); };
    I.focusEnd = () => { el.focus({ preventScroll: true }); const L = R.units(current()); setSel(L, L); };
    I.setSel = setSel; I.getSel = getSel;
    I.load = (markup, sel) => { draw(R.parse(markup), null); if (sel) setSel(Math.min(sel.a, R.units(current())), Math.min(sel.b, R.units(current()))); };
    /* Tastatur und Eingabe */
    const onKey = e => {
      const mod = e.metaKey || e.ctrlKey, k = e.key.toLowerCase();
      if (mod && !e.altKey && ['b', 'i', 'u'].includes(k)) { e.preventDefault(); e.stopPropagation(); I.apply(k); return; }
      if (e.key === 'Enter' && !mod) {
        if (I.multi) { e.preventDefault(); e.stopPropagation(); pushUndo(true); document.execCommand('insertLineBreak'); return; }
        if (opts.onEnter) { e.preventDefault(); opts.onEnter(); }
      }
    };
    const onBefore = e => {
      const t = e.inputType || '';
      if (/^format/.test(t)) { e.preventDefault(); const m = { formatBold: 'b', formatItalic: 'i', formatUnderline: 'u', formatSuperscript: 'sup', formatSubscript: 'sub' }[t]; if (m) I.apply(m); return; }
      if (t === 'insertFromDrop') { e.preventDefault(); return; }
      if (t === 'insertParagraph') { e.preventDefault(); if (I.multi) { pushUndo(true); document.execCommand('insertLineBreak'); } return; }
      if (t === 'historyUndo' || t === 'historyRedo') { e.preventDefault(); return; }
      const del = /^delete/.test(t); pushUndo(del !== (I.lastType === 'del')); I.lastType = del ? 'del' : 'ins';
    };
    const onInput = () => emit();
    const onPaste = e => {
      e.preventDefault(); let t = (e.clipboardData && e.clipboardData.getData('text/plain')) || ''; t = t.replace(/\r/g, ''); if (!I.multi) t = t.replace(/\s*\n\s*/g, ' ');
      pushUndo(true);
      if (I.multi && t.includes('\n')) t.split('\n').forEach((p, i) => { if (i) document.execCommand('insertLineBreak'); if (p) document.execCommand('insertText', false, p); });
      else if (t) document.execCommand('insertText', false, t);
    };
    const onDrop = e => e.preventDefault();
    el.addEventListener('keydown', onKey, true); el.addEventListener('beforeinput', onBefore); el.addEventListener('input', onInput); el.addEventListener('paste', onPaste); el.addEventListener('drop', onDrop); el.addEventListener('dragover', onDrop);
    I.destroy = () => { el.removeEventListener('keydown', onKey, true); el.removeEventListener('beforeinput', onBefore); el.removeEventListener('input', onInput); el.removeEventListener('paste', onPaste); el.removeEventListener('drop', onDrop); el.removeEventListener('dragover', onDrop); };
    return I;
  }
  return { create, walk, selIndexIn };
})();

/* ---------- Bearbeiten auf dem Blatt (eine Bearbeitung zur Zeit) ---------- */
const RichEdit = (() => {
  let I = null;
  function start(el, markup, opts = {}) {
    const defBold = (parseInt(getComputedStyle(el).fontWeight, 10) || 400) >= 600;
    el.setAttribute('contenteditable', 'true'); el.spellcheck = true; el.classList.add('editing');
    I = RichCore.create(el, { multi: opts.multi, defBold, ownUndo: true });
    I.load(markup, null); el.focus({ preventScroll: true });
    const L = window.FolivaRT.units(window.FolivaRT.parse(markup)); const s = opts.sel && opts.sel.b <= L ? opts.sel : { a: 0, b: L };
    I.setSel(s.a, s.b);
    if (typeof FmtTop !== 'undefined') FmtTop.update();
  }
  function finish() {
    if (!I) return null; const m = I.markup(); I.destroy();
    I.el.removeAttribute('contenteditable'); I.el.classList.remove('editing'); I = null; return m;
  }
  return {
    start, finish, selIndexIn: RichCore.selIndexIn, _walk: RichCore.walk,
    apply: (k, v) => I && I.apply(k, v), state: () => I && I.state(), undo: () => I && I.undoStep(), redo: () => I && I.redoStep(),
    listToggle: k => I && I.listToggle(k), save: () => I && I.save(), refocus: () => I && I.refocus(),
    get active() { return !!I; }, get inst() { return I; }, get el() { return I && I.el; },
  };
})();

/* ---------- Textfelder rechts (Formatierung sichtbar, Änderung sofort im Material) ---------- */
const RichField = (() => {
  const map = new WeakMap(); let last = null;
  function bind(el, opts) {
    const I = RichCore.create(el, { multi: !!opts.multi, defBold: !!opts.defBold, ownUndo: false, onChange: opts.onChange, onEnter: () => el.blur() });
    map.set(el, I);
    el.addEventListener('focus', () => { last = el; });
    /* nach dem Verlassen sauber neu zeichnen (z. B. getipptes [[3/4]] erscheint als Bruch) */
    el.addEventListener('blur', e => { const to = e.relatedTarget; if (to && to.closest && to.closest('#fmtTop,.clrPop,dialog')) { I.save(); return; } const m = I.markup(); I.load(m, null); });
    return I;
  }
  const inst = el => el && map.get(el);
  /* aktives Feld: fokussiert oder (während eine Auswahlliste der Leiste offen ist) das zuletzt fokussierte */
  function current() {
    const a = document.activeElement;
    if (a && a.classList && a.classList.contains('rtf') && map.has(a)) return map.get(a);
    if (last && last.isConnected && a && a.closest && a.closest('#fmtTop,.clrPop,dialog') && map.has(last)) return map.get(last);
    return null;
  }
  return { bind, inst, current, focusEnd: el => { const I = map.get(el); if (I) I.focusEnd(); } };
})();
