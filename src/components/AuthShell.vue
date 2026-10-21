<script setup>
import BrandMark from './BrandMark.vue';
defineProps({ title: String, subtitle: String });
</script>

<template>
  <div class="auth">
    <div class="glow" aria-hidden="true" />
    <div class="box card">
      <RouterLink to="/" class="brand-link"><BrandMark :size="38" sub="Admin" /></RouterLink>
      <div class="head">
        <h1>{{ title }}</h1>
        <p class="muted">{{ subtitle }}</p>
      </div>
      <slot />
    </div>
    <RouterLink to="/" class="back small muted">← Back to the SmatSnap website</RouterLink>
  </div>
</template>

<style scoped>
.auth { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; padding: 24px 16px; position: relative; overflow: hidden; }
.glow { position: absolute; inset: 0; background: radial-gradient(600px 400px at 20% 10%, color-mix(in srgb, var(--brand-1) 22%, transparent), transparent), radial-gradient(500px 400px at 90% 90%, color-mix(in srgb, var(--brand-2) 18%, transparent), transparent); pointer-events: none; }
.box { position: relative; width: 100%; max-width: 420px; padding: 32px; display: flex; flex-direction: column; gap: 24px; }
.brand-link { text-decoration: none; }
.head h1 { font-size: 24px; font-weight: 800; margin-bottom: 6px; }
.back { position: relative; text-decoration: none; }
@media (max-width: 480px) { .box { padding: 24px 20px; } }
</style>
