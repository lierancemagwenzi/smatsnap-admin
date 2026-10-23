<script setup>
// Photographer signup, two steps like the app: account details → payout details
// (account + payout account are created together), then email verification.
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { studioSession } from '../../studio/session';
import AuthShell from '../../components/AuthShell.vue';
import PayoutForm from '../../components/studio/PayoutForm.vue';
import Icon from '../../components/Icon.vue';

const router = useRouter();
const step = ref(1);
const form = reactive({ name: '', lastname: '', email: '', password: '' });
const show = ref(false);
const busy = ref(false);
const error = ref('');
const intro = ref(null);

async function next() {
  error.value = '';
  if (!form.name.trim() || !form.lastname.trim()) return (error.value = 'Enter your first and last name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return (error.value = 'Enter a valid email address.');
  if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
    return (error.value = 'Use 8+ characters with letters and numbers.');
  }
  busy.value = true;
  try {
    const { available } = await studioSession.checkEmail(form.email.trim());
    if (!available) return (error.value = 'An account with this email already exists. Sign in instead.');
    step.value = 2;
  } catch (err) {
    error.value = err.message;
  } finally {
    busy.value = false;
  }
}

async function register(payout) {
  error.value = '';
  busy.value = true;
  try {
    await studioSession.register({
      name: form.name.trim(), lastname: form.lastname.trim(), email: form.email.trim(), password: form.password, payout,
    });
    router.push({ name: 'studio-verify' });
  } catch (err) {
    error.value = err.message;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <AuthShell v-if="step === 1" title="Create your photographer account" subtitle="Sell your event photos and videos. Clients find themselves with a selfie." sub="Studio">
    <form class="stack" novalidate @submit.prevent="next">
      <div v-if="error" class="form-error">{{ error }}</div>
      <div class="two">
        <div class="field"><label for="name">First name</label><input id="name" v-model="form.name" class="input" autocomplete="given-name" required autofocus /></div>
        <div class="field"><label for="lastname">Last name</label><input id="lastname" v-model="form.lastname" class="input" autocomplete="family-name" required /></div>
      </div>
      <div class="field"><label for="email">Email</label><input id="email" v-model="form.email" class="input" type="email" autocomplete="email" required /></div>
      <div class="field">
        <label for="password">Password</label>
        <div class="pw">
          <input id="password" v-model="form.password" class="input" :type="show ? 'text' : 'password'" autocomplete="new-password" required />
          <button type="button" class="btn ghost sm eye" @click="show = !show" :aria-label="show ? 'Hide password' : 'Show password'"><Icon :name="show ? 'eyeOff' : 'eye'" :size="16" /></button>
        </div>
        <span class="small faint">Use 8+ characters with letters and numbers.</span>
      </div>
      <button class="btn primary lg" type="submit" :disabled="busy">{{ busy ? 'Checking…' : 'Continue' }}</button>
      <p class="small faint center">Next: your payout details, so clients can pay you.</p>
      <p class="small muted center">Already have an account? <RouterLink :to="{ name: 'studio-login' }" class="link">Sign in</RouterLink></p>
    </form>
  </AuthShell>

  <AuthShell v-else wide title="Your payout details" sub="Studio"
             :subtitle="intro || 'Clients pay you directly. Choose where you get paid and we set up your payout account — nothing else to sign up for.'">
    <div class="stack">
      <div class="row small"><span class="step">Step 2 of 2</span><span class="spacer" /><button class="btn ghost sm" @click="step = 1"><Icon name="arrowLeft" :size="14" /> Back</button></div>
      <div v-if="error" class="form-error">{{ error }}</div>
      <PayoutForm :name="form.name" :lastname="form.lastname" submit-label="Create account" :busy="busy" @intro="intro = $event" @submit="register" />
    </div>
  </AuthShell>
</template>

<style scoped>
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.pw { position: relative; }
.pw .input { padding-right: 44px; }
.eye { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); }
.center { text-align: center; }
.link { color: var(--brand-2); font-weight: 600; text-decoration: none; }
.step { color: var(--brand-2); font-weight: 700; }
@media (max-width: 420px) { .two { grid-template-columns: 1fr; } }
</style>
