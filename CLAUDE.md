# CLAUDE.md

SmatSnap website + admin dashboard: Vue 3 + Vite + Vue Router (no Pinia), Chart.js. Public landing
page at `/`, admin at `/admin` (sign in at `/admin/login`). API contract: `../photo-backend/docs/admin-api.md`.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/
```

Both use the remote API (`https://smatsnap-api.strima.co.za/api`, from `.env.development` / `.env.production`); for a local backend run `VITE_API_BASE_URL=http://localhost:8010/api npm run dev`. The site's hostname (`smatsnap.strima.co.za`) is in `allowedHosts` in `vite.config.js` (dev + preview). Store links on the landing page come from
`VITE_APP_STORE_URL` / `VITE_PLAY_STORE_URL` (buttons say "Coming soon" until set).

**Deploying:** static `dist/` behind any web server with an SPA fallback (nginx: `try_files $uri /index.html;`),
otherwise `/admin/...` deep links 404. Set the backend's `ADMIN_DASHBOARD_URL` to `<site>/admin` so invite emails link here.

## Structure
- `src/api/http.js` — fetch wrapper; tokens in localStorage; on 401 refreshes once (shared across concurrent calls) via `/auth/refresh-token`, else clears the session and the router goes to login.
- `src/session.js` — the signed-in admin (`session.user`, `session.isSuper`); only `user_type: 'admin'` sessions are accepted.
- `src/router.js` — `meta.auth` guards `/admin/*`; `meta.superAdmin` for Admins.
- `src/utils/useList.js` — paged/filtered list bound to an admin endpoint, filters mirrored in the URL query.
- `src/views/LandingPage.vue` — marketing page. `src/views/admin/*` — one view per dashboard page.
- `src/components/` — `AdminLayout` (sidebar shell), `ChartCanvas` (Chart.js, follows theme), `Modal`, `ConfirmDialog` (optional reason → activity log), `StatCard`, `StatusBadge`, `Pager`, `Icon` (inline SVG set).
- Theme tokens in `src/styles.css` (brand purple `#8B3DFF` → pink `#E64B9B`, plum dark mode via `prefers-color-scheme`, Plus Jakarta Sans) — same palette as the app.

Timestamps from the API are model `createdAt` values exposed as `created_at`; money is always shown per currency (orders can be USD, ZAR, …) — never sum across currencies.
