<script setup>
import { ref, reactive, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../../studio/http';
import { dashboard, parsePrice } from '../../studio/store';
import { joinEvent } from '../../studio/joinEvent';
import { isoDay, plural } from '../../utils/format';
import { toast, toastError } from '../../utils/toast';
import Modal from '../../components/Modal.vue';
import EventCard from '../../components/studio/EventCard.vue';
import Icon from '../../components/Icon.vue';

const route = useRoute();
const router = useRouter();
const str = (v) => (typeof v === 'string' ? v : '');
const form = reactive({ name: str(route.query.name), start: str(route.query.date), end: '', venue: '', city: '', price: '' });
const errors = reactive({});
const busy = ref(false);
const dupes = ref(null); // { code, message, matches }

const day = 86400000;
const minDate = isoDay(new Date(Date.now() - 30 * day));
const maxDate = isoDay(new Date(Date.now() + 400 * day));
const price = computed(() => parsePrice(form.price));

function validate() {
  for (const k of Object.keys(errors)) delete errors[k];
  if (form.name.trim().length < 3) errors.name = 'Enter at least 3 characters';
  if (!form.start) errors.start = 'Pick the event date';
  if (form.end && form.start && form.end < form.start) errors.end = 'End date can’t be before the start';
  if (!form.city.trim()) errors.city = 'City is required';
  if (price.value === null) errors.price = 'Enter an amount from 0 to 10,000 with up to 2 decimals';
  return !Object.keys(errors).length;
}

async function submit(confirmNew = false) {
  if (!validate()) return;
  busy.value = true;
  try {
    const { event } = await api.post('/creator/events', {
      name: form.name.trim(),
      venue: form.venue.trim() || undefined,
      city: form.city.trim(),
      start_date: form.start,
      end_date: form.end || undefined,
      price: price.value,
      confirm_new: confirmNew || undefined,
    });
    toast('Event created');
    router.replace({ name: 'studio-event', params: { id: event.id } });
  } catch (err) {
    if (err.code === 'PAYOUT_REQUIRED') return router.push({ name: 'studio-payout', query: { next: route.fullPath } });
    if (err.status === 409 && err.body.matches?.length) dupes.value = err.body;
    else toastError(err);
  } finally {
    busy.value = false;
  }
}

async function pickMatch(m) {
  if (m.joined) return router.replace({ name: 'studio-event', params: { id: m.event.id } });
  busy.value = true;
  try {
    await joinEvent(router, m.event.id, price.value);
    toast(`Joined ${m.event.name}`);
  } catch (err) {
    toastError(err);
  } finally {
    busy.value = false;
  }
}

function createAnyway() {
  dupes.value = null;
  submit(true);
}
</script>

<template>
  <div class="narrow">
    <RouterLink :to="{ name: 'studio-find' }" class="btn ghost sm back"><Icon name="arrowLeft" :size="15" /> Back to search</RouterLink>
    <div class="page-head">
      <div>
        <h1>Create event</h1>
        <p>Use the official event name so other photographers and clients can find it.</p>
      </div>
    </div>

    <form class="card card-pad stack" novalidate @submit.prevent="submit()">
      <div class="field">
        <label for="name">Event name</label>
        <input id="name" v-model="form.name" class="input" placeholder="Harare Jazz Festival" maxlength="150" autofocus />
        <span v-if="errors.name" class="small bad">{{ errors.name }}</span>
      </div>
      <div class="two">
        <div class="field">
          <label for="start">Starts</label>
          <input id="start" v-model="form.start" class="input" type="date" :min="minDate" :max="maxDate" />
          <span v-if="errors.start" class="small bad">{{ errors.start }}</span>
        </div>
        <div class="field">
          <label for="end">Ends <span class="faint">(optional)</span></label>
          <input id="end" v-model="form.end" class="input" type="date" :min="form.start || minDate" :max="maxDate" />
          <span v-if="errors.end" class="small bad">{{ errors.end }}</span>
        </div>
      </div>
      <div class="two">
        <div class="field">
          <label for="venue">Venue <span class="faint">(optional)</span></label>
          <input id="venue" v-model="form.venue" class="input" placeholder="Harare Gardens" maxlength="150" />
        </div>
        <div class="field">
          <label for="city">City</label>
          <input id="city" v-model="form.city" class="input" placeholder="Harare" maxlength="100" />
          <span v-if="errors.city" class="small bad">{{ errors.city }}</span>
        </div>
      </div>
      <div class="field">
        <label for="price">Your price per photo / video</label>
        <div class="money">
          <span class="cur">{{ dashboard.currency }}</span>
          <input id="price" v-model="form.price" class="input" inputmode="decimal" placeholder="0.00" />
        </div>
        <span v-if="errors.price" class="small bad">{{ errors.price }}</span>
        <span v-else class="small faint">You can set a different price on individual photos and videos later.</span>
      </div>
      <button class="btn primary lg" type="submit" :disabled="busy">{{ busy ? 'Creating…' : 'Create event' }}</button>
    </form>

    <Modal v-if="dupes" :title="dupes.code === 'EVENT_EXISTS' ? 'This event already exists' : 'Is it one of these?'" @close="dupes = null">
      <div class="stack">
        <p class="muted">{{ dupes.message }}</p>
        <EventCard v-for="m in dupes.matches" :key="m.event.id" :event="m.event" @click="pickMatch(m)">
          <span class="badge plain">{{ plural(m.photographer_count, 'photographer') }}</span>
          <template #trailing><span class="act">{{ m.joined ? 'Open' : 'Join' }}</span></template>
        </EventCard>
      </div>
      <template v-if="dupes.code !== 'EVENT_EXISTS'" #footer>
        <button class="btn" :disabled="busy" @click="createAnyway">No — mine is a different event</button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.narrow { max-width: 680px; }
.back { margin: -6px 0 12px -10px; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.money { position: relative; }
.money .input { padding-left: 58px; font-weight: 700; }
.cur { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-weight: 700; color: var(--muted); font-size: 14px; }
.bad { color: var(--bad); }
.act { color: var(--brand-2); font-weight: 700; }
@media (max-width: 560px) { .two { grid-template-columns: 1fr; } }
</style>
