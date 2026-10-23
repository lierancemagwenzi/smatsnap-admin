<script setup>
import { ref } from 'vue';
import Icon from '../components/Icon.vue';
import BrandMark from '../components/BrandMark.vue';

// Store links are set at build time (.env.production); until then the buttons say "Coming soon".
const appStore = import.meta.env.VITE_APP_STORE_URL || '';
const playStore = import.meta.env.VITE_PLAY_STORE_URL || '';
const year = new Date().getFullYear();
const menu = ref(false);

const guestSteps = [
  { icon: 'search', title: 'Find your event', text: 'Search by name or enter the event code your photographer shared.' },
  { icon: 'scan', title: 'Take a selfie', text: 'With your consent, face matching finds every photo and video clip you appear in.' },
  { icon: 'download', title: 'Pay & download', text: 'Preview watermarked shots, pay securely, and download full quality.' },
];
const creatorSteps = [
  { icon: 'camera', title: 'Upload straight from your phone', text: 'Photos and videos go directly to secure cloud storage, resumable on bad connections.' },
  { icon: 'card', title: 'Set your prices', text: 'One price for the event, or price individual shots. Share events with other photographers.' },
  { icon: 'wallet', title: 'Get paid', text: 'Clients pay you directly through SmatPay or Paystack. Track every sale in the app.' },
];
const features = [
  { icon: 'lock', title: 'Private by design', text: 'Selfies are used only with consent, only to search one event. Event media is deleted after 7 days.' },
  { icon: 'eye', title: 'Watermarked previews', text: 'Clients see protected previews and clip times. Originals unlock only after payment.' },
  { icon: 'globe', title: 'Local payments', text: 'EcoCash, cards, bank and mobile money across Zimbabwe, South Africa, Nigeria, Ghana and Kenya.' },
  { icon: 'video', title: 'Photos & video', text: 'Face matching works on video too, showing the moments you appear in.' },
];
</script>

