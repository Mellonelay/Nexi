# NEXI Interactive Acceptance — Successor Handover

**Prepared:** 2026-11-08 UTC\
**Scope:** close and transfer the current test-first acceptance slice. No repairs, browser interactions, builds, deployments, or financial writes were performed for this handover.\
**Acceptance status:** partial; the acceptance campaign is not complete.

## Start here

1. Read this handover, then the authoritative receipt `tasks/evidence/nexi-interactive-cloud-browser-acceptance-20261108.md` and tracker `tasks/evidence/nexi-browser-acceptance-113-continuation-20261105.csv`. These preserve historical evidence, criterion IDs, timestamps, screenshot references, and profile distinctions. Do not rerun criteria marked PASS unless new contradictory evidence appears.
2. Latest reconciliation is 113 unique criteria: **16 PASS / 24 FAIL / 8 BLOCKED / 65 NOT_TESTED**. The receipt’s 2026-11-08 classification correction supersedes its earlier 12 BLOCKED / 61 NOT_TESTED snapshot; four criteria (`NEXI-04-03`, `04-05`, `04-06`, `15-01`) are now NOT_TESTED because they were not performed, not because a tool refused.
3. The next work phase is consolidated source repair and Public mobile-first UI hardening after the owner supplies the separately researched professional exchange-component standards. Do not start that implementation from this handover alone. Admin is desktop-first; Public is mobile-first.
4. Keep the existing VM Chrome sessions open. At the last browser inventory they were Admin page 6 at `https://admin.nexitrading.app/messages`, Public page 7 in 390×844 mobile emulation at `https://www.nexitrading.app/dashboard/settings` (Security tab), and MetaMask page 8. No browser state was changed in this closeout. Recheck only if the successor needs to act; never create/close tabs as a setup reflex.

## Authority and proof boundary

- VM source checkout is `/home/mellonelay1999/workspaces/Nexi`; current Git branch `main`, full HEAD `2fbc1538ea456d13d7c05b7efd38d2f0050a83ba` (short `2fbc1538ea45`). This is source identity only, not deployed identity.
- The current project architecture authority is `AGENTS.md`, `NEXI_CURRENT_STATE.md`, `NEXI_PROOF_REUSE_REGISTER.md`, and relevant `docs/architecture/` and `docs/operations/` documents. Current project instructions place the runtime on VPS Nginx → Public Next.js / Admin TanStack → NestJS API; SQLite/Prisma is durable application and Ledger truth; BullMQ/Valkey transports jobs and Socket.IO/Valkey serves realtime/cache. Cloudflare Worker/Container/D1/Queues/Workflows are retired for NEXI runtime. Read the relevant current docs before source changes; do not revive retired services or create a second financial writer.
- Graphify is topology/impact evidence, not runtime or browser proof. The known unified graph is `/srv/nexi/graphify-live/20261106/merged-graph.json`; it was not rebuilt or queried for this acceptance closeout.
- No deployment SHA/release identity was freshly established here. Treat deployed identity as **UNKNOWN / UNVERIFIED**; do not infer it from Git HEAD or stale historical release notes.
- SentinelX host used: `host_0fe8118651e962b9`; repo path above. Active continuity checkpoint before this final write: `sentinelx_context_sxc_7BTSSAAZ`, revision 26. `/var/lib/sentinelx/audit.jsonl` was read. Relevant tail: `2026-11-08T04:38:22Z` browser page inventory; `04:38:27Z` project snapshot; `04:38:33Z` tracker/receipt validation; `04:39:57Z` four-row status correction; `04:40:11Z` `git diff --check`; `04:40:16Z` final counts/stale-count check; `05:11:36Z` artifact/Git inspection; `05:11:48Z` exact status ID totals and audit-tail read. These are audit timestamps, not application transaction IDs.

## Tracker reconciliation

The CSV is the row-level authority; all 113 IDs remain present and unique. Status ID sets at close:

