# NEXI Stitch Visual Screen Catalog

**Status:** Core frontend visual pack ready for user review; application source unchanged.
**Date:** 2026-07-27
**Stitch project:** `14376424770817620136` — `NEXI Blackline Design System`
**Design system:** `assets/764d38ac72a94f75bff9cf16a54e1066` — `Deep Liquid Violet`
**Authority:** Current approved NEXI Dashboard direction plus the consolidated frontend/Stitch baton.

## Scope and stop point

This is a bounded visual-generation, same-project refinement, full-resolution inspection, and repository-export pass. It does not implement routes, components, localization, backend contracts, Admin controls, packages, dependencies, runtime configuration, or deployment. The pack stops after coherent Dashboard navigation states, Asset Detail, Spot, Options/Binary, and Wallet mobile/desktop concepts are ready for human visual review.

## Route and frame catalog

| Route / concept | Mobile frame / export | Desktop frame / export | Required anatomy and state boundary |
|---|---|---|---|
| `/dashboard` Quotes Hub | `cc45fc009f234ef0afecb1d1a98a093f` / `NEXI_DASHBOARD_MOBILE_APPROVED_TARGET.png` | `8a57269acdc04694ba2bee77149c4df0` / `NEXI_DASHBOARD_DESKTOP_APPROVED_TARGET.png` | Approved Dashboard composition, top-left menu, Favorites/Crypto/Metal/Forex/Shares, long scroll, five-slot mobile nav; desktop variant keeps persistent left navigation. |
| Dashboard drawer open | `fa320c9f2164439186f1fb793bad1764` / `NEXI_DASHBOARD_DRAWER_MOBILE_APPROVED_TARGET.png` | Desktop behavior remains persistent/collapsible sidebar | Drawer opens from left, dimmed backdrop, account summary, active route, required groups, Language, logout; unread badges are absent unless authoritative data exists. |
| Dashboard language state | `dd67172e6ddc43cc8aeb80f2e8b48b9d` / `NEXI_DASHBOARD_LANGUAGE_MOBILE_APPROVED_TARGET.png` | Desktop behavior uses same information architecture | Exactly English, 简体中文, 한국어, Русский, Español, Bahasa Melayu; symbols, pair identifiers, and financial notation stay unchanged. |
| `/dashboard/asset/[symbol]` Asset Detail | `cd3974a6dad2407790a0c838d691002a` / `NEXI_ASSET_DETAIL_MOBILE_APPROVED_TARGET.png` | `18cc8b593173433f9e2dfa1516e253b2` / `NEXI_ASSET_DETAIL_DESKTOP_APPROVED_TARGET.png` | Asset header, status/price/change placeholders, professional chart, timeframes/tools, Overview/Market Data/About, category-specific stats, Trade Spot and Trade Options. |
| `/dashboard/spot` Spot | `41c6f315be394402820a77f79f7e4f42` / `NEXI_SPOT_MOBILE_APPROVED_TARGET.png` | `05a4ce341a2743e581ba486ccb3cc172` / `NEXI_SPOT_DESKTOP_APPROVED_TARGET.png` | Shared selected instrument, chart, timeframes, order book/trades, Buy/Sell, Market/Limit/Stop Limit, safe balances/fees/order values. No leverage, margin, futures, perps, liquidation, or funding. |
| `/dashboard/binary` Options/Binary | `60e820e2596a43c8926d39d84d74265e` / `NEXI_BINARY_MOBILE_APPROVED_TARGET.png` | `982cab685dd44b1dabe5dea038186e4a` / `NEXI_BINARY_DESKTOP_APPROVED_TARGET.png` | Shared instrument, chart, Long/Short, 30/60/180/240/480 seconds, stake/payout/return placeholders, lifecycle states. Long maps to backend UP and Short to DOWN; no Call/Put or TP/SL. |
| `/dashboard/wallet` Wallet | `72b280d619e0457eb48ac8df65cd54d2` / `NEXI_WALLET_MOBILE_APPROVED_TARGET.png` | `336ca6441fd44a98b786be6ebb7333e5` / `NEXI_WALLET_DESKTOP_APPROVED_TARGET.png` | Asset center, portfolio safe states, Deposit/Withdraw/Transfer/Convert, Overview/Spot/Option/Funding/Financial, asset detail/network/address/QR/activity states. No invented balances, APR, yield, or portfolio values. |

## Visual contract

- Deep Liquid Violet remains the locked style anchor: near-black violet canvas, layered dark-violet surfaces, restrained violet edge light, white primary type, muted lavender secondary type, and cyan only for financial signal lines.
- Mobile bottom destinations are exactly Dashboard, Spot, Options, Wallet, Earn. `More` is not part of the design.
- The application menu is left-only. Mobile uses a drawer; desktop uses the same information architecture as a persistent or collapsible left sidebar.
- The Dashboard is a scrollable market-discovery surface. Rows are tappable and lead to Asset Detail, not directly to a generic ticket.
- All market facts are backend-authoritative. The visual pack uses `—`, `—.—%`, `—.—M`, and `DATA UNAVAILABLE` where current data is not supplied. Screenshots do not establish live data, freshness, or capability.
- Adaptive targets are 320/360/390/430 mobile widths plus tablet and desktop; preserve readable type, natural vertical flow, safe-area padding, no horizontal overflow, fixed mobile navigation, and content clearance above fixed navigation.

## Backend/Admin and implementation handoff

The future implementation must preserve the shared ActiveInstrument contract: canonical symbol, display symbol, base/quote, category, metadata, chart symbol, Spot/Binary capability, and live/stale/unavailable/disabled state. Backend/Admin remain authorities for asset catalog, metadata, visibility, market capability, localization content, unread counts, balances, orders, and lifecycle states. These Stitch concepts do not authorize source implementation.

## Evidence boundaries and unresolved items

- Screens were generated/refined in the existing Stitch project and inspected as full-resolution screenshot artifacts. Export checksums are recorded in `docs/design/reference/README.md`.
- Pathfinder returned a valid `agent-report-v1` with direct source evidence. The Risk Reviewer child disconnected before returning a valid report; it is incomplete and must not be represented as independent approval.
- Binance public Spot structure was used read-only as a reference for symbol/rule/order-book/candlestick anatomy; its live values were not placed in the visual artifacts. TickerSage K-line reference was unavailable because its MCP call timed out, so no TickerSage-derived claim is made.
- No browser/runtime verification was performed. No whole-scope semantic reading claim is made; this is a bounded visual and structural/configuration pass.
- Human visual review remains the approval gate before frontend source implementation.
