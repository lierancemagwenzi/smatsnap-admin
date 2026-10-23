<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../../studio/http';
import { studioSession } from '../../studio/session';
import { dashboard, loadDashboard } from '../../studio/store';
import { activeCount } from '../../studio/uploads';
import { money, number, flag } from '../../utils/format';
import { theme, setTheme } from '../../utils/theme';
import ConfirmDialog from '../../components/ConfirmDialog.vue';
import StatusBadge from '../../components/StatusBadge.vue';
import Icon from '../../components/Icon.vue';

const router = useRouter();
const user = studioSession.user;
const eventCount = ref(null);
const confirming = ref(false);

onMounted(async () => {
  loadDashboard();
  try { eventCount.value = (await api.get('/creator/events')).events.length; } catch { eventCount.value = null; }
});

async function logout() {
  await studioSession.logout();
  router.replace({ name: 'studio-login' });
}

const initials = () => `${user.value?.name?.[0] || ''}${user.value?.lastname?.[0] || ''}`.toUpperCase();
const themes = [['system', 'System', 'monitor'], ['light', 'Light', 'sun'], ['dark', 'Dark', 'moon']];
</script>

<template>
  <div class="narrow">
    <div class="profile card">
      <div class="banner"><Icon name="camera" :size="120" /></div>
      <div class="avatar big">{{ initials() }}</div>
      <h1>{{ user?.name }} {{ user?.lastname }}</h1>
      <p class="muted">{{ user?.email }}</p>
      <span class="role">Photographer</span>
      <div class="nums">
        <div><strong>{{ eventCount ?? '—' }}</strong><span class="small muted">Events</span></div>
        <div><strong>{{ number(dashboard.uploads) }}</strong><span class="small muted">Live uploads</span></div>
        <div><strong>{{ money(dashboard.earned, dashboard.currency) }}</strong><span class="small muted">Earned</span></div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Payout account</h3></div>
      <div class="card-pad">
        <div v-if="!dashboard.loaded" class="skeleton" style="height: 60px" />
        <div v-else-if="!dashboard.payout" class="row wrap">
          <p class="muted grow">You haven’t set up payments yet — clients can’t buy your photos until you do.</p>
          <RouterLink :to="{ name: 'studio-payout' }" class="btn primary">Set up payments</RouterLink>
        </div>
        <dl v-else class="kv">
          <dt>Provider</dt><dd>{{ dashboard.payout.provider_label }} <span v-if="dashboard.payout.test_mode" class="badge info plain">Test mode</span></dd>
          <dt>Country</dt><dd>{{ flag(dashboard.payout.country) }} {{ dashboard.payout.country }} · prices in {{ dashboard.payout.currency }}</dd>
          <dt>Name</dt><dd>{{ dashboard.payout.display_name || '—' }}</dd>
          <template v-if="dashboard.payout.summary"><dt>Details</dt><dd>{{ dashboard.payout.summary }}</dd></template>
          <dt>Status</dt><dd><StatusBadge :status="dashboard.payout.status" /> <span v-if="!dashboard.payout.approved" class="small muted">Not live yet</span></dd>
        </dl>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Appearance</h3></div>
      <div class="card-pad">
        <div class="seg" role="radiogroup" aria-label="Theme">
          <button v-for="[v, label, icon] in themes" :key="v" class="seg-btn" :class="{ on: theme === v }" role="radio" :aria-checked="theme === v" @click="setTheme(v)">
            <Icon :name="icon" :size="15" /> {{ label }}
          </button>
        </div>
      </div>
    </div>

    <div class="card card-pad row wrap">
      <div class="grow">
        <strong>Get the app</strong>
        <p class="small muted">Upload straight from your phone at the event — same account, same events.</p>
      </div>
      <RouterLink to="/#download" class="btn">Download</RouterLink>
    </div>

    <button class="btn danger lg" @click="confirming = true"><Icon name="logout" :size="16" /> Log out</button>

    <ConfirmDialog v-if="confirming" title="Log out?" confirm-label="Log out" danger @confirm="logout" @close="confirming = false"
                   :message="activeCount ? 'Uploads still in progress will stop.' : 'You’ll need your email and password to sign back in.'" />
  </div>
</template>

<style scoped>
.narrow { max-width: 680px; display: flex; flex-direction: column; gap: 16px; }
.profile { overflow: hidden; display: flex; flex-direction: column; align-items: center; text-align: center; padding-bottom: 22px; }
.banner { width: 100%; height: 130px; background: linear-gradient(120deg, #2a0f3d, var(--brand-1), var(--brand-2)); color: rgba(255, 255, 255, .12); display: grid; place-items: center; overflow: hidden; }
.avatar.big { width: 96px; height: 96px; border-radius: 26px; font-size: 32px; margin-top: -48px; border: 4px solid var(--surface); }
.profile h1 { font-size: 22px; font-weight: 800; margin-top: 12px; }
.role { margin-top: 10px; background: color-mix(in srgb, var(--brand-2) 14%, transparent); color: var(--brand-2); font-weight: 700; font-size: 12px; padding: 4px 14px; border-radius: 999px; }
.nums { display: grid; grid-template-columns: repeat(3, 1fr); width: 100%; margin-top: 20px; }
.nums div { display: flex; flex-direction: column; }
.nums strong { font-size: 18px; }
.grow { flex: 1 1 240px; }
.seg { display: inline-flex; background: var(--surface-2); border-radius: 999px; padding: 4px; gap: 4px; flex-wrap: wrap; }
.seg-btn { border: none; background: transparent; padding: 7px 16px; border-radius: 999px; font-weight: 600; font-size: 14px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; color: var(--muted); }
.seg-btn.on { background: var(--surface); color: var(--text); box-shadow: var(--shadow); }
</style>
