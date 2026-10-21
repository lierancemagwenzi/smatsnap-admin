<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { session } from '../../session';
import AuthShell from '../../components/AuthShell.vue';
import Icon from '../../components/Icon.vue';

const route = useRoute();
const router = useRouter();
const email = ref('');
const password = ref('');
const show = ref(false);
const busy = ref(false);
const error = ref('');
const notSet = ref(false);

async function submit() {
  error.value = '';
  notSet.value = false;
  busy.value = true;
  try {
    await session.login(email.value.trim(), password.value);
    const target = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/admin') ? route.query.redirect : '/admin';
    router.replace(target);
  } catch (err) {
    error.value = err.message;
    notSet.value = err.code === 'PASSWORD_NOT_SET';
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <AuthShell title="Sign in" subtitle="Admins only. Use the account you were invited with.">
    <form class="stack" @submit.prevent="submit">
      <div v-if="error" class="form-error">
        {{ error }}
        <RouterLink v-if="notSet" :to="{ name: 'set-password', query: { email } }"> Set it now →</RouterLink>
      </div>
      <div class="field">
        <label for="email">Email</label>
        <input id="email" v-model="email" class="input" type="email" autocomplete="username" required autofocus />
      </div>
      <div class="field">
        <label for="password">Password</label>
        <div class="pw">
          <input id="password" v-model="password" class="input" :type="show ? 'text' : 'password'" autocomplete="current-password" required />
          <button type="button" class="btn ghost sm eye" @click="show = !show" :aria-label="show ? 'Hide password' : 'Show password'">
            <Icon :name="show ? 'eyeOff' : 'eye'" :size="16" />
          </button>
        </div>
      </div>
      <button class="btn primary lg" type="submit" :disabled="busy">{{ busy ? 'Signing in…' : 'Sign in' }}</button>
      <RouterLink :to="{ name: 'set-password', query: email ? { email } : {} }" class="small muted center">Set or reset password</RouterLink>
    </form>
  </AuthShell>
</template>

<style scoped>
.pw { position: relative; }
.pw .input { padding-right: 44px; }
.eye { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); }
.center { text-align: center; }
</style>
