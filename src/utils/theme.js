// Light / dark / system theme, applied as data-theme on <html> (styles.css follows the system otherwise).
import { ref } from 'vue';

const KEY = 'smatsnap_theme';
const read = () => { try { return localStorage.getItem(KEY) || 'system'; } catch { return 'system'; } };

export const theme = ref(read());

function apply(mode) {
  const root = document.documentElement;
  if (mode === 'light' || mode === 'dark') root.dataset.theme = mode;
  else delete root.dataset.theme;
}

export function setTheme(mode) {
  theme.value = mode;
  try { mode === 'system' ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, mode); } catch { /* private mode */ }
  apply(mode);
}

apply(theme.value);
