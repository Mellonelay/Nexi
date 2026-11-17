# NEXI — ACTIVE SOURCE-FIRST BOARD (2026-11-15)

Last recorded source checkpoint `5b3edd99383e` (2026-11-15; graph built at `0c2ce55f7f56`). Verify live Git HEAD for every new execution., Graphify 0.9.108 source SHA `d89d224547400ca9dccde3b46eef1c15249f8d663c61d238fb6ae85bc873f5ee`. Graph source snapshot predates the committed Communications replay change. Original documents are archived byte-for-byte at `tasks/evidence/archive/source-board-before-20261115/`.

## Next application source work
- [x] Learn create/update original-key replay audit receipt SOURCE_IMPLEMENTED (scoped): `backend/src/communications/communications.service.ts` returns its deterministic auditId on the first write and matching replay; ADMIN `nexi-api-provider.ts` consumes it. Existing outbox verifies aggregate/event/intentHash and rejects legacy or mismatched original intent without fabricating a receipt. Commit `5b3edd9`; application tests and historical-data runtime checks deferred.
- [ ] Close ONLY confirmed source gaps in Backend NestJS/SQLite Ledger/Outbox and source-to-consumer integrations for Public Next.js and Admin TanStack. Prioritize real contradiction in financial status, auth, idempotency, reconnect/error recovery and truthful audit readback.
- [ ] Check mandatory Public mobile-first source per `frontend/DESIGN.md` and Nov8 research, preserving previously accepted source fixes.
- [ ] Reconcile current source evidence per domain; `INSUFFICIENT_EVIDENCE` is not a defect and Graphify missing calls do not imply broken features. No invented 301-operation / 113-feature reimplementation queue.
- [ ] Make final source-only disposition, then request separately authorized application verification/release phase.

**Current count:** 4 unchecked source-closure workstreams after the scoped Learn audit-replay source item was checked. These are broad tasks, not four proven application defects. The original 113 browser-acceptance criteria and historical 5/108 mapping were transferred to the deferred browser-acceptance evidence lane and are not source closure gates. Backend withdrawal provider explicitly remains DETERMINISTIC_TEST_NON_LIVE; enabling external transfers is a separate owner decision.

## Completed — reuse
- 2026-11-15 scoped audit-identity source correction: Backend currency, wallet-network, and deposit-address-state mutations now project the actual persisted Admin audit receipt on first write/replay; shared Admin provider no longer treats resource IDs as audit IDs. Source receipt in the matrix; application verification deferred.
- Prior Oct–Nov source corrections across Binary, Margin, Spot, Wallet, Convert, Transfer, Mining, Loans, SIWE/auth, communications, Admin audit and Public mobile. Consult `tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md` only for relevant prior receipts.
- Nov13 recorded NestJS Doctor 0 architecture errors, backend TypeScript exit 0, and scoped financial regression PASS at that revision, not current HEAD.
- Nov13 historical owner-path index was transferred unchanged to the browser-acceptance evidence directory. It does not define active source tasks.
- Graphify engine and Kernel work closed. Knowledge v4 and current Graphify CLI/MCPC are read-only source navigation tools.

## Execution contract
- Preserve the current four `AGENTS.md`, source graph, Knowledge v4, owner policy and existing changes.
- Up to three ACTUAL independent read lanes; up to two source-write worktrees only with verified separate owners and >=2 GiB free. VM has 1.7 GiB free as of Nov15, so default to ONE writer.
- `SOURCE_IMPLEMENTED` = scoped current source and affected consumers inspected; `PROVEN_SOURCE_GAP` = demonstrated violation; `INSUFFICIENT_EVIDENCE` = no verdict.
- All app tests, lint/types, builds, browser, services, deployment and economic changes `DEFERRED_BY_OWNER_SOURCE_FIRST_RULE`.
- Keep evidence in the existing matrix; never append historical handovers to this active board.

## 2026-11-16 — Deduplicated active frontier
Live HEAD: `7a5aa7f2c3a3c46768b3b56bc53b1cc50e02ad76`. The prior “4 unchecked workstreams” count is retired as a defect count; the 113 browser criteria and 5/108 evidence association are not source backlog counts.

- Proven completed contracts are reused per the Nov 1 five-batch receipt, Nov 12 Admin Spot atomic audit fix, Nov 14 Binary receipt identity, and the scoped Nov 16 matrix entries; no duplicate implementation is opened.
- Proven remaining source gaps: none established by the current reconciliation.
- `INSUFFICIENT_EVIDENCE` candidates, not defects: Admin mutation fallback idempotency-key collision/legacy compatibility; correction-audit missing-row replay; Binary connected-session revocation and Public/Admin terminal readbacks.
- Next exact bounded operation: reconcile Admin mutation key derivation with explicit-key semantics and the immediate backend/consumer contract. Continue only if a violated invariant is evidenced.
- Repository closure remains `SOURCE_OPEN` / exact remaining count undetermined; app verification remains deferred by owner SOURCE-FIRST rule. See matrix addendum and recursive receipt index for provenance.


