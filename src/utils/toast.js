import { reactive } from 'vue';

export const toasts = reactive([]);
let nextId = 1;

export function toast(message, kind = 'success') {
  const id = nextId++;
  toasts.push({ id, message, kind });
  setTimeout(() => {
    const i = toasts.findIndex((t) => t.id === id);
    if (i > -1) toasts.splice(i, 1);
  }, kind === 'error' ? 6000 : 3500);
}

export const toastError = (err) => toast(err?.message || 'Something went wrong', 'error');
