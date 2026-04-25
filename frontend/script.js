const STATE_KEY = 'sentinelx_state_v3';
const SESSION_KEY = 'sentinelx_current_user';
const FLASH_KEY = 'sentinelx_flash';

/* ─── Menu Icons (Lucide-style inline SVG) ─────────────────────── */
const MENU_ICONS = {
  overview: `<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`,
  users: `<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  'resources-catalog': `<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
  alerts: `<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  logs: `<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  risk: `<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  audit: `<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  incidents: `<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  'my-activity': `<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  'my-risk': `<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  resources: `<svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>`,
};

/* ─── Toast Notifications ───────────────────────────────────────── */
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const dot = document.createElement('span');
  dot.className = 'toast-dot';
  toast.appendChild(dot);
  toast.appendChild(document.createTextNode(message));
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 230);
  }, duration);
}

/* ─── Animated Number Counter ───────────────────────────────────── */
function animateCounter(el, target, duration = 550) {
  const start = performance.now();
  const from = 0;
  el.classList.add('counting');
  const tick = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (target - from) * eased);
    if (p < 1) requestAnimationFrame(tick);
    else {
      el.textContent = target;
      el.classList.remove('counting');
    }
  };
  requestAnimationFrame(tick);
}

const ROLE_MENU = {
  Admin: ['overview', 'users', 'resources-catalog', 'alerts', 'logs', 'risk', 'audit', 'incidents'],
  'Security Analyst': ['overview', 'resources-catalog', 'alerts', 'logs', 'risk', 'incidents'],
  Employee: ['overview', 'my-activity', 'my-risk', 'resources'],
};

const MENU_TITLES = {
  overview: 'System Overview',
  users: 'User Management',
  'resources-catalog': 'Resource Catalog',
  alerts: 'Alert Monitor',
  logs: 'Access Logs',
  risk: 'Risk Analytics',
  audit: 'Audit Trail',
  incidents: 'Incident Queue',
  'my-activity': 'My Activity',
  'my-risk': 'My Risk Score',
  resources: 'Resource Access Simulator',
};

const seededState = {
  users: [
    { id: 1, username: 'admin', password: 'admin123', role: 'Admin', locked: false },
    { id: 2, username: 'analyst', password: 'analyst123', role: 'Security Analyst', locked: false },
    { id: 3, username: 'employee', password: 'emp123', role: 'Employee', locked: false },
  ],
  resources: [
    {
      id: 1,
      name: 'Policy_Manual.pdf',
      type: 'Normal',
      category: 'Documentation',
      riskPoints: 0,
      isActive: true,
      ownerDept: 'GRC',
      lastUpdated: '2026-04-19T09:40:00Z',
    },
    {
      id: 2,
      name: 'Knowledge_Base.md',
      type: 'Normal',
      category: 'Internal Wiki',
      riskPoints: 0,
      isActive: true,
      ownerDept: 'Security',
      lastUpdated: '2026-04-19T10:10:00Z',
    },
    {
      id: 3,
      name: 'Decoy_Payroll_Master.csv',
      type: 'Honeytoken',
      category: 'Finance Decoy',
      riskPoints: 18,
      isActive: true,
      ownerDept: 'Finance',
      lastUpdated: '2026-04-20T08:00:00Z',
    },
    {
      id: 4,
      name: 'Honeytoken_Admin_Secrets.txt',
      type: 'Honeytoken',
      category: 'Credential Decoy',
      riskPoints: 24,
      isActive: true,
      ownerDept: 'Platform',
      lastUpdated: '2026-04-20T08:22:00Z',
    },
    {
      id: 5,
      name: 'IAM_Audit_Policy.yaml',
      type: 'Critical',
      category: 'Identity',
      riskPoints: 6,
      isActive: true,
      ownerDept: 'Security',
      lastUpdated: '2026-04-20T11:15:00Z',
    },
  ],
  logs: [
    {
      id: 101,
      timestamp: '2026-04-20T10:26:00Z',
      userId: 3,
      username: 'employee',
      resourceId: 1,
      resource: 'Policy_Manual.pdf',
      resourceType: 'Normal',
      ip: '10.0.1.18',
      accessType: 'READ',
      status: 'Normal',
    },
    {
      id: 102,
      timestamp: '2026-04-20T10:42:00Z',
      userId: 2,
      username: 'analyst',
      resourceId: 3,
      resource: 'Decoy_Payroll_Master.csv',
      resourceType: 'Honeytoken',
      ip: '10.0.2.71',
      accessType: 'READ',
      status: 'Suspicious',
    },
    {
      id: 103,
      timestamp: '2026-04-20T11:04:00Z',
      userId: 3,
      username: 'employee',
      resourceId: 4,
      resource: 'Honeytoken_Admin_Secrets.txt',
      resourceType: 'Honeytoken',
      ip: '10.0.1.18',
      accessType: 'EXPORT',
      status: 'Suspicious',
    },
    {
      id: 104,
      timestamp: '2026-04-20T11:19:00Z',
      userId: 1,
      username: 'admin',
      resourceId: 5,
      resource: 'IAM_Audit_Policy.yaml',
      resourceType: 'Critical',
      ip: '10.0.0.12',
      accessType: 'WRITE',
      status: 'Normal',
    },
  ],
  alerts: [
    {
      id: 7001,
      timestamp: '2026-04-20T10:42:00Z',
      userId: 2,
      username: 'analyst',
      resourceId: 3,
      type: 'HONEYTOKEN_ACCESS',
      severity: 'HIGH',
      message: 'Decoy finance export accessed from unusual subnet.',
      status: 'OPEN',
      riskImpact: 18,
    },
    {
      id: 7002,
      timestamp: '2026-04-20T11:04:00Z',
      userId: 3,
      username: 'employee',
      resourceId: 4,
      type: 'HONEYTOKEN_ACCESS',
      severity: 'CRITICAL',
      message: 'Credential-like decoy token exported by employee account.',
      status: 'OPEN',
      riskImpact: 24,
    },
  ],
  incidents: [
    {
      id: 8001,
      alertId: 7002,
      title: 'Potential credential theft attempt',
      owner: 'analyst',
      priority: 'P1',
      status: 'OPEN',
      createdAt: '2026-04-20T11:05:00Z',
    },
  ],
  riskHistory: {
    1: [
      { timestamp: '2026-04-18T09:20:00Z', score: 12, delta: 5, reason: 'Privileged policy edits' },
      { timestamp: '2026-04-20T11:19:00Z', score: 18, delta: 6, reason: 'Multiple role assignment operations' },
    ],
    2: [
      { timestamp: '2026-04-19T22:11:00Z', score: 18, delta: 8, reason: 'After-hours access pattern' },
      { timestamp: '2026-04-20T10:42:00Z', score: 36, delta: 18, reason: 'Honeytoken access event' },
    ],
    3: [
      { timestamp: '2026-04-19T08:00:00Z', score: 6, delta: 6, reason: 'New employee baseline' },
      { timestamp: '2026-04-20T11:04:00Z', score: 30, delta: 24, reason: 'Honeytoken credential export' },
    ],
  },
  auditTrail: [
    {
      id: 9001,
      timestamp: '2026-04-20T11:22:00Z',
      actor: 'admin',
      action: 'REVIEW_ALERT',
      target: 'Alert #7002',
      details: 'Escalated to incident response channel.',
    },
  ],
};

let activeSection = 'overview';
let activeChart = null;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getState() {
  const raw = localStorage.getItem(STATE_KEY);
  if (!raw) {
    const seed = clone(seededState);
    localStorage.setItem(STATE_KEY, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(raw);
  } catch (_error) {
    const seed = clone(seededState);
    localStorage.setItem(STATE_KEY, JSON.stringify(seed));
    return seed;
  }
}

function saveState(state) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function getCurrentUser() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

function setCurrentUser(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function setFlash(message) {
  localStorage.setItem(FLASH_KEY, message);
}

function consumeFlash() {
  const msg = localStorage.getItem(FLASH_KEY);
  if (msg) localStorage.removeItem(FLASH_KEY);
  return msg;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function statusBadge(status) {
  const normalized = String(status).toLowerCase();
  if (['suspicious', 'critical', 'high', 'p1'].includes(normalized)) {
    return '<span class="badge badge-suspicious">Suspicious</span>';
  }
  if (['open', 'p2', 'p3'].includes(normalized)) {
    return '<span class="badge badge-open">Open</span>';
  }
  return '<span class="badge badge-normal">Normal</span>';
}

function resourceTypeBadge(type) {
  const normalized = String(type).toLowerCase();
  if (normalized === 'honeytoken') return '<span class="tag tag-honeytoken">Honeytoken</span>';
  if (normalized === 'critical') return '<span class="tag tag-critical">Critical</span>';
  return '<span class="tag tag-normal">Normal</span>';
}

function canViewResourceType(currentUser) {
  return currentUser.role !== 'Employee';
}

function roleGuard(requiredPage) {
  const user = getCurrentUser();

  if (!user && requiredPage === 'dashboard') {
    window.location.href = 'login.html';
    return null;
  }

  if (user && (requiredPage === 'login' || requiredPage === 'register')) {
    window.location.href = 'dashboard.html';
    return null;
  }

  return user;
}

function showAuthMessage(message, isError) {
  const node = document.getElementById('auth-message');
  if (!node) return;
  node.textContent = message;
  node.classList.toggle('error', !!isError);
}

function getRiskScore(state, userId) {
  const history = state.riskHistory[userId] || [];
  if (!history.length) return 0;
  return Number(history[history.length - 1].score);
}

function getResourceById(state, resourceId) {
  return state.resources.find((resource) => resource.id === resourceId);
}

function addAudit(state, actor, action, target, details) {
  state.auditTrail.unshift({
    id: Date.now() + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    actor,
    action,
    target,
    details,
  });
}

function addRiskEvent(state, userId, delta, reason) {
  const history = state.riskHistory[userId] || [];
  const previous = history.length ? Number(history[history.length - 1].score) : 0;
  history.push({
    timestamp: new Date().toISOString(),
    score: previous + delta,
    delta,
    reason,
  });
  state.riskHistory[userId] = history;
}

function simulateResourceAccess(state, user, resource, accessType, ip) {
  const now = new Date().toISOString();
  const risky = resource.type === 'Honeytoken';
  const riskImpact = risky ? Number(resource.riskPoints || 16) : Number(resource.type === 'Critical' ? 6 : 0);
  const status = risky ? 'Suspicious' : 'Normal';

  state.logs.unshift({
    id: Date.now() + Math.floor(Math.random() * 1000),
    timestamp: now,
    userId: user.id,
    username: user.username,
    resourceId: resource.id,
    resource: resource.name,
    resourceType: resource.type,
    ip,
    accessType,
    status,
  });

  if (riskImpact > 0) {
    addRiskEvent(state, user.id, riskImpact, `${resource.type} access: ${resource.name}`);
  }

  if (risky) {
    const alertId = Date.now() + Math.floor(Math.random() * 1000);
    const severity = riskImpact >= 20 ? 'CRITICAL' : 'HIGH';

    state.alerts.unshift({
      id: alertId,
      timestamp: now,
      userId: user.id,
      username: user.username,
      resourceId: resource.id,
      type: 'HONEYTOKEN_ACCESS',
      severity,
      message: `${resource.name} triggered honeytoken guardrail from ${ip}.`,
      status: 'OPEN',
      riskImpact,
    });

    state.incidents.unshift({
      id: Date.now() + Math.floor(Math.random() * 1000),
      alertId,
      title: `Investigate ${resource.name}`,
      owner: 'unassigned',
      priority: severity === 'CRITICAL' ? 'P1' : 'P2',
      status: 'OPEN',
      createdAt: now,
    });
  }

  addAudit(
    state,
    user.username,
    'ACCESS_RESOURCE',
    resource.name,
    `type=${resource.type}; accessType=${accessType}; ip=${ip}; status=${status}`
  );
}

function getScopedData(state, currentUser) {
  if (currentUser.role === 'Employee') {
    return {
      logs: state.logs.filter((item) => item.userId === currentUser.id),
      alerts: state.alerts.filter((item) => item.userId === currentUser.id),
      users: state.users.filter((item) => item.id === currentUser.id),
      resources: state.resources.filter((item) => item.isActive),
      incidents: state.incidents.filter((item) => {
        const alert = state.alerts.find((candidate) => candidate.id === item.alertId);
        return alert ? alert.userId === currentUser.id : false;
      }),
      riskHistory: { [currentUser.id]: state.riskHistory[currentUser.id] || [] },
      auditTrail: [],
    };
  }

  return {
    logs: [...state.logs],
    alerts: [...state.alerts],
    users: [...state.users],
    resources: [...state.resources],
    incidents: [...state.incidents],
    riskHistory: { ...state.riskHistory },
    auditTrail: [...state.auditTrail],
  };
}

function makeSearchBar(id, placeholder, extraControl) {
  return `
    <div class="filter-row">
      <input id="${id}" class="field-input" placeholder="${placeholder}" />
      ${extraControl || ''}
    </div>
  `;
}

function makeTable(headers, rowsHtml) {
  return `
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>${headers.map((item) => `<th>${item}</th>`).join('')}</tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  `;
}

function showModal(title, payload) {
  const modal = document.getElementById('detail-modal');
  const titleNode = document.getElementById('modal-title');
  const content = document.getElementById('modal-content');

  titleNode.textContent = title;
  content.innerHTML = Object.entries(payload)
    .map(
      ([key, value]) => `
      <div class="detail-item">
        <p class="meta-line">${escapeHtml(key)}</p>
        <p>${escapeHtml(value)}</p>
      </div>
    `
    )
    .join('');

  modal.classList.remove('hidden');
}

function bindModal() {
  const close = document.getElementById('close-modal');
  const investigate = document.getElementById('modal-investigate');
  const modal = document.getElementById('detail-modal');

  close.onclick = () => modal.classList.add('hidden');
  investigate.onclick = () => modal.classList.add('hidden');

  modal.onclick = (event) => {
    if (event.target === modal) {
      modal.classList.add('hidden');
    }
  };
}

function renderMenu(role) {
  const host = document.getElementById('role-menu');
  const items = ROLE_MENU[role] || ['overview'];

  host.innerHTML = items
    .map((item) => `
      <button type="button" class="menu-item ${item === activeSection ? 'active' : ''}" data-section="${item}">
        ${MENU_ICONS[item] || ''}
        ${MENU_TITLES[item]}
      </button>
    `).join('');

  host.querySelectorAll('[data-section]').forEach((button) => {
    button.onclick = () => {
      activeSection = button.dataset.section;
      initDashboardPage();
    };
  });
}

function renderStats(state, scoped, currentUser) {
  const suspiciousLogs = scoped.logs.filter((item) => item.status === 'Suspicious').length;
  const highRiskUsers = scoped.users.filter((user) => getRiskScore(state, user.id) >= 30).length;
  const honeytokenResources = scoped.resources.filter((resource) => resource.type === 'Honeytoken').length;

  const cards = [
    { title: 'Total Alerts', value: scoped.alerts.length, tone: 'cyan' },
    { title: 'Access Logs', value: scoped.logs.length, tone: 'magenta' },
    { title: 'High Risk Users', value: highRiskUsers, tone: 'lime' },
    { title: 'Honeytoken Resources', value: honeytokenResources, tone: 'magenta' },
    { title: 'Open Incidents', value: scoped.incidents.filter((item) => item.status === 'OPEN').length, tone: 'cyan' },
    { title: `${currentUser.role} View`, value: suspiciousLogs, tone: 'lime', subtitle: 'Suspicious Logs' },
  ];

  const host = document.getElementById('stats-row');
  host.innerHTML = cards
    .map(
      (card) => `
      <article class="stat-card ${card.tone}">
        <p class="meta-line">${escapeHtml(card.title)}</p>
        <h3 data-target="${Number(card.value)}">0</h3>
        <p class="stat-subtitle">${escapeHtml(card.subtitle || 'Realtime telemetry')}</p>
      </article>
    `
    )
    .join('');

  /* Animate counters */
  host.querySelectorAll('h3[data-target]').forEach((el) => {
    animateCounter(el, Number(el.dataset.target));
  });
}

function renderRiskChart(state, scoped, currentUser) {
  const canvas = document.getElementById('risk-chart');
  if (!canvas || !window.Chart) return;

  if (activeChart) {
    activeChart.destroy();
    activeChart = null;
  }

  let labels = [];
  let values = [];

  if (currentUser.role === 'Employee') {
    const history = scoped.riskHistory[currentUser.id] || [];
    labels = history.map((item) => new Date(item.timestamp).toLocaleDateString());
    values = history.map((item) => item.score);
  } else {
    labels = scoped.users.map((user) => user.username);
    values = scoped.users.map((user) => getRiskScore(state, user.id));
  }

  const isLine = currentUser.role === 'Employee';
  const primaryColor = '#3B82F6';
  const roseColor = '#FB7185';

  activeChart = new Chart(canvas, {
    type: isLine ? 'line' : 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Risk Score',
          data: values,
          borderColor: primaryColor,
          backgroundColor: isLine
            ? (ctx) => {
                const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 200);
                gradient.addColorStop(0, 'rgba(59,130,246,0.3)');
                gradient.addColorStop(1, 'rgba(59,130,246,0.02)');
                return gradient;
              }
            : (ctx) => {
                const score = values[ctx.dataIndex];
                return score >= 30
                  ? 'rgba(251,113,133,0.7)'
                  : score >= 15
                  ? 'rgba(251,191,36,0.7)'
                  : 'rgba(59,130,246,0.7)';
              },
          borderWidth: isLine ? 2 : 0,
          borderRadius: isLine ? 0 : 6,
          fill: isLine,
          tension: 0.4,
          pointBackgroundColor: primaryColor,
          pointRadius: isLine ? 4 : 0,
          pointHoverRadius: isLine ? 6 : 0,
        },
      ],
    },
    options: {
      responsive: true,
      animation: { duration: 700, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0D1117',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          titleColor: '#94A3B8',
          bodyColor: '#E2E8F0',
          padding: 10,
          cornerRadius: 8,
        },
      },
      scales: {
        x: {
          ticks: { color: '#4B5563', font: { family: 'JetBrains Mono', size: 10 } },
          grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
        },
        y: {
          ticks: { color: '#4B5563', font: { family: 'JetBrains Mono', size: 10 } },
          grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
          beginAtZero: true,
        },
      },
    },
  });
}

function renderOverviewSection(state, scoped, currentUser) {
  const suspicious = scoped.logs.filter((item) => item.status === 'Suspicious').slice(0, 5);

  const host = document.getElementById('section-host');
  host.innerHTML = `
    <div class="section-head">
      <h3>${MENU_TITLES.overview}</h3>
      <p class="meta-line">Profile: ${escapeHtml(currentUser.role)}</p>
    </div>
    <div class="split-grid">
      <article class="glass-card inner-card">
        <h4>Suspicious Activity Feed</h4>
        <div class="list-stack">
          ${
            suspicious.length
              ? suspicious
                  .map(
                    (item) => `
                  <button class="list-item" data-log-id="${item.id}">
                    <span>${escapeHtml(item.username)} · ${escapeHtml(item.resource)}</span>
                    ${statusBadge(item.status)}
                  </button>
                `
                  )
                  .join('')
              : '<p class="meta-line">No suspicious activity.</p>'
          }
        </div>
      </article>
      <article class="glass-card inner-card">
        <h4>Risk Trend</h4>
        <canvas id="risk-chart" height="170"></canvas>
      </article>
    </div>
  `;

  host.querySelectorAll('[data-log-id]').forEach((button) => {
    button.onclick = () => {
      const log = scoped.logs.find((item) => String(item.id) === button.dataset.logId);
      if (!log) return;
      showModal('Log Details', {
        User: log.username,
        Resource: log.resource,
        'Resource Type': log.resourceType,
        IP: log.ip,
        'Access Type': log.accessType,
        Status: log.status,
        Timestamp: formatDate(log.timestamp),
      });
    };
  });

  renderRiskChart(state, scoped, currentUser);
}

function renderUsersSection(state) {
  const host = document.getElementById('section-host');
  host.innerHTML = `
    <div class="section-head">
      <h3>${MENU_TITLES.users}</h3>
      <p class="meta-line">Admin only controls</p>
    </div>
    ${makeSearchBar('users-search', 'Search username or role')}
    <div id="users-table-slot"></div>
  `;

  const renderRows = (query = '') => {
    const normalized = query.trim().toLowerCase();
    const rows = state.users
      .filter((item) => `${item.username} ${item.role}`.toLowerCase().includes(normalized))
      .map(
        (item) => `
        <tr>
          <td>${escapeHtml(item.username)}</td>
          <td>${escapeHtml(item.role)}</td>
          <td>${getRiskScore(state, item.id)}</td>
          <td>${item.locked ? '<span class="badge badge-suspicious">Locked</span>' : '<span class="badge badge-normal">Active</span>'}</td>
          <td>
            <button type="button" class="btn btn-outline" data-lock-user="${item.id}">${item.locked ? 'Unlock' : 'Lock'}</button>
            <button type="button" class="btn btn-outline" style="color:red; border-color:red; margin-left:4px;" data-delete-user="${item.id}">Delete</button>
          </td>
        </tr>
      `
      )
      .join('');

    document.getElementById('users-table-slot').innerHTML = makeTable(
      ['Username', 'Role', 'Risk Score', 'Status', 'Action'],
      rows || '<tr><td colspan="5" class="meta-line">No users found.</td></tr>'
    );

    document.querySelectorAll('[data-lock-user]').forEach((button) => {
      button.onclick = () => {
        const userId = Number(button.dataset.lockUser);
        const target = state.users.find((item) => item.id === userId);
        if (!target) return;

        target.locked = !target.locked;
        addAudit(state, 'admin', target.locked ? 'LOCK_USER' : 'UNLOCK_USER', target.username, `role=${target.role}`);
        saveState(state);
        renderUsersSection(state);
      };
    });

    document.querySelectorAll('[data-delete-user]').forEach((button) => {
      button.onclick = () => {
        const userId = Number(button.dataset.deleteUser);
        const target = state.users.find((item) => item.id === userId);
        if (!target) return;
        if (!confirm(`Are you sure you want to delete user ${target.username}?`)) return;

        state.users = state.users.filter((item) => item.id !== userId);
        addAudit(state, 'admin', 'DELETE_USER', target.username, `role=${target.role}`);
        saveState(state);
        renderUsersSection(state);
      };
    });
  };

  renderRows();
  document.getElementById('users-search').addEventListener('input', (event) => renderRows(event.target.value));
}

function renderResourceCatalogSection(state, scoped, currentUser) {
  const canManageResources = currentUser.role === 'Admin';
  const host = document.getElementById('section-host');

  host.innerHTML = `
    <div class="section-head">
      <h3>${MENU_TITLES['resources-catalog']}</h3>
      <p class="meta-line">Add and classify resources by type</p>
    </div>
    <div class="catalog-grid">
      <article class="inner-card glass-card">
        <h4>Add Resource</h4>
        <form id="resource-form" class="form-grid">
          <input id="resource-name" class="field-input" placeholder="Resource name" ${canManageResources ? '' : 'disabled'} />
          <select id="resource-type" class="field-input" ${canManageResources ? '' : 'disabled'}>
            <option value="Normal">Normal</option>
            <option value="Honeytoken">Honeytoken</option>
            <option value="Critical">Critical</option>
          </select>
          <input id="resource-category" class="field-input" placeholder="Category" ${canManageResources ? '' : 'disabled'} />
          <input id="resource-risk" class="field-input" type="number" min="0" max="100" value="0" ${canManageResources ? '' : 'disabled'} />
          <input id="resource-owner" class="field-input" placeholder="Owner department" ${canManageResources ? '' : 'disabled'} />
          <button class="btn btn-primary" type="submit" ${canManageResources ? '' : 'disabled'}>Create Resource</button>
          <p id="resource-form-msg" class="form-message">${canManageResources ? 'Admin can create new resources.' : 'Read-only for Security Analyst.'}</p>
        </form>
      </article>
      <article class="inner-card glass-card">
        <h4>Inventory Filters</h4>
        ${makeSearchBar(
          'resource-search',
          'Search name/category/owner',
          '<select id="resource-type-filter" class="field-input"><option value="">All Types</option><option value="Normal">Normal</option><option value="Honeytoken">Honeytoken</option><option value="Critical">Critical</option></select>'
        )}
        <div id="resource-table-slot"></div>
      </article>
    </div>
  `;

  const renderRows = () => {
    const query = document.getElementById('resource-search').value.trim().toLowerCase();
    const type = document.getElementById('resource-type-filter').value;

    const rows = scoped.resources
      .filter((resource) => {
        const text = `${resource.name} ${resource.category} ${resource.ownerDept}`.toLowerCase();
        const byText = !query || text.includes(query);
        const byType = !type || resource.type === type;
        return byText && byType;
      })
      .map(
        (resource) => `
        <tr>
          <td>${escapeHtml(resource.name)}</td>
          <td>${resourceTypeBadge(resource.type)}</td>
          <td>${escapeHtml(resource.category)}</td>
          <td>${resource.riskPoints}</td>
          <td>${resource.isActive ? '<span class="badge badge-normal">Active</span>' : '<span class="badge badge-open">Disabled</span>'}</td>
          <td>${escapeHtml(resource.ownerDept)}</td>
          <td>
            ${
              canManageResources
                ? `<button type="button" class="btn btn-outline" data-toggle-resource="${resource.id}">${resource.isActive ? 'Disable' : 'Enable'}</button>
                   <button type="button" class="btn btn-outline" style="color:red; border-color:red; margin-left:4px;" data-delete-resource="${resource.id}">Delete</button>`
                : '<span class="meta-line">Read-only</span>'
            }
          </td>
        </tr>
      `
      )
      .join('');

    document.getElementById('resource-table-slot').innerHTML = makeTable(
      ['Name', 'Type', 'Category', 'Risk Pts', 'State', 'Owner', 'Action'],
      rows || '<tr><td colspan="7" class="meta-line">No resources found.</td></tr>'
    );

    if (canManageResources) {
      document.querySelectorAll('[data-toggle-resource]').forEach((button) => {
        button.onclick = () => {
          const resourceId = Number(button.dataset.toggleResource);
          const target = state.resources.find((item) => item.id === resourceId);
          if (!target) return;

          target.isActive = !target.isActive;
          target.lastUpdated = new Date().toISOString();
          addAudit(
            state,
            'admin',
            target.isActive ? 'ENABLE_RESOURCE' : 'DISABLE_RESOURCE',
            target.name,
            `type=${target.type}`
          );
          saveState(state);
          initDashboardPage();
        };
      });

      document.querySelectorAll('[data-delete-resource]').forEach((button) => {
        button.onclick = () => {
          const resourceId = Number(button.dataset.deleteResource);
          const target = state.resources.find((item) => item.id === resourceId);
          if (!target) return;
          if (!confirm(`Are you sure you want to delete resource ${target.name}?`)) return;

          state.resources = state.resources.filter((item) => item.id !== resourceId);
          addAudit(state, 'admin', 'DELETE_RESOURCE', target.name, `type=${target.type}`);
          saveState(state);
          initDashboardPage();
        };
      });
    }
  };

  document.getElementById('resource-search').addEventListener('input', renderRows);
  document.getElementById('resource-type-filter').addEventListener('change', renderRows);
  renderRows();

  const form = document.getElementById('resource-form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!canManageResources) return;

    const name = document.getElementById('resource-name').value.trim();
    const type = document.getElementById('resource-type').value;
    const category = document.getElementById('resource-category').value.trim();
    const riskPoints = Number(document.getElementById('resource-risk').value || 0);
    const ownerDept = document.getElementById('resource-owner').value.trim();

    if (!name || !category || !ownerDept) {
      document.getElementById('resource-form-msg').textContent = 'Name, category, and owner are required.';
      document.getElementById('resource-form-msg').classList.add('error');
      return;
    }

    const exists = state.resources.some((resource) => resource.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      document.getElementById('resource-form-msg').textContent = 'Resource name already exists.';
      document.getElementById('resource-form-msg').classList.add('error');
      return;
    }

    const newResource = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      name,
      type,
      category,
      riskPoints,
      isActive: true,
      ownerDept,
      lastUpdated: new Date().toISOString(),
    };

    state.resources.unshift(newResource);
    addAudit(state, 'admin', 'CREATE_RESOURCE', newResource.name, `type=${type}; riskPoints=${riskPoints}`);
    saveState(state);

    document.getElementById('resource-form-msg').textContent = `${newResource.name} created.`;
    document.getElementById('resource-form-msg').classList.remove('error');
    form.reset();
    document.getElementById('resource-risk').value = '0';
    initDashboardPage();
  });
}

function renderAlertsSection(state, scoped, currentUser) {
  const host = document.getElementById('section-host');
  const canTriage = currentUser.role === 'Admin' || currentUser.role === 'Security Analyst';

  host.innerHTML = `
    <div class="section-head">
      <h3>${MENU_TITLES.alerts}</h3>
      <p class="meta-line">Honeytoken alert intelligence</p>
    </div>
    ${makeSearchBar(
      'alerts-search',
      'Search by user/type/message',
      '<select id="alerts-filter" class="field-input"><option value="">All Severities</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option><option value="MEDIUM">Medium</option></select>'
    )}
    <div id="alerts-table-slot"></div>
  `;

  const renderRows = () => {
    const query = document.getElementById('alerts-search').value.trim().toLowerCase();
    const filter = document.getElementById('alerts-filter').value;

    const rows = scoped.alerts
      .filter((item) => {
        const searchable = `${item.username} ${item.type} ${item.message}`.toLowerCase();
        const byQuery = !query || searchable.includes(query);
        const bySeverity = !filter || item.severity === filter;
        return byQuery && bySeverity;
      })
      .map(
        (item) => `
        <tr data-alert-row="${item.id}">
          <td>${formatDate(item.timestamp)}</td>
          <td>${escapeHtml(item.username)}</td>
          <td>${escapeHtml(item.type)}</td>
          <td>${escapeHtml(item.message)}</td>
          <td>${statusBadge(item.severity)}</td>
          <td>
            ${
              canTriage
                ? `<select data-alert-status="${item.id}" class="field-input inline-select">
                     <option value="OPEN" ${item.status === 'OPEN' ? 'selected' : ''}>OPEN</option>
                     <option value="ACKNOWLEDGED" ${item.status === 'ACKNOWLEDGED' ? 'selected' : ''}>ACKNOWLEDGED</option>
                     <option value="RESOLVED" ${item.status === 'RESOLVED' ? 'selected' : ''}>RESOLVED</option>
                   </select>`
                : escapeHtml(item.status)
            }
          </td>
        </tr>
      `
      )
      .join('');

    document.getElementById('alerts-table-slot').innerHTML = makeTable(
      ['Timestamp', 'User', 'Type', 'Message', 'Severity', 'Workflow'],
      rows || '<tr><td colspan="6" class="meta-line">No alerts match filter.</td></tr>'
    );

    document.querySelectorAll('[data-alert-row]').forEach((row) => {
      row.addEventListener('click', () => {
        const alert = scoped.alerts.find((item) => String(item.id) === row.dataset.alertRow);
        if (!alert) return;

        const resource = getResourceById(state, alert.resourceId);
        showModal('Alert Detail', {
          User: alert.username,
          Type: alert.type,
          Severity: alert.severity,
          Status: alert.status,
          Message: alert.message,
          Resource: resource ? resource.name : 'Unknown',
          'Risk Impact': alert.riskImpact,
        });
      });
    });

    if (canTriage) {
      document.querySelectorAll('[data-alert-status]').forEach((select) => {
        select.addEventListener('click', (event) => event.stopPropagation());
        select.addEventListener('change', () => {
          const alertId = Number(select.dataset.alertStatus);
          const alert = state.alerts.find((item) => item.id === alertId);
          if (!alert) return;

          alert.status = select.value;
          addAudit(state, currentUser.username, 'UPDATE_ALERT_STATUS', `Alert #${alert.id}`, `status=${alert.status}`);

          const relatedIncident = state.incidents.find((item) => item.alertId === alert.id);
          if (relatedIncident && alert.status === 'RESOLVED') {
            relatedIncident.status = 'CLOSED';
          }

          saveState(state);
          initDashboardPage();
        });
      });
    }
  };

  document.getElementById('alerts-search').addEventListener('input', renderRows);
  document.getElementById('alerts-filter').addEventListener('change', renderRows);
  renderRows();
}

