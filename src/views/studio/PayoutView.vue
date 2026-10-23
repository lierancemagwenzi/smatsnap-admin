<script setup>
// "Set up payments" for photographers who signed up before payouts existed (new signups do it in step 2).
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../../studio/http';
import { studioSession } from '../../studio/session';
import { dashboard, loadDashboard } from '../../studio/store';
import { toast } from '../../utils/toast';
import PayoutForm from '../../components/studio/PayoutForm.vue';
import Icon from '../../components/Icon.vue';

const route = useRoute();
const router = useRouter();
const busy = ref(false);
const error = ref('');
const intro = ref(null);
const user = studioSession.user;

async function submit(payout) {
  error.value = '';
  busy.value = true;
  try {
    await api.post('/creator/payout', payout);
    await loadDashboard();
    toast('Payments are set up');
    const next = typeof route.query.next === 'string' && route.query.next.startsWith('/studio') ? route.query.next : '/studio';
    router.replace(next);
  } catch (err) {
    error.value = err.message;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="narrow">
    <RouterLink to="/studio" class="btn ghost sm back"><Icon name="arrowLeft" :size="15" /> Home</RouterLink>
    <div class="page-head">
      <div>
        <h1>Set up payments</h1>
        <p>{{ intro || 'Clients pay you directly. Choose where you get paid and we set up your payout account — nothing else to sign up for.' }}</p>
      </div>
    </div>
    <div v-if="dashboard.loaded && dashboard.payout_ready" class="card card-pad stack">
      <p><strong>Your payout account is already set up.</strong></p>
      <p class="muted">{{ dashboard.payout?.provider_label }} · {{ dashboard.payout?.display_name }}<template v-if="dashboard.payout?.summary"> · {{ dashboard.payout.summary }}</template></p>
      <RouterLink to="/studio/account" class="btn" style="align-self: flex-start">View in Account</RouterLink>
    </div>
    <div v-else class="card card-pad stack">
      <div v-if="error" class="form-error">{{ error }}</div>
      <PayoutForm :name="user?.name" :lastname="user?.lastname" :busy="busy" @intro="intro = $event" @submit="submit" />
    </div>
  </div>
</template>

<style scoped>
.narrow { max-width: 620px; }
.back { margin: -6px 0 12px -10px; }
</style>
