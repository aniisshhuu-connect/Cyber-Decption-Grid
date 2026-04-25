import { getLogs } from './api.js';
import { downloadCsv, formatDate, openModal, setActiveNav, statusBadge, toCsv } from './common.js';

let allLogs = [];

function applyFilters() {
  const search = document.getElementById('logs-search').value.toLowerCase();
  const statusFilter = document.getElementById('status-filter').value;
  const typeFilter = document.getElementById('type-filter').value;

  const filtered = allLogs.filter((log) => {
    const text = `${log.username} ${log.resource_name} ${log.ip_address}`.toLowerCase();
    const matchesSearch = !search || text.includes(search);
    const matchesStatus = !statusFilter || String(Number(log.is_honeytoken) === 1 ? 'Suspicious' : 'Normal') === statusFilter;
    const matchesType = !typeFilter || String(log.access_type).toUpperCase() === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  renderTable(filtered);
}

function renderTable(rows) {
  const body = document.getElementById('logs-table-body');
  body.innerHTML = rows
    .map(
      (row) => `
      <tr data-log-id="${row.log_id}">
        <td>${formatDate(row.access_time)}</td>
        <td>${row.username || '-'}</td>
        <td>${row.resource_name || '-'}${row.token_id ? ` / T-${row.token_id}` : ''}</td>
        <td>${row.ip_address || '-'}</td>
        <td>${row.access_type || '-'}</td>
        <td>${statusBadge({ status: Number(row.is_honeytoken) ? 'Suspicious' : 'Normal' })}</td>
      </tr>
    `
    )
    .join('');

  body.querySelectorAll('tr').forEach((tr) => {
    tr.addEventListener('click', () => {
      const selected = rows.find((row) => String(row.log_id) === tr.dataset.logId);
      if (selected) openModal(selected);
    });
  });
}

function bindEvents() {
  ['logs-search', 'status-filter', 'type-filter'].forEach((id) => {
    document.getElementById(id).addEventListener('input', applyFilters);
    document.getElementById(id).addEventListener('change', applyFilters);
  });

  document.getElementById('export-logs-btn').addEventListener('click', () => {
    const csv = toCsv(allLogs, [
      { header: 'log_id', key: 'log_id' },
      { header: 'user_id', key: 'user_id' },
      { header: 'username', key: 'username' },
      { header: 'resource_name', key: 'resource_name' },
      { header: 'ip_address', key: 'ip_address' },
      { header: 'access_type', key: 'access_type' },
      { header: 'is_honeytoken', key: 'is_honeytoken' },
      { header: 'access_time', key: 'access_time' },
    ]);
    downloadCsv('sentinelx_access_logs.csv', csv);
  });
}

async function init() {
  setActiveNav('logs');
  bindEvents();

  const response = await getLogs(800);
  allLogs = response.logs || [];
  document.getElementById('logs-count').textContent = allLogs.length;
  document.getElementById('suspicious-count').textContent = allLogs.filter((item) => Number(item.is_honeytoken) === 1).length;
  renderTable(allLogs);
}

init().catch((error) => {
  document.getElementById('error-text').textContent = error.message;
  document.getElementById('error-text').classList.remove('hidden');
});