function renderLogsSection(scoped, currentUser) {
  const host = document.getElementById('section-host');
  const showType = canViewResourceType(currentUser);
  host.innerHTML = `
    <div class="section-head">
      <h3>${MENU_TITLES.logs}</h3>
      <p class="meta-line">Behavior telemetry stream</p>
    </div>
    ${makeSearchBar(
      'logs-search',
      'Search user/resource/ip',
      '<select id="logs-filter" class="field-input"><option value="">All Status</option><option value="Normal">Normal</option><option value="Suspicious">Suspicious</option></select>'
    )}
    ${
      showType
        ? '<div class="filter-row"><select id="logs-type-filter" class="field-input"><option value="">All Resource Types</option><option value="Normal">Normal</option><option value="Honeytoken">Honeytoken</option><option value="Critical">Critical</option></select><span class="meta-line inline-hint">Filter by honeytoken vs non-honeytoken resources</span></div>'
        : ''
    }
    <div id="logs-table-slot"></div>
  `;

  const renderRows = () => {
    const query = document.getElementById('logs-search').value.trim().toLowerCase();
    const filter = document.getElementById('logs-filter').value;
    const type = showType ? document.getElementById('logs-type-filter').value : '';

    const rows = scoped.logs
      .filter((item) => {
        const text = `${item.username} ${item.resource} ${item.ip} ${item.accessType}`.toLowerCase();
        const byQuery = !query || text.includes(query);
        const byStatus = !filter || item.status === filter;
        const byType = !type || item.resourceType === type;
        return byQuery && byStatus && byType;
      })
      .map(
        (item) => `
        <tr data-log-row="${item.id}">
          <td>${formatDate(item.timestamp)}</td>
          <td>${escapeHtml(item.username)}</td>
          <td>${escapeHtml(item.resource)}</td>
          ${showType ? `<td>${resourceTypeBadge(item.resourceType)}</td>` : ''}
          <td>${escapeHtml(item.ip)}</td>
          <td>${escapeHtml(item.accessType)}</td>
          <td>${statusBadge(item.status)}</td>
        </tr>
      `
      )
      .join('');

    document.getElementById('logs-table-slot').innerHTML = makeTable(
      showType
        ? ['Timestamp', 'User', 'Resource', 'Resource Type', 'IP', 'Access Type', 'Status']
        : ['Timestamp', 'User', 'Resource', 'IP', 'Access Type', 'Status'],
      rows || `<tr><td colspan="${showType ? 7 : 6}" class="meta-line">No logs found.</td></tr>`
    );

    document.querySelectorAll('[data-log-row]').forEach((row) => {
      row.addEventListener('click', () => {
        const log = scoped.logs.find((item) => String(item.id) === row.dataset.logRow);
        if (!log) return;
        showModal('Access Log Detail', {
          User: log.username,
          Resource: log.resource,
          ...(showType ? { 'Resource Type': log.resourceType } : {}),
          IP: log.ip,
          'Access Type': log.accessType,
          Status: log.status,
          Timestamp: formatDate(log.timestamp),
        });
      });
    });
  };

  document.getElementById('logs-search').addEventListener('input', renderRows);
  document.getElementById('logs-filter').addEventListener('change', renderRows);
  if (showType) {
    document.getElementById('logs-type-filter').addEventListener('change', renderRows);
  }
  renderRows();
}

