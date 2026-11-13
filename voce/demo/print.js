/* Voce · Druckdialog mit Live-Vorschau (1.8.0)
   Aufgabenkarten und Prüferblätter in fünf Designs (A4 oder A5 – zwei Karten pro A4-Blatt, normale oder große Schrift),
   Prüfungsplan, Aushang für die Tür und Ergebnisübersicht für die Fachschaft (feste theis-Farben).
   Bewertungsbögen bleiben im ISB-Stil (export.js). Fußzeile überall „© 2026“ + theis-Logo, nie abgeschnitten.
   Ablauf: HTML bauen → Vorschau im iframe → zu lange Seiten werden dort gemessen und verkleinert → dieselben Werte gehen ins PDF. · © 2026 theisapps */
'use strict';
const Druck = (() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  /* Vier Designs mit eigenem Layout (nicht nur eigenen Farben):
     Nüchtern = Tabellen und Kästen wie der ISB-Bogen · Modern = Zeitleiste, viel Weiß, eine Akzentfarbe
     Heft = Karopapier mit Randlinie und Klebezettel · Freundlich = bunte, runde Kacheln (Unterstufe) */
  const DESIGNS = [
    { k: 'nuechtern', n: 'Nüchtern', d: 'Schwarz-weiß, wie der ISB-Bogen' },
    { k: 'modern', n: 'Modern', d: 'Zeitleiste, viel Weiß' },
    { k: 'heft', n: 'Heft', d: 'Karopapier, Klebezettel' },
    { k: 'freundlich', n: 'Freundlich', d: 'Bunt und rund, Unterstufe' },
  ];
  /* Schriften: nur die, die ein Design braucht (OFL, siehe fonts/LICENSE-*.txt) */
  const FONTS = { heft: [['Lora', 'lora', [400, 700]]], modern: [['Space Grotesk', 'space-grotesk', [400, 600, 700]]], freundlich: [['Nunito', 'nunito', [400, 700]]] };
  const fontCache = {};
  async function fontFace(design, mode) {
    const list = FONTS[design]; if (!list) return '';
    let css = '';
    for (const [fam, file, weights] of list) for (const w of weights) {
      const url = `fonts/${file}-latin-${w}-normal.woff2`;
      let src = url;
      if (mode === 'data') {
        if (!fontCache[url]) {
          try { const buf = new Uint8Array(await (await fetch(url)).arrayBuffer()); let bin = ''; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000)); fontCache[url] = 'data:font/woff2;base64,' + btoa(bin); }
          catch (e) { fontCache[url] = ''; }
        }
        src = fontCache[url]; if (!src) continue;
      }
      css += `@font-face{font-family:'${fam}';font-weight:${w};font-style:normal;src:url(${src}) format('woff2')}`;
    }
    return css;
  }

  /* ---------- Grundgerüst ---------- */
  const BASE = `@page{size:A4;margin:0}
html,body{margin:0;padding:0}
body{font-family:var(--f);font-size:var(--fs);line-height:1.42;color:#141414;-webkit-print-color-adjust:exact;print-color-adjust:exact}
*{box-sizing:border-box}
.page{width:210mm;height:297mm;padding:13mm 15mm 17mm;position:relative;overflow:hidden;break-after:page;page-break-after:always;display:flex;flex-direction:column;background:#fff}
.page:last-child{break-after:auto;page-break-after:auto}
.pin{flex:1 1 auto;min-height:0;overflow:hidden;display:flex;flex-direction:column}
.foot{position:absolute;left:0;right:0;bottom:7mm;text-align:center;font:6.8pt/1 Arial,Helvetica,sans-serif;color:#777}
.foot img{height:2.5mm;width:auto;vertical-align:-.5mm;margin:0 .6mm;opacity:.9}
body.a5 .sheet{width:297mm;height:210mm;display:flex;position:relative;overflow:hidden;break-after:page;page-break-after:always}
body.a5 .sheet:last-child{break-after:auto;page-break-after:auto}
body.a5 .sheet .page{zoom:.7071;break-after:auto;page-break-after:auto}
body.a5 .sheet::after{content:"";position:absolute;left:148.5mm;top:5mm;bottom:5mm;border-left:.4pt dashed #999}
p{margin:0 0 .35em}ul{margin:.2em 0 .5em;padding-left:1.2em}li{margin-bottom:.2em}h3{margin:.2em 0 .35em;font-size:1.06em;font-family:var(--fh,var(--f))}
.img{text-align:center;margin:.2em 0 .6em}.img img{max-width:100%;max-height:72mm}.img.small img{max-height:48mm}.img.tiny img{max-height:34mm}
.cap{font-size:.68em;color:#555;margin-top:1mm;text-align:right}
.lines div{height:7.5mm;border-bottom:.5pt solid #999}
table{border-collapse:collapse;width:100%}td,th{text-align:left;vertical-align:middle;padding:1.6mm 2.4mm;font-weight:normal}
.gapb{margin-top:3mm!important}
@media screen{html{background:#8a8d94}body{padding:14px 0}.page,body.a5 .sheet{margin:0 auto 14px;box-shadow:0 4px 18px rgba(0,0,0,.28)}body.a5 .sheet{background:#fff}}`;

  /* ---------- Designs ---------- */
  const CSS = {
    nuechtern: `body{--f:Arial,"Liberation Sans",Helvetica,sans-serif;--acc:#000;--acc2:#000;--soft:#EFEFEF;--line:#9A9A9A;--rad:0}
.kopf{display:flex;justify-content:space-between;align-items:flex-start;gap:6mm;border:1.2pt solid #000;padding:4mm 5mm}.kick{font-size:.82em;color:#333}.kopf h1{margin:1mm 0 2mm;font-size:2.1em;line-height:1.05}.chips{display:flex;flex-wrap:wrap;gap:0 5mm}.chip{font-size:.86em}.kr{display:flex;flex-direction:column;align-items:flex-end;gap:2.6mm;flex:none}.lvl{background:#000;color:#fff;font-weight:bold;padding:1.2mm 6mm}.kr img{max-height:14mm;max-width:38mm}
.badge{display:flex;justify-content:flex-end;margin-bottom:4mm}.badge span{background:#000;color:#fff;font-weight:bold;padding:1.6mm 8mm;font-size:1em}
.hd td{border:.5pt solid #000}.hd .logo{width:34%;text-align:center;padding:2mm}.hd .logo img{max-width:100%;max-height:22mm}.hd .t{font-weight:bold}
.tagrow{display:flex;align-items:center;gap:4mm;margin:5mm 0 0}.tag{font-size:1.9em;font-weight:bold;border:1.2pt solid #000;padding:.5mm 6mm}.sub{font-size:.92em;color:#333}
.sh{margin:5mm 0 0;font-size:1em;background:#d9d9d9;border:.5pt solid #000;border-bottom:0;padding:1.6mm 2.4mm;display:flex;justify-content:space-between;font-weight:bold}.sh .tm{font-weight:normal}
.sb{border:.5pt solid #000;padding:3mm 3.4mm}
.role{border:1.2pt solid #000;padding:2.6mm 3.2mm;margin-top:2.2mm}.role>b{display:inline-block;background:#000;color:#fff;padding:.5mm 3mm;margin-bottom:1.8mm}
.img img{border:.5pt solid #000}
.sb table th{background:#d9d9d9;font-weight:bold}.sb table td,.sb table th{border:.5pt solid #000}`,
    heft: `body{--f:'Lora',Georgia,"Times New Roman",serif;--ink:#22408f;--red:#d4433b;--acc:#22408f;--acc2:#22408f;--soft:#F6F0DC;--line:#C5CCE0;--rad:0}
.page{background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Cpath d='M50 .5H.5V50' fill='none' stroke='%23dde4f3' stroke-width='1.2'/%3E%3C/svg%3E") 0 0/5mm 5mm}
.page::before{content:"";position:absolute;left:10mm;top:0;bottom:0;width:1.1pt;background:var(--red);opacity:.65}
.kopf{display:flex;justify-content:space-between;align-items:flex-start;gap:6mm;border-bottom:1.4pt solid var(--ink);padding-bottom:3mm}
.kick{font-style:italic;color:#555;font-size:.9em}
.kopf h1{margin:1mm 0 1.6mm;font-size:2.35em;color:var(--ink);display:inline;background:linear-gradient(transparent 58%,#ffe48a 58%,#ffe48a 92%,transparent 92%);padding:0 1.5mm}
.chips{display:flex;flex-wrap:wrap;gap:1mm 5mm;margin-top:2mm}.chip{font-size:.82em;color:#333}
.kr{display:flex;flex-direction:column;align-items:flex-end;gap:3mm;flex:none}.lvl{background:#ffe48a;color:#222;font-weight:700;padding:2.4mm 5mm;transform:rotate(-3deg);box-shadow:1.4pt 1.8pt 0 rgba(0,0,0,.16)}
.kr img{max-height:15mm;max-width:40mm}
.info{display:grid;grid-template-columns:repeat(4,auto);justify-content:space-between;gap:1mm 5mm;font-size:.8em;color:#444;margin:3mm 0 0}.info span{border-bottom:.5pt dotted #999;padding-bottom:.6mm}
.note{margin:3mm 0 0;font-style:italic;color:var(--ink)}
.sec{margin-top:5mm}.sh{display:flex;align-items:baseline;gap:2.6mm;margin-bottom:2mm}
.nr{flex:none;width:6.6mm;height:6.6mm;border:1.2pt solid var(--ink);border-radius:50%;color:var(--ink);font-weight:700;display:flex;align-items:center;justify-content:center;font-size:.9em}
.sh h2{margin:0;font-size:1.18em;font-style:italic;color:var(--ink);text-decoration:underline;text-decoration-color:var(--red);text-underline-offset:1.4mm;text-decoration-thickness:1pt}.tm{margin-left:auto;color:#666;font-size:.85em;font-style:italic}
.role{border:1pt dashed var(--ink);padding:3mm 3.4mm 2.6mm;margin-top:3mm;position:relative}.role>b{position:absolute;top:-2.6mm;left:4mm;background:#f2e3bd;padding:.3mm 3mm;font-size:.88em;transform:rotate(-1.5deg)}
.img img{padding:1.6mm;background:#fff;box-shadow:1.4pt 1.8pt 0 rgba(0,0,0,.14);transform:rotate(-.6deg);border:.4pt solid #ccc}
.sb table th{font-weight:700;border-bottom:1pt solid var(--ink)}.sb table td{border-bottom:.5pt dotted #999}
.lines div{border-color:#9db1dc}`,
    modern: `body{--f:'Space Grotesk','Helvetica Neue',Arial,sans-serif;--acc:#E4572E;--acc2:#B73E1B;--soft:#FBF2EE;--line:#E2E2E2;--rad:1.5mm}
.kopf{display:flex;justify-content:space-between;align-items:flex-start;gap:8mm;padding-bottom:5mm;border-bottom:.5pt solid var(--line);position:relative}
.kopf::after{content:"";position:absolute;left:0;bottom:-.6mm;width:22mm;height:1.2mm;background:var(--acc)}
.kick{font-size:.76em;letter-spacing:.14em;text-transform:uppercase;color:#8a8a8a;font-weight:600}
.kopf h1{margin:2mm 0 2.4mm;font-size:2.9em;line-height:1;font-weight:600;letter-spacing:-.025em;color:#111}
.chips{display:flex;flex-wrap:wrap;gap:.6mm 5mm}.chip{font-size:.86em;color:#555}.chip::before{content:"";display:inline-block;width:1mm;height:1mm;border-radius:50%;background:var(--acc);margin-right:1.8mm;vertical-align:.4mm}
.kr{display:flex;flex-direction:column;align-items:flex-end;gap:3mm;flex:none}.lvl{font-weight:600;font-size:.95em;color:var(--acc2);letter-spacing:.06em}
.kr img{max-height:13mm;max-width:36mm}
.info{display:grid;grid-template-columns:repeat(4,auto);justify-content:space-between;gap:1mm 5mm;font-size:.76em;color:#777;margin:4.5mm 0 0}
.note{margin:3.4mm 0 0;font-size:.9em;color:#444}
.sec{margin-top:7mm}.sh{display:flex;align-items:center;gap:2.6mm;margin-bottom:3mm}
.nr{flex:none;width:2.2mm;height:2.2mm;border-radius:50%;background:var(--acc);font-size:0;color:transparent}
.sh h2{margin:0;font-size:.84em;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#111}.tm{margin-left:auto;font-size:.8em;color:#8a8a8a}
.role{border-left:.9mm solid var(--acc);padding:1mm 0 1mm 4mm;margin-top:3.4mm}.role>b{display:block;font-size:.76em;letter-spacing:.12em;text-transform:uppercase;color:var(--acc2);font-weight:600;margin-bottom:1.2mm}
.img img{border-radius:var(--rad)}
.sb table th{font-weight:600;font-size:.78em;letter-spacing:.1em;text-transform:uppercase;color:#777;border-bottom:.8pt solid #111}.sb table td{border-bottom:.5pt solid var(--line)}
.lines div{border-color:#d4d4d4}`,
    freundlich: `body{--f:'Nunito',"Arial Rounded MT Bold",Arial,sans-serif;--g:#159A62;--o:#E8771A;--b:#2F6FDB;--acc:#159A62;--acc2:#0F4A30;--soft:#E7F6EE;--line:#BFE3D0;--rad:4mm}
.kopf{display:flex;justify-content:space-between;align-items:center;gap:6mm;background:#E7F6EE;border-radius:7mm;padding:4.5mm 6mm}
.kick{font-size:.82em;font-weight:700;color:var(--g)}
.kopf h1{margin:.6mm 0 1.6mm;font-size:2.4em;line-height:1.02;color:#163a2a;font-weight:800}
.chips{display:flex;flex-wrap:wrap;gap:1.6mm}.chip{font-size:.8em;font-weight:700;background:#fff;color:#2f5a46;border-radius:10mm;padding:.8mm 3mm}
.kr{display:flex;flex-direction:column;align-items:center;gap:2.6mm;flex:none}.lvl{width:15mm;height:15mm;border-radius:50%;background:var(--o);color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:1.05em;box-shadow:0 1.4mm 0 #c45f0d}
.kr img{max-height:14mm;max-width:36mm;border-radius:3mm}
.info{display:grid;grid-template-columns:repeat(4,auto);justify-content:space-between;gap:1mm 5mm;font-size:.8em;color:#4b5a53;margin:3mm 2mm 0}
.note{margin:3mm 0 0;background:#FFF4D6;border-radius:4mm;padding:2mm 4mm;font-weight:700;color:#7a5600}
.sec{margin-top:4.5mm;border-radius:5.5mm;padding:3.6mm 4.4mm 3mm;background:#FFF1E3}.sec.s1{background:#E8F0FF}.sec.s2{background:#EAF7EF}
.sh{display:flex;align-items:center;gap:2.6mm;margin-bottom:2.2mm}
.nr{flex:none;width:7.6mm;height:7.6mm;border-radius:50%;background:var(--o);color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center}.s1 .nr{background:var(--b)}.s2 .nr{background:var(--g)}
.sh h2{margin:0;font-size:1.15em;font-weight:800;color:#5a2c06}.s1 .sh h2{color:#123a7a}.s2 .sh h2{color:#0f4a30}
.sh h2::before{content:"";display:inline-block;width:5mm;height:4mm;margin-right:2mm;vertical-align:-.4mm;background:no-repeat center/contain url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 20'%3E%3Cpath d='M3 2h18a2 2 0 012 2v9a2 2 0 01-2 2H11l-5 4v-4H3a2 2 0 01-2-2V4a2 2 0 012-2z' fill='%23E8771A'/%3E%3C/svg%3E")}
.s1 .sh h2::before{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 20'%3E%3Cpath d='M2 1h13a2 2 0 012 2v6a2 2 0 01-2 2H8l-4 3v-3H2a1.5 1.5 0 01-1.5-1.5V3A2 2 0 012 1z' fill='%232F6FDB'/%3E%3Cpath d='M13 7h13a1.5 1.5 0 011.5 1.5v6a1.5 1.5 0 01-1.5 1.5h-2v3l-4-3h-7a2 2 0 01-2-2V9a2 2 0 012-2z' fill='%2393B4F0'/%3E%3C/svg%3E")}
.tm{margin-left:auto;font-weight:700;color:#7a6a5c;font-size:.85em;background:#fff;border-radius:10mm;padding:.5mm 2.6mm}
.role{background:#FFF8D9;border-radius:4mm;padding:2.8mm 3.4mm;margin-top:2.4mm}.role>b{display:inline-block;background:#F2B705;color:#3d2c00;border-radius:10mm;padding:.4mm 3mm;margin-bottom:1.6mm;font-size:.9em}
.img img{border-radius:4mm;border:1.4mm solid #fff}
.sb table th{background:#fff;font-weight:800}.sb table td{border-bottom:.6pt solid #d9c9b8}
.lines div{border-color:#c9b9a6}
.c0{--gc:#E8771A}.c1{--gc:#159A62}.c2{--gc:#2F6FDB}.c3{--gc:#B04FD0}.c4{--gc:#E0457B}.c5{--gc:#0F9AA8}
.slot{background:#fff;border-radius:4mm}`,
  };

  /* ---------- Seiten ---------- */
  function foot() {
    const wm = window.THEIS_WORDMARK;
    return `<div class="foot">© 2026 ${wm ? `<img src="${wm.data}" alt="theisapps">` : 'theisapps'} · Voce</div>`;
  }
  const numTxt = (design, n) => n;
  const secTitle = (s, design) => design === 'nuechtern' ? s.title : String(s.title).replace(/^[^·]{1,20}·\s*/, '');
  function taskPage(m, design) {
    const h = m.header; const blocks = s => s.blocks.map(Tasks.blockHtml).join('');
    const logo = h.logo ? `<img src="${h.logo.data}" alt="">` : '';
    if (design === 'nuechtern') return `<div class="page"><div class="pin">
<div class="badge"><span>${esc(m.level)}</span></div>
<table class="hd"><tr><td class="t" colspan="2">${esc(h.title)}</td><td class="logo" rowspan="4">${logo}</td></tr>
${h.rows.map(r => `<tr><td style="width:33%">${esc(r[0])}</td><td style="width:33%">${esc(r[1])}</td></tr>`).join('')}</table>
${m.tag ? `<div class="tagrow"><div class="tag">${esc(m.tag)}</div><div class="sub">${esc(m.sub)}</div></div>` : (m.sub ? `<div class="sub" style="margin-top:3mm">${esc(m.sub)}</div>` : '')}
${m.sections.map(s => `<div class="sh"><span>${esc(s.title)}</span><span class="tm">${esc(s.right || '')}</span></div><div class="sb">${blocks(s)}</div>`).join('')}
</div>${foot()}</div>`;
    const isCard = m.kind === 'card';
    const title = isCard ? m.tag : 'Prüferblatt';
    const kick = isCard ? h.title : String(h.title).replace(/^Prüferblatt\s*·\s*/, '');
    const chips = [h.rows[2] && h.rows[2][1], h.rows[2] && h.rows[2][0]].filter(Boolean);
    const info = [h.rows[0][0], h.rows[0][1], h.rows[1][0], h.rows[1][1]].filter(x => !/:\s*$/.test(x));
    return `<div class="page"><div class="pin">
<header class="kopf"><div class="kl"><div class="kick">${esc(kick)}</div><h1>${esc(title)}</h1><div class="chips">${chips.map(c => `<span class="chip">${esc(c)}</span>`).join('')}</div></div>
<div class="kr"><span class="lvl">${esc(m.level)}</span>${logo}</div></header>
<div class="info">${info.map(x => `<span>${esc(x)}</span>`).join('')}</div>
${m.sub ? `<div class="note">${esc(m.sub)}</div>` : ''}
${m.sections.map((s, i) => { const n = s.n || i + 1; return `<section class="sec s${n - 1}"><div class="sh"><span class="nr">${numTxt(design, n)}</span><h2>${esc(secTitle(s, design))}</h2><span class="tm">${esc(s.right || '')}</span></div><div class="sb">${blocks(s)}</div></section>`; }).join('')}
</div>${foot()}</div>`;
  }

  /* Prüfungsplan, Aushang, Übersicht: dieselben Designs wie die Karten (Farben/Radien über die Variablen --acc, --soft, --line, --rad) */
  const EXTRA = `.srcNote{margin-top:5mm;font-size:.68em;line-height:1.35;color:#777;word-break:break-all}
.slots{margin-top:5mm;display:flex;flex-direction:column;gap:2.2mm}
.slot{display:grid;grid-template-columns:26mm 1fr;gap:4mm;align-items:start;border:.8pt solid var(--line);border-left:1.6mm solid var(--gc,var(--acc));border-radius:var(--rad);padding:2.6mm 3.4mm;break-inside:avoid}
.slot .t{font-weight:700;font-size:1.12em;color:#141414;font-variant-numeric:tabular-nums}.slot .t small{display:block;font-weight:400;color:#6b7180;font-size:.78em}
.slot .gl{font-size:.66em;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--gc,var(--acc));margin-bottom:.4mm}
.slot .who{font-weight:600}.slot .tk{font-size:.82em;color:#4a4f5c;margin-top:.8mm}
.brk{display:flex;align-items:center;gap:3mm;color:#6b7180;font-size:.84em;font-weight:600;margin:.4mm 0}.brk::before,.brk::after{content:"";flex:1;border-top:.8pt dashed #b8bfd2}
.tbanner{margin-top:4mm;border:.8pt solid var(--acc);background:var(--soft);color:var(--acc2);border-radius:var(--rad);padding:2mm 3.4mm;font-weight:700;font-size:.88em}
.notes{margin-top:5mm;font-size:.9em;color:#333}.notes b{color:var(--acc2)}
.door .kopf h1{font-size:3.4em}.door .big{margin-top:8mm;font-size:1.5em}.door .big table td{padding:4mm 4mm;border-bottom:1pt solid var(--line);white-space:nowrap}.door .big td.tt{font-weight:800;width:1%;font-variant-numeric:tabular-nums}.door .big td.gg{color:#6b7180;width:1%}.door .big td:last-child{white-space:normal}
.door .hush{margin-top:auto;text-align:center;font-size:1.25em;font-weight:700;color:var(--acc2);background:var(--soft);border-radius:var(--rad);padding:5mm}
.tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;margin-top:5mm}.tile{background:var(--soft);border-radius:var(--rad);padding:3mm 3.6mm}.tile b{display:block;font-size:1.6em;color:var(--acc2)}.tile span{font-size:.78em;color:#4a4f5c}
.h2b{margin:6mm 0 2.4mm;font-size:.95em;letter-spacing:.11em;text-transform:uppercase;color:var(--acc)}
.chart{display:block;width:100%;flex:none}
.chip{white-space:nowrap}.chip.hi{font-weight:800;color:var(--acc2)}
.door .big.n1{font-size:2.1em}.door .big.n2{font-size:1.8em}
.res td,.res th{border-bottom:.6pt solid var(--line);font-size:.86em;padding:1.2mm 2mm}.res th{color:var(--acc2);font-weight:700;background:var(--soft)}.res td.c,.res th.c{text-align:center}
.keyt td{border:.6pt solid var(--line);text-align:center;font-size:.84em}.keyt td.l{font-weight:700;text-align:left;background:var(--soft)}`;
  const PLAN_ALL = `.slots.roomy{font-size:1.16em}.slots.roomy .ptab td{padding:3.4mm 2.6mm}.slots.roomy .he{padding:3.6mm 0}.slots.roomy .ti{padding-bottom:7.5mm}.slots.roomy .ka{padding:4.4mm 4.8mm}`;
  const PLAN = {
    nuechtern: `.slots{margin-top:5mm}.ptab{border:1.2pt solid #000}.ptab th{background:#d9d9d9;font-weight:bold;border:.5pt solid #000;padding:1.8mm 2.4mm;font-size:.9em}
.ptab td{border:.5pt solid #000;padding:2.4mm;vertical-align:top}.ptab td.tt{font-weight:bold;font-variant-numeric:tabular-nums;white-space:nowrap}.ptab td.gn{text-align:center;font-weight:bold;font-size:1.15em}
.ptab td.pp{line-height:1.5}.ptab td.tk{font-size:.84em;line-height:1.5}.ptab tr.pz td{background:#f0f0f0;text-align:center;font-size:.86em;padding:1.2mm;letter-spacing:.04em}`,
    modern: `.slots{margin-top:7mm}.tl{position:relative}.tl::before{content:"";position:absolute;left:27.2mm;top:2mm;bottom:2mm;width:.5pt;background:#d9d9d9}
.ti{display:grid;grid-template-columns:24mm 6.5mm 1fr;align-items:start;padding:0 0 5.5mm;break-inside:avoid}
.ti .tt{text-align:right;font-size:1.5em;font-weight:600;letter-spacing:-.02em;line-height:1;font-variant-numeric:tabular-nums}.ti .tt small{display:block;font-size:.5em;font-weight:400;color:#9a9a9a;margin-top:1.2mm;letter-spacing:0}
.ti .dot{justify-self:center;width:2.8mm;height:2.8mm;border-radius:50%;background:var(--acc);margin-top:1.6mm;box-shadow:0 0 0 1.2mm #fff;position:relative}
.ti .gl{font-size:.7em;letter-spacing:.16em;text-transform:uppercase;color:var(--acc2);font-weight:600;margin-bottom:.8mm}.ti .who{font-size:1.12em;font-weight:500}.ti .sep::before{content:"";display:inline-block;width:1mm;height:1mm;border-radius:50%;background:#bbb;margin:0 2.6mm;vertical-align:.5mm}
.ti .tk{font-size:.82em;color:#666;margin-top:1mm}.ti.tp{padding-bottom:5.5mm}.ti.tp .dot{background:#fff;border:.8pt solid #bbb;box-shadow:0 0 0 1.2mm #fff;width:2.4mm;height:2.4mm}.ti.tp .tc{font-size:.78em;letter-spacing:.14em;text-transform:uppercase;color:#9a9a9a;padding-top:1.2mm}`,
    heft: `.slots{margin-top:6mm}.he{display:grid;grid-template-columns:9mm 26mm 1fr;align-items:baseline;gap:0 2mm;padding:2.4mm 0;border-bottom:.5pt dashed #b9c4e0;break-inside:avoid}
.hn{width:7mm;height:7mm;border:1.2pt solid var(--red);border-radius:50%;color:var(--red);display:flex;align-items:center;justify-content:center;font-weight:700;transform:translateY(1mm) rotate(-4deg)}
.ht{font-size:1.35em;font-weight:700;color:var(--ink);font-variant-numeric:tabular-nums;line-height:1.1}.ht small{display:block;font-size:.6em;font-weight:400;font-style:italic;color:#666}.he .who{font-size:1.08em}.he .tk{font-size:.84em;font-style:italic;color:#555;margin-top:.6mm}
.hp{padding:2mm 0 2mm 11mm;font-style:italic}.hp mark{background:linear-gradient(transparent 45%,#ffe48a 45%,#ffe48a 90%,transparent 90%);color:#333;padding:0 1.4mm}`,
    freundlich: `.slots{margin-top:5mm}.kach{display:grid;grid-template-columns:1fr 1fr;gap:3.4mm}
.ka{background:color-mix(in srgb,var(--gc) 13%,#fff);border-radius:5mm;padding:3.4mm 4mm;break-inside:avoid}.kt{display:flex;align-items:center;gap:2.4mm;margin-bottom:2mm}
.kn{width:8mm;height:8mm;border-radius:50%;background:var(--gc);color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;flex:none}.kt b{font-size:1.45em;font-weight:800;color:#1d2b24;font-variant-numeric:tabular-nums}.kt small{color:#5d6b64;font-weight:700;font-size:.8em}
.ka .who{display:flex;flex-wrap:wrap;gap:1.4mm}.ka .who span{background:#fff;border-radius:10mm;padding:.8mm 3mm;font-weight:700;font-size:.92em}.ka .tk{font-size:.8em;color:#4a5751;margin-top:1.6mm}
.kp{grid-column:1/-1;text-align:center;font-weight:800;color:#7a5600;background:#FFF4D6;border-radius:10mm;padding:1.6mm}`,
  };
  const hm = x => `${String(Math.floor(x / 60) % 24).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`;
  /* Chips: Text oder [Text, Klasse] – „hi“ hebt Wichtiges hervor (z. B. den Raum) */
  function kopf(kick, title, chips, logo, lvl) {
    return `<header class="kopf"><div class="kl"><div class="kick">${esc(kick)}</div><h1>${esc(title)}</h1><div class="chips">${chips.filter(Boolean).map(c => Array.isArray(c) ? `<span class="chip ${c[1]}">${esc(c[0])}</span>` : `<span class="chip">${esc(c)}</span>`).join('')}</div></div>
<div class="kr">${lvl ? `<span class="lvl">${esc(lvl)}</span>` : ''}${logo ? `<img src="${logo.data}" alt="">` : ''}</div></header>`;
  }
  /* Prüfungsplan: jedes Design mit eigenem Aufbau */
  const tasksOf = (s, teacher) => teacher && s.tasks ? (Array.isArray(s.tasks) ? s.tasks : [s.tasks]) : [];
  const peopleOf = s => (s.people && s.people.length ? s.people : String(s.names || '').split(', ').filter(Boolean));
  function planSlots(d, teacher, design) {
    if (design === 'nuechtern') {
      /* Tabelle wie ein amtliches Formular */
      const rows = d.slots.map(s => `<tr><td class="tt">${hm(s.start)}–${hm(s.end)}</td><td class="gn">${s.i + 1}</td><td class="pp">${peopleOf(s).map(esc).join('<br>') || '—'}</td>${teacher ? `<td class="tk">${tasksOf(s, true).map(esc).join('<br>')}</td>` : ''}</tr>${s.brk ? `<tr class="pz"><td colspan="${teacher ? 4 : 3}">Pause · ${s.brk} Min.</td></tr>` : ''}`).join('');
      return `<table class="ptab"><thead><tr><th style="width:27mm">Zeit</th><th style="width:16mm">Gruppe</th><th>Prüflinge</th>${teacher ? '<th style="width:46%">Aufgaben</th>' : ''}</tr></thead><tbody>${rows}</tbody></table>`;
    }
    if (design === 'modern') {
      /* Zeitleiste: Uhrzeit links, Linie mit Punkten, Namen rechts */
      return `<div class="tl">${d.slots.map(s => `<div class="ti"><div class="tt">${hm(s.start)}<small>${hm(s.end)}</small></div><i class="dot"></i><div class="tc"><div class="gl">Gruppe ${s.i + 1}</div><div class="who">${peopleOf(s).map(esc).join('<span class="sep"></span>') || '—'}</div>${tasksOf(s, teacher).map(x => `<div class="tk">${esc(x)}</div>`).join('')}</div></div>${s.brk ? `<div class="ti tp"><div class="tt"></div><i class="dot"></i><div class="tc">Pause · ${s.brk} Min.</div></div>` : ''}`).join('')}</div>`;
    }
    if (design === 'freundlich') {
      /* bunte Kacheln, zwei Spalten */
      return `<div class="kach">${d.slots.map(s => `<div class="ka c${s.i % 6}"><div class="kt"><span class="kn">${s.i + 1}</span><b>${hm(s.start)}</b><small>bis ${hm(s.end)} Uhr</small></div><div class="who">${peopleOf(s).map(n => `<span>${esc(n)}</span>`).join('') || '—'}</div>${tasksOf(s, teacher).map(x => `<div class="tk">${esc(x)}</div>`).join('')}</div>${s.brk ? `<div class="kp">☕ Pause · ${s.brk} Min.</div>` : ''}`).join('')}</div>`;
    }
    /* Heft: Einträge auf Karopapier, Gruppennummer im roten Kreis, Pause mit Textmarker */
    return `<div class="hl">${d.slots.map(s => `<div class="he"><span class="hn">${s.i + 1}</span><div class="ht">${hm(s.start)}<small>bis ${hm(s.end)}</small></div><div class="hc"><div class="who">${peopleOf(s).map(esc).join(', ') || '—'}</div>${tasksOf(s, teacher).map(x => `<div class="tk">${esc(x)}</div>`).join('')}</div></div>${s.brk ? `<div class="hp"><mark>Pause · ${s.brk} Min.</mark></div>` : ''}`).join('')}</div>`;
  }
  function planPage(d, teacher, design) {
    return `<div class="page"><div class="pin">${kopf(`Prüfungsplan · ${d.title}`, `${d.subject} · ${d.cls}`, [d.date, d.span, d.room ? ['Raum ' + d.room, 'hi'] : '', `${d.dur} Min. je Gruppe${d.gap ? ` · ${d.gap} Min. Wechsel` : ''}`], d.logo, d.level)}
${teacher ? '<div class="tbanner">Nur für die Lehrkraft – enthält die Aufgaben. Bitte nicht an die Prüflinge weitergeben.</div>' : ''}
<div class="slots${d.slots.length <= 6 && !teacher ? ' roomy' : ''}">${planSlots(d, teacher, design)}</div>
<div class="notes">${d.parts ? `<p><b>Ablauf:</b> ${esc(d.parts)}</p>` : ''}${d.note ? `<p>${esc(d.note)}</p>` : ''}</div></div>${foot()}</div>`;
  }
  function doorPage(d, names) {
    const rows = d.slots.map(s => `<tr><td class="tt">${hm(s.start)}–${hm(s.end)}</td><td class="gg">Gruppe ${s.i + 1}</td><td>${names ? esc(s.names) : ''}</td></tr>${s.brk ? `<tr><td colspan="3" style="color:#6b7180;font-size:.7em">Pause · ${s.brk} Min.</td></tr>` : ''}`).join('');
    return `<div class="page door"><div class="pin">${kopf('Bitte nicht stören', 'Mündliche Prüfung', [`${d.subject} · ${d.cls}`, d.date, d.room ? ['Raum ' + d.room, 'hi'] : ''], d.logo, '')}
<div class="big ${d.slots.length <= 5 ? 'n1' : d.slots.length <= 8 ? 'n2' : ''}"><table>${rows}</table></div><div class="hush">Bitte leise – hier wird geprüft. Danke!</div></div>${foot()}</div>`;
  }
  function bars(vals, labels, colors, h = 30, ink = '#141414') {
    const W = 240, max = Math.max(1, ...vals), bw = W / vals.length;
    return `<svg class="chart" viewBox="0 0 ${W} ${h + 14}" xmlns="http://www.w3.org/2000/svg" font-family="Arial" font-size="4.6">${vals.map((v, i) => {
      const bh = Math.round(v / max * (h - 8) * 10) / 10, x = i * bw + bw * .18, w = bw * .64;
      return `<rect x="${x}" y="${h - bh}" width="${w}" height="${Math.max(bh, .6)}" rx="1.4" fill="${colors[i % colors.length]}"/><text x="${x + w / 2}" y="${h - bh - 1.6}" text-anchor="middle" fill="${ink}" font-weight="bold">${v}</text><text x="${x + w / 2}" y="${h + 6}" text-anchor="middle" fill="#4a4f5c">${esc(labels[i])}</text>`;
    }).join('')}<line x1="0" y1="${h}" x2="${W}" y2="${h}" stroke="#b8bfd2" stroke-width=".4"/></svg>`;
  }
  function overviewPage(d, names, design) {
    const GR = design === 'nuechtern' ? ['#222', '#222', '#222', '#222', '#222', '#222'] : ['#3C8D5A', '#7FA650', '#C2A23A', '#D9822B', '#C4503F', '#8C2F39'];
    const tiles = [[`${d.graded} / ${d.n}`, 'bewertet'], [d.absent, 'gefehlt (Nachtermin)'], [d.avg, 'Notendurchschnitt'], [d.weak, d.np ? 'unter 5 Notenpunkten' : 'Noten 5 und 6']];
    const catRows = d.cats.map(c => `<tr><td>${esc(c.label)}</td><td class="c">${c.avg}</td><td class="c">${c.max}</td><td style="width:45%"><div style="height:3mm;border-radius:min(2mm,var(--rad));background:var(--soft)"><div style="height:100%;width:${c.pct}%;border-radius:2mm;background:var(--acc)"></div></div></td></tr>`).join('');
    return `<div class="page"><div class="pin">${kopf(`Ergebnisübersicht · ${d.title}`, `${d.subject} · ${d.cls}`, [d.date, d.examiner ? 'Prüfer/in: ' + d.examiner : '', `Raster ${d.level}`], d.logo, d.level)}
<div class="tiles">${tiles.map(([v, l]) => `<div class="tile"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('')}</div>
<div class="h2b">Notenspiegel</div>${bars(d.dist, d.distLabels, d.np ? d.distLabels.map((_, i) => GR[Math.min(5, Math.floor((15 - +d.distLabels[i]) / 3))]) : GR)}
<div class="h2b">Durchschnitt je Bereich</div><table class="res"><tr><th>Bereich</th><th class="c">Ø</th><th class="c">max.</th><th></th></tr>${catRows}</table>
${d.key ? `<div class="h2b">Notenschlüssel</div><table class="keyt"><tr><td class="l">${esc(d.keyUnit)}</td>${d.key.map(k => `<td>${esc(k.r)}</td>`).join('')}</tr><tr><td class="l">Note</td>${d.key.map(k => `<td>${k.g}</td>`).join('')}</tr><tr><td class="l">Anzahl</td>${d.key.map(k => `<td>${k.c}</td>`).join('')}</tr></table>` : ''}
${names ? `<div class="h2b">Notenliste</div><table class="res"><tr><th>Name</th>${d.cats.map(c => `<th class="c">${esc(c.short)}</th>`).join('')}<th class="c">${d.np ? 'NP' : 'BE'}</th><th class="c">Note</th></tr>${d.rows.map(r => `<tr><td>${esc(r.name)}</td>${r.vals.map(v => `<td class="c">${esc(v)}</td>`).join('')}<td class="c">${esc(r.sum)}</td><td class="c"><b>${esc(r.grade)}</b></td></tr>`).join('')}</table>` : ''}
<p class="srcNote">Bewertungsraster und Notenschlüssel: ${esc(ISB.name)} · ${esc(ISB.url)}</p></div>${foot()}</div>`;
  }

  /* Monolog und Dialog getrennt: erst alle Monolog-Karten, dann alle Dialog-Karten (z. B. damit der Dialog erst nach dem Monolog ausgeteilt wird) */
  function splitModels(models) {
    const mono = [], dia = [];
    models.forEach(m => {
      if (m.kind !== 'card' || m.sections.length < 2) { (m.sections[0] && m.sections[0].kind === 'dia' ? dia : mono).push(m); return; }
      m.sections.forEach(s => (s.kind === 'dia' ? dia : mono).push(Object.assign({}, m, { sections: [s], sub: m.subBy ? m.subBy[s.kind] : m.sub })));
    });
    return [...mono, ...dia];
  }

  /* ---------- HTML zusammensetzen ---------- */
  async function build(job, o, fontMode, fits) {
    const design = DESIGNS.some(x => x.k === o.design) ? o.design : 'nuechtern';
    const ff = await fontFace(design, fontMode);
    const fs = (o.a5 ? 13.2 : 11) * (o.big ? 1.24 : 1);
    let pages;
    if (job.kind === 'tasks') pages = (o.split && job.canSplit ? splitModels(job.models) : job.models).map(m => taskPage(m, design));
    else if (job.kind === 'plan') pages = o.door ? [doorPage(job.data, o.names)] : [planPage(job.data, o.teacher, design)];
    else pages = [overviewPage(job.data, o.names, design)];
    if (fits) pages = pages.map((p, i) => fits[i] && fits[i] < .999 ? p.replace('<div class="pin">', `<div class="pin" style="zoom:${fits[i].toFixed(4)}">`) : p);
    const a5 = o.a5 && job.kind === 'tasks';
    let body = pages.join('\n');
    if (a5) { const sh = []; for (let i = 0; i < pages.length; i += 2) sh.push(`<div class="sheet">${pages[i]}${pages[i + 1] || ''}</div>`); body = sh.join('\n'); }
    return `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${esc(job.title)}</title><style>${ff}${BASE}${a5 ? '@page{size:A4 landscape;margin:0}' : ''}
