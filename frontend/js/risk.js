import { getUserRisk, deleteUser } from './api.js';
import { formatDate, parseQueryParam, setActiveNav, statusBadge } from './common.js';

let riskChart;

let currentLoadedUserId = null;

function riskLevel(score) {
  if (score >= 70) return 'Critical';
  if (score >= 40) return 'Suspicious';
  return 'Normal';
}

function renderHistory(history) {
  const body = document.getElementById('risk-history-body');
  body.innerHTML = history
    .map(
      (item) => `
      <tr>
        <td>${formatDate(item.event_time)}</td>
        <td>${item.old_score}</td>
        <td>${item.points_added}</td>
        <td>${item.new_score}</td>
        <td>${item.reason}</td>
      </tr>
    `
    )
    .join('');
}

function renderChart(history) {
  const ctx = document.getElementById('risk-user-chart');
  const sorted = [...history].sort((a, b) => new Date(a.event_time) - new Date(b.event_time));

  if (riskChart) riskChart.destroy();

  riskChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: sorted.map((item) => new Date(item.event_time).toLocaleString()),
      datasets: [
        {
          label: 'Risk Score',
          data: sorted.map((item) => Number(item.new_score)),
          borderColor: '#ff00e5',
          backgroundColor: 'rgba(255,0,229,0.2)',
          pointBackgroundColor: '#00f2ff',
          fill: true,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#f7f9fb' } },
      },
      scales: {
        x: { ticks: { color: '#f7f9fb' }, grid: { color: 'rgba(255,255,255,0.08)' } },
        y: { ticks: { color: '#f7f9fb' }, grid: { color: 'rgba(255,255,255,0.08)' } },
      },
    },
  });
}

async function fetchAndRender(userId) {
  const payload = await getUserRisk(userId);
  const user = payload.user;
  const history = payload.risk_history || [];

  document.getElementById('user-id').textContent = user.user_id;
  document.getElementById('user-name').textContent = user.username;
  document.getElementById('risk-score').textContent = Number(user.risk_score).toFixed(1);
  document.getElementById('history-count').textContent = history.length;
  document.getElementById('risk-level').innerHTML = statusBadge({ status: riskLevel(Number(user.risk_score)) });

  currentLoadedUserId = user.user_id;
  
  const currentUser = JSON.parse(localStorage.getItem('sentinelx_user') || '{}');
  const delBtn = document.getElementById('delete-user-btn');
  // Check if logged in user is admin (role_id === 1)
  if (delBtn && currentUser.role_id === 1) {
    delBtn.style.display = 'inline-block';
  }

  renderHistory(history);
  renderChart(history);
}

function bindEvents() {
  document.getElementById('load-user-btn').addEventListener('click', () => {
    const value = document.getElementById('user-input').value.trim();
    if (!value) return;
    fetchAndRender(value).catch((error) => {
      document.getElementById('error-text').textContent = error.message;
      document.getElementById('error-text').classList.remove('hidden');
    });
  });

  const delBtn = document.getElementById('delete-user-btn');
  if (delBtn) {
    delBtn.addEventListener('click', async () => {
      if (!currentLoadedUserId) return;
      if (!confirm('Are you sure you want to delete this user and ALL their history? This cannot be undone.')) return;
      try {
        await deleteUser(currentLoadedUserId);
        alert('User deleted successfully.');
        window.location.href = 'dashboard.html';
      } catch (err) {
        alert('Error deleting user: ' + err.message);
      }
    });
  }
}

async function init() {
  setActiveNav('risk');
  bindEvents();

  const queryUserId = parseQueryParam('user_id') || '3';
  document.getElementById('user-input').value = queryUserId;
  await fetchAndRender(queryUserId);
}

init().catch((error) => {
  document.getElementById('error-text').textContent = error.message;
  document.getElementById('error-text').classList.remove('hidden');
});
