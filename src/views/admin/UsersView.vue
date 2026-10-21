<script setup>
import { useList } from '../../utils/useList';
import { relative, date } from '../../utils/format';
import Pager from '../../components/Pager.vue';
import StatusBadge from '../../components/StatusBadge.vue';

const { filters, page, data, loading } = useList('/admin/users', { q: '', type: '', status: '', verified: '' });
const initials = (u) => `${u.name?.[0] || ''}${u.lastname?.[0] || ''}`.toUpperCase();
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1>Users</h1>
        <p>Photographers and clients. Open a user to see their activity or suspend them.</p>
      </div>
    </div>
    <div class="card">
      <div class="filters">
        <input v-model="filters.q" class="input grow" type="search" placeholder="Search name or email…" aria-label="Search" />
        <select v-model="filters.type" class="select" aria-label="Type">
          <option value="">All types</option>
          <option value="creator">Photographers</option>
          <option value="client">Clients</option>
        </select>
        <select v-model="filters.status" class="select" aria-label="Status">
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <select v-model="filters.verified" class="select" aria-label="Email">
          <option value="">Any email</option>
          <option value="true">Verified</option>
          <option value="false">Unverified</option>
        </select>
      </div>
      <div v-if="loading" class="loading-bar" />
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr><th>User</th><th>Type</th><th>Status</th><th>Payout</th><th>Joined</th><th>Last sign-in</th></tr>
          </thead>
          <tbody>
            <tr v-for="u in data?.users || []" :key="u.id" class="clickable" @click="$router.push(`/admin/users/${u.id}`)">
              <td>
                <div class="row">
                  <span class="avatar">{{ initials(u) }}</span>
                  <div>
                    <strong>{{ u.name }} {{ u.lastname }}</strong>
                    <div class="muted small">{{ u.email }}<span v-if="!u.email_verified_at" class="badge warn plain unv">unverified</span></div>
                  </div>
                </div>
              </td>
              <td><StatusBadge :status="u.user_type" /></td>
              <td><StatusBadge :status="u.status" /></td>
              <td class="small">
                <template v-if="u.payout">{{ u.payout.provider_label }} · {{ u.payout.country }}</template>
                <span v-else-if="u.user_type === 'creator'" class="badge warn plain">Not set up</span>
                <span v-else class="faint">—</span>
              </td>
              <td class="nowrap small">{{ date(u.created_at) }}</td>
              <td class="nowrap small muted">{{ relative(u.last_login_at) }}</td>
            </tr>
            <tr v-if="data && !data.users.length"><td colspan="6" class="empty">No users match these filters</td></tr>
          </tbody>
        </table>
      </div>
      <Pager v-if="data" v-model:page="page" :size="data.size" :total="data.total" />
    </div>
  </div>
</template>

<style scoped>
.unv { margin-left: 8px; font-size: 11px; padding: 1px 7px; }
</style>
