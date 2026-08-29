# NEXI Public Frontend Program

**Status:** Required production-engineering authority.  
**Date:** 2026-07-27  
**Canonical product authority:** `docs/NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md`  
**Current-state evidence:** `work/NEXI_CURRENT_STATE_CLASSIFICATION.md`  
**Visual authority:** `DESIGN.md`, `.stitch/DESIGN.md`, and `docs/design/NEXI_DESIGN_DEEP_LIQUID_VIOLET.md`

This document extends the completed charter and Phase 1 classification. It does not replace them, restart discovery, or claim implementation completion.

## Mission
Complete the existing public application without greenfield replacement. The
route contract is exactly Dashboard, Spot/Margin, Options, Wallet, Earn/Mining,
Loan, Support, Announcement, Learn, Messages, and Settings. Spot and isolated
Margin share the `/dashboard/spot` page; Options is the separate
`/dashboard/binary` compatibility route.

## Phase F0 — Shared foundation
Implement Deep Liquid Violet tokens, shell, desktop/collapsible left navigation, mobile Dashboard/Spot/Options/Wallet/Earn navigation, left-side drawer behavior, safe areas, typed API/query state, authentication/session presentation, feature capabilities, Active Asset/Pair, application-wide locale state, reusable chart/table/form/modal/status primitives, and loading/stale/unavailable/disabled/error/maintenance states. The public locale set is exactly English, 简体中文, 한국어, Русский, Español, and Bahasa Melayu.

### Locked application navigation and localization
Mobile has exactly five persistent destinations: Dashboard (Quotes Hub),
Spot/Margin, Options, Wallet, and Earn. The existing More/Trade replacement is
not a sixth destination. The drawer groups Dashboard, Spot/Margin, Options,
Wallet, Earn/Mining, Loan; Messages, Announcements, Learn, Support; and
Settings, Language, with account summary, active-route indication, authoritative
unread badges, and bottom logout. Desktop uses a persistent or collapsible left
sidebar with the same information architecture.

Locale selection applies across navigation, forms, validation, system states, and content. It persists to the authenticated profile and uses local persistence before authentication. Asset symbols, pair identifiers, and financial notation remain stable. Backend-managed translated content remains a future contract-controlled capability.

## Phase F1 — Dashboard / Quotes Hub
Exactly Favorites, Crypto, Metal, Forex, and Shares. Provide search, real favorites, backend asset catalog, official identities, price provenance, compact rows, many-item scrollable category lists, and selection into the shared Active Asset/Pair. Every row is a discovery action into the dedicated child route `/dashboard/asset/[symbol]`; it must not jump directly into execution. The Quotes Hub remains the `/dashboard` primary destination and must not become a twelfth navigation item.

### Locked interaction chain
`Quotes Hub → Asset Detail → Spot/Margin → Options`

Asset Detail is a route-level market context screen, not a modal-only list expansion. It owns the selected asset’s readable market summary, chart-first inspection, timeframe controls, category-appropriate metadata, and explicit execution handoffs. Spot and Options/Binary reuse the same validated Active Asset/Pair; they do not create independent pair state.

### Asset Detail design gate
The next Stitch artifact is one responsive Asset Detail screen using the approved Deep Liquid Violet Dashboard direction as its visual anchor. It must include the asset header, current price/24h change with safe data states, professional chart, timeframes, stats, category-specific About content, and Spot/Options/Binary actions. Stitch must then refine the existing Spot and Binary frames using the same selected asset and create the Wallet asset-center frame using the separate wallet structure. This is a visual design gate; it does not authorize source implementation or live Stitch mutation.

## Phase F2 — Spot/Margin
Shared pair received from Asset Detail, professional chart-first hierarchy,
Spot order execution, and an isolated Margin workspace on the same page.
Margin supports LONG/SHORT and exactly 2x/3x/5x; cross margin, futures,
perpetuals, portfolio margin, C2C, and copy trading remain out of scope.
Preserve the approved Deep Liquid Violet system while removing hardcoded asset
copy and fabricated chart data from the production path.

## Phase F3 — Options (Binary/Microtrade)
Shared pair received from Asset Detail, professional chart-led layout, backend/Admin-controlled duration chips, payout by pair/duration, stake, potential-return preview, `Long` and `Short` actions, active positions, settled history, countdown, settlement/draw/refund states, and explicit sandbox labeling. UI semantics are `Long = price ends higher at expiry` and `Short = price ends lower at expiry`; the adapter must map those labels to the backend direction contract without changing core logic. TP/SL is not a Binary control. The visual pass must keep Binary-specific controls legible without forcing the full page into one viewport.

## Phase F4 — Wallet / Asset Center
Build a proper exchange-style wallet center using an asset-center structure rather than a trading-screen structure: portfolio summary with total, available, and locked/in-orders balances; Deposit, Withdraw, Transfer, and History quick actions; many-asset list; per-asset detail with balance, networks, deposit address/QR, withdrawal, internal transfer, and transaction history. Spot, Funding, Earn, and Loan are later product tabs/subflows where backend/Admin authority exists. Preserve Deep Liquid Violet and do not copy unrelated exchange branding.

## Remaining phases F5–F10
F5 Earn/Mining; F6 Loans; F7 Support/Messages; F8 Announcement/Learn; F9 Settings/account; F10 accessibility, responsive, performance, PWA/degraded mode, browser and visual-regression hardening.

## Every frontend phase must define
User outcome, route/component anatomy, interactions, state model, backend dependencies, Admin-controlled values, responsive/accessibility behavior, integrity risks, positive/negative acceptance tests, browser evidence, and rollback.

## Evidence and completion rule
Keep `specified → implemented → statically validated → tested → integrated → runtime verified → browser verified → security reviewed → independently reviewed → approved complete` distinct. File presence, plans, generated graphs, and passing static checks alone are not completion.
