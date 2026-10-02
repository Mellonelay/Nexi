# NEXI Takeover Forensic Audit V2 — ChatGPT Work → Current Chat

**Date:** 2026-08-30  
**Repository:** `Mellonelay/Dexi_Style`  
**Durable authority inspected:** GitHub `main` and `codex/vm-authoritative-sync-20260829`  
**VM authority:** `sg-edge-01` / `/root/workspaces/nexi-github-sync-20260829` when RDC is online  
**Purpose:** prevent loss/drift at chat compaction by distinguishing what was actually pushed, what was edited only on the VM, what was superseded, and what still fails validation.

---

## 0. Executive correction

The first takeover audit was incomplete.

A reread of the last ~50 conversation/tool-history messages recovered concrete Remote Desktop Commander writes that were not represented in the GitHub diff. The largest omitted set is the Wallet/financial splice and several temporary Auth/Profile/D1 gateway edits.

A second important state change happened after the first report: **PR #20 was merged into `main`**.

Current GitHub state at this audit:

- PR #20: merged.
- PR #20 merge commit: `a1f98c984ad0d43ed1c502b37e090080071dfdd7`.
- PR #20 head: `ac6ab7acdbbf3d9b332fa83a27fb8ad1afb5c579`.
- Recovery branch versus `main`: `ahead_by=0`, `behind_by=2`.
- Therefore the Referral/VIP/Profile/KYC/Settings account batch is now in `main`.
- **Those merged account changes are not cleanly validated:** the latest recovery CI failed in backend, frontend, and Cloudflare dry-run jobs.

This V2 report uses the following states:

- **PUSHED-MAIN** — currently durable in `main`.
- **PUSHED-HISTORICAL** — durable commit exists and may already be part of `main` through earlier merge.
- **VM-ONLY / UNPUSHED** — an RDC tool record proves the file was edited on `sg-edge-01`, but current GitHub does not contain that version.
- **SUPERSEDED** — implemented temporarily but later product/architecture decisions replaced it.
- **EXTERNAL ACTION** — GitHub/Cloudflare operational work, not source code.
- **FAILED VALIDATION** — pushed source exists but CI currently proves a defect.
- **REMAINING** — required work still open.

---

# 1. Durable Git/GitHub recovery chronology

## 1.1 Work → VM/GitHub recovery

### `2eaad0e` — PUSHED-HISTORICAL
`checkpoint: sync authoritative VM implementation`

This was the first durable checkpoint of the newer VM implementation after ChatGPT Work discovered GitHub was stale relative to the VM.

### `a2e70a9` — PUSHED-HISTORICAL
`market: add D1-driven BiQuote non-crypto provider`

Durable BiQuote provider baseline.

### `cc6219b` — PUSHED-HISTORICAL
`market: tighten D1 provider capability priorities`

Durable D1 provider-priority/capability correction made after live probes showed that blindly selecting Yahoo + OKX would be unsafe.

### `104fa8b` — PUSHED-HISTORICAL
`ci: add recovery validation and Graphify workflow`

Added disposable GitHub Actions execution lanes.

### `38d3455` — PUSHED-HISTORICAL
`ci: make recovery validation runner-compatible`

Changed backend install to `npm ci --legacy-peer-deps`; removed failing Graphify artifact-upload behavior.

### `5101bb7` — PUSHED-MAIN
Merged PR #19 into `main`.

### `1c40409` — PUSHED-HISTORICAL
`ci: validate pinned Wrangler and Worker dry run`

Added the Cloudflare dry-run lane using project Wrangler.

### `f155c83` — PUSHED-HISTORICAL
`ci: avoid Actions cache while storage quota is full`

Removed setup-node dependency caching from the recovery workflow.

---

# 2. GitHub Actions storage cleanup

## EXTERNAL ACTION — executed during takeover

The Actions-storage audit reported:

- `mellonelay-superpowers-full-harness`: ~526.3 MB workflow artifacts, approximately 377 artifacts.
- `jcode`: ~1003.3 MB Actions cache.
- `loop-engineering`: ~15.1 MB cache.
- `hermes-agent`: ~2.2 MB artifacts.
- `bedtime-story-builder`: negligible.

Cleanup reported:

```text
FOUND_CACHES=2
FOUND_ARTIFACTS=372
REMAINING_CACHES=0
REMAINING_ARTIFACTS=0
```

No repository source, releases, branches, commits, or packages were intentionally deleted.

The NEXI recovery workflow was then changed so it no longer uploads Graphify artifacts and no longer uses npm Actions caching.

---

# 3. GitHub Actions failure history — corrected classification

There are **32 NEXI Recovery CI runs** recorded on the recovery branch at this audit point. A red run does not always mean the same thing.

## 3.1 Initial run `33275890560`

### Admin — PASS
- install passed
- build passed

### Frontend — PASS
- install passed
- typecheck passed
- build passed

### Graphify — graph generation PASS, artifact persistence FAIL
- Graphify installation passed.
- `graphify update backend --no-cluster` passed.
- job was marked failed only at `actions/upload-artifact@v4` because Actions artifact storage was full.

