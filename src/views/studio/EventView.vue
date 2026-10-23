<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../../studio/http';
import { ACCEPT, uploadFiles, forEvent, completed, retry, dismiss } from '../../studio/uploads';
import { money, plural, bytes, dateTime, eventDates, duration } from '../../utils/format';
import { toast, toastError } from '../../utils/toast';
import Modal from '../../components/Modal.vue';
import ConfirmDialog from '../../components/ConfirmDialog.vue';
import PriceDialog from '../../components/studio/PriceDialog.vue';
import Icon from '../../components/Icon.vue';

const props = defineProps({ id: { type: String, required: true } });
const router = useRouter();
const eventId = Number(props.id);

const detail = ref(null);
const error = ref('');
const picker = ref(null);
const dragging = ref(false);
const starting = ref(false);
const editEventPrice = ref(false);
const viewing = ref(null);
const editItemPrice = ref(false);
const deleting = ref(false);
const busy = ref(false);

const uploading = computed(() => forEvent(eventId));
const currency = computed(() => detail.value?.membership.currency || 'USD');
const place = computed(() => [detail.value?.event.venue, detail.value?.event.city].filter(Boolean).join(', '));

let poll = null;
async function load() {
  try {
    detail.value = await api.get(`/creator/events/${eventId}`);
    error.value = '';
    if (viewing.value) viewing.value = detail.value.media.find((m) => m.id === viewing.value.id) || null;
  } catch (err) {
    error.value = err.message;
  }
  // Photos are processed (thumbnail + watermarked preview) in the background — refresh until done.
  clearTimeout(poll);
  if (detail.value?.media.some((m) => m.status === 'uploaded' || m.status === 'processing')) poll = setTimeout(load, 5000);
}
onMounted(load);
onBeforeUnmount(() => clearTimeout(poll));
watch(completed, load);

async function addFiles(list) {
  const files = [...(list || [])];
  if (!files.length) return;
  starting.value = true;
  try {
    const { started, skipped } = await uploadFiles(eventId, files);
    if (skipped.length) toast(`Skipped ${plural(skipped.length, 'file')} — use JPEG, PNG, WebP, HEIC, MP4 or MOV.`, 'error');
    if (started) toast(`Uploading ${plural(started, 'file')}`);
  } catch (err) {
    if (err.code === 'PAYOUT_REQUIRED') router.push({ name: 'studio-payout', query: { next: router.currentRoute.value.fullPath } });
    else toastError(err);
  } finally {
    starting.value = false;
    if (picker.value) picker.value.value = '';
  }
}

const hasFiles = (e) => [...(e.dataTransfer?.types || [])].includes('Files');
function onDragOver(e) { if (hasFiles(e)) dragging.value = true; }
function onDragLeave(e) { if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget)) dragging.value = false; }

function onDrop(e) {
  dragging.value = false;
  addFiles(e.dataTransfer?.files);
}

async function saveEventPrice(price) {
  busy.value = true;
  try {
    const { membership } = await api.put(`/creator/events/${eventId}/price`, { price });
    detail.value.membership = membership;
    editEventPrice.value = false;
    toast('Event price updated');
    load();
  } catch (err) {
    toastError(err);
  } finally {
    busy.value = false;
  }
}

async function saveItemPrice(price) {
  busy.value = true;
  try {
    const { media } = await api.put(`/creator/media/${viewing.value.id}/price`, { price });
    const i = detail.value.media.findIndex((m) => m.id === media.id);
    if (i > -1) detail.value.media[i] = media;
    viewing.value = media;
    editItemPrice.value = false;
    toast(price === null ? 'Using the event price' : 'Price updated');
  } catch (err) {
    toastError(err);
  } finally {
    busy.value = false;
  }
}

async function remove() {
  busy.value = true;
  try {
    await api.del(`/creator/media/${viewing.value.id}`);
    detail.value.media = detail.value.media.filter((m) => m.id !== viewing.value.id);
    toast(`${viewing.value.type === 'video' ? 'Video' : 'Photo'} deleted`);
    deleting.value = false;
    viewing.value = null;
  } catch (err) {
    toastError(err);
  } finally {
    busy.value = false;
  }
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(detail.value.event.code);
    toast('Event code copied');
  } catch {
    toast(`Event code: ${detail.value.event.code}`);
  }
}

