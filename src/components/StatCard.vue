<script setup>
import Icon from './Icon.vue';
defineProps({ label: String, value: [String, Number], hint: String, icon: String, to: [String, Object] });
</script>

<template>
  <component :is="to ? 'RouterLink' : 'div'" :to="to" class="stat card">
    <div class="top">
      <span class="label">{{ label }}</span>
      <span v-if="icon" class="ico"><Icon :name="icon" :size="16" /></span>
    </div>
    <div class="value">{{ value }}</div>
    <div v-if="hint || $slots.default" class="hint"><slot>{{ hint }}</slot></div>
  </component>
</template>

<style scoped>
.stat { padding: 18px 20px; display: flex; flex-direction: column; gap: 6px; text-decoration: none; min-width: 0; }
a.stat:hover { border-color: color-mix(in srgb, var(--brand-1) 40%, var(--border)); }
.top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.label { font-size: 13px; font-weight: 600; color: var(--muted); }
.ico { width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; color: var(--brand-1); background: var(--info-bg); flex: none; }
.value { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; line-height: 1.15; }
.hint { font-size: 13px; color: var(--muted); }
</style>