### Backend — CI harness FAIL
- `npm ci` failed before tests/build.
- Root issue: dependency peer conflict; backend uses Nest 10 while `@nestjs/serve-static@5.0.5` expects Nest 11 peer range.
- Recovery workflow changed to `npm ci --legacy-peer-deps`.

This first red run therefore did **not** prove frontend/Admin/Graphify source defects.

## 3.2 Run `33276041101`

### Admin — PASS
### Frontend — PASS
### Graphify — PASS
### Backend focused market tests — PASS
- 3 suites / 25 tests passed.

### Backend build — FAIL
- Clean runner did not have a correctly generated Prisma client before direct Nest build.
- Many `@prisma/client` symbols/models/enums appeared missing.
- Container Dockerfile later proved that explicit `npx prisma generate` resolves that class of failure.

This run established that the market-focused tests were healthy while the direct CI build pipeline was incomplete.

## 3.3 Latest account-era runs, including `33283506066` and `33284383776`

The failure pattern changed after Referral/VIP/Profile/KYC/Settings source was added.

### Graphify — PASS
### Admin — PASS
### Backend focused market tests — PASS

### Frontend — FAIL
The latest pushed Profile implementation does not currently typecheck.

Observed errors in `app/dashboard/profile/page.tsx` include:

- TS18048: `vip` is possibly undefined (multiple occurrences).
- TS18048: `referral` is possibly undefined (multiple occurrences).
- TS2322: number is not assignable to string at one Profile rendering/prop site.

This is a **real merged source defect**, not only a CI harness issue.

### Direct backend job — FAIL
The direct backend job still lacks explicit Prisma generation before Nest build, so its output contains many generated-client errors. The workflow should explicitly run Prisma generation before the build.

### Cloudflare dry-run — FAIL with real source errors
The Cloudflare dry-run Docker build *does* run `npx prisma generate` successfully. It then fails on exactly seven TypeScript errors, proving real source problems independently of the direct CI Prisma-generation issue:

1. `backend/src/kyc/kyc.service.ts:31`
   - calls D1 `batch` with a second `{ transactional: true }` argument.
   - current `D1WorkerBridgeService.batch` accepts one argument.

2. `backend/src/profile/profile.service.ts:60`
   - constructs `unknown[]` parameters where `D1BridgeParameter[]` is required.

3. `backend/src/profile/profile.service.ts:79`
   - `unknown` preference locale value is passed as a D1 bridge parameter.

4. `backend/src/profile/profile.service.ts:80`
   - `unknown` timezone value is passed as a D1 bridge parameter.

5. `backend/src/profile/profile.service.ts:81`
   - `unknown` theme value is passed as a D1 bridge parameter.

6. `backend/src/referral-vip/referral-vip.service.ts:124`
   - calls D1 `batch` with unsupported second `{ transactional: true }` argument.

7. `backend/src/referral-vip/referral-vip.service.ts:147`
   - same unsupported second argument.

Wrangler itself is correct and works in CI:

- `wrangler 4.127.1`
- Worker dry-run reaches Container Docker build.
- Docker installs dependencies and generates Prisma client successfully.
- failure occurs only when Nest compiles the newly merged source.

### Consequence

PR #20 was merged while these failures existed. The account batch is durable in `main`, but **must not be called build-clean or staging-ready yet**.

---

# 4. Market work — durable baseline versus VM-only continuation

## 4.1 Durable market baseline — PUSHED-HISTORICAL / already recovered

Durable commits include:

- D1-driven BiQuote non-crypto provider.
- D1 provider capability/priority tightening.
- Provider mapping preservation.
- focused market tests in CI.

Historical live probes performed during takeover also established:

- Binance crypto market access.
- BiQuote REST access.
- BiQuote SignalR live tick access.
- yfinance/Yahoo WebSocket access.
- Gate TradFi access.
- Yahoo raw REST throttling (`429`) from the VM.
- OKX REST rejection (`403`) from the VM.

This prevented an unsafe D1-router deployment that would otherwise have favored Yahoo + OKX for many non-crypto instruments.

## 4.2 53-asset coverage research — VM evidence

The 53 canonical catalog remained:

- 17 crypto
- 20 stocks
- 9 FX
- 7 metals

BiQuote was probed rather than trusted by catalog name alone.

Observed usable live/reference quote coverage was approximately:

- Stocks: 16/20 from BiQuote.
- FX: 8/9 from BiQuote.
- Metals: 7/7 from BiQuote.
- Gate filled stock gaps including AXP, DIS, UBER, SONY.
- Remaining special case: USDRUB.

## 4.3 MOEX USD/RUB recovery — VM-ONLY / UNPUSHED

The later market pass rejected stale BiQuote `USDRUB` history and found official keyless MOEX ISS instrument:

```text
USD000UTSTOM
```

The probe produced a delayed reference around `87.0375` at the time of observation and returned minute/10-minute/hour/day candles.

A dedicated `MoexUsdRubAdapter` was added on the VM.

## 4.4 Newer market implementation — VM-ONLY / UNPUSHED

The last-50-message reconstruction and prior execution log show these concrete later changes were made on `sg-edge-01`, but they are not in the current GitHub recovery delta and therefore are not durable yet:

