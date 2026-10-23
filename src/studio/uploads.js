// Direct-to-S3 uploads for the photographer studio (same protocol as the app's UploadManager,
// docs/events-api.md): presigned URLs → browser PUTs the bytes straight to S3 → /complete.
// Small files: one PUT. Large files (server says `mode: multipart`): 8 MiB slices of the File,
// at most PART_CONCURRENCY in flight per file, part URLs fetched in batches just before sending,
// per-part retries. A failed upload can be retried (multipart resumes from the parts S3 already
// has, via GET /media/:id/parts) or removed (DELETE aborts it server-side).
//
// Jobs live in memory only — a browser can't reopen a File after a reload — so the page warns
// before closing while anything is still sending.
import { reactive, ref, computed } from 'vue';
import { api } from './http';

const MAX_FILES_PER_REQUEST = 50;
const JOB_CONCURRENCY = 3;
const PART_CONCURRENCY = 4;
const PART_URL_BATCH = 10;
const PART_RETRIES = 3;

// Browsers often leave File.type empty for HEIC/HEIF (and sometimes .mov).
const TYPES_BY_EXT = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif',
  mp4: 'video/mp4', mov: 'video/quicktime', m4v: 'video/x-m4v',
};
const ALLOWED = new Set(Object.values(TYPES_BY_EXT));
export const ACCEPT = [...ALLOWED, '.heic', '.heif', '.mov', '.m4v'].join(',');

export function contentTypeOf(file) {
  const type = (file.type || '').toLowerCase();
  if (ALLOWED.has(type)) return type;
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  return TYPES_BY_EXT[ext] || null;
}

/** mediaId → job */
export const jobs = reactive(new Map());
/** Bumped whenever an upload finishes, so screens can reload. */
export const completed = ref(0);
export const activeCount = computed(() => [...jobs.values()].filter((j) => !j.failed).length);

export const forEvent = (eventId) => [...jobs.values()].filter((j) => j.eventId === eventId);

const queue = [];
let running = 0;

window.addEventListener('beforeunload', (e) => {
  if (activeCount.value > 0) { e.preventDefault(); e.returnValue = ''; }
});

/**
 * Starts uploading `files` to an event. Unsupported files are skipped and reported.
 * Returns { started, skipped: [names] }; throws the API error if the server refuses the batch.
 */
export async function uploadFiles(eventId, fileList) {
  const files = [];
  const skipped = [];
  for (const file of fileList) {
    const type = contentTypeOf(file);
    if (type) files.push({ file, type });
    else skipped.push(file.name);
  }
  let started = 0;
  for (let i = 0; i < files.length; i += MAX_FILES_PER_REQUEST) {
    const batch = files.slice(i, i + MAX_FILES_PER_REQUEST);
    const { uploads } = await api.post(`/creator/events/${eventId}/media/upload-urls`, {
      files: batch.map(({ file, type }) => ({ filename: file.name, content_type: type, size: file.size })),
    });
    uploads.forEach((u, idx) => {
      const { file, type } = batch[idx];
      const job = reactive({
        mediaId: u.media_id,
        eventId,
        file,
        name: file.name,
        contentType: type,
        isVideo: u.type === 'video',
        previewUrl: u.type === 'photo' ? URL.createObjectURL(file) : null,
        mode: u.mode,
        uploadUrl: u.upload_url,
        headers: u.headers || { 'Content-Type': type },
        partSize: u.part_size,
        partCount: u.part_count,
        sent: 0, // bytes
        failed: false,
        error: null,
        resume: false,
        xhrs: new Set(),
        get progress() { return file.size ? Math.min(1, this.sent / file.size) : 0; },
      });
      jobs.set(u.media_id, job);
      enqueue(job);
      started++;
    });
  }
  return { started, skipped };
}

function enqueue(job) {
  queue.push(job);
  pump();
}

function pump() {
  while (running < JOB_CONCURRENCY && queue.length) {
    const job = queue.shift();
    if (!jobs.has(job.mediaId)) continue; // removed while queued
    running++;
    run(job).finally(() => { running--; pump(); });
  }
}

async function run(job) {
  try {
    if (job.mode === 'multipart') await sendMultipart(job);
    else await sendSingle(job);
    if (!jobs.has(job.mediaId)) return;
    await api.post(`/creator/media/${job.mediaId}/complete`);
    finish(job);
  } catch (err) {
    if (!jobs.has(job.mediaId)) return;
    job.failed = true;
    job.error = err?.message || 'Upload interrupted';
  }
}

