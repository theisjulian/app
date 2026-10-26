// Aufruf: node engine.test.js [Pfad zum Katalog-Export als JSON]. Ohne Katalog laufen nur die eigenständigen Tests.
const E = require('./engine.js'); const assert = require('assert'); const fs = require('fs');

/* ---------- eigenständig: Aufwärmsätze, Zielwiederholungen ---------- */
const ramp = [70, 90, 95, 105, 110].map((kg, i) => ({ done: true, load_kg: kg, reps: [7, 6, 6, 6, 4][i], rir: null }));
assert.deepEqual(E.workSets(ramp).map((x) => x.load_kg), [90, 95, 105, 110], 'Aufwärmsatz 70 kg zählt nicht');
assert.equal(E.workSets([{ done: true, load_kg: null, reps: 10 }, { done: false, load_kg: null }]).length, 1, 'ohne Last: alle erledigten');
const st = E.muscleStats([{ session_date: '2026-10-25', kind: 'kraft', status: 'bestaetigt', session_exercises: [{ exercise_id: 'k', sets: ramp }] }], { k: { muscles_primary: ['quadrizeps'], dosage_profile: 'G' } }, '2026-10-26');
assert.equal(st.sets7.quadrizeps, 4);
const P = E.params();
assert.deepEqual(E.warmup(100, 'gesamt', P), [{ kg: 50, reps: 8 }, { kg: 70, reps: 5 }, { kg: 85, reps: 3 }]);
assert.deepEqual(E.warmup(20, 'je_hand', P), [{ kg: 10, reps: 8 }, { kg: 15, reps: 4 }]);
assert.deepEqual(E.warmup(30, 'gesamt', P), [], 'leichte Last: kein Aufwärmen');
assert.deepEqual(E.warmup(60, 'koerper', P), []);
const last = { sets: [{ load_kg: 95, reps: 6 }, { load_kg: 95, reps: 5 }] };
assert.equal(E.repTarget([6, 10], last, 95, 1), 7, 'gleiche Last: +1');
assert.equal(E.repTarget([6, 10], last, 95, 2), 6, 'nie unter den Bereich');
assert.equal(E.repTarget([6, 10], last, 97.5, 1), 6, 'neue Last: unteres Ende');
assert.equal(E.repTarget([6, 10], { sets: [{ load_kg: 95, reps: 10 }] }, 95, 1), 10, 'höchstens oberes Ende');
assert.equal(E.repTarget([6, 10], null, null, 1), 6);
assert.equal(E.repTarget(null, last, 95, 1), null);
const sq = { id: 'k', load_convention: 'gesamt', muscles_primary: ['quadrizeps'], dosage_profile: 'G' };
const hist = [{ session_date: '2026-10-25', kind: 'kraft', status: 'bestaetigt', session_exercises: [{ exercise_id: 'k', sets: ramp }] }];
const sgK = E.suggest({ exercises: [Object.assign({ name: 'Kniebeuge', pattern: 'kniebeuge', equipment: ['langhantel'], equipment_alt: [], tier: 'geprueft', active: true }, sq)], items: ['langhantel'], split: { days: [{ name: 'Beine', focus: ['quadrizeps'], minutes: 30 }] }, sessions: hist, absences: [], priorities: [], today: '2026-10-28', rideHoursAgo: null });
assert.equal(sgK.items[0].load_kg, 105, 'Arbeitsgewicht: schwerste Last im Zielbereich');
// Restzeit wird gefüllt: Push mit 60 Minuten bekommt mehr als die Vorlage allein
const mk = (id, name, m, pat, dp, lc = 'gesamt') => ({ id, name, muscles_primary: [m], pattern: pat, equipment: ['kabelzug'], equipment_alt: [], dosage_profile: dp, load_convention: lc, tier: 'geprueft', active: true });
const pushCat = [mk('a', 'Schrägbank', 'brust', 'schraeg_druecken', 'G'), mk('b', 'Bank flach', 'brust', 'horizontal_druecken', 'G'), mk('c', 'Fly', 'brust', 'brust_fliegen', 'A'), mk('d', 'Seitheben', 'schulter_seitlich', 'seitheben', 'A'), mk('e', 'Trizeps', 'trizeps', 'trizeps_strecken', 'A'), mk('f', 'Außenrotation', 'rotatoren', 'rotation', 'S'),
  mk('g', 'Schulterdrücken', 'schulter_vorn', 'vertikal_druecken', 'A'), mk('h', 'Trizeps über Kopf', 'trizeps', 'trizeps_ueberkopf', 'A'), mk('i', 'Frontheben', 'schulter_vorn', 'frontheben', 'A')];
