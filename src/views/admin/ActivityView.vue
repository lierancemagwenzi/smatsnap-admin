<script setup>
import { useList } from '../../utils/useList';
import { dateTime, relative } from '../../utils/format';
import Pager from '../../components/Pager.vue';

const { filters, page, data, loading } = useList('/admin/activity', { target_type: '' }, { size: 30 });

const LABELS = {
  'user.suspend': 'Suspended user',
  'user.reactivate': 'Reactivated user',
  'event.hide': 'Hid event',
  'event.show': 'Made event visible',
  'media.delete': 'Took down media',
  'order.recheck': 'Rechecked order',
  'admin.create': 'Added admin',
  'admin.update': 'Changed admin',
  'admin.remove_invite': 'Removed admin invite',
};

function target(a) {
  const d = a.details || {};
  if (a.target_type === 'user') return { text: d.email || `User #${a.target_id}`, to: `/admin/users/${a.target_id}` };
  if (a.target_type === 'event') return { text: d.name || `Event #${a.target_id}`, to: `/admin/events/${a.target_id}` };
  if (a.target_type === 'order') return { text: d.reference || `Order #${a.target_id}`, to: `/admin/orders/${a.target_id}` };
  if (a.target_type === 'media') return { text: d.filename || `Media #${a.target_id}`, to: d.event_id ? `/admin/events/${d.event_id}` : null };
  if (a.target_type === 'admin') return { text: d.email || `Admin #${a.target_id}`, to: null };
  return { text: '—', to: null };
}

function extra(a) {
  const d = a.details || {};
  const parts = [];
  if (d.before && d.after) {
    if (d.before.admin_role !== d.after.admin_role) parts.push(`role ${d.before.admin_role} → ${d.after.admin_role}`);
    if (d.before.status !== d.after.status) parts.push(`status ${d.before.status} → ${d.after.status}`);
  }
  if (d.admin_role && a.action === 'admin.create') parts.push(`as ${d.admin_role.replace('_', ' ')}`);
  if (a.action === 'order.recheck') parts.push(`${d.before} → ${d.after}`);
  if (d.purchased) parts.push('had active purchases');
  if (d.reason) parts.push(`“${d.reason}”`);
  return parts.join(' · ');
}
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1>Activity log</h1>
        <p>Every change an admin makes, newest first.</p>
      </div>
      <span class="spacer" />
      <select v-model="filters.target_type" class="select type" aria-label="Type">
        <option value="">Everything</option>
        <option value="user">Users</option>
        <option value="event">Events</option>
        <option value="media">Media</option>
        <option value="order">Orders</option>
        <option value="admin">Admins</option>
      </select>
    </div>
    <div class="card">
      <div v-if="loading" class="loading-bar" />
      <ul class="feed">
        <li v-for="a in data?.actions || []" :key="a.id">
          <span class="dot" :class="a.action.split('.')[1]" />
          <div class="body">
            <div>
              <strong>{{ a.admin?.name || 'Removed admin' }}</strong>
              <span class="muted"> {{ (LABELS[a.action] || a.action).toLowerCase() }} </span>
              <RouterLink v-if="target(a).to" :to="target(a).to">{{ target(a).text }}</RouterLink>
              <span v-else>{{ target(a).text }}</span>
            </div>
            <div v-if="extra(a)" class="small muted">{{ extra(a) }}</div>
          </div>
          <span class="small faint nowrap" :title="dateTime(a.created_at)">{{ relative(a.created_at) }}</span>
        </li>
        <li v-if="data && !data.actions.length" class="empty">Nothing yet</li>
      </ul>
      <Pager v-if="data" v-model:page="page" :size="data.size" :total="data.total" />
    </div>
  </div>
</template>

<style scoped>
.type { width: auto; }
.feed { list-style: none; margin: 0; padding: 0; }
.feed li { display: flex; align-items: flex-start; gap: 14px; padding: 14px 20px; border-bottom: 1px solid var(--border); }
.feed li:last-child { border-bottom: none; }
.feed li.empty { display: block; }
.body { flex: 1; min-width: 0; overflow-wrap: anywhere; }
.dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 7px; background: var(--brand-1); flex: none; }
.dot.suspend, .dot.delete, .dot.hide, .dot.remove_invite { background: var(--bad); }
.dot.reactivate, .dot.show, .dot.create { background: var(--ok); }
</style>