body{--fs:${fs.toFixed(2)}pt}${CSS[design]}${job.kind !== 'tasks' ? EXTRA + PLAN_ALL + (PLAN[design] || '') : ''}</style></head><body class="d-${design}${a5 ? ' a5' : ''}">${body}</body></html>`;
  }
  /* Zu lange Seiten in der Vorschau messen → Verkleinerungsfaktor je Seite (mind. 0,62) */
  function measure(doc) {
    const out = [];
    doc.querySelectorAll('.page').forEach(pg => {
      const pin = pg.querySelector('.pin'); let z = 1;
      for (let k = 0; k < 6; k++) {
        pin.style.zoom = z;
        const over = pin.scrollHeight - pin.clientHeight;
        if (over <= 1) break;
        z = Math.max(.62, z * pin.clientHeight / pin.scrollHeight * .985);
        if (z === .62) { pin.style.zoom = z; break; }
      }
      out.push(z);
    });
    return out;
  }

  /* ---------- Dialog ---------- */
  let JOB = null; let OPT = {}; let FITS = null; let seq = 0;
  const $ = id => document.getElementById(id);
  function opts() {
    const box = $('prOpts'); const k = JOB.kind; let h = '';
    h += `<div class="prLab">Design</div><div class="prDesigns">${DESIGNS.map(d => `<button type="button" class="prD prD-${d.k}" data-d="${d.k}" aria-pressed="${OPT.design === d.k}"><i></i><b>${d.n}</b><small>${d.d}</small></button>`).join('')}</div>`;
    if (k === 'tasks') {
      h += `<div class="prLab">Format</div><div class="seg" id="prFmt"><button type="button" data-f="a4" aria-pressed="${!OPT.a5}">A4</button><button type="button" data-f="a5" aria-pressed="${!!OPT.a5}">A5 · 2 pro Blatt</button></div>
      <label class="prChk"><input type="checkbox" class="sw" id="prBig" ${OPT.big ? 'checked' : ''}> Große Schrift</label>
      ${JOB.canSplit ? `<label class="prChk"><input type="checkbox" class="sw" id="prSplit" ${OPT.split ? 'checked' : ''}> Monolog und Dialog auf getrennten Blättern</label><p class="hint" style="margin:0">Erst alle Monolog-Karten, dann alle Dialog-Karten – so kann der Dialog erst nach dem Monolog ausgeteilt werden.</p>` : ''}`;
    } else if (k === 'plan') {
      h += `<div class="prLab">Was drucken?</div><div class="seg" id="prWhat"><button type="button" data-w="plan" aria-pressed="${!OPT.door}">Prüfungsplan</button><button type="button" data-w="door" aria-pressed="${!!OPT.door}">Türaushang</button></div>
      ${OPT.door ? '' : `<div class="prLab">Für wen?</div><div class="seg" id="prWho"><button type="button" data-t="0" aria-pressed="${!OPT.teacher}">Prüflinge</button><button type="button" data-t="1" aria-pressed="${!!OPT.teacher}">Lehrkraft</button></div><p class="hint" style="margin:0">${OPT.teacher ? 'Mit den Aufgaben je Prüfling – nicht an die Prüflinge weitergeben.' : 'Ohne Aufgaben: kann ausgehängt oder verteilt werden.'}</p>`}
      ${OPT.door ? `<label class="prChk"><input type="checkbox" class="sw" id="prNames" ${OPT.names ? 'checked' : ''}> Namen auf dem Aushang zeigen</label><p class="hint" style="margin:0">Ohne Namen sieht der Flur nur Uhrzeiten und Gruppennummern.</p>` : ''}`;
    } else {
      h += `<label class="prChk"><input type="checkbox" class="sw" id="prNames" ${OPT.names ? 'checked' : ''}> Notenliste mit Namen anhängen</label><p class="hint" style="margin:0">Ohne Namen enthält die Übersicht nur Notenspiegel, Durchschnitte und Schlüssel – so kann sie an die Fachschaft gehen.</p>`;
    }
    box.innerHTML = h;
    box.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { OPT.design = b.dataset.d; remember(); opts(); preview(); });
    box.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { OPT.a5 = b.dataset.f === 'a5'; remember(); opts(); preview(); });
    box.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { OPT.teacher = b.dataset.t === '1'; opts(); preview(); });
    box.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { OPT.door = b.dataset.w === 'door'; opts(); preview(); });
    if ($('prBig')) $('prBig').onchange = e => { OPT.big = e.target.checked; remember(); preview(); };
    if ($('prSplit')) $('prSplit').onchange = e => { OPT.split = e.target.checked; remember(); preview(); };
    if ($('prNames')) $('prNames').onchange = e => { OPT.names = e.target.checked; preview(); };
    $('prDocx').hidden = !JOB.docx || (k === 'plan' && OPT.door);
  }
  function remember() { if (JOB.onOpt) JOB.onOpt({ design: OPT.design, a5: !!OPT.a5, big: !!OPT.big, split: !!OPT.split }); }
  async function preview() {
    const my = ++seq; FITS = null;
    const html = await build(JOB, OPT, 'rel', null); if (my !== seq) return;
    const fr = $('prFrame');
    await new Promise(res => { fr.onload = res; fr.srcdoc = html; });
    if (my !== seq) return;
    const doc = fr.contentDocument;
    try { await doc.fonts.ready; } catch (e) {}
    await Promise.all([...doc.images].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; })));
    FITS = measure(doc);
    fr.style.height = (doc.documentElement.scrollHeight + 4) + 'px'; doc.documentElement.style.overflow = 'hidden';
    const small = FITS.filter(z => z < .97).length;
    const n = doc.querySelectorAll(OPT.a5 && JOB.kind === 'tasks' ? '.sheet' : '.page').length;
    $('prInfo').textContent = `${n} ${n === 1 ? 'Seite' : 'Seiten'}${small ? ` · ${small} ${small === 1 ? 'Seite wurde' : 'Seiten wurden'} etwas verkleinert, damit alles draufpasst` : ''}`;
  }
  async function savePdf() {
    if (!FITS) await preview();
    const html = await build(JOB, OPT, 'data', FITS);
    const name = JOB.file(OPT) + '.pdf';
    if (window.native && window.native.pdfFromHtml) { const pdf = await window.native.pdfFromHtml(html); return Export.saveBytes(new Uint8Array(pdf), name, 'pdf'); }
    const w = window.open('', '_blank'); if (!w) return; w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400);
  }
  /* job: { kind:'tasks'|'plan'|'overview', title, models|data, file(opt), docx?, opt, onOpt? } */
  function open(job) {
    JOB = job; OPT = Object.assign({ design: 'nuechtern', a5: false, big: false, split: false, door: false, names: false }, job.opt || {});
    if (!DESIGNS.some(d => d.k === OPT.design)) OPT.design = 'nuechtern';
    $('prTitle').textContent = job.title; $('prInfo').textContent = '';
    opts(); $('prDlg').showModal(); preview();
  }
  function init() {
    $('prPdf').onclick = () => { $('prPdf').disabled = true; savePdf().catch(e => window.toast && toast(e.message || 'PDF fehlgeschlagen')).finally(() => { $('prPdf').disabled = false; }); };
    $('prDocx').onclick = () => { if (JOB.docx) JOB.docx(OPT); };
    const canPrint = !!(window.native && window.native.printHtml); $('prPrint').hidden = !canPrint; $('prPdf').classList.toggle('secondary', canPrint); $('prPdf').textContent = canPrint ? 'PDF speichern' : 'Als PDF speichern';
    $('prPrint').onclick = async () => {
      const b = $('prPrint'); b.disabled = true;
      try {
        if (!FITS) await preview();
        const html = await build(JOB, OPT, 'data', FITS);
        const r = await window.native.printHtml(html);
        /* Abbrechen ist kein Fehler; nur wenn der Druckdialog gar nicht kam, das PDF im Standardprogramm öffnen */
        if (r && !r.ok && r.reason && !/cancel/i.test(r.reason)) { const r2 = await window.native.printViaPdf(html); if (r2 && r2.ok && window.toast) toast('Druckansicht als PDF geöffnet – dort drucken'); }
      } catch (e) { if (window.toast) toast(e.message || 'Drucken fehlgeschlagen'); }
      finally { b.disabled = false; }
    };
    $('prDlg').querySelector('[data-close]').onclick = () => $('prDlg').close();
  }
  return { open, init, build, measure, DESIGNS };
})();
