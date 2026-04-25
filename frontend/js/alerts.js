import { getAlerts } from './api.js';
import { formatDate, openModal, setActiveNav, statusBadge } from './common.js';

function severityClass(severity) {
  const value = String(severity || '').toLowerCase();
  if (value === 'critical') return 'critical';
  return '';
}

function renderAlerts(alerts) {
  const list = document.getElementById('alerts-list');
  const tableBody = document.getElementById('alerts-table-body');

  list.innerHTML = alerts
    .map(
      (alert) => `
      <article class="alert-item ${severityClass(alert.severity)}" data-alert-id="${alert.alert_id}">
        <div class="section-head">
          <h3>${alert.alert_type}</h3>
          ${statusBadge({ status: alert.severity === 'CRITICAL' ? 'Critical' : alert.status || 'Open' })}
        </div>
        <p>${alert.message}</p>
        <p class="meta" style="margin-top:8px;">${formatDate(alert.created_at)} | User ${alert.username || alert.user_id}</p>
      </article>
    `
    )
    .join('');

  tableBody.innerHTML = alerts
    .map(
      (alert) => `
      <tr data-alert-id="${alert.alert_id}">
        <td>${formatDate(alert.created_at)}</td>
        <td>${alert.username || '-'}</td>
        <td>${alert.alert_type}</td>
        <td>${alert.message}</td>
        <td>${statusBadge({ status: alert.severity === 'CRITICAL' ? 'Critical' : alert.status || 'Open' })}</td>
      </tr>
    `
    )
    .join('');

  [...list.querySelectorAll('article'), ...tableBody.querySelectorAll('tr')].forEach((element) => {
    element.addEventListener('click', () => {
      const alertId = element.dataset.alertId;
      const selected = alerts.find((item) => String(item.alert_id) === alertId);
      if (selected) {
        openModal({
          username: selected.username,
          user_id: selected.user_id,
          ip_address: '-',
          created_at: selected.created_at,
          resource_name: selected.alert_type,
          access_type: selected.status,
          is_honeytoken: true,
        });
      }
    });
  });
}

async function init() {
  setActiveNav('alerts');
  const response = await getAlerts();
  const alerts = response.alerts || [];
  document.getElementById('total-alerts').textContent = alerts.length;
  document.getElementById('critical-alerts').textContent = alerts.filter((a) => a.severity === 'CRITICAL').length;
  renderAlerts(alerts);
}

init().catch((error) => {
  document.getElementById('error-text').textContent = error.message;
  document.getElementById('error-text').classList.remove('hidden');
});
