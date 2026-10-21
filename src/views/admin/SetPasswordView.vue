<script setup>
// New admins choose their password here; existing admins reset theirs. Uses the shared
// forgot-password flow: email → 6-digit code → new password (returns a session).
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { request } from '../../api/http';
import { session } from '../../session';
import AuthShell from '../../components/AuthShell.vue';

const route = useRoute();
const router = useRouter();
const step = ref('email');
const email = ref(typeof route.query.email === 'string' ? route.query.email : '');
const otp = ref('');
const password = ref('');
const confirm = ref('');
const resetToken = ref('');
const busy = ref(false);
const error = ref('');
const note = ref('');

const subtitle = computed(() => ({
  email: 'We’ll email you a 6-digit code to confirm it’s you.',
  code: `Enter the code we sent to ${email.value}.`,
  password: 'At least 8 characters, with a letter and a number.',
}[step.value]));

async function run(fn) {
  error.value = '';
  busy.value = true;
  try { await fn(); } catch (err) { error.value = err.message; } finally { busy.value = false; }
}

const sendCode = () => run(async () => {
  const body = await request('POST', '/auth/forgot-password', { body: { email: email.value.trim() }, auth: false });
  note.value = body.message;
  step.value = 'code';
});

const verify = () => run(async () => {
  const body = await request('POST', '/auth/verify-reset-otp', { body: { email: email.value.trim(), otp: otp.value.trim() }, auth: false });
  resetToken.value = body.reset_token;
  note.value = '';
  step.value = 'password';
});

const save = () => run(async () => {
  if (password.value !== confirm.value) throw new Error('Passwords don’t match');
  const body = await request('POST', '/auth/reset-password', { body: { password: password.value }, token: resetToken.value });
  if (body.user?.user_type !== 'admin') {
    throw new Error('Password saved, but this isn’t an admin account. Sign in on the SmatSnap app instead.');
  }
  session.adopt(body);
  router.replace('/admin');
});
</script>

<template>
  <AuthShell title="Set your password" :subtitle="subtitle">
    <div class="stack">
      <div v-if="error" class="form-error">{{ error }}</div>
      <div v-if="note" class="form-note">{{ note }}</div>

      <form v-if="step === 'email'" class="stack" @submit.prevent="sendCode">
        <div class="field">
          <label for="email">Email</label>
          <input id="email" v-model="email" class="input" type="email" autocomplete="username" required autofocus />
        </div>
        <button class="btn primary lg" :disabled="busy">{{ busy ? 'Sending…' : 'Email me a code' }}</button>
      </form>

      <form v-else-if="step === 'code'" class="stack" @submit.prevent="verify">
        <div class="field">
          <label for="otp">6-digit code</label>
          <input id="otp" v-model="otp" class="input code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="\d{6}" required autofocus />
        </div>
        <button class="btn primary lg" :disabled="busy">{{ busy ? 'Checking…' : 'Continue' }}</button>
        <button type="button" class="btn ghost sm" :disabled="busy" @click="step = 'email'; otp = ''">Use a different email / resend</button>
      </form>

      <form v-else class="stack" @submit.prevent="save">
        <input type="email" :value="email" autocomplete="username" hidden />
        <div class="field">
          <label for="pw">New password</label>
          <input id="pw" v-model="password" class="input" type="password" autocomplete="new-password" minlength="8" required autofocus />
        </div>
        <div class="field">
          <label for="pw2">Confirm password</label>
          <input id="pw2" v-model="confirm" class="input" type="password" autocomplete="new-password" minlength="8" required />
        </div>
        <button class="btn primary lg" :disabled="busy">{{ busy ? 'Saving…' : 'Save and sign in' }}</button>
      </form>

      <RouterLink :to="{ name: 'login' }" class="small muted center">Back to sign in</RouterLink>
    </div>
  </AuthShell>
</template>

<style scoped>
.code { font-size: 22px; letter-spacing: .4em; text-align: center; font-weight: 700; }
.center { text-align: center; }
</style>
