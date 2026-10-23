<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { studioSession } from '../../studio/session';
import { request } from '../../studio/http';
import AuthShell from '../../components/AuthShell.vue';

const route = useRoute();
const router = useRouter();
const email = ref(typeof route.query.email === 'string' ? route.query.email : '');
const busy = ref(false);
const error = ref('');

async function submit() {
  error.value = '';
  busy.value = true;
  try {
    const body = await request('POST', '/auth/forgot-password', { body: { email: email.value.trim() }, auth: false });
    studioSession.setPending({ mode: 'reset', email: email.value.trim(), resend_in: body?.resend_in });
    router.push({ name: 'studio-verify' });
  } catch (err) {
    error.value = err.message;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <AuthShell title="Forgot your password?" subtitle="Enter your email and we’ll send you a code to set a new one." sub="Studio">
    <form class="stack" @submit.prevent="submit">
      <div v-if="error" class="form-error">{{ error }}</div>
      <div class="field">
        <label for="email">Email</label>
        <input id="email" v-model="email" class="input" type="email" autocomplete="username" required autofocus />
      </div>
      <button class="btn primary lg" type="submit" :disabled="busy">{{ busy ? 'Sending…' : 'Send code' }}</button>
      <RouterLink :to="{ name: 'studio-login' }" class="small muted center">Back to sign in</RouterLink>
    </form>
  </AuthShell>
</template>

<style scoped>
.center { text-align: center; }
</style>
