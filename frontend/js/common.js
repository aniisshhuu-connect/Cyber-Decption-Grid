export function setActiveNav(navId) {
  document.querySelectorAll('[data-nav]').forEach((link) => {
    link.classList.toggle('active', link.dataset.nav === navId);
  });
}

export function formatDate(isoDate) {
  if (!isoDate) return '-';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

export function normalizeStatus(entry) {
  const status = entry.status || (entry.is_honeytoken ? 'Suspicious' : 'Normal');
  const normalized = String(status).toLowerCase();

  if (['critical', 'suspicious', 'high'].includes(normalized)) {
    return { text: normalized === 'high' ? 'Suspicious' : status, className: 'status-suspicious' };
  }
  if (normalized === 'open') {
    return { text: status, className: 'status-open' };
  }
  return { text: status, className: 'status-normal' };
}

export function statusBadge(statusLike) {
  const status = normalizeStatus(statusLike);
  return `<span class="status-badge ${status.className}">${status.text}</span>`;
}

export function ensureModal() {
  let modal = document.getElementById('detail-modal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'detail-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-card glass-card">
      <div class="section-head">
        <h3>Transaction Detail</h3>
        <span class="meta">SentinelX Investigation Context</span>
      </div>
      <div id="modal-body" class="metric-grid"></div>
      <div class="modal-actions" style="justify-content: space-between;">
        <button type="button" class="button" id="modal-delete-resource" style="background:#ff3333; color:white; border:none; display:none;">Delete Resource</button>
        <div>
          <button type="button" class="button" id="modal-close">Close</button>
          <button type="button" class="button button-magenta" id="modal-investigate">Investigate</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('#modal-close').addEventListener('click', () => closeModal());
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });
  modal.querySelector('#modal-investigate').addEventListener('click', () => {
    const userId = modal.dataset.userId;
    if (userId) {
      window.location.href = `user-risk.html?user_id=${encodeURIComponent(userId)}`;
    }
  });
  modal.querySelector('#modal-delete-resource').addEventListener('click', async () => {
    const resId = modal.dataset.resourceId;
    if (resId && confirm('Delete this resource and all associated logs/honeytokens?')) {
      try {
        const { deleteResource } = await import('./api.js');
        await deleteResource(resId);
        alert('Resource deleted. Please refresh.');
        closeModal();
        window.location.reload();
      } catch(e) {
        alert('Error: ' + e.message);
      }
    }
  });

  return modal;
}

export function openModal(data) {
  const modal = ensureModal();
  const body = modal.querySelector('#modal-body');
  body.innerHTML = [
    ['User', data.username || data.user || 'Unknown'],
    ['IP Address', data.ip_address || '-'],
    ['Timestamp', formatDate(data.access_time || data.created_at)],
    ['Resource', data.resource_name || data.resource || '-'],
    ['Access Type', data.access_type || '-'],
    ['Risk Impact', data.is_honeytoken ? 'Honeytoken Triggered' : 'Normal Access'],
  ]
    .map(
      ([label, value]) =>
        `<div class="metric"><div class="metric-label">${label}</div><div class="metric-value" style="font-size:20px;">${value}</div></div>`
    )
    .join('');

  modal.dataset.userId = data.user_id || '';
  Object.assign(modal.dataset, { resourceId: data.resource_id || '' });
  
  const currentUser = JSON.parse(localStorage.getItem('sentinelx_user') || '{}');
  const delBtn = modal.querySelector('#modal-delete-resource');
  if (delBtn) {
    delBtn.style.display = (data.resource_id && currentUser.role_id === 1) ? 'inline-block' : 'none';
  }

  modal.classList.add('open');
}

export function closeModal() {
  const modal = document.getElementById('detail-modal');
  if (modal) {
    modal.classList.remove('open');
  }
}

export function parseQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

export function toCsv(rows, columns) {
  const csvRows = [columns.map((col) => col.header).join(',')];
  rows.forEach((row) => {
    const values = columns.map((col) => {
      const raw = row[col.key] ?? '';
      const escaped = String(raw).replaceAll('"', '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  });
  return csvRows.join('\n');
}

export function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
