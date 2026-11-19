/* Foliva – Darstellung ab 0.9.12 · © 2026 theis
   – Lesehilfen für alle Textaufgaben: Silben färben oder Silbenbögen, Selbstlaute hervorheben, nur Großbuchstaben,
     auf Wunsch auch für die Arbeitsanweisung
   – Baustein „Gedicht“: lesen, Reimwörter einsetzen, abschreiben, Verse ordnen, Elfchen schreiben
   – Baustein „Notiz“: Hinweis für die Lehrkraft, erscheint nur im Editor, nie im Druck oder PDF
   Ohne die neuen Einstellungen bleibt die Darstellung aller Bausteine wie bisher. */
(function (root) {
  'use strict';
  const RD = root.FolivaRender || (typeof require !== 'undefined' ? require('./render.js') : null);
  const TX = root.FolivaTextEx || (typeof require !== 'undefined' ? require('./textex.js') : null);
  const { esc, md, S, register } = RD;

  /* ---------- Lesehilfen ---------- */
  const NATIVE = new Set(['text', 'sachtext']);          /* wenden Silben und Selbstlaute selbst an */
  const LH = new Set(['gedicht', 'gap', 'pictureword', 'wordlist', 'truefalse', 'choice', 'match', 'abc', 'sachaufgabe', 'wordtypes', 'table', 'lines', 'label']);
  const sylOn = it => !!(it.syl && it.syl !== 'aus');
  const lhOn = it => sylOn(it) || !!it.vow || !!it.caps;
  const VOW = ['äu', 'Äu', 'au', 'Au', 'ei', 'Ei', 'ai', 'Ai', 'eu', 'Eu', 'ie', 'Ie', ...'aeiouyäöüAEIOUYÄÖÜ'.split('')];
  function vowels(s, on) {
    if (!on) return esc(s);
    let out = '', i = 0;
    while (i < s.length) { const v = VOW.find(u => s.startsWith(u, i)); if (v) { out += `<span class="vwL">${esc(v)}</span>`; i += v.length; } else { out += esc(s[i]); i++; } }
    return out;
  }
  const unesc = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  function lhText(t, it, st) {
    const syl = sylOn(it), vow = !!it.vow; if (!syl && !vow) return t;
    return t.replace(/(&[#a-zA-Z0-9]+;)|([A-Za-zÄÖÜäöüßẞ|]+)/g, (m, ent, w) => {
      if (ent) return ent;
      if (!syl) return vowels(w.replace(/\|/g, ''), vow);
      const parts = TX ? TX.syllables(w) : [w];
      return parts.map(p => `<span class="sy sy${st.n++ % 2}">${vowels(p, vow)}</span>`).join('');
    });
  }
  /* HTML durchgehen: nur Text zwischen den Tags verändern, nie in SVG, Stil oder Formeln */
  function lhHTML(html, it, st = { n: 0 }) {
    if (!sylOn(it) && !it.vow) return html;
    let out = '', skip = 0, skipTag = '';
    String(html).replace(/<[^>]*>|[^<]+/g, tok => {
      if (tok[0] === '<') {
        const m = /^<\/?\s*([a-zA-Z0-9]+)/.exec(tok); const tag = m ? m[1].toLowerCase() : '';
        if (skip) { if (tag === skipTag) { if (tok[1] === '/') skip--; else if (!/\/>$/.test(tok)) skip++; } }
        else if ((['svg', 'style', 'script', 'math', 'textarea'].includes(tag) || / data-nolh\b/.test(tok)) && tok[1] !== '/' && !/\/>$/.test(tok)) { skip = 1; skipTag = tag; }
        out += tok;
      } else out += skip ? tok : lhText(tok, it, st);
      return tok;
    });
    return out;
  }
  const lhCls = it => `${sylOn(it) ? ' syl-' + esc(it.syl) : ''}${it.vow ? ' vow' : ''}${it.caps ? ' lhcaps' : ''}`;
  const wrapLH = (it, html, native) => {
    if (!lhOn(it)) return html;
    if (native) return it.caps ? `<div class="lhw lhcaps">${html}</div>` : html;
    return `<div class="lhw${lhCls(it)}">${lhHTML(html, it)}</div>`;
  };
  function patchLH(type) {
    const base = RD.R[type]; if (!base || base.__lh) return;
    const native = NATIVE.has(type);
    const f = (it, ctx) => { const b = base(it, ctx); if (!lhOn(it)) return b; return Array.isArray(b) ? b.map(p => wrapLH(it, p, native)) : wrapLH(it, b, native); };
    f.__lh = true; RD.R[type] = f;
  }
  /* Arbeitsanweisung mit Lesehilfe: den Titel im Kopf des Bausteins bearbeiten */
  function lhTitle(html, it) {
    const k = html.indexOf('<span class="ititle" data-edit="title">'); if (k < 0) return html;
    const open = '<span class="ititle" data-edit="title">'; let i = k + open.length, depth = 1;
    const re = /<\/?span\b[^>]*>/g; re.lastIndex = i; let m;
    while ((m = re.exec(html))) { if (m[0][1] === '/') { depth--; if (!depth) break; } else depth++; }
    if (!m) return html;
    const inner = html.slice(i, m.index);
    return html.slice(0, k) + `<span class="ititle${lhCls(it)}" data-edit="title">` + (NATIVE.has(it.type) || LH.has(it.type) ? lhHTML(inner, it) : inner) + html.slice(m.index);
  }

  /* Bausteine auf dem Blatt: Notizen nur im Editor; Lesehilfe auch für die Arbeitsanweisung */
  const baseBlocks = RD.blocks;
  RD.blocks = function (doc, ctx = {}) {
    [...NATIVE, ...LH].forEach(patchLH);
    const d = ctx.editor ? doc : { ...doc, items: (doc.items || []).filter(i => i.type !== 'note') };
    const out = baseBlocks(d, ctx);
    const byId = new Map((d.items || []).map(i => [i.id, i]));
    out.forEach(b => { const it = byId.get(b.id); if (it && it.lhTitle && lhOn(it) && (NATIVE.has(it.type) || LH.has(it.type)) && !b.part) b.html = lhTitle(b.html, it); });
    return out;
  };

  /* ---------- Notiz für die Lehrkraft ---------- */
  const NCOL = { gelb: '#fff3b0', gruen: '#dff3d6', blau: '#dcebfb', rosa: '#fbe0ea' };
  register('note', it => `<div class="tnote" style="background:${NCOL[it.ncol] || NCOL.gelb}"><small class="tnh" data-nolh>Notiz · wird nicht gedruckt</small><div class="tnb" data-edit="text" data-multi="1">${md(it.text || '') || '&nbsp;'}</div></div>`);

  /* ---------- Gedicht ---------- */
  const stanzas = text => { const out = [[]]; String(text || '').replace(/\r/g, '').split('\n').forEach(l => { const t = l.trim(); if (!t) { if (out[out.length - 1].length) out.push([]); } else out[out.length - 1].push(t); }); if (!out[out.length - 1].length) out.pop(); return out; };
  /* letztes Wort einer Zeile: [vorher, Wort, danach] */
  const lastWord = line => { const m = /^(.*?)([A-Za-zÄÖÜäöüßẞ]+(?:[-’'][A-Za-zÄÖÜäöüß]+)*)([^A-Za-zÄÖÜäöüßẞ]*)$/.exec(line); return m ? [m[1], m[2], m[3]] : null; };
  const LINS = { g1: 'g1', g2: 'g2', g3: 'g3', g4: 'g4', li9: 'li9', la1: 'la1', la2: 'la2', la3: 'la3', la4: 'la4' };
  const linKind = it => LINS[it.lin] || (it.stufe === '12' ? 'g2' : 'g4');
  function poemHead(it) {
    const t = String(it.ptitle || '').trim(), a = String(it.author || '').trim();
    if (!t && !a) return '';
    return `<div class="gdh">${t ? `<div class="gdt">${md(t)}</div>` : ''}${a ? `<div class="gda" data-nolh>${esc(a)}</div>` : ''}</div>`;
  }
  function gedichtHTML(it, ctx) {
    const d = it.data || {}; const mode = it.mode || 'lesen';
    const al = it.align === 'center' ? ' gdc' : '';
    const fs = +it.size ? `font-size:${+it.size}pt;` : '';
    if (mode === 'elfchen') return elfchenHTML(it, d, fs);
    const st = stanzas(it.text);
    if (!st.length) return `<div class="gd${al}" style="${fs}"><p class="hint">Hier das Gedicht eintragen – Strophen durch eine Leerzeile trennen.</p></div>`;
    if (mode === 'ordnen') {
      const lines = d.lines || []; const order = d.order || lines.map((_, i) => i);
      const rows = order.map(i => `<div class="gor"><span class="gob"><span class="s">${i + 1}</span></span><span class="gol">${esc(lines[i] || '')}</span></div>`).join('');
      return `<div class="gd gdo" style="${fs}">${poemHead(it)}<div class="gos">${rows}</div>${d.more ? `<div class="gomore">… (weitere Strophen weggelassen)</div>` : ''}</div>`;
    }
    const gaps = new Set(mode === 'reime' ? d.gaps || [] : []); const bank = [];
    let n = 0;
    const body = st.map(sz => `<div class="gs">${sz.map(line => {
      const k = n++; let h = esc(line);
      if (gaps.has(k)) { const lw = lastWord(line); if (lw) { bank.push(lw[1]); const w = Math.max(12, Math.min(48, lw[1].length * 3.1)); h = `${esc(lw[0])}<span class="gapw" style="min-width:${w}mm"><span class="s">${esc(lw[1])}</span></span>${esc(lw[2])}`; } }
      const num = it.lineNums ? `<span class="gn">${(k + 1) % 5 === 0 ? k + 1 : ''}</span>` : '';
      return `<div class="gv">${num}<span class="gvt">${h}</span></div>`;
    }).join('')}</div>`).join('');
    let after = '';
    if (mode === 'reime' && it.bank !== false && bank.length) { const order = (d.bankOrder && d.bankOrder.length === bank.length) ? d.bankOrder : bank.map((_, i) => i); after += `<div class="wbank">${order.map(i => esc(bank[i])).join('<span class="wsep"> · </span>')}</div>`; }
    if (mode === 'abschreiben') {
      const rows = Math.max(1, Math.min(30, +it.lrows || st.reduce((s, x) => s + x.length, 0)));
      const L = RD.R.lineatur; if (L) { try { after += `<div class="gdl">${L({ type: 'lineatur', id: it.id + '_l', kind: linKind(it), rows, text: '', title: '', trace: 'normal', fill: false, repeat: false, band: false, numbered: false }, ctx)}</div>`; } catch (e) { } }
    }
    if (it.paint) after += `<div class="gdp" style="height:${Math.max(20, Math.min(200, +it.paintH || 60))}mm"><small data-nolh>Male ein Bild zum Gedicht.</small></div>`;
    return `<div class="gd${al}${it.lineNums ? ' gdn' : ''}" style="${fs}">${poemHead(it)}${body}</div>${after}`;
  }
  const EROWS = [[1, 'Ein Wort: eine Farbe oder Eigenschaft'], [2, 'Zwei Wörter: Wer oder was ist so?'], [3, 'Drei Wörter: Wo ist es? Was tut es?'], [4, 'Vier Wörter: Was denkst oder fühlst du?'], [1, 'Ein Wort: ein Schlusswort']];
  function elfchenHTML(it, d, fs) {
    const ex = it.example !== false && d.ex ? d.ex : null;
    const topic = String(it.etopic || '').trim();
    const rows = EROWS.map(([n, h]) => `<div class="efr">${it.ehints !== false ? `<small class="efh" data-nolh>${h}</small>` : ''}<div class="efw">${Array.from({ length: n }, () => '<i></i>').join('')}</div></div>`).join('');
    const exH = ex ? `<div class="efx"><small data-nolh>Beispiel</small>${ex.split('\n').map(l => `<div>${esc(l)}</div>`).join('')}</div>` : '';
    return `<div class="gd gde${ex ? ' efex' : ''}" style="${fs}"><div class="efm"><div class="eft">Mein Elfchen${topic ? ` zum Thema <b>${md(topic)}</b>` : ''}</div>${rows}</div>${exH}</div>`;
  }
  register('gedicht', gedichtHTML, { task: true });

  RD.lhHTML = lhHTML; RD.stanzas = stanzas; RD.lastWord = lastWord;
  if (typeof module !== 'undefined' && module.exports) module.exports = RD;
})(typeof window !== 'undefined' ? window : globalThis);
