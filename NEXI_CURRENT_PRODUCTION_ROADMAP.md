# NEXI Current Production Roadmap

Assessment date: 2026-08-21
Mode: read-only reconciliation; no application, infrastructure, database, DNS, secret, or deployment mutation.

## Current architecture completion

### Frontend

**Verified from current source and Codebase Memory**

- Public Next.js frontend is present under `cloudflare-container-bootstrap/dexi-frontend`.
- Dashboard shell owns AppHeader, WalletAccessGate, desktop/sidebar navigation, mobile BottomNav, and scroll ownership.
- Current source contains the Wallet, Spot/Margin, Options/Binary, market/chart, wallet/auth, activity/history, asset, and shared design-system components.
- The current frontend index exposes major entry points and connected communities for wallet/page, Spot/Margin, Options/Binary, market/realtime, active instrument/locale, charts, and shared primitives.
- The previously reported frontend Graphify result of 786 nodes / 1362 edges / 60 communities / 100% extracted was not found as a current repository artifact during this reconciliation. Current Codebase Memory frontend scope reports 1,283 nodes / 2,234 edges. These are topology measurements, not runtime proof.
- `NEXI_FRONTEND_COMPLETENESS_AUDIT.md` was not found at the expected repository paths. Its reported claims are therefore handover claims, not independently verified artifact evidence.
- Existing UI/API wiring must still be separated from authenticated browser proof. WalletAccessGate correctly fails closed when a session is absent.

### Backend

**Verified from current source and Codebase Memory**

- NestJS backend is present under `backend`.
- Prisma/PostgreSQL is the durable authority; Redis is used for ephemeral coordination/realtime.
- SpotModule currently registers `MarginController` and `MarginService`; the current graph resolves `MarginController -> MarginService` methods for quote, positions, open/close, mark, liquidation, transfer, and history.
- The current product authority therefore retains Spot/Margin as an intentional surface. This is source evidence, not a claim that every lifecycle has been runtime-accepted.
- Binary/Options, market ingestion, persistence, ledger/financial, wallet/auth, Redis/realtime, mining, and runtime configuration form identifiable backend communities in Codebase Memory.
- The backend Dockerfile builds a production NestJS image, runs Prisma generate during build, starts `node dist/src/main.js`, listens on port 3000, and does not perform destructive startup migration.

### Infrastructure

**Verified from configuration and receipts**

- Worker entrypoint is `cloudflare-container-bootstrap/src/index.js`.
- Worker routes ordinary traffic and Socket.IO upgrades through `getContainer(...).fetch(request)`; the Worker does not own financial domain logic.
- Wrangler config declares `NexiApiContainer`, Durable Object binding/migration, and an R2 binding for deposit proofs.
- Container contract is port 3000 with `/ops/live` ping and backend `/ops/ready`.
- PostgreSQL and Redis are external environment-provided services; they are not Cloudflare financial-authority bindings.
- Phase C disposable VM validation passed after source synchronization: Node/Wrangler/Docker checks, Wrangler types, strict dry-run, Linux/amd64 Docker build, disposable PostgreSQL migrations, `/ops/live`, `/ops/ready`, Engine.IO polling, and cleanup.
- No Cloudflare deployment has occurred.

## Current stage

**Pre-deployment readiness reconciliation.**

The project is beyond frontend source reconstruction and Cloudflare source/VM preparation, but it is not yet at an evidence-backed Cloudflare staging acceptance gate. The next stage is not blind deployment.

## Next production step

**C) Infrastructure correction and pre-deployment verification before Cloudflare staging deployment.**

This is selected over A and B:

- **Not A yet:** Cloudflare staging deployment is approval-gated and has not been executed. A disposable VM pass is not staging acceptance.
- **Not B as a broad product rebuild:** current source contains the principal frontend surfaces and backend authorities; no broad frontend/backend rebuild is justified by this read-only reconciliation.
- **C is required:** close the remaining environment/package/edge verification boundary and reconcile current source-to-runtime differences before requesting staging deployment approval.

The bounded next gate is:

