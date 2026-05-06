// ===== CONFIG =====
const API_BASE = 'http://localhost/campus-portal/php';

// ===== TOAST =====
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ===== NAVBAR =====
function initNavbar() {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (hamburger) {
    hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
  }
  // Active link
  const links = document.querySelectorAll('.nav-links a');
  links.forEach(link => {
    if (link.href === window.location.href) link.classList.add('active');
  });
}

// ===== PARTICLES =====
function initParticles() {
  const container = document.querySelector('.hero-particles');
  if (!container) return;
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      width: ${Math.random() * 4 + 2}px;
      height: ${Math.random() * 4 + 2}px;
      animation-duration: ${Math.random() * 10 + 8}s;
      animation-delay: ${Math.random() * 5}s;
      background: ${['#6c63ff','#ff6584','#43e97b'][Math.floor(Math.random()*3)]};
    `;
    container.appendChild(p);
  }
}

// ===== EVENTS PAGE =====
let allEvents = [];
let currentFilter = 'All';

async function loadEvents(category = 'All', search = '') {
  const grid = document.getElementById('eventsGrid');
  if (!grid) return;

  grid.innerHTML = `<div class="loading" style="grid-column:1/-1"><div class="spinner"></div><p>Loading events...</p></div>`;

  try {
    const params = new URLSearchParams({ category, search });
    const res = await fetch(`${API_BASE}/get_events.php?${params}`);
    const data = await res.json();

    if (!data.success) throw new Error(data.error);
    allEvents = data.events;
    renderEvents(allEvents);
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">⚠️</div>
      <h3>Could not load events</h3>
      <p>Make sure XAMPP is running and database is set up.</p>
    </div>`;
    console.error(err);
  }
}

function renderEvents(events) {
  const grid = document.getElementById('eventsGrid');
  if (!grid) return;

  if (!events.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">📭</div>
      <h3>No events found</h3>
      <p>Try a different filter or search term.</p>
    </div>`;
    return;
  }

  grid.innerHTML = events.map((e, i) => `
    <div class="event-card fade-in" style="animation-delay:${i * 0.08}s" onclick="openRegisterModal(${e.id})">
      <div class="event-card-img-wrap">
        <img class="event-card-img" src="${e.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600'}" 
             alt="${e.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600'">
        <span class="event-category-badge badge-${e.category?.toLowerCase()}">${e.category}</span>
      </div>
      <div class="event-card-body">
        <h3>${e.title}</h3>
        <p>${e.description}</p>
        <div class="event-meta">
          <span><i>📅</i> ${formatDate(e.date)}</span>
          <span><i>🕐</i> ${formatTime(e.time)}</span>
          <span><i>📍</i> ${e.venue}</span>
          <span><i>👥</i> ${e.registered_count}/${e.capacity} registered</span>
        </div>
        <div class="event-card-footer">
          <span class="spots-badge ${getSpotsClass(e.spots_left)}">${getSpotsText(e.spots_left)}</span>
          <button class="btn-register" ${e.spots_left <= 0 ? 'disabled' : ''} 
            onclick="event.stopPropagation(); openRegisterModal(${e.id})">
            ${e.spots_left <= 0 ? 'Full' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function getSpotsClass(spots) {
  if (spots <= 0) return 'spots-full';
  if (spots <= 20) return 'spots-limited';
  return 'spots-available';
}

function getSpotsText(spots) {
  if (spots <= 0) return 'Fully Booked';
  if (spots <= 20) return `Only ${spots} left!`;
  return `${spots} spots left`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTime(timeStr) {
  const [h, m] = timeStr.split(':');
  const d = new Date(); d.setHours(h, m);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// ===== FILTER =====
function initFilters() {
  const btns = document.querySelectorAll('.filter-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      const search = document.getElementById('searchInput')?.value || '';
      loadEvents(currentFilter, search);
    });
  });

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    let debounce;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => loadEvents(currentFilter, searchInput.value), 400);
    });
  }
}

// ===== REGISTER MODAL =====
let selectedEventId = null;

