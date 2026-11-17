<script setup>
// The creaMob wordmark (public/logo.png, generated from /logos). `size` is the wordmark height in px.
defineProps({ size: { type: Number, default: 34 }, label: { type: Boolean, default: true }, sub: { type: String, default: '' } });
</script>

<template>
  <span class="brand">
    <img src="/logo.png" :height="size" alt="creaMob" class="mark" :style="{ height: size + 'px' }" />
    <small v-if="label && sub" class="sub">{{ sub }}</small>
  </span>
</template>

<style scoped>
.brand { display: inline-flex; flex-direction: column; align-items: flex-start; gap: 2px; text-decoration: none; }
.mark { width: auto; display: block; }
.sub { font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .08em; padding-left: 4px; }
</style>
