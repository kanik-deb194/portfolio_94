/* ══════════════════════════════════════
   helpers
═════════════════════════════════════ */
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
// Switched off on purpose so every animation plays on every device.
// To respect the system "reduce motion" setting again, use:
// window.matchMedia('(prefers-reduced-motion: reduce)').matches
const reduceMotion = false;
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ══════════════════════════════════════
   theme toggle (light / dark)
═════════════════════════════════════ */
const root = document.documentElement;
const themeBtn = $('#themeToggle');

function applyTheme(mode) {
  if (mode === 'dark') root.setAttribute('data-theme', 'dark');
  else root.removeAttribute('data-theme');
  themeBtn.setAttribute('aria-label', mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
}
applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

themeBtn.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem('theme', next); } catch (e) {}
});
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch (err) {}
  if (!saved) applyTheme(e.matches ? 'dark' : 'light');
});

/* ══════════════════════════════════════
   split hero title into words + letters
═════════════════════════════════════ */
(function splitText() {
  let idx = 0;
  $$('[data-split]').forEach(el => {
    const words = el.textContent.trim().split(' ');
    el.textContent = '';
    words.forEach((w, wi) => {
      const word = document.createElement('span');
      word.className = 'word';
      [...w].forEach(c => {
        const s = document.createElement('span');
        s.className = 'ch';
        s.style.setProperty('--i', idx++);
        s.textContent = c;
        word.appendChild(s);
      });
      // the CSS accent colour targets :last-child — keep it on the final word's last character only
      if (wi < words.length - 1) word.lastElementChild.style.color = 'inherit';
      el.appendChild(word);
      if (wi < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
    idx += 2; // small pause before the next line starts
  });
})();

/* ══════════════════════════════════════
   marquee: clone items so the loop is seamless
═════════════════════════════════════ */
function buildMarquees() {
  $$('.marquee-track').forEach(track => {
    const items = [...track.children];
    const setWidth = track.scrollWidth || 1;
    const copies = Math.max(1, Math.ceil(window.innerWidth / setWidth)); // each half must cover the screen
    for (let n = 0; n < copies * 2 - 1; n++) {
      items.forEach(it => {
        const c = it.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        track.appendChild(c);
      });
    }
  });
}

/* ══════════════════════════════════════
   typing effect
═════════════════════════════════════ */
function startTyped() {
  const el = $('#typed');
  if (!el) return;
  const words = el.dataset.words.split('|');
  let w = 0, c = 0, del = false;
  (function tick() {
    const word = words[w];
    el.textContent = word.slice(0, c);
    let delay = del ? 40 : 85;
    if (!del && c === word.length) { del = true; delay = 1700; }
    else if (del && c === 0) { del = false; w = (w + 1) % words.length; delay = 400; }
    else { c += del ? -1 : 1; }
    setTimeout(tick, delay);
  })();
}

/* ══════════════════════════════════════
   count-up numbers
═════════════════════════════════════ */
function runCounter(el) {
  if (el.dataset.done) return;
  el.dataset.done = '1';
  const target = parseFloat(el.dataset.count);
  const dec = parseInt(el.dataset.decimals || '0', 10);
  const suf = el.dataset.suffix || '';
  if (reduceMotion) { el.textContent = target.toFixed(dec) + suf; return; }
  const dur = 1700, t0 = performance.now();
  (function step(now) {
    const p = Math.min((now - t0) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);                 // ease-out
    el.textContent = (target * e).toFixed(dec) + suf;
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}

/* skill dials: hand each ring its percentage (the CSS animates it once the card is revealed) */
$$('.dial').forEach(d => d.style.setProperty('--p', d.dataset.percent));

/* ══════════════════════════════════════
   scroll reveal
═════════════════════════════════════ */
function initReveal() {
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    $$('[data-count]', e.target).forEach(runCounter);
    io.unobserve(e.target);
  }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(r => io.observe(r));
}

/* ══════════════════════════════════════
   scroll progress + dock active state
═════════════════════════════════════ */
const progress = $('#progress');
const dock = $('#dock');
const indicator = $('#dockIndicator');
const dockLinks = $$('.dock-link');
const dockSections = dockLinks.map(l => $(l.getAttribute('href')));
let activeIdx = -1;

function placeIndicator() {
  const link = dockLinks[activeIdx];
  if (!link) return;
  indicator.style.setProperty('--x', link.offsetLeft + 'px');
  indicator.style.setProperty('--y', link.offsetTop + 'px');
  indicator.style.opacity = '1';
}

/* measure layout once (and on resize) so scrolling never forces a layout */
let sectionTops = [], maxScroll = 0;
function measure() {
  sectionTops = dockSections.map(s => (s ? s.getBoundingClientRect().top + window.scrollY : 0));
  maxScroll = document.documentElement.scrollHeight - window.innerHeight;
}

function onScroll() {
  const y = window.scrollY;
  progress.style.transform = 'scaleX(' + (maxScroll > 0 ? Math.min(y / maxScroll, 1).toFixed(4) : 0) + ')';

  const probe = y + window.innerHeight * 0.4;
  let idx = 0;
  sectionTops.forEach((top, i) => { if (top <= probe) idx = i; });
  if (maxScroll > 0 && y >= maxScroll - 4) idx = dockSections.length - 1;

  if (idx !== activeIdx) {
    activeIdx = idx;
    dockLinks.forEach((l, i) => l.classList.toggle('active', i === idx));
    placeIndicator();
  }
}
let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { onScroll(); ticking = false; });
}, { passive: true });
let resizeTimer;
function remeasure() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { measure(); placeIndicator(); onScroll(); }, 150);
}
window.addEventListener('resize', remeasure);
if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(document.body);

