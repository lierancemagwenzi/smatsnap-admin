// Paged, filterable list backed by an admin endpoint. Filters live in the URL query so lists
// survive reloads and the back button.
import { reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../api/http';
import { toastError } from './toast';

export function useList(path, defaults = {}, { size = 20 } = {}) {
  const route = useRoute();
  const router = useRouter();
  const filters = reactive({ ...defaults, ...pick(route.query, Object.keys(defaults)) });
  const page = ref(Number(route.query.page) || 1);
  const data = ref(null);
  const loading = ref(false);
  let seq = 0;
  let debounce = null;

  async function load() {
    const mine = ++seq;
    loading.value = true;
    try {
      const body = await api.get(path, { ...filters, page: page.value, size });
      if (mine === seq) data.value = body;
    } catch (err) {
      if (mine === seq) toastError(err);
    } finally {
      if (mine === seq) loading.value = false;
    }
  }

  function syncUrl() {
    const query = {};
    for (const [k, v] of Object.entries(filters)) if (v !== '' && v != null && v !== defaults[k]) query[k] = v;
    if (page.value > 1) query.page = page.value;
    router.replace({ query });
  }

  watch(filters, () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => { page.value = 1; syncUrl(); load(); }, 300);
  });
  watch(page, () => { syncUrl(); load(); });

  load();
  return { filters, page, data, loading, reload: load };
}

function pick(obj, keys) {
  return Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, String(obj[k])]));
}