- added `@microsoft/signalr` to backend dependencies.
- reworked BiQuote adapter toward:
  - batch initial snapshot
  - real SignalR stream
  - automatic reconnect/resubscribe
  - REST fallback
  - bid/ask/spread
  - historical Kline retrieval.
- added `MoexUsdRubAdapter`.
- added Gate TradFi historical Kline retrieval.
- added Gate bid/ask/spread normalization.
- added Binance provider-history normalization.
- generalized provider Kline interval away from hard-coded `1m`.
- added provider-history interface.
- extended provider router for history-provider selection by D1 priority.
- added MOEX registry mapping only for `USDRUB`.
- registered MOEX in `MarketModule`.
- added `bid`, `ask`, `spread` to canonical Prisma quote models.
- regenerated D1 schema locally.
- started `backend/prisma/migrations-d1/0004_market_top_of_book_and_moex.sql`.

## 4.5 Market work explicitly unfinished

The following splice was not completed/pushed:

```text
provider quote bid/ask/spread
→ MarketIngestService
→ MarketAuthorityService
→ D1 MarketQuoteLatest / MarketQuoteSnapshot
→ Aiven
→ Socket.IO
→ Public /market/prices + Spot/Margin consumers
```

Also unfinished:

- lazy provider hydration in `MarketKlineService`.
- compile/test of the newest market source.
- durable push of migration `0004` and MOEX/top-of-book source.
- apply D1 market migrations to staging.
- staging proof of fresh 53/53 quote/Kline/tick state.
- genuine depth/trade proof per capability.

Do not call market `53/53 COMPLETE` until that work is recovered and proved.

---

# 5. Wallet/financial frontend work missed by V1 — VM-ONLY / UNPUSHED

This is the largest concrete omission from V1. RDC history proves all four modal files were rewritten on the VM.

## 5.1 `DepositModal.tsx`

VM rewrite implemented:

```text
GET  /financial/deposit-destinations
POST /financial/deposit-proof-intents
PUT  Worker /storage/deposit-proof?key=...
POST /financial/deposit-claims
```

It included:

- asset/network destination selection.
- authoritative deposit address.
- confirmation metadata.
- claimed amount.
- optional transaction hash.
- image proof upload.
- bearer token on Worker upload.
- idempotency key using `crypto.randomUUID()`.
- refresh callback after successful claim.

### GitHub reality
Current GitHub `DepositModal.tsx` is still the old unavailable-placeholder implementation and says no authoritative deposit address is available.

Therefore the functional Deposit modal is **VM-ONLY / UNPUSHED**.

## 5.2 `WithdrawModal.tsx`

VM rewrite implemented canonical:

```text
POST /financial/withdrawals
```

with:

- asset
- network
- destination address
- amount
- idempotency key
- completion refresh.

### GitHub reality
Current GitHub file still delegates to an `onWithdraw` callback and uses the older generic form. The canonical financial-route rewrite is not durable.

## 5.3 `TransferModal.tsx`

VM rewrite implemented:

```text
POST /financial/transfers
```

using the public six-digit NEXI User ID:

```json
{
  "toUserCode": 123456,
  "asset": "...",
  "amount": "...",
  "idempotencyKey": "transfer:<uuid>"
}
```

### GitHub reality
Current GitHub `TransferModal.tsx` still displays `Transfer unavailable` and says the backend contract does not support internal transfer.

Therefore the working Transfer modal is **VM-ONLY / UNPUSHED**.

## 5.4 `ConvertModal.tsx`

VM created a new canonical two-step conversion modal:

```text
POST /financial/conversion/quote
POST /financial/conversion/accept
```

It included quote expiry/rate/output display and separate acceptance idempotency keys.

This file/version is not represented in the current GitHub delta and must be recovered.

## 5.5 `wallet/page.tsx` partial rewire

RDC history proves multiple focused writes occurred after one larger edit was blocked by the execution safety layer.

Successfully applied VM edits included:

- import `ConvertModal`.
- remove `actionCanSubmit` / `resolveEndpointTemplate` imports.
- switch self wallet read to `/wallet/me`.
- keep activity on `/wallet/activity`.
- remove env-gated action endpoints:
  - `NEXT_PUBLIC_WALLET_DEPOSIT_ENDPOINT`
  - `NEXT_PUBLIC_WALLET_WITHDRAW_ENDPOINT`
  - `NEXT_PUBLIC_CONVERSION_SUBMIT_ENDPOINT`
- remove legacy amount/canSubmit state.
- remove legacy `submitAction` / `submitWithdraw` blocks.
- change quick-action availability to authenticated + LIVE.
- wire Deposit/Withdraw/Transfer/Convert modal completion to `loadWallet`.

A tool output after the final smaller patch printed `wallet actions wired`, confirming that edit executed.

However, because the VM is currently unreachable from this audit session, the exact final text of this file must be re-read before recovery. Do not reconstruct it from memory alone.

---

# 6. Financial transfer by public NEXI User ID — VM-ONLY / UNPUSHED

RDC history proves backend edits in:

- `backend/src/financial/financial-operations.dto.ts`
- `backend/src/financial/financial-operations.service.ts`

