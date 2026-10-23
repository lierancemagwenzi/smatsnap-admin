<script setup>
// Earnings from our own order ledger, plus the gateway balance where it has one (SmatPay);
// Paystack settles to the bank automatically (balance_note). Same as the app's Sales tab.
import { ref, onMounted } from 'vue';
import { api } from '../../studio/http';
import { money, number, dateTime, plural } from '../../utils/format';
import StatCard from '../../components/StatCard.vue';
import Icon from '../../components/Icon.vue';

const PAGE = 20;
const summary = ref(null);
const summaryError = ref('');
const items = ref([]);
const total = ref(0);
const page = ref(0);
const loadingMore = ref(false);
const listError = ref('');

async function reload() {
  summaryError.value = '';
  try {
    summary.value = await api.get('/creator/sales/summary');
    items.value = [];
    page.value = 0;
    total.value = 0;
    listError.value = '';
    if (summary.value.payout_ready) await loadMore();
  } catch (err) {
    summaryError.value = err.message;
  }
}

async function loadMore() {
  if (loadingMore.value) return;
  loadingMore.value = true;
  try {
    const body = await api.get('/creator/sales/transactions', { page: page.value + 1, size: PAGE });
    page.value++;
    total.value = body.total;
    items.value.push(...body.transactions);
    listError.value = '';
  } catch (err) {
    listError.value = err.message;
  } finally {
    loadingMore.value = false;
  }
}
onMounted(reload);

const STATUS = { Paid: 'ok', Pending: 'warn', Failed: 'bad', Cancelled: 'bad' };
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1>Sales</h1>
        <p>What clients have paid you, straight from our order records.</p>
      </div>
      <span class="spacer" />
      <span v-if="summary?.payout?.test_mode" class="badge info">Test mode</span>
      <button class="btn sm" @click="reload"><Icon name="refresh" :size="15" /> Refresh</button>
    </div>

    <div v-if="!summary && !summaryError" class="stack"><div class="skeleton" style="height: 150px" /><div class="skeleton" style="height: 90px" /></div>
    <div v-else-if="!summary" class="card empty"><p>{{ summaryError }}</p><button class="btn" style="margin-top: 12px" @click="reload">Try again</button></div>

    <div v-else-if="!summary.payout_ready" class="prompt card">
      <span class="ico"><Icon name="wallet" :size="20" /></span>
      <div class="grow">
        <strong>Set up payments</strong>
        <p class="muted small">Add your payout details so clients can pay you — your balance and transactions will show here.</p>
      </div>
      <RouterLink :to="{ name: 'studio-payout' }" class="btn primary">Set up payments</RouterLink>
    </div>

    <template v-else>
      <div class="top">
        <div class="balance">
          <div class="row">
            <Icon name="wallet" :size="18" />
            <span class="lbl">{{ summary.balance_note ? 'Earned' : 'Payout balance' }}</span>
            <span class="spacer" />
            <span v-if="!summary.payout?.approved" class="pill">Not live yet</span>
          </div>
          <div v-if="summary.balances === null && summary.balance_note" class="amt">{{ money(summary.earned, summary.currency) }}</div>
          <p v-else-if="summary.balances === null" class="err">{{ summary.balance_error || 'Balance unavailable right now' }}</p>
          <div v-else-if="!summary.balances.length" class="amt">{{ money(0, summary.currency) }}</div>
          <template v-else>
            <div v-for="b in summary.balances" :key="b.currency" class="amt">{{ money(b.amount, b.currency) }}</div>
          </template>
          <p class="sub">{{ [summary.payout?.display_name, summary.payout?.provider_label].filter(Boolean).join(' · ') }}</p>
          <p class="sub">{{ summary.balance_note || `What clients have paid you, less payouts. Paid out by ${summary.payout?.provider_label || 'your payment provider'}.` }}</p>
        </div>
        <div class="stats">
          <StatCard label="Earned" :value="money(summary.earned, summary.currency)" icon="trending" />
          <StatCard label="Sales" :value="number(summary.sales)" icon="receipt" />
          <StatCard label="Items sold" :value="number(summary.items_sold)" icon="image" />
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Transactions</h3><span class="spacer" /><span v-if="total" class="muted small">{{ number(total) }}</span></div>
        <div v-if="!items.length && !loadingMore && !listError" class="empty">No transactions yet. Sales appear here as soon as clients pay.</div>
        <div v-else class="table-wrap">
          <table class="table">
            <thead><tr><th>Event</th><th>Client</th><th>Method</th><th>Date</th><th>Status</th><th class="num">Your share</th></tr></thead>
            <tbody>
              <tr v-for="t in items" :key="t.id">
                <td>
                  <RouterLink v-if="t.order?.event" :to="{ name: 'studio-event', params: { id: t.order.event.id } }" class="ev">{{ t.order.event.name }}</RouterLink>
                  <span v-else>Payment</span>
                  <div class="faint small">{{ plural(t.order?.item_count || 0, 'item') }} · <span class="mono">{{ t.reference }}</span></div>
                </td>
                <td>{{ t.payer || '—' }}</td>
                <td class="nowrap">{{ t.method || t.provider }}</td>
                <td class="nowrap">{{ dateTime(t.paid_at || t.created_at) }}</td>
                <td><span class="badge" :class="STATUS[t.status]">{{ t.status }}</span></td>
                <td class="num nowrap" :class="{ struck: t.status === 'Failed' || t.status === 'Cancelled' }">{{ money(t.amount, t.currency) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="listError" class="form-error" style="margin: 12px 16px">{{ listError }} <button class="btn ghost sm" @click="loadMore">Try again</button></div>
        <div v-if="loadingMore" class="loading-bar" />
        <div v-else-if="items.length < total" class="more"><button class="btn" @click="loadMore">Load more</button></div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.prompt { display: flex; align-items: center; gap: 16px; padding: 18px 20px; flex-wrap: wrap; }
.prompt .grow { flex: 1 1 260px; display: flex; flex-direction: column; gap: 4px; }
.ico { width: 42px; height: 42px; border-radius: 14px; background: var(--gradient); color: #fff; display: grid; place-items: center; flex: none; }
.top { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.4fr); gap: 16px; margin-bottom: 20px; }
.balance { background: var(--gradient); color: #fff; border-radius: 24px; padding: 22px; box-shadow: 0 12px 30px rgba(230, 75, 155, .3); display: flex; flex-direction: column; gap: 6px; }
.balance .row { color: rgba(255, 255, 255, .8); gap: 8px; }
.lbl { font-weight: 600; }
.pill { background: rgba(255, 255, 255, .2); padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; color: #fff; }
.amt { font-size: 34px; font-weight: 800; letter-spacing: -0.02em; margin-top: 6px; }
.err { margin-top: 6px; }
.sub { font-size: 12px; color: rgba(255, 255, 255, .8); }
.stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; align-content: stretch; }
.ev { font-weight: 600; text-decoration: none; }
.ev:hover { color: var(--brand-2); }
.struck { text-decoration: line-through; color: var(--faint); }
.more { display: flex; justify-content: center; padding: 14px; border-top: 1px solid var(--border); }
@media (max-width: 960px) { .top { grid-template-columns: 1fr; } }
@media (max-width: 560px) { .stats { grid-template-columns: 1fr; } }
</style>
