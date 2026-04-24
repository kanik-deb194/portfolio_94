/* cursor glow */
const cg = document.getElementById('cg');
document.addEventListener('mousemove', e => { cg.style.left = e.clientX+'px'; cg.style.top = e.clientY+'px'; });

/* navbar scroll */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 40));

/* hamburger */
const hbg = document.getElementById('hbg');
const mm  = document.getElementById('mm');
hbg.addEventListener('click', () => { hbg.classList.toggle('open'); mm.classList.toggle('open'); });
document.querySelectorAll('.ml').forEach(l => l.addEventListener('click', () => { hbg.classList.remove('open'); mm.classList.remove('open'); }));

/* scroll reveal */
const rio = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); rio.unobserve(e.target); } }), { threshold:.12 });
document.querySelectorAll('.reveal').forEach(r => rio.observe(r));

/* skill bars */
const bio = new IntersectionObserver(es => es.forEach(e => {
  if(e.isIntersecting){ e.target.querySelectorAll('.sk-br-fill').forEach(b => b.style.width = b.dataset.w+'%'); bio.unobserve(e.target); }
}), { threshold:.3 });
document.querySelectorAll('.skcard').forEach(c => bio.observe(c));

/* contact form */
function handleSend(e) {
  e.preventDefault();
  const btn = document.getElementById('ssbtn');
  btn.innerHTML = '<span>Sending…</span>'; btn.disabled = true;
  setTimeout(() => {
    btn.innerHTML = '<span>✓ Sent! I\'ll reply soon.</span>';
    btn.style.background = 'linear-gradient(135deg,#059669,#10b981)';
    setTimeout(() => {
      btn.innerHTML = '<span>Send Message →</span>';
      btn.style.background = '';
      btn.disabled = false;
      e.target.reset();
    }, 3000);
  }, 1400);
}