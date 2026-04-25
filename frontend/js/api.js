import { dummyAlerts, dummyLogs, dummyRiskUsers } from './dummy-data.js';

const API_BASE = window.SENTINELX_API_BASE || '';

async function request(path, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function login(payload) {
  try {
    return await request('/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (_error) {
    if (payload.username && payload.password) {
      return {
        message: 'Login successful (dummy mode)',
        user: {
          user_id: 3,
          username: payload.username,
          role_id: 2,
          department_id: 1,
          risk_score: 18,
        },
      };
    }
    throw _error;
  }
}

export async function getAlerts() {
  try {
    return await request('/alerts');
  } catch (_error) {
    return { count: dummyAlerts.length, alerts: dummyAlerts };
  }
}

export async function getLogs(limit = 250) {
  try {
    return await request(`/logs?limit=${encodeURIComponent(limit)}`);
  } catch (_error) {
    return { count: dummyLogs.length, logs: dummyLogs };
  }
}

export async function getUserRisk(userId) {
  try {
    return await request(`/user-risk/${encodeURIComponent(userId)}`);
  } catch (_error) {
    const fallback = dummyRiskUsers[userId] || dummyRiskUsers[3];
    return {
      user: fallback.user,
      risk_history_count: fallback.risk_history.length,
      risk_history: fallback.risk_history,
    };
  }
}

export async function deleteUser(userId) {
  return await request(`/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
}

export async function deleteResource(resourceId) {
  return await request(`/resources/${encodeURIComponent(resourceId)}`, {
    method: 'DELETE',
  });
}