function openRegisterModal(eventId) {
  // Must be signed in to register
  if (!currentUser) {
    pendingEventId = eventId;
    showToast('Please sign up or sign in first to register for events', 'error');
    window.location.href = 'auth.html';
    return;
  }

  selectedEventId = eventId;
  const event = allEvents.find(e => e.id == eventId);
  if (!event) return;

  // Pre-fill with user's data
  const nameEl  = document.getElementById('regName');
  const emailEl = document.getElementById('regEmail');
  const sidEl   = document.getElementById('regStudentId');
  const deptEl  = document.getElementById('regDept');
  if (nameEl)  nameEl.value  = currentUser.name  || '';
  if (emailEl) emailEl.value = currentUser.email || '';
  if (sidEl)   sidEl.value   = currentUser.student_id || '';
  if (deptEl && currentUser.department) {
    [...deptEl.options].forEach(o => { if (o.value === currentUser.department) o.selected = true; });
  }

  document.getElementById('modalEventTitle').textContent = event.title;
  document.getElementById('modalEventDate').textContent  = `${formatDate(event.date)} at ${formatTime(event.time)}`;
  document.getElementById('modalEventVenue').textContent = event.venue;

  // Show step 3 active in any open auth modal (in case it's still open)
  updateStepIndicator(3);

  document.getElementById('registerModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('registerModal')?.classList.remove('active');
  document.body.style.overflow = '';
  document.getElementById('registerForm')?.reset();
}

async function submitRegistration(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.btn-submit');
  btn.textContent = 'Registering...'; btn.disabled = true;

  const payload = {
    event_id: selectedEventId,
    student_name: document.getElementById('regName').value,
    student_email: document.getElementById('regEmail').value,
    student_id: document.getElementById('regStudentId').value,
    phone: document.getElementById('regPhone').value,
    department: document.getElementById('regDept').value
  };

  try {
    const res = await fetch(`${API_BASE}/register_event.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      showToast(data.message, 'success');
      closeModal();
      loadEvents(currentFilter);
    } else {
      showToast(data.error, 'error');
    }
  } catch (err) {
    showToast('Connection error. Is XAMPP running?', 'error');
  } finally {
    btn.textContent = 'Register Now'; btn.disabled = false;
  }
}

// ===== ADMIN =====
async function loadAdminData() {
  try {
    const [eventsRes, regsRes] = await Promise.all([
      fetch(`${API_BASE}/get_events.php`),
      fetch(`${API_BASE}/get_registrations.php`)
    ]);
    const eventsData = await eventsRes.json();
    const regsData = await regsRes.json();

    if (eventsData.success) {
      document.getElementById('statEvents').textContent = eventsData.events.length;
      renderAdminEvents(eventsData.events);
    }
    if (regsData.success) {
      document.getElementById('statRegistrations').textContent = regsData.stats.total_registrations;
      renderAdminRegistrations(regsData.registrations);
    }
  } catch (err) {
    showToast('Failed to load admin data', 'error');
  }
}

function renderAdminEvents(events) {
  const tbody = document.getElementById('adminEventsBody');
  if (!tbody) return;
  tbody.innerHTML = events.map(e => `
    <tr>
      <td>${e.id}</td>
      <td><strong>${e.title}</strong></td>
      <td><span class="event-category-badge badge-${e.category?.toLowerCase()}" style="position:static">${e.category}</span></td>
      <td>${formatDate(e.date)}</td>
      <td>${e.venue}</td>
      <td>${e.registered_count}/${e.capacity}</td>
    </tr>
  `).join('');
}

function renderAdminRegistrations(regs) {
  const tbody = document.getElementById('adminRegsBody');
  if (!tbody) return;
  tbody.innerHTML = regs.map(r => `
    <tr>
      <td>${r.id}</td>
      <td>${r.student_name}</td>
      <td>${r.student_email}</td>
      <td>${r.department || '-'}</td>
      <td>${r.event_title}</td>
      <td>${new Date(r.registered_at).toLocaleDateString()}</td>
    </tr>
  `).join('');
}

async function submitAddEvent(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.btn-submit');
  btn.textContent = 'Adding...'; btn.disabled = true;

  const payload = {
    title: document.getElementById('evTitle').value,
    description: document.getElementById('evDesc').value,
    category: document.getElementById('evCategory').value,
    date: document.getElementById('evDate').value,
    time: document.getElementById('evTime').value,
    venue: document.getElementById('evVenue').value,
    capacity: document.getElementById('evCapacity').value,
    image_url: document.getElementById('evImage').value
  };

  try {
    const res = await fetch(`${API_BASE}/add_event.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      showToast('Event added successfully!', 'success');
      e.target.reset();
      loadAdminData();
      showAdminTab('events');
    } else {
      showToast(data.error, 'error');
    }
  } catch (err) {
    showToast('Connection error. Is XAMPP running?', 'error');
  } finally {
    btn.textContent = 'Add Event'; btn.disabled = false;
  }
}

function showAdminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(t => t.style.display = 'none');
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  document.getElementById(`tab-${tab}`).style.display = 'block';
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initParticles();

  // Events page
  if (document.getElementById('eventsGrid')) {
    loadEvents();
    initFilters();
  }

  // Register modal
  const registerForm = document.getElementById('registerForm');
  if (registerForm) registerForm.addEventListener('submit', submitRegistration);

  const modalOverlay = document.getElementById('registerModal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
  }

  // Admin page
  if (document.getElementById('adminEventsBody')) {
    loadAdminData();
    document.querySelectorAll('.sidebar-link').forEach(link => {
      link.addEventListener('click', () => showAdminTab(link.dataset.tab));
    });
    const addEventForm = document.getElementById('addEventForm');
    if (addEventForm) addEventForm.addEventListener('submit', submitAddEvent);
  }
});

