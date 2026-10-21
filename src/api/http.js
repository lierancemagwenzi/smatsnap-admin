// Fetch wrapper for the SmatSnap API. Mirrors the mobile app's interceptor: on a 401 it
// refreshes the session once (shared across concurrent requests), saves the rotated tokens
// and retries; if the refresh fails the session is cleared and the router sends you to login.
const BASE = (import.meta.env.VITE_API_BASE_URL || 'https://smatsnap-api.strima.co.za/api').replace(/\/+$/, '');
const KEYS = { token: 'smatsnap_admin_token', refresh: 'smatsnap_admin_refresh' };

const storage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { value ? localStorage.setItem(key, value) : localStorage.removeItem(key); } catch { /* private mode */ } },
};

export const tokens = {
  get access() { return storage.get(KEYS.token); },
  get refresh() { return storage.get(KEYS.refresh); },
  save({ token, refresh_token }) {
    storage.set(KEYS.token, token);
    storage.set(KEYS.refresh, refresh_token);
  },
  clear() {
    storage.set(KEYS.token, null);
    storage.set(KEYS.refresh, null);
  },
};

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message || `Request failed (${status})`);
    this.status = status;
    this.body = body || {};
    this.code = body?.code;
  }
}

let onSessionLost = () => {};
export function setSessionLostHandler(fn) { onSessionLost = fn; }

let refreshing = null;
async function refreshSession() {
  if (!tokens.refresh) return false;
  refreshing = refreshing || (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: tokens.refresh }),
      });
      if (!res.ok) return false;
      const body = await res.json();
      if (body.user?.user_type !== 'admin') return false;
      tokens.save(body);
      return true;
    } catch {
      return false;
    } finally {
      setTimeout(() => { refreshing = null; }, 0);
    }
  })();
  return refreshing;
}

function query(params) {
  if (!params) return '';
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

/**
 * request('GET', '/admin/users', { params, body, auth = true, token })
 * `token` overrides the bearer (e.g. the reset token in the set-password flow).
 */
export async function request(method, path, { params, body, auth = true, token, retried = false } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const bearer = token || (auth ? tokens.access : null);
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}${query(params)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, { message: 'Can’t reach the server. Check your connection and try again.' });
  }

  if (res.status === 401 && auth && !token && !retried) {
    if (await refreshSession()) return request(method, path, { params, body, auth, retried: true });
    tokens.clear();
    onSessionLost();
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

export const api = {
  get: (path, params) => request('GET', path, { params }),
  post: (path, body, opts) => request('POST', path, { body: body ?? {}, ...opts }),
  put: (path, body) => request('PUT', path, { body: body ?? {} }),
  del: (path, params, body) => request('DELETE', path, { params, body }),
};
