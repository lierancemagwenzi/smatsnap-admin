<script setup>
import { ref, computed } from 'vue';
import { api } from '../../api/http';
import { toast, toastError } from '../../utils/toast';
import { money, dateTime, relative, titleCase, gateway } from '../../utils/format';
import StatusBadge from '../../components/StatusBadge.vue';
import Icon from '../../components/Icon.vue';

const props = defineProps({ id: String });
const data = ref(null);
const checking = ref(false);

async function load() {
  try { data.value = await api.get(`/admin/orders/${props.id}`); } catch (err) { toastError(err); }
}
load();

const o = computed(() => data.value?.order);
const canRecheck = computed(() => ['PENDING', 'EXPIRED'].includes(o.value?.status));

async function recheck() {
  checking.value = true;
  try {
    const body = await api.post(`/admin/orders/${props.id}/recheck`);
    toast(body.message);
    await load();
  } catch (err) {
    toastError(err);
  } finally {
    checking.value = false;
  }
}
</script>

<template>
  <div>
    <RouterLink to="/admin/orders" class="btn ghost sm back"><Icon name="arrowLeft" :size="16" /> Orders</RouterLink>
    <div v-if="!data" class="loading-bar" />
    <template v-else>
      <div class="page-head">
        <div>
          <h1 class="mono ref">{{ o.reference }}</h1>
          <p class="row wrap"><StatusBadge :status="o.status" /><span>{{ gateway(o.provider) }} · {{ o.method }}</span><span>{{ dateTime(o.created_at) }}</span></p>
        </div>
        <span class="spacer" />
        <button v-if="canRecheck" class="btn primary" :disabled="checking" @click="recheck">
          <Icon name="refresh" :size="16" /> {{ checking ? 'Checking…' : 'Check with gateway' }}
        </button>
      </div>

      <div class="grid">
        <div class="card">
          <div class="card-head"><h3>Payment</h3></div>
          <dl class="kv card-pad">
            <dt>Items</dt><dd>{{ money(o.subtotal, o.currency) }} <span class="muted small">(photographer’s share)</span></dd>
            <dt>Platform fee</dt><dd>{{ money(o.fee, o.currency) }}</dd>
            <dt>Total paid</dt><dd><strong>{{ money(o.total, o.currency) }}</strong></dd>
            <dt>Gateway status</dt><dd>{{ o.provider_status || '—' }}</dd>
            <dt>Payment code</dt><dd class="mono">{{ o.payment_code || '—' }}</dd>
            <dt v-if="o.payer_mobile">Payer mobile</dt><dd v-if="o.payer_mobile">{{ o.payer_mobile }}</dd>
            <dt>Paid</dt><dd>{{ o.paid_at ? dateTime(o.paid_at) : '—' }}</dd>
            <dt>Last checked</dt><dd>{{ relative(o.last_checked_at) }}</dd>
          </dl>
        </div>
        <div class="card">
          <div class="card-head"><h3>People & event</h3></div>
          <dl class="kv card-pad">
            <dt>Client</dt>
            <dd><RouterLink v-if="o.client" :to="`/admin/users/${o.client.id}`">{{ o.client.name }}</RouterLink><div class="muted small">{{ o.client?.email }}</div></dd>
            <dt>Photographer</dt>
            <dd><RouterLink v-if="o.creator" :to="`/admin/users/${o.creator.id}`">{{ o.creator.name }}</RouterLink><div class="muted small">{{ o.creator?.email }}</div></dd>
            <dt>Event</dt>
            <dd><RouterLink v-if="o.event" :to="`/admin/events/${o.event.id}`">{{ o.event.name }}</RouterLink><span v-else>—</span></dd>
          </dl>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Items ({{ data.items.length }})</h3></div>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th></th><th>File</th><th>Media status</th><th class="num">Price</th><th>Download until</th></tr></thead>
            <tbody>
              <tr v-for="it in data.items" :key="it.media_id">
                <td class="thumb-cell">
                  <img v-if="it.thumb_url" :src="it.thumb_url" alt="" class="thumb" loading="lazy" />
                  <span v-else class="thumb ph"><Icon :name="it.type === 'video' ? 'video' : 'image'" :size="16" /></span>
                </td>
                <td class="small">{{ it.filename || `#${it.media_id}` }}</td>
                <td><StatusBadge :status="it.media_status" /></td>
                <td class="num">{{ money(it.price, o.currency) }}</td>
                <td class="small nowrap">{{ it.download_until ? dateTime(it.download_until) : '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.back { margin-bottom: 12px; }
.ref { font-size: 20px !important; overflow-wrap: anywhere; }
.page-head p { gap: 10px; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; margin-bottom: 16px; }
.thumb-cell { width: 64px; }
.thumb { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; }
.thumb.ph { display: grid; place-items: center; background: var(--surface-2); color: var(--faint); }
</style>
