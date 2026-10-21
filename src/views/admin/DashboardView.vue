<script setup>
import { ref, computed, watch } from 'vue';
import { api } from '../../api/http';
import { session } from '../../session';
import { number, plural, money, bytes, date } from '../../utils/format';
import { toastError } from '../../utils/toast';
import StatCard from '../../components/StatCard.vue';
import ChartCanvas from '../../components/ChartCanvas.vue';
import Icon from '../../components/Icon.vue';

const PURPLE = '#8b3dff';
const PINK = '#e64b9b';
const STATUS_COLORS = { PAID: '#12b981', PENDING: '#f3b555', EXPIRED: '#a796b2', FAILED: '#e64b6b', CANCELLED: '#6b5a78' };

const days = ref(30);
const stats = ref(null);
const loading = ref(false);
const currency = ref('');

async function load() {
  loading.value = true;
  try {
    stats.value = await api.get('/admin/stats', { days: days.value });
    const cs = stats.value.series.currencies;
    if (!cs.includes(currency.value)) currency.value = cs[0] || stats.value.orders.totals[0]?.currency || 'USD';
  } catch (err) {
    toastError(err);
  } finally {
    loading.value = false;
  }
}
watch(days, load, { immediate: true });

const greeting = computed(() => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
});
const shortDate = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

const signupChart = computed(() => {
  const s = stats.value?.series.signups || [];
  return {
    labels: s.map((r) => shortDate(r.date)),
    datasets: [
      { label: 'Photographers', data: s.map((r) => r.creators), backgroundColor: PURPLE },
      { label: 'Clients', data: s.map((r) => r.clients), backgroundColor: PINK },
    ],
  };
});

const salesChart = computed(() => {
  const s = stats.value?.series.sales || [];
  const c = currency.value;
  return {
    labels: s.map((r) => shortDate(r.date)),
    datasets: [
      { label: 'Gross sales', data: s.map((r) => r.gross[c] || 0), borderColor: PURPLE, backgroundColor: 'rgba(139,61,255,.12)', fill: true },
      { label: 'Platform fees', data: s.map((r) => r.fees[c] || 0), borderColor: PINK, backgroundColor: 'transparent' },
    ],
  };
});

const orderChart = computed(() => {
  const by = stats.value?.orders.by_status || {};
  const keys = Object.keys(by);
  return {
    labels: keys.map((k) => k[0] + k.slice(1).toLowerCase()),
    datasets: [{ data: keys.map((k) => by[k]), backgroundColor: keys.map((k) => STATUS_COLORS[k] || '#a796b2'), borderWidth: 0 }],
  };
});

