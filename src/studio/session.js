// The signed-in photographer, plus the in-progress OTP / password-reset steps of the auth flow
// (kept in sessionStorage so a reload on the code screen doesn't lose them).
import { reactive, computed } from 'vue';
import { api, request, tokens } from './http';

const state = reactive({ user: null, loaded: false });
const PENDING_KEY = 'smatsnap_studio_pending';

const pendingStore = {
  get() { try { return JSON.parse(sessionStorage.getItem(PENDING_KEY)) || null; } catch { return null; } },
  set(v) { try { v ? sessionStorage.setItem(PENDING_KEY, JSON.stringify(v)) : sessionStorage.removeItem(PENDING_KEY); } catch { /* private mode */ } },
};

export const NOT_A_PHOTOGRAPHER = 'This is a client account. Clients find and buy their photos in the SmatSnap app.';

export const studioSession = {
  state,
  user: computed(() => state.user),

  /** Restores the session from stored tokens (once per page load). */
  async restore() {
    if (state.loaded) return state.user;
    state.loaded = true;
    if (!tokens.access && !tokens.refresh) return null;
    try {
      const { user } = await api.get('/auth/get-account');
      state.user = user?.user_type === 'creator' ? user : null;
      if (!state.user) tokens.clear();
    } catch {
      state.user = null;
    }
    return state.user;
  },

  /** Saves a session returned by login / verify-otp / reset-password (photographers only). */
  adopt(body) {
    if (body.user?.user_type !== 'creator') throw new Error(NOT_A_PHOTOGRAPHER);
    tokens.save(body);
    state.user = body.user;
    state.loaded = true;
    pendingStore.set(null);
  },

  /** Returns 'done' when signed in, or 'otp' when the email still needs verifying. */
  async login(email, password) {
    const body = await request('POST', '/auth/login', { body: { email, password }, auth: false });
    if (body.user && body.user.user_type !== 'creator') throw new Error(NOT_A_PHOTOGRAPHER);
    if (body.requires_otp) {
      studioSession.setPending({ mode: 'verify', email: body.user?.email || email, otp_token: body.otp_token, resend_in: body.resend_in });
      return 'otp';
    }
    studioSession.adopt(body);
    return 'done';
  },

  checkEmail: (email) => request('POST', '/registration/check-email', { body: { email }, auth: false }),

  /** Photographer signup (account + payout account in one go) → OTP step. */
  async register({ name, lastname, email, password, payout }) {
    const body = await request('POST', '/registration/register', {
      body: { name, lastname, email, password, user_type: 'creator', payout },
      auth: false,
    });
    studioSession.setPending({ mode: 'verify', email, otp_token: body.otp_token, resend_in: body.resend_in });
    return body;
  },

  pending: () => pendingStore.get(),
  setPending: (v) => pendingStore.set(v),

  async logout() {
    try { await api.post('/auth/logout'); } catch { /* already signed out */ }
    studioSession.clear();
  },

  clear() {
    tokens.clear();
    state.user = null;
  },
};