// ===== AUTH =====
let currentUser = JSON.parse(localStorage.getItem('campusUser') || 'null');
let pendingEventId = null; // event to register after login

function initAuth() {
  renderAuthNav();

  // Sign Up form
  const signupForm = document.getElementById('form-signup');
  if (signupForm) signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = signupForm.querySelector('.btn-submit');
    btn.textContent = 'Creating account...'; btn.disabled = true;

    const pw  = document.getElementById('suPassword').value;
    const pw2 = document.getElementById('suPassword2').value;
    if (pw !== pw2) {
      showToast('Passwords do not match', 'error');
      btn.textContent = 'Create Account & Continue →'; btn.disabled = false;
      return;
    }
    if (pw.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      btn.textContent = 'Create Account & Continue →'; btn.disabled = false;
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth.php?action=signup`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:       document.getElementById('suName').value,
          email:      document.getElementById('suEmail').value,
          password:   pw,
          student_id: document.getElementById('suStudentId').value,
          department: document.getElementById('suDept').value
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Account created! Now sign in to continue.', 'success');
        signupForm.reset();
        // Auto switch to sign in with email pre-filled
        openAuthModal('signin');
        setTimeout(() => {
          const siEmail = document.getElementById('siEmail');
          if (siEmail) siEmail.value = document.getElementById('suEmail')?.value || data.user?.email || '';
        }, 100);
      } else {
        showToast(data.error, 'error');
      }
    } catch { showToast('Connection error. Is XAMPP running?', 'error'); }
    finally { btn.textContent = 'Create Account & Continue →'; btn.disabled = false; }
  });

  // Sign In form
  const signinForm = document.getElementById('form-signin');
  if (signinForm) signinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = signinForm.querySelector('.btn-submit');
    btn.textContent = 'Signing in...'; btn.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/auth.php?action=signin`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:    document.getElementById('siEmail').value,
          password: document.getElementById('siPassword').value
        })
      });
      const data = await res.json();
      if (data.success) {
        currentUser = data.user;
        localStorage.setItem('campusUser', JSON.stringify(currentUser));
        showToast(`Welcome, ${currentUser.name}! You can now register for events.`, 'success');
        closeAuthModal();
        renderAuthNav();
        // If user clicked Register before signing in, open that modal now
        if (pendingEventId) {
          setTimeout(() => { openRegisterModal(pendingEventId); pendingEventId = null; }, 400);
        }
      } else {
        showToast(data.error, 'error');
      }
    } catch { showToast('Connection error. Is XAMPP running?', 'error'); }
    finally { btn.textContent = 'Sign In & Continue →'; btn.disabled = false; }
  });

  // Password toggles
  document.querySelectorAll('.toggle-pw').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      input.type = input.type === 'password' ? 'text' : 'password';
      btn.textContent = input.type === 'password' ? '👁️' : '🙈';
    });
  });

  // Close on overlay click
  document.getElementById('authModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'authModal') closeAuthModal();
  });
}

function updateStepIndicator(activeStep) {
  const steps = ['step1Ind', 'step2Ind', 'step3Ind'];
  steps.forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (i + 1 === activeStep) {
      el.style.background = 'rgba(108,99,255,0.15)';
      el.style.color = 'var(--primary)';
      el.style.border = '1px solid rgba(108,99,255,0.3)';
    } else if (i + 1 < activeStep) {
      el.style.background = 'rgba(67,233,123,0.1)';
      el.style.color = '#43e97b';
      el.style.border = '1px solid rgba(67,233,123,0.25)';
    } else {
      el.style.background = 'rgba(255,255,255,0.04)';
      el.style.color = 'var(--text-muted)';
      el.style.border = '1px solid rgba(255,255,255,0.08)';
    }
  });
}