function renderRiskSection(state, scoped, currentUser) {
  const host = document.getElementById('section-host');

  let users = scoped.users;
  if (currentUser.role === 'Employee') {
    users = users.filter((item) => item.id === currentUser.id);
  }

  const rows = users
    .map(
      (user) => `
      <tr>
        <td>${escapeHtml(user.username)}</td>
        <td>${escapeHtml(user.role)}</td>
        <td>${getRiskScore(state, user.id)}</td>
        <td>${statusBadge(getRiskScore(state, user.id) >= 30 ? 'Suspicious' : 'Normal')}</td>
      </tr>
    `
    )
    .join('');

  host.innerHTML = `
    <div class="section-head">
      <h3>${currentUser.role === 'Employee' ? MENU_TITLES['my-risk'] : MENU_TITLES.risk}</h3>
      <p class="meta-line">Threat exposure scoring</p>
    </div>
    <div class="split-grid">
      <article class="inner-card glass-card">
        ${makeTable(['User', 'Role', 'Risk Score', 'Status'], rows)}
      </article>
      <article class="inner-card glass-card">
        <h4>Risk Score Trend</h4>
        <canvas id="risk-chart" height="220"></canvas>
      </article>
    </div>
  `;

  renderRiskChart(state, scoped, currentUser);
}