1. Synchronize the approved current Windows source package to the bounded VM validation directory and verify hashes.
2. Re-run Wrangler types and strict dry-run against that synchronized package.
3. Re-run the Linux/amd64 container build and disposable `/ops/live` + `/ops/ready` checks.
4. Prove Worker-to-container HTTP forwarding and Socket.IO/Engine.IO upgrade behavior on the synchronized package.
5. Reconcile authenticated wallet/financial browser proof separately; do not treat it as complete from static wiring.
6. Only after those results are recorded, request explicit approval for Cloudflare staging deployment.

## Roadmap

### Completed / verified

#### 1. Frontend layout and financial-flow source reconstruction

- **Objective:** Preserve NEXI visual authority while correcting wallet and financial-flow geometry.
- **Evidence:** Current frontend source; `work/20260820-frontend-layout-reconstruction/NEXI_LAYOUT_CONTRACT.md`; current Codebase Memory entry points and clusters.
- **Affected components:** Dashboard shell, WalletDashboardLayout, wallet assets/activity, Deposit/Withdraw/Transfer/Activity presentation, shared NEXI primitives.
- **Dependencies:** Current repository source.
- **Verification:** Prior accepted typecheck, production build, product-state tests, and targeted wallet checks are handover evidence; the completeness audit artifact itself was not found.
- **Definition of done:** Source reconstruction is accepted for the completed slice; future changes require a demonstrated regression or owner correction.

#### 2. Backend/domain and persistence foundation

- **Objective:** Keep PostgreSQL/Prisma as durable authority with Redis as ephemeral coordination/realtime.
- **Evidence:** Current backend source, Prisma schema/migrations, Codebase Memory backend architecture, Phase C disposable migration receipt.
- **Affected components:** NestJS modules, Prisma migrations, ledger/wallet/market/Binary/Spot/Margin authorities.
- **Verification:** Phase C receipt records 18 migrations applied to disposable PostgreSQL and durable market/provider tables present.
- **Definition of done:** Durable schema and source authority exist; runtime/staging proof remains a separate gate.

#### 3. Cloudflare source/runtime preparation

- **Objective:** Make Worker/Container source compatible without deploying.
- **Evidence:** `CLOUDFLARE_RUNTIME_AUDIT.md`, Phase B receipt, Phase C VM receipt, current `wrangler.jsonc`, Worker entrypoint, backend Dockerfile.
- **Affected components:** Worker forwarding, Container class, Docker startup, R2 contract, environment contract.
- **Verification:** Phase C disposable VM checks passed; no deployment occurred.
- **Definition of done:** Source and disposable VM package pass; edge/staging acceptance still open.

### Remaining phases, in dependency order

#### Phase 1 — Synchronized VM edge preflight

- **Objective:** Prove that the exact current Windows source package, not a stale VM copy, passes the Cloudflare validation chain.
- **Evidence required:** Source hash manifest, Wrangler types, strict dry-run, Docker build, `/ops/live`, `/ops/ready`, Worker-to-container forwarding, Socket.IO/Engine.IO result.
- **Files/components:** `cloudflare-container-bootstrap/wrangler.jsonc`, `cloudflare-container-bootstrap/src/index.js`, `backend/Dockerfile`, backend `dist`, synchronized VM work directory.
- **Dependencies:** Current Windows source; bounded VM; Docker; Wrangler authentication.
- **Verification:** VM-only commands from the Phase C receipt; no deployment.
- **Definition of done:** Exact synchronized package passes all checks and receipt records exit codes plus unverified boundaries.

#### Phase 2 — Backend contract closure where source evidence requires it

- **Objective:** Resolve only direct contract gaps found during Phase 1 or current source inspection.
- **Evidence required:** Controller/module registration, frontend client route alignment, current API contracts, focused source checks.
- **Files/components:** SpotModule/MarginController/MarginService, frontend Spot/Margin clients, market/realtime clients, auth/session boundary.
- **Dependencies:** Phase 1 source/package evidence.
- **Verification:** Affected TypeScript/build or focused tests only; no broad campaign.
- **Definition of done:** Every current-scope operation is connected, explicitly unsupported, or deferred with an identified runtime gate. No duplicate authority is introduced.

#### Phase 3 — Cloudflare staging deployment (approval-gated)

