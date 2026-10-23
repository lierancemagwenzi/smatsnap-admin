// Photographer dashboard stats (+ payout status), shared by the layout and pages.
import { reactive } from 'vue';
import { api } from './http';

export const dashboard = reactive({
  loaded: false,
  live_events: 0,
  uploads: 0,
  earned: 0,
  items_sold: 0,
  currency: 'USD',
  payout_ready: true, // assume ready until we know, so nothing flashes a setup prompt
  payout: null,
});

export async function loadDashboard() {
  try {
    Object.assign(dashboard, await api.get('/creator/dashboard'), { loaded: true });
  } catch { /* pages show their own errors */ }
  return dashboard;
}

/** Prices: 0–10000 with at most 2 decimals (helpers/pricing.js). Returns a number or null. */
export function parsePrice(value) {
  const s = String(value ?? '').trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  return n >= 0 && n <= 10000 ? n : null;
}