The intended contract changed from internal-only `toUserId` to allowing public `toUserCode`.

DTO changes included:

- optional internal `toUserId`.
- optional integer `toUserCode`.
- six-digit validation range (`100000`–`999999`).

Service changes included:

- resolve public user code through D1/Prisma to the internal user ID.
- reject recipient-not-found.
- keep self-transfer rejection after resolution.
- preserve normal amount/idempotency/ledger semantics.

One generated edit temporarily introduced:

```ts
let toUserId = toUserId?.trim();
```

RDC immediately repaired it to:

```ts
let toUserId = input.toUserId?.trim();
```

This repair is part of the forensic history and must be preserved when recovering the VM version.

---

# 7. Identity/Auth/Profile/KYC work — durable versus temporary VM branch

## 7.1 Locked product rule

NEXI Public authentication remains wallet-only:

```text
Connect EVM wallet
→ server nonce / SIWE challenge
→ sign exact server message
→ backend signature verification
→ lookup WalletIdentity
→ load or create User
→ stable public six-digit NEXI User ID
→ internal wallet/ledger account state
→ profile/preferences/referral/VIP hydration
→ AuthSession
```

Email and KYC are enrichment/security state, not login credentials.

The external EVM wallet is authentication identity; the NEXI Wallet is the internal ledger/account system.

## 7.2 Durable account/profile layer — PUSHED-MAIN via PR #20

Durable source now in `main` includes:

- Wallet verification accepts optional referral code.
- SIWE new-user bootstrap initializes Referral/VIP state.
- returning user profile can hydrate Referral/VIP.
- dedicated Profile module/service/controller/DTOs.
- subject-owned `/wallet/me` and `/wallet/me/ledger` controller routes.
- subject-owned KYC contract.
- wallet-native Profile frontend.
- wallet-native Settings frontend.

## 7.3 Temporary Auth-centric implementation — VM-ONLY and largely SUPERSEDED

Before the dedicated Profile domain was created, RDC edited Auth/Users/D1 gateway directly:

- `auth.dto.ts`: temporary `UpdateProfileDto`, `UpdatePreferencesDto`.
- `d1-financial-command.gateway.ts`:
  - `getUserByUserCode`
  - `updateUserProfile`
  - `getUserPreference`
  - `updateUserPreference`
  - later `listUserAuthSessions`.
- `users.service.ts`:
  - `findByUserCode`
  - `updateProfile`
  - `getPreferences`
  - `updatePreferences`
  - preference JSON normalization.
- `auth-session.service.ts`: `listSessions`.
- `auth.service.ts`: profile/preferences/session wrapper methods.
- `auth.controller.ts` temporarily added:
  - `PATCH /auth/me`
  - `GET/PATCH /auth/preferences`
  - `GET /auth/sessions`
  - `POST /auth/sessions/:sessionId/revoke`.

Later product/source recovery corrected this design:

- Profile/preferences belong to dedicated `/profile/*` domain.
- raw Public session directory should not be exposed in normal user Settings.
- Admin session governance remains valid.

Therefore these temporary Auth-centric VM edits must be reconciled, not blindly copied into GitHub.

## 7.4 Legacy `/auth/kyc` direct Prisma path

During the VM pass, the old Auth-controller KYC route that wrote directly through Prisma was removed in favor of canonical KYC service/D1 authority.

This intent remains correct even though exact current source must be inspected during recovery.

---

# 8. KYC specific forensic state

## 8.1 DOB bug discovered

The D1 KYC submission path had been writing `CURRENT_TIMESTAMP` into DOB rather than the user-supplied date of birth.

RDC history shows a corrected D1 statement using `command.dob` and an EventOutbox statement with event type:

```text
KYC_SUBMITTED
```

The VM also showed KYC state events:

```text
KYC_APPROVED
KYC_REJECTED
```

## 8.2 GitHub/Main current defect

PR #20 merged KYC code that now fails Docker/Nest compilation because `KycService` passes unsupported `{ transactional: true }` as a second argument to D1 bridge `batch`.

Thus:

- semantic KYC direction: correct.
- merged compile state: broken.
- VM D1 gateway DOB/EventOutbox version: must still be reconciled against `main`.

---

# 9. Referral/VIP work now durable in main

PR #20 contains a full account-layer batch.

## 9.1 Migration

`backend/prisma/migrations-d1/0005_referral_vip_account.sql`

- creates configurable `VipLevel`.
- creates one-to-one `UserVipState`.
- initializes VIP 0 / `Member`.
- backfills missing existing `Affiliate` rows.
- backfills missing `UserPreference` rows.
- backfills missing `UserVipState` rows.
- deliberately reserves migration `0004` for the newer VM market/MOEX/top-of-book work.

## 9.2 Referral behavior

Durable intent/source includes:

- reuse existing `Affiliate` rather than duplicate referral schema.
- deterministic referral codes derived from public user code, e.g. `NEXI123456`.
- referral URL form `/?ref=NEXI123456`.
- frontend captures referral before wallet verification.
- first successful SIWE login applies referral.
- self-referral rejected.
- one-time referral attribution.
- referral count / earnings / referrer projection.

