// ============================================================
// MAIN.JS – Shared utilities ZuppaZuppa
// ============================================================

// ---- Navbar scroll effect ----
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });
}

// ---- Mobile nav toggle ----
const navToggle = document.getElementById('navToggle');
if (navToggle) {
  navToggle.addEventListener('click', () => {
    const links = document.querySelector('.nav-links');
    if (links) links.classList.toggle('open');
  });
}

// ---- Slider (Reviewer) ----
// (diinisialisasi via DOMContentLoaded di bawah)

// ---- Intersection Observer: fade-in on scroll ----
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// ---- Auth helpers ----
function requireAuth(requiredRole) {
  const token = localStorage.getItem('zz_token');
  if (!token) { window.location.href = 'login.html'; return; }

  // Baca role dari JWT payload langsung, bukan localStorage
  // supaya tidak bisa dimanipulasi dengan ubah localStorage
  let roleFromToken = null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Cek token tidak expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('zz_token');
      localStorage.removeItem('zz_role');
      localStorage.removeItem('zz_user');
      window.location.href = 'login.html'; return;
    }
    roleFromToken = payload.role;
    // Sinkronkan localStorage dengan role asli dari token
    localStorage.setItem('zz_role', roleFromToken);
  } catch (e) {
    // Token corrupt
    window.location.href = 'login.html'; return;
  }

  if (requiredRole && roleFromToken !== requiredRole) {
    alert('Akses ditolak. Role kamu: ' + roleFromToken);
    window.location.href = roleFromToken === 'admin' ? 'dashboard-admin.html' : 'dashboard-staff.html';
    return;
  }

  const userEl = document.getElementById('sidebarUser');
  if (userEl) userEl.textContent = localStorage.getItem('zz_user') || roleFromToken;
}

async function logout() {
  const token = localStorage.getItem('zz_token');
  if (token) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
      });
    } catch (_) { /* lanjutkan walau gagal */ }
  }
  localStorage.removeItem('zz_token');
  localStorage.removeItem('zz_role');
  localStorage.removeItem('zz_user');
  window.location.href = 'login.html';
}

// ---- API helpers ----
function getHeaders() {
  const token = localStorage.getItem('zz_token');
  return { 'Content-Type': 'application/json', ...(token ? { 'Authorization': 'Bearer ' + token } : {}) };
}

async function apiGet(url) {
  try {
    const res  = await fetch(url, { headers: getHeaders() });
    const data = await res.json();
    if (res.status === 401) { logout(); return {}; }
    return data;
  } catch (e) { console.error('API GET error:', url, e); return {}; }
}

async function apiReq(method, url, body) {
  try {
    const res  = await fetch(url, {
      method,
      headers: getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (res.status === 401) { logout(); return res; }
    if (!res.ok) { alert(data.message || 'Terjadi kesalahan.'); }
    return res;
  } catch (e) { console.error('API error:', method, url, e); alert('Tidak dapat terhubung ke server.'); }
}

// ---- Modal helper ----
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

// Close modal on overlay click – pakai named function supaya tidak double-register
function _overlayClickHandler(e) {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.style.display = 'none';
  }
}
// Hapus dulu kalau sudah ada, baru pasang lagi
document.removeEventListener('click', _overlayClickHandler);
document.addEventListener('click', _overlayClickHandler);

// ---- Format date ----
function fmtDate(ts) {
  if (!ts) return '-';
  const d = new Date(ts);
  return d.toLocaleString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}



// ---- Slider (Reviewer) – implementasi bersih ----
document.addEventListener('DOMContentLoaded', () => {
  const slider = document.getElementById('reviewSlider');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  if (!slider || !prevBtn || !nextBtn) return;

  let sliderIndex = 0;
  let autoTimer = null;

  function getCardWidth() {
    const card = slider.querySelector('.review-card');
    return card ? card.offsetWidth + 20 : 320; // 20 = gap
  }

  function getVisibleCount() {
    if (window.innerWidth <= 640) return 1;
    if (window.innerWidth <= 900) return 2;
    return 3;
  }

  function getMaxIndex() {
    const total = slider.querySelectorAll('.review-card').length;
    return Math.max(0, total - getVisibleCount());
  }

  function goTo(idx) {
    const maxIdx = getMaxIndex();
    sliderIndex = Math.max(0, Math.min(idx, maxIdx));
    slider.scrollTo({ left: sliderIndex * getCardWidth(), behavior: 'smooth' });
  }

  function startAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => {
      goTo(sliderIndex >= getMaxIndex() ? 0 : sliderIndex + 1);
    }, 4000);
  }

  prevBtn.addEventListener('click', () => {
    goTo(sliderIndex <= 0 ? getMaxIndex() : sliderIndex - 1);
    startAuto();
  });
  nextBtn.addEventListener('click', () => {
    goTo(sliderIndex >= getMaxIndex() ? 0 : sliderIndex + 1);
    startAuto();
  });

  window.addEventListener('resize', () => goTo(0));
  startAuto();
});

// ================= MOBILE MENU =================
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('nav ul') || document.querySelector('.nav-links');

if(menuToggle && navLinks){
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}
