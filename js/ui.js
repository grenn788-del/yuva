/* Yuva – interactions : Lenis, GSAP/ScrollTrigger, scène hero, projets plein écran, menu, formulaire. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(pointer: coarse)').matches;
  /* Adresse du studio : à renseigner plus tard (ex. 'contact@votredomaine.fr').
     Tant qu'elle est vide, le formulaire n'envoie rien et le signale au visiteur. */
  var CONTACT_EMAIL = '';
  var PROJECTS = window.YUVA_PROJECTS || [];

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  var lenis = null;
  var header = $('#header'), menu = $('#menu'), burger = $('#burger');
  var hasGsap = !!(window.gsap && window.ScrollTrigger);

  /* ---------- Menu mobile ---------- */
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    if (open) menu.removeAttribute('hidden'); else menu.setAttribute('hidden', '');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    if (lenis) { open ? lenis.stop() : lenis.start(); }
  }
  burger.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });

  /* ---------- Header ---------- */
  function onScrollHeader() { header.classList.toggle('scrolled', window.scrollY > 40); }
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();
  var yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Formulaire ---------- */
  (function () {
    var form = $('#project-form'), status = $('#form-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.website && form.website.value) return;
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var data = {};
      new FormData(form).forEach(function (v, k) { if (k !== 'website') data[k] = String(v).trim(); });
      var endpoint = form.getAttribute('data-endpoint');
      if (endpoint) {
        fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(data) })
          .then(function (r) { if (!r.ok) throw new Error(); status.textContent = 'Merci ' + data.nom + ', votre demande est envoyée.'; form.reset(); })
          .catch(function () { status.textContent = 'L’envoi a échoué. Merci de réessayer un peu plus tard.'; });
      } else if (CONTACT_EMAIL) {
        var body = ['Nom : ' + data.nom, 'Email : ' + data.email, 'Ville : ' + data.ville, 'Type d’espace : ' + data.type, '', data.message].join('\n');
        window.location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent('Nouveau projet Yuva – ' + data.nom) + '&body=' + encodeURIComponent(body);
        status.textContent = 'Votre messagerie s’ouvre avec votre demande prête à envoyer.';
      } else {
        status.textContent = 'L’envoi sera activé très prochainement. Merci de votre patience.';
      }
    });
  })();

  /* ---------- Projets : panneaux du défilement horizontal ---------- */
  var track = $('#rx-track');
  PROJECTS.forEach(function (p, i) {
    var a = document.createElement('a');
    a.className = 'rx-panel'; a.href = '#projet-' + p.id; a.setAttribute('data-id', p.id);
    a.setAttribute('aria-label', 'Ouvrir le projet : ' + p.title);
    a.innerHTML =
      '<div class="proj-frame" style="--ar:' + p.ratio + '"><img src="' + p.cover + '" alt="' + p.alt + '"' + (i > 1 ? ' loading="lazy"' : '') + '></div>' +
      '<div class="proj-cap"><p class="proj-meta">Projet 0' + (i + 1) + ' · ' + p.place + ' · ' + p.type + '</p><h3>' + p.title + '</h3><p>' + p.short + '</p><span class="proj-open">Ouvrir le projet</span></div>';
    track.appendChild(a);
  });
  var endCap = document.createElement('div'); endCap.className = 'rx-end'; track.appendChild(endCap);

  /* ---------- Fiche projet plein écran ---------- */
  var pj = $('#pj'), pjScroll = $('#pj-scroll'), pjClose = $('#pj-close');
  var current = -1, lastFocus = null, io = null, busy = false;

  function renderProject(i) {
    var p = PROJECTS[i], nx = PROJECTS[(i + 1) % PROJECTS.length];
    current = i;
    pjScroll.innerHTML =
      '<div class="pj-hero"><img src="' + p.cover + '" alt="' + p.alt + '"><div class="pj-title"><p>' + p.place + ' · ' + p.type + ' · ' + p.year + '</p><h2>' + p.title + '</h2></div></div>' +
      '<div class="pj-body"><dl class="pj-facts pj-rv">' + p.facts.map(function (f) { return '<div><dt>' + f[0] + '</dt><dd>' + f[1] + '</dd></div>'; }).join('') + '</dl>' +
      '<div class="pj-text pj-rv"><p class="lead">' + p.short + '</p>' + p.text.map(function (t) { return '<p>' + t + '</p>'; }).join('') + '</div></div>' +
      '<div class="pj-gallery">' + p.gallery.map(function (g) { return '<figure class="pj-rv"><img src="' + g + '" alt="" loading="lazy"></figure>'; }).join('') + '</div>' +
      '<div class="pj-next"><div><p>Projet suivant</p><h3>' + nx.title + '</h3></div><button class="btn btn-light" type="button" data-next>Projet suivant</button></div>';
    pjScroll.scrollTop = 0;
    if (io) io.disconnect();
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('seen'); io.unobserve(e.target); } });
    }, { root: pjScroll, threshold: 0.12 });
    $$('.pj-rv', pjScroll).forEach(function (el) { io.observe(el); });
    $('#pj-nextname').textContent = nx.title;
  }

  function panelFrame(id) { var a = $('.rx-panel[data-id="' + id + '"] .proj-frame'); return a; }
  function insetFrom(el) {
    var r = el.getBoundingClientRect();
    return 'inset(' + r.top + 'px ' + (window.innerWidth - r.right) + 'px ' + (window.innerHeight - r.bottom) + 'px ' + r.left + 'px round 20px)';
  }

  function openProject(id) {
    var i = PROJECTS.findIndex(function (p) { return p.id === id; });
    if (i < 0 || busy || !pj.hidden) return;
    busy = true; lastFocus = document.activeElement;
    renderProject(i);
    pj.hidden = false;
    root.classList.add('pj-open');
    if (lenis) lenis.stop();
    var done = function () { busy = false; pjClose.focus({ preventScroll: true }); };
    var f = panelFrame(id);
    if (hasGsap && !reduce && f) {
      gsap.fromTo(pj, { clipPath: insetFrom(f) }, { clipPath: 'inset(0px 0px 0px 0px round 0px)', duration: 1.1, ease: 'power4.inOut', onComplete: function () { gsap.set(pj, { clearProps: 'clipPath' }); done(); } });
      gsap.from('.pj-hero img', { scale: 1.3, duration: 1.8, ease: 'power3.out' });
      gsap.from('.pj-title > *', { y: 50, opacity: 0, duration: 1, stagger: 0.12, delay: 0.55, ease: 'power3.out' });
      gsap.from(pjClose, { scale: 0, duration: 0.6, delay: 0.8, ease: 'back.out(2)' });
    } else { done(); }
  }

  function closeProject() {
    if (pj.hidden || busy) return;
    busy = true;
    var finish = function () {
      pj.hidden = true; root.classList.remove('pj-open');
      if (hasGsap) gsap.set(pj, { clearProps: 'clipPath' });
      if (lenis) lenis.start();
      busy = false;
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    };
    var f = current >= 0 ? panelFrame(PROJECTS[current].id) : null;
    if (hasGsap && !reduce) {
      var r = f ? f.getBoundingClientRect() : null;
      var visible = r && r.right > 0 && r.left < window.innerWidth && r.bottom > 0 && r.top < window.innerHeight;
      gsap.to(pj, { clipPath: visible ? insetFrom(f) : 'inset(50% 50% 50% 50% round 20px)', duration: 0.9, ease: 'power4.inOut', onComplete: finish });
    } else { finish(); }
  }

  function switchProject(i) {
    if (!hasGsap || reduce) { renderProject(i); return; }
    gsap.to(pjScroll, { opacity: 0, duration: 0.35, onComplete: function () {
      renderProject(i);
      gsap.fromTo(pjScroll, { opacity: 0 }, { opacity: 1, duration: 0.6 });
    } });
  }

  track.addEventListener('click', function (e) {
    var a = e.target.closest('.rx-panel'); if (!a) return;
    e.preventDefault(); openProject(a.getAttribute('data-id'));
  });
  pjClose.addEventListener('click', closeProject);
  $('#pj-back').addEventListener('click', closeProject);
  var goNext = function () { if (current >= 0) switchProject((current + 1) % PROJECTS.length); };
  $('#pj-nextfloat').addEventListener('click', goNext);
  pjScroll.addEventListener('click', function (e) { if (e.target.closest('[data-next]')) goNext(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (!pj.hidden) closeProject(); else setMenu(false); }
    if (e.key === 'Tab' && !pj.hidden) {
      var f = $$('button', pj); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- Fil de progression courbe + bandeau réactif au scroll ---------- */
  (function () {
    var svg = $('#journey'), track = $('#j-track'), prog = $('#j-prog'), orb = $('#j-orb');
    var marq = $('.marquee-track'), len = 1, shown = 0, lastY = window.scrollY, rate = 1;
    function build() {
      var H = window.innerHeight, W = window.innerWidth <= 900 ? 44 : 80, top = 84, bot = 36, amp = W * 0.3, pts = [];
      svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      for (var i = 0; i <= 160; i++) {
        var t = i / 160;
        pts.push((i ? 'L' : 'M') + (W / 2 + amp * Math.sin(t * Math.PI * 2 * 4.5) * (0.35 + 0.65 * Math.sin(t * Math.PI))).toFixed(1) + ' ' + (top + (H - top - bot) * t).toFixed(1));
      }
      track.setAttribute('d', pts.join('')); prog.setAttribute('d', pts.join(''));
      len = prog.getTotalLength(); prog.style.strokeDasharray = len;
    }
    function loop() {
      var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      var y = window.scrollY, target = Math.min(1, Math.max(0, y / max));
      shown += (target - shown) * 0.1;
      prog.style.strokeDashoffset = len * (1 - shown);
      var p = prog.getPointAtLength(len * shown);
      orb.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')');
      if (marq && marq.getAnimations) {
        var a = marq.getAnimations()[0];
        rate += ((1 + Math.min(Math.abs(y - lastY) * 0.5, 9)) - rate) * 0.08;
        if (a) a.playbackRate = rate;
      }
      lastY = y;
      requestAnimationFrame(loop);
    }
    build(); window.addEventListener('resize', build); requestAnimationFrame(loop);
  })();

  /* ---------- Sans GSAP : le site reste lisible ---------- */
  if (!hasGsap) {
    $$('a[href^="#"]').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  if (!reduce) root.classList.add('anim');

  /* ---------- Smooth scroll ---------- */
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2 || id.indexOf('#projet-') === 0) return;
      var el = $(id); if (!el) return;
      e.preventDefault(); setMenu(false);
      if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.5 });
      else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* ---------- Texte : découpe en mots (titres) ---------- */
  function splitWords(el) {
    var txt = el.textContent.trim().replace(/\s+/g, ' ');
    el.setAttribute('aria-label', txt); el.textContent = '';
    var ins = [];
    txt.split(' ').forEach(function (w, i, a) {
      var m = document.createElement('span'); m.className = 'sp'; m.setAttribute('aria-hidden', 'true');
      var s = document.createElement('span'); s.className = 'sp-in'; s.style.setProperty('--i', i); s.textContent = w;
      m.appendChild(s); el.appendChild(m); ins.push(s);
      if (i < a.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return ins;
  }
  var mfWords = [];
  if (!reduce) {
    $$('[data-split]').forEach(function (h) {
      var ins = splitWords(h);
      if (h.closest('.mf-layer')) { mfWords = ins; return; }
      gsap.from(ins, { y: 60, opacity: 0, rotate: 3, duration: 1.2, stagger: 0.08, ease: 'power4.out',
        scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
    });
    $$('.rv').forEach(function (el) {
      gsap.from(el, { y: 32, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
  }

  /* ---------- Hero : intro puis scène « on avance dans l'image » ---------- */
  if (!reduce) {
    gsap.timeline({ defaults: { ease: 'power4.out' } })
      .from('.hero-title .line > span', { y: 70, opacity: 0, duration: 1.5, stagger: 0.15 })
      .from('.hero-sub', { opacity: 0, y: 20, duration: 1 }, '-=0.9')
      .from('.hero-actions .btn', { opacity: 0, y: 16, duration: 0.8, stagger: 0.1 }, '-=0.7')
      .from('.hd', { opacity: 0, y: -20, duration: 0.9 }, '-=1.2');

    var para = $('#mf-paragraph');
    var ptxt = para.textContent.trim().replace(/\s+/g, ' ');
    para.setAttribute('aria-label', ptxt); para.textContent = '';
    ptxt.split(' ').forEach(function (w, i, a) {
      var s = document.createElement('span'); s.setAttribute('aria-hidden', 'true'); s.textContent = w; para.appendChild(s);
      if (i < a.length - 1) para.appendChild(document.createTextNode(' '));
    });
    gsap.set('.mf-layer .kicker', { opacity: 0, y: 24 });
    gsap.set(mfWords, { y: 50, opacity: 0 });
    gsap.set(para.children, { opacity: 0.12 });

    gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: '#hero', start: 'top top', end: '+=300%', pin: '.hero-stage', scrub: 0.8, anticipatePin: 1 }
    })
      .to('.hero-media', { scale: 1.9, duration: 3 }, 0)
      .to('.hero-copy', { scale: 1.35, opacity: 0, y: -70, duration: 0.9, ease: 'power2.in' }, 0)
      .to('.scroll-hint', { opacity: 0, duration: 0.3 }, 0)
      .set('.hero-copy', { pointerEvents: 'none' }, 0.45)
      .to('.hero-veil', { opacity: 0.62, duration: 1.4 }, 0.1)
      .to('.mf-layer .kicker', { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 1.0)
      .to(mfWords, { y: 0, opacity: 1, duration: 0.9, stagger: 0.12, ease: 'power3.out' }, 1.1)
      .to(para.children, { opacity: 1, duration: 0.5, stagger: 0.08 }, 1.7);
  }

  /* ---------- Studio : profondeur sur les images ---------- */
  if (!reduce) {
    $$('.pl-frame').forEach(function (f) {
      gsap.fromTo(f, { scale: 0.8, y: 70 }, { scale: 1, y: 0, ease: 'none', scrollTrigger: { trigger: f, start: 'top 98%', end: 'top 40%', scrub: true } });
      gsap.fromTo($('img', f), { yPercent: -12, scale: 1.25 }, { yPercent: 12, scale: 1.25, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  /* ---------- Réalisations : défilement horizontal 3D épinglé (ordinateur) ---------- */
  var mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', function () {
    if (reduce) return;
    var rx = $('.rx');
    var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
    var move = gsap.to(track, {
      x: function () { return -dist(); }, ease: 'none',
      scrollTrigger: { trigger: rx, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: function (s) { gsap.set('.rx-progress span', { scaleX: s.progress }); } }
    });
    $$('.proj-frame').forEach(function (f) {
      gsap.to(f, { keyframes: [{ rotateY: 22, z: -220, duration: 1 }, { rotateY: 0, z: 0, duration: 1 }, { rotateY: -22, z: -220, duration: 1 }], ease: 'none',
        scrollTrigger: { trigger: f, containerAnimation: move, start: 'left right', end: 'right left', scrub: true } });
      gsap.fromTo($('img', f), { scale: 1.2 }, { scale: 1, ease: 'none',
        scrollTrigger: { trigger: f, containerAnimation: move, start: 'left 100%', end: 'left 30%', scrub: true } });
    });
    return function () { gsap.set(track, { clearProps: 'all' }); };
  });

  /* ---------- Approche : étapes, image sticky, rail ---------- */
  var steps = $$('.ap-step'), imgs = $$('.ap-stage img');
  steps.forEach(function (step, i) {
    ScrollTrigger.create({ trigger: step, start: 'top 55%', end: 'bottom 55%', onToggle: function (self) {
      if (!self.isActive) return;
      steps.forEach(function (s, j) { s.classList.toggle('is-active', j === i); });
      imgs.forEach(function (im, j) { im.classList.toggle('is-active', j === i); });
    } });
  });
  if (steps[0]) steps[0].classList.add('is-active');
  if (!reduce) {
    gsap.to('.ap-rail span', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.ap-steps', start: 'top 60%', end: 'bottom 60%', scrub: true } });
  }

  /* ---------- Thème du header sur sections sombres ---------- */
  $$('[data-theme="dark"]').forEach(function (sec) {
    ScrollTrigger.create({ trigger: sec, start: 'top 40px', end: 'bottom 40px', onToggle: function (self) { header.classList.toggle('on-dark', self.isActive); } });
  });

  /* ---------- Fluidité : rideaux arrondis, parallaxes ---------- */
  if (!reduce) {
    ['.rx-wrap', '.ap', '.ct'].forEach(function (sel) {
      gsap.fromTo(sel, { borderTopLeftRadius: '7vw', borderTopRightRadius: '7vw' }, { borderTopLeftRadius: '0vw', borderTopRightRadius: '0vw', ease: 'none',
        scrollTrigger: { trigger: sel, start: 'top 100%', end: 'top 25%', scrub: true } });
    });
    $$('.pl-text').forEach(function (t) {
      gsap.fromTo(t, { y: 50 }, { y: -50, ease: 'none', scrollTrigger: { trigger: t, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    gsap.fromTo('.ct-bg', { yPercent: -8, scale: 1.18 }, { yPercent: 8, scale: 1.18, ease: 'none', scrollTrigger: { trigger: '.ct', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo('.ap-stage', { scale: 1 }, { scale: 1.06, ease: 'none', scrollTrigger: { trigger: '.ap', start: 'top top', end: 'bottom bottom', scrub: true } });
    if (!coarse) {
      var hx = gsap.quickTo('.hero-media', 'x', { duration: 1.2, ease: 'power3' });
      var hy = gsap.quickTo('.hero-media', 'y', { duration: 1.2, ease: 'power3' });
      window.addEventListener('pointermove', function (e) {
        hx((e.clientX / window.innerWidth - 0.5) * -28); hy((e.clientY / window.innerHeight - 0.5) * -18);
      }, { passive: true });
    }
  }

  /* ---------- Boutons magnétiques ---------- */
  if (!coarse && !reduce) {
    $$('.magnetic').forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
      var yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.28); yTo((e.clientY - r.top - r.height / 2) * 0.4);
      });
      el.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });
  }

  var refresh = function () { ScrollTrigger.refresh(); };
  window.addEventListener('load', refresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
})();
