<script setup>
import { useList } from '../../utils/useList';
import { moneyList, date } from '../../utils/format';
import Pager from '../../components/Pager.vue';
import StatusBadge from '../../components/StatusBadge.vue';

const { filters, page, data, loading } = useList('/admin/payouts', { q: '', provider: '', country: '' });
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1>Payout accounts</h1>
        <p>Each photographer’s account with their country’s gateway. Credentials are never shown.</p>
      </div>
    </div>
    <div class="card">
      <div class="filters">
        <input v-model="filters.q" class="input grow" type="search" placeholder="Photographer, business name or account ID…" aria-label="Search" />
        <select v-model="filters.provider" class="select" aria-label="Gateway">
          <option value="">Any gateway</option>
          <option value="smatpay">SmatPay</option>
          <option value="paystack">Paystack</option>
        </select>
        <select v-model="filters.country" class="select" aria-label="Country">
          <option value="">Any country</option>
          <option value="ZW">Zimbabwe</option>
          <option value="ZA">South Africa</option>
          <option value="NG">Nigeria</option>
          <option value="GH">Ghana</option>
          <option value="KE">Kenya</option>
        </select>
      </div>
      <div v-if="loading" class="loading-bar" />
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr><th>Photographer</th><th>Business</th><th>Gateway</th><th>Account</th><th>Status</th><th class="num">Earned</th><th>Opened</th></tr>
          </thead>
          <tbody>
            <tr v-for="p in data?.payouts || []" :key="p.id" class="clickable" @click="p.user && $router.push(`/admin/users/${p.user.id}`)">
              <td><strong>{{ p.user?.name || '—' }}</strong><div class="muted small">{{ p.user?.email }}</div></td>
              <td>{{ p.display_name }}<div class="faint small">{{ p.summary }}</div></td>
              <td class="small">{{ p.provider_label }} · {{ p.country }} · {{ p.currency }}</td>
              <td class="mono">{{ p.account_id }}</td>
              <td>
                <StatusBadge :status="p.status" />
                <span v-if="!p.approved" class="badge warn plain approval">Awaiting gateway approval</span>
              </td>
              <td class="num nowrap">{{ moneyList(p.earned) }}</td>
              <td class="small nowrap">{{ date(p.created_at) }}</td>
            </tr>
            <tr v-if="data && !data.payouts.length"><td colspan="7" class="empty">No payout accounts match these filters</td></tr>
          </tbody>
        </table>
      </div>
      <Pager v-if="data" v-model:page="page" :size="data.size" :total="data.total" />
    </div>
  </div>
</template>

<style scoped>
.approval { margin-left: 6px; font-size: 11px; }
</style>
