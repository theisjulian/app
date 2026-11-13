/* Foliva – Textauszeichnung (Rich Text) · © 2026 theis
   Ein Text wird intern als „Läufe“ (runs) verarbeitet: zusammenhängende Zeichen mit gleichen Eigenschaften.
   Gespeichert wird weiter die bekannte, gut lesbare Kurzschrift:
     **fett**  //kursiv//  __unterstrichen__  x^{2}  H_{2}O  [[3/4]]  √{16}
     {{Schriftname|Text}}  {{#c8102e|Text}}  {{16pt|Text}}  {{-b|Text}} (nicht fett)  – kombinierbar: {{#c8102e;16pt;Arial|Text}}
   parse() liest die Kurzschrift (auch alte Bestände), serialize() schreibt sie immer in derselben, flachen Form,
   toHtml() zeigt sie an. So bleibt der gespeicherte Text stabil, egal wie oft bearbeitet wird. */
(function (root) {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const KEYS = ['b', 'i', 'u', 'sup', 'sub', 'f', 'c', 's', 'nb'];
  const ZW = '\u200B';
  const RE_FRAC = /^\[\[([^\[\]\/\n]{1,40})\/([^\[\]\n]{1,40})\]\]/, RE_SQRT = /^√\{([^{}\n]{1,40})\}/, RE_HEAD = /^\{\{([^|{}\n]{1,90})\|/;
  const RE_SUPB = /^\^\{([^{}\n]{1,20})\}/, RE_SUPS = /^\^(-?[0-9a-zA-Z]{1,3})/, RE_SUBB = /^_\{([^{}\n]{1,20})\}/;
  const isColor = t => /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(t), isSize = t => /^\d{1,2}(\.\d)?pt$/.test(t);

  function headAttrs(h) {
    const a = {}; const toks = h.split(';').map(x => x.trim()).filter(Boolean);
    const multi = toks.length > 1 || toks.some(t => isColor(t) || isSize(t) || /^-?[biu]$/.test(t));
    if (!multi) { a.f = h.trim(); return a; }                     /* frühere Form {{Schrift|Text}} */
    for (const t of toks) {
      if (isColor(t)) a.c = t.toLowerCase();
      else if (isSize(t)) a.s = Math.max(6, Math.min(96, parseFloat(t)));
      else if (t === '-b') a.nb = true; else if (t === 'b') a.b = true; else if (t === 'i') a.i = true; else if (t === 'u') a.u = true;
      else a.f = t;
    }
    return a;
  }
  /* Gibt es ab Position i (in derselben Zeile) noch ein schließendes Zeichen? */
  function closes(src, i, mk) {
    const end = src.indexOf('\n', i); const lim = end < 0 ? src.length : end; let j = src.indexOf(mk, i);
    if (mk === '__') while (j >= 0 && j < lim && (src[j + 2] === '_' || src[j - 1] === '_' && j > i)) { let k = j; while (src[k] === '_') k++; j = src.indexOf(mk, k); }
    return j >= 0 && j < lim ? j : -1;
  }
  /* Öffnen nur, wenn direkt danach kein Leerraum steht und später in der Zeile ein passendes Schließen folgt
     (davor kein Leerraum) – so bleiben „Ich heiße __ und bin __ Jahre.“ oder „3 ** 4“ normaler Text */
  function opens(src, i, mk) {
    if (/\s/.test(src[i + 2] || ' ')) return false;
    let j = closes(src, i + 2, mk);
    while (j > i + 2 && /\s/.test(src[j - 1])) j = closes(src, j + 1, mk);
    return j > i + 2;
  }
  function groupCloses(src, i) {
    let depth = 1;
    for (let k = i; k < src.length - 1; k++) {
      if (src[k] === '{' && src[k + 1] === '{' && RE_HEAD.test(src.slice(k))) { depth++; k++; continue; }
      if (src[k] === '^' && src[k + 1] === '{') { const m = RE_SUPB.exec(src.slice(k)); if (m) { k += m[0].length - 1; continue; } }
      if (src[k] === '_' && src[k + 1] === '{') { const m = RE_SUBB.exec(src.slice(k)); if (m) { k += m[0].length - 1; continue; } }
      if (src[k] === '√') { const m = RE_SQRT.exec(src.slice(k)); if (m) { k += m[0].length - 1; continue; } }
      if (src[k] === '}' && src[k + 1] === '}') { depth--; if (!depth) return true; k++; }
    }
    return false;
  }

  function parse(src) {
    src = String(src == null ? '' : src).replace(/\r/g, '');
    const runs = []; const st = { b: 0, i: 0, u: 0 }; const groups = []; let buf = '';
    const attrs = () => { const a = {}; for (const g of groups) Object.assign(a, g); if (st.b) a.b = true; if (st.i) a.i = true; if (st.u) a.u = true; return a; };
    const flush = () => { if (buf) { runs.push({ ...attrs(), t: buf }); buf = ''; } };
    let i = 0;
    while (i < src.length) {
      const ch = src[i], two = src.substr(i, 2), rest = () => src.slice(i);
      if (ch === '\n') { flush(); st.b = st.i = st.u = 0; runs.push({ ...attrs(), t: '\n' }); i++; continue; }
      if (two === '**') { if (st.b && !/\s/.test(src[i - 1] || ' ')) { flush(); st.b = 0; i += 2; continue; } if (!st.b && opens(src, i, '**')) { flush(); st.b = 1; i += 2; continue; } }
      if (ch === '_' && /^_{3,}/.test(rest()) && !st.u) { const m = /^_{3,}/.exec(rest()); buf += m[0]; i += m[0].length; continue; }   /* Schreiblinie ____ bleibt Text */
      if (two === '__') { if (st.u && !/\s/.test(src[i - 1] || ' ')) { flush(); st.u = 0; i += 2; continue; } if (!st.u && opens(src, i, '__')) { flush(); st.u = 1; i += 2; continue; } }
      if (two === '//') {
        if (st.i && !/\s/.test(src[i - 1] || ' ')) { flush(); st.i = 0; i += 2; continue; }
        const prev = i > 0 ? src[i - 1] : '';
        if (!st.i && prev !== ':' && opens(src, i, '//')) { flush(); st.i = 1; i += 2; continue; }
      }
      if (two === '{{') { const m = RE_HEAD.exec(rest()); if (m && groupCloses(src, i + m[0].length)) { flush(); groups.push(headAttrs(m[1])); i += m[0].length; continue; } }
      if (two === '}}' && groups.length) { flush(); groups.pop(); i += 2; continue; }
      if (ch === '^') { const m = RE_SUPB.exec(rest()) || RE_SUPS.exec(rest()); if (m) { flush(); runs.push({ ...attrs(), sup: true, t: m[1] }); i += m[0].length; continue; } }
      if (two === '_{') { const m = RE_SUBB.exec(rest()); if (m) { flush(); runs.push({ ...attrs(), sub: true, t: m[1] }); i += m[0].length; continue; } }
      if (two === '[[') { const m = RE_FRAC.exec(rest()); if (m) { flush(); runs.push({ ...attrs(), raw: 'frac', a: m[1], d: m[2], t: '\uFFFC' }); i += m[0].length; continue; } }
      if (ch === '√') { const m = RE_SQRT.exec(rest()); if (m) { flush(); runs.push({ ...attrs(), raw: 'sqrt', a: m[1], t: '\uFFFC' }); i += m[0].length; continue; } }
      buf += ch; i++;
    }
    flush();
    return norm(runs);
  }

  const same = (a, b) => KEYS.every(k => (a[k] || '') === (b[k] || ''));
  function norm(runs) {
    const out = [];
    for (const r0 of runs) {
      const r = { t: r0.t }; KEYS.forEach(k => { if (r0[k]) r[k] = r0[k]; }); if (r0.raw) { r.raw = r0.raw; r.a = r0.a; if (r0.raw === 'frac') r.d = r0.d; }
      if (!r.t) continue;
      if (r.sup && r.sub) delete r.sub;
      const p = out[out.length - 1];
      if (p && !p.raw && !r.raw && p.t !== '\n' && r.t !== '\n' && same(p, r)) p.t += r.t; else out.push(r);
    }
    return out;
  }

  function plain(runs, opts = {}) {
    return (Array.isArray(runs) ? runs : parse(runs)).map(r => r.raw === 'frac' ? `${r.a}/${r.d}` : r.raw === 'sqrt' ? `√${r.a}` : r.t).join('').replace(/\u200B/g, '').replace(opts.oneLine ? /\n/g : /$^/, ' ');
  }
  const hasFormat = runs => runs.some(r => r.raw || KEYS.some(k => r[k]));

  /* Läufe → Kurzschrift (immer flach, Zeile für Zeile) */
  function serialize(runs, opts = {}) {
    let out = '';
    const list = norm(runs.map(r => ({ ...r, t: opts.keepZW ? r.t : String(r.t).replace(/\u200B/g, '') })));
    for (let k = 0; k < list.length; k++) {
      const r = list[k];
      if (r.t === '\n') { out += '\n'; continue; }
      const prev = out.slice(-1), nx = list[k + 1] && !list[k + 1].raw ? list[k + 1].t[0] || '' : '';
      const toks = []; if (r.f) toks.push(r.f); if (r.c) toks.push(r.c); if (r.s) toks.push(+r.s + 'pt'); if (r.nb) toks.push('-b');
      /* Kurzschrift nur, wenn sie eindeutig bleibt – sonst als Merkmal in {{…|}} */
      const raw0 = r.raw || r.sup || r.sub ? '' : r.t;
      const clash = c => r.sup || r.sub || prev === c || nx === c || raw0[0] === c || raw0.slice(-1) === c || /^\s|\s$/.test(raw0);
      let useB = r.b, useI = r.i, useU = r.u;
      if (useB && clash('*')) { toks.push('b'); useB = false; }
      if (useI && (clash('/') || prev === ':')) { toks.push('i'); useI = false; }
      if (useU && clash('_')) { toks.push('u'); useU = false; }
      let open = '', close = '';
      if (toks.length) { open += '{{' + toks.join(';') + '|'; close = '}}' + close; }
      if (useB) { open += '**'; close = '**' + close; }
      if (useI) { open += '//'; close = '//' + close; }
      if (useU) { open += '__'; close = '__' + close; }
      let body;
      if (r.raw === 'frac') body = `[[${r.a}/${r.d}]]`;
      else if (r.raw === 'sqrt') body = `√{${r.a}}`;
      else if (r.sup || r.sub) { const t = r.t.replace(/[{}\n]/g, ''); body = t.length > 20 ? t.slice(0, 20) : t; body = (r.sup ? '^{' : '_{') + body + '}'; if (!t) body = ''; }
      else body = r.t;
      if (!body) continue;
      /* leere Hervorhebung um reinen Leerraum vermeiden: Leerzeichen bleiben ohne Zeichen */
      if (!r.raw && !r.sup && !r.sub && !toks.length && /^\s+$/.test(body)) { out += body; continue; }
      out += open + body + close;
    }
    return out;
  }

  let fontCss = f => `"${String(f).replace(/"/g, '')}"`;
  function styleOf(r) {
    let st = '';
    if (r.f) st += `font-family:${fontCss(r.f).replace(/"/g, "'")};`;
    if (r.c) st += `color:${r.c};`;
    if (r.s) st += `font-size:${+r.s}pt;`;
    if (r.nb && !r.b) st += 'font-weight:400;';
    return st;
  }
  /* Anzeige; edit:true liefert zusätzlich Merkmale, die der Bearbeiten-Modus zurücklesen kann */
  function toHtml(runs, opts = {}) {
    if (!Array.isArray(runs)) runs = parse(runs);
    let h = '';
    for (const r of runs) {
      if (r.t === '\n') { h += '<br>'; continue; }
      let x;
      if (r.raw === 'frac') x = `<span class="frac" data-raw="${esc(`[[${r.a}/${r.d}]]`)}"${opts.edit ? ' contenteditable="false"' : ''}><span>${esc(r.a)}</span><span>${esc(r.d)}</span></span>`;
      else if (r.raw === 'sqrt') x = `<span class="sqrt" data-raw="${esc(`√{${r.a}}`)}"${opts.edit ? ' contenteditable="false"' : ''}>√<span>${esc(r.a)}</span></span>`;
      else x = esc(r.t);
      if (r.sup) x = `<sup>${x}</sup>`; if (r.sub) x = `<sub>${x}</sub>`;
      if (r.u) x = `<u>${x}</u>`; if (r.i) x = `<em>${x}</em>`; if (r.b) x = `<b>${x}</b>`;
      const st = styleOf(r);
      if (st) { const d = {}; ['f', 'c', 's', 'nb'].forEach(k => { if (r[k]) d[k] = r[k]; }); x = `<span style="${st}" data-st="${esc(JSON.stringify(d))}">${x}</span>`; }
      h += x;
    }
    return h;
  }
  const md = src => toHtml(parse(src));

  /* ---------- Bearbeiten: Einheiten zählen (Zeichen; Zeilenumbruch, Bruch, Wurzel = je 1) ---------- */
  const units = runs => runs.reduce((n, r) => n + (r.raw ? 1 : r.t.length), 0);
  function split(runs, at) {
    const out = []; let pos = 0;
    for (const r of runs) {
      const len = r.raw ? 1 : r.t.length;
      if (!r.raw && at > pos && at < pos + len) { out.push({ ...r, t: r.t.slice(0, at - pos) }, { ...r, t: r.t.slice(at - pos) }); }
      else out.push({ ...r });
      pos += len;
    }
    return out;
  }
  function slice(runs, a, b) {
    const out = []; let pos = 0;
    for (const r of split(split(runs, a), b)) { const len = r.raw ? 1 : r.t.length; if (pos >= a && pos + len <= b && len) out.push(r); pos += len; }
    return out;
  }
  /* Eigenschaft im Bereich [a,b) setzen; val === undefined bei Schaltern = umschalten.
     defBold: Feld ist ohnehin fett (Überschrift, Titel) – „fett aus“ wird dann als „nicht fett“ gespeichert. */
  function isOn(r, key, defBold) { if (key === 'b') return !!r.b || (defBold && !r.nb); return !!r[key]; }
  /* Läufe im Bereich – bei Cursor ohne Markierung: das Zeichen davor (wie in Word), am Anfang das danach */
  function around(runs, a, b) {
    if (a !== b) return slice(runs, a, b).filter(r => r.t !== '\n');
    const bef = slice(runs, Math.max(0, a - 1), a).filter(r => r.t !== '\n'); if (bef.length && a > 0) return bef;
    return slice(runs, a, a + 1).filter(r => r.t !== '\n');
  }
  function stateIn(runs, a, b, key, defBold) { const l = around(runs, a, b); if (!l.length) return key === 'b' ? !!defBold : false; return l.every(r => isOn(r, key, defBold)); }
  function valueIn(runs, a, b, key) { const l = around(runs, a, b); if (!l.length) return ''; const v = l[0][key] || ''; return l.every(r => (r[key] || '') === v) ? v : null; }   /* null = gemischt */
  function apply(runs, a, b, key, val, defBold) {
    let on = val;
    if (['b', 'i', 'u', 'sup', 'sub'].includes(key) && val === undefined) on = !stateIn(runs, a, b, key, defBold);
    let pos = 0; const parts = split(split(runs, a), b);
    for (const r of parts) {
      const len = r.raw ? 1 : r.t.length;
      if (pos >= a && pos + len <= b && len && r.t !== '\n') {
        if (key === 'b') { if (defBold) { delete r.b; if (on) delete r.nb; else r.nb = true; } else { delete r.nb; if (on) r.b = true; else delete r.b; } }
        else if (key === 'sup' || key === 'sub') { delete r.sup; delete r.sub; if (on) r[key] = true; }
        else if (['i', 'u'].includes(key)) { if (on) r[key] = true; else delete r[key]; }
        else { if (val === '' || val == null) delete r[key]; else r[key] = val; }
      }
      pos += len;
    }
    return norm(parts);
  }
  function insert(runs, at, run) {
    const parts = split(runs, at); let pos = 0; const out = []; let done = false;
    for (const r of parts) { if (!done && pos === at) { out.push(run); done = true; } out.push(r); pos += r.raw ? 1 : r.t.length; }
    if (!done) out.push(run);
    return out;
  }
  const attrsAt = (runs, at) => { const l = around(runs, at, at)[0] || {}; const a = {}; KEYS.forEach(k => { if (l[k]) a[k] = l[k]; }); return a; };

  /* Wort um eine Cursorposition (für „Fett“ ohne Markierung, wie in Word) */
  function wordAt(runs, at) {
    const txt = runs.map(r => r.raw ? '\uFFFC' : r.t).join(''); const W = /[\p{L}\p{N}ß\-]/u;
    let s = at, e = at; while (s > 0 && W.test(txt[s - 1])) s--; while (e < txt.length && W.test(txt[e])) e++;
    return s < at && at < e ? [s, e] : null;
  }

  /* Alle Läufe gleich formatiert? (dann überträgt sich die Formatierung auf einen neuen Text) */
  function uniform(runs) { const l = runs.filter(r => r.t !== '\n' && !r.raw); if (!l.length) return null; const a = {}; KEYS.forEach(k => { if (l[0][k]) a[k] = l[0][k]; }); return l.every(r => same(r, a)) ? a : null; }

  const API = { parse, serialize, toHtml, md, plain, hasFormat, units, split, slice, apply, insert, stateIn, valueIn, attrsAt, wordAt, uniform, norm, esc, KEYS, ZW, setFontCss: fn => { fontCss = fn; } };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.FolivaRT = API;
})(typeof window !== 'undefined' ? window : globalThis);