## 9.3 VIP behavior

- configurable levels; not hardcoded to ten levels.
- initial Member/VIP0 state.
- persisted progress/qualification timestamps.
- public projection in Profile.
- Admin configuration/assignment endpoints.
- Admin mutations use entitlement permission + audit.

## 9.4 Public APIs

```text
GET  /referral/me
POST /referral/claim
GET  /vip/me
GET  /vip/levels
```

## 9.5 Admin APIs

```text
GET  /admin/referrals
GET  /admin/vip/users
GET  /admin/vip/levels
POST /admin/vip/levels
POST /admin/vip/assign
```

## 9.6 Durable commit sequence

Account/referral/VIP/profile commits include:

- `a8f9467` add referral/VIP contracts
- `ecae949` implement D1 referral/VIP service
- `954864c` expose public referral/VIP API
- `bd97798` register referral/VIP module
- `ca6cee4` add D1 referral/VIP migration
- `d55cf6b` register referral/VIP domain
- `d56e089` initialize referral/VIP from wallet auth
- `ab0f67e` accept referral code during wallet bootstrap
- `9b7ffa3` bootstrap referral/VIP from SIWE wallet login
- `2fd7a0b` expose referral/VIP in wallet profile
- `2c0b3a1` join wallet identity in referral/VIP Admin views
- `464bd4a` add wallet-native Profile DTOs
- `a1db258` add D1 Profile preference authority
- `9d3606f` expose canonical Profile API
- `0c5fe43` register Profile domain
- `1152a7e` register wallet-native Profile domain
- `611a333` KYC DOB-related correction
- `f6ac599` subject-owned KYC contract
- `8724c64` subject-owned Wallet read routes
- `b676f69` activate Referral/VIP wallet Profile UI
- `aa1c75b` capture referral before wallet verification
- `3e3c5a9` apply referral on first wallet verification
- `1746f4b` Admin VIP DTOs
- `3aea0fc` governed VIP config/assignment
- `5e59da9` expose Admin Referral/VIP control plane
- `023ffe8` register Admin Referral/VIP control plane
- `1bbd268` synchronize wallet-native Profile/KYC/preferences Settings
- `ac6ab7a` first takeover audit checkpoint
- `a1f98c9` merge PR #20 into `main`.

These commits are durable; compile cleanliness is separate and currently failing.

---

# 10. Profile/Settings current merged state

## PUSHED-MAIN but FAILED VALIDATION

Profile/Settings now aim to expose:

- NEXI six-digit user ID.
- EVM wallet address.
- chain ID.
- display name.
- optional email.
- KYC state.
- VIP level/progress/threshold.
- referral code/referrer/count/earnings/link.
- locale.
- notification preferences.
- appearance preference.

The old raw Public session tab was removed after product-scope recovery.

Current Profile TypeScript errors must be repaired before frontend can be called synchronized.

---

# 11. Product decisions recovered from older project evidence that must not be dropped

The forensic reread also surfaced requirements that were not fully represented in the first audit and remain completion gates.

## 11.1 Withdrawal security credential

Historical/current product direction includes a separate **six-digit Withdrawal PIN**, distinct from wallet login.

Target concept:

```text
wallet-authenticated session
+ 6-digit withdrawal PIN
+ KYC/risk/step-up policy when required
→ withdrawal request
```

Only a strong hash may be stored; attempts/lockout/reset/rate-limit semantics are required. This is not yet proven implemented in the current Cloudflare/D1 authority and remains **REMAINING**.

## 11.2 Wallet compatibility

NEXI should authenticate standards-compatible Ethereum/EVM wallets, not special-case MetaMask/Trust Wallet as product authority.

Need final source/runtime proof of provider abstraction and any intended multiple-wallet semantics.

## 11.3 Returning-wallet hydration

Returning wallet login must restore the same:

- User/internal ID.
- public six-digit user code.
- WalletIdentity.
- ledger/wallet projections.
- profile/preferences.
- optional email/KYC/security.
- VIP/referral.
- notification/message state where applicable.

Do not treat new-wallet creation alone as sufficient identity completion.

## 11.4 Support live chat

The intended user flow remains:

```text
Public Support conversation
↔ realtime backend/Aiven/Socket.IO
↔ Admin Support inbox/replies
```

using existing SupportTicket/SupportTicketReply/message foundations and R2 for attachments where required. Complete public↔Admin integration remains unproven.

## 11.5 Communications/content

Still required:

- Support
- Messages
- Notifications
- Announcements
- Learn
- localization/publishing/Admin parity
- EventOutbox/realtime linkage where applicable.

## 11.6 Learn/Announcement localization

Need source-level confirmation of multilingual content and Admin publication workflows; do not merely infer completion from table existence.

---

# 12. Binary/Options requirements that remain locked

The product retains the same underlying market stream for Options/Binary and must support normal governed settlement plus sandbox-only control modes:

```text
normal
forced_win
forced_loss
win_ratio
hazard_rate
payout_override
```

Required completion graph:

