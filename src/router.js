import { createRouter, createWebHistory } from 'vue-router';
import { session } from './session';
import { setSessionLostHandler } from './api/http';
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
  return true;
});

router.afterEach((to) => {
  const title = to.meta.title || 'SmatSnap';
  document.title = to.name === 'landing' ? title : `${title} · SmatSnap Admin`;
});

setSessionLostHandler(() => {
  session.clear();
  const current = router.currentRoute.value;
  if (current.matched.some((r) => r.meta.auth)) router.replace({ name: 'login', query: { redirect: current.fullPath } });
});

export default router;
