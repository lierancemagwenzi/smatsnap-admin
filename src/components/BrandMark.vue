<script setup>
defineProps({ size: { type: Number, default: 34 }, label: { type: Boolean, default: true }, sub: { type: String, default: '' } });
</script>

<template>
  <span class="brand">
    <img src="/favicon.svg" :width="size" :height="size" alt="" class="mark" :style="{ borderRadius: size * 0.28 + 'px' }" />
    <span v-if="label" class="name">
      SmatSnap<small v-if="sub">{{ sub }}</small>
    </span>
  </span>
</template>

<style scoped>
.brand { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; }
.mark { box-shadow: 0 4px 14px rgba(139, 61, 255, .35); }
.name { font-weight: 800; font-size: 18px; letter-spacing: -0.02em; display: flex; flex-direction: column; line-height: 1.1; }
.name small { font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .08em; }
</style>
