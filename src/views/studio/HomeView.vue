<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { studioSession } from '../../studio/session';
import { api } from '../../studio/http';
import { dashboard, loadDashboard } from '../../studio/store';
import { completed } from '../../studio/uploads';
import { money, number, plural } from '../../utils/format';
import { toastError } from '../../utils/toast';
import StatCard from '../../components/StatCard.vue';
import EventCard from '../../components/studio/EventCard.vue';
import Icon from '../../components/Icon.vue';

const events = ref(null);
const user = studioSession.user;

async function load() {
  try {
    const [{ events: list }] = await Promise.all([api.get('/creator/events'), loadDashboard()]);
    events.value = list;
  } catch (err) {
    toastError(err);
    events.value = events.value || [];
  }
}
onMounted(load);
watch(completed, load);

const greeting = computed(() => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
});
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1>{{ greeting }}, {{ user?.name }}</h1>
        <p>Here’s how your events are doing.</p>
      </div>
    </div>

    <div class="stats">
      <StatCard label="Live events" :value="number(dashboard.live_events)" icon="calendar" to="/studio/events" />
      <StatCard label="Live uploads" :value="number(dashboard.uploads)" icon="image" hint="Kept 7 days after upload" />
      <StatCard label="Earned" :value="money(dashboard.earned, dashboard.currency)" icon="wallet" to="/studio/sales" :hint="plural(dashboard.items_sold, 'item') + ' sold'" />
    </div>

    <div v-if="dashboard.loaded && !dashboard.payout_ready" class="prompt card">
      <span class="ico"><Icon name="wallet" :size="20" /></span>
      <div class="grow">
        <strong>Set up payments</strong>
        <p class="muted small">Add your payout details so clients can pay you directly. It takes a minute.</p>
      </div>
      <RouterLink :to="{ name: 'studio-payout' }" class="btn primary">Set up payments</RouterLink>
    </div>

    <div class="row section">
      <h2>Your events</h2>
      <span class="spacer" />
      <RouterLink v-if="events && events.length > 4" to="/studio/events" class="btn ghost sm">See all</RouterLink>
    </div>

    <div v-if="events === null" class="list">
      <div v-for="i in 3" :key="i" class="skeleton" style="height: 84px" />
    </div>
    <div v-else-if="!events.length" class="prompt card">
      <span class="ico"><Icon name="camera" :size="20" /></span>
      <div class="grow">
        <strong>Add your first event</strong>
        <p class="muted small">Find the event you’re shooting — or create it — then upload your shots and videos. Clients find themselves with a selfie. Uploads stay live for 7 days.</p>
      </div>
      <RouterLink :to="dashboard.payout_ready ? { name: 'studio-find' } : { name: 'studio-payout' }" class="btn primary">Find or create event</RouterLink>
    </div>
    <div v-else class="list">
      <EventCard v-for="e in events.slice(0, 4)" :key="e.id" :event="e" :to="{ name: 'studio-event', params: { id: e.id } }">
        <span class="badge plain">{{ plural(e.my_media_count, 'upload') }}</span>
        <span class="badge plain">{{ money(e.membership.price, e.membership.currency) }}</span>
        <span class="badge plain">{{ plural(e.photographer_count, 'photographer') }}</span>
        <template #trailing><Icon name="chevronRight" /></template>
      </EventCard>
    </div>
  </div>
</template>

<style scoped>
.stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.prompt { display: flex; align-items: center; gap: 16px; padding: 18px 20px; margin-top: 20px; flex-wrap: wrap; }
.prompt .grow { flex: 1 1 260px; display: flex; flex-direction: column; gap: 4px; }
.ico { width: 42px; height: 42px; border-radius: 14px; background: var(--gradient); color: #fff; display: grid; place-items: center; flex: none; }
.section { margin: 32px 0 14px; }
.section h2 { font-size: 18px; }
.list { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 420px), 1fr)); }
@media (max-width: 720px) { .stats { grid-template-columns: 1fr; } }
</style>