const totalOrders = computed(() => Object.values(stats.value?.orders.by_status || {}).reduce((a, b) => a + b, 0));
const queue = computed(() => stats.value?.media.queue || {});
const periodTotals = computed(() => stats.value?.orders.totals_in_period || []);
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1>{{ greeting }}, {{ session.user.value?.name }}</h1>
        <p>What’s happening on SmatSnap<span v-if="stats"> since {{ date(stats.since) }}</span>.</p>
      </div>
      <span class="spacer" />
      <select v-model.number="days" class="select period" aria-label="Period">
        <option :value="7">Last 7 days</option>
        <option :value="30">Last 30 days</option>
        <option :value="90">Last 90 days</option>
        <option :value="365">Last 12 months</option>
      </select>
      <button class="btn" :disabled="loading" @click="load" aria-label="Refresh"><Icon name="refresh" :size="16" /></button>
    </div>
    <div v-if="loading && !stats" class="loading-bar" />

    <template v-if="stats">
      <div class="kpis">
        <StatCard label="Users" :value="number(stats.users.total)" icon="users" to="/admin/users">
          +{{ number(stats.users.new_creators + stats.users.new_clients) }} new · {{ number(stats.users.active_in_period) }} active
        </StatCard>
        <StatCard label="Photographers" :value="number(stats.users.creators)" icon="camera" :to="{ path: '/admin/users', query: { type: 'creator' } }">
          {{ number(stats.payouts.ready) }} can get paid
        </StatCard>
        <StatCard label="Live events" :value="number(stats.events.live)" icon="calendar" to="/admin/events">
          {{ number(stats.events.total) }} total · {{ plural(stats.events.client_searches, 'client search', 'client searches') }}
        </StatCard>
        <StatCard label="Live media" :value="number(stats.media.live)" icon="image">
          {{ bytes(stats.media.live_bytes) }} in storage
        </StatCard>
      </div>

      <div class="kpis">
        <StatCard v-if="!periodTotals.length" label="Sales in period" value="—" icon="receipt" to="/admin/orders" hint="No paid orders yet" />
        <StatCard v-for="t in periodTotals" :key="t.currency" :label="`Sales in period · ${t.currency}`" :value="money(t.gross, t.currency)" icon="receipt"
                  :to="{ path: '/admin/orders', query: { status: 'PAID', currency: t.currency } }">
          {{ plural(t.orders, 'order') }} · {{ money(t.fees, t.currency) }} fees
        </StatCard>
        <StatCard v-for="t in stats.orders.totals" :key="'all-' + t.currency" :label="`All-time platform fees · ${t.currency}`" :value="money(t.fees, t.currency)" icon="wallet">
          {{ money(t.earnings, t.currency) }} paid to photographers
        </StatCard>
        <StatCard label="Purchases" :value="number(stats.orders.purchases)" icon="download" hint="Items unlocked by clients" />
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-head">
            <h3>Sales</h3>
            <span class="spacer" />
            <select v-if="stats.series.currencies.length > 1" v-model="currency" class="select sm-select" aria-label="Currency">
              <option v-for="c in stats.series.currencies" :key="c" :value="c">{{ c }}</option>
            </select>
            <span v-else class="badge plain">{{ currency }}</span>
          </div>
          <div class="card-pad"><ChartCanvas type="line" v-bind="salesChart" :money="currency" /></div>
        </div>
        <div class="card">
          <div class="card-head"><h3>New sign-ups</h3></div>
          <div class="card-pad"><ChartCanvas type="bar" v-bind="signupChart" stacked /></div>
        </div>
      </div>

      <div class="grid-3">
        <div class="card">
          <div class="card-head"><h3>Orders by status</h3><span class="spacer" /><span class="muted small">{{ number(totalOrders) }} total</span></div>
          <div class="card-pad">
            <ChartCanvas v-if="totalOrders" type="doughnut" v-bind="orderChart" :height="220" />
            <div v-else class="empty">No orders yet</div>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Processing queue</h3><span class="spacer" /><RouterLink to="/admin/system" class="small muted">System →</RouterLink></div>
          <div class="card-pad">
            <dl class="kv">
              <dt>Waiting to process</dt><dd><strong>{{ number(queue.uploaded || 0) }}</strong></dd>
              <dt>Processing</dt><dd><strong>{{ number(queue.processing || 0) }}</strong></dd>
              <dt>Failed</dt><dd><strong :class="{ bad: queue.failed }">{{ number(queue.failed || 0) }}</strong></dd>
              <dt>Uploads in progress</dt><dd><strong>{{ number(queue.pending || 0) }}</strong></dd>
              <dt>Photos live</dt><dd>{{ number(stats.media.by_type.photo?.count || 0) }} · {{ bytes(stats.media.by_type.photo?.bytes || 0) }}</dd>
              <dt>Videos live</dt><dd>{{ number(stats.media.by_type.video?.count || 0) }} · {{ bytes(stats.media.by_type.video?.bytes || 0) }}</dd>
            </dl>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Payout accounts</h3><span class="spacer" /><RouterLink to="/admin/payouts" class="small muted">All →</RouterLink></div>
          <div class="card-pad">
            <dl class="kv">
              <dt>Total</dt><dd><strong>{{ number(stats.payouts.total) }}</strong></dd>
              <dt>Ready to sell</dt><dd><strong>{{ number(stats.payouts.ready) }}</strong></dd>
              <template v-for="(n, p) in stats.payouts.by_provider" :key="p">
                <dt class="cap">{{ p }}</dt><dd>{{ number(n) }}</dd>
              </template>
              <dt>Photographers without one</dt><dd>{{ number(Math.max(0, stats.users.creators - stats.payouts.total)) }}</dd>
            </dl>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-head"><h3>Top events</h3><span class="muted small">by paid orders</span></div>
          <div class="table-wrap">
            <table class="table">
              <tbody>
                <tr v-for="e in stats.top_events" :key="e.id + e.currency" class="clickable" @click="$router.push(`/admin/events/${e.id}`)">
                  <td><strong>{{ e.name }}</strong><div class="faint small mono">{{ e.code }}</div></td>
                  <td class="num">{{ plural(e.orders, 'order') }}</td>
                  <td class="num"><strong>{{ money(e.gross, e.currency) }}</strong></td>
                </tr>
                <tr v-if="!stats.top_events.length"><td class="empty">No sales yet</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><h3>Top photographers</h3><span class="muted small">by paid orders</span></div>
          <div class="table-wrap">
            <table class="table">
              <tbody>
                <tr v-for="p in stats.top_photographers" :key="p.id + p.currency" class="clickable" @click="$router.push(`/admin/users/${p.id}`)">
                  <td><strong>{{ p.name }}</strong></td>
                  <td class="num">{{ plural(p.orders, 'order') }}</td>
                  <td class="num"><strong>{{ money(p.earnings, p.currency) }}</strong></td>
                </tr>
                <tr v-if="!stats.top_photographers.length"><td class="empty">No sales yet</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.period { width: auto; }
.sm-select { width: auto; padding-top: 6px; padding-bottom: 6px; }
.kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 16px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px; }
.cap { text-transform: capitalize; }
.bad { color: var(--bad); }
@media (max-width: 1100px) { .grid-3 { grid-template-columns: 1fr 1fr; } }
@media (max-width: 860px) { .grid-2, .grid-3 { grid-template-columns: 1fr; } }
</style>
