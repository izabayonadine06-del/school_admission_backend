export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export async function authRequest(endpoint, payload) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/auth/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Cannot reach the school server. Check that the backend is running and try again.');
  }

  const result = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = Array.isArray(result.details) ? `: ${result.details.join(', ')}` : '';
    throw new Error(`${result.error || 'Authentication failed'}${details}`);
  }
  return result;
}

export function readSession() {
  try {
    return JSON.parse(localStorage.getItem('btr.session') || 'null');
  } catch {
    localStorage.removeItem('btr.session');
    return null;
  }
}

export function saveSession({ user, token }) {
  localStorage.setItem('btr.session', JSON.stringify({ user, token }));
}

export function clearSession() {
  localStorage.removeItem('btr.session');
}

export async function logout() {
  const session = readSession();
  clearSession();
  if (!session?.token) return;
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.token}` },
    });
  } catch {
    // The local session is cleared even if the server cannot be reached.
  }
}

export function goToRolePage(user) {
  const destination = user.role === 'HEADTEACHER' ? '/headteacher' : '/parents';
  window.history.pushState({}, '', destination);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