function renderAuditSection(scoped) {
  const host = document.getElementById('section-host');
  const rows = scoped.auditTrail
    .map(
      (item) => `
      <tr>
        <td>${formatDate(item.timestamp)}</td>
        <td>${escapeHtml(item.actor)}</td>
        <td>${escapeHtml(item.action)}</td>
        <td>${escapeHtml(item.target)}</td>
        <td>${escapeHtml(item.details)}</td>
      </tr>
    `
    )
    .join('');

  host.innerHTML = `
    <div class="section-head">
      <h3>${MENU_TITLES.audit}</h3>
      <p class="meta-line">Immutable operation records</p>
    </div>
    ${makeTable(
      ['Timestamp', 'Actor', 'Action', 'Target', 'Details'],
      rows || '<tr><td colspan="5" class="meta-line">No audit records.</td></tr>'
    )}
  `;
}

function renderIncidentsSection(state, scoped, currentUser) {
  const canAssign = currentUser.role !== 'Employee';
  const host = document.getElementById('section-host');

  host.innerHTML = `
    <div class="section-head">
      <h3>${MENU_TITLES.incidents}</h3>
      <p class="meta-line">Case management for suspicious events</p>
    </div>
    ${makeSearchBar(
      'incident-search',
      'Search title/owner/priority',
      '<select id="incident-filter" class="field-input"><option value="">All Status</option><option value="OPEN">OPEN</option><option value="IN_PROGRESS">IN_PROGRESS</option><option value="CLOSED">CLOSED</option></select>'
    )}
    <div id="incident-table-slot"></div>
  `;

  const renderRows = () => {
    const query = document.getElementById('incident-search').value.trim().toLowerCase();
    const filter = document.getElementById('incident-filter').value;

    const rows = scoped.incidents
      .filter((item) => {
        const text = `${item.title} ${item.owner} ${item.priority}`.toLowerCase();
        const byQuery = !query || text.includes(query);
        const byStatus = !filter || item.status === filter;
        return byQuery && byStatus;
      })
      .map(
        (item) => `
        <tr>
          <td>${formatDate(item.createdAt)}</td>
          <td>${escapeHtml(item.title)}</td>
          <td>${escapeHtml(item.priority)}</td>
          <td>${
            canAssign
              ? `<select data-incident-status="${item.id}" class="field-input inline-select">
                   <option value="OPEN" ${item.status === 'OPEN' ? 'selected' : ''}>OPEN</option>
                   <option value="IN_PROGRESS" ${item.status === 'IN_PROGRESS' ? 'selected' : ''}>IN_PROGRESS</option>
                   <option value="CLOSED" ${item.status === 'CLOSED' ? 'selected' : ''}>CLOSED</option>
                 </select>`
              : escapeHtml(item.status)
          }</td>
          <td>${
            canAssign
              ? `<input data-incident-owner="${item.id}" class="field-input inline-input" value="${escapeHtml(item.owner)}" />`
              : escapeHtml(item.owner)
          }</td>
        </tr>
      `
      )
      .join('');

    document.getElementById('incident-table-slot').innerHTML = makeTable(
      ['Created', 'Incident', 'Priority', 'Status', 'Owner'],
      rows || '<tr><td colspan="5" class="meta-line">No incidents match filter.</td></tr>'
    );

    if (canAssign) {
      document.querySelectorAll('[data-incident-status]').forEach((select) => {
        select.addEventListener('change', () => {
          const incidentId = Number(select.dataset.incidentStatus);
          const target = state.incidents.find((item) => item.id === incidentId);
          if (!target) return;

          target.status = select.value;
          addAudit(state, currentUser.username, 'UPDATE_INCIDENT_STATUS', `Incident #${incidentId}`, `status=${target.status}`);
          saveState(state);
          initDashboardPage();
        });
      });

      document.querySelectorAll('[data-incident-owner]').forEach((input) => {
        input.addEventListener('blur', () => {
          const incidentId = Number(input.dataset.incidentOwner);
          const target = state.incidents.find((item) => item.id === incidentId);
          if (!target) return;

          target.owner = input.value.trim() || 'unassigned';
          addAudit(state, currentUser.username, 'ASSIGN_INCIDENT_OWNER', `Incident #${incidentId}`, `owner=${target.owner}`);
          saveState(state);
        });
      });
    }
  };

  document.getElementById('incident-search').addEventListener('input', renderRows);
  document.getElementById('incident-filter').addEventListener('change', renderRows);
  renderRows();
}

