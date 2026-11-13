/* theis-Klassen: gemeinsames Austauschformat der theis-Apps (Voce, Libretto, Gruppo …) – Version 1.
   Reine Funktionen ohne Oberfläche; läuft im Browser (window.TheisKlassen) und in Node (require).
   Regeln (siehe PROJEKT.md, Abschnitt „theis-Klassen“):
   • JSON-Datei: { format:'theis-klassen', version:1, exported, app, schoolYear, classes:[ … ] }
   • Klasse: { id, name, subject?, grade?, students:[ … ] }   – eine „Klasse“ ist jede Liste von Personen (Klasse, Kurs, Teilgruppe)
   • Person: { id, last, first, g?: 'w'|'m'|'d', cls?: '8A' (Klasse bei gemischten Kursen), away?: { from?, to?, reason? } }
   • Leser ignorieren unbekannte Felder und geben sie beim Zurückschreiben unverändert weiter.
   • Neue Felder dürfen jederzeit ergänzt werden (Version bleibt 1); nur ein Bruch erhöht die Version. */
(function (root, factory) { if (typeof module === 'object' && module.exports) module.exports = factory(); else root.TheisKlassen = factory(); })(typeof self !== 'undefined' ? self : this, function () {
  const FORMAT = 'theis-klassen', VERSION = 1;
  const rid = p => p + Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 8);
  const str = v => (typeof v === 'string' ? v : v == null ? '' : String(v)).replace(/\s+/g, ' ').trim();
  const norm = s => str(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const nameKey = s => norm(s.last) + '|' + norm(s.first);
  const KNOWN = new Set(['id', 'last', 'first', 'g', 'cls', 'away']);

  /* Datei bauen. classes: [{ id, name, subject?, grade?, students:[{ id, last, first, g?, cls?, away?, rest? }] }] */
  function build({ app, schoolYear, classes }) {
    return { format: FORMAT, version: VERSION, exported: new Date().toISOString(), app: app || '', schoolYear: schoolYear || '',
      classes: classes.map(c => {
        const o = { id: c.id, name: c.name };
        if (c.subject) o.subject = c.subject; if (c.grade) o.grade = c.grade;
        o.students = c.students.map(s => {
          const r = { ...(s.rest || {}), id: s.id, last: s.last || '', first: s.first || '' };
          if (s.g) r.g = s.g; if (s.cls) r.cls = s.cls; if (s.away) r.away = s.away;
          return r;
        });
        return o;
      }) };
  }

  /* Text einlesen und prüfen. Wirft Error mit verständlicher deutscher Meldung. */
  function parse(text) {
    let d; try { d = JSON.parse(text); } catch (e) { throw new Error('Die Datei ist keine gültige theis-Klassen-Datei (nicht lesbar).'); }
    if (!d || d.format !== FORMAT) throw new Error('Das ist keine theis-Klassen-Datei.');
    if (!(+d.version >= 1)) throw new Error('In der Datei fehlt die Versionsnummer.');
    if (+d.version > VERSION) throw new Error(`Die Datei stammt aus einer neueren Version des Formats (${d.version}). Bitte die App aktualisieren.`);
    if (!Array.isArray(d.classes)) throw new Error('Die Datei enthält keine Klassen.');
    const warnings = []; const classes = [];
    d.classes.forEach((c, ci) => {
      if (!c || typeof c !== 'object') return;
      const name = str(c.name); if (!name) { warnings.push(`Klasse ${ci + 1} ohne Namen übersprungen`); return; }
      const students = []; const seen = new Set();
      (Array.isArray(c.students) ? c.students : []).forEach(s => {
        if (!s || typeof s !== 'object') return;
        const last = str(s.last), first = str(s.first); if (!last && !first) return;
        const g = ['w', 'm', 'd'].includes(str(s.g).toLowerCase()) ? str(s.g).toLowerCase() : '';
        let id = str(s.id).slice(0, 64) || null; if (id && seen.has(id)) id = null; if (id) seen.add(id);
        const rest = {}; for (const k of Object.keys(s)) if (!KNOWN.has(k)) rest[k] = s[k];
        const away = s.away && typeof s.away === 'object' ? { from: str(s.away.from), to: str(s.away.to), reason: str(s.away.reason) } : null;
        students.push({ id, last, first, g, cls: str(s.cls), away: away && (away.from || away.to) ? away : null, rest });
      });
      classes.push({ id: str(c.id).slice(0, 64) || null, name, subject: str(c.subject), grade: str(c.grade), students });
    });
    return { version: +d.version, app: str(d.app), exported: str(d.exported), schoolYear: str(d.schoolYear), classes, warnings };
  }

  const sameAway = (a, b) => (a ? a.from + '|' + a.to : '') === (b ? b.from + '|' + b.to : '');
  /* Abgleich einer vorhandenen Liste (cur) mit der eingelesenen (inc). Beide: [{ xid?, last, first, g, cls, away }].
     Zuordnung: erst über die Kennung (xid = id aus der Datei), dann über den Namen. */
  function diff(cur, inc) {
    const out = { added: [], removed: [], changed: [], same: 0 };
    const usedC = new Set(); const pair = [];
    const byX = new Map(); cur.forEach((s, i) => { if (s.xid) byX.set(s.xid, i); });
    const rest = [];
    inc.forEach((s, j) => { const i = s.id != null ? byX.get(s.id) : undefined; if (i != null && !usedC.has(i)) { usedC.add(i); pair.push([i, j]); } else rest.push(j); });
    const byN = new Map(); cur.forEach((s, i) => { if (usedC.has(i)) return; const k = nameKey(s); (byN.get(k) || byN.set(k, []).get(k)).push(i); });
    for (const j of rest) { const k = nameKey(inc[j]); const l = byN.get(k); const i = l && l.length ? l.shift() : undefined; if (i != null) { usedC.add(i); pair.push([i, j]); } else out.added.push({ inc: inc[j], j }); }
    cur.forEach((s, i) => { if (!usedC.has(i)) out.removed.push({ cur: s, i }); });
    for (const [i, j] of pair) {
      const a = cur[i], b = inc[j]; const f = [];
      if (str(a.last) !== b.last || str(a.first) !== b.first) f.push('name');
      if ((a.g || '') !== (b.g || '')) f.push('g');
      if ((a.cls || '') !== (b.cls || '')) f.push('cls');
      if (!sameAway(a.away, b.away)) f.push('away');
      if (!a.xid && b.id) f.push('xid');
      const real = f.filter(x => x !== 'xid');
      if (real.length) out.changed.push({ cur: a, inc: b, i, j, fields: real }); else { out.same++; if (f.includes('xid')) out.changed.push({ cur: a, inc: b, i, j, fields: [], silent: true }); }
    }
    return out;
  }

  return { FORMAT, VERSION, build, parse, diff, nameKey, norm, rid };
});
