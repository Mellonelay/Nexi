# NEXI — ACTIVE SOURCE-FIRST BOARD (2026-11-15)

Last recorded source checkpoint `5b3edd99383e` (2026-11-15; graph built at `0c2ce55f7f56`). Verify live Git HEAD for every new execution., Graphify 0.9.108 source SHA `d89d224547400ca9dccde3b46eef1c15249f8d663c61d238fb6ae85bc873f5ee`. Graph source snapshot predates the committed Communications replay change. Original documents are archived byte-for-byte at `tasks/evidence/archive/source-board-before-20261115/`.

## Next application source work
- [x] Learn create/update original-key replay audit receipt SOURCE_IMPLEMENTED (scoped): `backend/src/communications/communications.service.ts` returns its deterministic auditId on the first write and matching replay; ADMIN `nexi-api-provider.ts` consumes it. Existing outbox verifies aggregate/event/intentHash and rejects legacy or mismatched original intent without fabricating a receipt. Commit `5b3edd9`; application tests and historical-data runtime checks deferred.
- [ ] Close ONLY confirmed source gaps in Backend NestJS/SQLite Ledger/Outbox and source-to-consumer integrations for Public Next.js and Admin TanStack. Prioritize real contradiction in financial status, auth, idempotency, reconnect/error recovery and truthful audit readback.
- [ ] Check mandatory Public mobile-first source per `frontend/DESIGN.md` and Nov8 research, preserving previously accepted source fixes.
- [ ] Reconcile current source evidence per domain; `INSUFFICIENT_EVIDENCE` is not a defect and Graphify missing calls do not imply broken features. No invented 301-operation / 113-feature reimplementation queue.
- [ ] Make final source-only disposition, then request separately authorized application verification/release phase.

**Current count:** 4 unchecked source-closure workstreams after the scoped Learn audit-replay source item was checked. These are broad tasks, not four proven application defects. The November 13 113-row evidence file has 5 SOURCE_IMPLEMENTED and 108 INSUFFICIENT_EVIDENCE criteria; these denote proof coverage, not missing implementations. Backend withdrawal provider explicitly remains DETERMINISTIC_TEST_NON_LIVE; enabling external transfers is a separate owner decision.

## Completed — reuse
- 2026-11-15 scoped audit-identity source correction: Backend currency, wallet-network, and deposit-address-state mutations now project the actual persisted Admin audit receipt on first write/replay; shared Admin provider no longer treats resource IDs as audit IDs. Source receipt in the matrix; application verification deferred.
- Prior Oct–Nov source corrections across Binary, Margin, Spot, Wallet, Convert, Transfer, Mining, Loans, SIWE/auth, communications, Admin audit and Public mobile. Consult `tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md` only for relevant prior receipts.
- Nov13 recorded NestJS Doctor 0 architecture errors, backend TypeScript exit 0, and scoped financial regression PASS at that revision, not current HEAD.
- Nov13 original 113 owner source paths indexed; previous 5 source-implemented / 108 insufficient-evidence was DOCUMENTATION coverage, not 108 missing features.
- Graphify engine and Kernel work closed. Knowledge v4 and current Graphify CLI/MCPC are read-only source navigation tools.

## Execution contract
- Preserve the current four `AGENTS.md`, source graph, Knowledge v4, owner policy and existing changes.
- Up to three ACTUAL independent read lanes; up to two source-write worktrees only with verified separate owners and >=2 GiB free. VM has 1.7 GiB free as of Nov15, so default to ONE writer.
- `SOURCE_IMPLEMENTED` = scoped current source and affected consumers inspected; `PROVEN_SOURCE_GAP` = demonstrated violation; `INSUFFICIENT_EVIDENCE` = no verdict.
- All app tests, lint/types, builds, browser, services, deployment and economic changes `DEFERRED_BY_OWNER_SOURCE_FIRST_RULE`.
- Keep evidence in the existing matrix; never append historical handovers to this active board.
