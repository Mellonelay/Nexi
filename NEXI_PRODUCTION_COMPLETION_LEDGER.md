# NEXI Production Completion Ledger

**Authority date:** 2026-09-15 (Myanmar time)
**Repository:** `Mellonelay/Nexi`
**Current source authority:** `main@3b173ea38da4c80193c5e0b552ae62fede22fab7`
**Purpose:** the single final-production completion controller for NEXI. This is a finishing-state ledger, not a restart plan.

## 1. Finishing-state rule

NEXI entered this reconciliation at the finishing stage. The governing problem was **existing functionality that was not working correctly in the current product/runtime**, combined with stale documents and phase controllers that repeatedly caused already-completed work to be reopened.

Therefore:

- **PROVEN + UNCHANGED = REUSE.**
- **OWNER-SUPERSEDED = DO NOT REOPEN.**
- Current source/runtime evidence outranks stale plans, handovers, branch notes, and old phase controllers.
- When a feature already exists but fails in the current product, trace and repair the **existing canonical path**. Do not create a parallel implementation or restart the domain.
- Do not repeat broad Graphify scans, whole-suite tests, infrastructure discovery, or browser matrices unless a relevant dependency changed or current evidence contradicts prior proof.
- Production deployment is already complete; production is not awaiting authorization.
- The historical 27-row matrix, `CODE_TO_CODE_CLOSED`, A25/A26/A27, and staging-first sequencing are not active completion controllers.

## 2. Canonical authority model

| Layer | Current authority |
|---|---|
| Owner/product decisions | Explicit current owner decisions |
| Implementation truth | Current `Mellonelay/Nexi` `main` |
| Business authority | NestJS |
| Durable application/financial authority | D1 |
| Accounting truth | Ledger/invariants |
| Durable publication boundary | EventOutbox |
| Realtime/cache/Streams | Aiven Valkey; never financial truth |
| Async delivery | Queues |
| Long-running orchestration | Workflows |
| Edge/platform routing | Cloudflare Worker |
| Business runtime | Cloudflare Container + NestJS |
| Consumer/control surfaces | Public + Admin |
| Public visual/UX authority | Sep 13 V3 Deep Liquid Violet acceptance, subject to newer owner decisions |

## 3. Status vocabulary

- `PROVEN_PRODUCTION` — directly proven in the current production release/runtime.
- `PROVEN_UNCHANGED` — previously accepted evidence remains reusable because the governing source/dependency has not materially changed.
- `MANUAL_OWNER_ACCEPTANCE_REQUIRED` — requires a real owner wallet/session or privileged Admin context unavailable to automated acceptance.
- `TARGETED_RUNTIME_REPAIR_ONLY` — implementation exists; if current runtime/manual use exposes a defect, repair the existing canonical path only.
- `OPEN_REAL_DEFECT` — a current defect is directly observed and not yet repaired.
- `SUPERSEDED` — historical requirement/controller explicitly displaced by newer authority.
- `NOT_APPLICABLE` — evidence-backed exclusion from current product scope.

## 4. Current production baseline

