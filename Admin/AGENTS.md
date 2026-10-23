# CURRENT OWNER BROWSER OVERRIDE — 2026-10-21

For NEXI Work Local, Admin rendered acceptance uses the existing owner-authorized ChatGPT in-app browser Admin tab, independently of Public. Work Cloud Browser is not required. Use authorized direct SSH alias nexi-vps for Worker-0 source/CLI work, with RDC as fallback. Do not transfer credentials or session material between surfaces.

## CANONICAL ADMIN BUILD — 2026-10-23

Follow the root `AGENTS.md` **Canonical Worker-0 Build and Release Contract** for the shared release sequence. Admin source is the canonical checkout's `Admin/` directory; `Admin/node_modules` must remain a symlink to `/srv/nexi/admin/shared/node_modules`. Dependency authority is `Admin/package.json`, `Admin/pnpm-lock.yaml`, `Admin/pnpm-workspace.yaml`, and the patch files referenced by that workspace. Checked-in npm/Bun lockfiles are not Worker-0 dependency authority. Never merge this store with Public or Backend.

The only Admin output/runtime path is `/srv/nexi/admin/current`, a real directory (never a symlink); Nitro writes `server/index.mjs` and `public/` there. Build from the committed checkout's `Admin/` directory; do not copy source into the output tree. Verify the pinned package manager and existing shared store, then run:

```bash
NEXI_ADMIN_OUTPUT_DIR=/srv/nexi/admin/current corepack pnpm@12.14.0 --config.verify-deps-before-run=false run build
```

The `verify-deps-before-run` exception is needed for the current intentional symlinked shared store. Use it only after confirming manifests and `pnpm-lock.yaml` still match the last verified shared-store install. If the dependency set changed or packages are missing, verify recovery of the dedicated store, stage the committed `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, and referenced `patches/` into `/srv/nexi/admin/shared`, then run `corepack pnpm@12.14.0 install --frozen-lockfile` there. Never run `pnpm install` from `Admin/` or replace the source `Admin/node_modules` symlink. The package build script is `vite build`; the repository Vite/TanStack config provides the Nitro Node server target and reads `NEXI_ADMIN_OUTPUT_DIR`. Do not use the default `Admin/.output` as a Worker-0 artifact.

For deployment, verify the running artifact and tested rollback first, stop only `nexi-admin.service`, and perform the single canonical build. If Sentry upload is configured, invoke it as `NEXI_ADMIN_OUTPUT_DIR=/srv/nexi/admin/current ~/.local/bin/nexi-admin-with-secrets corepack pnpm@12.14.0 --config.verify-deps-before-run=false run build`; the wrapper injects build credentials and the release SHA without exposing secrets. Keep output at `current`, restart only Admin, and verify built SHA, served routes, login/API boundary, service stability and matching Sentry release. Keep the verified rollback until owner acceptance; use the procedure below if defined health checks fail. Never deploy dirty or uncommitted Admin source.

---
# NEXI Admin Control Plane — Current Instructions

## Admin in-place rollback

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
