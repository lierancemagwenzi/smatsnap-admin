<script setup>
// 6-digit email code: verifies a new account (mode "verify", Bearer otp_token) or a
// password reset (mode "reset", email + code → reset_token → new password).
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { studioSession } from '../../studio/session';
import { request } from '../../studio/http';
import AuthShell from '../../components/AuthShell.vue';

const route = useRoute();
const router = useRouter();
const pending = ref(studioSession.pending());
const code = ref('');
const busy = ref(false);
const error = ref('');
const info = ref('');
const wait = ref(0);
let timer = null;

const isReset = computed(() => pending.value?.mode === 'reset');

function countdown(seconds) {
  wait.value = Math.max(0, Number(seconds) || 0);
  clearInterval(timer);
  timer = setInterval(() => { if (wait.value > 0) wait.value--; else clearInterval(timer); }, 1000);
}

onMounted(() => {
  if (!pending.value) return router.replace({ name: 'studio-login' });
  countdown(pending.value.resend_in ?? 60);
});
onBeforeUnmount(() => clearInterval(timer));

async function submit() {
  error.value = '';
  const otp = code.value.replace(/\D/g, '');
  if (otp.length !== 6) return (error.value = 'Enter the 6-digit code from your email.');
  busy.value = true;
  try {
    if (isReset.value) {
      const { reset_token } = await request('POST', '/auth/verify-reset-otp', { body: { email: pending.value.email, otp }, auth: false });
      studioSession.setPending({ ...pending.value, reset_token });
      router.replace({ name: 'studio-reset' });
    } else {
      const body = await request('POST', '/auth/verify-otp', { body: { otp }, token: pending.value.otp_token });
      studioSession.adopt(body);
      const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/studio') ? route.query.redirect : '/studio';
      router.replace(redirect);
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    busy.value = false;
  }
}

async function resend() {
  error.value = '';
  info.value = '';
  try {
    const body = isReset.value
      ? await request('POST', '/auth/forgot-password', { body: { email: pending.value.email }, auth: false })
      : await request('POST', '/auth/resend-otp', { body: {}, token: pending.value.otp_token });
    info.value = 'We sent you a new code.';
    countdown(body?.resend_in ?? 60);
  } catch (err) {
    error.value = err.message;
    if (err.body?.resend_in) countdown(err.body.resend_in);
  }
}
</script>

<template>
  <AuthShell :title="isReset ? 'Check your email' : 'Verify your email'" sub="Studio"
             :subtitle="`Enter the 6-digit code we sent to ${pending?.email || 'your email'}. It expires in 10 minutes.`">
    <form class="stack" @submit.prevent="submit">
      <div v-if="error" class="form-error">{{ error }}</div>
      <div v-else-if="info" class="form-note">{{ info }}</div>
      <input v-model="code" class="input code" inputmode="numeric" autocomplete="one-time-code" maxlength="7" placeholder="••••••" autofocus aria-label="Verification code" />
      <button class="btn primary lg" type="submit" :disabled="busy">{{ busy ? 'Checking…' : isReset ? 'Continue' : 'Verify email' }}</button>
      <p class="small muted center">
        Didn’t get it?
        <button v-if="!wait" type="button" class="btn ghost sm link" @click="resend">Send a new code</button>
        <span v-else>Resend in {{ wait }}s</span>
      </p>
    </form>
  </AuthShell>
</template>

<style scoped>
.code { text-align: center; font-size: 28px; letter-spacing: .5em; font-weight: 800; padding: 14px; }
.center { text-align: center; }
.link { color: var(--brand-2); }
</style>
