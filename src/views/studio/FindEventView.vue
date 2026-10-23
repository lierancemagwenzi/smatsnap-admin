<script setup>
// Search-first, like the app: find the shared event and join it; only create a new one once
// nothing matching turns up.
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../../studio/http';
import { dashboard } from '../../studio/store';
import { joinEvent } from '../../studio/joinEvent';
import { plural } from '../../utils/format';
import { toastError } from '../../utils/toast';
import EventCard from '../../components/studio/EventCard.vue';
import PriceDialog from '../../components/studio/PriceDialog.vue';
import Icon from '../../components/Icon.vue';

const router = useRouter();
const q = ref('');
const date = ref('');
const results = ref([]);
const searched = ref('');
const searching = ref(false);
const joining = ref(null);
const busy = ref(false);
let debounce = null;
let seq = 0;

const MATCH = { exact: ['ok', 'Same event'], likely: ['info', 'Likely match'], similar: ['plain', 'Similar'] };

async function search() {
  const query = q.value.trim();
  const mine = ++seq;
  if (query.length < 2) { results.value = []; searched.value = ''; searching.value = false; return; }
  searching.value = true;
  try {
    const body = await api.get('/events/search', { q: query, date: date.value });
    if (mine !== seq) return;
    results.value = body.results || [];
    searched.value = query;
  } catch (err) {
    if (mine === seq) toastError(err);
  } finally {
    if (mine === seq) searching.value = false;
  }
}
watch(q, () => { clearTimeout(debounce); debounce = setTimeout(search, 350); });
watch(date, search);

function pick(r) {
  if (r.joined) return router.push({ name: 'studio-event', params: { id: r.event.id } });
  joining.value = r;
}

async function join(price) {
  busy.value = true;
  try {
    await joinEvent(router, joining.value.event.id, price);
  } catch (err) {
    toastError(err);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="narrow">
    <RouterLink to="/studio/events" class="btn ghost sm back"><Icon name="arrowLeft" :size="15" /> My events</RouterLink>
    <div class="page-head">
      <div>
        <h1>Find your event</h1>
        <p>Other photographers may already have added it. Join theirs so clients find all photos in one place.</p>
      </div>
    </div>

    <div class="card card-pad stack">
      <div class="searchbox">
        <Icon name="search" />
        <input v-model="q" class="input" type="search" placeholder="Event name, e.g. Harare Jazz Festival" autofocus aria-label="Event name" />
        <span v-if="searching" class="spin" aria-hidden="true" />
      </div>
      <div class="row wrap small">
        <label for="date" class="muted">When is it?</label>
        <input id="date" v-model="date" class="input date" type="date" />
        <button v-if="date" class="btn ghost sm" @click="date = ''"><Icon name="x" :size="14" /> Any date</button>
      </div>
    </div>

    <p v-if="!searched && !searching" class="hint muted"><Icon name="sparkle" :size="16" /> Start typing — we match typos, abbreviations like “fest” or “intl”, and acronyms like “HIFA”. Adding the date makes matches sharper.</p>

    <div class="list">
      <EventCard v-for="r in results" :key="r.event.id" :event="r.event" @click="pick(r)">
        <span class="badge" :class="MATCH[r.match]?.[0]">{{ MATCH[r.match]?.[1] || r.match }}</span>
        <span class="badge plain">{{ plural(r.photographer_count, 'photographer') }}</span>
        <span v-if="r.joined" class="badge ok">Joined</span>
        <template #trailing>
          <span class="act">{{ r.joined ? 'Open' : 'Join' }} <Icon name="chevronRight" :size="16" /></span>
        </template>
      </EventCard>
    </div>

    <p v-if="searched && !searching && !results.length" class="hint muted"><Icon name="search" :size="16" /> No events match “{{ searched }}” yet.</p>

    <div v-if="searched && !searching" class="create card">
      <span class="grow">{{ results.length ? 'Not in the list? Create it — we’ll double-check it’s new.' : 'Can’t find it? Create the event.' }}</span>
      <RouterLink :to="{ name: 'studio-create', query: { name: searched, date: date || undefined } }" class="btn primary"><Icon name="plus" :size="16" /> Create</RouterLink>
    </div>

    <PriceDialog v-if="joining" :title="`Join ${joining.event.name}`" :currency="dashboard.currency" confirm-label="Join event" :busy="busy"
                 message="Set your default price per photo or video. You can override it on individual items later."
                 @save="join" @close="joining = null" />
  </div>
</template>

<style scoped>
.narrow { max-width: 760px; }
.back { margin: -6px 0 12px -10px; }
.searchbox { position: relative; display: flex; align-items: center; color: var(--faint); }
.searchbox > svg { position: absolute; left: 14px; }
.searchbox .input { padding: 13px 44px; font-size: 16px; }
.spin { position: absolute; right: 14px; width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--border); border-top-color: var(--brand-1); animation: rot .8s linear infinite; }
@keyframes rot { to { transform: rotate(360deg); } }
.date { width: auto; }
.hint { display: flex; gap: 10px; align-items: flex-start; margin: 18px 4px; }
.hint svg { color: var(--brand-2); flex: none; margin-top: 3px; }
.list { display: grid; gap: 12px; margin-top: 18px; }
.act { color: var(--brand-2); font-weight: 700; display: inline-flex; align-items: center; gap: 2px; }
.create { display: flex; align-items: center; gap: 14px; padding: 16px 18px; margin-top: 18px; border-style: dashed; box-shadow: none; flex-wrap: wrap; }
.create .grow { flex: 1 1 240px; }
</style>
