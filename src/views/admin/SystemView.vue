<script setup>
import { ref, onBeforeUnmount } from 'vue';
import { api } from '../../api/http';
import { toastError } from '../../utils/toast';
import { number, duration, relative } from '../../utils/format';
import Icon from '../../components/Icon.vue';

const sys = ref(null);
const loading = ref(false);

async function load() {
  loading.value = true;
  try { sys.value = await api.get('/admin/system'); } catch (err) { toastError(err); } finally { loading.value = false; }
}
load();
const timer = setInterval(load, 30000);
onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1>System health</h1>
        <p>Services, payment gateways and background work. Refreshes every 30 seconds.</p>
      </div>
      <span class="spacer" />
      <button class="btn" :disabled="loading" @click="load"><Icon name="refresh" :size="16" /> Refresh</button>
    </div>
    <div v-if="loading && !sys" class="loading-bar" />

    <template v-if="sys">
      <div class="checks">
        <div class="check card">
          <span class="light ok" />
          <div><strong>API</strong><p class="small muted">{{ sys.api.environment }} · Node {{ sys.api.node }} · up {{ duration(sys.api.uptime_seconds) }}</p></div>
        </div>
        <div class="check card">
          <span class="light" :class="sys.database.ok ? 'ok' : 'bad'" />
          <div><strong>Database</strong><p class="small muted">{{ sys.database.ok ? 'Connected' : sys.database.error }}</p></div>
        </div>
        <div class="check card">
          <span class="light" :class="sys.face.ok ? 'ok' : 'bad'" />
          <div><strong>Face matching</strong><p class="small muted">{{ sys.face.provider }} · {{ sys.face.detail }}</p></div>
        </div>
        <div class="check card">
          <span class="light" :class="sys.email.configured ? 'ok' : 'warn'" />
          <div><strong>Email</strong><p class="small muted">{{ sys.email.configured ? `Sending as ${sys.email.from || 'default sender'}` : 'SMTP not configured: codes are only logged' }}</p></div>
        </div>
        <div class="check card">
          <span class="light" :class="sys.storage.bucket ? 'ok' : 'bad'" />
          <div><strong>Storage</strong><p class="small muted">{{ sys.storage.bucket || 'No bucket configured' }} · {{ sys.storage.region }}</p></div>
        </div>
      </div>

      <div class="card section">
        <div class="card-head"><h3>Payment gateways</h3></div>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>Gateway</th><th>Status</th><th>Mode</th><th>Countries</th></tr></thead>
            <tbody>
              <tr v-for="g in sys.gateways" :key="g.name">
                <td><strong>{{ g.label }}</strong></td>
                <td><span class="badge" :class="g.configured ? 'ok' : 'bad'">{{ g.configured ? 'Configured' : 'Not configured' }}</span></td>
                <td>
                  <span v-if="!g.configured" class="faint">—</span>
                  <span v-else class="badge" :class="g.test_mode ? 'warn' : 'ok'">
                    {{ g.test_mode ? 'Test mode' : 'Live' }}<template v-if="g.name === 'smatpay'"> · {{ sys.smatpay_plane }}</template>
                  </span>
                </td>
                <td class="small">{{ g.countries.map((c) => `${c.name} (${c.currency})`).join(', ') || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Background work</h3></div>
        <div class="queues">
          <div><span class="q">{{ number(sys.queues.media_waiting) }}</span><span class="muted small">Media waiting to process</span></div>
          <div><span class="q">{{ number(sys.queues.media_processing) }}</span><span class="muted small">Processing now</span></div>
          <div><span class="q" :class="{ bad: sys.queues.media_failed_24h }">{{ number(sys.queues.media_failed_24h) }}</span><span class="muted small">Failed in last 24h</span></div>
          <div><span class="q" :class="{ warn: sys.queues.face_index_failed }">{{ number(sys.queues.face_index_failed) }}</span><span class="muted small">Face indexing to retry</span></div>
          <div>
            <span class="q">{{ number(sys.queues.orders_pending) }}</span>
            <span class="muted small">Pending payments<template v-if="sys.queues.oldest_pending_order_at"> · oldest {{ relative(sys.queues.oldest_pending_order_at) }}</template></span>
          </div>
        </div>
        <p class="small muted foot">Public API URL: <span class="mono">{{ sys.api.public_url || 'not set (Paystack can’t redirect back)' }}</span></p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.checks { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 16px; margin-bottom: 16px; }
.check { display: flex; gap: 14px; padding: 18px 20px; align-items: flex-start; }
.check p { overflow-wrap: anywhere; }
.light { width: 12px; height: 12px; border-radius: 50%; margin-top: 5px; flex: none; background: var(--faint); }
.light.ok { background: var(--ok); box-shadow: 0 0 0 4px var(--ok-bg); }
.light.warn { background: var(--warn); box-shadow: 0 0 0 4px var(--warn-bg); }
.light.bad { background: var(--bad); box-shadow: 0 0 0 4px var(--bad-bg); }
.section { margin-bottom: 16px; }
.queues { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 1px; background: var(--border); }
.queues > div { background: var(--surface); padding: 18px 20px; display: flex; flex-direction: column; gap: 4px; }
.q { font-size: 26px; font-weight: 800; font-variant-numeric: tabular-nums; }
.q.bad { color: var(--bad); }
.q.warn { color: var(--warn); }
.foot { padding: 14px 20px; border-top: 1px solid var(--border); }
</style>
