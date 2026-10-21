# CURRENT OWNER BROWSER OVERRIDE — 2026-10-21

For NEXI Work Local, Admin rendered acceptance uses the existing owner-authorized ChatGPT in-app browser Admin tab, independently of Public. Work Cloud Browser is not required. Use authorized direct SSH alias nexi-vps for Worker-0 source/CLI work, with RDC as fallback. Do not transfer credentials or session material between surfaces.

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

The only generated Admin build/runtime directory is the real directory `/srv/nexi/admin/current` (never a symlink). Preserve `/srv/nexi/admin/shared/node_modules` as the canonical dependency directory and `/srv/nexi/admin/logs` for service logs. Do not create or reintroduce `/srv/nexi/admin/build-*`, `/srv/nexi/admin/releases/*`, candidate, temporary, rollback, or copied build-output directories. Source remains `Admin` in the authoritative repository. Perform focused source/type/test verification before the one authorized production Admin build inside `/srv/nexi/admin/current`; then restart and verify `nexi-admin.service` and rendered live behavior. The release identifier must describe the source actually built, never a newer commit merely because HEAD advanced. This supersedes historical Admin immutable-release-tree instructions.

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
