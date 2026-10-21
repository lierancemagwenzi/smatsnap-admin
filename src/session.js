// The signed-in admin. Tokens live in api/http.js; this holds the account they belong to.
import { reactive, computed } from 'vue';
import { api, request, tokens } from './api/http';

const state = reactive({ user: null, loaded: false });

export const session = {
  state,
  user: computed(() => state.user),
  isSuper: computed(() => state.user?.admin_role === 'super_admin'),

  /** Restores the session from stored tokens (once per page load). */
  async restore() {
    if (state.loaded) return state.user;
    state.loaded = true;
    if (!tokens.access && !tokens.refresh) return null;
    try {
      const { user } = await api.get('/auth/get-account');
      state.user = user?.user_type === 'admin' ? user : null;
      if (!state.user) tokens.clear();
    } catch {
      state.user = null;
    }
    return state.user;
  },

  /** Saves a session returned by login / reset-password (admins only). */
  adopt(body) {
    if (body.user?.user_type !== 'admin') throw new Error('This isn’t an admin account.');
    tokens.save(body);
    state.user = body.user;
    state.loaded = true;
  },

  async login(email, password) {
    const body = await request('POST', '/admin/auth/login', { body: { email, password }, auth: false });
    session.adopt(body);
    return body.user;
  },

  async logout() {
    try { await api.post('/auth/logout'); } catch { /* already signed out */ }
    session.clear();
  },

  clear() {
    tokens.clear();
    state.user = null;
  },
};
