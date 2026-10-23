<script setup>
// Photographers get paid through the gateway of their country (SmatPay in Zimbabwe, Paystack in
// ZA/NG/GH/KE…). They pick the country; the server sends that gateway's form, rendered here as is
// (same as the app's PayoutSetupScreen). Emits `submit` with { country, values }.
import { ref, reactive, computed, onMounted } from 'vue';
import { request } from '../../studio/http';
import { flag, isoDay } from '../../utils/format';

const props = defineProps({
  name: String,
  lastname: String,
  submitLabel: { type: String, default: 'Set up payments' },
  busy: Boolean,
});
const emit = defineEmits(['submit', 'intro']);

const countries = ref(null);
const country = ref('');
const form = ref(null);
const error = ref('');
const loadingForm = ref(false);
const values = reactive({});
const errors = reactive({});
const optionFilter = reactive({});

const current = computed(() => countries.value?.find((c) => c.code === country.value) || null);

async function loadCountries() {
  error.value = '';
  try {
    const body = await request('GET', '/registration/payout-countries', { auth: false });
    countries.value = body.countries || [];
    // Preselect the browser's region when we support it (or the only country there is).
    const region = (navigator.language || '').split(/[-_]/).pop()?.toUpperCase();
    const guess = countries.value.find((c) => c.code === region) || (countries.value.length === 1 ? countries.value[0] : null);
    if (guess) selectCountry(guess.code);
  } catch (err) {
    error.value = err.message;
  }
}

async function selectCountry(code) {
  country.value = code;
  form.value = null;
  error.value = '';
  loadingForm.value = true;
  try {
    const body = await request('GET', '/registration/payout-form', {
      params: { country: code, name: props.name || '', lastname: props.lastname || '' },
      auth: false,
    });
    if (country.value !== code) return;
    for (const k of Object.keys(values)) delete values[k];
    for (const k of Object.keys(errors)) delete errors[k];
    for (const f of body.fields) values[f.key] = f.default ?? '';
    form.value = body;
    emit('intro', body.intro || null);
  } catch (err) {
    error.value = err.message;
  } finally {
    loadingForm.value = false;
  }
}

function maxDate(f) {
  const now = new Date();
  const d = f.min_age ? new Date(now.getFullYear() - f.min_age, now.getMonth(), now.getDate()) : now;
  return isoDay(d);
}

const filteredOptions = (f) => {
  const q = (optionFilter[f.key] || '').toLowerCase();
  const list = f.options || [];
  return q ? list.filter((o) => String(o.label ?? o.value).toLowerCase().includes(q) || String(o.value) === String(values[f.key])) : list;
};

// Basic checks only; the gateway's own rules are applied by the server.
function validate() {
  for (const k of Object.keys(errors)) delete errors[k];
  for (const f of form.value.fields) {
    const v = String(values[f.key] ?? '').trim();
    const label = f.label.toLowerCase();
    if (f.required !== false && !v) errors[f.key] = f.type === 'select' || f.type === 'date' ? `Choose your ${label}` : `Enter your ${label}`;
    else if (f.type === 'phone' && v && !/^\+?[\d\s()-]{8,18}$/.test(v)) errors[f.key] = 'Enter a valid mobile number';
    else if (f.type === 'number' && v && !/^[\d\s]+$/.test(v)) errors[f.key] = 'Use digits only';
  }
  return !Object.keys(errors).length;
}

function submit() {
  if (!form.value || !validate()) return;
  const out = {};
  for (const f of form.value.fields) out[f.key] = String(values[f.key] ?? '').trim();
  emit('submit', { country: country.value, values: out });
}

onMounted(loadCountries);
</script>

<template>
  <form class="stack" novalidate @submit.prevent="submit">
    <div v-if="countries === null && !error" class="skeleton" style="height: 46px" />
    <div v-else-if="countries === null" class="form-error">
      {{ error }} <button type="button" class="btn ghost sm" @click="loadCountries">Try again</button>
    </div>
    <p v-else-if="!countries.length" class="muted">Payments aren’t available yet. Please try again later.</p>
    <template v-else>
      <div class="field">
        <label for="country">Where do you get paid?</label>
        <select id="country" class="select" :value="country" @change="selectCountry($event.target.value)">
          <option value="" disabled>Choose your country</option>
          <option v-for="c in countries" :key="c.code" :value="c.code">{{ flag(c.code) }} {{ c.name }} — {{ c.currency }} via {{ c.provider_label || c.provider }}</option>
        </select>
        <span v-if="current" class="small faint">Your prices are in {{ current.currency }}; clients pay you through {{ current.provider_label || current.provider }}.</span>
      </div>

      <div v-if="loadingForm" class="stack">
        <div class="skeleton" style="height: 46px" /><div class="skeleton" style="height: 46px" /><div class="skeleton" style="height: 46px" />
      </div>
      <div v-else-if="error" class="form-error">
        {{ error }} <button type="button" class="btn ghost sm" @click="selectCountry(country)">Try again</button>
      </div>
      <template v-else-if="form">
        <div v-for="f in form.fields" :key="f.key" class="field">
          <label :for="`pf-${f.key}`">{{ f.label }}<span v-if="f.required === false" class="faint"> (optional)</span></label>

          <div v-if="f.type === 'select' && f.style === 'chips'" class="chips" role="radiogroup" :aria-label="f.label">
            <button v-for="o in f.options" :key="o.value" type="button" class="chip" :class="{ on: String(values[f.key]) === String(o.value) }"
                    role="radio" :aria-checked="String(values[f.key]) === String(o.value)" @click="values[f.key] = String(o.value)">
              {{ o.label ?? o.value }}
            </button>
          </div>

          <template v-else-if="f.type === 'select'">
            <input v-if="(f.options || []).length > 8" v-model="optionFilter[f.key]" class="input filter" type="search" :placeholder="`Search ${f.label.toLowerCase()}`" />
            <select :id="`pf-${f.key}`" v-model="values[f.key]" class="select">
              <option value="" disabled>Choose {{ f.label.toLowerCase() }}</option>
              <option v-for="o in filteredOptions(f)" :key="o.value" :value="String(o.value)">{{ o.label ?? o.value }}</option>
            </select>
          </template>

          <input v-else-if="f.type === 'date'" :id="`pf-${f.key}`" v-model="values[f.key]" class="input" type="date" :max="maxDate(f)" min="1900-01-01" />

          <input v-else :id="`pf-${f.key}`" v-model="values[f.key]" class="input"
                 :type="f.type === 'phone' ? 'tel' : 'text'" :inputmode="f.type === 'number' ? 'numeric' : undefined"
                 :autocomplete="f.type === 'phone' ? 'tel' : 'off'" :placeholder="f.placeholder || ''" />

          <span v-if="errors[f.key]" class="small bad">{{ errors[f.key] }}</span>
          <span v-else-if="f.help" class="small faint">{{ f.help }}</span>
          <span v-else-if="f.type === 'date' && f.min_age" class="small faint">You must be {{ f.min_age }} or older.</span>
        </div>
        <slot name="before-submit" />
        <button class="btn primary lg" type="submit" :disabled="busy">{{ busy ? 'Setting up…' : submitLabel }}</button>
      </template>
    </template>
  </form>
</template>

<style scoped>
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { border: 1px solid var(--border); background: var(--surface-2); padding: 7px 14px; border-radius: 999px; font-weight: 600; font-size: 14px; cursor: pointer; }
.chip.on { border-color: var(--brand-2); color: var(--brand-2); background: color-mix(in srgb, var(--brand-2) 12%, transparent); }
.filter { margin-bottom: 4px; }
.bad { color: var(--bad); }
</style>
