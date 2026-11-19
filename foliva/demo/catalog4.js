/* Foliva – Erweiterungen der Bausteine ab 0.9.9 · © 2026 theis
   Klassenstufe für Wort- und Satzsammlungen, Rätselfragen im Kreuzworträtsel, mehr Inhalte für „Richtig oder falsch“, Sachtexte aus der Sammlung. */
(function (root) {
  'use strict';
  const C = root.FolivaCatalog || (typeof require !== 'undefined' ? require('./catalog.js') : null);
  const P = root.FolivaPools || (typeof require !== 'undefined' ? require('./pools3.js') : {});
  const t = (k, label, extra) => ({ k, label, ...extra });
  const isPool = it => it.source && it.source !== 'eigene';
  const T = k => C.TYPES[k];
  const after = (type, key, ...props) => { const ty = T(type); if (!ty) return; let i = -1; ty.props.forEach((p, j) => { if (p.k === key) i = j; }); ty.props.splice(i < 0 ? ty.props.length : i + 1, 0, ...props); };
  /* Arbeitsanweisung folgt der Aufgabenart; mehrere Einstellungen je Baustein möglich (Liste) */
  const setMT = (type, prop, titles) => { const ty = T(type); if (!ty) return; const list = [].concat(ty.modeTitles || []); const m = list.find(x => x.prop === prop); if (m) m.titles = { ...m.titles, ...titles }; else list.push({ prop, titles }); ty.modeTitles = list.length === 1 ? list[0] : list; };
  const andWhen = (p, w) => { if (!p) return; const w0 = p.when; p.when = it => w(it) && (!w0 || w0(it)); };

  /* ---------- Klassenstufe ---------- */
  const STUFE = when => t('stufe', 'Klassenstufe', { type: 'seg', regen: true, fill: true, when, opts: [['', 'alle'], ['12', '1/2'], ['34', '3/4']], hint: '1/2: kurze, lautgetreue Wörter und kurze Sätze. 3/4: längere Wörter und Sätze.' });
  const inSrc = (...s) => it => s.includes(it.source);
  [['pictureword', 'theme', isPool], ['abc', 'theme', isPool], ['wordlist', 'theme', isPool], ['secret', 'theme', isPool], ['wordsearch', 'theme', isPool], ['scramble', 'theme', isPool], ['gap', 'theme', isPool],
    ['crossword', 'theme', inSrc('bilder', 'artikel', 'raetsel')], ['match', 'theme', inSrc('bildwort', 'mehrzahl')], ['choice', 'theme', inSrc('artikel')]].forEach(([k, key, w]) => after(k, key, STUFE(w)));
  C.STUFE_TYPES = new Set(['pictureword', 'abc', 'wordlist', 'secret', 'wordsearch', 'scramble', 'gap', 'crossword', 'match', 'choice', 'truefalse', 'sachtext']);

  /* ---------- Kreuzworträtsel: Rätselfragen ---------- */
  { const cw = T('crossword'); const src = cw.props.find(p => p.k === 'source');
    src.opts = [['raetsel', 'Rätselfragen zu einem Thema'], ['bilder', 'Bilder als Hinweis'], ['artikel', 'Mehrzahl bilden'], ['vokabeln', 'Vokabeln (deutscher Hinweis)'], ['eigene', 'Eigene Wörter und Hinweise']];
    const th = cw.props.find(p => p.k === 'theme'); th.when = inSrc('bilder', 'artikel', 'raetsel');
    const wp = cw.props.find(p => p.k === 'words'); wp.hint = 'Foliva setzt die Wörter automatisch ins Gitter. Gut sind 6–10 Wörter. Wer hier etwas ändert, arbeitet mit eigenen Wörtern weiter – neue Wörter gibt es oben über „Inhalt“.'; }

  /* ---------- Zuordnen: Rätselfrage – Wort ---------- */
  { const m = T('match'); const src = m.props.find(p => p.k === 'source'); const i = src.opts.findIndex(o => o[0] === 'eigene'); src.opts.splice(i < 0 ? src.opts.length : i, 0, ['raetsel', 'Rätselfrage – Wort']);
    const th = m.props.find(p => p.k === 'theme' && !p.dyn); if (th) { const w0 = th.when; th.when = it => it.source === 'raetsel' || (w0 ? w0(it) : false); }
    const st = m.props.find(p => p.k === 'stufe'); if (st) { const w1 = st.when; st.when = it => it.source === 'raetsel' || w1(it); } }

  /* ---------- Richtig oder falsch ---------- */
  { const tf = T('truefalse'); const src = tf.props.find(p => p.k === 'source');
    src.opts = [['eigene', 'Eigene Aussagen'], ['sachwissen', 'Sachwissen (Sammlung)'], ['rechnen', 'Rechnungen prüfen'], ['artikel', 'Artikel prüfen (der, die, das)'], ['steigerung', 'Steigerung von Adjektiven']];
    const tfThemes = () => Object.entries(P.TF || {}).map(([k, v]) => [k, v.name]);
    const nounThemes = () => Object.entries(P.NOUNS || {}).map(([k, v]) => [k, v.name]);
    after('truefalse', 'source',
      t('tftheme', 'Thema', { type: 'select', regen: true, fill: true, opts: tfThemes(), when: inSrc('sachwissen') }),
      t('mop', 'Rechenart', { type: 'seg', regen: true, fill: true, opts: [['+', '+'], ['−', '−'], ['·', '·'], [':', ':']], when: inSrc('rechnen') }),
      t('range', 'Zahlenraum bis', { type: 'number', min: 5, max: 1000000, regen: true, fill: true, when: inSrc('rechnen') }),
      t('theme', 'Thema', { type: 'select', regen: true, fill: true, opts: nounThemes(), when: inSrc('artikel') }),
      STUFE(inSrc('artikel')));
    setMT('truefalse', 'source',  { eigene: 'Kreuze an: richtig oder falsch?', sachwissen: 'Kreuze an: richtig oder falsch?', rechnen: 'Stimmt die Rechnung? Kreuze an.', artikel: 'Stimmt der Artikel? Kreuze an.', steigerung: 'Ist die Steigerung richtig? Kreuze an.' }); }

  /* ---------- Sachtext aus der Sammlung ---------- */
  { const st = T('sachtext');
    const themes = () => [['alle', 'alle Themen'], ...Object.entries(P.SACHTHEMEN || {})];
    st.props.splice(1, 0,
      t('source', 'Inhalt', { type: 'select', regen: true, fill: true, opts: [['eigene', 'Eigener Text'], ['sammlung', 'Sachtext aus der Sammlung']] }),
      t('stheme', 'Thema', { type: 'select', regen: true, fill: true, opts: themes(), when: isPool }),
      STUFE(isPool));
    const mk = st.make; st.make = p => ({ ...mk(p), source: 'sammlung', stheme: 'alle' });
    st.hint = 'Aus der Sammlung: kurze Sachtexte mit Fragen und Musterantworten (Lösungsblatt). Wer den Text ändert, arbeitet mit eigenem Text weiter.'; }

  /* ================= Mathematik ================= */

  /* Rechenpäckchen: Ergänzen, Verdoppeln/Halbieren, Zehner- und Hunderterzahlen */
  { const pk = T('packet'); const pf = pk.props.find(p => p.k === 'pform'); const ei = pf.opts.findIndex(o => o[0] === 'eigene');
    pf.opts.splice(ei < 0 ? pf.opts.length : ei, 0, ['ergaenzen', 'Ergänzen (bis 10, 20, 100 …)'], ['verdoppeln', 'Verdoppeln'], ['halbieren', 'Halbieren'], ['dophalb', 'Verdoppeln und Halbieren']);
    const SPECIAL = ['ergaenzen', 'verdoppeln', 'halbieren', 'dophalb'];
    after('packet', 'pform',
      t('eart', 'Ergänzen', { type: 'seg', regen: true, opts: [['', 'bis zur Zielzahl'], ['zehner', 'zum nächsten Zehner'], ['hunderter', 'zum Hunderter']], when: it => it.pform === 'ergaenzen' }),
      t('target', 'Zielzahl (leer = Zahlenraum)', { type: 'number', min: 2, max: 1000000, empty: true, regen: true, when: it => it.pform === 'ergaenzen' && !it.eart || it.eart === 'ziel' }),
      t('unit', 'Zahlen', { type: 'seg', regen: true, onSet: it => { if (it.unit === '10' && !(+it.range >= 100)) it.range = 100; if (it.unit === '100' && !(+it.range >= 1000)) it.range = 1000; }, opts: [['', 'alle'], ['10', 'nur Zehner (30 + 40)'], ['100', 'nur Hunderter']], when: it => (it.pform || 'zufall') === 'zufall' }));
    pk.props.forEach(p => { if (['transition', 'rows', 'rest', 'missing'].includes(p.k)) andWhen(p, it => !SPECIAL.includes(it.pform)); if (p.k === 'op') andWhen(p, it => !['verdoppeln', 'halbieren', 'dophalb'].includes(it.pform)); if (p.k === 'zero') andWhen(p, it => !['verdoppeln', 'halbieren', 'dophalb'].includes(it.pform)); });
    setMT('packet', 'pform', { zufall: 'Rechne.', schoen: 'Rechne. Was fällt dir auf?', tausch: 'Rechne die Tauschaufgaben.', umkehr: 'Rechne die Umkehraufgaben.', nachbar: 'Rechne die Nachbaraufgaben.', eigene: 'Rechne.', ergaenzen: 'Ergänze.', verdoppeln: 'Verdopple.', halbieren: 'Halbiere.', dophalb: 'Verdopple und halbiere.' });
    pk.words += ' ergänzen ergänzung verdoppeln halbieren verdopplung halbierung zehnerzahlen hunderterzahlen analogaufgaben'; }

  /* Zahlenmauer: auch als Malmauer */
  { after('wall', 'title', t('wop', 'Rechenart', { type: 'seg', regen: true, onSet: it => { if (it.wop === '·' && !(+it.range >= 50)) it.range = 100; }, opts: [['', 'Plus'], ['·', 'Mal (Malmauer)']] }));
    andWhen(T('wall').props.find(p => p.k === 'zero'), it => it.wop !== '·');
    setMT('wall', 'wop', { '': 'Fülle die Zahlenmauern aus.', '·': 'Fülle die Malmauern aus. Multipliziere.' }); T('wall').words += ' malmauer multiplikation'; }

  /* Vergleichen: Aufgaben auf einer oder beiden Seiten, alle Rechenarten, Größen */
  { const cp = T('compare'); const md = cp.props.find(p => p.k === 'mode');
    md.type = 'select'; md.opts = [['zahlen', 'Zahlen vergleichen'], ['terme', 'Aufgabe und Zahl'], ['terme2', 'Aufgabe und Aufgabe'], ['groessen', 'Größen (m und cm, € und ct …)']];
    after('compare', 'mode',
      t('cop', 'Rechenart', { type: 'select', regen: true, opts: [['+', 'Plus'], ['−', 'Minus'], ['+−', 'Plus und Minus'], ['·', 'Mal'], ['·:', 'Mal und Geteilt'], ['alle', 'alle gemischt']], when: it => it.mode === 'terme' || it.mode === 'terme2' }),
      t('gkind', 'Größen', { type: 'select', regen: true, opts: [['', 'gemischt'], ['laengen', 'Längen'], ['gewichte', 'Gewichte'], ['geld', 'Geld'], ['zeit', 'Zeit'], ['hohl', 'Hohlmaße']], when: it => it.mode === 'groessen' }));
    andWhen(cp.props.find(p => p.k === 'range'), it => it.mode !== 'groessen');
    setMT('compare', 'mode', { terme2: 'Rechne und vergleiche. Setze ein: <, > oder =.', groessen: 'Vergleiche die Größen. Setze ein: <, > oder =.' }); cp.words += ' größen vergleichen terme'; }

  /* Zahlenstrahl: Zahlen markieren */
  { after('numberline', 'title', t('nmode', 'Aufgabe', { type: 'seg', regen: true, opts: [['', 'Zahlen eintragen'], ['markieren', 'Zahlen markieren']] }));
    const bl = T('numberline').props.find(p => p.k === 'blanks'); if (bl) bl.label = 'Anzahl gesuchter Zahlen';
    setMT('numberline', 'nmode', { '': 'Trage die fehlenden Zahlen ein.', markieren: 'Markiere die Zahlen am Zahlenstrahl.' }); }

  /* Uhrzeiten: vormittags und nachmittags/abends */
  { after('clock', 'step', t('daynight', 'Auch Uhrzeiten am Nachmittag und Abend (z. B. 19:30 Uhr)', { type: 'toggle', regen: true, when: it => it.mode !== 'spanne' })); }

  /* Rechendreieck: innen und außen gemischt */
  { const md = T('triangle').props.find(p => p.k === 'mode'); md.type = 'select'; md.opts = [['innen', 'Innen gegeben – außen rechnen'], ['aussen', 'Außen gegeben – innen finden'], ['gemischt', 'Abwechselnd'], ['mix', 'Innen und außen gemischt']]; }

  /* Geld: Rückgeld */
  { const md = T('money').props.find(p => p.k === 'mode'); md.type = 'select'; md.opts = [['zaehlen', 'Geld zählen'], ['legen', 'Betrag legen'], ['rueckgeld', 'Rückgeld berechnen']];
    setMT('money', 'mode', { rueckgeld: 'Wie viel Rückgeld bekommst du?' }); T('money').words += ' rückgeld bezahlen einkaufen'; }

  /* Geld: gezeichnet oder echte Abbildungen */
  { after('money', 'mode', t('mlook', 'Darstellung', { type: 'seg', opts: [['', 'gezeichnet'], ['echt', 'echte Scheine und Münzen']], hint: 'Echte Abbildungen: Banknoten und Münzen der Europäischen Zentralbank. Die Scheine tragen den Aufdruck „SPECIMEN“ und sind stark verkleinert – so erlauben es die Regeln der EZB.' })); }

  /* Stellenwerte: zerlegen und zusammensetzen */
  { const md = T('placevalue').props.find(p => p.k === 'mode'); md.type = 'select'; md.opts = [['eintragen', 'Zahl in die Tafel eintragen'], ['ablesen', 'Zahl aus der Tafel ablesen'], ['gemischt', 'Tafel gemischt'], ['zerlegen', 'Zahl zerlegen (3 H + 4 Z + 5 E)'], ['zusammen', 'Zahl zusammensetzen'], ['plus', 'Zahl als Summe (300 + 40 + 5)']];
    setMT('placevalue', 'mode', { zerlegen: 'Zerlege die Zahlen.', zusammen: 'Schreibe die Zahl.', plus: 'Zerlege die Zahlen in Stellenwerte.' }); T('placevalue').words += ' zerlegen stellenwertschreibweise'; }

  /* Halbschriftlich: Rechenstrategien */
  { after('halbschriftlich', 'op', t('strat', 'Rechenweg', { type: 'seg', regen: true, opts: [['', 'schrittweise'], ['stellen', 'Stellenwerte extra'], ['hilfs', 'Hilfsaufgabe']], when: it => (it.op || '+') === '+' || it.op === '−' }));
    setMT('halbschriftlich', 'strat', { '': 'Rechne schrittweise.', stellen: 'Rechne Stellenwerte extra.', hilfs: 'Rechne mit einer Hilfsaufgabe.' }); }

  /* Bild und Wort: Mehrzahl, Silben als Zahl */
  { const pw = T('pictureword'); const md = pw.props.find(p => p.k === 'mode'); md.opts = md.opts.concat([['mehrzahl', 'Mehrzahl schreiben']]);
    after('pictureword', 'mode', t('sylask', 'Silben', { type: 'seg', opts: [['', 'Bögen malen'], ['zahl', 'Anzahl ankreuzen']], when: it => it.mode === 'silben' }));
    setMT('pictureword', 'mode', { mehrzahl: 'Schreibe die Mehrzahl.' }); }

  /* Diagramm: Strichliste */
  { const ch = T('chart'); const k = ch.props.find(p => p.k === 'kind'); k.opts = k.opts.concat([['strich', 'Strichliste']]);
    after('chart', 'kind', t('tally', 'Aufgabe', { type: 'seg', opts: [['', 'Striche zählen'], ['zeichnen', 'Striche zeichnen']], when: it => it.kind === 'strich' }));
    ch.props.forEach(p => { if (['empty', 'tableBelow', 'h', 'max'].includes(p.k)) andWhen(p, it => it.kind !== 'strich'); });
    setMT('chart', 'kind', { saeulen: 'Zeichne das Säulendiagramm.', linie: 'Zeichne das Liniendiagramm.', strich: o => o.tally === 'zeichnen' ? 'Mache für jede Anzahl Striche.' : 'Zähle die Striche. Schreibe die Anzahl.' });
    setMT('chart', 'tally', { '': 'Zähle die Striche. Schreibe die Anzahl.', zeichnen: 'Mache für jede Anzahl Striche.' }); }

  /* Zahlenhaus: auch als Malhaus */
  { after('house', 'title', t('hop', 'Rechenart', { type: 'seg', regen: true, onSet: it => { if (it.hop === '·' && !(+it.range >= 24)) it.range = 100; }, opts: [['', 'Plus (Zerlegen)'], ['·', 'Mal (Malhaus)']] }));
    andWhen(T('house').props.find(p => p.k === 'zero'), it => it.hop !== '·');
    setMT('house', 'hop', { '': 'Ergänze die Zahlenhäuser.', '·': 'Ergänze die Malhäuser.' }); T('house').words += ' malhaus einmaleins zerlegen'; }

  /* Größen: Kommaschreibweise (Klasse 4) */
  { const lv = T('units').props.find(p => p.k === 'level'); if (lv) { lv.opts = [['gs', 'Grundschule'], ['gs4', 'Kl. 4: mit Komma (Geld, Längen)'], ['sek', 'ab Kl. 5']]; lv.type = 'select'; } }

  /* Sachaufgaben in zwei Schritten */
  { const so = T('sachaufgabe').props.find(p => p.k === 'sop'); if (so) so.opts = so.opts.concat([['zwei', 'Zwei Rechenschritte (Kl. 3/4)']]); }

  /* ================= Formen und Lineaturen als Bildpalette (wie im Worksheet Crafter) ================= */
  const SHAPE_OPTS = [['rect', 'Rechteck / Quadrat'], ['round', 'Abgerundetes Rechteck'], ['ellipse', 'Kreis / Ellipse'], ['triangle', 'Dreieck'], ['rtriangle', 'Rechtwinkliges Dreieck'], ['trapez', 'Trapez'], ['parallel', 'Parallelogramm'], ['diamond', 'Raute'], ['pentagon', 'Fünfeck'], ['hexagon', 'Sechseck'], ['octagon', 'Achteck'], ['star', 'Stern'], ['heart', 'Herz'], ['cloud', 'Wolke'], ['cross', 'Kreuz'], ['pie', 'Kreis in Teilen'], ['sector', 'Viertelkreis'],
    ['line', 'Linie'], ['arrow', 'Pfeil'], ['darrow', 'Doppelpfeil'], ['arrowblock', 'Blockpfeil'], ['arc', 'Bogen'], ['arcarrow', 'Bogen mit Pfeil'], ['curve', 'Wellenlinie'], ['scurve', 'Geschwungene Linie'], ['scurvearrow', 'Geschwungener Pfeil'], ['brace', 'Geschweifte Klammer'],
    ['cube', 'Würfel'], ['cuboid', 'Quader'], ['cylinder', 'Zylinder'], ['cone', 'Kegel'], ['pyramid', 'Pyramide'], ['sphere', 'Kugel']];
  /* Gruppe „Gestalten“ klar abgrenzen: Formen stehen in der eigenen Bildpalette (über die Suche weiterhin auffindbar) */
  { const g = C.GROUPS.find(x => x.id === 'gestalten'); if (g) g.name = 'Sprechblase, QR-Code, Trennlinie'; T('shape').group = 'palette'; Object.keys(C.ALSO || {}).forEach(k => { C.ALSO[k] = (C.ALSO[k] || []).filter(x => x !== 'shape'); }); }
  { const sh = T('shape'); sh.name = 'Form, Linie oder Pfeil'; sh.words += ' quadrat trapez parallelogramm achteck kreuz kreisteile tortendiagramm bogenpfeil verbindungspfeil klammer würfel quader zylinder kegel pyramide kugel körper';
    const sp = sh.props.find(p => p.k === 'shape'); sp.opts = SHAPE_OPTS;
    after('shape', 'shape', t('parts', 'Anzahl Teile', { type: 'number', min: 2, max: 24, when: it => it.shape === 'pie' }), t('filled', 'Davon gefärbt', { type: 'number', min: 0, max: 24, when: it => it.shape === 'pie' }));
    const hp = sh.props.find(p => p.k === 'h'); if (hp) andWhen(hp, it => !['line', 'arrow', 'darrow'].includes(it.shape));
    sh.hint = 'Tipp: Größe am blauen Griff unten rechts ziehen (mit Umschalttaste bleiben die Seitenverhältnisse gleich). Beim Verschieben helfen magnetische Hilfslinien.'; }
  const I = (inner, vb = '0 0 40 28') => `<svg viewBox="${vb}" width="40" height="28" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${inner}</svg>`;
  const S = (shape, label, w, h, icon, extra = {}) => ({ type: 'shape', label, props: { shape, w, h, ...extra }, icon: I(icon) });
  const FORMEN = [
    S('line', 'Linie', 50, 6, '<path d="M6 14h28"/>'), S('arrow', 'Pfeil', 50, 6, '<path d="M6 14h26"/><path d="M29 10.5 34 14l-5 3.5Z" fill="currentColor"/>'),
    S('darrow', 'Doppelpfeil', 50, 6, '<path d="M8 14h24"/><path d="M29 10.5 34 14l-5 3.5ZM11 10.5 6 14l5 3.5Z" fill="currentColor"/>'), S('arcarrow', 'Bogen mit Pfeil', 30, 12, '<path d="M7 21A13 13 0 0 1 33 20"/><path d="M30 18l3 5 3-5Z" fill="currentColor"/>'),
    S('arc', 'Bogen', 30, 12, '<path d="M7 22A13 13 0 0 1 33 22"/>'), S('scurve', 'Geschwungene Linie', 30, 14, '<path d="M6 22C20 22 20 6 34 6"/>'),
    S('scurvearrow', 'Geschwungener Pfeil', 30, 14, '<path d="M6 22C20 22 20 6 32 6"/><path d="M30 3l5 3-5 3Z" fill="currentColor"/>'), S('curve', 'Wellenlinie', 40, 12, '<path d="M5 20C12 4 22 26 35 8"/>'),
    S('rect', 'Rechteck', 40, 25, '<rect x="7" y="6" width="26" height="16"/>'), S('rect', 'Quadrat', 25, 25, '<rect x="12" y="5" width="18" height="18"/>'),
    S('round', 'Abgerundetes Rechteck', 40, 25, '<rect x="7" y="6" width="26" height="16" rx="4"/>'), S('ellipse', 'Kreis', 25, 25, '<circle cx="20" cy="14" r="9"/>'),
    S('ellipse', 'Ellipse', 40, 25, '<ellipse cx="20" cy="14" rx="13" ry="8"/>'), S('triangle', 'Dreieck', 30, 25, '<path d="M20 5 32 23H8Z"/>'),
    S('rtriangle', 'Rechtwinkliges Dreieck', 30, 25, '<path d="M10 5 30 23H10Z"/>'), S('trapez', 'Trapez', 40, 22, '<path d="M13 7h14l7 15H6Z"/>'),
    S('parallel', 'Parallelogramm', 40, 22, '<path d="M13 7h21l-7 15H6Z"/>'), S('diamond', 'Raute', 30, 30, '<path d="M20 4 30 14 20 24 10 14Z"/>'),
    S('pentagon', 'Fünfeck', 28, 27, '<path d="M20 4 30 11.5 26.5 23h-13L10 11.5Z"/>'), S('hexagon', 'Sechseck', 30, 26, '<path d="M14 5h12l6 9-6 9H14l-6-9Z"/>'),
    S('octagon', 'Achteck', 28, 28, '<path d="M16 4h8l6 6v8l-6 6h-8l-6-6v-8Z"/>'), S('cross', 'Kreuz', 26, 26, '<path d="M17 4h6v7h7v6h-7v7h-6v-7h-7v-6h7Z"/>'),
    S('star', 'Stern', 30, 30, '<path d="M20 3.5l3 7.6 8 .4-6.2 5.1 2.1 7.9L20 20l-6.9 4.5 2.1-7.9L9 11.5l8-.4Z"/>'), S('heart', 'Herz', 30, 27, '<path d="M20 24C9 17 8 9 13 6.5c3-1.4 6 .3 7 3 1-2.7 4-4.4 7-3 5 2.5 4 10.5-7 17.5Z"/>'),
    S('arrowblock', 'Blockpfeil', 40, 20, '<path d="M5 11h18V6l12 8-12 8v-5H5Z"/>'), S('cloud', 'Wolke', 40, 26, '<path d="M12 23c-6 0-6-8 0-8 0-6 9-8 11-3 3-3 10-1 9 4 4 1 3 7-2 7Z"/>'),
    S('pie', 'Kreis in Teilen', 30, 30, '<circle cx="20" cy="14" r="10"/><path d="M20 4v20M10 14h20M13 7l14 14M27 7 13 21"/><path d="M20 14V4A10 10 0 0 1 27 7Z" fill="currentColor" opacity=".35"/>', { parts: 8, filled: 0 }), S('brace', 'Geschweifte Klammer', 8, 30, '<path d="M16 4q4 0 4 4v3q0 3 3 3-3 0-3 3v3q0 4-4 4"/>'),
    S('cube', 'Würfel', 30, 30, '<path d="M9 10h14v14H9Z"/><path d="M9 10l5-5h14v14l-5 5M23 10l5-5"/>'), S('cuboid', 'Quader', 40, 26, '<path d="M7 11h20v13H7Z"/><path d="M7 11l6-6h20v13l-6 6M27 11l6-6"/>'),
    S('cylinder', 'Zylinder', 24, 32, '<ellipse cx="20" cy="7" rx="8" ry="3"/><path d="M12 7v15a8 3 0 0 0 16 0V7"/>'), S('cone', 'Kegel', 26, 32, '<path d="M20 3 28 22a8 3 0 0 1-16 0Z"/>'),
    S('pyramid', 'Pyramide', 32, 30, '<path d="M20 3 32 21 26 25H8Z M20 3 26 25"/>'), S('sphere', 'Kugel', 28, 28, '<circle cx="20" cy="14" r="10"/><path d="M10 14a10 3 0 0 0 20 0"/>'),
  ];
  /* Lineaturen: Symbol aus den echten Maßen gezeichnet */
  const LIN = [['g1', 'Klasse 1'], ['g2', 'Klasse 2'], ['g3', 'Klasse 3'], ['g4', 'Klasse 4'], ['k5', 'Kariert 5 mm'], ['k7', 'Kariert 7 mm'], ['k10', 'Kariert 10 mm']];
  { const kp = T('lineatur').props.find(p => p.k === 'kind'); if (kp && !kp.opts.some(o => o[0] === 'g1')) kp.opts = [['g1', 'Klasse 1 · Kastenzeile 3 × 5 mm'], ['g2', 'Klasse 2 · Kastenzeile 3 × 4 mm'], ['g3', 'Klasse 3 · Mittelband 4 mm'], ['g4', 'Klasse 4 · Linien'], ...kp.opts]; }
  function linIcon(k) {
    const R = root.FolivaRender; const L = R && R.LINEATUR && R.LINEATUR[k]; if (!L) return I('<path d="M6 10h28M6 18h28"/>');
    if (L.karo) { const s = L.karo === 5 ? 4 : L.karo === 7 ? 5.5 : 7.5; let p = ''; for (let x = 4; x <= 36; x += s) p += `M${f(x)} 3V25`; for (let y = 3; y <= 25; y += s) p += `M4 ${f(y)}H36`; return I(`<path d="${p}" stroke-width=".7"/>`); }
    if (L.line) { const s = L.line >= 10 ? 9 : 8; let p = ''; for (let y = 5; y <= 25; y += s) p += `M5 ${y}H35`; return I(`<path d="${p}"/>`); }
    if (L.plain) { const tot = L.a + L.m + L.d, sc = 11 / Math.max(tot, 6); let out = '';
      [3, 15].forEach(y0 => { if (L.only === 'mid') out += `<rect x="5" y="${f(y0 + 3)}" width="30" height="${f(L.m * sc * .9)}"/>`; else { const h = tot * sc; out += `<rect x="5" y="${f(y0)}" width="30" height="${f(h)}"/><path d="M5 ${f(y0 + L.a * sc)}H35M5 ${f(y0 + (L.a + L.m) * sc)}H35"/>`; } });
      return I(out); }
    const tot = L.a + L.m + L.d, sc = 11 / tot; let out = '';
    [2.5, 15].forEach(y0 => { const ya = y0, yb = y0 + L.a * sc, yc = y0 + (L.a + L.m) * sc, yd = y0 + tot * sc;
      if (L.only !== 'none') out += L.tint === 'all' ? `<rect x="5" y="${f(ya)}" width="30" height="${f(yd - ya)}" fill="currentColor" opacity=".18" stroke="none"/>` : `<rect x="5" y="${f(yb)}" width="30" height="${f(yc - yb)}" fill="currentColor" opacity=".18" stroke="none"/>`;
      if (L.only === 'outer') out += L.box ? `<rect x="5" y="${f(ya)}" width="30" height="${f(yd - ya)}"/>` : `<path d="M5 ${f(ya)}H35M5 ${f(yd)}H35"/>`;
      else if (L.only === 'mid') out += `<rect x="5" y="${f(yb)}" width="30" height="${f(yc - yb)}"/>`;
      else if (L.box) out += `<rect x="5" y="${f(ya)}" width="30" height="${f(yd - ya)}"/><path d="M5 ${f(yb)}H35M5 ${f(yc)}H35" stroke-width=".9"/>`;
      else if (L.two) out += `<path d="M5 ${f(yb)}H35M5 ${f(yc)}H35"/>`;
      else out += `<path d="M5 ${f(ya)}H35M5 ${f(yd)}H35" ${L.outer === 'dot' ? 'stroke-dasharray="1 1.4"' : ''} stroke-width=".9"/><path d="M5 ${f(yb)}H35M5 ${f(yc)}H35"/>`; });
    return I(out);
  }
  const f = v => (+v).toFixed(1);
  C.PALETTES = [
    { id: 'p_formen', name: 'Formen, Pfeile und Körper (zum Ziehen)', after: 'gestalten', items: FORMEN },
    { id: 'p_lineaturen', name: 'Lineaturen', after: 'deutsch', hint: 'Unten rechts am Griff ziehen: Zeilen dazu oder weg.', items: () => LIN.filter(([k]) => root.FolivaRender && root.FolivaRender.LINEATUR && root.FolivaRender.LINEATUR[k]).map(([k]) => ({ type: 'lineatur', label: LIN.find(x => x[0] === k)[1], title: root.FolivaRender.LINEATUR[k].name, props: { kind: k, text: '', rows: 3 }, icon: linIcon(k) })) },
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = C; else root.FolivaCatalog = C;
})(typeof window !== 'undefined' ? window : globalThis);