- **PASS (16):** `NEXI-02-01`, `02-03`, `02-04`, `02-06`, `04-01`, `04-04`, `05-01`, `05-02`, `06-02`, `07-06`, `10-01`, `10-04`, `10-06`, `11-01`, `11-06`, `15-04`.
- **FAIL (24):** `NEXI-01-06`, `02-02`, `02-05`, `02-07`, `03-05`, `04-08`, `05-03`, `05-04`, `05-05`, `05-06`, `05-07`, `05-08`, `06-04`, `06-07`, `07-04`, `07-07`, `08-03`, `08-07`, `09-01`, `11-03`, `11-07`, `13-05`, `14-04`, `14-06`.
- **BLOCKED (8):** `NEXI-03-02`, `03-04`, `03-06`, `03-08`, `04-07`, `08-04`, `08-06`, `13-04`.
- **NOT_TESTED (65):** `NEXI-01-01`, `01-02`, `01-03`, `01-04`, `01-05`, `01-07`, `01-08`, `02-08`, `03-01`, `03-03`, `03-07`, `04-02`, `04-03`, `04-05`, `04-06`, `05-09`, `05-10`, `06-01`, `06-03`, `06-05`, `06-06`, `06-08`, `07-01`, `07-02`, `07-03`, `07-05`, `08-01`, `08-02`, `08-05`, `09-02`, `09-03`, `09-04`, `09-05`, `09-06`, `09-07`, `09-08`, `10-02`, `10-03`, `10-05`, `10-07`, `11-02`, `11-04`, `11-05`, `12-01`, `12-02`, `12-03`, `12-04`, `12-05`, `12-06`, `13-01`, `13-02`, `13-03`, `13-06`, `13-07`, `14-01`, `14-02`, `14-03`, `14-05`, `14-07`, `15-01`, `15-02`, `15-03`, `15-05`, `15-06`, `15-07`.

The receipt and CSV retain each criterion’s full wording, historical status, current status, evidence, and dependency. The 8 blockers mean prerequisites/evidence are absent, not that the browser tool enforced a handoff: no real deposit rail/pending record (`03-02/04/06/08`); no specifically authorized second customer (`04-07`); loan eligibility/approved collateral prerequisite absent (`08-04`); no qualifying loan lifecycle event (`08-06`); no profile-linked Admin case for approval/RBAC (`13-04`).

## Consolidated findings

All details, timestamps, screenshots and earlier-profile distinctions remain in the receipt. The current profile for the latest slice is **profile ID 757621**, UUID `3ecc85a9-c243-4da3-bde0-a24bdf532e8f`, wallet `0x339a73c5fb21a2ecf2377826dfa120f128d38b33`, chain 1. Historical evidence from other profile IDs/wallets is separate and must not be attributed to this profile.

### Confirmed defects (observed; causal root may remain unknown)