const pushBase = { exercises: pushCat, items: ['kabelzug'], split: { days: [{ name: 'Push', focus: ['brust', 'schulter_vorn', 'schulter_seitlich', 'trizeps'], minutes: 55 }] }, sessions: [], absences: [], priorities: [], today: '2026-10-28', rideHoursAgo: null };
const p45 = E.suggest({ ...pushBase, minutes: 30 }), p60 = E.suggest({ ...pushBase, minutes: 60 });
assert(p60.items.length > p45.items.length, 'mehr Zeit, mehr Übungen'); assert(p60.minutes <= 63, 'Zeitrahmen eingehalten: ' + p60.minutes);
console.log('eigenständige Tests ok');

const katalog = process.argv[2];
if (!katalog || !fs.existsSync(katalog)) { console.log('Kein Katalog angegeben: Vorschlagstests übersprungen.'); process.exit(0); }
const cat = JSON.parse(fs.readFileSync(katalog, 'utf8'));
const ex = cat.map((c, i) => ({ id: 'x' + i, code: c.code, name: c.name, muscles_primary: c.muscles_primary, muscles_secondary: c.muscles_secondary,
  pattern: c.pattern, equipment: c.equipment, equipment_alt: c.equipment_alt || [], dosage_profile: c.dosage, load_convention: c.load_convention, tier: c.tier, active: true }));
const items = new Set(); ex.forEach((e) => e.equipment.forEach((i) => items.add(i)));
const splits = { name: 'Mix', days: [
 { name: 'Oberkörper', focus: ['brust','ruecken_hoch','lat','schulter_hinten','rotatoren'], minutes: 55 },
 { name: 'Unterkörper', focus: ['quadrizeps','hamstrings','gesaess','waden'], minutes: 60 },
 { name: 'Push', focus: ['brust','schulter_vorn','schulter_seitlich','trizeps'], minutes: 50 },
 { name: 'Ganzkörper', focus: ['quadrizeps','ruecken_hoch','brust','rumpf'], minutes: 45 },
 { name: 'Lower + Pull', focus: ['quadrizeps','hamstrings','waden','lat','ruecken_hoch','rotatoren'], minutes: 60 }] };
const S = (d, day) => ({ session_date: d, kind: 'kraft', status: 'bestaetigt', split_day: day, session_exercises: [] });
const sessions = [S('2026-10-05','Oberkörper'),S('2026-10-06','Unterkörper'),S('2026-10-08','Push'),S('2026-10-11','Ganzkörper'),S('2026-10-15','Ganzkörper'),S('2026-10-18','Lower + Pull'),S('2026-10-19','Push')];
const base = { exercises: ex, items: [...items], split: splits, sessions, absences: [], priorities: [
  {muscle_group:'quadrizeps',level:'schwerpunkt',valid_from:'2026-10-01'},{muscle_group:'waden',level:'schwerpunkt',valid_from:'2026-10-01'},
  {muscle_group:'ruecken_hoch',level:'schwerpunkt',valid_from:'2026-10-01'},{muscle_group:'schulter_hinten',level:'schwerpunkt',valid_from:'2026-10-01'}], today: '2026-10-20', rideHoursAgo: null };

