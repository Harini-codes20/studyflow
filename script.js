/* ============================================
   StudyFlow — Main Logic
   ============================================ */

// ====== State ======
let assignments = [];
let currentFilter = 'all';
let currentSearch = '';
let currentView = 'dashboard';
let editingId = null;

// ====== Storage ======
const STORAGE_KEY = 'studyflow_assignments';
const STREAK_KEY = 'studyflow_streak';

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  assignments = raw ? JSON.parse(raw) : getSampleData();
  if (!raw) saveData();
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
}

function getSampleData() {
  const today = new Date();
  const fmt = (offset) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  };
  return [
    { id: 1, subject: 'Web Technology', title: 'HTML Forms', deadline: fmt(2), status: 'In Progress', priority: 'Medium', createdAt: Date.now() },
    { id: 2, subject: 'JavaScript', title: 'DOM Manipulation', deadline: fmt(5), status: 'Pending', priority: 'High', createdAt: Date.now() },
    { id: 3, subject: 'PHP', title: 'Form Validation', deadline: fmt(-1), status: 'Pending', priority: 'High', createdAt: Date.now() },
    { id: 4, subject: 'Database', title: 'SQL Joins Practice', deadline: fmt(7), status: 'Completed', priority: 'Low', createdAt: Date.now() },
    { id: 5, subject: 'Java', title: 'OOP Concepts', deadline: fmt(3), status: 'Pending', priority: 'Medium', createdAt: Date.now() }
  ];
}

// ====== Helpers ======
function nextId() {
  return assignments.length ? Math.max(...assignments.map(a => a.id)) + 1 : 1;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr); due.setHours(0, 0, 0, 0);
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

function isOverdue(a) {
  return a.status !== 'Completed' && daysUntil(a.deadline) < 0;
}

function dueLabel(a) {
  const d = daysUntil(a.deadline);
  if (a.status === 'Completed') return { text: '✅ Done', cls: 'ok' };
  if (d < 0) return { text: `⚠️ ${Math.abs(d)}d overdue`, cls: 'overdue' };
  if (d === 0) return { text: '🔥 Due today', cls: 'overdue' };
  if (d === 1) return { text: '⏰ Due tomorrow', cls: 'soon' };
  if (d <= 3) return { text: `⏳ Due in ${d} days`, cls: 'soon' };
  return { text: `📅 Due in ${d} days`, cls: 'ok' };
}

// ====== Rendering ======
function render() {
  renderStats();
  renderProgress();
  renderList();
  renderStreak();
}

function renderStats() {
  const total = assignments.length;
  const pending = assignments.filter(a => a.status === 'Pending' && !isOverdue(a)).length;
  const inProgress = assignments.filter(a => a.status === 'In Progress').length;
  const completed = assignments.filter(a => a.status === 'Completed').length;
  const overdue = assignments.filter(isOverdue).length;

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statProgress').textContent = inProgress;
  document.getElementById('statCompleted').textContent = completed;
  document.getElementById('statOverdue').textContent = overdue;
}

function renderProgress() {
  const total = assignments.length;
  const completed = assignments.filter(a => a.status === 'Completed').length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  document.getElementById('progressPercent').textContent = percent + '%';
  document.getElementById('progressFill').style.width = percent + '%';
}

function renderStreak() {
  let streak = parseInt(localStorage.getItem(STREAK_KEY) || '0');
  const lastVisit = localStorage.getItem(STREAK_KEY + '_date');
  const today = new Date().toISOString().split('T')[0];

  if (lastVisit !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];
    if (lastVisit === yStr) streak += 1;
    else streak = 1;
    localStorage.setItem(STREAK_KEY, streak);
    localStorage.setItem(STREAK_KEY + '_date', today);
  }
  if (streak === 0) {
    streak = 1;
    localStorage.setItem(STREAK_KEY, streak);
    localStorage.setItem(STREAK_KEY + '_date', today);
  }
  document.getElementById('streakCount').textContent = streak + (streak === 1 ? ' day' : ' days');
}

function getFiltered() {
  let list = [...assignments];

  // View filter (from sidebar)
  if (currentView === 'pending') list = list.filter(a => a.status === 'Pending');
  else if (currentView === 'completed') list = list.filter(a => a.status === 'Completed');
  else if (currentView === 'overdue') list = list.filter(isOverdue);

  // Chip filter
  if (currentFilter === 'pending') list = list.filter(a => a.status === 'Pending');
  else if (currentFilter === 'inprogress') list = list.filter(a => a.status === 'In Progress');
  else if (currentFilter === 'completed') list = list.filter(a => a.status === 'Completed');
  else if (currentFilter === 'overdue') list = list.filter(isOverdue);

  // Search
  if (currentSearch.trim()) {
    const q = currentSearch.toLowerCase();
    list = list.filter(a =>
      a.subject.toLowerCase().includes(q) ||
      a.title.toLowerCase().includes(q)
    );
  }

  // Sort: overdue first, then by deadline
  list.sort((a, b) => {
    const ao = isOverdue(a) ? 0 : 1;
    const bo = isOverdue(b) ? 0 : 1;
    if (ao !== bo) return ao - bo;
    return new Date(a.deadline) - new Date(b.deadline);
  });

  return list;
}