- **Objective:** Deploy a non-production Worker/Container package using approved staging bindings and secrets.
- **Evidence required:** Explicit current-turn approval, validated Wrangler auth, container/image rollout result, staging environment contract, migration readiness.
- **Files/components:** Wrangler config, Container image, Worker, staging R2 binding, external PostgreSQL/Redis, secret mappings.
- **Dependencies:** Phases 1–2 pass; staging resources and secrets are explicitly approved.
- **Verification:** `/healthz`, `/ops/live`, `/ops/ready`, API smoke, Worker-to-container WebSocket, logs/metrics.
- **Definition of done:** Staging deployment and rollback evidence exist; no production claim.

#### Phase 4 — Authenticated browser and financial lifecycle acceptance

- **Objective:** Prove wallet authentication/session, wallet/account projection, ledger/activity linkage, Spot/Margin, Options/Binary, deposits/withdrawals, and realtime behavior against staging.
- **Evidence required:** Dedicated Brave test profile, wallet signature/session proof, truthful API responses, Socket.IO recovery evidence, screenshots/receipts.
- **Files/components:** Frontend auth/wallet clients, financial pages, market/realtime hooks, staging backend.
- **Dependencies:** Successful staging deployment and known-good test wallet.
- **Verification:** Browser and API/runtime evidence; no fabricated wallet or financial results.
- **Definition of done:** Each flow is browser/runtime verified or explicitly blocked with exact external cause.

#### Phase 5 — Security, recovery, and release adjudication

- **Objective:** Validate secrets, authorization, idempotency, failure recovery, observability, rollback, and independent release readiness.
- **Evidence required:** Focused security/recovery receipts, audit linkage, rollback procedure, independent adjudication.
- **Files/components:** Auth/RBAC, ledger/idempotency, Worker/Container env, Redis recovery, observability, runbooks.
- **Dependencies:** Staging acceptance.
- **Verification:** Focused security, failure-recovery, rollback, and release review gates.
- **Definition of done:** Release is independently reviewed and owner-approved; production deployment remains separate authorization.

## Cloudflare readiness assessment

### Ready or substantially ready

- Worker-to-Container topology is represented in source.
- `container.fetch(request)` forwarding exists.
- Container default port and Docker startup contract align at 3000.
- Backend health endpoints exist.
- R2 deposit-proof binding contract exists in Wrangler/Worker source.
- PostgreSQL/Redis remain external, injected authorities.
- VM tooling/auth and disposable Docker/Wrangler validation passed in the Phase C receipt.

### Blocked or not yet proven

- No Cloudflare staging deployment has been performed.
- Worker-to-container WebSocket behavior is not independently proven on the current synchronized package in this turn.
- Actual staging secrets/bindings and external PostgreSQL/Redis connectivity are not accepted as proven by disposable VM evidence.
- Container cold-start/restart, rollback, and production observability are unverified.
- `wrangler deploy` publishes/rolls out the Container image; it is a deployment mutation, not a dry validation step.
- The legacy `Dockerfile.unified` is not the canonical single-container backend contract and should not be selected without a separate architecture decision.

Cloudflare documentation confirms that Container Workers use a Wrangler container declaration plus Durable Object binding and route requests through `getContainer(...).fetch(request)`, while `wrangler deploy` builds/pushes the image and rolls out instances: https://developers.cloudflare.com/containers/get-started/ and https://developers.cloudflare.com/containers/deploy/.

## Frontend production-readiness assessment

- **Visual authority:** Office Agent tokens/system and DEXI geometry authority are preserved in current source/layout contract evidence.
- **Product scope:** Current owner authority is Spot/Margin plus separate Options; no excluded C2C/copy/futures surfaces are added by this roadmap.
- **Wallet/API boundary:** WalletAccessGate and wallet-auth client paths exist; authenticated runtime proof is not implied by static wiring.
- **Backend authority:** Frontend remains presentation/interaction only; prices, balances, PNL, settlement, ledger, and statuses remain backend-authoritative.
- **Conclusion:** Frontend source reconstruction is not the current broad blocker. Staging/runtime/authenticated acceptance remains open.

## Files created by this reconciliation

- `C:\trae_projects\Dexi_style_TraeWV\NEXI_CURRENT_PRODUCTION_ROADMAP.md`

No application source, backend/API contract, database, migration, Cloudflare resource, DNS, secret, or deployment was modified.
