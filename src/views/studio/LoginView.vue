<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { studioSession } from '../../studio/session';
import AuthShell from '../../components/AuthShell.vue';
import Icon from '../../components/Icon.vue';

const route = useRoute();
const router = useRouter();
const email = ref(typeof route.query.email === 'string' ? route.query.email : '');
const password = ref('');
const show = ref(false);
const busy = ref(false);
const error = ref('');

async function submit() {
  error.value = '';
  busy.value = true;
  try {
    const step = await studioSession.login(email.value.trim(), password.value);
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/studio') ? route.query.redirect : '/studio';
    if (step === 'otp') router.push({ name: 'studio-verify', query: { redirect } });
    else router.replace(redirect);
  } catch (err) {
    error.value = err.message;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <AuthShell title="Welcome back" subtitle="Sign in to manage your events, uploads and sales." sub="Studio">
    <form class="stack" @submit.prevent="submit">
      <div v-if="error" class="form-error">{{ error }}</div>
      <div class="field">
        <label for="email">Email</label>
        <input id="email" v-model="email" class="input" type="email" autocomplete="username" required autofocus />
      </div>
      <div class="field">
        <div class="row"><label for="password">Password</label><span class="spacer" />
          <RouterLink :to="{ name: 'studio-forgot', query: email ? { email } : {} }" class="small link">Forgot password?</RouterLink>
        </div>
        <div class="pw">
          <input id="password" v-model="password" class="input" :type="show ? 'text' : 'password'" autocomplete="current-password" required />
          <button type="button" class="btn ghost sm eye" @click="show = !show" :aria-label="show ? 'Hide password' : 'Show password'">
            <Icon :name="show ? 'eyeOff' : 'eye'" :size="16" />
          </button>
        </div>
      </div>
      <button class="btn primary lg" type="submit" :disabled="busy">{{ busy ? 'Signing in…' : 'Sign in' }}</button>
      <p class="small muted center">New to SmatSnap? <RouterLink :to="{ name: 'studio-register' }" class="link">Create a photographer account</RouterLink></p>
    </form>
  </AuthShell>
</template>

<style scoped>
.pw { position: relative; }
.pw .input { padding-right: 44px; }
.eye { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); }
.center { text-align: center; }
.link { color: var(--brand-2); font-weight: 600; text-decoration: none; }
</style>
