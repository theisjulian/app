/* Libretto · Ferien und Feiertage in Bayern · © 2026 theis
   Ferientermine nach der KMBek „Ferienordnung und schulfreie Samstage für die Schuljahre 2024/2025 bis 2029/2030“ vom 07.12.2022
   (IV.7-BS4407/521/59, BayMBl. 2022 Nr. 747), abgeglichen am 17.11.2026 – genehmigte Abweichungen einzelner Schulen (Nr. 1.3/1.4) in der App ergänzbar.
   COVERED_UNTIL: letzter hinterlegter Tag. Danach liefert Libretto keine kalendergestützten Fristen. */
(function (root) {
  'use strict';
  const FERIEN = [
    // Schuljahr 2026/27
    ['Herbstferien', '2026-11-02', '2026-11-06'], ['Buß- und Bettag', '2026-11-18', '2026-11-18'], ['Weihnachtsferien', '2026-12-24', '2027-01-08'],
    ['Frühjahrsferien', '2027-02-08', '2027-02-12'], ['Osterferien', '2027-03-22', '2027-04-02'], ['Pfingstferien', '2027-05-18', '2027-05-28'], ['Sommerferien', '2027-08-02', '2027-09-13'],
    // Schuljahr 2027/28
    ['Herbstferien', '2027-11-02', '2027-11-05'], ['Buß- und Bettag', '2027-11-17', '2027-11-17'], ['Weihnachtsferien', '2027-12-24', '2028-01-07'],
    ['Frühjahrsferien', '2028-02-28', '2028-03-03'], ['Osterferien', '2028-04-10', '2028-04-21'], ['Pfingstferien', '2028-06-06', '2028-06-16'], ['Sommerferien', '2028-07-31', '2028-09-11'],
    // Schuljahr 2028/29
    ['Herbstferien', '2028-10-30', '2028-11-03'], ['Buß- und Bettag', '2028-11-22', '2028-11-22'], ['Weihnachtsferien', '2028-12-23', '2029-01-05'],
    ['Frühjahrsferien', '2029-02-12', '2029-02-16'], ['Osterferien', '2029-03-26', '2029-04-06'], ['Pfingstferien', '2029-05-22', '2029-06-01'], ['Sommerferien', '2029-07-30', '2029-09-10'],
    // Schuljahr 2029/30
    ['Herbstferien', '2029-10-29', '2029-11-02'], ['Buß- und Bettag', '2029-11-21', '2029-11-21'], ['Weihnachtsferien', '2029-12-24', '2030-01-04'],
    ['Frühjahrsferien', '2030-03-04', '2030-03-08'], ['Osterferien', '2030-04-15', '2030-04-26'], ['Pfingstferien', '2030-06-11', '2030-06-21'], ['Sommerferien', '2030-07-29', '2030-09-09'],
  ].map(([name, from, to]) => ({ name, from, to }));

  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const add = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  function easter(y) { // Gauß/Anonymer gregorianischer Algorithmus
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
      h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
      month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, month - 1, day);
  }
  /* Gesetzliche Feiertage in Bayern (Mariä Himmelfahrt nur in Gemeinden mit überwiegend katholischer Bevölkerung, Augsburger Friedensfest nur Augsburg) */
  function holidays(y) {
    const e = easter(y);
    return [
      [`${y}-01-01`, 'Neujahr'], [`${y}-01-06`, 'Heilige Drei Könige'], [iso(add(e, -2)), 'Karfreitag'], [iso(add(e, 1)), 'Ostermontag'], [`${y}-05-01`, 'Tag der Arbeit'],
      [iso(add(e, 39)), 'Christi Himmelfahrt'], [iso(add(e, 50)), 'Pfingstmontag'], [iso(add(e, 60)), 'Fronleichnam'], [`${y}-08-15`, 'Mariä Himmelfahrt'],
      [`${y}-10-03`, 'Tag der Deutschen Einheit'], [`${y}-11-01`, 'Allerheiligen'], [`${y}-12-25`, '1. Weihnachtsfeiertag'], [`${y}-12-26`, '2. Weihnachtsfeiertag'],
    ].map(([date, name]) => ({ date, name }));
  }
  /* Alle freien Tage eines Monats: {date: [{name, kind}]} */
  function freeDays(year, month, extra = []) {
    const out = {};
    const first = new Date(year, month, 1), last = new Date(year, month + 1, 0);
    const put = (d, name, kind) => { (out[d] = out[d] || []).push({ name, kind }); };
    holidays(year).forEach(h => { const d = new Date(h.date + 'T12:00'); if (d >= first && d <= add(last, 1)) put(h.date, h.name, 'feiertag'); });
    [...FERIEN, ...extra].forEach(f => {
      for (let d = new Date(f.from + 'T12:00'); iso(d) <= f.to; d = add(d, 1)) if (d >= first && d <= add(last, 1)) put(iso(d), f.name, f.kind || 'ferien');
    });
    return out;
  }
  const COVERED_UNTIL = '2030-09-09';
  root.Cal = { FERIEN, COVERED_UNTIL, holidays, freeDays, easter, iso, add };
})(typeof self !== 'undefined' ? self : this);
