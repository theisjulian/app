/* theis · Namen sortieren wie auf bayerischen Klassenlisten (ASV): vorangestellte Namensbestandteile
   („von“, „Freiherr von“, „Gräfin zu“ …) zählen nicht zum Sortierwort – „Freiherr von Musterberg“ steht bei M.
   Grundlage: DIN 5007-2 (Namensvorsätze und Titel sind kein Ordnungswort), ASV-Feld „Namensbestandteil vorangestellt“.
   © 2026 theis */
(function (root) {
  'use strict';
  /* Adelsbezeichnungen (männlich, weiblich, Tochterform) samt üblicher Abkürzungen */
  const TITLES = new Set(('kaiser kaiserin könig königin kronprinz kronprinzessin kurprinz kurprinzessin erzherzog erzherzogin großherzog großherzogin grossherzog grossherzogin ' +
    'erbgroßherzog erbgroßherzogin kurfürst kurfürstin herzog herzogin großfürst großfürstin fürst fürstin prinz prinzessin erbprinz erbprinzessin ' +
    'landgraf landgräfin markgraf markgräfin pfalzgraf pfalzgräfin burggraf burggräfin altgraf altgräfin raugraf raugräfin rheingraf rheingräfin wildgraf wildgräfin ' +
    'graf gräfin reichsgraf reichsgräfin erbgraf erbgräfin komtess komtesse comtesse freiherr freifrau freiin reichsfreiherr reichsfreifrau reichsfreiin ' +
    'baron baronin baroness baronesse ritter reichsritter edler edle junker junkfrau frhr frfr frn gf').split(' '));
  /* Deutsche Präpositionen/Artikel – unabhängig von der Schreibung */
  const DE = new Set('von vom zu zum zur und der dem den auf am an aus in im vor genannt gen v v. d. u. z.'.split(' '));
  /* Niederländische, französische und spanische Vorsätze – nur kleingeschrieben („van der Meer“ → M, aber „De Luca“ → D) */
  const LOWER = new Set('van de ter ten te den der het du des del dos da las los la le'.split(' '));

  function sortWord(last) {
    const parts = String(last || '').trim().split(/\s+/).filter(Boolean);
    let i = 0;
    while (i < parts.length - 1) {
      const raw = parts[i], t = raw.toLowerCase().replace(/[,;]$/, ''), bare = t.replace(/\.$/, '');
      if (TITLES.has(bare)) { i++; continue; }
      if (DE.has(t) || DE.has(bare)) { i++; continue; }
      if (LOWER.has(t) && raw === t) { i++; continue; }
      break;
    }
    return parts.slice(i).join(' ');
  }
  const coll = new Intl.Collator('de', { sensitivity: 'base', numeric: true });
  /* Vergleich: Sortierwort, dann Namen ohne Zusatz vor solchen mit Zusatz, dann Vorname */
  function compare(a, b) {
    const la = a.last != null ? a.last : String(a.name || '').split(',')[0], lb = b.last != null ? b.last : String(b.name || '').split(',')[0];
    const fa = a.first != null ? a.first : (String(a.name || '').split(',')[1] || ''), fb = b.first != null ? b.first : (String(b.name || '').split(',')[1] || '');
    return coll.compare(sortWord(la), sortWord(lb)) || coll.compare(la.trim(), lb.trim()) || coll.compare(fa.trim(), fb.trim());
  }
  const api = { sortWord, compare };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Names = api;
})(typeof self !== 'undefined' ? self : this);
