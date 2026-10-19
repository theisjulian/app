/* forza · Effekte: weiche Einblendungen, Satz-Impuls, Konfetti und Abschlussbild */
(function () {
  const F = window.F, esc = F.esc;
  const motionOk = () => F.look().anim && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  F.motionOk = motionOk;

  /* gestaffelte Einblendung beim Seitenwechsel (nicht bei jedem Neuzeichnen) */
  let lastKey = '';
  F.after = (main, rest) => {
    const key = main + '/' + (rest[0] || '');
    if (key === lastKey || !motionOk()) { lastKey = key; return; }
    lastKey = key;
    document.querySelectorAll('.main > *').forEach((el, i) => { el.style.setProperty('--i', Math.min(i, 8)); el.classList.add('rise'); });
    document.querySelectorAll('.bar i').forEach((el) => el.classList.add('grow'));
  };

  /* Konfetti */
  F.confetti = (ms = 2600) => {
    if (!motionOk()) return;
    const c = document.createElement('canvas'); c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:70';
    document.body.appendChild(c); const dpr = devicePixelRatio || 1; c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    const x = c.getContext('2d'); x.scale(dpr, dpr);
    const acc = getComputedStyle(document.documentElement).getPropertyValue('--a').trim() || '#c8f542';
    const cols = [acc, '#ffffff', '#6aa9ff', '#ffb454', '#ff6fd8'];
    const P = Array.from({ length: 110 }, () => ({ x: innerWidth / 2 + (Math.random() - .5) * 80, y: innerHeight * .42, vx: (Math.random() - .5) * 11, vy: -Math.random() * 13 - 3, r: Math.random() * 6 + 3, a: Math.random() * 6, va: (Math.random() - .5) * .4, c: cols[(Math.random() * cols.length) | 0] }));
    const t0 = performance.now();
    (function f(t) {
      const el = t - t0; x.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of P) { p.vy += .32; p.x += p.vx; p.y += p.vy; p.a += p.va; p.vx *= .992; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.globalAlpha = Math.max(0, 1 - el / ms); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore(); }
      if (el < ms) requestAnimationFrame(f); else c.remove();
    })(t0);
  };

  F.countUp = (el, to, dec = 0) => {
    if (!motionOk()) { el.textContent = to.toLocaleString('de-DE', { maximumFractionDigits: dec }); return; }
    const t0 = performance.now(), d = 900;
    (function s(t) { const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3); el.textContent = (to * e).toLocaleString('de-DE', { maximumFractionDigits: dec, minimumFractionDigits: dec }); if (k < 1) requestAnimationFrame(s); })(t0);
  };

  /* Abschlussbild nach dem Training */
  F.celebrate = (st) => {
    const el = document.createElement('div'); el.className = 'cele'; el.id = 'cele';
    el.innerHTML = `<div class="cele-in"><svg class="ring" viewBox="0 0 120 120" aria-hidden="true"><circle class="rc" cx="60" cy="60" r="52"/><path class="rk" d="M36 62l16 16 32-36"/></svg>
      <div class="h1" style="margin:14px 0 4px">Geschafft!</div><div class="mute">${esc(st.title)}</div>
      <div class="cele-stats"><div><b data-n="${st.sets}">0</b><span>${st.sets === 1 ? 'Satz' : 'Sätze'}</span></div><div><b data-n="${st.minutes}">0</b><span>${st.minutes === 1 ? 'Minute' : 'Minuten'}</span></div>${st.volume ? `<div><b data-n="${st.volume}">0</b><span>kg bewegt</span></div>` : ''}</div>
      ${st.prs.length ? `<div class="cele-pr"><div class="eyebrow" style="margin-bottom:6px">Neue Bestwerte</div>${st.prs.map((p) => `<div>${esc(p)}</div>`).join('')}</div>` : ''}
      ${st.week ? `<div class="small mute" style="margin-top:12px">${st.week}. Krafteinheit in den letzten 7 Tagen</div>` : ''}
      <button class="btn pri block" style="margin-top:20px" data-act="celeClose">Weiter</button></div>`;
    document.body.appendChild(el);
    el.querySelectorAll('[data-n]').forEach((b) => F.countUp(b, Number(b.dataset.n)));
    F.confetti(); try { navigator.vibrate && navigator.vibrate([60, 40, 90]); } catch {}
  };
  F.acts.celeClose = () => { document.getElementById('cele')?.remove(); F.go('heute'); };

  /* Impuls beim Abschließen eines Satzes */
  F.pulseSet = (id) => { if (!motionOk()) return; const el = document.querySelector(`.setrow[data-sid="${id}"]`); if (el) { el.classList.add('pulse'); setTimeout(() => el.classList.remove('pulse'), 700); } };
})();