function renderMyActivitySection(state, scoped, currentUser) {
  renderLogsSection(scoped, currentUser);
  document.querySelector('#section-host .section-head h3').textContent = MENU_TITLES['my-activity'];
  document.querySelector('#section-host .section-head p').textContent = `Employee account: ${currentUser.username}`;
  const score = getRiskScore(state, currentUser.id);
  const chip = document.createElement('div');
  chip.className = 'notice-chip';
  chip.innerHTML = `Current Risk Score: <strong>${score}</strong>`;
  document.getElementById('section-host').prepend(chip);
}

function renderEmployeeResourcesSection(state, currentUser, scoped) {
  const host = document.getElementById('section-host');
  const activeResources = scoped.resources.filter((resource) => resource.isActive);

  host.innerHTML = `
    <div class="section-head">
      <h3>${MENU_TITLES.resources}</h3>
      <p class="meta-line">Simulate approved resource operations</p>
    </div>
    <div class="resource-grid" id="employee-resource-grid"></div>
    <p id="resource-feedback" class="form-message">Choose a resource and action.</p>
  `;

  const grid = document.getElementById('employee-resource-grid');
  grid.innerHTML = activeResources
    .map(
      (resource) => `
      <article class="resource-card">
        <div class="resource-head">
          <h4>${escapeHtml(resource.name)}</h4>
          <span class="tag tag-normal">Protected</span>
        </div>
        <p class="meta-line">${escapeHtml(resource.category)} · ${escapeHtml(resource.ownerDept)}</p>
        <div class="resource-actions">
          <button type="button" class="resource-btn" data-resource-id="${resource.id}" data-access="READ">Read</button>
          <button type="button" class="resource-btn" data-resource-id="${resource.id}" data-access="WRITE">Write</button>
          <button type="button" class="resource-btn" data-resource-id="${resource.id}" data-access="EXPORT">Export</button>
        </div>
      </article>
    `
    )
    .join('');

  grid.querySelectorAll('[data-resource-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const resourceId = Number(button.dataset.resourceId);
      const resource = state.resources.find((item) => item.id === resourceId);
      if (!resource) return;

      simulateResourceAccess(state, currentUser, resource, button.dataset.access, '10.0.1.18');
      saveState(state);

      document.getElementById('resource-feedback').textContent = `${resource.name} access recorded successfully.`;
      initDashboardPage();
    });
  });
}