/* ══════════════════════════════════════
   3D tilt on cards
═════════════════════════════════════ */
if (canHover && !reduceMotion) {
  $$('[data-tilt]').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      const max = r.width > 500 ? 3 : 7;               // big cards tilt less
      el.style.setProperty('--ry', (px * max * 2).toFixed(2) + 'deg');
      el.style.setProperty('--rx', (-py * max * 2).toFixed(2) + 'deg');
    });
    el.addEventListener('mouseleave', () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });

  /* magnetic buttons */
  $$('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - (r.left + r.width / 2)) * 0.28).toFixed(1) + 'px');
      el.style.setProperty('--my', ((e.clientY - (r.top + r.height / 2)) * 0.28).toFixed(1) + 'px');
    });
    el.addEventListener('mouseleave', () => {
      el.style.setProperty('--mx', '0px');
      el.style.setProperty('--my', '0px');
    });
  });

  /* hero parallax: floating layers drift against the mouse */
  const stage = $('[data-parallax]');
  if (stage) {
    let pxTick = false, mx = 0, my = 0;
    window.addEventListener('mousemove', e => {
      if (window.scrollY > window.innerHeight * 1.2) return;
      mx = e.clientX; my = e.clientY;
      if (pxTick) return;
      pxTick = true;
      requestAnimationFrame(() => {
        stage.style.setProperty('--px', ((mx / window.innerWidth - 0.5) * 24).toFixed(1) + 'px');
        stage.style.setProperty('--py', ((my / window.innerHeight - 0.5) * 24).toFixed(1) + 'px');
        pxTick = false;
      });
    }, { passive: true });
  }
}

/* ══════════════════════════════════════
   cursor follower
═════════════════════════════════════ */
if (canHover && !reduceMotion) {
  const cursor = $('#cursor');
  let tx = -100, ty = -100, cx = -100, cy = -100;
  let raf = null;
  window.addEventListener('mousemove', e => {
    tx = e.clientX; ty = e.clientY;
    cursor.classList.add('active');
    if (!raf) raf = requestAnimationFrame(loop);   // only animate while the mouse is moving
  }, { passive: true });
  document.addEventListener('mouseleave', () => cursor.classList.remove('active'));
  document.addEventListener('mouseover', e => {
    cursor.classList.toggle('hover', !!e.target.closest('a, button, input, textarea, .magnetic, .stag, .sb'));
  });
  function loop() {
    cx += (tx - cx) * 0.28;
    cy += (ty - cy) * 0.28;
    cursor.style.setProperty('--cx', cx.toFixed(1) + 'px');
    cursor.style.setProperty('--cy', cy.toFixed(1) + 'px');
    if (Math.abs(tx - cx) > 0.3 || Math.abs(ty - cy) > 0.3) raf = requestAnimationFrame(loop);
    else raf = null;
  }
}

/* ══════════════════════════════════════
   page start: wait for load, then play the intro
═════════════════════════════════════ */
/* pause the looping animations while they are scrolled out of view */
function pauseOffscreen() {
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    e.target.classList.toggle('is-off', !e.isIntersecting);
  }), { rootMargin: '120px 0px' });
  $$('.marquee, .hero-visual').forEach(el => io.observe(el));
}

let started = false;
function start() {
  if (started) return;
  started = true;
  buildMarquees();
  document.body.classList.add('ready');
  document.body.classList.remove('is-loading');
  initReveal();
  pauseOffscreen();
  measure();
  onScroll();
  setTimeout(startTyped, reduceMotion ? 0 : 1100);
}

const minWait = new Promise(r => setTimeout(r, reduceMotion ? 0 : 1100));
const pageLoaded = new Promise(r => {
  if (document.readyState === 'complete') r();
  else window.addEventListener('load', r);
});
const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
Promise.all([minWait, pageLoaded, fontsReady]).then(start);
setTimeout(start, 4000); // safety net: never leave visitors stuck on the loader

/* ══════════════════════════════════════
   contact form
═════════════════════════════════════ */
function handleSend(e) {
  e.preventDefault();
  const form = e.target;
  const btn = document.getElementById('ssbtn');
  btn.innerHTML = '<span>Sending…</span>'; btn.disabled = true;
  setTimeout(() => {
    btn.innerHTML = '<span>✓ Sent! I\'ll reply soon.</span>';
    btn.style.background = '#455230';
    setTimeout(() => {
      btn.innerHTML = '<span>Send Message →</span>';
      btn.style.background = '';
      btn.disabled = false;
      form.reset();
    }, 3000);
  }, 1400);
}