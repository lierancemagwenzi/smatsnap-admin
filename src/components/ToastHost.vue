<script setup>
import { toasts } from '../utils/toast';
</script>

<template>
  <div class="toasts" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="t.kind">{{ t.message }}</div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toasts { position: fixed; right: 16px; bottom: 16px; left: 16px; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; z-index: 100; pointer-events: none; }
.toast { pointer-events: auto; max-width: 420px; padding: 12px 16px; border-radius: 12px; font-weight: 600; font-size: 14px; color: #fff; background: #2a1534; box-shadow: 0 10px 30px rgba(0, 0, 0, .25); border-left: 4px solid var(--ok); }
.toast.error { border-left-color: var(--bad); }
.toast-enter-active, .toast-leave-active { transition: all .2s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(8px); }
</style>
