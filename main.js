/* V3 — Steam Editorial: page behaviour.
   Built on okno.js: everything that depends on the window (scroll scenes, split text, entrances, the depth pin) is made
   in build() inside one gsap.context and undone by clear(), so after any change of the window the page is built again in
   the same place, without a reload and without replaying the entrances (their durations go through HV.dur).
   Listeners and state the visitor set (open accordion row, picked figure, open menu) are made once, outside build(). */
HV.ready(({ gsap, ScrollTrigger, ease, $$, data, reduce }) => {
  const nav = document.querySelector('.ui-layer .nav');
  HV.linkNav('.ui-layer [data-go], .menu-layer [data-go]');

  /* about: one figure at a time; it counts up, then the next one follows every 4 s while the section is in view.
     The picked figure (cur) lives outside build(), so a rebuild keeps it */
  const about = document.querySelector('.about__r');
  const A = { cur: 0, started: false, timer: null, tween: null, stop: () => {}, play: () => {} };
  if (about) {
    const S = data.stats;
    const big = about.querySelector('.about__big > span');
    const bigU = about.querySelector('.about__big u');
    const cap = about.querySelectorAll('.about__cap > span');
    const rows = $$('.about__index li', about);
    A.show = (i, count = true) => {
      A.cur = i; A.started = true;
      const s = S[i], dec = (s.n.split(',')[1] || '').length, target = parseFloat(s.n.replace(/\s/g, '').replace(',', '.'));
      rows.forEach((r, k) => r.classList.toggle('is-on', k === i));
      bigU.textContent = s.u ? (s.u === 'M' ? ' mln' : ' ' + s.u) : '';
      cap[0].textContent = s.l; cap[1].textContent = ' ' + s.note;
      if (A.tween) A.tween.kill();
      if (reduce || !count) { big.textContent = s.n; return; }
      const o = { v: 0 };
      A.tween = gsap.to(o, { v: target, duration: 1.2, ease: 'power2.out', onUpdate: () => { big.textContent = dec ? o.v.toFixed(dec).replace('.', ',') : HV.fmt(o.v); } });
    };
    A.play = () => { clearInterval(A.timer); A.timer = setInterval(() => A.show((A.cur + 1) % S.length), 4000); };
    A.stop = () => clearInterval(A.timer);
    rows.forEach((r, k) => { r.style.cursor = 'pointer'; r.addEventListener('click', () => { A.show(k); A.play(); }); });
  }

  /* services: on phones the list is an accordion (first row open, tap opens another) */
  const rows = $$('.svc__row');
  rows.forEach((r, i) => {
    r.classList.toggle('is-open', i === 0);
    r.setAttribute('role', 'button'); r.tabIndex = 0;
    const open = () => rows.forEach((o) => o.classList.toggle('is-open', o === r));
    r.addEventListener('click', open);
    r.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), open()));
  });

  /* hovers */
  HV.hover('.svc__row');
  HV.hover('.roles3 > div');
  HV.hover('.contact__card');
  HV.hover('.pill', 'is-h');
  HV.hover('.link', 'is-h');
  HV.hover('.menu__links li');

  /* menu: fade in, links rise */
  HV.menu({
    openers: '.ui-layer .nav__menu',
    closers: '.nav__menu',
    build: (layer) => gsap.timeline()
      .to(layer.querySelector('.menu'), { opacity: 1, duration: 0.5, ease: 'power2.out' })
      .from($$('.menu__links li', layer), { yPercent: 30, opacity: 0, duration: 0.6, stagger: 0.04, ease }, '-=0.3'),
  });

  /* hero entrance: after the loader on the first visit; after a rebuild it is already at rest (HV.dur → 0) */
  const intro = () => {
    HV.lines('.hero .s-hero', { trigger: false });
    if (!reduce) {
      gsap.from('.hero__card', { clipPath: 'inset(18% 14% 0% 14% round 1.25em)', duration: HV.dur(1.6), ease, delay: HV.dur(0.15) });
      gsap.from('.hero__sub', { opacity: 0, y: -12, duration: HV.dur(0.8), ease, delay: HV.dur(0.5) }); // nav is left alone: its transform belongs to the hide-on-scroll class
    }
  };
  let ctx = null, introDone = false;

  const build = () => {
    ctx = gsap.context(() => {
      /* pill nav hides on the way down, returns on the way up */
      ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => nav.classList.toggle('is-hidden', s.direction === 1 && s.scroll() > innerHeight * 0.5) });

      /* reveals */
      HV.lines('main .s-xl, main .impact .s-hero, main .contact .s-hero');
      HV.chars('main .about__l .s-l');
      HV.count('.impact__strip .s');
      HV.fadeUp('.svc__r, .about__index, .roles3, .impact__strip', { children: true, y: 30 });

      if (about) {
        const go = () => { A.started ? A.show(A.cur, false) : A.show(0); A.play(); };
        ScrollTrigger.create({ trigger: about, start: 'top 80%', end: 'bottom top', onEnter: go, onEnterBack: A.play, onLeave: A.stop, onLeaveBack: A.stop });
      }
      if (!reduce) {
        // masonry images drift at slightly different speeds; the overscan ((scale - 1) / 2 = 5%) always covers the 3% shift,
        // so a card never shows the edge of its photo. The careers portrait stays still: helmet and face must stay in frame.
        $$('.pitem .card img, .svc__l .card img').forEach((img, i) => gsap.fromTo(img, { scale: 1.15, yPercent: -3 * ((i % 3) - 1) }, { scale: 1.1, yPercent: 3 * ((i % 3) - 1), ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
        // hero: the photo slowly zooms while the card keeps its full frame (badge and caption are never cut)
        gsap.fromTo('.hero__card img', { scale: 1 }, { scale: 1.08, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
        gsap.fromTo('.impact__bg img', { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.impact', start: 'top bottom', end: 'bottom top', scrub: true } });
      }

      /* depth: scroll drives the depth; the marker slides down the cross-section, the ring fills,
         the active layer, photo, numbers and description follow */
      const sec = document.querySelector('.depth');
      if (sec) {
        const L = data.layers;
        const bounds = [0, 300, 900, 2200, 3500, 5100];
        const temps = [10, 45, 110, 240, 300, 400];
        const ticks = $$('svg.ticks line', sec);
        const ringDot = sec.querySelector('svg.ticks circle');
        const bar = sec.querySelector('.depth__bar b');
        const imgs = $$('.ring__img img', sec);
        const names = $$('.depth__list > div', sec);
        const num = sec.querySelector('.depth__m').firstChild;
        const temp = sec.querySelector('.depth__c').firstChild;
        const desc = sec.querySelector('.depth__d');
        let active = -1;
        const update = (p) => {
          const m = p * 5100;
          bar.style.top = (Math.min(Math.max(p, 0.015), 0.985) * 100).toFixed(2) + '%';
          ticks.forEach((t, k) => t.setAttribute('stroke', k / ticks.length <= p ? '#0f4c55' : 'rgba(20,32,31,.25)'));
          const a = Math.max(p, 0.004) * Math.PI * 2 - Math.PI / 2;
          ringDot.setAttribute('cx', (200 + 196 * Math.cos(a)).toFixed(1));
          ringDot.setAttribute('cy', (200 + 196 * Math.sin(a)).toFixed(1));
          num.nodeValue = HV.fmt(Math.round(m / 10) * 10);
          temp.nodeValue = m > 5050 ? '400+' : String(Math.round(HV.interp(m, bounds, temps)));
          let i = 4;
          for (let k = 0; k < 5; k++) if (m < bounds[k + 1]) { i = k; break; }
          if (i !== active) {
            active = i;
            imgs.forEach((im, k) => { im.style.opacity = k === i ? 1 : 0; });
            names.forEach((n, k) => n.classList.toggle('is-on', k === i));
            desc.textContent = L[i].d;
          }
        };
        // pinned on every window; on landscape phones and very low windows v3.live.css gives the scene a layout that fits
        HV.pin(sec, 3, update);
        update(0);
      }

      /* contact background slides from paper to lagoon as the section arrives */
      if (!reduce) gsap.fromTo('.contact', { backgroundColor: '#f6f7f4' }, { backgroundColor: '#a8dadd', ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'top 30%', scrub: true } });
    });
    if (introDone) ctx.add(intro);
    ScrollTrigger.refresh();
  };
  const clear = () => {
    A.stop(); if (A.tween) A.tween.kill();
    ctx.revert(); // kills this build's scroll scenes and tweens, reverts split text and the styles they set
  };

  Okno.start({ build, clear, content: document.querySelector('main') });

  /* loader → hero (once; the loader is not part of a rebuild) */
  HV.loader(() => { introDone = true; ctx.add(intro); });
});
