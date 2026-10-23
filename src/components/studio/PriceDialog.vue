<script setup>
// Asks for a price (photographer's currency). Emits `save` with a number, or `null` for "clear".
import { ref, computed, onMounted } from 'vue';
import Modal from '../Modal.vue';
import { parsePrice } from '../../studio/store';

const props = defineProps({
  title: String,
  message: String,
  initial: [Number, String],
  currency: { type: String, default: 'USD' },
  confirmLabel: { type: String, default: 'Save price' },
  clearLabel: String,
  busy: Boolean,
});
const emit = defineEmits(['save', 'clear', 'close']);
const value = ref(props.initial == null ? '' : String(props.initial));
const touched = ref(false);
const price = computed(() => parsePrice(value.value));
const input = ref(null);
onMounted(() => input.value?.focus());

function submit() {
  touched.value = true;
  if (price.value !== null) emit('save', price.value);
}
</script>

<template>
  <Modal :title="title" @close="emit('close')">
    <form class="stack" @submit.prevent="submit">
      <p v-if="message" class="muted">{{ message }}</p>
      <div class="field">
        <label for="price">Price per photo / video</label>
        <div class="money">
          <span class="cur">{{ currency }}</span>
          <input id="price" ref="input" v-model="value" class="input" inputmode="decimal" placeholder="0.00" autocomplete="off" />
        </div>
        <span v-if="touched && price === null" class="small bad">Enter an amount from 0 to 10,000 with up to 2 decimals.</span>
        <span v-else class="small faint">Use 0 to give them away for free.</span>
      </div>
      <button v-if="clearLabel" type="button" class="btn ghost sm clear" @click="emit('clear')">{{ clearLabel }}</button>
    </form>
    <template #footer>
      <button class="btn" @click="emit('close')">Cancel</button>
      <button class="btn primary" :disabled="busy" @click="submit">{{ busy ? 'Saving…' : confirmLabel }}</button>
    </template>
  </Modal>
</template>

<style scoped>
.money { position: relative; }
.money .input { padding-left: 58px; font-size: 18px; font-weight: 700; }
.cur { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-weight: 700; color: var(--muted); font-size: 14px; }
.bad { color: var(--bad); }
.clear { align-self: flex-start; color: var(--brand-2); }
</style>