<template>
  <div class="landing">
    <header class="nav">
      <div class="wrap nav-inner">
        <a href="#top" class="brand-link"><BrandMark :size="34" /></a>
        <nav class="links" :class="{ open: menu }" @click="menu = false">
          <a href="#guests">For guests</a>
          <a href="#photographers">For photographers</a>
          <a href="#features">Why SmatSnap</a>
          <RouterLink to="/studio" class="btn sm">Photographer sign in</RouterLink>
          <a href="#download" class="btn primary sm">Get the app</a>
        </nav>
        <button class="btn ghost sm burger" @click="menu = !menu" aria-label="Menu"><Icon :name="menu ? 'x' : 'menu'" /></button>
      </div>
    </header>

    <section id="top" class="hero">
      <div class="glow" aria-hidden="true" />
      <div class="wrap hero-grid">
        <div class="hero-copy">
          <span class="eyebrow"><Icon name="sparkle" :size="14" /> Event photos, found by your face</span>
          <h1>Every shot of you from the event. <span class="grad-text">In seconds.</span></h1>
          <p class="lead">
            Photographers upload. You snap a selfie. SmatSnap finds every photo and clip you’re in,
            so you only pay for the moments that are yours.
          </p>
          <div class="row wrap cta">
            <a href="#download" class="btn primary lg">Get the app</a>
            <a href="#photographers" class="btn lg">I’m a photographer</a>
          </div>
          <div class="trust row wrap small muted">
            <span><Icon name="check" :size="14" /> Consent-first face matching</span>
            <span><Icon name="check" :size="14" /> Media deleted after 7 days</span>
          </div>
        </div>

        <div class="hero-art" aria-hidden="true">
          <div class="phone">
            <div class="phone-top"><span class="dot" /><span class="pill" /></div>
            <div class="phone-title">Culture Fest <small>12 matches</small></div>
            <div class="tiles">
              <div v-for="n in 6" :key="n" class="tile" :class="'t' + n">
                <span v-if="n === 2" class="match">98%</span>
                <span v-if="n === 5" class="clip"><Icon name="video" :size="11" /> 0:42</span>
              </div>
            </div>
            <div class="phone-cta">Add 4 to cart · $8.00</div>
          </div>
          <div class="float f1"><Icon name="scan" :size="16" /> Matching your face…</div>
          <div class="float f2"><Icon name="check" :size="16" /> Paid with EcoCash</div>
        </div>
      </div>
    </section>

    <section id="guests" class="section">
      <div class="wrap">
        <div class="section-head">
          <span class="kicker">For guests</span>
          <h2>Stop scrolling through 2,000 photos</h2>
          <p class="muted">Find yourself at weddings, graduations, races, concerts and conferences.</p>
        </div>
        <div class="steps">
          <div v-for="(s, i) in guestSteps" :key="s.title" class="step card">
            <span class="num">{{ i + 1 }}</span>
            <span class="step-ico"><Icon :name="s.icon" :size="22" /></span>
            <h3>{{ s.title }}</h3>
            <p class="muted">{{ s.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <section id="photographers" class="section alt">
      <div class="wrap split">
        <div class="section-head left">
          <span class="kicker">For photographers</span>
          <h2>Sell every shot, not just the ones people ask for</h2>
          <p class="muted">
            Clients find themselves, so your whole gallery is shoppable from the moment it uploads.
            Payments go to your own gateway account in your country.
          </p>
          <a href="#download" class="btn primary">Start selling</a>
          <RouterLink to="/studio/register" class="btn">Sell from your computer</RouterLink>
        </div>
        <div class="list">
          <div v-for="s in creatorSteps" :key="s.title" class="list-item">
            <span class="step-ico"><Icon :name="s.icon" :size="20" /></span>
            <div>
              <h3>{{ s.title }}</h3>
              <p class="muted">{{ s.text }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="features" class="section">
      <div class="wrap">
        <div class="section-head">
          <span class="kicker">Why SmatSnap</span>
          <h2>Built for events, trusted with faces</h2>
        </div>
        <div class="features">
          <div v-for="f in features" :key="f.title" class="feature card">
            <span class="step-ico"><Icon :name="f.icon" :size="20" /></span>
            <h3>{{ f.title }}</h3>
            <p class="muted">{{ f.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <section id="download" class="section">
      <div class="wrap">
        <div class="download">
          <div>
            <h2>Get SmatSnap on your phone</h2>
            <p>One app for guests and photographers. Sign up in under a minute.</p>
          </div>
          <div class="row wrap stores">
            <a v-if="appStore" :href="appStore" class="store" target="_blank" rel="noopener"><small>Download on the</small>App Store</a>
            <span v-else class="store soon"><small>Coming soon to the</small>App Store</span>
            <a v-if="playStore" :href="playStore" class="store" target="_blank" rel="noopener"><small>Get it on</small>Google Play</a>
            <span v-else class="store soon"><small>Coming soon to</small>Google Play</span>
          </div>
        </div>
      </div>
    </section>

    <footer class="footer">
      <div class="wrap row wrap">
        <BrandMark :size="26" />
        <span class="muted small">© {{ year }} Smatech Group. All rights reserved.</span>
        <span class="spacer" />
        <RouterLink to="/admin" class="small muted">Admin</RouterLink>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.landing { overflow-x: clip; }
.wrap { max-width: 1160px; margin: 0 auto; padding: 0 24px; }
.nav { position: sticky; top: 0; z-index: 20; background: color-mix(in srgb, var(--bg) 82%, transparent); backdrop-filter: blur(12px); border-bottom: 1px solid color-mix(in srgb, var(--border) 60%, transparent); }
.nav-inner { display: flex; align-items: center; gap: 16px; height: 68px; }
.brand-link { text-decoration: none; }
.links { margin-left: auto; display: flex; align-items: center; gap: 28px; }
.links a:not(.btn) { text-decoration: none; color: var(--muted); font-weight: 600; font-size: 14px; }
.links a:not(.btn):hover { color: var(--text); }
.burger { display: none; margin-left: auto; }

.hero { position: relative; padding: 72px 0 88px; }
.glow { position: absolute; inset: -20% -10% auto; height: 640px; background: radial-gradient(closest-side at 70% 40%, color-mix(in srgb, var(--brand-1) 26%, transparent), transparent), radial-gradient(closest-side at 90% 70%, color-mix(in srgb, var(--brand-2) 20%, transparent), transparent); pointer-events: none; }
.hero-grid { position: relative; display: grid; grid-template-columns: 1.1fr .9fr; gap: 48px; align-items: center; }
.eyebrow { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; background: var(--info-bg); color: var(--info); font-weight: 700; font-size: 13px; }
h1 { font-size: clamp(36px, 5.4vw, 60px); font-weight: 800; letter-spacing: -0.035em; line-height: 1.05; margin: 20px 0 18px; }
.lead { font-size: 18px; color: var(--muted); max-width: 540px; }
.cta { margin-top: 28px; }
.trust { margin-top: 22px; gap: 20px; }
.trust span { display: inline-flex; align-items: center; gap: 6px; }
.trust :deep(svg) { color: var(--ok); }

.hero-art { position: relative; display: grid; place-items: center; min-height: 480px; }
.phone { width: 270px; padding: 14px; border-radius: 38px; background: #1b0d25; border: 1px solid #3a2347; box-shadow: 0 40px 80px rgba(60, 10, 90, .35); color: #fff; transform: rotate(3deg); }
.phone-top { display: flex; justify-content: center; gap: 6px; padding: 4px 0 12px; }
.phone-top .dot { width: 8px; height: 8px; border-radius: 50%; background: #3a2347; }
.phone-top .pill { width: 60px; height: 8px; border-radius: 8px; background: #3a2347; }
.phone-title { font-weight: 800; padding: 0 6px 10px; display: flex; justify-content: space-between; align-items: baseline; }
.phone-title small { font-weight: 600; color: #b9a5c7; font-size: 11px; }
.tiles { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.tile { position: relative; aspect-ratio: 3 / 4; border-radius: 14px; }
.t1 { background: linear-gradient(160deg, #f6c38b, #c0567a); }
.t2 { background: linear-gradient(160deg, #8b3dff, #e64b9b); outline: 2px solid #fff; outline-offset: -2px; }
.t3 { background: linear-gradient(160deg, #4b2a6b, #e48bb8); }
.t4 { background: linear-gradient(160deg, #2c6e8f, #9bd1c9); }
.t5 { background: linear-gradient(160deg, #e64b9b, #ffb27a); }
.t6 { background: linear-gradient(160deg, #6243c4, #2a1534); }
.match { position: absolute; top: 8px; left: 8px; padding: 2px 8px; border-radius: 999px; background: #fff; color: #8b3dff; font-size: 11px; font-weight: 800; }
.clip { position: absolute; bottom: 8px; left: 8px; display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 999px; background: rgba(0, 0, 0, .5); font-size: 11px; font-weight: 700; }
.phone-cta { margin-top: 12px; padding: 12px; text-align: center; border-radius: 999px; background: linear-gradient(90deg, #8b3dff, #e64b9b); font-weight: 700; font-size: 14px; }
.float { position: absolute; display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 14px; background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow); font-weight: 700; font-size: 13px; }
.float :deep(svg) { color: var(--brand-1); }
.f1 { top: 60px; left: 0; }
.f2 { bottom: 70px; right: 0; }

.section { padding: 88px 0; }
.section.alt { background: var(--bg-soft); }
.section-head { text-align: center; max-width: 640px; margin: 0 auto 44px; display: flex; flex-direction: column; gap: 12px; align-items: center; }
.section-head.left { text-align: left; align-items: flex-start; margin: 0; }
.kicker { font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: .1em; color: var(--brand-2); }
h2 { font-size: clamp(28px, 3.6vw, 40px); font-weight: 800; letter-spacing: -0.03em; }
h3 { font-size: 17px; font-weight: 700; }

.steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.step { position: relative; padding: 28px; display: flex; flex-direction: column; gap: 10px; }
.num { position: absolute; top: 20px; right: 24px; font-size: 44px; font-weight: 800; color: var(--border); line-height: 1; }
.step-ico { width: 46px; height: 46px; border-radius: 14px; display: grid; place-items: center; background: var(--gradient); color: #fff; box-shadow: 0 8px 20px rgba(139, 61, 255, .25); flex: none; margin-bottom: 6px; }

.split { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: center; }
.split .btn { margin-top: 8px; }
.list { display: flex; flex-direction: column; gap: 16px; }
.list-item { display: flex; gap: 16px; padding: 20px; border-radius: var(--radius); background: var(--surface); border: 1px solid var(--border); }
.list-item h3 { margin-bottom: 4px; }

.features { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.feature { padding: 24px; display: flex; flex-direction: column; gap: 8px; }

.download { display: flex; align-items: center; flex-wrap: wrap; gap: 28px; padding: 48px; border-radius: 28px; background: var(--gradient); color: #fff; box-shadow: 0 30px 60px rgba(139, 61, 255, .3); }
.download > div:first-child { flex: 1 1 320px; }
.download h2 { margin-bottom: 8px; }
.download p { opacity: .9; }
.stores { gap: 12px; }
.store { display: flex; flex-direction: column; padding: 10px 20px; border-radius: 14px; background: #14081c; color: #fff; text-decoration: none; font-weight: 800; font-size: 17px; line-height: 1.2; min-width: 170px; }
.store small { font-size: 11px; font-weight: 600; opacity: .75; }
.store.soon { opacity: .8; }

.footer { padding: 28px 0 36px; border-top: 1px solid var(--border); }
.footer a { text-decoration: none; }

@media (max-width: 960px) {
  .hero-grid, .split { grid-template-columns: 1fr; }
  .hero { padding: 40px 0 56px; }
  .hero-art { min-height: 440px; }
  .steps { grid-template-columns: 1fr; }
  .features { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 760px) {
  .burger { display: inline-flex; }
  .links { display: none; position: absolute; top: 68px; left: 0; right: 0; flex-direction: column; align-items: stretch; gap: 4px; padding: 12px 16px 16px; background: var(--surface); border-bottom: 1px solid var(--border); box-shadow: var(--shadow); }
  .links.open { display: flex; }
  .links a:not(.btn) { padding: 10px 4px; }
}
@media (max-width: 560px) {
  .wrap { padding: 0 16px; }
  .section { padding: 60px 0; }
  .features { grid-template-columns: 1fr; }
  .download { padding: 28px 22px; }
  .store { flex: 1 1 140px; min-width: 0; }
  .f1 { left: -4px; top: 30px; }
  .f2 { right: -4px; bottom: 40px; }
  .phone { width: 240px; }
}
</style>