function initLoginPage() {
  roleGuard('login');

  const flash = consumeFlash();
  if (flash) {
    showAuthMessage(flash, false);
    showToast(flash, 'success');
  }

  const form = document.getElementById('login-form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
      showAuthMessage('Username and password are required.', true);
      return;
    }

    const state = getState();
    const user = state.users.find((item) => item.username === username);

    if (!user || user.password !== password) {
      showAuthMessage('Invalid credentials.', true);
      return;
    }

    if (user.locked) {
      showAuthMessage('Account is locked by admin.', true);
      return;
    }

    setCurrentUser({ id: user.id, username: user.username, role: user.role });
    setFlash(`Welcome ${user.username}. Access profile: ${user.role}.`);
    window.location.href = 'dashboard.html';
  });
}

function initRegisterPage() {
  roleGuard('register');

  const form = document.getElementById('register-form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;

    if (!username || !password || !role) {
      showAuthMessage('All fields are mandatory.', true);
      return;
    }

    if (password.length < 6) {
      showAuthMessage('Password must be at least 6 characters.', true);
      return;
    }

    const state = getState();
    const exists = state.users.some((user) => user.username.toLowerCase() === username.toLowerCase());
    if (exists) {
      showAuthMessage('Username already exists.', true);
      return;
    }

    const id = Math.max(...state.users.map((user) => user.id)) + 1;
    state.users.push({ id, username, password, role, locked: false });
    state.riskHistory[id] = [{ timestamp: new Date().toISOString(), score: 8, delta: 8, reason: 'New account baseline' }];
    addAudit(state, 'system', 'REGISTER_USER', username, `role=${role}`);
    saveState(state);

    setFlash('Registration successful. Please login.');
    window.location.href = 'login.html';
  });
}