| Requirement | Current authority path | Source status | Runtime status | Evidence / release | Dependency drift | Remaining gap | Final verdict |
|---|---|---|---|---|---|---|---|
| Source convergence | GitHub `main` | Complete | N/A | `3b173ea38da4c80193c5e0b552ae62fede22fab7` | None known | None | `PROVEN_PRODUCTION` |
| Production deployment | Worker + Container + Public + Admin | Complete | Complete | Production deployed at final SHA | None known | None | `PROVEN_PRODUCTION` |
| Backend health/readiness | Worker -> Container -> NestJS -> D1/Valkey | Complete | `/health`, `/healthz`, `/readyz` healthy | final production deployment | None known | None | `PROVEN_PRODUCTION` |
| Public bounded browser acceptance | Public production app | Complete | Desktop + mobile bounded unauthenticated acceptance passed | production Playwright/Chromium | None known | Authenticated flows separate | `PROVEN_PRODUCTION` |
| Admin bounded browser acceptance | Admin production app | Complete | Overview/users/market-feeds settle correctly to sign-in boundary; checked session no console errors/warnings | production browser acceptance | None known | Privileged actions need real Admin context | `PROVEN_PRODUCTION` |
| Required Klines | Provider -> normalize -> D1 -> API/realtime -> Public/Admin | Complete | `1m/5m/15m/30m/1h/4h/1d`; higher TFs proven `LIVE` | `3b173ea...` production | None known | None | `PROVEN_PRODUCTION` |
| Realtime reconnect/resnapshot | provider/D1 -> Valkey/Socket.IO -> client | Complete | Forced transport loss -> reconnect -> second authoritative snapshot -> ticks/Klines continue | production runtime receipt | None known | None | `PROVEN_PRODUCTION` |
| REST read-back recovery | D1 canonical market read path | Complete | Independent 5m read-back `LIVE`, 40 candles | production runtime receipt | None known | None | `PROVEN_PRODUCTION` |
| Authenticated wallet/SIWE/balance | Public -> auth -> session -> D1/Ledger | Exists | Requires real wallet signature/session | current production auth boundary | Real identity context unavailable to automation | Owner device acceptance | `MANUAL_OWNER_ACCEPTANCE_REQUIRED` |
| Privileged Admin RBAC/action | Admin -> auth/RBAC -> canonical backend -> D1/audit | Exists | Requires authorized privileged Admin context | current production Admin boundary | Privileged context unavailable to automation | Owner Admin acceptance | `MANUAL_OWNER_ACCEPTANCE_REQUIRED` |

## 5. Public product completion requirements

These are **surviving product requirements**, not instructions to rebuild already-existing domains.

| Domain / requirement | Canonical acceptance path | Current treatment |
|---|---|---|
| Exactly 11 primary Public destinations | Dashboard/Quotes, Spot, Options/Binary, Wallet, Earn/Mining, Loans, Support, Announcements, Learn, Messages, Settings | Preserve. `PROVEN_UNCHANGED` unless a current runtime observation contradicts it. |
| Asset Detail | Quotes -> Asset Detail -> same canonical asset/pair | Preserve nested route; not a 12th destination. |
| Active Asset / Active Pair | Quotes Hub -> Asset Detail -> Spot/Margin -> Options/Binary | Preserve one canonical owner; no silent reset. `TARGETED_RUNTIME_REPAIR_ONLY` if current use exposes drift. |
| Canonical asset identity | 53 NEXI-controlled local assets/icons | Preserve exactly 53 unless a newer explicit owner decision changes it. Provider branding must not replace NEXI identity. |
| Public visual system | Deep Liquid Violet + selective Liquid Glass + Geist/Geist Mono | Sep 13 V3 is current Public visual/geometry acceptance. Do not restore stale Stitch, generic dark-premium target, `More`, or IBM Plex Mono from old docs. |
| Mobile persistent navigation | Dashboard / Spot / Options / Wallet / Earn | Preserve exactly. |
| Mobile geometry | 320/360/~390/412-430/tablet/desktop + short-height viewport; safe-area/bottom-nav clearance | Preserve; repair systemic shared geometry only if a current defect is observed. |
| Accessibility | focus, semantics, labels, keyboard where applicable, contrast, reduced motion, touch targets, text scaling | Surviving acceptance requirement. Do not reopen unrelated components without a changed primitive/observed defect. |
| Wallet browser access model | normal non-Web3 browser = full-screen wallet-access gate; compatible wallet browser may explore public product before NEXI auth | Sep 12 owner requirement, implemented. Recheck only in real wallet-browser manual acceptance when available. |
| Explicit wallet provider choice | provider discovery separate from SIWE/auth; no silent first-injected fallback | Sep 12 owner requirement, implemented. Real provider/browser behavior remains part of owner wallet acceptance. |
| Notification center | `All`, `Trading`, `Wallet`, `Account`, `System`; truthful loading/empty/error/retry/read states | Sep 12 requirement, implemented against real backend types. Repair only if current production use exposes a defect. |
| Deposit UX | Deposit -> Select asset -> Deposit details; backend/Admin-configured asset/network/address/QR/instructions; amount/proof/submit preserved | Sep 12 requirement, implemented. Financial authority remains backend/D1; no frontend-owned config. |

