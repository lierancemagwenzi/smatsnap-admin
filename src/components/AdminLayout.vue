<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { session } from '../session';
import AppShell from './AppShell.vue';
import Icon from './Icon.vue';

const router = useRouter();

const nav = computed(() => [
  { to: '/admin', label: 'Overview', icon: 'grid', exact: true },
  { to: '/admin/users', label: 'Users', icon: 'users' },
  { to: '/admin/events', label: 'Events', icon: 'calendar' },
  { to: '/admin/orders', label: 'Orders', icon: 'receipt' },
  { to: '/admin/payouts', label: 'Payout accounts', icon: 'wallet' },
  ...(session.isSuper.value ? [{ to: '/admin/admins', label: 'Admins', icon: 'shield' }] : []),
  { to: '/admin/activity', label: 'Activity log', icon: 'activity' },
  { to: '/admin/system', label: 'System health', icon: 'server' },
]);

async function logout() {
  await session.logout();
  router.replace({ name: 'login' });
}
</script>

<template>
  <AppShell :nav="nav" home="/admin" sub="Admin" :user="session.user.value" :role="session.isSuper.value ? 'Super admin' : 'Admin'" @logout="logout">
    <template #topbar>
      <RouterLink to="/" class="btn ghost sm" target="_blank"><Icon name="external" :size="15" /> <span class="hide-sm">Website</span></RouterLink>
    </template>
  </AppShell>
</template>

<style scoped>
@media (max-width: 480px) { .hide-sm { display: none; } }
</style>
