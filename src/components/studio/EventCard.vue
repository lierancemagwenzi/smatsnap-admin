<script setup>
import { computed } from 'vue';
import { eventDates } from '../../utils/format';

const props = defineProps({ event: { type: Object, required: true }, to: [String, Object] });
const day = computed(() => {
  const [y, m, d] = String(props.event.start_date || '').split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  return { d: date.getDate(), m: date.toLocaleDateString('en-GB', { month: 'short' }) };
});
const place = computed(() => [props.event.venue, props.event.city].filter(Boolean).join(', '));
</script>

<template>
  <component :is="to ? 'RouterLink' : 'button'" :to="to" :type="to ? undefined : 'button'" class="event card">
    <span class="date"><strong>{{ day.d }}</strong><small>{{ day.m }}</small></span>
    <span class="body">
      <strong class="name">{{ event.name }}</strong>
      <span class="muted small">{{ eventDates(event.start_date, event.end_date) }}<template v-if="place"> · {{ place }}</template></span>
      <span v-if="$slots.default" class="pills"><slot /></span>
    </span>
    <span v-if="$slots.trailing" class="trailing"><slot name="trailing" /></span>
  </component>
</template>

<style scoped>
.event { display: flex; align-items: center; gap: 14px; padding: 14px 16px; text-decoration: none; text-align: left; width: 100%; cursor: pointer; transition: border-color .15s, transform .08s; }
.event:hover { border-color: color-mix(in srgb, var(--brand-1) 40%, var(--border)); }
.event:active { transform: translateY(1px); }
.date { width: 52px; height: 56px; flex: none; border-radius: 14px; background: var(--gradient); color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.05; }
.date strong { font-size: 20px; font-weight: 800; }
.date small { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; opacity: .9; }
.body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.name { font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pills { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.trailing { flex: none; color: var(--muted); display: flex; align-items: center; }
</style>