- **Options / binary:** current profile’s existing 1 USDT LONG has Public `Settlement failure`, although Public Activity and Admin Ledger show reserve and settlement `POSTED`. Settlement row `8ce02bcc-bddc-4058-825f-675740007e89`, ref `82974a0a-0588-4848-9c31-7513564fa8b1`, is POSTED LOSS; details omit debit/credit/resulting balance. Reserve row `3790e669-bd93-45b5-87c7-5597a17b0d7a`, ref `binary:34f87b62-a324-4e56-95c7-5597a17b0d7a`. The UI’s 1,000 USDT stake vs 999 available shows insufficient balance but leaves Long/Short enabled; no direction was clicked. A separate historical ticket mismatch records Public SHORT vs Admin LONG/internal UP, ref `f7c1471d-fb05-4a3f-a6d2-b731023b45c0`; keep distinct. No repeat trade.
- **Admin credit reconciliation:** Public Activity says 5,000 USDT Admin Balance Adjustment Completed and Admin Ledger has posted funds, while the Admin client audit reports FAILED. Do not repeat funding. This is a confirmed cross-surface status mismatch; root cause is unverified.
- **Spot:** open limit order `1a95a4af-f902-46aa-8da7-6defa9cf8634`, BTCUSDT BUY, limit 75738.84, quantity 0.000264065306519085, fill 0; preserve it. A separate market buy credited 0.00014 BTC, but Public order value 10.825628585772 USDT differs from Admin posted fill 10.6189445362 USDT. Another earlier order showed accepted vs CANCELED and duplicate Completed activity vs POSTED reserve/release. Do not cancel or replay; causes unresolved.
- **Margin accounting/details:** profile 757621 has one LONG 2x PENDING position with 10 USDT collateral, entry/mark 75738.84. Available 989.9800000000000643, locked 20.019999999999935697. Borrow credit `0cfb959f-11d0-4f12-8513-796e24ab5a11`, ref `margin:62a3b9a7-66eb-4cd9-a795-d965936f89cb`, 10 USDT. Reserve `5c0b5543-edee-4987-9669-7d4d1f345ada`, ref `margin:entry:margin:62a3b9a7-66eb-4cd9-a795-d965936f89cb`, about 20.02 USDT, incorrectly labeled `GATE2_SPOT_ORDER_RESERVE`; debit/credit/resulting balance appear as dashes. Public/Admin risk values 2,3,5 leverage and maintenance 0.5 match (`07-06 PASS`). Admin Spot/Margin Audit panel has zero events; that empty panel does not negate the Ledger. No close/repay.
- **Wallet / Public mobile UI:** Overview renders BTC/ETH/SOL/TRX as `Account not opened`; market instruments/custody/deposit-support catalogs are conflated or incomplete. The owner-required supported-assets/category behavior is a product requirement for repair, not proof that every asset is currently custody-enabled. Public wallet total is an estimated USDT portfolio value and includes BTC; observed summary 4978.99 available, 30.02 locked, 5009.01 estimated total. USDT row: 4968.3610554638000643 available, 30.019999999999935697 locked, 4998.381055463799999997 total; BTC holding 0.00014. UI truncates 5,000 values, has inconsistent card sizing, narrow numeric columns and horizontal tab/category overflow. Prior mobile measurements at 390px: wallet content right edge 420px (30px overflow); search right edge 420px; notification control right edge 428px; category strip width 406px. These are Public observations; Admin is desktop-first and was not mobile-emulated.
- **Mining:** Public shows one active 10 USDT subscription, 10 principal locked, 0 rewards and three plans. Plan rates display bare values (0.005/0.010/0.015) without unit/percent; UI says no rewards/try again. Admin Client detail says MINING entitlement NO while subscription exists. This is a confirmed cross-surface mismatch; expected lifecycle/reward/settlement behavior remains untested.
- **Loans:** Public shows eligibility Unavailable but an Available Standard 30D product, USDT rate as bare `0.1`, limits 100–100000; 100/30d draft estimates 10 interest / 110 total. Blank approved collateral reference yet Submit is enabled and native validity true. No application submitted. This mismatch is observed; backend policy cause unknown. No active loans/repayment evidence.
- **Convert:** current profile quote for 0.00001 BTC→USDT returned “The conversion could not be confirmed”; no matching Activity/exact-user Admin Ledger row and holdings unchanged. No retry; persistence/root cause unknown.
- **Support/notifications/recovery:** Help page says no support contact methods configured, while Public Messages says connected as Nexi Customer Service; Admin Messages showed same current UUID, same acceptance message, prior reply and attachment. Notification unread count 11; clicking bell timed out at DevTools control layer and panel remained unopened. Earlier mobile evidence showed notification panel `display:none` (`09-01 FAIL`). Offline/reload simulation restored wallet/chart, but before reload UI showed Verify wallet and Market error; recovery criteria `11-07`/`14-06` are FAIL. Preserve distinction between application UI evidence and DevTools click timeout.
- **Other registered failures:** `01-06,02-02,02-05,02-07,03-05,04-08,05-04,05-05,05-06,05-07,05-08,06-04,06-07,07-04,07-07,08-03,08-07,11-03,13-05,14-04` have per-criterion descriptions/evidence in the CSV and receipt; keep them in the consolidated repair/test backlog. Do not infer their root cause from the status alone.

