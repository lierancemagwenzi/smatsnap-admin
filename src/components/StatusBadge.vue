<script setup>
import { computed } from 'vue';
import { titleCase } from '../utils/format';

const props = defineProps({ status: String });
const KIND = {
  active: 'ok', ready: 'ok', paid: 'ok', indexed: 'ok',
  pending: 'warn', processing: 'warn', uploaded: 'warn', expired: 'warn',
  suspended: 'bad', failed: 'bad', cancelled: 'bad', deleted: 'bad', hidden: 'bad',
  super_admin: 'info', admin: 'plain', creator: 'info', client: 'plain',
};
const kind = computed(() => KIND[String(props.status || '').toLowerCase()] || '');
const label = computed(() => {
  const s = String(props.status || '').toLowerCase();
  return s === 'creator' ? 'Photographer' : titleCase(s);
});
</script>

<template>
  <span class="badge" :class="kind">{{ label }}</span>
</template>
