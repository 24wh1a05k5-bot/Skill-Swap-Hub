/* ═══════════════════════════════════════
   SKILLSWAP HUB — script.js
   Connects to backend at http://localhost:5000
   ═══════════════════════════════════════ */

const API = 'http://localhost:5000/api';

/* ─────────────────────────────────────
   AUTH STATE
───────────────────────────────────── */
let currentUser = null;
let authToken   = localStorage.getItem('skillswap_token') || null;

function getHeaders(json = true) {
  const h = {};
  if (json) h['Content-Type'] = 'application/json';
  if (authToken) h['Authorization'] = `Bearer ${authToken}`;
  return h;
}

async function initAuth() {
  if (!authToken) return;
  try {
    const res  = await fetch(`${API}/auth/me`, { headers: getHeaders() });
    const data = await res.json();
    if (data.success) setUser(data.user);
    else clearAuth();
  } catch { clearAuth(); }
}

function setUser(user) {
  currentUser = user;
  document.getElementById('navActions').classList.add('hidden');
  document.getElementById('navUser').classList.remove('hidden');
  document.getElementById('navUsername').textContent = `Hi, ${user.name.split(' ')[0]} 👋`;
  document.getElementById('fab').classList.remove('hidden');
}

function clearAuth() {
  currentUser = null;
  authToken   = null;
  localStorage.removeItem('skillswap_token');
  document.getElementById('navActions').classList.remove('hidden');
  document.getElementById('navUser').classList.add('hidden');
  document.getElementById('fab').classList.add('hidden');
}

function logout() {
  clearAuth();
  showToast('Logged out successfully', 'success');
}

/* ─────────────────────────────────────
   LOGIN
───────────────────────────────────── */
async function login() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn      = document.getElementById('loginBtn');
  const errEl    = document.getElementById('loginError');

  errEl.classList.add('hidden');
  if (!email || !password) return showFormError(errEl, 'Please fill in all fields.');

  btn.disabled = true; btn.textContent = 'Logging in…';

  try {
    const res  = await fetch(`${API}/auth/login`, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (data.success) {
      authToken = data.token;
      localStorage.setItem('skillswap_token', authToken);
      setUser(data.user);
      closeModal('loginModal');
      showToast(`Welcome back, ${data.user.name.split(' ')[0]}! 🎉`, 'success');
      loadSkills();
    } else {
      showFormError(errEl, data.message || 'Login failed. Check your credentials.');
    }
  } catch {
    showFormError(errEl, 'Cannot reach the server. Make sure your backend is running on port 5000.');
  } finally {
    btn.disabled = false; btn.textContent = 'Log In';
  }
}

/* ─────────────────────────────────────
   REGISTER
───────────────────────────────────── */
async function register() {
  const name       = document.getElementById('regName').value.trim();
  const email      = document.getElementById('regEmail').value.trim();
  const university = document.getElementById('regUniversity').value.trim();
  const password   = document.getElementById('regPassword').value;
  const btn        = document.getElementById('regBtn');
  const errEl      = document.getElementById('regError');

  errEl.classList.add('hidden');
  if (!name || !email || !password) return showFormError(errEl, 'Name, email and password are required.');
  if (password.length < 6)          return showFormError(errEl, 'Password must be at least 6 characters.');

  btn.disabled = true; btn.textContent = 'Creating account…';

  try {
    const res  = await fetch(`${API}/auth/register`, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify({ name, email, university, password })
    });
    const data = await res.json();

    if (data.success) {
      authToken = data.token;
      localStorage.setItem('skillswap_token', authToken);
      setUser(data.user);
      closeModal('registerModal');
      showToast(`Welcome to SkillSwap Hub, ${data.user.name.split(' ')[0]}! 🚀`, 'success');
      loadSkills();
    } else {
      const msg = data.errors ? data.errors.map(e => e.msg).join(', ') : data.message;
      showFormError(errEl, msg || 'Registration failed.');
    }
  } catch {
    showFormError(errEl, 'Cannot reach the server. Make sure your backend is running on port 5000.');
  } finally {
    btn.disabled = false; btn.textContent = 'Create Account';
  }
}

/* ─────────────────────────────────────
   ADD SKILL
───────────────────────────────────── */
async function addSkill() {
  if (!authToken) { openModal('loginModal'); return; }

  const title    = document.getElementById('skillTitle').value.trim();
  const category = document.getElementById('skillCategory').value;
  const type     = document.getElementById('skillType').value;
  const level    = document.getElementById('skillLevel').value;
  const description = document.getElementById('skillDesc').value.trim();
  const btn      = document.getElementById('skillBtn');
  const errEl    = document.getElementById('skillError');

  errEl.classList.add('hidden');
  if (!title)    return showFormError(errEl, 'Please enter a skill title.');
  if (!category) return showFormError(errEl, 'Please select a category.');

  btn.disabled = true; btn.textContent = 'Posting…';

  try {
    const res  = await fetch(`${API}/skills`, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify({ title, category, type, level, description })
    });
    const data = await res.json();

    if (data.success) {
      closeModal('addSkillModal');
      showToast('Skill posted! 🎯', 'success');
      // Reset form
      ['skillTitle','skillDesc'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('skillCategory').value = '';
      loadSkills();
    } else {
      showFormError(errEl, data.message || 'Failed to post skill.');
    }
  } catch {
    showFormError(errEl, 'Cannot reach the server.');
  } finally {
    btn.disabled = false; btn.textContent = 'Post Skill';
  }
}