function openAuthModal(tab = 'signup') {
  document.getElementById('authModal')?.classList.add('active');
  document.body.style.overflow = 'hidden';
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  document.getElementById(`form-${tab}`)?.classList.add('active');

  const titleEl = document.getElementById('authModalTitle');
  const subEl   = document.getElementById('authModalSub');

  if (tab === 'signup') {
    if (titleEl) titleEl.textContent = 'Create Your Account';
    if (subEl)   subEl.textContent   = 'Step 1 — Sign up to get started';
    updateStepIndicator(1);
  } else {
    if (titleEl) titleEl.textContent = 'Sign In to Continue';
    if (subEl)   subEl.textContent   = 'Step 2 — Sign in, then register for events';
    updateStepIndicator(2);
  }
}

function closeAuthModal() {
  document.getElementById('authModal')?.classList.remove('active');
  document.body.style.overflow = '';
}

function renderAuthNav() {
  const wrap = document.getElementById('authNavWrap');
  if (!wrap) return;
  if (currentUser) {
    const initials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    wrap.innerHTML = `
      <div class="nav-auth-wrap">
        <div class="user-menu" onclick="toggleDropdown()">
          <div class="user-avatar">${initials}</div>
          <span class="user-name">${currentUser.name.split(' ')[0]}</span>
          <span>▾</span>
        </div>
        <div class="dropdown-menu" id="userDropdown">
          <div class="dropdown-item">👤 ${currentUser.name}</div>
          <div class="dropdown-item">🎓 ${currentUser.department || 'Student'}</div>
          <hr style="border-color:rgba(255,255,255,0.06);margin:6px 0;">
          <a href="my-registrations.html" class="dropdown-item" style="color:var(--primary);text-decoration:none;">📝 My Registrations</a>
          <hr style="border-color:rgba(255,255,255,0.06);margin:6px 0;">
          <div class="dropdown-item danger" onclick="signOut()">🚪 Sign Out</div>
        </div>
      </div>`;
  } else {
    const adminRaw = localStorage.getItem('campusAdmin');
    if (adminRaw) {
      let a = {};
      try { a = JSON.parse(adminRaw); } catch {}
      wrap.innerHTML = `
        <div class="nav-auth-wrap">
          <div class="user-menu" onclick="toggleDropdown()">
            <div class="user-avatar" style="background:linear-gradient(135deg,#ff6584,#6c63ff);">🛡️</div>
            <span class="user-name">${a.name || 'Admin'}</span>
            <span>▾</span>
          </div>
          <div class="dropdown-menu" id="userDropdown">
            <div class="dropdown-item">🛡️ ${a.name || 'Admin'}</div>
            <hr style="border-color:rgba(255,255,255,0.06);margin:6px 0;">
            <a href="admin.html" class="dropdown-item" style="color:var(--primary);text-decoration:none;">📊 Admin Dashboard</a>
            <hr style="border-color:rgba(255,255,255,0.06);margin:6px 0;">
            <div class="dropdown-item danger" onclick="adminSignOut()">🚪 Sign Out</div>
          </div>
        </div>`;
    } else {
      wrap.innerHTML = `
        <button class="btn-outline" style="padding:8px 18px;font-size:0.9rem;" onclick="window.location.href='auth.html?tab=signin'">Sign In</button>
        <button class="btn-primary"  style="padding:8px 18px;font-size:0.9rem;" onclick="window.location.href='auth.html'">Sign Up</button>`;
    }
  }
}

function adminSignOut() {
  localStorage.removeItem('campusAdmin');
  window.location.href = 'auth.html?tab=signin';
}

function toggleDropdown() {
  document.getElementById('userDropdown')?.classList.toggle('open');
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.nav-auth-wrap')) {
    document.getElementById('userDropdown')?.classList.remove('open');
  }
});

function signOut() {
  currentUser = null;
  localStorage.removeItem('campusUser');
  renderAuthNav();
  showToast('Signed out successfully', 'info');
  document.getElementById('userDropdown')?.classList.remove('open');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initParticles();
  initAuth();

  if (document.getElementById('eventsGrid')) {
    loadEvents();
    initFilters();
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) registerForm.addEventListener('submit', submitRegistration);

  document.getElementById('registerModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'registerModal') closeModal();
  });
});
