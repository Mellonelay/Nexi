# CURRENT OWNER BROWSER OVERRIDE — 2026-10-21

For NEXI Work Local, Admin rendered acceptance uses the existing owner-authorized ChatGPT in-app browser Admin tab, independently of Public. Work Cloud Browser is not required. Use authorized direct SSH alias nexi-vps for Worker-0 source/CLI work, with RDC as fallback. Do not transfer credentials or session material between surfaces.

## CANONICAL ADMIN BUILD — 2026-10-22

Build/deploy only from committed source in the canonical `main` checkout. `/srv/nexi/admin/current` is the only Nitro output/runtime directory and must remain a real directory; `/srv/nexi/admin/shared/node_modules` is the only Admin dependency store. `Admin/node_modules` must stay linked to that store. Use `Admin/pnpm-lock.yaml` with pnpm `12.14.0`; do not use the checked-in non-authoritative npm/Bun resolutions or install from the source checkout. For the one final build, verify the current artifact and rollback first, stop only `nexi-admin.service`, sync committed Admin source while preserving `shared/node_modules` and logs, then run `NEXI_ADMIN_OUTPUT_DIR=/srv/nexi/admin/current pnpm run build` from `Admin/` with the existing secret wrapper when Sentry upload is configured. Keep Nitro output in `current`; do not create alternate/candidate build roots. Restart Admin and verify server/artifact SHA, login/API boundary, routes, service stability, and Sentry identity.

## CURRENT VPS BUILD AND SHARED DEPENDENCY PATHS — 2026-10-20

Current source: /home/mellonelay1999/workspaces/Nexi (single main checkout). Source paths are frontend/ (Public Next.js), Admin/ (Admin React/TanStack/Nitro), backend/ (NestJS/Prisma 7). Live deployed bytes and source SHA must be verified independently.

Public: /srv/nexi/public/current is the single real production build and runtime directory; /srv/nexi/public/current/.next is generated output. Its current/node_modules is a symlink to /srv/nexi/public/shared/node_modules. nexi-public.service runs npm start from /srv/nexi/public/current. The cache subdirectory .next/cache can be regenerated and was selectively cleared; never delete other .next assets during cleanup.

Admin: /srv/nexi/admin/current is the single real Nitro output/runtime tree (not a symlink), with server/index.mjs and public/ assets. Its independent install/store is /srv/nexi/admin/shared/node_modules. The Admin standalone runtime does not need a node_modules symlink inside current; do not add one without demonstrated need. nexi-admin.service runs node /srv/nexi/admin/current/server/index.mjs. Preserve existing no extra build/release directories policy.

Backend: /srv/nexi/backend is the live service working directory, with built code at /srv/nexi/backend/dist/src/main.js. Its node_modules is now a symlink to /srv/nexi/backend/shared/node_modules (moved, not duplicated). nexi-api.service runs the installed Node 24.21.0 entry. Module resolution for NestJS, Prisma and better-sqlite3, native SQLite smoke, and API readyz returned successful evidence after this relocation.

Sharing boundary: These are THREE separate app-specific physical node_modules stores in stable shared/ locations, NOT a single cross-application node_modules directory or content-addressable dedup store. Backend relocation by itself saves no physical bytes. Do not blindly merge incompatible Next/Nitro/NestJS versions, Prisma native dependencies or lockfiles. Any cross-project dedup or package-manager change needs its own scoped dependency/ABI/rollback verification.

Storage: Root filesystem measured about 6.1 GiB available (88% used) after bounded cache cleanup on 2026-10-20; remeasure before assuming freshness. Preserve all live SQLite database/WAL/SHM files, financial data, backups, evidence, active Polypane mounts and runtime artifacts. Never blanket-clear /tmp or delete running-session files. Existing Public .next/cache was cleared; caches may regenerate. Prior npm cache had already been cleared by another operation. Permission-denied temp entries were not forcibly removed. Build, install, restart, push or deployment remain separately authorized actions.

This current owner-verified map supersedes older conflicting path or sharing claims below. For protected docs use worker0-protect unlock, bounded change, diff verification, refresh-lock, and status.

---
# NEXI Admin Control Plane — Current Instructions

## Single Admin build and runtime authority — owner decision 2026-10-10

The only generated Admin build/runtime directory is the real directory `/srv/nexi/admin/current` (never a symlink). Preserve `/srv/nexi/admin/shared/node_modules` as the canonical dependency directory and `/srv/nexi/admin/logs` for service logs. Avoid permanent build/release/candidate directories and copied build outputs. The source checkout's `Admin/node_modules` must remain a symlink to `/srv/nexi/admin/shared/node_modules`; do not run an install from the source tree that replaces it. `Admin/package.json` pins pnpm `12.14.0`, and `Admin/pnpm-lock.yaml` is the sole dependency lock authority for the Worker-0 Admin build. The checked-in npm and Bun lockfiles resolve older TanStack packages; do not install with npm or Bun or use their resolutions to change the shared store. Do not upgrade packages to repair build-path mistakes.