function renderList() {
  const container = document.getElementById('assignmentsList');
  const emptyState = document.getElementById('emptyState');
  const list = getFiltered();

  container.innerHTML = '';

  if (list.length === 0) {
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  list.forEach((a, i) => {
    const overdue = isOverdue(a);
    const due = dueLabel(a);
    const card = document.createElement('div');
    card.className = 'assignment-card' + (overdue ? ' overdue' : '');
    card.dataset.status = a.status;
    card.style.animationDelay = (i * 0.04) + 's';

    card.innerHTML = `
      <div class="card-header">
        <span class="card-subject">${escapeHtml(a.subject)}</span>
        <div class="priority-dot ${a.priority || 'Medium'}" title="Priority: ${a.priority || 'Medium'}"></div>
      </div>
      <h3 class="card-title ${a.status === 'Completed' ? 'completed-text' : ''}">${escapeHtml(a.title)}</h3>
      <div class="card-meta">
        <span>📅 ${formatDate(a.deadline)}</span>
        <span class="due-badge ${due.cls}">${due.text}</span>
      </div>
      <div class="card-footer">
        <select class="status-select" data-id="${a.id}">
          <option value="Pending" ${a.status === 'Pending' ? 'selected' : ''}>⏳ Pending</option>
          <option value="In Progress" ${a.status === 'In Progress' ? 'selected' : ''}>⚡ In Progress</option>
          <option value="Completed" ${a.status === 'Completed' ? 'selected' : ''}>✅ Completed</option>
        </select>
        <div class="card-actions">
          <button class="icon-btn edit" data-id="${a.id}" title="Edit">✏️</button>
          <button class="icon-btn delete" data-id="${a.id}" title="Delete">🗑️</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  // Attach event listeners
  container.querySelectorAll('.status-select').forEach(sel => {
    sel.addEventListener('change', (e) => updateStatus(parseInt(e.target.dataset.id), e.target.value));
  });
  container.querySelectorAll('.icon-btn.edit').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(parseInt(btn.dataset.id)));
  });
  container.querySelectorAll('.icon-btn.delete').forEach(btn => {
    btn.addEventListener('click', () => deleteAssignment(parseInt(btn.dataset.id)));
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// ====== Actions ======
function updateStatus(id, status) {
  const a = assignments.find(x => x.id === id);
  if (!a) return;
  a.status = status;
  saveData();
  render();
  showToast(status === 'Completed' ? '🎉 Great job! Task completed.' : '✅ Status updated');
}

function deleteAssignment(id) {
  const a = assignments.find(x => x.id === id);
  if (!a) return;
  if (!confirm(`Delete "${a.title}"?`)) return;
  assignments = assignments.filter(x => x.id !== id);
  saveData();
  render();
  showToast('🗑️ Assignment deleted');
}

// ====== Modal ======
function openAddModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent = 'New Assignment';
  document.getElementById('saveBtn').textContent = 'Save Assignment';
  document.getElementById('assignmentForm').reset();

  // Default deadline = tomorrow
  const t = new Date();
  t.setDate(t.getDate() + 1);
  document.getElementById('deadlineInput').value = t.toISOString().split('T')[0];

  document.getElementById('modalOverlay').classList.add('active');
  setTimeout(() => document.getElementById('subjectInput').focus(), 100);
}

function openEditModal(id) {
  const a = assignments.find(x => x.id === id);
  if (!a) return;
  editingId = id;
  document.getElementById('modalTitle').textContent = 'Edit Assignment';
  document.getElementById('saveBtn').textContent = 'Update Assignment';
  document.getElementById('subjectInput').value = a.subject;
  document.getElementById('titleInput').value = a.title;
  document.getElementById('deadlineInput').value = a.deadline;
  document.getElementById('statusInput').value = a.status;
  document.getElementById('priorityInput').value = a.priority || 'Medium';
  document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  editingId = null;
}

// ====== Form Submit ======
document.getElementById('assignmentForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const subject = document.getElementById('subjectInput').value.trim();
  const title = document.getElementById('titleInput').value.trim();
  const deadline = document.getElementById('deadlineInput').value;
  const status = document.getElementById('statusInput').value;
  const priority = document.getElementById('priorityInput').value;

  if (!subject || !title || !deadline) return;

  if (editingId) {
    const a = assignments.find(x => x.id === editingId);
    if (a) {
      Object.assign(a, { subject, title, deadline, status, priority });
    }
    showToast('✏️ Assignment updated');
  } else {
    assignments.push({
      id: nextId(),
      subject, title, deadline, status, priority,
      createdAt: Date.now()
    });
    showToast('➕ Assignment added');
  }

  saveData();
  closeModal();
  render();
});

// ====== Toast ======
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

// ====== Wiring ======
document.getElementById('openAddModal').addEventListener('click', openAddModal);
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('cancelBtn').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'modalOverlay') closeModal();
});

document.getElementById('searchInput').addEventListener('input', (e) => {
  currentSearch = e.target.value;
  renderList();
});

document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentFilter = chip.dataset.filter;
    renderList();
  });
});

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentView = btn.dataset.view;

    const titles = {
      dashboard: ['Dashboard', "Welcome back! Let's crush today's goals 💪"],
      all: ['All Assignments', 'Everything you are working on'],
      pending: ['Pending Tasks', 'Tasks that need your attention'],
      completed: ['Completed Tasks', 'Great work! Here is what you finished ✅'],
      overdue: ['Overdue Tasks', 'These need attention ASAP ⚠️']
    };
    const [t, s] = titles[currentView] || titles.dashboard;
    document.getElementById('pageTitle').textContent = t;
    document.getElementById('pageSubtitle').textContent = s;

    // Reset chip when changing view
    currentFilter = 'all';
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    document.querySelector('.chip[data-filter="all"]').classList.add('active');

    renderList();
  });
});

// Stat card quick-filter
document.querySelectorAll('.stat-card').forEach(card => {
  card.addEventListener('click', () => {
    const f = card.dataset.filter;
    const chip = document.querySelector(`.chip[data-filter="${f}"]`);
    if (chip) chip.click();
  });
});

// Keyboard: Esc closes modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ====== Init ======
loadData();
render();