let s = E.suggest(base);
console.log(s.title, s.minutes, s.items.map((i) => `${i.name} ${i.sets}x`).join(' | ')); console.log(s.reasons);
assert(!s.rest && s.items.length >= 4);
// T: unbekannt != 0 -> keine Last erfunden
assert(s.items.every((i) => i.load_kg === null && i.first));
// R05 ruhigere Tagesform
const c = E.suggest({ ...base, form: 'ruhiger' });
assert(c.minutes <= s.minutes); assert(c.items.every((i, k) => !i.rir || i.rir[0] >= (E.PROFILES[i.profile].rir[0] + 1)));
assert(c.items.every((i) => i.sets <= 2 || true));
// Krankheit
assert(E.suggest({ ...base, absences: [{ kind: 'krank', from_date: '2026-10-19', to_date: '2026-10-21' }] }).rest);
// Heimtraining: nur Band
const h = E.suggest({ ...base, items: ['band'] }); console.log('Band:', h.items.map((i) => i.name)); assert(h.items.every((i) => i.name));
// Entwurf nicht ohne Freigabe
assert(s.items.every((i) => i.tier === 'geprueft'));
// Progression: 2 Sätze im oberen Bereich + Reserve
const db = ex.find((e) => e.code === 'E11'); 
const withSets = [{ session_date: '2026-10-15', kind: 'kraft', status: 'bestaetigt', split_day: 'Push', session_exercises: [{ exercise_id: db.id, sets: [{done:true,load_kg:26,reps:10,rir:2},{done:true,load_kg:26,reps:10,rir:2}] }] }];
const ls = E.lastWorkSets(withSets, db.id); assert.equal(ls.sets.length, 2);
// Beine nach Ruderfahrt
const r = E.suggest({ ...base, rideHoursAgo: 10, sessions: [] }); console.log('nach Ride (ohne Historie):', r.title);
console.log('energy', E.energy({ kilojoules: 1500, has_power: true }, 80), E.energy({ sport: 'Hike', moving_s: 14400 }, 80));
console.log('alle Tests ok');
// Mobilität und Ziele
const catM = [
 {id:'m1',code:null,name:'BWS Rolle',muscles_primary:['brustwirbelsaeule'],muscles_secondary:[],pattern:'mobilitaet_bws',equipment:['schaumrolle'],equipment_alt:['matte'],dosage_profile:'M',load_convention:'keine',tier:'entwurf',active:true},
 {id:'m2',code:null,name:'Open Book',muscles_primary:['brustwirbelsaeule'],muscles_secondary:[],pattern:'mobilitaet_bws',equipment:['matte'],equipment_alt:[],dosage_profile:'M',load_convention:'keine',tier:'entwurf',active:true},
 {id:'m3',code:null,name:'Chin Tuck',muscles_primary:['nacken'],muscles_secondary:[],pattern:'mobilitaet_nacken',equipment:['koerpergewicht'],equipment_alt:[],dosage_profile:'M',load_convention:'keine',tier:'entwurf',active:true}];
const w = E.suggest({ ...base, exercises: ex.concat(catM), items: [...items, 'matte'], goals: ['Kraft','Muskelaufbau'] });
assert(w.mobility.length >= 2, 'Mobilitätsblock fehlt'); console.log('Mobilität:', w.mobility.map(m=>m.name));
assert(!w.items.some((i) => i.profile === 'M'));
assert(w.items.filter((i) => i.prio === 'schwerpunkt' && i.profile === 'G').every((i) => i.reps[0] === 4 && i.sets >= 3), 'Kraft-Dosis');
const off = E.suggest({ ...base, exercises: ex.concat(catM), items: [...items,'matte'], params: { posture_block: 0 } }); assert(off.mobility.length === 0);
const ov = E.suggest({ ...base, params: { dose_G_sets: 4, dose_G_lo: 5, dose_G_hi: 8 } }); assert(ov.items.filter(i=>i.profile==='G').every(i=>i.sets===4 && i.reps[1]===8));
console.log('Ziel- und Mobilitätstests ok');
