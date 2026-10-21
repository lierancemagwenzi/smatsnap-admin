<script setup>
import { computed } from 'vue';
import { useList } from '../../utils/useList';
import { money, dateTime, titleCase, gateway } from '../../utils/format';
import Pager from '../../components/Pager.vue';
import StatusBadge from '../../components/StatusBadge.vue';

const { filters, page, data, loading } = useList('/admin/orders', {
  q: '', status: '', provider: '', currency: '', from: '', to: '', event_id: '', creator_id: '', client_id: '',
});
const scoped = computed(() => filters.event_id || filters.creator_id || filters.client_id);
function clearScope() {
  filters.event_id = '';
  filters.creator_id = '';
  filters.client_id = '';
}
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1>Orders</h1>
        <p>Every checkout. Each order pays one photographer for one event through their gateway.</p>
      </div>
    </div>
    <div class="card">
      <div class="filters">
        <input v-model="filters.q" class="input grow" type="search" placeholder="Reference or payment code…" aria-label="Search" />
        <select v-model="filters.status" class="select" aria-label="Status">
          <option value="">Any status</option>
          <option v-for="s in data?.filters.statuses || []" :key="s" :value="s">{{ titleCase(s.toLowerCase()) }}</option>
        </select>
        <select v-model="filters.provider" class="select" aria-label="Gateway">
          <option value="">Any gateway</option>
          <option v-for="p in data?.filters.providers || []" :key="p" :value="p">{{ gateway(p) }}</option>
        </select>
        <select v-model="filters.currency" class="select" aria-label="Currency">
          <option value="">Any currency</option>
          <option v-for="c in data?.filters.currencies || []" :key="c" :value="c">{{ c }}</option>
        </select>
        <input v-model="filters.from" class="input" type="date" aria-label="From" title="From" />
        <input v-model="filters.to" class="input" type="date" aria-label="To" title="To" />
      </div>
      <div v-if="scoped" class="scope">
        Showing orders for
        <template v-if="filters.event_id">event #{{ filters.event_id }}</template>
        <template v-if="filters.creator_id">photographer #{{ filters.creator_id }}</template>
        <template v-if="filters.client_id">client #{{ filters.client_id }}</template>
        <button class="btn ghost sm" @click="clearScope">Clear</button>
      </div>
      <div v-if="loading" class="loading-bar" />
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr><th>Reference</th><th>Event</th><th>Client → Photographer</th><th>Gateway</th><th>Status</th><th class="num">Items</th><th class="num">Total</th><th class="num">Fee</th><th>Created</th></tr>
          </thead>
          <tbody>
            <tr v-for="o in data?.orders || []" :key="o.id" class="clickable" @click="$router.push(`/admin/orders/${o.id}`)">
              <td class="mono nowrap">{{ o.reference }}</td>
              <td>{{ o.event?.name || '—' }}</td>
              <td class="small">{{ o.client?.name || '—' }} → {{ o.creator?.name || '—' }}</td>
              <td class="small">{{ gateway(o.provider) }}<div class="faint">{{ o.method }}</div></td>
              <td><StatusBadge :status="o.status" /></td>
              <td class="num">{{ o.item_count }}</td>
              <td class="num nowrap"><strong>{{ money(o.total, o.currency) }}</strong></td>
              <td class="num nowrap muted">{{ money(o.fee, o.currency) }}</td>
              <td class="small nowrap">{{ dateTime(o.created_at) }}</td>
            </tr>
            <tr v-if="data && !data.orders.length"><td colspan="9" class="empty">No orders match these filters</td></tr>
          </tbody>
        </table>
      </div>
      <Pager v-if="data" v-model:page="page" :size="data.size" :total="data.total" />
    </div>
  </div>
</template>

<style scoped>
.scope { display: flex; align-items: center; gap: 8px; padding: 8px 16px; font-size: 14px; background: var(--info-bg); color: var(--info); font-weight: 600; }
</style>
