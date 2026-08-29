# NEXI Admin Control Plane — Current Instructions

## Authority
- Windows Admin source authority is `C:\trae_projects\Dexi_style_TraeWV\apps\admin`.
- Backend/API/D1/Cloudflare/runtime authority is the VM workspace `/root/workspaces/nexi-authoritative-20260823` on `sg-edge-01`.
- Do not implement backend fixes in this Windows tree and do not copy stale Windows backend files to the VM.
- Never run Git unless the owner explicitly requests it.
- Production mutation requires explicit owner approval.

## Current architecture
Preserve the existing provider boundary:
`Admin UI -> AdminDataProvider -> NexiAdminApiProvider (live) | LocalMockAdminProvider (explicit local/demo)`.

`NexiAdminApiProvider` is already a substantial live adapter and is no longer a future placeholder. It currently implements many canonical `/admin/*` reads and mutations. Do not rebuild it.
`LocalMockAdminProvider` remains useful for explicit local/demo workflows only. Live/staging/production mode must never silently fall back to mock data or success-shaped placeholders.
Methods without canonical backend authority must fail closed and surface the unsupported state until the backend contract exists.

## Parallel Admin lane
Admin contract adaptation may proceed now in parallel with VM backend completion.
Before changing a provider method, inspect the current Windows provider and the current VM controller/DTO/service or generated OpenAPI evidence. Do not infer a missing backend route from mock behavior.
Classify each AdminDataProvider method as `LIVE_COMPLETE`, `LIVE_PARTIAL`, `UNSUPPORTED_BACKEND`, `LOCAL_ONLY`, `CONTRACT_MISMATCH`, or `STALE`.
Prioritize live parity for auth/identity, sessions, users/KYC, market controls, wallets/ledger, deposits/withdrawals, Mining, Loans, Support, Announcements, governance/audit, feature flags, maintenance, and health before adding new Admin concepts.
Do not invent persistence for public routes, banners, localization, exposure, reconciliation, user entitlements, role mutations, or other currently unsupported authorities. Record an exact backend dependency instead.

## Current corrections
- D1 is canonical durable application/financial authority. Do not label the live dependency PostgreSQL.
- Current staging `/ops/ready` is stale-deployment evidence; use the final D1-aware readiness contract after the VM join. Do not hard-code PostgreSQL health labels.
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