function finish(job) {
  if (job.previewUrl) URL.revokeObjectURL(job.previewUrl);
  jobs.delete(job.mediaId);
  completed.value++;
}

async function sendSingle(job) {
  job.sent = 0;
  await put(job, job.uploadUrl, job.file, job.headers, (loaded) => { job.sent = loaded; });
}

async function sendMultipart(job) {
  const done = new Set();
  if (job.resume) {
    const status = await api.get(`/creator/media/${job.mediaId}/parts`);
    for (const n of status.uploaded || []) done.add(n);
  }
  const sizeOf = (n) => Math.min(job.partSize, job.file.size - (n - 1) * job.partSize);
  const inFlight = new Map(); // part → bytes sent so far
  const doneBytes = () => [...done].reduce((sum, n) => sum + sizeOf(n), 0);
  const update = () => { job.sent = doneBytes() + [...inFlight.values()].reduce((a, b) => a + b, 0); };
  update();

  const todo = [];
  for (let n = 1; n <= job.partCount; n++) if (!done.has(n)) todo.push(n);

  // Workers pull parts; URLs are fetched in small batches right before they're needed.
  let urls = new Map();
  let fetching = null;
  async function urlFor(n) {
    if (urls.has(n)) return urls.get(n);
    fetching = fetching || (async () => {
      const wanted = todo.filter((p) => !done.has(p) && !inFlight.has(p) && !urls.has(p)).slice(0, PART_URL_BATCH);
      if (!wanted.includes(n)) wanted.unshift(n);
      const { parts } = await api.post(`/creator/media/${job.mediaId}/parts`, { part_numbers: wanted.slice(0, PART_URL_BATCH) });
      for (const p of parts) urls.set(p.part_number, p);
    })().finally(() => { fetching = null; });
    await fetching;
    return urls.get(n) || urlFor(n);
  }

  async function sendPart(n) {
    for (let attempt = 1; ; attempt++) {
      if (!jobs.has(job.mediaId)) throw new Error('Removed');
      try {
        const part = await urlFor(n);
        urls.delete(n); // single use; ask again on retry
        inFlight.set(n, 0);
        const blob = job.file.slice(part.offset, part.offset + part.size);
        await put(job, part.url, blob, {}, (loaded) => { inFlight.set(n, loaded); update(); });
        inFlight.delete(n);
        done.add(n);
        update();
        return;
      } catch (err) {
        inFlight.delete(n);
        update();
        if (attempt >= PART_RETRIES) throw err;
        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      }
    }
  }

  let next = 0;
  const worker = async () => {
    while (next < todo.length) await sendPart(todo[next++]);
  };
  await Promise.all(Array.from({ length: Math.min(PART_CONCURRENCY, todo.length) }, worker));
}

function put(job, url, body, headers, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    job.xhrs.add(xhr);
    xhr.open('PUT', url);
    for (const [k, v] of Object.entries(headers || {})) {
      if (v !== '' && v != null) xhr.setRequestHeader(k, v);
    }
    xhr.upload.onprogress = (e) => onProgress(e.loaded);
    xhr.onload = () => {
      job.xhrs.delete(xhr);
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(xhr.status === 403 ? 'Upload link expired — retry' : `Storage refused the file (${xhr.status})`));
    };
    xhr.onerror = () => { job.xhrs.delete(xhr); reject(new Error('Connection lost while uploading')); };
    xhr.onabort = () => { job.xhrs.delete(xhr); reject(new Error('Upload cancelled')); };
    xhr.send(body);
  });
}

/** Retry a failed upload; multipart resumes from the parts S3 already has. */
export async function retry(mediaId) {
  const job = jobs.get(mediaId);
  if (!job) return;
  job.failed = false;
  job.error = null;
  job.resume = job.mode === 'multipart'; // single PUT URLs stay valid for 24 h, so just resend
  enqueue(job);
}

/** Stops and removes an upload (the server aborts/deletes it). */
export async function dismiss(mediaId) {
  const job = jobs.get(mediaId);
  if (!job) return;
  jobs.delete(mediaId);
  for (const xhr of job.xhrs) xhr.abort();
  if (job.previewUrl) URL.revokeObjectURL(job.previewUrl);
  try { await api.del(`/creator/media/${mediaId}`); } catch { /* expiry job cleans up abandoned uploads */ }
}
