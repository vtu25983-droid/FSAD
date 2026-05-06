// ===== ADMIN PANEL =====
const API_BASE = 'http://localhost/campus-portal/php';
const REFRESH_INTERVAL = 10000;
let autoRefreshTimer = null;
let allEventsData = [];
let allRegsData = [];
let confirmCallback = null;

// ===== SHARED UTILS (fallback if main.js not loaded) =====
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { weekday:'short', year:'numeric', month:'short', day:'numeric' });
}
function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const dt = new Date(); dt.setHours(h, m);
  return dt.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
}
function fmtDateTime(dt) {
  return new Date(dt).toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

// ===== TOAST (standalone, doesn't depend on main.js) =====
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const icons = { success:'✅', error:'❌', info:'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ===== ADMIN AUTH GUARD =====
function adminLogout() {
  localStorage.removeItem('campusAdmin');
  window.location.href = 'auth.html?tab=signin';
}

function initAdminNav() {
  const adminRaw = localStorage.getItem('campusAdmin');
  if (!adminRaw) {
    window.location.href = 'auth.html?tab=signin';
    return false;
  }
  let a = {};
  try { a = JSON.parse(adminRaw); } catch { adminLogout(); return false; }

  const wrap = document.getElementById('authNavWrap');
  if (wrap) {
    wrap.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#ff6584,#6c63ff);
             display:flex;align-items:center;justify-content:center;font-size:1rem;color:white;flex-shrink:0;">🛡️</div>
        <span style="font-size:0.88rem;font-weight:600;color:#e0e0e0;">${a.name || 'Admin'}</span>
        <button onclick="adminLogout()"
          style="background:rgba(255,101,132,0.12);border:1px solid rgba(255,101,132,0.3);
                 color:#ff6584;padding:6px 14px;border-radius:8px;cursor:pointer;
                 font-size:0.82rem;font-weight:700;"
          onmouseover="this.style.background='rgba(255,101,132,0.28)'"
          onmouseout="this.style.background='rgba(255,101,132,0.12)'">
          🚪 Sign Out
        </button>
      </div>`;
  }
  return true;
}

// ===== SIDEBAR TABS =====
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.sidebar-link[data-tab]').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      link.classList.add('active');
      const tab = document.getElementById('tab-' + link.dataset.tab);
      if (tab) tab.classList.add('active');
    });
  });
});

// ===== MAIN REFRESH =====
async function refreshAll() {
  const btn = document.getElementById('refreshBtn');
  if (btn) btn.innerHTML = '<span class="refresh-spin">🔄</span> Refreshing...';
  try {
    await Promise.all([loadStats(), loadEvents(), loadRegistrations(), loadUsers()]);
    const el = document.getElementById('lastUpdatedText');
    if (el) el.textContent = 'Updated ' + new Date().toLocaleTimeString();
  } catch(e) {
    showToast('Refresh failed — check XAMPP', 'error');
  }
  if (btn) btn.innerHTML = '🔄 Refresh Now';
}

// ===== STATS =====
async function loadStats() {
  try {
    const res  = await fetch(`${API_BASE}/get_stats.php`);
    const data = await res.json();
    if (!data.success) { showToast('Stats error: ' + (data.error || 'unknown'), 'error'); return; }
    const s = data.stats;

    const se = document.getElementById('statEvents');
    const sr = document.getElementById('statRegistrations');
    const su = document.getElementById('statUsers');
    if (se) se.textContent = s.total_events;
    if (sr) sr.textContent = s.total_registrations;
    if (su) su.textContent = s.total_users;

    // Category chart
    const cats   = s.by_category || {};
    const maxVal = Math.max(...Object.values(cats), 1);
    const colors = { Technology:'#6c63ff', Cultural:'#ff6584', Competition:'orange', Career:'#43e97b', Academic:'#38f9d7', Sports:'#ff5722' };
    const chartEl = document.getElementById('categoryChart');
    if (chartEl) {
      chartEl.innerHTML = Object.keys(cats).length
        ? Object.entries(cats).map(([cat, cnt]) => `
            <div class="cat-row">
              <span class="cat-label">${cat}</span>
              <div style="flex:1;">
                <div class="progress-bar-wrap">
                  <div class="progress-bar" style="width:${(cnt/maxVal)*100}%;background:${colors[cat]||'var(--primary)'};"></div>
                </div>
              </div>
              <span class="cat-count">${cnt}</span>
            </div>`).join('')
        : '<p style="color:var(--text-muted);font-size:0.88rem;">No events yet</p>';
    }

    // Recent activity
    const recent   = s.recent_activity || [];
    const actEl    = document.getElementById('recentActivity');
    if (actEl) {
      actEl.innerHTML = recent.length
        ? recent.map(r => {
            const initials = r.student_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
            return `<div class="activity-item">
              <div class="activity-avatar">${initials}</div>
              <div class="activity-info">
                <strong>${r.student_name}</strong>
                <span>${r.event_title}</span>
              </div>
              <span class="activity-time">${fmtDateTime(r.registered_at)}</span>
            </div>`;
          }).join('')
        : '<p style="color:var(--text-muted);font-size:0.88rem;padding:1rem 0;">No registrations yet</p>';
    }

    // Top events
    const top   = s.top_events || [];
    const maxReg = Math.max(...top.map(e => parseInt(e.cnt)||0), 1);
    const topEl  = document.getElementById('topEventsBody');
    if (topEl) {
      topEl.innerHTML = top.length
        ? top.map(e => `
            <tr>
              <td><strong>${e.title}</strong></td>
              <td><span style="font-weight:700;color:var(--primary);">${e.cnt}</span></td>
              <td style="min-width:140px;">
                <div class="progress-bar-wrap">
                  <div class="progress-bar" style="width:${((parseInt(e.cnt)||0)/maxReg)*100}%"></div>
                </div>
              </td>
            </tr>`).join('')
        : '<tr><td colspan="3" style="text-align:center;padding:1.5rem;color:var(--text-muted);">No data yet</td></tr>';
    }

    // Status dot
    const statEl = document.getElementById('statStatus');
    if (statEl) statEl.innerHTML = '<span style="color:#43e97b;">● Live</span>';

  } catch(err) {
    const statEl = document.getElementById('statStatus');
    if (statEl) statEl.innerHTML = '<span style="color:#ff6584;">● Offline</span>';
    showToast('Cannot reach database', 'error');
  }
}

// ===== EVENTS TABLE =====
async function loadEvents() {
  try {
    const res  = await fetch(`${API_BASE}/get_events.php`);
    const data = await res.json();
    if (!data.success) return;
    allEventsData = data.events;
    const badge = document.getElementById('eventsCountBadge');
    if (badge) badge.textContent = `(${allEventsData.length})`;
    renderEventsTable(allEventsData);
  } catch(e) { showToast('Failed to load events', 'error'); }
}

function renderEventsTable(events) {
  const tbody = document.getElementById('adminEventsBody');
  if (!tbody) return;
  if (!events.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-muted);">No events found</td></tr>';
    return;
  }
  const catClass = { Technology:'badge-technology', Cultural:'badge-cultural', Competition:'badge-competition', Career:'badge-career', Academic:'badge-academic', Sports:'badge-sports' };
  tbody.innerHTML = events.map(e => {
    const pct      = e.capacity > 0 ? Math.round((e.registered_count / e.capacity) * 100) : 0;
    const barColor = pct >= 90 ? '#ff6584' : pct >= 60 ? 'orange' : '#43e97b';
    const safeName = (e.title || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    return `<tr>
      <td style="color:var(--text-muted);">${e.id}</td>
      <td><strong style="color:white;">${e.title}</strong></td>
      <td><span class="event-category-badge ${catClass[e.category]||''}" style="position:static;">${e.category||'—'}</span></td>
      <td style="white-space:nowrap;">${fmtDate(e.date)}<br><span style="color:var(--text-muted);font-size:0.78rem;">${fmtTime(e.time)}</span></td>
      <td>${e.venue}</td>
      <td>${e.capacity}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-weight:700;color:${barColor};">${e.registered_count}</span>
          <div style="flex:1;min-width:60px;">
            <div class="progress-bar-wrap"><div class="progress-bar" style="width:${pct}%;background:${barColor};"></div></div>
            <span style="font-size:0.72rem;color:var(--text-muted);">${pct}%</span>
          </div>
        </div>
      </td>
      <td style="white-space:nowrap;">
        <button class="action-btn edit" onclick="openEditEvent(${e.id})" title="Edit">✏️</button>
        <button class="action-btn del"  onclick="confirmDelete('event',${e.id},'${safeName}')">🗑️</button>
      </td>
    </tr>`;
  }).join('');
}

function filterEventsTable() {
  const q   = (document.getElementById('eventsSearch')?.value || '').toLowerCase();
  const cat = document.getElementById('eventsCatFilter')?.value || '';
  renderEventsTable(allEventsData.filter(e =>
    (!q   || e.title.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q)) &&
    (!cat || e.category === cat)
  ));
}

// ===== REGISTRATIONS TABLE =====
async function loadRegistrations() {
  try {
    const res  = await fetch(`${API_BASE}/get_registrations.php`);
    const data = await res.json();
    if (!data.success) return;
    allRegsData = data.registrations;
    const badge = document.getElementById('regsCountBadge');
    if (badge) badge.textContent = `(${allRegsData.length})`;
    renderRegsTable(allRegsData);
  } catch(e) { showToast('Failed to load registrations', 'error'); }
}

function renderRegsTable(regs) {
  const tbody = document.getElementById('adminRegsBody');
  if (!tbody) return;
  if (!regs.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-muted);">No registrations yet</td></tr>';
    return;
  }
  tbody.innerHTML = regs.map(r => {
    const safeName = (r.student_name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    return `<tr>
      <td style="color:var(--text-muted);">${r.id}</td>
      <td><strong style="color:white;">${r.student_name}</strong></td>
      <td style="color:var(--text-muted);font-size:0.82rem;">${r.student_email}</td>
      <td>${r.student_id || '—'}</td>
      <td>${r.department || '—'}</td>
      <td><span style="color:var(--primary);font-weight:600;">${r.event_title}</span></td>
      <td style="color:var(--text-muted);font-size:0.82rem;">${fmtDateTime(r.registered_at)}</td>
      <td><button class="action-btn del" onclick="confirmDelete('reg',${r.id},'${safeName}')">🗑️</button></td>
    </tr>`;
  }).join('');
}

function filterRegsTable() {
  const q = (document.getElementById('regsSearch')?.value || '').toLowerCase();
  renderRegsTable(allRegsData.filter(r =>
    !q ||
    r.student_name.toLowerCase().includes(q) ||
    r.student_email.toLowerCase().includes(q) ||
    (r.department||'').toLowerCase().includes(q) ||
    r.event_title.toLowerCase().includes(q)
  ));
}

// ===== USERS TABLE =====
async function loadUsers() {
  try {
    const res  = await fetch(`${API_BASE}/get_users.php`);
    const data = await res.json();
    if (!data.success) return;
    const tbody = document.getElementById('adminUsersBody');
    if (!tbody) return;
    if (!data.users.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);">No users signed up yet</td></tr>';
      return;
    }
    tbody.innerHTML = data.users.map(u => {
      const roleBadge = u.role === 'admin'
        ? '<span style="background:rgba(255,165,0,0.15);color:orange;padding:2px 8px;border-radius:50px;font-size:0.72rem;font-weight:700;">Admin</span>'
        : '<span style="background:rgba(108,99,255,0.15);color:var(--primary);padding:2px 8px;border-radius:50px;font-size:0.72rem;font-weight:700;">Student</span>';
      return `<tr>
        <td style="color:var(--text-muted);">${u.id}</td>
        <td><strong style="color:white;">${u.name}</strong></td>
        <td style="color:var(--text-muted);font-size:0.82rem;">${u.email}</td>
        <td>${u.student_id || '—'}</td>
        <td>${u.department || '—'}</td>
        <td>${roleBadge}</td>
        <td style="color:var(--text-muted);font-size:0.82rem;">${fmtDateTime(u.created_at)}</td>
      </tr>`;
    }).join('');
  } catch(e) { showToast('Failed to load users', 'error'); }
}

// ===== EDIT EVENT =====
function openEditEvent(id) {
  const ev = allEventsData.find(e => e.id == id);
  if (!ev) { showToast('Event not found', 'error'); return; }
  document.getElementById('editEvId').value       = ev.id;
  document.getElementById('editEvTitle').value    = ev.title;
  document.getElementById('editEvDesc').value     = ev.description || '';
  document.getElementById('editEvCategory').value = ev.category;
  document.getElementById('editEvCapacity').value = ev.capacity;
  document.getElementById('editEvDate').value     = ev.date;
  document.getElementById('editEvTime').value     = ev.time;
  document.getElementById('editEvVenue').value    = ev.venue;
  document.getElementById('editEvImage').value    = ev.image_url || '';
  document.getElementById('editEventModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeEditModal() {
  document.getElementById('editEventModal').classList.remove('active');
  document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('editEventForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('.btn-submit');
    btn.textContent = 'Saving...'; btn.disabled = true;
    try {
      const res  = await fetch(`${API_BASE}/update_event.php`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          id:          document.getElementById('editEvId').value,
          title:       document.getElementById('editEvTitle').value,
          description: document.getElementById('editEvDesc').value,
          category:    document.getElementById('editEvCategory').value,
          capacity:    document.getElementById('editEvCapacity').value,
          date:        document.getElementById('editEvDate').value,
          time:        document.getElementById('editEvTime').value,
          venue:       document.getElementById('editEvVenue').value,
          image_url:   document.getElementById('editEvImage').value
        })
      });
      const data = await res.json();
      if (data.success) { showToast(data.message, 'success'); closeEditModal(); refreshAll(); }
      else showToast(data.error || 'Update failed', 'error');
    } catch { showToast('Connection error', 'error'); }
    finally { btn.textContent = 'Save Changes ✅'; btn.disabled = false; }
  });

  // ===== ADD EVENT FORM =====
  document.getElementById('addEventForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn  = e.target.querySelector('.btn-submit');
    const date = document.getElementById('evDate').value;
    if (new Date(date) < new Date().setHours(0,0,0,0)) {
      showToast('Event date must be today or in the future', 'error'); return;
    }
    btn.textContent = 'Adding...'; btn.disabled = true;
    try {
      const res  = await fetch(`${API_BASE}/add_event.php`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          title:       document.getElementById('evTitle').value,
          description: document.getElementById('evDesc').value,
          category:    document.getElementById('evCategory').value,
          date,
          time:        document.getElementById('evTime').value,
          venue:       document.getElementById('evVenue').value,
          capacity:    document.getElementById('evCapacity').value,
          image_url:   document.getElementById('evImage').value
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Event added successfully! 🎉', 'success');
        e.target.reset();
        // Switch to events tab
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.querySelector('[data-tab="events"]')?.classList.add('active');
        document.getElementById('tab-events')?.classList.add('active');
        refreshAll();
      } else showToast(data.error || 'Failed to add event', 'error');
    } catch { showToast('Connection error', 'error'); }
    finally { btn.textContent = 'Add Event 🚀'; btn.disabled = false; }
  });

  // Close modals on overlay click
  document.getElementById('editEventModal')?.addEventListener('click', e => {
    if (e.target.id === 'editEventModal') closeEditModal();
  });
  document.getElementById('confirmModal')?.addEventListener('click', e => {
    if (e.target.id === 'confirmModal') closeConfirm();
  });

  // Confirm delete button
  document.getElementById('confirmOkBtn')?.addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
  });
});

// ===== CONFIRM DELETE =====
function confirmDelete(type, id, name) {
  const titleEl = document.getElementById('confirmTitle');
  const msgEl   = document.getElementById('confirmMsg');
  if (titleEl) titleEl.textContent = `Delete "${name}"?`;
  if (msgEl)   msgEl.textContent   = type === 'event'
    ? 'This will permanently delete the event and all its registrations.'
    : 'This registration will be permanently removed.';
  document.getElementById('confirmModal')?.classList.add('active');
  document.body.style.overflow = 'hidden';
  confirmCallback = async () => {
    const url = type === 'event'
      ? `${API_BASE}/delete_event.php?id=${id}`
      : `${API_BASE}/delete_registration.php?id=${id}`;
    try {
      const res  = await fetch(url);
      const data = await res.json();
      if (data.success) { showToast(data.message, 'success'); refreshAll(); }
      else showToast(data.error || 'Delete failed', 'error');
    } catch { showToast('Connection error', 'error'); }
    closeConfirm();
  };
}

function closeConfirm() {
  document.getElementById('confirmModal')?.classList.remove('active');
  document.body.style.overflow = '';
  confirmCallback = null;
}

// ===== AUTO REFRESH =====
function startAutoRefresh() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer);
  autoRefreshTimer = setInterval(refreshAll, REFRESH_INTERVAL);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  if (!initAdminNav()) return;
  refreshAll();
  startAutoRefresh();
});
