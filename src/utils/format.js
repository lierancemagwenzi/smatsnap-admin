const nf = new Intl.NumberFormat('en');

export const number = (n) => nf.format(Number(n || 0));

/** plural(1, 'order') → "1 order", plural(3, 'order') → "3 orders" */
export const plural = (n, word, many = `${word}s`) => `${number(n)} ${Number(n) === 1 ? word : many}`;

export function money(amount, currency) {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 2 }).format(Number(amount || 0));
  } catch {
    return `${currency || ''} ${Number(amount || 0).toFixed(2)}`.trim();
  }
}

export function bytes(n) {
  let v = Number(n || 0);
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v < 10 && i ? 1 : 0)} ${units[i]}`;
}

export function date(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function dateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function relative(value) {
  if (!value) return '—';
  const s = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  const abs = Math.abs(s);
  const fmt = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (abs < 60) return fmt.format(-s, 'second');
  if (abs < 3600) return fmt.format(-Math.round(s / 60), 'minute');
  if (abs < 86400) return fmt.format(-Math.round(s / 3600), 'hour');
  if (abs < 86400 * 30) return fmt.format(-Math.round(s / 86400), 'day');
  return date(value);
}

export function duration(seconds) {
  const s = Math.max(0, Math.round(Number(seconds || 0)));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
}

/** [{currency, amount}] → "US$4.00 · R120.00" */
export function moneyList(list, key = 'amount') {
  if (!list || !list.length) return '—';
  return list.map((r) => money(r[key], r.currency)).join(' · ');
}

export const titleCase = (s) => String(s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const GATEWAYS = { smatpay: 'SmatPay', paystack: 'Paystack' };
export const gateway = (name) => GATEWAYS[name] || titleCase(name);
