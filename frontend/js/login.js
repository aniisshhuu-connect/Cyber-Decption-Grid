import { login } from './api.js';

function setMessage(message, isError = false) {
  const el = document.getElementById('login-message');
  el.textContent = message;
  el.style.color = isError ? '#ff7abf' : '#adff00';
}

async function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const ipAddress = document.getElementById('ip-address').value.trim() || '127.0.0.1';

  if (!username || !password) {
    setMessage('Username and password are required.', true);
    return;
  }

  try {
    const response = await login({
      username,
      password,
      ip_address: ipAddress,
    });

    localStorage.setItem('sentinelx_user', JSON.stringify(response.user));
    setMessage('Access granted. Redirecting to dashboard...');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 650);
  } catch (error) {
    setMessage(error.message || 'Login failed', true);
  }
}

document.getElementById('login-form').addEventListener('submit', handleLogin);
