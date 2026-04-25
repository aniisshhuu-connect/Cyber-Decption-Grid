import { getAlerts, getLogs } from './api.js';
import { downloadCsv, formatDate, openModal, setActiveNav, statusBadge, toCsv } from './common.js';

let logsData = [];
let alertsData = [];
let riskTrendChart;
let alertsChart;

function filterLogs() {
  const search = document.getElementById('search-input').value.trim().toLowerCase();
  const date = document.getElementById('date-input').value;
  const accessType = document.getElementById('access-type-filter').value;
  const threshold = Number(document.getElementById('risk-threshold').value || 0);

  const filtered = logsData.filter((log) => {
    const rowText = `${log.username} ${log.resource_name} ${log.ip_address}`.toLowerCase();
    const bySearch = !search || rowText.includes(search);
    const byType = !accessType || String(log.access_type || '').toUpperCase() === accessType;
    const byDate = !date || String(log.access_time || '').startsWith(date);
    const byRisk = (log.is_honeytoken ? 100 : 0) >= threshold;
    return bySearch && byType && byDate && byRisk;
  });

  renderLogTable(filtered);
  renderSidebar(filtered, alertsData);
}

function renderLogTable(rows) {
  const tbody = document.getElementById('log-table-body');
  tbody.innerHTML = rows
    .map(
      (row) => `
      <tr data-log-id="${row.log_id}">
        <td>${formatDate(row.access_time)}</td>
        <td>${row.username || '-'}</td>
        <td>${row.resource_name || '-'}${row.token_id ? ` / T-${row.token_id}` : ''}</td>
        <td>${row.ip_address || '-'}</td>
        <td>${row.access_type || '-'}</td>
        <td>${statusBadge({ status: row.is_honeytoken ? 'Suspicious' : 'Normal' })}</td>
      </tr>
    `
    )
    .join('');

  tbody.querySelectorAll('tr').forEach((tr) => {
    tr.addEventListener('click', () => {
      const row = rows.find((item) => String(item.log_id) === tr.dataset.logId);
      if (row) openModal(row);
    });
  });
}

function renderSidebar(logs, alerts) {
  const suspiciousLogs = logs.filter((log) => Number(log.is_honeytoken) === 1);
  const uniqueRiskUsers = new Set(suspiciousLogs.map((log) => log.user_id)).size;

  document.getElementById('metric-alerts').textContent = alerts.length;
  document.getElementById('metric-logs').textContent = logs.length;
  document.getElementById('metric-users').textContent = uniqueRiskUsers;

  const riskRatio = logs.length ? Math.round((suspiciousLogs.length / logs.length) * 100) : 0;
  document.getElementById('risk-progress').style.width = `${riskRatio}%`;
  document.getElementById('risk-progress-label').textContent = `${riskRatio}% suspicious activity ratio`;

  const topUsersContainer = document.getElementById('top-users');
  const userCounts = suspiciousLogs.reduce((acc, log) => {
    const key = log.username || `User-${log.user_id}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const topUsers = Object.entries(userCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  topUsersContainer.innerHTML = topUsers.length
    ? topUsers
        .map(
          ([name, count]) => `
      <div class="mini-item">
        <span>${name}</span>
        ${statusBadge({ status: 'Suspicious' })}
      </div>
    `
        )
        .join('')
    : '<div class="mini-item"><span>No elevated users</span><span class="meta">0</span></div>';
}

function renderCharts(logs, alerts) {
  const riskCtx = document.getElementById('risk-trend-chart');
  const alertsCtx = document.getElementById('alerts-chart');

  const sortedLogs = [...logs].sort((a, b) => new Date(a.access_time) - new Date(b.access_time));
  let runningRisk = 0;
  const riskLabels = [];
  const riskData = [];

  sortedLogs.forEach((log) => {
    runningRisk += Number(log.is_honeytoken) ? 12 : 1;
    riskLabels.push(new Date(log.access_time).toLocaleTimeString());
    riskData.push(runningRisk);
  });

  const alertsByDate = alerts.reduce((acc, alert) => {
    const key = new Date(alert.created_at).toLocaleDateString();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  if (riskTrendChart) riskTrendChart.destroy();
  if (alertsChart) alertsChart.destroy();

  riskTrendChart = new Chart(riskCtx, {
    type: 'line',
    data: {
      labels: riskLabels,
      datasets: [
        {
          label: 'Risk Trend',
          data: riskData,
          borderColor: '#00f2ff',
          pointBackgroundColor: '#ff00e5',
          backgroundColor: 'rgba(0,242,255,0.16)',
          tension: 0.35,
          fill: true,
        },
      ],
    },
    options: chartOptions('Risk Score Delta'),
  });

  alertsChart = new Chart(alertsCtx, {
    type: 'bar',
    data: {
      labels: Object.keys(alertsByDate),
      datasets: [
        {
          label: 'Alerts',
          data: Object.values(alertsByDate),
          backgroundColor: ['rgba(255,0,229,0.5)', 'rgba(0,242,255,0.5)', 'rgba(173,255,0,0.5)'],
          borderColor: '#ff00e5',
          borderWidth: 1,
        },
      ],
    },
    options: chartOptions('Alerts Over Time'),
  });
}

function chartOptions(title) {
  return {
    responsive: true,
    plugins: {
      legend: {
        labels: { color: '#f7f9fb' },
      },
      title: {
        display: true,
        text: title,
        color: '#f7f9fb',
      },
    },
    scales: {
      x: {
        ticks: { color: '#f7f9fb' },
        grid: { color: 'rgba(255,255,255,0.08)' },
      },
      y: {
        ticks: { color: '#f7f9fb' },
        grid: { color: 'rgba(255,255,255,0.08)' },
      },
    },
  };
}

function bindEvents() {
  ['search-input', 'date-input', 'access-type-filter', 'risk-threshold'].forEach((id) => {
    document.getElementById(id).addEventListener('input', filterLogs);
    document.getElementById(id).addEventListener('change', filterLogs);
  });

  document.getElementById('risk-threshold').addEventListener('input', (event) => {
    document.getElementById('risk-value').textContent = `${event.target.value}%`;
  });

  document.getElementById('export-btn').addEventListener('click', () => {
    const csv = toCsv(logsData, [
      { header: 'log_id', key: 'log_id' },
      { header: 'username', key: 'username' },
      { header: 'resource_name', key: 'resource_name' },
      { header: 'ip_address', key: 'ip_address' },
      { header: 'access_type', key: 'access_type' },
      { header: 'is_honeytoken', key: 'is_honeytoken' },
      { header: 'access_time', key: 'access_time' },
    ]);
    downloadCsv('sentinelx_logs_export.csv', csv);
  });
}

async function init() {
  setActiveNav('dashboard');
  bindEvents();

  const [logsRes, alertsRes] = await Promise.all([getLogs(500), getAlerts()]);
  logsData = logsRes.logs || [];
  alertsData = alertsRes.alerts || [];

  renderLogTable(logsData);
  renderSidebar(logsData, alertsData);
  renderCharts(logsData, alertsData);
}

init().catch((error) => {
  document.getElementById('error-text').textContent = error.message;
  document.getElementById('error-text').classList.remove('hidden');
});
