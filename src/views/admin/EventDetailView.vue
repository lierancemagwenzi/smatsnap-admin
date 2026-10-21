<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { api } from '../../api/http';
import { toast, toastError } from '../../utils/toast';
import { number, plural, money, moneyList, date, dateTime, bytes, relative } from '../../utils/format';
import StatusBadge from '../../components/StatusBadge.vue';
import StatCard from '../../components/StatCard.vue';
import ConfirmDialog from '../../components/ConfirmDialog.vue';
import Modal from '../../components/Modal.vue';
import Pager from '../../components/Pager.vue';
import Icon from '../../components/Icon.vue';

const props = defineProps({ id: String });
const data = ref(null);
const confirmingStatus = ref(false);
const busy = ref(false);

const media = ref(null);
const mediaLoading = ref(false);
const mediaPage = ref(1);
const mediaFilters = reactive({ creator_id: '', type: '', status: '' });
const viewing = ref(null);
const deleting = ref(null);
const forceDelete = ref(false);

async function load() {
  try { data.value = await api.get(`/admin/events/${props.id}`); } catch (err) { toastError(err); }
}
async function loadMedia() {
  mediaLoading.value = true;
  try {
    media.value = await api.get(`/admin/events/${props.id}/media`, { ...mediaFilters, page: mediaPage.value, size: 24 });
  } catch (err) {
    toastError(err);
  } finally {
    mediaLoading.value = false;
  }
}
load();
loadMedia();
watch(mediaFilters, () => { mediaPage.value = 1; loadMedia(); });
watch(mediaPage, loadMedia);

const e = computed(() => data.value?.event);
const hidden = computed(() => e.value?.status === 'hidden');
const liveMedia = computed(() => {
  const by = data.value?.media_by_status || {};
  return (by.ready || 0) + (by.uploaded || 0) + (by.processing || 0);
});

async function toggleStatus(reason) {
  busy.value = true;
  try {
    const body = await api.put(`/admin/events/${props.id}/status`, { status: hidden.value ? 'active' : 'hidden', reason });
    toast(body.message);
    confirmingStatus.value = false;
    await load();
  } catch (err) {
    toastError(err);
  } finally {
    busy.value = false;
  }
}

function askDelete(m) {
  forceDelete.value = false;
  deleting.value = m;
}

