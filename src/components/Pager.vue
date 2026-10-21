<script setup>
import { computed } from 'vue';
import Icon from './Icon.vue';

const props = defineProps({ page: Number, size: Number, total: Number });
const emit = defineEmits(['update:page']);
const pages = computed(() => Math.max(1, Math.ceil((props.total || 0) / (props.size || 20))));
const from = computed(() => (props.total ? (props.page - 1) * props.size + 1 : 0));
const to = computed(() => Math.min(props.total || 0, props.page * props.size));
</script>

<template>
  <div class="pager">
    <span class="muted small">{{ from }}–{{ to }} of {{ total || 0 }}</span>
    <span class="spacer" />
    <button class="btn sm ghost" :disabled="page <= 1" @click="emit('update:page', page - 1)" aria-label="Previous page"><Icon name="chevronLeft" :size="16" /></button>
    <span class="small">Page {{ page }} / {{ pages }}</span>
    <button class="btn sm ghost" :disabled="page >= pages" @click="emit('update:page', page + 1)" aria-label="Next page"><Icon name="chevronRight" :size="16" /></button>
  </div>
</template>

<style scoped>
.pager { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--border); }
</style>
