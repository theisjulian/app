/* Handbuch: zeigt nur die Tastenkürzel und Begriffe des eigenen Systems (?os=mac|win). Ohne Angabe: beides. */
(function () {
  const os = new URLSearchParams(location.search).get('os');
  if (os === 'mac' || os === 'win') document.documentElement.dataset.os = os;
})();
/* Deckblatt (Version, Kennzahlen, Stand) und Inhaltsverzeichnis aus den Bereichen und Unterkapiteln */
document.addEventListener('DOMContentLoaded', () => {
  const q = new URLSearchParams(location.search); const $ = id => document.getElementById(id);
  const chaps = [...document.querySelectorAll('.chap')];
  if ($('cvVer')) $('cvVer').textContent = 'Handbuch' + (q.get('v') ? ' · Version ' + q.get('v') : '');
  if ($('cvThemen')) $('cvThemen').textContent = document.querySelectorAll('.chap section').length;
  if ($('cvBereiche')) $('cvBereiche').textContent = chaps.length;
  if ($('cvStand')) $('cvStand').textContent = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const box = document.querySelector('#toc .cols'); if (!box) return;
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  box.innerHTML = chaps.map(ch => {
    const h = ch.querySelector('h1.ch'); const n = h.querySelector('.n').textContent; const t = h.textContent.replace(n, '').trim();
    const items = [...ch.querySelectorAll('section')].map(s => { const h2 = s.querySelector('h2'); const sn = h2.querySelector('.sn').textContent; return `<a href="#${s.id}"><span>${sn}</span>${esc(h2.textContent.replace(sn, '').trim())}</a>`; }).join('');
    return `<div class="grp"><div class="gh">${n} · ${esc(t)}</div>${items}</div>`;
  }).join('');
});
