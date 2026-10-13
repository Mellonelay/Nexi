# NEXI Public Frontend: Feature, Route and Integration Map

**Canonical source:** `cloudflare-container-bootstrap/dexi-frontend/` (Next.js App Router). **Only production Public build/runtime directory:** `/srv/nexi/public/current`. Never create competing release/build trees. Source and running artifact are different proof targets.

## Route catalog

| Route | User feature / backend dependencies |
|---|---|
| `/dashboard` | Quotes Hub: canonical market catalog, category navigation, price/change, custom icons, favorites, search and market selection |
| `/dashboard/asset/[symbol]` | Category-aware Asset Detail, metadata/provenance, real quotes, responsive chart, trade navigation |
| `/dashboard/spot` | Spot and Margin trading, chart, order controls, account-scoped balance, real order book and trades, order/position history |
| `/dashboard/binary` | Options USDT balance, configured durations, UP/DOWN, countdown, WIN/LOSS result, settlement and Activity |
| `/dashboard/wallet` | Overview, Funding, Spot, Margin, Options, Finance; deposit, withdraw, convert, transfers and comprehensive Activity |
| `/dashboard/mining` | Available plans, subscriptions, positions, accrual/claims and genuine status |
| `/dashboard/loans` | Eligibility, applications, repayment, obligations and activity |
| `/dashboard/settings` | Profile, Security, Notifications, About, KYC upload/status, VIP level at Profile and referral invitation/individual histories |
| `/dashboard/messages` | Conversations, read/reply/report, backend state and notification linkage |
| `/dashboard/announcement` | Published announcements and detail |
| `/dashboard/learn` | Published Learn content/category/search/article |
| `/dashboard/support` | Support tickets, history and Help Center |
| `/login`, `/signup` | Wallet-only SIWE connect/sign-in, secure session and wallet provider; no email/password-recovery system |

## Wallet page: explicit owner decisions

- Tabs **Overview / Funding / Spot / Margin / Options / Finance**; source identifier `BINARY` is presented as “Options.”
- **Each account:** one compact, mobile-friendly Available | Locked | Total summary; do not stack three oversized balance cards. Use accurate account and asset values, not fabricated ones.
- Overview: genuine consolidated portfolio valuation in USDT without double counting. Keep **53 market instruments distinct from supported depositable wallet assets**.
- Funding and Spot: applicable supported assets; Margin and Options: user-facing transferable **USDT only**. Finance: distinguish transferable cash, committed Mining funds and Loan obligations.
- Two transfer modes: between any eligible internal account pair and to another NEXI user. Transfer amount, asset, scope, status and both sides of account movement must resolve through backend authority.
- Deposit keeps its existing dedicated architecture, supported networks, real addresses and USDT-specific icon (not USD), QR, verification/claim/proof/status.
- Withdraw, zero-separate-fee Convert and all financial products must show genuine API responses, errors, results and chronological Ledger-backed Activity.
- Source entry: `app/dashboard/wallet/page.tsx`, `app/dashboard/wallet/components/TransferModal.tsx`; verify live backend contracts for actual capabilities.

## Market and chart design

53 identities: 17 crypto, 20 shares, 9 forex, 7 metals. Reuse custom NEXI asset icons. Order book and recent trades must use real authoritative data; never fabricate provider depth, fills or prices. Preserve chart timeframes and chart resizing. Remove redundant BTC/USDT labels beside interval controls where owner directed, remove leftover MA/EMA/BOLL/RSI/MACD/VOL bottom rail on all applicable trading/Asset Detail charts, maximize chart geometry and simplify Options trade bar wording. Binary controlled outcomes must be isolated from global market quotes and unrelated users.

## Visual interaction and acceptance

`DESIGN.md` and source components define Quiet Refraction: selective violet glass, clear dense financial panels, five-destination mobile dock, 320px+ reflow, short-height layout (e.g. 360×640/390×650), safe-area/visualViewport/keyboard, responsive charts, accessible focus/targets and readable contrast. Use existing Sonner feedback and backend-truthful persistent statuses, not a second toast framework.

**Final browser owner:** Polypane + Chrome DevTools with the existing Coinbase Wallet connection, after source closure and coordinated deployment. No obsolete MetaMask test-harness assumptions. Tests, HTTP 200 and build output do not prove rendered acceptance.

## Source / backend mapping

App route and state consumers live under `app/dashboard/`, `app/lib/`, `app/state/` and `app/hooks/`. Refer to [Backend catalog](../backend/README.md), [cross-surface map](../architecture/CROSS_SURFACE_FEATURE_MAP.md), [Admin controls](../admin/README.md), [Sentry operations](../operations/NEXI_SENTRY_OBSERVABILITY.md). Archived visual packs are historical reference only.

## Detailed trading and account journeys

Spot/Margin is the shared Public route /dashboard/spot, with Spot controls and isolated Margin LONG/SHORT at the configured 2x/3x/5x leverage choices. Options is /dashboard/binary and represents directional Binary trading, not staking. The 53 market identities are distinct from Wallet-supported depositable assets.

A user depositing BTC or ETH holds that asset in Funding until intentionally converted to actual USDT; USDT must then be transferred into Options before Options can use it. Every supported Wallet account shows one compact Available/Locked/Total strip with truthful native units; Overview alone aggregates estimated portfolio value in USDT. Transfer UI distinguishes movement between the same user's accounts from transfers to another NEXI user.

Preserve KYC upload/status, the VIP tier beside Profile, individual referral and reward histories, category-appropriate Asset Detail, actual depth/trades where supplied, truthful chart state and cohesive Activity reporting. Preserve custom NEXI icons and the already approved responsive Quiet Refraction design.
