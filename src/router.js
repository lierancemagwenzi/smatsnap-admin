import { createRouter, createWebHistory } from 'vue-router';
import { session } from './session';
import { setSessionLostHandler } from './api/http';
import { studioSession } from './studio/session';
import { setSessionLostHandler as setStudioSessionLostHandler } from './studio/http';
import LandingPage from './views/LandingPage.vue';

const routes = [
  { path: '/', name: 'landing', component: LandingPage, meta: { title: 'SmatSnap — Event photos, found by your face' } },
  { path: '/admin/login', name: 'login', component: () => import('./views/admin/LoginView.vue'), meta: { title: 'Admin sign in' } },
  { path: '/admin/set-password', name: 'set-password', component: () => import('./views/admin/SetPasswordView.vue'), meta: { title: 'Set password' } },
  {
    path: '/admin',
    component: () => import('./components/AdminLayout.vue'),
    meta: { auth: true },
    children: [
      { path: '', name: 'dashboard', component: () => import('./views/admin/DashboardView.vue'), meta: { title: 'Overview' } },
      { path: 'users', name: 'users', component: () => import('./views/admin/UsersView.vue'), meta: { title: 'Users' } },
      { path: 'users/:id', name: 'user', component: () => import('./views/admin/UserDetailView.vue'), meta: { title: 'User' }, props: true },
      { path: 'events', name: 'events', component: () => import('./views/admin/EventsView.vue'), meta: { title: 'Events' } },
      { path: 'events/:id', name: 'event', component: () => import('./views/admin/EventDetailView.vue'), meta: { title: 'Event' }, props: true },
      { path: 'orders', name: 'orders', component: () => import('./views/admin/OrdersView.vue'), meta: { title: 'Orders' } },
      { path: 'orders/:id', name: 'order', component: () => import('./views/admin/OrderDetailView.vue'), meta: { title: 'Order' }, props: true },
      { path: 'payouts', name: 'payouts', component: () => import('./views/admin/PayoutsView.vue'), meta: { title: 'Payout accounts' } },
      { path: 'admins', name: 'admins', component: () => import('./views/admin/AdminsView.vue'), meta: { title: 'Admins', superAdmin: true } },
      { path: 'activity', name: 'activity', component: () => import('./views/admin/ActivityView.vue'), meta: { title: 'Activity log' } },
      { path: 'system', name: 'system', component: () => import('./views/admin/SystemView.vue'), meta: { title: 'System health' } },
    ],
  },

  // Photographer studio — the app's creator features on the web.
  { path: '/studio/login', name: 'studio-login', component: () => import('./views/studio/LoginView.vue'), meta: { title: 'Photographer sign in', studioGuest: true } },
  { path: '/studio/register', name: 'studio-register', component: () => import('./views/studio/RegisterView.vue'), meta: { title: 'Create photographer account', studioGuest: true } },
  { path: '/studio/verify', name: 'studio-verify', component: () => import('./views/studio/VerifyView.vue'), meta: { title: 'Enter your code' } },
  { path: '/studio/forgot', name: 'studio-forgot', component: () => import('./views/studio/ForgotView.vue'), meta: { title: 'Forgot password' } },
  { path: '/studio/reset', name: 'studio-reset', component: () => import('./views/studio/ResetView.vue'), meta: { title: 'New password' } },
  {
    path: '/studio',
    component: () => import('./components/studio/StudioLayout.vue'),
    meta: { studio: true },
    children: [
      { path: '', name: 'studio-home', component: () => import('./views/studio/HomeView.vue'), meta: { title: 'Home' } },
      { path: 'events', name: 'studio-events', component: () => import('./views/studio/EventsView.vue'), meta: { title: 'My events' } },
      { path: 'events/find', name: 'studio-find', component: () => import('./views/studio/FindEventView.vue'), meta: { title: 'Find your event' } },
      { path: 'events/new', name: 'studio-create', component: () => import('./views/studio/CreateEventView.vue'), meta: { title: 'Create event' } },
      { path: 'events/:id(\\d+)', name: 'studio-event', component: () => import('./views/studio/EventView.vue'), meta: { title: 'Event' }, props: true },
      { path: 'sales', name: 'studio-sales', component: () => import('./views/studio/SalesView.vue'), meta: { title: 'Sales' } },
      { path: 'payout', name: 'studio-payout', component: () => import('./views/studio/PayoutView.vue'), meta: { title: 'Set up payments' } },
      { path: 'account', name: 'studio-account', component: () => import('./views/studio/AccountView.vue'), meta: { title: 'Account' } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (to, from, saved) => saved || { top: 0 },
});

router.beforeEach(async (to) => {
  if (to.matched.some((r) => r.meta.auth)) {
    const user = await session.restore();
    if (!user) return { name: 'login', query: to.fullPath !== '/admin' ? { redirect: to.fullPath } : {} };
    if (to.meta.superAdmin && user.admin_role !== 'super_admin') return { name: 'dashboard' };
  }
  if (to.name === 'login' && (await session.restore())) return { name: 'dashboard' };
  if (to.matched.some((r) => r.meta.studio) && !(await studioSession.restore())) {
    return { name: 'studio-login', query: to.fullPath !== '/studio' ? { redirect: to.fullPath } : {} };
  }
  if (to.meta.studioGuest && (await studioSession.restore())) return { name: 'studio-home' };
  return true;
});

router.afterEach((to) => {
  const title = to.meta.title || 'SmatSnap';
  const area = to.path.startsWith('/studio') ? 'SmatSnap Studio' : 'SmatSnap Admin';
  document.title = to.name === 'landing' ? title : `${title} · ${area}`;
});

setSessionLostHandler(() => {
  session.clear();
  const current = router.currentRoute.value;
  if (current.matched.some((r) => r.meta.auth)) router.replace({ name: 'login', query: { redirect: current.fullPath } });
});

setStudioSessionLostHandler(() => {
  studioSession.clear();
  const current = router.currentRoute.value;
  if (current.matched.some((r) => r.meta.studio)) router.replace({ name: 'studio-login', query: { redirect: current.fullPath } });
});

export default router;