## 2026-11-16 — Latest exact source frontier (supersedes broad workstream count)
See the latest three-contract disposition in `tasks/evidence/NEXI_SOURCE_CLOSURE_MATRIX_20261109.md`. The 113 browser criteria and four broad board items remain non-defect counts.

- [x] Reuse correction-audit original receipt, atomic write batch and fail-closed missing-row replay source.
- [x] Repair Admin SystemConfig legacy fallback identity for its provider caller.
- [x] Repair Admin user-level session revocation across PUBLIC/ADMIN plus connected Binary socket disconnect routing.
- [ ] Resolve legacy fallback identity compatibility for the remaining non-explicit `requestMutation` callers by matching each affected caller to the backend replay identity and payload guard.
- Source status remains `SOURCE_OPEN`; no application verification until the final item is closed.


## 2026-11-16 — latest bounded Admin idempotency disposition
- [x] Confirmed historical/current fallback formulas and inventoried current provider call sites in tasks/evidence/ADMIN_MUTATION_IDEMPOTENCY_CROSSWALK_20261116.json.
- [x] Reused the scoped SystemConfig legacy-key repair; explicit-key callers remain pass-through.
- [ ] Match remaining fallback callers to backend persisted replay identity and payload-mismatch guard. The broad shared-fallback question is INSUFFICIENT_EVIDENCE, not a proven defect; no global key change is supported.
- Source stays SOURCE_OPEN; no application verification until this bounded crosswalk is complete.


## 2026-11-16 — Fast bounded source-closure checkpoint

See `tasks/evidence/NEXI_FINAL_SOURCE_CLOSURE_20261116.md`. Two of the three exact contract questions are source-implemented/reused: correction-audit replay now verifies the stored audit actor and full correction receipt; Communications socket revocation is wired for session and surface-scoped user events, while Binary settlement/readback proof is reused. The shared Admin mutation helper adds strict full-payload replay for the five Prisma fallback mutations and fails closed on payloadless/duplicate legacy receipts.

- [x] Correction-audit persisted receipt identity and fail-closed replay source boundary.
- [x] Communications session/user revocation socket wiring; reuse terminal settlement/readback source proof.
- [ ] Complete legacy key → Backend persisted intent/mismatch mapping for remaining shared fallback callers in `ADMIN_MUTATION_IDEMPOTENCY_CROSSWALK_20261116.json`.
- Current repo source status remains `SOURCE_OPEN`; application verification and release remain deferred until the remaining route mapping is resolved.


## 2026-11-17 — Source-closure checkpoint
Spot/Binary pair maintenance key collisions are corrected at the Backend writer; see the dated matrix addendum and updated Admin crosswalk. The remaining shared fallback caller contracts are still being reconciled against their Backend persisted identities. Keep app verification and release deferred while source status is SOURCE_OPEN.

## 2026-11-17 — Source-only Admin replay continuation
- [x] AST inventory 49 Admin requestMutation callers (46 fallback, 3 explicit), with 49 current Backend owner/source locations in the existing crosswalk JSON. Source owner mapping is not a complete replay-proof classification.
- [x] Repair proven source contradictions: moderation audit/outbox atomicity and readback, notification/message replay realtime deduplication, Learn original audit checks, Binary pair/global original audit readback, Mining Prisma fallback replay, Loan-plan original receipt readback, and Admin message atomic audit.
- [ ] Reconcile remaining evidence-proven Backend/Public/Admin source integration gaps and historical-key/guard contradictions; do not classify the 113 browser acceptance criteria as a source-closure prerequisite.
- Source status: SOURCE_OPEN. Application tests, lint/typechecks, builds, browser acceptance, service operations and deployment: DEFERRED_BY_OWNER_SOURCE_FIRST_RULE.


## 2026-11-17 — documentation reconciliation checkpoint
- [x] Reconcile seven architecture Markdown owners, source package/runtime boundaries, and historical Graphify/Admin/acceptance routes; document controlling references in docs/architecture/NEXI_SYSTEM_ARCHITECTURE.md.
- [x] Locate tracked documentation and reconcile the immutable 225-receipt index; three acceptance receipts relocated byte-identically, two source receipts changed after prior index, no missing evidence inferred. See docs/DOCUMENTATION_AND_RECEIPT_INDEX_20261117.md.
- [x] Apply the outcome-based source disposition: the scoped Admin replay crosswalk has no evidence-proven remaining defect; its unresolved route mapping remains INSUFFICIENT_EVIDENCE and is not a defect backlog.


## 2026-11-17 — Final source-phase disposition

- [x] Make the outcome-based source-closure decision at `a71270f77c842db3c96e47f985836b4686e718c7`; reuse existing source-only receipts and repairs.
- Admin fallback mappings not dispositioned by the scoped crosswalk remain INSUFFICIENT_EVIDENCE. This is not a proven source defect or an instruction to audit all 49 callers. Reopen a specific route only if contradictory source evidence appears.
- SOURCE_CLOSED applies only to source work. Application verification, authenticated browser acceptance, and release remain deferred pending explicit authorization.