For the canonical production build, set `NEXI_ADMIN_OUTPUT_DIR=/srv/nexi/admin/current` and run `pnpm --config.verify-deps-before-run=false run build` from `Admin/`; the default `./.output` is not a Worker-0 release artifact. The shared dependency tree is an intentional symlink, so pnpm's default pre-run verification can try to reinstall into the symlinked workspace-hoist directory and fail. Disable that pre-run check only when the Admin lockfile and manifests are unchanged since the last verified shared-store build; otherwise reconstruct the dedicated shared store from the frozen lockfile using the documented controlled install procedure. Never install from `Admin/` or replace its `node_modules` symlink. Do not run this build until the owner-selected source frontier and focused checks are ready, and do not use alternate/candidate output paths on Worker-0. The Admin output currently served must not be overwritten without the applicable release authorization and verified rollback.

For an explicitly authorized in-place release that would replace the last known-good output, preserve one clearly named temporary rollback archive under `/srv/nexi/admin/shared`. Archive only `current` (not shared dependencies or logs), retain ownership, modes, ACLs and extended attributes, verify archive integrity and checksum, extract and restore it into a disposable directory, compare restored contents, and confirm the live-target `rsync --archive --hard-links --acls --xattrs --delete --dry-run` is empty. Keep that archive until the new release is accepted. If deployment health checks fail, stop `nexi-admin.service`, extract the archive to a fresh temporary directory under `shared`, restore its `current/` contents into the real `/srv/nexi/admin/current` with `rsync --archive --hard-links --acls --xattrs --delete`, verify the prior release marker, and restart only Admin. Remove temporary verification/extraction directories after use; keep the archive until owner acceptance. Source remains `Admin` in the authoritative repository. After the canonical build, restart and verify `nexi-admin.service` and rendered live behavior. The release identifier must describe the source actually built, never a newer commit merely because HEAD advanced. This supersedes historical Admin immutable-release-tree instructions.

## Authority
- GitHub `main` is the durable source authority for Admin and the rest of NEXI.
- The current synchronized VM/RDC checkout is the execution workspace for this task; historical Windows/Codespace/old-VM trees are evidence only.
- Preserve unrelated parallel work and reconcile any unique accepted changes before fan-in.
- Production mutation requires explicit owner approval.

## Current architecture
Preserve the existing provider boundary:
`Admin UI -> AdminDataProvider -> NexiAdminApiProvider (live) | LocalMockAdminProvider (explicit local/demo)`.

`NexiAdminApiProvider` is already a substantial live adapter and is no longer a future placeholder. It currently implements many canonical `/admin/*` reads and mutations. Do not rebuild it.
`LocalMockAdminProvider` remains useful for explicit local/demo workflows only. Live/staging/production mode must never silently fall back to mock data or success-shaped placeholders.
Methods without canonical backend authority must fail closed and surface the unsupported state until the backend contract exists.

## Parallel Admin lane
Admin contract work may proceed only from the current acceptance-matrix frontier; reuse proven unchanged work and close only unresolved dependencies.
Before changing a provider method, inspect the current Admin provider and backend controller/DTO/service or generated OpenAPI evidence from the same synchronized checkout. Do not infer a missing backend route from mock behavior.
Classify each AdminDataProvider method as `LIVE_COMPLETE`, `LIVE_PARTIAL`, `UNSUPPORTED_BACKEND`, `LOCAL_ONLY`, `CONTRACT_MISMATCH`, or `STALE`.
Prioritize live parity for auth/identity, sessions, users/KYC, market controls, wallets/ledger, deposits/withdrawals, Mining, Loans, Support, Announcements, governance/audit, feature flags, maintenance, and health before adding new Admin concepts.
Do not invent persistence for public routes, banners, localization, exposure, reconciliation, user entitlements, role mutations, or other currently unsupported authorities. Record an exact backend dependency instead.

## Current corrections
- Promoted VPS SQLite is canonical durable application/financial authority; Ledger is accounting truth. Verify `/readyz` against the deployed API.
- `NexiAdminApiProvider` already fails unsupported methods with HTTP-style 501 errors; preserve fail-closed behavior.
- Provider mode may remain `mock` or `live`, but production-path work must exercise `live` explicitly.

