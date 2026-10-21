<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import Icon from './Icon.vue';

defineProps({ title: String, wide: Boolean });
const emit = defineEmits(['close']);
const onKey = (e) => { if (e.key === 'Escape') emit('close'); };
onMounted(() => document.addEventListener('keydown', onKey));
onBeforeUnmount(() => document.removeEventListener('keydown', onKey));
</script>

<template>
  <Teleport to="body">
    <div class="backdrop" @click.self="emit('close')">
      <div class="modal card" :class="{ wide }" role="dialog" aria-modal="true" :aria-label="title">
        <div class="modal-head">
          <h3>{{ title }}</h3>
          <span class="spacer" />
          <button class="btn ghost sm" @click="emit('close')" aria-label="Close"><Icon name="x" :size="16" /></button>
        </div>
        <div class="modal-body"><slot /></div>
        <div v-if="$slots.footer" class="modal-foot"><slot name="footer" /></div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.backdrop { position: fixed; inset: 0; background: rgba(12, 4, 18, .55); backdrop-filter: blur(3px); display: grid; place-items: center; padding: 16px; z-index: 50; }
.modal { width: 100%; max-width: 460px; max-height: calc(100vh - 32px); display: flex; flex-direction: column; }
.modal.wide { max-width: 900px; }
.modal-head { display: flex; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border); }
.modal-head h3 { font-size: 17px; }
.modal-body { padding: 20px; overflow-y: auto; }
.modal-foot { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 10px; padding: 14px 20px; border-top: 1px solid var(--border); }
</style>
