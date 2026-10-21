<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { session } from '../session';
import Icon from './Icon.vue';
import BrandMark from './BrandMark.vue';

const route = useRoute();
const router = useRouter();
const open = ref(false);
watch(() => route.fullPath, () => { open.value = false; });

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
const isActive = (item) => (item.exact ? route.path === item.to : route.path.startsWith(item.to));
const initials = computed(() => {
  const u = session.user.value;
  return u ? `${u.name?.[0] || ''}${u.lastname?.[0] || ''}`.toUpperCase() : '';
});

async function logout() {
  await session.logout();
  router.replace({ name: 'login' });
}
</script>

<template>
  <div class="shell">
    <aside class="side" :class="{ open }">
      <div class="side-head">
        <RouterLink to="/admin" class="brand-link"><BrandMark :size="34" sub="Admin" /></RouterLink>
        <button class="btn ghost sm close" @click="open = false" aria-label="Close menu"><Icon name="x" /></button>
      </div>
      <nav>
        <RouterLink v-for="item in nav" :key="item.to" :to="item.to" class="nav-item" :class="{ active: isActive(item) }">
          <Icon :name="item.icon" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
      <div class="side-foot">
        <div class="me">
          <span class="avatar">{{ initials }}</span>
          <div class="who">
            <strong>{{ session.user.value?.name }} {{ session.user.value?.lastname }}</strong>
            <span class="faint small">{{ session.isSuper.value ? 'Super admin' : 'Admin' }}</span>
          </div>
        </div>
        <button class="btn ghost sm" @click="logout" title="Sign out" aria-label="Sign out"><Icon name="logout" :size="16" /></button>
      </div>
    </aside>
    <div v-if="open" class="scrim" @click="open = false" />

    <div class="main">
      <header class="topbar">
        <button class="btn ghost sm menu" @click="open = true" aria-label="Open menu"><Icon name="menu" /></button>
        <BrandMark class="top-brand" :size="28" />
        <span class="spacer" />
        <RouterLink to="/" class="btn ghost sm" target="_blank"><Icon name="external" :size="15" /> <span class="hide-sm">Website</span></RouterLink>
      </header>
      <main class="content">
        <RouterView v-slot="{ Component }">
          <component :is="Component" :key="$route.fullPath.split('?')[0]" />
        </RouterView>
      </main>
    </div>
  </div>
</template>

<style scoped>
.shell { display: flex; min-height: 100vh; }
.side {
  width: 250px; flex: none; position: sticky; top: 0; height: 100vh;
  display: flex; flex-direction: column; background: var(--surface); border-right: 1px solid var(--border);
}
.side-head { display: flex; align-items: center; padding: 20px 18px 16px; }
.brand-link { text-decoration: none; }
.close { display: none; margin-left: auto; }
nav { display: flex; flex-direction: column; gap: 2px; padding: 8px 12px; flex: 1; overflow-y: auto; }
.nav-item {
  display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 12px;
  text-decoration: none; color: var(--muted); font-weight: 600; font-size: 14px;
}
.nav-item:hover { background: var(--surface-2); color: var(--text); }
.nav-item.active { background: var(--info-bg); color: var(--info); }
.side-foot { display: flex; align-items: center; gap: 8px; padding: 14px 16px; border-top: 1px solid var(--border); }
.me { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.who { display: flex; flex-direction: column; min-width: 0; font-size: 14px; }
.who strong { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.topbar { display: flex; align-items: center; gap: 8px; padding: 12px 28px; border-bottom: 1px solid var(--border); background: color-mix(in srgb, var(--bg) 85%, transparent); backdrop-filter: blur(8px); position: sticky; top: 0; z-index: 10; }
.menu, .top-brand { display: none; }
.content { padding: 28px; max-width: 1280px; width: 100%; }
.scrim { display: none; }

@media (max-width: 960px) {
  .side { position: fixed; left: 0; top: 0; z-index: 40; transform: translateX(-100%); transition: transform .2s; box-shadow: var(--shadow); }
  .side.open { transform: none; }
  .close, .menu, .top-brand { display: inline-flex; }
  .scrim { display: block; position: fixed; inset: 0; background: rgba(12, 4, 18, .45); z-index: 30; }
  .topbar { padding: 10px 16px; }
  .content { padding: 20px 16px; }
}
@media (max-width: 480px) { .hide-sm { display: none; } }
</style>