## Contract tools
Use the current Admin Graphify graph for provider/route blast radius. Current graph: 1,376 nodes / 3,842 edges / 105 communities; key hubs include `AdminDataProvider`, `NexiAdminApiProvider`, `LocalMockAdminProvider`, `useAdminQuery`, and `useAdminSession`.
After coherent edits run `graphify update . --no-cluster`; use `affected`, `path`, and `explain` before broad provider changes.
Use concrete VM controller/DTO/OpenAPI material with API Documentation Checker and API Impact Mapper. Progress summaries are not contract evidence.

## Validation
Use the repository's existing package manager/lockfile and scripts; do not change package manifests or framework versions merely for this lane.
Run focused type/lint/build/browser checks appropriate to changed Admin files. Preserve consequential-action confirmation, reason, actor/role/environment, idempotency, audit linkage, and explicit error states.
Do not claim live parity until the method is backed by a canonical backend contract and verified against the joined staging runtime.


## CURRENT ADMIN TANSTACK ARCHITECTURE + DESIGN MAPPING — 2026-10-21

Read `Admin/docs/TANSTACK_ARCHITECTURE_AND_ROUTE_MAP.md` (relative to repository root) before changes to Admin routing, shell/navigation, Admin API data ownership, or workspace UI. It is a **source-derived architecture/requirements map**, not a claim the new eight-workspace design or Binary simulation controls are already built. The prior historical `Admin/docs/CURRENT_STATUS.md` snapshot is not current acceptance authority.

**Actual framework:** Admin is React 19 + TanStack Start/Router + TanStack Query + Vite/Nitro Node; `Admin/vite.config.ts` uses `@lovable.dev/vite-tanstack-config`, which already provides Start/router Vite plugins. Never add another generic `tanstackRouter()` or `tanstackStart()` plugin without inspecting wrapper behavior. Keep `Admin/src/routeTree.gen.ts` generated, maintain `createFileRoute` file routing and type-safe links. A Start loader is isomorphic; it is not an implicit server-only boundary. Keep backend business authority in NestJS and secrets server-only. Review the actual `useAdminQuery` provider pattern before introducing TanStack Query loaders or invalidation to avoid competing caches.

**Navigation truth:** `Admin/src/admin/config/navigation.ts` contains **33** visible sidebar routes; `Admin/src/routes/reconciliation.tsx` is a **34th named file route** without a sidebar item. `index.tsx` and `__root.tsx` are separate routing infrastructure. Eight compact workspaces (Overview, Clients, Trading, Wallet & Finance, Markets, Products, Communications, Administration & Settings) are an **owner-proposed presentation reorganization**, not permission to remove existing URLs, UI controls, provider functions or backend contracts. Preserve permission-aware deep links and account/position context; do not infer a missing backend command from a demo/reference.

**Intent requiring subsequent owner-scoped implementation:** accessible Client-level Binary simulation defaults and Trading > Binary > Ongoing Positions test-position mode controls, with a single NestJS-authoritative policy/settlement path and isolated, explicitly labeled simulated chart/result projection. Historical DEXI/FAST X/Axue observations explain the design but do not prove an existing NEXI API, price algorithm or deployed behavior. Normal genuine-market settlement, Ledger, canonical provider feeds, Spot/Margin and unrelated accounts remain distinct. Configuration surfaces for 53 assets, Binary durations/payout/stake, Mining, Loans, Wallet/Finance, Messages and Public settings must remain reachable. Do not build a second financial writer or silently alter genuine outcomes.

**Validation for any later implementation:** inventory `navigation.ts`, source routes and generated route tree; map each affected view to canonical provider method + NestJS controller/DTO; use schema-validated URL search state for shareable nonsecret filters, typed links, route pending/error boundaries, and cache invalidation at the actual resource owner. Confirm source/type/build and backend contracts before browser acceptance. Browser UI proof, deployed identity, financial acceptance and owner acceptance are distinct. This instruction update alone authorizes no build, deployment, restart, financial write or live outcome change. Current root `AGENTS.md`, proof-reuse register and direct owner decisions retain precedence for execution permissions.

**Current mapped contract (not implementation authority):** `Admin/docs/ADMIN_IMPLEMENTATION_CONTRACT_MAP_A_F_2026-10-21.md` is the owner-aligned, source-linked A01–A14 map. It supersedes conflicting counts and proposed-vs-built descriptions in earlier Admin notes. The eight NAV_GROUPS headers already exist locally, but contextual tabs, Binary account/open-trade controls, correct session action-context behavior and two-way Messages are not complete. Never treat `WORK_SSH_NEXT_EXECUTION_HANDOFF_2026-10-21.md` as an approved handoff.
