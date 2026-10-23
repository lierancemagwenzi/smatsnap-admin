<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { studioSession } from '../../studio/session';
import { request } from '../../studio/http';
import AuthShell from '../../components/AuthShell.vue';

const router = useRouter();
const pending = studioSession.pending();
const password = ref('');
const confirm = ref('');
const busy = ref(false);
const error = ref('');

onMounted(() => { if (!pending?.reset_token) router.replace({ name: 'studio-forgot' }); });

async function submit() {
  error.value = '';
  if (password.value.length < 8 || !/[A-Za-z]/.test(password.value) || !/\d/.test(password.value)) {
    return (error.value = 'Use 8+ characters with letters and numbers.');
  }
  if (password.value !== confirm.value) return (error.value = 'The passwords don’t match.');
  busy.value = true;
  try {
    const body = await request('POST', '/auth/reset-password', { body: { password: password.value }, token: pending.reset_token });
    studioSession.adopt(body);
    router.replace('/studio');
  } catch (err) {
    error.value = err.message;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <AuthShell title="Set a new password" subtitle="You’ll be signed out on your other devices." sub="Studio">
    <form class="stack" @submit.prevent="submit">
      <div v-if="error" class="form-error">{{ error }}</div>
      <div class="field"><label for="pw">New password</label><input id="pw" v-model="password" class="input" type="password" autocomplete="new-password" required autofocus /></div>
      <div class="field"><label for="pw2">Confirm password</label><input id="pw2" v-model="confirm" class="input" type="password" autocomplete="new-password" required /></div>
      <button class="btn primary lg" type="submit" :disabled="busy">{{ busy ? 'Saving…' : 'Save and sign in' }}</button>
    </form>
  </AuthShell>
</template>