```text
pair/timeframe config
→ open position
→ countdown/runtime
→ real market-derived normal settlement
→ D1 settlement
→ payout ledger posting
→ settlement receipt
→ Socket.IO
```

Sandbox modes must stay isolated from production-real-user settlement and retain:

- governance approval
- audit record
- Admin sandbox surface.

This has not yet been revalidated end-to-end after the D1/Cloudflare migration.

---

# 13. Existing major domains — do not rebuild

Historical/current evidence says the following already have substantial schema/service/UI foundations and should be reconciled, not redesigned:

- Wallet/Ledger
- Deposit
- Withdrawal
- Transfer
- Conversion
- Spot
- Margin
- Binary/Options
- Mining
- Loans
- Support
- Messages
- Notifications
- Announcements
- Learn
- Admin governance
- Market catalog/providers
- EventOutbox

The remaining work is principally missing/incorrect edges:

```text
UI action
→ API route
→ DTO/auth/ownership
→ controller
→ service
→ D1 command/read
→ ledger effect where financial
→ idempotency
→ Activity/EventOutbox
→ Queue/Workflow where justified
→ Aiven/Socket.IO
→ Public consumer
→ Admin consumer
→ OpenAPI
→ staging proof
```

---

# 14. Admin current state and remaining work

The current Admin application already has significant surfaces for:

- Users
- KYC
- Wallets
- Ledger
- Deposits
- Withdrawals
- Assets
- Market feeds
- Spot
- Binary
- Sandbox
- Mining
- Loans
- Reconciliation
- Settlements
- Exposure
- Sessions
- Approvals
- Audit
- Admin users/Roles
- Health
- Maintenance
- feature flags
- frontend control
- localization
- navigation.

Admin build still passes in latest Actions.

Primary remaining Admin joins:

- actual Referral/VIP UI consumption of newly merged Admin endpoints.
- Communications shells: Support, Messages, Announcements, Notifications, Learn.
- canonical `/admin/*` parity and removal/classification of stale compatibility routes.
- market health/provider view aligned with repaired provider authority.
- Binary sandbox controls tied to audited governance path.
- remove stale Postgres/Redis-authority wording and mock-default assumptions where present.

---

# 15. Public 11-area synchronization ledger

## 1. Dashboard / Quotes Hub
Status: PARTIAL / market freshness dependency.

Remaining:
- fresh 53-asset quotes.
- top-of-book fields.
- Asset Detail.
- canonical Kline intervals.
- truthful stale/unavailable behavior.
- custom NEXI logos preserved.

## 2. Spot Trading
Status: EXISTING DOMAIN / RECONCILIATION REQUIRED.

Remaining:
- current route names/DTOs versus frontend.
- reservation/order lifecycle.
- cancellation/release.
- executions/trades.
- settlement/ledger linkage.
- MarketPair integration.
- realtime/history/Admin parity.

## 3. Options / Binary
Status: EXISTING DOMAIN / D1 + sandbox regression required.

Remaining:
- normal settlement proof.
- forced mode governance.
- ledger payout.
- receipt/realtime/Admin parity.

## 4. Wallet
Status: backend foundation strong; functional action UI currently VM-only.

Remaining:
- recover DepositModal.
- recover WithdrawModal.
- recover TransferModal.
- recover ConvertModal.
- recover final wallet/page.tsx splice.
- recover public-user-code transfer resolution.
- Withdrawal PIN/security lifecycle.

## 5. Earn / Mining
Status: existing models/workflow; current D1 lifecycle verification incomplete.

Remaining:
- plan/subscription/debit.
- accrual/reward.
- scheduler/workflow.
- ledger/outbox/idempotency.
- Public/Admin API parity.

## 6. Loan
Status: existing models/workflow; D1 lifecycle verification incomplete.

Remaining:
- application.
- approval/rejection.
- disbursement.
- repayment.
- overdue transition.
- ledger/outbox/idempotency.
- Public/Admin parity.

## 7. Support
Status: persistence foundation exists; live Public↔Admin conversation not closed.

## 8. Announcement
Status: model exists; localization/publish/targeting/Public/Admin parity not closed.

## 9. Learn
Status: rich model foundation exists; frontend/Admin/localization/publish lifecycle not closed.

## 10. Messages
Status: PersistentMessage/Notification foundation exists; distinction, read/unread, delivery and Admin parity not closed.

## 11. Settings
Status: merged account-oriented rewrite exists but frontend compile currently fails via shared Profile account work; Withdrawal PIN/referral/VIP placement/security behavior still need final reconciliation.

Nested flows retained:

- Asset Detail under market/dashboard.
- Margin nested in trading scope.
- Referral/VIP under wallet-native account/Profile/Settings.
- KYC/profile under wallet identity.

---

# 16. Platform / Cloudflare state that must remain aligned

Canonical target remains:

```text
Public Frontend / Admin
→ Cloudflare Worker
→ Cloudflare Container
→ NestJS
→ D1 durable truth
→ Aiven realtime/cache/streams
→ R2/Pipelines/Data Catalog archive
```

Cloudflare infrastructure roles already selected include:

