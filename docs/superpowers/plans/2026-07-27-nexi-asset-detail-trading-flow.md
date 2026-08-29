# NEXI Asset Detail and Chart-First Trading Flow

**Status:** Planning baton ready; implementation and Stitch mutation are gated.
**Date:** 2026-07-27
**Scope:** Public frontend planning only; includes navigation/localization, Asset Detail, Spot, Binary, and Wallet visual/interaction boundaries.
**Style authority:** `docs/design/NEXI_DESIGN_DEEP_LIQUID_VIOLET.md` and the approved current Stitch Dashboard direction.
**Product authority:** `docs/NEXI_FINAL_PRODUCT_PROGRAM_CHARTER.md`.
**Related foundation plan:** `docs/implementation/NEXI_FILE_BY_FILE_EXECUTION_PLAN.md`.

## Objective

Make the locked public discovery-to-execution chain explicit without replacing the existing application:

`Quotes Hub → Asset Detail → Spot → Options/Binary`

The work packet covers navigation/localization concepts, Asset Detail page design, Spot visual refinement, Binary visual refinement, and Wallet asset-center refinement. It does not move source, add packages, change manifests or lockfiles, mutate production, deploy, or regenerate the approved Dashboard implementation.

## Direct source baseline

The current public app is `cloudflare-container-bootstrap/dexi-frontend`.

| Current path | Evidence relevant to this baton | Planning consequence |
|---|---|---|
| `app/dashboard/page.tsx` | Rows already call `setActivePair` and route to `/dashboard/spot?symbol=...`. | Preserve row tap behavior but change the destination to `/dashboard/asset/[symbol]`. |
| `app/state/ActivePairProvider.tsx` | Shared normalized string state defaults to `BTCUSDT`; no catalog metadata or capability model. | Extend compatibly to a catalog-resolved Active Instrument. |
| `app/providers.tsx` | Provider wraps the app inside the query provider. | Keep shared instrument state at the existing application boundary. |
| `app/hooks/useMarketData.ts` | `MarketPair` is frontend-shaped and fallback categories are incomplete; values include numeric fields. | Add a typed adapter to the backend market contract and explicit nullable/data-state handling. |
| `app/components/TradingChart.tsx` | Existing lightweight-charts candlestick/volume primitive is reused by Spot and Binary; non-crypto uses generated mock OHLC. | Reuse the primitive’s role but replace production mock/direct-provider behavior with a backend-authoritative series adapter before runtime claims. |
| `app/components/TimeframeSelector.tsx` | Existing timeframe control can be visually refined. | Separate chart timeframes from Binary expiry durations; do not reuse one semantic type. |
| `app/dashboard/spot/page.tsx` | Existing chart, SymbolSelector, OrderBook, SpotTradeForm, query-symbol fallback, and hardcoded BTC labels. | Refine visual hierarchy and consume shared instrument metadata; remove hardcoded asset copy. |
| `app/dashboard/spot/components/OrderBook.tsx` | Existing execution subcomponent. | Keep as a candidate reusable execution surface; no redesign of order semantics in this packet. |
| `app/dashboard/spot/components/SpotTradeForm.tsx` | Existing Buy/Sell execution form. | Keep behavior boundary; restyle/refine after the chart-first shell is approved. |
| `app/dashboard/binary/page.tsx` | Existing chart, pair selector, timeframe controls, WebSocket wiring, and binary panel; current visual shell is older and `h-screen`/overflow constrained. | Refine chart-led hierarchy and safe scrolling while preserving binary controls and shared pair. |
| `app/components/SymbolSelector.tsx` | Existing market-category selector and list. | Reuse/refine against the authoritative catalog; do not let it create a second pair state. |
| `app/dashboard/layout.tsx` | Shared scroll shell already provides bottom padding and renders `BottomNav`. | Extend safe-area/content-bottom treatment for the detail and trading flow. |
| `app/components/BottomNav.tsx` | Existing mobile shell uses older labels/routes and a Trade modal. | Refine toward the approved Dashboard/Spot/Options/Wallet/More navigation without adding a primary route. |
| `app/components/Sidebar.tsx` | Existing desktop static sidebar has older styling, incomplete grouping, and no Language item or account summary. | Refactor target is the shared left drawer/sidebar information architecture; preserve route authority and add responsive drawer behavior. |
| `app/dashboard/wallet/page.tsx` | Existing wallet primary route. | Keep as the asset-center ownership boundary; replace balance-card emphasis with portfolio, actions, assets, per-asset detail, and history planning. |
| `app/dashboard/wallet/components/WalletHeader.tsx` | Existing wallet header. | Refine for total/available/locked portfolio summary and quick actions. |
| `app/dashboard/wallet/components/AssetList.tsx` | Existing asset-list component. | Extend toward backend-authorized many-asset rows and per-asset detail entry. |
| `app/dashboard/wallet/components/DepositModal.tsx`, `WithdrawModal.tsx`, `TransferModal.tsx` | Existing wallet action boundaries. | Preserve components; make network, address, limits, fees, and capability states backend/Admin-driven. |
| `app/dashboard/wallet/components/ConvertModal.tsx` | Existing conversion boundary. | Keep as a Wallet subflow; do not let conversion become a new primary route. |
| `app/dashboard/settings/page.tsx` | Existing settings page contains a Language control but no proven global locale provider. | Reuse as a locale-selection entry point backed by shared locale state and profile/local persistence gates. |
| `backend/src/contracts/market.contract.ts` | `MarketQuoteDto` is the strongest current market contract: assetId, category, symbol, displayName, pair, nullable quote fields, status, dataState, updatedAt. | Frontend view models must adapt from this contract rather than inventing a new live-data authority. |
| `backend/src/contracts/binary.contract.ts` | Binary contract defines quote/state/request concepts; the current controller does not yet prove the full position flow. | Binary visual work must remain explicit about unavailable/configuration states and backend dependency. |

