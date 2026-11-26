/* Libretto → Infoportal · Lesezeichen-Helfer · © 2026 theis
   Läuft nur im eigenen Browser auf der geöffneten Infoportal-Seite (z. B. Noten → Mündlich oder Schulaufgabe/Test).
   Liest die Zeile, die Libretto mit „Fürs Infoportal kopieren“ in die Zwischenablage gelegt hat, sucht jede Person
   in der Tabelle und trägt Note (und, falls vorhanden, Tendenz, Art und Datum) ein. Gespeichert wird NICHT –
   das macht man wie gewohnt selbst im Infoportal. Nichts verlässt den Computer. */
(function () {
  'use strict';
  var TAG = 'LIBRETTO-INFOPORTAL 1';
  var old = document.getElementById('libHelfer'); if (old) old.remove();
  function deb(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ß/g, 'ss').replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u').replace(/[^a-z0-9]+/g, ' ').trim(); }
  function box(html) {
    var d = document.createElement('div'); d.id = 'libHelfer';
    d.setAttribute('style', 'position:fixed;z-index:2147483647;top:14px;right:14px;max-width:380px;background:#fff;color:#1b1d22;font:14px/1.45 -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;border-radius:14px;box-shadow:0 10px 40px rgba(0,0,0,.25);padding:14px 16px 12px;border:1px solid #d5dae3');
    d.innerHTML = '<div style="font-weight:700;margin-bottom:6px">Libretto → Infoportal</div>' + html + '<div style="margin-top:10px;text-align:right"><button type="button" id="libHelferX" style="font:inherit;padding:5px 12px;border-radius:8px;border:1px solid #c3cad6;background:#f3f5fa;cursor:pointer">Schließen</button></div>';
    document.body.appendChild(d); document.getElementById('libHelferX').onclick = function () { d.remove(); };
    return d;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  /* alle Dokumente: Seite und Rahmen derselben Adresse */
  function docs() { var out = [document]; try { [].forEach.call(document.querySelectorAll('iframe,frame'), function (f) { try { if (f.contentDocument) out.push(f.contentDocument); } catch (e) {} }); } catch (e) {} return out; }
  /* Aufbau der Tabellen ohne Namen und Noten – für die Fehlersuche */
  function skeleton() {
    var lines = [location.pathname];
    docs().forEach(function (doc, di) { [].forEach.call(doc.querySelectorAll('table'), function (t, ti) {
      var rows = t.rows; if (!rows || rows.length < 2) return;
      lines.push('Rahmen ' + di + ' Tabelle ' + ti + ': ' + rows.length + ' Zeilen');
      for (var r = 0; r < Math.min(rows.length, 4); r++) lines.push('  ' + [].map.call(rows[r].cells, function (c) {
        var k = c.tagName.toLowerCase() + (c.colSpan > 1 ? '*' + c.colSpan : ''); var f = [].map.call(c.querySelectorAll('select,input,textarea'), function (x) { return x.tagName.toLowerCase() + (x.type ? ':' + x.type : '') + (x.tagName === 'SELECT' ? '(' + x.options.length + ')' : ''); }).join('+');
        var tx = (c.textContent || '').trim(); var lab = /^(Nr|Name|Note|Tendenz|Gewicht|Art|Thema|Datum|Bearbeiten|Zusatzinfo|Leistungsübersicht|Punkte|NP|Bemerkung)\.?$/i.test(tx) ? tx : (tx ? 'T' + tx.length : '');
        return k + (f ? '[' + f + ']' : '') + (lab ? '"' + lab + '"' : ''); }).join(' | '));
    }); });
    return lines.join('\n');
  }
  /* Ein Feld setzen – Auswahlliste, einfaches Textfeld oder die selbst gebauten Felder des Infoportals
     (sichtbares Textfeld + verstecktes Feld + eigene Liste „--, 1, 2 …“): dort wie von Hand – Liste öffnen, Eintrag anklicken.
     Rückgabe: 'ok' | 'unsure' (steht da, aber nicht bestätigt) | 'fail' | 'none' (Wert gibt es nicht) */
  function fire(el, types) { types.forEach(function (t) { var ev = /mouse|click/.test(t) ? new MouseEvent(t, { bubbles: true, cancelable: true, view: window }) : new Event(t, { bubbles: true }); el.dispatchEvent(ev); }); }
  function setNative(el, v) { var proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    var d = Object.getOwnPropertyDescriptor(proto, 'value'); if (d && d.set) d.set.call(el, v); else el.value = v; }
  function shown(e) { return !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length); }
  function leafWith(root, v) { return [].filter.call(root.querySelectorAll('*'), function (e) { return !/^(INPUT|SELECT|OPTION|SCRIPT|STYLE|TEXTAREA)$/.test(e.tagName) && !e.closest('#libHelfer') && e.textContent.trim() === v && ![].some.call(e.children, function (k) { return k.textContent.trim() === v; }); }); }
  function setCell(cell, v) {
    if (!cell) return 'fail';
    var sel = cell.querySelector('select');
    if (sel) { var o = [].filter.call(sel.options, function (x) { return x.text.trim() === v || x.value.trim() === v; })[0]; if (!o) return 'none'; setNative(sel, o.value); fire(sel, ['input', 'change']); return sel.value === o.value ? 'ok' : 'fail'; }
    var t = cell.querySelector('input:not([type=hidden]):not([type=checkbox]):not([type=radio]),textarea'), h = cell.querySelector('input[type=hidden]');
    if (!t) return 'fail';
    var dl = t.list || (t.getAttribute('list') && t.ownerDocument.getElementById(t.getAttribute('list')));
    if (dl && dl.options && dl.options.length && ![].some.call(dl.options, function (o) { return (o.value || o.text).trim() === v; })) return 'none';
    if (!h) { setNative(t, v); fire(t, ['input', 'change', 'blur']); return t.value.trim() === v ? 'ok' : 'fail'; }
    /* selbst gebautes Feld: öffnen, Eintrag mit genau diesem Text anklicken */
    var before = h.value, doc = cell.ownerDocument;
    fire(t, ['focus', 'mousedown', 'mouseup', 'click']);
    var cand = leafWith(cell, v);
    if (!cand.length) cand = leafWith(doc.body, v).filter(function (e) { return shown(e) && !e.closest('table tr td:nth-child(2)') && (e.getAttribute('role') === 'option' || /^(LI|A|DIV|SPAN|TD)$/.test(e.tagName)) && e.parentElement && e.parentElement.children.length >= 3; });
    if (cand.length) { fire(cand[0], ['mouseover', 'mousedown', 'mouseup', 'click']); }
    else { setNative(t, v); fire(t, ['input', 'keyup', 'change']); }
    if (cand.length && t.value.trim() !== v) { var dv = cand[0].getAttribute('data-value') || cand[0].getAttribute('data-id') || cand[0].getAttribute('value'); if (dv != null) { h.value = dv; setNative(t, v); fire(h, ['change']); fire(t, ['input', 'change']); } }
    var disp = t.value.trim() || (cell.innerText || '').trim().split(/\s+/)[0];
    if (disp !== v) return cand.length ? 'fail' : 'none';
    return h.value !== before || h.value === v ? 'ok' : 'unsure';
  }
  /* Aufbau eines Notenfelds für die Fehlersuche: Elemente, Klassen, Attributnamen; Text nur, wenn er wie ein Auswahlwert aussieht */
  function cellShape(cell) {
    var out = []; (function walk(e, d) { if (d > 6 || out.length > 60) return; [].forEach.call(e.children, function (k) {
      var own = [].filter.call(k.childNodes, function (n) { return n.nodeType === 3; }).map(function (n) { return n.textContent.trim(); }).join(' ').trim();
      var txt = /^(--?|[0-6][+-]?|[+-]|x|\d+,\d+|[A-Z]{2,3}|)$/.test(own) ? own : 'T' + own.length;
      out.push(new Array(d + 1).join('  ') + k.tagName.toLowerCase() + (k.type ? ':' + k.type : '') + (k.className && typeof k.className === 'string' ? '.' + k.className.trim().split(/\s+/).join('.') : '') +
        ' [' + [].map.call(k.attributes, function (a) { return a.name; }).filter(function (n) { return n !== 'class' && n !== 'style'; }).join(',') + ']' + (k.tagName === 'INPUT' ? ' value=' + (/^(--?|[0-6][+-]?|)$/.test(k.value) ? '"' + k.value + '"' : 'L' + k.value.length) : '') + (txt && txt !== 'T0' ? ' "' + txt + '"' : '') + (shown(k) ? '' : ' (verborgen)'));
      walk(k, d + 1); }); })(cell, 0);
    return out.join('\n');
  }
  function fill(data) {
    var items = data.items || [], done = 0, miss = [], multi = [], used = [], noDate = [], unsure = [];
    /* Kopfzeile mit „Note“ und „Datum“ finden → Spaltennummern */
    var all = []; docs().forEach(function (doc) { all = all.concat([].slice.call(doc.querySelectorAll('tr'))); });
    var head = null; all.some(function (tr) { var tx = [].map.call(tr.cells, function (c) { return (c.textContent || '').trim(); }); if (tx.indexOf('Note') >= 0 && (tx.indexOf('Name') >= 0 || tx.indexOf('Datum') >= 0)) { head = tr; return true; } return false; });
    var col = {}; if (head) [].forEach.call(head.cells, function (c, i) { col[(c.textContent || '').trim()] = i; });
    /* Notenfeld: Auswahlliste ODER Eingabefeld (im Infoportal oft ein Textfeld mit Vorschlagsliste „--, 1, 2 …“) */
    function noteField(tr) { var c = head && col.Note != null ? tr.cells[col.Note] : null; return (c && c.querySelector('select,input:not([type=hidden]):not([type=checkbox]):not([type=radio]),textarea')) || (!head || col.Note == null ? tr.querySelector('select') : null); }
    function setVal(el, v) { var proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      var d = Object.getOwnPropertyDescriptor(proto, 'value'); if (d && d.set) d.set.call(el, v); else el.value = v;
      ['input', 'change', 'blur'].forEach(function (ev) { el.dispatchEvent(new Event(ev, { bubbles: true })); }); }
    var nameRows = all.filter(function (tr) { return tr !== head && tr.cells && tr.cells.length > 3 && noteField(tr); });
    function rowName(tr) { var c = head && col.Name != null ? tr.cells[col.Name] : null; var cells = c ? [c] : [].slice.call(tr.cells, 0, 3); return cells.map(function (x) { return deb(x.textContent); }).join(' '); }
    items.forEach(function (it) {
      var l = deb(it.last), f = deb(it.first).split(' ').filter(Boolean);
      var hits = nameRows.filter(function (tr) { var n = ' ' + rowName(tr) + ' '; return n.indexOf(' ' + l + ' ') >= 0 && (!f.length || f.some(function (x) { return n.indexOf(' ' + x + ' ') >= 0; })); });
      if (hits.length !== 1) { miss.push(it.last + (it.first ? ', ' + it.first : '') + (hits.length > 1 ? ' (mehrfach)' : '')); return; }
      var tr = hits[0]; if (used.indexOf(tr) >= 0) { multi.push(it.last); return; } used.push(tr);
      var sel = noteField(tr);
      var g = String(it.g).trim(), tend = ''; var m = /^(\d{1,2})\s*([+-])$/.exec(g); if (m) { g = m[1]; tend = m[2]; }
      var noteCell = head && col.Note != null ? tr.cells[col.Note] : sel.closest('td,th');
      var r1 = setCell(noteCell, g);
      if (r1 === 'none') { miss.push(it.last + ' (Note ' + it.g + ' gibt es hier nicht)'); return; }
      if (r1 === 'fail') { miss.push(it.last + ' (Feld nimmt die Note nicht an)'); return; }
      if (r1 === 'unsure') unsure.push(it.last);
      function setIn(colName, v, onlyEmpty) { if (v == null || v === '' || !head || col[colName] == null) return; var cell = tr.cells[col[colName]]; if (!cell) return; var vis = cell.querySelector('input:not([type=hidden]),textarea,select'); if (!vis || (onlyEmpty && vis.value.trim() && vis.value.trim() !== '--')) return; setCell(cell, v); }
      if (tend) setIn('Tendenz', tend);
      if (it.art) setIn('Art', it.art, true);
      if (it.d && data.kind === 'e') {
        /* mündliche Noten: Datum je Zeile – eintragen und nachprüfen */
        var dc = head && col.Datum != null ? tr.cells[col.Datum] : null, di = dc && dc.querySelector('input:not([type=hidden])');
        if (!di) noDate.push(it.last); else { setIn('Datum', it.d); if (di.value.trim() !== it.d) noDate.push(it.last); }
      }
      [].forEach.call(tr.cells, function (c) { c.style.background = r1 === 'unsure' ? '#fff3df' : '#e7f6ea'; });
      sel.style.outline = '3px solid ' + (r1 === 'unsure' ? '#c96500' : '#2f8a46'); sel.style.outlineOffset = '1px';
      done++;
    });
    var html = '<div><b>' + done + ' von ' + items.length + '</b> Noten eingetragen (grün markiert).</div>';
    if (data.what) html = '<div style="color:#4b5160;margin-bottom:4px">' + esc(data.what) + '</div>' + html;
    /* Arbeiten (Ex, Kurzarbeit, Schulaufgabe): Datum steht oben für die ganze Arbeit – mit Libretto vergleichen */
    if (data.kind === 'a' && data.date) {
      var pageTxt = docs().map(function (dd) { return dd.body ? dd.body.innerText || dd.body.textContent : ''; }).join(' ');
      var pm = /Datum\s*:?\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(pageTxt), want = data.date.split('.');
      if (pm && (+pm[1] !== +want[0] || +pm[2] !== +want[1] || pm[3] !== want[2])) html += '<div style="margin-top:6px;padding:8px 10px;border-radius:8px;background:#fdf0ef;color:#7a1712"><b>Achtung Datum:</b> Hier steht ' + esc(pm[0].replace(/^Datum\s*:?\s*/, '')) + ', in Libretto ist die Arbeit vom ' + esc(data.date) + '. Ist das die richtige Arbeit? Datum im Infoportal prüfen.</div>';
      else if (pm) html += '<div style="margin-top:6px;color:#2f6b3a">Datum passt: ' + esc(data.date) + '.</div>';
    }
    if (unsure.length) html += '<div style="margin-top:6px;color:#8a4b00"><b>Bitte genau prüfen (orange):</b> ' + esc(unsure.join(', ')) + ' – die Note steht im Feld, aber das Infoportal hat es nicht eindeutig bestätigt.</div>';
    if (noDate.length) html += '<div style="margin-top:6px;color:#b42318"><b>Datum nicht gesetzt bei:</b> ' + esc(noDate.join(', ')) + ' – bitte von Hand eintragen.</div>';
    else if (data.kind === 'e' && done) html += '<div style="margin-top:6px;color:#2f6b3a">Datum bei allen eingetragen (je Note das Datum aus Libretto).</div>';
    if (miss.length) html += '<div style="margin-top:6px;color:#b42318"><b>Nicht gefunden:</b> ' + esc(miss.join('; ')) + ' – bitte von Hand eintragen.</div>';
    if (multi.length) html += '<div style="margin-top:6px">Mehrere Noten für ' + esc(multi.join(', ')) + ': nach dem Speichern die nächste Runde in Libretto kopieren.</div>';
    html += '<div style="margin-top:8px"><b>Bitte prüfen und dann wie gewohnt im Infoportal speichern.</b> Gespeichert wird erst mit deinem Klick.</div>';
    if (!done) html += '<div style="margin-top:8px"><button type="button" id="libSkel" style="font:inherit;padding:4px 10px;border-radius:8px;border:1px solid #c3cad6;background:#fff;cursor:pointer">Aufbau der Seite kopieren (ohne Namen und Noten)</button></div>';
    var d = box(html); var sk = d.querySelector('#libSkel'); if (sk) sk.onclick = function () { var s = skeleton(); (navigator.clipboard ? navigator.clipboard.writeText(s) : Promise.reject()).then(function () { sk.textContent = 'Kopiert – im Libretto-Chat einfügen'; }, function () { window.prompt('Aufbau der Seite (ohne Namen und Noten):', s); }); };
  }
  function parse(txt) { txt = String(txt || ''); var k = txt.indexOf(TAG); if (k < 0) return null; try { return JSON.parse(txt.slice(k + TAG.length).trim()); } catch (e) { return null; } }
  function ask() { var t = window.prompt('Libretto → Infoportal\n\nIn Libretto unter „Übertrag“ auf „Fürs Infoportal kopieren“ klicken, dann hier einfügen (⌘V) und OK:'); if (t == null) return; var d = parse(t); if (d) fill(d); else box('<div>Das ist keine Übertragszeile aus Libretto. In Libretto unter „Übertrag“ auf <b>„Fürs Infoportal kopieren“</b> klicken und dann noch einmal hier auf das Lesezeichen.</div>'); }
  if (window.__LIBRETTO_DATA) { var d0 = parse(window.__LIBRETTO_DATA); if (d0) return fill(d0); }
  if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(function (t) { var d = parse(t); if (d) fill(d); else ask(); }, ask); else ask();
})();
