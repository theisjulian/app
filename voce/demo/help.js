/* Anleitung: zeigt nur die Tastenkürzel und Begriffe des eigenen Systems (?os=mac|win). Ohne Angabe: beides. */
(function () {
  const os = new URLSearchParams(location.search).get('os');
  if (os === 'mac' || os === 'win') document.documentElement.dataset.os = os;
})();
