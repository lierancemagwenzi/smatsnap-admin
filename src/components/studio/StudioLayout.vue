<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { studioSession } from '../../studio/session';
import { dashboard, loadDashboard } from '../../studio/store';
import { activeCount } from '../../studio/uploads';
import AppShell from '../AppShell.vue';
import Icon from '../Icon.vue';

const router = useRouter();
onMounted(loadDashboard);

const nav = computed(() => [
  { to: '/studio', label: 'Home', icon: 'home', exact: true },
  { to: '/studio/events', label: 'My events', icon: 'calendar', badge: activeCount.value ? `${activeCount.value} ↑` : null },
  { to: '/studio/sales', label: 'Sales', icon: 'wallet' },
  { to: '/studio/account', label: 'Account', icon: 'user' },
]);

// Selling needs a payout account; set it up first.
const addTarget = computed(() => (dashboard.payout_ready ? { name: 'studio-find' } : { name: 'studio-payout' }));

async function logout() {
  if (activeCount.value && !window.confirm('Uploads are still in progress. Sign out and stop them?')) return;
  await studioSession.logout();
  router.replace({ name: 'studio-login' });
}
</script>

<template>
  <AppShell :nav="nav" home="/studio" sub="Studio" :user="studioSession.user.value" role="Photographer" @logout="logout">
    <template #action>
      <RouterLink :to="addTarget" class="btn primary"><Icon name="plus" :size="16" /> Add event</RouterLink>
    </template>
    <template #topbar>
      <RouterLink :to="addTarget" class="btn primary sm top-add"><Icon name="plus" :size="15" /> Add event</RouterLink>
    </template>
  </AppShell>
</template>

<style scoped>
.top-add { display: none; }
@media (max-width: 960px) { .top-add { display: inline-flex; } }
</style>
