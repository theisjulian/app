/* Anleitung: zeigt nur die Tastenkürzel und Begriffe des eigenen Systems (?os=mac|win). Ohne Angabe: beides. */
(function () {
  const os = new URLSearchParams(location.search).get('os');
  if (os === 'mac' || os === 'win') document.documentElement.dataset.os = os;
})();
/* Deckblatt (nur im Druck): Version und Datum */
document.addEventListener('DOMContentLoaded', () => { const q = new URLSearchParams(location.search); const el = document.getElementById('cvVer'); if (el) el.textContent = (q.get('v') ? 'Version ' + q.get('v') + ' · ' : '') + new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }); });
