<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { api } from '../../studio/http';
import { dashboard } from '../../studio/store';
import { completed, forEvent } from '../../studio/uploads';
import { money, plural, date } from '../../utils/format';
import { toastError } from '../../utils/toast';
import EventCard from '../../components/studio/EventCard.vue';
import Icon from '../../components/Icon.vue';

const events = ref(null);
const q = ref('');

async function load() {
  try {
    events.value = (await api.get('/creator/events')).events;
  } catch (err) {
    toastError(err);
    events.value = events.value || [];
  }
}
onMounted(load);
watch(completed, load);

const shown = computed(() => {
  const s = q.value.trim().toLowerCase();
  const list = events.value || [];
  return s ? list.filter((e) => [e.name, e.venue, e.city, e.code].some((v) => String(v || '').toLowerCase().includes(s))) : list;
});
const addTarget = computed(() => (dashboard.payout_ready ? { name: 'studio-find' } : { name: 'studio-payout' }));
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1>My events</h1>
        <p>Events you shoot. Open one to upload and set prices.</p>
      </div>
      <span class="spacer" />
      <RouterLink :to="addTarget" class="btn primary"><Icon name="plus" :size="16" /> Find or create event</RouterLink>
    </div>

    <input v-if="events && events.length > 6" v-model="q" class="input search" type="search" placeholder="Filter by name, city or code" />

    <div v-if="events === null" class="list">
      <div v-for="i in 4" :key="i" class="skeleton" style="height: 84px" />
    </div>
    <div v-else-if="!events.length" class="card empty">
      <p><strong>No events yet</strong></p>
      <p class="small">Join an event other photographers added, or create a new one.</p>
      <RouterLink :to="addTarget" class="btn primary" style="margin-top: 14px">Find or create event</RouterLink>
    </div>
    <div v-else class="list">
      <EventCard v-for="e in shown" :key="e.id" :event="e" :to="{ name: 'studio-event', params: { id: e.id } }">
        <span class="badge info plain">{{ plural(e.my_media_count, 'upload') }}</span>
        <span v-if="forEvent(e.id).length" class="badge warn">{{ forEvent(e.id).length }} uploading</span>
        <span class="badge plain">{{ money(e.membership.price, e.membership.currency) }}</span>
        <span class="badge plain">{{ plural(e.photographer_count, 'photographer') }}</span>
        <span v-if="e.is_owner" class="badge plain">Created by you</span>
        <span v-if="e.last_expiry && new Date(e.last_expiry) > new Date()" class="badge plain">Live until {{ date(e.last_expiry) }}</span>
        <template #trailing><Icon name="chevronRight" /></template>
      </EventCard>
      <p v-if="!shown.length" class="muted">No events match “{{ q }}”.</p>
    </div>
  </div>
</template>

<style scoped>
.search { max-width: 360px; margin-bottom: 16px; }
.list { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 420px), 1fr)); }
</style>