## 6. Identity, account, security

| Requirement | Required path / invariant | Current treatment |
|---|---|---|
| Wallet-only SIWE | challenge -> exact signature verification -> replay prevention -> WalletIdentity -> AuthSession | Existing canonical path. Final real signature/session proof is manual owner gate. |
| One verified wallet = one NEXI account | wallet identity resolves one canonical user | Preserve. |
| Stable six-digit public NEXI ID | public `userCode`; internal D1 `User.id` opaque | Preserve. |
| Profile/KYC | submitted authoritative profile/KYC state -> Admin review/audit | Existing domain; do not rebuild. Targeted repair only on current failure evidence. |
| Referral | deterministic referral identity/attribution; self-referral prevention; one-time attribution; rewards lifecycle | Existing domain; preserve canonical D1/backend authority. |
| VIP | levels/thresholds/benefits/progress; Admin governed configuration/assignment/audit | Existing domain; preserve canonical authority. |
| Withdrawal PIN | separate sensitive-action step-up; set/change/reset; hash only; attempts/lockout | Surviving requirement from acceptance lineage. Not a login credential. |
| Session/security | access/refresh rotation, revoke/logout, security events, Admin governance | Existing canonical auth/security path. |

## 7. Markets and trading

| Domain | Surviving requirement | Current treatment |
|---|---|---|
| Market catalog | 53 canonical instruments; provider capability/mapping reflects callable truth | Market/Kline production proof current. Other provider capabilities remain truthful-by-capability; no catalog-membership assumption. |
| Quotes | real authoritative source/freshness/price/stats; bid/ask only if genuine | No synthetic healthy/fresh state. |
| Klines | exact required intervals `1m/5m/15m/30m/1h/4h/1d` | `PROVEN_PRODUCTION`. |
| Depth | show genuine L2 only | Never equate bid/ask with depth. |
| Trades | show genuine executed provider trades only | Never label ticks as trades. |
| Spot | order validation/reservation/lifecycle/fills/fees/ledger/outbox/realtime/history | Existing domain. Do not rebuild; targeted repair only if a current path fails. |
| Margin | isolated only; LONG/SHORT; exactly 2x/3x/5x; collateral/risk/interest/close/liquidation + ledger/Admin visibility | Existing domain. Cross/futures/perpetual/portfolio margin remain excluded. |
| Options/Binary | same Active Pair; backend-configured durations `30/60/180/240/480`; authoritative payout/countdown/settlement/refund/cancel/unavailable states | Existing domain. |
| Binary sandbox | overrides isolated, permissioned, audited, never silently affect normal users | Preserve governance isolation. |

## 8. Wallet and financial authority

Every consequential financial command must preserve authorization, validation, idempotency, atomic domain + ledger semantics, Activity/audit linkage, EventOutbox, and safe retry/recovery.

| Lifecycle | Required end-to-end authority | Current treatment |
|---|---|---|
| Wallet balances/history | subject-owned API -> canonical D1/Ledger -> Public/Admin | Existing. Never derive financial truth in UI. |
| Deposit | Admin/backend destination config -> Public intent/proof -> D1 claim -> review/credit -> ledger/activity/audit/outbox | Existing and Sep 12 UX repair implemented. Authenticated production action remains within owner wallet gate. |
| Withdrawal | asset/network/address/amount -> policy/PIN -> idempotency -> ledger reservation -> Admin review/settlement/release -> audit/outbox | Existing canonical path. |
| Internal transfer | public six-digit recipient -> server-side opaque user resolution -> ledger transfer -> receipt/activity | Existing canonical path. |
| Conversion | authoritative quote/expiry -> accept -> ledger conversion -> receipt/activity | Existing canonical path; UI must not invent quote. |
| Reconciliation | detect/inspect/recover mismatches and failed async delivery | Surviving production requirement. |

## 9. Earn / Mining and Loans