### Confirmed passes and bounded readbacks

The 16 PASS IDs listed above remain accepted as the documented scope only. Important recent passes include Public spot initial/read-only state (`02-01/03/04/06` per row evidence), wallet/profile readbacks (`04-01/04-04`), current profile basic Options readback (`05-01/02`), one margin contract/risk-config match (`07-06`), Messages cross-surface readback (`10-01/04/06`), and selected network/reconnect/coverage criteria (`11-01/06`, `15-04`). A PASS for one narrow criterion does not imply the whole feature is accepted.

### Untested scope and operational boundaries

The 65 NOT_TESTED criteria are enumerated exactly above and in the CSV; they are not passes. Notable remaining workflows: full Spot fill lifecycle and order cancellation, Margin close/repay/liquidation, Options countdown plus complete settlement and exact accounting, Convert successful persistence, Mining subscribe/reward/redeem/settle, Loan submit/approve/disburse/repay, withdrawal review/approval/rejection, notification preference persistence and panel/reconnect behavior, support contact flows, Admin approval/RBAC, and full Public route/layout coverage. Deposit UI explicitly identifies `TEST_ONLY_3_ERC20_NO_BLOCKCHAIN_FUNDS` / `TEST_ONLY_PRELIVE_20261008`, minimum 1 USDT / 2 confirmations; no real blockchain funds were submitted. Withdrawal form had network/address/amount/security-password fields and disabled Confirm; it was not submitted. Avoid fabricating external transfer proof.

No browser/tool refusal occurred for the four reclassified criteria. The 8 remaining BLOCKED records are unmet prerequisites as listed above. Never repeat uncertain economic operations until exact-user Ledger and Activity outcomes are reconciled.

## Files and Git closeout

Authoritative artifacts:

- `tasks/todo.md` — active task checkpoint and status counts.
- `tasks/plan.md` — active plan/checkpoint and status counts.
- `tasks/evidence/nexi-browser-acceptance-113-continuation-20261105.csv` — 113 criterion rows and detailed per-row evidence.
- `tasks/evidence/nexi-interactive-cloud-browser-acceptance-20261108.md` — chronological acceptance receipt, screenshot references, profile distinctions and full observations.
- This document — successor handover and dependency-ready frontier.

At inspection before this handover: branch `main`, HEAD `2fbc1538ea456d13d7c05b7efd38d2f0050a83ba`; no staged changes. Existing tracked modifications: tracker CSV, `tasks/plan.md`, `tasks/todo.md`. There are many unrelated pre-existing untracked backup files plus `.graphifyrc`; preserve them. The acceptance receipt and its dated backup files are untracked. No commit or push was performed. `git diff --check` passed on the task artifacts before writing this handover; rerun after final write. The file inventory is volatile and must be rechecked before any Git operation.

## Successor’s next dependency-ready action

Start Phase B only after the owner supplies the professional exchange UI component research. Read the relevant current root/frontend/admin `AGENTS.md`, current architecture/design standards, the acceptance receipt, and the 113 CSV. Map confirmed defects to source owners across Public, Admin and backend; separate UX-only requirements from Ledger/accounting correctness. Prepare one deduplicated repair batch and targeted proofs. Preserve unrelated dirty/untracked work. Do not rerun passed acceptance criteria, change Admin to mobile-first, treat Graphify as runtime proof, repeat funding/transfers/orders, or deploy before repair and focused validation are closed.