function initDashboardPage() {
  const user = roleGuard('dashboard');
  if (!user) return;

  const state = getState();
  const account = state.users.find((item) => item.id === user.id);
  if (!account || account.locked) {
    localStorage.removeItem(SESSION_KEY);
    setFlash('Account unavailable or locked.');
    window.location.href = 'login.html';
    return;
  }

  const scoped = getScopedData(state, user);

  document.getElementById('header-username').textContent = user.username;
  document.getElementById('header-role').textContent = user.role;

  /* Update topbar breadcrumb based on active section */
  const titleEl = document.querySelector('.topbar .panel-title');
  const breadEl = document.querySelector('.topbar .meta-line');
  if (titleEl) titleEl.textContent = MENU_TITLES[activeSection] || 'Dashboard';
  if (breadEl) breadEl.textContent = `Home / ${(MENU_TITLES[activeSection] || 'Overview').toUpperCase()}`;

  const flash = consumeFlash();
  if (flash) showToast(flash, 'success');

  renderMenu(user.role);
  renderStats(state, scoped, user);

  const allowed = ROLE_MENU[user.role] || ['overview'];
  if (!allowed.includes(activeSection)) activeSection = 'overview';

  if (activeSection === 'overview') renderOverviewSection(state, scoped, user);
  if (activeSection === 'users') renderUsersSection(state);
  if (activeSection === 'resources-catalog') renderResourceCatalogSection(state, scoped, user);
  if (activeSection === 'alerts') renderAlertsSection(state, scoped, user);
  if (activeSection === 'logs') renderLogsSection(scoped, user);
  if (activeSection === 'risk' || activeSection === 'my-risk') renderRiskSection(state, scoped, user);
  if (activeSection === 'audit') renderAuditSection(scoped);
  if (activeSection === 'incidents') renderIncidentsSection(state, scoped, user);
  if (activeSection === 'my-activity') renderMyActivitySection(state, scoped, user);
  if (activeSection === 'resources') renderEmployeeResourcesSection(state, user, scoped);

  document.getElementById('logout-btn').onclick = () => {
    localStorage.removeItem(SESSION_KEY);
    setFlash('Session ended.');
    window.location.href = 'login.html';
  };

  bindModal();
}

function init() {
  const page = document.body.dataset.page;
  getState();

  if (page === 'login') initLoginPage();
  if (page === 'register') initRegisterPage();
  if (page === 'dashboard') initDashboardPage();
}

document.addEventListener('DOMContentLoaded', init);