const hasOverride = (m) => m.price !== null && m.price !== undefined;
const pct = (u) => Math.round(u.progress * 100);
</script>

<template>
  <div class="page" @dragover.prevent="onDragOver" @dragleave="onDragLeave" @drop.prevent="onDrop">
    <RouterLink to="/studio/events" class="btn ghost sm back"><Icon name="arrowLeft" :size="15" /> My events</RouterLink>

    <div v-if="error && !detail" class="card empty">
      <p>{{ error }}</p>
      <button class="btn" style="margin-top: 12px" @click="load">Try again</button>
    </div>
    <div v-else-if="!detail" class="stack">
      <div class="skeleton" style="height: 90px" /><div class="skeleton" style="height: 260px" />
    </div>

    <template v-else>
      <header class="head">
        <div class="title">
          <h1>{{ detail.event.name }}</h1>
          <p class="muted">{{ eventDates(detail.event.start_date, detail.event.end_date) }}<template v-if="place"> · {{ place }}</template></p>
          <div class="row wrap pills">
            <button class="badge info plain code" title="Copy event code" @click="copyCode"><Icon name="copy" :size="13" /> Code {{ detail.event.code }}</button>
            <span class="badge plain"><Icon name="camera" :size="13" /> {{ plural(detail.photographer_count, 'photographer') }}</span>
            <span class="badge plain"><Icon name="clock" :size="13" /> Kept {{ detail.retention_days }} days after upload</span>
          </div>
        </div>
        <button class="price card" @click="editEventPrice = true">
          <span class="ico"><Icon name="tag" :size="18" /></span>
          <span class="col">
            <span class="small muted">Your price per photo / video</span>
            <strong>{{ money(detail.membership.price, currency) }}</strong>
          </span>
          <span class="edit">Edit</span>
        </button>
      </header>

      <div class="row bar">
        <h2>Your uploads · {{ detail.media.length }}</h2>
        <span v-if="uploading.length" class="badge warn">{{ uploading.length }} uploading</span>
        <span class="spacer" />
        <input ref="picker" type="file" multiple :accept="ACCEPT" hidden @change="addFiles($event.target.files)" />
        <button class="btn primary" :disabled="starting" @click="picker.click()"><Icon name="upload" :size="16" /> {{ starting ? 'Preparing…' : 'Add photos & videos' }}</button>
      </div>

      <div v-if="!detail.media.length && !uploading.length" class="drop card" :class="{ on: dragging }" @click="picker.click()">
        <Icon name="image" :size="40" />
        <strong>Drop photos and videos here</strong>
        <p class="muted small">or click to choose files. Clients can find and buy them for {{ detail.retention_days }} days after you upload.<br />JPEG, PNG, WebP, HEIC up to 50 MB · MP4, MOV up to 2 GB.</p>
      </div>

      <div v-else class="grid" :class="{ dragging }">
        <div v-for="u in uploading" :key="'u' + u.mediaId" class="tile" :class="{ failed: u.failed }">
          <img v-if="u.previewUrl" :src="u.previewUrl" alt="" />
          <span v-else class="ph"><Icon name="video" :size="26" /></span>
          <div class="veil">
            <template v-if="u.failed">
              <Icon name="alert" :size="20" />
              <span class="small">{{ u.mode === 'multipart' ? `Paused at ${pct(u)}%` : 'Upload failed' }}</span>
              <span class="row tight">
                <button class="btn sm" @click="retry(u.mediaId)">Retry</button>
                <button class="btn sm ghost light" @click="dismiss(u.mediaId)">Remove</button>
              </span>
            </template>
            <template v-else>
              <span class="ring" :style="{ '--p': pct(u) }"><span>{{ pct(u) }}%</span></span>
              <span class="small name">{{ u.name }}</span>
            </template>
          </div>
        </div>

        <button v-for="m in detail.media" :key="m.id" class="tile" @click="viewing = m">
          <img v-if="m.thumb_url" :src="m.thumb_url" :alt="m.filename" loading="lazy" />
          <span v-else class="ph"><Icon :name="m.type === 'video' ? 'video' : 'image'" :size="26" /></span>
          <span v-if="m.status === 'uploaded' || m.status === 'processing'" class="veil"><span class="spin" /></span>
          <span v-if="m.status === 'failed'" class="veil"><Icon name="alert" :size="20" /></span>
          <span v-if="m.type === 'video'" class="vid"><Icon name="play" :size="12" /><template v-if="m.duration_seconds"> {{ duration(m.duration_seconds) }}</template></span>
          <span class="tag" :class="{ custom: hasOverride(m) }">{{ money(m.effective_price, currency) }}</span>
        </button>
      </div>
      <p v-if="detail.media.length || uploading.length" class="faint small tip">Tip: drag files anywhere on this page to upload. Keep this tab open until uploads finish.</p>
    </template>

    <div v-if="dragging && detail" class="dropzone"><div><Icon name="upload" :size="34" /><strong>Drop to upload to {{ detail.event.name }}</strong></div></div>

    <PriceDialog v-if="editEventPrice" title="Event price" :initial="detail.membership.price" :currency="currency" :busy="busy"
                 message="Applies to all your photos and videos in this event that don’t have their own price."
                 @save="saveEventPrice" @close="editEventPrice = false" />

    <Modal v-if="viewing && !editItemPrice && !deleting" :title="viewing.filename || (viewing.type === 'video' ? 'Video' : 'Photo')" wide @close="viewing = null">
      <div class="viewer">
        <div class="media">
          <video v-if="viewing.type === 'video'" :src="viewing.url" :poster="viewing.thumb_url || undefined" controls preload="metadata" />
          <!-- Originals some browsers can't show (HEIC) fall back to the thumbnail. -->
          <img v-else :src="viewing.url || viewing.thumb_url" :alt="viewing.filename" @error="viewing.thumb_url && $event.target.src !== viewing.thumb_url && ($event.target.src = viewing.thumb_url)" />
        </div>
        <div class="info stack">
          <div>
            <div class="big">{{ money(viewing.effective_price, currency) }}</div>
            <span class="small muted">{{ hasOverride(viewing) ? `Custom price for this ${viewing.type}` : 'Event price' }}</span>
          </div>
          <dl class="kv">
            <dt>Status</dt><dd>{{ viewing.status === 'ready' ? 'Live for clients' : viewing.status === 'failed' ? 'Processing failed' : 'Processing…' }}</dd>
            <dt>Size</dt><dd>{{ bytes(viewing.size_bytes) }}<template v-if="viewing.width"> · {{ viewing.width }}×{{ viewing.height }}</template></dd>
            <template v-if="viewing.face_count != null"><dt>Faces found</dt><dd>{{ viewing.face_count }}</dd></template>
            <dt>Uploaded</dt><dd>{{ dateTime(viewing.uploaded_at) }}</dd>
            <dt>Live until</dt><dd>{{ dateTime(viewing.expires_at) }}</dd>
          </dl>
          <p v-if="viewing.status === 'failed' && viewing.error" class="form-error">Processing failed: {{ viewing.error }}</p>
          <button class="btn" @click="editItemPrice = true"><Icon name="tag" :size="15" /> {{ hasOverride(viewing) ? 'Change custom price' : 'Set a custom price' }}</button>
          <a v-if="viewing.url" class="btn" :href="viewing.url" target="_blank" rel="noopener"><Icon name="download" :size="15" /> Open original</a>
          <button class="btn danger" @click="deleting = true"><Icon name="trash" :size="15" /> Delete</button>
        </div>
      </div>
    </Modal>

    <PriceDialog v-if="viewing && editItemPrice" title="Custom price" :initial="viewing.price" :currency="currency" :busy="busy"
                 :message="`Overrides your event price (${money(detail.membership.price, currency)}) for this ${viewing.type}.`"
                 :clear-label="hasOverride(viewing) ? 'Use the event price instead' : null"
                 @save="saveItemPrice" @clear="saveItemPrice(null)" @close="editItemPrice = false" />

    <ConfirmDialog v-if="viewing && deleting" :title="`Delete this ${viewing.type}?`" message="It will be removed for clients immediately."
                   confirm-label="Delete" danger :busy="busy" @confirm="remove" @close="deleting = false" />
  </div>