Codebase Memory Pro was requested for exact traces but returned `project not found or not indexed`; no indexing was started because repository rules prohibit automatic indexing. Claims in this packet are therefore bounded direct-source/document claims.

## Architecture decision

### Recommended: dedicated child route plus shared Active Instrument

Add `app/dashboard/asset/[symbol]/page.tsx` as a non-primary child route. `/dashboard` remains the Quotes Hub. The route resolves the symbol through one normalization/validation function, hydrates the shared Active Instrument, and offers explicit actions to `/dashboard/spot?symbol=...` and `/dashboard/binary?symbol=...`. Spot and Binary keep their existing routes and execution boundaries.

### Alternatives considered

1. A Dashboard modal/drawer would reduce routing work but weakens deep links, browser history, refresh recovery, and handoff evidence.
2. A pre-trade state inside `/dashboard/spot` would avoid a route but conflates discovery, market context, and execution and does not satisfy the dedicated Asset Detail requirement.

The dedicated child route is the smallest change that satisfies the locked decision while preserving the existing three-surface architecture and 11 primary destinations.

## Target route and component map

### New route

| Target path | Ownership | Required behavior |
|---|---|---|
| `cloudflare-container-bootstrap/dexi-frontend/app/dashboard/asset/[symbol]/page.tsx` | Public frontend | Resolve symbol, load detail view model, establish shared Active Instrument, render Asset Header, chart, timeframes, stats, About, capability-aware actions, and all data states. |

### New or refactored components

| Target path | Action | Responsibility |
|---|---|---|
| `app/components/market/AssetHeader.tsx` | Add | Identity, category, capability/status badges, price, 24h change, back affordance. |
| `app/components/market/MarketChartPanel.tsx` | Add | Chart surface, timeframe controls, loading/stale/unavailable states, and chart-first composition. |
| `app/components/market/MarketStatsGrid.tsx` | Add | Stable detail stats with nullable values and readable financial typography. |
| `app/components/market/AssetAboutSection.tsx` | Add | Crypto blockchain/project facts; Metal, Forex, and Shares category-specific facts. |
| `app/components/market/TradeDestinationActions.tsx` | Add | Capability-aware Spot and Options/Binary actions using the active instrument. |
| `app/components/TradingChart.tsx` | Modify | Keep the existing chart primitive role; accept a backend-authoritative series adapter and Deep Liquid Violet visual tokens; remove production dependence on random/mock OHLC and direct provider calls. |
| `app/components/TimeframeSelector.tsx` | Modify | Use an explicit chart-timeframe type and preserve touch-safe, responsive controls. Binary expiry durations remain a separate contract. |
| `app/components/market/QuoteRow.tsx` | Add/refactor | Shared tappable row anatomy for long category lists, stable numeric columns, official identity, and accessible activation. |
| `app/state/ActivePairProvider.tsx` | Modify | Preserve `useActivePair` compatibility while adding `activeInstrument`, `setActiveInstrument`, safe resolver, and clear/recovery behavior. |
| `app/hooks/useMarketData.ts` | Modify | Adapt `MarketQuoteDto` into catalog/detail models; represent nullable numeric values and data state without fabricated prices. |
| `app/dashboard/page.tsx` | Modify | Route row selection to Asset Detail and support many-item scrollable categories. |
| `app/dashboard/spot/page.tsx` | Modify | Consume shared instrument, remove hardcoded BTC copy, refine chart-first visual hierarchy, and preserve execution components. |
| `app/dashboard/binary/page.tsx` | Modify | Consume shared instrument, refine chart-led layout, separate chart timeframes from expiry durations, and preserve explicit unavailable states. |
| `app/dashboard/layout.tsx` | Modify | Maintain vertical scroll and content-bottom safe-area padding above fixed navigation. |
| `app/components/BottomNav.tsx` | Modify | Align labels/routes with approved Dashboard/Spot/Options/Wallet/More shell; do not add a Detail primary item. |

