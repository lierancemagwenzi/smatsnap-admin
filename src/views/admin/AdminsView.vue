<script setup>
import { ref, reactive } from 'vue';
import { api } from '../../api/http';
import { toast, toastError } from '../../utils/toast';
import { relative, date } from '../../utils/format';
import StatusBadge from '../../components/StatusBadge.vue';
import Modal from '../../components/Modal.vue';
import ConfirmDialog from '../../components/ConfirmDialog.vue';
import Icon from '../../components/Icon.vue';

const admins = ref(null);
const adding = ref(false);
const form = reactive({ name: '', lastname: '', email: '', admin_role: 'admin' });
const formError = ref('');
const busy = ref(false);
const invited = ref(null);
const pending = ref(null); // { admin, change, title, message, label, danger }

async function load() {
  try { admins.value = (await api.get('/admin/admins')).admins; } catch (err) { toastError(err); }
}
load();

function openAdd() {
  Object.assign(form, { name: '', lastname: '', email: '', admin_role: 'admin' });
  formError.value = '';
  adding.value = true;
}

async function add() {
  formError.value = '';
  busy.value = true;
  try {
    const body = await api.post('/admin/admins', { ...form });
    adding.value = false;
    invited.value = body;
    await load();
  } catch (err) {
    formError.value = err.message;
  } finally {
    busy.value = false;
  }
}

function ask(admin, kind) {
  const name = `${admin.name} ${admin.lastname}`;
  pending.value = {
    role: { admin, change: { admin_role: admin.admin_role === 'super_admin' ? 'admin' : 'super_admin' }, title: admin.admin_role === 'super_admin' ? `Make ${name} a regular admin?` : `Make ${name} a super admin?`, message: admin.admin_role === 'super_admin' ? 'They’ll no longer be able to manage admins.' : 'Super admins can add, change and suspend other admins.', label: 'Change role' },
    suspend: { admin, change: { status: 'suspended' }, title: `Suspend ${name}?`, message: 'They’ll be signed out and can’t sign in until reactivated.', label: 'Suspend', danger: true },
    activate: { admin, change: { status: 'active' }, title: `Reactivate ${name}?`, message: 'They’ll be able to sign in again.', label: 'Reactivate' },
    remove: { admin, remove: true, title: `Remove the invite for ${name}?`, message: 'They haven’t set a password yet. The account will be deleted.', label: 'Remove invite', danger: true },
  }[kind];
}

async function confirm() {
  busy.value = true;
  try {
    const p = pending.value;
    const body = p.remove ? await api.del(`/admin/admins/${p.admin.id}`) : await api.put(`/admin/admins/${p.admin.id}`, p.change);
    toast(body.message);
    pending.value = null;
    await load();
  } catch (err) {
    toastError(err);
  } finally {
    busy.value = false;
  }
}

async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast('Link copied'); } catch { toastError({ message: 'Couldn’t copy. Select the link and copy it manually.' }); }
}
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1>Admins</h1>
        <p>People who can use this dashboard. Only super admins can manage this list.</p>
      </div>
      <span class="spacer" />
      <button class="btn primary" @click="openAdd"><Icon name="plus" :size="16" /> Add admin</button>
    </div>

    <div class="card">
      <div v-if="!admins" class="loading-bar" />
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>Admin</th><th>Role</th><th>Status</th><th>Added</th><th>Last sign-in</th><th></th></tr></thead>
          <tbody>
            <tr v-for="a in admins || []" :key="a.id">
              <td>
                <strong>{{ a.name }} {{ a.lastname }}</strong> <span v-if="a.is_me" class="badge info plain">You</span>
                <div class="muted small">{{ a.email }}</div>
              </td>
              <td><StatusBadge :status="a.admin_role" /></td>
              <td>
                <span v-if="!a.password_set" class="badge warn">Invited</span>
                <StatusBadge v-else :status="a.status" />
              </td>
              <td class="small nowrap">{{ date(a.created_at) }}</td>
              <td class="small nowrap muted">{{ relative(a.last_login_at) }}</td>
              <td>
                <div v-if="!a.is_me" class="row actions">
                  <button class="btn sm" @click="ask(a, 'role')">{{ a.admin_role === 'super_admin' ? 'Make admin' : 'Make super admin' }}</button>
                  <button v-if="!a.password_set" class="btn sm danger" @click="ask(a, 'remove')">Remove</button>
                  <button v-else-if="a.status === 'active'" class="btn sm danger" @click="ask(a, 'suspend')">Suspend</button>
                  <button v-else class="btn sm" @click="ask(a, 'activate')">Reactivate</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Modal v-if="adding" title="Add an admin" @close="adding = false">
      <form id="add-admin" class="stack" @submit.prevent="add">
        <div v-if="formError" class="form-error">{{ formError }}</div>
        <div class="two">
          <div class="field"><label for="fn">First name</label><input id="fn" v-model="form.name" class="input" required autofocus /></div>
          <div class="field"><label for="ln">Last name</label><input id="ln" v-model="form.lastname" class="input" required /></div>
        </div>
        <div class="field"><label for="em">Email</label><input id="em" v-model="form.email" class="input" type="email" required /></div>
        <div class="field">
          <label for="role">Role</label>
          <select id="role" v-model="form.admin_role" class="select">
            <option value="admin">Admin: everything except managing admins</option>
            <option value="super_admin">Super admin: can also manage admins</option>
          </select>
        </div>
        <p class="muted small">They’ll get an email asking them to set a password. No password is shared with you.</p>
      </form>
      <template #footer>
        <button class="btn" @click="adding = false">Cancel</button>
        <button class="btn primary" form="add-admin" type="submit" :disabled="busy">{{ busy ? 'Adding…' : 'Add admin' }}</button>
      </template>
    </Modal>

    <Modal v-if="invited" title="Admin added" @close="invited = null">
      <div class="stack">
        <p>{{ invited.message }}</p>
        <template v-if="invited.set_password_url">
          <p class="muted small">If the email doesn’t arrive, send them this link:</p>
          <div class="row link-row">
            <input class="input mono" :value="invited.set_password_url" readonly @focus="$event.target.select()" />
            <button class="btn" @click="copy(invited.set_password_url)">Copy</button>
          </div>
        </template>
      </div>
      <template #footer><button class="btn primary" @click="invited = null">Done</button></template>
    </Modal>

    <ConfirmDialog v-if="pending" :title="pending.title" :message="pending.message" :confirm-label="pending.label"
                   :danger="pending.danger" :busy="busy" @close="pending = null" @confirm="confirm" />
  </div>
</template>

<style scoped>
.actions { justify-content: flex-end; gap: 8px; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.link-row .input { flex: 1; }
@media (max-width: 480px) { .two { grid-template-columns: 1fr; } }
</style>
