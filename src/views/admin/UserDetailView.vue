<script setup>
import { ref, computed } from 'vue';
import { api } from '../../api/http';
import { toast, toastError } from '../../utils/toast';
import { number, plural, money, moneyList, dateTime, relative } from '../../utils/format';
import StatusBadge from '../../components/StatusBadge.vue';
import StatCard from '../../components/StatCard.vue';
import ConfirmDialog from '../../components/ConfirmDialog.vue';
import Icon from '../../components/Icon.vue';

const props = defineProps({ id: String });
const data = ref(null);
const confirming = ref(false);
const busy = ref(false);

async function load() {
  try { data.value = await api.get(`/admin/users/${props.id}`); } catch (err) { toastError(err); }
}
load();

const u = computed(() => data.value?.user);
const isCreator = computed(() => u.value?.user_type === 'creator');
const suspended = computed(() => u.value?.status === 'suspended');

async function toggleStatus(reason) {
  busy.value = true;
  try {
    const body = await api.put(`/admin/users/${props.id}/status`, { status: suspended.value ? 'active' : 'suspended', reason });
    toast(body.message);
    confirming.value = false;
    await load();
  } catch (err) {
    toastError(err);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div>
    <RouterLink to="/admin/users" class="btn ghost sm back"><Icon name="arrowLeft" :size="16" /> Users</RouterLink>
    <div v-if="!data" class="loading-bar" />
    <template v-else>
      <div class="page-head">
        <div class="row">
          <span class="avatar big">{{ (u.name[0] + u.lastname[0]).toUpperCase() }}</span>
          <div>
            <h1>{{ u.name }} {{ u.lastname }}</h1>
            <p class="row wrap"><span>{{ u.email }}</span><StatusBadge :status="u.user_type" /><StatusBadge :status="u.status" /></p>
          </div>
        </div>
        <span class="spacer" />
        <button class="btn" :class="suspended ? 'primary' : 'danger'" @click="confirming = true">
          {{ suspended ? 'Reactivate account' : 'Suspend account' }}
        </button>
      </div>

      <div class="kpis">
        <template v-if="isCreator">
          <StatCard label="Earnings" :value="moneyList(data.stats.earnings, 'earnings')" icon="wallet" :hint="`${plural(data.stats.items_sold, 'item')} sold`" />
          <StatCard label="Events joined" :value="number(data.stats.events)" icon="calendar" />
          <StatCard label="Live media" :value="number(data.stats.live_media)" icon="image" :hint="`${number(data.stats.total_uploads)} uploaded all-time`" />
        </template>
        <template v-else>
          <StatCard label="Spent" :value="moneyList(data.stats.spent, 'gross')" icon="receipt" :hint="`${plural(data.stats.purchases, 'item')} bought`" />
          <StatCard label="Events searched" :value="number(data.stats.events_searched)" icon="search" />
          <StatCard label="Face matches" :value="number(data.stats.matches)" icon="scan" />
        </template>
      </div>

      <div class="grid">
        <div class="card">
          <div class="card-head"><h3>Account</h3></div>
          <dl class="kv card-pad">
            <dt>User ID</dt><dd class="mono">{{ u.id }}</dd>
            <dt>Joined</dt><dd>{{ dateTime(u.created_at) }}</dd>
            <dt>Email verified</dt><dd>{{ u.email_verified_at ? dateTime(u.email_verified_at) : 'Not yet' }}</dd>
            <dt>Last sign-in</dt><dd>{{ relative(u.last_login_at) }}</dd>
            <dt v-if="!isCreator">Face consent</dt><dd v-if="!isCreator">{{ u.face_consent_at ? dateTime(u.face_consent_at) : 'Not given' }}</dd>
          </dl>
        </div>
        <div v-if="isCreator" class="card">
          <div class="card-head"><h3>Payout account</h3></div>
          <dl v-if="u.payout" class="kv card-pad">
            <dt>Gateway</dt><dd>{{ u.payout.provider_label }} <StatusBadge :status="u.payout.status" /></dd>
            <dt>Country</dt><dd>{{ u.payout.country }} · sells in {{ u.payout.currency }}</dd>
            <dt>Business name</dt><dd>{{ u.payout.display_name }}</dd>
            <dt>Account ID</dt><dd class="mono">{{ u.payout.account_id }}</dd>
            <dt>Details</dt><dd>{{ u.payout.summary || '—' }}</dd>
            <dt>Gateway approved</dt><dd>{{ u.payout.approved ? 'Yes' : 'No' }}</dd>
          </dl>
          <div v-else class="empty">This photographer hasn’t set up a payout account, so they can’t sell yet.</div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <h3>Recent orders</h3>
          <span class="spacer" />
          <RouterLink :to="{ path: '/admin/orders', query: { [isCreator ? 'creator_id' : 'client_id']: u.id } }" class="small muted">All orders →</RouterLink>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>Reference</th><th>Event</th><th>{{ isCreator ? 'Client' : 'Photographer' }}</th><th>Status</th><th class="num">Total</th><th>Created</th></tr></thead>
            <tbody>
              <tr v-for="o in data.recent_orders" :key="o.id" class="clickable" @click="$router.push(`/admin/orders/${o.id}`)">
                <td class="mono">{{ o.reference }}</td>
                <td>{{ o.event?.name || '—' }}</td>
                <td>{{ (isCreator ? o.client : o.creator)?.name || '—' }}</td>
                <td><StatusBadge :status="o.status" /></td>
                <td class="num">{{ money(o.total, o.currency) }}</td>
                <td class="small nowrap">{{ dateTime(o.created_at) }}</td>
              </tr>
              <tr v-if="!data.recent_orders.length"><td colspan="6" class="empty">No orders yet</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <ConfirmDialog v-if="confirming" :title="suspended ? 'Reactivate this account?' : 'Suspend this account?'"
                   :message="suspended ? 'They’ll be able to sign in again.' : 'They’ll be signed out everywhere and can’t sign in until reactivated. Their media and orders are kept.'"
                   :confirm-label="suspended ? 'Reactivate' : 'Suspend'" :danger="!suspended" ask-reason :busy="busy"
                   @close="confirming = false" @confirm="toggleStatus" />
  </div>
</template>

<style scoped>
.back { margin-bottom: 12px; }
.avatar.big { width: 56px; height: 56px; font-size: 20px; }
.page-head p { gap: 8px; }
.kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 16px; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; margin-bottom: 16px; }
</style>