## Shared state and adapter contract

The implementation target is:

```ts
type MarketCategory = 'CRYPTO' | 'METAL' | 'FOREX' | 'SHARES';

type PairCapability = {
  canViewChart: boolean;
  canSpot: boolean;
  canBinary: boolean;
};

type ActiveInstrument = {
  assetId: string;
  pair: string;
  normalizedPair: string;
  symbol: string;
  displayName: string;
  category: MarketCategory;
  capabilities: PairCapability;
};
```

The frontend detail adapter adds nullable `currentPrice`, `change24h`, `volume24h`, `updatedAt`, `state`, `stats`, `about`, and supported chart timeframes. It maps from `MarketQuoteDto` and the approved detail contract once the backend endpoint is verified. The final endpoint URL is a backend contract gate, not something to invent in the frontend plan.

State ownership is explicit:

- Server/query state: asset catalog, quote, chart series, capabilities, detail metadata, balances, orders, binary configuration.
- Shared product state: the catalog-resolved Active Instrument in `ActivePairProvider`.
- URL state: normalized symbol only, used for deep-link/refresh recovery.
- Local UI state: tabs, chart timeframe, drawers, form drafts, and responsive presentation.
- Backend/Admin authority: visibility, metadata, category, capabilities, quote status, payout/duration configuration, and execution availability.

Binary UI direction is explicit: `LONG` renders as `Long` and maps to backend `UP` (price ends higher at expiry); `SHORT` renders as `Short` and maps to backend `DOWN` (price ends lower at expiry). Spot TP/SL is progressive disclosure; Binary does not inherit it. Wallet does not own the active market pair and uses authenticated wallet state.

## Exact Stitch request for the next visual gate

Use the existing approved Deep Liquid Violet Dashboard frame as the immutable style anchor. Do not generate another Dashboard alternative and do not replace its typography, palette, component system, row anatomy, Active Pair card, category tabs, or bottom navigation.

First update that approved Dashboard direction with the navigation concepts only:

- top-left hamburger/menu control;
- left-side drawer open state at mobile and tablet widths, plus persistent/collapsible desktop sidebar;
- primary, communication/content, and account/system groups exactly as specified;
- account/profile summary, active-route indication, authoritative unread badges, and logout at the bottom;
- language-selection state with exactly English, 简体中文, 한국어, Русский, Español, and Bahasa Melayu;
- mobile bottom navigation changed to Dashboard, Spot, Options, Wallet, and Earn, with no More tab;
- dimmed backdrop, scroll lock, safe areas, focus treatment, and route-close behavior.

Generate one responsive Asset Detail design for `/dashboard/asset/[symbol]`, then refine the existing Spot and Binary frames using the same selected asset, followed by one Wallet asset-center frame. The Asset Detail screen must show:

- a spacious NEXI header/back affordance and asset identity;
- current price and 24h change with `—`, `—.— %`, and `—.—M` placeholders when unavailable;
- a professional TradingView-style chart-feel surface with readable timeframe controls;
- detail stats and explicit LIVE/STALE/UNAVAILABLE/DISABLED/ERROR treatments;
- an About section with blockchain/project content only for Crypto and category-appropriate content for Metal, Forex, and Shares;
- capability-aware actions for Spot and Options/Binary;
- vertical scroll, fixed bottom navigation, safe-area spacing, 320/360/390/430px behavior, and no horizontal overflow.

For Spot, keep the selected asset and refine the chart-first hierarchy around the existing order book and trade form. Include Market/Limit/Stop Limit, amount/price, percentage slider, fee preview, open orders/history, indicators, chart expansion, and progressive TP/SL without leverage or futures-only controls. For Binary, keep the selected asset and refine the chart-led hierarchy around duration, payout, stake, potential return, `Long`/`Short`, countdown, active positions, and settled history; do not use `Call`/`Put` in the UI. For Wallet, use an asset-center hierarchy: portfolio summary, Deposit/Withdraw/Transfer/History, asset list, per-asset detail, networks, address/QR, and transaction history. Use no invented prices, payouts, balances, network data, or chart data. This is a visual artifact request only; no application source, package, credential, backend, or production mutation is authorized.

## Ordered work packet

### Packet E — Navigation and localization visual gate