| Domain | Required lifecycle | Current treatment |
|---|---|---|
| Mining/Earn | plan -> subscribe/purchase -> ledger debit -> accrual -> settlement/completion -> history -> Admin control -> Workflow/outbox | Existing domain. Preserve; targeted repair only if current production use proves a defect. |
| Loans | plan -> eligibility/application -> approval/rejection -> disbursement -> repayment/overdue/default -> history -> Admin governance -> Workflow/outbox | Existing domain. Preserve; targeted repair only if current production use proves a defect. |

## 10. Communications, content, settings

| Domain | Required lifecycle | Current treatment |
|---|---|---|
| Support | persistent ticket root + replies/timeline + assignment/status/read state/closure + attachments where supported + realtime | Required product contract. Existing path; targeted repair only on current defect. |
| Messages | persistent conversations + sequence/delivery/read/moderation/reconnect | Required product contract. |
| Notifications | authoritative targeting/delivery/read state + truthful UI states | Required; Sep 12 category/state repair implemented. |
| Announcements | Admin create/edit/schedule/publish/unpublish/target/localize/pin/display -> Public consumption | Required product contract. |
| Learn | Admin category/content/revision/tag/media/publication/localization -> Public browse/detail | Required product contract. |
| Settings | profile/preferences/language/timezone/theme/notifications/security/wallet identity | Required product contract. |

## 11. Admin control plane

Admin is a governance/operations surface over canonical backend authority, never a second business implementation.

Required continuing coverage:

- Admin authentication, RBAC, protected routes, roles/permissions.
- User/Profile/KYC/Referral/VIP visibility and governed mutation.
- Wallet, balances, ledger, deposits, withdrawals, transfers/conversions, reconciliation.
- Asset/provider/mapping/capability/freshness administration.
- Spot/Margin/Binary operations and settlement/exposure visibility.
- Mining/Loan administration.
- Support/Messages/Notifications/Announcements/Learn administration.
- Feature flags, frontend control, maintenance, localization, health/readiness, audit/approvals/incidents.
- Consequential actions preserve actor/role/environment/target/reason/confirmation/audit/correlation/idempotency/approval semantics as appropriate.

Current final privileged action proof remains `MANUAL_OWNER_ACCEPTANCE_REQUIRED`; this does **not** authorize rebuilding Admin.

## 12. Async, realtime, recovery

| Requirement | Current treatment |
|---|---|
| EventOutbox is durable domain publication boundary | Preserve. Do not revive historical claims that a missing historical Queue edge is automatically a current defect. |
| Queue consumers are retry-safe where applicable | Preserve existing canonical consumers. |
| Workflows orchestrate long-running lifecycle without owning financial truth | Preserve. |
| Socket.IO/Valkey realtime | Production reconnect/resnapshot proven for market lane. Reuse unless relevant realtime code/config changes. |
| REST/read-back recovery | Production market recovery proven. Other domains use canonical durable read-back as applicable. |
| Duplicate/retry/concurrency safety | Required where consequential; inspect only the affected domain if a current failure exposes risk. |
| Exact missed-event replay as universal release gate | `SUPERSEDED`; must not silently return as a blocking requirement. |

## 13. Platform / operations

Current platform contracts remain:

- Worker routing/bindings/CORS/SIWE-domain policy.
- Container runs NestJS business authority.
- D1 durable state/migrations.
- Aiven Valkey realtime/cache/Streams.
- R2 for file/proof/archive uses where currently configured.
- Pipelines/Data Catalog for high-volume market/history/analytics where currently applicable.
- Queues/Workflows/KV/Analytics/Secrets/DO only where the current runtime/config requires them.
- Health/readiness/observability/audit/reconciliation/rollback evidence.

Do not rediscover/recreate infrastructure merely because an old document names an earlier topology or resource name.

## 14. Explicit superseded/non-blocking historical controllers

The following are **not active gates** and must not be allowed to restart the project:

