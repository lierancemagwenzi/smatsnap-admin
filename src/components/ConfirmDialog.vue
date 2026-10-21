<script setup>
// Confirmation with an optional reason, which is stored in the activity log.
import { ref } from 'vue';
import Modal from './Modal.vue';

const props = defineProps({
  title: String,
  message: String,
  confirmLabel: { type: String, default: 'Confirm' },
  danger: Boolean,
  askReason: Boolean,
  busy: Boolean,
});
const emit = defineEmits(['confirm', 'close']);
const reason = ref('');
</script>

<template>
  <Modal :title="title" @close="emit('close')">
    <div class="stack">
      <p class="muted">{{ message }}</p>
      <slot />
      <div v-if="askReason" class="field">
        <label for="reason">Reason (kept in the activity log)</label>
        <textarea id="reason" v-model="reason" class="input" rows="3" maxlength="500" placeholder="Optional" />
      </div>
    </div>
    <template #footer>
      <button class="btn" @click="emit('close')">Cancel</button>
      <button class="btn" :class="danger ? 'solid-danger' : 'primary'" :disabled="props.busy" @click="emit('confirm', reason.trim())">
        {{ busy ? 'Working…' : confirmLabel }}
      </button>
    </template>
  </Modal>
</template>