async function deleteMedia(reason) {
  busy.value = true;
  try {
    const body = await api.del(`/admin/media/${deleting.value.id}`, forceDelete.value ? { force: 'true' } : undefined, { reason });
    toast(body.message);
    deleting.value = null;
    viewing.value = null;
    await Promise.all([loadMedia(), load()]);
  } catch (err) {
    // Bought items need a second, explicit confirmation (the dialog explains it).
    if (err.code === 'PURCHASED') forceDelete.value = true;
    else toastError(err);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div>
    <RouterLink to="/admin/events" class="btn ghost sm back"><Icon name="arrowLeft" :size="16" /> Events</RouterLink>
    <div v-if="!data" class="loading-bar" />
    <template v-else>
      <div class="page-head">
        <div>
          <h1>{{ e.name }}</h1>
          <p class="row wrap">
            <span class="mono">{{ e.code }}</span>
            <span>{{ [e.venue, e.city].filter(Boolean).join(', ') }}</span>
            <span>{{ date(e.start_date) }}<template v-if="e.end_date && e.end_date !== e.start_date"> – {{ date(e.end_date) }}</template></span>
            <StatusBadge :status="e.status" />
          </p>
        </div>
        <span class="spacer" />
        <button class="btn" :class="hidden ? 'primary' : 'danger'" @click="confirmingStatus = true">
          <Icon :name="hidden ? 'eye' : 'eyeOff'" :size="16" /> {{ hidden ? 'Make visible' : 'Hide event' }}
        </button>
      </div>

      <div v-if="hidden" class="form-error banner">This event is hidden: clients can’t find it and photographers can’t join it.</div>

      <div class="kpis">
        <StatCard label="Sales" :value="moneyList(data.sales, 'gross')" icon="receipt"
                  :to="{ path: '/admin/orders', query: { event_id: e.id } }">
          {{ plural(data.sales.reduce((a, s) => a + s.orders, 0), 'paid order') }}
        </StatCard>
        <StatCard label="Photographers" :value="number(data.photographers.length)" icon="camera" />
        <StatCard label="Live media" :value="number(liveMedia)" icon="image" :hint="data.media_by_status.failed ? `${data.media_by_status.failed} failed` : ''" />
        <StatCard label="Client searches" :value="number(data.client_searches)" icon="scan" :hint="plural(data.matches, 'face match', 'face matches')" />
      </div>

      <div class="card section">
        <div class="card-head"><h3>Photographers</h3><span class="spacer" /><span class="muted small">Created by {{ e.created_by?.name || '—' }} · {{ dateTime(e.created_at) }}</span></div>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>Photographer</th><th>Status</th><th class="num">Event price</th><th class="num">Live media</th><th>Joined</th></tr></thead>
            <tbody>
              <tr v-for="p in data.photographers" :key="p.id" class="clickable" @click="$router.push(`/admin/users/${p.id}`)">
                <td><strong>{{ p.name }}</strong><div class="muted small">{{ p.email }}</div></td>
                <td><StatusBadge :status="p.status" /></td>
                <td class="num">{{ money(p.price, p.currency) }}</td>
                <td class="num">{{ number(p.live_media) }}</td>
                <td class="small nowrap">{{ date(p.joined_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h3>Media</h3><span class="spacer" /><span class="muted small">Watermarked previews</span></div>
        <div class="filters">
          <select v-model="mediaFilters.creator_id" class="select" aria-label="Photographer">
            <option value="">All photographers</option>
            <option v-for="p in data.photographers" :key="p.id" :value="String(p.id)">{{ p.name }}</option>
          </select>
          <select v-model="mediaFilters.type" class="select" aria-label="Type">
            <option value="">Photos & videos</option>
            <option value="photo">Photos</option>
            <option value="video">Videos</option>
          </select>
          <select v-model="mediaFilters.status" class="select" aria-label="Status">
            <option value="">Not deleted</option>
            <option value="ready">Ready</option>
            <option value="processing">Processing</option>
            <option value="uploaded">Waiting</option>
            <option value="failed">Failed</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
        <div v-if="mediaLoading" class="loading-bar" />
        <div v-if="media?.media.length" class="gallery">
          <button v-for="m in media.media" :key="m.id" class="tile" @click="viewing = m">
            <img v-if="m.thumb_url" :src="m.thumb_url" :alt="m.filename" loading="lazy" />
            <span v-else class="ph"><Icon :name="m.type === 'video' ? 'video' : 'image'" :size="24" /></span>
            <span class="tags">
              <span v-if="m.type === 'video'" class="tag"><Icon name="video" :size="11" /></span>
              <span v-if="m.sold" class="tag ok">{{ m.sold }} sold</span>
              <span v-if="m.status !== 'ready'" class="tag" :class="{ bad: ['failed', 'deleted'].includes(m.status) }">{{ m.status }}</span>
            </span>
          </button>
        </div>
        <div v-else-if="media" class="empty">No media here</div>
        <Pager v-if="media" v-model:page="mediaPage" :size="media.size" :total="media.total" />
      </div>
    </template>

    <Modal v-if="viewing" :title="viewing.filename || `Media #${viewing.id}`" wide @close="viewing = null">
      <div class="viewer">
        <div class="preview">
          <video v-if="viewing.type === 'video' && viewing.preview_url" :src="viewing.preview_url" controls playsinline />
          <img v-else-if="viewing.preview_url" :src="viewing.preview_url" :alt="viewing.filename" />
          <div v-else class="empty">No preview available</div>
        </div>
        <dl class="kv">
          <dt>Status</dt><dd><StatusBadge :status="viewing.status" /></dd>
          <dt>Photographer</dt><dd><RouterLink v-if="viewing.creator" :to="`/admin/users/${viewing.creator.id}`">{{ viewing.creator.name }}</RouterLink></dd>
          <dt>Type</dt><dd>{{ viewing.type }}<template v-if="viewing.width"> · {{ viewing.width }}×{{ viewing.height }}</template><template v-if="viewing.duration_seconds"> · {{ Math.round(viewing.duration_seconds) }}s</template></dd>
          <dt>Size</dt><dd>{{ bytes(viewing.size_bytes) }}</dd>
          <dt>Price</dt><dd>{{ viewing.price === null ? 'Event price' : viewing.price }}</dd>
          <dt>Faces</dt><dd>{{ viewing.face_count ?? 0 }} · {{ viewing.face_status || '—' }}</dd>
          <dt>Sold</dt><dd>{{ viewing.sold }}×</dd>
          <dt>Uploaded</dt><dd>{{ dateTime(viewing.uploaded_at) }}</dd>
          <dt>Expires</dt><dd>{{ relative(viewing.expires_at) }}</dd>
          <dt v-if="viewing.error">Error</dt><dd v-if="viewing.error" class="small">{{ viewing.error }}</dd>
        </dl>
      </div>
      <template v-if="viewing.status !== 'deleted'" #footer>
        <button class="btn danger" @click="askDelete(viewing)"><Icon name="trash" :size="16" /> Take down</button>
      </template>
    </Modal>

    <ConfirmDialog v-if="confirmingStatus" :title="hidden ? 'Make this event visible?' : 'Hide this event?'"
                   :message="hidden ? 'Clients will be able to find it again and photographers can join.' : 'Clients won’t find it in search and photographers can’t join. Existing media stays until it expires.'"
                   :confirm-label="hidden ? 'Make visible' : 'Hide event'" :danger="!hidden" ask-reason :busy="busy"
                   @close="confirmingStatus = false" @confirm="toggleStatus" />

    <ConfirmDialog v-if="deleting" title="Take down this item?" :confirm-label="forceDelete ? 'Delete and revoke downloads' : 'Delete'"
                   message="The original, previews and face data are deleted permanently. The photographer won’t be able to restore it."
                   danger ask-reason :busy="busy" @close="deleting = null" @confirm="deleteMedia">
      <div v-if="forceDelete" class="form-error">Clients bought this item and can still download it. Deleting removes their access too.</div>
    </ConfirmDialog>
  </div>
</template>

<style scoped>
.back { margin-bottom: 12px; }
.page-head p { gap: 10px; }
.banner { margin-bottom: 16px; }
.kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 16px; }
.section { margin-bottom: 16px; }
.gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; padding: 16px; }
.tile { position: relative; aspect-ratio: 1; border: none; padding: 0; border-radius: 12px; overflow: hidden; cursor: pointer; background: var(--surface-2); }
.tile img { width: 100%; height: 100%; object-fit: cover; transition: transform .2s; }
.tile:hover img { transform: scale(1.04); }
.ph { display: grid; place-items: center; height: 100%; color: var(--faint); }
.tags { position: absolute; left: 6px; bottom: 6px; display: flex; gap: 4px; flex-wrap: wrap; }
.tag { display: inline-flex; align-items: center; padding: 2px 7px; border-radius: 999px; background: rgba(0, 0, 0, .6); color: #fff; font-size: 11px; font-weight: 700; }
.tag.ok { background: #12996b; }
.tag.bad { background: #d43a5a; }
.viewer { display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; }
.preview { background: var(--surface-2); border-radius: 12px; overflow: hidden; display: grid; place-items: center; min-height: 240px; }
.preview img, .preview video { max-height: 60vh; width: 100%; object-fit: contain; }
@media (max-width: 760px) { .viewer { grid-template-columns: 1fr; } }
</style>
