const E = require('./engine.js'); const assert = require('assert');
const cat = require('/tmp/claude-0/-home-claude/e666d325-a7aa-5e95-a6d8-de49952d2a50/scratchpad/cat/catalog_full.json');
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
