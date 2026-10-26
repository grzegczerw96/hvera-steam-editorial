/* V3 — Steam Editorial: page behaviour */
HV.ready(({ gsap, ScrollTrigger, ease, $$, data, reduce }) => {
  /* pill nav hides on the way down, returns on the way up */
  const nav = document.querySelector('.ui-layer .nav');
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => nav.classList.toggle('is-hidden', s.direction === 1 && s.scroll() > innerHeight * 0.5) });
  HV.linkNav('.ui-layer .nav__links span, .menu__links li');

  /* reveals */
  HV.lines('main .s-xl:not(.depth__read .s-xl), main .impact .s-hero, main .contact .s-hero');
  HV.chars('main .about__l .s-l');
  HV.count('.about__r .s, .impact__strip .s');
  HV.fadeUp('.svc__r, .about__r, .roles3, .impact__strip', { children: true, y: 30 });
  if (!reduce) {
    // masonry images drift at slightly different speeds
    $$('.pitem .card img, .car__img img, .svc__l .card img').forEach((img, i) => gsap.fromTo(img, { scale: 1.12, yPercent: -4 * ((i % 3) - 1) }, { scale: 1, yPercent: 4 * ((i % 3) - 1), ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
    gsap.fromTo('.hero__card', { clipPath: 'inset(0% 0% 0% 0% round 1.25em)' }, { clipPath: 'inset(0% 0% 12% 0% round 1.25em)', ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.fromTo('.impact__bg img', { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.impact', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* hovers */
  HV.hover('.svc__row');
  HV.hover('.roles3 > div');
  HV.hover('.pill', 'is-h');
  HV.hover('.link', 'is-h');
  HV.hover('.menu__links li');

  /* depth: ring of 120 ticks fills with depth, the photo in the circle follows the layer */
  const sec = document.querySelector('.depth');
  if (sec) {
    const L = data.layers;
    const bounds = [0, 300, 900, 2200, 3500, 5100];
    const temps = [10, 45, 110, 240, 300, 400];
    const ticks = $$('svg.ticks line', sec);
    const marker = sec.querySelector('svg.ticks circle');
    const imgs = $$('.ring__img img', sec);
    const names = $$('.depth__list .s', sec);
    const read = sec.querySelector('.depth__read');
    const range = read.querySelector('.mono.teal');
    const num = read.querySelector('.s-xl').firstChild;
    const temp = read.querySelector('.depth__temp .s');
    const desc = read.querySelector('p.body');
    const dots = $$('.depth__dots i', sec);
    let active = -1;
    const update = (p) => {
      const m = p * 5100;
      ticks.forEach((t, k) => t.setAttribute('stroke', k / ticks.length <= p ? '#0f4c55' : 'rgba(20,32,31,.25)'));
      const a = Math.max(p, 0.004) * Math.PI * 2 - Math.PI / 2;
      marker.setAttribute('cx', (200 + 196 * Math.cos(a)).toFixed(1));
      marker.setAttribute('cy', (200 + 196 * Math.sin(a)).toFixed(1));
      num.nodeValue = HV.fmt(Math.round(m / 10) * 10);
      temp.textContent = (m > 5050 ? '400+' : Math.round(HV.interp(m, bounds, temps))) + ' °C';
      let i = 4;
      for (let k = 0; k < 5; k++) if (m < bounds[k + 1]) { i = k; break; }
      if (i !== active) {
        active = i;
        imgs.forEach((im, k) => { im.style.opacity = k === i ? 1 : 0; });
        names.forEach((n, k) => n.classList.toggle('is-on', k === i));
        dots.forEach((d, k) => d.classList.toggle('is-on', k <= i));
        range.textContent = `0${i + 1} / 05 · ${L[i].r}`;
        desc.textContent = L[i].d;
      }
    };
    HV.pin(sec, 3, update);
    update(0);
  }

  /* contact background slides from paper to lagoon as the section arrives */
  if (!reduce) gsap.fromTo('.contact', { backgroundColor: '#f6f7f4' }, { backgroundColor: '#a8dadd', ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'top 30%', scrub: true } });

  /* menu: fade in, links rise */
  HV.menu({
    openers: '.ui-layer .nav__menu',
    closers: '.nav__menu',
    build: (layer) => gsap.timeline()
      .to(layer.querySelector('.menu'), { opacity: 1, duration: 0.5, ease: 'power2.out' })
      .from($$('.menu__links li', layer), { yPercent: 30, opacity: 0, duration: 0.6, stagger: 0.04, ease }, '-=0.3'),
  });

  /* loader → hero */
  HV.loader(() => {
    HV.lines('.hero .s-hero', { trigger: false });
    if (!reduce) {
      gsap.from('.hero__card', { clipPath: 'inset(18% 14% 0% 14% round 1.25em)', duration: 1.6, ease, delay: 0.15 });
      gsap.from('.hero__sub', { opacity: 0, y: -12, duration: 0.8, ease, delay: 0.5 }); // nav is left alone: its transform belongs to the hide-on-scroll class
    }
  });
});
