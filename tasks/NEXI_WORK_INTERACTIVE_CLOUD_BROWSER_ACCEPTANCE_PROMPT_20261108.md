# NEXI WORK — INTERACTIVE PRODUCT ACCEPTANCE, TEST FIRST, FIX ONCE

**Recipient:** A fresh ChatGPT Work session inside the NEXI Project. **Mode:** Execute, not plan/prompt-generation. **Primary artifact:** `NEXI_INTERACTIVE_CLOUD_BROWSER_ACCEPTANCE_20261108.md` attached to this message. It supersedes the Nov 4 browser-execution order, **not** the 113 owner requirements or historical receipts.

## Mission

Use the **two existing authenticated Work Cloud Browser tabs** for Public and Admin to *operate the deployed product from the UI*: navigate, click, type, select, submit/confirm where authorized, wait, inspect the result, reload and cross-check the corresponding Admin/Public state. **Do not call screenshots, routes, HTTP 200, static graph or CSS/network inspection “functional acceptance” unless the actual workflow was exercised.** Your objective in this phase is to find and record *every feasible real behavioral/visual mismatch*, not to fix the first one.

**Do not change application code, build, deploy, restart services, modify production SQLite, or switch browser profiles during Phase A.** When a scenario fails, record and continue independent cases. After the entire feasible sweep, group all defects for one later coordinated source-fix batch, not repeated fixes and deployments.

## Read once, in dependency order

1. The attached **new interactive acceptance specification fully**, including all seven sections and Phase A stop condition. Treat this as the governing test procedure.
2. Current root/Frontend/Backend/Admin `AGENTS.md`, `NEXI_CURRENT_STATE.md`, `NEXI_PROOF_REUSE_REGISTER.md`, `docs/architecture/NEXI_SYSTEM_ARCHITECTURE.md`, `docs/architecture/CROSS_SURFACE_FEATURE_MAP.md`, `docs/security/NEXI_FINANCIAL_INTEGRITY_REQUIREMENTS.md`, `Admin/docs/TANSTACK_ARCHITECTURE_AND_ROUTE_MAP.md`, `Admin/docs/NEXI_ADMIN_OPERATOR_USAGE_GUIDE.md`—only relevant current ranges and route contracts, reuse proven unchanged information.
3. The authoritative **113 criteria and CSV** in `docs/quality/NEXI_113_PUBLIC_ADMIN_ACCEPTANCE_20261101.md` and `docs/quality/NEXI_113_ACCEPTANCE_TRACKER_20261101.csv`; `docs/quality/NEXI_BROWSER_ACCEPTANCE_MATRIX.md`; Nov 4 evidence as **historical release-specific proof**, not live passes.
4. Existing task-specific NEXI Engineering Knowledge Index chapters, `using-agent-skills`, and relevant SentinelX Work Controller/Work Fast Kernel/Capability Router contracts. Use Context Engineering, Caveman and Ponytail to minimize wasted context, repeated skill/tool searches and stale documentation. Load **only** specialist methods for the actual current domain. No Graphify rebuild.

**Prior source locator** (verify live): GitHub/VM documentation HEAD `69bef6022374`; Public deploy `27b78bb6f74a`; Admin/API deploy `45a857de6a4d`. The owner has already authenticated both Public and Admin in Work Cloud Browser. Preserve them. Current source inventory: **21 direct Admin navigation routes and 13 route-only files**, across eight workspaces, not historical 31+1.

## Tool routing

- **Browser owner:** Work Cloud Browser's actually exposed click, keyboard/type, select, scroll, file upload, wait, screenshot and tab-navigation interactions. Use direct real UI actions, not only page reading.
- **Limit:** Cloud Browser **has no Chrome DevTools MCP/CDP or mobile device emulation**. Do not pretend to collect Chrome network/console/DOM/viewport traces or emulate 360px there. Use existing real Android screenshots/recording as evidence candidates. For responsive widths, queue a **distinct later** owner-authorized actual-device/VM DevTools lane; this does not block functional browser testing.
- **Source/VM:** Only when a concrete result needs confirmation, use bounded SentinelX `sentinel_capabilities`, `sentinel_project_snapshot`, `sentinel_read`, `sentinel_search`, `sentinel_exec`, `sentinel_script_run` and `/usr/local/bin/nexi-mcpc`; local `@nexi-graphify-live` for uncertain dependency ownership. Reuse current mapped source and existing proof. Sentry/journald/SQLite reads are corroboration, not substituted browser action.
- **Framework skills:** Public Next.js 16/React 19 **mobile-first**, Admin TanStack Start/Router/Query/Vite/Nitro **desktop-first**; NestJS/Prisma/SQLite Ledger/Outbox for financial claims; Context7 only for genuine version-specific questions. In this **Phase A** there is no implementation or test-runner campaign.