1. Update the approved Dashboard frame with the top-left menu control and left drawer; keep the Quotes Hub composition, market rows, Active Pair card, and Deep Liquid Violet visual system unchanged.
2. Generate mobile drawer-open, language-selection, revised-bottom-navigation, tablet-drawer, and desktop-sidebar variants.
3. Review left origin, drawer width, backdrop, scroll lock, close gestures, safe areas, active route, account summary, unread badges, logout placement, focus treatment, and reduced motion.
4. Confirm the five persistent mobile destinations are Dashboard, Spot, Options, Wallet, and Earn; confirm no More tab and no right-side application menu.
5. Confirm all six locale labels and that symbols, pairs, and financial notation remain visually stable across the language state.
6. Store the visual review result as a gate before any application source change.

### Packet A — Asset Detail design

1. Inspect the approved Deep Liquid Violet Dashboard frame and current route authority.
2. Generate the Asset Detail screen at the responsive widths above, with one representative Crypto state and documented state variants.
3. Review header hierarchy, chart legibility, stats density, category-specific About treatment, action affordances, fixed navigation, scroll, safe areas, keyboard/focus behavior, and no horizontal overflow.
4. Reject and iterate only the same Asset Detail frame if those requirements fail; do not create a replacement Dashboard direction.
5. Store the visual artifact reference and review result as design evidence before implementation approval.

### Packet B — Spot visual refinement

1. Reuse the approved Asset Detail selected instrument and existing Spot execution anatomy.
2. Refine chart-first composition, price/header hierarchy, order book readability, and Buy/Sell form grouping in Deep Liquid Violet.
3. Preserve execution semantics and show disabled/unavailable states for unsupported capabilities or missing backend data.
4. Verify responsive scroll and safe-area behavior without hiding order controls behind fixed navigation.

### Packet C — Binary visual refinement

1. Reuse the same selected instrument and approved visual tokens.
2. Refine chart-led composition and keep chart timeframe controls distinct from Admin-controlled expiry durations.
3. Preserve payout, stake, `Long`/`Short`, countdown, positions, history, and settlement state surfaces without inventing values. Long means higher at expiry; Short means lower at expiry.
4. Verify configuration-unavailable, disconnected, waiting-for-market, expired, and settlement-pending treatments.

### Packet D — Wallet asset-center refinement

1. Keep the existing Wallet route and components as the structural starting point.
2. Refine portfolio summary into total, available, and locked/in-orders balances with clear Deposit, Withdraw, Transfer, and History actions.
3. Refine the asset list for many backend-authorized assets and add a clear per-asset detail entry.
4. Design network/address/QR, withdrawal, internal transfer, and transaction-history states without inventing values; keep Spot/Funding/Earn/Loan as later capability-controlled subflows.
5. Verify mobile scrolling, safe-area behavior, focus order, unavailable networks, disabled actions, and no horizontal overflow.

## Implementation gate after Stitch approval

No source implementation begins until the navigation/localization visual gate and the four product visual artifacts are approved, and the backend contract gate identifies the catalog/detail/chart-series/capability/wallet/locale payloads. The implementation order is:

1. Add typed locale resolver/provider and shell navigation state without changing market state ownership.
2. Add typed adapter and shared Active Instrument compatibility layer.
3. Add Asset Detail route and shared market components.
4. Change Quotes Hub row routing and long-list behavior.
5. Refine Spot and Binary against the approved artifacts.
6. Refine Wallet against the approved asset-center artifact.
7. Replace production mock/direct-provider chart paths with backend-authoritative data handling.
8. Run unit/contract/browser/accessibility/visual verification and independent review.

## Acceptance and evidence

- Direct source evidence confirms row, provider, market hook, chart, Spot, Binary, layout, and navigation ownership.
- Type-level tests cover pair normalization, catalog rejection, capability gating, category-specific About rendering, and null numeric fields.
- Browser tests cover row tap, Asset Detail, Spot handoff, Binary handoff, shared-pair continuity, refresh/deep link, long lists, scroll, fixed navigation, 320/360/390/430px widths, and no horizontal overflow.
- Navigation/localization tests cover five-item mobile navigation, left drawer open/close, backdrop/Escape/swipe/route close, focus trap, `aria-expanded`/`aria-controls`, scroll lock, reduced motion, desktop sidebar parity, all six locales, pre-auth local persistence, authenticated profile persistence, translated validation/system states, and stable symbols/pairs/financial notation.
- Visual review confirms Deep Liquid Violet continuity and no regenerated Dashboard alternative.
- Runtime claims remain separate from plan/design evidence until API, browser, and deployment checks are executed.

## Rollback

This packet has no application rollback because it changes planning documents only. At implementation time, retain the existing Dashboard direct-to-Spot route, ActivePairProvider string API, TradingChart consumers, and Spot/Binary routes until the new child route and shared instrument pass the full verification gates. Do not remove compatibility behavior in the same change as the first route introduction.