- D1 — durable application + financial truth.
- Aiven Valkey — realtime/cache/Streams.
- R2/Pipelines/Data Catalog — high-volume market archive/analytics.
- Queues — async delivery/retry/fanout where justified.
- Workflows — orchestration invoking canonical Nest/D1 commands.
- KV — non-authoritative config/cache.
- Analytics Engine — metrics/analytics.
- Secrets Store — secrets integration.
- Durable Objects — Container/runtime machinery, not financial authority.

Do not reintroduce PostgreSQL/Neon as authority.

---

# 17. OpenAPI / contract freeze still required

The deployed backend previously exposed `/docs-json` and many routes, but route existence is not full contract closure.

Required final matrix per user-visible action:

```text
UI_ELEMENT
FRONTEND_FILE
API_ROUTE
METHOD
AUTH
REQUEST_SCHEMA
RESPONSE_SCHEMA
CONTROLLER
SERVICE
D1_TABLES
READ_QUERY
WRITE_COMMAND
LEDGER_EFFECT
IDEMPOTENCY
AUDIT
EVENT_OUTBOX
QUEUE
WORKFLOW
SOCKET_EVENT
ADMIN_SURFACE
OPENAPI_STATUS
SOURCE_STATUS
RUNTIME_STATUS
```

After implementation stabilizes:

- generate/freeze Swagger/OpenAPI.
- run API Documentation Checker on actual controllers/DTO/OpenAPI.
- run API Impact Mapper on explicit changes.
- classify stale compatibility endpoints.

---

# 18. Graphify state

## GitHub Actions Graphify — VERIFIED PASS

Graphify repeatedly installs and executes successfully in GitHub Actions.

The first job was marked failed only because artifact upload exceeded storage; later runs show the Graphify job itself passing.

## VM Graphify — CURRENTLY BLOCKED

The user specifically requested a full VM Graphify refresh.

At the V2 audit moment, the Remote Desktop Commander connector is disabled/unavailable in this chat. Therefore **no VM Graphify refresh is claimed**.

When RDC reconnects, required first commands are:

```bash
cd /root/workspaces/nexi-github-sync-20260829
git status --short --branch
git log --oneline --decorate -20
git diff --stat
git diff --name-status

graphify --version
graphify check-update .
graphify update backend --no-cluster
```

Then collect:

```bash
graphify god-nodes
```

and any available topology/status output relevant to changed files.

Do not overwrite VM market/wallet files before this recovery diff is captured.

---

# 19. Cloudflare Browser Run research — intentionally deferred

External account probes earlier proved Wrangler 4.127.1 Browser Run commands and temporary lab-session creation/CDP access.

The owner later explicitly deferred Browser Run because ChatGPT Work will perform browser acceptance. Do not spend current engineering time on Browser Run until source/contract closure is complete.

---

# 20. Exact VM recovery list before any new broad write

When RDC reconnects, inspect and preserve these paths first.

## Market

```text
backend/package.json
backend/src/market/biquote-market.adapter.ts
backend/src/market/moex-usdrub.adapter.ts
backend/src/market/market-provider.adapter.ts
backend/src/market/market-provider-router.service.ts
backend/src/market/market-authority.service.ts
backend/src/market/market-ingest.service.ts
backend/src/market/market-kline.service.ts
backend/src/market/market-source-registry.ts
backend/src/market/market.module.ts
backend/prisma/schema.prisma
backend/prisma/migrations-d1/0004_market_top_of_book_and_moex.sql
```

## Wallet/financial

```text
cloudflare-container-bootstrap/dexi-frontend/app/dashboard/wallet/page.tsx
cloudflare-container-bootstrap/dexi-frontend/app/dashboard/wallet/components/DepositModal.tsx
cloudflare-container-bootstrap/dexi-frontend/app/dashboard/wallet/components/WithdrawModal.tsx
cloudflare-container-bootstrap/dexi-frontend/app/dashboard/wallet/components/TransferModal.tsx
cloudflare-container-bootstrap/dexi-frontend/app/dashboard/wallet/components/ConvertModal.tsx
backend/src/financial/financial-operations.dto.ts
backend/src/financial/financial-operations.service.ts
```

## D1/Auth/KYC temporary/reconciliation files

```text
backend/src/d1/d1-financial-command.gateway.ts
backend/src/auth/auth.dto.ts
backend/src/auth/auth.controller.ts
backend/src/auth/auth.service.ts
backend/src/auth/auth-session.service.ts
backend/src/users/users.service.ts
backend/src/kyc/kyc.service.ts
```

For this last group, compare semantically rather than blindly copy: some Auth/session/profile changes were superseded by the dedicated Profile domain and the decision not to expose raw Public sessions.

---

# 21. Current P0 defects after PR #20 merge

Before broad feature work continues, repair:

1. Profile frontend TypeScript nullability/type errors.
2. KYC D1 `batch` call signature.
3. Referral/VIP D1 `batch` call signatures.
4. Profile D1 bridge parameter typing.
5. recovery backend CI: explicit `npx prisma generate` before direct Nest build.
6. reconcile VM-only Wallet and market changes into GitHub without overwriting newer durable account work.

These are small/contained compared with the remaining product joins, but they are blocking a trustworthy baseline.

---