/* ─────────────────────────────────────
   LOAD SKILLS (public)
───────────────────────────────────── */
let currentCategory = 'all';
let searchTimeout   = null;

async function loadSkills(category = currentCategory, search = '') {
  const grid = document.getElementById('skillsGrid');
  grid.innerHTML = '<div class="skills-loading">Loading skills…</div>';

  try {
    let url = `${API}/skills?limit=12`;
    if (category && category !== 'all') url += `&category=${encodeURIComponent(category)}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    const res  = await fetch(url, { headers: authToken ? getHeaders() : {} });
    const data = await res.json();

    if (!data.success || !data.skills.length) {
      grid.innerHTML = '<div class="skills-loading">No skills found. Be the first to list one!</div>';
      return;
    }
    renderSkills(data.skills);
  } catch {
    grid.innerHTML = '<div class="skills-loading">Backend offline — run <code>npm run dev</code> in slillswap-backend folder.</div>';
  }
}

function renderSkills(skills) {
  const grid = document.getElementById('skillsGrid');
  grid.innerHTML = skills.map(s => {
    const initials = s.user?.name ? s.user.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() : '?';
    const colors   = ['#7c3aed','#2563eb','#0891b2','#059669','#d97706','#dc2626'];
    const color    = colors[initials.charCodeAt(0) % colors.length];
    const desc     = s.description ? s.description.slice(0, 72) + (s.description.length > 72 ? '…' : '') : 'No description provided.';

    return `
      <div class="skill-card">
        <div class="skill-card-header">
          <span class="skill-type-badge ${s.type === 'offer' ? 'type-offer' : 'type-request'}">
            ${s.type === 'offer' ? '▲ Offering' : '▼ Seeking'}
          </span>
          <span class="skill-level">${s.level}</span>
        </div>
        <h4>${escHtml(s.title)}</h4>
        <p>${escHtml(desc)}</p>
        <div class="skill-card-footer">
          <div class="skill-avatar" style="background:${color}">${initials}</div>
          <div class="skill-user-info">
            <strong>${escHtml(s.user?.name || 'Anonymous')}</strong><br>
            ${escHtml(s.user?.university || '')}
          </div>
          <span class="skill-category-tag">${escHtml(s.category)}</span>
        </div>
      </div>`;
  }).join('');
}

function filterSkills(category, el) {
  currentCategory = category;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  loadSkills(category, document.getElementById('skillSearch').value.trim());
}

function searchSkills() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadSkills(currentCategory, document.getElementById('skillSearch').value.trim());
  }, 400);
}

/* ─────────────────────────────────────
   MODAL HELPERS
───────────────────────────────────── */
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}
function switchModal(closeId, openId) {
  closeModal(closeId);
  setTimeout(() => openModal(openId), 200);
}
function handleOverlayClick(e, id) {
  if (e.target === e.currentTarget) closeModal(id);
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
});

/* ─────────────────────────────────────
   TOAST
───────────────────────────────────── */
let toastTimer = null;
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 3500);
}
function showFormError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

/* ─────────────────────────────────────
   NAVBAR
───────────────────────────────────── */
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 30);
});

function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('mobile-open');
}

/* ─────────────────────────────────────
   PARTICLE CANVAS
───────────────────────────────────── */
function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  const ctx    = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const NUM = 60;
  for (let i = 0; i < NUM; i++) {
    particles.push({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.2
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(139,92,246,${p.alpha})`;
      ctx.fill();
    });
    // Draw connecting lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(139,92,246,${0.12 * (1 - dist/120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
}

/* ─────────────────────────────────────
   3D CARD TILT
───────────────────────────────────── */
function initTilt() {
  document.querySelectorAll('.feature-card, .testi-card, .step-card, .stat-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const rx = ((e.clientY - cy) / (rect.height / 2)) * -10;
      const ry = ((e.clientX - cx) / (rect.width  / 2)) *  10;
      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* ─────────────────────────────────────
   SCROLL REVEAL
───────────────────────────────────── */
function initReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
}

/* ─────────────────────────────────────
   ANIMATED COUNTERS
───────────────────────────────────── */
function initCounters() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el     = e.target;
      const target = +el.dataset.target;
      const dur    = 1800;
      const start  = performance.now();
      observer.unobserve(el);

      function step(now) {
        const p = Math.min((now - start) / dur, 1);
        const v = Math.round(easeOut(p) * target);
        el.textContent = v.toLocaleString() + (target >= 98 ? '%' : '+');
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stat-num[data-target]').forEach(el => observer.observe(el));
}

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

/* ─────────────────────────────────────
   HERO MOUSE PARALLAX
───────────────────────────────────── */
function initParallax() {
  document.addEventListener('mousemove', e => {
    const mx = (e.clientX / window.innerWidth  - 0.5) * 20;
    const my = (e.clientY / window.innerHeight - 0.5) * 20;
    const title = document.querySelector('.hero-title');
    if (title) title.style.transform = `translate(${mx * 0.3}px, ${my * 0.3}px)`;
    document.querySelectorAll('.f-card').forEach((c, i) => {
      const depth = 0.5 + (i % 3) * 0.3;
      c.style.transform = `translate(${mx * depth}px, ${my * depth}px)`;
    });
  });
}

/* ─────────────────────────────────────
   HELPER
───────────────────────────────────── */
function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ─────────────────────────────────────
   INIT
───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  initParticles();
  initReveal();
  initCounters();
  initParallax();
  initTilt();
  await initAuth();
  loadSkills();
});