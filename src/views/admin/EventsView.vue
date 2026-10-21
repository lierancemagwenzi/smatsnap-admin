<script setup>
import { useList } from '../../utils/useList';
import { number, date } from '../../utils/format';
import Pager from '../../components/Pager.vue';
import StatusBadge from '../../components/StatusBadge.vue';

const { filters, page, data, loading } = useList('/admin/events', { q: '', status: '' });
const when = (e) => (e.start_date === e.end_date || !e.end_date ? date(e.start_date) : `${date(e.start_date)} – ${date(e.end_date)}`);
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1>Events</h1>
        <p>Shared events across all photographers. Hide an event to take it out of client search.</p>
      </div>
    </div>
    <div class="card">
      <div class="filters">
        <input v-model="filters.q" class="input grow" type="search" placeholder="Search name, code, city or venue…" aria-label="Search" />
        <select v-model="filters.status" class="select" aria-label="Status">
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>
      <div v-if="loading" class="loading-bar" />
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr><th>Event</th><th>Code</th><th>Date</th><th>Status</th><th class="num">Photographers</th><th class="num">Live media</th><th class="num">Paid orders</th></tr>
          </thead>
          <tbody>
            <tr v-for="e in data?.events || []" :key="e.id" class="clickable" @click="$router.push(`/admin/events/${e.id}`)">
              <td>
                <strong>{{ e.name }}</strong>
                <div class="muted small">{{ [e.venue, e.city].filter(Boolean).join(', ') || '—' }}</div>
              </td>
              <td class="mono">{{ e.code }}</td>
              <td class="small nowrap">{{ when(e) }}</td>
              <td><StatusBadge :status="e.status" /></td>
              <td class="num">{{ number(e.photographer_count) }}</td>
              <td class="num">{{ number(e.live_media) }}</td>
              <td class="num">{{ number(e.paid_orders) }}</td>
            </tr>
            <tr v-if="data && !data.events.length"><td colspan="7" class="empty">No events match these filters</td></tr>
          </tbody>
        </table>
      </div>
      <Pager v-if="data" v-model:page="page" :size="data.size" :total="data.total" />
    </div>
  </div>
</template>