# 22. Remaining implementation order — frozen continuation baton

## P0 — Recover and stabilize

- reconnect RDC.
- inventory VM changes.
- full VM Graphify update.
- reconcile VM-only market + Wallet changes with current `main`.
- fix the seven Docker/Nest account compile errors and Profile frontend errors.
- fix direct backend CI Prisma-generation step.
- establish green backend/Graphify/frontend/Admin/Worker-dry-run baseline.

## P1 — Market 53/53

- finish top-of-book propagation.
- finish provider Kline hydration.
- recover/push migration `0004`.
- apply required staging market migrations.
- prove fresh 53 assets, chart intervals, ticks, truthful bid/ask/depth/trades.

## P2 — Wallet/financial actions

- recover canonical Deposit/Withdraw/Transfer/Convert modals.
- public six-digit recipient lookup.
- ledger/idempotency/EventOutbox parity.
- Withdrawal PIN lifecycle/security.

## P3 — Asset Detail + Spot + Margin

- canonical routes/DTOs.
- chart/quote/top-of-book consumers.
- order/position lifecycle.
- ledger settlement.
- Admin parity.

## P4 — Binary/Options

- normal settlement.
- force modes sandbox-only.
- governance/audit.
- ledger payout/receipt/realtime.
- Public/Admin parity.

## P5 — Mining + Loans

- existing D1/workflow lifecycle closure; do not redesign.

## P6 — Communications/content

- Support live chat.
- Messages.
- Notifications.
- Announcements.
- Learn.
- localization.
- Admin publishing/reply/control.
- EventOutbox/realtime delivery.

## P7 — Account/security final closure

- returning wallet hydration.
- standards-compatible EVM wallet support.
- connected-wallet semantics if product retains them.
- optional email verification/recovery semantics.
- KYC final contract.
- Withdrawal PIN.
- Referral/VIP qualification/reward lifecycle beyond bootstrap.

## P8 — Admin canonicalization

- `/admin/*` normalization.
- mock/default cleanup.
- stale PostgreSQL/Redis authority cleanup.
- market/referral/VIP/binary/support control surfaces.

## P9 — Swagger/OpenAPI + integration contracts

- complete DTO decorators/errors/lifecycle states.
- `/docs-json` contract freeze.
- API Documentation Checker.
- API Impact Mapper.
- EventOutbox/Aiven/Socket.IO regression.

## P10 — staging acceptance

- Neon/Postgres-free authority proof.
- D1 application writes.
- Worker/Container routing.
- frontend/Admin adapter parity.
- browser/e2e delegated to ChatGPT Work as requested.
- production remains separate approval.

---

# 23. Completion discipline

Never collapse these states:

```text
SPECIFIED
IMPLEMENTED
PUSHED
STATICALLY_VALIDATED
TESTED
INTEGRATED
RUNTIME_VERIFIED
BROWSER_VERIFIED
SECURITY_REVIEWED
COMPLETE
```

Examples from this audit:

- Referral/VIP account code = PUSHED-MAIN, but currently not STATICALLY_VALIDATED because CI fails.
- GitHub Actions Graphify = TESTED/PASS in CI, but VM Graphify refresh = BLOCKED.
- Wallet action modals = IMPLEMENTED on VM, but not PUSHED.
- newer MOEX/top-of-book market work = IMPLEMENTED/PARTIAL on VM, not PUSHED and not fully compiled.
- Browser Run capability = externally PROBED, but intentionally deferred for NEXI acceptance.

---

# 24. Final forensic conclusion

The takeover did more work than the V1 audit captured, but durability is uneven.

### Safely durable in `main`

- original VM authoritative checkpoint and earlier BiQuote/provider work.
- recovery CI/Graphify infrastructure.
- Referral/VIP persistence/API/bootstrap.
- canonical Profile domain.
- subject-owned KYC and Wallet read contracts.
- Profile/Settings/WalletConnect/referral frontend changes.
- recovery audit documentation.

### Durable but currently broken by CI

- Profile frontend account projection.
- KYC/Profile/Referral-VIP backend account batch.

### Concrete VM-only work that must be recovered

- all four canonical Wallet financial-action modals.
- Wallet page action splice.
- transfer-by-six-digit-user-code backend support.
- later D1 gateway/Profile/Auth temporary edits that need semantic reconciliation.
- MOEX USD/RUB adapter.
- BiQuote SignalR/history enhancement.
- Gate/Binance history/top-of-book enhancements.
- bid/ask/spread schema + migration `0004`.
- unfinished market ingestion/Kline splice.

### Major product items still left

- 53/53 fresh market runtime.
- Asset Detail.
- Spot/Margin full joins.
- Binary normal + governed sandbox modes.
- Wallet action lifecycle + Withdrawal PIN.
- Mining/Loans D1 lifecycle closure.
- Support/Messages/Notifications/Announcements/Learn Public↔Admin joins.
- Referral/VIP reward/qualification lifecycle beyond bootstrap.
- full Admin canonicalization.
- Swagger/OpenAPI freeze.
- EventOutbox/Aiven/Socket.IO regression.
- staging acceptance.

This report supersedes the first takeover audit wherever the two differ.