</template>

<style scoped>
.page { min-height: calc(100vh - 140px); }
.back { margin: -6px 0 12px -10px; }
.head { display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap; margin-bottom: 26px; }
.title { flex: 1 1 340px; min-width: 0; }
.title h1 { font-size: 26px; font-weight: 800; }
.title p { margin-top: 4px; }
.pills { margin-top: 12px; gap: 8px; }
.pills .badge { gap: 6px; }
.code { border: none; cursor: pointer; font: inherit; font-size: 12px; font-weight: 700; }
.price { display: flex; align-items: center; gap: 14px; padding: 14px 18px; cursor: pointer; text-align: left; min-width: 260px; }
.price:hover { border-color: color-mix(in srgb, var(--brand-1) 40%, var(--border)); }
.price .ico { width: 40px; height: 40px; border-radius: 13px; background: var(--gradient); color: #fff; display: grid; place-items: center; }
.price .col { display: flex; flex-direction: column; flex: 1; }
.price strong { font-size: 20px; }
.edit { color: var(--brand-2); font-weight: 700; font-size: 14px; }
.bar { margin-bottom: 14px; flex-wrap: wrap; }
.bar h2 { font-size: 18px; }

.drop { display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; padding: 56px 20px; border: 2px dashed var(--border); box-shadow: none; cursor: pointer; color: var(--brand-2); }
.drop strong { color: var(--text); font-size: 16px; }
.drop.on, .drop:hover { border-color: var(--brand-2); background: color-mix(in srgb, var(--brand-2) 6%, var(--surface)); }

.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
.tile { position: relative; aspect-ratio: 1; border-radius: 14px; overflow: hidden; background: var(--surface-2); border: none; padding: 0; cursor: pointer; display: block; }
.tile img { width: 100%; height: 100%; object-fit: cover; }
.tile:hover img { transform: scale(1.03); }
.tile img { transition: transform .2s; }
.ph { position: absolute; inset: 0; display: grid; place-items: center; color: var(--faint); }
.veil { position: absolute; inset: 0; background: rgba(10, 2, 16, .55); color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 8px; text-align: center; }
.tile.failed .veil { background: rgba(60, 8, 24, .7); cursor: default; }
.veil .name { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; opacity: .85; font-size: 11px; }
.tight { gap: 6px; }
.light { color: #fff; }
.ring { --p: 0; width: 52px; height: 52px; border-radius: 50%; display: grid; place-items: center; background: conic-gradient(#fff calc(var(--p) * 1%), rgba(255, 255, 255, .25) 0); }
.ring span { width: 42px; height: 42px; border-radius: 50%; background: rgba(10, 2, 16, .75); display: grid; place-items: center; font-size: 11px; font-weight: 800; }
.spin { width: 24px; height: 24px; border-radius: 50%; border: 2px solid rgba(255, 255, 255, .35); border-top-color: #fff; animation: rot .8s linear infinite; }
@keyframes rot { to { transform: rotate(360deg); } }
.vid { position: absolute; left: 8px; bottom: 8px; color: #fff; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 3px; background: rgba(0, 0, 0, .5); padding: 2px 7px; border-radius: 999px; }
.tag { position: absolute; right: 8px; top: 8px; background: rgba(0, 0, 0, .55); color: #fff; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
.tag.custom { background: var(--gradient); }
.tip { margin-top: 14px; }

.dropzone { position: fixed; inset: 0; z-index: 45; background: color-mix(in srgb, var(--brand-1) 22%, rgba(10, 2, 16, .55)); display: grid; place-items: center; pointer-events: none; }
.dropzone div { background: var(--surface); border-radius: 20px; padding: 28px 36px; display: flex; flex-direction: column; align-items: center; gap: 10px; color: var(--brand-2); box-shadow: var(--shadow); }
.dropzone strong { color: var(--text); }

.viewer { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(240px, 1fr); gap: 20px; }
.media { background: #0c0410; border-radius: 14px; overflow: hidden; display: grid; place-items: center; min-height: 260px; max-height: 70vh; }
.media img, .media video { max-width: 100%; max-height: 70vh; object-fit: contain; }
.big { font-size: 26px; font-weight: 800; }
@media (max-width: 720px) {
  .viewer { grid-template-columns: 1fr; }
  .grid { grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 8px; }
  .price { min-width: 0; flex: 1 1 100%; }
}
</style>
