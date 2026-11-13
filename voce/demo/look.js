/* Voce · Aussehen: Farbwelt, Hell/Dunkel, Schrift. Gilt je Gerät (localStorage), wird nicht gesichert oder exportiert.
   Früh im <head> geladen, damit beim Start nichts aufblitzt. Farbwelten wie Gruppo (skins.js / darstellung.css). */
(function () {
  const K = 'voce_look';
  const look = { skin: 'klar', mode: 'auto', font: 'standard', zoom: 1 };
  try { Object.assign(look, JSON.parse(localStorage.getItem(K) || '{}')); } catch (e) {}
  /* Seit 1.9: fünf Farbwelten. Entfernte (Standard, Apple, Graphit, Salbei, Terrakotta, Glut, Wald) → Klar */
  if (!['klar', 'tag', 'laguna', 'neon', 'heft'].includes(look.skin)) look.skin = 'klar';
  /* Namen wie in forza: beschreibend statt Schriftname */
  const FONTS = [['standard', 'Standard', 'system-ui, -apple-system, "Segoe UI", sans-serif'], ['nunito', 'Rund', "'Nunito', ui-rounded, sans-serif"],
    ['lora', 'Klassisch', "'Lora', Georgia, serif"], ['grotesk', 'Technisch', "'Space Grotesk', sans-serif"],
    ['atkinson', 'Gut lesbar', "'Atkinson Hyperlegible', sans-serif"], ['jost', 'Geometrisch', "'Jost', 'Century Gothic', sans-serif"]];
  const mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : { matches: false };
  /* Sonnenstand (Bayern) → Tagesphase für „Tageslicht“ – wie Gruppo/forza */
  function sunPhase(d = new Date()) {
    const N = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5), rad = Math.PI / 180, lat = 48.2, lon = 10.8;
    const decl = 23.44 * Math.sin(2 * Math.PI * (284 + N) / 365) * rad, H = Math.acos(Math.max(-1, Math.min(1, -Math.tan(lat * rad) * Math.tan(decl)))) / rad / 15;
    const noon = 12 - lon / 15 - d.getTimezoneOffset() / 60, sr = noon - H, ss = noon + H, t = d.getHours() + d.getMinutes() / 60;
    if (t < sr - .75 || t >= ss + .75) return 'nacht'; if (t < sr + .75) return 'morgen'; if (t < noon - 2) return 'vormittag';
    if (t < noon + 2) return 'mittag'; if (t < ss - 1.25) return 'nachmittag'; return 'abend';
  }
  function apply() {
    const el = document.documentElement;
    el.dataset.skin = look.skin;
    let dark = look.mode === 'dark' || (look.mode === 'auto' && mq.matches);
    if (look.skin === 'tag') { const ph = sunPhase(); el.dataset.phase = ph; dark = ph === 'nacht' || ph === 'abend'; } else delete el.dataset.phase;
    el.dataset.theme = dark ? 'dark' : 'light';
    if (look.font === 'standard') delete el.dataset.font; else el.dataset.font = look.font;
    /* Größe der Oberfläche (nur Desktop-App): wie „Vergrößern“ im Menü, aber gemerkt */
    try { if (window.native && window.native.setZoom) window.native.setZoom([0.9, 1, 1.12, 1.25].includes(+look.zoom) ? +look.zoom : 1); } catch (e) {}
  }
  window.VoceLook = { get: () => Object.assign({}, look), FONTS,
    set(k, v) { look[k] = v; try { localStorage.setItem(K, JSON.stringify(look)); } catch (e) {} apply(); }, apply };
  apply();
  if (mq.addEventListener) mq.addEventListener('change', apply);
  setInterval(() => { if (look.skin === 'tag') apply(); }, 300000);
})();
