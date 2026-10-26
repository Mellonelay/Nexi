# NEXI design-to-source assurance — 2026-10-25

Status: CURRENT OPERATING CONTRACT; tool availability is a separately verified fact, not proof of activation. Governing authority: owner decisions, current live source and installed framework semantics, then scoped proof reuse. No isolated worktree, duplicated dependency installation, development production build or broad test campaign.

## The real objective

For each changed Wallet, Trading, Messages, Admin, or other product slice: (1) inspect existing end-to-end owners across Public Next.js/React, Admin TanStack/React and Backend NestJS/Prisma/SQLite/Valkey; (2) establish correct current framework behavior from local installed docs and official references; (3) express expected route/DTO, auth, state transitions, ledger/outbox atomicity, retry and UI refresh; (4) compare expected design with current source; (5) fix only confirmed mismatch; (6) reuse unchanged proof and run only affected focused checks. Compilation and tests cannot substitute for correct intended logic.

## Screenshot-derived mechanism mapping and actual verified status

| Mechanism | NEXI role | Status at latest inspection |
| --- | --- | --- |
| Existing Graphify map | source call graph / cross-surface impact, not semantics | previously executed in NEXI; verify current index freshness |
| NestJS OpenAPI + consumer typed APIs | compare real controllers, guards and DTOs to Public/Admin API calls | `docs/contracts/openapi.json` and `backend/scripts/generate-openapi.js` exist; generation freshness unverified |
| tieline | detect Axios/fetch to missing server route or HTTP method | suggested by old screenshot; not established installed |
| OpenAPI TypeScript / Orval | generated typed client/interface drift | screenshot candidate; not found as configured package |
| Pact | cross-surface consumer/provider executable contract | screenshot candidate; not configured |
| Schemathesis | OpenAPI-guided schema violations and 500s | screenshot candidate; not configured |
| Semgrep | source pattern / explicit architectural invariants | CLI installed, version 1.176.1; no NEXI custom policy yet verified |
| GitHub CodeQL | security and selected static correctness | `Mellonelay/Nexi` is private and user-owned; GitHub documents hosted private code scanning for eligible Team/Enterprise organizations with Code Security enabled. This repo is not organization-owned, and no CodeQL CLI/workflow is configured here. |
| dependency-cruiser | dependency boundaries and cyclic modules | screenshot candidate; not configured |
| Knip | unused files/exports/dependencies | screenshot candidate; not configured |
| Playwright | browser exchange/reconnect after source correctness | `@playwright/test` declared in Public; existing accepted browser receipts reused |

## Historical defect → required detection, no false claims

- Reversed Admin Learn current/target status: expected state-transition table + contract assertion; static scanning alone insufficient.
- SQLite numeric `1` rendered as Draft: normalized provider/schema contract and UI mapping assertion.
- Empty Public Messages shown unavailable: explicit empty-thread UI invariant.
- Missing React prop: TypeScript check can detect.
- NestJS Socket.IO close behavior: verified framework adapter/override contracts and targeted lifecycle proof.
- Public calling nonexistent API route: compare current OpenAPI operations with observed client consumers; tieline is a candidate, not yet a production gate.
- Missing authorization: guard/role permission specification, source review, Semgrep/CodeQL scoped enforcement.
- Message/outbox non-atomic write: transaction ownership in SQLite bridge plus focused persistence proof.
- Incorrect reconnect: fresh durable API resnapshot and Socket.IO event acceptance (not static graph alone).
- Startup 502: service readiness and startup profile, distinct from source-only verification.

## Activation and non-goals

Do not automatically install every screenshot candidate or convert every candidate into a mandatory CI gate. Select one mechanism per distinct observed failure class after confirming the exact source contract and installed framework. Preserve three dedicated dependency stores. The existing `frontend/tests/communications-contract.test.mjs` compares Public messages API calls with required OpenAPI operations and response/security schemas; its recorded 2026-10-25 focused pass is reused because those source files are unchanged. A small Semgrep rule at `semgrep/nexi-architecture.yml` enforces the explicit boundary that browser surfaces must not import direct Prisma/SQLite clients. It does not prove route correctness, authorization, transaction atomicity, or runtime behavior. VibeDoctor's current account scan is dated 2026-10-25 14:47 UTC and has no captured source commit; its dependency findings are triage leads, not current confirmed vulnerabilities. Never claim unavailable MCP/CLI invoked. Store only findings with path, source SHA, contract, severity and reproduction/proof; deduplicate against `NEXI_PROOF_REUSE_REGISTER.md`. No new migrations or financial actions are authorized merely by this document.
