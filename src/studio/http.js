// The photographer studio's API client — own tokens, only `creator` sessions are kept.
import { createClient } from '../api/http';

export const { tokens, request, api, setSessionLostHandler } = createClient({
  keys: { token: 'smatsnap_studio_token', refresh: 'smatsnap_studio_refresh' },
  userType: 'creator',
});