- historical 27-row Code-to-Code matrix as final controller;
- `CODE_TO_CODE_CLOSED` as final completion definition;
- A25/A26/A27 unless new current-source regression proves one;
- staging as a mandatory next phase;
- “production unauthorized”;
- broad Graphify whole-repo rebuild before every change;
- exact missed-event replay as a universal release requirement;
- old PostgreSQL/Neon/Prisma authority;
- stale Stitch visual authority;
- stale `More` mobile navigation;
- old Git SHAs/worktrees/VM/Codespace handovers as present-state authority.

## 15. Final completion decision

### Already closed and reusable

- Source convergence: `PROVEN_PRODUCTION`.
- Production deployment: `PROVEN_PRODUCTION`.
- Production health/readiness: `PROVEN_PRODUCTION`.
- Required Klines: `PROVEN_PRODUCTION`.
- Market realtime reconnect/resnapshot: `PROVEN_PRODUCTION`.
- Market REST recovery: `PROVEN_PRODUCTION`.
- Bounded unauthenticated Public/Admin browser acceptance: `PROVEN_PRODUCTION`.
- Sep 12 frontend repair source/deployment: `PROVEN_UNCHANGED` unless a current manual observation contradicts it.

### Remaining final acceptance gates

1. **Authenticated wallet/SIWE/balance and protected financial interaction** — `MANUAL_OWNER_ACCEPTANCE_REQUIRED`.
2. **Privileged Admin RBAC/action** — `MANUAL_OWNER_ACCEPTANCE_REQUIRED`.

### Repair policy after this ledger

If the owner encounters a feature that **already exists but does not work**:

1. Record the exact current production symptom.
2. Trace only that path: UI/Admin -> client/provider -> route/event -> auth/RBAC -> DTO/controller -> service/domain -> D1/Ledger -> audit/activity -> EventOutbox/async -> realtime -> consumer/read-back.
3. Reuse every unchanged proven segment.
4. Repair the smallest dependency-closed causal seam.
5. Run focused deterministic validation and a bounded blast-radius check.
6. Update this ledger only for the affected requirement.

Do **not** reopen unrelated domains or restart broad acceptance.

## 16. Final current verdict

```text
SOURCE_CONVERGENCE = COMPLETE
PRODUCTION_DEPLOYMENT = COMPLETE
PRODUCTION_BROWSER_ACCEPTANCE = COMPLETE FOR BOUNDED AVAILABLE CONTEXT
MARKET_KLINES = PROVEN_PRODUCTION
REALTIME_RECONNECT_RESNAPSHOT = PROVEN_PRODUCTION
REST_RECOVERY = PROVEN_PRODUCTION

AUTHENTICATED_WALLET_SIWE_BALANCE = MANUAL_OWNER_ACCEPTANCE_REQUIRED
PRIVILEGED_ADMIN_RBAC_ACTIONS = MANUAL_OWNER_ACCEPTANCE_REQUIRED

FULL_PRODUCTION_END_TO_END_ACCEPTED = NO
```

The final `NO` is narrow. It does not mean NEXI must be rebuilt or that broad source/deployment/runtime work is incomplete. It means the two identity-dependent owner-context gates above have not yet been truthfully exercised with real authorized identities.

## 17. Source register used for this reconciliation

- `NEXI-FULL-PRODUCTION-ACCEPTANCE-SPEC-2026-08-30` — broad full-production requirement lineage.
- `NEXI_COMPLETE_PRODUCTION_ACCEPTANCE_GITHUB_CURRENT_2026-09-02` — later GitHub-current full-production reconciliation.
- `NEXI Frontend Manual Acceptance Findings — 2026-09-12` — newer owner-observed product requirements and bounded repairs.
- `NEXI_DEEP_LIQUID_VIOLET_FRONTEND_ACCEPTANCE_SPEC_V3` — Sep 13 Public frontend authority; explicitly supersedes V2.
- `NEXI Engineering Work Ledger — Single Session Authority` — Sep 14/15 current operational state and VM cleanup checkpoint.
- GitHub `Mellonelay/Nexi` current `main@3b173ea38da4c80193c5e0b552ae62fede22fab7`.

Older handovers, branch notes, recovery artifacts, matrices and historical execution plans may be deleted after confirming they carry no unique surviving requirement not represented here.