## Complete interactive workflow order

1. **Session/identity:** reuse both tabs, verify masked wallet/Admin role, navigate menus and deep links using clicks, typing, search, back/forward, reload.
2. **Admin ↔ Public funding:** authorized Clients Adjust Balance credit/debit and account-scope selection; correlate Admin UI/audit, actual Ledger and Public balance/Activity. **Known reported issue:** funds credited but Admin says FAILED. Do **not** resubmit uncertain corrections.
3. **Deposit/withdrawal:** Public actual form, selectors, file upload, validation and submit; Admin queue/review; Public status. A clearly labeled **sample image may validate the upload/review workflow only**, never certify an actual blockchain transfer or authorize production credit. Distinguish approval from real settlement/broadcast. For external writes without a controlled test destination, record precise BLOCKED and continue other cases.
4. **Transfers/Convert:** Funding → Spot/Options and other eligible scopes, select and enter, confirm permitted minimum test movements and inspect paired postings; quote/expiry/acceptance where permitted.
5. **Binary/Options:** pair/time/stake/confirm, actual position-open state and ID, watch countdown to expiry, check settled result, Admin ongoing/history and Ledger. Separate **confirm-cancels**, **settlement fails**, **countdown frozen** and **mobile UI mismatch**. Do not hide genuine settlement failure by cosmetic frontend changes.
6. **Spot/Margin and market/chart:** pair switch, orderbook, timeframe buttons, indicators, order entry, controlled order/fills/history/cancel, margin controls and quotes. Use actual interaction, not a chart screenshot only.
7. **Products and governance:** Mining, Loans, VIP/Referral, KYC, Messages/Support, notifications, announcements, Learn, Settings, Public App Settings, Admin accounts/roles, markets/feed controls, maintenance and all other applicable Public/Admin controls. Verify save/readback/role limits where real UI permits.
8. **Route and mobile evidence:** cover 21 Admin primary destinations plus disposition of the other 13 named routes; crosswalk every canonical 113 ID. Collect all visible Public mobile layout/typography/icons/dock/modal/Wallet truncation mismatches. Cloud browser cannot prove emulated width; separately request actual-device/DevTools verification for 320–440px and short-height after the functional sweep.

## Mutating operations and stop semantics

Use the signed-in **designated TEST account** and approved Admin identity. A real economic mutation requires a bounded authorized amount, asset, scope and action; do not improvise real-money deposits, fake blockchain proof, uncontrolled withdrawal broadcasts, negative balances or direct SQLite edits. Where bounds are absent, stop **that mutation alone**, record `BLOCKED(reason)` and continue all other nondependent workflows. Do not ask permission for harmless navigation, fields, validation, cancel actions, or permitted read-only checks. Keep actual finance evidence and UI claims separate. No synthetic success.

## Write results progressively; no completion claims without proof

Use **one append-only per-run evidence ledger** under `tasks/evidence/` with scenario/113 IDs, deployed SHAs, masked identity, actual click/type/submit/wait sequence, expected/actual, UI screenshot, Admin/Public status, Ledger/Activity/Outbox correlation when permitted, failure code, possible causal owner, severity and next dependency. Update current 113 tracker **only for newly proven same-release outcomes**, preserve old evidence and the four scoped owner-accepted-untested decisions. Use `PASS`, `FAIL`, `BLOCKED(reason)`, `NOT_TESTED(reason)`, `OWNER_ACCEPTED_UNTESTED`; additional tags distinguish visual-only/owner-screenshot and sandbox results.

Prioritize these user observations **without assuming cause or current-release proof**: Admin UI FAILED despite successful account credit; Binary confirmation unexpectedly cancels/does not open; other Binary position shows `Settlement failure` and unreliable countdown; Public mobile Wallet balance amounts clip; typography/icons/modal geometry differ from expected mobile-first design. Reference screenshot of another trading interface is *interaction inspiration*, not NEXI payout authority.

**Stop Phase A only after:** every feasible 113 criterion is dispositioned, all current Admin 21+13 routes are accounted for, every independent real UI journey was attempted, known defects and new ones are deduplicated with reproduction evidence, and all blocked economic actions have specific dependencies. Return `ACTION / RESULT / COVERAGE / DEFECT BACKLOG / NEXT`—**not a short report after the first error**. Provide the exact one-batch repair scope. **Do not start fixes/deployment until Phase A is complete and the repair/release authority is clear.**
