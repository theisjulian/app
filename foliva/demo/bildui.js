/* Foliva – Bildbibliothek (mitgeliefert, offline) · © 2026 theis
   Bilder: Noto Emoji von Google (Apache 2.0), Flaggen gemeinfrei; deutsche Namen: emojibase-data (MIT). Register: bilder/REGISTER.json */
'use strict';
const BildUI = (() => {
  const B = () => window.FolivaBilder || { groups: [], packs: [], items: [] };
  const norm = s => String(s || '').toLowerCase().normalize('NFC');
  let INDEX = null;
  function index() { if (INDEX) return INDEX; const m = new Map(); B().items.forEach(i => m.set(i.f, i)); INDEX = m; return m; }
  const byFile = f => index().get(f);
  /* Bild zu einem Wort für Bildaufgaben (Anlaut, Wort schreiben, Kreuzworträtsel …).
     Nur von Hand geprüfte, eindeutige Zuordnungen – keine automatische Namenssuche, damit kein falsches Bild erscheint. */
  const PICMAP = (window.FolivaPools && window.FolivaPools.PICS) || {};
  const forWord = w => { const f = PICMAP[String(w || '').trim()]; return f && byFile(f) ? f : null; };
  const pictureWords = () => Object.keys(PICMAP).filter(w => byFile(PICMAP[w]));
  function search(term, group) {
    const t = norm(term).trim(); const all = B().items;
    let list = group ? (group.startsWith('p-') ? (B().packs.find(p => p.id === group) || { files: [] }).files.map(byFile).filter(Boolean) : all.filter(i => i.g === group)) : all;
    if (t) { const words = t.split(/\s+/); list = list.filter(i => words.every(w => norm(i.n + ' ' + i.t).includes(w))); list.sort((a, b) => (norm(a.n).startsWith(t) ? 0 : 1) - (norm(b.n).startsWith(t) ? 0 : 1)); }
    return list;
  }
  /* Auswahl-Dialog. Ergebnis: 'lib:<datei>' oder dataURL eines eigenen Bilds oder null */
  function pick(opts = {}) {
    return new Promise(resolve => {
      let group = opts.group || '', term = opts.term || '', shown = 0, list = [];
      dialog({ title: 'Bild einfügen', wide: true, closeLabel: 'Abbrechen', html: `
        <div class="bildTop"><div class="search">${ICO.search}<input type="search" id="bq" placeholder="Suchen, z. B. Igel, Feuerwehr, Apfel, Uhr …" value="${esc(term)}"></div><button class="tb" id="bOwn">Eigenes Bild vom Computer …</button></div>
        <div class="bildWrap"><nav class="bildNav" id="bNav"></nav><div class="bildGrid" id="bGrid" role="listbox" aria-label="Bilder"></div></div>
        <p class="hint" style="margin:8px 0 0">Mitgeliefert und offline: ${B().items.length} Bilder (Noto Emoji, Apache 2.0; Flaggen gemeinfrei). Namen und Lizenzen je Bild in „Über Foliva“.</p>`,
        onOpen: (dl, close) => {
          const nav = dl.querySelector('#bNav'), grid = dl.querySelector('#bGrid'), q = dl.querySelector('#bq');
          const navItems = [['', 'Alle Bilder'], ...B().packs.map(p => [p.id, p.name.replace('Themenpaket ', '★ ')]), ...B().groups.map(g => [g.id, g.name])];
          nav.innerHTML = navItems.map(([id, n]) => `<button type="button" data-g="${id}" class="${id === group ? 'on' : ''}">${esc(n)}</button>`).join('');
          const more = () => {
            const part = list.slice(shown, shown + 240); shown += part.length;
            grid.insertAdjacentHTML('beforeend', part.map(i => `<button type="button" class="bimg" data-f="${esc(i.f)}" title="${esc(i.n)}" role="option"><img src="bilder/${esc(i.f)}" alt="" loading="lazy" decoding="async"><span>${esc(i.n)}</span></button>`).join(''));
            grid.querySelectorAll('.bimg:not([data-b])').forEach(b => { b.dataset.b = 1; b.onclick = () => { close(); resolve('lib:' + b.dataset.f); }; });
          };
          const draw = () => { list = search(q.value, group); shown = 0; grid.innerHTML = list.length ? '' : '<p class="hint" style="padding:12px">Nichts gefunden. Andere Wörter versuchen.</p>'; grid.scrollTop = 0; more(); };
          grid.addEventListener('scroll', () => { if (grid.scrollTop + grid.clientHeight > grid.scrollHeight - 300 && shown < list.length) more(); });
          nav.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { group = b.dataset.g; nav.querySelectorAll('[data-g]').forEach(x => x.classList.toggle('on', x === b)); draw(); });
          q.oninput = draw; draw(); q.focus();
          dl.querySelector('#bOwn').onclick = async () => { const r = await N.pickImage(); if (!r) return; if (r.error) return toast(r.error, 4000); const src = await shrinkImage(r.dataUrl); close(); resolve(src); };
        } }).then(() => resolve(null));
    });
  }
  return { pick, forWord, pictureWords, PICMAP, byFile, search, get data() { return B(); } };
})();
