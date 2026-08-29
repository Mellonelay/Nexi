# NEXI Frontend Route Specifications

**Status:** Required production-engineering authority.  
**Date:** 2026-07-27  
**Canonical product authority:** `docs/NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md`  
**Current-state evidence:** `work/NEXI_CURRENT_STATE_CLASSIFICATION.md`  
**Visual authority:** `DESIGN.md`, `.stitch/DESIGN.md`, and `docs/design/NEXI_DESIGN_DEEP_LIQUID_VIOLET.md`

This document extends the completed charter and Phase 1 classification. It does not replace them, restart discovery, or claim implementation completion.

## `/dashboard` — Quotes Hub
Five fixed tabs; search and favorites; Asset/Price/24h Change columns; backend-authorized catalog; explicit LIVE/STALE/UNAVAILABLE/DISABLED states; scrollable category lists; selecting an asset updates shared Active Asset/Pair and opens the dedicated Asset Detail child route.

## `/dashboard/asset/[symbol]` — Asset Detail child route
This is a non-primary child route and does not add a public navigation destination. It resolves the URL symbol through the backend-authorized catalog and shared normalization function, presents asset identity/category/capabilities, current price and 24h change, a professional chart, timeframe controls, detail stats, a category-appropriate About section, and explicit Spot/Margin and Options handoffs. Crypto About content may describe the blockchain/project; Metal, Forex, and Shares use category-specific facts and never receive blockchain copy. LIVE/STALE/UNAVAILABLE/DISABLED/ERROR states remain visible and numeric placeholders are safe values only.

## `/dashboard/spot`
Receives the validated shared asset from Asset Detail or a validated URL fallback. It is the single Spot/Margin page. Use a professional exchange-style chart-first layout. Spot includes pair selector, chart, order book/trades views, Buy/Sell, Market/Limit/Stop Limit, balances, fees, open orders and history. The same page exposes isolated Margin with LONG/SHORT and exactly 2x/3x/5x; cross margin, futures, perpetuals, portfolio margin, C2C, and copy trading remain excluded.

## `/dashboard/binary`
Receives the same validated shared asset as Spot and uses a chart-led layout. Preserve canonical pair, Admin-controlled duration chips, authoritative payout, stake, potential-return preview, `Long`/`Short`, countdown, active positions, settled history, settlement and configuration-unavailable behavior. `Long` means price ends higher at expiry; `Short` means price ends lower at expiry. The page must not silently fall back to an unrelated pair and must not inherit Spot TP/SL semantics.

## `/dashboard/wallet`
Exchange-style asset center: portfolio summary with total/available/locked or in-orders balances; Deposit, Withdraw, Transfer, and History; many-asset list; per-asset detail with balance, supported networks, deposit address/QR, withdrawal form, internal transfer, and transaction history. Spot, Funding, Earn, and Loan sections remain capability- and backend/Admin-controlled subflows. Use the existing wallet route/components as the starting ownership boundary; do not replace it with a trading-screen clone.

## `/dashboard/mining` and `/dashboard/loans`
Backend products, eligibility, terms, actions, positions/applications, rewards/repayment, history, paused/error states, and no invented yield or cost.

## `/dashboard/support` and `/dashboard/messages`
Persistent tickets/conversations, categories, status, assignment visibility, attachments, unread/delivery/read state, and no simulated bot or local auto-reply.

## `/dashboard/announcement` and `/dashboard/learn`
Backend-managed content, detail routes, scheduling/publication/read state, courses/lessons/progress/bookmarks, and no hardcoded historical content or fake achievement data.

## `/dashboard/settings`
Profile, password, 2FA, sessions, KYC with real upload contract, notifications, language, chart/trading preferences, privacy/security events, and logout.

## Application shell navigation contract
Mobile bottom navigation has exactly Dashboard (`/dashboard`), Spot/Margin (`/dashboard/spot`), Options (`/dashboard/binary`), Wallet (`/dashboard/wallet`), and Earn (`/dashboard/mining`); Dashboard remains the Quotes Hub. The top-left menu opens a left-side drawer with these exact groups:

- Primary: Dashboard, Spot/Margin, Options, Wallet, Earn / Mining, Loan.
- Communication and Content: Messages, Announcements, Learn, Support.
- Account and System: Settings, Language.

The drawer also contains account/profile summary, active-route indication, authoritative unread badges, and logout at the bottom. It is not a right-side panel and does not add Vaults, Staking, Referrals, Leaderboard, Testnet, Explorer, API, Builder Codes, Points, Funding Comparison, or perpetual/leverage-specific routes. Desktop uses a persistent or collapsible left sidebar with the same groups. Drawer route selection closes the drawer and preserves the active-route indication.

## Localization contract
Supported locales are exactly `en`, `zh-CN`, `ko`, `ru`, `es`, and `ms`, displayed as English, 简体中文, 한국어, Русский, Español, and Bahasa Melayu. Locale state applies to the entire public application, persists to the authenticated profile, uses local persistence before authentication, and preserves symbols, pair identifiers, and financial notation. Translation catalogs must support future backend-managed content without making backend content appear translated when no authoritative translation exists.

## Route contract
Conversion is a Wallet subflow, not a twelfth primary route. Admin is never a public route in the final architecture.

## Flow contract
`/dashboard` is discovery, `/dashboard/asset/[symbol]` is market context, `/dashboard/spot` is Spot/Margin execution, `/dashboard/binary` is Options execution, and `/dashboard/wallet` is the asset center. The child route shares the canonical Active Asset/Pair with Spot/Margin and Options; backend/Admin remain authoritative for catalog visibility, metadata, market status, capabilities, balances, networks, payouts, and durations.

## Evidence and completion rule
Keep `specified → implemented → statically validated → tested → integrated → runtime verified → browser verified → security reviewed → independently reviewed → approved complete` distinct. File presence, plans, generated graphs, and passing static checks alone are not completion.
