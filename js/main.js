/* ==========================================================================
   SALON SLH BREST : interactions et mouvement
   GSAP + ScrollTrigger + SplitText + Lenis, tout en local (aucun CDN).
   Le contenu reste lisible si le script échoue ou si l'utilisateur demande
   moins de mouvement (prefers-reduced-motion).
   ========================================================================== */
(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger && window.SplitText);
  const hasLenis = typeof window.Lenis !== 'undefined';
  const NBSP = ' ';

  let lenis = null;
  const nav = $('#nav');
  const menu = $('#menu');
  const burger = $('#burger');
  const fab = $('#fab');

  /* ------------------------------------------------------------------
     Horaires : statut « ouvert / fermé » (heure de Paris) + jour courant
     ------------------------------------------------------------------ */
  const OPEN = { 2: [9, 19], 3: [9, 19], 4: [9, 19], 5: [9, 19], 6: [9, 16] };
  const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

  function parisNow() {
    try { return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' })); }
    catch (e) { return new Date(); }
  }

  function statusInfo() {
    const d = parisNow();
    const day = d.getDay();
    const h = d.getHours() + d.getMinutes() / 60;
    const today = OPEN[day];
    if (today && h >= today[0] && h < today[1]) return { day, open: true, text: `Ouvert · jusqu’à ${today[1]}${NBSP}h` };
    if (today && h < today[0]) return { day, open: false, text: `Fermé · ouvre à ${today[0]}${NBSP}h` };
    for (let i = 1; i <= 7; i++) {
      const nd = (day + i) % 7;
      if (OPEN[nd]) return { day, open: false, text: `Fermé · rouvre ${i === 1 ? 'demain' : DAYS[nd]} à ${OPEN[nd][0]}${NBSP}h` };
    }
    return { day, open: false, text: 'Fermé' };
  }

  function initStatus() {
    const render = () => {
      const s = statusInfo();
      $$('[data-status]').forEach((el) => {
        el.classList.toggle('is-open', s.open);
        const t = $('.status__text', el);
        if (t) t.textContent = s.text;
      });
      $$('.hours tr').forEach((tr) => {
        if (Number(tr.dataset.day) === s.day) tr.setAttribute('aria-current', 'date');
        else tr.removeAttribute('aria-current');
      });
    };
    render();
    setInterval(render, 60000);
  }

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------
     Lightbox (galerie) : <dialog> natif, focus piégé par le navigateur
     ------------------------------------------------------------------ */
  function initLightbox() {
    const dlg = $('#lightbox');
    if (!dlg || typeof dlg.showModal !== 'function') return;
    const triggers = $$('[data-lightbox]');
    const img = $('#lbImg');
    const cap = $('#lbCap');
    let current = 0;

    const show = (i) => {
      current = (i + triggers.length) % triggers.length;
      const t = triggers[current];
      const src = $('img', t);
      img.src = src.currentSrc || src.src;
      img.alt = src.alt;
      img.width = src.naturalWidth || src.width;
      img.height = src.naturalHeight || src.height;
      cap.textContent = $('.shot__cap span', t).textContent;
      if (hasGSAP && !reduce) gsap.fromTo(img, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'expo.out' });
    };

    triggers.forEach((t, i) => t.addEventListener('click', () => {
      show(i);
      dlg.showModal();
      if (lenis) lenis.stop();
    }));
    $('[data-lb-close]', dlg).addEventListener('click', () => dlg.close());
    $('[data-lb-prev]', dlg).addEventListener('click', () => show(current - 1));
    $('[data-lb-next]', dlg).addEventListener('click', () => show(current + 1));
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', () => { if (lenis && !(menu && !menu.hidden)) lenis.start(); });
    dlg.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });
  }

  /* ------------------------------------------------------------------
     Carrousel d'avis : scroll-snap natif + mise en scène par la position
     ------------------------------------------------------------------ */
  function initReviews() {
    const vp = $('#revViewport');
    if (!vp) return;
    const cards = $$('.review', vp);
    const n = cards.length;
    const num = $('#revNum');
    const bar = $('#revBar');
    let idx = 0;
    let raf = 0;
    let paused = false;
    let timer = null;

    const goTo = (i) => {
      idx = (i + n) % n;
      const c = cards[idx];
      vp.scrollTo({ left: c.offsetLeft - (vp.clientWidth - c.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
    };

    const update = () => {
      raf = 0;
      const mid = vp.scrollLeft + vp.clientWidth / 2;
      let best = 0;
      let bestD = Infinity;
      cards.forEach((c, i) => {
        const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
        if (d < bestD) { bestD = d; best = i; }
        const k = Math.min(d / (vp.clientWidth * 0.55), 1);
        c.style.setProperty('--s', (1 - k * 0.09).toFixed(3));
        c.style.setProperty('--o', (1 - k * 0.36).toFixed(3));
      });
      idx = best;
      cards.forEach((c, i) => c.classList.toggle('is-active', i === best));
      if (num) num.textContent = String(best + 1);
      if (bar) bar.style.transform = `scaleX(${(best + 1) / n})`;
    };

    vp.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);
    $('#revPrev').addEventListener('click', () => goTo(idx - 1));
    $('#revNext').addEventListener('click', () => goTo(idx + 1));
    vp.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(idx - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(idx + 1); }
    });

    // Position de départ : premier avis centré
    requestAnimationFrame(() => { vp.scrollLeft = cards[0].offsetLeft - (vp.clientWidth - cards[0].offsetWidth) / 2; update(); });

    // Lecture automatique douce (jamais en mouvement réduit, stoppée au survol/focus)
    if (!reduce) {
      const stop = () => { paused = true; };
      const go = () => { paused = false; };
      vp.addEventListener('pointerenter', stop); vp.addEventListener('pointerleave', go);
      vp.addEventListener('focusin', stop); vp.addEventListener('focusout', go);
      vp.addEventListener('touchstart', stop, { passive: true });
      const section = $('#avis');
      let visible = false;
      new IntersectionObserver((e) => { visible = e[0].isIntersecting; }, { threshold: 0.35 }).observe(section);
      timer = setInterval(() => { if (visible && !paused && !document.hidden) goTo(idx + 1); }, 6500);
    }
  }

  /* ------------------------------------------------------------------
     FAQ : <details> natifs, ouverture animée si GSAP
     ------------------------------------------------------------------ */
  function initFaq(animated) {
    $$('.qa').forEach((qa) => {
      const sum = $('summary', qa);
      const body = $('.qa__body', qa);
      if (!animated) return;
      sum.addEventListener('click', (e) => {
        e.preventDefault();
        if (qa.classList.contains('is-open')) {
          qa.classList.remove('is-open');
          gsap.to(body, { height: 0, duration: 0.6, ease: 'expo.out', onComplete: () => { qa.open = false; gsap.set(body, { clearProps: 'height' }); } });
        } else {
          qa.open = true;
          qa.classList.add('is-open');
          gsap.fromTo(body, { height: 0 }, { height: 'auto', duration: 0.8, ease: 'expo.out', onComplete: () => gsap.set(body, { clearProps: 'height' }) });
        }
      });
    });
  }

  /* ------------------------------------------------------------------
     Menu plein écran
     ------------------------------------------------------------------ */
  let menuOpen = false;
  function menuCircle(r) {
    const x = window.innerWidth - 46;
    return `circle(${r}px at ${x}px 46px)`;
  }
  function openMenu() {
    if (menuOpen) return;
    menuOpen = true;
    menu.hidden = false;
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Fermer le menu');
    nav.classList.add('nav--menu');
    nav.classList.remove('nav--hidden');
    const main = $('#main'); if (main) main.setAttribute('inert', '');
    if (lenis) lenis.stop();
    if (hasGSAP && !reduce) {
      const bg = $('.menu__bg');
      const R = Math.hypot(window.innerWidth, window.innerHeight) + 40;
      gsap.timeline()
        .fromTo(bg, { clipPath: menuCircle(0) }, { clipPath: menuCircle(R), duration: 1, ease: 'expo.inOut' })
        .fromTo('.menu__inner a span, .menu__inner .menu__call', { yPercent: 115 }, { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.06 }, '-=0.55');
    } else {
      $('.menu__bg').style.clipPath = 'none';
    }
    const first = $('.menu__inner a', menu);
    if (first) setTimeout(() => first.focus({ preventScroll: true }), 50);
  }
  function closeMenu(immediate) {
    if (!menuOpen) return;
    menuOpen = false;
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Ouvrir le menu');
    const main = $('#main'); if (main) main.removeAttribute('inert');
    const done = () => { menu.hidden = true; nav.classList.remove('nav--menu'); if (lenis) lenis.start(); };
    if (hasGSAP && !reduce && !immediate) {
      const R = Math.hypot(window.innerWidth, window.innerHeight) + 40;
      gsap.to($('.menu__bg'), { clipPath: menuCircle(0), duration: 0.8, ease: 'expo.inOut', onComplete: done });
      gsap.to('.menu__inner a span, .menu__inner .menu__call', { yPercent: 115, duration: 0.5, ease: 'power3.in', stagger: 0.03 });
    } else done();
    burger.focus({ preventScroll: true });
  }
  if (burger) burger.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) closeMenu(); });
  window.addEventListener('resize', () => { if (menuOpen && window.innerWidth >= 1000) closeMenu(true); });

  /* ------------------------------------------------------------------
     Initialisations de base (sans GSAP)
     ------------------------------------------------------------------ */
  initStatus();
  initLightbox();
  initReviews();

  /* ------------------------------------------------------------------
     Mode statique : GSAP absent ou mouvement réduit
     ------------------------------------------------------------------ */
  function staticMode() {
    root.classList.add('is-static');
    const l = $('#loader'); if (l) l.remove();
    initFaq(false);
    const onScroll = () => nav.classList.toggle('nav--solid', window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    const hero = $('.hero');
    if (fab && 'IntersectionObserver' in window) {
      new IntersectionObserver((e) => fab.classList.toggle('is-visible', !e[0].isIntersecting), { threshold: 0.2 }).observe(hero);
    }
    $$('a[href^="#"]').forEach((a) => a.addEventListener('click', () => { if (menuOpen) closeMenu(true); }));
  }

  if (!hasGSAP || reduce) { staticMode(); return; }

  /* ==================================================================
     MODE ANIMÉ
     ================================================================== */
  gsap.registerPlugin(ScrollTrigger, SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });
  const mm = gsap.matchMedia();
  const isDesktop = () => window.innerWidth >= 1000;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const EXPO = 'expo.out';

  /* ---------- Défilement fluide (Lenis) ---------- */
  if (hasLenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  // Ancres internes
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id === '#' || id === '#top' ? 0 : document.querySelector(id);
    if (target === null) return;
    e.preventDefault();
    if (menuOpen) closeMenu(true);
    if (lenis) lenis.scrollTo(target, { duration: 1.5, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else (target === 0 ? window.scrollTo({ top: 0, behavior: 'smooth' }) : target.scrollIntoView({ behavior: 'smooth' }));
    if (id.length > 1) history.replaceState(null, '', id);
  });

  /* ---------- Titres : lettres/mots qui montent derrière un masque ---------- */
  function splitHeading(el) {
    SplitText.create(el, {
      type: 'lines,words', mask: 'lines', autoSplit: true,
      onSplit(self) {
        return gsap.from(self.words, {
          yPercent: 115, rotate: 3, duration: 1.4, ease: EXPO, stagger: 0.07,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      },
    });
  }
  function reveals(scope) {
    $$('[data-split]', scope).forEach(splitHeading);
    $$('[data-reveal]', scope).forEach((el) => {
      gsap.from(el, { y: 38, opacity: 0, duration: 1.3, ease: EXPO, scrollTrigger: { trigger: el, start: 'top 91%', once: true } });
    });
  }

  /* ---------- Boutons magnétiques ---------- */
  if (finePointer) {
    $$('.btn--magnetic').forEach((el) => {
      const s = el.classList.contains('cta__button') ? 0.38 : 0.32;
      const xTo = gsap.quickTo(el, 'x', { duration: 0.9, ease: 'elastic.out(1, 0.45)' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.9, ease: 'elastic.out(1, 0.45)' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * s);
        yTo((e.clientY - (r.top + r.height / 2)) * s);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- Cartes et photos : inclinaison 3D + reflet qui suit la souris ---------- */
  function tilt(el, max, glare) {
    gsap.set(el, { transformPerspective: 1000 });
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.7, ease: 'power3.out' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.7, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      ry((px - 0.5) * max * 2);
      rx(-(py - 0.5) * max * 2);
      if (glare) {
        glare.style.setProperty('--gx', `${(px - 0.5) * r.width}px`);
        glare.style.setProperty('--gy', `${(py - 0.5) * r.height}px`);
      }
      el.classList.add('is-hover');
    });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); el.classList.remove('is-hover'); });
  }

  /* ==================================================================
     PRÉCHARGEUR + ENTRÉE DU HERO
     ================================================================== */
  const loader = $('#loader');
  let heroChars = [];

  // Découpe du titre : après le chargement des polices (sinon SplitText mesure avec la police de secours)
  function prepareHero() {
    heroChars = $$('.hero__word').flatMap((w) => SplitText.create(w, { type: 'chars', aria: 'none' }).chars);
    gsap.set(heroChars, { yPercent: 118, rotate: 8, transformOrigin: '0% 100%' });
  }

  // États initiaux du hero (le préchargeur les masque déjà)
  gsap.set($('.arch__mask'), { clipPath: 'inset(100% 0% 0% 0%)' });
  gsap.set($('.arch__mask img'), { scale: 1.3 });
  gsap.set($('.tile__mask'), { clipPath: 'inset(100% 0% 0% 0%)' });
  gsap.set($('.tile__mask img'), { scale: 1.3 });
  gsap.set($('.tile'), { opacity: 1 });
  gsap.set('[data-hero="moss"]', { scale: 1.22 });
  gsap.set('[data-hero="frame"]', { opacity: 0, scale: 0.86 });
  gsap.set('[data-hero="lines"]', { opacity: 0 });
  gsap.set('[data-hero="stamp"]', { scale: 0, rotate: -90 });
  gsap.set(['[data-hero="lead"]', '[data-hero="cta"]', '[data-hero="status"]', '[data-hero="scroll"]'], { y: 36, opacity: 0 });

  function heroIn() {
    const tl = gsap.timeline({ defaults: { ease: EXPO } });
    tl.to('[data-hero="moss"]', { scale: 1, duration: 2.8, ease: 'power3.out' }, 0)
      .to('[data-hero="lines"]', { opacity: 0.09, duration: 2 }, 0.3)
      .to('[data-hero="frame"]', { opacity: 1, scale: 1, duration: 2.2 }, 0.1)
      .to(heroChars, { yPercent: 0, rotate: 0, duration: 1.5, stagger: 0.035 }, 0.1)
      .to($('.hero__wave'), { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'power3.inOut' }, 1.1)
      .to($('.arch__mask'), { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'expo.inOut' }, 0.25)
      .to($('.arch__mask img'), { scale: 1, duration: 2.6 }, 0.25)
      .to($('.tile__mask'), { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' }, 0.7)
      .to($('.tile__mask img'), { scale: 1, duration: 2.4 }, 0.7)
      .to('[data-hero="stamp"]', { scale: 1, rotate: 0, duration: 1.6, ease: 'back.out(1.4)' }, 1.1)
      .to('[data-hero="lead"]', { y: 0, opacity: 1, duration: 1.3 }, 0.85)
      .to('[data-hero="cta"]', { y: 0, opacity: 1, duration: 1.3 }, 1.0)
      .to('[data-hero="status"]', { y: 0, opacity: 1, duration: 1.3 }, 1.15)
      .to('[data-hero="scroll"]', { y: 0, opacity: 0.85, duration: 1.3 }, 1.3)
      .from(nav, { yPercent: -100, duration: 1.2, clearProps: 'transform' }, 0.9);
    // Ken Burns doux sur les photos du hero
    tl.add(() => {
      gsap.to('.arch__mask img', { scale: 1.07, duration: 16, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      gsap.to('.tile__mask img', { scale: 1.09, duration: 13, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    }, '>-0.4');
    return tl;
  }

  function runLoader() {
    const frame = $('.loader__frame');
    const len = 464;
    const counter = { v: 0 };
    const numEl = $('#loaderNum');
    gsap.set(frame, { strokeDasharray: len, strokeDashoffset: len });
    gsap.set('.loader__slh, .loader__sub', { opacity: 0, y: 10 });

    const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
    intro.to(frame, { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut' }, 0)
      .to('.loader__slh', { opacity: 1, y: 0, duration: 0.9 }, 0.55)
      .to('.loader__sub', { opacity: 1, y: 0, duration: 0.9 }, 0.75)
      .to(counter, { v: 100, duration: 1.7, ease: 'power2.inOut', onUpdate: () => { numEl.textContent = Math.round(counter.v); } }, 0);

    const minTime = new Promise((r) => intro.eventCallback('onComplete', r));
    const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    const heroImg = $('.arch img');
    const imgReady = heroImg.complete ? Promise.resolve() : new Promise((r) => { heroImg.addEventListener('load', r); heroImg.addEventListener('error', r); });
    const safety = new Promise((r) => setTimeout(r, 5000));

    Promise.race([Promise.all([minTime, fontsReady, imgReady]), safety]).then(() => {
      numEl.textContent = '100';
      prepareHero();
      const exit = gsap.timeline();
      exit.to('.loader__center', { scale: 1.18, opacity: 0, duration: 0.55, ease: 'power3.in' })
        .to('.loader__panel--front', { yPercent: -100, y: -40, duration: 1.25, ease: 'expo.inOut' }, '-=0.1')
        .to('.loader__panel--back', { yPercent: -100, y: -40, duration: 1.25, ease: 'expo.inOut' }, '<0.14')
        .add(heroIn, '-=0.8')
        .add(() => {
          loader.remove();
          if (lenis) lenis.start();
          ScrollTrigger.refresh();
        }, '-=0.2');
    });
  }

  /* ==================================================================
     SECTIONS : créées dans l'ordre du document (important pour les pins)
     ================================================================== */

  /* ---------- Barre de progression + navigation ---------- */
  gsap.to('.progress i', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  const onScroll = ({ scroll, direction }) => {
    nav.classList.toggle('nav--solid', scroll > 60);
    if (menuOpen) return;
    if (scroll > 420 && direction === 1) nav.classList.add('nav--hidden');
    else if (direction === -1 || scroll <= 420) nav.classList.remove('nav--hidden');
  };
  if (lenis) lenis.on('scroll', onScroll);
  else {
    let last = 0;
    window.addEventListener('scroll', () => { const y = window.scrollY; onScroll({ scroll: y, direction: y > last ? 1 : -1 }); last = y; }, { passive: true });
  }
  nav.addEventListener('focusin', () => nav.classList.remove('nav--hidden'));

  /* ---------- 1. Hero : parallax multicouche au scroll ---------- */
  (function heroParallax() {
    const k = isDesktop() ? 1 : 0.5;
    const st = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
    gsap.to('[data-hero="moss"]', { yPercent: 16 * k, ease: 'none', scrollTrigger: st });
    gsap.to('[data-hero="lines"]', { yPercent: -10 * k, ease: 'none', scrollTrigger: st });
    gsap.to('[data-hero="frame"]', { yPercent: -16 * k, rotate: 5 * k, ease: 'none', scrollTrigger: st });
    gsap.to('[data-hero="arch"]', { yPercent: -9 * k, ease: 'none', scrollTrigger: st });
    gsap.to('[data-hero="tile"]', { yPercent: -42 * k, ease: 'none', scrollTrigger: st });
    gsap.to('[data-hero="stamp"]', { yPercent: -90 * k, ease: 'none', scrollTrigger: st });
    gsap.to('.hero__inner', { yPercent: -7 * k, opacity: 0.1, ease: 'none', scrollTrigger: { ...st, end: 'bottom 30%' } });
    gsap.to('.arch__mask img', { yPercent: 9, ease: 'none', scrollTrigger: st });
  })();

  /* ---------- 2. Marquee : vitesse et sens réagissent au scroll ---------- */
  (function marquee() {
    const rows = $$('.marquee__row');
    const tilt = $('.marquee__tilt');
    const items = [];
    gsap.set(tilt, { rotate: -2.4 });
    rows.forEach((row, i) => {
      const base = $('.marquee__track', row);
      const copies = Math.max(1, Math.ceil((window.innerWidth * 1.4) / Math.max(base.offsetWidth, 1)));
      for (let c = 0; c < copies; c++) {
        const clone = base.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        row.appendChild(clone);
      }
      const tracks = $$('.marquee__track', row);
      const dir = Number(row.dataset.dir);
      const tween = dir < 0
        ? gsap.to(tracks, { xPercent: -100, duration: 34 + i * 6, ease: 'none', repeat: -1 })
        : gsap.fromTo(tracks, { xPercent: -100 }, { xPercent: 0, duration: 40 + i * 6, ease: 'none', repeat: -1 });
      items.push(tween);
    });
    const skew = gsap.quickTo(tilt, 'skewX', { duration: 0.6, ease: 'power3.out' });
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate(self) {
        const v = gsap.utils.clamp(-3200, 3200, self.getVelocity());
        const dir = self.direction || 1;
        const k = 1 + Math.abs(v) / 320;
        items.forEach((t) => { t.timeScale(dir * k); gsap.to(t, { timeScale: dir, duration: 1.1, ease: 'power3.out', overwrite: true }); });
        skew(gsap.utils.clamp(-5, 5, -v / 420));
      },
    });
    gsap.to({}, { duration: 0.01, scrollTrigger: { trigger: '.marquee', start: 'top bottom', onLeave: () => skew(0), onLeaveBack: () => skew(0) } });
  })();

  /* ---------- 3. Le salon : intro + storytelling pinné (desktop) ---------- */
  reveals($('.story__intro'));
  mm.add('(min-width: 1000px)', () => {
    const story = $('.story');
    const stage = $('#storyStage');
    const steps = $$('.step', story);
    const dots = $$('.story__rail li');
    const n = steps.length;
    story.classList.add('is-pinned');

    const pieces = steps.map((s) => ({ el: s, text: $('.step__text', s), frame: $('.step__frame', s), img: $('.step__frame img', s), fig: $('.step__fig', s) }));
    pieces.forEach((p, i) => {
      if (i === 0) return;
      gsap.set(p.el, { autoAlpha: 0 });
      gsap.set(p.frame, { clipPath: 'inset(100% 0% 0% 0%)' });
      gsap.set(p.img, { scale: 1.3 });
      gsap.set(p.text, { y: 50, opacity: 0 });
      gsap.set(p.fig, { opacity: 0 });
    });
    gsap.set(pieces[0].img, { scale: 1.12 });

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: stage, start: 'top top', end: () => '+=' + Math.round(window.innerHeight * n * 0.95),
        pin: true, scrub: 0.7, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate(self) {
          const t = self.progress * n;
          const idx = Math.min(n - 1, Math.floor(t + 0.12));
          dots.forEach((d, i) => d.classList.toggle('is-on', i === idx));
        },
      },
    });
    tl.to(pieces[0].img, { scale: 1, duration: 0.9 }, 0);
    for (let i = 1; i < n; i++) {
      const prev = pieces[i - 1];
      const cur = pieces[i];
      tl.to(prev.text, { y: -50, opacity: 0, duration: 0.3, ease: 'power2.in' }, i - 0.28)
        .to(prev.frame, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.42, ease: 'power2.inOut' }, i - 0.3)
        .set(prev.el, { autoAlpha: 0 }, i + 0.15)
        .set(cur.el, { autoAlpha: 1 }, i - 0.12)
        .set(cur.fig, { opacity: 1 }, i - 0.12)
        .to(cur.frame, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.55, ease: 'power2.inOut' }, i - 0.1)
        .to(cur.img, { scale: 1, duration: 0.9, ease: 'power2.out' }, i - 0.1)
        .to(cur.text, { y: 0, opacity: 1, duration: 0.45, ease: 'power2.out' }, i + 0.1);
    }
    tl.to({}, { duration: 0.3 }, n - 0.3);
    tl.to('.story__stamp', { rotate: 360, duration: n }, 0);
    dots[0].classList.add('is-on');

    return () => { story.classList.remove('is-pinned'); };
  });
  mm.add('(max-width: 999px)', () => {
    $$('.step').forEach((s) => {
      gsap.from(s, { y: 50, opacity: 0, duration: 1.3, ease: EXPO, scrollTrigger: { trigger: s, start: 'top 85%', once: true } });
      const img = $('.step__frame img', s);
      gsap.fromTo(img, { yPercent: -4, scale: 1.12 }, { yPercent: 4, scale: 1.12, ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  });

  /* ---------- 4. Prestations : défilement horizontal piloté par le scroll ---------- */
  reveals($('.services__intro'));
  mm.add('(min-width: 1000px)', () => {
    const sec = $('.services');
    const pin = $('.services__pin');
    const track = $('#servTrack');
    const bar = $('.services__bar i');
    sec.classList.add('is-hscroll');
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);

    const tween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: pin, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.8,
        anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: (self) => { bar.style.transform = `scaleX(${self.progress})`; },
      },
    });
    $$('.card, .services__outro', track).forEach((card, i) => {
      gsap.from(card, { opacity: 0, x: 90, rotate: 2.5, duration: 1.1, ease: EXPO, scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 96%', toggleActions: 'play none none reverse' } });
    });
    $$('.card__bg', track).forEach((bg) => {
      gsap.fromTo(bg, { xPercent: 6 }, { xPercent: -6, ease: 'none', scrollTrigger: { trigger: bg.parentElement, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
    });
    return () => { sec.classList.remove('is-hscroll'); gsap.set(track, { clearProps: 'transform' }); };
  });
  if (finePointer) $$('[data-tilt]').forEach((c) => tilt(c, 8, $('.card__glare', c)));

  /* ---------- 5. Chiffres : compteurs à rouleaux ---------- */
  reveals($('.figures'));
  (function figures() {
    $$('[data-count]').forEach((el) => {
      const value = String(el.dataset.count);
      el.setAttribute('role', 'img');
      el.setAttribute('aria-label', value);
      el.textContent = '';
      const strips = [];
      value.split('').forEach((ch) => {
        const d = Number(ch);
        const odo = document.createElement('span');
        odo.className = 'odo';
        odo.setAttribute('aria-hidden', 'true');
        const strip = document.createElement('span');
        strip.className = 'odo__strip';
        for (let c = 0; c < 3; c++) for (let k = 0; k < 10; k++) { const s = document.createElement('span'); s.textContent = k; strip.appendChild(s); }
        odo.appendChild(strip);
        el.appendChild(odo);
        gsap.set(strip, { yPercent: 0 });
        strips.push({ strip, d });
      });
      const fig = el.closest('[data-figure]');
      ScrollTrigger.create({
        trigger: fig, start: 'top 80%', once: true,
        onEnter() {
          strips.forEach(({ strip, d }, i) => {
            gsap.to(strip, { yPercent: -((20 + d) / 30) * 100, duration: 2.6 + i * 0.5, ease: 'expo.out', delay: i * 0.12 });
          });
          gsap.from($('.figure__text', fig), { y: 30, opacity: 0, duration: 1.2, ease: EXPO, delay: 0.5 });
        },
      });
      // Les rouleaux démarrent sur « 0 » avant l'entrée dans l'écran ; hors JS le chiffre final reste lisible
      gsap.set($$('.odo__strip', el), { yPercent: 0 });
    });
  })();

  /* ---------- 6. Galerie : masques, parallax dans le cadre, tilt, lightbox ---------- */
  reveals($('.gallery'));
  (function gallery() {
    const masks = {
      curtain: ['inset(0% 0% 100% 0%)', 'inset(0% 0% 0% 0%)'],
      rise: ['inset(100% 0% 0% 0%)', 'inset(0% 0% 0% 0%)'],
      circle: ['circle(0% at 50% 50%)', 'circle(75% at 50% 50%)'],
    };
    const speeds = { 1: 0.5, 2: 1, 3: -0.4, 4: 0.3, 5: 0.9 };
    $$('[data-shot]').forEach((shot, i) => {
      const frame = $('.shot__frame', shot);
      const img = $('img', frame);
      const type = masks[shot.dataset.mask] || masks.curtain;
      gsap.fromTo(frame, { clipPath: type[0] }, { clipPath: type[1], duration: 1.8, ease: 'expo.inOut', scrollTrigger: { trigger: shot, start: 'top 86%', once: true } });
      gsap.from(img, { scale: 1.35, duration: 2.4, ease: EXPO, scrollTrigger: { trigger: shot, start: 'top 86%', once: true } });
      gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: shot, start: 'top bottom', end: 'bottom top', scrub: true } });
      if (isDesktop()) {
        const sp = speeds[i + 1] || 0.5;
        gsap.fromTo(shot, { y: sp * 36 }, { y: sp * -36, ease: 'none', scrollTrigger: { trigger: '.gallery__grid', start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
      }
      const btn = $('.shot__btn', shot);
      if (finePointer) {
        tilt(btn, 6);
        btn.addEventListener('pointerenter', () => gsap.to(img, { scale: 1.07, duration: 1, ease: EXPO, overwrite: 'auto' }));
        btn.addEventListener('pointerleave', () => gsap.to(img, { scale: 1, duration: 1, ease: EXPO, overwrite: 'auto' }));
      }
    });
  })();

  /* ---------- 7. Avis ---------- */
  reveals($('.reviews__head'));
  gsap.from('.reviews__viewport', { opacity: 0, y: 60, duration: 1.4, ease: EXPO, scrollTrigger: { trigger: '.reviews__viewport', start: 'top 90%', once: true } });

  /* ---------- 8. FAQ ---------- */
  reveals($('.faq'));
  initFaq(true);

  /* ---------- 9. Appel à l'action ---------- */
  (function cta() {
    const sec = $('.cta');
    splitHeading($('.cta__title'));
    const digits = $$('.cta__phone span');
    gsap.from(digits, { yPercent: 115, duration: 1.5, ease: EXPO, stagger: 0.09, scrollTrigger: { trigger: '.cta__phone', start: 'top 88%', once: true } });
    gsap.from('.cta__button', { scale: 0, rotate: -120, duration: 1.6, ease: 'back.out(1.5)', scrollTrigger: { trigger: '.cta__button', start: 'top 92%', once: true } });
    gsap.from('.cta__hours', { y: 30, opacity: 0, duration: 1.2, ease: EXPO, scrollTrigger: { trigger: '.cta__hours', start: 'top 95%', once: true } });
    gsap.fromTo('.cta__moss', { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } });
    if (fab) {
      ScrollTrigger.create({ trigger: '.hero', start: 'bottom 45%', onEnter: () => fab.classList.add('is-visible'), onLeaveBack: () => fab.classList.remove('is-visible') });
      ScrollTrigger.create({ trigger: sec, start: 'top 70%', end: 'bottom 30%', onToggle: (s) => { if (s.isActive) fab.classList.remove('is-visible'); else if (window.scrollY > window.innerHeight * 0.6 && !footerSeen) fab.classList.add('is-visible'); } });
      let footerSeen = false;
      ScrollTrigger.create({ trigger: '.footer', start: 'top 85%', onEnter: () => { footerSeen = true; fab.classList.remove('is-visible'); }, onLeaveBack: () => { footerSeen = false; fab.classList.add('is-visible'); } });
    }
  })();

  /* ---------- 10. Nous trouver ---------- */
  (function find() {
    const sec = $('.find');
    const map = $('.find__map');
    gsap.fromTo(map, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'expo.inOut', scrollTrigger: { trigger: map, start: 'top 85%', once: true } });
    reveals($('.find__info'));
  })();

  /* ---------- Footer : grand nom, vague au survol ---------- */
  (function footer() {
    const letters = $$('#giant span:not(.gap)');
    gsap.from(letters, { yPercent: 110, duration: 1.6, ease: EXPO, stagger: 0.06, scrollTrigger: { trigger: '#giant', start: 'top 92%', once: true } });
    if (finePointer) {
      const g = $('#giant');
      g.parentElement.addEventListener('pointermove', (e) => {
        letters.forEach((l) => {
          const r = l.getBoundingClientRect();
          const d = Math.abs(e.clientX - (r.left + r.width / 2));
          const lift = gsap.utils.clamp(0, 1, 1 - d / 280);
          gsap.to(l, { y: -lift * 26, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
        });
      });
      g.parentElement.addEventListener('pointerleave', () => gsap.to(letters, { y: 0, duration: 0.9, ease: EXPO, overwrite: 'auto' }));
    }
  })();

  /* ---------- Rafraîchissements : polices, images, redimensionnement ---------- */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());

  runLoader();
})();
