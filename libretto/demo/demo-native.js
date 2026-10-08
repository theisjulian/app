/* Libretto · Online-Demo: Ersatz für die Brücke zum Programm (preload.js / main.js) · © 2026 theis
   In der App liest und schreibt window.native verschlüsselte Dateien. Hier gibt es keine Dateien:
   Der Stand liegt nur im Arbeitsspeicher des Browsers und ist nach dem Neuladen wieder wie am Anfang.
   Nichts wird gespeichert, gelesen, exportiert oder übertragen. */
(function () {
  'use strict';
  let mem = null;                                   // aktueller Stand, nur im Arbeitsspeicher
  let go; const ready = new Promise(r => { go = r; });
  const X = window.__librettoDemo = { version: '0.9.5', start: go, locked: () => {}, preview: () => {} };
  const t0 = Date.now(), MIN = 60000, DAY = 864e5;
  const status = () => ({ exists: true, unlocked: !!mem, backupDir: 'USB-Stick „Schule“ (Beispiel)', lastLocal: t0 - 4 * MIN, lastExternal: t0 - 4 * MIN, lastExternalError: null,
    autoLock: 10, created: new Date(t0 - 21 * DAY).toISOString(), updateCheck: true, prevVersion: null });
  const policy = () => ({ betaEnd: '2099-12-31', daysLeft: 9999, expired: false, outdated: false, message: '', url: '../' });
  const ALPH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const code = () => { let s = ''; for (let i = 0; i < 24; i++) s += ALPH[Math.floor(Math.random() * 32)]; return s.match(/.{6}/g).join('-'); };
  const never = () => new Promise(() => {});
  const backups = () => [[4 * MIN, 'Dieser Computer'], [4 * MIN, 'Sicherungsordner'], [26 * 60 * MIN, 'Dieser Computer'], [26 * 60 * MIN, 'Sicherungsordner'], [3 * DAY, 'Dieser Computer'], [3 * DAY, 'Sicherungsordner'], [8 * DAY, 'Dieser Computer']]
    .map(([ago, where], i) => ({ name: 'beispiel.vault', where, path: '', time: t0 - ago, size: (19 - i) * 1024 }));

  window.native = {
    status: async () => status(),
    create: async (_pw, data) => { mem = data; return { code: code() }; },
    unlock: async () => ({ ok: true, data: mem }),               // Demo: jedes Passwort öffnet
    save: async data => { mem = data; return Date.now(); },
    saveSync: data => { mem = data; return true; },
    lock: async () => true,
    resetPassword: async () => ({ ok: true }),
    changePassword: async () => ({ ok: true }),
    newCode: async () => ({ ok: true, code: code() }),
    backupNow: () => { X.locked('Sicherungen'); return never(); },
    listBackups: async () => backups(),
    chooseBackupDir: async () => { X.locked('Der Sicherungsordner'); return status(); },
    clearBackupDir: async () => status(),
    openBackupDir: async () => { X.locked('Der Sicherungsordner'); },
    pickBackup: async () => { X.locked('Das Wiederherstellen einer Sicherung'); return null; },
    restore: async () => ({ ok: false, error: 'In der Demo nicht verfügbar.' }),
    setCfg: async () => status(),
    saveFile: async name => { X.locked(/\.docx$/.test(name) ? 'Der Word-Export' : /\.json$/.test(name) ? 'Der Klassen-Export' : 'Der Excel-Export'); return { ok: false }; },
    savePdf: async (name, html, landscape) => { X.preview(name, html, landscape); return { ok: false }; },
    version: async () => X.version,
    openDoc: async () => true,
    licenses: async () => 'Die Lizenzen der verwendeten Open-Source-Software stehen in der installierten App.',
    checkUpdate: async () => ({ update: null, policy: policy() }),
    policy: async () => policy(),
    platform: () => ready.then(() => 'web'),                    // wartet, bis demo.js geladen ist
    onMenu: () => {},
  };
})();
